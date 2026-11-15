-- Company-owned cylinder totals and company-held stock on the go-live date.

CREATE TABLE IF NOT EXISTS inventory_opening_balances (
  id BIGSERIAL PRIMARY KEY,
  opening_date DATE NOT NULL UNIQUE,
  total_commercial_cylinders INTEGER NOT NULL CHECK (total_commercial_cylinders >= 0),
  total_domestic_cylinders INTEGER NOT NULL CHECK (total_domestic_cylinders >= 0),
  commercial_cylinders_in_company INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinders_in_company >= 0),
  domestic_cylinders_in_company INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinders_in_company >= 0),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT inventory_opening_balances_company_stock_check CHECK (
    commercial_cylinders_in_company <= total_commercial_cylinders
    AND domestic_cylinders_in_company <= total_domestic_cylinders
  )
);
