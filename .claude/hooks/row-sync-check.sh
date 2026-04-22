#!/bin/bash
# row-sync-check.sh
# Runs after any Edit/Write. If constants.js was modified, checks that
# ROW_POINTS and ROW_COLORS have exactly ENEMY_ROWS entries.

python3 -c '
import sys, json, re

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

file_path = data.get("tool_input", {}).get("file_path", "")
if "constants.js" not in file_path:
    sys.exit(0)

try:
    src = open(file_path).read()
except OSError:
    sys.exit(0)

rows_match = re.search(r"ENEMY_ROWS\s*=\s*(\d+)", src)
pts_match  = re.search(r"ROW_POINTS\s*=\s*\[([^\]]+)\]", src)
cols_match = re.search(r"ROW_COLORS\s*=\s*\[([^\]]+)\]", src)

if not rows_match:
    print("WARNING [row-sync-check]: ENEMY_ROWS not found in constants.js.")
    sys.exit(0)

rows = int(rows_match.group(1))
pts  = len(pts_match.group(1).split(","))  if pts_match  else 0
cols = len(cols_match.group(1).split(",")) if cols_match else 0

if pts != rows or cols != rows:
    print(f"WARNING [row-sync-check]: ROW_POINTS({pts}) or ROW_COLORS({cols}) length does not match ENEMY_ROWS={rows}.")
    print("These three values must always stay in sync.")
else:
    print(f"OK [row-sync-check]: ROW_POINTS, ROW_COLORS and ENEMY_ROWS are in sync ({rows} entries).")
'
