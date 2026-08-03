import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
test('commercial release engine contains D-H capabilities', () => {
  const src = read('src/utils/commercialReleaseCompletionEngine.ts');
  for (const token of ['createTrialLicense','evaluateLicense','importOfflineLicense','runSecurityAudit','createEndToEndPlan','runPerformanceBenchmarks','buildCommercialReleaseReport']) assert.match(src, new RegExp(token));
});
test('commercial release center is integrated', () => {
  assert.match(read('src/app/editor.tsx'), /CommercialReleaseCompletionModal/);
  assert.match(read('src/components/publisher/EditorToolbar.tsx'), /Commercial Release/);
});
test('production documentation exists', () => {
  for (const f of ['USER-MANUAL.md','ADMINISTRATOR-GUIDE.md','DEVELOPER-GUIDE.md','PLUGIN-SDK-GUIDE.md','API-REFERENCE.md','RELEASE-NOTES.md']) assert.ok(fs.existsSync(new URL(`../docs/commercial-release/${f}`, import.meta.url)));
});
test('package exposes final verification', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '24.0.8');
  assert.ok(pkg.scripts['verify:phase24.0dh']);
});
