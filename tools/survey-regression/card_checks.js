// Shared rules for the text on a results-page recommendation card. Used by survey_regression.js
// (every pick reachable through retakes) and clickthrough.js (the cards as rendered).
//
// summaryIssues() returns the problems with one card's summary, as short codes:
//   empty         no summary text
//   fallback      the generic "Starts with <moves>" text ecoToSystem uses when it has nothing better
//   generic-summary a neutral but non-opening-specific Black fallback; tracked separately until sourced data replaces it
//   move-comment  the summary is a move comment from ecoVaultData (the text after " — "), not a description
//                 of the opening. Reformatting does not hide it: case, punctuation and a leading move label
//                 such as "2...Nc6:" are ignored, and a summary that is only move comments plus fewer than
//                 4 other words also counts
//   wrong-side    a Black card whose summary is the comment on a White move (or the other way round)
// gmHeadingIssues() returns the problem with a card's "Notable GM:" line, as rendered:
//   no-gm-heading a card with no approved Notable GM must still show "Notable GM: None approved for this
//                 opening yet." (owner decision, 2026-10-20)
// A hand-written system (one of the 36 in archetypes) is checked by the same rules.
//
// Known issues: known-card-issues.json lists the issues that exist today, keyed "ECO|side". A listed
// issue is reported, not failed; an issue that is not listed fails; a listed issue that no longer
// occurs also fails, so the list can only shrink as fixes land (remove the entry in the fixing PR).
const fs = require('fs');
const path = require('path');

const KNOWN_PATH = path.join(__dirname, 'known-card-issues.json');
const NO_GM_TEXT = 'None approved for this opening yet.';
// Which test finds each issue type: survey_regression.js checks every reachable card's summary;
// clickthrough.js renders the cards of its cases, so it is the one that checks the Notable GM line
const SUMMARY_TYPES = ['empty', 'fallback', 'generic-summary', 'move-comment', 'wrong-side'];
const HEADING_TYPES = ['no-gm-heading'];

// Written at the top of known-card-issues.json: what the list is and how each kind of entry goes away
const KNOWN_HEADER = {
  about: 'Temporary list of known summary problems on survey recommendation cards, keyed "ECO|side". Listed issues are reported, not failed. It may only shrink; an already-known card may be reclassified as generic-summary when an unsourced Black fallback replaces an earlier summary defect. New card keys or unrelated issue types are not allowed by the shrink guard. Never add entries to make a test pass without owner approval.',
  removal: {
    fallback: 'Card shows the generic "Starts with <moves>" text. Removed when a sourced family-and-side summary (or a per-code override) covers this ECO code and side.',
    'generic-summary': 'Generated Black card uses a neutral generic reply sentence rather than an opening-specific sourced summary. Removed only when a sourced family-and-side summary (or a per-code override) covers this ECO code and side.',
    'move-comment': 'Card summary is a copied move comment such as "English" or "Queen\'s Pawn". Removed by the same family-and-side summary data.',
    'wrong-side': 'Black card summarised by the comment on a White move. Removed by the same data; the summary must be written for the side being recommended.',
    'no-gm-heading': 'Card with no approved Notable GM has no "Notable GM:" line. Removed when the results page shows "Notable GM: None approved for this opening yet." on such cards (checked by clickthrough.js on its cases).'
  }
};

const norm = t => String(t).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const words = t => (t ? t.split(' ').length : 0);
// A leading move label: "2...Nc6:", "1. e4 -", "Nc6 —"
const MOVE_LABEL = /^\s*(?:\d+\s*\.(?:\s*\.\.)?\s*)?(?:[KQRBN][a-h]?[1-8]?x?[a-h][1-8]|[a-h](?:x[a-h])?[1-8](?:=[QRBN])?|O-O(?:-O)?)[+#]?\s*[:—–-]\s*/;

// card: { eco, side: 'white'|'black', summary, comments: ecoVaultData[eco].commentary }
function summaryIssues(card) {
  const text = String(card.summary || '').trim();
  if (!text) return ['empty'];
  if (/^Starts with /.test(text)) return ['fallback'];
  if (card.side === 'black' && /^In .+, Black's (?:\.\.\.\S+ reply|reply) defines this line and shapes the plans that follow\.$/.test(text)) return ['generic-summary'];
  // Ply i (0-based) is a White move when i is even
  const notes = (card.comments || []).map((c, i) => ({ text: norm(String(c).split(' — ').slice(1).join(' — ')), white: i % 2 === 0 })).filter(c => c.text);
  const body = norm(text.replace(MOVE_LABEL, ''));
  let hits = notes.filter(c => c.text === body);
  if (!hits.length) {
    // Only move comments plus a few words: remove every comment of 2+ words found in the summary (longest first)
    let rest = ` ${body} `;
    for (const c of notes.filter(n => words(n.text) >= 2).sort((x, y) => y.text.length - x.text.length))
      if (rest.includes(` ${c.text} `)) { hits.push(c); rest = rest.split(` ${c.text} `).join(' '); }
    if (words(rest.trim()) >= 4) hits = [];
  }
  if (!hits.length) return [];
  return hits.some(c => c.white !== (card.side === 'white')) ? ['move-comment', 'wrong-side'] : ['move-comment'];
}

// card: { gm (shown GM or null), line (text of the card's "Notable GM:" line, '' if none) }
function gmHeadingIssues(card) {
  if (card.gm) return [];
  return String(card.line || '').replace(/\s+/g, ' ').trim() === `Notable GM: ${NO_GM_TEXT}` ? [] : ['no-gm-heading'];
}

function loadKnown() {
  if (!fs.existsSync(KNOWN_PATH)) return {};
  return JSON.parse(fs.readFileSync(KNOWN_PATH, 'utf8')).issues || {};
}

// found: { "ECO|side": [codes] } for every card checked. Returns fails and the listed issues seen.
// types: the issue types this test checks; listed entries of other types are left to the other test.
// strict = true ignores the known list (shows what the checks catch without it).
// checkedAll = true: every card that can have these types was checked, so a listed issue that did not
// occur is stale and fails.
function compareKnown(found, { strict = false, checkedAll = false, types = SUMMARY_TYPES } = {}) {
  const known = strict ? {} : loadKnown();
  const fails = [], listed = [];
  for (const [key, codes] of Object.entries(found)) for (const code of codes) {
    if ((known[key] || []).includes(code)) listed.push(`${key} ${code}`);
    else fails.push(`card ${key}: ${HEADING_TYPES.includes(code) ? 'Notable GM line' : 'summary'} ${code}`);
  }
  if (checkedAll) for (const [key, codes] of Object.entries(known)) for (const code of codes)
    if (types.includes(code) && !(found[key] || []).includes(code)) fails.push(`known-card-issues.json lists ${key} ${code}, but it no longer occurs: remove that entry (npm run prune:known-card-issues)`);
  return { fails, listed };
}

// Removes listed entries of these types that did not occur; never adds. Returns how many were removed.
function pruneKnown(found, types) {
  const issues = loadKnown();
  let removed = 0;
  for (const [key, codes] of Object.entries(issues)) {
    const keep = codes.filter(code => !types.includes(code) || (found[key] || []).includes(code));
    removed += codes.length - keep.length;
    if (keep.length) issues[key] = keep; else delete issues[key];
  }
  writeKnown(issues);
  return removed;
}

// Entries in `head` (a known-card-issues "issues" object) that `base` does not have, per card and issue type
function additions(head, base) {
  const out = [];
  for (const [key, codes] of Object.entries(head || {})) for (const code of codes)
    if (!((base || {})[key] || []).includes(code)) out.push(`${key} ${code}`);
  return out;
}

// "457 cards with issues (White 176, Black 281); 463 findings (fallback 436, ...)"
function countLine(found, sideLabel = true) {
  const keys = Object.keys(found), counts = {};
  let n = 0;
  for (const codes of Object.values(found)) for (const c of codes) { counts[c] = (counts[c] || 0) + 1; n++; }
  const side = s => keys.filter(k => k.endsWith('|' + s)).length;
  return `${keys.length} unique cards (ECO|side) with issues${sideLabel ? ` (White ${side('white')}, Black ${side('black')})` : ''}; ${n} issue findings (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}); ${keys.filter(k => found[k].length > 1).length} cards have more than one finding`;
}

// One card per line, so a fix PR's removals read as a plain list in the diff
function writeKnown(issues) {
  const head = JSON.stringify(KNOWN_HEADER, null, 1).replace(/\n}$/, '');
  const body = Object.keys(issues).sort().map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(issues[k])}`).join(',\n');
  fs.writeFileSync(KNOWN_PATH, `${head},\n "issues": {\n${body}\n }\n}\n`);
}

module.exports = { summaryIssues, gmHeadingIssues, loadKnown, compareKnown, pruneKnown, additions, countLine, writeKnown, KNOWN_PATH, KNOWN_HEADER, NO_GM_TEXT, SUMMARY_TYPES, HEADING_TYPES };
