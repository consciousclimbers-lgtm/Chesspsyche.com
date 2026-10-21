# Batch 2 GM pools — evidence audit

- PR: [#23 — Notable GM pools, Batch 2](https://github.com/consciousclimbers-lgtm/Chesspsyche.com/pull/23)
- Initial audit target commit: `17c3fee9bad182791a47d6a0e6ae3188601c6aa8` (the audit and follow-up notes below were carried forward as the branch changed).
- Scope: review the 15 proposed pools (47 entries) and the citations supplied in `index.html`.
- Status: **reconciled 2026-10-21: 24 verified, 23 pending** (see the next section). All evidence is search-result text; no page was opened and no PGN replayed.

## Evidence reconciliation, 2026-10-21 (Claude, after the owner's review of `3f47eff`)

**Result:** 24 of the 47 entries are `verified` and 23 are `pending`. `index.html` holds **12 Batch 2 pools**, with 24 verified and 14 pending entries. Three families are not in `index.html` because no verified GM is left: Sicilian Scheveningen, Sicilian Classical and Vienna Game. Their 9 pending entries are recorded only here.

A `pending` entry is never shown: only `status: "verified"` entries are eligible.

**How the evidence was gathered (applies to every row):**
- Every quote below is **search-result text** (WebSearch snippets), copied as it appeared.
- **No source page was opened.** The sandbox cannot reach chess sites or Wikipedia: the proxy refuses the connection. A page may say more or less than its snippet.
- **No PGN was replayed.** Game references are as the snippet describes them.

**The bar for `verified`.** A source's own text must name this GM with this system and colour, and say one of these things:
- he plays it regularly, as a favourite or main weapon;
- he is a leading practitioner or expert;
- he authored a work on it;
- or the source gives a Black-side game count for this ECO family.

**What is not enough on its own:**
- a bare list of names;
- a publisher blurb listing several names;
- a broad-repertoire claim;
- an isolated game;
- a quote whose subject or colour the snippet does not make clear;
- the wrong colour or a different variation.

### Verified (24)

| # | Family, colour (codes) | GM | Source in `index.html` | Specific text (snippet) | Kind |
|---|---|---|---|---|---|
| 1 | Sicilian Najdorf, Black (B90–B99) | Bobby Fischer | en.wikipedia.org Najdorf Variation | "This was the favourite of the American world champion Bobby Fischer" | favourite |
| 2 | Sicilian Najdorf, Black | Maxime Vachier-Lagrave | en.chessbase.com/post/biel-2018-round-7 | one of the only top players who "play this line almost exclusively"; 365chess: top Black opening B90, 172 games | regular use plus game count |
| 3 | Sicilian Najdorf, Black | Boris Gelfand | 365chess.com B90 | 257 B90 games as Black; ChessBase: "Sicilian Najdorf with which Gelfand has scored some great victories" | game count |
| 4 | Sicilian Najdorf, Black | Veselin Topalov | chessbase.com Ris, Najdorf 6.Be3 Ng4 | "one of the favorite weapons of Topalov – the Sicilian Najdorf"; beat Svidler with Black in it | favourite |
| 5 | Sicilian Najdorf, Black | Ian Nepomniachtchi | chessbase.com Bologan Najdorf review | "top players such as Maxime Vachier-Lagrave or Ian Nepomniachtchi win game after game with it" | regular use |
| 6 | Sicilian Dragon, Black (B70–B77 subset) | Gawain C B Maroroa Jones | forwardchess.com *The Dragon: Volume 1* | author of the book; publisher: "the world's leading expert on the Sicilian Dragon" | author and expert |
| 7 | Grünfeld Defence, Black (D71–D98 subset) | Maxime Vachier-Lagrave | fide.com Hamburg GP 2019 | "his beloved Grünfeld Defence opening" | favourite |
| 8 | Grünfeld Defence, Black | Bobby Fischer | chessbase.com "Understanding before moving 170" | "the Grünfeld, Fischer's main weapon against 1.d4 at that time" | main weapon |
| 9 | Grünfeld Defence, Black | Peter Leko | business-standard.com (2009) | Leko "used to be a regular Grunfeld player until about four years ago" | regular use |
| 10 | Berlin Defence, Black (C65–C67) | Levon Aronian | chessiverse.com Berlin Defense | "On the Black side, notable exponents include ... Levon Aronian (133 games)" | Black-side game count |
| 11 | Marshall Attack, Black (C89) | Levon Aronian | en.wikipedia.org Marshall Attack | "still seeing use today at the top level by players such as Levon Aronian and Ding Liren"; lichess video: "The biggest contemporary expert is Levon Aronian" | expert |
| 12 | Marshall Attack, Black | Ding Liren | en.wikipedia.org Marshall Attack | Wikipedia quote as row 11; ChessBase: "Ding Liren ... is very well-versed in the Marshall Attack -- in fact, he reached the following position twice in the past" | expert |
| 13 | Marshall Attack, Black | Boris Spassky | thinkerspublishing.com | "reinvented the opening in his match against Mikhail Tal in 1965" | developed it |
| 14 | Marshall Attack, Black | Michael Adams | chess.com lesson, Marshall Attack | "one of the strongest and most frequent practitioners of the Marshall Attack with the black pieces" | leading practitioner |
| 15 | Semi-Slav Defence, Black (D43–D49) | Viswanathan Anand | thechessworld.com Semi-Slav | "Anand still employs it quite often nowadays"; Wikipedia: embraced by World Champions "Vladimir Kramnik and Viswanathan Anand" | regular use |
| 16 | French Winawer, Black (C15–C19) | Ian Nepomniachtchi | chesspublishing.com, April 2020 | "unleashed a surprise opening in the Candidates Tournament by using ... the Winawer Variation"; used twice there, and earlier up to 2013 | repeated use |
| 17 | English Opening, White (A10–A39 subset) | Ding Liren | lichess.org Chess-Network blog, WCh 2023 Game 4 | "Ding Liren has used the English Opening (1.c4) repeatedly in his World Championship matches" | repeated use |
| 18 | Nimzowitsch-Larsen Attack, White (A01) | Richárd Rapport | chesslab.academy Rapport openings | 1.b3 is his "signature" opening as White; ICC: "routinely starting games with 1.b3" | signature opening |
| 19 | Nimzowitsch-Larsen Attack, White | Wesley So | shop.chessbase.com "My Secret Weapon: 1.b3" | author of the course on the Nimzowitsch-Larsen Attack, White's side | author |
| 20 | London System, White (D00) | Gata Kamsky | en.wikipedia.org London System | Wikipedia: "more frequently by players such as Gata Kamsky ..."; Schmücker blurb: "The absolute guru of the London System ... is and remains GM Gata Kamsky" | leading practitioner |
| 21 | London System, White | Magnus Carlsen | en.wikipedia.org London System | Wikipedia list as row 20; ChessBase product page: "Carlsen has started to play this opening regularly" | regular use |
| 22 | Grünfeld Exchange, White (D85–D89) | Boris Gelfand | en.wikipedia.org Grünfeld Defence | "Vladimir Kramnik and Boris Gelfand are the leading practitioners as White" | leading practitioner |
| 23 | Two Knights 4.Ng5, White (C58–C59) | Nigel Short | en.wikipedia.org Two Knights Defense | "4.Ng5 experienced a revival ... after being adopted in the 1990s by Alexander Morozevich and Nigel Short" | revived it |
| 24 | Two Knights 4.Ng5, White | Alexander Morozevich | en.wikipedia.org Two Knights Defense | same sentence; a ChessBase review: "revitalized in the 1990s by players such as Morozevich and Short" | revived it |

**Caveats on the verified rows:**
- **Rows 23 and 24** support 4.Ng5 (C58 and C59), not the 6.Nxf7 Fried Liver. The pool's label "Two Knights / Fried Liver" is misleading; the codes are right.
- **Row 16 (Nepomniachtchi, Winawer)** is the thinnest kept entry: a "surprise" weapon used repeatedly, not his main defence.
- **Row 20 (Kamsky, London):** the Schmücker blurb has no URL on file.

### Pending (23)

| Family, colour | GM | Was | Why pending |
|---|---|---|---|
| Sicilian Najdorf, Black | Viswanathan Anand | pending | One game; the 365chess B90 rows show him as White |
| Sicilian Dragon, Black | Hikaru Nakamura | **verified → pending** | A lesson names him generally as a Dragon player; one game found (vs MVL, London 2017); no game count |
| Grünfeld Defence, Black | Gata Kamsky | **verified → pending** | A bare list (masterinchess) plus individual games (Karpov–Kamsky 1996, Kramnik–Kamsky 1993, Gelfand–Kamsky 1996); no source says he plays it regularly |
| Grünfeld Defence, Black | Loek Van Wely | pending | A list on an old wiki mirror; elsewhere called his secondary choice |
| Berlin Defence, Black | Ian Nepomniachtchi | pending | One or two games |
| Marshall Attack, Black | Peter Leko | **verified → pending** | The "great Marshall practitioner" quote cannot be tied to a source; the games found include Kramnik–Leko 2004 |
| Semi-Slav Defence, Black | Alexei Shirov | **verified → pending** | A passing list mention; the Botvinnik quote does not name him in the snippet |
| Semi-Slav Defence, Black | Veselin Topalov | **verified → pending** | A passing list mention; the Ris quote is about the Anti-Moscow line, and the snippet does not make the colour clear |
| French Winawer, Black | Alexander Morozevich | pending | Not found; his French is the Classical or 3...Be7 |
| French Winawer, Black | Wesley So | **verified → pending** | "a lot of GMs -- Wesley So among them": a list mention |
| English Opening, White | Magnus Carlsen | pending | Broad repertoire only |
| London System, White | Levon Aronian | **verified → pending** | A Wikipedia name list plus one game (vs Nakamura 2020) |
| London System, White | Alexander Grischuk | **verified → pending** | Publisher blurbs that list several names |
| Grünfeld Exchange, White | Viswanathan Anand | **verified → pending** | A publisher blurb list plus one game (WCh 2014 Game 1) |
| Vienna Game, White (pool removed) | Nigel Short | **verified → pending** | One publisher blurb listing three names; no games found |
| Vienna Game, White (pool removed) | Michael Adams | **verified → pending** | Same blurb |
| Vienna Game, White (pool removed) | Boris Spassky | **verified → pending** | Same blurb |
| Sicilian Scheveningen, Black (pool removed) | Veselin Topalov | pending | A name in a list only |
| Sicilian Scheveningen, Black (pool removed) | Boris Gelfand | pending | A name in a list only; no games found |
| Sicilian Scheveningen, Black (pool removed) | Hou Yifan | pending | Repertoire statistics only |
| Sicilian Scheveningen, Black (pool removed) | Sergei Movsesian | pending | A name in a list; the only game found has him as White |
| Sicilian Classical, Black (pool removed) | Viswanathan Anand | pending | The quote is about the Richter-Rauzer (B6x), not B56–B59 |
| Sicilian Classical, Black (pool removed) | Alexei Shirov | pending | A name in a list; his Sicilian is the Kalashnikov |

**Changed on this pass:**
- **12 entries** downgraded from verified to pending (marked in bold above).
- **The Vienna pool** removed.
- **7 sources** in `index.html` repointed to the URL whose snippet carries the quote: rows 2, 5, 6, 8, 16, 17 and 22.

**Unchanged:**
- **Batch 1 data:** 101 verified entries in 19 pools.
- **No speculative GM** was added to fill an empty card.

**Original selection record.** [SELECTION.md](SELECTION.md) covers the families, the six-pool cap, the two-name family threshold, and every candidate left out with its reason. It describes the original 15-pool proposal.

**Earlier re-check.** [RECHECK.md](RECHECK.md) holds the raw search passes behind these rows. Its verdict column is superseded by this section.

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
| Bobby Fischer | [Sidney Bernstein vs Bobby Fischer, US Championship 1957/58, round 4](https://www.chessgames.com/perl/chessgame?gid=1044424); [Fischer Najdorf-as-Black game archive](https://www.chessgames.com/perl/chess.pl?eco=B90-B99&page=3&pid=19233&playercomp=black&title=Robert+James+Fischer+playing+the+Sicilian+Najdorf+as+Black) | Strong direct evidence: Chessgames identifies Bernstein–Fischer as B99, 0–1, with Fischer Black; its player/opening archive lists 83 Fischer games in B90–B99 as Black. Candidate has direct game-level and repeated-use support; still confirm how the project defines pool qualification and retain the exact PGN/game record. |
| Maxime Vachier-Lagrave | [365Chess B90 Najdorf database](https://365chess.com/eco/B90_Sicilian_Najdorf_Adams_attack); [ChessBase: The Najdorf: A sharp weapon for Black](https://en.chessbase.com/post/a-sharp-weapon-for-black); [ChessArchive player/game database](https://chessarchive.net/en/player/EwgOw7NgNB/vachier-lagrave-maxime) | Strong repeated-use evidence: 365Chess lists Vachier-Lagrave among the most frequent Black-side players in B90 (22 games); ChessBase also lists Polgar–Vachier-Lagrave as B90, draw, with Vachier-Lagrave Black. Add the exact representative game URL/PGN and inspect its moves before final approval. |
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
| Richárd Rapport | [PGNBase player/opening database](https://www.pgnbase.com/players/richard-rapport); [ChessArchive player/game database](https://chessarchive.net/player/6dgz086nQl/rapport-richard); [365Chess player database](https://www.365chess.com/players/Richard_Rapport) · [Chess.ceo player database](https://chess.ceo/player/richard-rapport-738590) | Strong repeated-use evidence: PGNBase lists 23 A01 Nimzo-Larsen games as White; ChessArchive lists 54 A01 games as White and provides game pages/PGN downloads; 365Chess and Chess.ceo also report dozens. Add a specific game-page/PGN URL and inspect its moves before final approval. |
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

## Source leads referenced during this audit

These are useful starting points, not blanket approval for the proposed pools. The list records candidate sources and findings noted during review; it should not be read as confirmation that every page or every game record was independently re-opened and checked in this pass:

- [ChessLab Academy — Najdorf guide](https://chesslab.academy/openings/sicilian-najdorf/): explains the Najdorf position and Black-side ECO family B90–B99; names Fischer and Vachier-Lagrave as players associated with the opening.
- [ChessLab Academy — famous Najdorf games](https://chesslab.academy/openings/sicilian-najdorf/master-games/): gives a specific Fischer–Najdorf game from Varna 1962. Record its PGN/game identity in the candidate evidence if using it.
- [365Chess — Richárd Rapport games](https://www.365chess.com/players/Richard_Rapport): lists A01 Nimzowitsch–Larsen games as White, with a game database to inspect.
- [Chess.ceo — Richárd Rapport games](https://chess.ceo/player/richard-rapport-738590): lists A01 Nimzowitsch–Larsen games as White in a searchable game archive.
- [PGNBase — Richárd Rapport player/opening table](https://www.pgnbase.com/players/richard-rapport): lists 23 A01 Nimzo-Larsen games as White.
- [ChessArchive — Richárd Rapport game archive](https://chessarchive.net/player/6dgz086nQl/rapport-richard): lists 54 A01 games as White and provides game-page/PGN access.
- [365Chess — B90 Najdorf database](https://365chess.com/eco/B90_Sicilian_Najdorf_Adams_attack): lists Maxime Vachier-Lagrave among frequent Black-side players, with 22 games.
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


## Follow-up evidence search (20 October 2026)

A targeted follow-up located stronger, player-specific game-database evidence for three candidates. This narrows the audit gap but does not finish the full 47-entry audit.

- **Bobby Fischer — Najdorf as Black:** Search results from Chessgames identify *Sidney Bernstein vs Bobby Fischer*, US Championship 1957/58, round 4, as Sicilian Najdorf B99, with Fischer winning as Black; a separate Chessgames archive lists 83 Fischer games in B90–B99 as Black. This is materially stronger than a general opening article. The individual game page returned 403 when opened directly in this pass, so its move score was not independently inspected here.
- **Maxime Vachier-Lagrave — Najdorf as Black:** 365Chess lists him among frequent Black-side B90 players (22 games), and ChessBase's Najdorf table identifies Polgar–Vachier-Lagrave as B90, draw. This strengthens repeated-use support, but the representative full PGN was not replayed in this pass; add a direct game-record/PGN link and check the moves.
- **Richárd Rapport — Nimzowitsch–Larsen as White:** PGNBase lists 23 A01 games as White, ChessArchive lists 54 and provides game pages/PGN downloads, and 365Chess/Chess.ceo also show dozens. This is stronger repeated-use evidence, but a specific representative game/PGN still needs to be selected and its moves checked.

These entries are upgraded to **strong evidence located / final game-level confirmation required**, not silently labelled fully verified. The remaining candidates still need equivalent player + opening + side evidence and exclusion rationale.
