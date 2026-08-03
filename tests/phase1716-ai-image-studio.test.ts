import assert from "node:assert/strict";
import test from "node:test";
import { LocalPreviewImageProvider, cancelAiImageJob, chooseAiImageProvider, createAiImageJob, executeAiImageJob, updateAiImageJob } from "../src/utils/aiImageStudioEngine";

test("creates immutable queued AI image jobs", () => {
  const job = createAiImageJob("asset-1", "image://one", "relight");
  assert.equal(job.status, "queued"); assert.equal(job.progress, 0); assert.equal(job.settings.outputScale, 2);
});

test("updates and cancels queue jobs", () => {
  const job = createAiImageJob("asset-1", "image://one", "upscale");
  const running = updateAiImageJob([job], job.id, { status: "running", progress: 45 });
  assert.equal(running[0].progress, 45);
  const cancelled = cancelAiImageJob(running, job.id); assert.equal(cancelled[0].status, "cancelled");
});

test("executes jobs through a provider and records output", async () => {
  const provider = new LocalPreviewImageProvider();
  assert.equal(chooseAiImageProvider([provider], "magic-eraser").id, provider.id);
  const result = await executeAiImageJob(createAiImageJob("asset-1", "image://one", "magic-eraser"), [provider]);
  assert.equal(result.status, "completed"); assert.equal(result.outputUri, "image://one"); assert.equal(result.providerId, provider.id);
});
