CREATE TABLE IF NOT EXISTS payroll_periods (
  id BIGSERIAL PRIMARY KEY,
  period_month DATE NOT NULL UNIQUE,
  payment_due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payroll_periods_month_starts_first CHECK (EXTRACT(DAY FROM period_month) = 1)
);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id BIGSERIAL PRIMARY KEY,
  payroll_period_id BIGINT NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  monthly_salary NUMERIC(14, 2) NOT NULL CHECK (monthly_salary >= 0),
  payable_days NUMERIC(5, 2) NOT NULL CHECK (payable_days >= 0 AND payable_days <= 30),
  daily_rate NUMERIC(14, 4) NOT NULL CHECK (daily_rate >= 0),
  gross_salary NUMERIC(14, 2) NOT NULL CHECK (gross_salary >= 0),
  manual_deduction NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (manual_deduction >= 0),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payroll_entries_period_employee_unique UNIQUE (payroll_period_id, employee_id)
);

CREATE TABLE IF NOT EXISTS employee_advances (
  id BIGSERIAL PRIMARY KEY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  payroll_period_id BIGINT NOT NULL REFERENCES payroll_periods(id) ON DELETE RESTRICT,
  advance_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_payments (
  id BIGSERIAL PRIMARY KEY,
  payroll_entry_id BIGINT NOT NULL REFERENCES payroll_entries(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  payment_mode SMALLINT NOT NULL DEFAULT 0 CHECK (payment_mode IN (0, 1, 2)),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payroll_entries_employee_idx ON payroll_entries (employee_id);
CREATE INDEX IF NOT EXISTS employee_advances_employee_period_idx ON employee_advances (employee_id, payroll_period_id);
CREATE INDEX IF NOT EXISTS payroll_payments_entry_idx ON payroll_payments (payroll_entry_id);

COMMENT ON TABLE payroll_periods IS 'Salary is earned from the first through last day of a month and due on the tenth of the following month.';
