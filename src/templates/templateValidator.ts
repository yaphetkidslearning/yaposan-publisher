import { TEMPLATE_CATEGORIES, type ProfessionalTemplate, type TemplateValidationIssue } from "./types";
import { listPlaceholders } from "./templateVariables";

export function validateTemplate(template: ProfessionalTemplate): TemplateValidationIssue[] {
  const issues: TemplateValidationIssue[] = [];
  const push = (severity: TemplateValidationIssue["severity"], code: string, message: string, pageId?: string, elementId?: string) => issues.push({ severity, code, message, pageId, elementId });
  const m = template.metadata;
  if (!m.id.trim()) push("error", "metadata.id", "Template ID is required.");
  if (!m.name.trim()) push("error", "metadata.name", "Template name is required.");
  if (!TEMPLATE_CATEGORIES.includes(m.category)) push("error", "metadata.category", "Template category is invalid.");
  if (!m.tags.length) push("warning", "metadata.tags", "Add searchable tags.");
  if (!template.pages.length) push("error", "pages.empty", "Template must contain at least one page.");
  const ids = new Set<string>();
  template.pages.forEach(page => {
    if (ids.has(page.id)) push("error", "page.duplicate-id", `Duplicate page ID: ${page.id}`, page.id);
    ids.add(page.id);
    if (!page.elements.length) push("warning", "page.empty", "Page has no editable elements.", page.id);
    page.elements.forEach(element => {
      if (ids.has(element.id)) push("error", "element.duplicate-id", `Duplicate element ID: ${element.id}`, page.id, element.id);
      ids.add(element.id);
      if (element.width <= 0 || element.height <= 0) push("error", "element.invalid-size", "Element dimensions must be positive.", page.id, element.id);
      if (element.type === "text" && typeof element.text === "string") {
        listPlaceholders(element.text).forEach(key => {
          if (!/^[A-Za-z][A-Za-z0-9_.-]*$/.test(key)) push("warning", "placeholder.invalid", `Invalid placeholder: ${key}`, page.id, element.id);
        });
      }
      if (element.type === "image" && !element.imageUri) push("info", "image.placeholder", "Image element is ready for a user-provided image.", page.id, element.id);
    });
  });
  return issues;
}
