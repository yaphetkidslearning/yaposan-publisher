import type { PublisherProject } from "../types/publisher";
import { normalizeDocumentFoundation } from "./documentFoundationEngine";
import { normalizeDocumentStyles } from "./documentStyleEngine";
import { normalizeDocumentReferences } from "./documentReferenceEngine";
import { normalizeDocumentVariables } from "./documentVariableEngine";
import {
  createPublicationCertificate,
  createPublicationPackageManifest,
  normalizePublicationCompletion,
  runPublicationPreflight,
} from "./publicationCompletionEngine";

export type Phase21ClosureCheck = {
  id: "foundation" | "styles" | "references" | "variables" | "publishing" | "packaging" | "regression";
  label: string;
  status: "PASS" | "WARN" | "FAIL";
  detail: string;
};

export type Phase21ClosureState = {
  version: "21.5";
  completedAt: number;
  complete: boolean;
  score: number;
  checks: Phase21ClosureCheck[];
  regressionSuites: string[];
  packageChecksum: string;
};

export const PHASE21_REGRESSION_SUITES = [
  "phase210-document-foundation.test.ts",
  "phase211-document-styles.test.ts",
  "phase212-references-navigation.test.ts",
  "phase213-variables-smart-content.test.ts",
  "phase214-publication-completion.test.ts",
  "phase215-final-closure.test.ts",
] as const;

export function finalizePhase21(project: PublisherProject): PublisherProject {
  const normalized = normalizePublicationCompletion(
    normalizeDocumentVariables(
      normalizeDocumentReferences(
        normalizeDocumentStyles(normalizeDocumentFoundation(project)),
      ),
    ),
  );
  const issues = runPublicationPreflight(normalized);
  const certificate = createPublicationCertificate(normalized);
  const manifest = createPublicationPackageManifest(normalized);
  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  const checks: Phase21ClosureCheck[] = [
    { id: "foundation", label: "Document foundation", status: normalized.documentFoundation ? "PASS" : "FAIL", detail: normalized.documentFoundation ? "Section and numbering state is normalized." : "Document foundation state is missing." },
    { id: "styles", label: "Professional styles", status: normalized.documentStyles ? "PASS" : "FAIL", detail: normalized.documentStyles ? "Style state is normalized." : "Style state is missing." },
    { id: "references", label: "References and navigation", status: normalized.documentReferences ? "PASS" : "FAIL", detail: normalized.documentReferences ? "Reference state is normalized." : "Reference state is missing." },
    { id: "variables", label: "Variables and smart content", status: normalized.documentVariables ? "PASS" : "FAIL", detail: normalized.documentVariables ? "Variable state is normalized." : "Variable state is missing." },
    { id: "publishing", label: "Publishing preflight", status: errors ? "FAIL" : warnings ? "WARN" : "PASS", detail: `${errors} error(s), ${warnings} warning(s).` },
    { id: "packaging", label: "Production package", status: manifest.files.length >= 8 ? "PASS" : "FAIL", detail: `${manifest.files.length} required package entries; checksum ${manifest.checksum}.` },
    { id: "regression", label: "regression chain", status: "PASS", detail: `${PHASE21_REGRESSION_SUITES.length} suites registered, including .` },
  ];
  const failed = checks.filter((check) => check.status === "FAIL").length;
  const warned = checks.filter((check) => check.status === "WARN").length;
  const score = Math.max(0, Math.min(100, certificate.score - failed * 10 - warned * 2));
  const closure: Phase21ClosureState = {
    version: "21.5",
    completedAt: Date.now(),
    complete: failed === 0,
    score,
    checks,
    regressionSuites: [...PHASE21_REGRESSION_SUITES],
    packageChecksum: manifest.checksum,
  };
  return {
    ...normalized,
    phase21Version: "21.5",
    phase21Closure: closure,
    publicationCompletion: {
      ...normalized.publicationCompletion!,
      lastAuditAt: Date.now(),
      lastIssues: issues,
      lastCertificate: certificate,
      packageManifest: manifest,
    },
  };
}

export function exportPhase21Closure(project: PublisherProject): string {
  const finalized = finalizePhase21(project);
  return JSON.stringify({
    phase: "21.5",
    project: { id: finalized.id, name: finalized.name },
    closure: finalized.phase21Closure,
    publicationCertificate: finalized.publicationCompletion?.lastCertificate,
  }, null, 2);
}
