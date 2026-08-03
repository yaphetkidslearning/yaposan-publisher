import assert from "node:assert/strict";
import test from "node:test";
import { auditEnterpriseIntegrations, DEFAULT_ENTERPRISE_INTEGRATION_WORKSPACE, queueIntegrationJob, registerConnector } from "../src/utils/professionalEnterpriseIntegrationEngine";

test("Phase 25.8 audits the default integration workspace", () => {
  const report = auditEnterpriseIntegrations(DEFAULT_ENTERPRISE_INTEGRATION_WORKSPACE);
  assert.ok(report.score >= 0 && report.score <= 100);
  assert.equal(report.connected, 2);
  assert.equal(report.failedJobs, 1);
});

test("Phase 25.8 queues connector jobs", () => {
  const next = queueIntegrationJob(DEFAULT_ENTERPRISE_INTEGRATION_WORKSPACE, "onedrive", "sync");
  assert.equal(next.jobs[0].status, "queued");
  assert.equal(next.jobs[0].connectorId, "onedrive");
});

test("Phase 25.8 enforces encrypted connector credentials", () => {
  assert.throws(() => registerConnector(DEFAULT_ENTERPRISE_INTEGRATION_WORKSPACE, { id:"unsafe", name:"Unsafe", category:"publishing", status:"connected", syncDirection:"push", scopes:[], encryptedCredentials:false, enabled:true, retryLimit:3 }), /Encrypted credentials/);
});
