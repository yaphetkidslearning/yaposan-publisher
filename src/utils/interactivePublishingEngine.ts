import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type InteractionTrigger = "click" | "double-click" | "hover" | "mouse-leave" | "page-load" | "animation-end";
export type InteractionActionType = "go-to-page" | "next-page" | "previous-page" | "open-url" | "show-element" | "hide-element" | "toggle-element" | "play-animation" | "pause-animation" | "stop-animation";
export type PageTransitionType = "none" | "fade" | "slide-left" | "slide-right" | "slide-up" | "slide-down" | "zoom" | "push" | "wipe";

export type ElementInteraction = {
  id: string;
  name: string;
  trigger: InteractionTrigger;
  action: InteractionActionType;
  targetPageId?: string;
  targetElementId?: string;
  url?: string;
  animationId?: string;
  delay: number;
  enabled: boolean;
};

export type PageTransition = {
  type: PageTransitionType;
  duration: number;
  easing: "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";
};

export type InteractiveProjectSettings = {
  presentationMode: "manual" | "auto" | "kiosk";
  autoAdvanceSeconds: number;
  loopPresentation: boolean;
  showNavigation: boolean;
  showProgress: boolean;
  keyboardNavigation: boolean;
  swipeNavigation: boolean;
  openLinksInNewTab: boolean;
};

export type InteractionRuntimeState = {
  activePageId: string;
  hiddenElementIds: string[];
  playingAnimationIds: string[];
  presentationStartedAt: number;
};

export const DEFAULT_INTERACTIVE_SETTINGS: InteractiveProjectSettings = {
  presentationMode: "manual",
  autoAdvanceSeconds: 5,
  loopPresentation: false,
  showNavigation: true,
  showProgress: true,
  keyboardNavigation: true,
  swipeNavigation: true,
  openLinksInNewTab: true,
};

export const DEFAULT_PAGE_TRANSITION: PageTransition = { type: "fade", duration: 0.45, easing: "ease-in-out" };

export function createElementInteraction(action: InteractionActionType = "next-page"): ElementInteraction {
  return { id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name: action.replaceAll("-", " "), trigger: "click", action, delay: 0, enabled: true };
}

export function addInteractionToElement(element: PublisherElement, interaction: ElementInteraction): PublisherElement {
  return { ...element, interactions: [...(element.interactions ?? []), interaction], phase19Version: "19.2" };
}

export function updateElementInteraction(element: PublisherElement, interactionId: string, updates: Partial<ElementInteraction>): PublisherElement {
  return { ...element, interactions: (element.interactions ?? []).map((item) => item.id === interactionId ? { ...item, ...updates } : item), phase19Version: "19.2" };
}

export function removeElementInteraction(element: PublisherElement, interactionId: string): PublisherElement {
  return { ...element, interactions: (element.interactions ?? []).filter((item) => item.id !== interactionId), phase19Version: "19.2" };
}

export function setPageTransition(page: PublisherPage, transition: PageTransition): PublisherPage {
  return { ...page, transition, phase19Version: "19.2" };
}

export function getInteractiveSettings(project: PublisherProject): InteractiveProjectSettings {
  return { ...DEFAULT_INTERACTIVE_SETTINGS, ...(project.interactiveSettings ?? {}) };
}

export function createInteractionRuntime(project: PublisherProject): InteractionRuntimeState {
  return { activePageId: project.activePageId || project.pages[0]?.id || "", hiddenElementIds: [], playingAnimationIds: [], presentationStartedAt: Date.now() };
}

export function resolvePageNavigation(project: PublisherProject, currentPageId: string, action: InteractionActionType, targetPageId?: string): string {
  const index = Math.max(0, project.pages.findIndex((page) => page.id === currentPageId));
  if (action === "go-to-page" && targetPageId && project.pages.some((page) => page.id === targetPageId)) return targetPageId;
  if (action === "next-page") return project.pages[index + 1]?.id ?? (getInteractiveSettings(project).loopPresentation ? project.pages[0]?.id ?? currentPageId : currentPageId);
  if (action === "previous-page") return project.pages[index - 1]?.id ?? (getInteractiveSettings(project).loopPresentation ? project.pages.at(-1)?.id ?? currentPageId : currentPageId);
  return currentPageId;
}

export function executeInteraction(project: PublisherProject, runtime: InteractionRuntimeState, interaction: ElementInteraction): InteractionRuntimeState {
  if (!interaction.enabled) return runtime;
  const next = { ...runtime, hiddenElementIds: [...runtime.hiddenElementIds], playingAnimationIds: [...runtime.playingAnimationIds] };
  if (["go-to-page", "next-page", "previous-page"].includes(interaction.action)) next.activePageId = resolvePageNavigation(project, runtime.activePageId, interaction.action, interaction.targetPageId);
  if (interaction.targetElementId) {
    if (interaction.action === "show-element") next.hiddenElementIds = next.hiddenElementIds.filter((id) => id !== interaction.targetElementId);
    if (interaction.action === "hide-element" && !next.hiddenElementIds.includes(interaction.targetElementId)) next.hiddenElementIds.push(interaction.targetElementId);
    if (interaction.action === "toggle-element") next.hiddenElementIds = next.hiddenElementIds.includes(interaction.targetElementId) ? next.hiddenElementIds.filter((id) => id !== interaction.targetElementId) : [...next.hiddenElementIds, interaction.targetElementId];
  }
  if (interaction.animationId) {
    if (interaction.action === "play-animation" && !next.playingAnimationIds.includes(interaction.animationId)) next.playingAnimationIds.push(interaction.animationId);
    if (["pause-animation", "stop-animation"].includes(interaction.action)) next.playingAnimationIds = next.playingAnimationIds.filter((id) => id !== interaction.animationId);
  }
  return next;
}

export function buildInteractiveManifest(project: PublisherProject) {
  return {
    version: "19.2",
    settings: getInteractiveSettings(project),
    pages: project.pages.map((page) => ({ id: page.id, name: page.name, transition: page.transition ?? DEFAULT_PAGE_TRANSITION, interactions: page.elements.flatMap((element) => (element.interactions ?? []).map((interaction) => ({ elementId: element.id, ...interaction }))) })),
  };
}
