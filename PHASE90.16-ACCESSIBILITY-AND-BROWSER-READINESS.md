# Phase 90.16 - Accessibility and Browser Readiness

Phase 90.16 hardens the release baseline for the two Phase 90.11 gates that require accessibility and browser evidence.

## Implemented safeguards

- Global `:focus-visible` treatment for keyboard-operable web controls.
- `prefers-reduced-motion: reduce` handling for animations, transitions, and smooth scrolling.
- Windows forced-colors/high-contrast focus treatment.
- Explicit English document language remains present in `+html.tsx`.
- The Accessibility page exposes a main landmark and a labeled route to the Help center.
- A versioned evidence template records browser and WCAG checks without falsely marking manual checks as complete.
- Phase 90.14/90.15 hydration-safe SEO and static export behavior remains unchanged.

## Certification boundary

This phase does **not** self-certify WCAG 2.2 AA or the browser/platform matrix. Those release gates require real manual evidence for keyboard-only navigation, screen readers, contrast, zoom/reflow, touch targets, Chrome, Edge, Firefox, Safari, iOS Safari, Android Chrome, touch/high-DPI, and resize/orientation behavior.

## Verification

Run:

```bash
npm run verify:phase90.16
```

A passing command confirms the automated Phase 90.16 baseline. It does not convert the external Phase 90.11 accessibility/browser gates to PASS until the evidence fields are completed from actual testing.
