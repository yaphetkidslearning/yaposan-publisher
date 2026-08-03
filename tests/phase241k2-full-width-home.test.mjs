import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/app/index.tsx", "utf8");

test("fills the full available viewport width and height", () => {
  assert.match(source, /const canvasWidth = availableWidth/);
  assert.match(source, /const canvasHeight = availableHeight/);
});

test("uses independent horizontal and vertical scaling", () => {
  assert.match(source, /const scaleX = availableWidth \/ BASE_WIDTH/);
  assert.match(source, /const scaleY = availableHeight \/ BASE_HEIGHT/);
});

test("keeps hotspots aligned after full-width stretching", () => {
  assert.match(source, /left: item.x \* scaleX/);
  assert.match(source, /top: item.y \* scaleY/);
});
