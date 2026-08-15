import { existsSync, readFileSync, statSync } from "node:fs";

const requiredFiles = [
  "public/favicon.ico",
  "public/favicon-48x48.png",
  "public/favicon-96x96.png",
  "public/apple-touch-icon.png",
  "public/yaposan-logo-192.png",
  "public/yaposan-logo-512.png",
  "public/yaposan-social-card.png",
  "public/site.webmanifest",
  "public/robots.txt",
  "public/sitemap.xml",
  "src/app/_layout.tsx",
  "tests/phase9116-google-seo-readiness.test.mjs",
  "PHASE91.16-GOOGLE-SEO-AND-BRAND-IDENTITY.md",
];
for (const file of requiredFiles) {
  if (!existsSync(file)) throw new Error(`Missing 91.16 SEO asset: ${file}`);
  if (statSync(file).size === 0) throw new Error(`Empty 91.16 SEO asset: ${file}`);
}

const layout = readFileSync("src/app/_layout.tsx", "utf8");
const requiredHead = [
  "Yaposan — AI Creative Design & Productivity Suite",
  'rel="canonical"',
  'rel="icon" href="/favicon.ico"',
  'href="/favicon-48x48.png"',
  'href="/favicon-96x96.png"',
  'rel="apple-touch-icon"',
  'rel="manifest" href="/site.webmanifest"',
  'property="og:image"',
  'name="twitter:image"',
  '"@type": "Organization"',
  '"@type": "WebSite"',
  '"@type": "SoftwareApplication"',
  "yaposan-logo-512.png",
];
for (const item of requiredHead) {
  if (!layout.includes(item)) throw new Error(`91.16 root metadata missing: ${item}`);
}

const robots = readFileSync("public/robots.txt", "utf8");
if (!/User-agent:\s*\*/i.test(robots) || !/Sitemap:\s*https:\/\/yaposan\.com\/sitemap\.xml/i.test(robots)) {
  throw new Error("robots.txt must allow crawling and advertise the canonical sitemap");
}
const sitemap = readFileSync("public/sitemap.xml", "utf8");
if (!sitemap.includes("https://yaposan.com/")) throw new Error("sitemap.xml must include the canonical Yaposan homepage");

if (existsSync("dist/index.html")) {
  const built = readFileSync("dist/index.html", "utf8");
  const titles = built.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? [];
  if (titles.length !== 1) throw new Error(`dist/index.html must contain exactly one title; found ${titles.length}`);
  if (/Untitled/i.test(titles[0])) throw new Error("dist/index.html contains the forbidden title 'Untitled'");
  if (!/Yaposan/i.test(titles[0])) throw new Error("dist/index.html title is not branded as Yaposan");
  for (const expected of ["favicon-48x48.png", "yaposan-logo-512.png", "AI Creative Design & Productivity Suite"]) {
    if (!built.includes(expected)) throw new Error(`dist/index.html missing SEO marker: ${expected}`);
  }
}

console.log("Phase 91.16 Google SEO and brand identity gate passed.");
