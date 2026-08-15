import { existsSync, readFileSync } from "node:fs";
const read = (p) => readFileSync(p, "utf8");
const required = ["package.json","package-lock.json",".env.example","LICENSE","CONTRIBUTING.md","SECURITY.md","CODE_OF_CONDUCT.md",".github/PULL_REQUEST_TEMPLATE.md",".github/dependabot.yml","scripts/create-source-release.mjs","release/phase90.17/open-source-release-evidence.json","PHASE90.17-OPEN-SOURCE-RELEASE-FINALIZATION.md"];
for (const f of required) if (!existsSync(f)) throw new Error(`Missing Phase 90.17 open-source release file: ${f}`);
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const lockRoot = lock.packages?.[""] ?? {};
for (const section of ["dependencies","devDependencies","optionalDependencies"]) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    if (!(name in (lockRoot[section] ?? {}))) throw new Error(`Lockfile root missing ${section}.${name}`);
    if (lockRoot[section][name] !== version) throw new Error(`Lockfile root mismatch for ${section}.${name}`);
  }
}
const env = read(".env.example");
for (const key of ["EXPO_PUBLIC_API_URL","DATABASE_URL","AI_CREDENTIAL_ENCRYPTION_KEY","STRIPE_SECRET_KEY"]) if (!env.includes(`${key}=`)) throw new Error(`.env.example missing ${key}`);
const evidence = JSON.parse(read("release/phase90.17/open-source-release-evidence.json"));
if (Object.values(evidence.externalEvidence ?? {}).some(Boolean)) throw new Error("External open-source evidence must not be pre-certified");
console.log("Phase 90.17 open-source release automated baseline passed; external repository evidence remains required.");
