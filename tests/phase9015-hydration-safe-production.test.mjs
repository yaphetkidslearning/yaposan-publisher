import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("production RootLayout cannot regress to invalid Expo Router Head import", () => {
  const source = readFileSync("src/app/_layout.tsx", "utf8");
  assert.match(source, /import Head from ["']expo-router\/head["']/);
  assert.doesNotMatch(source, /import\s*\{[^}]*\bHead\b[^}]*\}\s*from\s*["']expo-router["']/);
});

test("document shell does not duplicate managed head content", () => {
  const source = readFileSync("src/app/+html.tsx", "utf8");
  for (const pattern of [/<title/i, /name=["']description["']/i, /rel=["']canonical["']/i, /property=["']og:title["']/i, /application\/ld\+json/i]) {
    assert.doesNotMatch(source, pattern);
  }
});

test("production build keeps Expo HTML untouched", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.scripts["build:web"], "expo export --platform web");
});

test("built production shell has one managed title", () => {
  if (!existsSync("dist/index.html")) return;
  const built = readFileSync("dist/index.html", "utf8");
  const titles = built.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? [];
  assert.equal(titles.length, 1);
  assert.match(titles[0], /Yaposan/);
  assert.match(titles[0], /data-rh=["']true["']/i);
});

test("top-level release test gate includes Phase 90.13 through Phase 90.15", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  for (const phase of ["90.13", "90.14", "90.15"]) {
    assert.match(pkg.scripts.test, new RegExp(`test:phase${phase.replace(".", "\\.")}`));
  }
});

test("Phase 90.15 verification runs the full release tests before export", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const verify = pkg.scripts["verify:phase90.15"] ?? "";
  assert.match(verify, /npm test/);
  assert.match(verify, /check:phase90\.13/);
  assert.match(verify, /build:web/);
  assert.match(verify, /check:phase90\.14/);
  assert.match(verify, /check:phase90\.15/);
});

test("source release packaging prevents the previous oversized ZIP failure", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    pkg.scripts?.["package:source"],
    "node scripts/create-source-release.mjs",
    "package:source must use the cross-platform source packager",
  );

  const packager = readFileSync("scripts/create-source-release.mjs", "utf8");
  for (const excluded of ["node_modules", "dist", ".git", ".expo", "coverage"]) {
    assert.match(
      packager,
      new RegExp(`["']${excluded.replace(".", "\\.")}["']`),
      `source packager must exclude ${excluded}`,
    );
  }
  assert.match(packager, /gitleaks-report/i);
  assert.ok(packager.includes("/\\.zip$/i"), "source packager must exclude nested ZIP files");
  assert.ok(packager.includes("/^\\.env"), "source packager must exclude real environment files");
});

