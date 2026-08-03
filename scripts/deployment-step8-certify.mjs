import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';

const evidencePath = process.env.LAUNCH_EVIDENCE_FILE || 'deploy/evidence/production-launch-evidence.json';
const outputPath = process.env.LAUNCH_CERTIFICATE_FILE || 'deploy/evidence/production-launch-certificate.json';

const required = [
  'version', 'gitCommitSha', 'buildId', 'webUrl', 'apiUrl',
  'burnIn24HoursAccepted', 'burnIn7DaysAccepted', 'backupVerified',
  'restoreDrillVerified', 'stripeVerified', 'emailVerified', 'aiVerified',
  'r2Verified', 'collaborationVerified', 'exportsVerified', 'adminVerified',
  'securityReviewAccepted', 'operationsOwner', 'approvedBy', 'approvedAt'
];

if (!fs.existsSync(evidencePath)) {
  console.error(`Launch evidence not found: ${evidencePath}`);
  console.error('Create it from deploy/templates/production-launch-evidence.example.json after live validation.');
  process.exit(2);
}

const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
const issues = [];
for (const key of required) {
  if (evidence[key] === undefined || evidence[key] === null || evidence[key] === '') issues.push(`Missing ${key}`);
}
if (evidence.version !== '1.0.0') issues.push('version must be 1.0.0');
for (const key of required.filter(k => k.endsWith('Verified') || k.endsWith('Accepted'))) {
  if (evidence[key] !== true) issues.push(`${key} must be true`);
}
for (const key of ['webUrl', 'apiUrl']) {
  try {
    const url = new URL(evidence[key]);
    if (url.protocol !== 'https:') issues.push(`${key} must use HTTPS`);
  } catch { issues.push(`${key} must be a valid URL`); }
}
if (!/^[0-9a-f]{7,40}$/i.test(String(evidence.gitCommitSha || ''))) issues.push('gitCommitSha is invalid');
if (Number.isNaN(Date.parse(evidence.approvedAt || ''))) issues.push('approvedAt must be an ISO date');

const canonical = JSON.stringify(evidence, Object.keys(evidence).sort());
const certificate = {
  product: 'Yaposan Publisher',
  version: '1.0.0',
  status: issues.length === 0 ? 'CERTIFIED_FOR_PRODUCTION_LAUNCH' : 'NOT_CERTIFIED',
  generatedAt: new Date().toISOString(),
  evidenceSha256: crypto.createHash('sha256').update(canonical).digest('hex'),
  issues,
  evidence
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(certificate, null, 2) + '\n');
console.log(JSON.stringify({ status: certificate.status, issues: issues.length, outputPath }, null, 2));
process.exit(issues.length ? 1 : 0);
