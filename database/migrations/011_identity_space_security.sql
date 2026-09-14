-- Yaposan 107.0 — identity/session hardening + per-Space security policy
ALTER TABLE assets ADD COLUMN IF NOT EXISTS security_status text NOT NULL DEFAULT 'clean';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS security_reason text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS identity_provider text NOT NULL DEFAULT 'local';
ALTER TABLE users ADD COLUMN IF NOT EXISTS external_subject text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_external_identity ON users(identity_provider,external_subject) WHERE external_subject IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  auth_method text NOT NULL,
  assurance text NOT NULL DEFAULT 'password',
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip_hash text,
  user_agent_hash text,
  external_session_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id,last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id,expires_at) WHERE revoked_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_sessions_external ON user_sessions(external_session_key) WHERE external_session_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS space_security_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL UNIQUE REFERENCES spaces(id) ON DELETE CASCADE,
  require_step_up_for_public_sharing boolean NOT NULL DEFAULT true,
  require_step_up_for_team_admin boolean NOT NULL DEFAULT false,
  allow_public_comments boolean NOT NULL DEFAULT false,
  allow_external_connections boolean NOT NULL DEFAULT false,
  allow_file_downloads boolean NOT NULL DEFAULT false,
  invite_policy text NOT NULL DEFAULT 'admins_only',
  upload_policy text NOT NULL DEFAULT 'strict',
  security_alerts boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO space_security_settings (space_id) SELECT id FROM spaces ON CONFLICT (space_id) DO NOTHING;
