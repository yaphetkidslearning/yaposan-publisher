export type WorkflowStatus = "draft" | "active" | "paused" | "completed" | "failed";
export type WorkflowStepType = "trigger" | "condition" | "action" | "approval" | "delay" | "export";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type WorkflowStep = {
  id: string;
  type: WorkflowStepType;
  title: string;
  description: string;
  enabled: boolean;
};

export type DocumentWorkflow = {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  trigger: string;
  steps: WorkflowStep[];
  runs: number;
  lastRun?: string;
};

export type AutomationJob = {
  id: string;
  workflowId: string;
  title: string;
  status: JobStatus;
  progress: number;
  createdAt: string;
  message?: string;
};

export type ApprovalRequest = {
  id: string;
  documentName: string;
  requester: string;
  reviewer: string;
  status: "pending" | "approved" | "changes-requested";
  dueDate: string;
};

export const PHASE53_CAPABILITIES = [
  { id: "designer", title: "Visual Workflow Designer", description: "Build document workflows from triggers, conditions, actions, approvals, delays, and export steps.", status: "Ready" as const },
  { id: "batch", title: "Batch Processing", description: "Queue multi-document operations with progress, retry, cancellation, and error reporting.", status: "Ready" as const },
  { id: "approval", title: "Approval Routing", description: "Route documents through draft, review, approved, published, and archived states.", status: "Ready" as const },
  { id: "naming", title: "Dynamic Naming Rules", description: "Generate filenames from project, customer, date, locale, revision, and channel metadata.", status: "Ready" as const },
  { id: "delivery", title: "Automated Delivery", description: "Prepare PDF, image, archive, social, print, and client-delivery packages.", status: "Ready" as const },
  { id: "scheduling", title: "Scheduled Automation", description: "Persist schedule definitions and next-run metadata for local or server execution.", status: "Ready" as const },
  { id: "connectors", title: "External Workflow Connectors", description: "Email delivery, cloud storage, CRM, webhooks, and remote publishing require configured services.", status: "External" as const },
];

export const DEFAULT_WORKFLOWS: DocumentWorkflow[] = [
  {
    id: "marketing-package",
    name: "Marketing Campaign Package",
    description: "Approve a campaign and export web, social, and print deliverables.",
    status: "active",
    trigger: "When project is marked ready",
    runs: 18,
    lastRun: "Today, 9:40 AM",
    steps: [
      { id: "trigger", type: "trigger", title: "Project Ready", description: "Start when the project enters Ready status.", enabled: true },
      { id: "audit", type: "condition", title: "Quality Check", description: "Continue only when the design audit has no blocking issues.", enabled: true },
      { id: "approval", type: "approval", title: "Marketing Approval", description: "Request approval from the assigned campaign owner.", enabled: true },
      { id: "export", type: "export", title: "Create Deliverables", description: "Export print PDF, web PNG, and social presets.", enabled: true },
    ],
  },
  {
    id: "client-delivery",
    name: "Client Delivery Package",
    description: "Package final files, license notes, fonts, and a delivery manifest.",
    status: "draft",
    trigger: "Manual run",
    runs: 4,
    steps: [
      { id: "collect", type: "action", title: "Collect Assets", description: "Gather linked images, fonts, and project files.", enabled: true },
      { id: "archive", type: "action", title: "Create Archive", description: "Compress the package into a ZIP archive.", enabled: true },
      { id: "manifest", type: "action", title: "Generate Manifest", description: "Create a human-readable delivery manifest.", enabled: true },
    ],
  },
];

export const DEFAULT_JOBS: AutomationJob[] = [
  { id: "job-1", workflowId: "marketing-package", title: "Summer campaign deliverables", status: "completed", progress: 100, createdAt: "Today, 9:40 AM" },
  { id: "job-2", workflowId: "marketing-package", title: "Store opening social package", status: "running", progress: 68, createdAt: "Today, 10:15 AM" },
  { id: "job-3", workflowId: "client-delivery", title: "Client brochure handoff", status: "queued", progress: 0, createdAt: "Today, 10:24 AM" },
];

export const DEFAULT_APPROVALS: ApprovalRequest[] = [
  { id: "approval-1", documentName: "Fall Campaign Brochure", requester: "Creative Team", reviewer: "Marketing Director", status: "pending", dueDate: "Tomorrow" },
  { id: "approval-2", documentName: "Annual Report", requester: "Communications", reviewer: "Executive Review", status: "approved", dueDate: "Completed" },
];

export function workflowCompletion(workflow: DocumentWorkflow): number {
  if (!workflow.steps.length) return 0;
  const enabled = workflow.steps.filter((step) => step.enabled).length;
  return Math.round((enabled / workflow.steps.length) * 100);
}

export function updateWorkflowStatus(workflows: DocumentWorkflow[], workflowId: string, status: WorkflowStatus): DocumentWorkflow[] {
  return workflows.map((workflow) => workflow.id === workflowId ? { ...workflow, status } : workflow);
}

export function updateJobProgress(jobs: AutomationJob[], jobId: string, progress: number): AutomationJob[] {
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress)));
  return jobs.map((job) => job.id === jobId ? { ...job, progress: safeProgress, status: safeProgress >= 100 ? "completed" : safeProgress > 0 ? "running" : job.status } : job);
}

export function automationHealthScore(workflows: DocumentWorkflow[], jobs: AutomationJob[]): number {
  const active = workflows.filter((workflow) => workflow.status === "active");
  const workflowScore = active.length ? active.reduce((sum, workflow) => sum + workflowCompletion(workflow), 0) / active.length : 0;
  const finished = jobs.filter((job) => job.status === "completed").length;
  const failed = jobs.filter((job) => job.status === "failed").length;
  const jobScore = jobs.length ? Math.max(0, ((finished - failed) / jobs.length) * 100) : 100;
  return Math.round((workflowScore * 0.7) + (jobScore * 0.3));
}

export function automationBlockers(workflows: DocumentWorkflow[], jobs: AutomationJob[], approvals: ApprovalRequest[]): string[] {
  const blockers: string[] = [];
  if (!workflows.some((workflow) => workflow.status === "active")) blockers.push("Activate at least one workflow.");
  const failedJobs = jobs.filter((job) => job.status === "failed");
  if (failedJobs.length) blockers.push(`${failedJobs.length} automation job${failedJobs.length === 1 ? " has" : "s have"} failed.`);
  const pendingApprovals = approvals.filter((approval) => approval.status === "pending");
  if (pendingApprovals.length) blockers.push(`${pendingApprovals.length} approval request${pendingApprovals.length === 1 ? " is" : "s are"} pending.`);
  return blockers;
}

export const PHASE53_DOCUMENT_AUTOMATION = {
  phase: 53,
  label: "Professional Document Automation & Workflow Platform",
  summary: "Visual workflows, batch jobs, approval routing, dynamic naming, scheduled processing, and evidence-based automation monitoring.",
  ready: PHASE53_CAPABILITIES.filter((item) => item.status === "Ready").length,
  total: PHASE53_CAPABILITIES.length,
} as const;
