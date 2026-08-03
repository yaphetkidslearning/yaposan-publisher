import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherPage } from "../src/types/publisher";
import { addLayoutGuide, buildSnapTargets, DEFAULT_LAYOUT_SETTINGS, deleteLayoutGuide, getLayoutSettings, snapCoordinate, updateLayoutGuide } from "../src/utils/layoutGuideEngine";

const page: PublisherPage = { id:"p1", name:"Page 1", width:600, height:800, orientation:"portrait", sizeKey:"custom", backgroundColor:"#fff", margin:36, bleed:12, elements:[] };

test("Phase 12.0 defaults are document-safe", () => {
  const settings = getLayoutSettings(page);
  assert.equal(settings.gridSpacing, 12);
  assert.equal(settings.snapToGuides, true);
  assert.deepEqual(settings.guides, []);
});

test("guides can be created, edited, locked, hidden and deleted", () => {
  let next = addLayoutGuide(page, "vertical", 200, "Center guide");
  const guide = getLayoutSettings(next).guides[0];
  assert.equal(guide.position, 200);
  next = updateLayoutGuide(next, guide.id, { position: 240, locked: true, hidden: true });
  assert.equal(getLayoutSettings(next).guides[0].position, 240);
  assert.equal(getLayoutSettings(next).guides[0].locked, true);
  next = deleteLayoutGuide(next, guide.id);
  assert.equal(getLayoutSettings(next).guides.length, 0);
});

test("smart snapping respects tolerance", () => {
  assert.deepEqual(snapCoordinate(98, [0,100,200], 4), { value:100, target:100 });
  assert.deepEqual(snapCoordinate(94, [100], 4), { value:94 });
});

test("snap targets include page, margin, safe area, grid and custom guides", () => {
  let next = addLayoutGuide(page, "vertical", 123);
  next = { ...next, layoutSettings: { ...getLayoutSettings(next), gridSpacing: 50, safeArea: 24 } };
  const targets = buildSnapTargets(next, "x");
  for (const value of [0, 24, 36, 123, 300, 564, 576, 600]) assert.ok(targets.includes(value), `missing ${value}`);
});

test("grid and composition settings persist on pages", () => {
  const next = { ...page, layoutSettings: { ...DEFAULT_LAYOUT_SETTINGS, gridVisible:true, gridType:"thirds" as const, columns:6, rows:8 } };
  const settings = getLayoutSettings(next);
  assert.equal(settings.gridVisible, true);
  assert.equal(settings.gridType, "thirds");
  assert.equal(settings.columns, 6);
  assert.equal(settings.rows, 8);
});
