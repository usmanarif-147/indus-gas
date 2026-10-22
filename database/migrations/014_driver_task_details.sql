ALTER TABLE daily_operations
  DROP CONSTRAINT IF EXISTS daily_operations_category_check;

ALTER TABLE daily_operations
  ADD CONSTRAINT daily_operations_category_check CHECK (
    task_category IN (
      'filling_visit', 'cylinder_delivery', 'cylinder_collection', 'vehicle_task',
      'new_client_meeting', 'payment_collection', 'follow_up',
      'cylinder_inspection', 'other'
    )
  );

ALTER TABLE daily_operations
  ADD COLUMN IF NOT EXISTS plan_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plant_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS commercial_filled_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domestic_filled_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commercial_empty_expected INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS domestic_empty_expected INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_collection_required SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_amount NUMERIC(14,2) NULL,
  ADD COLUMN IF NOT EXISTS cash_before_delivery SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspection_required SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inspection_note TEXT NULL;

ALTER TABLE daily_operations
  DROP CONSTRAINT IF EXISTS daily_operations_plan_order_check,
  ADD CONSTRAINT daily_operations_plan_order_check CHECK (plan_order >= 0),
  DROP CONSTRAINT IF EXISTS daily_operations_commercial_filled_check,
  ADD CONSTRAINT daily_operations_commercial_filled_check CHECK (commercial_filled_count >= 0),
  DROP CONSTRAINT IF EXISTS daily_operations_domestic_filled_check,
  ADD CONSTRAINT daily_operations_domestic_filled_check CHECK (domestic_filled_count >= 0),
  DROP CONSTRAINT IF EXISTS daily_operations_commercial_empty_check,
  ADD CONSTRAINT daily_operations_commercial_empty_check CHECK (commercial_empty_expected >= 0),
  DROP CONSTRAINT IF EXISTS daily_operations_domestic_empty_check,
  ADD CONSTRAINT daily_operations_domestic_empty_check CHECK (domestic_empty_expected >= 0),
  DROP CONSTRAINT IF EXISTS daily_operations_cash_required_check,
  ADD CONSTRAINT daily_operations_cash_required_check CHECK (cash_collection_required IN (0,1)),
  DROP CONSTRAINT IF EXISTS daily_operations_cash_before_check,
  ADD CONSTRAINT daily_operations_cash_before_check CHECK (cash_before_delivery IN (0,1)),
  DROP CONSTRAINT IF EXISTS daily_operations_inspection_check,
  ADD CONSTRAINT daily_operations_inspection_check CHECK (inspection_required IN (0,1));

CREATE INDEX IF NOT EXISTS daily_operations_driver_plan_index
  ON daily_operations(assigned_employee_id, operation_date, plan_order);
