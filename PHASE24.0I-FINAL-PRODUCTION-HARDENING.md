# Phase 24.0I — Final Production Hardening

Phase 24.0I closes the locally implementable gaps identified after Phase 24.0D-H.

## Added

- signed-license envelope verification using WebCrypto and a public key
- import extension, MIME, and 250 MB size validation
- archive path traversal, entry-count, and expanded-size protections
- HTML and SVG active-content sanitization
- external URL protocol allowlisting
- exact project save/reopen round-trip validation
- actual 1,000-page / 10,000-element Node performance benchmark
- deterministic save/reopen and export-artifact smoke workflow
- source security scan and JSON report
- searchable documentation index generation
- combined production audit and verification command

## Commands

```bash
npm run verify:phase24.0i
```

Reports are written to `release/`.

## External production dependencies

The client verifies signed licenses, but issuance, payment, subscription renewal, code signing, notarization, and hosted update delivery require private production infrastructure and secrets. Those secrets must never be embedded in the distributed source package.
