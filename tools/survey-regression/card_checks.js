// Shared rules for the text on a results-page recommendation card. Used by survey_regression.js
// (every pick reachable through retakes) and clickthrough.js (the cards as rendered).
//
// summaryIssues() returns the problems with one card's summary, as short codes:
//   empty         no summary text
//   fallback      the generic "Starts with <moves>" text ecoToSystem uses when it has nothing better
//   move-comment  the summary is copied from a move comment in ecoVaultData (the text after " — "),
//                 not written as a description of the opening
//   wrong-side    a Black card whose summary is the comment on a White move (or the other way round)
// A hand-written system (one of the 36 in archetypes) is checked by the same rules.
//
// Known issues: known-card-issues.json lists the issues that exist today, keyed "ECO|side". A listed
// issue is reported, not failed; an issue that is not listed fails; a listed issue that no longer
// occurs also fails, so the list can only shrink as fixes land (remove the entry in the fixing PR).
const fs = require('fs');
const path = require('path');

const KNOWN_PATH = path.join(__dirname, 'known-card-issues.json');

// Written at the top of known-card-issues.json: what the list is and how each kind of entry goes away
const KNOWN_HEADER = {
  about: 'Temporary list of known summary problems on survey recommendation cards, keyed "ECO|side". Listed issues are reported, not failed. It may only shrink: a new issue fails the test, and a listed issue that no longer occurs fails until its entry is removed (npm run prune:known-card-issues). Never add entries to make a test pass without owner approval.',
  removal: {
    fallback: 'Card shows the generic "Starts with <moves>" text. Removed when a sourced family-and-side summary (or a per-code override) covers this ECO code and side.',
    'move-comment': 'Card summary is a copied move comment such as "English" or "Queen\'s Pawn". Removed by the same family-and-side summary data.',
    'wrong-side': 'Black card summarised by the comment on a White move. Removed by the same data; the summary must be written for the side being recommended.'
  }
};

// card: { eco, side: 'white'|'black', summary, comments: ecoVaultData[eco].commentary }
function summaryIssues(card) {
  const text = String(card.summary || '').trim();
  if (!text) return ['empty'];
  if (/^Starts with /.test(text)) return ['fallback'];
  // Ply i (0-based) is a White move when i is even
  const from = (card.comments || []).map((c, i) => ({ text: String(c).split(' — ').slice(1).join(' — ').trim(), white: i % 2 === 0 })).filter(c => c.text);
  const hit = from.find(c => c.text === text);
  if (!hit) return [];
  return hit.white === (card.side === 'white') ? ['move-comment'] : ['move-comment', 'wrong-side'];
}

function loadKnown() {
  if (!fs.existsSync(KNOWN_PATH)) return {};
  return JSON.parse(fs.readFileSync(KNOWN_PATH, 'utf8')).issues || {};
}

// found: { "ECO|side": [codes] } for every card checked. Returns fails and the listed issues seen.
// strict = true ignores the known list (shows what the checks catch without it).
function compareKnown(found, { strict = false, checkedAll = false } = {}) {
  const known = strict ? {} : loadKnown();
  const fails = [], listed = [];
  for (const [key, codes] of Object.entries(found)) for (const code of codes) {
    if ((known[key] || []).includes(code)) listed.push(`${key} ${code}`);
    else fails.push(`card ${key}: summary ${code}`);
  }
  // A listed issue that no longer occurs must be removed from the list (only when every card was checked)
  if (checkedAll) for (const [key, codes] of Object.entries(known)) for (const code of codes)
    if (!(found[key] || []).includes(code)) fails.push(`known-card-issues.json lists ${key} ${code}, but it no longer occurs: remove that entry`);
  return { fails, listed };
}

// One card per line, so a fix PR's removals read as a plain list in the diff
function writeKnown(issues) {
  const head = JSON.stringify(KNOWN_HEADER, null, 1).replace(/\n}$/, '');
  const body = Object.keys(issues).sort().map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(issues[k])}`).join(',\n');
  fs.writeFileSync(KNOWN_PATH, `${head},\n "issues": {\n${body}\n }\n}\n`);
}

module.exports = { summaryIssues, loadKnown, compareKnown, writeKnown, KNOWN_PATH, KNOWN_HEADER };
