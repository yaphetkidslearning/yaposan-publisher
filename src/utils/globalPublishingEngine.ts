export type Phase52Status = "Ready" | "Foundation" | "External";
export type TextDirection = "ltr" | "rtl";

export type Phase52Capability = {
  id: string;
  title: string;
  description: string;
  status: Phase52Status;
  icon: any;
};

export type LocalePack = {
  code: string;
  label: string;
  direction: TextDirection;
  translated: number;
  total: number;
  enabled: boolean;
};

export type TranslationEntry = {
  key: string;
  source: string;
  target: string;
  locale: string;
  reviewed: boolean;
};

export const PHASE52_CAPABILITIES: Phase52Capability[] = [
  { id: "locale-registry", title: "Locale Pack Registry", description: "Typed locale metadata, display names, text direction, activation state, and completion tracking.", status: "Ready", icon: "language-outline" },
  { id: "rtl", title: "RTL Layout Foundation", description: "Direction-aware alignment, mirroring rules, reading order, and right-to-left publication metadata.", status: "Ready", icon: "swap-horizontal-outline" },
  { id: "translation-memory", title: "Translation Memory", description: "Reusable source and target entries with review status for consistent wording across documents.", status: "Ready", icon: "library-outline" },
  { id: "terminology", title: "Terminology & Brand Glossary", description: "Protected product names, approved translations, prohibited wording, and brand-language consistency rules.", status: "Ready", icon: "book-outline" },
  { id: "regional", title: "Regional Publishing Presets", description: "Locale-aware dates, numbers, currency, paper sizes, units, and export naming conventions.", status: "Ready", icon: "earth-outline" },
  { id: "quality", title: "Global Content Quality Audit", description: "Detect missing translations, overflow risk, unsupported fonts, untranslated strings, and RTL alignment conflicts.", status: "Ready", icon: "checkmark-done-outline" },
  { id: "workflow", title: "Review & Approval Workflow", description: "Draft, translated, reviewed, approved, and published states for each locale and content entry.", status: "Ready", icon: "git-branch-outline" },
  { id: "providers", title: "External Translation Providers", description: "Machine translation, professional linguist networks, and remote terminology synchronization require configured provider credentials.", status: "External", icon: "cloud-outline" },
];

export const DEFAULT_LOCALE_PACKS: LocalePack[] = [
  { code: "en-US", label: "English (United States)", direction: "ltr", translated: 480, total: 480, enabled: true },
  { code: "es-US", label: "Spanish (United States)", direction: "ltr", translated: 412, total: 480, enabled: true },
  { code: "fr-FR", label: "French (France)", direction: "ltr", translated: 355, total: 480, enabled: false },
  { code: "ar", label: "Arabic", direction: "rtl", translated: 298, total: 480, enabled: false },
  { code: "am", label: "Amharic", direction: "ltr", translated: 221, total: 480, enabled: false },
  { code: "ti", label: "Tigrinya", direction: "ltr", translated: 174, total: 480, enabled: false },
];

export const DEFAULT_TRANSLATION_ENTRIES: TranslationEntry[] = [
  { key: "common.create", source: "Create", target: "Crear", locale: "es-US", reviewed: true },
  { key: "common.publish", source: "Publish", target: "Publicar", locale: "es-US", reviewed: true },
  { key: "editor.templates", source: "Templates", target: "Plantillas", locale: "es-US", reviewed: true },
  { key: "editor.export", source: "Export", target: "Exportar", locale: "es-US", reviewed: false },
];

export function localeCompletion(pack: LocalePack): number {
  if (pack.total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((pack.translated / pack.total) * 100)));
}

export function updateLocalePack(packs: LocalePack[], code: string, patch: Partial<LocalePack>): LocalePack[] {
  return packs.map((pack) => pack.code === code ? { ...pack, ...patch, code: pack.code } : pack);
}

export function missingTranslationCount(packs: LocalePack[]): number {
  return packs.reduce((sum, pack) => sum + Math.max(0, pack.total - pack.translated), 0);
}

export function globalPublishingScore(packs: LocalePack[]): number {
  const enabled = packs.filter((pack) => pack.enabled);
  if (!enabled.length) return 0;
  return Math.round(enabled.reduce((sum, pack) => sum + localeCompletion(pack), 0) / enabled.length);
}

export function globalPublishingBlockers(packs: LocalePack[], entries: TranslationEntry[]): string[] {
  const blockers: string[] = [];
  const enabled = packs.filter((pack) => pack.enabled);
  if (!enabled.length) blockers.push("Enable at least one locale pack.");
  for (const pack of enabled) {
    if (localeCompletion(pack) < 100) blockers.push(`${pack.label} is ${localeCompletion(pack)}% translated.`);
  }
  const unreviewed = entries.filter((entry) => !entry.reviewed).length;
  if (unreviewed) blockers.push(`${unreviewed} translation entr${unreviewed === 1 ? "y is" : "ies are"} waiting for review.`);
  return blockers;
}

export const PHASE52_GLOBAL_PUBLISHING = {
  phase: 52,
  label: "Global Localization & Publishing Platform",
  summary: "Locale packs, RTL publishing, translation memory, terminology governance, regional presets, and evidence-based global release checks.",
  score: Math.round((PHASE52_CAPABILITIES.filter((item) => item.status === "Ready").length / PHASE52_CAPABILITIES.length) * 100),
  ready: PHASE52_CAPABILITIES.filter((item) => item.status === "Ready").length,
  total: PHASE52_CAPABILITIES.length,
} as const;
