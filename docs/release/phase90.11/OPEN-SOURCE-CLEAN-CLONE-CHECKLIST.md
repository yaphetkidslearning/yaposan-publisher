# Open-Source Clean-Clone Checklist

Run this on a clean machine or temporary directory with no copied `.env`, credentials, caches, `node_modules`, build output or untracked local files.

1. Clone the public candidate repository.
2. Follow `README.md` / `INSTALL.md` only.
3. Copy documented example configuration only where required.
4. Run `npm ci` (or the documented package-manager equivalent).
5. Run `npm run typecheck`.
6. Run `npm test`.
7. Run `npm run verify:phase90.11`.
8. Start the local application without production credentials.
9. Confirm missing optional external services fail clearly rather than exposing secrets or breaking unrelated free functionality.
10. Confirm no step depends on files that exist only on a maintainer's workstation.

Record evidence in `release/phase90.11/open-source-certification.json`.
