import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const failures = [];
const required = [
  "src/app/editor.tsx",
  "src/components/publisher/EditorToolbar.tsx",
  "src/utils/collaborationVersionControlEngine.ts",
  "tests/phase230-collaboration-version-control.test.ts",
  "tests/phase231-branching-release-control.test.ts",
  "tests/phase232-release-governance.test.ts",
  "tests/phase233-editor-ui-polish.test.ts",
  "tests/phase234-final-ui-certification.test.ts",
  "tests/phase235-final-completion.test.ts",
];
for (const file of required) if (!existsSync(join(root, file))) failures.push(`Missing required file: ${file}`);

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const sourceFiles = walk(join(root, "src")).filter((file) => /\.(ts|tsx)$/.test(file));
const userFacingPhase = /(?:<Text[^>]*>|showEditorNotice\(|Alert\.alert\()[^\n]{0,180}?\bPhase\s+\d+(?:\.\d+)?/i;
for (const file of sourceFiles) {
  const text = readFileSync(file, "utf8");
  if (/\bTODO\b|\bFIXME\b|not implemented/i.test(text)) failures.push(`Unfinished marker remains in ${relative(root,file)}`);
  if (userFacingPhase.test(text)) failures.push(`User-facing internal phase label remains in ${relative(root,file)}`);
}
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
if (pkg.version !== "23.5.0") failures.push(`Expected package version 23.5.0, found ${pkg.version}`);
for (const script of ["test:phase23.5", "audit:phase23.5", "verify:phase23.5"]) if (!pkg.scripts?.[script]) failures.push(`Missing package script: ${script}`);
if (!pkg.scripts?.["verify:phase23.5"]?.includes("verify:phase22")) failures.push("Final verification does not include the Phase 22 regression chain");
if (!pkg.scripts?.["verify:phase23.5"]?.includes("expo export --platform web")) failures.push("Final verification does not include web export");

if (failures.length) {
  console.error("Phase 23.5 production audit failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Phase 23.5 production audit passed (${sourceFiles.length} TypeScript source files checked).`);
