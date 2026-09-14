import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const target = process.argv[2] ?? "current";
const allowed = new Set(["current", "win", "mac", "linux"]);
if (!allowed.has(target)) {
  console.error(`Unsupported target: ${target}. Use current, win, mac, or linux.`);
  process.exit(2);
}

const root = process.cwd();
const dist = path.join(root, "dist");
if (!fs.existsSync(dist)) {
  console.error("Web production output is missing. Run npm run desktop:web first.");
  process.exit(1);
}

const args = ["--yes", "electron-builder@26.0.12", "--config", "electron-builder.yml"];
if (target !== "current") args.push(`--${target}`);
const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, args, { stdio: "inherit", shell: false });
process.exit(result.status ?? 1);
