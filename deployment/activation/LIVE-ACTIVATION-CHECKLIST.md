# Live Production Activation Checklist

1. Push the exact v1.0.0 source to the protected `main` branch.
2. Confirm GitHub CI passes dependency install, TypeScript, tests, and web export.
3. Apply `render.yaml` in Render and wait for PostgreSQL and Redis to become healthy.
4. Enter private provider values in Render; never commit them.
5. Create the Cloudflare R2 bucket, apply CORS, and connect the asset custom domain.
6. Run `npm run deploy:step6:preflight` in the production environment.
7. Deploy API first, then export worker, then web application.
8. Confirm database migrations complete once and without errors.
9. Run `npm run deploy:step6:verify` against temporary Render URLs.
10. Test registration/login, password reset email, one AI request, one R2 upload, one export, and one Stripe test checkout.
11. Configure the Stripe webhook endpoint and verify a signed event is accepted.
12. Enable production DNS only after all temporary-URL checks pass.
13. Run the Step 5 post-cutover verifier after DNS propagation.
14. Record commit SHA, Render deploy IDs, migration result, and verification report.
