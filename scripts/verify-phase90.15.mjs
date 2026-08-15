import { existsSync, readFileSync } from "node:fs";

const mustExist = [
  "src/app/_layout.tsx",
  "src/app/+html.tsx",
  "tests/phase9015-hydration-safe-production.test.mjs",
  "PHASE90.15-HYDRATION-SAFE-PRODUCTION-WEB-FINALIZATION.md",
];
for (const file of mustExist) {
  if (!existsSync(file)) throw new Error(`Missing Phase 90.15 file: ${file}`);
}

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
if (pkg.scripts?.["build:web"] !== "expo export --platform web") {
  throw new Error("Phase 90.15 requires build:web to use the unmodified Expo static export");
}

const layout = readFileSync("src/app/_layout.tsx", "utf8");
if (!/import Head from ["']expo-router\/head["']/.test(layout)) {
  throw new Error("RootLayout must import Head from expo-router/head");
}
if (/import\s*\{[^}]*\bHead\b[^}]*\}\s*from\s*["']expo-router["']/.test(layout)) {
  throw new Error("RootLayout still uses the invalid named Head import from expo-router");
}

const html = readFileSync("src/app/+html.tsx", "utf8");
if (/<title|name=["']description["']|rel=["']canonical["']|application\/ld\+json/i.test(html)) {
  throw new Error("+html.tsx still duplicates React-managed SEO metadata");
}

if (existsSync("dist/index.html")) {
  const built = readFileSync("dist/index.html", "utf8");
  const titles = built.match(/<title\b[^>]*>[\s\S]*?<\/title>/gi) ?? [];
  if (titles.length !== 1) throw new Error(`Expected exactly one title in dist/index.html, found ${titles.length}`);
  if (!/Yaposan/i.test(titles[0])) throw new Error("Production title does not contain Yaposan");
}

console.log("Phase 90.15 hydration-safe production web finalization check passed.");
