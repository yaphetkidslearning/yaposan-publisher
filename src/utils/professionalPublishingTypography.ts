import type { PublisherElement, PublisherPage, PublisherProject } from "../types/publisher";

export type OpenTypeSupport = {
  feature: string;
  supported: boolean;
  reason?: string;
};

const TEXT_FIELDS: (keyof PublisherElement)[] = [
  "fontFamily", "fontSize", "fontWeight", "italic", "tracking", "lineHeight", "columnCount",
  "paragraphSpacingBefore", "paragraphSpacingAfter", "firstLineIndent", "hangingIndent",
];

export function normalizePublishingTypography(element: PublisherElement): PublisherElement {
  const sets = Array.from(new Set((element.stylisticSets ?? []).filter((n) => n >= 1 && n <= 20))).sort((a, b) => a - b);
  return {
    ...element,
    widowLines: Math.max(1, Math.min(10, element.widowLines ?? 2)),
    orphanLines: Math.max(1, Math.min(10, element.orphanLines ?? 2)),
    keepLinesTogether: element.keepLinesTogether ?? false,
    keepWithNext: element.keepWithNext ?? false,
    keepParagraphTogether: element.keepParagraphTogether ?? false,
    noBreak: element.noBreak ?? false,
    paragraphBorderWidth: Math.max(0, Math.min(20, element.paragraphBorderWidth ?? 0)),
    paragraphBorderStyle: element.paragraphBorderStyle ?? "solid",
    paragraphPadding: Math.max(0, Math.min(100, element.paragraphPadding ?? 0)),
    verticalJustification: element.verticalJustification ?? "top",
    stylisticSets: sets,
    contextualAlternates: element.contextualAlternates ?? true,
    swashes: element.swashes ?? false,
    figureStyle: element.figureStyle ?? "default",
    figureSpacing: element.figureSpacing ?? "default",
    fractions: element.fractions ?? false,
    ordinals: element.ordinals ?? false,
    numericPosition: element.numericPosition ?? "normal",
    textPathMode: element.textPathMode ?? "none",
  };
}

export function estimateTextCapacity(element: PublisherElement): number {
  const fontSize = Math.max(6, element.fontSize ?? 24);
  const lineHeight = (element.lineHeight ?? 1.2) <= 4 ? fontSize * (element.lineHeight ?? 1.2) : (element.lineHeight ?? fontSize * 1.2);
  const columns = Math.max(1, element.columnCount ?? 1);
  const usableWidth = Math.max(20, element.width - (element.leftIndent ?? 0) - (element.rightIndent ?? 0) - 2 * (element.paragraphPadding ?? 0));
  const usableHeight = Math.max(20, element.height - (element.paragraphSpacingBefore ?? 0) - (element.paragraphSpacingAfter ?? 0) - 2 * (element.paragraphPadding ?? 0));
  const charsPerLine = Math.max(1, Math.floor((usableWidth / columns) / (fontSize * 0.55)));
  const lines = Math.max(1, Math.floor(usableHeight / lineHeight));
  return charsPerLine * lines * columns;
}

export function hasOversetText(element: PublisherElement): boolean {
  if (element.type !== "text") return false;
  return (element.text ?? "").length > estimateTextCapacity(element);
}

function findElement(project: PublisherProject, id: string) {
  for (let pageIndex = 0; pageIndex < project.pages.length; pageIndex += 1) {
    const elementIndex = project.pages[pageIndex].elements.findIndex((e) => e.id === id);
    if (elementIndex >= 0) return { pageIndex, elementIndex, element: project.pages[pageIndex].elements[elementIndex] };
  }
  return null;
}

export function createTextThread(project: PublisherProject, frameIds: string[], name = "Text Thread") {
  const ids = Array.from(new Set(frameIds)).filter(Boolean);
  if (ids.length < 2) return project;
  const threadId = `thread-${Date.now()}`;
  const pages = project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => {
    const order = ids.indexOf(element.id);
    if (order < 0) return element;
    return {
      ...element,
      textThreadId: threadId,
      textThreadOrder: order,
      previousTextFrameId: order > 0 ? ids[order - 1] : undefined,
      linkedTextFrameId: order < ids.length - 1 ? ids[order + 1] : undefined,
    };
  }) }));
  return { ...project, pages, updatedAt: Date.now(), typographyThreads: { ...(project.typographyThreads ?? {}), [threadId]: { name, frameIds: ids } } };
}

export function unlinkTextFrame(project: PublisherProject, frameId: string) {
  const found = findElement(project, frameId);
  if (!found?.element.textThreadId) return project;
  const threadId = found.element.textThreadId;
  const old = project.typographyThreads?.[threadId];
  const remaining = (old?.frameIds ?? []).filter((id) => id !== frameId);
  let next = { ...project, pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => element.id === frameId ? { ...element, textThreadId: undefined, textThreadOrder: undefined, previousTextFrameId: undefined, linkedTextFrameId: undefined } : element) })) };
  const threads = { ...(next.typographyThreads ?? {}) };
  delete threads[threadId];
  next = { ...next, typographyThreads: threads, updatedAt: Date.now() };
  return remaining.length >= 2 ? createTextThread(next, remaining, old?.name ?? "Text Thread") : next;
}

export function autoCreateLinkedFrame(project: PublisherProject, sourceId: string) {
  const found = findElement(project, sourceId);
  if (!found || found.element.type !== "text") return project;
  const source = found.element;
  const nextPageIndex = found.pageIndex + 1 < project.pages.length ? found.pageIndex + 1 : found.pageIndex;
  const targetPage = project.pages[nextPageIndex];
  const cloneId = `text-${Date.now()}`;
  const clone: PublisherElement = {
    ...source,
    id: cloneId,
    name: `${source.name} continuation`,
    x: nextPageIndex === found.pageIndex ? Math.min(targetPage.width - source.width, source.x + 24) : source.x,
    y: nextPageIndex === found.pageIndex ? Math.min(targetPage.height - source.height, source.y + 24) : source.y,
    text: "",
    textThreadId: undefined,
    textThreadOrder: undefined,
    previousTextFrameId: undefined,
    linkedTextFrameId: undefined,
  };
  let pages = project.pages.map((page, index) => index === nextPageIndex ? { ...page, elements: [...page.elements, clone] } : page);
  const interim = { ...project, pages, updatedAt: Date.now() };
  const existing = source.textThreadId ? (project.typographyThreads?.[source.textThreadId]?.frameIds ?? [source.id]) : [source.id];
  return createTextThread(interim, [...existing, cloneId], project.typographyThreads?.[source.textThreadId ?? ""]?.name ?? "Auto Thread");
}

export function flowThreadText(project: PublisherProject, threadId: string) {
  const thread = project.typographyThreads?.[threadId];
  if (!thread) return project;
  const frames = thread.frameIds.map((id) => findElement(project, id)?.element).filter(Boolean) as PublisherElement[];
  if (!frames.length) return project;
  const fullText = frames.map((frame) => frame.text ?? "").join("").trim();
  let offset = 0;
  const updates = new Map<string, Partial<PublisherElement>>();
  frames.forEach((frame, index) => {
    const capacity = estimateTextCapacity(frame);
    const chunk = fullText.slice(offset, offset + capacity);
    offset += chunk.length;
    updates.set(frame.id, { text: chunk, oversetText: index === frames.length - 1 && offset < fullText.length });
  });
  return { ...project, updatedAt: Date.now(), pages: project.pages.map((page) => ({ ...page, elements: page.elements.map((element) => updates.has(element.id) ? { ...element, ...updates.get(element.id) } : element) })) };
}

export function openTypeFeatureSettings(element: PublisherElement): string {
  const settings: string[] = [];
  (element.stylisticSets ?? []).forEach((set) => settings.push(`"ss${String(set).padStart(2, "0")}" 1`));
  settings.push(`"calt" ${element.contextualAlternates === false ? 0 : 1}`);
  if (element.swashes) settings.push('"swsh" 1');
  if (element.figureStyle === "oldstyle") settings.push('"onum" 1');
  if (element.figureStyle === "lining") settings.push('"lnum" 1');
  if (element.figureSpacing === "tabular") settings.push('"tnum" 1');
  if (element.figureSpacing === "proportional") settings.push('"pnum" 1');
  if (element.fractions) settings.push('"frac" 1');
  if (element.ordinals) settings.push('"ordn" 1');
  if (element.numericPosition === "numerator") settings.push('"numr" 1');
  if (element.numericPosition === "denominator") settings.push('"dnom" 1');
  if (element.numericPosition === "scientific-inferior") settings.push('"sinf" 1');
  return settings.join(", ");
}

export function publishingTypographyIssues(project: PublisherProject): string[] {
  const issues: string[] = [];
  const ids = new Set(project.pages.flatMap((page) => page.elements.map((element) => element.id)));
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.type !== "text") return;
    if (hasOversetText(element) || element.oversetText) issues.push(`${page.name}: ${element.name} contains overset text.`);
    if (element.linkedTextFrameId && !ids.has(element.linkedTextFrameId)) issues.push(`${page.name}: ${element.name} links to a missing text frame.`);
    if (element.previousTextFrameId && !ids.has(element.previousTextFrameId)) issues.push(`${page.name}: ${element.name} has a missing previous text frame.`);
    if ((element.stylisticSets ?? []).some((set) => set < 1 || set > 20)) issues.push(`${page.name}: ${element.name} has an invalid stylistic set.`);
    if ((element.paragraphBorderWidth ?? 0) > 0 && !element.paragraphBorderColor) issues.push(`${page.name}: ${element.name} has a paragraph border without a color.`);
  }));
  Object.entries(project.typographyThreads ?? {}).forEach(([id, thread]) => {
    if (thread.frameIds.length < 2) issues.push(`${thread.name || id} contains fewer than two text frames.`);
    thread.frameIds.forEach((frameId) => { if (!ids.has(frameId)) issues.push(`${thread.name || id} references missing frame ${frameId}.`); });
  });
  return Array.from(new Set(issues));
}

export function copyTypographySettings(source: PublisherElement, target: PublisherElement): PublisherElement {
  const updates: Partial<PublisherElement> = {};
  TEXT_FIELDS.forEach((key) => { (updates as any)[key] = source[key]; });
  return { ...target, ...updates };
}
