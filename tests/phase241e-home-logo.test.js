const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'src/app/index.tsx'), 'utf8');
const asset = path.join(root, 'assets/images/yaposan-phase241e-logo.png');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const checks = [
  [fs.existsSync(asset), 'new logo asset exists'],
  [home.includes('yaposan-phase241e-logo.png'), 'Home imports the new logo'],
  [home.includes('style={styles.tBrandLogo}'), 'Home uses the dedicated logo style'],
  [home.includes('accessibilityLabel="Yaposan Creative Suite logo"'), 'logo includes an accessibility label'],
  [!home.includes('<View style={styles.tBrandMark}><Text style={styles.tBrandMarkText}>Y</Text></View>'), 'old temporary Y mark is removed'],
  [pkg.version === '24.1.4', 'package version is 24.1.4'],
];

for (const [ok, message] of checks) {
  if (!ok) throw new Error(`Phase 24.1E verification failed: ${message}`);
}
console.log('Phase 24.1E logo integration verification passed');
