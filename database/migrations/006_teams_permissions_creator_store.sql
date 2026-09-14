CREATE TABLE IF NOT EXISTS space_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL,
  invited_by_user_id uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_space_invites_pending ON space_invites(space_id,lower(email)) WHERE status='pending';
CREATE TABLE IF NOT EXISTS space_store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  kind text NOT NULL,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  visibility text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'draft',
  resource_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_space_store_products_space ON space_store_products(space_id,updated_at DESC);
CREATE TABLE IF NOT EXISTS space_store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES space_store_products(id),
  buyer_user_id uuid NOT NULL REFERENCES users(id),
  seller_user_id uuid NOT NULL REFERENCES users(id),
  quantity integer NOT NULL DEFAULT 1,
  gross_cents integer NOT NULL DEFAULT 0,
  platform_fee_cents integer NOT NULL DEFAULT 0,
  creator_net_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_space_store_orders_space ON space_store_orders(space_id,created_at DESC);
