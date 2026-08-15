# Phase 92.12 — Font Reliability & Prepress Completion

Phase 92.12 hardens the Publisher font workflow so the larger multilingual catalog behaves like a production publishing system rather than a list of font names.

## Implemented

- Added a dependency-free OpenType/TrueType inspector for imported TTF/OTF/TTC files.
- Reads family/subfamily/PostScript/version naming, OS/2 weight/width and embedding permissions, cmap Unicode coverage, and fvar variable-font axes.
- Imported fonts are converted to durable data URIs on web and native instead of retaining temporary picker/cache URIs.
- Restricted-embedding fonts are rejected during project embedding with a clear licensing message.
- Embedded font metadata is persisted with the publication and preserved by project normalization.
- Compatibility checks prefer exact Unicode cmap coverage for imported fonts and browser glyph checks where available.
- Removed the unsafe assumption that every local/project font supports every script and that generic Noto Sans covers every writing system.
- Fixed Missing Fonts so document fonts absent from the catalog still appear as synthetic recoverable entries.
- Added runtime status badges: Embedded, Installed, Available, Catalog only, Missing.
- Added one-click Replace for missing document fonts using script/category-aware replacement ranking.
- Native runtime availability no longer treats every catalog entry as installed.
- Font Manager exposes real variable axes, embedding permissions, detected script coverage, and imported face metadata.
- Fixed the Font Manager footer top-border color bug.
- PDF validation now reports or blocks non-embedded text fonts that would otherwise be silently substituted; restricted embedded fonts are rejected.

## Scope note

True PDF font subsetting and outlining restricted fonts require deeper PDF renderer work and remain a later prepress task. Phase 92.12 prevents silent substitution and makes embedding requirements explicit.
