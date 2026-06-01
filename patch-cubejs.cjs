const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, 'node_modules', 'cubejs', 'lib', 'cube.js'),
  path.join(__dirname, 'node_modules', 'cubejs', 'lib', 'solve.js')
];

for (const file of filesToPatch) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    // Replace strict mode 'this' with a fallback to globalThis or window
    if (code.includes('this.Cube = Cube;')) {
      code = code.replace(
        'this.Cube = Cube;',
        'if (typeof globalThis !== "undefined") { globalThis.Cube = Cube; } else if (typeof window !== "undefined") { window.Cube = Cube; } else { this.Cube = Cube; }'
      );
      fs.writeFileSync(file, code);
      console.log(`Patched ${file}`);
    }
  }
}
