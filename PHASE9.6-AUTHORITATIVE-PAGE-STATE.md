# Phase 9.6 - Authoritative Page State

This stabilization removes the final split between the immediate page-command state and the delayed React render snapshot.

## Corrected

- Page-sensitive UI reads one authoritative project snapshot.
- Add, Duplicate, Delete, and Select update the same project snapshot.
- Pages sidebar, thumbnail list, footer count, active canvas page, and status bar update together.
- Page mutations clone the project and pages array before commit.
- The UI revision forces a page-area render after every atomic page command.
- Page selection no longer depends on a delayed functional state callback.

## Expected duplicate result

- Two thumbnails are visible.
- Footer says `2 pages`.
- Status bar says `Page 2 of 2`.
- The copied page is active.
