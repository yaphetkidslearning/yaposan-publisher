import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");

test("legacy SEO postprocessor uses the 91.16+ production title",()=>{
  const s=read("scripts/postprocess-phase90.14-web-export.mjs");
  assert.match(s,/Yaposan — AI Creative Design & Productivity Suite/);
  assert.doesNotMatch(s,/Yaposan — Creative Design & Publishing Suite/);
});

test("auth pages are noindex and not advertised in sitemap",()=>{
  for (const p of ["src/app/sign-in.tsx","src/app/register.tsx"]) assert.match(read(p),/noindex,nofollow/);
  const sitemap=read("public/sitemap.xml");
  assert.doesNotMatch(sitemap,/\/sign-in/);
  assert.doesNotMatch(sitemap,/\/register/);
});

test("help is a real onboarding guide with direct navigation",()=>{
  const s=read("src/app/help.tsx");
  for (const token of ["How Yaposan Works","What will you create today?","/settings","/ai-provider-settings","/photo-studio","/web-studio","Common questions","/contact"]) assert.match(s,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});

test("contact support page exists and does not fake ticket delivery",()=>{
  const s=read("src/app/contact.tsx");
  assert.match(s,/Contact & Support/);
  assert.match(s,/Delivery is not connected yet/);
  assert.match(s,/project-diagnostics/);
});

test("home support navigation exposes help and contact",()=>{
  const s=read("src/app/index.tsx");
  assert.match(s,/Help & Documentation/);
  assert.match(s,/Contact & Support/);
});

test("public sitemap promotes Home, Help and Contact",()=>{
  const s=read("public/sitemap.xml");
  for (const url of ["https://yaposan.com/</loc>","https://yaposan.com/help","https://yaposan.com/contact"]) assert.match(s,new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")));
});
