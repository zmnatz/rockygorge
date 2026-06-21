---
name: report-display-expert
description: Use ONLY when you need to generate or view reports from CSV files using `scripts/display_report.py` and `scripts/fetch_paypal_report.py`.
---

# Report Display Expert

This skill is specialized in generating and viewing reports from CSV files using the `scripts/display_report.py` script and fetching data via `scripts/fetch_paypal_report.py`.

## Guidelines

### 1. Fetching Data (`scripts/fetch_paypal_report.py`)

Use this script to pull transaction data from the PayPal API.

- **Prerequisites**:
    - Set `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` as environment variables or in a `.env` file.
- **Usage**:
    - `python3 scripts/fetch_paypal_report.py <start_date> <end_date>`
    - `python3 scripts/fetch_paypal_report.py <start_date> <end_date> -o <output_path> --sandbox`
- **Arguments**:
    - `<start_date>`: Start date in `YYYY-MM-DD` format.
    - `<end_date>`: End date in `YYYY-MM-DD` format.
    - `-o`, `--output`: Path to the output CSV file (default: `reports/paypal_<start>_<end>.csv`).
    - `--sandbox`: Use the PayPal sandbox environment.
    - `--env-file`: Path to the `.env` file (default: `.env`).

### 2. Viewing Reports (`scripts/display_report.py`)

Use this script to display the fetched CSV data in a formatted table.

- **Usage**:
    - `python3 scripts/display_report.py <csv_file> [filter_item]`
- **Arguments**:
    - `<csv_file>`: The path to the CSV file to display.
    - `[filter_item]`: (Optional) An item title string to filter the results.
- **Expected CSV Column Indices**:
    - `0`: Date
    - `3`: Name
    - `4`: Transaction Type (identifies "Refund")
    - `9`: Net Amount
    - `16`: Item Title
