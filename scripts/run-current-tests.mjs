import { spawnSync } from 'node:child_process';
const files=['tests/current-release.test.mjs'];
const r=spawnSync(process.execPath,['--test',...files],{stdio:'inherit',cwd:process.cwd(),env:process.env});
if(r.error) throw r.error;
process.exit(r.status??1);
