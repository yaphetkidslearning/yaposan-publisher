# Phase 8 - Professional File Management

Implemented directly in the production editor:

- New, open, save, autosave, Save As, rename, duplicate, import and export
- Strict `.yaposan` validation and format-version compatibility checks
- Search and sorting by recent, name and page count
- Project folders and folder filtering
- Favorites/pinned projects
- Project preview cards generated from publication metadata
- Recycle Bin with restore, permanent delete and Empty Trash
- Local storage usage and project/version statistics
- Automatic capped version history (20 snapshots per project)
- Restore any saved or autosaved project version
- Crash/recovery snapshot storage
- Cross-platform project opening through My Projects
- Browser leave-page protection with an autosave flush
- Permanent autosave updates in the project library
- Blank-project restore support

Verification: `npx tsc --noEmit` returns 0 errors.
