# Yaposan Publisher v1.0.0 RC6 — Controlled External Media Rendering

## Completed in RC6
- Added dependency-free PCM WAV export with a valid RIFF/WAVE header.
- Added a controlled FFmpeg adapter for JPEG, WebP, TIFF, AVIF, GIF, MP4, WebM, and MP3.
- External binaries are invoked directly with `spawn`, `shell: false`, an isolated temporary working directory, and fixed argument construction.
- Added renderer execution timeouts and forced termination for stalled processes.
- Added bounded image dimensions, frame rates, durations, stderr capture, empty-output rejection, checksum generation, and existing artifact-size enforcement.
- Added automatic temporary-file cleanup whether rendering succeeds or fails.
- Kept external media formats disabled unless an absolute trusted `FFMPEG_PATH` is configured.
- Added `FFMPEG_PATH` and `RENDERER_TIMEOUT_MS` production environment settings.
- Updated package, health, and worker labels to `1.0.0-rc.6`.

## Supported without external binaries
- PDF, SVG, sanitized HTML, PNG, portable ZIP, and PCM WAV.

## Supported when FFmpeg is configured
- JPEG, WebP, TIFF, AVIF, GIF, MP4, WebM, and MP3.

## Security behavior
- No shell command construction or interpolation.
- No user-provided executable path or arbitrary command arguments.
- Temporary inputs and outputs are isolated per export job.
- Renderer execution is time-limited to 1–900 seconds.
- Failed, empty, or oversized outputs are not published.

## Validation performed
Combined RC2–RC6 and backend regression suites were executed locally:
- 39 tests passed.
- 0 tests failed.

The suite verifies WAV structure, missing-renderer rejection, direct process invocation, publication, checksums, and every externally supported media format through a controlled fake renderer.

## Still requires hosted validation
- Real FFmpeg codec availability in the production container or worker host.
- Visual and audio fidelity against real projects, fonts, animation timelines, and audio tracks.
- Hardware acceleration and worker capacity testing.
- PDF/X and PDF/A conformance tooling.
- Credentialed Cloudflare R2 publication testing.
- Full `npm ci`, TypeScript validation, and Expo production web build in an environment with npm registry access.

## Production commands
```bash
npm ci
npm run audit:rc6
```
