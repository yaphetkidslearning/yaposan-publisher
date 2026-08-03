import fs from "node:fs";
import assert from "node:assert/strict";
const source = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");
assert.match(source, /height: 300/);
assert.match(source, /heroPromptShell/);
assert.match(source, /Describe a flyer, product scene, campaign, or document/);
assert.match(source, /router\.push\("\/ai"\)/);
assert.doesNotMatch(source, /aspectRatio: 1020 \/ 429/);
console.log("Phase 25.42.3 hero size and search test passed.");
