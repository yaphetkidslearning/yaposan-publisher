import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("Phase 24 release engine exposes certification and export APIs", () => {
  const source = read("src/utils/platformReleaseCertificationEngine.ts");
  assert.match(source, /export function certifyPlatformRelease/);
  assert.match(source, /export function exportPlatformReleaseCertification/);
  assert.match(source, /yaposan\.phase24\.release-certification/);
  assert.match(source, /production-readiness/);
});

test("Phase 24 release center is connected to the real editor", () => {
  const editor = read("src/app/editor.tsx");
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  assert.match(editor, /PlatformReleaseCertificationModal/);
  assert.match(editor, /onOpenPlatformReleaseCertification/);
  assert.match(editor, /final-release-certification\.json/);
  assert.match(toolbar, /Final Release/);
  assert.match(toolbar, /Release Center/);
});

test("Phase 24 has one authoritative final verification command", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.version, "24.0.0");
  assert.match(pkg.scripts["verify:phase24"], /verify:phase23\.5/);
  assert.match(pkg.scripts["verify:phase24"], /test:phase24/);
  assert.match(pkg.scripts["verify:phase24"], /audit:phase24/);
  assert.match(pkg.scripts["verify:phase24"], /release:manifest/);
  assert.match(pkg.scripts["verify:phase24"], /expo export --platform web/);
});
