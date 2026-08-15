import fs from "node:fs";
const required=[
  "src/app/help.tsx","src/app/contact.tsx","src/app/sign-in.tsx","src/app/register.tsx",
  "public/sitemap.xml","scripts/postprocess-phase90.14-web-export.mjs",
  "PHASE91.17-SEO-HELP-FAQ-CONTACT.md","tests/phase9117-help-seo-contact.test.mjs"
];
let failed=false;
for(const p of required){if(!fs.existsSync(p)){console.error(`MISSING ${p}`);failed=true}else console.log(`OK ${p}`)}
const sitemap=fs.readFileSync("public/sitemap.xml","utf8");
if(/\/sign-in|\/register/.test(sitemap)){console.error("FAIL auth pages remain in sitemap");failed=true}
const post=fs.readFileSync("scripts/postprocess-phase90.14-web-export.mjs","utf8");
if(post.includes("Creative Design & Publishing Suite")){console.error("FAIL stale production title remains");failed=true}
if(failed) process.exit(1);
console.log("Phase 91.17 SEO/help/contact static gate passed.");
