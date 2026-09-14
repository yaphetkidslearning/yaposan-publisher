import type { PublisherTemplate } from "./types";

export interface TemplateVersionEntry {
  version: number;
  templateId: string;
  createdAt: string;
  note: string;
  snapshot: PublisherTemplate;
}

export interface TemplateManagerState {
  active: PublisherTemplate[];
  archived: PublisherTemplate[];
  versions: TemplateVersionEntry[];
}

export const createTemplateManagerState = (templates: PublisherTemplate[] = []): TemplateManagerState => ({
  active: [...templates],
  archived: [],
  versions: [],
});

const cloneTemplate = (template: PublisherTemplate): PublisherTemplate =>
  JSON.parse(JSON.stringify(template)) as PublisherTemplate;

export const duplicateManagedTemplate = (
  state: TemplateManagerState,
  templateId: string,
  newId: string,
  newName?: string,
): TemplateManagerState => {
  const source = state.active.find((template) => template.metadata.id === templateId);
  if (!source) return state;
  const duplicate = cloneTemplate(source);
  duplicate.metadata.id = newId;
  duplicate.metadata.name = newName ?? `${source.metadata.name} Copy`;
  duplicate.metadata.updatedAt = new Date().toISOString();
  return { ...state, active: [duplicate, ...state.active] };
};

export const renameManagedTemplate = (
  state: TemplateManagerState,
  templateId: string,
  name: string,
): TemplateManagerState => ({
  ...state,
  active: state.active.map((template) =>
    template.metadata.id === templateId
      ? { ...template, metadata: { ...template.metadata, name, updatedAt: new Date().toISOString() } }
      : template,
  ),
});

export const archiveManagedTemplate = (
  state: TemplateManagerState,
  templateId: string,
): TemplateManagerState => {
  const template = state.active.find((item) => item.metadata.id === templateId);
  if (!template) return state;
  return {
    ...state,
    active: state.active.filter((item) => item.metadata.id !== templateId),
    archived: [template, ...state.archived],
  };
};

export const restoreManagedTemplate = (
  state: TemplateManagerState,
  templateId: string,
): TemplateManagerState => {
  const template = state.archived.find((item) => item.metadata.id === templateId);
  if (!template) return state;
  return {
    ...state,
    archived: state.archived.filter((item) => item.metadata.id !== templateId),
    active: [template, ...state.active],
  };
};

export const createTemplateVersion = (
  state: TemplateManagerState,
  templateId: string,
  note: string,
): TemplateManagerState => {
  const template = state.active.find((item) => item.metadata.id === templateId);
  if (!template) return state;
  const latestVersion = state.versions
    .filter((entry) => entry.templateId === templateId)
    .reduce((max, entry) => Math.max(max, entry.version), 0);
  return {
    ...state,
    versions: [
      {
        version: latestVersion + 1,
        templateId,
        createdAt: new Date().toISOString(),
        note,
        snapshot: cloneTemplate(template),
      },
      ...state.versions,
    ],
  };
};

export const exportTemplateCollection = (state: TemplateManagerState): string =>
  JSON.stringify({ schema: "yaposan-template-collection", version: 1, templates: state.active }, null, 2);

export const importTemplateCollection = (json: string): PublisherTemplate[] => {
  const parsed = JSON.parse(json) as { schema?: string; templates?: PublisherTemplate[] };
  if (parsed.schema !== "yaposan-template-collection" || !Array.isArray(parsed.templates)) {
    throw new Error("Invalid Yaposan template collection.");
  }
  return parsed.templates;
};
