-- Opening company-cylinder quantities physically held at each client branch.

CREATE TABLE IF NOT EXISTS branch_opening_cylinder_balances (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  opening_date DATE NOT NULL,
  commercial_cylinders_at_branch INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinders_at_branch >= 0),
  domestic_cylinders_at_branch INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinders_at_branch >= 0),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT branch_opening_cylinder_balances_branch_date_unique UNIQUE (branch_id, opening_date)
);

CREATE INDEX IF NOT EXISTS branch_opening_cylinder_balances_date_idx
  ON branch_opening_cylinder_balances (opening_date, branch_id);
