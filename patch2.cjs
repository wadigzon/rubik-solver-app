const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, 'node_modules', 'cubejs', 'lib', 'cube.js'),
  path.join(__dirname, 'node_modules', 'cubejs', 'lib', 'solve.js'),
  path.join(__dirname, 'node_modules', 'cubejs', 'lib', 'async.js')
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Patch reading Cube from 'this' which causes crashes in ES modules
    code = code.replace(
      /this\.Cube\s*\|\|/g,
      '(typeof globalThis !== "undefined" ? globalThis.Cube : typeof window !== "undefined" ? window.Cube : typeof this !== "undefined" ? this.Cube : undefined) ||'
    );
    
    fs.writeFileSync(file, code);
    console.log(`Patched reads in ${file}`);
  }
}
