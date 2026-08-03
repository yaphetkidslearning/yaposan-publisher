import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync("src/app/index.tsx", "utf8");

test("phase 25.16 adds the colorful 3D publication tray", () => {
  assert.match(home, /publicationTray/);
  assert.match(home, /templateInnerFrame/);
  assert.match(home, /templateIconDepth/);
  assert.match(home, /borderBottomWidth: 7/);
  assert.match(home, /shadowOpacity: 0\.72/);
});

test("phase 25.16 keeps all ten publication shortcuts", () => {
  for (const label of ["Flyer", "Brochure", "Business Card", "Newsletter", "Poster", "Menu", "Certificate", "Invitation", "Label", "Presentation"]) {
    assert.ok(home.includes(`title: "${label}"`), `missing ${label}`);
  }
});
