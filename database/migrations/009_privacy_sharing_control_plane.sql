-- Phase 105: privacy and sharing control plane.
-- A Space remains the private ownership boundary. A public creator page is an opt-in projection of selected resources.
CREATE TABLE IF NOT EXISTS space_privacy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL UNIQUE REFERENCES spaces(id) ON DELETE CASCADE,
  public_page_enabled boolean NOT NULL DEFAULT false,
  discoverable boolean NOT NULL DEFAULT false,
  show_follower_count boolean NOT NULL DEFAULT false,
  default_post_visibility text NOT NULL DEFAULT 'private',
  external_sharing_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO space_privacy_settings (space_id,public_page_enabled,discoverable,show_follower_count,default_post_visibility,external_sharing_enabled)
SELECT id,(visibility='public'),false,false,'private',false FROM spaces
ON CONFLICT (space_id) DO NOTHING;
UPDATE spaces SET visibility='private', updated_at=now() WHERE visibility='public';
ALTER TABLE space_posts ALTER COLUMN visibility SET DEFAULT 'private';
CREATE TABLE IF NOT EXISTS space_data_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  connection_id uuid NOT NULL REFERENCES space_connections(id) ON DELETE CASCADE,
  granted_by_user_id uuid NOT NULL REFERENCES users(id),
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  resource_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  purpose text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(space_id,connection_id)
);
CREATE INDEX IF NOT EXISTS idx_space_data_grants_space ON space_data_grants(space_id,status);

-- Store publication and global Marketplace listing are separate opt-ins.
ALTER TABLE space_store_products ADD COLUMN IF NOT EXISTS marketplace_listed boolean NOT NULL DEFAULT false;
