# Phase 84 — Desktop, Offline Sync, and Cross-Platform Foundation

Phase 84 turns the existing Electron shell into a local-first desktop workspace foundation.

## Implemented

- Secure context-isolated desktop bridge for offline project storage.
- Atomic JSON writes inside the operating system user-data directory.
- 25 MB per-project offline safety limit.
- SHA-256 checksums and revision metadata for every local project copy.
- Durable create/update/delete synchronization queue.
- Online/offline state monitoring and renderer notifications.
- Retry/error state preservation for failed synchronization operations.
- Offline backup export to a portable JSON recovery package.
- Conflict-resolution helpers: keep local, keep remote, or duplicate local.
- Desktop & Offline Sync control-center page.
- Windows, macOS, and Linux packaging configuration foundation.

## Security

The renderer never receives direct Node.js or file-system access. All file operations are validated and performed through Electron IPC with context isolation, sandboxing, identifier validation, size limits, and atomic writes.

## External release requirements

Signed installers still require platform credentials: Windows code-signing certificate, Apple Developer ID/notarization credentials, and Linux package signing/repository configuration.
