import type { ProfessionalTemplate } from "./types";

export type TemplateQualityDimension =
  | "metadata"
  | "editability"
  | "content"
  | "layout"
  | "typography"
  | "color";

export type TemplateQualityFinding = {
  dimension: TemplateQualityDimension;
  severity: "info" | "warning" | "error";
  message: string;
  pageId?: string;
};

export type TemplateQualityReport = {
  templateId: string;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  passed: boolean;
  findings: TemplateQualityFinding[];
  dimensions: Record<TemplateQualityDimension, number>;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const gradeFor = (score: number): TemplateQualityReport["grade"] =>
  score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 60 ? "D" : "F";

export function auditTemplateQuality(template: ProfessionalTemplate, passingScore = 80): TemplateQualityReport {
  const findings: TemplateQualityFinding[] = [];
  const metadata = template.metadata;
  const pages = template.pages;

  let metadataScore = 100;
  if (!metadata.description?.trim()) {
    metadataScore -= 20;
    findings.push({ dimension: "metadata", severity: "warning", message: "Add a useful template description." });
  }
  if ((metadata.tags?.length ?? 0) < 3) {
    metadataScore -= 15;
    findings.push({ dimension: "metadata", severity: "warning", message: "Add at least three searchable tags." });
  }
  if (!metadata.subcategory) metadataScore -= 10;
  if (!metadata.industry) metadataScore -= 5;

  let editabilityScore = metadata.editable ? 100 : 40;
  if (!metadata.editable) {
    findings.push({ dimension: "editability", severity: "error", message: "Template is not marked editable." });
  }

  let contentScore = pages.length ? 100 : 0;
  if (!pages.length) findings.push({ dimension: "content", severity: "error", message: "Template has no pages." });

  let layoutScore = 100;
  let typographyScore = 100;
  let colorScore = 100;
  const palette = new Set<string>();
  let textElements = 0;
  let visualElements = 0;

  for (const page of pages) {
    if (!page.elements.length) {
      contentScore -= 25;
      findings.push({ dimension: "content", severity: "warning", message: "Page has no editable content.", pageId: page.id });
      continue;
    }

    const pageArea = Math.max(1, page.width * page.height);
    let occupiedArea = 0;
    for (const element of page.elements) {
      occupiedArea += Math.max(0, element.width) * Math.max(0, element.height);
      if (element.type === "text") {
        textElements += 1;
        const value = typeof element.text === "string" ? element.text.trim() : "";
        if (!value) {
          contentScore -= 3;
          findings.push({ dimension: "content", severity: "info", message: "Empty text element found.", pageId: page.id });
        }
        if (typeof element.fontSize === "number" && element.fontSize < 7) {
          typographyScore -= 4;
          findings.push({ dimension: "typography", severity: "warning", message: "Very small text may be difficult to read.", pageId: page.id });
        }
        if (typeof element.textColor === "string") palette.add(element.textColor);
      } else {
        visualElements += 1;
      }
      if (typeof element.fillColor === "string") palette.add(element.fillColor);
      if (element.x < 0 || element.y < 0 || element.x + element.width > page.width || element.y + element.height > page.height) {
        layoutScore -= 5;
        findings.push({ dimension: "layout", severity: "warning", message: "An element extends beyond the page bounds.", pageId: page.id });
      }
    }

    const density = occupiedArea / pageArea;
    if (density < 0.12) {
      layoutScore -= 10;
      findings.push({ dimension: "layout", severity: "warning", message: "Page composition appears too sparse.", pageId: page.id });
    }
    if (density > 2.5) {
      layoutScore -= 8;
      findings.push({ dimension: "layout", severity: "warning", message: "Page composition may be overly dense or overlapping.", pageId: page.id });
    }
  }

  if (textElements === 0) {
    typographyScore -= 30;
    findings.push({ dimension: "typography", severity: "warning", message: "Template has no text hierarchy." });
  }
  if (visualElements === 0) {
    layoutScore -= 10;
    findings.push({ dimension: "layout", severity: "info", message: "Template contains no visual or structural elements." });
  }
  if (palette.size < 2) {
    colorScore -= 25;
    findings.push({ dimension: "color", severity: "warning", message: "Use a more intentional multi-color palette." });
  } else if (palette.size > 12) {
    colorScore -= 10;
    findings.push({ dimension: "color", severity: "info", message: "Large color palette may reduce visual consistency." });
  }

  const dimensions = {
    metadata: clamp(metadataScore),
    editability: clamp(editabilityScore),
    content: clamp(contentScore),
    layout: clamp(layoutScore),
    typography: clamp(typographyScore),
    color: clamp(colorScore),
  };

  const score = clamp(
    dimensions.metadata * 0.15 +
    dimensions.editability * 0.10 +
    dimensions.content * 0.20 +
    dimensions.layout * 0.25 +
    dimensions.typography * 0.20 +
    dimensions.color * 0.10,
  );

  return {
    templateId: metadata.id,
    score,
    grade: gradeFor(score),
    passed: score >= passingScore,
    findings,
    dimensions,
  };
}

export function auditTemplateLibrary(templates: ProfessionalTemplate[], passingScore = 80) {
  const reports = templates.map(template => auditTemplateQuality(template, passingScore));
  return {
    total: reports.length,
    passed: reports.filter(report => report.passed).length,
    failed: reports.filter(report => !report.passed).length,
    averageScore: reports.length
      ? Math.round(reports.reduce((sum, report) => sum + report.score, 0) / reports.length)
      : 0,
    reports,
  };
}
