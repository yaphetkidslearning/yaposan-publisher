import { readFileSync, writeFileSync } from 'node:fs';
const args=process.argv.slice(2);const input=args.find(x=>!x.startsWith('--'));const wi=args.indexOf('--write');const output=wi>=0?args[wi+1]:null;
if(!input){console.error('Usage: npm run benchmark:phase91.5 -- benchmark.csv [--write report.json]');process.exit(2)}
const policy=JSON.parse(readFileSync('release/phase91.5/category-parity-policy.json','utf8'));
const lines=readFileSync(input,'utf8').trim().split(/\r?\n/);const headers=lines[0].split(',');
const parse=line=>{const vals=line.split(',');return Object.fromEntries(headers.map((h,i)=>[h,vals[i]??'']))};
const rows=lines.slice(1).filter(Boolean).map(parse);const yes=v=>/^(1|true|yes|y)$/i.test(String(v).trim());const num=v=>Number(v||0);
const cats=Object.keys(policy.maximumDeficitVsComparisonTool);const report={phase:'91.5',rows:rows.length,categories:{},criticalProductLosses:0,originalFileLosses:0,unexpectedPaidApiSpendUsd:0,batchConsistencyRate:0,passed:false,failures:[]};
let batchGood=0;
for(const r of rows){if(yes(r.critical_product_loss))report.criticalProductLosses++;if(yes(r.original_file_loss))report.originalFileLosses++;if(yes(r.batch_consistent))batchGood++;report.unexpectedPaidApiSpendUsd+=num(r.unexpected_paid_api_usd)}
report.batchConsistencyRate=rows.length?batchGood/rows.length:0;
for(const c of cats){const cr=rows.filter(r=>r.category===c);const y=cr.filter(r=>yes(r.yaposan_acceptable)).length;const comp=cr.filter(r=>yes(r.comparison_acceptable)).length;const ya=cr.length?y/cr.length:0;const ca=cr.length?comp/cr.length:0;const deficit=Math.max(0,ca-ya);report.categories[c]={images:cr.length,yaposanAcceptableRate:ya,comparisonAcceptableRate:ca,deficit,allowedDeficit:policy.maximumDeficitVsComparisonTool[c],passed:cr.length>0&&deficit<=policy.maximumDeficitVsComparisonTool[c]};if(!report.categories[c].passed)report.failures.push(`category:${c}`)}
if(rows.length<policy.minimumBenchmarkImages)report.failures.push('minimum-benchmark-images');if(report.batchConsistencyRate<policy.minimumBatchConsistencyRate)report.failures.push('batch-consistency');if(report.criticalProductLosses>policy.maximumCriticalProductLosses)report.failures.push('critical-product-loss');if(report.originalFileLosses>policy.maximumOriginalFileLosses)report.failures.push('original-file-loss');if(report.unexpectedPaidApiSpendUsd>policy.maximumUnexpectedPaidApiSpendUsd)report.failures.push('unexpected-paid-api-spend');
report.passed=report.failures.length===0;if(output)writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));process.exit(report.passed?0:1);
