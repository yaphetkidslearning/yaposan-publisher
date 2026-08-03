import { createHash } from "node:crypto";

export type FinalReleaseEvidence = {
  sourceVersion: string;
  testsPassed: number;
  testsFailed: number;
  typecheckPassed: boolean;
  webBuildPassed: boolean;
  productionConfigPassed: boolean;
  securityReviewPassed: boolean;
  backupRestoreDrillPassed: boolean;
  desktopArtifactsCertified: boolean;
  gitCommitSha?: string;
  buildId?: string;
};

export type FinalReleaseCertification = FinalReleaseEvidence & {
  schema: "yaposan.v1.final-release";
  releaseVersion: "1.0.0";
  generatedAt: string;
  blockers: string[];
  sourceReleaseReady: boolean;
  hostedProductionReady: boolean;
  checksum: string;
};

const isSha = (value?: string) => Boolean(value && /^[a-f0-9]{7,64}$/i.test(value));

export function certifyFinalRelease(evidence: FinalReleaseEvidence, now = new Date()): FinalReleaseCertification {
  const blockers = [
    evidence.sourceVersion !== "1.0.0" && "Source version is not locked to 1.0.0.",
    evidence.testsPassed < 90 && "At least 90 final regression tests must pass.",
    evidence.testsFailed !== 0 && "Final regression has failing tests.",
    !evidence.typecheckPassed && "TypeScript validation evidence is missing.",
    !evidence.webBuildPassed && "Production web build evidence is missing.",
    !evidence.productionConfigPassed && "Production configuration validation did not pass.",
    !evidence.securityReviewPassed && "Security certification evidence is missing.",
    !evidence.backupRestoreDrillPassed && "Verified backup restore drill evidence is missing.",
    !evidence.desktopArtifactsCertified && "Signed desktop artifacts are not certified.",
    !isSha(evidence.gitCommitSha) && "A valid Git commit SHA is required.",
    !evidence.buildId?.trim() && "A CI/CD build ID is required.",
  ].filter(Boolean) as string[];

  const sourceBlockers = blockers.filter((blocker) => ![
    "Production web build evidence is missing.",
    "Production configuration validation did not pass.",
    "Verified backup restore drill evidence is missing.",
    "Signed desktop artifacts are not certified.",
    "A CI/CD build ID is required.",
  ].includes(blocker));

  const payload = {
    schema: "yaposan.v1.final-release" as const,
    releaseVersion: "1.0.0" as const,
    generatedAt: now.toISOString(),
    ...evidence,
    blockers,
    sourceReleaseReady: sourceBlockers.length === 0,
    hostedProductionReady: blockers.length === 0,
  };
  return { ...payload, checksum: createHash("sha256").update(JSON.stringify(payload)).digest("hex") };
}

export function verifyFinalReleaseCertification(certification: FinalReleaseCertification): boolean {
  const { checksum, ...payload } = certification;
  return checksum === createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
