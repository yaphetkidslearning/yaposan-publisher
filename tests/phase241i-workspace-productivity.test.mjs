import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
test('phase 24.1I version and routes',()=>{const pkg=JSON.parse(read('package.json'));assert.equal(pkg.version,'24.1.8');for(const f of ['src/app/productivity.tsx','src/app/macros.tsx','src/app/settings.tsx','src/app/help.tsx','src/app/team.tsx'])assert.ok(fs.existsSync(f),f)});
test('productivity engine exposes jobs macros and score',()=>{const s=read('src/utils/productivitySuite.ts');for(const token of ['createProductivityJob','runProductivityJob','createMacro','runMacro','calculateProductivityScore'])assert.match(s,new RegExp(token))});
test('persistent storage covers phase modules',()=>{const s=read('src/utils/productivityStorage.ts');for(const token of ['load241ISettings','loadProductivityJobs','loadMacros','loadTeamMembers','loadTeamTasks'])assert.match(s,new RegExp(token))});
test('home navigation exposes productivity modules',()=>{const s=read('src/app/index.tsx');assert.match(s,/Productivity/);assert.match(s,/\/macros/);assert.match(s,/Commerce Automation/)});
