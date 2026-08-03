import fs from "node:fs";
const source = fs.readFileSync(new URL("../src/app/index.tsx", import.meta.url), "utf8");
const checks = [
  ['complete artwork scaling', source.includes('resizeMode="contain"')],
  ['desktop fit width', source.includes('maxWidth: 1180')],
  ['centered hero', source.includes('alignSelf: "center"')],
  ['functional prompt', source.includes('Describe a flyer, product scene, campaign, or document...')],
  ['generate action', source.includes('router.push("/ai")')],
];
for (const [name, ok] of checks) { if (!ok) throw new Error(`Phase 25.42.4 failed: ${name}`); }
console.log("Phase 25.42.4 hero fit checks passed.");
