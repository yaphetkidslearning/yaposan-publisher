import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate } from "./types";

export const PHASE44_DESIGN_TOKENS = {
  spacing: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48, display: 64 },
  radius: { none: 0, sm: 6, md: 12, lg: 20, xl: 32, pill: 999 },
  type: {
    eyebrow: { size: 13, lineHeight: 18, weight: "800", letterSpacing: 2.4 },
    display: { size: 72, lineHeight: 76, weight: "900", letterSpacing: -2.4 },
    h1: { size: 46, lineHeight: 52, weight: "900", letterSpacing: -1.2 },
    h2: { size: 30, lineHeight: 36, weight: "800", letterSpacing: -0.4 },
    body: { size: 16, lineHeight: 25, weight: "500", letterSpacing: 0 },
    caption: { size: 12, lineHeight: 17, weight: "700", letterSpacing: 0.7 },
    cta: { size: 15, lineHeight: 20, weight: "900", letterSpacing: 1.2 },
  },
  elevation: {
    card: { color: "#0f172a", opacity: 0.12, radius: 18, offsetX: 0, offsetY: 8 },
    floating: { color: "#0f172a", opacity: 0.22, radius: 30, offsetX: 0, offsetY: 16 },
  },
  palettes: {
    midnightGold: ["#0f172a", "#c8a96b", "#f8fafc", "#e2e8f0", "#ffffff"],
    coralViolet: ["#ff8a4d", "#ee3f76", "#321241", "#fff7d8", "#70f1ff"],
    wellness: ["#ffffff", "#14a7a0", "#164e63", "#dff7f5", "#67e8f9"],
    editorial: ["#111111", "#f4f1eb", "#d7d2ca", "#8a8178", "#ffffff"],
  },
} as const;

export type Phase44Grid = { columns: number; margin: number; gutter: number; width: number; height: number };
export function createPhase44Grid(width: number, height: number, columns = 12, margin = 48, gutter = 20): Phase44Grid {
  return { columns, margin, gutter, width, height };
}
export function phase44ColumnX(grid: Phase44Grid, column: number): number {
  const usable = grid.width - grid.margin * 2 - grid.gutter * (grid.columns - 1);
  const columnWidth = usable / grid.columns;
  return grid.margin + column * (columnWidth + grid.gutter);
}
export function phase44ColumnWidth(grid: Phase44Grid, span: number): number {
  const usable = grid.width - grid.margin * 2 - grid.gutter * (grid.columns - 1);
  const columnWidth = usable / grid.columns;
  return columnWidth * span + grid.gutter * Math.max(0, span - 1);
}

export type Phase44QualityReport = {
  score: number;
  passed: boolean;
  checks: Array<{ id: string; label: string; passed: boolean }>;
};

export function auditPhase44Template(template: ProfessionalTemplate): Phase44QualityReport {
  const elements = template.pages.flatMap(page => page.elements);
  const texts = elements.filter(element => element.type === "text");
  const visual = elements.filter(element => ["rectangle", "ellipse", "star", "svg", "image"].includes(element.type));
  const fontSizes = texts.map(element => element.fontSize ?? 0);
  const checks = [
    { id: "editable", label: "All templates are editable", passed: template.metadata.editable },
    { id: "hierarchy", label: "Typography has at least three distinct sizes", passed: new Set(fontSizes.map(value => Math.round(value / 4) * 4)).size >= 3 },
    { id: "density", label: "Composition contains at least twelve meaningful layers", passed: elements.length >= 12 },
    { id: "visual", label: "Composition contains at least five visual layers", passed: visual.length >= 5 },
    { id: "palette", label: "Professional palette has at least four colors", passed: template.metadata.palette.length >= 4 },
    { id: "fonts", label: "Professional font pairing is declared", passed: template.metadata.fonts.length >= 2 },
    { id: "production", label: "Every page has production dimensions", passed: template.pages.every(page => page.width >= 700 && page.height >= 700) },
    { id: "preview", label: "Preview color is defined", passed: Boolean(template.metadata.previewColor) },
  ];
  const score = Math.round(checks.filter(check => check.passed).length / checks.length * 100);
  return { score, passed: score >= 88, checks };
}

export function phase44ApplyTokens(page: PublisherPage): PublisherPage {
  const elements: PublisherElement[] = page.elements.map(element => ({
    ...element,
    borderRadius: element.borderRadius ?? (element.type === "rectangle" ? PHASE44_DESIGN_TOKENS.radius.sm : element.borderRadius),
    lineHeight: element.type === "text" ? (element.lineHeight ?? (element.fontSize ?? 16) * 1.2) : element.lineHeight,
  }));
  return { ...page, margin: page.margin || PHASE44_DESIGN_TOKENS.spacing.xl, elements };
}

export function phase44NormalizeTemplate(template: ProfessionalTemplate): ProfessionalTemplate {
  return {
    ...template,
    metadata: {
      ...template.metadata,
      version: "44.0.0",
      tags: Array.from(new Set([...template.metadata.tags, "phase 44", "professional design system", "quality audited"])),
      qualityScore: auditPhase44Template(template).score,
      updatedAt: "2026-07-30T18:00:00.000Z",
    },
    pages: template.pages.map(phase44ApplyTokens),
  };
}
