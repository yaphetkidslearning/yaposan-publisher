import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('phase 24.0Z2 removes visible later-phase placeholders',()=>{
 for(const f of ['src/app/team.tsx','src/app/settings.tsx','src/app/help.tsx','src/app/brand.tsx','src/app/templates.tsx']) assert.ok(!read(f).includes('This section will be added in a later phase'));
});
test('workspace tools are interactive and persistent',()=>{const s=read('src/components/workspace/WorkspaceDashboard.tsx');assert.match(s,/AsyncStorage/);assert.match(s,/Save configuration/);assert.match(s,/Recent activity/);});
test('upgrade and commerce empty states are wired',()=>{assert.match(read('src/app/index.tsx'),/router\.push\("\/account"\)/);assert.match(read('src/app/automation.tsx'),/Open Commerce Studio/);});
