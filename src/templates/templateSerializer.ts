import type { ProfessionalTemplate } from "./types";
import { validateTemplate } from "./templateValidator";

export type TemplatePackage = { format: "yaposan-template-package"; version: 1; exportedAt: string; templates: ProfessionalTemplate[] };
export function serializeTemplatePackage(templates: ProfessionalTemplate[]): string {
  templates.forEach(template => {
    const errors = validateTemplate(template).filter(issue => issue.severity === "error");
    if (errors.length) throw new Error(`Cannot export invalid template ${template.metadata.id}.`);
  });
  return JSON.stringify({ format: "yaposan-template-package", version: 1, exportedAt: new Date().toISOString(), templates } satisfies TemplatePackage, null, 2);
}
export function deserializeTemplatePackage(raw: string): ProfessionalTemplate[] {
  const value = JSON.parse(raw) as TemplatePackage;
  if (value.format !== "yaposan-template-package" || value.version !== 1 || !Array.isArray(value.templates)) throw new Error("Unsupported template package.");
  return value.templates;
}
