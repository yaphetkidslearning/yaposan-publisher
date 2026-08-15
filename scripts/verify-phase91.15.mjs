import { existsSync, readFileSync } from "node:fs";
const required=[
  "src/utils/photoStudioExport.ts",
  "src/app/photo-studio.tsx",
  "src/utils/photoStudioProviders.ts",
  "server/mediaGeneration.ts",
  "scripts/certify-local-runtime-91.15.mjs",
  "docs/PHASE91.15-99-100-ACCEPTANCE.md",
  "tests/phase9115-99-100-certification.test.mjs"
];
let failures=0;
for(const file of required){ if(!existsSync(file)){console.error("MISSING",file);failures++;} else console.log("OK",file); }
const photo=readFileSync("src/app/photo-studio.tsx","utf8");
for(const token of ["Remove background","Transparent","White","Original","Apply color","Magic Eraser","AI Expand","Relight","Upscale","Product Scene","Export"]){if(!photo.includes(token)){console.error("MISSING PHOTO CONTROL",token);failures++;}}
const media=readFileSync("server/mediaGeneration.ts","utf8");
if(!media.includes("...(request.options ?? {}), prompt: request.prompt")){console.error("Provider options can override trusted prompt");failures++;}
if(failures) process.exit(1);
console.log("Phase 91.15 static 99-100% gate passed.");
