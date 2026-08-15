# Phase 23.1 — Advanced Branching, Release Channels & Controlled Merge

Phase 23.1 extends the Phase 23.0 collaboration and version-control foundation with real parallel project workspaces and auditable branch operations inside the production editor.

## Integrated functionality

- Automatic backward-compatible migration from Phase 23.0 to a protected **Main** branch
- Independent branch workspaces containing real project snapshots
- Create branches from the current project or a selected immutable version
- Switch branches while automatically preserving the current branch snapshot
- Save active branch snapshots without creating fake server operations
- Object-level branch comparison using the existing deterministic diff engine
- Merge any non-active branch into the active branch
- Three-way conflict detection and deterministic incoming/local resolution strategy
- Auditable merge records with source, target, author, strategy, conflict count, timestamp, and result hash
- Release channels: development, review, staging, and production
- Branch archive controls with protection for Main and the active branch
- Branch integrity hashes included in Phase 23 certification
- Branch-aware certification report schema version 2
- Full editor integration under **Review → Phase 23.1 Branch Control**
- Complete automated tests for migration, isolation, comparison, merge history, protection, and certification

## Backward compatibility

Existing Phase 23.0 projects open without manual migration. If no branches exist, Phase 23.1 creates a Main branch from the current project and preserves all immutable versions, imported change sets, and prior certification data.

## Verification

```powershell
npm install
npx tsc --noEmit
npm run verify:phase22
npm run test:phase23.0
npm run test:phase23.1
npm run verify:phase23.1
```
