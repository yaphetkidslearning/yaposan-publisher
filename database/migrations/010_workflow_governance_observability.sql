-- Phase 106: workflow governance, execution observability, and idempotency.
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS trace_id text;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS execution_key text;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS studio_version integer;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS node_states jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS approved_node_ids text[] NOT NULL DEFAULT ARRAY[]::text[];
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS finished_at timestamptz;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS duration_ms integer;
ALTER TABLE space_studio_runs ADD COLUMN IF NOT EXISTS parent_run_id uuid REFERENCES space_studio_runs(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_space_studio_runs_execution_key ON space_studio_runs(space_id,studio_id,user_id,execution_key) WHERE execution_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_space_studio_runs_trace ON space_studio_runs(trace_id);
