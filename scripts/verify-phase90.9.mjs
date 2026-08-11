import fs from 'node:fs';
import path from 'node:path';
const required=['server/aiRequestPolicy.ts','tests/phase909-final-security.test.mjs','PHASE90.9-FINAL-OPEN-SOURCE-SECURITY-AND-PUBLIC-RELEASE-CERTIFICATION.md','.github/dependabot.yml','.github/workflows/open-source-security.yml','scripts/phase90.9-local-certification.ps1'];
for(const file of required)if(!fs.existsSync(file))throw new Error(`Missing Phase 90.9 file: ${file}`);
const g=fs.readFileSync('.gitleaks.toml','utf8');if(!g.includes("yaposan\\.[A-Za-z0-9._-]+"))throw new Error('Narrow Yaposan Gitleaks allowlist missing');if(g.includes('A-Za-z0-9.*-'))throw new Error('Broad Gitleaks allowlist still present');
const ignore=fs.readFileSync('.gitignore','utf8');for(const f of ['gitleaks-report.json','gitleaks-full-report.json'])if(!ignore.includes(f))throw new Error(`${f} is not ignored`);
const v7=fs.readFileSync('scripts/verify-phase90.7.mjs','utf8');for(const k of ['AI_DEFAULT_INPUT_USD_PER_MILLION_TOKENS','AI_DEFAULT_OUTPUT_USD_PER_MILLION_TOKENS'])if(!v7.includes(k))throw new Error(`Phase 90.7 verifier missing ${k}`);
const vault=fs.readFileSync('server/providerVault.ts','utf8');for(const token of ['setAAD','keyVersion','ai.provider.connected','ai.provider.deleted','ai.provider.key_rotated'])if(!vault.includes(token))throw new Error(`Provider-vault hardening missing ${token}`);
const network=fs.readFileSync('server/aiNetworkSecurity.ts','utf8');for(const token of ['CROSS_ORIGIN_REDIRECT_FORBIDDEN','lookup:','100&&b>=64','AI_PROVIDER_RESPONSE_TOO_LARGE'])if(!network.includes(token))throw new Error(`Network hardening missing ${token}`);
const ai=fs.readFileSync('server/aiPlatform.ts','utf8');for(const token of ['normalizeAiRequest','createAiJobWithConcurrencyGuard','isRetryableAiProviderError','invokeWithRetry'])if(!ai.includes(token))throw new Error(`AI request hardening missing ${token}`);
const forbidden=/EXPO_PUBLIC_(?:REMOVE_BG|OPENAI|ANTHROPIC|GEMINI|AI)_API_KEY|process\.env\.(?:OPENAI|ANTHROPIC|GEMINI)_API_KEY/g;
for(const base of ['src','public'])if(fs.existsSync(base)){for(const entry of fs.readdirSync(base,{recursive:true})){const file=path.join(base,String(entry));if(fs.existsSync(file)&&fs.statSync(file).isFile()){const text=fs.readFileSync(file,'utf8');if(forbidden.test(text))throw new Error(`Frontend provider secret reference found: ${file}`);forbidden.lastIndex=0}}}
console.log('Phase 90.9 static open-source security certification passed.');
