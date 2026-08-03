import type { PublisherElement, PublisherPage } from "../types/publisher";
import type { ProfessionalTemplate, TemplateTheme } from "./types";

export const DEFAULT_TEMPLATE_THEMES: TemplateTheme[] = [
  { id: "corporate-blue", name: "Corporate Blue", colors: { primary: "#1D4ED8", secondary: "#0F172A", accent: "#38BDF8", surface: "#FFFFFF", text: "#0F172A" }, fonts: { heading: "Inter", body: "Arial" } },
  { id: "corporate-green", name: "Corporate Green", colors: { primary: "#047857", secondary: "#064E3B", accent: "#34D399", surface: "#FFFFFF", text: "#052E16" }, fonts: { heading: "Inter", body: "Arial" } },
  { id: "luxury-gold", name: "Luxury Gold", colors: { primary: "#A16207", secondary: "#111827", accent: "#FACC15", surface: "#FFFBEB", text: "#111827" }, fonts: { heading: "Georgia", body: "Arial" } },
  { id: "modern-dark", name: "Modern Dark", colors: { primary: "#14B8A6", secondary: "#020617", accent: "#22D3EE", surface: "#0F172A", text: "#F8FAFC" }, fonts: { heading: "Inter", body: "Arial" } },
  { id: "minimal-white", name: "Minimal White", colors: { primary: "#334155", secondary: "#64748B", accent: "#0EA5E9", surface: "#FFFFFF", text: "#0F172A" }, fonts: { heading: "Inter", body: "Arial" } },
  { id: "creative-purple", name: "Creative Purple", colors: { primary: "#7C3AED", secondary: "#4C1D95", accent: "#F472B6", surface: "#FAF5FF", text: "#2E1065" }, fonts: { heading: "Inter", body: "Arial" } },
];

const roleFromName = (name: string): string | undefined => {
  const text = name.toLowerCase();
  if (text.includes("background") || text.includes("surface")) return "surface";
  if (text.includes("accent") || text.includes("highlight")) return "accent";
  if (text.includes("secondary")) return "secondary";
  if (text.includes("primary") || text.includes("title") || text.includes("header")) return "primary";
  return undefined;
};

function themeElement(element: PublisherElement, theme: TemplateTheme): PublisherElement {
  const role = roleFromName(element.name);
  const next = { ...element };
  if (role && theme.colors[role]) {
    if (element.type === "text") next.textColor = theme.colors[role];
    else next.fillColor = theme.colors[role];
  }
  if (element.type === "text") {
    next.fontFamily = /title|heading|header/i.test(element.name) ? theme.fonts.heading : theme.fonts.body;
  }
  return next;
}

export function applyTemplateTheme(template: ProfessionalTemplate, theme: TemplateTheme): ProfessionalTemplate {
  const pages: PublisherPage[] = template.pages.map(page => ({
    ...page,
    elements: page.elements.map(element => themeElement(element, theme)),
  }));
  return { ...template, metadata: { ...template.metadata, themeId: theme.id, updatedAt: new Date().toISOString() }, pages };
}
