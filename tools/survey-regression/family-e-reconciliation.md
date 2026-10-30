# Family E live reconciliation

Source reviewed: live `main` at commit `5f95979909f35f5a8d771f584127c46aa07dab7a` (2026-10-28). This report uses the repository's `results-cards.json` identities and the exact side-specific `system` labels in `rawGrandmastersList` within `index.html`. It does not claim game-count rates. The submitted aggregate percentages did not identify a database or provide per-game records, so those figures were not used.

## Outcome

- 38 live Family E cards were unassigned before this change.
- 36 were mapped by exact family and side match against existing clickable GM profile system labels.
- All three broad discovery pools are marked `matchScope: "FAMILY ONLY"`; each now contains at most five distinct GMs.
- 2 remain unassigned for source review: `E10|black` (Anti-Nimzo-Indian) and `E11|black` (Bogo-Indian). No exact Black-side profile-system label in the reviewed records supported either mapping.
- Each mapped pool entry retains the GM's existing record ID and linked profile URL. Every code matches its pool side.

## Pool evidence

- Catalan|black: E02, E03, E04, E05 — 1 distinct verified GM.
- Nimzo-Indian Defence|white: E24, E25, E26, E27, E28, E29 — 5 distinct verified GMs.
- King's Indian Defence|white: E62, E63, E64, E65, E66, E68, E69, E71, E72, E73, E74, E75, E76, E77, E78, E79, E80, E81, E82, E83, E84, E85, E86, E87, E88, E89 — 5 distinct verified GMs.

Each retained GM and profile URL is in `index.html` under `NOTABLE_GM_POOLS`; each `recordLabels` value matches the GM profile's system label for that pool's side. The pool rotates across these small sets as a FAMILY ONLY discovery list. It does not claim that every GM specializes in each individual variation or claim a repertoire percentage.

## Card-by-card disposition

| Card key | Side | Live opening name | Disposition | Pool key / reason |
|---|---|---|---|---|
| `E00|white` | white | Catalan Opening | Mapped | `Catalan|white` |
| `E01|white` | white | Catalan Opening: Open Defense | Mapped | `Catalan|white` |
| `E02|black` | black | Catalan Opening: Open Defense | Mapped | `Catalan|black` |
| `E03|black` | black | Catalan Opening: Open Defense | Mapped | `Catalan|black` |
| `E04|black` | black | Catalan Opening: Open Defense | Mapped | `Catalan|black` |
| `E05|black` | black | Catalan Opening: Open Defense, Classical Line | Mapped | `Catalan|black` |
| `E06|white` | white | Catalan Opening: Closed | Mapped | `Catalan|white` |
| `E07|white` | white | Catalan Opening: Closed | Mapped | `Catalan|white` |
| `E08|white` | white | Catalan Opening: Closed | Mapped | `Catalan|white` |
| `E09|white` | white | Catalan Opening: Closed, Main Line | Mapped | `Catalan|white` |
| `E10|black` | black | Indian Defense: Anti-Nimzo-Indian | Unassigned | Exact side-matched profile-system evidence not confirmed |
| `E11|black` | black | Bogo-Indian Defense | Unassigned | Exact side-matched profile-system evidence not confirmed |
| `E12|black` | black | Queen's Indian Defense | Mapped | `Queen's Indian Defence|black` |
| `E13|black` | black | Queen's Indian Defense: Kasparov Variation | Mapped | `Queen's Indian Defence|black` |
| `E14|black` | black | Queen's Indian Defense: Spassky System | Mapped | `Queen's Indian Defence|black` |
| `E15|black` | black | Queen's Indian Defense: Fianchetto Variation | Mapped | `Queen's Indian Defence|black` |
| `E16|black` | black | Queen's Indian Defense: Capablanca Variation | Mapped | `Queen's Indian Defence|black` |
| `E17|black` | black | Queen's Indian Defense: Traditional Variation | Mapped | `Queen's Indian Defence|black` |
| `E18|black` | black | Queen's Indian Defense: Classical Variation, Traditional Variation | Mapped | `Queen's Indian Defence|black` |
| `E19|black` | black | Queen's Indian Defense: Classical Variation, Traditional Variation, Main Line | Mapped | `Queen's Indian Defence|black` |
| `E20|black` | black | Nimzo-Indian Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E21|black` | black | Nimzo-Indian Defense: Three Knights Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E22|black` | black | Nimzo-Indian Defense: Spielmann Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E23|black` | black | Nimzo-Indian Defense: Spielmann Variation, Romanovsky Gambit | Mapped | `Nimzo-Indian Defence|black` |
| `E24|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E25|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E26|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E27|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E28|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E29|white` | white | Nimzo-Indian Defense: Sämisch Variation | Mapped | `Nimzo-Indian Defence|white` |
| `E30|black` | black | Nimzo-Indian Defense: Leningrad Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E31|black` | black | Nimzo-Indian Defense: Leningrad Variation, Benoni Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E32|black` | black | Nimzo-Indian Defense: Classical Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E33|black` | black | Nimzo-Indian Defense: Classical Variation, Zurich Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E34|black` | black | Nimzo-Indian Defense: Classical Variation, Noa Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E35|black` | black | Nimzo-Indian Defense: Classical Variation, Noa Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E36|black` | black | Nimzo-Indian Defense: Classical Variation, Noa Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E37|black` | black | Nimzo-Indian Defense: Classical Variation, Noa Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E38|black` | black | Nimzo-Indian Defense: Classical Variation, Berlin Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E39|black` | black | Nimzo-Indian Defense: Classical Variation, Berlin Variation, Pirc Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E40|black` | black | Nimzo-Indian Defense: Rubinstein System | Mapped | `Nimzo-Indian Defence|black` |
| `E41|black` | black | Nimzo-Indian Defense: Rubinstein System | Mapped | `Nimzo-Indian Defence|black` |
| `E42|black` | black | Nimzo-Indian Defense: Rubinstein System, Rubinstein Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E43|black` | black | Nimzo-Indian Defense: St. Petersburg Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E44|black` | black | Nimzo-Indian Defense: St. Petersburg Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E45|black` | black | Nimzo-Indian Defense: St. Petersburg Variation, Fischer Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E46|black` | black | Nimzo-Indian Defense: Normal Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E47|black` | black | Nimzo-Indian Defense: Normal Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E48|black` | black | Nimzo-Indian Defense: Normal Variation, Classical Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E49|black` | black | Nimzo-Indian Defense: Normal Variation, Botvinnik System | Mapped | `Nimzo-Indian Defence|black` |
| `E50|black` | black | Nimzo-Indian Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E51|black` | black | Nimzo-Indian Defense: Normal Variation, Ragozin Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E52|black` | black | Nimzo-Indian Defense: Normal Variation, Schlechter Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E53|black` | black | Nimzo-Indian Defense: Normal Variation, Gligoric System | Mapped | `Nimzo-Indian Defence|black` |
| `E54|black` | black | Nimzo-Indian Defense: Normal Variation, Gligoric System, Exchange Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E55|black` | black | Nimzo-Indian Defense: Normal Variation, Gligoric System, Bronstein Variation | Mapped | `Nimzo-Indian Defence|black` |
| `E56|black` | black | Nimzo-Indian Defense: Normal Variation, Gligoric System, Bernstein Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E57|black` | black | Nimzo-Indian Defense: Normal Variation, Gligoric System, Bernstein Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E58|black` | black | Nimzo-Indian Defense: Normal Variation, Bernstein Defense, Exchange Line | Mapped | `Nimzo-Indian Defence|black` |
| `E59|black` | black | Nimzo-Indian Defense: Normal Variation, Bernstein Defense | Mapped | `Nimzo-Indian Defence|black` |
| `E60|black` | black | Indian Defense: West Indian Defense | Mapped | `King's Indian Defence|black` |
| `E61|black` | black | King's Indian Defense | Mapped | `King's Indian Defence|black` |
| `E62|white` | white | King's Indian Defense: Fianchetto Variation, Delayed Fianchetto | Mapped | `King's Indian Defence|white` |
| `E63|white` | white | King's Indian Defense: Fianchetto Variation, Panno Variation | Mapped | `King's Indian Defence|white` |
| `E64|white` | white | King's Indian Defense: Fianchetto Variation, Yugoslav System | Mapped | `King's Indian Defence|white` |
| `E65|white` | white | King's Indian Defense: Fianchetto Variation, Yugoslav Variation | Mapped | `King's Indian Defence|white` |
| `E66|white` | white | King's Indian Defense: Fianchetto Variation, Yugoslav Variation, Advance Line | Mapped | `King's Indian Defence|white` |
| `E67|black` | black | King's Indian Defense: Fianchetto Variation, Debrecen Defense | Mapped | `King's Indian Defence|black` |
| `E68|white` | white | King's Indian Defense: Fianchetto Variation, Classical Variation | Mapped | `King's Indian Defence|white` |
| `E69|white` | white | King's Indian Defense: Fianchetto Variation, Classical Main Line | Mapped | `King's Indian Defence|white` |
| `E70|black` | black | King's Indian Defense: Normal Variation | Mapped | `King's Indian Defence|black` |
| `E71|white` | white | King's Indian Defense: Makogonov Variation | Mapped | `King's Indian Defence|white` |
| `E72|white` | white | King's Indian Defense: Normal Variation, Deferred Fianchetto | Mapped | `King's Indian Defence|white` |
| `E73|white` | white | King's Indian Defense: Normal Variation, Standard Development | Mapped | `King's Indian Defence|white` |
| `E74|white` | white | King's Indian Defense: Averbakh Variation, Benoni Defense | Mapped | `King's Indian Defence|white` |
| `E75|white` | white | King's Indian Defense: Averbakh Variation, Main Line | Mapped | `King's Indian Defence|white` |
| `E76|white` | white | King's Indian Defense: Four Pawns Attack | Mapped | `King's Indian Defence|white` |
| `E77|white` | white | King's Indian Defense (Four Pawns Attack, 6.Be2) | Mapped | `King's Indian Defence|white` |
| `E78|white` | white | King's Indian Defense: Four Pawns Attack, Fluid Attack | Mapped | `King's Indian Defence|white` |
| `E79|white` | white | King's Indian Defense: Four Pawns Attack, Exchange Variation | Mapped | `King's Indian Defence|white` |
| `E80|white` | white | King's Indian Defense: Sämisch Variation | Mapped | `King's Indian Defence|white` |
| `E81|white` | white | King's Indian Defense: Sämisch Variation, Normal Defense | Mapped | `King's Indian Defence|white` |
| `E82|white` | white | King's Indian Defense: Sämisch Variation, Double Fianchetto | Mapped | `King's Indian Defence|white` |
| `E83|white` | white | King's Indian Defense: Sämisch Variation, Yates Defense | Mapped | `King's Indian Defence|white` |
| `E84|white` | white | King's Indian Defense: Sämisch Variation, Panno Main Line | Mapped | `King's Indian Defence|white` |
| `E85|white` | white | King's Indian Defense: Sämisch Variation, Orthodox Variation | Mapped | `King's Indian Defence|white` |
| `E86|white` | white | King's Indian Defense: Sämisch Variation | Mapped | `King's Indian Defence|white` |
| `E87|white` | white | King's Indian Defense: Sämisch Variation, Closed Variation | Mapped | `King's Indian Defence|white` |
| `E88|white` | white | King's Indian Defense: Sämisch Variation, Closed Variation | Mapped | `King's Indian Defence|white` |
| `E89|white` | white | King's Indian Defense: Sämisch Variation, Closed Variation, Main Line | Mapped | `King's Indian Defence|white` |
| `E90|black` | black | King's Indian Defense: Normal Variation, Rare Defenses | Mapped | `King's Indian Defence|black` |
| `E91|black` | black | King's Indian Defense: Orthodox Variation | Mapped | `King's Indian Defence|black` |
| `E92|black` | black | King's Indian Defense: Orthodox Variation | Mapped | `King's Indian Defence|black` |
| `E93|black` | black | King's Indian Defense: Petrosian Variation, Normal Defense | Mapped | `King's Indian Defence|black` |
| `E94|black` | black | King's Indian Defense: Orthodox Variation | Mapped | `King's Indian Defence|black` |
| `E95|black` | black | King's Indian Defense: Orthodox Variation | Mapped | `King's Indian Defence|black` |
| `E96|black` | black | King's Indian Defense: Orthodox Variation, Positional Defense, Main Line | Mapped | `King's Indian Defence|black` |
| `E97|black` | black | King's Indian Defense: Orthodox Variation, Aronin-Taimanov Defense | Mapped | `King's Indian Defence|black` |
| `E98|black` | black | King's Indian Defense: Orthodox Variation, Classical System | Mapped | `King's Indian Defence|black` |
| `E99|black` | black | King's Indian Defense: Orthodox Variation, Classical System, Traditional Line | Mapped | `King's Indian Defence|black` |

## Data limitations and verification

The supplied Family E summary mislabels E24–E29 as Queen's Indian/Catalan; the live cards identify those as Nimzo-Indian Sämisch positions. Its group percentages are not independently reproducible from the cited material. No such percentages are represented here.

Side-invariance and female-GM pool registry synchronization are applied in the proposed data. Local audit, regression, browser, and snapshot commands have not been run; GitHub Actions on the draft PR must provide those results. No successful test status is claimed in advance.
