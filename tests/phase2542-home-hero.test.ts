import fs from "node:fs";
import path from "node:path";

const indexPath = path.join(process.cwd(), "src", "app", "index.tsx");
const source = fs.readFileSync(indexPath, "utf8");

if (!source.includes("hero-phase25.42.png")) throw new Error("Phase 25.42 hero artwork is not connected");
if (!source.includes("heroPromptOverlay")) throw new Error("Interactive hero prompt overlay is missing");
if (!source.includes('router.push("/ai")')) throw new Error("Generate action is not connected to Yaposan AI");

console.log("Phase 25.42 home hero verification passed");
