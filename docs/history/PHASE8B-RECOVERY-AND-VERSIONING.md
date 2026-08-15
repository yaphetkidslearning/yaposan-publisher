# Phase 8B - Recovery and Versioning

Implemented directly in the production editor and project library.

## Recovery
- Separate recovery snapshot for every project
- Recovery index for multiple projects
- Newer-recovery detection when a project opens
- Restore or discard recovered work
- Recovery records cleared after a successful save

## Backups
- Automatic backups configurable to 5, 10, or 30 minutes
- Enable or disable automatic backups
- Manual Backup Now action
- Per-project backup retention
- Restore and delete individual backups

## Version history
- Automatic save history
- Named manual versions
- Preview a version
- Compare page count, object count, and project name to the current project
- Rename, export, restore, and delete versions
- Current state preserved before restoring an older version
- Version History available from the File ribbon and every project card

## Verification
`npx tsc --noEmit` returns 0 errors.
