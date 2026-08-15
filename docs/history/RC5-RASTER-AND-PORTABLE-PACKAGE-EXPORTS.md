# Yaposan Publisher v1.0.0 RC5 — Raster and Portable Package Exports

## Completed in RC5
- Added dependency-free PNG rendering with valid PNG signature, IHDR, compressed RGBA scanlines, CRC-validated chunks, and configurable dimensions.
- Added a 16,777,216-pixel safety ceiling to prevent oversized raster allocations.
- Added portable ZIP exports containing `index.html`, `project.json`, and `README.txt`.
- Added a dependency-free ZIP writer with local headers, central directory records, CRC-32 checksums, and end-of-central-directory metadata.
- Added active-content sanitization for supplied HTML and SVG exports, removing scripts, iframes, event handlers, JavaScript URLs, SVG foreign objects, and remote SVG references.
- Added a 64 MiB final artifact ceiling before publication.
- Extended local production export support from PDF, SVG, and HTML to PDF, SVG, HTML, PNG, and ZIP.
- Updated package and worker version labeling to `1.0.0-rc.5`.

## Validation performed
Focused RC2-RC5 and backend regression suites were executed locally.

RC5 specifically verifies:
- PNG structure and requested dimensions.
- Raster allocation limits.
- ZIP structure and expected package entries.
- HTML and SVG active-content sanitization.
- PNG artifact and manifest publication.

## Works locally without external credentials
- PDF snapshot export.
- SVG export.
- Sanitized HTML export.
- PNG raster export.
- Portable ZIP web package export.
- Local primary-artifact and manifest publication.

## Still requires production renderer infrastructure
- JPEG, WebP, TIFF, and AVIF encoders.
- PDF/X-1a, PDF/X-4, and PDF/A conformance validation.
- MP4, WebM, GIF, WAV, and MP3 processing through FFmpeg or equivalent services.
- Advanced design fidelity, font embedding, ICC conversion, transparency flattening, animation frames, and audio mixing.
- Credentialed Cloudflare R2 end-to-end deployment testing.

## Full build command
In a workstation or CI environment with npm registry access:

```bash
npm ci
npm run audit:rc5
```
