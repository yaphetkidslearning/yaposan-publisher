export type YaposanSurface = "public" | "app" | "api";

export const YAPOSAN_HOSTS = {
  public: "yaposan.com",
  publicWww: "www.yaposan.com",
  app: "app.yaposan.com",
  api: "api.yaposan.com",
} as const;

export function detectYaposanSurface(hostname: string): YaposanSurface {
  const host = hostname.trim().toLowerCase().split(":")[0];
  if (host === YAPOSAN_HOSTS.api) return "api";
  if (host === YAPOSAN_HOSTS.app) return "app";
  return "public";
}

export function canonicalUrl(pathname = "/", surface: YaposanSurface = "public") {
  const host = surface === "app" ? YAPOSAN_HOSTS.app : surface === "api" ? YAPOSAN_HOSTS.api : YAPOSAN_HOSTS.public;
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `https://${host}${path}`;
}

export const PUBLIC_ROUTES = new Set([
  "/", "/features", "/pricing", "/templates", "/help", "/sign-in", "/register",
  "/privacy", "/terms", "/cookies", "/acceptable-use", "/refund-policy", "/accessibility",
]);
