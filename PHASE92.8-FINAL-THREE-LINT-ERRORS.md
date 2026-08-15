# Phase 92.8 — Final Three Lint Errors

Phase 92.8 targets the final three lint errors reported after Phase 92.7.1 while preserving the Publisher font-family expansion.

## Fixes

- Moves Phase 42 evidence ID entropy outside the React component render scope.
- Removes manual `useMemo` wrapping around the Publisher page PanResponder so React Compiler does not need to preserve a mutable gesture closure.
- Preserves all Phase 92.7.1 Publisher font catalog and searchable font-dropdown functionality.

## Verification

Run `npm run verify:phase92.8`. Production push is allowed only after this command exits 0.
