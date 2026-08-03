import test from "node:test";
import assert from "node:assert/strict";
import {
  addRasterChannel,
  addRasterSmartFilter,
  buildRasterRenderPlan,
  convertToRasterSmartObject,
  ensureRasterChannels,
  moveRasterSmartFilter,
  rasterizeSmartObject,
  setRasterColorProfile,
  setRasterComposite,
  updateRasterSmartFilter,
  validateRasterRenderPlan,
} from "../src/utils/professionalRasterEngine";
import type { PublisherElement } from "../src/types/publisher";

const image = (): PublisherElement => ({ id:"photo-1", name:"Photo", type:"image", x:0, y:0, width:800, height:600, rotation:0, zIndex:0, opacity:1, visible:true, locked:false, imageUri:"photo.png" } as PublisherElement);

test("converts an image to a source-preserving smart object", () => {
  const result = convertToRasterSmartObject(image(), "embedded");
  assert.equal(result.rasterSmartObject?.mode, "embedded");
  assert.equal(result.rasterSmartObject?.sourceUri, "photo.png");
  assert.equal(result.originalImageUri, "photo.png");
});

test("adds, updates and reorders live smart filters", () => {
  let result = addRasterSmartFilter(image(), "gaussian-blur", { radius: 10 });
  result = addRasterSmartFilter(result, "unsharp-mask", { amount: 50 });
  assert.equal(result.rasterSmartFilters?.length, 2);
  const first = result.rasterSmartFilters![0];
  result = updateRasterSmartFilter(result, first.id, { opacity: .45 });
  assert.equal(result.rasterSmartFilters?.[0].opacity, .45);
  result = moveRasterSmartFilter(result, first.id, 1);
  assert.equal(result.rasterSmartFilters?.[1].id, first.id);
});

test("initializes RGB channels and adds alpha or spot channels", () => {
  let result = ensureRasterChannels(image());
  assert.equal(result.rasterChannels?.some((channel) => channel.kind === "rgb"), true);
  result = addRasterChannel(result, "spot", "Brand Spot");
  assert.equal(result.rasterChannels?.at(-1)?.kind, "spot");
});

test("stores color management and advanced compositing", () => {
  let result = setRasterColorProfile(image(), { workingSpace:"display-p3", bitDepth:32, softProof:true });
  result = setRasterComposite(result, { clippingMask:true, isolateBlending:true, knockout:"shallow" });
  assert.equal(result.rasterColorProfile?.workingSpace, "display-p3");
  assert.equal(result.rasterColorProfile?.bitDepth, 32);
  assert.equal(result.rasterComposite?.clippingMask, true);
});

test("builds a deterministic render plan and validates output", () => {
  let result = addRasterSmartFilter(image(), "high-pass", { radius: 4 });
  result = setRasterColorProfile(result, { workingSpace:"adobe-rgb", bitDepth:16 });
  const plan = buildRasterRenderPlan(result);
  assert.equal(plan.smartObject, true);
  assert.deepEqual(plan.filters, ["high-pass"]);
  assert.equal(plan.colorProfile, "adobe-rgb");
  assert.equal(validateRasterRenderPlan(result).filter((issue) => issue.severity === "error").length, 0);
});

test("rasterizing clears smart object and live filters", () => {
  const result = rasterizeSmartObject(addRasterSmartFilter(image(), "mosaic", { size: 12 }));
  assert.equal(result.rasterSmartObject, undefined);
  assert.deepEqual(result.rasterSmartFilters, []);
});
