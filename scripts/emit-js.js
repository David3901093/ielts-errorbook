/* emit-js.js — convert bank.json into a browser-loadable js/bank-data.js */
const fs = require('fs');
const path = require('path');
const b = require(path.join(__dirname, '..', 'js', 'bank.json'));

const header = '/* Auto-generated from official IELTS/CET6 vocab (Apache-2.0, AlphaYuU/Ewords-English-Dictation). Do not edit by hand. */\n';
const js = header + 'window.__BANK = ' + JSON.stringify(b.words) + ';\n';
const out = path.join(__dirname, '..', 'js', 'bank-data.js');
fs.writeFileSync(out, js, 'utf-8');
console.log('wrote js/bank-data.js:', (fs.statSync(out).size / 1024).toFixed(0), 'KB,', b.words.length, 'words');
