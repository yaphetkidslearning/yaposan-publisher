import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "electron-builder.yml",
  "desktop/main.cjs",
  "desktop/preload.cjs",
  "desktop/entitlements.mac.plist",
  "scripts/phase240a-desktop-package.mjs",
  "scripts/phase240a-installer-manifest.mjs",
  "src/utils/desktopPackagingEngine.ts",
  "src/components/publisher/DesktopPackagingCenterModal.tsx",
  "tests/phase240a-desktop-packaging.test.mjs",
  "PHASE24.0A-PROFESSIONAL-DESKTOP-PACKAGING-AND-INSTALLERS.md",
];
const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error(`Phase 24.0A audit failed. Missing: ${missing.join(", ")}`);
  process.exit(1);
}
const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const scripts = packageJson.scripts ?? {};
for (const name of ["desktop:web", "desktop:build", "desktop:build:win", "desktop:build:mac", "desktop:build:linux", "desktop:manifest", "test:phase24.0a", "verify:phase24.0a"]) {
  if (!scripts[name]) {
    console.error(`Phase 24.0A audit failed. Missing package script: ${name}`);
    process.exit(1);
  }
}
const config = fs.readFileSync(path.join(root, "electron-builder.yml"), "utf8");
for (const token of ["nsis", "msi", "portable", "dmg", "AppImage", "deb"]) {
  if (!config.includes(token)) {
    console.error(`Phase 24.0A audit failed. Installer target missing: ${token}`);
    process.exit(1);
  }
}
console.log("Phase 24.0A desktop packaging audit passed.");
