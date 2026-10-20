-- Reusable settings for expense entry and vehicle-fuel calculations.

CREATE TABLE IF NOT EXISTS expense_categories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_categories_title_not_blank CHECK (length(trim(title)) > 0)
);

CREATE TABLE IF NOT EXISTS expense_subcategories (
  id BIGSERIAL PRIMARY KEY,
  expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expense_subcategories_title_not_blank CHECK (length(trim(title)) > 0),
  CONSTRAINT expense_subcategories_category_title_unique UNIQUE (expense_category_id, title)
);

CREATE INDEX IF NOT EXISTS expense_subcategories_category_idx ON expense_subcategories (expense_category_id);

CREATE TABLE IF NOT EXISTS fuel_rates (
  id BIGSERIAL PRIMARY KEY,
  rate_date DATE NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('Petrol', 'High-speed diesel')),
  rate_per_litre NUMERIC(12, 2) NOT NULL CHECK (rate_per_litre > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fuel_rates_date_type_unique UNIQUE (rate_date, fuel_type)
);

CREATE INDEX IF NOT EXISTS fuel_rates_date_idx ON fuel_rates (rate_date DESC);
