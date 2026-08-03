import type { PublisherProject } from "../types/publisher";
import type { ProfessionalTemplate, TemplateVariables } from "./types";
import { resolveTemplateVariables } from "./templateVariables";

const cloneId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export function templateToProject(template: ProfessionalTemplate, variables: TemplateVariables = {}): PublisherProject {
  const resolved = resolveTemplateVariables(template, variables);
  const pageMap = new Map<string, string>();
  const pages = resolved.pages.map(page => {
    const id = cloneId("page"); pageMap.set(page.id, id);
    return { ...page, id, elements: page.elements.map(element => ({ ...element, id: cloneId("element") })) };
  });
  const now = Date.now();
  return { id: cloneId("project"), name: resolved.metadata.name, pages, activePageId: pages[0]?.id ?? "", createdAt: now, updatedAt: now } as PublisherProject;
}
