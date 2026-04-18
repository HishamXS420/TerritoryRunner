const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace(/^\s*\/\/.*$/gm, '');
code = code.replace(/\n{3,}/g, '\n\n');
fs.writeFileSync('server.js', code);
