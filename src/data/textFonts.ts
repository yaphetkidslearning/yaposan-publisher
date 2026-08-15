import { FONT_FAMILIES } from "../constants/publisher";

export interface TextFontOption {
  label: string;
  value: string;
}

// Keep every text surface synchronized with Publisher's single font catalog.
// This prevents small legacy pickers from exposing only a subset of the fonts
// available in the Publisher toolbar and Font Manager.
export const TEXT_FONTS: TextFontOption[] = FONT_FAMILIES.map((family) => ({
  label: family,
  value: family,
}));

export const TEXT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 64, 72, 96, 120];

export const TEXT_COLORS = [
  '#111827',
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#EAB308',
  '#22C55E',
  '#14B8A6',
  '#0EA5E9',
  '#2563EB',
  '#7C3AED',
  '#DB2777',
];
