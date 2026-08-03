# Installation

1. Back up the current Yaposan project.
2. Extract this ZIP.
3. Copy its contents into the root of the current Phase 6 project and allow replacement of `src`, `package.json`, and `package-lock.json`.
4. Do not copy `node_modules`, `.expo`, `dist`, or `web-build` from an old backup.
5. Run:

```powershell
npm install
npx tsc --noEmit
npx expo start --web
```

`npm install` is required because Phase 7 uses `react-native-svg`, `qrcode`, and `expo-document-picker`.


## Required Phase 7 dependency

The final package includes `expo-file-system` for native SVG export. Always run `npm install` after copying the replacement package. Then verify with `npx tsc --noEmit`.

## Required dependency repair for the three import errors

If TypeScript reports one error each in `src/app/editor.tsx`, `AssetBrowser.tsx`, and `PublisherCanvas.tsx`, the installed `node_modules` folder is from Phase 6 and does not yet contain the Phase 7 packages.

Run from the Yaposan project root:

```powershell
npm install
npx tsc --noEmit
```

Or run:

```powershell
.\scripts\install-phase7.ps1
```

The required packages are declared in `package.json`:

- `expo-document-picker`
- `react-native-svg`
- `expo-file-system`
- `expo-sharing`

Do not copy only the `src` folder. Copy `package.json` and `package-lock.json` too, then run `npm install`.
