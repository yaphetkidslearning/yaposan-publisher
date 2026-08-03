export type AutomationTrigger = "manual" | "project-opened" | "project-saved" | "asset-added" | "review-approved" | "schedule";
export type AutomationActionType = "preflight" | "export-pdf" | "package-assets" | "create-backup" | "notify-team" | "publish-channel" | "apply-template";
export type AutomationStatus = "active" | "paused" | "draft";

export type AutomationCondition = { field: string; operator: "equals" | "not-equals" | "contains" | "greater-than" | "less-than"; value: string | number | boolean };
export type AutomationAction = { id: string; type: AutomationActionType; label: string; configuration: Record<string, string | number | boolean>; continueOnError: boolean };
export type AutomationRule = {
  id: string; name: string; description: string; trigger: AutomationTrigger; status: AutomationStatus;
  conditions: AutomationCondition[]; actions: AutomationAction[]; runCount: number; lastRunAt?: number;
};
export type AutomationRun = {
  id: string; ruleId: string; startedAt: number; completedAt: number; status: "completed" | "failed" | "partial";
  steps: { actionId: string; label: string; status: "completed" | "failed" | "skipped"; message: string }[];
};
export type AutomationWorkspace = { rules: AutomationRule[]; runs: AutomationRun[]; concurrencyLimit: number; retainRuns: number; safeMode: boolean };
export type AutomationAudit = { score: number; issues: { id: string; severity: "error" | "warning" | "info"; message: string; fix: string }[] };

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const DEFAULT_AUTOMATION_WORKSPACE: AutomationWorkspace = {
  concurrencyLimit: 2,
  retainRuns: 100,
  safeMode: true,
  runs: [],
  rules: [
    {
      id: "rule-print-ready", name: "Print-ready release", description: "Preflight, export PDF/X, package assets, and notify reviewers after approval.",
      trigger: "review-approved", status: "active", conditions: [], runCount: 0,
      actions: [
        { id: "action-preflight", type: "preflight", label: "Run production preflight", configuration: { profile: "print" }, continueOnError: false },
        { id: "action-pdf", type: "export-pdf", label: "Export PDF/X-4", configuration: { standard: "PDF/X-4", bleed: true }, continueOnError: false },
        { id: "action-package", type: "package-assets", label: "Package linked assets", configuration: { includeFonts: true }, continueOnError: true },
        { id: "action-notify", type: "notify-team", label: "Notify production team", configuration: { channel: "workspace" }, continueOnError: true },
      ],
    },
    {
      id: "rule-safe-backup", name: "Safe project backup", description: "Create a versioned project backup whenever the document is saved.",
      trigger: "project-saved", status: "active", conditions: [], runCount: 0,
      actions: [{ id: "action-backup", type: "create-backup", label: "Create versioned backup", configuration: { keep: 20 }, continueOnError: false }],
    },
  ],
};

export function createAutomationRule(input: { name: string; description?: string; trigger: AutomationTrigger }): AutomationRule {
  return { id: uid("rule"), name: input.name.trim() || "Untitled automation", description: input.description?.trim() || "", trigger: input.trigger, status: "draft", conditions: [], actions: [], runCount: 0 };
}

export function addAutomationRule(workspace: AutomationWorkspace, rule: AutomationRule): AutomationWorkspace {
  return { ...workspace, rules: [rule, ...workspace.rules] };
}

export function updateAutomationRule(workspace: AutomationWorkspace, ruleId: string, updates: Partial<AutomationRule>): AutomationWorkspace {
  return { ...workspace, rules: workspace.rules.map((rule) => rule.id === ruleId ? { ...rule, ...updates, id: rule.id } : rule) };
}

export function addAutomationAction(workspace: AutomationWorkspace, ruleId: string, action: Omit<AutomationAction, "id">): AutomationWorkspace {
  return updateAutomationRule(workspace, ruleId, { actions: workspace.rules.find((rule) => rule.id === ruleId)?.actions.concat({ ...action, id: uid("action") }) ?? [] });
}

export function evaluateCondition(condition: AutomationCondition, context: Record<string, unknown>): boolean {
  const actual = context[condition.field];
  if (condition.operator === "equals") return actual === condition.value;
  if (condition.operator === "not-equals") return actual !== condition.value;
  if (condition.operator === "contains") return String(actual ?? "").toLowerCase().includes(String(condition.value).toLowerCase());
  if (condition.operator === "greater-than") return Number(actual) > Number(condition.value);
  return Number(actual) < Number(condition.value);
}

export function executeAutomationRule(workspace: AutomationWorkspace, ruleId: string, context: Record<string, unknown> = {}): AutomationWorkspace {
  const rule = workspace.rules.find((candidate) => candidate.id === ruleId);
  if (!rule) throw new Error("Automation rule not found.");
  if (rule.status === "paused") throw new Error("Paused automations cannot run.");
  const startedAt = Date.now();
  const conditionsPass = rule.conditions.every((condition) => evaluateCondition(condition, context));
  const steps = conditionsPass
    ? rule.actions.map((action) => ({ actionId: action.id, label: action.label, status: "completed" as const, message: `${action.label} completed by the local automation adapter.` }))
    : rule.actions.map((action) => ({ actionId: action.id, label: action.label, status: "skipped" as const, message: "Rule conditions were not met." }));
  const run: AutomationRun = { id: uid("run"), ruleId, startedAt, completedAt: Date.now(), status: conditionsPass ? "completed" : "partial", steps };
  return {
    ...workspace,
    rules: workspace.rules.map((candidate) => candidate.id === ruleId ? { ...candidate, runCount: candidate.runCount + 1, lastRunAt: run.completedAt } : candidate),
    runs: [run, ...workspace.runs].slice(0, workspace.retainRuns),
  };
}

export function runTrigger(workspace: AutomationWorkspace, trigger: AutomationTrigger, context: Record<string, unknown> = {}): AutomationWorkspace {
  return workspace.rules.filter((rule) => rule.trigger === trigger && rule.status === "active").reduce((current, rule) => executeAutomationRule(current, rule.id, context), workspace);
}

export function auditAutomationWorkspace(workspace: AutomationWorkspace): AutomationAudit {
  const issues: AutomationAudit["issues"] = [];
  const active = workspace.rules.filter((rule) => rule.status === "active");
  if (!active.length) issues.push({ id: "no-active", severity: "warning", message: "No active automation rules are configured.", fix: "Activate at least one reviewed rule." });
  workspace.rules.forEach((rule) => {
    if (!rule.actions.length) issues.push({ id: `empty-${rule.id}`, severity: "error", message: `${rule.name} has no actions.`, fix: "Add one or more workflow actions." });
    if (rule.trigger === "schedule" && !rule.conditions.some((condition) => condition.field === "schedule")) issues.push({ id: `schedule-${rule.id}`, severity: "warning", message: `${rule.name} has no schedule definition.`, fix: "Add a schedule condition or change its trigger." });
    if (rule.actions.some((action) => action.type === "publish-channel") && workspace.safeMode) issues.push({ id: `publish-${rule.id}`, severity: "info", message: `${rule.name} contains a publishing action while Safe Mode is enabled.`, fix: "Require approval before external publishing or disable Safe Mode intentionally." });
  });
  if (workspace.concurrencyLimit > 5) issues.push({ id: "concurrency", severity: "warning", message: "High automation concurrency may overload export services.", fix: "Use five or fewer simultaneous jobs." });
  const penalty = issues.reduce((sum, issue) => sum + (issue.severity === "error" ? 25 : issue.severity === "warning" ? 10 : 3), 0);
  return { score: Math.max(0, 100 - penalty), issues };
}
