import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import {
  addDigitalPublicationTarget,
  createDigitalPublicationManifest,
  exportDigitalPublishingFoundation,
  normalizeDigitalPublishingFoundation,
  validateDigitalPublishingFoundation,
} from "../src/utils/digitalPublishingFoundationEngine";

const project = {
  id: "phase22-digital",
  name: "Digital Publication",
  description: "A responsive digital publication.",
  tags: ["publisher", "digital"],
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [{ id: "p1", name: "Page 1", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [] }],
} as PublisherProject;

test("migrates an existing project to the Phase 22.0 digital foundation", () => {
  const migrated = normalizeDigitalPublishingFoundation(project);
  assert.equal(migrated.phase22Version, "22.0");
  assert.equal(migrated.digitalPublishingFoundation?.version, "22.0");
  assert.equal(migrated.digitalPublishingFoundation?.targets.length, 1);
  assert.equal(migrated.digitalPublishingFoundation?.targets[0].channel, "web");
  assert.equal(migrated.digitalPublishingFoundation?.breakpoints.length, 3);
});

test("adds channel-specific publication targets without changing project pages", () => {
  const withEmail = addDigitalPublicationTarget(project, { name: "Newsletter", channel: "email" });
  assert.equal(withEmail.pages.length, project.pages.length);
  assert.equal(withEmail.digitalPublishingFoundation?.targets.length, 2);
  assert.equal(withEmail.digitalPublishingFoundation?.targets[1].width, 600);
  assert.equal(withEmail.digitalPublishingFoundation?.targets[1].channel, "email");
});

test("validates digital publication metadata and targets", () => {
  const issues = validateDigitalPublishingFoundation(project);
  assert.equal(issues.filter((issue) => issue.severity === "error").length, 0);
});

test("creates a deterministic production manifest structure", () => {
  const manifest = createDigitalPublicationManifest(project);
  assert.equal(manifest.version, "22.0");
  assert.equal(manifest.targets.length, 1);
  assert.match(manifest.checksum, /^dp-[0-9a-f]{8}$/);
});

test("exports a formal Phase 22.0 report", () => {
  const report = JSON.parse(exportDigitalPublishingFoundation(project)) as { phase: string; manifest: { version: string } };
  assert.equal(report.phase, "22.0");
  assert.equal(report.manifest.version, "22.0");
});
