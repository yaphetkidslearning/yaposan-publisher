import { PHASE243D_PREMIUM_TEMPLATES } from "./templateCatalog243dPremiumTemplates";
import { PHASE4341_ONE_FLAGSHIP_TEMPLATE } from "./templateCatalog4341OneFlagshipTemplate";
import { auditPhase44Template, phase44NormalizeTemplate } from "./templateCatalog44ProfessionalDesignSystem";
import type { ProfessionalTemplate } from "./types";

export const PHASE44_TEMPLATES: ProfessionalTemplate[] = [
  PHASE4341_ONE_FLAGSHIP_TEMPLATE,
  ...PHASE243D_PREMIUM_TEMPLATES,
].map(phase44NormalizeTemplate);

export const PHASE44_TEMPLATE_COUNT = PHASE44_TEMPLATES.length;
export const PHASE44_QUALITY_REPORTS = PHASE44_TEMPLATES.map(template => ({
  templateId: template.metadata.id,
  name: template.metadata.name,
  ...auditPhase44Template(template),
}));
export const PHASE44_AVERAGE_QUALITY = Math.round(
  PHASE44_QUALITY_REPORTS.reduce((total, report) => total + report.score, 0) / Math.max(1, PHASE44_QUALITY_REPORTS.length),
);
