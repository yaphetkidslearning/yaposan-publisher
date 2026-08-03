export type AiWritingAction =
  | "write" | "rewrite" | "expand" | "shorten" | "summarize" | "grammar"
  | "professional" | "friendly" | "continue" | "headline" | "caption"
  | "bullets" | "cta" | "translate" | "marketing" | "social";

export type AiPromptCategory = "Business" | "Marketing" | "Social Media" | "Education" | "Church" | "Creative";

export type AiPromptRecord = {
  id: string;
  action: AiWritingAction;
  prompt: string;
  sourceText: string;
  result: string;
  createdAt: number;
  favorite?: boolean;
  targetLanguage?: string;
};

export type AiPresetPrompt = {
  id: string;
  label: string;
  action: AiWritingAction;
  prompt: string;
  category: AiPromptCategory;
  favorite?: boolean;
  custom?: boolean;
};

export type DocumentIntelligenceKind = "duplicate" | "empty" | "overflow" | "font" | "color" | "layout" | "accessibility";
export type DocumentIntelligenceIssue = {
  id: string;
  kind: DocumentIntelligenceKind;
  severity: "info" | "warning" | "error";
  pageId: string;
  pageName: string;
  elementId?: string;
  title: string;
  detail: string;
  suggestion: string;
};

export type MergeFieldKind = "variable" | "record" | "dynamic";
export type MergeFieldDefinition = { key: string; label: string; kind: MergeFieldKind };
export type MergeDataRecord = { id: string; name: string; values: Record<string, string> };
export type ProjectMergeData = {
  variables: Record<string, string>;
  records: MergeDataRecord[];
  activeRecordId?: string;
};
