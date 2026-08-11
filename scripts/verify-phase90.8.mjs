import fs from 'node:fs';
const required=['server/aiNetworkSecurity.ts','server/aiPricing.ts','server/aiRateLimits.ts','tests/phase908-financial-network-hardening.test.mjs','PHASE90.8-AI-FINANCIAL-INTEGRITY-PROVIDER-NETWORK-SECURITY-AND-PRODUCTION-HARDENING.md'];
for(const file of required)if(!fs.existsSync(file))throw new Error(`Missing Phase 90.8 file: ${file}`);
const postgres=fs.readFileSync('server/postgresDatabase.ts','utf8');if(!postgres.includes('this.client.connect?await this.client.connect()'))throw new Error('Dedicated PostgreSQL transaction client missing');
const network=fs.readFileSync('server/aiNetworkSecurity.ts','utf8');for(const token of ['PRIVATE_NETWORK_FORBIDDEN','AI_PROVIDER_TIMEOUT','AI_PROVIDER_RESPONSE_TOO_LARGE'])if(!network.includes(token))throw new Error(`Network hardening missing ${token}`);
const credits=fs.readFileSync('server/aiCredits.ts','utf8');for(const token of ['applyStripeCreditReversal','overageCredits','ai-credits:'])if(!credits.includes(token))throw new Error(`Credit hardening missing ${token}`);
const index=fs.readFileSync('server/index.ts','utf8');for(const token of ['/api/v1/ai/providers/test/','/api/v1/ai/providers/rotate-key','/api/v1/ai/usage','LEGACY_SUBSCRIPTIONS_DISABLED'])if(!index.includes(token))throw new Error(`API hardening missing ${token}`);
console.log('Phase 90.8 static verification passed.');
