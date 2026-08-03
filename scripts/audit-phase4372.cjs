const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'templates', 'phase4372PublicationTypeMegaLibrary.ts');
const source = fs.readFileSync(file, 'utf8');
const specs = source.split('\n').filter((line) => line.trim().startsWith('{"id":')).map((line) => JSON.parse(line.trim().replace(/,$/, '')));
const counts = {};
for (const spec of specs) counts[spec.subcategory] = (counts[spec.subcategory] || 0) + 1;
const ids = specs.map((s) => `phase4372-${s.id}`);
const names = specs.map((s) => s.name);
const signatures = specs.map((s) => [s.categoryIndex, s.layout, s.width, s.height, s.orientation, s.kind].join('|'));
const report = {
  phase: '43.7.2',
  templateCount: specs.length,
  expectedCount: 320,
  categoryCount: Object.keys(counts).length,
  expectedCategoryCount: 16,
  templatesPerCategory: counts,
  duplicateIds: ids.length - new Set(ids).size,
  duplicateNames: names.length - new Set(names).size,
  duplicateDesignSignatures: signatures.length - new Set(signatures).size,
  allHaveFourColorPalettes: specs.every((s) => s.palette.length === 4),
  allHaveTwoFontPairings: specs.every((s) => s.fonts.length === 2),
  allHaveHighResolutionPhotoPlaceholders: specs.every((s) => s.photo.includes('w=1800') && s.photo.includes('q=90')),
  allUseEditablePublisherObjects: source.includes('PublisherPage') && source.includes('PublisherElement') && source.includes('editable:true'),
  allHaveLivePagePreviewSource: source.includes('pages:pagesFor(s)'),
  packageVersion: require('../package.json').version,
};
const failed = report.templateCount !== 320 || report.categoryCount !== 16 || report.duplicateIds || report.duplicateNames || report.duplicateDesignSignatures || !report.allHaveFourColorPalettes || !report.allHaveTwoFontPairings || !report.allHaveHighResolutionPhotoPlaceholders || !report.allUseEditablePublisherObjects || !report.allHaveLivePagePreviewSource;
console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);
