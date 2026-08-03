import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
test('dedicated AI workspace is present',()=>{const s=read('src/app/ai-workspace.tsx');for(const key of ['writer','image','design','product','document','brand'])assert.match(s,new RegExp(`${key}:`));assert.match(s,/AsyncStorage/);assert.match(s,/Create result/)});
test('AI dashboard routes to complete workspaces',()=>{const s=read('src/app/ai.tsx');for(const tool of ['writer','image','design','product','document','brand'])assert.match(s,new RegExp(`ai-workspace\\?tool=${tool}`))});
test('workspace cards have persistent editable configuration',()=>{const s=read('src/components/workspace/WorkspaceDashboard.tsx');assert.match(s,/configuration/);assert.match(s,/Display name/);assert.match(s,/Workspace notes/);assert.match(s,/Save configuration/);assert.match(s,/Reset/)});
