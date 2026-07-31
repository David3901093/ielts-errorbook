/* test-suggest.js — verify the autocomplete suggestion logic against the real bank. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

// load bank-data.js + data.js + fuzzy.js into a sandbox to get window.IELTS + window.Fuzzy
const sandbox = { window: {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ['bank-data.js', 'data.js', 'js-store.js']) {
  const fp = f === 'js-store.js' ? path.join('..', 'js', 'store.js') : path.join(__dirname, '..', 'js', f);
  if (fs.existsSync(fp)) vm.runInContext(fs.readFileSync(fp, 'utf-8'), sandbox);
}
// fuzzy.js is at js/fuzzy.js
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'fuzzy.js'), 'utf-8'), sandbox);

// replicate the suggestWords logic (copied from app.js)
function suggestWords(query, limit) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];
  const bank = sandbox.window.IELTS.BANK;
  const starts = [], contains = [], close = [];
  for (const w of bank) {
    const en = w.en.toLowerCase();
    if (en.startsWith(q)) starts.push(w);
    else if (en.includes(q)) contains.push(w);
  }
  if (starts.length + contains.length < limit) {
    for (const w of bank) {
      const en = w.en.toLowerCase();
      if (en.startsWith(q) || en.includes(q)) continue;
      const dist = sandbox.window.Fuzzy.levenshtein(q, en);
      const maxD = q.length <= 3 ? 1 : q.length <= 6 ? 2 : 3;
      if (dist <= maxD) close.push({ w, dist });
    }
    close.sort((a, b) => a.dist - b.dist);
  }
  return [...starts, ...contains, ...close.map(c => c.w)].slice(0, limit);
}

const tests = ['pois', 'academ', 'xyz', 'environ', 'the', 'recieve']; // 'recieve' is misspelled
tests.forEach(q => {
  const res = suggestWords(q, 10);
  console.log(`\n"${q}" → ${res.length} suggestions:`);
  res.slice(0, 5).forEach(w => console.log(`   ${w.en.padEnd(18)} ${w.cn ? w.cn.slice(0, 30) : ''}`));
});
