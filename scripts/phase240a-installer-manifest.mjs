import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const installerDir = path.join(root, "release", "installers");
const manifestPath = path.join(root, "release", "installer-manifest.json");
const extensions = new Set([".exe", ".msi", ".dmg", ".AppImage", ".deb", ".zip"]);
const artifacts = [];

if (fs.existsSync(installerDir)) {
  for (const name of fs.readdirSync(installerDir).sort()) {
    const fullPath = path.join(installerDir, name);
    if (!fs.statSync(fullPath).isFile() || !extensions.has(path.extname(name))) continue;
    const data = fs.readFileSync(fullPath);
    artifacts.push({ name, bytes: data.length, sha256: crypto.createHash("sha256").update(data).digest("hex") });
  }
}

const manifest = {
  schema: "yaposan.phase24.0a.installer-manifest",
  version: 1,
  generatedAt: new Date().toISOString(),
  product: "Yaposan Publisher",
  releaseVersion: "1.0.0",
  artifacts,
  complete: artifacts.length > 0,
};
fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Installer manifest generated with ${artifacts.length} artifact(s): ${path.relative(root, manifestPath)}`);
