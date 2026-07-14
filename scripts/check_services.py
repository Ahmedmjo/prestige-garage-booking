"""
Re-extract ALL services from prestige_garage_v3 to verify thermal insulation count.
The user says it should be 8 but we got 6.
"""
import openpyxl
from pathlib import Path
from datetime import datetime

UPLOAD = Path("/home/z/my-project/upload")
wb = openpyxl.load_workbook(UPLOAD / "prestige_garage_v3 (1).xlsx", data_only=True)
ws = wb["سجل_الخدمات"]
rows = list(ws.iter_rows(values_only=True))

print(f"Total rows in sheet: {len(rows)}")
print()
print("=== ALL ROWS (first 15 cols) ===")
for i, r in enumerate(rows):
    if any(c is not None for c in r):
        # Only print non-empty rows
        cells = [str(c)[:25] if c else "-" for c in r[:10]]
        print(f"Row {i+1}: {' | '.join(cells)}")
        if i > 60:
            print("... (truncated)")
            break
