import fs from "node:fs";
const required=["server/aiCostControls.ts","server/providerVault.ts","tests/phase907-ai-cost-controls.test.mjs","PHASE90.7-AI-COST-CONTROLS-AND-SECURE-PROVIDERS.md"];
for(const file of required)if(!fs.existsSync(file))throw new Error(`Phase 90.7 missing ${file}`);
const env=fs.readFileSync(".env.example","utf8");for(const key of ["AI_COMMUNITY_MONTHLY_BUDGET_USD","AI_CREDENTIAL_ENCRYPTION_KEY","AI_DEFAULT_INPUT_USD_PER_MILLION_TOKENS","AI_DEFAULT_OUTPUT_USD_PER_MILLION_TOKENS"])if(!env.includes(key))throw new Error(`Phase 90.7 missing ${key}`);
const pkg=JSON.parse(fs.readFileSync("package.json","utf8"));if(!pkg.scripts?.["test:phase90.7"])throw new Error("Phase 90.7 test command missing");
console.log("Phase 90.7 static certification checks passed.");
