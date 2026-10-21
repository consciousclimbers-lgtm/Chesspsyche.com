# Batch 2 GM pools — evidence audit

- PR: [#23 — Notable GM pools, Batch 2](https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/23)
- Audited branch head at time of review: `17c3fee9bad182791a47d6a0e6ae3188601c6aa8`
- Scope: review the 15 proposed pools (47 entries) and the citations supplied in `index.html`.
- Status: **audit in progress; this file does not certify the 47 entries as verified**.

## Why this file exists

The PR description names this path as the home of the per-GM reasoning, sources, and candidates left out, but the file was absent from the PR branch. This document restores a transparent audit trail. It distinguishes (1) the URL currently attached to an entry, (2) what that URL appears intended to support, and (3) whether the available evidence is enough to substantiate the exact player + opening/variation + side.

A valid candidate needs evidence for the **named GM playing the relevant opening as the side in this pool**, preferably a searchable game record/PGN with opponent, event/date, moves and ECO/position, or a reputable repertoire/game source that directly documents that association. A general opening article, player biography, broad book listing, or URL shared by several players is not by itself sufficient. A source must be opened and checked; a plausible URL is not proof. Do not infer specialist status from one isolated game.

## Audit result at a glance

- **47 proposed entries** across 15 pools were found in the PR diff.
- The code marks all 47 as `status: "verified"`, but the links supplied in the code are mostly broad opening pages, book/product pages, or general player pages. The PR itself says its evidence came from web-search text because the sandbox could not open chess sites.
- In this review, I have not independently confirmed 47 player-specific, side-specific game records. Therefore, **all 47 remain pending evidence review**. This is not a claim that the players never played these openings; it means the PR's current citations do not yet let this reviewer verify every exact association.
- The candidates-left-out list and per-candidate selection rationale described in the PR body were not included in the branch. I cannot reconstruct excluded candidates or claim that the six-pool cap/family threshold was applied correctly without that record.

## Pool-by-pool evidence register

The source URLs below are reproduced from the candidate records in the PR. They are **submitted citations**, not endorsements. “Pending” means the exact GM + opening + side has not been verified from the linked source in this audit.

### Black pools

#### Sicilian Najdorf — Black — B90–B99
| Candidate | Submitted source | Audit |
|---|---|---|
| Bobby Fischer | [Wikipedia: Najdorf Variation](https://en.wikipedia.org/wiki/Sicilian_Defence,_Najdorf_Variation) | Pending. The article identifies Fischer as a notable Najdorf player and lists notable games, but the specific game/side should be recorded explicitly in the evidence. |
| Maxime Vachier-Lagrave | [Wikipedia: Najdorf Variation](https://en.wikipedia.org/wiki/Sicilian_Defence,_Najdorf_Variation) | Pending. Opening-level association is plausible; record a Black-side game or repertoire evidence. |
| Boris Gelfand | [My Most Memorable Games — book listing](https://reado.app/en/book/my-most-memorable-games-boris-gelfand/9783283004538) | Insufficient as cited: a book listing does not identify a Najdorf game or side. |
| Veselin Topalov | [ChessBase: Najdorf article](https://en.chessbase.com/newsroom/post/robert-ris-fast-and-furious-najdorf-be3-ng4) | Pending. The URL's title/topic does not by itself establish a Topalov Black-side game. |
| Viswanathan Anand | [Playing the Najdorf — product listing](https://www.caissa-chess.com/openings/1402-david-vigorito-playing-the-najdorf-k-5747-9781907982651.html) | Insufficient as cited: product page; verify the GM's relevant Black-side record. |
| Ian Nepomniachtchi | [ChessBase: The Complex Najdorf](https://en.chessbase.com/newsroom/post/victor-bologan-the-complex-najdorf) | Pending. The article must explicitly document Nepomniachtchi's relevant play; the URL alone does not show it. |

Independent contextual leads (not a substitute for a game record): [ChessLab Academy Najdorf guide](https://chesslab.academy/openings/sicilian-najdorf/) describes the Najdorf as Black's B90–B99 system and names Fischer and Vachier-Lagrave; [Famous Najdorf games](https://chesslab.academy/openings/sicilian-najdorf/master-games/) gives an identifiable Fischer–Najdorf game. These support the opening context, but do not validate all six entries.

#### Sicilian Dragon — Black — B70–B77 subset
| Candidate | Submitted source | Audit |
|---|---|---|
| Gawain C. B. Maroroa Jones | [GM Repertoire: The Dragon, Vol. 1](https://www.newinchess.com/gm-repertoire-the-dragon-vol-1) | Pending. Verify that the book specifically documents Jones as a Dragon player, not merely author/subject or GM. |
| Hikaru Nakamura | [Chess.com: The Fighting Dragon](https://www.chess.com/lessons/the-fighting-dragon) | Pending. Lesson topic alone does not prove Nakamura's own Black-side game record. |

#### Sicilian Scheveningen — Black — B80–B84 subset
| Candidate | Submitted source | Audit |
|---|---|---|
| Veselin Topalov | [Older Wikipedia mirror: Scheveningen](https://wikipedia.classicistranieri.com/en/articles/s/i/c/Sicilian_Defence%2C_Scheveningen_Variation_7cff.html) | Insufficient as cited: general opening page; player-specific game and side not identified. |
| Boris Gelfand | [Older Wikipedia mirror: Scheveningen](https://wikipedia.classicistranieri.com/en/articles/s/i/c/Sicilian_Defence%2C_Scheveningen_Variation_7cff.html) | Insufficient as cited: general opening page; player-specific game and side not identified. |
| Hou Yifan | [Chessgames player profile](https://www.chessgames.com/perl/chessplayer?pid=95916) | Insufficient as cited: general player page, no specific Scheveningen Black-side record supplied. |
| Sergei Movsesian | [ChessBase: Ftacnik DVD](https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik) | Pending. Verify that the article directly identifies Movsesian's relevant Black-side Scheveningen games. |

#### Sicilian Classical — Black — B56–B59 subset
| Candidate | Submitted source | Audit |
|---|---|---|
| Viswanathan Anand | [The Classical Sicilian — product listing](https://www.scacco.it/it/prod/the-classical-sicilian-chess-explained) | Insufficient as cited: product page; no specific Anand game/side identified. |
| Alexei Shirov | [The Classical Sicilian — product listing](https://www.scacco.it/it/prod/the-classical-sicilian-chess-explained) | Insufficient as cited: product page; no specific Shirov game/side identified. |

#### Grünfeld Defence — Black — listed D71–D98 codes
| Candidate | Submitted source | Audit |
|---|---|---|
| Maxime Vachier-Lagrave | [Chess.com: Riga Grand Prix report](https://chess.com/news/view/riga-grand-prix-mamedyarov-vachier-lagrave-to-play-in-the-final) | Pending. Report URL alone does not establish a Grünfeld Black-side game. |
| Bobby Fischer | [Wikipedia: Grünfeld Defence](https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence) | Pending. Opening article may discuss Fischer; record the specific Black-side game(s). |
| Peter Leko | [Wikipedia: Grünfeld Defence](https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence) | Insufficient as cited: general opening article; no exact Leko game identified. |
| Loek van Wely | [Wikipedia: Grünfeld Defence](https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence) | Insufficient as cited: general opening article; no exact van Wely game identified. |
| Gata Kamsky | [Wikipedia: Grünfeld Defence](https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence) | Insufficient as cited: general opening article; no exact Kamsky game identified. |

#### Berlin Defence — Black — C65–C67
| Candidate | Submitted source | Audit |
|---|---|---|
| Levon Aronian | [ChessBase: Berlin Wall explained](https://en.chessbase.com/newsroom/post/victor-bologan-the-berlin-wall-explained) | Pending. Verify a specific Aronian Black-side Berlin game or direct repertoire source. |
| Ian Nepomniachtchi | [Wikipedia: Berlin Defence](https://en.wikipedia.org/wiki/Berlin_Defence) | Insufficient as cited: general opening page; no exact Nepomniachtchi game identified. |

#### Marshall Attack — Black — C89
| Candidate | Submitted source | Audit |
|---|---|---|
| Levon Aronian | [Wikipedia: Marshall Attack](https://en.wikipedia.org/wiki/Marshall_Attack) | Pending. Record a specific Black-side Marshall game. |
| Ding Liren | [Wikipedia: Marshall Attack](https://en.wikipedia.org/wiki/Marshall_Attack) | Pending. Record a specific Black-side Marshall game. |
| Boris Spassky | [Thinkers Publishing page](https://thinkerspublishing.com/?p=2406) | Insufficient as cited: generic product page does not establish a Spassky Marshall game. |
| Michael Adams | [Chess.com: Ruy Lopez Marshall Attack lesson](https://www.chess.com/lessons/learn-the-ruy-lopez-marshall-attack) | Pending. Lesson topic does not by itself establish an Adams Black-side game. |
| Peter Leko | [Thinkers Publishing page](https://thinkerspublishing.com/?p=2406) | Insufficient as cited: generic product page does not establish a Leko Marshall game. |

#### Semi-Slav Defence — Black — D43–D49
| Candidate | Submitted source | Audit |
|---|---|---|
| Viswanathan Anand | [The Sharp Semi-Slav](https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/) | Pending. Verify a specific Anand Black-side Semi-Slav game. |
| Alexei Shirov | [The Sharp Semi-Slav](https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/) | Pending. A separate game archive contains a Shirov Semi-Slav game as Black, but the exact ECO/variation should be checked against this pool before approval. |
| Veselin Topalov | [The Sharp Semi-Slav](https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/) | Pending. Verify a specific Topalov Black-side Semi-Slav game. |

#### French Winawer — Black — C15–C19
| Candidate | Submitted source | Audit |
|---|---|---|
| Alexander Morozevich | [French Winawer — book listing](https://www.powells.com/book/french-winawer-9780713485240) | Insufficient as cited: book listing does not establish Morozevich's Black-side record. |
| Wesley So | [New In Chess PDF](https://www.newinchess.com/media/wysiwyg/product_pdf/89042.pdf) | Pending. Open and identify the exact relevant games and side. |
| Ian Nepomniachtchi | [New In Chess PDF](https://www.newinchess.com/media/wysiwyg/product_pdf/89042.pdf) | Pending. Open and identify the exact relevant games and side. |

### White pools

#### English Opening — White — A10–A39 listed codes
| Candidate | Submitted source | Audit |
|---|---|---|
| Magnus Carlsen | [Chess.com: Learn the English Opening](https://www.chess.com/el/lessons/learn-the-english-opening) | Pending. Lesson title alone does not establish a Carlsen White-side game record. |
| Ding Liren | [Wikipedia: English Opening](https://en.wikipedia.org/wiki/English_Opening) | Insufficient as cited: general opening article; no exact Ding game identified. |

#### Vienna Game — White — C25–C29
| Candidate | Submitted source | Audit |
|---|---|---|
| Nigel Short | [Vienna Game — product listing](https://chess.co.uk/products/vienna-game-lane) | Insufficient as cited: product page does not establish Short's White-side Vienna record. |
| Michael Adams | [Vienna Game — product listing](https://chess.co.uk/products/vienna-game-lane) | Insufficient as cited: product page does not establish Adams's White-side Vienna record. |
| Boris Spassky | [Vienna Game — product listing](https://chess.co.uk/products/vienna-game-lane) | Insufficient as cited: product page does not establish Spassky's White-side Vienna record. |

#### Nimzowitsch–Larsen Attack — White — A01
| Candidate | Submitted source | Audit |
|---|---|---|
| Richárd Rapport | [Chess.com player profile](https://www.chess.com/players/Richard-Rapport) | Partial supporting lead: profile lists Nimzowitsch–Larsen games as White; attach an exact game/PGN before approving. |
| Wesley So | [ChessBase: Wesley So — My Secret Weapon](https://shop.chessbase.com/en/products/wesley_so_my_secret_weapon_1b3) | Insufficient as cited: product page does not establish a specific A01 White-side game. |

#### London System — White — D00
| Candidate | Submitted source | Audit |
|---|---|---|
| Gata Kamsky | [Wikipedia: London System](https://en.wikipedia.org/wiki/London_System) | Insufficient as cited: general opening article; no exact Kamsky game identified. |
| Magnus Carlsen | [Wikipedia: London System](https://en.wikipedia.org/wiki/London_System) | Insufficient as cited: general opening article; no exact Carlsen game identified. |
| Levon Aronian | [Wikipedia: London System](https://en.wikipedia.org/wiki/London_System) | Insufficient as cited: general opening article; no exact Aronian game identified. |
| Alexander Grischuk | [Book/product listing](https://www.booksamillion.com/p/9789056916893) | Insufficient as cited: generic product listing does not establish a Grischuk London game. |

#### Grünfeld Exchange — White — D85–D89
| Candidate | Submitted source | Audit |
|---|---|---|
| Boris Gelfand | [Challenging the Grünfeld — New In Chess](https://www.newinchess.com/challenging-the-grunfeld) | Pending. The title is relevant, but the evidence should identify Gelfand's White-side Exchange Variation game(s) or role. |
| Viswanathan Anand | [Challenging the Grünfeld — New In Chess](https://www.newinchess.com/challenging-the-grunfeld) | Pending. The title is relevant, but the evidence should identify Anand's White-side Exchange Variation game(s) or role. |

#### Two Knights / Fried Liver — White — C58–C59
| Candidate | Submitted source | Audit |
|---|---|---|
| Nigel Short | [Wikipedia: Two Knights Defence](https://en.wikipedia.org/wiki/Two_Knights_Defense) | Insufficient as cited: general opening article; no exact Short White-side game identified. |
| Alexander Morozevich | [Wikipedia: Two Knights Defence](https://en.wikipedia.org/wiki/Two_Knights_Defense) | Insufficient as cited: general opening article; no exact Morozevich White-side game identified. |

## Sources independently opened during this audit

These are useful starting points, not blanket approval for the proposed pools:

- [ChessLab Academy — Najdorf guide](https://chesslab.academy/openings/sicilian-najdorf/): explains the Najdorf position and Black-side ECO family B90–B99; names Fischer and Vachier-Lagrave as players associated with the opening.
- [ChessLab Academy — famous Najdorf games](https://chesslab.academy/openings/sicilian-najdorf/master-games/): gives a specific Fischer–Najdorf game from Varna 1962. Record its PGN/game identity in the candidate evidence if using it.
- [365Chess — Richárd Rapport games](https://www.365chess.com/players/Richard_Rapport): lists A01 Nimzowitsch–Larsen games as White, with a game database to inspect.
- [Chess.ceo — Richárd Rapport games](https://chess.ceo/player/richard-rapport-738590): lists A01 Nimzowitsch–Larsen games as White in a searchable game archive.
- [Classic Chess — Alexei Shirov notable games](https://classicchess.com/players/Alexei_Shirov/notable/): describes a specific Shirov game in the Semi-Slav Botvinnik Variation as Black. Confirm its exact ECO and whether it fits this pool's accepted codes before treating it as proof.

## Required completion work

For each candidate, replace the pending note with one or more direct records containing:
1. GM name and a stable player identifier where available;
2. exact game URL or PGN source, opponent, event/date;
3. the GM's colour and first moves/ECO or position confirming the relevant pool;
4. a short reason why this is a meaningful opening association (not merely one isolated game);
5. audit decision: `verified`, `rejected`, or `needs review`, with rationale.

Also add the candidates considered but excluded, with reason (insufficient evidence, wrong side/variation, duplicate, pool cap, or family threshold). Keep the existing 19 Batch 1 pools and round-robin behavior unchanged.

**Do not merge or deploy on the strength of this document alone.** It records the gap and makes the submitted citations auditable; it does not certify the pending candidates.
