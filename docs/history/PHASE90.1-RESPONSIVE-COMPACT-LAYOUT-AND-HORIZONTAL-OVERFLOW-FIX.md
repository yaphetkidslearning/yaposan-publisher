# Phase 90.1 — Responsive Compact Layout and Horizontal Overflow Fix

## Changes

- Retains the Phase 90 compact desktop appearance at normal browser zoom.
- Removes the `125%` document width that pushed the right side outside the viewport.
- Keeps the web document at `width: 100%` and `max-width: 100%`.
- Adds horizontal-overflow guards for the HTML root, body, Expo/React Native Web root, media, and nested flex children.
- Keeps tablet and mobile layouts at their normal scale.
- Preserves the Phase 90 Backspace/text-editing correction.

## Expected result

At 100% browser zoom, the desktop application remains compact while the full right side stays visible without horizontal clipping.
