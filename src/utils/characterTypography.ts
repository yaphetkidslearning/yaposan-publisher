import type { PublisherElement } from "../types/publisher";

export type CharacterStylePreset = {
  id: string;
  name: string;
  updates: Partial<PublisherElement>;
};

export const CHARACTER_STYLE_PRESETS: CharacterStylePreset[] = [
  { id: "body", name: "Body", updates: { fontWeight: "400", italic: false, letterSpacing: 0, baselineShift: 0, textTransform: "none" } },
  { id: "headline", name: "Headline", updates: { fontWeight: "800", letterSpacing: -0.5, textTransform: "none", ligatures: true } },
  { id: "eyebrow", name: "Eyebrow", updates: { fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", smallCaps: false } },
  { id: "caption", name: "Caption", updates: { fontWeight: "400", italic: true, letterSpacing: 0.2 } },
  { id: "code", name: "Code", updates: { fontFamily: "Courier New", fontWeight: "400", letterSpacing: 0 } },
];

export function clampTypography(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));
}

export function normalizeCharacterTypography(element: PublisherElement): PublisherElement {
  const tracking = clampTypography(element.tracking ?? element.letterSpacing ?? 0, -10, 50);
  return {
    ...element,
    kerning: clampTypography(element.kerning ?? 0, -10, 10),
    tracking,
    letterSpacing: tracking,
    baselineShift: clampTypography(element.baselineShift ?? 0, -100, 100),
    textTransform: element.textTransform ?? "none",
    ligatures: element.ligatures ?? true,
    smallCaps: element.smallCaps ?? false,
    strikethrough: element.strikethrough ?? false,
    underlineStyle: element.underlineStyle ?? "solid",
    variableFontAxes: element.variableFontAxes ?? {},
  };
}

export function applyCharacterPreset(element: PublisherElement, presetId: string): PublisherElement {
  const preset = CHARACTER_STYLE_PRESETS.find((item) => item.id === presetId);
  return normalizeCharacterTypography({ ...element, ...(preset?.updates ?? {}), characterStyleId: preset?.id });
}

export function variableAxis(element: PublisherElement, axis: string, fallback: number) {
  return element.variableFontAxes?.[axis] ?? fallback;
}
