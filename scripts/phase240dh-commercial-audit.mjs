import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'src/utils/commercialReleaseCompletionEngine.ts',
  'src/components/publisher/CommercialReleaseCompletionModal.tsx',
  'PHASE24.0D-H-COMMERCIAL-RELEASE-COMPLETION.md',
  'tests/phase240dh-commercial-release.test.mjs',
  'docs/commercial-release/USER-MANUAL.md',
  'docs/commercial-release/ADMINISTRATOR-GUIDE.md',
  'docs/commercial-release/DEVELOPER-GUIDE.md',
  'docs/commercial-release/PLUGIN-SDK-GUIDE.md',
  'docs/commercial-release/API-REFERENCE.md',
  'docs/commercial-release/RELEASE-NOTES.md'
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) { console.error('Missing Phase 24.0D-H files:\n' + missing.join('\n')); process.exit(1); }
const editor = fs.readFileSync(path.join(root, 'src/app/editor.tsx'), 'utf8');
const toolbar = fs.readFileSync(path.join(root, 'src/components/publisher/EditorToolbar.tsx'), 'utf8');
if (!editor.includes('CommercialReleaseCompletionModal') || !toolbar.includes('Commercial Release')) { console.error('Commercial Release Center is not integrated'); process.exit(1); }
console.log('Phase 24.0D-H commercial release audit passed');
