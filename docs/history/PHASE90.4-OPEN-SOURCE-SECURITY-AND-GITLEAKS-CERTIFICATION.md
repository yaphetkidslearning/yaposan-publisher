# Phase 90.4 — Open Source Security and Gitleaks Certification

## Purpose

Phase 90.4 adds a narrow, documented Gitleaks false-positive allowlist and a repeatable full-Git-history verification command for the Yaposan Publisher open-source release process. It does not rewrite Git history and does not change application behavior.

## Phase 90.3 baseline

This package is based on the supplied Phase 90.3 source archive. The Phase 90.3 application is preserved; Phase 90.4 changes are limited to the security configuration, verification tooling, package command, ignore rules, and this certification document.

The repository baseline supplied by the project owner was:

- Phase 90.3 commit: `50e8e77` — `Phase 90.3 - Add SEO and open-source community foundation`
- Gitleaks version in the owner's local environment: `8.30.1`
- Prior full-history scan: 15 commits scanned, 25 findings reviewed as false positives
- Git history must not be rewritten

## Files added or updated

- `.gitleaks.toml` — extends the Gitleaks default rules and permits only reviewed Yaposan false-positive patterns.
- `.gitignore` — prevents `gitleaks-report.json` and `gitleaks-full-report.json` from being committed.
- `scripts/verify-phase90.4.mjs` — validates the Phase 90.4 configuration and runs the full Git-history scan.
- `package.json` — adds `npm run verify:phase90.4`.
- `PHASE90.4-OPEN-SOURCE-SECURITY-AND-GITLEAKS-CERTIFICATION.md` — this document.

## Allowlist policy

The allowlist is intentionally narrow. It covers only the false-positive families already reviewed for Yaposan:

- `yaposan.*` AsyncStorage/application persistence keys
- fixed RC7/RC8 test literal `0123456789abcdef0123456789abcdef`
- Phase 56 capability literal `PHASE56_CAPABILITIES`
- deployment placeholders beginning with `REPLACE_WITH_`
- public application URLs `https://app.yaposan.com` and `https://api.yaposan.com`

Markdown escaping from the planning notes was normalized into valid regular expressions. Literal dots in Yaposan prefixes and public hostnames are escaped, and the deployment placeholder expression is constrained to `REPLACE_WITH_...` so the allowlist is not broader than necessary.

## Required verification

Run the verification from the real Git checkout, not from this ZIP:

```bash
npm run verify:phase90.4
```

The script executes the required scan:

```bash
gitleaks git . --config .gitleaks.toml
```

A successful run exits with status `0` and prints that the Phase 90.4 Gitleaks certification passed.

If findings remain, the command exits non-zero. **Do not broaden the allowlist.** Inspect only the remaining findings and classify each one individually.

## Optional static package check

A source ZIP does not include `.git`, so it cannot perform a full-history certification by itself. To validate only the Phase 90.4 file wiring after extraction, run:

```bash
node scripts/verify-phase90.4.mjs --check-only
```

This checks the expected allowlist entries and the two required `.gitignore` rules without pretending to certify Git history.

## Local report safety

The following report files are local-only and must never be committed:

```text
gitleaks-report.json
gitleaks-full-report.json
```

## Certification criteria

Phase 90.4 is certified when all of the following are true:

1. The scan is executed from the real Yaposan Git repository containing its full history.
2. `.gitleaks.toml` is used with the default Gitleaks rules extended.
3. `gitleaks git . --config .gitleaks.toml` exits with status `0`.
4. No unreviewed finding is added to the allowlist merely to make the scan pass.
5. Git history is not rewritten.
6. Gitleaks JSON reports remain untracked/local-only.

## Gitleaks 8.30.1 note

The project owner reported Gitleaks `8.30.1`. Because secret-scanning tools can have version-specific regressions, record the exact binary/version used for the final certification and treat an unexpectedly empty scan as something to validate rather than as proof by itself. The verification script prints the detected Gitleaks version before scanning.

## Release status of this ZIP

This Phase 90.4 ZIP contains the complete supplied Phase 90.3 application plus the Phase 90.4 security additions. The ZIP itself does not contain `.git`, so the full-history result must be produced in the owner's actual repository before claiming final Git-history certification.
