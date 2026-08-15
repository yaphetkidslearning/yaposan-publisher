# GitHub Public Launch Checklist

These controls must be completed on the real GitHub repository; a source ZIP cannot certify them.

- [ ] Full Git history scanned for secrets; all findings reviewed and credentials rotated where necessary
- [ ] GitHub secret scanning enabled
- [ ] Push protection enabled
- [ ] Dependabot alerts and security updates enabled
- [ ] Private vulnerability reporting enabled
- [ ] `main` protected by a ruleset/branch protection
- [ ] Pull requests required before merge
- [ ] Community CI and security checks required
- [ ] Force pushes/deletion restricted on protected branches
- [ ] GitHub Discussions enabled
- [ ] Discussion categories: Announcements, Ideas, Q&A, Show and Tell, Development, Templates
- [ ] Repository labels created from `.github/labels.yml`
- [ ] Initial `good first issue` and `help wanted` issues created from `docs/GOOD-FIRST-ISSUES.md`
- [ ] Public URLs, support routes, and security contact verified
- [ ] Third-party asset/dependency license review completed

## Phase 92.2 source-side preflight

Before changing repository visibility to Public, perform this from a fresh clone rather than a long-lived development checkout:

```bash
npm ci
npm run public:preflight
```

Also review `docs/PUBLIC-RELEASE-CERTIFICATION.md` and record who performed the Git-history secret review, credential-rotation review, and third-party rights review.
