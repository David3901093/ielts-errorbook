/* verify-merge.js — simulate browser load to confirm bank merge works.
   Loads bank-data.js + data.js in a fake `window` and inspects IELTS.BANK. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const sandbox = { window: {}, console };
sandbox.window = sandbox;
vm.createContext(sandbox);

// load bank-data.js (sets window.__BANK)
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'bank-data.js'), 'utf-8'), sandbox);
// load data.js (reads window.__BANK, sets window.IELTS)
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf-8'), sandbox);

const IELTS = sandbox.window.IELTS;
console.log('BANK total:', IELTS.BANK.length);

// coverage
const withEx = IELTS.BANK.filter(w => w.examples && w.examples.length).length;
const withEtym = IELTS.BANK.filter(w => w.etymology).length;
console.log('with examples:', withEx, '(' + (100*withEx/IELTS.BANK.length).toFixed(1) + '%)');
console.log('with etymology:', withEtym);

// hand-written richness preserved?
console.log('\n--- hand-written richness check ---');
['poisonous','academic','theoretical','conservative'].forEach(en => {
  const w = IELTS.BANK.find(x => x.en.toLowerCase() === en);
  if (!w) { console.log(en, 'MISSING'); return; }
  console.log(en, '| ex:', (w.examples||[]).length, '| etym:', !!w.etymology, '| syn:', (w.synonyms||[]).length, '| cn:', w.cn);
});

// fuzzy candidates count (for error-bank suggestions)
console.log('\nfuzzy candidates:', IELTS.BANK.map(w=>w.en).length);
