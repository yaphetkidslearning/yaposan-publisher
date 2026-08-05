# Phase 78 — Authentication, Guest Mode, Cloud Save, and Plan Enforcement

## Production behavior

- Visitors may browse, open the editor, create designs, and keep temporary local recovery copies.
- Guest toolbar status is **Saved locally**.
- Guest Save opens a real email/password sign-in or registration flow.
- Guest Export opens account creation/sign-in and resumes the requested action after authentication.
- Signed-in Save writes a local recovery copy and then creates or updates the project through `/api/v1/projects`.
- Signed-in toolbar status changes to **Saved to cloud** or **Cloud changes pending**.
- The home header shows **Sign In** and **Get Started** for guests instead of a hard-coded profile.
- The account page requires authentication and includes Sign Out.

## Enforcement

Server-side usage authorization was added so limits cannot be bypassed only by changing browser code.

Initial limits:

| Plan | Cloud projects | Exports/month | AI/day |
|---|---:|---:|---:|
| Free | 10 | 20 | 5 |
| Professional | 100 | 500 | 100 |
| Professional Plus | 1,000 | 5,000 | 500 |
| Enterprise | 100,000 | 100,000 | 5,000 |

Free exports: PNG, JPG, standard PDF. Higher plans unlock additional formats.

New API routes:

- `GET /api/v1/usage/status`
- `POST /api/v1/usage/authorize-export`

Project creation, AI generation, direct PNG/JPG/PDF export, and Export Manager operations are checked against server-side plan limits.

## Security note

The existing backend uses bearer access and refresh tokens. Phase 78 persists the session through AsyncStorage so Expo web/native can restore it. A future hardening phase can move the web refresh token to an HttpOnly same-site cookie once the API supports cookie sessions.

## Validation

All modified TypeScript/TSX files passed TypeScript parser/transpilation diagnostics. Full dependency typecheck could not run in the build environment because the configured package registry does not provide `@types/pg`.
