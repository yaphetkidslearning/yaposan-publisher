import type { ProfessionalTemplate } from "./types";
export type TemplateThumbnailDescriptor = { templateId: string; width: number; height: number; backgroundColor: string; elementCount: number; cacheKey: string };
export function createThumbnailDescriptor(template: ProfessionalTemplate, width = 320): TemplateThumbnailDescriptor {
  const first = template.pages[0];
  const ratio = first ? first.height / Math.max(first.width, 1) : 1;
  return { templateId: template.metadata.id, width, height: Math.max(1, Math.round(width * ratio)), backgroundColor: first?.backgroundColor ?? template.metadata.previewColor, elementCount: first?.elements.length ?? 0, cacheKey: `${template.metadata.id}:${template.metadata.version}:${width}` };
}
