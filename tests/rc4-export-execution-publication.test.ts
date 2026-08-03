import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDatabase } from "../server/database.ts";
import { LocalObjectStorage } from "../server/storage.ts";
import { createExportJob } from "../server/productionExport.ts";
import { executeExportJob, locallySupportedExportFormats, renderProjectArtifact } from "../server/exportExecutor.ts";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCloudConfig, validateProductionConfig } from "../server/config.ts";

async function seed(payload: unknown = { title: "RC4 Export" }) {
  const db = new InMemoryDatabase(); await db.connect(); await db.migrate();
  const user = await db.insert("users", { email:"owner@example.com", passwordHash:"x", emailVerified:true, status:"active" });
  const org = await db.insert("organizations", { name:"Org", ownerUserId:user.id, plan:"enterprise" });
  const ws = await db.insert("workspaces", { organizationId:org.id, name:"Main", region:"us-east" });
  const project = await db.insert("projects", { workspaceId:ws.id, ownerUserId:user.id, name:"RC4 Project", revision:1, payload });
  return { db, user, ws, project };
}

test("RC4 renders valid local PDF, SVG, and HTML outputs", async () => {
  const { project } = await seed({ title:"Hello Yaposan" });
  for (const format of locallySupportedExportFormats) {
    const artifact = renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format }, "job-12345678");
    assert.ok(artifact.body.byteLength > 20);
    if (format === "pdf") assert.equal(Buffer.from(artifact.body).subarray(0,5).toString(), "%PDF-");
    if (format === "svg") assert.match(Buffer.from(artifact.body).toString(), /<svg/);
    if (format === "html") assert.match(Buffer.from(artifact.body).toString(), /<!doctype html>/i);
  }
});

test("RC4 refuses formats that need an unconfigured production renderer", async () => {
  const { project } = await seed();
  assert.throws(() => renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"mp4" }, "job"), /RENDERER_NOT_CONFIGURED_MP4/);
});

test("RC4 executes an export and publishes primary plus manifest artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan-rc4-"));
  try {
    const { db, user, ws, project } = await seed({ html:"<!doctype html><html><body>Published</body></html>" });
    const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format:"html" });
    const storage = new LocalObjectStorage(root, "http://localhost/assets");
    const result = await executeExportJob(db, storage, job);
    assert.equal(result.artifacts.length, 2);
    assert.equal(result.artifacts[0].role, "primary");
    assert.equal(result.artifacts[1].role, "manifest");
    assert.equal(result.manifest.checksum, result.artifacts[0].checksum);
    const primary = await storage.get(result.artifacts[0].key);
    assert.match(Buffer.from(primary).toString(), /Published/);
    const manifest = JSON.parse(Buffer.from(await storage.get(result.artifacts[1].key)).toString());
    assert.equal(manifest.publishedPrimary.key, result.artifacts[0].key);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("RC4 rolls back the primary artifact when manifest publication fails", async () => {
  const { db, user, ws, project } = await seed();
  const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format:"pdf" });
  const keys = new Set<string>(); let puts = 0;
  const storage = {
    async put(input:any){ puts++; const key=`k${puts}`; if(puts===2) throw new Error("MANIFEST_UPLOAD_FAILED"); keys.add(key); return {key,size:input.body.byteLength,checksum:"x",contentType:input.contentType}; },
    async get(){ return new Uint8Array(); },
    async delete(key:string){ keys.delete(key); },
    async createUploadPlan(){ throw new Error("unused"); },
  };
  await assert.rejects(executeExportJob(db,storage,job),/MANIFEST_UPLOAD_FAILED/);
  assert.equal(keys.size,0);
});

test("RC4 production workers require shared R2 publication", () => {
  const config = loadCloudConfig({ NODE_ENV:"production", SESSION_SECRET:"x".repeat(64), DATABASE_URL:"postgres://db", STORAGE_DRIVER:"local", STORAGE_BUCKET:"bucket", STRIPE_SECRET_KEY:"sk", STRIPE_WEBHOOK_SECRET:"wh", OPENAI_API_KEY:"ai", ADMIN_EMAILS:"admin@example.com", COLLABORATION_DRIVER:"redis", REDIS_URL:"redis://redis", EXPORT_WORKER_ENABLED:"true", EXPORT_WORKER_TOKEN:"token" } as NodeJS.ProcessEnv);
  assert.ok(validateProductionConfig(config,"production").some(x => x.includes("STORAGE_DRIVER=r2")));
});
