CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  client_code TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  is_active SMALLINT NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
  ntn TEXT NULL,
  client_type SMALLINT NOT NULL DEFAULT 0 CHECK (client_type IN (0, 1)),
  payment_method SMALLINT NOT NULL DEFAULT 1 CHECK (payment_method IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN clients.is_active IS '0 = inactive, 1 = active';
COMMENT ON COLUMN clients.client_type IS '0 = non-GST, 1 = GST';
COMMENT ON COLUMN clients.payment_method IS '0 = bill to bill, 1 = on-spot cash';
