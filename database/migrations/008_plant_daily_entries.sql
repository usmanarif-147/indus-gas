-- One auditable daily record for BBN Plant's LPG rate, filling quantities,
-- domestic cylinder purchases, and the related payment statuses.

CREATE TABLE IF NOT EXISTS plant_daily_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  domestic_lpg_rate NUMERIC(14, 2) NULL CHECK (domestic_lpg_rate > 0),
  commercial_filling_charge_rate NUMERIC(12, 2) NOT NULL DEFAULT 10 CHECK (commercial_filling_charge_rate >= 0),
  domestic_filling_charge_rate NUMERIC(12, 2) NOT NULL DEFAULT 5 CHECK (domestic_filling_charge_rate >= 0),
  lpg_payment_status SMALLINT NOT NULL DEFAULT 0 CHECK (lpg_payment_status IN (0, 1)),
  filling_payment_status SMALLINT NOT NULL DEFAULT 0 CHECK (filling_payment_status IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plant_daily_entries_rate_check CHECK (domestic_lpg_rate IS NULL OR domestic_lpg_rate > 0)
);

CREATE INDEX IF NOT EXISTS plant_daily_entries_entry_date_idx ON plant_daily_entries (entry_date DESC);

COMMENT ON TABLE plant_daily_entries IS 'Daily BBN Plant LPG rate, filling quantities, domestic cylinder purchases, and payment tracking.';
COMMENT ON COLUMN plant_daily_entries.lpg_payment_status IS '0 = unpaid, 1 = paid';
COMMENT ON COLUMN plant_daily_entries.filling_payment_status IS '0 = unpaid, 1 = paid';

-- A daily entry may be created from Daily Operations before BBN shares the
-- rate. Keep the rate optional until the purchasing record is completed.
ALTER TABLE plant_daily_entries
  ALTER COLUMN domestic_lpg_rate DROP NOT NULL;

-- One daily rate can cover several BBN vehicle visits. Each visit is stored
-- separately so the driver can complete it independently of payment.
CREATE TABLE IF NOT EXISTS plant_filling_plans (
  id BIGSERIAL PRIMARY KEY,
  plant_daily_entry_id BIGINT NOT NULL REFERENCES plant_daily_entries(id) ON DELETE RESTRICT,
  assigned_driver_id BIGINT NULL,
  commercial_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_count >= 0),
  domestic_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_count >= 0),
  new_domestic_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (new_domestic_cylinder_count >= 0),
  new_domestic_cylinder_unit_cost NUMERIC(14, 2) NULL CHECK (new_domestic_cylinder_unit_cost >= 0),
  task_sequence INTEGER NULL CHECK (task_sequence > 0),
  planned_time TIME NULL,
  completed_at TIMESTAMPTZ NULL,
  filling_status SMALLINT NOT NULL DEFAULT 0 CHECK (filling_status IN (0, 1, 2)),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT plant_filling_plans_quantity_check CHECK (
    commercial_cylinder_count > 0 OR domestic_cylinder_count > 0
  ),
  CONSTRAINT plant_filling_plans_domestic_purchase_check CHECK (
    new_domestic_cylinder_count = 0 OR new_domestic_cylinder_unit_cost IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS plant_filling_plans_daily_entry_idx
  ON plant_filling_plans(plant_daily_entry_id, planned_time NULLS LAST);

CREATE INDEX IF NOT EXISTS plant_filling_plans_driver_status_idx
  ON plant_filling_plans(assigned_driver_id, filling_status);

COMMENT ON TABLE plant_filling_plans IS 'Each planned BBN Plant visit. Multiple plans can share one daily LPG rate.';
COMMENT ON COLUMN plant_filling_plans.filling_status IS '0 = planned, 1 = completed, 2 = cancelled';

-- Convert earlier development schema safely. The parent is financial-only;
-- cylinder quantities belong exclusively to individual filling visits.
ALTER TABLE plant_daily_entries
  DROP CONSTRAINT IF EXISTS plant_daily_entries_domestic_purchase_check,
  DROP COLUMN IF EXISTS commercial_filled_count,
  DROP COLUMN IF EXISTS domestic_filled_count,
  DROP COLUMN IF EXISTS domestic_cylinder_bought,
  DROP COLUMN IF EXISTS domestic_cylinder_purchase_count,
  DROP COLUMN IF EXISTS domestic_cylinder_unit_cost;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plant_filling_plans' AND column_name='planned_commercial_cylinder_count') THEN
    ALTER TABLE plant_filling_plans RENAME COLUMN planned_commercial_cylinder_count TO commercial_cylinder_count;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plant_filling_plans' AND column_name='planned_domestic_cylinder_count') THEN
    ALTER TABLE plant_filling_plans RENAME COLUMN planned_domestic_cylinder_count TO domestic_cylinder_count;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plant_filling_plans' AND column_name='domestic_cylinder_purchase_count') THEN
    ALTER TABLE plant_filling_plans RENAME COLUMN domestic_cylinder_purchase_count TO new_domestic_cylinder_count;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='plant_filling_plans' AND column_name='domestic_cylinder_unit_cost') THEN
    ALTER TABLE plant_filling_plans RENAME COLUMN domestic_cylinder_unit_cost TO new_domestic_cylinder_unit_cost;
  END IF;
END $$;

ALTER TABLE plant_filling_plans
  ADD COLUMN IF NOT EXISTS task_sequence INTEGER NULL CHECK (task_sequence > 0),
  DROP COLUMN IF EXISTS filled_commercial_cylinder_count,
  DROP COLUMN IF EXISTS filled_domestic_cylinder_count;
