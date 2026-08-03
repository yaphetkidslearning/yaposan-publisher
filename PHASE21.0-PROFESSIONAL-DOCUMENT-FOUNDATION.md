# Phase 21.0 — Professional Document Foundation

Phase 21.0 adds a migration-safe long-form publication architecture to the real Yaposan editor.

## Included
- Section and chapter manager with add, rename, lock, delete and reorder
- Page-to-section movement with one-owner integrity
- Single, facing, book and magazine view modes
- Arabic, Roman and alphabetic numbering, prefixes, custom starts and continuation
- Left/right page calculation
- Publication metadata and revision tracking
- Search across sections, pages, objects and text
- Publication statistics and JSON production report
- Real editor ribbon integration, navigation and undo-history integration
- Save/load compatibility through the PublisherProject model
- Backward migration from every earlier project without data loss

## Persistence
`PublisherProject.documentFoundation` stores the Phase 21.0 state and `phase21Version` records migration level.

## Validation
Run `npm run verify:phase21.0` after dependencies are installed.
