# Yaposan Desktop Installer Guide

1. Install project dependencies with `npm install`.
2. Produce the production desktop web payload with `npm run desktop:web`.
3. On Windows, run `npm run desktop:build:win`.
4. On macOS, run `npm run desktop:build:mac`.
5. On Linux, run `npm run desktop:build:linux`.
6. Generate SHA-256 metadata with `npm run desktop:manifest`.

Unsigned packages are suitable for internal testing. Public releases should be code-signed. Never commit signing certificates or passwords to the repository; inject them through protected environment variables in the release pipeline.
