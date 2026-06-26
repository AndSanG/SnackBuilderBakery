const fs = require('fs');
const pct = require('../coverage/coverage-summary.json').total.statements.pct;
const color = pct >= 90 ? 'brightgreen' : pct >= 80 ? 'green' : pct >= 70 ? 'yellow' : 'red';
const badge = `![Coverage](https://img.shields.io/badge/coverage-${Math.round(pct)}%25-${color})`;
const readme = fs.readFileSync('readme.md', 'utf8');
fs.writeFileSync('readme.md', readme.replace(/!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-[^)]+\)/, badge));
console.log(`Coverage badge updated: ${Math.round(pct)}%`);
