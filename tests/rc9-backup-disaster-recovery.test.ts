import test from "node:test"; import assert from "node:assert/strict";
import { assertRestoreAllowed, createBackupManifest, evaluateRecoveryReadiness, sha256, validateBackupManifest, verifyBackupManifest } from "../server/recovery.ts";
const secret="x".repeat(48); const now=new Date("2026-08-03T15:00:00Z");
const base={version:1 as const,release:"1.0.0-rc.9",environment:"production",backupId:"backup-20260803",createdAt:now.toISOString(),artifacts:[
 {component:"postgres" as const,key:"backups/db.sql.gz",size:10,checksum:sha256("db"),createdAt:now.toISOString()},
 {component:"object-storage" as const,key:"backups/r2.json",size:10,checksum:sha256("r2"),createdAt:now.toISOString()},
 {component:"configuration" as const,key:"backups/config.json",size:10,checksum:sha256("cfg"),createdAt:now.toISOString()}]};
test("signed backup manifests verify",()=>{const m=createBackupManifest(base,secret);assert.equal(verifyBackupManifest(m,secret),true)});
test("tampered manifests fail",()=>{const m=createBackupManifest(base,secret);m.artifacts[0].size=99;assert.equal(verifyBackupManifest(m,secret),false)});
test("required backup components are enforced",()=>{const m=createBackupManifest({...base,artifacts:base.artifacts.slice(0,2)},secret);assert.match(validateBackupManifest(m,secret,now).join(" "),/configuration/)});
test("restore requires exact confirmation",()=>{const m=createBackupManifest(base,secret);assert.throws(()=>assertRestoreAllowed({manifest:m,secret,targetEnvironment:"production",confirmation:"yes",now}),/exactly equal/)});
test("production restore boundary is enforced",()=>{const m=createBackupManifest(base,secret);assert.throws(()=>assertRestoreAllowed({manifest:m,secret,targetEnvironment:"staging",confirmation:"RESTORE backup-20260803 TO staging",now}),/only be restored/)});
test("recovery readiness checks freshness and cross-region copies",()=>{const r=evaluateRecoveryReadiness({lastSuccessfulBackupAt:"2026-08-03T12:00:00Z",verifiedRestoreAt:"2026-07-20T12:00:00Z",backupCount:7,crossRegionCopy:true,policy:{retentionDays:30,minimumBackups:7,maximumBackupAgeHours:24,requireCrossRegionCopy:true},now});assert.equal(r.ready,true)});
