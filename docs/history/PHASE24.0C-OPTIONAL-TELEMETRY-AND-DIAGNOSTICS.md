# Phase 24.0C — Optional Telemetry & Diagnostics

Version: 24.0.3

Phase 24.0C adds a privacy-first diagnostics system to the production desktop runtime and the real Publisher editor.

## Completed

- Telemetry disabled by default
- Separate consent for crash reports, performance metrics, and anonymous feature usage
- No document content, imported assets, names, or email addresses in telemetry
- Local bounded event queue with a maximum of 500 events
- Sanitized event names and primitive metadata only
- Electron crash and unhandled-rejection capture, gated by consent
- Diagnostics Center in Review → Final Release
- Review, export, and erase local diagnostics data
- Web-safe in-memory fallback
- Manual diagnostic event
- Accessible home prompt contrast fix
- Automated tests and production audit

## Verification

```bash
npm install
npm run verify:phase24.0c
```

Telemetry is optional. The master consent switch and every category are off on first launch.
