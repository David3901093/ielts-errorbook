/* verify-seeds.js — confirm all red-word seeds are present and well-formed. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const sandbox = { window: {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'bank-data.js'), 'utf-8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf-8'), sandbox);

const seeds = sandbox.window.IELTS.SEED_ERRORS;
console.log('Total SEED_ERROR_WORDS:', seeds.length);
console.log('\n--- all seeds (misspelled → correct) ---');
seeds.forEach(s => {
  const inBank = sandbox.window.IELTS.BANK.find(w => w.en.toLowerCase() === s.en.toLowerCase());
  console.log(`${(s.misspelled||'').padEnd(16)} → ${s.en.padEnd(14)} | ${s.cn} | inBank:${!!inBank} | img:${s.img||'?'}`);
});

// duplicate check
const lower = seeds.map(s => s.en.toLowerCase());
const dupes = lower.filter((w, i) => lower.indexOf(w) !== i);
console.log('\nDuplicates:', dupes.length ? dupes : 'none');
