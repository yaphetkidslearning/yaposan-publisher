import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExecutionPlan,
  createWorkflow,
  matchesConditions,
  signWebhookPayload,
  summarizeWorkflowAnalytics,
  validateWorkflow,
  verifyWebhookPayload,
  type ConnectorDefinition,
  type WorkflowUsage,
} from '../src/utils/phase76EnterpriseAutomation.ts';

const connector: ConnectorDefinition = {
  id: 'teams-main', provider: 'teams', enabled: true, operations: ['message.send'], auth: 'oauth2',
};

const workflow = createWorkflow({
  organizationId: 'org-1',
  name: 'Campaign approval and publishing',
  enabled: true,
  trigger: { type: 'event', event: 'project.updated' },
  conditions: [{ field: 'project.status', operator: 'equals', value: 'ready' }],
  actions: [
    { id: 'copy', type: 'ai.generateText', input: { prompt: 'Write campaign copy' } },
    { id: 'approval', type: 'approval.request', input: { role: 'brand-manager' } },
    { id: 'notify', type: 'connector.invoke', connectorId: 'teams-main', input: { operation: 'message.send' } },
    { id: 'export', type: 'export.render', input: { format: 'pdfx4' }, retry: { attempts: 4, backoffSeconds: 15 } },
  ],
  concurrency: 3,
  monthlyRunLimit: 500,
  createdBy: 'user-1',
});

const usage: WorkflowUsage = { organizationId: 'org-1', month: '2026-07', runs: 12, aiCredits: 50, failedRuns: 1, averageDurationMs: 1000 };

test('validates connector-backed workflow definitions', () => {
  assert.deepEqual(validateWorkflow(workflow, [connector]), []);
  assert.match(validateWorkflow({ ...workflow, actions: [{ id: 'x', type: 'connector.invoke', connectorId: 'missing', input: {} }] }, [connector])[0], /unknown connector/);
});

test('evaluates nested workflow conditions', () => {
  assert.equal(matchesConditions({ project: { status: 'ready', pages: 12 } }, workflow.conditions), true);
  assert.equal(matchesConditions({ project: { status: 'draft' } }, workflow.conditions), false);
});

test('builds deterministic, approval-aware execution plans', () => {
  const plan = buildExecutionPlan(workflow, { project: { status: 'ready' } }, usage, [connector], new Date('2026-07-31T22:00:00Z'));
  assert.equal(plan.status, 'waiting-approval');
  assert.equal(plan.steps.length, 4);
  assert.equal(plan.estimatedAiCredits, 1);
  assert.equal(plan.steps[3].maxAttempts, 4);
  assert.equal(plan.auditChecksum.length, 64);
});

test('enforces usage quotas', () => {
  assert.throws(() => buildExecutionPlan(workflow, { project: { status: 'ready' } }, { ...usage, runs: 500 }, [connector]), /run limit/);
});

test('signs webhooks and summarizes analytics', () => {
  const payload = { projectId: 'p1', status: 'approved' };
  const signature = signWebhookPayload(payload, 1000, 'secret');
  assert.equal(verifyWebhookPayload(payload, 1000, signature, 'secret', 1010), true);
  assert.equal(verifyWebhookPayload(payload, 1000, signature, 'secret', 1400), false);
  assert.deepEqual(summarizeWorkflowAnalytics([
    usage,
    { ...usage, runs: 8, failedRuns: 1, aiCredits: 30, averageDurationMs: 2000 },
  ]), { runs: 20, failures: 2, successRate: 0.9, aiCredits: 80, averageDurationMs: 1400 });
});
