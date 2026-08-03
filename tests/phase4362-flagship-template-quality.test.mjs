import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const flagship = fs.readFileSync(new URL('src/templates/phase4362FlagshipTemplates.ts', root), 'utf8');
const ecosystem = fs.readFileSync(new URL('src/templates/phase43ProfessionalTemplateEcosystem.ts', root), 'utf8');
const screen = fs.readFileSync(new URL('src/app/template-ecosystem.tsx', root), 'utf8');

test('Phase 43.6.2 provides twenty flagship templates in four collections', () => {
  assert.match(flagship, /PHASE4362_FLAGSHIP_TEMPLATES/);
  assert.match(flagship, /Business Flyers/);
  assert.match(flagship, /Business Cards/);
  assert.match(flagship, /Brochures/);
  assert.match(flagship, /Presentations/);
  assert.match(flagship, /qualityScore:100/);
});

test('Flagship templates contain rich editable compositions and multi-page decks', () => {
  assert.match(flagship, /PublisherElement/);
  assert.match(flagship, /pages:\[page\(id\+"-cover"/);
  assert.match(flagship, /Tri-fold Brochure/);
  assert.match(flagship, /Business Card/);
  assert.match(flagship, /commercial quality/);
});

test('Template ecosystem replaces matching categories and renders flagship previews', () => {
  assert.match(ecosystem, /PHASE4362_BY_CATEGORY/);
  assert.match(screen, /flagshipMini/);
  assert.match(screen, /Flagship premium templates/);
  assert.match(screen, /Flagship quality score/);
});
