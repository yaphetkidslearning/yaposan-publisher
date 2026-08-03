import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const dist = path.join(root, "dist");
const outputDir = path.join(root, "release", "installers");
if (!fs.existsSync(dist)) {
  console.error("Production web output is missing. Run npm run desktop:web first.");
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });
const output = path.join(outputDir, "Yaposan-Publisher-1.0.0-portable.zip");
const result = process.platform === "win32"
  ? spawnSync("powershell.exe", ["-NoProfile", "-Command", `Compress-Archive -Path '${dist}\\*' -DestinationPath '${output}' -Force`], { stdio: "inherit" })
  : spawnSync("zip", ["-qr", output, "."], { cwd: dist, stdio: "inherit" });
process.exit(result.status ?? 1);
