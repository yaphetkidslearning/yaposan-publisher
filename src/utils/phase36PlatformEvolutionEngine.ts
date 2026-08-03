export type Phase36Module = { id: string; title: string; description: string; features: string[] };
export type EvolutionStatus = "planned" | "active" | "at-risk" | "complete";
export type EvolutionObjective = { id: string; moduleId: string; title: string; owner: string; status: EvolutionStatus; progress: number; evidence?: string; updatedAt: string };
export type Experiment = { id: string; name: string; hypothesis: string; audience: string; status: "draft" | "running" | "paused" | "finished"; conversionRate: number; createdAt: string };

export const PHASE36_MODULES: Phase36Module[] = [
  { id: "36.0", title: "Post-Launch Operations", description: "A unified operating model for service ownership, launch follow-through and daily platform control.", features: ["Service ownership", "Daily health review", "Operational scorecards", "Escalation matrix", "Runbook registry"] },
  { id: "36.1", title: "Reliability Engineering", description: "Reliability targets, error budgets, dependency health and resilient service controls.", features: ["SLO registry", "Error budgets", "Dependency health", "Circuit-breaker policy", "Chaos drills"] },
  { id: "36.2", title: "Product Analytics", description: "Privacy-aware product signals that explain adoption, activation, retention and feature value.", features: ["Event taxonomy", "Activation funnels", "Retention cohorts", "Feature adoption", "Workspace analytics"] },
  { id: "36.3", title: "Experimentation Platform", description: "Controlled product experiments with hypotheses, audiences, guardrails and measurable outcomes.", features: ["A/B experiments", "Audience cohorts", "Success metrics", "Guardrail metrics", "Experiment history"] },
  { id: "36.4", title: "Customer Success Intelligence", description: "Account health, onboarding progress, renewal risk and customer value visibility.", features: ["Account health", "Onboarding milestones", "Adoption scoring", "Renewal risk", "Success plans"] },
  { id: "36.5", title: "FinOps & Cost Optimization", description: "Cloud, AI, render and storage cost governance tied to plans, usage and margins.", features: ["Cost allocation", "AI cost controls", "Render spend", "Storage optimization", "Budget alerts"] },
  { id: "36.6", title: "Data Quality & Governance", description: "Data contracts, lineage, validation, retention and trusted reporting controls.", features: ["Data contracts", "Lineage registry", "Quality checks", "Retention enforcement", "Trusted metrics"] },
  { id: "36.7", title: "Trust & Safety Operations", description: "Policy enforcement, abuse review, reporting, appeals and marketplace integrity.", features: ["Content reports", "Abuse review", "Appeals workflow", "Marketplace trust", "Policy evidence"] },
  { id: "36.8", title: "AI Quality & Evaluation", description: "Prompt, model and workflow evaluation with safety, quality, latency and cost benchmarks.", features: ["Evaluation suites", "Prompt regression", "Model comparison", "Safety checks", "Latency benchmarks"] },
  { id: "36.9", title: "Performance at Scale", description: "Capacity planning, load validation, queue tuning and large-project performance controls.", features: ["Capacity models", "Load testing", "Queue tuning", "Large-file benchmarks", "Regional performance"] },
  { id: "36.10", title: "Growth & Lifecycle Automation", description: "Responsible onboarding, education, re-engagement and plan-growth workflows.", features: ["Lifecycle journeys", "Onboarding automation", "Education campaigns", "Re-engagement", "Upgrade eligibility"] },
  { id: "36.11", title: "Continuous Delivery & Maintenance", description: "Dependency health, deprecation plans, release trains and long-term maintenance controls.", features: ["Release trains", "Dependency health", "Deprecation registry", "Maintenance windows", "Upgrade planning"] },
  { id: "36.12", title: "Platform Evolution Certification", description: "Cross-platform evidence that Yaposan can operate, learn and improve continuously after launch.", features: ["Operational review", "Reliability sign-off", "Analytics validation", "AI quality sign-off", "Evolution certification"] },
];

export const DEFAULT_EVOLUTION_OBJECTIVES: EvolutionObjective[] = PHASE36_MODULES.map((module) => ({
  id: `objective-${module.id}`,
  moduleId: module.id,
  title: `${module.title} production objective`,
  owner: module.id === "36.12" ? "Platform Council" : "Service Owner",
  status: "planned",
  progress: 0,
  updatedAt: new Date(0).toISOString(),
}));

export function updateObjective(objective: EvolutionObjective, status: EvolutionStatus, progress?: number, evidence?: string): EvolutionObjective {
  const nextProgress = Math.max(0, Math.min(100, progress ?? (status === "complete" ? 100 : objective.progress)));
  return { ...objective, status, progress: nextProgress, evidence: evidence ?? objective.evidence, updatedAt: new Date().toISOString() };
}

export function evolutionScore(objectives: EvolutionObjective[]): number {
  if (!objectives.length) return 0;
  return Math.round(objectives.reduce((sum, objective) => sum + objective.progress, 0) / objectives.length);
}

export function createExperiment(name: string, hypothesis: string, audience = "All eligible users"): Experiment {
  return { id: `experiment-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name, hypothesis, audience, status: "draft", conversionRate: 0, createdAt: new Date().toISOString() };
}

export function evaluateServiceLevel(successful: number, total: number, target = 99.9): { availability: number; target: number; met: boolean } {
  const availability = total <= 0 ? 100 : Number(((successful / total) * 100).toFixed(3));
  return { availability, target, met: availability >= target };
}
