import assert from "node:assert/strict";
import test from "node:test";
import { certifyEnterpriseProduction, DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE, optimizeEnterpriseWorkspace, retryOperationsJob, verifyRecoveryPoint } from "../src/utils/professionalEnterpriseOperationsEngine";

test("production certification reports operational state",()=>{ const r=certifyEnterpriseProduction(DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE); assert.ok(r.score>=0&&r.score<=100); assert.equal(r.operationalServices,4); assert.equal(r.failedJobs,1); });
test("failed jobs can be retried",()=>{ const w=retryOperationsJob(DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE,"job-3"); assert.equal(w.jobs.find(j=>j.id==="job-3")?.status,"queued"); });
test("recovery points can be verified",()=>{ const w=verifyRecoveryPoint(DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE,"rp-2"); assert.equal(w.recoveryPoints.find(p=>p.id==="rp-2")?.verified,true); });
test("optimization reduces runtime footprint",()=>{ const w=optimizeEnterpriseWorkspace(DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE); assert.ok(w.metrics.cacheMb<DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE.metrics.cacheMb); assert.ok(w.metrics.startupMs<DEFAULT_ENTERPRISE_OPERATIONS_WORKSPACE.metrics.startupMs); });
