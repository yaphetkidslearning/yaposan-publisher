import type { PublisherElement } from "../types/publisher";
import type { ProfessionalTemplate, TemplateVariables } from "./types";

export const BUILT_IN_TEMPLATE_VARIABLES = [
  "Company", "BusinessName", "Person", "PersonName", "Title", "Phone", "Email",
  "Website", "Address", "Logo", "QR", "Photo", "Price", "Date",
] as const;

const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;

export function listPlaceholders(text: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = PLACEHOLDER.exec(text)) !== null) found.add(match[1]);
  PLACEHOLDER.lastIndex = 0;
  return [...found];
}

export function replacePlaceholders(text: string, values: TemplateVariables, preserveUnknown = true): string {
  return text.replace(PLACEHOLDER, (whole, key: string) => {
    const value = values[key];
    return value === undefined ? (preserveUnknown ? whole : "") : String(value);
  });
}

function resolveElement(element: PublisherElement, values: TemplateVariables): PublisherElement {
  const next = { ...element };
  if (typeof next.text === "string") next.text = replacePlaceholders(next.text, values);
  if (next.type === "image") {
    const key = /logo/i.test(next.name) ? "Logo" : /photo|image/i.test(next.name) ? "Photo" : undefined;
    if (key && typeof values[key] === "string") next.imageUri = String(values[key]);
  }
  return next;
}

export function resolveTemplateVariables(template: ProfessionalTemplate, values: TemplateVariables): ProfessionalTemplate {
  return {
    ...template,
    metadata: { ...template.metadata, updatedAt: new Date().toISOString() },
    pages: template.pages.map(page => ({ ...page, elements: page.elements.map(element => resolveElement(element, values)) })),
  };
}
