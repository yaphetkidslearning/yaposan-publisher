# GitHub Launch Checklist

Before publishing or updating the public repository:

- Confirm no secrets or production `.env` files are present.
- Run `npm install` from a clean checkout.
- Run `npm run typecheck`.
- Run `npm run lint -- --quiet`.
- Run `npm run test:release`.
- Run `npm run build:web`.
- Run `npm run licenses:check`.
- Run secret scanning with the repository security configuration.
- Review `SECURITY.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, and the open-source boundary documentation.
