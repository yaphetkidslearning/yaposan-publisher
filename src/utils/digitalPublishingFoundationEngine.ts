import type { PublisherProject } from "../types/publisher";

export type DigitalPublicationChannel = "web" | "email" | "social" | "interactive";
export type DigitalPublicationStatus = "draft" | "ready" | "published" | "archived";
export type DigitalColorScheme = "light" | "dark" | "system";

export type DigitalBreakpoint = {
  id: string;
  label: string;
  minWidth: number;
  maxWidth?: number;
  scale: number;
};

export type DigitalSeoMetadata = {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  socialImageUri?: string;
  noIndex: boolean;
};

export type DigitalAccessibilityDefaults = {
  language: string;
  requireAltText: boolean;
  requireDocumentTitle: boolean;
  minimumContrastRatio: number;
  reducedMotion: boolean;
};

export type DigitalPublicationTarget = {
  id: string;
  name: string;
  channel: DigitalPublicationChannel;
  enabled: boolean;
  status: DigitalPublicationStatus;
  outputPath: string;
  baseUrl?: string;
  width: number;
  height: number;
  colorScheme: DigitalColorScheme;
  includeNavigation: boolean;
  includeSearch: boolean;
  includeAnalytics: boolean;
  createdAt: number;
  updatedAt: number;
};

export type DigitalPublishingFoundationState = {
  version: "22.0";
  initializedAt: number;
  updatedAt: number;
  defaultTargetId: string;
  targets: DigitalPublicationTarget[];
  breakpoints: DigitalBreakpoint[];
  seo: DigitalSeoMetadata;
  accessibility: DigitalAccessibilityDefaults;
  publicationId: string;
  revision: number;
};

export type DigitalPublishingIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  targetId?: string;
  message: string;
  fix?: string;
};

export type DigitalPublicationManifest = {
  version: "22.0";
  generatedAt: number;
  projectId: string;
  projectName: string;
  publicationId: string;
  revision: number;
  defaultTargetId: string;
  targets: Array<{
    id: string;
    name: string;
    channel: DigitalPublicationChannel;
    outputPath: string;
    viewport: { width: number; height: number };
  }>;
  breakpoints: DigitalBreakpoint[];
  seo: DigitalSeoMetadata;
  accessibility: DigitalAccessibilityDefaults;
  checksum: string;
};

const DEFAULT_BREAKPOINTS: DigitalBreakpoint[] = [
  { id: "mobile", label: "Mobile", minWidth: 0, maxWidth: 767, scale: 1 },
  { id: "tablet", label: "Tablet", minWidth: 768, maxWidth: 1199, scale: 1 },
  { id: "desktop", label: "Desktop", minWidth: 1200, scale: 1 },
];

function slugify(value: string): string {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "publication";
}

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `dp-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function uniqueTargetId(targets: DigitalPublicationTarget[], preferred: string): string {
  if (!targets.some((target) => target.id === preferred)) return preferred;
  let suffix = 2;
  while (targets.some((target) => target.id === `${preferred}-${suffix}`)) suffix += 1;
  return `${preferred}-${suffix}`;
}

export function createDefaultDigitalPublishingState(project: PublisherProject, now = Date.now()): DigitalPublishingFoundationState {
  const publicationId = `pub-${slugify(project.name)}-${project.id.slice(0, 8)}`;
  const defaultTarget: DigitalPublicationTarget = {
    id: "web-primary",
    name: "Primary Web Publication",
    channel: "web",
    enabled: true,
    status: "draft",
    outputPath: `${slugify(project.name)}/index.html`,
    width: 1440,
    height: 900,
    colorScheme: "system",
    includeNavigation: true,
    includeSearch: true,
    includeAnalytics: false,
    createdAt: now,
    updatedAt: now,
  };
  return {
    version: "22.0",
    initializedAt: now,
    updatedAt: now,
    defaultTargetId: defaultTarget.id,
    targets: [defaultTarget],
    breakpoints: DEFAULT_BREAKPOINTS.map((item) => ({ ...item })),
    seo: {
      title: project.name,
      description: project.description ?? "",
      keywords: [...(project.tags ?? [])],
      noIndex: false,
    },
    accessibility: {
      language: "en",
      requireAltText: true,
      requireDocumentTitle: true,
      minimumContrastRatio: 4.5,
      reducedMotion: false,
    },
    publicationId,
    revision: 1,
  };
}

export function normalizeDigitalPublishingFoundation(project: PublisherProject): PublisherProject {
  const now = Date.now();
  const fallback = createDefaultDigitalPublishingState(project, now);
  const current = project.digitalPublishingFoundation;
  const targets = (current?.targets?.length ? current.targets : fallback.targets).map((target) => ({
    ...target,
    enabled: target.enabled !== false,
    status: target.status ?? "draft",
    width: Math.max(320, target.width || 1440),
    height: Math.max(320, target.height || 900),
    colorScheme: target.colorScheme ?? "system",
    includeNavigation: target.includeNavigation !== false,
    includeSearch: Boolean(target.includeSearch),
    includeAnalytics: Boolean(target.includeAnalytics),
    createdAt: target.createdAt || now,
    updatedAt: target.updatedAt || now,
  }));
  const defaultTargetId = targets.some((target) => target.id === current?.defaultTargetId)
    ? current!.defaultTargetId
    : targets[0].id;
  return {
    ...project,
    phase22Version: "22.0",
    digitalPublishingFoundation: {
      ...fallback,
      ...current,
      version: "22.0",
      updatedAt: now,
      defaultTargetId,
      targets,
      breakpoints: current?.breakpoints?.length ? current.breakpoints.map((item) => ({ ...item })) : fallback.breakpoints,
      seo: { ...fallback.seo, ...current?.seo, keywords: [...(current?.seo?.keywords ?? fallback.seo.keywords)] },
      accessibility: { ...fallback.accessibility, ...current?.accessibility },
      revision: Math.max(1, current?.revision ?? 1),
    },
  };
}

export function addDigitalPublicationTarget(
  project: PublisherProject,
  input: Pick<DigitalPublicationTarget, "name" | "channel"> & Partial<Omit<DigitalPublicationTarget, "id" | "name" | "channel" | "createdAt" | "updatedAt">>,
): PublisherProject {
  const normalized = normalizeDigitalPublishingFoundation(project);
  const state = normalized.digitalPublishingFoundation!;
  const now = Date.now();
  const id = uniqueTargetId(state.targets, `${input.channel}-${slugify(input.name)}`);
  const target: DigitalPublicationTarget = {
    id,
    name: input.name.trim() || `${input.channel} publication`,
    channel: input.channel,
    enabled: input.enabled ?? true,
    status: input.status ?? "draft",
    outputPath: input.outputPath ?? `${slugify(input.name)}.${input.channel === "email" ? "html" : "json"}`,
    baseUrl: input.baseUrl,
    width: Math.max(320, input.width ?? (input.channel === "email" ? 600 : 1440)),
    height: Math.max(320, input.height ?? 900),
    colorScheme: input.colorScheme ?? "system",
    includeNavigation: input.includeNavigation ?? input.channel !== "email",
    includeSearch: input.includeSearch ?? input.channel === "web",
    includeAnalytics: input.includeAnalytics ?? false,
    createdAt: now,
    updatedAt: now,
  };
  return {
    ...normalized,
    updatedAt: now,
    digitalPublishingFoundation: {
      ...state,
      updatedAt: now,
      revision: state.revision + 1,
      targets: [...state.targets, target],
    },
  };
}

export function validateDigitalPublishingFoundation(project: PublisherProject): DigitalPublishingIssue[] {
  const normalized = normalizeDigitalPublishingFoundation(project);
  const state = normalized.digitalPublishingFoundation!;
  const issues: DigitalPublishingIssue[] = [];
  if (!state.seo.title.trim()) issues.push({ id: "seo-title", severity: "error", message: "A digital publication title is required.", fix: "Add an SEO title." });
  if (!state.seo.description.trim()) issues.push({ id: "seo-description", severity: "warning", message: "SEO description is empty.", fix: "Add a concise publication description." });
  if (!state.accessibility.language.trim()) issues.push({ id: "language", severity: "error", message: "Publication language is required.", fix: "Set a BCP 47 language code." });
  if (state.accessibility.minimumContrastRatio < 3) issues.push({ id: "contrast", severity: "error", message: "Minimum contrast ratio is below 3:1.", fix: "Use at least 3:1; 4.5:1 is recommended." });
  if (!state.targets.some((target) => target.enabled)) issues.push({ id: "enabled-target", severity: "error", message: "At least one digital publication target must be enabled.", fix: "Enable or add a target." });
  if (!state.targets.some((target) => target.id === state.defaultTargetId)) issues.push({ id: "default-target", severity: "error", message: "Default target does not exist.", fix: "Select an existing target as the default." });
  const seen = new Set<string>();
  for (const target of state.targets) {
    if (seen.has(target.id)) issues.push({ id: `duplicate-${target.id}`, severity: "error", targetId: target.id, message: `Duplicate target id: ${target.id}.`, fix: "Assign unique target identifiers." });
    seen.add(target.id);
    if (!target.outputPath.trim()) issues.push({ id: `path-${target.id}`, severity: "error", targetId: target.id, message: `${target.name} has no output path.`, fix: "Set an output path." });
    if (target.width < 320 || target.height < 320) issues.push({ id: `viewport-${target.id}`, severity: "warning", targetId: target.id, message: `${target.name} uses a very small viewport.`, fix: "Use a viewport of at least 320 by 320." });
  }
  return issues;
}

export function createDigitalPublicationManifest(project: PublisherProject): DigitalPublicationManifest {
  const normalized = normalizeDigitalPublishingFoundation(project);
  const state = normalized.digitalPublishingFoundation!;
  const enabledTargets = state.targets.filter((target) => target.enabled);
  const payload = {
    projectId: normalized.id,
    publicationId: state.publicationId,
    revision: state.revision,
    targets: enabledTargets.map((target) => [target.id, target.channel, target.outputPath]),
    breakpoints: state.breakpoints,
    seo: state.seo,
    accessibility: state.accessibility,
  };
  return {
    version: "22.0",
    generatedAt: Date.now(),
    projectId: normalized.id,
    projectName: normalized.name,
    publicationId: state.publicationId,
    revision: state.revision,
    defaultTargetId: state.defaultTargetId,
    targets: enabledTargets.map((target) => ({
      id: target.id,
      name: target.name,
      channel: target.channel,
      outputPath: target.outputPath,
      viewport: { width: target.width, height: target.height },
    })),
    breakpoints: state.breakpoints.map((item) => ({ ...item })),
    seo: { ...state.seo, keywords: [...state.seo.keywords] },
    accessibility: { ...state.accessibility },
    checksum: stableHash(JSON.stringify(payload)),
  };
}

export function exportDigitalPublishingFoundation(project: PublisherProject): string {
  const normalized = normalizeDigitalPublishingFoundation(project);
  return JSON.stringify({
    phase: "22.0",
    project: { id: normalized.id, name: normalized.name },
    state: normalized.digitalPublishingFoundation,
    validation: validateDigitalPublishingFoundation(normalized),
    manifest: createDigitalPublicationManifest(normalized),
  }, null, 2);
}
