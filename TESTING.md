# Phase 7 Testing

## Automated validation

```powershell
npm install
npx tsc --noEmit
```

Expected: no TypeScript errors.

## Editor integration checks

1. Open the real editor and select **Icons & Assets**.
2. Search built-in assets and filter every category.
3. Favorite an icon, insert it, and confirm it appears in Recent.
4. Upload a custom SVG and confirm it is inserted and saved under Custom.
5. Upload a logo with **Brand Logo** and confirm it appears under Brand.
6. Rename and delete a custom asset. Existing page objects must remain after library deletion.
7. Close and reopen the app. Custom assets, favorites, and recent history must persist.
8. Generate a QR code and barcode using the styled dialog; test both save-to-library states.
9. Edit SVG fill, stroke, stroke width, size, rotation, flip, opacity, lock, hide, duplicate, delete, and layer order.
10. Replace an SVG and verify x, y, width, and height remain unchanged.
11. Convert SVG primitives and verify the result remains rendered and marked editable.
12. Export a selected SVG.
13. Use the status-bar **SVG** command to export the active page.
14. Export PNG, JPG, and PDF and confirm the SVG objects are visible.
15. Save, close, reopen, and verify all inserted SVG objects reload correctly.
16. On web, drag an SVG file over the editor.
17. On iOS/Android, use Custom SVG or Brand Logo and select an SVG with the system document picker.


## Final completion checks

- On web, iOS, and Android: import an SVG, select it, choose Replace Asset, and confirm position and size remain unchanged.
- Rename a custom or brand asset on each platform and restart the app to confirm persistence.
- Favorite an asset and insert several assets; restart and verify Favorites and Recent remain populated.
- Export a selected SVG and the active page SVG. On mobile, confirm the native share sheet opens with an `.svg` file.
- Convert an SVG containing multiple supported primitives and confirm each resulting vector object can be selected independently.
- Attempt to replace an asset with a non-SVG file and verify a visible validation error.
- Run `npx tsc --noEmit`; expected result: zero errors.

## Dependency verification

Run:

```powershell
npm install
npm run typecheck
```

The three Phase 7 import errors should be gone. Then verify the web bundle:

```powershell
npx expo export --platform web
```

## Asset Library Professional Polish
1. Open **Icons & Assets** and confirm the Assets sidebar opens.
2. Search `vehicle`, `automobile`, and `transport`; confirm the Car asset appears.
3. Test all new category chips, including Medical, Finance, Food, Technology, Transportation, People, Animals, Holiday, Weather, Nature, and Shapes.
4. Select S, M, L, and 1:1 before inserting assets and confirm the created sizes change.
5. Toggle compact/comfortable grid view.
6. Long-press an asset to open its preview/details modal.
7. On web, right-click an asset and test Insert, Favorite, Info, and Close.
8. On web, drag an asset from the sidebar to the editor and confirm it is inserted.
9. Confirm the Quick Insert strip updates after using assets.
10. Restart the app and confirm Favorites, Recent, Custom SVGs, and Brand assets persist.
