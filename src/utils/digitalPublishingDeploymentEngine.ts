import type { PublisherProject } from "../types/publisher";
import { createDigitalFormsManifest, normalizeDigitalFormsPublishing, validateDigitalFormsPublishing } from "./digitalFormsPublishingEngine";
import { createInteractiveWebManifest, validateInteractiveWebPublishing } from "./interactiveWebPublishingEngine";
import { createResponsivePreviewManifest, validateResponsiveWebPublishing } from "./responsiveWebPublishingEngine";
import { createDigitalPublicationManifest, validateDigitalPublishingFoundation } from "./digitalPublishingFoundationEngine";

export type DigitalDeploymentProvider = "static-host" | "custom-domain" | "cdn" | "self-hosted";
export type DigitalDeploymentEnvironment = "preview" | "staging" | "production";
export type DigitalAnalyticsProvider = "none" | "privacy-first" | "google-analytics" | "custom";
export type DigitalConsentMode = "disabled" | "notice" | "explicit";

export type DigitalDeploymentProfile = {
  id: string;
  name: string;
  environment: DigitalDeploymentEnvironment;
  provider: DigitalDeploymentProvider;
  targetId: string;
  baseUrl: string;
  outputDirectory: string;
  customDomain?: string;
  enableHttps: boolean;
  enableCompression: boolean;
  enableAssetHashing: boolean;
  enableCacheHeaders: boolean;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DigitalAnalyticsSettings = {
  enabled: boolean;
  provider: DigitalAnalyticsProvider;
  measurementId?: string;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
  consentMode: DigitalConsentMode;
  trackPageViews: boolean;
  trackInteractions: boolean;
  trackFormSubmissions: boolean;
};

export type DigitalPerformanceBudget = {
  maxInitialJavascriptKb: number;
  maxInitialCssKb: number;
  maxImageKb: number;
  maxTotalPageKb: number;
  maxFirstContentfulPaintMs: number;
  maxLargestContentfulPaintMs: number;
};

export type DigitalPwaSettings = {
  enabled: boolean;
  appName: string;
  shortName: string;
  themeColor: string;
  backgroundColor: string;
  display: "browser" | "standalone" | "minimal-ui";
  offlineFallback: boolean;
  cacheStrategy: "network-first" | "cache-first" | "stale-while-revalidate";
};

export type DigitalPublishingDeploymentState = {
  version: "22.4";
  initializedAt: number;
  updatedAt: number;
  revision: number;
  defaultDeploymentId: string;
  deployments: DigitalDeploymentProfile[];
  analytics: DigitalAnalyticsSettings;
  performanceBudget: DigitalPerformanceBudget;
  pwa: DigitalPwaSettings;
  generateSitemap: boolean;
  generateRobotsTxt: boolean;
  generateSecurityHeaders: boolean;
  minifyOutput: boolean;
};

export type DigitalDeploymentIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  deploymentId?: string;
  message: string;
  fix?: string;
};

export type DigitalPublishingReleaseManifest = {
  version: "22.4";
  generatedAt: number;
  projectId: string;
  projectName: string;
  revision: number;
  deployments: DigitalDeploymentProfile[];
  analytics: DigitalAnalyticsSettings;
  performanceBudget: DigitalPerformanceBudget;
  pwa: DigitalPwaSettings;
  assets: {
    sitemap: boolean;
    robotsTxt: boolean;
    securityHeaders: boolean;
    minified: boolean;
  };
  dependencies: {
    foundationChecksum: string;
    responsiveChecksum: string;
    interactiveChecksum: string;
    formsChecksum: string;
  };
  certification: {
    passed: boolean;
    errors: number;
    warnings: number;
    infos: number;
  };
  checksum: string;
};

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `dd-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "publication";
}

export function createDigitalPublishingDeploymentState(project: PublisherProject, now = Date.now()): DigitalPublishingDeploymentState {
  const normalized = normalizeDigitalFormsPublishing(project);
  const targetId = normalized.digitalPublishingFoundation?.defaultTargetId ?? "web-primary";
  const deployment: DigitalDeploymentProfile = {
    id: "production-primary",
    name: "Primary Production Deployment",
    environment: "production",
    provider: "static-host",
    targetId,
    baseUrl: `https://${slugify(normalized.name)}.example.com`,
    outputDirectory: "dist/web",
    enableHttps: true,
    enableCompression: true,
    enableAssetHashing: true,
    enableCacheHeaders: true,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };
  return {
    version: "22.4",
    initializedAt: now,
    updatedAt: now,
    revision: 1,
    defaultDeploymentId: deployment.id,
    deployments: [deployment],
    analytics: {
      enabled: false,
      provider: "none",
      anonymizeIp: true,
      respectDoNotTrack: true,
      consentMode: "disabled",
      trackPageViews: true,
      trackInteractions: false,
      trackFormSubmissions: false,
    },
    performanceBudget: {
      maxInitialJavascriptKb: 250,
      maxInitialCssKb: 100,
      maxImageKb: 500,
      maxTotalPageKb: 1800,
      maxFirstContentfulPaintMs: 1800,
      maxLargestContentfulPaintMs: 2500,
    },
    pwa: {
      enabled: false,
      appName: normalized.name,
      shortName: normalized.name.slice(0, 12),
      themeColor: "#111827",
      backgroundColor: "#ffffff",
      display: "standalone",
      offlineFallback: true,
      cacheStrategy: "stale-while-revalidate",
    },
    generateSitemap: true,
    generateRobotsTxt: true,
    generateSecurityHeaders: true,
    minifyOutput: true,
  };
}

export function normalizeDigitalPublishingDeployment(project: PublisherProject): PublisherProject {
  const forms = normalizeDigitalFormsPublishing(project);
  const now = Date.now();
  const fallback = createDigitalPublishingDeploymentState(forms, now);
  const current = forms.digitalPublishingDeployment;
  const targetIds = new Set(forms.digitalPublishingFoundation?.targets.map((target) => target.id) ?? []);
  const deployments = (current?.deployments?.length ? current.deployments : fallback.deployments).map((deployment) => ({
    ...deployment,
    targetId: targetIds.has(deployment.targetId) ? deployment.targetId : fallback.deployments[0].targetId,
    baseUrl: deployment.baseUrl.trim(),
    outputDirectory: deployment.outputDirectory.trim() || "dist/web",
    enableHttps: deployment.enableHttps !== false,
    enableCompression: deployment.enableCompression !== false,
    enableAssetHashing: deployment.enableAssetHashing !== false,
    enableCacheHeaders: deployment.enableCacheHeaders !== false,
    enabled: deployment.enabled !== false,
    createdAt: deployment.createdAt || now,
    updatedAt: deployment.updatedAt || now,
  }));
  const defaultDeploymentId = deployments.some((deployment) => deployment.id === current?.defaultDeploymentId)
    ? current!.defaultDeploymentId
    : deployments[0].id;
  return {
    ...forms,
    phase22Version: "22.4",
    digitalPublishingDeployment: {
      ...fallback,
      ...current,
      version: "22.4",
      updatedAt: now,
      revision: Math.max(1, current?.revision ?? 1),
      defaultDeploymentId,
      deployments,
      analytics: { ...fallback.analytics, ...current?.analytics },
      performanceBudget: { ...fallback.performanceBudget, ...current?.performanceBudget },
      pwa: { ...fallback.pwa, ...current?.pwa },
    },
  };
}

export function addDigitalDeployment(
  project: PublisherProject,
  input: Omit<DigitalDeploymentProfile, "id" | "createdAt" | "updatedAt"> & { id?: string },
): PublisherProject {
  const normalized = normalizeDigitalPublishingDeployment(project);
  const state = normalized.digitalPublishingDeployment!;
  const now = Date.now();
  const baseId = input.id?.trim() || `${input.environment}-${slugify(input.name)}`;
  let id = baseId;
  let suffix = 2;
  while (state.deployments.some((deployment) => deployment.id === id)) id = `${baseId}-${suffix++}`;
  const deployment: DigitalDeploymentProfile = { ...input, id, createdAt: now, updatedAt: now };
  return {
    ...normalized,
    updatedAt: now,
    digitalPublishingDeployment: {
      ...state,
      updatedAt: now,
      revision: state.revision + 1,
      deployments: [...state.deployments, deployment],
    },
  };
}

export function validateDigitalPublishingDeployment(project: PublisherProject): DigitalDeploymentIssue[] {
  const normalized = normalizeDigitalPublishingDeployment(project);
  const state = normalized.digitalPublishingDeployment!;
  const targetIds = new Set(normalized.digitalPublishingFoundation?.targets.map((target) => target.id) ?? []);
  const issues: DigitalDeploymentIssue[] = [];
  if (!state.deployments.some((deployment) => deployment.enabled)) issues.push({ id: "enabled-deployment", severity: "error", message: "At least one deployment profile must be enabled." });
  if (!state.deployments.some((deployment) => deployment.id === state.defaultDeploymentId)) issues.push({ id: "default-deployment", severity: "error", message: "The default deployment profile does not exist." });
  const seen = new Set<string>();
  for (const deployment of state.deployments) {
    if (seen.has(deployment.id)) issues.push({ id: `duplicate-${deployment.id}`, severity: "error", deploymentId: deployment.id, message: "Deployment identifiers must be unique." });
    seen.add(deployment.id);
    if (!targetIds.has(deployment.targetId)) issues.push({ id: `target-${deployment.id}`, severity: "error", deploymentId: deployment.id, message: "Deployment references a missing publication target." });
    if (!/^https:\/\//i.test(deployment.baseUrl)) issues.push({ id: `https-${deployment.id}`, severity: deployment.environment === "production" ? "error" : "warning", deploymentId: deployment.id, message: "Deployment base URL should use HTTPS." });
    if (!deployment.outputDirectory) issues.push({ id: `output-${deployment.id}`, severity: "error", deploymentId: deployment.id, message: "Deployment output directory is required." });
    if (deployment.environment === "production" && !deployment.enableHttps) issues.push({ id: `production-https-${deployment.id}`, severity: "error", deploymentId: deployment.id, message: "Production deployments must enable HTTPS." });
    if (deployment.customDomain && !/^[a-z0-9.-]+$/i.test(deployment.customDomain)) issues.push({ id: `domain-${deployment.id}`, severity: "error", deploymentId: deployment.id, message: "Custom domain is invalid." });
  }
  if (state.analytics.enabled && state.analytics.provider === "none") issues.push({ id: "analytics-provider", severity: "error", message: "Analytics is enabled but no provider is selected." });
  if (state.analytics.enabled && ["google-analytics", "custom"].includes(state.analytics.provider) && !state.analytics.measurementId?.trim()) issues.push({ id: "analytics-id", severity: "error", message: "The selected analytics provider requires a measurement ID." });
  if (state.analytics.enabled && !state.analytics.respectDoNotTrack) issues.push({ id: "do-not-track", severity: "warning", message: "Analytics does not respect browser Do Not Track preferences." });
  if (state.analytics.trackFormSubmissions && !normalized.digitalFormsPublishing?.forms.length) issues.push({ id: "form-analytics", severity: "info", message: "Form submission tracking is enabled but no digital forms exist." });
  const budget = state.performanceBudget;
  if (budget.maxInitialJavascriptKb > 500) issues.push({ id: "javascript-budget", severity: "warning", message: "Initial JavaScript budget exceeds 500 KB." });
  if (budget.maxTotalPageKb > 3000) issues.push({ id: "page-budget", severity: "warning", message: "Total page budget exceeds 3 MB." });
  if (budget.maxLargestContentfulPaintMs > 2500) issues.push({ id: "lcp-budget", severity: "warning", message: "Largest Contentful Paint budget exceeds 2.5 seconds." });
  if (state.pwa.enabled && !state.pwa.appName.trim()) issues.push({ id: "pwa-name", severity: "error", message: "PWA app name is required." });
  if (state.pwa.enabled && !/^#[0-9a-f]{6}$/i.test(state.pwa.themeColor)) issues.push({ id: "pwa-theme", severity: "error", message: "PWA theme color must be a six-digit hex color." });
  return issues;
}

export function createDigitalPublishingReleaseManifest(project: PublisherProject): DigitalPublishingReleaseManifest {
  const normalized = normalizeDigitalPublishingDeployment(project);
  const state = normalized.digitalPublishingDeployment!;
  const foundation = createDigitalPublicationManifest(normalized);
  const responsive = createResponsivePreviewManifest(normalized);
  const interactive = createInteractiveWebManifest(normalized);
  const forms = createDigitalFormsManifest(normalized);
  const allIssues = [
    ...validateDigitalPublishingFoundation(normalized),
    ...validateResponsiveWebPublishing(normalized),
    ...validateInteractiveWebPublishing(normalized),
    ...validateDigitalFormsPublishing(normalized),
    ...validateDigitalPublishingDeployment(normalized),
  ];
  const counts = {
    errors: allIssues.filter((issue) => issue.severity === "error").length,
    warnings: allIssues.filter((issue) => issue.severity === "warning").length,
    infos: allIssues.filter((issue) => issue.severity === "info").length,
  };
  const body = {
    version: "22.4" as const,
    projectId: normalized.id,
    projectName: normalized.name,
    revision: state.revision,
    deployments: state.deployments.filter((deployment) => deployment.enabled),
    analytics: state.analytics,
    performanceBudget: state.performanceBudget,
    pwa: state.pwa,
    assets: {
      sitemap: state.generateSitemap,
      robotsTxt: state.generateRobotsTxt,
      securityHeaders: state.generateSecurityHeaders,
      minified: state.minifyOutput,
    },
    dependencies: {
      foundationChecksum: foundation.checksum,
      responsiveChecksum: responsive.checksum,
      interactiveChecksum: interactive.checksum,
      formsChecksum: forms.checksum,
    },
    certification: { passed: counts.errors === 0, ...counts },
  };
  return { ...body, generatedAt: Date.now(), checksum: stableHash(JSON.stringify(body)) };
}

export function exportDigitalPublishingDeployment(project: PublisherProject): string {
  const normalized = normalizeDigitalPublishingDeployment(project);
  return JSON.stringify({
    phase: "22.4",
    generatedAt: new Date().toISOString(),
    manifest: createDigitalPublishingReleaseManifest(normalized),
    issues: validateDigitalPublishingDeployment(normalized),
  }, null, 2);
}
