#!/usr/bin/env python3
"""
DRAFT - read-only opening-line verifier for ChessPsyche.
Touches no site files. Needs: pip install python-chess==1.10.0

Input CSV columns: eco, opening_name, side, then one column per site named
site_<name> (e.g. site_lichess) holding that site's SAN line. Blank = no line.

This tool verifies line consensus and legal SAN replay only. It does NOT certify
that the ECO code, opening name, or side match an authoritative opening source;
that still requires human source review. Lines are capped at 20 plies.

A row is LINE_CONSENSUS_VERIFIED only if:
  1. ECO format, opening name, and side fields are present (format check only);
  2. >= THRESHOLD sites share the same opening prefix (3 or 4; default 4);
  3. that prefix replays legally with python-chess; and
  4. it is <= 20 plies.
Conflicts are NEEDS_REVIEW; everything else is EXCLUDED with a reason.

Usage:
  python verify_lines.py candidates.csv [--threshold 3|4] [--out report.json]
  python verify_lines.py --selftest
"""
import argparse
import csv
import json
import re
import sys
from collections import Counter

import chess

PINNED = "1.10.0"
MAX_PLIES = 20
ALLOWED_THRESHOLDS = (3, 4)
ECO_PATTERN = re.compile(r"^[A-E][0-9]{2}$")


def tokens(text):
    """Turn '1. e4 e5 2. Nf3' into ['e4', 'e5', 'Nf3']."""
    text = re.sub(r"\{[^}]*\}|\([^)]*\)|\$\d+", " ", text or "")
    text = re.sub(r"\d+\.(\.\.)?", " ", text)
    out = []
    for token in text.split():
        token = token.rstrip("!?")
        if token and token not in ("1-0", "0-1", "1/2-1/2", "*"):
            out.append(token)
    return out


def consensus(lines, threshold):
    """Longest prefix (<= MAX_PLIES) shared by >= threshold lines."""
    longest = min(MAX_PLIES, max((len(line) for line in lines), default=0))
    for length in range(longest, 0, -1):
        counts = Counter(tuple(line[:length]) for line in lines if len(line) >= length)
        hits = [(prefix, count) for prefix, count in counts.most_common() if count >= threshold]
        if hits:
            return list(hits[0][0]), hits[0][1], len(hits) > 1
    return [], 0, False


def replay(sans):
    board = chess.Board()
    for ply, san in enumerate(sans, 1):
        try:
            board.push_san(san)
        except ValueError:
            return False, None, f"illegal move at ply {ply}: {san}"
    return True, board.fen(), ""


def check_row(row, threshold):
    eco = (row.get("eco") or "").strip().upper()
    opening_name = (row.get("opening_name") or "").strip()
    side = (row.get("side") or "").strip().lower()
    res = {
        "eco": eco,
        "opening_name": opening_name,
        "side": side,
        "sites_with_line": 0,
        "agreeing_sites": 0,
        "accepted_san": "",
        "plies": 0,
        "replay": "NOT RUN",
        "fen": None,
        "status": "EXCLUDED",
        "reason": "",
    }

    # These checks validate metadata shape/presence, not the ECO/name/side mapping.
    if not ECO_PATTERN.fullmatch(eco):
        res["reason"] = "missing or invalid ECO code format"
        return res
    if not opening_name:
        res["reason"] = "missing opening_name"
        return res
    if side not in ("white", "black"):
        res["reason"] = "side must be White or Black"
        return res

    sites = {}
    for column, value in row.items():
        if column.startswith("site_") and len(column) > len("site_") and (value or "").strip():
            parsed = tokens(value)
            if parsed:
                sites[column] = parsed
    res["sites_with_line"] = len(sites)

    if len(sites) < threshold:
        res["reason"] = f"only {len(sites)} sites have a SAN line (need {threshold})"
        return res

    prefix, count, conflict = consensus(list(sites.values()), threshold)
    res["agreeing_sites"] = count
    if conflict:
        res["status"] = "NEEDS_REVIEW"
        res["reason"] = "two different SAN prefixes each reach the threshold; human review required"
        return res
    if not prefix:
        res["reason"] = f"no prefix shared by {threshold} sites"
        return res

    ok, fen, why = replay(prefix)
    res.update(
        accepted_san=" ".join(prefix),
        plies=len(prefix),
        replay="PASS" if ok else "FAIL",
        fen=fen,
    )
    if ok:
        res["status"] = "LINE_CONSENSUS_VERIFIED"
    else:
        res["reason"] = why
    return res


def selftest():
    legal = "1.e4 e5 2.Nf3 Nc6 3.Bb5"
    illegal = "1.e4 e5 2.Ke3 Nc6"
    long_line = " ".join(["Nf3 Nf6 Ng1 Ng8"] * 6)  # 24 plies, legal

    def row(line, count):
        result = {"eco": "C60", "opening_name": "Ruy Lopez", "side": "White"}
        for index in range(10):
            result[f"site_{index}"] = line if index < count else ""
        return result

    assert check_row(row(legal, 4), 4)["status"] == "LINE_CONSENSUS_VERIFIED"
    assert check_row(row(legal, 3), 4)["status"] == "EXCLUDED"
    assert check_row(row(legal, 3), 3)["status"] == "LINE_CONSENSUS_VERIFIED"
    assert check_row(row(illegal, 4), 4)["replay"] == "FAIL"
    assert check_row(row(long_line, 4), 4)["plies"] == MAX_PLIES

    empty = row("1.", 4)
    empty_result = check_row(empty, 4)
    assert empty_result["status"] == "EXCLUDED" and empty_result["sites_with_line"] == 0

    bad_eco = row(legal, 4)
    bad_eco["eco"] = "T"
    assert "invalid ECO" in check_row(bad_eco, 4)["reason"]

    bad_side = row(legal, 4)
    bad_side["side"] = "either"
    assert "side must" in check_row(bad_side, 4)["reason"]

    missing_name = row(legal, 4)
    missing_name["opening_name"] = ""
    assert check_row(missing_name, 4)["reason"] == "missing opening_name"

    mix = {"eco": "C60", "opening_name": "Ruy Lopez", "side": "White"}
    for index in range(8):
        mix[f"site_{index}"] = "1.e4 e5 2.Nf3" if index < 4 else "1.e4 c5 2.Nf3"
    assert check_row(mix, 4)["status"] == "NEEDS_REVIEW"

    print("selftest PASS; python-chess", chess.__version__)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv", nargs="?")
    parser.add_argument("--threshold", type=int, choices=ALLOWED_THRESHOLDS, default=4)
    parser.add_argument("--out")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()

    if chess.__version__ != PINNED:
        print(
            f"ERROR: python-chess {chess.__version__}; required pinned version is {PINNED}",
            file=sys.stderr,
        )
        return 2

    if args.selftest:
        selftest()
        return 0
    if not args.csv:
        parser.error("csv is required unless --selftest is used")

    with open(args.csv, newline="", encoding="utf-8") as source:
        reader = csv.DictReader(source)
        fields = reader.fieldnames or []
        missing = sorted({"eco", "opening_name", "side"} - set(fields))
        site_columns = [field for field in fields if field.startswith("site_") and len(field) > len("site_")]
        if missing:
            parser.error("CSV missing required columns: " + ", ".join(missing))
        if not site_columns:
            parser.error("CSV needs at least one site_<name> column")
        results = [check_row(row, args.threshold) for row in reader]

    for result in results:
        print(
            f"{result['eco']:5} {result['status']:24} "
            f"agree={result['agreeing_sites']}/{result['sites_with_line']} "
            f"plies={result['plies']} {result['reason']}"
        )
    if args.out:
        with open(args.out, "w", encoding="utf-8") as report:
            json.dump(
                {
                    "python_chess": chess.__version__,
                    "threshold": args.threshold,
                    "max_plies": MAX_PLIES,
                    "scope": "Line consensus and legal SAN replay only; ECO/name/side correspondence requires independent source review.",
                    "rows": results,
                },
                report,
                indent=2,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
