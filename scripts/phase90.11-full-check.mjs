import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const exists=(p)=>fs.existsSync(p);
const read=(p)=>exists(p)?fs.readFileSync(p,'utf8'):'';
const json=(p)=>JSON.parse(read(p));
const result=[];
const add=(id,title,status,evidence,critical=true)=>result.push({id,title,status,evidence,critical});
const filesRecursive=(base)=>{if(!exists(base))return[];const out=[];for(const e of fs.readdirSync(base,{recursive:true})){const p=path.join(base,String(e));try{if(fs.statSync(p).isFile())out.push(p)}catch{}}return out};
const sourceFiles=[...filesRecursive('app'),...filesRecursive('src'),...filesRecursive('server'),...filesRecursive('scripts'),...filesRecursive('public')].filter(f=>/\.(?:js|jsx|mjs|cjs|ts|tsx|json|html|md|txt|yml|yaml)$/i.test(f));
const sourceText=sourceFiles.map(f=>`\n/* ${f} */\n${read(f)}`).join('\n');

// 1 DNS/TLS/domain: source-side readiness only; live state remains external.
add('01-dns-tls-domain','DNS/TLS/domain certification', exists('scripts/verify-production.mjs')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Read-only HTTPS production verifier exists; live DNS, certificate renewal, HSTS and CORS still require production execution.');

// 2 environment audit
const env=read('.env.example');
const publicSecrets=[...env.matchAll(/^\s*(EXPO_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=/gmi)].map(m=>m[1]);
add('02-production-environment','Production environment configuration audit', publicSecrets.length?'BLOCKED':'PASS WITH DOCUMENTED LIMITATION', publicSecrets.length?`Potential public secret variables: ${publicSecrets.join(', ')}`:'No secret-like EXPO_PUBLIC_* variables found in .env.example; Render values still require comparison.');

// 3 supply chain
const pkgLock=exists('package-lock.json');
const dep=exists('.github/dependabot.yml');const codeql=exists('.github/workflows/codeql.yml');const sbom=exists('scripts/generate-sbom.mjs');
add('03-supply-chain','Supply-chain security',pkgLock&&dep&&codeql&&sbom?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED',`lockfile=${pkgLock}, Dependabot=${dep}, CodeQL=${codeql}, SBOM=${sbom}; npm audit must run locally.`);

// 4 tenant isolation
const authSignals=/organizationId|workspaceId|tenantId/.test(sourceText)&&/requireAuth|authenticate|authorization|membership|require.*role/i.test(sourceText);
add('04-tenant-isolation','Authorization and tenant-isolation',authSignals?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Source contains tenant identifiers and authorization/membership checks; cross-tenant route tests remain required.');

// 5 data lifecycle/privacy
const lifecycle=/delete.*account|account.*delete|delete.*project|delete.*provider|retention|export.*data/i.test(sourceText);
add('05-data-lifecycle','Data lifecycle and privacy',lifecycle?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Lifecycle-related implementation/documentation detected; end-to-end deletion, backup retention and data-export behavior require verification.');

// 6 upload security
const upload=/mime|content-type|file signature|magic byte|max.*file|upload.*size|path traversal|sanitize.*filename|svg/i.test(sourceText);
add('06-upload-security','File-upload security',upload?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Upload hardening signals detected in source; adversarial upload tests remain required.');

// 7 webhook security
const webhook=/stripe.*signature|constructEvent|webhook.*secret/i.test(sourceText)&&/idempot/i.test(sourceText);
add('07-webhook-security','Webhook security and idempotency',webhook?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Signature/idempotency controls detected; replay, duplicate and out-of-order route tests still required.');

// 8 email
add('08-email','Email production certification','BLOCKED','SPF/DKIM/DMARC, bounce behavior and production-link delivery require external evidence.',false);
// 9 browsers
add('09-browser-matrix','Browser/platform matrix','BLOCKED','Requires Chrome, Edge, Firefox, Safari, mobile, touch, high-DPI and resize evidence.',false);
// 10 accessibility
add('10-accessibility','WCAG 2.2 AA accessibility release gate','BLOCKED','Requires keyboard, focus, screen-reader, contrast, reduced-motion and 200% zoom evidence.');
// 11 editor integrity
const recovery=/undo|redo|autosave|offline|recovery|version/i.test(sourceText);
add('11-editor-integrity','Editor data-integrity stress tests',recovery?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Editor recovery/versioning signals detected; stress and simultaneous-editing tests remain required.');
// 12 sessions
const session=/refresh token|revok|logout.*all|csrf|sameSite|httpOnly|rate.*login|brute/i.test(sourceText);
add('12-session-security','Session and authentication edge cases',session?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Session-security controls detected; expiry/revocation/token-reuse route tests remain required.');
// 13 AI privacy
add('13-ai-privacy','AI privacy and content boundaries',exists('docs/release/phase90.11/AI-PRIVACY-AND-CONTENT-BOUNDARIES.md')?'PASS':'BLOCKED','Dedicated AI privacy/content-boundary document.');
// 14 observability
const obs=/request.?id|structured log|metrics|health|redact|authorization.*redact/i.test(sourceText);
add('14-observability','Observability certification',obs?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Observability/redaction signals detected; live dashboards and failure telemetry require production evidence.');
// 15 alerting
const alerts=/alert|pager|webhook.*alert|notify/i.test(sourceText);
add('15-alerting','Operational alerting',alerts?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Alerting references detected; actual notification delivery must be tested.');
// 16 degradation
add('16-graceful-degradation','Graceful degradation','BLOCKED','Requires failure injection for AI, Redis, object storage and Stripe.');
// 17 worker
const worker=exists('scripts/export-worker.ts');
add('17-worker-queue','Queue/export-worker certification',worker?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Export worker source exists; startup, retry, poison-job, duplicate, crash-recovery and graceful-shutdown tests remain required.');
// 18 migrations
const migrationDir=exists('database/migrations')||exists('server/migrations')||exists('migrations');
add('18-database-migrations','Database migration certification',migrationDir?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED',migrationDir?'Migration files detected; production-like apply/failure/compatibility drill required.':'No migration directory detected by full-check.');
// 19 backup
add('19-backup-restore','Backup integrity and restore','BLOCKED','Requires encrypted backup and clean-environment restore evidence.');
// 20 rollback
add('20-rollback','Deployment rollback drill','BLOCKED','Requires non-production bad-deploy rollback evidence.');
// 21 restart
add('21-zero-downtime','Zero-downtime/restart behavior','BLOCKED','Requires deployment/restart fault testing.');
// 22 whole API rate limiting
const rate=/rate.?limit|too many requests|status\s*\(?429|429/.test(sourceText);
add('22-api-rate-limits','Whole-API rate limiting and abuse protection',rate?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Rate-limiting implementation references detected; route-by-route coverage must be verified.');
// 23 public sharing
const sharing=/public.*share|share.*token|expired.*share|revoke.*share|noindex/i.test(sourceText);
add('23-public-sharing','Public sharing security',sharing?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Sharing/indexing controls detected; guessed/revoked/expired-link tests remain required.');
// 24 billing
const billing=/stripe|credit ledger|refund|dispute|checkout/i.test(sourceText);
add('24-billing-edge-cases','Billing and AI-credit edge cases',billing?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Billing/credit/refund code detected; real Stripe end-to-end edge cases remain required.');
// 25 timezone
const tz=/UTC|timezone|timeZone|monthStart|billing.*date/i.test(sourceText);
add('25-timezone-currency','Timezone/date/currency correctness',tz?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Timezone/date handling references detected; boundary tests remain required.',false);
// 26 clean clone
add('26-clean-clone','Open-source clean-clone test',exists('docs/release/phase90.11/OPEN-SOURCE-CLEAN-CLONE-CHECKLIST.md')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Checklist exists; must be executed on a clean machine.');
// 27 contributor security
add('27-contributor-security','Contributor security boundary',exists('SECURITY.md')&&exists('CONTRIBUTING.md')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','SECURITY.md and CONTRIBUTING.md exist; maintainers must confirm private disclosure path and test-credential guidance.');
// 28 repo governance
const governance=exists('.github/CODEOWNERS')&&dep&&codeql;
add('28-repo-governance','Repository governance',governance?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Repository governance files exist; branch protection, PR requirement, force-push policy, secret scanning and push protection require GitHub verification.');
// 29 licenses/assets
add('29-license-assets','License and third-party asset audit',exists('docs/release/phase90.11/THIRD-PARTY-ASSET-LICENSE-AUDIT.md')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Audit document exists; actual redistribution rights must be completed before public release.');
// 30 legal
const legal=/privacy policy|terms of service|acceptable use|copyright|trademark/i.test(sourceText);
add('30-legal','Legal/public-site baseline',legal?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Legal-text references detected; production URLs and applicability require review.',false);
// 31 SEO
const seo=exists('public/robots.txt')&&exists('public/sitemap.xml');
add('31-seo','SEO final verification',seo?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','robots.txt and sitemap.xml are committed; rendered production title/canonical and Search Console recrawl require live evidence.',false);
// 32 reproducibility
const manifest=exists('release/phase90.11/release-manifest.json');
add('32-reproducibility','Release artifact reproducibility',manifest?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Release manifest generation exists; real Git SHA/deployment ID/migration state must be captured from the release environment.');
// 33 feature inventory
add('33-feature-inventory','Feature inventory certification',exists('docs/release/phase90.11/FEATURE-INVENTORY-CERTIFICATION.md')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Feature inventory document exists; production-verified statuses must be maintained.');
// 34 launch runbook
add('34-launch-runbook','Launch-day runbook',exists('docs/release/phase90.11/LAUNCH-DAY-RUNBOOK.md')?'PASS':'BLOCKED','Launch-day runbook is committed.');
// 35 post-launch smoke
add('35-production-smoke','Post-launch smoke automation',exists('scripts/verify-production.mjs')?'PASS WITH DOCUMENTED LIMITATION':'BLOCKED','Read-only production smoke command exists; must be executed against production.');

const criticalBlocked=result.filter(g=>g.critical&&g.status==='BLOCKED');
const summary={phase:'90.11',generatedAt:new Date().toISOString(),gateCount:result.length,pass:result.filter(x=>x.status==='PASS').length,limited:result.filter(x=>x.status==='PASS WITH DOCUMENTED LIMITATION').length,blocked:result.filter(x=>x.status==='BLOCKED').length,notApplicable:result.filter(x=>x.status==='NOT APPLICABLE').length,releaseReady:criticalBlocked.length===0,criticalBlocked:criticalBlocked.map(x=>x.id),gates:result};
fs.mkdirSync('release/phase90.11',{recursive:true});
fs.writeFileSync('release/phase90.11/full-certification.json',JSON.stringify(summary,null,2)+'\n');
console.log(`Phase 90.11 FULL CHECK: ${summary.gateCount} gates; PASS=${summary.pass}; LIMITED=${summary.limited}; BLOCKED=${summary.blocked}; critical blocked=${criticalBlocked.length}`);
for(const g of result)console.log(`${g.status.padEnd(31)} ${g.id} - ${g.title}`);
if(process.argv.includes('--require-release-ready')&&criticalBlocked.length)process.exitCode=2;
