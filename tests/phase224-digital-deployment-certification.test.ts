import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import { addDigitalDeployment, createDigitalPublishingReleaseManifest, exportDigitalPublishingDeployment, normalizeDigitalPublishingDeployment, validateDigitalPublishingDeployment } from "../src/utils/digitalPublishingDeploymentEngine";

const project = {
  id: "phase224-deployment",
  name: "Production Publication",
  description: "A production-ready digital publication.",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [{ id: "p1", name: "Home", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [] }],
} as PublisherProject;

test("migrates Phase 22.3 projects to Phase 22.4", () => {
  const migrated = normalizeDigitalPublishingDeployment(project);
  assert.equal(migrated.phase22Version, "22.4");
  assert.equal(migrated.digitalFormsPublishing?.version, "22.3");
  assert.equal(migrated.digitalPublishingDeployment?.version, "22.4");
});

test("creates a secure production deployment by default", () => {
  const migrated = normalizeDigitalPublishingDeployment(project);
  const deployment = migrated.digitalPublishingDeployment!.deployments[0];
  assert.equal(deployment.environment, "production");
  assert.equal(deployment.enableHttps, true);
  assert.match(deployment.baseUrl, /^https:\/\//);
  assert.equal(validateDigitalPublishingDeployment(migrated).filter((issue) => issue.severity === "error").length, 0);
});

test("reports insecure production deployments", () => {
  const updated = addDigitalDeployment(project, {
    name: "Insecure Production",
    environment: "production",
    provider: "self-hosted",
    targetId: "web-primary",
    baseUrl: "http://example.com",
    outputDirectory: "dist/insecure",
    enableHttps: false,
    enableCompression: true,
    enableAssetHashing: true,
    enableCacheHeaders: true,
    enabled: true,
  });
  const issues = validateDigitalPublishingDeployment(updated);
  assert.ok(issues.some((issue) => issue.id.startsWith("https-")));
  assert.ok(issues.some((issue) => issue.id.startsWith("production-https-")));
});

test("creates a deterministic certified release manifest", () => {
  const first = createDigitalPublishingReleaseManifest(project);
  const second = createDigitalPublishingReleaseManifest(project);
  assert.equal(first.version, "22.4");
  assert.equal(first.checksum, second.checksum);
  assert.match(first.checksum, /^dd-[0-9a-f]{8}$/);
  assert.equal(first.certification.passed, true);
  assert.match(first.dependencies.foundationChecksum, /^dp-/);
  assert.match(first.dependencies.formsChecksum, /^df-/);
});

test("exports the Phase 22.4 release report", () => {
  const report = JSON.parse(exportDigitalPublishingDeployment(project)) as { phase: string; manifest: { version: string } };
  assert.equal(report.phase, "22.4");
  assert.equal(report.manifest.version, "22.4");
});
