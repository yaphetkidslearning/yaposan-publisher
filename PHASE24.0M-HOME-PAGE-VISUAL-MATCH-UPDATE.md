# Phase 24.0M Home Page Visual Match Update

Updated `src/app/index.tsx` to match the approved professional home-page reference more closely.

## Corrected
- Desktop breakpoint now keeps the full three-workspace layout and Pro card visible at common laptop widths.
- Sidebar width, navigation density, quick actions, and upgrade card resized to match the reference.
- Header, search, profile controls, hero banner, AI prompt, and 3D Generate button resized.
- Publisher, Photo Studio, and Yaposan AI cards now fit on one row with the Pro panel.
- Publication shortcuts and recent-project cards use the compact proportions shown in the approved design.
- Existing Phase 24 routes and feature engines remain unchanged.

## Validation note
The source archive does not include `node_modules`. Run `npm install` followed by `npx tsc --noEmit` after extraction.
