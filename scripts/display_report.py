import csv
import sys

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 display_report.py <csv_file> [filter_item]")
        sys.exit(1)

    filename = sys.argv[1]
    filter_item = sys.argv[2] if len(sys.argv) > 2 else None
    try:
        with open(filename, 'r', newline='', encoding='latin-1') as f:
            reader = csv.reader(f)
            try:
                header = next(reader)
            except StopIteration:
                return

            # Indices based on header analysis:
            # Date: 0
            # Name: 3
            # Net (Amount): 9
            # Item Title: 16
            
            print(f"{'Date':<12} {'Name':<25} {'Item':<30} {'Net Amount':<10}")
            print("-" * 77)
            
            total_net = 0.0
            for row in reader:
                if len(row) > 16:
                    date = row[0].strip('"')
                    name = row[3]
                    txn_type = row[4]
                    item = row[16]
                    amount_str = row[9]
                    
                    if filter_item and filter_item.lower() not in item.lower():
                        continue
                        
                    try:
                        amount_val = float(amount_str.replace(",", ""))
                        total_net += amount_val
                        
                        # Mark as refund only if the transaction type contains "Refund"
                        display_item = item + " (Refund)" if "Refund" in txn_type else item
                        print(f"{date:<12} {name:<25} {display_item:<30} {amount_str:<10}")
                    except ValueError:
                        continue
            
            print("-" * 77)
            print(f"{'TOTAL':<66} {total_net:>10.2f}")
    except FileNotFoundError:
        print(f"Error: {filename} not found.")

if __name__ == "__main__":
    main()
