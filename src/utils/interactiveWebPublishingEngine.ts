import type { PublisherProject } from "../types/publisher";
import { normalizeResponsiveWebPublishing, type ResponsiveBreakpointId } from "./responsiveWebPublishingEngine";

export type WebInteractionTrigger = "click" | "hover" | "focus" | "page-load";
export type WebInteractionAction = "navigate-page" | "open-url" | "show-element" | "hide-element" | "toggle-element" | "scroll-to";

export type WebInteraction = {
  id: string;
  name: string;
  sourceElementId?: string;
  trigger: WebInteractionTrigger;
  action: WebInteractionAction;
  targetPageId?: string;
  targetElementId?: string;
  url?: string;
  breakpointIds: ResponsiveBreakpointId[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
};

export type WebNavigationItem = {
  id: string;
  label: string;
  pageId: string;
  order: number;
  visible: boolean;
};

export type InteractiveWebPublishingState = {
  version: "22.2";
  initializedAt: number;
  updatedAt: number;
  navigation: WebNavigationItem[];
  interactions: WebInteraction[];
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  reducedMotionSupport: boolean;
  revision: number;
};

export type InteractiveWebIssue = {
  id: string;
  severity: "error" | "warning" | "info";
  message: string;
  interactionId?: string;
  pageId?: string;
  elementId?: string;
  fix?: string;
};

export type InteractiveWebManifest = {
  version: "22.2";
  generatedAt: number;
  projectId: string;
  projectName: string;
  revision: number;
  navigation: WebNavigationItem[];
  interactions: WebInteraction[];
  accessibility: {
    keyboardNavigation: boolean;
    focusIndicators: boolean;
    reducedMotionSupport: boolean;
  };
  checksum: string;
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function stableHash(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `iw-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function createInteractiveWebPublishingState(project: PublisherProject, now = Date.now()): InteractiveWebPublishingState {
  return {
    version: "22.2",
    initializedAt: now,
    updatedAt: now,
    navigation: project.pages.map((page, index) => ({ id: `nav-${page.id}`, label: page.name, pageId: page.id, order: index, visible: true })),
    interactions: [],
    keyboardNavigation: true,
    focusIndicators: true,
    reducedMotionSupport: true,
    revision: 1,
  };
}

export function normalizeInteractiveWebPublishing(project: PublisherProject): PublisherProject {
  const responsive = normalizeResponsiveWebPublishing(project);
  const now = Date.now();
  const fallback = createInteractiveWebPublishingState(responsive, now);
  const current = responsive.interactiveWebPublishing;
  const pageIds = new Set(responsive.pages.map((page) => page.id));
  const elementIds = new Set(responsive.pages.flatMap((page) => page.elements.map((element) => element.id)));
  const navigationByPage = new Map((current?.navigation ?? []).map((item) => [item.pageId, item]));
  const navigation = responsive.pages.map((page, index) => ({
    ...(navigationByPage.get(page.id) ?? fallback.navigation[index]),
    pageId: page.id,
    order: index,
  }));
  const interactions = (current?.interactions ?? []).filter((interaction) =>
    (!interaction.sourceElementId || elementIds.has(interaction.sourceElementId)) &&
    (!interaction.targetElementId || elementIds.has(interaction.targetElementId)) &&
    (!interaction.targetPageId || pageIds.has(interaction.targetPageId)),
  );
  return {
    ...responsive,
    phase22Version: "22.2",
    interactiveWebPublishing: {
      ...fallback,
      ...current,
      version: "22.2",
      updatedAt: now,
      navigation,
      interactions,
      keyboardNavigation: current?.keyboardNavigation !== false,
      focusIndicators: current?.focusIndicators !== false,
      reducedMotionSupport: current?.reducedMotionSupport !== false,
      revision: Math.max(1, current?.revision ?? 1),
    },
  };
}

export function addWebInteraction(
  project: PublisherProject,
  input: Omit<WebInteraction, "id" | "createdAt" | "updatedAt">,
): PublisherProject {
  const normalized = normalizeInteractiveWebPublishing(project);
  const state = normalized.interactiveWebPublishing!;
  const now = Date.now();
  const interaction: WebInteraction = { ...input, id: uid("interaction"), createdAt: now, updatedAt: now };
  return {
    ...normalized,
    updatedAt: now,
    interactiveWebPublishing: { ...state, interactions: [...state.interactions, interaction], updatedAt: now, revision: state.revision + 1 },
  };
}

export function updateWebInteraction(project: PublisherProject, id: string, updates: Partial<Omit<WebInteraction, "id" | "createdAt">>): PublisherProject {
  const normalized = normalizeInteractiveWebPublishing(project);
  const state = normalized.interactiveWebPublishing!;
  const now = Date.now();
  return {
    ...normalized,
    updatedAt: now,
    interactiveWebPublishing: {
      ...state,
      interactions: state.interactions.map((interaction) => interaction.id === id ? { ...interaction, ...updates, id: interaction.id, createdAt: interaction.createdAt, updatedAt: now } : interaction),
      updatedAt: now,
      revision: state.revision + 1,
    },
  };
}

export function deleteWebInteraction(project: PublisherProject, id: string): PublisherProject {
  const normalized = normalizeInteractiveWebPublishing(project);
  const state = normalized.interactiveWebPublishing!;
  const now = Date.now();
  return { ...normalized, updatedAt: now, interactiveWebPublishing: { ...state, interactions: state.interactions.filter((item) => item.id !== id), updatedAt: now, revision: state.revision + 1 } };
}

export function validateInteractiveWebPublishing(project: PublisherProject): InteractiveWebIssue[] {
  const normalized = normalizeInteractiveWebPublishing(project);
  const state = normalized.interactiveWebPublishing!;
  const pageIds = new Set(normalized.pages.map((page) => page.id));
  const elementIds = new Set(normalized.pages.flatMap((page) => page.elements.map((element) => element.id)));
  const issues: InteractiveWebIssue[] = [];
  for (const item of state.navigation) {
    if (!pageIds.has(item.pageId)) issues.push({ id: `nav-page-${item.id}`, severity: "error", pageId: item.pageId, message: "Navigation item references a missing page.", fix: "Select an existing page or remove the navigation item." });
    if (!item.label.trim()) issues.push({ id: `nav-label-${item.id}`, severity: "warning", pageId: item.pageId, message: "Navigation item has no accessible label.", fix: "Add a descriptive navigation label." });
  }
  for (const interaction of state.interactions) {
    if (interaction.sourceElementId && !elementIds.has(interaction.sourceElementId)) issues.push({ id: `source-${interaction.id}`, severity: "error", interactionId: interaction.id, elementId: interaction.sourceElementId, message: "Interaction source element is missing." });
    if (interaction.action === "navigate-page" && (!interaction.targetPageId || !pageIds.has(interaction.targetPageId))) issues.push({ id: `target-page-${interaction.id}`, severity: "error", interactionId: interaction.id, pageId: interaction.targetPageId, message: "Page navigation requires a valid target page." });
    if (interaction.action === "open-url" && !/^https?:\/\//i.test(interaction.url ?? "")) issues.push({ id: `url-${interaction.id}`, severity: "error", interactionId: interaction.id, message: "Open URL interactions require a valid HTTP or HTTPS address." });
    if (["show-element", "hide-element", "toggle-element", "scroll-to"].includes(interaction.action) && (!interaction.targetElementId || !elementIds.has(interaction.targetElementId))) issues.push({ id: `target-element-${interaction.id}`, severity: "error", interactionId: interaction.id, elementId: interaction.targetElementId, message: "Interaction requires a valid target element." });
    if (!interaction.breakpointIds.length) issues.push({ id: `breakpoints-${interaction.id}`, severity: "warning", interactionId: interaction.id, message: "Interaction is not enabled for any responsive breakpoint.", fix: "Choose mobile, tablet, or desktop." });
  }
  if (!state.keyboardNavigation) issues.push({ id: "keyboard-navigation", severity: "warning", message: "Keyboard navigation is disabled.", fix: "Enable keyboard navigation for accessible digital publishing." });
  if (!state.focusIndicators) issues.push({ id: "focus-indicators", severity: "warning", message: "Focus indicators are disabled.", fix: "Enable visible focus indicators." });
  return issues;
}

export function createInteractiveWebManifest(project: PublisherProject): InteractiveWebManifest {
  const normalized = normalizeInteractiveWebPublishing(project);
  const state = normalized.interactiveWebPublishing!;
  const body = {
    version: "22.2" as const,
    projectId: normalized.id,
    projectName: normalized.name,
    revision: state.revision,
    navigation: [...state.navigation].sort((a, b) => a.order - b.order),
    interactions: state.interactions.filter((interaction) => interaction.enabled),
    accessibility: {
      keyboardNavigation: state.keyboardNavigation,
      focusIndicators: state.focusIndicators,
      reducedMotionSupport: state.reducedMotionSupport,
    },
  };
  return { ...body, generatedAt: Date.now(), checksum: stableHash(JSON.stringify(body)) };
}

export function exportInteractiveWebPublishing(project: PublisherProject): string {
  const normalized = normalizeInteractiveWebPublishing(project);
  return JSON.stringify({ phase: "22.2", generatedAt: new Date().toISOString(), manifest: createInteractiveWebManifest(normalized), issues: validateInteractiveWebPublishing(normalized) }, null, 2);
}
