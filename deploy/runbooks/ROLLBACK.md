# Production rollback

1. Disable auto-deploy while investigating.
2. Restore the last known-good Render deploy for web, API, and worker as one release set.
3. Do not roll back database schema blindly. Confirm migration compatibility first.
4. Pause the export worker if jobs may be incompatible; retain queued records.
5. Restore DNS only when the previous service is healthy and TLS-valid.
6. Rotate any credential suspected of exposure.
7. Run hosted smoke tests and record the deploy ID, commit SHA, incident time, and recovery result.
