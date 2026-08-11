import type { DatabaseAdapter, DatabaseSchema, EntityName, RecordBase } from "./database";

export type SqlConnection = {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
  release?(): void;
};
export type SqlClient = SqlConnection & {
  connect?(): Promise<SqlConnection>;
  end?(): Promise<void>;
};

const TABLES: Record<EntityName, string> = {
  users: "users", organizations: "organizations", memberships: "memberships", workspaces: "workspaces",
  projects: "projects", assets: "assets", versions: "project_versions", subscriptions: "subscriptions",
  auditEvents: "audit_events", jobs: "jobs", aiCreditTransactions: "ai_credit_transactions", aiCommunityTransactions: "ai_community_transactions", aiProviderCredentials: "ai_provider_credentials",
};

const snake = (key: string) => key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const camel = (key: string) => key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
const decode = <T>(row: Record<string, unknown>): T => Object.fromEntries(Object.entries(row).map(([k, v]) => [camel(k), v])) as T;

export const POSTGRES_MIGRATIONS = [
`CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS users (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text UNIQUE NOT NULL, password_hash text NOT NULL, email_verified boolean NOT NULL DEFAULT false, mfa_secret text, status text NOT NULL DEFAULT 'active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS organizations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, owner_user_id uuid NOT NULL REFERENCES users(id), plan text NOT NULL DEFAULT 'free', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS memberships (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,user_id));
CREATE TABLE IF NOT EXISTS workspaces (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, name text NOT NULL, region text NOT NULL DEFAULT 'us-east', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
`CREATE TABLE IF NOT EXISTS projects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_user_id uuid NOT NULL REFERENCES users(id), name text NOT NULL, revision integer NOT NULL DEFAULT 1, payload jsonb NOT NULL DEFAULT '{}'::jsonb, deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS project_versions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE, revision integer NOT NULL, payload jsonb NOT NULL, actor_user_id uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(project_id,revision));
CREATE TABLE IF NOT EXISTS assets (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE, owner_user_id uuid NOT NULL REFERENCES users(id), name text NOT NULL, mime_type text NOT NULL, size bigint NOT NULL, storage_key text UNIQUE NOT NULL, checksum text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());`,
`CREATE TABLE IF NOT EXISTS subscriptions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, provider_customer_id text, provider_subscription_id text, plan text NOT NULL, status text NOT NULL, seats integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS audit_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid, actor_user_id uuid, action text NOT NULL, target text, request_id text, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, status text NOT NULL, progress integer NOT NULL DEFAULT 0, attempts integer NOT NULL DEFAULT 0, payload jsonb NOT NULL DEFAULT '{}'::jsonb, result jsonb, error text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_projects_workspace_updated ON projects(workspace_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_versions_project_revision ON project_versions(project_id,revision DESC);
CREATE INDEX IF NOT EXISTS idx_assets_workspace ON assets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON audit_events(organization_id,created_at DESC);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS worker_id text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS heartbeat_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_jobs_claim ON jobs(kind,status,created_at);`,
`CREATE TABLE IF NOT EXISTS ai_credit_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, credits integer NOT NULL, kind text NOT NULL, pack_id text, amount_cents integer, currency text, provider_event_id text UNIQUE, provider_checkout_session_id text UNIQUE, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_ai_credit_org_created ON ai_credit_transactions(organization_id,created_at DESC);`,
`CREATE TABLE IF NOT EXISTS ai_community_transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL, month text NOT NULL, request_id text NOT NULL, amount_micros bigint NOT NULL, kind text NOT NULL, metadata jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_ai_community_month ON ai_community_transactions(month,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_community_request ON ai_community_transactions(request_id);
CREATE TABLE IF NOT EXISTS ai_provider_credentials (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE, provider text NOT NULL, endpoint text, model text, encrypted_api_key text NOT NULL, key_last4 text, key_version text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,provider));
CREATE INDEX IF NOT EXISTS idx_ai_provider_credentials_org ON ai_provider_credentials(organization_id);
ALTER TABLE ai_provider_credentials ADD COLUMN IF NOT EXISTS key_version text;`
] as const;

export class PostgresDatabase implements DatabaseAdapter {
  private readonly client: SqlClient;
  private readonly ownsClient: boolean;
  constructor(client: SqlClient, ownsClient=true) { this.client = client; this.ownsClient=ownsClient; }
  async connect() { await this.client.query("SELECT 1"); }
  async close() { if(this.ownsClient) await this.client.end?.(); }
  async migrate() { for (const migration of POSTGRES_MIGRATIONS) await this.client.query(migration); return POSTGRES_MIGRATIONS.length; }
  async insert<K extends EntityName>(table: K, value: Omit<DatabaseSchema[K], keyof RecordBase> & Partial<RecordBase>) {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined);
    const columns = entries.map(([k]) => snake(k));
    const values = entries.map(([, v]) => v);
    const sql = `INSERT INTO ${TABLES[table]} (${columns.join(",")}) VALUES (${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING *`;
    return decode<DatabaseSchema[K]>((await this.client.query(sql, values)).rows[0] as Record<string, unknown>);
  }
  async get<K extends EntityName>(table: K, id: string) { const row = (await this.client.query(`SELECT * FROM ${TABLES[table]} WHERE id=$1`, [id])).rows[0]; return row ? decode<DatabaseSchema[K]>(row as Record<string, unknown>) : undefined; }
  async find<K extends EntityName>(table: K, predicate: (row: DatabaseSchema[K]) => boolean) { const rows = (await this.client.query(`SELECT * FROM ${TABLES[table]}`)).rows.map(row => decode<DatabaseSchema[K]>(row as Record<string, unknown>)); return rows.filter(predicate); }
  async update<K extends EntityName>(table: K, id: string, patch: Partial<DatabaseSchema[K]>) {
    const entries = Object.entries(patch).filter(([k, v]) => k !== "id" && v !== undefined);
    if (!entries.length) { const current = await this.get(table, id); if (!current) throw new Error("RECORD_NOT_FOUND"); return current; }
    const sets = entries.map(([k], i) => `${snake(k)}=$${i + 2}`);
    const row = (await this.client.query(`UPDATE ${TABLES[table]} SET ${sets.join(",")},updated_at=now() WHERE id=$1 RETURNING *`, [id, ...entries.map(([, v]) => v)])).rows[0];
    if (!row) throw new Error("RECORD_NOT_FOUND"); return decode<DatabaseSchema[K]>(row as Record<string, unknown>);
  }
  async delete<K extends EntityName>(table: K, id: string) { return (await this.client.query(`DELETE FROM ${TABLES[table]} WHERE id=$1 RETURNING id`, [id])).rows.length > 0; }

  async claimNextJob(kind: import("./database").JobRecord["kind"], workerId: string, leaseSeconds: number) {
    const sql = `WITH candidate AS (SELECT id FROM jobs WHERE kind=$1 AND status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE jobs SET status='running',attempts=attempts+1,progress=1,worker_id=$2,heartbeat_at=now(),lease_expires_at=now()+($3 * interval '1 second'),updated_at=now() WHERE id=(SELECT id FROM candidate) RETURNING *`;
    const row=(await this.client.query(sql,[kind,workerId,leaseSeconds])).rows[0]; return row?decode<import("./database").JobRecord>(row as Record<string,unknown>):undefined;
  }
  async recoverStaleJobs(kind: import("./database").JobRecord["kind"], now=new Date()) {
    const result=await this.client.query<{id:string}>(`UPDATE jobs SET status='queued',progress=0,worker_id=NULL,heartbeat_at=NULL,lease_expires_at=NULL,error='Recovered after worker lease expired',updated_at=now() WHERE kind=$1 AND status='running' AND lease_expires_at <= $2 RETURNING id`,[kind,now.toISOString()]); return result.rows.length;
  }
  async lock(key:string){ await this.client.query("SELECT pg_advisory_xact_lock(hashtext($1))",[key]); }
  async transaction<T>(fn: (db: DatabaseAdapter) => Promise<T>) {
    const connection=this.client.connect?await this.client.connect():this.client;
    const tx=new PostgresDatabase(connection as SqlClient,false);
    await connection.query("BEGIN");
    try { const value = await fn(tx); await connection.query("COMMIT"); return value; }
    catch (error) { await connection.query("ROLLBACK"); throw error; }
    finally { connection.release?.(); }
  }
}

export async function createPostgresDatabase(databaseUrl: string) {
  const pg = await import("pg") as unknown as { Pool: new (options: { connectionString: string; max: number; ssl?: { rejectUnauthorized: boolean } }) => SqlClient };
  const client = new pg.Pool({ connectionString: databaseUrl, max: 10, ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined });
  const database = new PostgresDatabase(client); await database.connect(); await database.migrate(); return database;
}
