import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const roots = ['src','desktop','server','scripts'];
const findings = [];
const patterns = [
  ['eval', /\beval\s*\(/, 'error'],
  ['new-function', /new\s+Function\s*\(/, 'error'],
  ['insecure-http', /http:\/\//, 'warning'],
  ['hardcoded-secret', /(api[_-]?key|secret|private[_-]?key)\s*[:=]\s*["'][^"']{12,}["']/i, 'error'],
];
function walk(dir){ if(!fs.existsSync(dir)) return; for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const full=path.join(dir,entry.name); if(entry.isDirectory()){ if(!['node_modules','.git','dist','release'].includes(entry.name)) walk(full); } else if(/\.(?:ts|tsx|js|mjs|cjs)$/.test(entry.name)){ const text=fs.readFileSync(full,'utf8'); for(const [id,re,severity] of patterns){ if(re.test(text)) findings.push({id,severity,file:path.relative(root,full)}); } } } }
roots.forEach((item)=>walk(path.join(root,item)));
const errors=findings.filter((item)=>item.severity==='error');
fs.mkdirSync(path.join(root,'release'),{recursive:true});
fs.writeFileSync(path.join(root,'release','phase24i-security-report.json'),JSON.stringify({generatedAt:new Date().toISOString(),findings,passed:errors.length===0},null,2));
if(errors.length){ console.error(errors); process.exit(1); }
console.log(`Phase 24.0I security scan passed (${findings.length} warnings).`);
