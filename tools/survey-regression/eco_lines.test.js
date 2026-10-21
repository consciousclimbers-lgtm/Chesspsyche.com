// Regression test for individually repaired ECO lines (data in index.html).
// 1. Each repaired vault line must be legal and end on the position the reference gives its code, and not on
//    the position of the code it was wrongly reaching before. Positions are compared as FEN (board, side to move,
//    castling, en passant), so a transposition to the reference position passes.
//    Reference: lichess-org/chess-openings at commit a6189a3 (the copy pinned in PR #28, tools/eco-audit/ref).
// 2. The ten survey-slot lines repaired in PR #13 must still be in index.html, byte for byte.
//
// Usage: node eco_lines.test.js [path/to/index.html]   (npm run test:eco-lines)
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { Chess } = require('chess.js');

const htmlPath = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const lines = fs.readFileSync(htmlPath, 'utf8').split('\n');

// code: the vault line's ECO code; ref: the lichess line for that code; wrong: the lichess line it used to reach
const REPAIRED_VAULT_LINES = [
  { code: 'D71', name: 'Neo-Grünfeld Defense: Exchange Variation',
    ref: '1. d4 Nf6 2. c4 g6 3. g3 Bg7 4. Bg2 d5 5. cxd5 Nxd5',
    wrong: { code: 'D70', name: 'Neo-Grünfeld Defense: with g3', line: '1. d4 Nf6 2. c4 g6 3. g3 d5' } },
  { code: 'E00', name: 'Catalan Opening',
    ref: '1. d4 Nf6 2. c4 e6 3. g3',
    wrong: { code: 'A50 (no E00 entry)', name: 'stops at 2...e6, before 3.g3', line: '1. d4 Nf6 2. c4 e6' } },
  // Short-line batch: each line stopped before its code's reference position
  { code: 'A69', name: 'Benoni Defense: Four Pawns Attack, Main Line',
    ref: '1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Nf3 O-O 9. Be2 Re8',
    wrong: { code: 'A68', name: 'Benoni Defense: Four Pawns Attack', line: '1. d4 Nf6 2. c4 c5 3. d5 e6 4. Nc3 exd5 5. cxd5 d6 6. e4 g6 7. f4 Bg7 8. Nf3 O-O 9. Be2' } },
  { code: 'B56', name: 'Sicilian Defense: Classical Variation',
    ref: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 Nc6',
    wrong: { code: 'no entry', name: 'stops at 5.Nc3, before 5...Nc6', line: '1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3' } },
  { code: 'C19', name: 'French Defense: Winawer Variation, Positional Variation',
    ref: '1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7 7. Nf3',
    wrong: { code: 'C18', name: 'French Defense: Winawer Variation, Advance Variation', line: '1. e4 e6 2. d4 d5 3. Nc3 Bb4 4. e5 c5 5. a3 Bxc3+ 6. bxc3 Ne7' } },
  { code: 'C77', name: 'Ruy Lopez: Morphy Defense, Anderssen Variation',
    ref: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. d3',
    wrong: { code: 'no entry', name: 'stops at 4...Nf6, before any C77 move 5', line: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6' } },
  { code: 'C83', name: 'Ruy Lopez: Open, Classical Defense',
    ref: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6 9. c3 Be7',
    wrong: { code: 'C80', name: 'Ruy Lopez: Open, Main Line', line: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Nxe4 6. d4 b5 7. Bb3 d5 8. dxe5 Be6' } },
  { code: 'D56', name: 'Queen\'s Gambit Declined: Lasker Defense',
    ref: '1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4',
    wrong: { code: 'D55', name: 'Queen\'s Gambit Declined: Neo-Orthodox Variation, Main Line', line: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4' } },
  { code: 'D57', name: 'Queen\'s Gambit Declined: Lasker Defense, Main Line',
    ref: '1. d4 d5 2. c4 e6 3. Nc3 Be7 4. Nf3 Nf6 5. Bg5 h6 6. Bh4 O-O 7. e3 Ne4 8. Bxe7 Qxe7 9. cxd5 Nxc3 10. bxc3',
    wrong: { code: 'no entry', name: 'stops at 8...Qxe7, before 9.cxd5', line: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 h6 7. Bh4 Ne4 8. Bxe7 Qxe7' } },
  { code: 'D68', name: 'Queen\'s Gambit Declined: Orthodox Defense, Classical Variation',
    ref: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O Nxc3 12. Rxc3 e5',
    wrong: { code: 'D67', name: 'Queen\'s Gambit Declined: Orthodox Defense, Main Line', line: '1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 11. O-O' } },
  { code: 'D99', name: 'Grünfeld Defense: Russian Variation, Yugoslav Variation',
    ref: '1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3 Nfd7 9. Qb3 c5',
    wrong: { code: 'no entry', name: 'stops at 8.Be3, before 8...Nfd7', line: '1. d4 Nf6 2. c4 g6 3. Nc3 d5 4. Nf3 Bg7 5. Qb3 dxc4 6. Qxc4 O-O 7. e4 Bg4 8. Be3' } },
  { code: 'E19', name: 'Queen\'s Indian Defense: Classical Variation, Traditional Variation, Main Line',
    ref: '1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3 9. Qxc3',
    wrong: { code: 'no entry', name: 'stops at 8...Nxc3, before 9.Qxc3', line: '1. d4 Nf6 2. c4 e6 3. Nf3 b6 4. g3 Bb7 5. Bg2 Be7 6. O-O O-O 7. Nc3 Ne4 8. Qc2 Nxc3' } },
];

// sha256 of each line PR #13 (merge fbcafc6) added to index.html
const PR13_LINES = {
  'C51 white': '0f57fc4a1eb59f94ba9f150355c650aacc3cd55d25d005dd55d3d82fa97fbfa4',
  'B99 black': 'cbbd04e055f9b0d8cb4aa3fd9f7629759bb135d98e3ed60f3fa514a8ef01cc49',
  'C45 white': '9dc3f967e10725bb77bb1d8315022c0568b562ef17f6889228ea293023196019',
  'C29 white': 'f3e244e136ce6a0748611bf1b864c7f26b776e4b55f1fbcdbaa7e47f2c87e1c3',
  'E97 black': '6b2f3a762324af7b9559aae7382acb877dbae258ea75a19d0a5017ee7ad30475',
  'D85 black': '9857df48afb31b1331ec1150ff8d28f8c18dd9cf6d1eb57aed785f0d373f0fa6',
  'E01 white': '8f0e77866b6163a4826395490f74e3487ef4442ed0f8f562161ef1ce04eb3769',
  'A36 white': '88b4480b9203644af91286ce7fd240144e1a82046f9c6263050fcc8035cfc366',
  'A09 white': '336ebc52c0d40f8948772772981e1e4da991f38b824b37e2e0a15de77c0343af',
  'A07 white': 'f686777c16233cd0989fccbc6a31cfdd61f6565d6232d4bc9bda12e366ce1d1b',
};

const sanList = moves => moves.replace(/\d+\.\s*/g, ' ').trim().split(/\s+/);
function play(moves) {
  const game = new Chess();
  for (const san of sanList(moves)) if (!game.move(san)) return { illegal: san };
  return { fen: game.fen().split(' ').slice(0, 4).join(' ') };
}

let failed = 0;
const check = (ok, text) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}: ${text}`); };

for (const r of REPAIRED_VAULT_LINES) {
  const rows = lines.filter(l => l.trimStart().startsWith(`"${r.code}": { moves: "`));
  if (rows.length !== 1) { check(false, `${r.code}: expected 1 vault line, found ${rows.length}`); continue; }
  const m = rows[0].match(/moves: "([^"]*)", commentary: (\[.*\]) \}/);
  if (!m) { check(false, `${r.code}: vault line cannot be read`); continue; }
  const got = play(m[1]), ref = play(r.ref), wrong = play(r.wrong.line);
  console.log(`${r.code}: "${m[1]}"`);
  check(!got.illegal, `${r.code}: every move is legal${got.illegal ? ` (illegal: ${got.illegal})` : ''}`);
  check(got.fen === ref.fen, `${r.code}: ends on the reference position for ${r.code} "${r.name}" (${r.ref})`);
  check(got.fen !== wrong.fen, `${r.code}: no longer ends on ${r.wrong.code} "${r.wrong.name}" (${r.wrong.line})`);
  const commentary = JSON.parse(m[2]);
  check(commentary.length === sanList(m[1]).length, `${r.code}: one commentary entry per move (${commentary.length} for ${sanList(m[1]).length})`);
}

const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const counts = {};
for (const l of lines) { const h = sha(l); counts[h] = (counts[h] || 0) + 1; }
for (const [slot, hash] of Object.entries(PR13_LINES)) {
  check(counts[hash] === 1, `PR #13 ${slot} line unchanged (${counts[hash] || 0} match)`);
}

console.log(`\n${failed ? `FAIL (${failed})` : 'PASS'}`);
process.exit(failed ? 1 : 0);
