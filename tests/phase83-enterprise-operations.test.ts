import assert from "node:assert/strict";
import test from "node:test";
import { InMemoryDatabase } from "../server/database";
import { createBackupSnapshot, listOperationsJobs, operationsSummary, productionCertification, scheduleAutomation, updateOperationsJob } from "../server/enterpriseOperations";

test("Phase 83 enterprise operations enforce admin access and manage durable jobs", async()=>{
 const db=new InMemoryDatabase();await db.connect();await db.migrate();
 const admin=await db.insert("users",{email:"admin@yaposan.com",passwordHash:"x",emailVerified:true,status:"active"});
 const user=await db.insert("users",{email:"user@yaposan.com",passwordHash:"x",emailVerified:true,status:"active"});
 await assert.rejects(()=>operationsSummary(db,user.id,["admin@yaposan.com"]),/ADMIN_REQUIRED/);
 const job=await scheduleAutomation(db,admin.id,["admin@yaposan.com"],{name:"Nightly backup",task:"backup",schedule:"0 2 * * *"});
 assert.equal(job.status,"queued");
 const cancelled=await updateOperationsJob(db,admin.id,["admin@yaposan.com"],job.id,"cancel");
 assert.equal(cancelled.status,"cancelled");
 const retried=await updateOperationsJob(db,admin.id,["admin@yaposan.com"],job.id,"retry");
 assert.equal(retried.status,"queued");
 const jobs=await listOperationsJobs(db,admin.id,["admin@yaposan.com"]);
 assert.equal(jobs.length,1);
 const backup=await createBackupSnapshot(db,admin.id,["admin@yaposan.com"]);
 assert.equal(backup.status,"verified");
 assert.equal(backup.checksum.length,64);
 const summary=await operationsSummary(db,admin.id,["admin@yaposan.com"]);
 assert.equal(summary.totals.jobs,1);
 const certification=await productionCertification(db,admin.id,["admin@yaposan.com"],[]);
 assert.equal(certification.checks.configuration,true);
 assert.equal(certification.evidenceHash.length,64);
 await db.close();
});
