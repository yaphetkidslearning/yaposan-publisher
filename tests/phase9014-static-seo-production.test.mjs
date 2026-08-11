import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { repairHtmlSeo, SITE_TITLE } from "../scripts/postprocess-phase90.14-web-export.mjs";

test("repairs Expo Router empty title in static HTML", () => {
  const input = '<!DOCTYPE html><html><head><title data-rh="true"></title></head><body></body></html>';
  const output = repairHtmlSeo(input);
  assert.match(output, new RegExp(`<title>${SITE_TITLE}</title>`));
  assert.doesNotMatch(output, /<title\b[^>]*>\s*<\/title>/i);
});

test("injects required production SEO metadata", () => {
  const output = repairHtmlSeo("<!DOCTYPE html><html><head></head><body></body></html>");
  assert.match(output, /name="description"/i);
  assert.match(output, /rel="canonical"/i);
  assert.match(output, /property="og:title"/i);
  assert.match(output, /name="twitter:title"/i);
});

test("static HTML shell contains Yaposan SEO metadata", () => {
  const source = readFileSync("src/app/+html.tsx", "utf8");
  assert.match(source, /Yaposan — Creative Design & Publishing Suite/);
  assert.match(source, /application\/ld\+json/);
});

test("Phase 90.4 Gitleaks protection remains enabled", () => {
  const config = readFileSync(".gitleaks.toml", "utf8");
  assert.match(config, /useDefault\s*=\s*true/);
});
