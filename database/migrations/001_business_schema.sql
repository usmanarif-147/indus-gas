CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  password_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employees (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'salesman', 'driver', 'helper')),
  responsibilities TEXT NULL,
  contact JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_leads (
  id BIGSERIAL PRIMARY KEY,
  restaurant_title TEXT NOT NULL,
  owner_name TEXT NULL,
  purchaser_name TEXT NULL,
  purchaser_contact TEXT NULL,
  current_supplier TEXT NULL,
  current_rate NUMERIC(12, 2) NULL,
  weekly_cylinders_average INTEGER NULL,
  area TEXT NULL,
  map_location TEXT NULL,
  opening_year SMALLINT NULL,
  total_branches INTEGER NOT NULL DEFAULT 1,
  assigned_salesman_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'converted', 'closed')),
  converted_client_id BIGINT NULL,
  converted_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  business_title TEXT NOT NULL,
  agreement_status TEXT NOT NULL DEFAULT 'pending' CHECK (agreement_status IN ('pending', 'active', 'expired', 'not_required')),
  total_number_of_branches INTEGER NOT NULL DEFAULT 1,
  ntn TEXT NULL,
  lead_id BIGINT UNIQUE NULL REFERENCES sales_leads(id) ON DELETE SET NULL,
  customer_since DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_leads_converted_client_fk') THEN
    ALTER TABLE sales_leads ADD CONSTRAINT sales_leads_converted_client_fk FOREIGN KEY (converted_client_id) REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS client_branches (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  branch_title TEXT NOT NULL,
  purchaser_name TEXT NULL,
  purchaser_contact TEXT NULL,
  area TEXT NULL,
  map_location TEXT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  closing_balance JSONB NOT NULL DEFAULT '{"45_4_lot": 0, "11_8_lot": 0}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cylinder_types (
  id SMALLSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  size_kg NUMERIC(5, 1) NOT NULL UNIQUE,
  valve_type TEXT NOT NULL DEFAULT 'LOT',
  active BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO cylinder_types (title, size_kg, valve_type) VALUES
  ('LOT 45.4 kg', 45.4, 'LOT'),
  ('LOT 11.8 kg', 11.8, 'LOT')
ON CONFLICT (size_kg) DO NOTHING;

CREATE TABLE IF NOT EXISTS sales_orders (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  branch_id BIGINT NOT NULL REFERENCES client_branches(id) ON DELETE RESTRICT,
  lead_id BIGINT NULL REFERENCES sales_leads(id) ON DELETE SET NULL,
  taken_by_employee_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_order_items (
  id BIGSERIAL PRIMARY KEY,
  sales_order_id BIGINT NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  cylinder_type_id SMALLINT NOT NULL REFERENCES cylinder_types(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  UNIQUE (sales_order_id, cylinder_type_id)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id BIGSERIAL PRIMARY KEY,
  client_branch_id BIGINT NOT NULL REFERENCES client_branches(id) ON DELETE RESTRICT,
  sales_order_id BIGINT NULL REFERENCES sales_orders(id) ON DELETE SET NULL,
  driver_employee_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  helper_employee_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  remarks TEXT NULL,
  receiver_name TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_cylinder_lines (
  id BIGSERIAL PRIMARY KEY,
  delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  cylinder_type_id SMALLINT NOT NULL REFERENCES cylinder_types(id) ON DELETE RESTRICT,
  previous_closing_balance INTEGER NOT NULL DEFAULT 0 CHECK (previous_closing_balance >= 0),
  filled_delivered INTEGER NOT NULL DEFAULT 0 CHECK (filled_delivered >= 0),
  empty_returned INTEGER NOT NULL DEFAULT 0 CHECK (empty_returned >= 0),
  new_closing_balance INTEGER NOT NULL CHECK (new_closing_balance >= 0),
  UNIQUE (delivery_id, cylinder_type_id)
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  icon TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_types (
  id BIGSERIAL PRIMARY KEY,
  expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT NULL,
  UNIQUE (expense_category_id, title),
  UNIQUE (id, expense_category_id)
);

INSERT INTO expense_categories (title, icon) VALUES ('Operational expenses', '💸')
ON CONFLICT (title) DO NOTHING;

INSERT INTO expense_types (expense_category_id, title, icon)
SELECT id, item.title, item.icon
FROM expense_categories
CROSS JOIN (VALUES
  ('Filling charges', '🔥'),
  ('Society entry fee', '🚧'),
  ('Photo copy', '📄'),
  ('Vehicle fuel', '⛽')
) AS item(title, icon)
WHERE expense_categories.title = 'Operational expenses'
ON CONFLICT (expense_category_id, title) DO NOTHING;

CREATE TABLE IF NOT EXISTS expenses (
  id BIGSERIAL PRIMARY KEY,
  expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  expense_type_id BIGINT NOT NULL,
  employee_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT expenses_type_in_category_fk FOREIGN KEY (expense_type_id, expense_category_id) REFERENCES expense_types(id, expense_category_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS reminders (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ NULL,
  employee_id BIGINT NULL REFERENCES employees(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sales_leads_status_idx ON sales_leads(status);
CREATE INDEX IF NOT EXISTS client_branches_client_idx ON client_branches(client_id);
CREATE INDEX IF NOT EXISTS expenses_created_at_idx ON expenses(created_at DESC);
