import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
const root = process.cwd();
const files = ["package.json", "package-lock.json", "app.json", "tsconfig.json"];
const manifest = {
  schema: "yaposan.phase24.release-manifest", version: 1, packageVersion: "24.0.0",
  generatedAt: new Date().toISOString(), node: process.version,
  files: files.map((file) => ({ file, sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(root, file))).digest("hex") })),
  certificationCommand: "npm run verify:phase24",
};
fs.mkdirSync(path.join(root, "release"), { recursive: true });
fs.writeFileSync(path.join(root, "release", "phase24-release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log("Phase 24 release manifest created at release/phase24-release-manifest.json");
