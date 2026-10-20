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
