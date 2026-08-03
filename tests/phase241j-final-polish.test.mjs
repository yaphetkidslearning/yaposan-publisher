import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const home = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("Phase 24.1J version is 24.1.9", () => assert.equal(pkg.version, "24.1.9"));
test("desktop sidebar is widened", () => assert.match(home, /tSidebar: \{ width: 260,/));
test("subtle top lighting exists", () => {
  assert.match(home, /topEdgeLight/);
  assert.match(home, /topLeftCornerLight/);
  assert.match(home, /topRightCornerLight/);
});
test("dark 24.0Z4 background is retained", () => assert.match(home, /darkContent: \{ backgroundColor: "#020d17" \}/));
test("Phase 24.1I navigation remains", () => {
  assert.match(home, /Productivity/);
  assert.match(home, /Macros/);
});
