import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import type { PublisherElement, PublisherProject } from "../types/publisher";
import { FONT_FAMILIES } from "../constants/publisher";
import { normalizePublisherProject } from "./publisherStorage";
import { scanLinkedAssets } from "./projectAssetScanner";
export { scanLinkedAssets } from "./projectAssetScanner";

export const PACKAGE_EXTENSION = ".yaposan-package";
const PACKAGE_FORMAT = "yaposan-publisher-package";
const PACKAGE_VERSION = 1;

export type FontDiagnostic = { fontFamily: string; usageCount: number; available: boolean };
export type StorageDiagnostic = {
  projectBytes: number;
  embeddedAssetBytes: number;
  linkedAssetCount: number;
  embeddedAssetCount: number;
  fontCount: number;
  pageCount: number;
  elementCount: number;
  totalBytes: number;
};

const commonFonts = new Set([...FONT_FAMILIES, "System"]);
const bytes = (value: string) => {
  try { return new Blob([value]).size; } catch { return value.length; }
};
const safeName = (value: string) => value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "publication";

export function scanFonts(project: PublisherProject): FontDiagnostic[] {
  const counts = new Map<string, number>();
  project.pages.forEach((page) => page.elements.forEach((element) => {
    if (element.type !== "text") return;
    const family = typeof element.fontFamily === "string" ? element.fontFamily.trim() || "Arial" : "Arial";
    counts.set(family, (counts.get(family) ?? 0) + 1);
  }));
  return [...counts.entries()].map(([fontFamily, usageCount]) => ({
    fontFamily,
    usageCount,
    available: Boolean(project.embeddedFonts?.[fontFamily]) || commonFonts.has(fontFamily) || (Platform.OS === "web" && typeof document !== "undefined" && Boolean(document.fonts?.check(`12px \"${fontFamily}\"`))),
  })).sort((a, b) => a.fontFamily.localeCompare(b.fontFamily));
}

export function replaceProjectFont(project: PublisherProject, oldFont: string, newFont: string): PublisherProject {
  return {
    ...project,
    updatedAt: Date.now(),
    pages: project.pages.map((page) => ({
      ...page,
      elements: page.elements.map((element): PublisherElement => element.type === "text" && (element.fontFamily || "Arial") === oldFont ? { ...element, fontFamily: newFont } : element),
    })),
  };
}

export function analyzeProjectStorage(project: PublisherProject): StorageDiagnostic {
  const assets = scanLinkedAssets(project);
  const projectBytes = bytes(JSON.stringify(project));
  const embeddedAssetBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const elementCount = project.pages.reduce((sum, page) => sum + page.elements.length, 0);
  return {
    projectBytes,
    embeddedAssetBytes,
    linkedAssetCount: assets.length,
    embeddedAssetCount: assets.filter((asset) => asset.embedded).length,
    fontCount: scanFonts(project).length,
    pageCount: project.pages.length,
    elementCount,
    totalBytes: projectBytes + embeddedAssetBytes,
  };
}

export function serializeProjectPackage(project: PublisherProject) {
  return JSON.stringify({
    format: PACKAGE_FORMAT,
    formatVersion: PACKAGE_VERSION,
    createdAt: Date.now(),
    project,
    manifest: {
      assets: scanLinkedAssets(project).map(({ uri, ...asset }) => ({ ...asset, sourceIncluded: asset.embedded, source: asset.embedded ? uri : null })),
      fonts: scanFonts(project),
      storage: analyzeProjectStorage(project),
    },
  }, null, 2);
}

export async function exportProjectPackage(project: PublisherProject) {
  const filename = `${safeName(project.name)}${PACKAGE_EXTENSION}`;
  const contents = serializeProjectPackage(project);
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const url = URL.createObjectURL(new Blob([contents], { type: "application/vnd.yaposan.package+json" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url); return;
  }
  const file = new ExpoFile(Paths.cache, filename); file.create({ overwrite: true, intermediates: true }); file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType: "application/vnd.yaposan.package+json", dialogTitle: `Export ${filename}` });
}

function parsePackage(contents: string): PublisherProject {
  let parsed: any;
  try { parsed = JSON.parse(contents); } catch { throw new Error("The selected package is not valid JSON."); }
  if (!parsed || parsed.format !== PACKAGE_FORMAT || parsed.formatVersion !== PACKAGE_VERSION || !parsed.project) throw new Error("This is not a supported Yaposan project package.");
  return normalizePublisherProject(parsed.project);
}

export async function importProjectPackage(): Promise<PublisherProject | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input"); input.type = "file"; input.accept = PACKAGE_EXTENSION;
      input.onchange = () => { const file = input.files?.[0]; if (!file) return resolve(null); const reader = new FileReader(); reader.onload = () => { try { resolve(parsePackage(String(reader.result ?? ""))); } catch (error) { reject(error); } }; reader.onerror = () => reject(new Error("Unable to read package.")); reader.readAsText(file); };
      input.click();
    });
  }
  const result = await DocumentPicker.getDocumentAsync({ type: ["application/octet-stream", "application/json", "text/plain"], copyToCacheDirectory: true });
  if (result.canceled || !result.assets[0]) return null;
  const file = new ExpoFile(result.assets[0].uri); return parsePackage(await file.text());
}
