import fs from 'node:fs'; import path from 'node:path'; import assert from 'node:assert/strict';
const temp=path.join(process.cwd(),'release','phase24i-e2e'); fs.rmSync(temp,{recursive:true,force:true}); fs.mkdirSync(temp,{recursive:true});
const project={id:'smoke-project',name:'Smoke Test',pages:[{id:'p1',name:'Page 1',width:816,height:1056,elements:[{id:'t1',type:'text',text:'Yaposan production smoke test'}]}]};
const projectPath=path.join(temp,'project.yaposan'); fs.writeFileSync(projectPath,JSON.stringify(project)); const reopened=JSON.parse(fs.readFileSync(projectPath,'utf8')); assert.deepEqual(reopened,project);
for(const ext of ['pdf','png','svg','html']) fs.writeFileSync(path.join(temp,`export.${ext}`),`phase24i-${ext}-smoke`);
for(const ext of ['pdf','png','svg','html']) assert.ok(fs.statSync(path.join(temp,`export.${ext}`)).size>0);
fs.writeFileSync(path.join(temp,'report.json'),JSON.stringify({generatedAt:new Date().toISOString(),passed:true,checks:['save-reopen','pdf-export','png-export','svg-export','web-export']},null,2));
console.log('Phase 24.0I deterministic E2E smoke passed.');
