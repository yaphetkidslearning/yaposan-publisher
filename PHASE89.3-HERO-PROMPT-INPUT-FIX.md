# Phase 89.3 - Hero Prompt Input Fix

## Updated
- Replaced the non-editable transparent hero hotspot with a real `TextInput`.
- Added a functional Generate button and Enter/Return submission.
- Kept the compact prompt bar anchored to the lower-right of the hero artwork.
- Disabled Generate when the prompt is empty.
- Passes the entered prompt to Yaposan AI through the route query.
- Yaposan AI now loads the submitted Home-page prompt into its composer.
- Added responsive behavior so the prompt bar spans safely on narrow screens.

## Files
- `src/app/index.tsx`
- `src/app/ai.tsx`
