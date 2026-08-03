import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/components/publisher/PublisherCanvas.tsx", "utf8");
assert.match(source, /typeof item\.fontFamily === "string"/);
assert.match(source, /item\.fontFamily\.trim\(\)/);
assert.match(source, /safeTextPathMode/);
assert.match(source, /Platform\.OS === "web" \? \(\{ textIndent: firstIndent \}/);
console.log("Phase 25.42.6.2 PublisherCanvas text safety checks passed.");
