import AsyncStorage from "@react-native-async-storage/async-storage";
import type { EditableProjectDraft } from "./creativeCreationEngine";

const INDEX_KEY = "yaposan.creation-projects.91.12.index";
const ITEM_PREFIX = "yaposan.creation-projects.91.12.";

export type StoredCreationProject = Omit<EditableProjectDraft, "schemaVersion" | "metadata"> & {
  schemaVersion: "91.12";
  metadata: Omit<EditableProjectDraft["metadata"], "phase"> & { phase: "91.12" };
  id: string;
  updatedAt: string;
  generated?: Record<string, unknown>;
  assets?: Array<{
    id: string;
    kind: "image" | "video" | "audio" | "file";
    uri?: string;
    mimeType?: string;
    provider?: string;
    metadata?: Record<string, unknown>;
  }>;
};

export async function saveCreationProject(project: EditableProjectDraft & { generated?: Record<string, unknown> }): Promise<StoredCreationProject> {
  const now = new Date().toISOString();
  const stored: StoredCreationProject = {
    ...project,
    schemaVersion: "91.12",
    id: project.creationPlanId,
    updatedAt: now,
    assets: extractGeneratedAssets(project.generated),
    metadata: { ...project.metadata, phase: "91.12" },
  };
  await AsyncStorage.setItem(`${ITEM_PREFIX}${stored.id}`, JSON.stringify(stored));
  const existing = await listCreationProjectIds();
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify([stored.id, ...existing.filter((id) => id !== stored.id)].slice(0, 100)));
  return stored;
}

export async function loadCreationProject(id?: string | null): Promise<StoredCreationProject | null> {
  if (!id) return null;
  try {
    const raw = await AsyncStorage.getItem(`${ITEM_PREFIX}${id}`);
    return raw ? JSON.parse(raw) as StoredCreationProject : null;
  } catch {
    return null;
  }
}

export async function listCreationProjectIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function patchCreationProject(id: string, patch: Partial<StoredCreationProject>): Promise<StoredCreationProject | null> {
  const current = await loadCreationProject(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await AsyncStorage.setItem(`${ITEM_PREFIX}${id}`, JSON.stringify(next));
  return next;
}

function extractGeneratedAssets(generated?: Record<string, unknown>): StoredCreationProject["assets"] {
  if (!generated) return [];
  const assets: NonNullable<StoredCreationProject["assets"]> = [];
  for (const kind of ["image", "video", "audio"] as const) {
    const value = generated[kind];
    if (!value) continue;
    if (typeof value === "string") {
      const uri = /^https?:|^data:|^file:|^blob:/.test(value) ? value : undefined;
      assets.push({ id: `${kind}-${assets.length + 1}`, kind, uri, metadata: uri ? undefined : { output: value } });
      continue;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const uri = [record.url, record.uri, record.outputUrl, record.assetUrl].find((v): v is string => typeof v === "string");
      assets.push({ id: `${kind}-${assets.length + 1}`, kind, uri, mimeType: typeof record.mimeType === "string" ? record.mimeType : undefined, provider: typeof record.provider === "string" ? record.provider : undefined, metadata: record });
    }
  }
  return assets;
}
