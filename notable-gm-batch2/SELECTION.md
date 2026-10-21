# Notable GM pools, Batch 2: evidence for review

Branch `claude/notable-gm-batch2`, based on `main` (16a456a). Independent of PR #21 and PR #22: it only adds data to `NOTABLE_GM_POOLS`. Merged alone, cards still hide the heading when there is no pool; with #21 the new GMs simply fill cards that showed "none approved for this opening yet".

## What was done

- Families: the openings the survey picks (`expected.json`, 60 combinations × 3 runs) whose cards had no pool, grouped into 24 opening families. Codes are the vault codes in each family's range **on the pool's side**, minus codes already in a pool.
- Bar (same as Batch 1): an exact name from the 244 GM records; a recognizable association with that opening **and that side**, from an encyclopedic or opening reference, a publisher or course description, or a games-database profile. A single game is not enough. Each candidate was rated standard or lower; only standard ones are proposed, and a family needs at least 2 to get a pool.
- Six-pool cap: no GM ends up in more than 6 pools. Where adding every supported pool would break it (Carlsen, Anand, Nakamura, Short), the weaker or better-covered pools were left out; these rows are marked "held back by the six-pool cap". With these choices Carlsen, Anand, Nakamura, Short and Ding Liren are at 6, and no reviewer warning is printed.
- The 19 existing pools, the rotation code and the GM database are unchanged. `NOTABLE_GM_CONSIDERED` changes in one entry: Hou Yifan gains "Sicilian Scheveningen|black" (the test requires it to list every pool she is in).
- Sources are from web search results; the sandbox cannot open chess sites, so please open any you want to check. Only the first source of each entry goes in `index.html`; all sources are below.

## Result

15 new pools, 47 entries. Women: Hou Yifan (Scheveningen) is the only new entry. All 44 women were searched for in every family; only Aleksandra Goryachkina (Berlin, one match), Tan Zhongyi (English, one event) and Nana Dzagnidze (London, one event) had any evidence, which is below the bar (listed below as not proposed). Totals after this PR: 34 pools, 148 entries, 39 women (26%, was 37%).

Families with no pool (fewer than 2 well-supported names): Scandinavian (Curt Hansen; Carlsen held back by the cap), Pirc (Mamedyarov), Pirc Austrian (Fischer), Queen's Gambit Accepted (Short), Chigorin (Morozevich), Benko (Topalov), Bird's (Rapport), Bishop's Opening and Alapin (none).

Vault note: the London System pool covers only D00, which the vault names "London System" but whose moves are just 1.d4 d5. This matches how Batch 1 used vault names; the name/move mismatch is flagged in PR #22's notes.

## Sicilian Najdorf | black: 6 proposed

Codes: B90, B91, B92, B93, B94, B95, B96, B97, B98, B99

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Bobby Fischer | male | standard | **Proposed** | Wikipedia's Najdorf article names Fischer among the top players who relied on the Najdorf; retailer blurbs for Vigorito's Playing the Najdorf also say Fischer championed it (search snippets). | <https://en.wikipedia.org/wiki/Sicilian_Defence,_Najdorf_Variation> ; <https://www.caissa-chess.com/openings/1402-david-vigorito-playing-the-najdorf-k-5747-9781907982651.html> |
| Maxime Vachier-Lagrave | male | standard | **Proposed** | Wikipedia's Najdorf article lists Vachier-Lagrave among the top players who relied on the Najdorf; a 2017 ChessBase review of Bologan's Najdorf DVD says he 'wins game after game with it' (search snippets). | <https://en.wikipedia.org/wiki/Sicilian_Defence,_Najdorf_Variation> ; <https://en.chessbase.com/newsroom/post/victor-bologan-the-complex-najdorf> |
| Boris Gelfand | male | standard | **Proposed** | The description of Gelfand's game collection calls him one of the world's leading experts on the Najdorf; GM Alex Colovic writes that he has played the Najdorf since his early days; the Vigorito book blurb says he used it extensively (search snippets). | <https://reado.app/en/book/my-most-memorable-games-boris-gelfand/9783283004538> ; <https://gmalexcolovic.substack.com/p/petroff-or-berlin> ; <https://www.caissa-chess.com/openings/1402-david-vigorito-playing-the-najdorf-k-5747-9781907982651.html> |
| Veselin Topalov | male | standard | **Proposed** | Book and course blurbs call the Najdorf one of Topalov's favourite weapons (Cheparinov course) and say he used it extensively (Vigorito); ChessBase cites his famous 6.Be3 Ng4 knight sacrifice win as Black against Svidler at San Luis 2005 (search snippets). | <https://en.chessbase.com/newsroom/post/robert-ris-fast-and-furious-najdorf-be3-ng4> ; <https://www.caissa-chess.com/openings/1402-david-vigorito-playing-the-najdorf-k-5747-9781907982651.html> ; <https://en.chessbase.com/newsroom/post/bologan-the-complex-najdorf-eine-rezension> |
| Viswanathan Anand | male | standard | **Proposed** | The Vigorito book blurb says Anand used the Najdorf extensively, and a ChessBase review names him among the World Champions who had success with it; he won with it as Black, for example against Karjakin in 2006 (search snippets). | <https://www.caissa-chess.com/openings/1402-david-vigorito-playing-the-najdorf-k-5747-9781907982651.html> ; <https://en.chessbase.com/newsroom/post/bologan-the-complex-najdorf-eine-rezension> ; <https://es.lichess.org/video/nvAhWIZSH1c?tags=2007> |
| Ian Nepomniachtchi | male | standard | **Proposed** | A 2017 ChessBase review says top players such as Vachier-Lagrave and Nepomniachtchi 'win game after game' with the Najdorf; ChessBase also reports his Black Najdorf win over Leko at Danzhou 2016 (search snippets). | <https://en.chessbase.com/newsroom/post/victor-bologan-the-complex-najdorf> ; <https://en.chessbase.com/newsroom/post/ian-nepomniachtchi-with-strong-start-in-danzhou> |
| Luis Engel | male | lower | Not proposed: evidence below the bar | Engel wrote ChessBase's multi-volume course 'Najdorf: A dynamic grandmaster repertoire against 1.e4'. Authoring a Black Najdorf repertoire course strongly suggests it is his own opening, but I found no explicit statement of how often he plays it. | <https://en.chessbase.com/newsroom/post/luis-engel-najdorf-a-dynamic-grandmaster-repertoire-against-1-e4-vol-1-2> |

## Sicilian Dragon | black: 2 proposed

Codes: B70, B71, B72, B73, B74, B77

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Gawain C B Maroroa Jones | male | standard | **Proposed** | Author of the two-volume Grandmaster Repertoire: The Dragon (Quality Chess/New in Chess), whose publisher calls him widely regarded as the world's leading Dragon expert (search snippets; promotional wording). | <https://www.newinchess.com/gm-repertoire-the-dragon-vol-1> ; <https://www.newinchess.com/gm-repertoire-the-dragon-vol-2> |
| Hikaru Nakamura | male | standard | **Proposed** | Described as one of the few elite players willing to play the Dragon regularly, with excellent results; a chess.com lesson calls the Dragon his long-time favourite; ChessBase covers his Dragon against Vachier-Lagrave at London 2017 (search snippets). | <https://www.chess.com/lessons/the-fighting-dragon> ; <https://en.chessbase.com/newsroom/post/new-chris-ward-sicilian-dragon-the-real-deal?page=0> ; <https://en.chessbase.com/post/london-classic-a-tepid-start> |
| Magnus Carlsen | male | standard | Not proposed: held back by the six-pool cap | The ChessBase description of Peter Heine Nielsen's Dragon DVD says the young Carlsen used the Dragon as one of his weapons against 1.e4 and regularly played the Soltis Variation (12...h5); a chess.com lesson calls it a long-time favourite of Nakamura and Carlsen (search snippets). | <https://shop.chessbase.com/en/products/nielsen_the_sicilian_dragon_1_9_bc4> ; <https://www.schachversand.de/the-sicilian-dragon-vol-1.html> ; <https://www.chess.com/lessons/the-fighting-dragon> |
| Teimour Radjabov | male | lower | Not proposed: evidence below the bar | He won a well-known Dragon as Black against Karjakin at Sochi GP 2008, and a 2008 Elista GP report says he played the line that year. The evidence is only a few games around 2008. | <https://www.chess.com/news/view/radjabov-grabs-lead-in-elista> |
| Veselin Topalov | male | lower | Not proposed: evidence below the bar | A 2020 ChessBase item (Chris Ward Dragon course) says Topalov used the Dragon in his best years with his own variation. That is a single snippet, with no game list seen. | <https://en.chessbase.com/newsroom/post/new-chris-ward-sicilian-dragon-the-real-deal?page=0> |

## Sicilian Scheveningen | black: 4 proposed

Codes: B80, B82, B83, B84

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Veselin Topalov | male | standard | **Proposed** | An older Wikipedia version names Topalov among the top players who researched the Scheveningen, and ChessBase lists him among its active users (search snippets). | <https://wikipedia.classicistranieri.com/en/articles/s/i/c/Sicilian_Defence%2C_Scheveningen_Variation_7cff.html> ; <https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik> |
| Boris Gelfand | male | standard | **Proposed** | An older Wikipedia version names Gelfand among the top players who researched the Scheveningen, and ChessBase lists him among its active users (search snippets). | <https://wikipedia.classicistranieri.com/en/articles/s/i/c/Sicilian_Defence%2C_Scheveningen_Variation_7cff.html> ; <https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik> |
| Hou Yifan | female | standard | **Proposed** | Her chessgames.com profile lists B84 (Scheveningen, Classical) as her most-played Black Sicilian code, and an earlier snapshot shows 54 Black Scheveningen games (B84/B81/B80/B83/B82) (search snippets; counts approximate). | <https://www.chessgames.com/perl/chessplayer?pid=95916> |
| Sergei Movsesian | male | standard | **Proposed** | Named in the ChessBase DVD article among the active users of the Scheveningen, alongside Kasparov, Anand, Topalov and Gelfand (search snippet). | <https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik> |
| Viswanathan Anand | male | standard | Not proposed: held back by the six-pool cap | The Wikipedia Scheveningen article (including an older mirror) names Anand among the elite players whose research developed its theory, and a ChessBase DVD article lists him among its active users (search snippets). | <https://en.wikipedia.org/wiki/Sicilian_Defence,_Scheveningen_Variation> ; <https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik> |
| Shakhriyar Mamedyarov | male | lower | Not proposed: evidence below the bar | Named only in the same ChessBase list of active Scheveningen users, with no further corroboration found. | <https://en.chessbase.com/post/the-first-dvd-by-gm-ftacnik> |
| D Gukesh | male | lower | Not proposed: evidence below the bar | A British Chess News review of Gormally's The Scheveningen Sicilian Revisited names Gukesh, with Kasparov, as an elite proponent. This rests on a single reviewer. | <https://britishchessnews.com/?p=25025> |

## Sicilian Classical | black: 2 proposed

Codes: B56, B57, B58, B59

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Viswanathan Anand | male | standard | **Proposed** | Blurbs for Yermolinsky's Chess Explained: The Classical Sicilian and Everyman's Starting Out: Classical Sicilian name Anand (with Kramnik and Shirov) as a regular user and champion of 5...Nc6 (search snippets). | <https://www.scacco.it/it/prod/the-classical-sicilian-chess-explained> ; <https://www.booksamillion.com/p/9781857445374> |
| Alexei Shirov | male | standard | **Proposed** | The blurb for Yermolinsky's Chess Explained: The Classical Sicilian says the system has been used by Anand, Kramnik and Shirov (search snippet). | <https://www.scacco.it/it/prod/the-classical-sicilian-chess-explained> |

## Grünfeld Defence | black: 5 proposed

Codes: D71, D72, D73, D74, D75, D76, D77, D78, D79, D80, D82, D83, D84, D90, D91, D92, D93, D94, D95, D96, D97, D98

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Maxime Vachier-Lagrave | male | standard | **Proposed** | Chess.com's Riga Grand Prix 2019 report calls the Grünfeld Vachier-Lagrave's 'pet' opening (he beat Grischuk with it), and FIDE's report covers Mamedyarov repeating a line against 'Vachier-Lagrave's Grünfeld'. Other opening overviews also name him as a current exponent. All from search snippets. | <https://chess.com/news/view/riga-grand-prix-mamedyarov-vachier-lagrave-to-play-in-the-final> ; <https://www.fide.com/shakhriyar-mamedyarov-wins-the-riga-fide-grand-prix/> ; <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> |
| Bobby Fischer | male | standard | **Proposed** | Wikipedia names Fischer among past adopters of the Grünfeld, and his famous 'Game of the Century' (D. Byrne vs Fischer, 1956), with Fischer as Black, is a Grünfeld reached by transposition. From search snippets. | <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> ; <https://www.chess.com/article/view/the-champions-defense> |
| Peter Leko | male | standard | **Proposed** | The Grünfeld Defence overview (Wikipedia, from a search snippet) lists Leko among current or recent players of the opening. | <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> |
| Loek Van Wely | male | standard | **Proposed** | The Grünfeld Defence overview (Wikipedia, from a search snippet) lists Loek van Wely among current or recent players of the opening. | <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> |
| Gata Kamsky | male | standard | **Proposed** | The Grünfeld Defence overview (Wikipedia, from a search snippet) lists Gata Kamsky among current or recent players of the opening. | <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> |
| Viswanathan Anand | male | standard | Not proposed: held back by the six-pool cap | Wikipedia and chess.com's 'The Champions' Defense' list Anand among world champions and current players of the Grünfeld. A ChessBase 2012 report notes that against Topalov (WCh 2010) Anand's Black weapon had been the Grünfeld, and he used it in the 2012 match against Gelfand. From search snippets. | <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> ; <https://www.chess.com/article/view/the-champions-defense> ; <https://en.chessbase.com/newsroom/post/world-championship-g2-anand-shows-his-hand-as-semi-slav-is-played?page=0> |
| Ian Nepomniachtchi | male | lower | Not proposed: evidence below the bar | Named only in an aggregated search summary of opening overviews ('other sources add Vachier-Lagrave, Gelfand and Nepomniachtchi'). A targeted search did not confirm him as a Black Grünfeld specialist. | <https://www.chess.com/openings/grunfeld-defense> ; <https://en.wikipedia.org/wiki/Gr%C3%BCnfeld_Defence> |

## Berlin Defence | black: 2 proposed

Codes: C65, C66, C67

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Levon Aronian | male | standard | **Proposed** | The Bologan Berlin course description names Aronian among the strong players using the Berlin with both colours; game records include his Berlin as Black against Nakamura (Esports World Cup 2025) (search snippets). | <https://en.chessbase.com/newsroom/post/victor-bologan-the-berlin-wall-explained> ; <https://www.365chess.com/tournaments/Esports_World_Cup_2025_2025/47220> |
| Ian Nepomniachtchi | male | standard | **Proposed** | Wikipedia's Berlin article cites his Berlin draw against Nakamura in the 2022 Candidates, and he used it against Ding Liren in the 2023 World Championship (search snippets). | <https://en.wikipedia.org/wiki/Berlin_Defence> ; <https://lichess.org/study/embed/46lbOGuJ/fb7h8wCn> |
| Viswanathan Anand | male | standard | Not proposed: held back by the six-pool cap | The Berlin was Anand's main Black weapon against Carlsen in the 2014 World Championship, and he was among the first to take it up after Kramnik in 2000 (Wikipedia and thechessworld, search snippets). | <https://en.wikipedia.org/wiki/Berlin_Defence> ; <https://thechessworld.com/articles/openings/berlin-defense-complete-guide/> |
| Magnus Carlsen | male | standard | Not proposed: held back by the six-pool cap | The description of Bologan's ChessBase course The Berlin Wall Explained names Carlsen among the strong players who play the Berlin with both colours; 365chess and London Classic reports show his Berlin games as Black (search snippets). | <https://en.chessbase.com/newsroom/post/victor-bologan-the-berlin-wall-explained> ; <https://www.365chess.com/tournaments/4th_London_Chess_Classic_2012/39829> |
| Hikaru Nakamura | male | standard | Not proposed: held back by the six-pool cap | The Bologan Berlin course description names Nakamura among the strong players using the Berlin with both colours (search snippet). | <https://en.chessbase.com/newsroom/post/victor-bologan-the-berlin-wall-explained> |
| Aleksandra Goryachkina | female | lower | Not proposed: evidence below the bar | ChessBase India reports and 365chess show the Berlin as her repeated Black choice in the 2020 Women's World Championship match against Ju Wenjun (games 2, 6, 11 and more). The evidence is a single match. | <https://chessbase.in/news/FIDE-Womens-World-Championship-2020-game-11> ; <https://www.365chess.com/tournaments/FIDE_Women's_World_Championship_2020_2020/43830> |

## Marshall Attack | black: 5 proposed

Codes: C89

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Levon Aronian | male | standard | **Proposed** | Wikipedia says the Marshall is still used at the top level by players such as Aronian and Ding Liren; Thinkers Publishing and New in Chess material list him as a notable adherent (search snippets). | <https://en.wikipedia.org/wiki/Marshall_Attack> ; <https://thinkerspublishing.com/?p=2406> |
| Ding Liren | male | standard | **Proposed** | Wikipedia names Ding Liren as a current top-level Marshall player, and Thinkers Publishing says he includes it in his repertoire at the very highest level (search snippets). | <https://en.wikipedia.org/wiki/Marshall_Attack> ; <https://thinkerspublishing.com/?p=2406> |
| Boris Spassky | male | standard | **Proposed** | Several references credit Spassky with reviving the Marshall in his 1965 Candidates match against Tal and list him first among its notable adherents (New in Chess, Thinkers Publishing; search snippets). | <https://thinkerspublishing.com/?p=2406> ; <https://www.newinchess.com/media/wysiwyg/product_pdf/7072.pdf> |
| Michael Adams | male | standard | **Proposed** | A chess.com Marshall lesson calls Adams one of the strongest and most frequent practitioners with Black; a New in Chess excerpt and Vigorito's Marshall book list him among its notable users (search snippets). | <https://www.chess.com/lessons/learn-the-ruy-lopez-marshall-attack> ; <https://www.newinchess.com/media/wysiwyg/product_pdf/7072.pdf> |
| Peter Leko | male | standard | **Proposed** | The Thinkers Publishing Modernized Marshall Attack description lists Leko among the notable names (Nunn, Leko, Aronian, Svidler) who have played it (search snippet). | <https://thinkerspublishing.com/?p=2406> |
| Nigel Short | male | lower | Not proposed: evidence below the bar | A New in Chess Marshall excerpt lists Short among its notable adherents (with Spassky, Geller, Nunn, Adams, Anand, Svidler, Kamsky, Shirov). That is a single list mention. | <https://www.newinchess.com/media/wysiwyg/product_pdf/7072.pdf> |
| Gata Kamsky | male | lower | Not proposed: evidence below the bar | Named only in the same New in Chess list of notable Marshall adherents. | <https://www.newinchess.com/media/wysiwyg/product_pdf/7072.pdf> |

## Semi-Slav Defence | black: 3 proposed

Codes: D43, D44, D45, D46, D47, D48, D49

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Viswanathan Anand | male | standard | **Proposed** | TheChessWorld says Anand has contributed much to Semi-Slav theory and still plays it often. ChessBase's WCh 2012 reports call the Semi-Slav Anand's main Black weapon against Gelfand (games 2, 4 and 7), and a Thinkers Publishing blurb names Anand as demonstrating the Meran's effectiveness. From search snippets. | <https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/> ; <https://en.chessbase.com/newsroom/post/world-championship-g4-gelfand-unable-to-dent-anand-s-semi-slav?page=0> ; <https://thinkerspublishing.com/product/the-modernized-semi-slav-milos-pavlovic/> |
| Alexei Shirov | male | standard | **Proposed** | TheChessWorld names Shirov among attacking players with success in the Semi-Slav. A chessclub.com Botvinnik Semi-Slav video says he is the one man who fearlessly defends the black side of the Botvinnik, and ChessBase (l'Ami's Botvinnik DVD) names Shirov among top players who relied on it. From search snippets. | <https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/> ; <https://www.chessclub.com/videos/every-russian-schoolboy-knows-botvinnik-semi-slav-revisited-3> ; <https://en.chessbase.com/newsroom/post/the-beasty-botvinnik-in-the-semi-slav> |
| Veselin Topalov | male | standard | **Proposed** | TheChessWorld's Semi-Slav article names Topalov, with Shirov and Dreev, as attacking players who have had success with the Semi-Slav as Black. From a search snippet. | <https://thechessworld.com/articles/openings/the-sharp-semi-slav-defense/> |

## Scandinavian Defence | black: 0 proposed

Codes: B01

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Curt Hansen | male | standard | Not proposed: family has fewer than 2 well-supported names | Described as a globally recognized theoretical expert in the Scandinavian (1...d5), author of a ChessBase reference CD on it (2002); Wikipedia also says he is regarded as an expert in the opening. Claims from search-result snippets. | <https://en.wikipedia.org/wiki/Scandinavian_Defense> ; <https://www.chesshere.com/masters/curt-hansen> ; <https://www.schachversand.de/the-scandinavian-defence.html> |
| Magnus Carlsen | male | standard | Not proposed: held back by the six-pool cap | Wikipedia records him playing the Scandinavian as Black several times at elite level: a win against Caruana at the 2014 Olympiad, a draw against Caruana at the 2016 Olympiad, and a blitz win against Anand in Kolkata 2019. He uses it as an occasional weapon rather than a main defence. Claims from search-result snippets. | <https://en.wikipedia.org/wiki/Scandinavian_Defense> |
| Hikaru Nakamura | male | lower | Not proposed: evidence below the bar | A Chess.com history article on the opening's modern play says he has used it a lot, though less in recent years; a Chess.com forum thread says he played it 'a bit'. Claims from search-result snippets, with no game counts. | <https://www.chess.com/article/view/the-scandinavian-defense-a-history-part-2> ; <https://www.chess.com/forum/view/chess-openings/greatest-player-to-ever-regularly-play-the-scandinavian-defense-as-black> |
| Alexei Shirov | male | lower | Not proposed: evidence below the bar | A publisher listing for a Scandinavian book names Shirov, with Larsen, Curt Hansen and Anand, among the top players who have used the defence successfully. No game list was found. Claim from a search-result snippet. | <https://www.schachversand.de/the-scandinavian-defence.html> |

## Benko Gambit | black: 0 proposed

Codes: A57, A58, A59

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Veselin Topalov | male | standard | Not proposed: family has fewer than 2 well-supported names | Wikipedia lists Topalov among former world champions who have used the Benko. ChessBase (Ramirez DVD) says Topalov tried it occasionally or regularly, and a book blurb cites Topalov (with Khalifman) as having used it to score memorable victories. From search snippets. | <https://en.wikipedia.org/wiki/Benko_Gambit> ; <https://en.chessbase.com/newsroom/post/alejandro-ramirez-attacking-with-the-benko-2> ; <https://www.simonandschuster.ca/books/The-Benko-Gambit/Junior-Tay/9781781941591> |
| Vasyl Ivanchuk | male | lower | Not proposed: evidence below the bar | Wikipedia and a Benko book blurb (search snippets) list Ivanchuk among strong players who have used the Benko. That is a 'has used' attribution, not proof it is a main weapon. | <https://en.wikipedia.org/wiki/Benko_Gambit> ; <https://www.simonandschuster.ca/books/The-Benko-Gambit/Junior-Tay/9781781941591> |
| Magnus Carlsen | male | lower | Not proposed: evidence below the bar | Wikipedia lists Carlsen among world champions who have used the Benko, and ChessBase (Ramirez DVD) says Carlsen tried it 'occasionally or regularly'. That is occasional use, not a main opening. From search snippets. | <https://en.wikipedia.org/wiki/Benko_Gambit> ; <https://en.chessbase.com/newsroom/post/alejandro-ramirez-attacking-with-the-benko-2> |
| Victor Bologan | male | lower | Not proposed: evidence below the bar | A 2015 ChessBase article on Ramirez's Benko DVDs lists Bologan among players who have used the gambit, and his Benko games are annotated in Sipke Ernst's ChessBase Benko course. From search snippets; thin evidence. | <https://en.chessbase.com/newsroom/post/alejandro-ramirez-attacking-with-the-benko-2?page=0> ; <https://en.chessbase.com/post/review-the-modern-benko-gambit-a-full-repertoire-against-1-d4-by-gm-sipke-ernst> |

## French Winawer | black: 3 proposed

Codes: C15, C16, C17, C18, C19

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Alexander Morozevich | male | standard | **Proposed** | The same Winawer book synopsis names Morozevich among top-class players using the Winawer, and Lemos's French Defence Move by Move uses Morozevich-Dolmatov (Krasnodar 1997) as a Winawer model game. Claims from search-result snippets. | <https://www.powells.com/book/french-winawer-9780713485240> ; <https://www.perlego.com/book/5299465/the-french-defence-move-by-move-move-by-move-pdf> |
| Wesley So | male | standard | **Proposed** | The excerpt of Kotronias/Ivanov/Obodchuk, Beating the French Winawer (2025), names Wesley So among the modern top players who take Black in the Winawer. Claim from a search-result snippet. | <https://www.newinchess.com/media/wysiwyg/product_pdf/89042.pdf> ; <https://www.newinchess.com/beating-the-french-winawer> |
| Ian Nepomniachtchi | male | standard | **Proposed** | Named in the excerpt of Beating the French Winawer (2025) among the modern top players who take Black in the Winawer; a Winawer game of his also appears as a model game in Lemos's French Defence Move by Move. Claims from search-result snippets. | <https://www.newinchess.com/media/wysiwyg/product_pdf/89042.pdf> ; <https://www.perlego.com/book/5299465/the-french-defence-move-by-move-move-by-move-pdf> |
| Nigel Short | male | standard | Not proposed: held back by the six-pool cap | A bookseller synopsis of a Winawer monograph names Short (with Korchnoi, Morozevich and Bareev) among top-class players who still use the Winawer, and lists him among the current champions of the system; Raymond Keene (Spectator 1992) calls the 7.Nf3 line one of Short's own favourites. Chessiverse also lists Short among the variation's champions. Claims from search-result snippets. | <https://www.powells.com/book/french-winawer-9780713485240> ; <https://archive.spectator.co.uk/article/4th-january-1992/36/chess> ; <https://chessiverse.com/resources/openings/winawer-french> |
| Nikita Vitiugov | male | lower | Not proposed: evidence below the bar | He wrote the repertoire book The French Defence: Reloaded, and Keene annotates his Winawer as Black (Inarkiev-Vitiugov, Moscow 2008). One search snippet also lists him among the Winawer's Black supporters in Beating the French Winawer, but a second search could not confirm this, because the excerpt was cut off. Claims from search-result snippets. | <https://spectator.com/article/francophilia/> ; <https://www.newinchess.com/media/wysiwyg/product_pdf/7946.pdf> ; <https://www.newinchess.com/media/wysiwyg/product_pdf/89042.pdf> |

## Pirc Defence | black: 0 proposed

Codes: B07, B08

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Shakhriyar Mamedyarov | male | standard | Not proposed: family has fewer than 2 well-supported names | The 365chess Pirc guide says he has played it many times and is one of the top players who rely on it; the chess.com opening page says he frequently uses it to play for a win; the publisher blurb for Vigus's Chess Developments: The Pirc calls him an elite champion of the opening. Claims from search-result snippets. | <https://www.365chess.com/chess-openings/Pirc-Defense> ; <https://www.chess.com/openings/Pirc-Defense> ; <https://www.newinchess.com/chess-developments-the-pirc> |
| Ian Nepomniachtchi | male | lower | Not proposed: evidence below the bar | A TheChessWorld guide to the Pirc says it was 'many times employed' by Nepomniachtchi, Kramnik, Svidler, Mamedyarov and Grischuk. This single, undated article is the only source found. Claim from a search-result snippet. | <https://thechessworld.com/articles/openings/pirc-defense-complete-guide-for-black/> |

## Queen's Gambit Accepted | black: 0 proposed

Codes: D20, D21, D22, D23, D24, D25, D26, D27, D28, D29

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Nigel Short | male | standard | Not proposed: family has fewer than 2 well-supported names | Glenn Flear's 'New Ideas in the Queen's Gambit Accepted' describes the QGA as Short's shock weapon in his 1992 Candidates win over Karpov. A Batsford/Chris Ward book synopsis also lists Short among top QGA players. From search snippets. | <https://www.wholesalechess.com/chess-products/chess-books/unbeatable-book-deals/clearance-new-ideas-in-the-queens-gambit-accepted-glenn-flear-174.html> ; <https://test.blackwells.co.uk/bookshop/product/Queens-Gambit-Accepted-by-Chris-Ward/9780713484670> |
| Viswanathan Anand | male | lower | Not proposed: evidence below the bar | The synopsis of Chris Ward's 'The Queen's Gambit Accepted' (Batsford) names Anand among top players who use it, and an Everyman QGA blurb calls Anand a high-class advocate. Neither source states the side explicitly. From search snippets. | <https://test.blackwells.co.uk/bookshop/product/Queens-Gambit-Accepted-by-Chris-Ward/9780713484670> ; <https://www.schachversand.de/easy-guide-to-the-queen-s-gambit-accepted.html> |
| Vasyl Ivanchuk | male | lower | Not proposed: evidence below the bar | Only the Chris Ward/Batsford synopsis lists Ivanchuk among top players who use the QGA (a search snippet). Single-source attribution. | <https://test.blackwells.co.uk/bookshop/product/Queens-Gambit-Accepted-by-Chris-Ward/9780713484670> |

## Chigorin Defence | black: 0 proposed

Codes: D07

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Alexander Morozevich | male | standard | Not proposed: family has fewer than 2 well-supported names | Wikipedia/Simple Wikipedia say Morozevich is famous for the Chigorin and perhaps the only modern GM who plays it regularly; he has also published a book on it. ChessBase credits him with its revival, and Nigel Davies' 'Untamed Chigorin' calls it his deadly speciality. From search snippets. | <https://en.wikipedia.org/wiki/Chigorin_Defense> ; <https://simple.wikipedia.com/wiki/Alexander_Morozevich> ; <https://en.chessbase.com/post/the-tactical-chigorin-a-review-2> ; <https://thechessworld.com/store/product/untamed-chigorin-gm-nigel-davies/> |

## English Opening | white: 2 proposed

Codes: A10, A12, A13, A14, A17, A18, A19, A20, A21, A22, A23, A24, A25, A26, A27, A28, A29, A30, A31, A32, A33, A34, A35, A36, A37, A38, A39

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Magnus Carlsen | male | standard | **Proposed** | Lichess/Wikipedia-style opening references list Carlsen among the major users of 1.c4; a chess.com lesson describes the English as 'often favored by Magnus Carlsen'; he opened 1.c4 vs Kramnik at London Classic 2009 (search snippets). | <https://www.chess.com/el/lessons/learn-the-english-opening> ; <https://lichess.org/opening/English_Opening> ; <https://chessdailynews.com/?p=30586> |
| Ding Liren | male | standard | **Proposed** | Wikipedia's English Opening article notes Ding used it in the 2024 World Championship (game 12); FIDE reports he chose 1.c4 in the 2023 and 2024 title matches; uchess lists him among world champions who employed it (search snippets). Note FIDE 2023 called it a switch from his usual first move. | <https://en.wikipedia.org/wiki/English_Opening> ; <https://fide.com/news/3344> ; <https://www.fide.com/2023/04/13/> ; <https://www.uchess.com/chess-opening/english-opening-a10> |
| Levon Aronian | male | lower | Not proposed: evidence below the bar | A ChessClub (ICC) GM video on an English Four Knights structure names Aronian among its notable practitioners; chess.com forum says he has played theoretically important English games without playing it exclusively (search snippets). No encyclopedic source. | <https://www20.chessclub.com/videos/gm-davorin-kuljasevic-the-importance-of-modern-middlegame-tabiyas-video-11> ; <https://chess.com/forum/view/chess-openings/who-was-the-greatest-english-opening-player-ever> |
| Tan Zhongyi | female | lower | Not proposed: evidence below the bar | ChessBase India / FIDE reports on the 2025 Women's World Championship say challenger Tan repeatedly played the English as White against Ju Wenjun (search snippets). Evidence is one match only. | <https://chessbase.in/news/FIDE-Women-s-World-Chess-Championship-2025-Game-1-6-report> ; <https://www.fide.com/first-blood-tan-zhongyi-wins-game-2-after-ju-wenjuns-costly-blunder/> |

## Vienna Game | white: 3 proposed

Codes: C25, C26, C27, C28, C29

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Nigel Short | male | standard | **Proposed** | Gary Lane's Everyman book 'The Vienna Game' names Short among enterprising players who 'have enjoyed great success with the Vienna in recent years' (book description, search snippet). Single source. | <https://chess.co.uk/products/vienna-game-lane> ; <https://books.org/books/the-vienna-game/gary-lane/9781857442717/> |
| Michael Adams | male | standard | **Proposed** | Same Gary Lane book description names Michael Adams as a successful Vienna player (search snippet; not to be confused with Weaver Adams). Single source. | <https://chess.co.uk/products/vienna-game-lane> ; <https://books.org/books/the-vienna-game/gary-lane/9781857442717/> |
| Boris Spassky | male | standard | **Proposed** | Same Gary Lane book description names Spassky as a successful Vienna player; RamaChess game pages show Spassky Vienna games (search snippets). Single reference source. | <https://chess.co.uk/products/vienna-game-lane> ; <https://ramachess.com/grandmastergames/games/27f0d1d4ee16ed43.html> |
| Viswanathan Anand | male | lower | Not proposed: evidence below the bar | Chess.com's Vienna Game page lists Anand among GMs who 'have played it' (search snippet). Indicates use, not a main weapon. | <https://chess.com/openings/Vienna-Game> |

## Bishop's Opening | white: 0 proposed

Codes: C23

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Peter Leko | male | lower | Not proposed: evidence below the bar | Wikipedia's Bishop's Opening article says Lékó played it in the 2007 World Championship against Kramnik to avoid the Petroff (search snippet). One event only. | <https://en.wikipedia.org/wiki/Bishop%27s_Opening> |
| Magnus Carlsen | male | lower | Not proposed: evidence below the bar | A chess.com page (undated) claims Carlsen 'often' plays the Bishop's Opening; lichess forum posts say he uses 1.e4 e5 2.Bc4 (search snippets). No database confirmation. | <https://www.chess.com/tournament/bishops-opening-2> ; <https://lichess.org/forum/game-analysis/2-bc4--against-the-sicilian?page=4> |
| Fabiano Caruana | male | lower | Not proposed: evidence below the bar | Same undated chess.com page claims Caruana often plays the Bishop's Opening (search snippet). Thin; single non-authoritative source. | <https://www.chess.com/tournament/bishops-opening-2> |

## Bird's Opening | white: 0 proposed

Codes: A02, A03

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Richárd Rapport | male | standard | Not proposed: family has fewer than 2 well-supported names | ChessBase CBM 197 review: 'In recent years, Richard Rapport has done much to rehabilitate the opening', with annotated Rapport 1.f4 games, plus a 2022 Rapport-Tari A03 game (search snippets). | <https://en.chessbase.com/post/cbm-197-review-2> ; <https://mer.vin/chess/rapport-richard-vs-tari-aryan-at-ftx-road-to-miami-prelim-8-3> |
| Alexander Morozevich | male | lower | Not proposed: evidence below the bar | ChessBase says the Bird was revived in the 1980s by Malaniuk and 'on occasion picked up by Ivanchuk and Morozevich' (search snippet). Occasional use only; a chess.com forum poster disputes Morozevich ever playing 1.f4. | <https://en.chessbase.com/post/cbm-197-review-2> |
| Vasyl Ivanchuk | male | lower | Not proposed: evidence below the bar | Same ChessBase text: 'on occasion picked up by Ivanchuk' (search snippet). Occasional use only. | <https://en.chessbase.com/post/cbm-197-review-2> |

## Nimzowitsch-Larsen Attack | white: 2 proposed

Codes: A01

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Richárd Rapport | male | standard | **Proposed** | Wikipedia (Rapport article) says one of his most common unusual openings is the Nimzo-Larsen Attack, used even in official OTB events; Chess Publishing annotates Rapport 1.b3 games (search snippets). | <https://en.wikipedia.org/wiki/Rich%C3%A1rd_Rapport> ; <https://chesspublishing.com/content/12/oct14.htm> |
| Wesley So | male | standard | **Proposed** | Author of the ChessBase course 'My Secret Weapon: 1.b3' with his own annotated games; chessgames.com A01 page lists him among practitioners (19 games) (search snippets). | <https://shop.chessbase.com/en/products/wesley_so_my_secret_weapon_1b3> ; <https://www.chessgames.com/perl/chessopening?eco=A01> |
| Hikaru Nakamura | male | standard | Not proposed: held back by the six-pool cap | Chess.com Larsen profile says Nakamura has won many games with Larsen's pet opening (mostly blitz/bullet); chessgames.com A01 page lists Nakamura with 89 games (search snippets). Mainly faster time controls. | <https://www.chess.com/players/Bent-Larsen> ; <https://www.chessgames.com/perl/chessopening?eco=A01> |
| Magnus Carlsen | male | standard | Not proposed: held back by the six-pool cap | Same chess.com Larsen profile names Carlsen alongside Nakamura as winning many 1.b3 games (mostly blitz/bullet); chessgames.com A01 lists 23 Carlsen games (search snippets). | <https://www.chess.com/players/Bent-Larsen> ; <https://www.chessgames.com/perl/chessopening?eco=A01> |

## Alapin Sicilian | white: 0 proposed

Codes: B22

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Viswanathan Anand | male | lower | Not proposed: evidence below the bar | Wikipedia's Alapin Variation article says the line has been played by World Champions including Anand (search snippet). Use stated, not specialism; no game list found. | <https://en.wikipedia.org/wiki/Sicilian_Defence,_Alapin_Variation> |
| Veselin Topalov | male | lower | Not proposed: evidence below the bar | Same Wikipedia statement lists Topalov among World Champions who have played 2.c3 (search snippet). Use stated, not specialism. | <https://en.wikipedia.org/wiki/Sicilian_Defence,_Alapin_Variation> |

## London System | white: 4 proposed

Codes: D00

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Gata Kamsky | male | standard | **Proposed** | Wikipedia names Kamsky among players who use the London more frequently; thechessworld guide calls him 'the absolute guru of the London System', playing it since childhood (search snippets). | <https://en.wikipedia.org/wiki/London_System> ; <https://thechessworld.com/articles/openings/london-system-the-complete-guide/> |
| Magnus Carlsen | male | standard | **Proposed** | Wikipedia lists Carlsen among frequent London users; chess.com article and book blurbs say it regained popularity after Carlsen adopted it, using it in important games (search snippets). | <https://en.wikipedia.org/wiki/London_System> ; <https://thechessworld.com/articles/openings/london-system-the-complete-guide/> ; <https://www.booksamillion.com/p/9789056916893> |
| Levon Aronian | male | standard | **Proposed** | Wikipedia's London System article names Aronian (with Kamsky and Carlsen) as players who use it more frequently (search snippet). | <https://en.wikipedia.org/wiki/London_System> |
| Alexander Grischuk | male | standard | **Proposed** | Book description of 'The Agile London System' (Thinkers) lists Grischuk first among GMs who have lately played it; another guide pairs him with Kramnik as adding it to his repertoire (search snippets). | <https://www.booksamillion.com/p/9789056916893> ; <https://thechessworld.com/articles/openings/london-system-the-complete-guide/> |
| Richárd Rapport | male | lower | Not proposed: evidence below the bar | Same 'Agile London System' book blurb names Rapport among GMs who have played it recently (search snippet). Single blurb. | <https://www.booksamillion.com/p/9789056916893> |
| Nana Dzagnidze | female | lower | Not proposed: evidence below the bar | FIDE report on the 2019 Lausanne Women's Grand Prix says she used London System versions in rounds 2 and 4, the earlier one bringing her success (search snippet). Thin: one event. | <https://www.fide.com/wgp-round-4-goryachkina-and-dronavalli-win-and-lead-in-lausanne/> |

## Grünfeld Exchange | white: 2 proposed

Codes: D85, D86, D87, D88, D89

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Boris Gelfand | male | standard | **Proposed** | The blurb of Dearing's Challenging the Grünfeld (Quality Chess) says the Modern Exchange (7.Nf3/8.Rb1, D85) was favoured by Kramnik, Gelfand and Anand on numerous occasions; a Silman review calls the Rb1 line a longtime favourite of Kramnik and Gelfand, and masterinchess names Kramnik and Gelfand as the leading practitioners of the Exchange with White. Claims from search-result snippets. | <https://www.newinchess.com/challenging-the-grunfeld> ; <https://www.jeremysilman.com/?p=2746> ; <https://masterinchess.com/grunfeld-defence> |
| Viswanathan Anand | male | standard | **Proposed** | Dearing's Challenging the Grünfeld names Anand, with Kramnik and Gelfand, among the top GMs who have favoured the Modern Exchange 'on numerous occasions'; he also used the Exchange (8.Bb5+) as White in game 1 of the 2012 World Championship. This rests mainly on publisher copy. Claims from search-result snippets. | <https://www.newinchess.com/challenging-the-grunfeld> ; <https://www.schachversand.de/challenging-the-grunfeld.html> ; <https://dailychessmusings.com/2012/05/11/anand-gelfand-2012-round-1/> |
| Boris Spassky | male | lower | Not proposed: evidence below the bar | The 7.Bc4/8.Ne2 line is called the Spassky Variation (D87), and a chessgames collection includes Spassky vs Beliavsky 1975 in it. However, no source in the search results stated the naming or showed a body of his games, and 365chess lists other players as the most frequent users. Claims from search-result snippets. | <https://www.365chess.com/eco/D87_Gruenfeld_exchange_Spassky_variation> ; <https://www.chessgames.com/perl/chesscollection?cid=1042178> |

## Two Knights / Fried Liver | white: 2 proposed

Codes: C58, C59

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Nigel Short | male | standard | **Proposed** | Wikipedia's Two Knights Defense article says 4.Ng5 revived in the 1990s after being adopted by Morozevich and Short, and credits Short with reviving 9.Nh3 in the 4...d5 5.exd5 Na5 main line (C58/C59); a ChessBase product blurb says Short has popularised it in recent years. Claims from search-result snippets. | <https://en.wikipedia.org/wiki/Two_Knights_Defense> ; <https://shop.chessbase.com/en/products/lami_the_modern_two_knights> |
| Alexander Morozevich | male | standard | **Proposed** | Wikipedia's Two Knights Defense article says 4.Ng5 revived after Morozevich and Short adopted it in the 1990s; a ChessBase review of Pinski's book repeats this. Claims from search-result snippets. | <https://en.wikipedia.org/wiki/Two_Knights_Defense> ; <https://en.chessbase.com/post/attack-with-the-two-knights-defence/6> |

## Pirc Austrian Attack | white: 0 proposed

Codes: B09

| GM | Gender | Confidence | Decision | Why this opening and side | Sources |
|---|---|---|---|---|---|
| Bobby Fischer | male | standard | Not proposed: family has fewer than 2 well-supported names | Wikipedia's Austrian Attack article says the line was a favourite of Fischer, and a Pirc book review calls the Austrian Attack the line 'popularised by Fischer'. Chessgames lists Fischer vs Benko 1963 and Fischer vs Korchnoi 1962 among its notable White wins (B09). Claims from search-result snippets. | <https://en.wikipedia.org/wiki/Pirc_Defence,_Austrian_Attack> ; <https://scottishcca.co.uk/books/perfectpirc.html> ; <https://chessgames.com/perl/chessopening?eco=B09> |
| Boris Spassky | male | lower | Not proposed: evidence below the bar | Wikipedia notes that he chose the Austrian Attack against Fischer's Pirc in game 17 of the 1972 World Championship (drawn). Only that one prominent game was found, so this is thin. Claim from a search-result snippet. | <https://en.wikipedia.org/wiki/Pirc_Defence,_Austrian_Attack> |

## Tests

| Check | Result |
|---|---|
| `npm test` with the new pools, before updating the baseline | FAIL as expected: 28 Notable GM baseline mismatches, all of them empty slots now filled (`before-baseline-npmtest.txt`) |
| Baseline diff check (script): every GM shown before is still shown in the same slot | PASS: 0 existing slots changed, 49 empty slots filled; hand-written names and Labs drill unchanged |
| `npm test` after `npm run update:gm-baseline`, 3 runs | PASS ×3: 34 pools, 148 entries, 0 issues, no six-pool warning; picks, scoring and protected hash unchanged (`after-npmtest-3runs.txt`) |
| `npm run clickthrough` before updating its expectations | FAIL as expected: D85, D00 and the E06 retake now show a GM (`clickthrough-before-expectations.txt`) |
| `npm run clickthrough` after | PASS: 5 cases, board editor, evaluation bar, navigation (`clickthrough.txt`) |
| Live site, mobile, other browsers | NOT RUN |

Baseline commands run: `npm run update:gm-baseline` (rewrites `gm-baseline.json`). `npm run update` was **not** run; `expected.json` is unchanged.

## Files changed

- `index.html`: 15 pools appended to `NOTABLE_GM_POOLS`; Hou Yifan's `NOTABLE_GM_CONSIDERED` entry. Both in the unhashed opening-data block.
- `tools/survey-regression/gm-baseline.json`: regenerated (only empty slots filled).
- `tools/survey-regression/clickthrough.js`: expected GMs for the D85, D00 and E06-retake cases.