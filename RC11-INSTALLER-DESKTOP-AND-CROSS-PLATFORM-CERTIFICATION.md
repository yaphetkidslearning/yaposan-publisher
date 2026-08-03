# RC11 — Installer, Desktop, and Cross-Platform Certification

RC11 replaces optimistic desktop readiness with evidence-based certification.

## Completed
- Added signing, notarization, update-feed, and artifact checks for Windows, macOS, and Linux.
- Added single-instance enforcement and second-launch focus behavior.
- Blocked untrusted in-app navigation and denied permission requests by default.
- Restricted external opening to HTTPS destinations.
- Added `.yaposan` project and `.ypt` template file associations.
- Added the `yaposan://` desktop protocol registration.
- Added bounded file-association validation.
- Updated release labels to `1.0.0-rc.11`.

## Requires real platform builders
Actual EXE/MSI/DMG/AppImage/DEB creation, code signing, Apple notarization, SmartScreen reputation, Gatekeeper assessment, and auto-update installation must be validated on their native build hosts with real credentials.
