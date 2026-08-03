# Phase 25.36.1 — Template Syntax Fix

## Fixed

- Corrected the invalid invoice document-number string in `src/templates/phase2529CategoryCompletionLibrary.ts`.
- Replaced the malformed quoted interpolation with a valid template literal.
- The generated document number now follows the intended format, such as `#2501`.
- Updated the project version to `25.36.1`.

## Corrected expression

```ts
`#25${String(variant + 1).padStart(2, "0")}`
```
