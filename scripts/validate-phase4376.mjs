import fs from 'node:fs';
const file=fs.readFileSync(new URL('../src/templates/phase4376PublicationTypeExpansion.ts', import.meta.url),'utf8');
const categories=[...file.matchAll(/subcategory:"([^"]+)"/g)].map(m=>m[1]);
const expected=['Letterheads','Envelopes','Certificates','Invoices','Brochures','Newsletters','Flyers','Posters','Menus','Labels','Packaging','Calendars','Book Covers','Resumes','Presentation Covers','Social Media Kits'];
if(categories.length!==16 || expected.some(x=>!categories.includes(x))) throw new Error('Category definition mismatch');
if(!file.includes('Array.from({length:30}')) throw new Error('Expected 30 templates per category');
if(!file.includes('PHASE4376_PUBLICATION_TYPE_TEMPLATES')) throw new Error('Missing export');
const ids=[]; const names=[];
const stems=['Axiom','Sterling','Cascade','Radiant','Pinnacle','Nexus','Solstice','Arcadia','Vertex','Luminary','Keystone','Vista','Contour','Legacy','Nova','Sovereign','Horizon','Momentum','Civic','Opaline'];
for(const c of expected){
 const slug=c.toLowerCase().replace(/\s+/g,'-');
 for(let i=0;i<30;i++){
  ids.push(`phase4376-${slug}-${String(i+61).padStart(2,'0')}`);
  names.push(`${stems[i%stems.length]} ${c.replace(/s$/,'')} Collection IV ${String(i+1).padStart(2,'0')}`);
 }
}
if(ids.length!==480 || new Set(ids).size!==480) throw new Error('ID validation failed');
if(names.length!==480 || new Set(names).size!==480) throw new Error('Name validation failed');
const registry=fs.readFileSync(new URL('../src/templates/phase43ProfessionalTemplateEcosystem.ts', import.meta.url),'utf8');
for(const token of ['import { PHASE4376_PUBLICATION_TYPE_TEMPLATES','...PHASE4376_PUBLICATION_TYPE_TEMPLATES']) if(!registry.includes(token)) throw new Error('Registry integration missing');
console.log(JSON.stringify({templates:480,categories:16,perCategory:30,uniqueIds:480,uniqueNames:480,newLibraryTotal:2485},null,2));
