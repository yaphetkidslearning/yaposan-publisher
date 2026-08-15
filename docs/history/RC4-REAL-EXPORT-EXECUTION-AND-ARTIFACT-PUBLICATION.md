# Yaposan Publisher v1.0.0 RC4 — Real Export Execution and Artifact Publication

## Completed in RC4
- Replaced the manifest-only export worker completion path with real artifact execution.
- Added dependency-free local rendering for valid PDF, SVG, and HTML outputs.
- Added project payload support for supplied HTML and SVG content, with safe fallback snapshots.
- Added deterministic SHA-256 checksums from the actual rendered bytes.
- Published both the primary artifact and its JSON manifest through the configured object-storage adapter.
- Added cleanup rollback when the primary upload succeeds but manifest publication fails.
- Added a reusable storage factory for local development and Cloudflare R2 production publication.
- Added explicit errors for S3 and Azure drivers because those adapters are not implemented.
- Added worker heartbeat renewal during long-running jobs.
- Added configurable worker polling, lease duration, worker identity, and local storage root.
- Added production validation requiring R2 when durable export workers are enabled.
- Updated the health endpoint and package version to `1.0.0-rc.4`.

## Validation performed
Focused RC2-RC4 and backend regression suites passed locally:

- Phase 69 cloud backend
- Phase 71 billing and AI platform
- Phase 73 collaboration and export platform
- Phase 75 security and launch certification
- RC2 backend authorization and R2 signing
- RC3 distributed collaboration and export leasing
- RC4 export rendering, publication, rollback, and unsupported-renderer controls

Result: **27 passed, 0 failed**.

## Works locally without external credentials
- PDF snapshot export.
- SVG export from supplied SVG or a safe project-title fallback.
- HTML export from supplied HTML or a project payload snapshot.
- Local primary-artifact and manifest storage.
- Artifact checksums, result metadata, worker heartbeats, failure handling, and partial-upload rollback.

## Requires real hosting or credentials
- Cloudflare R2 publication requires a real endpoint, bucket, access key, secret, and optional public asset base URL.
- PNG, JPEG, WebP, TIFF, AVIF, PDF/X, PDF/A, ZIP, video, GIF, and audio formats require production renderer integrations and are intentionally rejected until configured.
- Advanced PDF fidelity, embedded fonts, color profiles, transparency flattening, animation frames, and audio mixing require dedicated renderer binaries or services.
- End-to-end R2 publication and download must be validated against the real production bucket.

## Build environment limitation
The sandbox still has no installed npm dependency tree and cannot access the package registry. Full TypeScript and Expo web validation must run in CI or a workstation with registry access:

```bash
npm ci
npm run audit:rc4
```

RC Step 4 is complete for real basic export execution and object-storage publication. Advanced format renderers and credentialed R2 deployment validation remain blocked until the required binaries, services, and credentials are supplied.
