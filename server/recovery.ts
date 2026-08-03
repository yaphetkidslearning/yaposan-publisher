import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export type BackupComponent = "postgres" | "object-storage" | "redis" | "configuration";
export type BackupArtifact = { component: BackupComponent; key: string; size: number; checksum: string; createdAt: string };
export type BackupManifest = { version: 1; release: string; environment: string; backupId: string; createdAt: string; artifacts: BackupArtifact[]; signature: string };
export type RecoveryPolicy = { retentionDays: number; minimumBackups: number; maximumBackupAgeHours: number; requireCrossRegionCopy: boolean };

const canonical = (manifest: Omit<BackupManifest, "signature">) => JSON.stringify({
  version: manifest.version,
  release: manifest.release,
  environment: manifest.environment,
  backupId: manifest.backupId,
  createdAt: manifest.createdAt,
  artifacts: [...manifest.artifacts].sort((a,b)=>a.component.localeCompare(b.component)||a.key.localeCompare(b.key)),
});
export const sha256 = (body: Uint8Array|string) => createHash("sha256").update(body).digest("hex");
export function createBackupManifest(input: Omit<BackupManifest,"signature">, secret: string): BackupManifest {
  if (secret.length < 32) throw new Error("BACKUP_SIGNING_SECRET must be at least 32 characters");
  const signature = createHmac("sha256", secret).update(canonical(input)).digest("hex");
  return {...input, signature};
}
export function verifyBackupManifest(manifest: BackupManifest, secret: string) {
  if (secret.length < 32 || !/^[a-f0-9]{64}$/i.test(manifest.signature)) return false;
  const expected = createHmac("sha256", secret).update(canonical(manifest)).digest();
  return timingSafeEqual(expected, Buffer.from(manifest.signature,"hex"));
}
export function validateBackupManifest(manifest: BackupManifest, secret: string, now = new Date()) {
  const issues: string[] = [];
  if (!verifyBackupManifest(manifest, secret)) issues.push("Backup manifest signature is invalid");
  if (!manifest.backupId.trim()) issues.push("Backup ID is missing");
  if (!manifest.artifacts.length) issues.push("Backup contains no artifacts");
  const components = new Set(manifest.artifacts.map(x=>x.component));
  for (const required of ["postgres","object-storage","configuration"] as BackupComponent[]) if (!components.has(required)) issues.push(`Missing ${required} backup artifact`);
  for (const artifact of manifest.artifacts) {
    if (artifact.size <= 0) issues.push(`${artifact.component} artifact is empty`);
    if (!/^[a-f0-9]{64}$/i.test(artifact.checksum)) issues.push(`${artifact.component} checksum is invalid`);
    if (!Number.isFinite(Date.parse(artifact.createdAt)) || Date.parse(artifact.createdAt) > now.getTime()+300000) issues.push(`${artifact.component} timestamp is invalid`);
  }
  return issues;
}
export function assertRestoreAllowed(input: { manifest: BackupManifest; secret: string; targetEnvironment: string; confirmation: string; now?: Date }) {
  const issues = validateBackupManifest(input.manifest,input.secret,input.now);
  if (issues.length) throw new Error(issues.join("; "));
  if (input.manifest.environment === "production" && input.targetEnvironment !== "production") throw new Error("Production backups may only be restored to production through the controlled recovery process");
  const required = `RESTORE ${input.manifest.backupId} TO ${input.targetEnvironment}`;
  if (input.confirmation !== required) throw new Error(`Restore confirmation must exactly equal: ${required}`);
  return true;
}
export function evaluateRecoveryReadiness(input: { lastSuccessfulBackupAt?: string; verifiedRestoreAt?: string; backupCount: number; crossRegionCopy: boolean; policy: RecoveryPolicy; now?: Date }) {
  const issues:string[]=[]; const now=input.now??new Date();
  if (input.backupCount < input.policy.minimumBackups) issues.push(`At least ${input.policy.minimumBackups} retained backups are required`);
  if (!input.lastSuccessfulBackupAt || (now.getTime()-Date.parse(input.lastSuccessfulBackupAt))/3600000 > input.policy.maximumBackupAgeHours) issues.push("Latest successful backup is too old or missing");
  if (!input.verifiedRestoreAt || (now.getTime()-Date.parse(input.verifiedRestoreAt))/86400000 > input.policy.retentionDays) issues.push("A verified restore drill is required within the retention window");
  if (input.policy.requireCrossRegionCopy && !input.crossRegionCopy) issues.push("Cross-region backup copy is required");
  return { ready: issues.length===0, issues };
}
