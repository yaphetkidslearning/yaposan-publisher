import type { PublisherPage, PublisherProject } from "../types/publisher";
import { normalizeDigitalPublishingDeployment, validateDigitalPublishingDeployment } from "./digitalPublishingDeploymentEngine";

export type DigitalDeviceMode = "desktop" | "tablet" | "mobile";
export type DigitalPanelId = "overview" | "responsive" | "navigation" | "forms" | "analytics" | "deployment" | "preflight";
export type DigitalPreviewMode = "design" | "live" | "seo" | "social" | "accessibility" | "performance";

export type DigitalPublishingEditorState = {
  version: "22.5";
  initializedAt: number;
  updatedAt: number;
  revision: number;
  deviceMode: DigitalDeviceMode;
  activePanel: DigitalPanelId;
  previewMode: DigitalPreviewMode;
  livePreviewEnabled: boolean;
  breakpointOverlay: boolean;
  responsiveRulers: boolean;
  responsiveGuides: boolean;
  previewPageId: string;
  inspectorEnabled: boolean;
};

export type DigitalRuntimePage = {
  id: string;
  name: string;
  route: string;
  width: number;
  height: number;
  elementCount: number;
};

export type DigitalEditorRuntimeManifest = {
  version: "22.5";
  projectId: string;
  projectName: string;
  deviceMode: DigitalDeviceMode;
  previewMode: DigitalPreviewMode;
  previewPageId: string;
  viewport: { width: number; height: number };
  pages: DigitalRuntimePage[];
  capabilities: string[];
  validation: { passed: boolean; errors: number; warnings: number; infos: number };
  checksum: string;
};

const VIEWPORTS: Record<DigitalDeviceMode, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return `dei-${(h >>> 0).toString(16).padStart(8, "0")}`;
}

function routeFor(page: PublisherPage, index: number) {
  const slug = page.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return index === 0 ? "/" : `/${slug || `page-${index + 1}`}`;
}

export function createDigitalPublishingEditorState(project: PublisherProject, now = Date.now()): DigitalPublishingEditorState {
  return {
    version: "22.5", initializedAt: now, updatedAt: now, revision: 1,
    deviceMode: "desktop", activePanel: "overview", previewMode: "design",
    livePreviewEnabled: true, breakpointOverlay: true, responsiveRulers: true,
    responsiveGuides: true, previewPageId: project.activePageId || project.pages[0]?.id || "",
    inspectorEnabled: false,
  };
}

export function normalizeDigitalPublishingEditorIntegration(project: PublisherProject): PublisherProject {
  const base = normalizeDigitalPublishingDeployment(project);
  const now = Date.now();
  const fallback = createDigitalPublishingEditorState(base, now);
  const current = base.digitalPublishingEditor;
  const pageIds = new Set(base.pages.map((page) => page.id));
  return {
    ...base,
    phase22Version: "22.5",
    digitalPublishingEditor: {
      ...fallback,
      ...current,
      version: "22.5",
      updatedAt: now,
      revision: Math.max(1, current?.revision ?? 1),
      previewPageId: pageIds.has(current?.previewPageId ?? "") ? current!.previewPageId : fallback.previewPageId,
    },
  };
}

export function updateDigitalPublishingEditorState(project: PublisherProject, updates: Partial<DigitalPublishingEditorState>): PublisherProject {
  const normalized = normalizeDigitalPublishingEditorIntegration(project);
  const now = Date.now();
  return {
    ...normalized,
    updatedAt: now,
    digitalPublishingEditor: {
      ...normalized.digitalPublishingEditor!, ...updates,
      version: "22.5", updatedAt: now,
      revision: normalized.digitalPublishingEditor!.revision + 1,
    },
  };
}

export function createDigitalEditorRuntimeManifest(project: PublisherProject): DigitalEditorRuntimeManifest {
  const normalized = normalizeDigitalPublishingEditorIntegration(project);
  const state = normalized.digitalPublishingEditor!;
  const issues = validateDigitalPublishingDeployment(normalized);
  const manifestBase = {
    version: "22.5" as const,
    projectId: normalized.id,
    projectName: normalized.name,
    deviceMode: state.deviceMode,
    previewMode: state.previewMode,
    previewPageId: state.previewPageId,
    viewport: VIEWPORTS[state.deviceMode],
    pages: normalized.pages.map((page, index) => ({ id: page.id, name: page.name, route: routeFor(page, index), width: page.width, height: page.height, elementCount: page.elements.length })),
    capabilities: ["responsive-canvas", "device-switcher", "navigation-builder", "form-builder", "live-preview", "seo-preview", "accessibility-preview", "performance-preview", "deployment-panel"],
    validation: {
      passed: !issues.some((issue) => issue.severity === "error"),
      errors: issues.filter((issue) => issue.severity === "error").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length,
      infos: issues.filter((issue) => issue.severity === "info").length,
    },
  };
  return { ...manifestBase, checksum: hash(JSON.stringify(manifestBase)) };
}

export function exportDigitalEditorRuntimeReport(project: PublisherProject) {
  return JSON.stringify(createDigitalEditorRuntimeManifest(project), null, 2);
}
