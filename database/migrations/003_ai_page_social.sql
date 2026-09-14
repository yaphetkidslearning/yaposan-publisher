-- Phase 97: AI Page social foundation
CREATE TABLE IF NOT EXISTS space_posts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE, author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, body text NOT NULL, visibility text NOT NULL DEFAULT 'private', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS space_comments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), post_id uuid NOT NULL REFERENCES space_posts(id) ON DELETE CASCADE, author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, body text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS space_follows (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE, follower_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(space_id,follower_user_id));
CREATE INDEX IF NOT EXISTS idx_space_posts_space_created ON space_posts(space_id,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_comments_post_created ON space_comments(post_id,created_at);
CREATE INDEX IF NOT EXISTS idx_space_follows_space ON space_follows(space_id);
