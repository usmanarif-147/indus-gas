-- One auditable daily record for BBN Plant's LPG rate, filling quantities,
-- domestic cylinder purchases, and the related payment statuses.

CREATE TABLE IF NOT EXISTS plant_daily_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  domestic_lpg_rate NUMERIC(14, 2) NOT NULL CHECK (domestic_lpg_rate > 0),
  commercial_filled_count INTEGER NOT NULL DEFAULT 0 CHECK (commercial_filled_count >= 0),
  domestic_filled_count INTEGER NOT NULL DEFAULT 0 CHECK (domestic_filled_count >= 0),
  domestic_cylinder_bought BOOLEAN NOT NULL DEFAULT FALSE,
  domestic_cylinder_purchase_count INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_purchase_count >= 0),
  domestic_cylinder_unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (domestic_cylinder_unit_cost >= 0),
  commercial_filling_charge_rate NUMERIC(12, 2) NOT NULL DEFAULT 10 CHECK (commercial_filling_charge_rate >= 0),
  domestic_filling_charge_rate NUMERIC(12, 2) NOT NULL DEFAULT 5 CHECK (domestic_filling_charge_rate >= 0),
  lpg_payment_status SMALLINT NOT NULL DEFAULT 0 CHECK (lpg_payment_status IN (0, 1)),
  filling_payment_status SMALLINT NOT NULL DEFAULT 0 CHECK (filling_payment_status IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plant_daily_entries_domestic_purchase_check CHECK (
    (domestic_cylinder_bought = FALSE AND domestic_cylinder_purchase_count = 0 AND domestic_cylinder_unit_cost = 0)
    OR
    (domestic_cylinder_bought = TRUE AND domestic_cylinder_purchase_count > 0 AND domestic_cylinder_unit_cost > 0)
  )
);

CREATE INDEX IF NOT EXISTS plant_daily_entries_entry_date_idx ON plant_daily_entries (entry_date DESC);

COMMENT ON TABLE plant_daily_entries IS 'Daily BBN Plant LPG rate, filling quantities, domestic cylinder purchases, and payment tracking.';
COMMENT ON COLUMN plant_daily_entries.lpg_payment_status IS '0 = unpaid, 1 = paid';
COMMENT ON COLUMN plant_daily_entries.filling_payment_status IS '0 = unpaid, 1 = paid';
