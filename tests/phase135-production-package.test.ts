import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { buildPressPackageZip, sha256Bytes, sha256Text } from '../src/utils/productionPackageService';
import type { PublisherProject } from '../src/types/publisher';
import { DEFAULT_PREPRESS_SETTINGS } from '../src/utils/prepressEngine';

const project:PublisherProject={id:'p13-5',name:'Phase 13.5 Test',createdAt:1,updatedAt:1,activePageId:'page-1',autoSave:true,version:2,embeddedFonts:{TestFont:'Zm9udA=='},prepressSettings:{...DEFAULT_PREPRESS_SETTINGS,pdfStandard:'PDF',generateSeparations:true,imposition:'two-up',includeJobTicket:true,approvalStatus:'press-approved'},pages:[{id:'page-1',name:'Front',width:400,height:300,backgroundColor:'#fff',orientation:'landscape',sizeKey:'custom',margin:18,bleed:9,elements:[{id:'r1',name:'Die Cut Dieline',type:'rectangle',x:20,y:20,width:100,height:80,rotation:0,zIndex:1,opacity:1,fillColor:'#FF00FF',borderColor:'#FF00FF',borderWidth:1},{id:'t1',name:'Title',type:'text',x:50,y:50,width:180,height:40,rotation:0,zIndex:2,opacity:1,text:'Press Ready',fontFamily:'Helvetica',fontSize:24,fontWeight:'700',textColor:'#000000'}]}]};

test('SHA-256 uses production-grade 64-character digest',()=>{assert.equal(sha256Text('abc'),'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');assert.equal(sha256Bytes(new TextEncoder().encode('abc')).length,64)});
test('builds a real ZIP with composite PDF and reports',async()=>{const r=await buildPressPackageZip(project);assert.ok(r.bytes.length>500);const z=await JSZip.loadAsync(r.bytes);assert.ok(z.file('PDF/Phase-13.5-Test-Composite.pdf'));assert.ok(z.file('Reports/SHA256SUMS.json'));assert.ok(z.file('README-PRESS-PACKAGE.txt'));});
test('includes process separation PDFs',async()=>{const z=await JSZip.loadAsync((await buildPressPackageZip(project)).bytes);for(const p of ['Cyan','Magenta','Yellow','Black'])assert.ok(z.file(`Separations/${p}.pdf`));});
test('renders imposed sheet source and PDF',async()=>{const z=await JSZip.loadAsync((await buildPressPackageZip(project)).bytes);assert.ok(z.file('PDF/Phase-13.5-Test-Imposed.pdf'));assert.ok(Object.keys(z.files).some(p=>p.startsWith('Imposition/Sheet-')&&p.endsWith('.svg')));});
test('extracts actual named finishing objects',async()=>{const z=await JSZip.loadAsync((await buildPressPackageZip(project)).bytes);assert.ok(z.file('Finishing/die-cut-page-1.svg'));const svg=await z.file('Finishing/die-cut-page-1.svg')!.async('string');assert.match(svg,/Die Cut Dieline|data-finishing-plate/);});
test('collects fonts and provides package SHA-256',async()=>{const r=await buildPressPackageZip(project);const z=await JSZip.loadAsync(r.bytes);assert.ok(z.file('Assets/Fonts/TestFont.base64.txt'));assert.equal(r.sha256.length,64);assert.ok(Object.keys(r.fileChecksums).length>=8);});
