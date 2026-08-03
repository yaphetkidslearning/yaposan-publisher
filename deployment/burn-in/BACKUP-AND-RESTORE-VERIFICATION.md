# Backup and Restore Verification

1. Confirm the latest PostgreSQL backup completed and is within the configured maximum age.
2. Confirm R2 object replication or secondary-copy policy is active.
3. Verify backup manifests and artifact SHA-256 checksums.
4. Restore into an isolated non-production environment.
5. Run migrations, API readiness, login, project read, and export smoke checks.
6. Record actual recovery time and recovery point.
7. Never perform a destructive restore into production as a burn-in test.
