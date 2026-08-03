import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");
assert.match(source, /hero-phase25\.42\.2\.png/);
assert.match(source, /heroDepthLayer/);
assert.match(source, /heroGloss/);
assert.doesNotMatch(source, /styles\.heroPromptOverlay/);
assert.doesNotMatch(source, /source=\{require\("\.\.\/\.\.\/assets\/home\/hero-phase25\.42\.png"\)\}/);
console.log("Phase 25.42.2 home hero correction test passed.");
