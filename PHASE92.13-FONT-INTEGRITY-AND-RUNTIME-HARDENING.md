# Phase 92.13 — Font Integrity and Runtime Hardening

This release is a focused follow-up audit of the 92.12 font pipeline.

## Fixes

- Runtime font records now override catalog placeholders when family names collide, so an imported or installed font is no longer hidden by the built-in catalog entry.
- Missing-font replacement candidates must pass the same text-compatibility gate used by the Font Manager instead of receiving an automatic compatibility bonus merely for being local/project fonts.
- TrueType/OpenType `cmap` format 4 parsing now honors glyph mappings and excludes `.notdef` mappings instead of treating whole segment ranges as guaranteed glyph coverage.
- `cmap` format 12 parsing now excludes a leading `.notdef` mapping when the group starts at glyph id 0.
- Font-file parsing validates TTC offsets before table access.
- UTF-16BE name decoding now safely falls back when a JavaScript runtime does not provide that TextDecoder encoding.
- Glyph coverage checks ignore Unicode layout controls, ZWJ/ZWNJ, bidi controls, and variation selectors that do not require visible glyphs from the selected typeface.

## Remaining platform limitation

Installed-font files are not exposed consistently on every React Native/browser platform. Exact glyph coverage is therefore strongest for imported/embedded fonts, where Yaposan owns the bytes and can inspect the real cmap table.
