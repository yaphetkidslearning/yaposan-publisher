import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");

test("document declares a stable language for assistive technology", () => {
  assert.match(read("src/app/+html.tsx"), /<html\s+lang=["']en["']/);
});

test("accessibility route exposes a main landmark and labeled Help path", () => {
  const source = read("src/app/accessibility.tsx");
  assert.match(source, /accessibilityRole=["']main["']/);
  assert.match(source, /nativeID=["']main-content["']/);
  assert.match(source, /accessibilityLabel=["']Open Yaposan Help center["']/);
  assert.match(source, /href=["']\/help["']/);
});

test("web CSS preserves visible keyboard focus", () => {
  const css = read("src/global.css");
  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*3px\s+solid\s+currentColor/);
});

test("web CSS honors reduced motion without hiding content", () => {
  const css = read("src/global.css");
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /animation-duration:\s*0\.01ms\s*!important/);
  assert.match(css, /transition-duration:\s*0\.01ms\s*!important/);
});

test("forced-colors users retain a visible focus indicator", () => {
  const css = read("src/global.css");
  assert.match(css, /@media\s*\(forced-colors:\s*active\)/);
  assert.match(css, /CanvasText/);
});

test("manual WCAG and browser evidence is not falsely pre-certified", () => {
  const evidence = JSON.parse(read("release/phase90.16/browser-accessibility-evidence.json"));
  assert.equal(evidence.certificationStatus, "EXTERNAL_EVIDENCE_REQUIRED");
  for (const group of [evidence.manualAccessibilityEvidence, evidence.browserMatrixEvidence]) {
    assert.ok(Object.values(group).every((value) => value === false));
  }
});

test("top-level release tests and Phase 90.16 verifier include the new gate", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.test, /test:phase90\.16/);
  assert.match(pkg.scripts["verify:phase90.16"], /npm test/);
  assert.match(pkg.scripts["verify:phase90.16"], /build:web/);
  assert.match(pkg.scripts["verify:phase90.16"], /check:phase90\.14/);
  assert.match(pkg.scripts["verify:phase90.16"], /check:phase90\.15/);
  assert.match(pkg.scripts["verify:phase90.16"], /check:phase90\.16/);
});
