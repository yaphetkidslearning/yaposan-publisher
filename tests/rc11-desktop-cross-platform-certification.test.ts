import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { certifyDesktopRelease, validateDesktopFileAssociation } from "../src/utils/desktopReleaseCertification.ts";

test("desktop certification refuses optimistic readiness", () => {
  const result = certifyDesktopRelease({}, { windows: true, macos: true, linux: true });
  assert.equal(result.releaseReady, false);
  assert.equal(result.targets.every((target) => target.blockers.length > 0), true);
});

test("desktop certification requires signed Windows and notarized macOS evidence", () => {
  const env = { YAPOSAN_UPDATE_URL: "https://updates.example.com", CSC_LINK: "certificate", CSC_KEY_PASSWORD: "secret", APPLE_ID: "build@example.com", APPLE_APP_SPECIFIC_PASSWORD: "secret", APPLE_TEAM_ID: "TEAM123" };
  const result = certifyDesktopRelease(env, { windows: true, macos: true, linux: true });
  assert.equal(result.releaseReady, true);
});

test("update feed must use HTTPS", () => {
  const result = certifyDesktopRelease({ YAPOSAN_UPDATE_URL: "http://updates.example.com" });
  assert.equal(result.updateFeedConfigured, false);
});

test("project and template file associations are bounded", () => {
  assert.equal(validateDesktopFileAssociation("/tmp/design.yaposan"), true);
  assert.equal(validateDesktopFileAssociation("/tmp/template.ypt"), true);
  assert.equal(validateDesktopFileAssociation("/tmp/run.exe"), false);
  assert.equal(validateDesktopFileAssociation("bad.ypt\0.exe"), false);
});

test("Electron runtime enforces single instance, navigation, and permission boundaries", () => {
  const main = fs.readFileSync("desktop/main.cjs", "utf8");
  for (const token of ["requestSingleInstanceLock", "second-instance", "will-navigate", "setPermissionRequestHandler", "contextIsolation:true", "nodeIntegration:false", "sandbox:true"]) assert.match(main, new RegExp(token));
});

test("installer configuration declares project associations and protocol", () => {
  const config = fs.readFileSync("electron-builder.yml", "utf8");
  for (const token of ["fileAssociations", "ext: yaposan", "ext: ypt", "protocols", "schemes", "yaposan"]) assert.match(config, new RegExp(token));
});
