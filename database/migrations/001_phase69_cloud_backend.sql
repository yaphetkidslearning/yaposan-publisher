-- Phase 69 consolidated PostgreSQL schema. The application also exposes these
-- statements through server/postgresDatabase.ts for controlled startup migration.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- See POSTGRES_MIGRATIONS in server/postgresDatabase.ts for complete idempotent DDL.
