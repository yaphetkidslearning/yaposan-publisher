import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");
assert.match(source, /height: 338/);
assert.doesNotMatch(source, /maxWidth: 1180/);
assert.match(source, /heroArtworkBackdrop/);
assert.match(source, /resizeMode="contain"/);
assert.match(source, /minHeight: 54/);
console.log("Phase 25.42.5 compact full-width hero checks passed.");
