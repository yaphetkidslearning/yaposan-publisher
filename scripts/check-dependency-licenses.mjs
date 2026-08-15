import fs from 'node:fs';
import path from 'node:path';

const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const packages = lock.packages || {};
const missingMetadata = [];
const unlicensed = [];
const seeLicenseMissing = [];

for (const [location, meta] of Object.entries(packages)) {
  if (!location || !location.startsWith('node_modules/') || !meta || meta.link) continue;
  const name = location.replace(/^node_modules\//, '');
  const installedManifest = path.join(location, 'package.json');
  let license = meta.license;
  let manifest;
  if (fs.existsSync(installedManifest)) {
    try {
      manifest = JSON.parse(fs.readFileSync(installedManifest, 'utf8'));
      license = manifest.license ?? manifest.licenses ?? license;
    } catch {}
  }
  if (!license) {
    missingMetadata.push(name);
    continue;
  }
  const normalized = Array.isArray(license)
    ? license.map((x) => typeof x === 'string' ? x : x?.type).filter(Boolean).join(' OR ')
    : typeof license === 'object' ? license.type : String(license);
  if (/^UNLICENSED$/i.test(normalized || '')) unlicensed.push(name);
  const match = /^SEE LICENSE IN (.+)$/i.exec(normalized || '');
  if (match && fs.existsSync(location) && !fs.existsSync(path.join(location, match[1]))) {
    seeLicenseMissing.push(`${name} (${match[1]})`);
  }
}

if (missingMetadata.length) {
  console.warn(`Warning: ${missingMetadata.length} lockfile package(s) do not expose license metadata in the lockfile${fs.existsSync('node_modules') ? ' or installed manifest' : ''}.`);
  console.warn('These require normal release-time dependency/license review; absence of lockfile metadata alone is not treated as a license violation.');
}
if (unlicensed.length || seeLicenseMissing.length) {
  if (unlicensed.length) console.error(`Explicitly UNLICENSED dependencies: ${unlicensed.join(', ')}`);
  if (seeLicenseMissing.length) console.error(`Dependencies reference missing license files: ${seeLicenseMissing.join(', ')}`);
  process.exitCode = 1;
} else {
  console.log('Dependency license metadata check found no explicit UNLICENSED package or broken SEE LICENSE IN reference.');
}
