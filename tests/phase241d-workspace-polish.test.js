const fs = require('fs');
const assert = require('assert');
const source = fs.readFileSync('src/components/workspace/WorkspaceDashboard.tsx','utf8');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
assert.equal(pkg.version,'24.1.3');
for (const token of ['breadcrumbs','favorites','lastOpened','toggleFavorite','cardInteractive','No matching tools','Clear search','Phase 24.1D professional workspace']) assert.ok(source.includes(token), `Missing ${token}`);
assert.ok(fs.existsSync('PHASE24.1D-PROFESSIONAL-WORKSPACE-POLISH.md'));
console.log('Phase 24.1D professional workspace polish verification passed');
