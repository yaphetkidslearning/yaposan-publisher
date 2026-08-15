# Fix for the three Phase 7 TypeScript import errors

The errors in these files:

- `src/app/editor.tsx:2`
- `src/components/publisher/AssetBrowser.tsx:4`
- `src/components/publisher/PublisherCanvas.tsx:2`

occur when Phase 7 source is copied over a Phase 6 project but Phase 7 dependencies have not been installed.

Run in the project root:

```powershell
npm install
npx tsc --noEmit
```

Or use:

```powershell
.\scripts\install-phase7.ps1
```

Do not copy only `src`. Replace `package.json` and `package-lock.json` as well.
