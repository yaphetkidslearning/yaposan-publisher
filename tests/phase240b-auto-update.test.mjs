import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));

test("Phase 24.0B package scripts and updater dependency are configured", () => {
  assert.match(pkg.version, /^24\.0\.[2-9]$|^24\.[1-9]\./);
  assert.match(pkg.devDependencies["electron-updater"], /^\^6\./);
  assert.match(pkg.scripts["verify:phase24.0b"], /verify:phase24\.0a/);
  assert.match(pkg.scripts["verify:phase24.0b"], /test:phase24\.0b/);
  assert.match(pkg.scripts["desktop:publish:win"], /--publish always/);
});

test("Electron main process implements the full update lifecycle", () => {
  const main = read("desktop/main.cjs");
  for (const token of ["electron-updater", "checking-for-update", "update-available", "download-progress", "update-downloaded", "quitAndInstall", "yaposan:update-policy"]) assert.match(main, new RegExp(token));
  assert.match(main, /app\.isPackaged/);
});

test("Preload exposes a constrained update API", () => {
  const preload = read("desktop/preload.cjs");
  for (const token of ["getStatus", "check", "download", "install", "setPolicy", "subscribe"]) assert.match(preload, new RegExp(token));
  assert.doesNotMatch(preload, /require\(["']fs["']\)/);
});

test("Update Center is integrated into the real editor ribbon", () => {
  const toolbar = read("src/components/publisher/EditorToolbar.tsx");
  const editor = read("src/app/editor.tsx");
  assert.match(toolbar, /label="Desktop Updates"/);
  assert.match(editor, /DesktopUpdateCenterModal/);
  assert.match(editor, /showDesktopUpdateCenter/);
});

test("Update feed and channels are production configurable", () => {
  const builder = read("electron-builder.yml");
  const engine = read("src/utils/desktopUpdateEngine.ts");
  assert.match(builder, /provider: generic/);
  assert.match(builder, /YAPOSAN_UPDATE_URL/);
  assert.match(engine, /"stable" \| "beta" \| "development"/);
  assert.match(engine, /automaticDownload/);
});
