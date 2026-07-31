/* ============================================================
   build-bank.js — Parse official vocab CSVs into a clean JSON bank.
   Handles quoted CSV fields with embedded newlines/commas.
   Output: js/bank.json   (word, phon, cn, def, examples, pos, tags)
   ============================================================ */
const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..', 'data-raw');
const OUT = path.join(__dirname, '..', 'js', 'bank.json');

/* RFC4180-ish CSV parser: handles "..." quoted fields with embedded
   commas, newlines, and "" escaped quotes. */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += c; }
    } else {
      if (c === '"') { inQuotes = true; }
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  // last field/row
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function cleanPhonetic(p) {
  if (!p) return '';
  // source uses a non-IPA encoding (ә, non-standard ASCII); normalise to IPA-ish.
  // Also strip stray quotes. Many entries are usable as-is.
  let out = p.replace(/"/g, '').trim();
  return out
    .replace(/ә/g, 'ə')
    .replace(/Җ/g, 'ə')
    .replace(/ʤ/g, 'dʒ')
    .replace(/ʧ/g, 'tʃ')
    .replace(/η/g, 'ŋ');
}

function cleanCn(s) {
  // translations look like "vt. 放弃...\nn. 放任..." where \n may be literal or real.
  // Flatten to a single line, separate senses with '；'.
  if (!s) return '';
  return s
    .replace(/\\n/g, '；')      // literal backslash-n
    .replace(/\r?\n/g, '；')    // real newlines
    .replace(/；+/g, '；')       // collapse repeats
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/；$/, '');
}

function cleanDef(s) {
  if (!s) return '';
  return s.replace(/\\n/g, ' ').replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildFromCSV(file, defaultTag) {
  const text = fs.readFileSync(file, 'utf-8');
  const rows = parseCSV(text);
  if (!rows.length) return [];
  const header = rows[0];
  const col = name => header.indexOf(name);
  const i = {
    word: col('word'), phon: col('phonetic'), cn: col('translation'),
    def: col('definition'), pos: col('pos'), tag: col('tag'),
    exEn1: col('example_en_1'), exCn1: col('example_cn_1'),
    exEn2: col('example_en_2'), exCn2: col('example_cn_2')
  };
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 6) continue;
    const word = (row[i.word] || '').trim();
    if (!word || /[^a-zA-Z'\- ]/.test(word)) {
      // allow only letter words (skip pure-phrase/odd entries)
      if (!/^[a-zA-Z][a-zA-Z'\- ]*$/.test(word)) continue;
    }
    const examples = [];
    const ex1 = (row[i.exEn1] || '').trim();
    if (ex1) examples.push(row[i.exEn1].trim());
    const ex2 = (row[i.exEn2] || '').trim();
    if (ex2) examples.push(row[i.exEn2].trim());

    const tags = (row[i.tag] || defaultTag).trim();
    out.push({
      en: word,
      phon: cleanPhonetic(row[i.phon]),
      cn: cleanCn(row[i.cn]),
      def: cleanDef(row[i.def]),
      pos: (row[i.pos] || '').trim(),
      tags: tags,
      examples
    });
  }
  return out;
}

/* Parse the ladrift/toefl plain-text format: `word#pos. 中文释义, [同]synonyms;`
   MIT-licensed, TOEFL-specific, with Chinese meanings. */
function buildFromLadriftTxt(file) {
  const text = fs.readFileSync(file, 'utf-8');
  const out = [];
  text.split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (!line || !line.includes('#')) return;
    const hash = line.indexOf('#');
    const word = line.slice(0, hash).trim();
    if (!word || !/^[a-zA-Z][a-zA-Z'\-]*$/.test(word)) return; // single words only (no phrases)
    let rest = line.slice(hash + 1).trim();
    // strip the " [同]synonyms" segments — keep Chinese meaning only
    rest = rest.replace(/\s*\[同\][^;]*/g, '').replace(/;\s*$/,'').trim();
    const cn = cleanCn(rest);
    out.push({ en: word, phon: '', cn, def: '', pos: '', tags: 'toefl', examples: [] });
  });
  return out;
}

/* ---- merge multiple sources, dedupe by lowercased word, keep richest ---- */
function mergeBank(lists) {
  const map = new Map();
  for (const list of lists) {
    for (const w of list) {
      const key = w.en.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...w });
      } else {
        const old = map.get(key);
        if (!old.phon && w.phon) old.phon = w.phon;
        if (!old.cn && w.cn) old.cn = w.cn;
        if (!old.def && w.def) old.def = w.def;
        if ((!old.examples || !old.examples.length) && w.examples && w.examples.length) old.examples = w.examples;
        // merge tags
        const allTags = new Set((old.tags + ' ' + w.tags).split(/\s+/).filter(Boolean));
        old.tags = [...allTags].join(' ');
      }
    }
  }
  return [...map.values()];
}

/* ---- run ---- */
// CSV sources (AlphaYuU, Apache-2.0): columns include word/translation/tag/examples
const csvSources = [
  ['ielts.csv', 'ielts'],
  ['cet6.csv', 'cet6']
];
// Plain-text TOEFL source (ladrift/toefl, MIT): `word#中文释义` lines
const txtSources = [
  ['toefl_ladrift.txt']
];
const lists = [];
for (const [file, tag] of csvSources) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) { console.log(`(skip missing ${file})`); continue; }
  const list = buildFromCSV(p, tag);
  console.log(`${file}: parsed ${list.length} words`);
  lists.push(list);
}
for (const [file] of txtSources) {
  const p = path.join(RAW, file);
  if (!fs.existsSync(p)) { console.log(`(skip missing ${file})`); continue; }
  const list = buildFromLadriftTxt(p);
  console.log(`${file}: parsed ${list.length} TOEFL words`);
  lists.push(list);
}
const bank = mergeBank(lists);
// sort alphabetically
bank.sort((a, b) => a.en.localeCompare(b.en));

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'AlphaYuU/Ewords-English-Dictation (Apache-2.0) + ladrift/toefl (MIT)',
  count: bank.length,
  words: bank
};
fs.writeFileSync(OUT, JSON.stringify(payload), 'utf-8');
console.log(`\n✓ Merged bank: ${bank.length} unique words → ${path.relative(process.cwd(), OUT)}`);
console.log(`  size: ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
