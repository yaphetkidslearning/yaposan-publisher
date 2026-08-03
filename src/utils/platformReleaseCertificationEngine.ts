import type { PublisherProject } from "../types/publisher";
import { certifyPhase23, evaluateReleaseReadiness, getPhase23State, hashProject } from "./collaborationVersionControlEngine";

export type ReleaseCheckStatus = "passed" | "warning" | "blocked";
export type ReleaseCheck = { id: string; label: string; status: ReleaseCheckStatus; detail: string };
export type PlatformReleaseCertification = {
  schema: "yaposan.phase24.release-certification";
  version: 1;
  generatedAt: number;
  projectId: string;
  projectName: string;
  projectHash: string;
  score: number;
  passed: boolean;
  checks: ReleaseCheck[];
  summary: { pages: number; elements: number; versions: number; branches: number; approvals: number; promotions: number };
};

const check = (id: string, label: string, ok: boolean, detail: string, warning = false): ReleaseCheck => ({
  id,
  label,
  status: ok ? "passed" : warning ? "warning" : "blocked",
  detail,
});

export function certifyPlatformRelease(project: PublisherProject): PlatformReleaseCertification {
  const state = getPhase23State(project);
  const phase23 = certifyPhase23(project);
  const activeBranch = state.branches.find((branch) => branch.id === state.activeBranchId && !branch.archivedAt);
  const productionBranch = state.branches.find((branch) => branch.channel === "production" && !branch.archivedAt);
  const productionReadiness = activeBranch ? evaluateReleaseReadiness(project, activeBranch.id, "production") : null;
  const elementCount = project.pages.reduce((total, page) => total + page.elements.length, 0);
  const checks: ReleaseCheck[] = [
    check("project-pages", "Project content", project.pages.length > 0, `${project.pages.length} page(s), ${elementCount} element(s)`),
    check("active-page", "Active page integrity", project.pages.some((page) => page.id === project.activePageId), "Active page exists in the document"),
    check("autosave", "Recovery protection", project.autoSave !== false, project.autoSave === false ? "Autosave is disabled" : "Autosave and recovery are enabled", true),
    check("phase22", "Digital publishing runtime", project.phase22Version === "22.7", project.phase22Version ? `Runtime version ${project.phase22Version}` : "Digital publishing runtime has not been finalized"),
    check("phase23", "Version-control certification", phase23.passed, phase23.passed ? `Certified at ${phase23.score}%` : phase23.issues.join("; ")),
    check("immutable-version", "Immutable release snapshot", state.versions.length > 0, `${state.versions.length} immutable version(s)`),
    check("active-branch", "Active release branch", Boolean(activeBranch), activeBranch ? `${activeBranch.name} · ${activeBranch.channel}` : "No active branch is available"),
    check("production-promotion", "Production promotion", Boolean(productionBranch || state.promotionHistory.some((item) => item.toChannel === "production")), productionBranch ? `${productionBranch.name} is in production` : "No branch has been promoted to production", true),
    check("production-readiness", "Production readiness", Boolean(productionReadiness?.ready || productionBranch), productionReadiness?.ready ? `Ready at ${productionReadiness.score}%` : productionBranch ? "Production branch is present" : (productionReadiness?.blockers.join("; ") || "Readiness could not be evaluated"), true),
    check("project-hash", "Project integrity hash", Boolean(hashProject(project)), `SHA-compatible project fingerprint ${hashProject(project)}`),
  ];
  const blocked = checks.filter((item) => item.status === "blocked").length;
  const warnings = checks.filter((item) => item.status === "warning").length;
  const score = Math.max(0, Math.round(100 - blocked * 15 - warnings * 4));
  return {
    schema: "yaposan.phase24.release-certification",
    version: 1,
    generatedAt: Date.now(),
    projectId: project.id,
    projectName: project.name,
    projectHash: hashProject(project),
    score,
    passed: blocked === 0,
    checks,
    summary: {
      pages: project.pages.length,
      elements: elementCount,
      versions: state.versions.length,
      branches: state.branches.filter((branch) => !branch.archivedAt).length,
      approvals: state.approvals.length,
      promotions: state.promotionHistory.length,
    },
  };
}

export function exportPlatformReleaseCertification(project: PublisherProject): string {
  return JSON.stringify(certifyPlatformRelease(project), null, 2);
}
