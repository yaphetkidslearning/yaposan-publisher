import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (file) => fs.readFileSync(file, "utf8");

test("desktop runtime uses hardened Electron isolation", () => {
  const main = read("desktop/main.cjs");
  assert.match(main, /contextIsolation:\s*true/);
  assert.match(main, /nodeIntegration:\s*false/);
  assert.match(main, /sandbox:\s*true/);
});

test("all requested installer formats are configured", () => {
  const config = read("electron-builder.yml");
  for (const token of ["nsis", "msi", "portable", "dmg", "AppImage", "deb"]) assert.match(config, new RegExp(token));
});

test("packaging center and engine are production integrated", () => {
  const engine = read("src/utils/desktopPackagingEngine.ts");
  const modal = read("src/components/publisher/DesktopPackagingCenterModal.tsx");
  assert.match(engine, /Windows Installers/);
  assert.match(engine, /macOS Installer/);
  assert.match(engine, /Linux Packages/);
  assert.match(modal, /Desktop Packaging Center/);
});

test("release scripts generate installers, manifest, and audit", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.ok(pkg.scripts["desktop:build:win"]);
  assert.ok(pkg.scripts["desktop:build:mac"]);
  assert.ok(pkg.scripts["desktop:build:linux"]);
  assert.ok(pkg.scripts["desktop:manifest"]);
  assert.ok(pkg.scripts["verify:phase24.0a"]);
});
