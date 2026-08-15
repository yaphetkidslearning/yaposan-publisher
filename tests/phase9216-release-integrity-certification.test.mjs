import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(p)=>fs.readFileSync(new URL(`../${p}`,import.meta.url),"utf8");
const pkg=JSON.parse(read("package.json"));
const lock=JSON.parse(read("package-lock.json"));
const phase=read("release/CURRENT_CREATIVE_PLATFORM_PHASE").trim();
const ai=read("src/app/ai-provider-settings.tsx");
const toolbar=read("src/components/publisher/EditorToolbar.tsx");

test("92.16 release integrity remains valid in later releases",()=>{
  const parse=(value)=>value.split(".").map(Number);
  const atLeast=(value,baseline)=>{const a=parse(value),b=parse(baseline);for(let i=0;i<Math.max(a.length,b.length);i++){const av=a[i]??0,bv=b[i]??0;if(av!==bv)return av>bv}return true};
  assert.ok(atLeast(pkg.version,"92.16"));
  assert.equal(lock.version,pkg.version);
  assert.equal(lock.packages[""].version,pkg.version);
  assert.equal(phase,pkg.version);
  assert.ok(pkg.scripts["verify:phase92.16"]);
});

test("92.14 AI-provider effect fix is preserved",()=>{
  assert.match(ai,/let cancelled=false/);
  assert.match(ai,/loadAISettings\(\)\.then/);
  assert.match(ai,/loadAIUsage\(\)\.then/);
  assert.doesNotMatch(ai,/useEffect\(\(\)=>\{loadAISettings\(\)\.then/);
});

test("92.15 font flyout is preserved in 92.16",()=>{
  assert.match(toolbar,/Word\/Excel-style anchored font flyout/);
  assert.match(toolbar,/fontDropdownPanel/);
  assert.match(toolbar,/fontDropdownBackdrop/);
});
