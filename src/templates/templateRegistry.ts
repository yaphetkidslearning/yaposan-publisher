import type { ProfessionalTemplate } from "./types";
import { validateTemplate } from "./templateValidator";

export class TemplateRegistry {
  private readonly templates = new Map<string, ProfessionalTemplate>();
  register(template: ProfessionalTemplate, replace = false): void {
    const errors = validateTemplate(template).filter(issue => issue.severity === "error");
    if (errors.length) throw new Error(`Template validation failed: ${errors.map(issue => issue.message).join(" ")}`);
    if (!replace && this.templates.has(template.metadata.id)) throw new Error(`Template already registered: ${template.metadata.id}`);
    this.templates.set(template.metadata.id, structuredClone(template));
  }
  registerMany(templates: ProfessionalTemplate[], replace = false): void { templates.forEach(template => this.register(template, replace)); }
  get(id: string): ProfessionalTemplate | undefined { const item = this.templates.get(id); return item ? structuredClone(item) : undefined; }
  list(): ProfessionalTemplate[] { return [...this.templates.values()].map(item => structuredClone(item)); }
  remove(id: string): boolean { return this.templates.delete(id); }
  clear(): void { this.templates.clear(); }
  export(): string { return JSON.stringify(this.list(), null, 2); }
  import(serialized: string, replace = false): number {
    const parsed = JSON.parse(serialized) as ProfessionalTemplate[];
    if (!Array.isArray(parsed)) throw new Error("Template package must be an array.");
    this.registerMany(parsed, replace);
    return parsed.length;
  }
}

export const templateRegistry = new TemplateRegistry();
