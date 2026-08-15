import { existsSync, readFileSync } from "node:fs";
const required=["package-lock.json","docker-compose.yml","services/background-removal/app.py","src/app/photo-studio.tsx","src/utils/photoStudioProviders.ts","server/mediaGeneration.ts","docs/PHASE91.14-PHOTO-QUALITY-ACCEPTANCE.md"];
let failed=0;for(const p of required){if(!existsSync(p)){console.error("MISSING",p);failed++;}else console.log("OK",p)}
const env=readFileSync(".env.example","utf8");for(const key of ["BACKGROUND_REMOVAL_URL","AI_IMAGE_PROVIDER_URL","AI_VIDEO_PROVIDER_URL","AI_AUDIO_PROVIDER_URL"]){if(!env.includes(key)){console.error("MISSING ENV",key);failed++;}else console.log("OK ENV",key)}
if(failed)process.exit(1);console.log("Phase 91.14 static release gate passed.");
