import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const canonical='PHASE90.11-FINAL-PRODUCTION-CERTIFICATION-OPEN-SOURCE-LAUNCH-AND-RELEASE-READINESS.md';
test('short Phase 90.13 recovery template exists',()=>assert.ok(fs.existsSync('release/phase90.13/phase90.11-certification-template.md')));
test('repair helper can reconstruct canonical Phase 90.11 document from short template',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'y9013-'));
 fs.mkdirSync(path.join(dir,'scripts'),{recursive:true}); fs.mkdirSync(path.join(dir,'release','phase90.13'),{recursive:true});
 fs.copyFileSync('scripts/ensure-phase90.11-canonical-doc.mjs',path.join(dir,'scripts','ensure-phase90.11-canonical-doc.mjs'));
 fs.copyFileSync('release/phase90.13/phase90.11-certification-template.md',path.join(dir,'release','phase90.13','phase90.11-certification-template.md'));
 execFileSync(process.execPath,['scripts/ensure-phase90.11-canonical-doc.mjs'],{cwd:dir});
 assert.ok(fs.existsSync(path.join(dir,canonical))); fs.rmSync(dir,{recursive:true,force:true});
});
test('Gitleaks report files remain ignored',()=>{const s=fs.readFileSync('.gitignore','utf8'); assert.match(s,/gitleaks-report\.json/); assert.match(s,/gitleaks-full-report\.json/)});
test('canonical Phase 90.11 document exists in delivered tree',()=>assert.ok(fs.existsSync(canonical)));
