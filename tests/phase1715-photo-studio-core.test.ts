import assert from "node:assert/strict";
import test from "node:test";
import { addPhotoAssets, createPhotoAsset, createPhotoStudioProject, removePhotoAsset, reorderPhotoAsset, updateActivePhotoAsset } from "../src/utils/photoStudioCore";

test("photo studio adds and selects imported assets", () => {
  const project = createPhotoStudioProject();
  const a = createPhotoAsset("data:image/png;base64,a", "A");
  const b = createPhotoAsset("data:image/png;base64,b", "B");
  const next = addPhotoAssets(project, [a,b]);
  assert.equal(next.assets.length, 2); assert.equal(next.activeAssetId, a.id);
});

test("photo studio reorders and removes assets", () => {
  const a = createPhotoAsset("a", "A"), b = createPhotoAsset("b", "B");
  let project = addPhotoAssets(createPhotoStudioProject(), [a,b]);
  project = reorderPhotoAsset(project, b.id, -1); assert.equal(project.assets[0].id, b.id);
  project = removePhotoAsset(project, a.id); assert.equal(project.assets.length, 1);
});

test("photo studio applies non-destructive transform metadata", () => {
  const a = createPhotoAsset("a", "A");
  const project = addPhotoAssets(createPhotoStudioProject(), [a]);
  const next = updateActivePhotoAsset(project, { rotation: 90, scale: 1.4 });
  assert.equal(next.assets[0].rotation, 90); assert.equal(next.assets[0].scale, 1.4); assert.equal(project.assets[0].rotation, 0);
});
