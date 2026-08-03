export type HyphenationSettings = {
  enabled: boolean;
  language: string;
  minWordLength: number;
  minPrefix: number;
  minSuffix: number;
  maxConsecutiveLines: number;
};

export type OpenTypeSettings = {
  ligatures: boolean;
  discretionaryLigatures: boolean;
  oldStyleFigures: boolean;
  tabularFigures: boolean;
  smallCaps: boolean;
  fractions: boolean;
  stylisticSet: number;
  kerning: "auto" | "metrics" | "optical" | "none";
};

export type BaselineGridSettings = {
  enabled: boolean;
  start: number;
  increment: number;
  snapBodyText: boolean;
};

export type CompositionSettings = {
  columns: number;
  columnGap: number;
  paragraphComposer: "single-line" | "multi-line";
  opticalMarginAlignment: boolean;
  widowLines: number;
  orphanLines: number;
  keepHeadingsWithNext: boolean;
  hyphenation: HyphenationSettings;
  openType: OpenTypeSettings;
  baselineGrid: BaselineGridSettings;
};

export type PublishingNote = {
  id: string;
  kind: "footnote" | "endnote";
  marker: string;
  text: string;
  pageId?: string;
};

export type BookChapter = {
  id: string;
  title: string;
  startPage: number;
  pageCount: number;
  includeInToc: boolean;
  numberingStyle: "arabic" | "roman-lower" | "roman-upper";
};

export type IndexEntry = {
  id: string;
  term: string;
  sortKey: string;
  pages: number[];
  crossReference?: string;
};

export type DesktopPublishingDocument = {
  id: string;
  name: string;
  bodyText: string;
  settings: CompositionSettings;
  notes: PublishingNote[];
  chapters: BookChapter[];
  indexEntries: IndexEntry[];
  updatedAt: number;
};

export type CompositionLine = {
  text: string;
  width: number;
  hyphenated: boolean;
};

export type CompositionReport = {
  lines: CompositionLine[];
  paragraphs: number;
  words: number;
  characters: number;
  estimatedPages: number;
  oversetRisk: "low" | "medium" | "high";
  warnings: string[];
};

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_COMPOSITION_SETTINGS: CompositionSettings = {
  columns: 2,
  columnGap: 18,
  paragraphComposer: "multi-line",
  opticalMarginAlignment: true,
  widowLines: 2,
  orphanLines: 2,
  keepHeadingsWithNext: true,
  hyphenation: { enabled: true, language: "en-US", minWordLength: 6, minPrefix: 3, minSuffix: 3, maxConsecutiveLines: 2 },
  openType: { ligatures: true, discretionaryLigatures: false, oldStyleFigures: false, tabularFigures: false, smallCaps: false, fractions: true, stylisticSet: 0, kerning: "optical" },
  baselineGrid: { enabled: true, start: 36, increment: 14, snapBodyText: true },
};

export function createDesktopPublishingDocument(name = "Untitled Publication"): DesktopPublishingDocument {
  return {
    id: uid("publication"),
    name,
    bodyText: "",
    settings: structuredClone(DEFAULT_COMPOSITION_SETTINGS),
    notes: [],
    chapters: [],
    indexEntries: [],
    updatedAt: Date.now(),
  };
}

const vowel = /[aeiouy]/i;
export function hyphenateWord(word: string, settings: HyphenationSettings): string[] {
  if (!settings.enabled || word.length < settings.minWordLength) return [word];
  const candidates: number[] = [];
  for (let i = settings.minPrefix; i <= word.length - settings.minSuffix; i += 1) {
    const left = word[i - 1] ?? "";
    const right = word[i] ?? "";
    if (vowel.test(left) !== vowel.test(right) && /[a-z]/i.test(left + right)) candidates.push(i);
  }
  if (!candidates.length) return [word];
  const middle = word.length / 2;
  const split = candidates.reduce((best, current) => Math.abs(current - middle) < Math.abs(best - middle) ? current : best);
  return [word.slice(0, split), word.slice(split)];
}

export function composeText(text: string, settings: CompositionSettings, lineWidth = 58): CompositionReport {
  const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/) : [];
  const lines: CompositionLine[] = [];
  let consecutiveHyphens = 0;
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
    let line = "";
    for (const originalWord of words) {
      const candidate = line ? `${line} ${originalWord}` : originalWord;
      if (candidate.length <= lineWidth) { line = candidate; continue; }
      const remaining = Math.max(0, lineWidth - line.length - (line ? 1 : 0));
      const parts = hyphenateWord(originalWord, settings.hyphenation);
      const canHyphenate = parts.length === 2 && parts[0].length + 1 <= remaining && consecutiveHyphens < settings.hyphenation.maxConsecutiveLines;
      if (canHyphenate) {
        const hyphenLine = `${line}${line ? " " : ""}${parts[0]}-`;
        lines.push({ text: hyphenLine, width: hyphenLine.length / lineWidth, hyphenated: true });
        line = parts[1];
        consecutiveHyphens += 1;
      } else {
        if (line) lines.push({ text: line, width: line.length / lineWidth, hyphenated: false });
        line = originalWord;
        consecutiveHyphens = 0;
      }
    }
    if (line) lines.push({ text: line, width: line.length / lineWidth, hyphenated: false });
    if (paragraphIndex < paragraphs.length - 1) lines.push({ text: "", width: 0, hyphenated: false });
  });
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const estimatedPages = Math.max(1, Math.ceil(lines.length / Math.max(1, 42 * settings.columns)));
  const warnings: string[] = [];
  const loose = lines.filter((line) => line.text && line.width < 0.45).length;
  if (loose > Math.max(2, lines.length * 0.15)) warnings.push(`${loose} loose lines may create uneven color.`);
  if (settings.baselineGrid.enabled && settings.baselineGrid.increment < 8) warnings.push("Baseline increment is unusually tight.");
  if (settings.columns > 4) warnings.push("More than four columns may reduce readability.");
  const risk = warnings.length > 2 ? "high" : warnings.length ? "medium" : "low";
  return { lines, paragraphs: paragraphs.length, words, characters: text.length, estimatedPages, oversetRisk: risk, warnings };
}

export function addPublishingNote(document: DesktopPublishingDocument, kind: PublishingNote["kind"], text: string, pageId?: string): DesktopPublishingDocument {
  const count = document.notes.filter((note) => note.kind === kind).length + 1;
  return { ...document, notes: [...document.notes, { id: uid("note"), kind, marker: String(count), text, pageId }], updatedAt: Date.now() };
}

export function addBookChapter(document: DesktopPublishingDocument, title: string, startPage: number, pageCount = 1): DesktopPublishingDocument {
  return { ...document, chapters: [...document.chapters, { id: uid("chapter"), title, startPage, pageCount, includeInToc: true, numberingStyle: "arabic" as const }].sort((a,b)=>a.startPage-b.startPage), updatedAt: Date.now() };
}

export function addIndexEntry(document: DesktopPublishingDocument, term: string, page: number): DesktopPublishingDocument {
  const normalized = term.trim();
  const existing = document.indexEntries.find((entry) => entry.term.toLocaleLowerCase() === normalized.toLocaleLowerCase());
  const indexEntries = existing
    ? document.indexEntries.map((entry) => entry.id === existing.id ? { ...entry, pages: [...new Set([...entry.pages, page])].sort((a,b)=>a-b) } : entry)
    : [...document.indexEntries, { id: uid("index"), term: normalized, sortKey: normalized.toLocaleLowerCase(), pages: [page] }];
  return { ...document, indexEntries: indexEntries.sort((a,b)=>a.sortKey.localeCompare(b.sortKey)), updatedAt: Date.now() };
}

export function generateTableOfContents(document: DesktopPublishingDocument): string {
  return document.chapters.filter((chapter) => chapter.includeInToc).map((chapter) => `${chapter.title}${".".repeat(Math.max(3, 52 - chapter.title.length))}${chapter.startPage}`).join("\n");
}

export function generateIndex(document: DesktopPublishingDocument): string {
  return document.indexEntries.map((entry) => `${entry.term}, ${entry.pages.join(", ")}${entry.crossReference ? `; see ${entry.crossReference}` : ""}`).join("\n");
}

export function buildOpenTypeFeatureString(settings: OpenTypeSettings): string {
  const features: Array<[string, boolean]> = [
    ["liga", settings.ligatures], ["dlig", settings.discretionaryLigatures], ["onum", settings.oldStyleFigures],
    ["tnum", settings.tabularFigures], ["smcp", settings.smallCaps], ["frac", settings.fractions],
  ];
  if (settings.stylisticSet > 0) features.push([`ss${String(settings.stylisticSet).padStart(2,"0")}`, true]);
  return features.map(([tag, enabled]) => `"${tag}" ${enabled ? 1 : 0}`).join(", ");
}
