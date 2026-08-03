const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..','src','templates');
const files=fs.readdirSync(dir).filter(f=>/^phase43(5[1-4]|6[1-6])FiftyPhase243dTemplates\.ts$/.test(f));
let specs=[];
for(const f of files){const t=fs.readFileSync(path.join(dir,f),'utf8');const m=t.match(/const SPECS:Spec\[\]=(\[.*\]);\n\nfunction compose/s);if(!m)throw new Error('Missing specs '+f);specs.push(...JSON.parse(m[1]));}
const dup=a=>a.length-new Set(a).size;
const signatures=specs.map(s=>[s.layout,s.seed%19,s.seed%23,s.seed%9,s.dark,s.accent,s.photo].join('|'));
const report={files:files.length,templates:specs.length,duplicateIds:dup(specs.map(x=>x.id)),duplicateNames:dup(specs.map(x=>x.name)),duplicateDesignSignatures:dup(signatures),categories:[...new Set(specs.map(x=>x.category))].length,allHaveTwoFonts:specs.every(x=>x.display&&x.body&&x.display!==x.body),allHaveFourColorPalettes:specs.every(x=>[x.dark,x.accent,x.light,x.muted].every(Boolean)),allHaveHighQualityPhotos:specs.every(x=>/w=1800&q=90/.test(x.photo)),allUseTwentyLayouts:new Set(specs.map(x=>x.layout)).size===20};
console.log(JSON.stringify(report,null,2));if(report.templates!==500||report.duplicateIds||report.duplicateNames||report.duplicateDesignSignatures||!report.allHaveTwoFonts||!report.allHaveFourColorPalettes||!report.allHaveHighQualityPhotos)process.exit(1);
