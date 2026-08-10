# Open-Source Security Checklist

Complete this checklist **before changing the repository visibility to Public**.

## 1. Current working tree

- Confirm `.env` and `.env.*` files are ignored except intentionally sanitized examples.
- Run `npm run verify:phase90.3`.
- Search for credentials in source, scripts, docs, workflows, Docker files, and examples.
- Check screenshots, logs, exported JSON, database dumps, archives, and backup files.

## 2. Git history

A secret removed from the latest commit may still exist in older commits.

Suggested searches:

```bash
git log --all --oneline
git log -p --all -G 'sk-[A-Za-z0-9]'
git log -p --all -G 'sk_live_'
git log -p --all -G 'postgres(ql)?://'
git log -p --all -G 'BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY'
```

Also use a dedicated secret scanner such as GitHub secret scanning, Gitleaks, or TruffleHog before publication.

If a real credential ever existed in Git history:

1. rotate/revoke it first
2. update production
3. clean history if appropriate
4. force-push only with a deliberate coordination plan
5. verify forks/caches/logs do not retain usable credentials

## 3. Production boundaries

Confirm the browser receives only public configuration.

`EXPO_PUBLIC_*` variables are public by design and must never contain secrets.

Server-only values include:

- database credentials
- session/JWT secrets
- Stripe secret keys and webhook secrets
- OpenAI API keys
- R2/S3 secret keys
- email-provider credentials
- worker tokens
- metrics/admin tokens

## 4. GitHub security

Before public launch:

- enable Dependabot alerts
- enable dependency graph
- enable secret scanning where available
- enable push protection where available
- enable private vulnerability reporting
- protect `main`
- require pull-request review
- require CI checks before merge

## 5. Repository hygiene

- Verify `LICENSE`
- Verify `README.md`
- Verify `CONTRIBUTING.md`
- Verify `CODE_OF_CONDUCT.md`
- Verify `SECURITY.md`
- Verify issue and PR templates
- Remove private operational notes not intended for the public
- Remove generated archives and large binary artifacts that are not needed
- Confirm every included asset can legally be redistributed

## 6. Publication

Only after the checks above:

1. make the repository public
2. confirm the public README renders correctly
3. verify issue and PR templates
4. verify the security reporting link
5. create `good first issue` and `help wanted` labels/issues
6. announce contribution priorities
