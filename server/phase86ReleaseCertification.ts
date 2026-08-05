import { createHash } from "node:crypto";

export type Phase86Evidence = {
  releaseVersion: string;
  gitCommitSha: string;
  buildId: string;
  typecheckPassed: boolean;
  webBuildPassed: boolean;
  regressionPassed: boolean;
  securityReviewPassed: boolean;
  productionConfigPassed: boolean;
  backupRestoreDrillPassed: boolean;
  stripeLiveModeConfirmed: boolean;
  domainTlsConfirmed: boolean;
  signedDesktopArtifactsAvailable: boolean;
  mobileStoreBuildsAvailable: boolean;
};

export type Phase86Certification = Phase86Evidence & {
  schema: "yaposan.phase86.release-certification";
  generatedAt: string;
  sourceReleaseReady: boolean;
  hostedReleaseReady: boolean;
  ecosystemReleaseReady: boolean;
  blockers: string[];
  checksum: string;
};

const validSha = (value: string) => /^[a-f0-9]{7,64}$/i.test(value);

export function certifyPhase86(evidence: Phase86Evidence, generatedAt = new Date()): Phase86Certification {
  const blockers = [
    evidence.releaseVersion !== "1.0.0" && "Release version must be 1.0.0.",
    !validSha(evidence.gitCommitSha) && "A valid Git commit SHA is required.",
    !evidence.buildId.trim() && "A CI/CD build identifier is required.",
    !evidence.typecheckPassed && "TypeScript validation has not passed.",
    !evidence.webBuildPassed && "The production web build has not passed.",
    !evidence.regressionPassed && "The Phase 86 regression suite has not passed.",
    !evidence.securityReviewPassed && "The production security review is incomplete.",
    !evidence.productionConfigPassed && "Production configuration validation is incomplete.",
    !evidence.backupRestoreDrillPassed && "A verified backup and restore drill is required.",
    !evidence.stripeLiveModeConfirmed && "Stripe live-mode billing has not been confirmed.",
    !evidence.domainTlsConfirmed && "Production domain and TLS validation is incomplete.",
    !evidence.signedDesktopArtifactsAvailable && "Signed desktop installers are not available.",
    !evidence.mobileStoreBuildsAvailable && "Signed mobile store builds are not available.",
  ].filter(Boolean) as string[];

  const sourceBlockers = blockers.filter((message) => ![
    "A CI/CD build identifier is required.",
    "Production configuration validation is incomplete.",
    "A verified backup and restore drill is required.",
    "Stripe live-mode billing has not been confirmed.",
    "Production domain and TLS validation is incomplete.",
    "Signed desktop installers are not available.",
    "Signed mobile store builds are not available.",
  ].includes(message));

  const hostedBlockers = blockers.filter((message) => ![
    "Signed desktop installers are not available.",
    "Signed mobile store builds are not available.",
  ].includes(message));

  const payload = {
    schema: "yaposan.phase86.release-certification" as const,
    generatedAt: generatedAt.toISOString(),
    ...evidence,
    sourceReleaseReady: sourceBlockers.length === 0,
    hostedReleaseReady: hostedBlockers.length === 0,
    ecosystemReleaseReady: blockers.length === 0,
    blockers,
  };

  return {
    ...payload,
    checksum: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
  };
}

export function verifyPhase86Certification(certification: Phase86Certification): boolean {
  const { checksum, ...payload } = certification;
  const expected = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return checksum === expected;
}
