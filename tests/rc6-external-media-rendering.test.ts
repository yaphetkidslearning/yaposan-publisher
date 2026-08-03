import test from "node:test";
import assert from "node:assert/strict";
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { InMemoryDatabase } from "../server/database.ts";
import { LocalObjectStorage } from "../server/storage.ts";
import { createExportJob } from "../server/productionExport.ts";
import { executeExportJob, externallySupportedExportFormats, locallySupportedExportFormats, renderProjectArtifact } from "../server/exportExecutor.ts";

async function seed() {
  const db = new InMemoryDatabase(); await db.connect(); await db.migrate();
  const user = await db.insert("users", { email:"owner@example.com", passwordHash:"x", emailVerified:true, status:"active" });
  const org = await db.insert("organizations", { name:"Org", ownerUserId:user.id, plan:"enterprise" });
  const ws = await db.insert("workspaces", { organizationId:org.id, name:"Main", region:"us-east" });
  const project = await db.insert("projects", { workspaceId:ws.id, ownerUserId:user.id, name:"RC6 Project", revision:1, payload:{title:"Media"} });
  return { db, user, ws, project };
}

async function fakeRenderer(root: string, body = "rendered-media") {
  const file = join(root, "fake-ffmpeg.mjs");
  await writeFile(file, `#!/usr/bin/env node\nimport { writeFileSync } from 'node:fs';\nconst output=process.argv.at(-1);\nwriteFileSync(output, ${JSON.stringify(body)});\n`);
  await chmod(file, 0o755);
  return file;
}

test("RC6 adds WAV locally and external media formats behind FFmpeg", () => {
  assert.ok(locallySupportedExportFormats.includes("wav"));
  for (const format of ["jpg","webp","tiff","avif","gif","mp4","webm","mp3"] as const) assert.ok(externallySupportedExportFormats.includes(format));
});

test("RC6 creates a structurally valid PCM WAV without external binaries", async () => {
  const { project } = await seed();
  const artifact = renderProjectArtifact(project, { projectId:project.id, workspaceId:project.workspaceId, userId:project.ownerUserId, format:"wav" }, "job-12345678");
  const bytes = Buffer.from(artifact.body);
  assert.equal(bytes.toString("ascii",0,4),"RIFF");
  assert.equal(bytes.toString("ascii",8,12),"WAVE");
  assert.equal(bytes.toString("ascii",36,40),"data");
  assert.equal(artifact.contentType,"audio/wav");
});

test("RC6 refuses external formats when no trusted renderer is configured", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan-rc6-none-"));
  try {
    const { db, user, ws, project } = await seed();
    const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format:"jpg" });
    await assert.rejects(() => executeExportJob(db, new LocalObjectStorage(root), job), /RENDERER_NOT_CONFIGURED_JPG/);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("RC6 invokes a configured renderer without a shell and publishes output", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan-rc6-render-"));
  try {
    const renderer = await fakeRenderer(root);
    const { db, user, ws, project } = await seed();
    const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format:"webp", options:{width:32,height:16} });
    const result = await executeExportJob(db, new LocalObjectStorage(join(root,"objects")), job, { ffmpegPath:renderer, timeoutMs:5000 });
    assert.equal(result.artifacts[0].contentType,"image/webp");
    assert.equal(result.artifacts[0].size, "rendered-media".length);
    assert.equal(result.manifest.checksum,result.artifacts[0].checksum);
  } finally { await rm(root,{recursive:true,force:true}); }
});

test("RC6 validates all external media outputs through the same controlled adapter", async () => {
  const root = await mkdtemp(join(tmpdir(), "yaposan-rc6-all-"));
  try {
    const renderer = await fakeRenderer(root,"ok");
    for (const format of externallySupportedExportFormats) {
      const { db, user, ws, project } = await seed();
      const job = await createExportJob(db, { projectId:project.id, workspaceId:ws.id, userId:user.id, format });
      const result = await executeExportJob(db, new LocalObjectStorage(join(root,format)), job, { ffmpegPath:renderer, timeoutMs:5000 });
      assert.equal(result.artifacts[0].size,2);
    }
  } finally { await rm(root,{recursive:true,force:true}); }
});
