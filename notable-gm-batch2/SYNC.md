# Notable GM Batch 2: synchronized with the GM records

Owner decision on PR #23 (2026-10-21): the GM records behind the clickable GM pop-up are the source of truth, and a Notable GM entry should reuse them instead of keeping its own evidence. This file shows how each Batch 2 entry was traced. It replaces the snippet-based EVIDENCE.md, RECHECK.md and SELECTION.md from the earlier draft; those are still in this PR's history at commit `9ee6f77`.

## Rule
- **Identity:** each Batch 2 entry stores the GM's FIDE `id`. That `id` must give a GM record with exactly the same name. No fuzzy name matching is used; all 38 entries matched exactly.
- **Support:** each Batch 2 pool lists `recordLabels`, the GM-record `system` labels that name this opening, and `familyLabels`, the broader family labels. Each entry falls into one of four classes:
  - **DIRECT:** the record's `system` for the pool's side lists a `recordLabels` entry. Only DIRECT entries may be `verified`, and so shown on the site.
  - **FAMILY ONLY:** the record lists only a broader family, such as "Ruy Lopez" for the Berlin. The pool's claim is more specific than the record, so it needs one targeted check before it can be shown.
  - **NOT ON CARD:** the record lists neither. This is a real gap, and the entry needs its own evidence.
  - **NO SYSTEM:** the record has no system for that side.
- **No percentage threshold** is applied. The record's `system` is the GM's top three opening families, so appearing there already means frequent use.
- **Enforced by `npm test`:** a verified entry that is not DIRECT, or whose `id` and name disagree, fails. `npm run report:gm-sync` prints the current mapping.
- A pool with no DIRECT entry is left out of `index.html`, because a pool with nothing to show would only change the card from "none approved" to the same thing.

## All 38 Batch 2 entries from the earlier draft (head 9ee6f77), against the GM records on main 3949b7d
| Pool | GM | FIDE id | Old status | GM record system (this side) | Class | Draft status |
|---|---|---|---|---|---|---|
| Sicilian Najdorf|black | Bobby Fischer | 600041 | verified | King's Indian / Sicilian Najdorf / Grunfeld | DIRECT | verified |
| Sicilian Najdorf|black | Maxime Vachier-Lagrave | 623539 | verified | Sicilian / Grunfeld / Sicilian Najdorf | DIRECT | verified |
| Sicilian Najdorf|black | Boris Gelfand | 2805677 | verified | Sicilian / Sicilian Najdorf / Semi-Slav | DIRECT | verified |
| Sicilian Najdorf|black | Veselin Topalov | 2900084 | verified | Sicilian / Ruy Lopez / Sicilian Najdorf | DIRECT | verified |
| Sicilian Najdorf|black | Viswanathan Anand | 5000017 | pending | Sicilian / Ruy Lopez / Queen's Indian | FAMILY ONLY | pending |
| Sicilian Najdorf|black | Ian Nepomniachtchi | 4168119 | verified | Sicilian / Grunfeld / Sicilian Najdorf | DIRECT | verified |
| Sicilian Dragon|black | Gawain C B Maroroa Jones | 409561 | verified | King's Indian / Sicilian / Sicilian Dragon | DIRECT | verified |
| Sicilian Dragon|black | Hikaru Nakamura | 2016192 | pending | Sicilian / Ruy Lopez / Queen's Gambit Declined | FAMILY ONLY | pending |
| Grünfeld Defence|black | Maxime Vachier-Lagrave | 623539 | verified | Sicilian / Grunfeld / Sicilian Najdorf | DIRECT | verified |
| Grünfeld Defence|black | Bobby Fischer | 600041 | verified | King's Indian / Sicilian Najdorf / Grunfeld | DIRECT | verified |
| Grünfeld Defence|black | Peter Leko | 703303 | verified | Sicilian / Ruy Lopez / Queen's Indian | NOT ON CARD | pending |
| Grünfeld Defence|black | Loek Van Wely | 1000268 | pending | Sicilian / King's Indian / Sicilian Scheveningen | NOT ON CARD | pending |
| Grünfeld Defence|black | Gata Kamsky | 2000024 | pending | Slav / Sicilian / Ruy Lopez | NOT ON CARD | pending |
| Berlin Defence|black | Levon Aronian | 13300474 | verified | Ruy Lopez / Queen's Gambit Declined / Sicilian | FAMILY ONLY | not in draft |
| Berlin Defence|black | Ian Nepomniachtchi | 4168119 | pending | Sicilian / Grunfeld / Sicilian Najdorf | NOT ON CARD | not in draft |
| Marshall Attack|black | Levon Aronian | 13300474 | verified | Ruy Lopez / Queen's Gambit Declined / Sicilian | FAMILY ONLY | not in draft |
| Marshall Attack|black | Ding Liren | 8603677 | verified | Ruy Lopez / King's Indian / Queen's Pawn Game | FAMILY ONLY | not in draft |
| Marshall Attack|black | Boris Spassky | 600057 | verified | King's Indian / Sicilian / Queen's Gambit Declined | NOT ON CARD | not in draft |
| Marshall Attack|black | Michael Adams | 400041 | verified | Ruy Lopez / Ruy Lopez, Closed / Nimzo Indian | FAMILY ONLY | not in draft |
| Marshall Attack|black | Peter Leko | 703303 | pending | Sicilian / Ruy Lopez / Queen's Indian | FAMILY ONLY | not in draft |
| Semi-Slav Defence|black | Viswanathan Anand | 5000017 | verified | Sicilian / Ruy Lopez / Queen's Indian | NOT ON CARD | not in draft |
| Semi-Slav Defence|black | Alexei Shirov | 2209390 | pending | Sicilian / Slav / Ruy Lopez | FAMILY ONLY | not in draft |
| Semi-Slav Defence|black | Veselin Topalov | 2900084 | pending | Sicilian / Ruy Lopez / Sicilian Najdorf | NOT ON CARD | not in draft |
| French Winawer|black | Alexander Morozevich | 4116992 | pending | French Defense / Sicilian / Slav | FAMILY ONLY | not in draft |
| French Winawer|black | Wesley So | 5202213 | pending | Ruy Lopez / Sicilian / Queen's Pawn Game | NOT ON CARD | not in draft |
| French Winawer|black | Ian Nepomniachtchi | 4168119 | verified | Sicilian / Grunfeld / Sicilian Najdorf | NOT ON CARD | not in draft |
| English Opening|white | Magnus Carlsen | 1503014 | pending | A wide range of openings: most often 1.e4 or 1.d4, then 1.c4 and 1.Nf3 | NOT ON CARD (broad text) | not in draft |
| English Opening|white | Ding Liren | 8603677 | verified | Queen's Gambit Declined / King's Indian / Slav | NOT ON CARD | not in draft |
| Nimzowitsch-Larsen Attack|white | Richárd Rapport | 738590 | verified | Sicilian / Queen's Pawn Game / King's Indian Attack | NOT ON CARD | not in draft |
| Nimzowitsch-Larsen Attack|white | Wesley So | 5202213 | verified | Sicilian / Ruy Lopez / Giuoco Piano | NOT ON CARD | not in draft |
| London System|white | Gata Kamsky | 2000024 | verified | Queen's Pawn Game / Sicilian / Ruy Lopez | FAMILY ONLY | not in draft |
| London System|white | Magnus Carlsen | 1503014 | verified | A wide range of openings: most often 1.e4 or 1.d4, then 1.c4 and 1.Nf3 | NOT ON CARD (broad text) | not in draft |
| London System|white | Levon Aronian | 13300474 | pending | Sicilian / Queen's Pawn Game / English | FAMILY ONLY | not in draft |
| London System|white | Alexander Grischuk | 4126025 | pending | Sicilian / Ruy Lopez / French Defense | NOT ON CARD | not in draft |
| Grünfeld Exchange|white | Boris Gelfand | 2805677 | verified | Slav / Catalan / Queen's Indian | NOT ON CARD | not in draft |
| Grünfeld Exchange|white | Viswanathan Anand | 5000017 | pending | Sicilian / Ruy Lopez / Ruy Lopez, Closed | NOT ON CARD | not in draft |
| Two Knights / Fried Liver|white | Nigel Short | 400025 | verified | Sicilian / Ruy Lopez / French Defense | NOT ON CARD | not in draft |
| Two Knights / Fried Liver|white | Alexander Morozevich | 4116992 | verified | Sicilian / Ruy Lopez / French Defense | NOT ON CARD | not in draft |

**Summary:** 24 entries were `verified` in the earlier draft. In this draft:
- **8 are DIRECT** and stay verified, in 3 pools:
  - Najdorf: Fischer, Vachier-Lagrave, Gelfand, Topalov and Nepomniachtchi.
  - Dragon: Gawain Jones.
  - Grünfeld: Vachier-Lagrave and Fischer.
- **5 are FAMILY ONLY** (Aronian in the Berlin; Aronian, Ding Liren and Adams in the Marshall; Kamsky in the London). Each needs one targeted check.
- **11 are NOT ON CARD** and are gaps:
  - Leko (Grünfeld);
  - Spassky (Marshall);
  - Anand (Semi-Slav);
  - Nepomniachtchi (Winawer);
  - Ding Liren (English);
  - Rapport and So (Nimzowitsch-Larsen);
  - Carlsen (London);
  - Gelfand (Grünfeld Exchange);
  - Short and Morozevich (Two Knights 4.Ng5).

The 14 earlier `pending` entries stay pending. The 9 pending entries recorded only in the earlier EVIDENCE.md (Scheveningen, Classical Sicilian and Vienna) were not re-mapped.

## Exceptions and notes
- **Carlsen, White:** his record has two `system` keys. The page keeps the second one, "A wide range of openings: most often 1.e4 or 1.d4, then 1.c4 and 1.Nf3", which names no opening. The first, overridden key lists "Queen's Pawn Game". So the record does not support "London System" either way; at most, the overridden key supports the family.
- **Duplicate `system` keys in GM records** (GM-card data; a proposed fix only, not changed here):
  - Magnus Carlsen: his Black system is lost, so the pop-up has none.
  - Aleksandra Goryachkina: the second key replaces her label-style system.
  - Anna Muzychuk: the second key has no White system.
- **Labels that differ by spelling** in the records are treated as the same: "Grunfeld" and "Grünfeld"; "French Defense" and "French"; "Sicilian" and "Sicilian Defense".
- **The Two Knights pool's label**, "Fried Liver", was wrong for C58 and C59. The pool is not in this draft, so nothing is renamed.

## GM records that directly support a dropped pool (candidates, not added)
These records already list the opening, so adding them would need no outside research. The owner decides whether to add them.
- **English Opening, White:** Vincent Keymer, Levon Aronian, Vladislav Artemiev, Parham Maghsoodloo, Harika Dronavalli, Zhao Xue, Nana Dzagnidze, Bibisara Assaubayeva, and others (27 records in all).
- **London System, White:** Leon Luke Mendonca, Ma Qun.
- **Semi-Slav, Black:** Boris Gelfand, Ray Robson, Robert Hovhannisyan, Mariya Muzychuk, Vaclav Finek, Miguel Illescas Cordoba.
- **No record label exists** for the Berlin, Marshall, Winawer, Nimzowitsch-Larsen, Grünfeld Exchange or Two Knights. These need targeted evidence or stay empty.

## Coverage
The count covers reachable Results cards whose (code, side) is in a pool with at least one verified entry. It is taken from `results-cards.json`, which lists all 487 cards the survey can reach.

| | Cards with a GM |
|---|---|
| Main 3949b7d | 147 of 487 |
| This draft | 185 of 487 (+38: 10 Najdorf, 6 Dragon, 22 Grünfeld) |
| Earlier draft 9ee6f77, for reference | 226 of 487, counted on base 3e27fc5 |

`gm-baseline.json`: 9 card slots that showed no GM now show one. No slot that already showed a GM changed.
