import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SITE_TITLE = "Yaposan — Creative Design & Publishing Suite";
export const SITE_DESCRIPTION =
  "Create publications, edit product photos, collaborate, publish professional content, and create with AI in one powerful workspace.";
export const SITE_URL = "https://yaposan.com";

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function upsertMeta(html, selector, tag) {
  if (selector.test(html)) return html.replace(selector, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

export function repairHtmlSeo(input, canonicalUrl = `${SITE_URL}/`) {
  let html = input;
  const titleTag = `<title>${SITE_TITLE}</title>`;
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, titleTag);
  } else {
    html = html.replace(/<head\b[^>]*>/i, (match) => `${match}${titleTag}`);
  }

  html = upsertMeta(
    html,
    /<meta\b[^>]*name=["']description["'][^>]*>/i,
    `<meta name="description" content="${escapeAttribute(SITE_DESCRIPTION)}"/>`,
  );
  html = upsertMeta(
    html,
    /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}"/>`,
  );
  html = upsertMeta(
    html,
    /<meta\b[^>]*property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeAttribute(SITE_TITLE)}"/>`,
  );
  html = upsertMeta(
    html,
    /<meta\b[^>]*property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeAttribute(SITE_DESCRIPTION)}"/>`,
  );
  html = upsertMeta(
    html,
    /<meta\b[^>]*name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeAttribute(SITE_TITLE)}"/>`,
  );
  html = upsertMeta(
    html,
    /<meta\b[^>]*name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeAttribute(SITE_DESCRIPTION)}"/>`,
  );

  return html;
}

function collectHtmlFiles(directory, files = []) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const info = statSync(path);
    if (info.isDirectory()) collectHtmlFiles(path, files);
    else if (name.toLowerCase().endsWith(".html")) files.push(path);
  }
  return files;
}

export function repairExport(distDir = "dist") {
  if (!existsSync(distDir)) throw new Error(`Static export directory not found: ${distDir}`);
  const files = collectHtmlFiles(distDir);
  if (!files.length) throw new Error(`No HTML files found under ${distDir}`);

  for (const file of files) {
    const original = readFileSync(file, "utf8");
    const repaired = repairHtmlSeo(original);
    if (repaired !== original) writeFileSync(file, repaired, "utf8");
  }
  return files;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replaceAll("\\", "/")}`).href) {
  const files = repairExport(process.argv[2] || "dist");
  console.log(`Phase 90.14 repaired static SEO metadata in ${files.length} HTML file(s).`);
}
