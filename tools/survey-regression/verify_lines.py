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
  python verify_lines.py --boundary records.json [--catalog ../../index.html] [--out report.json]
  python verify_lines.py --selftest

--boundary checks move-boundary records (see check_move_boundary): ECO,
assigned side, at most five assigned-side moves, a legal replay that ends on
the assigned side's final move, commentary and evidence tier. It never
upgrades a tier; DIRECT_VERIFIED is refused unless evidence is cited.
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


# ---------------------------------------------------------------------------
# Move-boundary records (read-only). One record per ECO card and side keeps
# these apart: ECO identity, assigned side, the assigned side's own moves (at
# most five, fewer is fine, never padded), the full legal replay sequence with
# the opponent's moves the board plays silently, commentary, and evidence tier.
# The replay ends on the assigned side's final move: no trailing opponent reply.
# ---------------------------------------------------------------------------
MAX_ASSIGNED_MOVES = 5
BOUNDARY_FIELDS = (
    "eco", "system_name", "assigned_side", "assigned_side_moves",
    "full_legal_replay_sequence", "commentary", "evidence_tier",
)
BOUNDARY_OPTIONAL_FIELDS = ("evidence",)
# DIRECT_VERIFIED: a cited source states this exact line for this ECO and side.
# PREFIX_REPLAYED: the CSV consensus check above passed; not a direct citation.
# UNVERIFIED: no evidence recorded yet (the safe default for drafted data).
EVIDENCE_TIERS = ("DIRECT_VERIFIED", "PREFIX_REPLAYED", "UNVERIFIED")


def _is_san_list(value):
    return isinstance(value, list) and all(isinstance(s, str) and s.strip() for s in value)


def check_move_boundary(record, catalog=None):
    """Validate one move-boundary record without changing it.

    catalog (optional, from load_site_catalog) adds the ECO identity and
    ownership checks against the site's own ECO name, side and line data.
    Returns {"status": "VALID"|"INVALID", "errors": [...], ...}.
    """
    errors = []
    res = {"eco": None, "assigned_side": None, "status": "INVALID", "errors": errors,
           "plies": 0, "assigned_count": 0, "fen": None,
           "eco_identity": "NOT CHECKED", "warnings": []}
    if not isinstance(record, dict):
        errors.append("record must be an object")
        return res

    missing = [f for f in BOUNDARY_FIELDS if f not in record]
    unknown = sorted(set(record) - set(BOUNDARY_FIELDS) - set(BOUNDARY_OPTIONAL_FIELDS))
    if missing:
        errors.append("missing field(s): " + ", ".join(missing))
    if unknown:
        errors.append("unknown field(s): " + ", ".join(unknown))
    if missing:
        return res

    eco = record["eco"]
    side = record["assigned_side"]
    own = record["assigned_side_moves"]
    seq = record["full_legal_replay_sequence"]
    tier = record["evidence_tier"]
    res["eco"], res["assigned_side"] = eco, side

    if not isinstance(eco, str) or not ECO_PATTERN.fullmatch(eco):
        errors.append("eco must look like B20")
    if not isinstance(record["system_name"], str) or not record["system_name"].strip():
        errors.append("system_name must be a non-empty string")
    if side not in ("white", "black"):
        errors.append("assigned_side must be 'white' or 'black'")
    if not isinstance(record["commentary"], str) or not record["commentary"].strip():
        errors.append("commentary must be a non-empty string")
    if tier not in EVIDENCE_TIERS:
        errors.append("evidence_tier must be one of " + ", ".join(EVIDENCE_TIERS))
    elif tier == "DIRECT_VERIFIED":
        evidence = record.get("evidence")
        if not (isinstance(evidence, list) and evidence and all(
                isinstance(e, dict) and str(e.get("source") or "").strip()
                and str(e.get("reference") or "").strip() for e in evidence)):
            errors.append("DIRECT_VERIFIED needs evidence: [{source, reference}, ...]")
    if not _is_san_list(own):
        errors.append("assigned_side_moves must be a list of SAN strings")
    elif not 1 <= len(own) <= MAX_ASSIGNED_MOVES:
        errors.append(f"assigned_side_moves must hold 1 to {MAX_ASSIGNED_MOVES} moves, has {len(own)}")
    if not _is_san_list(seq):
        errors.append("full_legal_replay_sequence must be a list of SAN strings")
    if errors:
        return res

    # Every ply must be legal, in order, from the starting position.
    board = chess.Board()
    for ply, san in enumerate(seq, 1):
        try:
            board.push_san(san)
        except ValueError:
            errors.append(f"illegal or out-of-order move at ply {ply}: {san}")
            return res
    res["plies"], res["fen"] = len(seq), board.fen()

    # Ownership: the assigned side's plies are exactly assigned_side_moves, and
    # the sequence stops on the last of them (white: odd length, black: even).
    first = 0 if side == "white" else 1
    owned = seq[first::2]
    res["assigned_count"] = len(owned)
    if owned != own:
        errors.append(
            f"{side}'s moves in the replay are {owned}, but assigned_side_moves is {own}")
    expected_len = 2 * len(own) - (1 if side == "white" else 0)
    if len(seq) != expected_len:
        errors.append(
            f"replay must end on {side}'s final move: expected {expected_len} plies "
            f"for {len(own)} {side} move(s), got {len(seq)}")

    if catalog is not None and isinstance(eco, str):
        names, sides, lines = catalog
        if eco not in names:
            errors.append(f"{eco} is not in the site's ECO list")
        else:
            owner = sides.get(eco)
            if owner not in (side, "either"):
                errors.append(f"{eco} belongs to {owner} in the site's ECO side map, not {side}")
            line = lines.get(eco)
            if line is None:
                errors.append(f"{eco} has no line in the site's ECO data")
            else:
                common = min(len(line), len(seq))
                if line[:common] != seq[:common]:
                    errors.append(
                        f"replay leaves the site's {eco} line ({' '.join(line)}) "
                        f"at ply {next(i for i in range(common) if line[i] != seq[i]) + 1}")
                else:
                    # A five-move cap can stop short of a long ECO line. That is
                    # not an error, but the card must not claim the named position.
                    res["eco_identity"] = "REACHED" if len(seq) >= len(line) else "PREFIX_ONLY"
                    if len(seq) < len(line):
                        res["warnings"].append(
                            f"replay stops before the {eco} position "
                            f"({len(seq)} of {len(line)} plies)")

    if not errors:
        res["status"] = "VALID"
    return res


def move_five_start(record):
    """Where a 'Start from Move 5' button could start, or None.

    Move 5 means the assigned side's fifth move, not the fifth ply. The start
    position is the one just before that move, so it exists only when the record
    has five assigned-side moves. The index and the FEN reached by replaying to
    it are both checked; a short line returns None instead of an out-of-range
    index. The record should already pass check_move_boundary.
    """
    side = record.get("assigned_side")
    seq = record.get("full_legal_replay_sequence")
    own = record.get("assigned_side_moves")
    if side not in ("white", "black") or not _is_san_list(seq) or not _is_san_list(own):
        return None
    if len(own) < MAX_ASSIGNED_MOVES:
        return None
    index = 2 * (MAX_ASSIGNED_MOVES - 1) + (0 if side == "white" else 1)  # plies before move 5
    if not 0 <= index < len(seq):
        return None
    board = chess.Board()
    try:
        for san in seq[:index]:
            board.push_san(san)
        next_move = board.parse_san(seq[index])
    except ValueError:
        return None
    if board.turn != (chess.WHITE if side == "white" else chess.BLACK) or not board.is_valid():
        return None
    if seq[index] != own[MAX_ASSIGNED_MOVES - 1] or not board.is_legal(next_move):
        return None
    return {"ply_index": index, "fen": board.fen()}


def load_site_catalog(index_html_path):
    """Read ECO names, the ECO side map and ECO lines from index.html (read-only)."""
    with open(index_html_path, encoding="utf-8") as source:
        text = source.read()

    def block(start):
        at = text.index(start)
        return text[at:text.index("\n};", at)]

    names = dict(re.findall(r'"([A-E]\d{2})":\s*"((?:[^"\\]|\\.)*)"', block("const ecoNamesMap = {")))
    sides = dict(re.findall(r"\b([A-E]\d{2}):'(white|black|either)'", block("const ECO_SIDE = {")))
    lines = {code: tokens(moves) for code, moves in re.findall(
        r'"([A-E]\d{2})":\s*\{\s*moves:\s*"([^"]*)"', block("const ecoVaultData = {"))}
    if len(names) < 500 or len(sides) < 500 or len(lines) < 500:
        raise ValueError(
            f"could not read the site's ECO data (names={len(names)}, sides={len(sides)}, lines={len(lines)})")
    return names, sides, lines


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

    boundary_selftest()
    print("selftest PASS; python-chess", chess.__version__)


def boundary_selftest():
    """Move-boundary schema, ownership, catalog and Move 5 start checks."""
    def record(**changes):
        base = {
            "eco": "B20", "system_name": "Sicilian Defense", "assigned_side": "black",
            "assigned_side_moves": ["c5", "d6", "cxd4"],
            "full_legal_replay_sequence": ["e4", "c5", "Nf3", "d6", "d4", "cxd4"],
            "commentary": "Illustrative test record, not production data.",
            "evidence_tier": "UNVERIFIED",
        }
        base.update(changes)
        return base

    def errors(rec, catalog=None):
        return " | ".join(check_move_boundary(rec, catalog)["errors"])

    # Fewer than five assigned-side moves is valid; no padding is required.
    assert check_move_boundary(record())["status"] == "VALID"
    assert check_move_boundary(record())["assigned_count"] == 3
    # Six assigned-side moves exceed the cap.
    six = record(assigned_side_moves=["c5", "d6", "cxd4", "Nf6", "a6", "e5"],
                 full_legal_replay_sequence=["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4",
                                             "Nf6", "Nc3", "a6", "Be2", "e5"])
    assert "1 to 5 moves" in errors(six)
    assert "1 to 5 moves" in errors(record(assigned_side_moves=[]))
    # A trailing opponent reply after the final assigned-side move is rejected.
    trailing = record(full_legal_replay_sequence=["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4"])
    assert "must end on black's final move" in errors(trailing)
    # White ends on an odd ply; the same rule applies.
    white = record(eco="C60", system_name="Ruy Lopez", assigned_side="white",
                   assigned_side_moves=["e4", "Nf3", "Bb5"],
                   full_legal_replay_sequence=["e4", "e5", "Nf3", "Nc6", "Bb5"])
    assert check_move_boundary(white)["status"] == "VALID"
    assert "must end on white's final move" in errors(
        dict(white, full_legal_replay_sequence=["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]))
    # Illegal and out-of-order moves fail at the exact ply.
    assert "ply 5: Ke3" in errors(record(full_legal_replay_sequence=["e4", "c5", "Nf3", "d6", "Ke3", "cxd4"]))
    assert "ply 1: c5" in errors(record(full_legal_replay_sequence=["c5", "e4", "d6", "Nf3", "cxd4", "d4"]))
    # Ownership: assigned_side_moves must be exactly the assigned side's plies.
    assert "assigned_side_moves is" in errors(record(assigned_side_moves=["e4", "Nf3", "d4"]))
    assert "assigned_side_moves is" in errors(record(assigned_side="white"))
    # Schema: required fields, unknown fields, side, tier and evidence.
    no_comment = record(); del no_comment["commentary"]
    assert "missing field(s): commentary" in errors(no_comment)
    assert "unknown field(s): extra" in errors(record(extra=1))
    assert "assigned_side must be" in errors(record(assigned_side="either"))
    assert "eco must look like" in errors(record(eco="B2"))
    assert "evidence_tier must be" in errors(record(evidence_tier="VERIFIED"))
    # DIRECT_VERIFIED is refused without cited evidence, accepted with it.
    assert "DIRECT_VERIFIED needs evidence" in errors(record(evidence_tier="DIRECT_VERIFIED"))
    assert "DIRECT_VERIFIED needs evidence" in errors(
        record(evidence_tier="DIRECT_VERIFIED", evidence=[{"source": "x"}]))
    cited = record(evidence_tier="DIRECT_VERIFIED",
                   evidence=[{"source": "test", "reference": "test-only citation"}])
    assert check_move_boundary(cited)["status"] == "VALID"

    # Catalog checks against a small stand-in for the site's ECO data.
    catalog = (
        {"B20": "Sicilian Defense", "C60": "Ruy Lopez", "B90": "Sicilian Najdorf"},
        {"B20": "black", "C60": "white", "B90": "black"},
        {"B20": ["e4", "c5"], "C60": ["e4", "e5", "Nf3", "Nc6", "Bb5"],
         "B90": ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"]},
    )
    ok = check_move_boundary(record(), catalog)
    assert ok["status"] == "VALID" and ok["eco_identity"] == "REACHED"
    assert "not in the site's ECO list" in errors(record(eco="A00"), catalog)
    assert "belongs to black" in errors(dict(white, eco="B20", assigned_side="white"), catalog)
    assert "leaves the site's B20 line" in errors(
        record(assigned_side_moves=["e5", "Nc6", "Nf6"],
               full_legal_replay_sequence=["e4", "e5", "Nf3", "Nc6", "d4", "Nf6"]), catalog)
    short = check_move_boundary(record(eco="B90"), catalog)
    assert short["status"] == "VALID" and short["eco_identity"] == "PREFIX_ONLY" and short["warnings"]

    # Start from Move 5 needs five assigned-side moves, never five plies.
    assert move_five_start(record()) is None                       # 3 black moves, 6 plies
    assert move_five_start(white) is None                          # 3 white moves, 5 plies
    najdorf = record(eco="B90", assigned_side_moves=["c5", "d6", "cxd4", "Nf6", "a6"],
                     full_legal_replay_sequence=catalog[2]["B90"])
    assert check_move_boundary(najdorf, catalog)["status"] == "VALID"
    start = move_five_start(najdorf)
    assert start["ply_index"] == 9
    assert start["fen"] == "rnbqkb1r/pp2pppp/3p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R b KQkq - 2 5"
    board = chess.Board(start["fen"])
    assert board.turn == chess.BLACK and board.parse_san("a6")
    italian = {"eco": "C50", "system_name": "Italian", "assigned_side": "white",
               "assigned_side_moves": ["e4", "Nf3", "Bc4", "c3", "d4"],
               "full_legal_replay_sequence": ["e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4"],
               "commentary": "Illustrative test record.", "evidence_tier": "UNVERIFIED"}
    assert check_move_boundary(italian)["status"] == "VALID"
    assert move_five_start(italian)["ply_index"] == 8
    assert chess.Board(move_five_start(italian)["fen"]).turn == chess.WHITE
    # Short or malformed lines never yield an out-of-range index.
    truncated = dict(najdorf, full_legal_replay_sequence=najdorf["full_legal_replay_sequence"][:9])
    assert move_five_start(truncated) is None
    assert move_five_start(dict(najdorf, full_legal_replay_sequence=["e4"])) is None
    assert move_five_start({}) is None

def run_boundary(args):
    with open(args.boundary, encoding="utf-8") as source:
        records = json.load(source)
    if not isinstance(records, list):
        print("ERROR: move-boundary file must hold a JSON list", file=sys.stderr)
        return 2
    catalog = load_site_catalog(args.catalog) if args.catalog else None
    results = []
    for rec in records:
        result = check_move_boundary(rec, catalog)
        start = move_five_start(rec) if result["status"] == "VALID" else None
        result["move_five_start"] = start
        result["evidence_tier"] = rec.get("evidence_tier") if isinstance(rec, dict) else None
        results.append(result)
        print(
            f"{str(result['eco']):5} {str(result['assigned_side']):5} {result['status']:7} "
            f"tier={result['evidence_tier']} {result['assigned_count']} own/{result['plies']} plies "
            f"eco={result['eco_identity']} "
            f"move5={'ply ' + str(start['ply_index']) if start else 'no'} "
            + "; ".join(result["errors"] + result["warnings"])
        )
    if args.out:
        with open(args.out, "w", encoding="utf-8") as report:
            json.dump({"python_chess": chess.__version__, "catalog": args.catalog,
                       "max_assigned_moves": MAX_ASSIGNED_MOVES, "records": results},
                      report, indent=2)
    invalid = sum(r["status"] != "VALID" for r in results)
    print(f"{len(results) - invalid} VALID, {invalid} INVALID")
    return 1 if invalid else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("csv", nargs="?")
    parser.add_argument("--threshold", type=int, choices=ALLOWED_THRESHOLDS, default=4)
    parser.add_argument("--out")
    parser.add_argument("--selftest", action="store_true")
    parser.add_argument("--boundary", metavar="RECORDS_JSON",
                        help="check move-boundary records (a JSON list) instead of a CSV")
    parser.add_argument("--catalog", metavar="INDEX_HTML",
                        help="with --boundary: also check ECO identity and ownership against index.html")
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
    if args.boundary:
        return run_boundary(args)
    if args.catalog:
        parser.error("--catalog needs --boundary")
    if not args.csv:
        parser.error("csv is required unless --selftest or --boundary is used")

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
