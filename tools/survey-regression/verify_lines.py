#!/usr/bin/env python3
"""
DRAFT - read-only opening-line verifier for ChessPsyche.
Touches no site files. Needs: pip install python-chess==1.11.2

Input CSV columns: eco, opening_name, side, then one column per site named
site_<name> (e.g. site_lichess) holding that site's SAN line. Blank = no line.

A row is CONSENSUS_VERIFIED only if:
  1. >= THRESHOLD sites share the same opening prefix (default 4; Calvin allows 3-4), and
  2. that prefix replays legally with python-chess, and
  3. it is <= 20 plies.
Everything else is EXCLUDED with a reason.

Usage:
  python verify_lines.py candidates.csv [--threshold 4] [--out report.json]
  python verify_lines.py --selftest
"""
import argparse, csv, json, re, sys
from collections import Counter

import chess

PINNED = "1.11.2"
MAX_PLIES = 20


def tokens(text):
    """Turn '1. e4 e5 2. Nf3' into ['e4','e5','Nf3']."""
    text = re.sub(r"\\{[^}]*\\}|\\([^)]*\\)|\\$\\d+", " ", text or "")
    text = re.sub(r"\\d+\\.(\\.\\.)?", " ", text)
    out = []
    for t in text.split():
        t = t.rstrip("!?")
        if t and t not in ("1-0", "0-1", "1/2-1/2", "*"):
            out.append(t)
    return out


def consensus(lines, threshold):
    """Longest prefix (<= MAX_PLIES) shared by >= threshold lines."""
    longest = min(MAX_PLIES, max((len(l) for l in lines), default=0))
    for k in range(longest, 0, -1):
        counts = Counter(tuple(l[:k]) for l in lines if len(l) >= k)
        hits = [(p, n) for p, n in counts.most_common() if n >= threshold]
        if hits:
            return list(hits[0][0]), hits[0][1], len(hits) > 1
    return [], 0, False


def replay(sans):
    board = chess.Board()
    for i, san in enumerate(sans, 1):
        try:
            board.push_san(san)
        except ValueError:
            return False, None, f"illegal move at ply {i}: {san}"
    return True, board.fen(), ""


def check_row(row, threshold):
    sites = {k: tokens(v) for k, v in row.items()
             if k.startswith("site_") and (v or "").strip()}
    res = {"eco": row.get("eco"), "side": row.get("side"),
           "sites_with_line": len(sites), "agreeing_sites": 0,
           "accepted_san": "", "plies": 0, "replay": "NOT RUN",
           "fen": None, "status": "EXCLUDED", "reason": ""}
    if len(sites) < threshold:
        res["reason"] = f"only {len(sites)} sites have a line (need {threshold})"
        return res
    prefix, n, conflict = consensus(list(sites.values()), threshold)
    res["agreeing_sites"] = n
    if conflict:
        res["status"] = "NEEDS_REVIEW"
        res["reason"] = "two different lines each reach the threshold; human decides"
        return res
    if not prefix:
        res["reason"] = f"no prefix shared by {threshold} sites"
        return res
    ok, fen, why = replay(prefix)
    res.update(accepted_san=" ".join(prefix), plies=len(prefix),
               replay="PASS" if ok else "FAIL", fen=fen)
    if ok:
        res["status"] = "CONSENSUS_VERIFIED"
    else:
        res["reason"] = why
    return res


def selftest():
    legal = "1.e4 e5 2.Nf3 Nc6 3.Bb5"
    illegal = "1.e4 e5 2.Ke3 Nc6"
    long_line = " ".join(["Nf3 Nf6 Ng1 Ng8"] * 6)  # 24 plies, legal
    def row(line, n):
        r = {"eco": "T", "side": "White"}
        for i in range(10):
            r[f"site_{i}"] = line if i < n else ""
        return r
    assert check_row(row(legal, 7), 7)["status"] == "CONSENSUS_VERIFIED"
    assert check_row(row(legal, 6), 7)["status"] == "EXCLUDED"
    assert check_row(row(illegal, 7), 7)["replay"] == "FAIL"
    assert check_row(row(long_line, 7), 7)["plies"] == MAX_PLIES
    mix = {"eco": "T", "side": "White"}
    for i in range(8):
        mix[f"site_{i}"] = "1.e4 e5 2.Nf3" if i < 4 else "1.e4 c5 2.Nf3"
    assert check_row(mix, 4)["status"] == "NEEDS_REVIEW"
    print("selftest PASS; python-chess", chess.__version__)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv", nargs="?")
    ap.add_argument("--threshold", type=int, default=4)
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if chess.__version__ != PINNED:
        print(f"WARNING: python-chess {chess.__version__}, pinned {PINNED}",
              file=sys.stderr)
    if a.selftest:
        return selftest()
    with open(a.csv, newline="", encoding="utf-8") as f:
        results = [check_row(r, a.threshold) for r in csv.DictReader(f)]
    for r in results:
        print(f"{r['eco']:5} {r['status']:19} agree={r['agreeing_sites']}/"
              f"{r['sites_with_line']} plies={r['plies']} {r['reason']}")
    if a.out:
        with open(a.out, "w", encoding="utf-8") as f:
            json.dump({"python_chess": chess.__version__,
                       "threshold": a.threshold, "rows": results}, f, indent=2)


if __name__ == "__main__":
    main()
