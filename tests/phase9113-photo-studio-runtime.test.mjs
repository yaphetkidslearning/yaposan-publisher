import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const read = (path) => readFileSync(path, "utf8");

test("Photo Studio no longer uses the fake LocalPreviewImageProvider", () => {
  const studio = read("src/app/photo-studio.tsx");
  assert.doesNotMatch(studio, /LocalPreviewImageProvider/);
  assert.match(studio, /YaposanPhotoStudioProvider/);
  assert.match(studio, /runAiTool\("remove-background"\)/);
});

test("background tools use the real secured background-removal endpoint", () => {
  const provider = read("src/utils/photoStudioProviders.ts");
  assert.match(provider, /\/api\/v1\/image\/background-remove/);
  assert.match(provider, /qualityMode: "quality"/);
  assert.match(provider, /"custom-background"/);
  assert.match(provider, /backgroundColor/);
  assert.match(provider, /strictWhite: background === "white"/);
});

test("Photo Studio supports transparent, exact white, and user-selected colors", () => {
  const studio = read("src/app/photo-studio.tsx");
  assert.match(studio, /label="Transparent"/);
  assert.match(studio, /label="White"/);
  assert.match(studio, /Custom background color/);
  assert.match(studio, /label="Apply color"/);
  assert.match(studio, /backgroundMode/);
});

test("original pixels are retained for real Before/After", () => {
  const types = read("src/types/photoStudio.ts");
  const core = read("src/utils/photoStudioCore.ts");
  const studio = read("src/app/photo-studio.tsx");
  assert.match(types, /originalUri\?: string/);
  assert.match(core, /originalUri: uri/);
  assert.match(studio, /showBefore \? \(active\.originalUri \?\? active\.uri\) : active\.uri/);
});

test("remaining image tools use a real connected image provider and never fake success", () => {
  const provider = read("src/utils/photoStudioProviders.ts");
  const oldEngine = read("src/utils/aiImageStudioEngine.ts");
  for (const op of ["remove-object", "outpaint", "relight", "upscale", "product-scene"]) assert.match(provider, new RegExp(`\\"${op}\\"`));
  assert.match(provider, /\/api\/v1\/ai\/media\/generate/);
  assert.match(provider, /did not return a completed image/);
  assert.match(oldEngine, /LocalPreviewImageProvider/); // retained only for legacy/test compatibility
});

test("local background engine has a runnable docker-compose service and env wiring", () => {
  assert.equal(existsSync("docker-compose.yml"), true);
  const compose = read("docker-compose.yml");
  const env = read(".env.example");
  assert.match(compose, /background-removal:/);
  assert.match(compose, /8090:8090/);
  assert.match(env, /BACKGROUND_REMOVAL_URL=http:\/\/127\.0\.0\.1:8090/);
});

test("GWC preview behavior was not copied into production Photo Studio", () => {
  const provider = read("src/utils/photoStudioProviders.ts");
  assert.doesNotMatch(provider, /local-preview/);
  assert.doesNotMatch(provider, /return \{ uri: request\.imageUri/);
});
