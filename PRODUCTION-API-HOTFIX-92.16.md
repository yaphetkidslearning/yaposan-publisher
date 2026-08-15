# Yaposan 92.16 Production API Hotfix

## Root cause
The web client referenced `EXPO_PUBLIC_API_URL` through `globalThis.process`. Expo only inlines public environment variables when they are referenced directly as `process.env.EXPO_PUBLIC_*`, so production browser bundles could fall back to `http://localhost:4100`.

## Fix
- Use direct `process.env.EXPO_PUBLIC_API_URL` references throughout the web client.
- Keep localhost only for an actual localhost browser session.
- Use `https://api.yaposan.com` as the safe production fallback.
- Allow `https://yaposan.com`, `https://app.yaposan.com`, and `https://www.yaposan.com` in the Render API CORS origin list.
- Align `.env.example` local API port to 4100.

## Required Render settings
Static site (`yaposan-web`):
- `EXPO_PUBLIC_API_URL=https://api.yaposan.com`

API service (`yaposan-api`):
- `PUBLIC_ORIGINS=https://yaposan.com,https://app.yaposan.com,https://www.yaposan.com`

After applying settings, redeploy the API and then the static site.
