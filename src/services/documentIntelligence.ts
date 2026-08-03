import type { DocumentIntelligenceIssue } from "../types/aiWriting";
import type { PublisherProject } from "../types/publisher";

function normalized(text: string) { return text.replace(/\s+/g, " ").trim().toLowerCase(); }
function luminance(hex: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!match) return 1;
  const values = [0, 2, 4].map((i) => parseInt(match[1].slice(i, i + 2), 16) / 255).map((v) => v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
  return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
}
function contrast(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

export function analyzeDocument(project: PublisherProject): DocumentIntelligenceIssue[] {
  const issues: DocumentIntelligenceIssue[] = [];
  const seen = new Map<string, { pageId: string; pageName: string; elementId: string }>();
  const fonts = new Set<string>();
  const colors = new Set<string>();
  for (const page of project.pages) {
    for (const element of page.elements) {
      if (element.type === "text") {
        const text = element.text ?? "";
        const key = normalized(text);
        if (!key) issues.push({ id:`empty-${element.id}`,kind:"empty",severity:"warning",pageId:page.id,pageName:page.name,elementId:element.id,title:"Empty text box",detail:`${element.name || "Text box"} has no text.`,suggestion:"Add content or remove the unused text box." });
        else if (key.length >= 20) {
          const prior = seen.get(key);
          if (prior) issues.push({ id:`duplicate-${element.id}`,kind:"duplicate",severity:"warning",pageId:page.id,pageName:page.name,elementId:element.id,title:"Duplicated text",detail:`This text also appears on ${prior.pageName}.`,suggestion:"Review the repeated copy and keep it only where intentional." });
          else seen.set(key, { pageId:page.id,pageName:page.name,elementId:element.id });
        }
        const fontSize = element.fontSize ?? 16;
        const lineHeight = element.lineHeight ?? fontSize * 1.2;
        const charsPerLine = Math.max(8, Math.floor(element.width / Math.max(5, fontSize * .55)));
        const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
        if (lines * lineHeight > element.height * 1.08) issues.push({ id:`overflow-${element.id}`,kind:"overflow",severity:"error",pageId:page.id,pageName:page.name,elementId:element.id,title:"Text may overflow",detail:`${element.name || "Text box"} needs about ${Math.ceil(lines * lineHeight)} px of height but has ${Math.round(element.height)} px.`,suggestion:"Increase the text-box height, reduce font size, or shorten the copy." });
        if (element.fontFamily) fonts.add(element.fontFamily);
        if (element.textColor) colors.add(element.textColor);
        const background = element.fillColor && element.fillColor !== "transparent" ? element.fillColor : "#FFFFFF";
        if (element.textColor && contrast(element.textColor, background) < 4.5) issues.push({ id:`contrast-${element.id}`,kind:"accessibility",severity:"error",pageId:page.id,pageName:page.name,elementId:element.id,title:"Low text contrast",detail:"Text and background may not meet accessible contrast guidance.",suggestion:"Use a darker text color or a lighter background." });
        if (fontSize < 12) issues.push({ id:`small-${element.id}`,kind:"accessibility",severity:"warning",pageId:page.id,pageName:page.name,elementId:element.id,title:"Small text",detail:`Font size is ${fontSize}px.`,suggestion:"Use at least 12px for body text and larger sizes for print." });
      }
      if (element.fillColor && element.fillColor !== "transparent") colors.add(element.fillColor);
      if (element.x < 0 || element.y < 0 || element.x + element.width > page.width || element.y + element.height > page.height) issues.push({ id:`bounds-${element.id}`,kind:"layout",severity:"error",pageId:page.id,pageName:page.name,elementId:element.id,title:"Object outside page",detail:`${element.name || "Object"} extends beyond the page boundary.`,suggestion:"Move or resize the object so all content remains printable." });
      if (element.type === "image" && !(element as any).altText) issues.push({ id:`alt-${element.id}`,kind:"accessibility",severity:"warning",pageId:page.id,pageName:page.name,elementId:element.id,title:"Image missing description",detail:`${element.name || "Image"} has no alternative-text description.`,suggestion:"Add concise alt text in the Properties panel." });
    }
  }
  const first = project.pages[0];
  if (first && fonts.size > 3) issues.push({ id:"font-system",kind:"font",severity:"info",pageId:first.id,pageName:first.name,title:"Too many font families",detail:`The document uses ${fonts.size} font families.`,suggestion:"Use one display font and one highly readable body font, such as Georgia with Arial." });
  if (first && colors.size > 6) issues.push({ id:"color-system",kind:"color",severity:"info",pageId:first.id,pageName:first.name,title:"Complex color palette",detail:`The document uses at least ${colors.size} colors.`,suggestion:"Create harmony with one primary, one accent, and two or three neutral colors." });
  return issues;
}
