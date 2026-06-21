"""Check which OAuth scopes the configured PayPal app credentials actually
grant. Useful for confirming whether the "Transaction Search" feature toggle
in the PayPal Developer Dashboard has taken effect before running
fetch_paypal_report.py.

Usage:
    python3 scripts/check_paypal_scopes.py
    python3 scripts/check_paypal_scopes.py --sandbox
"""

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from base64 import b64encode

SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
LIVE_BASE = "https://api-m.paypal.com"
REPORTING_SCOPE = "https://uri.paypal.com/services/reporting/search/read"


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


def get_token_response(base_url, client_id, client_secret):
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
            return json.load(resp)
    except urllib.error.HTTPError as e:
        print(f"Failed to authenticate with PayPal ({e.code}): {e.read().decode()}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sandbox", action="store_true", help="Use the PayPal sandbox API instead of live")
    parser.add_argument("--env-file", default=".env", help="Path to a .env file with PAYPAL_CLIENT_ID/PAYPAL_CLIENT_SECRET")
    args = parser.parse_args()

    load_env_file(args.env_file)

    client_id = os.environ.get("PAYPAL_CLIENT_ID")
    client_secret = os.environ.get("PAYPAL_CLIENT_SECRET")
    if not client_id or not client_secret:
        print("Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (env vars or --env-file).", file=sys.stderr)
        sys.exit(1)

    base_url = SANDBOX_BASE if args.sandbox else LIVE_BASE
    data = get_token_response(base_url, client_id, client_secret)
    scopes = sorted(data.get("scope", "").split())

    print(f"app_id: {data.get('app_id', '?')}")
    print(f"{len(scopes)} scopes granted:")
    for s in scopes:
        print(f"  {s}")

    print()
    if REPORTING_SCOPE in scopes:
        print(f"OK: Transaction Search scope is granted ({REPORTING_SCOPE}).")
    else:
        print(f"MISSING: Transaction Search scope not granted ({REPORTING_SCOPE}).")
        print("Enable 'Transaction Search' under Features for this app in the PayPal Developer")
        print("Dashboard and retry - the toggle can take a while to propagate to new tokens.")
        sys.exit(1)


if __name__ == "__main__":
    main()
