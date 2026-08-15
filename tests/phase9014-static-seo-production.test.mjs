import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("RootLayout uses the supported Expo Router Head export", () => {
  const source = readFileSync("src/app/_layout.tsx", "utf8");
  assert.match(source, /import Head from ["']expo-router\/head["']/);
  assert.doesNotMatch(source, /import\s*\{[^}]*\bHead\b[^}]*\}\s*from\s*["']expo-router["']/);
});

test("RootLayout contains Yaposan SEO metadata", () => {
  const source = readFileSync("src/app/_layout.tsx", "utf8");
  assert.match(source, /Yaposan — Creative Design & Publishing Suite/);
  assert.match(source, /name="description"/);
  assert.match(source, /rel="canonical"/);
  assert.match(source, /property="og:title"/);
  assert.match(source, /name="twitter:title"/);
  assert.match(source, /application\/ld\+json/);
});

test("+html is a document shell and does not duplicate React-managed SEO", () => {
  const source = readFileSync("src/app/+html.tsx", "utf8");
  assert.match(source, /ScrollViewStyleReset/);
  assert.doesNotMatch(source, /<title/);
  assert.doesNotMatch(source, /name="description"/);
  assert.doesNotMatch(source, /rel="canonical"/);
  assert.doesNotMatch(source, /application\/ld\+json/);
});

test("build:web does not post-process Expo-rendered HTML", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["build:web"], "expo export --platform web");
});

test("built HTML contains exactly one Yaposan title when dist exists", () => {
  if (!existsSync("dist/index.html")) return;
  const built = readFileSync("dist/index.html", "utf8");
  const titles = built.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? [];
  assert.equal(titles.length, 1);
  assert.match(titles[0], /Yaposan/);
});

test("Phase 90.4 Gitleaks protection remains enabled", () => {
  const config = readFileSync(".gitleaks.toml", "utf8");
  assert.match(config, /useDefault\s*=\s*true/);
});
