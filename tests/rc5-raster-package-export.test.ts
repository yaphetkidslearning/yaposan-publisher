import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryDatabase } from "../server/database.ts";
import { LocalObjectStorage } from "../server/storage.ts";
import { createExportJob } from "../server/productionExport.ts";
import { executeExportJob, locallySupportedExportFormats, renderProjectArtifact } from "../server/exportExecutor.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function seed(payload: unknown = { title: "RC5 Export" }) {
  const db = new InMemoryDatabase(); await db.connect(); await db.migrate();
  const user = await db.insert("users", { email:"owner@example.com", passwordHash:"x", emailVerified:true, status:"active" });
  const org = await db.insert("organizations", { name:"Org", ownerUserId:user.id, plan:"enterprise" });
  const ws = await db.insert("workspaces", { organizationId:org.id, name:"Main", region:"us-east" });
  const project = await db.insert("projects", { workspaceId:ws.id, ownerUserId:user.id, name:"RC5 Project", revision:1, payload });
  return { db, user, ws, project };
}

test("RC5 adds PNG and ZIP to locally supported formats", () => {
  assert.ok(locallySupportedExportFormats.includes("png"));
  assert.ok(locallySupportedExportFormats.includes("zip"));
});

test("RC5 creates a structurally valid PNG at requested dimensions", async () => {
  const { project } = await seed({ title:"Raster" });
  const artifact = renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"png", options:{width:64,height:32} }, "job-12345678");
  const bytes = Buffer.from(artifact.body);
  assert.deepEqual([...bytes.subarray(0,8)], [137,80,78,71,13,10,26,10]);
  assert.equal(bytes.readUInt32BE(16),64);
  assert.equal(bytes.readUInt32BE(20),32);
  assert.equal(artifact.contentType,"image/png");
});

test("RC5 rejects unsafe or excessive raster dimensions", async () => {
  const { project } = await seed();
  assert.throws(() => renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"png", options:{width:100000,height:100000} }, "job"), /INVALID_RASTER_DIMENSIONS/);
  assert.throws(() => renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"png", options:{width:0,height:10} }, "job"), /INVALID_RASTER_DIMENSIONS/);
});

test("RC5 creates a portable ZIP with HTML, project JSON, and README", async () => {
  const { project } = await seed({ html:"<!doctype html><html><body>Portable</body></html>" });
  const artifact = renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"zip" }, "job-12345678");
  const bytes = Buffer.from(artifact.body);
  assert.equal(bytes.readUInt32LE(0),0x04034b50);
  assert.match(bytes.toString("latin1"),/index\.html/);
  assert.match(bytes.toString("latin1"),/project\.json/);
  assert.match(bytes.toString("latin1"),/README\.txt/);
  assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);
});

test("RC5 sanitizes active content from HTML and SVG exports", async () => {
  const { project } = await seed({ html:'<html><body onload="bad()"><script>bad()</script><a href="javascript:bad()">Safe</a></body></html>', svg:'<svg xmlns="http://www.w3.org/2000/svg"><script>bad()</script><foreignObject>bad</foreignObject><rect onclick="bad()"/></svg>' });
  const html = Buffer.from(renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"html" }, "job").body).toString();
  const svg = Buffer.from(renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"svg" }, "job").body).toString();
  assert.doesNotMatch(html,/<script|onload|javascript:/i);
  assert.doesNotMatch(svg,/<script|foreignObject|onclick/i);
});

test("RC5 publishes PNG primary and manifest artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan-rc5-"));
  try {
    const { db, user, ws, project } = await seed({ title:"Published PNG" });
    const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format:"png", options:{width:80,height:40} });
    const storage = new LocalObjectStorage(root, "http://localhost/assets");
    const result = await executeExportJob(db, storage, job);
    assert.equal(result.artifacts.length,2);
    assert.equal(result.artifacts[0].contentType,"image/png");
    assert.equal(result.manifest.checksum,result.artifacts[0].checksum);
  } finally { await rm(root,{recursive:true,force:true}); }
});
