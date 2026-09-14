-- Yaposan 114.0: creator-owned direct advertising marketplace.
CREATE TABLE IF NOT EXISTS creator_ad_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL UNIQUE REFERENCES spaces(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES users(id),
  enabled boolean NOT NULL DEFAULT false,
  cpc_cents integer NOT NULL DEFAULT 10 CHECK (cpc_cents >= 1),
  currency text NOT NULL DEFAULT 'USD',
  placement text NOT NULL DEFAULT 'bottom_overlay',
  require_approval boolean NOT NULL DEFAULT true,
  platform_fee_bps integer NOT NULL DEFAULT 2000 CHECK (platform_fee_bps BETWEEN 1000 AND 3000),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS creator_ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES users(id),
  advertiser_user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  image_url text,
  target_url text NOT NULL,
  budget_cents integer NOT NULL CHECK (budget_cents BETWEEN 1000 AND 10000000),
  funded_cents integer NOT NULL DEFAULT 0,
  spent_cents integer NOT NULL DEFAULT 0,
  cpc_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending_funding',
  provider_checkout_session_id text,
  provider_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_ad_campaigns_delivery ON creator_ad_campaigns(space_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS creator_ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES creator_ad_campaigns(id) ON DELETE CASCADE,
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  creator_user_id uuid NOT NULL REFERENCES users(id),
  event_type text NOT NULL,
  visitor_key text NOT NULL,
  billed_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  creator_net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  fraud_status text NOT NULL DEFAULT 'accepted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_creator_ad_events_dedupe ON creator_ad_events(campaign_id,event_type,visitor_key,created_at DESC);
