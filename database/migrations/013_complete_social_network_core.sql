-- Phase 109: Complete Social Network Core
ALTER TABLE space_posts ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE space_posts ADD COLUMN IF NOT EXISTS media_type text;
ALTER TABLE space_posts ADD COLUMN IF NOT EXISTS quote_post_id uuid REFERENCES space_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_space_posts_public_created ON space_posts(visibility,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_space_post_hashtags_tag ON space_post_hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_space_follows_follower ON space_follows(follower_user_id,created_at DESC);
