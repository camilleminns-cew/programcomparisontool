"""
Checks data/programs.csv and data/states.csv for mistakes before they reach the website.

GitHub runs this automatically on every change (see .github/workflows/validate-data.yml).
To run it yourself:  python3 scripts/validate.py

ERRORS stop the check (red X in GitHub). WARNINGS are reminders and don't fail.
No extra packages needed.
"""
import csv
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROGRAMS = os.path.join(ROOT, "data", "programs.csv")
STATES = os.path.join(ROOT, "data", "states.csv")

PROGRAM_COLS = [
    "id", "publish", "program_name", "program_url", "utility", "state", "utility_type", "status",
    "year_started", "year_ended", "model", "model_confirmed", "docket_or_authority",
    "check_utility_pays_upfront", "check_charge_tied_to_meter", "check_no_credit_check",
    "check_savings_exceed_charge", "check_transfers_with_meter", "check_open_to_renters",
    "public_note", "internal_notes", "last_reviewed", "reviewed_by",
]
STATE_COLS = ["code", "name", "status", "grid_row", "grid_col", "internal_notes"]

ALLOWED = {
    "publish": {"yes", "no"},
    "utility_type": {"iou", "coop", "muni", "other"},
    "status": {"active", "ended", "in_development"},
    "model": {"pays", "modified", "under_review"},
    "model_confirmed": {"yes", "no"},
}
CHECK_COLS = [c for c in PROGRAM_COLS if c.startswith("check_")]
CHECK_VALUES = {"yes", "no", "partial", "unknown"}
STATE_STATUS = {"approved", "adoption_proceedings", "formal_due_diligence", "informal", "none"}

errors, warnings = [], []


def err(where, msg):
    errors.append(f"{where}: {msg}")


def warn(where, msg):
    warnings.append(f"{where}: {msg}")


def read(path, expected):
    if not os.path.exists(path):
        err(os.path.basename(path), "file is missing")
        return []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        header = [h.strip() for h in (reader.fieldnames or [])]
        missing = [c for c in expected if c not in header]
        extra = [c for c in header if c not in expected]
        if missing:
            err(os.path.basename(path), "missing column(s): " + ", ".join(missing))
        if extra:
            warn(os.path.basename(path), "extra column(s) the site ignores: " + ", ".join(extra))
        rows = []
        for i, r in enumerate(reader, start=2):
            r = {(k or "").strip(): (v or "").strip() for k, v in r.items()}
            if any(r.values()):
                r["_line"] = i
                rows.append(r)
        return rows


states = read(STATES, STATE_COLS)
codes = set()
cells = set()
for s in states:
    where = f"states.csv line {s['_line']} ({s.get('code') or '?'})"
    code = s.get("code", "")
    if not re.fullmatch(r"[A-Z]{2}", code):
        err(where, f"code '{code}' should be two capital letters")
    if code in codes:
        err(where, f"state {code} is listed twice")
    codes.add(code)
    if s.get("status") not in STATE_STATUS:
        err(where, f"status '{s.get('status')}' must be one of: {', '.join(sorted(STATE_STATUS))}")
    try:
        r, c = int(s.get("grid_row")), int(s.get("grid_col"))
        if not (1 <= r <= 12 and 1 <= c <= 11):
            err(where, "grid_row must be 1-12 and grid_col 1-11")
        if (r, c) in cells:
            err(where, f"two states share map position row {r}, column {c}")
        cells.add((r, c))
    except ValueError:
        err(where, "grid_row and grid_col must be whole numbers")

programs = read(PROGRAMS, PROGRAM_COLS)
ids = set()
for p in programs:
    pid = p.get("id", "")
    where = f"programs.csv line {p['_line']} ({pid or '?'})"
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", pid):
        err(where, "id must be lowercase letters/numbers separated by hyphens, e.g. mo-evergy")
    if pid in ids:
        err(where, f"id '{pid}' is used twice")
    ids.add(pid)

    for col, allowed in ALLOWED.items():
        v = p.get(col, "")
        if v not in allowed:
            err(where, f"{col} is '{v}', must be one of: {', '.join(sorted(allowed))}")

    for col in ("program_name", "utility"):
        if not p.get(col):
            err(where, f"{col} is blank")

    if p.get("state") not in codes:
        err(where, f"state '{p.get('state')}' is not in states.csv")

    for col in ("year_started", "year_ended"):
        v = p.get(col, "")
        if v and not re.fullmatch(r"(19|20)\d\d", v):
            err(where, f"{col} '{v}' should be a 4-digit year or blank")
    ys, ye = p.get("year_started"), p.get("year_ended")
    if ys and ye and ye < ys:
        err(where, "year_ended is before year_started")
    if p.get("status") == "active" and ye:
        warn(where, "status is active but year_ended is filled in")
    if p.get("status") == "ended" and not ye:
        warn(where, "status is ended but year_ended is blank")

    checks = {}
    for col in CHECK_COLS:
        v = p.get(col, "").lower()
        checks[col] = v
        if v not in CHECK_VALUES:
            err(where, f"{col} is '{p.get(col)}', must be yes, no, partial or unknown")

    url = p.get("program_url", "")
    if url:
        if not url.startswith("https://"):
            err(where, "program_url must start with https:// (paste the full web address)")
        elif " " in url:
            err(where, "program_url contains a space (use %20)")
    if "<" in p.get("program_name", "") or "](" in p.get("program_name", ""):
        err(where, "program_name contains link code; put the link in program_url instead")

    if p.get("last_reviewed") and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", p["last_reviewed"]):
        err(where, "last_reviewed should look like 2026-11-09")

    if p.get("model") == "pays" and any(v == "no" for v in checks.values()):
        warn(where, "model is 'pays' but a checklist item is 'no'; should this be 'modified'?")
    if p.get("model_confirmed") == "yes" and any(v == "unknown" for v in checks.values()):
        warn(where, "model is confirmed but some checklist items are still 'unknown'")

print(f"Checked {len(programs)} programs and {len(states)} states.")
for w in warnings:
    print("WARNING  " + w)
for e in errors:
    print("ERROR    " + e)
if errors:
    print(f"\n{len(errors)} error(s). Fix these and save again.")
    sys.exit(1)
print("\nAll good. No errors." + (f" {len(warnings)} warning(s) to look at." if warnings else ""))
