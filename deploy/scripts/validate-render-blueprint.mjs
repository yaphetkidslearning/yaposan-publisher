import fs from 'node:fs';
const file = process.argv[2] || 'render.yaml';
const text = fs.readFileSync(file, 'utf8');
const required = [
  'name: yaposan-web','name: yaposan-api','name: yaposan-export-worker',
  'name: yaposan-redis','name: yaposan-postgres','healthCheckPath: /ready',
  'property: connectionString','dockerCommand: node --import tsx scripts/export-worker.ts'
];
const issues = required.filter(value => !text.includes(value)).map(value => `Missing blueprint declaration: ${value}`);
if (/R2_SECRET_ACCESS_KEY\s*\n\s*value:/m.test(text) || /STRIPE_SECRET_KEY\s*\n\s*value:/m.test(text)) issues.push('A provider secret appears to be hard-coded');
if (!fs.existsSync('Dockerfile.api')) issues.push('Dockerfile.api is missing');
else {
  const docker = fs.readFileSync('Dockerfile.api','utf8');
  if (!docker.includes('COPY scripts/export-worker.ts')) issues.push('Dockerfile.api does not include the export worker');
  if (!docker.includes('apk add --no-cache ffmpeg')) issues.push('Dockerfile.api does not install FFmpeg');
}
const report={step:2,provider:'Render + Cloudflare R2',valid:issues.length===0,issues};
console.log(JSON.stringify(report,null,2));
process.exit(issues.length ? 1 : 0);
