# Phase 25.42.6.2 — Publisher Canvas Text Style Safety

## Fixed
- Prevents non-string `fontFamily` values from reaching React Native `Text` and `TextPathRenderer` styles.
- Trims valid font-family strings and falls back to the platform default for invalid legacy values.
- Validates `textPathMode` before rendering curved text.
- Applies the web-only `textIndent` style only on web.

## Scope
This is an error-fix release based on Phase 25.42.6.1. No template redesign work is included; that remains planned for Phase 25.42.7.
