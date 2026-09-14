CREATE TABLE IF NOT EXISTS space_studios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  description text,
  visibility text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'draft',
  nodes jsonb NOT NULL DEFAULT '[]'::jsonb,
  edges jsonb NOT NULL DEFAULT '[]'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS space_studio_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES space_studios(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'running',
  input jsonb,
  output jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_space_studios_space ON space_studios(space_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_studio_runs_studio ON space_studio_runs(studio_id,created_at DESC);
