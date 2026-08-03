import assert from "node:assert/strict";
import { PHASE4375_PUBLICATION_TYPE_TEMPLATES } from "../src/templates/phase4375PublicationTypeExpansion.ts";
import { PHASE43_TEMPLATES, phase43Audit } from "../src/templates/phase43ProfessionalTemplateEcosystem.ts";

const expected = ["Letterheads","Envelopes","Certificates","Invoices","Brochures","Newsletters","Flyers","Posters","Menus","Labels","Packaging","Calendars","Book Covers","Resumes","Presentation Covers","Social Media Kits"];
assert.equal(PHASE4375_PUBLICATION_TYPE_TEMPLATES.length, 320);
for (const category of expected) {
  assert.equal(PHASE4375_PUBLICATION_TYPE_TEMPLATES.filter(t => t.metadata.subcategory === category).length, 20, category);
}
const ids = PHASE4375_PUBLICATION_TYPE_TEMPLATES.map(t => t.metadata.id);
const names = PHASE4375_PUBLICATION_TYPE_TEMPLATES.map(t => t.metadata.name);
assert.equal(new Set(ids).size, 320);
assert.equal(new Set(names).size, 320);
assert.ok(PHASE4375_PUBLICATION_TYPE_TEMPLATES.every(t => t.metadata.editable && t.pages.length > 0 && t.pages.every(p => p.elements.length >= 8)));
assert.ok(PHASE4375_PUBLICATION_TYPE_TEMPLATES.every(t => t.metadata.tags.includes("phase 24.3D")));
const allIds = PHASE43_TEMPLATES.map(t => t.metadata.id);
const allNames = PHASE43_TEMPLATES.map(t => t.metadata.name);
assert.equal(new Set(allIds).size, allIds.length);
assert.equal(new Set(allNames).size, allNames.length);
const audit = phase43Audit();
assert.equal(audit.phase4375PublicationTemplateCount, 320);
assert.equal(audit.duplicateTemplateIds, 0);
assert.equal(PHASE43_TEMPLATES.length, 2005);
console.log(JSON.stringify({newTemplates:320,totalTemplates:PHASE43_TEMPLATES.length,categories:expected.length,duplicateIds:0,duplicateNames:0}, null, 2));
