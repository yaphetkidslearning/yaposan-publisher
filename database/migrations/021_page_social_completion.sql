-- Yaposan 119.3.2 — persistent Page presentation.
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS avatar_uri text;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS cover_uri text;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS cover_x double precision NOT NULL DEFAULT 0;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS cover_y double precision NOT NULL DEFAULT 0;
ALTER TABLE space_privacy_settings ADD COLUMN IF NOT EXISTS cover_zoom double precision NOT NULL DEFAULT 1;
