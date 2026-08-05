# Phase 89 Backup and Restore Drill

1. Create an isolated test account, project, asset, project version, export, and subscription record.
2. Record database row counts and SHA-256 hashes for test artifacts.
3. Create a PostgreSQL backup and an object-storage inventory.
4. Restore into an isolated recovery environment only.
5. Recalculate counts and hashes.
6. Sign in as the restored user and open the restored project.
7. Confirm asset access, version history, and export metadata.
8. Record recovery point objective, recovery time objective, failures, and remediation.

Never run a restore drill directly against the production database.
