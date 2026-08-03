import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import {
  createResponsivePreviewManifest,
  exportResponsiveWebPublishing,
  normalizeResponsiveWebPublishing,
  updateResponsiveElementOverride,
  validateResponsiveWebPublishing,
} from "../src/utils/responsiveWebPublishingEngine";

const project = {
  id: "phase221-responsive",
  name: "Responsive Publication",
  description: "Responsive digital publication",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [{
    id: "p1",
    name: "Page 1",
    width: 612,
    height: 792,
    orientation: "portrait",
    sizeKey: "letter",
    backgroundColor: "#fff",
    margin: 36,
    bleed: 0,
    elements: [{ id: "e1", name: "Responsive text", type: "text", x: 10, y: 20, width: 200, height: 50, rotation: 0, zIndex: 0, opacity: 1, hidden: false }],
  }],
} as PublisherProject;

test("migrates Phase 22.0 projects to responsive Phase 22.1", () => {
  const migrated = normalizeResponsiveWebPublishing(project);
  assert.equal(migrated.phase22Version, "22.1");
  assert.equal(migrated.digitalPublishingFoundation?.version, "22.0");
  assert.equal(migrated.responsiveWebPublishing?.version, "22.1");
  assert.equal(migrated.responsiveWebPublishing?.layouts.length, 3);
});

test("stores independent element overrides by breakpoint", () => {
  const updated = updateResponsiveElementOverride(project, "p1", "mobile", "e1", { width: 320, x: 16, positionMode: "flow" });
  const mobile = updated.responsiveWebPublishing?.layouts.find((layout) => layout.pageId === "p1" && layout.breakpointId === "mobile");
  const desktop = updated.responsiveWebPublishing?.layouts.find((layout) => layout.pageId === "p1" && layout.breakpointId === "desktop");
  assert.equal(mobile?.overrides.find((override) => override.elementId === "e1")?.width, 320);
  assert.equal(desktop?.overrides.find((override) => override.elementId === "e1")?.width, 200);
});

test("validates generated responsive layouts", () => {
  assert.equal(validateResponsiveWebPublishing(project).filter((issue) => issue.severity === "error").length, 0);
});

test("creates a responsive live-preview manifest", () => {
  const manifest = createResponsivePreviewManifest(project);
  assert.equal(manifest.version, "22.1");
  assert.equal(manifest.pages[0].layouts.length, 3);
  assert.match(manifest.checksum, /^rw-[0-9a-f]{8}$/);
});

test("exports a formal Phase 22.1 report", () => {
  const report = JSON.parse(exportResponsiveWebPublishing(project)) as { phase: string; previewManifest: { version: string } };
  assert.equal(report.phase, "22.1");
  assert.equal(report.previewManifest.version, "22.1");
});
