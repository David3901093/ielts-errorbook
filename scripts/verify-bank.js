const b = require('../js/bank.json');
console.log('Total words:', b.count);
console.log('\n--- First 3 full entries ---');
b.words.slice(0, 3).forEach(w => console.log(JSON.stringify(w)));
console.log('\n--- Coverage stats ---');
const withCn = b.words.filter(w => w.cn).length;
const withPhon = b.words.filter(w => w.phon).length;
const withEx = b.words.filter(w => w.examples && w.examples.length).length;
console.log('with Chinese meaning:', withCn, '(' + (100*withCn/b.count).toFixed(1) + '%)');
console.log('with phonetic:', withPhon, '(' + (100*withPhon/b.count).toFixed(1) + '%)');
console.log('with example(s):', withEx, '(' + (100*withEx/b.count).toFixed(1) + '%)');
console.log('\n--- Seed words lookup ---');
['poisonous', 'academic', 'theoretical', 'annually', 'russia', 'environment', 'technology'].forEach(en => {
  const w = b.words.find(x => x.en.toLowerCase() === en);
  if (w) console.log(en, '→', w.cn || '(no cn)', '| ex:', (w.examples||[]).length);
  else console.log(en, '→ NOT FOUND');
});
