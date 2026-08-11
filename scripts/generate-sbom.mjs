import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
fs.mkdirSync('release/phase90.11',{recursive:true});
const cmd=process.platform==='win32'?'npm.cmd':'npm';
const r=spawnSync(cmd,['sbom','--sbom-format','cyclonedx'],{encoding:'utf8',maxBuffer:32*1024*1024});
if(r.status!==0){process.stderr.write(r.stderr||'npm sbom failed\n');process.exit(r.status??1)}
JSON.parse(r.stdout);
fs.writeFileSync('release/phase90.11/sbom.cdx.json',r.stdout);
console.log('Wrote release/phase90.11/sbom.cdx.json');
