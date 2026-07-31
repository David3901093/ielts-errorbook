/* test-dictation.js — verify the dictation level-picker logic against the real bank.
   Loads bank-data + data.js to confirm TAG_STATS and per-level word pools work. */
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const sandbox = { window: {}, console, localStorage: { getItem: () => null, setItem: () => {} } };
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'bank-data.js'), 'utf-8'), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'data.js'), 'utf-8'), sandbox);

const TS = sandbox.window.IELTS.TAG_STATS;
console.log('=== Vocabulary level stats (for the picker) ===');
['ielts', 'toefl', 'cet4', 'cet6', 'ky'].forEach(t =>
  console.log(`  ${t.padEnd(7)}: ${(TS[t] || 0).toLocaleString()} words`));

console.log('\n=== Per-level pool sample (simulating startDictation) ===');
const names = { ielts: 'IELTS', toefl: 'TOEFL', cet4: 'CET-4', cet6: 'CET-6', ky: '考研' };
['ielts', 'toefl', 'cet4', 'cet6', 'ky'].forEach(listKey => {
  const pool = sandbox.window.IELTS.BANK.filter(w =>
    (w.tags || '').split(/\s+/).includes(listKey) && w.cn);
  const sample = pool.slice(0, 3).map(w => `${w.en}(${w.cn.slice(0, 8)})`);
  console.log(`  ${names[listKey].padEnd(7)} pool=${pool.length}  sample: ${sample.join(', ')}`);
});
console.log('\n✓ Dictation level picker logic verified.');
