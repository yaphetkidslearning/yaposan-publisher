import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/app/index.tsx", "utf8");

test("uses the exact approved reference image", () => {
  assert.match(source, /phase241k-reference-home\.png/);
});

test("keeps functional navigation hotspots", () => {
  assert.match(source, /publisher-card/);
  assert.match(source, /photo-card/);
  assert.match(source, /templates-view-all/);
});

test("scales the reference without changing its aspect ratio", () => {
  assert.match(source, /Math\.min\(availableWidth \/ BASE_WIDTH, availableHeight \/ BASE_HEIGHT\)/);
});
