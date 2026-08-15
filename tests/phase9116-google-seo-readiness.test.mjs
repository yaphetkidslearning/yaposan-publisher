import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const layout = () => readFileSync("src/app/_layout.tsx", "utf8");

test("homepage has a non-Untitled Yaposan title and canonical description", () => {
  const source = layout();
  assert.match(source, /Yaposan — AI Creative Design & Productivity Suite/);
  assert.doesNotMatch(source, /<title>\s*Untitled\s*<\/title>/i);
  assert.match(source, /name="description"/);
  assert.match(source, /rel="canonical"/);
});

test("Google favicon assets are explicit public files", () => {
  for (const file of ["public/favicon.ico","public/favicon-48x48.png","public/favicon-96x96.png","public/apple-touch-icon.png"]) {
    assert.equal(existsSync(file), true, `${file} should exist`);
  }
  const source = layout();
  assert.match(source, /favicon-48x48\.png/);
  assert.match(source, /favicon-96x96\.png/);
});

test("Organization, WebSite and SoftwareApplication structured identity are present", () => {
  const source = layout();
  assert.match(source, /"@type": "Organization"/);
  assert.match(source, /"@type": "WebSite"/);
  assert.match(source, /"@type": "SoftwareApplication"/);
  assert.match(source, /yaposan-logo-512\.png/);
});

test("Open Graph and Twitter use a crawlable social image", () => {
  const source = layout();
  assert.match(source, /property="og:image"/);
  assert.match(source, /name="twitter:image"/);
  assert.equal(existsSync("public/yaposan-social-card.png"), true);
});

test("robots and sitemap point to yaposan.com", () => {
  assert.match(readFileSync("public/robots.txt", "utf8"), /https:\/\/yaposan\.com\/sitemap\.xml/);
  assert.match(readFileSync("public/sitemap.xml", "utf8"), /https:\/\/yaposan\.com\//);
});

test("built HTML never ships Untitled when dist exists", () => {
  if (!existsSync("dist/index.html")) return;
  const built = readFileSync("dist/index.html", "utf8");
  assert.doesNotMatch(built, /<title[^>]*>\s*Untitled\s*<\/title>/i);
  assert.match(built, /<title[^>]*>[^<]*Yaposan[^<]*<\/title>/i);
});
