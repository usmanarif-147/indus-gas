-- Invoice generated for a completed delivery.

CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE RESTRICT,
  purchase_rate_per_kg NUMERIC(14, 4) NOT NULL DEFAULT 0,
  profit_margin_per_kg NUMERIC(14, 4) NOT NULL DEFAULT 0,
  commercial_cylinder_count INTEGER NOT NULL DEFAULT 0,
  commercial_rate NUMERIC(14, 4) NOT NULL DEFAULT 0,
  commercial_subtotal NUMERIC(16, 2) NOT NULL DEFAULT 0,
  domestic_rate NUMERIC(14, 4) NOT NULL DEFAULT 0,
  domestic_cylinder_count INTEGER NOT NULL DEFAULT 0,
  domestic_subtotal NUMERIC(16, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(16, 2) NOT NULL DEFAULT 0,
  status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoices_non_negative_amounts_check CHECK (
    purchase_rate_per_kg >= 0
    AND profit_margin_per_kg >= 0
    AND commercial_cylinder_count >= 0
    AND commercial_rate >= 0
    AND commercial_subtotal >= 0
    AND domestic_rate >= 0
    AND domestic_cylinder_count >= 0
    AND domestic_subtotal >= 0
    AND total_amount >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS invoices_delivery_unique_idx ON invoices (delivery_id);

CREATE INDEX IF NOT EXISTS invoices_delivery_idx ON invoices (delivery_id);

COMMENT ON COLUMN invoices.status IS '0 = pending, 1 = issued';
