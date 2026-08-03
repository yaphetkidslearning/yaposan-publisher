# Disaster Recovery Handbook

Recovery order: contain the incident, preserve logs, stop unsafe writes, select the last verified backup, restore PostgreSQL into an isolated environment, validate schema and record counts, verify R2 artifacts, rotate compromised secrets, test authentication and exports, then promote under approval.

Never overwrite the only production database during a restore drill. Record recovery point and recovery time. A launch certificate requires a verified restore drill and verified backups.
