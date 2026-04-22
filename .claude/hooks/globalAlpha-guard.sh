#!/bin/bash
# globalAlpha-guard.sh
# Runs after any Edit/Write. If renderer.js was modified, checks that every
# ctx.globalAlpha assignment to a value != 1 is followed by a reset to 1.

python3 -c '
import sys, json

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

file_path = data.get("tool_input", {}).get("file_path", "")
if "renderer.js" not in file_path:
    sys.exit(0)

try:
    content = open(file_path).read()
except OSError:
    sys.exit(0)

issues = []
for i, line in enumerate(content.splitlines(), 1):
    s = line.strip()
    if (
        "ctx.globalAlpha" in s
        and "globalAlpha = 1" not in s
        and "globalAlpha = 1.0" not in s
        and not s.startswith("//")
        and not s.startswith("*")
    ):
        issues.append(f"  line {i}: {s}")

if issues:
    print("WARNING [globalAlpha-guard]: ctx.globalAlpha set to non-1 value.")
    print("Make sure ctx.globalAlpha = 1 is restored immediately after each use:")
    for issue in issues:
        print(issue)
'
