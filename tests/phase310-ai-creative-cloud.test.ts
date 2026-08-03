import test from "node:test";
import assert from "node:assert/strict";
import { PHASE31_MODULES, createPhase31Job, advancePhase31Job, searchSmartAssets, findDuplicateAssets, getPhase31Completion } from "../src/utils/phase31CreativeCloudEngine";

test("Phase 31 includes packages 31.0 through 31.12", () => {
  assert.equal(PHASE31_MODULES.length, 13);
  assert.deepEqual(PHASE31_MODULES.map((item) => item.id), ["31.0","31.1","31.2","31.3","31.4","31.5","31.6","31.7","31.8","31.9","31.10","31.11","31.12"]);
  assert.equal(getPhase31Completion(), 100);
});

test("creative cloud queue jobs advance to completion", () => {
  const queued = createPhase31Job("Generate campaign");
  assert.equal(queued.status, "queued");
  const completed = advancePhase31Job(queued, 100);
  assert.equal(completed.status, "completed");
  assert.equal(completed.progress, 100);
});

test("smart asset search and duplicate detection work", () => {
  const assets = [
    { id:"1", name:"Blue Logo", type:"image" as const, tags:["brand"], colors:["blue"], qualityScore:95, duplicateGroup:"a", version:1 },
    { id:"2", name:"Blue Logo Copy", type:"image" as const, tags:["brand"], colors:["blue"], qualityScore:90, duplicateGroup:"a", version:2 },
    { id:"3", name:"Launch Video", type:"video" as const, tags:["campaign"], colors:["black"], qualityScore:88, version:1 },
  ];
  assert.equal(searchSmartAssets(assets, "brand").length, 2);
  assert.equal(findDuplicateAssets(assets).length, 1);
});
