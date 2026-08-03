const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'src/app/index.tsx'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const logo = path.join(root, 'assets/images/yaposan-phase241f-compact-logo.png');

assert.ok(fs.existsSync(logo), 'Phase 24.1F compact logo asset must exist');
assert.match(home, /yaposan-phase241f-compact-logo\.png/);
assert.match(home, /tBrandLogo: \{ width: 150, height: 55 \}/);
assert.equal(pkg.version, '24.1.5');
console.log('Phase 24.1F compact logo verification passed');
