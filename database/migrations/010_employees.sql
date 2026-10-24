-- Employee profiles are separate from user accounts because some employees do
-- not need application access. A linked user account is created only when login
-- access is required.

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_type_check;
ALTER TABLE users ADD CONSTRAINT users_account_type_check CHECK (account_type IN ('admin', 'employee'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_is_active_check;
ALTER TABLE users ADD CONSTRAINT users_is_active_check CHECK (is_active IN (0, 1));

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE NULL REFERENCES users(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  address TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NULL,
  monthly_salary NUMERIC(14, 2) NOT NULL CHECK (monthly_salary >= 0),
  status SMALLINT NOT NULL DEFAULT 1 CHECK (status IN (0, 1)),
  role TEXT NOT NULL CHECK (role IN ('warehouse_manager', 'sales_manager', 'driver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_end_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS employees_status_role_idx ON employees (status, role);

COMMENT ON COLUMN employees.status IS '0 = inactive, 1 = active';
COMMENT ON COLUMN employees.role IS 'warehouse_manager, sales_manager, or driver';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deliveries_assigned_driver_id_fkey'
  ) THEN
    ALTER TABLE deliveries
      ADD CONSTRAINT deliveries_assigned_driver_id_fkey
      FOREIGN KEY (assigned_driver_id) REFERENCES employees(id) ON DELETE RESTRICT;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.plant_filling_plans') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plant_filling_plans_assigned_driver_id_fkey') THEN
    ALTER TABLE plant_filling_plans
      ADD CONSTRAINT plant_filling_plans_assigned_driver_id_fkey
      FOREIGN KEY (assigned_driver_id) REFERENCES employees(id) ON DELETE SET NULL;
  END IF;
END $$;
