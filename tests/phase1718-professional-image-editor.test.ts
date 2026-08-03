import assert from "node:assert/strict";
import test from "node:test";
import { addAdjustmentLayer, addLayerGroup, addMaskToSelectedLayer, addRasterLayer, calculateLayerSummary, createImageEditorState, duplicateSelectedLayer, flattenImage, saveSelection } from "../src/utils/imageEditorEngine";

test("17.18 creates a professional image editor state", () => {
  const state = createImageEditorState("file:///photo.png");
  assert.equal(state.version, "17.18");
  assert.equal(state.layers.length, 1);
  assert.equal(state.performance.gpuReady, true);
  assert.equal(state.imageUri, "file:///photo.png");
});

test("17.18 supports layers, groups, masks and adjustments", () => {
  let state = createImageEditorState();
  state = addRasterLayer(state, "Retouch");
  state = addMaskToSelectedLayer(state, "raster");
  state = duplicateSelectedLayer(state);
  state = addLayerGroup(state, "Product Group");
  state = addAdjustmentLayer(state, "curves");
  const summary = calculateLayerSummary(state);
  assert.equal(summary.total, 5);
  assert.equal(summary.groups, 1);
  assert.equal(summary.adjustments, 1);
  assert.equal(summary.masks, 2);
});

test("17.18 saves selections and flattens safely", () => {
  let state = createImageEditorState();
  state = addRasterLayer(state);
  state = saveSelection(state, "Subject");
  assert.deepEqual(state.selection.savedNames, ["Subject"]);
  state = flattenImage(state);
  assert.equal(state.layers.length, 1);
  assert.equal(state.layers[0].name, "Flattened Image");
});
