# Phase 9.1 - Editor Regression Fix

Phase 9.1 restores reliable contextual editor controls after project recovery, replacement, duplication, page switching, undo/redo, or import.

## Corrected

- Removes stale selected-element IDs whenever the active page or its elements change.
- Keeps the ribbon, Properties panel, and status bar synchronized to the same real selection.
- Prevents the UI from displaying “1 selected” when no matching object exists.
- Restores Picture Format controls when an actual image is selected.
- Restores Table Tools and other contextual commands after recovered projects open.
- Keeps selection cleanup automatic without changing valid multi-selection behavior.
- Rewrites generated `package-lock.json` download URLs to the public npm registry so local `npm install` does not attempt to use an inaccessible internal registry.

## Verification

Run:

```powershell
npm install
npx tsc --noEmit
npm start
```

Select the photo placeholder/image. The Properties panel should switch to Object and Picture Format commands should become active.
