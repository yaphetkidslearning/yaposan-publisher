import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_PHASE25_CERTIFICATION_CHECKS, exportPhase25Certification, generatePhase25ReleaseCertification, updateCertificationCheck } from "../src/utils/professionalPhase25CertificationEngine";
test("certification covers all Phase 25 modules",()=>{const r=generatePhase25ReleaseCertification();assert.equal(r.modules.length,12);assert.ok(r.score>=0&&r.score<=100);});
test("runtime certification can be completed",()=>{const c=updateCertificationCheck(DEFAULT_PHASE25_CERTIFICATION_CHECKS,"runtime","passed");assert.equal(c.find(x=>x.id==="runtime")?.status,"passed");});
test("failed controls block release readiness",()=>{const c=updateCertificationCheck(DEFAULT_PHASE25_CERTIFICATION_CHECKS,"security","failed");const r=generatePhase25ReleaseCertification(c);assert.equal(r.releaseReady,false);assert.equal(r.failed,1);});
test("certification exports json and csv",()=>{const r=generatePhase25ReleaseCertification();assert.match(exportPhase25Certification(r),/Phase 25|generatedAt|score/);assert.match(exportPhase25Certification(r,"csv"),/area,status,message/);});
