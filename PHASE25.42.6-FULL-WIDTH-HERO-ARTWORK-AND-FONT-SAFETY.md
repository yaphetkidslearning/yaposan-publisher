# Phase 25.42.6 — Full-Width Hero Artwork and Font Safety

## Home hero
- Keeps the Phase 25.42.5 hero container size and 3D styling.
- Uses a new 1920 × 400 wide artwork asset designed for the hero ratio.
- Fills the rectangle without blurred side-fill panels.
- Keeps the full tablet and stylus visible.
- Preserves the functional AI prompt and Generate button.

## Project saving reliability
- Guards font-family normalization against non-string legacy values.
- Prevents `fontFamily.trim is not a function` during save and prepress scans.

## Version
25.42.6
