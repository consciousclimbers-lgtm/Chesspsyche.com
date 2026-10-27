#!/usr/bin/env python3
"""
DRAFT - read-only opening-line verifier for ChessPsyche.
Touches no site files. Needs: pip install chess==1.10.0

Input CSV columns: eco, opening_name, side, then registered site_<name> columns
holding SAN lines. Known duplicate suffixes such as _copy, _alt, and _2 collapse
to one canonical source family. Unknown non-empty source columns fail closed.

This tool verifies line consensus and legal SAN replay only. It does NOT certify
that the ECO code, opening name, or side match an authoritative opening source;
that still requires human source review. Lines are capped at 20 plies.

A row is PREFIX_REPLAYED only if:
  1. ECO format, opening name, and side fields are present (format check only);
  2. >= THRESHOLD distinct registered source families share the same prefix;
  3. that prefix replays legally with python-chess; and
  4. it is <= 20 plies.
This status does not verify the ECO/name/side mapping.
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
    """Longest prefix shared by threshold families; flag competing prefixes."""
    longest = min(MAX_PLIES, max((len(line) for line in lines), default=0))
    candidates = []
    for length in range(longest, 0, -1):
        counts = Counter(tuple(line[:length]) for line in lines if len(line) >= length)
        candidates.extend(
            (length, prefix, count)
            for prefix, count in counts.items()
            if count >= threshold
        )
    if not candidates:
        return [], 0, False

    # A shorter candidate that is a prefix of a longer candidate is compatible.
    # Any candidates that diverge at a shared ply are competing lines, even when
    # they reach threshold at different lengths.
    for index, (_, prefix, _) in enumerate(candidates):
        for _, other, _ in candidates[index + 1:]:
            common = min(len(prefix), len(other))
            if prefix[:common] != other[:common]:
                return [], 0, True

    length, prefix, count = max(candidates, key=lambda item: (item[0], item[2]))
    return list(prefix), count, False


def replay(sans):
    board = chess.Board()
    for ply, san in enumerate(sans, 1):
        try:
            board.push_san(san)
        except ValueError:
            return False, None, f"illegal move at ply {ply}: {san}"
    return True, board.fen(), ""



# Explicit provenance registry. Add a family deliberately when a new source is
# approved for line comparison; unknown non-empty site_* columns never vote.
SOURCE_FAMILY_ALIASES = {
    "365chess": "365chess",
    "chesscom": "chesscom",
    "chessdotcom": "chesscom",
    "lichess": "lichess",
    "lichessorg": "lichess",
    "chessiverse": "chessiverse",
    "chessgames": "chessgames",
    "chessgamescom": "chessgames",
    "wikibooks": "wikibooks",
    "chessopenings": "chessopenings",
    "chessopeningscom": "chessopenings",
    "wikipedia": "wikipedia",
    "chessbase": "chessbase",
    "chessbasecom": "chessbase",
    "chessable": "chessable",
    "chess24": "chess24",
    "chesstempo": "chesstempo",
}
_DUPLICATE_SUFFIX = re.compile(
    r"(?:copy|alt|backup|mirror|duplicate|dup|replica|version|v)?\d+$"
)
_DUPLICATE_WORD_SUFFIX = re.compile(
    r"(?:copy|alt|backup|mirror|duplicate|dup|replica)$"
)


def canonical_source_family(column):
    """Return a registered source family for a site_* column, else None."""
    if not column.startswith("site_"):
        return None
    key = re.sub(r"[^a-z0-9]+", "", column[len("site_"):].lower())
    if key in SOURCE_FAMILY_ALIASES:
        return SOURCE_FAMILY_ALIASES[key]

    # Strip known duplicate/variant suffixes repeatedly. Check the registry
    # after each strip so meaningful digits in names such as chess24 survive.
    for _ in range(4):
        stripped = _DUPLICATE_SUFFIX.sub("", key)
        stripped = _DUPLICATE_WORD_SUFFIX.sub("", stripped)
        if not stripped or stripped == key:
            break
        key = stripped
        if key in SOURCE_FAMILY_ALIASES:
            return SOURCE_FAMILY_ALIASES[key]
    return None


def check_row(row, threshold):
    eco = (row.get("eco") or "").strip().upper()
    opening_name = (row.get("opening_name") or "").strip()
    side = (row.get("side") or "").strip().lower()
    res = {
        "eco": eco,
        "opening_name": opening_name,
        "side": side,
        "site_columns_with_line": 0,
        "source_families_with_line": 0,
        "source_families": [],
        "unrecognized_site_columns": [],
        "agreeing_families": 0,
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

    family_lines = {}
    conflicting_families = set()
    unknown_columns = []
    for column, value in row.items():
        if not column.startswith("site_") or len(column) <= len("site_"):
            continue
        if not (value or "").strip():
            continue
        parsed = tokens(value)
        if not parsed:
            continue

        res["site_columns_with_line"] += 1
        family = canonical_source_family(column)
        if family is None:
            unknown_columns.append(column)
            continue
        if family in family_lines:
            if family_lines[family] != parsed:
                conflicting_families.add(family)
        else:
            family_lines[family] = parsed

    res["source_families_with_line"] = len(family_lines)
    res["source_families"] = sorted(family_lines)
    res["unrecognized_site_columns"] = sorted(unknown_columns)

    provenance_problems = []
    if unknown_columns:
        provenance_problems.append(
            "unrecognized non-empty source column(s): " + ", ".join(sorted(unknown_columns))
        )
    if conflicting_families:
        provenance_problems.append(
            "conflicting move lines within source family/families: "
            + ", ".join(sorted(conflicting_families))
        )
    if provenance_problems:
        res["status"] = "NEEDS_REVIEW"
        res["reason"] = "; ".join(provenance_problems)
        return res

    if len(family_lines) < threshold:
        res["reason"] = (
            f"only {len(family_lines)} registered source families have a SAN line "
            f"(need {threshold})"
        )
        return res

    prefix, count, conflict = consensus(list(family_lines.values()), threshold)
    res["agreeing_families"] = count
    if conflict:
        res["status"] = "NEEDS_REVIEW"
        res["reason"] = (
            "two different SAN prefixes each reach the threshold; human review required"
        )
        return res
    if not prefix:
        res["reason"] = f"no prefix shared by {threshold} source families"
        return res

    ok, fen, why = replay(prefix)
    res.update(
        accepted_san=" ".join(prefix),
        plies=len(prefix),
        replay="PASS" if ok else "FAIL",
        fen=fen,
    )
    if ok:
        res["status"] = "PREFIX_REPLAYED"
    else:
        res["reason"] = why
    return res

def selftest():
    legal = "1.e4 e5 2.Nf3 Nc6 3.Bb5"
    alternative = "1.e4 c5 2.Nf3"
    illegal = "1.e4 e5 2.Ke3 Nc6"
    long_line = " ".join(["Nf3 Nf6 Ng1 Ng8"] * 6)  # 24 plies, legal
    test_families = [
        "365chess", "lichess", "chessiverse", "chesscom", "chessgames",
        "wikibooks", "chessopenings", "wikipedia", "chessbase", "chessable",
    ]

    def row(line, count):
        result = {"eco": "C60", "opening_name": "Ruy Lopez", "side": "White"}
        for index, family in enumerate(test_families):
            result[f"site_{family}"] = line if index < count else ""
        return result

    assert check_row(row(legal, 4), 4)["status"] == "PREFIX_REPLAYED"
    assert check_row(row(legal, 3), 4)["status"] == "EXCLUDED"
    assert check_row(row(legal, 3), 3)["status"] == "PREFIX_REPLAYED"
    assert check_row(row(illegal, 4), 4)["replay"] == "FAIL"
    assert check_row(row(long_line, 4), 4)["plies"] == MAX_PLIES

    empty = row("1.", 4)
    empty_result = check_row(empty, 4)
    assert (
        empty_result["status"] == "EXCLUDED"
        and empty_result["site_columns_with_line"] == 0
        and empty_result["source_families_with_line"] == 0
    )

    bad_eco = row(legal, 4)
    bad_eco["eco"] = "T"
    assert "invalid ECO" in check_row(bad_eco, 4)["reason"]

    bad_side = row(legal, 4)
    bad_side["side"] = "either"
    assert "side must" in check_row(bad_side, 4)["reason"]

    missing_name = row(legal, 4)
    missing_name["opening_name"] = ""
    assert check_row(missing_name, 4)["reason"] == "missing opening_name"

    # Cross-family disagreement remains NEEDS_REVIEW.
    mix = {"eco": "C60", "opening_name": "Ruy Lopez", "side": "White"}
    for index, family in enumerate(test_families[:8]):
        mix[f"site_{family}"] = legal if index < 4 else alternative
    assert check_row(mix, 4)["status"] == "NEEDS_REVIEW"

    # Three 365Chess aliases are one vote, not three independent sources.
    aliases = {
        "eco": "C60", "opening_name": "Ruy Lopez", "side": "White",
        "site_365chess": legal,
        "site_365chess_copy": legal,
        "site_365chess_alt": legal,
    }
    alias_result = check_row(aliases, 3)
    assert alias_result["status"] == "EXCLUDED"
    assert alias_result["source_families_with_line"] == 1
    assert canonical_source_family("site_365chess2") == "365chess"

    # Three registered independent families can satisfy threshold three.
    independent = {
        "eco": "C60", "opening_name": "Ruy Lopez", "side": "White",
        "site_365chess": legal,
        "site_lichess": legal,
        "site_chessiverse": legal,
    }
    assert check_row(independent, 3)["status"] == "PREFIX_REPLAYED"

    # Two different lines from the same family require human review.
    duplicate_conflict = {
        "eco": "C60", "opening_name": "Ruy Lopez", "side": "White",
        "site_365chess": legal,
        "site_365chess_copy": alternative,
        "site_lichess": legal,
        "site_chessiverse": legal,
    }
    duplicate_result = check_row(duplicate_conflict, 3)
    assert duplicate_result["status"] == "NEEDS_REVIEW"
    assert "within source family" in duplicate_result["reason"]

    # Unknown source columns do not vote and cannot silently complete threshold.
    unknown = {
        "eco": "C60", "opening_name": "Ruy Lopez", "side": "White",
        "site_365chess": legal,
        "site_lichess": legal,
        "site_unregistered": legal,
    }
    unknown_result = check_row(unknown, 3)
    assert unknown_result["status"] == "NEEDS_REVIEW"
    assert unknown_result["source_families_with_line"] == 2
    assert "site_unregistered" in unknown_result["reason"]

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
            f"{result['eco']:5} {result['status']:18} "
            f"agree_families={result['agreeing_families']}/{result['source_families_with_line']} "
            f"columns={result['site_columns_with_line']} "
            f"plies={result['plies']} {result['reason']}"
        )
    if args.out:
        with open(args.out, "w", encoding="utf-8") as report:
            json.dump(
                {
                    "python_chess": chess.__version__,
                    "threshold": args.threshold,
                    "max_plies": MAX_PLIES,
                    "scope": "Distinct registered source-family prefix consensus and legal SAN replay only; ECO/name/side correspondence requires independent source review.",
                    "rows": results,
                },
                report,
                indent=2,
            )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
