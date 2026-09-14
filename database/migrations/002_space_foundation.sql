-- Phase 95: My Yaposan Space foundation.
-- "Space" is the internal domain term. Customer-facing UI calls this an "AI Page".
-- Creating an AI Page is optional: users can continue using the legacy Yaposan Creator workspace.
CREATE TABLE IF NOT EXISTS spaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'personal',
  visibility text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS space_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(space_id,user_id)
);

CREATE INDEX IF NOT EXISTS idx_spaces_owner ON spaces(owner_user_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_memberships_user ON space_memberships(user_id,space_id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES spaces(id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS space_id uuid REFERENCES spaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_projects_space_updated ON projects(space_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_space ON assets(space_id);
