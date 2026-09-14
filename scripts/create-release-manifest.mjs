import fs from 'node:fs';
import crypto from 'node:crypto';
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const manifest={product:'Yaposan',version:pkg.version,generatedAt:new Date().toISOString(),node:process.version};
const body=JSON.stringify(manifest,null,2)+'\n';
fs.writeFileSync('release-manifest.json',body);
console.log(`release-manifest.json ${crypto.createHash('sha256').update(body).digest('hex')}`);
