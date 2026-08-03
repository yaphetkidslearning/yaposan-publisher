# Database Migration and Rollback

The API database initializer currently applies idempotent PostgreSQL migrations during startup. During first activation, deploy only one API instance until startup and migration completion are confirmed.

Before activation:
- Create a managed PostgreSQL backup or snapshot.
- Record the current application commit and schema evidence.
- Confirm the new migration statements are backward-compatible with the previous application image.

Activation order:
1. Scale worker to zero.
2. Deploy one API instance and inspect startup logs.
3. Verify `/ready` succeeds.
4. Start one worker and process a controlled export.
5. Scale services only after validation.

Rollback:
- Roll back application images first when schema remains backward-compatible.
- Do not reverse schema changes automatically.
- Restore the pre-deployment snapshot only after stopping API and worker writes and documenting expected data loss.
