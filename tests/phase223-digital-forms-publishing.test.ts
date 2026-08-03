import assert from "node:assert/strict";
import test from "node:test";
import type { PublisherProject } from "../src/types/publisher";
import { addDigitalForm, createDigitalFormsManifest, exportDigitalFormsPublishing, normalizeDigitalFormsPublishing, validateDigitalFormsPublishing, type DigitalFormDefinition } from "../src/utils/digitalFormsPublishingEngine";

const project = {
  id: "phase223-forms",
  name: "Forms Publication",
  createdAt: 1,
  updatedAt: 1,
  activePageId: "p1",
  autoSave: true,
  version: 2,
  pages: [{ id: "p1", name: "Contact", width: 612, height: 792, orientation: "portrait", sizeKey: "letter", backgroundColor: "#fff", margin: 36, bleed: 0, elements: [{ id: "form-box", name: "Form Box", type: "rectangle", x: 20, y: 20, width: 300, height: 400, rotation: 0, zIndex: 0, opacity: 1 }] }],
} as PublisherProject;

const validForm: Omit<DigitalFormDefinition, "id" | "createdAt" | "updatedAt"> = {
  name: "Contact form",
  pageId: "p1",
  containerElementId: "form-box",
  fields: [
    { id: "name", name: "name", label: "Name", type: "text", required: true, order: 0, enabled: true, autocomplete: "name" },
    { id: "email", name: "email", label: "Email", type: "email", required: true, order: 1, enabled: true, autocomplete: "email" },
    { id: "consent", name: "consent", label: "I agree", type: "consent", required: true, order: 2, enabled: true },
  ],
  breakpointIds: ["mobile", "tablet", "desktop"],
  submitLabel: "Send",
  successMessage: "Thank you.",
  failureMessage: "Please try again.",
  submitAction: "store-local",
  requireConsent: true,
  consentText: "I agree to the privacy policy.",
  honeypotEnabled: true,
  rateLimitPerMinute: 10,
  enabled: true,
};

test("migrates interactive projects to Phase 22.3", () => {
  const migrated = normalizeDigitalFormsPublishing(project);
  assert.equal(migrated.phase22Version, "22.3");
  assert.equal(migrated.interactiveWebPublishing?.version, "22.2");
  assert.equal(migrated.digitalFormsPublishing?.version, "22.3");
});

test("adds a valid digital form", () => {
  const updated = addDigitalForm(project, validForm);
  assert.equal(updated.digitalFormsPublishing?.forms.length, 1);
  assert.equal(validateDigitalFormsPublishing(updated).filter((issue) => issue.severity === "error").length, 0);
});

test("reports duplicate field names and insecure webhooks", () => {
  const updated = addDigitalForm(project, { ...validForm, submitAction: "webhook", destination: "http://example.com", fields: [...validForm.fields, { ...validForm.fields[0], id: "name2" }] });
  const issues = validateDigitalFormsPublishing(updated);
  assert.ok(issues.some((issue) => issue.id.startsWith("duplicate-")));
  assert.ok(issues.some((issue) => issue.id.startsWith("webhook-")));
});

test("creates a deterministic digital forms manifest checksum", () => {
  const updated = addDigitalForm(project, validForm);
  const first = createDigitalFormsManifest(updated);
  const second = createDigitalFormsManifest(updated);
  assert.equal(first.version, "22.3");
  assert.equal(first.checksum, second.checksum);
  assert.match(first.checksum, /^df-[0-9a-f]{8}$/);
});

test("exports the Phase 22.3 report", () => {
  const report = JSON.parse(exportDigitalFormsPublishing(project)) as { phase: string; manifest: { version: string } };
  assert.equal(report.phase, "22.3");
  assert.equal(report.manifest.version, "22.3");
});
