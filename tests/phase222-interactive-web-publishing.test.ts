import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import { addWebInteraction, createInteractiveWebManifest, exportInteractiveWebPublishing, normalizeInteractiveWebPublishing, validateInteractiveWebPublishing } from "../src/utils/interactiveWebPublishingEngine";

const project = {
  id: "phase222-interactive",
  name: "Interactive Publication",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [
    { id: "p1", name: "Home", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [{ id: "button", name: "Next Button", type: "rectangle", x: 20, y: 20, width: 120, height: 40, rotation: 0, zIndex: 0, opacity: 1 }] },
    { id: "p2", name: "Details", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [] },
  ],
} as PublisherProject;

test("migrates responsive projects to Phase 22.2", () => {
  const migrated = normalizeInteractiveWebPublishing(project);
  assert.equal(migrated.phase22Version, "22.2");
  assert.equal(migrated.responsiveWebPublishing?.version, "22.1");
  assert.equal(migrated.interactiveWebPublishing?.navigation.length, 2);
});

test("adds valid page navigation interactions", () => {
  const updated = addWebInteraction(project, { name: "Go to details", sourceElementId: "button", trigger: "click", action: "navigate-page", targetPageId: "p2", breakpointIds: ["mobile", "tablet", "desktop"], enabled: true });
  assert.equal(updated.interactiveWebPublishing?.interactions.length, 1);
  assert.equal(validateInteractiveWebPublishing(updated).filter((issue) => issue.severity === "error").length, 0);
});

test("reports invalid external links", () => {
  const updated = addWebInteraction(project, { name: "Bad link", sourceElementId: "button", trigger: "click", action: "open-url", url: "example.com", breakpointIds: ["desktop"], enabled: true });
  assert.ok(validateInteractiveWebPublishing(updated).some((issue) => issue.id.startsWith("url-")));
});

test("creates a deterministic interactive manifest checksum", () => {
  const manifest = createInteractiveWebManifest(project);
  assert.equal(manifest.version, "22.2");
  assert.equal(manifest.navigation.length, 2);
  assert.match(manifest.checksum, /^iw-[0-9a-f]{8}$/);
});

test("exports the Phase 22.2 report", () => {
  const report = JSON.parse(exportInteractiveWebPublishing(project)) as { phase: string; manifest: { version: string } };
  assert.equal(report.phase, "22.2");
  assert.equal(report.manifest.version, "22.2");
});
