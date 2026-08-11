import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const canonicalName = 'PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md';
const canonical = path.join(root, canonicalName);
const candidates = [
  path.join(root, 'release', 'phase90.13', 'phase90.11-certification-template.md'),
  path.join(root, 'release', 'phase90.12', canonicalName),
];

if (fs.existsSync(canonical)) {
  console.log(`Phase 90.11 canonical document present: ${canonicalName}`);
  process.exit(0);
}

const fallback = candidates.find((file) => fs.existsSync(file));
if (!fallback) {
  throw new Error(`Cannot repair missing ${canonicalName}: no bundled certification template is available.`);
}
fs.copyFileSync(fallback, canonical);
console.log(`Repaired missing Phase 90.11 canonical document from ${path.relative(root, fallback)}.`);
