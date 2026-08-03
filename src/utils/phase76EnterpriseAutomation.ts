import { createHash, createHmac, randomUUID } from 'node:crypto';

export type WorkflowTrigger =
  | { type: 'manual' }
  | { type: 'schedule'; cron: string; timezone: string }
  | { type: 'webhook'; secretId: string }
  | { type: 'event'; event: 'project.created' | 'project.updated' | 'asset.uploaded' | 'export.completed' | 'approval.requested' };

export type WorkflowCondition = {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
  value?: unknown;
};

export type WorkflowAction = {
  id: string;
  type:
    | 'ai.generateText'
    | 'ai.translate'
    | 'ai.generateImage'
    | 'project.create'
    | 'project.populateTemplate'
    | 'asset.optimize'
    | 'export.render'
    | 'publish.channel'
    | 'approval.request'
    | 'notification.send'
    | 'connector.invoke'
    | 'webhook.send';
  input: Record<string, unknown>;
  connectorId?: string;
  retry?: { attempts: number; backoffSeconds: number };
  timeoutSeconds?: number;
};

export type WorkflowDefinition = {
  id: string;
  organizationId: string;
  name: string;
  enabled: boolean;
  trigger: WorkflowTrigger;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  concurrency: number;
  monthlyRunLimit: number;
  createdBy: string;
  version: number;
};

export type ConnectorDefinition = {
  id: string;
  provider: 'microsoft365' | 'google-workspace' | 'sharepoint' | 'onedrive' | 'dropbox' | 'box' | 'slack' | 'teams' | 'zapier' | 'make' | 'custom';
  enabled: boolean;
  operations: string[];
  auth: 'oauth2' | 'api-key' | 'webhook-secret';
};

export type ExecutionStep = {
  actionId: string;
  actionType: WorkflowAction['type'];
  status: 'queued';
  connectorId?: string;
  maxAttempts: number;
  timeoutSeconds: number;
  inputChecksum: string;
};

export type WorkflowExecutionPlan = {
  executionId: string;
  workflowId: string;
  workflowVersion: number;
  organizationId: string;
  status: 'queued' | 'waiting-approval';
  createdAt: string;
  steps: ExecutionStep[];
  estimatedAiCredits: number;
  requiresApproval: boolean;
  auditChecksum: string;
};

export type WorkflowUsage = {
  organizationId: string;
  month: string;
  runs: number;
  aiCredits: number;
  failedRuns: number;
  averageDurationMs: number;
};

const stable = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(',')}}`;
};

const sha256 = (value: unknown) => createHash('sha256').update(stable(value)).digest('hex');

export function validateWorkflow(workflow: WorkflowDefinition, connectors: ConnectorDefinition[] = []): string[] {
  const errors: string[] = [];
  if (!workflow.name.trim()) errors.push('Workflow name is required.');
  if (workflow.actions.length === 0) errors.push('At least one action is required.');
  if (workflow.actions.length > 100) errors.push('A workflow cannot contain more than 100 actions.');
  if (!Number.isInteger(workflow.concurrency) || workflow.concurrency < 1 || workflow.concurrency > 50) {
    errors.push('Concurrency must be an integer from 1 to 50.');
  }
  if (!Number.isInteger(workflow.monthlyRunLimit) || workflow.monthlyRunLimit < 1) {
    errors.push('Monthly run limit must be a positive integer.');
  }
  if (workflow.trigger.type === 'schedule' && !/^([*\d,/\-]+\s+){4}[*\d,/\-]+$/.test(workflow.trigger.cron.trim())) {
    errors.push('Scheduled workflows require a valid five-field cron expression.');
  }
  const actionIds = new Set<string>();
  const connectorMap = new Map(connectors.map((connector) => [connector.id, connector]));
  for (const action of workflow.actions) {
    if (!action.id.trim()) errors.push('Every action requires an id.');
    if (actionIds.has(action.id)) errors.push(`Duplicate action id: ${action.id}`);
    actionIds.add(action.id);
    if (action.type === 'connector.invoke') {
      const connector = action.connectorId ? connectorMap.get(action.connectorId) : undefined;
      if (!connector) errors.push(`Connector action ${action.id} references an unknown connector.`);
      else if (!connector.enabled) errors.push(`Connector ${connector.id} is disabled.`);
    }
    if ((action.retry?.attempts ?? 1) < 1 || (action.retry?.attempts ?? 1) > 10) {
      errors.push(`Action ${action.id} retry attempts must be from 1 to 10.`);
    }
    if ((action.timeoutSeconds ?? 60) < 1 || (action.timeoutSeconds ?? 60) > 3600) {
      errors.push(`Action ${action.id} timeout must be from 1 to 3600 seconds.`);
    }
  }
  return errors;
}

export function matchesConditions(context: Record<string, unknown>, conditions: WorkflowCondition[]): boolean {
  const read = (path: string) => path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, context);
  return conditions.every((condition) => {
    const actual = read(condition.field);
    switch (condition.operator) {
      case 'equals': return actual === condition.value;
      case 'notEquals': return actual !== condition.value;
      case 'contains': return Array.isArray(actual) ? actual.includes(condition.value) : String(actual ?? '').includes(String(condition.value ?? ''));
      case 'greaterThan': return Number(actual) > Number(condition.value);
      case 'lessThan': return Number(actual) < Number(condition.value);
      case 'exists': return actual !== undefined && actual !== null;
    }
  });
}

export function estimateAiCredits(actions: WorkflowAction[]): number {
  return actions.reduce((total, action) => {
    if (action.type === 'ai.generateImage') return total + 8;
    if (action.type === 'ai.generateText' || action.type === 'ai.translate') return total + 1;
    if (action.type === 'project.populateTemplate') return total + 2;
    return total;
  }, 0);
}

export function buildExecutionPlan(
  workflow: WorkflowDefinition,
  context: Record<string, unknown>,
  usage: WorkflowUsage,
  connectors: ConnectorDefinition[] = [],
  now = new Date(),
): WorkflowExecutionPlan {
  const errors = validateWorkflow(workflow, connectors);
  if (errors.length) throw new Error(errors.join(' '));
  if (!workflow.enabled) throw new Error('Workflow is disabled.');
  if (!matchesConditions(context, workflow.conditions)) throw new Error('Workflow conditions did not match.');
  if (usage.runs >= workflow.monthlyRunLimit) throw new Error('Monthly workflow run limit reached.');

  const requiresApproval = workflow.actions.some((action) => action.type === 'approval.request');
  const planBase = {
    executionId: randomUUID(),
    workflowId: workflow.id,
    workflowVersion: workflow.version,
    organizationId: workflow.organizationId,
    status: requiresApproval ? 'waiting-approval' as const : 'queued' as const,
    createdAt: now.toISOString(),
    steps: workflow.actions.map((action) => ({
      actionId: action.id,
      actionType: action.type,
      status: 'queued' as const,
      connectorId: action.connectorId,
      maxAttempts: action.retry?.attempts ?? 3,
      timeoutSeconds: action.timeoutSeconds ?? 120,
      inputChecksum: sha256(action.input),
    })),
    estimatedAiCredits: estimateAiCredits(workflow.actions),
    requiresApproval,
  };
  return { ...planBase, auditChecksum: sha256(planBase) };
}

export function signWebhookPayload(payload: unknown, timestamp: number, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${stable(payload)}`).digest('hex');
}

export function verifyWebhookPayload(payload: unknown, timestamp: number, signature: string, secret: string, nowSeconds: number): boolean {
  if (Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = signWebhookPayload(payload, timestamp, secret);
  if (expected.length !== signature.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  return difference === 0;
}

export function summarizeWorkflowAnalytics(usages: WorkflowUsage[]) {
  const runs = usages.reduce((sum, item) => sum + item.runs, 0);
  const failures = usages.reduce((sum, item) => sum + item.failedRuns, 0);
  const aiCredits = usages.reduce((sum, item) => sum + item.aiCredits, 0);
  const weightedDuration = usages.reduce((sum, item) => sum + item.averageDurationMs * item.runs, 0);
  return {
    runs,
    failures,
    successRate: runs === 0 ? 1 : Number(((runs - failures) / runs).toFixed(4)),
    aiCredits,
    averageDurationMs: runs === 0 ? 0 : Math.round(weightedDuration / runs),
  };
}

export function createWorkflow(input: Omit<WorkflowDefinition, 'id' | 'version'>): WorkflowDefinition {
  return { ...input, id: randomUUID(), version: 1 };
}
