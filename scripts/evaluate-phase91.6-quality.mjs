import fs from "node:fs";
const file=process.argv[2]; if(!file) throw new Error("usage: node scripts/evaluate-phase91.6-quality.mjs benchmark.csv [--write report.json]");
const lines=fs.readFileSync(file,"utf8").trim().split(/\r?\n/); const head=lines.shift().split(",");
const rows=lines.filter(Boolean).map(l=>{const a=l.split(",");return Object.fromEntries(head.map((h,i)=>[h,a[i]??""]))});
const cats={}; let critical=0;
for(const r of rows){const c=r.category||"unknown";cats[c]??={n:0,y:0,ref:0};cats[c].n++;cats[c].y+=r.yaposan_acceptable==="1"?1:0;cats[c].ref+=r.reference_acceptable==="1"?1:0;critical+=r.critical_product_loss==="1"?1:0}
const limits={"hard-goods":1,footwear:1,apparel:2,furniture:2,"thin-structures":2,"hair-fur":3,"glass-transparent":3};
const results=Object.fromEntries(Object.entries(cats).map(([c,v])=>{const yp=100*v.y/v.n,rp=100*v.ref/v.n,gap=rp-yp,limit=limits[c]??3;return[c,{...v,yaposanPercent:+yp.toFixed(2),referencePercent:+rp.toFixed(2),gap:+gap.toFixed(2),limit,pass:gap<=limit}]}));
const pass=rows.length>=500&&critical===0&&Object.values(results).every(x=>x.pass);
const report={phase:"91.6",images:rows.length,criticalProductLoss:critical,categories:results,certified:pass,claim:pass?"COMPARABLE_FOR_TESTED_WORKLOAD":"NOT_CERTIFIED"};
const wi=process.argv.indexOf("--write");if(wi>=0&&process.argv[wi+1])fs.writeFileSync(process.argv[wi+1],JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2)); if(!pass)process.exitCode=2;
