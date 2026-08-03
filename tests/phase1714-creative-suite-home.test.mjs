import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("src/app/index.tsx", "utf8");
const photoStudio = readFileSync("src/app/photo-studio.tsx", "utf8");
const card = readFileSync("src/components/CreativeSuiteCard.tsx", "utf8");

test("creative suite home exposes the three primary workspaces", () => {
  assert.match(home, /Publisher/);
  assert.match(home, /Photo Studio/);
  assert.match(home, /Yaposan AI/);
  assert.match(home, /YAPOSAN CREATIVE SUITE/);
});

test("3D cards include hover and pressed depth states", () => {
  assert.match(card, /cardHovered/);
  assert.match(card, /cardPressed/);
  assert.match(card, /translateY: 3/);
  assert.match(card, /borderColor: "#1d4ed8"/);
});

test("photo studio preserves the useful GWC Studio workflows", () => {
  for (const feature of ["Remove Background", "Magic Eraser", "AI Expand", "Relight", "Upscale", "Product Scenes", "Batch Processing"]) {
    assert.match(photoStudio, new RegExp(feature));
  }
  assert.match(photoStudio, /one project format/);
});
