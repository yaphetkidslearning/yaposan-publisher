import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src/app/templates.tsx"), "utf8");

test("Phase 25.41 includes full template preview studio", () => {
  assert.match(source, /previewStudio/);
  assert.match(source, /Page \{activePage \+ 1\} of/);
  assert.match(source, /zoomIn/);
  assert.match(source, /zoomOut/);
  assert.match(source, /thumbnailStrip/);
  assert.match(source, /Use this template/);
  assert.match(source, /Template details/);
  assert.match(source, /Color palette/);
  assert.match(source, /What is included/);
});

test("Phase 25.41 preview supports multi-page navigation", () => {
  assert.match(source, /previousPage/);
  assert.match(source, /nextPage/);
  assert.match(source, /setActivePage\(index\)/);
});
