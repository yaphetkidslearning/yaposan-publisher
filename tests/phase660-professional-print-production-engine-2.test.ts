import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PRINT_DEVICES2, buildProductionWorkflow2, buildRipJobTicket2, certifyProduction2, estimateProduction2, inspectProductionJob2, normalizePrintDevice2, routeProductionDevice2 } from "../src/utils/professionalPrintProductionEngine2.ts";

const job: any = {
  id: "job-66", title: "Annual Report", documentId: "doc-66", quantity: 250,
  pageCount: 32, trimWidth: 210, trimHeight: 297, bleed: 3,
  colorMode: "cmyk", media: { name: "coated", gsm: 170, width: 320, height: 450 },
  duplex: "long-edge", copiesPerSheet: 1, outputProfile: "FOGRA39",
  prepressPassed: true, proofApproved: true,
  finishing: [
    { id: "trim", kind: "trim", sequence: 1, required: true },
    { id: "bind", kind: "saddle-stitch", sequence: 2, required: true },
  ],
};

test("Phase 66 normalizes production devices", () => {
  const device = normalizePrintDevice2({ ...DEFAULT_PRINT_DEVICES2[0], id: " press ", name: " Press ", maxResolutionDpi: 99999, hourlyThroughput: 0, supportedMedia: ["Coated", "coated"] });
  assert.equal(device.id, "press");
  assert.equal(device.maxResolutionDpi, 9600);
  assert.equal(device.hourlyThroughput, 1);
  assert.deepEqual(device.supportedMedia, ["coated"]);
});

test("Phase 66 validates production constraints and device routing", () => {
  const bad: any = { ...job, prepressPassed: false, proofApproved: false, duplex: "long-edge", media: { name: "vinyl", gsm: 1000, width: 5000, height: 5000 } };
  const issues = inspectProductionJob2(bad, DEFAULT_PRINT_DEVICES2[0]);
  assert.ok(issues.some(i => i.code === "PREPRESS_NOT_PASSED"));
  assert.ok(issues.some(i => i.code === "PROOF_NOT_APPROVED"));
  assert.ok(issues.some(i => i.code === "UNSUPPORTED_MEDIA"));
  assert.ok(issues.some(i => i.code === "MEDIA_TOO_HEAVY"));
  assert.ok(issues.some(i => i.code === "SHEET_TOO_LARGE"));
  const route = routeProductionDevice2(job);
  assert.equal(route.selected?.id, "digital-production");
});

test("Phase 66 estimates sheets and creates deterministic RIP tickets", () => {
  const device = DEFAULT_PRINT_DEVICES2[0];
  const estimate = estimateProduction2(job, device);
  assert.equal(estimate.sheets, 4000);
  assert.ok(estimate.estimatedCost > 0);
  const first = buildRipJobTicket2(job, device);
  const second = buildRipJobTicket2(job, device);
  assert.equal(first.version, "66.0");
  assert.equal(first.sheets, estimate.sheets);
  assert.equal(first.checksum, second.checksum);
  assert.deepEqual(first.finishing.map(f => f.kind), ["trim", "saddle-stitch"]);
});

test("Phase 66 builds production workflows and certificates", () => {
  const workflow = buildProductionWorkflow2(job);
  assert.equal(workflow.ready, true);
  assert.equal(workflow.pipeline.at(-1), "production-certification");
  assert.equal(workflow.ticket?.deviceId, "digital-production");
  const date = "2026-07-31T22:37:00.000Z";
  const first = certifyProduction2(job, DEFAULT_PRINT_DEVICES2[0], date);
  const second = certifyProduction2(job, DEFAULT_PRINT_DEVICES2[0], date);
  assert.equal(first.passed, true);
  assert.equal(first.status, "queued");
  assert.equal(first.checksum, second.checksum);
});
