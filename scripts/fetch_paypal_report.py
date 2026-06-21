"""Pull transactions from the PayPal Transaction Search API and write them to
a CSV that scripts/display_report.py can read.

Setup:
    Set PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET (the REST app's secret from
    the PayPal Developer Dashboard - not the NEXT_PUBLIC_PAYPAL_CLIENT_ID used
    by the checkout buttons) as env vars, or put them in a .env file:

        PAYPAL_CLIENT_ID=...
        PAYPAL_CLIENT_SECRET=...

Usage:
    python3 scripts/fetch_paypal_report.py 2026-05-01 2026-06-21
    python3 scripts/fetch_paypal_report.py 2026-05-01 2026-06-21 -o reports/june.csv --sandbox
"""

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from base64 import b64encode
from datetime import datetime, timedelta, timezone

SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
LIVE_BASE = "https://api-m.paypal.com"
PAGE_SIZE = 500
MAX_RANGE_DAYS = 31  # PayPal Transaction Search rejects windows longer than this

HEADER = [
    "Date", "Time", "TimeZone", "Name", "Type", "Status", "Currency",
    "Gross", "Fee", "Net", "Transaction ID", "From Email Address",
    "Reference Txn ID", "Invoice Number", "Custom Number", "Quantity",
    "Item Title",
]


def load_env_file(path):
    if not path or not os.path.isfile(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def get_access_token(base_url, client_id, client_secret):
    creds = b64encode(f"{client_id}:{client_secret}".encode()).decode()
    req = urllib.request.Request(
        f"{base_url}/v1/oauth2/token",
        data=b"grant_type=client_credentials",
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)["access_token"]
    except urllib.error.HTTPError as e:
        print(f"Failed to authenticate with PayPal ({e.code}): {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


def fetch_transactions(base_url, token, start_date, end_date):
    transactions = []
    page = 1
    while True:
        params = {
            "start_date": start_date,
            "end_date": end_date,
            "fields": "all",
            "page_size": str(PAGE_SIZE),
            "page": str(page),
        }
        url = f"{base_url}/v1/reporting/transactions?{urllib.parse.urlencode(params)}"
        req = urllib.request.Request(
            url,
            headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
        )
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.load(resp)
        except urllib.error.HTTPError as e:
            print(f"PayPal API error {e.code}: {e.read().decode()}", file=sys.stderr)
            sys.exit(1)

        transactions.extend(data.get("transaction_details", []))
        if page >= data.get("total_pages", 1):
            break
        page += 1
    return transactions


def classify_type(txn_info):
    amount = float(txn_info.get("transaction_amount", {}).get("value", 0))
    has_reference = bool(txn_info.get("paypal_reference_id"))
    if amount < 0 and has_reference:
        return "Refund"
    if amount < 0:
        return "Withdrawal"
    return "Payment"


def to_row(txn):
    info = txn.get("transaction_info", {})
    payer = txn.get("payer_info", {})
    cart = txn.get("cart_info", {})

    gross = info.get("transaction_amount", {}).get("value", "0")
    fee = info.get("fee_amount", {}).get("value", "0")
    net = float(gross) + float(fee)

    name = payer.get("payer_name", {}).get("alternate_full_name", "")

    item_title = "; ".join(
        item.get("item_name", "") for item in cart.get("item_details", []) if item.get("item_name")
    )
    if not item_title:
        # This app's checkout only sets a free-text description (no per-item
        # cart entries), which PayPal surfaces as transaction_subject.
        item_title = info.get("transaction_subject") or info.get("transaction_note", "")

    date_str = info.get("transaction_initiation_date", "")
    date, _, time_part = date_str.partition("T")

    return [
        date,
        time_part.rstrip("Z"),
        "",
        name,
        classify_type(info),
        info.get("transaction_status", ""),
        info.get("transaction_amount", {}).get("currency_code", ""),
        gross,
        fee,
        f"{net:.2f}",
        info.get("transaction_id", ""),
        payer.get("email_address", ""),
        info.get("paypal_reference_id", ""),
        info.get("invoice_id", ""),
        "",
        "",
        item_title,
    ]


def daterange_chunks(start, end, max_days):
    cur = start
    while cur < end:
        chunk_end = min(cur + timedelta(days=max_days), end)
        yield cur, chunk_end
        cur = chunk_end


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("start_date", help="Start date, YYYY-MM-DD")
    parser.add_argument("end_date", help="End date, YYYY-MM-DD (inclusive)")
    parser.add_argument("-o", "--output", help="Output CSV path (default: reports/paypal_<start>_<end>.csv)")
    parser.add_argument("--sandbox", action="store_true", help="Use the PayPal sandbox API instead of live")
    parser.add_argument("--env-file", default=".env", help="Path to a .env file with PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET")
    args = parser.parse_args()

    load_env_file(args.env_file)

    client_id = os.environ.get("PAYPAL_CLIENT_ID")
    client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (env vars or --env-file).", file=sys.stderr)
        sys.exit(1)

    try:
        start = datetime.strptime(args.start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        end = datetime.strptime(args.end_date, "%Y-%m-%d").replace(tzinfo=timezone.utc) + timedelta(days=1)
    except ValueError:
        print("Dates must be in YYYY-MM-DD format.", file=sys.stderr)
        sys.exit(1)

    base_url = SANDBOX_BASE if args.sandbox else LIVE_BASE
    token = get_access_token(base_url, client_id, client_secret)

    all_txns = []
    for chunk_start, chunk_end in daterange_chunks(start, end, MAX_RANGE_DAYS):
        all_txns.extend(
            fetch_transactions(
                base_url,
                token,
                chunk_start.strftime("%Y-%m-%dT%H:%M:%SZ"),
                chunk_end.strftime("%Y-%m-%dT%H:%M:%SZ"),
            )
        )

    output = args.output or f"reports/paypal_{args.start_date}_{args.end_date}.csv"
    out_dir = os.path.dirname(output)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    with open(output, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(HEADER)
        for txn in all_txns:
            writer.writerow(to_row(txn))

    print(f"Wrote {len(all_txns)} transactions to {output}")
    print(f"View with: python3 scripts/display_report.py {output} [filter_item]")


if __name__ == "__main__":
    main()
