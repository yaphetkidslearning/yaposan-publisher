# Phase 91.7 Pure White Certification

A photo passes strict catalog-white mode only when every pixel outside the foreground alpha region is exact **RGB(255,255,255)**.

Strict mode:
- uses the `pure-white-catalog` preset;
- disables preserved/generated shadows by default;
- audits the finished white composite;
- reports compliance and non-white background pixel count;
- sends failures to REVIEW instead of silently accepting them.

The audit does not require semi-transparent product-edge pixels to be white; those pixels belong to the foreground matte and are preserved to avoid destroying real product edges.
