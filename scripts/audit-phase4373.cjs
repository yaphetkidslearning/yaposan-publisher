const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const file = path.join(__dirname, '..', 'src', 'templates', 'phase4373PublicationTypeExpansion.ts');
const source = fs.readFileSync(file, 'utf8');
const categories = [...source.matchAll(/\{slug:"([^"]+)",subcategory:"([^"]+)"/g)].map(m => m[2]);
const expectedCategories = ["Letterheads","Envelopes","Certificates","Invoices","Brochures","Newsletters","Flyers","Posters","Menus","Labels","Packaging","Calendars","Book Covers","Resumes","Presentation Covers","Social Media Kits"];
const transpiled = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS},reportDiagnostics:true,fileName:file});
const diagnostics = transpiled.diagnostics || [];
const uniqueCategories = new Set(categories);
const expectedTemplates = expectedCategories.length * 20;
const result = {
  phase: '43.7.3',
  categories: categories.length,
  uniqueCategories: uniqueCategories.size,
  expectedTemplates,
  templatesPerCategory: 20,
  categorySetMatches: expectedCategories.every(c => uniqueCategories.has(c)),
  transpileDiagnostics: diagnostics.length,
};
console.log(JSON.stringify(result,null,2));
if (result.categories !== 16 || result.uniqueCategories !== 16 || !result.categorySetMatches || diagnostics.length) process.exit(1);
