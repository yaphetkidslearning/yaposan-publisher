const base = (process.env.YAPOSAN_PRODUCTION_URL || "").replace(/\/$/, "");
const api = (process.env.YAPOSAN_API_URL || "").replace(/\/$/, "");
if (!base) throw new Error("Set YAPOSAN_PRODUCTION_URL=https://your-production-domain before running verify:production");
if (!base.startsWith("https://")) throw new Error("Production URL must use HTTPS");

const timeoutMs = Number(process.env.PRODUCTION_VERIFY_TIMEOUT_MS || 10000);
async function get(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": "Yaposan-Phase90.14-ReadOnly-Smoke/1.0" },
    });
  } finally {
    clearTimeout(timer);
  }
}

const home = await get(`${base}/?verify=${Date.now()}`);
if (home.status >= 400) throw new Error(`Home failed: HTTP ${home.status}`);
const html = await home.text();
const titleMatch = html.match(/<title\b[^>]*>([^<]+)<\/title>/i);
if (!titleMatch || !/Yaposan/i.test(titleMatch[1])) {
  throw new Error("Production HTML does not contain a non-empty Yaposan title");
}
if (!/<meta\b[^>]*name=["']description["']/i.test(html)) {
  throw new Error("Production HTML does not contain a meta description");
}
if (!/<link\b[^>]*rel=["']canonical["']/i.test(html)) {
  throw new Error("Production HTML does not contain a canonical link");
}
if (/(?:localhost|127\.0\.0\.1):\d+/i.test(html)) {
  throw new Error("Production HTML contains a localhost reference");
}

const robots = await get(`${base}/robots.txt`);
if (robots.status !== 200) throw new Error(`/robots.txt failed: HTTP ${robots.status}`);
const robotsBody = await robots.text();
if (!/User-agent:/i.test(robotsBody)) throw new Error("robots.txt is unexpectedly invalid");

const sitemapUrl = process.env.YAPOSAN_SITEMAP_URL || new URL("/sitemap.xml", base).href;
if (!sitemapUrl.startsWith("https://")) throw new Error("YAPOSAN_SITEMAP_URL must use HTTPS");
const sitemap = await get(sitemapUrl);
if (sitemap.status !== 200) throw new Error(`Sitemap failed: HTTP ${sitemap.status}`);
const sitemapBody = await sitemap.text();
if (!/<(?:urlset|sitemapindex)\b/i.test(sitemapBody)) throw new Error("Sitemap response is not a sitemap XML document");

if (api) {
  if (!api.startsWith("https://")) throw new Error("YAPOSAN_API_URL must use HTTPS");
  const healthPath = process.env.YAPOSAN_API_HEALTH_PATH || "/health";
  const response = await get(api + healthPath);
  if (response.status >= 400) throw new Error(`API health failed: HTTP ${response.status}`);
  const ready = await get(api + "/ready");
  if (ready.status !== 200) throw new Error(`API readiness failed: HTTP ${ready.status}`);
  for (const header of ["strict-transport-security", "x-content-type-options", "content-security-policy"]) {
    if (!ready.headers.get(header)) throw new Error(`API readiness response is missing security header: ${header}`);
  }
}

console.log(`Production title: ${titleMatch[1].trim()}`);
console.log(`Production sitemap: ${sitemapUrl}`);
console.log("Yaposan 117.4 live production readiness checks passed.");
