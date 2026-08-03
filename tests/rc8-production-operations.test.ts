import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { RuntimeMetrics, buildReleaseEvidence, clientIp, installGracefulShutdown, runReadinessChecks, safeTokenEqual, withTimeout } from "../server/operations.ts";
import { InMemoryDatabase } from "../server/database.ts";
import { LocalObjectStorage } from "../server/storage.ts";
import { loadCloudConfig, validateProductionConfig } from "../server/config.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const secret = "0123456789abcdef0123456789abcdef";

test("RC8 runtime metrics track requests, status classes, and duration",()=>{
  const metrics=new RuntimeMetrics();
  const finish=metrics.begin("GET");finish(204);finish(500);
  const failed=metrics.begin("POST");failed(503);
  const snapshot=metrics.snapshot();
  assert.equal(snapshot.totalRequests,2);assert.equal(snapshot.activeRequests,0);
  assert.equal(snapshot.responsesByStatus["2xx"],1);assert.equal(snapshot.responsesByStatus["5xx"],1);
  assert.equal(snapshot.requestsByMethod.GET,1);assert.equal(snapshot.errors,1);
});

test("RC8 Prometheus output exposes bounded operational metrics",()=>{
  const metrics=new RuntimeMetrics();metrics.begin("GET")(200);
  const output=metrics.prometheus();
  assert.match(output,/yaposan_http_requests_total 1/);assert.match(output,/status_class="2xx"/);assert.doesNotMatch(output,/password|secret/i);
});

test("RC8 proxy IP handling trusts forwarding only when enabled",()=>{
  const request={headers:{"x-forwarded-for":"203.0.113.8, 10.0.0.1"},socket:{remoteAddress:"127.0.0.1"}} as any;
  assert.equal(clientIp(request,false),"127.0.0.1");assert.equal(clientIp(request,true),"203.0.113.8");
});

test("RC8 proxy IP handling rejects malformed forwarded values",()=>{
  const request={headers:{"x-forwarded-for":"evil.example"},socket:{remoteAddress:"127.0.0.1"}} as any;
  assert.equal(clientIp(request,true),"127.0.0.1");
});

test("RC8 metrics tokens use exact constant-time compatible matching",()=>{
  assert.equal(safeTokenEqual("abc","abc"),true);assert.equal(safeTokenEqual("abc","abd"),false);assert.equal(safeTokenEqual("a","long"),false);assert.equal(safeTokenEqual(undefined,"x"),false);
});

test("RC8 operation timeouts reject stalled dependencies",async()=>{
  await assert.rejects(()=>withTimeout("probe",10,()=>new Promise(()=>{})),/PROBE_TIMEOUT/);
  assert.equal(await withTimeout("probe",100,async()=>42),42);
});

test("RC8 readiness checks validate database and storage round trips",async()=>{
  const root=await mkdtemp(join(tmpdir(),"yaposan-rc8-"));
  try{
    const db=new InMemoryDatabase();await db.connect();await db.migrate();
    const storage=new LocalObjectStorage(root,"http://local");
    const report=await runReadinessChecks({database:db,storage,configurationIssues:[],timeoutMs:500,storageProbe:true});
    assert.equal(report.ready,true);assert.equal(report.checks.database.ok,true);assert.equal(report.checks.storage.ok,true);
  }finally{await rm(root,{recursive:true,force:true})}
});

test("RC8 readiness reports configuration failures without false readiness",async()=>{
  const db=new InMemoryDatabase();await db.connect();await db.migrate();
  const storage=new LocalObjectStorage(join(tmpdir(),"unused"),"http://local");
  const report=await runReadinessChecks({database:db,storage,configurationIssues:["MISSING_SECRET"],timeoutMs:500});
  assert.equal(report.ready,false);assert.equal(report.checks.configuration.ok,false);assert.equal(report.checks.storage.message,"passive");
});

test("RC8 release evidence is deterministic and changes with build identity",()=>{
  const a=buildReleaseEvidence({version:"1.0.0-rc.8",commitSha:"abc",buildId:"1",nodeEnv:"production",configIssues:[]});
  const b=buildReleaseEvidence({version:"1.0.0-rc.8",commitSha:"abc",buildId:"1",nodeEnv:"production",configIssues:[]});
  const c=buildReleaseEvidence({version:"1.0.0-rc.8",commitSha:"def",buildId:"1",nodeEnv:"production",configIssues:[]});
  assert.equal(a.checksum,b.checksum);assert.notEqual(a.checksum,c.checksum);assert.equal(a.configurationReady,true);
});

test("RC8 production config enforces metrics and operational bounds",()=>{
  const config=loadCloudConfig({NODE_ENV:"production",DATABASE_URL:"postgres://db",SESSION_SECRET:secret,STORAGE_DRIVER:"r2",STORAGE_BUCKET:"bucket",STORAGE_ENDPOINT:"https://r2.example",R2_ACCESS_KEY_ID:"id",R2_SECRET_ACCESS_KEY:"secret",COLLABORATION_DRIVER:"redis",REDIS_URL:"redis://redis",STRIPE_SECRET_KEY:"sk",STRIPE_WEBHOOK_SECRET:"wh",OPENAI_API_KEY:"oa",ADMIN_EMAILS:"admin@example.com",LICENSE_SIGNING_SECRET:secret,REQUEST_TIMEOUT_MS:"121000",METRICS_TOKEN:"weak"} as NodeJS.ProcessEnv);
  const issues=validateProductionConfig(config,"production");
  assert.ok(issues.some(x=>x.includes("REQUEST_TIMEOUT_MS")));assert.ok(issues.some(x=>x.includes("METRICS_TOKEN")));
});

test("RC8 graceful shutdown closes server and database once",async()=>{
  const emitter=new EventEmitter() as any;let serverClosed=0,dbClosed=0,exitCode=-1;
  emitter.close=(callback:(error?:Error)=>void)=>{serverClosed++;callback()};
  const db={close:async()=>{dbClosed++}} as any;
  const controller=installGracefulShutdown({server:emitter,database:db,timeoutMs:1000,signals:[],exit:code=>{exitCode=code},logger:()=>{}});
  await controller.shutdown("TEST");await controller.shutdown("TEST_AGAIN");
  assert.equal(serverClosed,1);assert.equal(dbClosed,1);assert.equal(exitCode,0);assert.equal(controller.isShuttingDown(),true);
});
