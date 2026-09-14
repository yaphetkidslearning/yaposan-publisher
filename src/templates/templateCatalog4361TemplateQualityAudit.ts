import type { ProfessionalTemplate } from "./types";

export type TemplateQualityEvidence = {
  templateId: string;
  score: number;
  passed: boolean;
  checks: Record<string, boolean>;
  issues: string[];
};

export function auditPhase4361Template(template: ProfessionalTemplate): TemplateQualityEvidence {
  const page = template.pages[0];
  const elements = page?.elements ?? [];
  const textElements = elements.filter((element) => element.type === "text");
  const shapeElements = elements.filter((element) => element.type !== "text");
  const palette = template.metadata.palette ?? [];
  const fonts = template.metadata.fonts ?? [];
  const checks = {
    editable: template.metadata.editable === true,
    completeCanvas: Boolean(page && page.width >= 600 && page.height >= 600),
    typographyHierarchy: textElements.length >= 3 && fonts.length >= 2,
    visualComposition: shapeElements.length >= 4,
    professionalPalette: palette.length >= 4,
    usefulMetadata: template.metadata.tags.length >= 5 && Boolean(template.metadata.description),
    exportReady: Boolean(page?.backgroundColor) && elements.every((element) => Number.isFinite(element.x) && Number.isFinite(element.y)),
    uniqueMaster: Boolean(template.metadata.masterTemplateId),
  };
  const issues = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => `Failed quality check: ${name}`);
  const score = Math.round((Object.values(checks).filter(Boolean).length / Object.keys(checks).length) * 100);
  return { templateId: template.metadata.id, score, passed: score >= 88 && issues.length <= 1, checks, issues };
}

export function auditPhase4361Library(templates: ProfessionalTemplate[]) {
  const evidence = templates.map(auditPhase4361Template);
  return {
    total: evidence.length,
    passed: evidence.filter((item) => item.passed).length,
    averageScore: evidence.length ? Math.round(evidence.reduce((sum, item) => sum + item.score, 0) / evidence.length) : 0,
    evidence,
  };
}
