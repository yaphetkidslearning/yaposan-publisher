import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const required=[
  "scripts/deployment-step6-preflight.mjs",
  "scripts/deployment-step6-activate-verify.mjs",
  "deployment/activation/LIVE-ACTIVATION-CHECKLIST.md",
  "deployment/activation/PROVIDER-SECRET-MATRIX.md",
  "deployment/activation/DATABASE-MIGRATION-AND-ROLLBACK.md",
  "PRODUCTION-DEPLOYMENT-STEP6.md"
];
const issues=[];
for (const file of required) if (!fs.existsSync(path.join(root,file))) issues.push(`missing ${file}`);
const pkg=JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
for (const script of ["deploy:step6:preflight","deploy:step6:verify","deploy:step6:validate"]) if (!pkg.scripts?.[script]) issues.push(`missing package script ${script}`);
const render=fs.readFileSync(path.join(root,"render.yaml"),"utf8");
for (const service of ["yaposan-web","yaposan-api","yaposan-export-worker"]) if (!render.includes(service)) issues.push(`render.yaml missing ${service}`);
const report={ok:issues.length===0,checkedAt:new Date().toISOString(),issues};
console.log(JSON.stringify(report,null,2));
if (issues.length) process.exit(1);
