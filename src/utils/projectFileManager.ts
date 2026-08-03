import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import type { PublisherProject } from "../types/publisher";
import { normalizePublisherProject } from "./publisherStorage";

export const YAPOSAN_PROJECT_EXTENSION = ".yaposan";
export const YAPOSAN_PROJECT_MIME = "application/vnd.yaposan.publisher+json";
export const YAPOSAN_PROJECT_FORMAT = "yaposan-publisher";
export const YAPOSAN_PROJECT_FORMAT_VERSION = 1;

type ProjectEnvelope = {
  format: typeof YAPOSAN_PROJECT_FORMAT;
  formatVersion: number;
  project: unknown;
};

function safeFileName(value: string) {
  return value.trim().replace(/[\\/:*?"<>|]+/g, "-") || "publication";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertValidProjectShape(value: unknown): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new Error("This file does not contain a Yaposan project.");
  if (typeof value.name !== "string" || !value.name.trim()) {
    throw new Error("The project name is missing or invalid.");
  }
  if (!Array.isArray(value.pages) || value.pages.length === 0) {
    throw new Error("The project must contain at least one page.");
  }
  for (const [index, page] of value.pages.entries()) {
    if (!isRecord(page)) throw new Error(`Page ${index + 1} is invalid.`);
    if (!Array.isArray(page.elements)) throw new Error(`Page ${index + 1} has an invalid elements list.`);
    if (!Number.isFinite(Number(page.width)) || Number(page.width) <= 0) {
      throw new Error(`Page ${index + 1} has an invalid width.`);
    }
    if (!Number.isFinite(Number(page.height)) || Number(page.height) <= 0) {
      throw new Error(`Page ${index + 1} has an invalid height.`);
    }
  }
  if (typeof value.activePageId !== "string" || !value.activePageId) {
    throw new Error("The active page reference is missing.");
  }
}

export function serializePublisherProject(project: PublisherProject): string {
  return JSON.stringify(
    {
      format: YAPOSAN_PROJECT_FORMAT,
      formatVersion: YAPOSAN_PROJECT_FORMAT_VERSION,
      project,
    },
    null,
    2,
  );
}

export function parsePublisherProject(contents: string): PublisherProject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!isRecord(parsed)) throw new Error("This is not a valid Yaposan project file.");
  if (parsed.format !== YAPOSAN_PROJECT_FORMAT) {
    throw new Error("Unsupported file format. Select a .yaposan project exported by Yaposan Publisher.");
  }
  if (!Number.isInteger(parsed.formatVersion)) {
    throw new Error("The project file version is missing or invalid.");
  }
  if (Number(parsed.formatVersion) > YAPOSAN_PROJECT_FORMAT_VERSION) {
    throw new Error(
      `This project uses file version ${String(parsed.formatVersion)}. Update Yaposan Publisher before opening it.`,
    );
  }
  if (Number(parsed.formatVersion) < 1) {
    throw new Error("This project file version is not supported.");
  }

  const envelope = parsed as ProjectEnvelope;
  assertValidProjectShape(envelope.project);
  const normalized = normalizePublisherProject(envelope.project);
  if (!normalized.pages.some((page) => page.id === normalized.activePageId)) {
    throw new Error("The project refers to an active page that does not exist.");
  }
  return normalized;
}

export async function exportPublisherProjectFile(project: PublisherProject): Promise<void> {
  const filename = `${safeFileName(project.name)}${YAPOSAN_PROJECT_EXTENSION}`;
  const contents = serializePublisherProject(project);
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const blob = new Blob([contents], { type: YAPOSAN_PROJECT_MIME });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  }
  const file = new ExpoFile(Paths.cache, filename);
  file.create({ overwrite: true, intermediates: true });
  file.write(contents);
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType: YAPOSAN_PROJECT_MIME, dialogTitle: `Export ${filename}` });
}

export async function importPublisherProjectFile(): Promise<PublisherProject | null> {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = `${YAPOSAN_PROJECT_EXTENSION},${YAPOSAN_PROJECT_MIME}`;
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => {
          try {
            resolve(parsePublisherProject(String(reader.result ?? "")));
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error("Unable to read the selected project file."));
        reader.readAsText(file);
      };
      input.click();
    });
  }

  const result = await DocumentPicker.getDocumentAsync({
    type: [YAPOSAN_PROJECT_MIME, "application/octet-stream", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0];
  if (asset.name && !asset.name.toLowerCase().endsWith(YAPOSAN_PROJECT_EXTENSION)) {
    throw new Error("Select a .yaposan project file.");
  }
  const file = new ExpoFile(asset.uri);
  return parsePublisherProject(await file.text());
}
