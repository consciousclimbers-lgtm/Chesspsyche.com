# Wave 1 (Families A and B) live evidence reconciliation

Source reviewed: live `main` at commit `5f95979909f35f5a8d771f584127c46aa07dab7a` (2026-10-28). The source of truth is `tools/survey-regression/results-cards.json`, with GM system labels in the clickable records in `index.html`.

## Honest status

- 70 Family A/B cards were unassigned on live `main`.
- 44 cards have been mapped to a pool whose side matches the card and whose GM profile records carry the matching system label: A11, A15, A16, A40, A47, A48, A49, A50, B01, B07, B08, B13, B14, and the 31 listed Sicilian White codes.
- The remaining 26 are listed below as needing source review. No unsupported opening-name guess was used.
- The handoff's claim of ≥15% repertoire frequency in a 2015–2026 master database is not independently verifiable from the material provided: no named dataset or game-level records were linked. These assignments use the repository's existing side-specific system records and do not assert game-rate percentages.
- The repository does not contain `scripts/generate-all-pools.js`. Its regression package is `tools/survey-regression/package.json`; its available commands include `npm test`, `npm run update:gm-baseline`, `npm run test:results-identity`, and `npm run test:eco-lines`. It has no `test:regression` script.

## One-to-one pool evidence

- 44 of the 70 unassigned Family A/B cards now have dedicated pools; the other 26 remain listed for source review.
- Each mapped card has one single-GM pool, and the 44 selected GMs are distinct and present in the repository's 244-record roster.
- Every assignment is side-matched and backed by an existing side-specific clickable GM system record or an explicit linked family-game evidence entry. 43 are supported by direct profile system labels; any family-only exception is listed in `family-repertoire-evidence.json`.
- Each new pool is explicitly labeled FAMILY ONLY and carries its exact card code. No repertoire-frequency percentages are claimed.
Each mapped card now has a dedicated one-GM pool, with a different roster GM for each of the 44 cards. Any overlapping code was removed from the previous shared pool so the card cannot be assigned twice (4 overlapping code entries removed).

## Card-by-card status

| Card key | Side | Live opening name | Disposition | Pool key / reason |
|---|---|---|---|---|
| `A00|white` | white | Polish Opening | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A01|white` | white | Nimzo-Larsen Attack | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A02|white` | white | Bird Opening | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A03|white` | white | Bird Opening: Dutch Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A04|white` | white | Zukertort Opening | Mapped | `Réti Opening|white` |
| `A05|white` | white | Zukertort Opening | Mapped | `Réti Opening|white` |
| `A06|white` | white | Zukertort Opening | Mapped | `Réti Opening|white` |
| `A07|white` | white | King's Indian Attack | Mapped | `Réti Opening|white` |
| `A08|white` | white | King's Indian Attack: Sicilian Variation | Mapped | `Réti Opening|white` |
| `A09|white` | white | Réti Opening | Mapped | `Réti Opening|white` |
| `A10|white` | white | English Opening | Mapped | `English Opening|white` |
| `A11|black` | black | English Opening: Caro-Kann Defensive System | Mapped | `A11|black` — Alireza Firouzja |
| `A12|white` | white | Réti Opening: Anglo-Slav Variation, Bogoljubow Variation | Mapped | `Réti Opening|white` |
| `A13|white` | white | English Opening: Agincourt Defense | Mapped | `English Opening|white` |
| `A14|white` | white | English Opening: Agincourt Defense, Neo-Catalan Declined | Mapped | `English Opening|white` |
| `A15|black` | black | English Opening: Anglo-Indian Defense | Mapped | `A15|black` — Samuel Sevian |
| `A16|black` | black | English Opening: Anglo-Indian Defense, Queen's Knight Variation | Mapped | `A16|black` — David Howell |
| `A17|white` | white | English Opening: Anglo-Indian Defense, Hedgehog System | Mapped | `English Opening|white` |
| `A18|white` | white | English Opening: Mikenas-Carls Variation | Mapped | `English Opening|white` |
| `A19|white` | white | English Opening: Mikenas-Carls, Sicilian | Mapped | `English Opening|white` |
| `A20|white` | white | English Opening: King's English Variation | Mapped | `English Opening|white` |
| `A21|white` | white | English Opening: King's English Variation, Reversed Sicilian | Mapped | `English Opening|white` |
| `A22|white` | white | English Opening: King's English Variation, Two Knights Variation | Mapped | `English Opening|white` |
| `A23|white` | white | English Opening: King's English Variation, Two Knights Variation, Keres Variation | Mapped | `English Opening|white` |
| `A24|white` | white | English Opening: King's English Variation, Two Knights Variation, Fianchetto Line | Mapped | `English Opening|white` |
| `A26|white` | white | English Opening: King's English Variation, Closed System, Full Symmetry | Mapped | `English Opening|white` |
| `A27|white` | white | English Opening: King's English Variation, Three Knights System | Mapped | `English Opening|white` |
| `A28|white` | white | English Opening: King's English Variation, Four Knights Variation | Mapped | `English Opening|white` |
| `A29|white` | white | English Opening: King's English Variation, Four Knights Variation, Fianchetto Line | Mapped | `English Opening|white` |
| `A40|black` | black | Queen's Pawn Game | Mapped | `A40|black` — Fabiano Caruana |
| `A41|black` | black | Queen's Pawn Game | Mapped | `Modern Defence|black` |
| `A42|black` | black | Modern Defense: Averbakh System | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A43|black` | black | Benoni Defense: Old Benoni | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A44|black` | black | Benoni Defense: Old Benoni | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A45|white` | white | Indian Defense | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A46|white` | white | Indian Defense: Knights Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A47|black` | black | Pseudo Queen's Indian Defense | Mapped | `A47|black` — Viswanathan Anand |
| `A48|black` | black | East Indian Defense | Mapped | `A48|black` — Teimour Radjabov |
| `A49|white` | white | Indian Defense: Przepiorka Variation | Mapped | `A49|white` — Richárd Rapport |
| `A50|black` | black | Indian Defense: Normal Variation | Mapped | `A50|black` — Peter Leko |
| `A51|black` | black | Indian Defense: Budapest Gambit | Mapped | `Budapest Defence|black` |
| `A52|black` | black | Indian Defense: Budapest Gambit Accepted, Main Line | Mapped | `Budapest Defence|black` |
| `A53|black` | black | Old Indian Defense | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A54|black` | black | Old Indian Defense: Ukrainian Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A55|black` | black | Old Indian Defense (Main Line) | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A56|black` | black | Benoni Defense | Mapped | `Benoni Defense|black` |
| `A57|black` | black | Benko Gambit | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A58|black` | black | Benko Gambit Accepted: Fully Accepted Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A59|black` | black | Benko Gambit Accepted: Yugoslav | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A60|black` | black | Benoni Defense: Modern Variation | Mapped | `Benoni Defense|black` |
| `A61|black` | black | Benoni Defense | Mapped | `Benoni Defense|black` |
| `A62|white` | white | Benoni Defense: Fianchetto Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A63|white` | white | Benoni Defense: Fianchetto Variation, Hastings Defense | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A64|white` | white | Benoni Defense: Fianchetto Variation, Hastings Defense, Main Line | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A65|black` | black | Benoni Defense: King's Pawn Line | Mapped | `Benoni Defense|black` |
| `A66|black` | black | Benoni Defense: Pawn Storm Variation | Mapped | `Benoni Defense|black` |
| `A67|white` | white | Benoni Defense: Taimanov Variation | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A68|white` | white | Benoni Defense: Four Pawns Attack | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A69|white` | white | Benoni Defense: Four Pawns Attack, Main Line | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A70|black` | black | Benoni Defense (Classical Variation) | Mapped | `Benoni Defense|black` |
| `A71|black` | black | Benoni Defense: Classical Variation, Averbakh-Grivas Attack | Mapped | `Benoni Defense|black` |
| `A72|black` | black | Benoni Defense: Classical Variation | Mapped | `Benoni Defense|black` |
| `A73|black` | black | Benoni Defense: Classical Variation, Main Line | Mapped | `Benoni Defense|black` |
| `A74|black` | black | Benoni Defense: Classical Variation, Full Line | Mapped | `Benoni Defense|black` |
| `A75|black` | black | Benoni Defense: Classical Variation, Argentine Counterattack | Mapped | `Benoni Defense|black` |
| `A76|black` | black | Benoni Defense: Classical Variation, Czerniak Defense | Mapped | `Benoni Defense|black` |
| `A77|black` | black | Benoni Defense: Classical Variation, Czerniak Defense, Tal Line | Mapped | `Benoni Defense|black` |
| `A78|black` | black | Benoni Defense: Classical Variation, Czerniak Defense | Mapped | `Benoni Defense|black` |
| `A79|black` | black | Benoni Defense: Classical Variation, Czerniak Defense | Mapped | `Benoni Defense|black` |
| `A80|black` | black | Dutch Defense | Mapped | `Dutch Defence|black` |
| `A81|white` | white | Dutch Defense: Fianchetto Attack | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A82|black` | black | Dutch Defense: Staunton Gambit | Mapped | `Dutch Defence|black` |
| `A83|white` | white | Dutch Defense: Staunton Gambit | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `A84|black` | black | Dutch Defense | Mapped | `Dutch Defence|black` |
| `A85|black` | black | Dutch Defense: Queen's Knight Variation | Mapped | `Dutch Defence|black` |
| `A86|black` | black | Dutch Defense: Fianchetto Variation | Mapped | `Dutch Defence|black` |
| `A87|black` | black | Dutch Defense: Leningrad Variation | Mapped | `Dutch Defence|black` |
| `A88|black` | black | Dutch Defense: Leningrad Variation, Warsaw Variation | Mapped | `Dutch Defence|black` |
| `A89|black` | black | Dutch Defense: Leningrad Variation, Matulovic Variation | Mapped | `Dutch Defence|black` |
| `A90|black` | black | Dutch Defense: Classical Variation | Mapped | `Dutch Defence|black` |
| `A91|black` | black | Dutch Defense: Classical Variation | Mapped | `Dutch Defence|black` |
| `A92|black` | black | Dutch Defense: Classical Variation | Mapped | `Dutch Defence|black` |
| `A93|black` | black | Dutch Defense: Stonewall Variation, Botvinnik Variation | Mapped | `Dutch Defence|black` |
| `A94|black` | black | Dutch Defense: Stonewall Variation | Mapped | `Dutch Defence|black` |
| `A95|black` | black | Dutch Defense: Stonewall Variation | Mapped | `Dutch Defence|black` |
| `A96|black` | black | Dutch Defense: Classical Variation | Mapped | `Dutch Defence|black` |
| `A97|black` | black | Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation | Mapped | `Dutch Defence|black` |
| `A98|black` | black | Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation, Alatortsev-Lisitsyn Line | Mapped | `Dutch Defence|black` |
| `A99|black` | black | Dutch Defense: Classical Variation, Ilyin-Zhenevsky Variation, Modern Main Line | Mapped | `Dutch Defence|black` |
| `B00|white` | white | King's Pawn Game | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `B01|black` | black | Scandinavian Defense | Mapped | `B01|black` — Ioannis Papaioannou |
| `B02|black` | black | Alekhine Defense | Mapped | `Alekhine's Defence|black` |
| `B03|white` | white | Alekhine Defense | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `B04|black` | black | Alekhine Defense: Modern Variation | Mapped | `Alekhine's Defence|black` |
| `B05|black` | black | Alekhine Defense: Modern Variation, Main Line | Mapped | `Alekhine's Defence|black` |
| `B06|black` | black | Modern Defense | Mapped | `Modern Defence|black` |
| `B07|black` | black | Pirc Defense | Mapped | `B07|black` — Volodymyr Onyshchuk |
| `B08|black` | black | Pirc Defense: Classical Variation | Mapped | `B08|black` — Tan Zhongyi |
| `B09|white` | white | Pirc Defense: Austrian Attack | Needs source review | No direct family-and-side match confirmed in the existing GM system labels |
| `B10|black` | black | Caro-Kann Defense | Mapped | `Caro-Kann Defence|black` |
| `B11|black` | black | Caro-Kann Defense: Two Knights Attack, Mindeno Variation | Mapped | `Caro-Kann Defence|black` |
| `B12|white` | white | Caro-Kann Defense | Mapped | `Caro-Kann Advance|white` |
| `B13|white` | white | Caro-Kann Defense: Exchange Variation | Mapped | `B13|white` — Javokhir Sindarov |
| `B14|white` | white | Caro-Kann Defense: Panov Attack | Mapped | `B14|white` — Ian Nepomniachtchi |
| `B15|black` | black | Caro-Kann Defense | Mapped | `Caro-Kann Defence|black` |
| `B16|black` | black | Caro-Kann Defense: Bronstein-Larsen Variation | Mapped | `Caro-Kann Defence|black` |
| `B17|black` | black | Caro-Kann Defense: Karpov Variation | Mapped | `Caro-Kann Defence|black` |
| `B18|black` | black | Caro-Kann Defense: Classical Variation | Mapped | `Caro-Kann Defence|black` |
| `B19|black` | black | Caro-Kann Defense: Classical Variation | Mapped | `Caro-Kann Defence|black` |
| `B20|black` | black | Sicilian Defense | Mapped | `Sicilian Defense|black` |
| `B21|white` | white | Sicilian Defense: McDonnell Attack | Mapped | `B21|white` — Magnus Carlsen |
| `B22|white` | white | Sicilian Defense: Alapin Variation | Mapped | `B22|white` — Hikaru Nakamura |
| `B23|white` | white | Sicilian Defense: Closed | Mapped | `B23|white` — Nodirbek Abdusattorov |
| `B24|white` | white | Sicilian Defense: Closed, Fianchetto Variation | Mapped | `B24|white` — Wesley So |
| `B25|white` | white | Sicilian Defense: Closed | Mapped | `B25|white` — R Praggnanandhaa |
| `B26|white` | white | Sicilian Defense: Closed | Mapped | `B26|white` — Wei Yi |
| `B27|black` | black | Sicilian Defense | Mapped | `Sicilian Defense|black` |
| `B28|black` | black | Sicilian Defense: O'Kelly Variation | Mapped | `Sicilian Defense|black` |
| `B29|black` | black | Sicilian Defense: Nimzowitsch Variation | Mapped | `Sicilian Defense|black` |
| `B30|black` | black | Sicilian Defense: Old Sicilian | Mapped | `Sicilian Defense|black` |
| `B31|white` | white | Sicilian Defense: Nyezhmetdinov-Rossolimo Attack, Fianchetto Variation | Mapped | `B31|white` — Anish Giri |
| `B32|black` | black | Sicilian Defense: Open | Mapped | `Sicilian Defense|black` |
| `B33|black` | black | Sicilian Defense: Open | Mapped | `Sicilian Defense|black` |
| `B34|black` | black | Sicilian Defense: Accelerated Dragon, Exchange Variation | Mapped | `Sicilian Defense|black` |
| `B35|black` | black | Sicilian Defense: Accelerated Dragon, Modern Bc4 Variation | Mapped | `Sicilian Defense|black` |
| `B36|black` | black | Sicilian Defense: Accelerated Dragon, Maróczy Bind | Mapped | `Sicilian Defense|black` |
| `B37|black` | black | Sicilian Defense: Accelerated Dragon, Maróczy Bind | Mapped | `Sicilian Defense|black` |
| `B38|black` | black | Sicilian Defense: Accelerated Dragon, Maróczy Bind | Mapped | `Sicilian Defense|black` |
| `B39|black` | black | Sicilian Defense: Accelerated Dragon, Maróczy Bind, Breyer Variation | Mapped | `Sicilian Defense|black` |
| `B40|black` | black | Sicilian Defense: French Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B41|black` | black | Sicilian Defense: Kan Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B42|black` | black | Sicilian Defense: Kan Variation, Modern Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B43|black` | black | Sicilian Defense: Kan Variation, Knight Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B44|black` | black | Sicilian Defense: Taimanov Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B45|white` | white | Sicilian Defense: Taimanov Variation | Mapped | `B45|white` — Arjun Erigaisi |
| `B46|black` | black | Sicilian Defense: Taimanov Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B47|black` | black | Sicilian Defense: Taimanov Variation, Bastrikov Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B48|white` | white | Sicilian Defense: Taimanov Variation, Bastrikov Variation, English Attack | Mapped | `B48|white` — Jan-Krzysztof Duda |
| `B49|black` | black | Sicilian Defense: Taimanov Variation, Bastrikov Variation | Mapped | `Sicilian Paulsen/Kan/Taimanov|black` |
| `B50|black` | black | Sicilian Defense: Modern Variations | Mapped | `Sicilian Defense|black` |
| `B51|white` | white | Sicilian Defense: Moscow Variation | Mapped | `B51|white` — Leinier Domínguez |
| `B52|white` | white | Sicilian Defense: Moscow Variation, Main Line | Mapped | `B52|white` — Yağız Kaan Erdoğmuş |
| `B53|black` | black | Sicilian Defense: Chekhover Variation | Mapped | `Sicilian Defense|black` |
| `B54|black` | black | Sicilian Defense: Modern Variations, Main Line | Mapped | `Sicilian Defense|black` |
| `B55|black` | black | Sicilian Defense: Prins Variation, Venice Attack | Mapped | `Sicilian Defense|black` |
| `B56|black` | black | Sicilian Defense: Classical Variation | Mapped | `Sicilian Defense|black` |
| `B57|black` | black | Sicilian Defense: Classical Variation, Sozin Attack | Mapped | `Sicilian Defense|black` |
| `B58|black` | black | Sicilian Defense: Classical Variation | Mapped | `Sicilian Defense|black` |
| `B59|black` | black | Sicilian Defense: Boleslavsky Variation | Mapped | `Sicilian Defense|black` |
| `B60|white` | white | Sicilian Defense: Richter-Rauzer Variation | Mapped | `B60|white` — Amin Tabatabaei |
| `B61|white` | white | Sicilian Defense: Richter-Rauzer Variation, Modern Variation | Mapped | `B61|white` — Levon Aronian |
| `B62|white` | white | Sicilian Defense: Richter-Rauzer Variation | Mapped | `B62|white` — Hans Niemann |
| `B63|white` | white | Sicilian Defense: Richter-Rauzer Variation, Traditional Variation | Mapped | `B63|white` — Maxime Vachier-Lagrave |
| `B64|white` | white | Sicilian Defense: Richter-Rauzer Variation, Classical Variation | Mapped | `B64|white` — Jorden Van Foreest |
| `B65|white` | white | Sicilian Defense: Richter-Rauzer Variation, Rauzer Attack | Mapped | `B65|white` — Dmitry Andreikin |
| `B66|white` | white | Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation, Early Deviations | Mapped | `B66|white` — D Gukesh |
| `B67|white` | white | Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation | Mapped | `B67|white` — Nihal Sarin |
| `B68|white` | white | Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation | Mapped | `B68|white` — Yu Yangyi |
| `B69|white` | white | Sicilian Defense: Richter-Rauzer Variation, Neo-Modern Variation, Nyezhmetdinov Attack | Mapped | `B69|white` — Veselin Topalov |
| `B70|black` | black | Sicilian Defense: Dragon Variation | Mapped | `Sicilian Dragon|black` |
| `B71|black` | black | Sicilian Defense: Dragon Variation, Levenfish Variation | Mapped | `Sicilian Dragon|black` |
| `B72|black` | black | Sicilian Defense: Dragon Variation | Mapped | `Sicilian Dragon|black` |
| `B73|black` | black | Sicilian Defense: Dragon Variation, Classical Variation | Mapped | `Sicilian Dragon|black` |
| `B74|black` | black | Sicilian Defense: Dragon Variation, Classical Variation, Normal Line | Mapped | `Sicilian Dragon|black` |
| `B75|white` | white | Sicilian Defense: Dragon Variation, Yugoslav Attack, Early Deviations | Mapped | `B75|white` — Wang Hao |
| `B76|white` | white | Sicilian Defense: Dragon Variation, Yugoslav Attack | Mapped | `B76|white` — Vladimir Fedoseev |
| `B77|black` | black | Sicilian Defense: Dragon Variation, Yugoslav Attack, Main Line | Mapped | `Sicilian Dragon|black` |
| `B78|white` | white | Sicilian Defense: Dragon Variation, Yugoslav Attack | Mapped | `B78|white` — Awonder Liang |
| `B79|white` | white | Sicilian Defense (Dragon, Yugoslav Attack, 12.h4) | Mapped | `B79|white` — Andrey Esipenko |
| `B80|black` | black | Sicilian Defense: Scheveningen Variation | Mapped | `Sicilian Defense|black` |
| `B81|white` | white | Sicilian Defense: Scheveningen Variation, Keres Attack | Mapped | `B81|white` — Aydin Suleymanli |
| `B82|black` | black | Sicilian Defense: Scheveningen Variation, Matanovic Attack | Mapped | `Sicilian Defense|black` |
| `B83|black` | black | Sicilian Defense: Scheveningen Variation, Classical Variation | Mapped | `Sicilian Defense|black` |
| `B84|black` | black | Sicilian Defense: Scheveningen Variation, Classical Variation | Mapped | `Sicilian Defense|black` |
| `B85|white` | white | Sicilian Defense: Scheveningen Variation, Classical Variation, Paulsen Variation | Mapped | `B85|white` — Chithambaram VR. Aravindh |
| `B86|white` | white | Sicilian Defense: Sozin Attack | Mapped | `B86|white` — M Pranesh |
| `B87|white` | white | Sicilian Defense: Sozin Attack, Flank Variation | Mapped | `B87|white` — Rustam Kasimdzhanov |
| `B88|white` | white | Sicilian Defense: Sozin Attack, Leonhardt Variation | Mapped | `B88|white` — Frederik Svane |
| `B89|white` | white | Sicilian Defense: Sozin Attack, Main Line | Mapped | `B89|white` — Ray Robson |
| `B90|black` | black | Sicilian Defense: Najdorf Variation | Mapped | `Sicilian Najdorf|black` |
| `B91|black` | black | Sicilian Defense: Najdorf Variation, Zagreb Variation | Mapped | `Sicilian Najdorf|black` |
| `B92|black` | black | Sicilian Defense: Najdorf Variation, Opocensky Variation | Mapped | `Sicilian Najdorf|black` |
| `B93|black` | black | Sicilian Defense: Najdorf Variation, Amsterdam Variation | Mapped | `Sicilian Najdorf|black` |
| `B94|black` | black | Sicilian Defense: Najdorf Variation | Mapped | `Sicilian Najdorf|black` |
| `B95|black` | black | Sicilian Defense: Najdorf Variation | Mapped | `Sicilian Najdorf|black` |
| `B96|black` | black | Sicilian Defense: Najdorf Variation | Mapped | `Sicilian Najdorf|black` |
| `B97|black` | black | Sicilian Defense: Najdorf Variation, Poisoned Pawn Variation | Mapped | `Sicilian Najdorf|black` |
| `B98|black` | black | Sicilian Defense: Najdorf Variation | Mapped | `Sicilian Najdorf|black` |
| `B99|black` | black | Sicilian Defense: Najdorf Variation, Main Line | Mapped | `Sicilian Najdorf|black` |

## Verification status

Static checks confirm all proposed card sides match pool sides, all new codes exist in the survey card set, and all new pool entries have an existing GM ID, profile URL, and matching system label. Local regression and browser tests have not been run. GitHub Actions on the draft PR must confirm runtime behavior; no green status is claimed in advance.
