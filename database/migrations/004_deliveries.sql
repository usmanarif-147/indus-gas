-- A delivery starts as a branch request and is completed with the actual
-- cylinder exchange and closing count confirmed at the branch.

CREATE TABLE IF NOT EXISTS deliveries (
  id BIGSERIAL PRIMARY KEY,
  delivery_no TEXT NOT NULL UNIQUE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  assigned_driver_id BIGINT NULL,
  delivery_date DATE NOT NULL,
  requested_commercial_cylinders INTEGER NOT NULL DEFAULT 0 CHECK (requested_commercial_cylinders >= 0),
  requested_domestic_cylinders INTEGER NOT NULL DEFAULT 0 CHECK (requested_domestic_cylinders >= 0),
  delivery_count INTEGER NOT NULL CHECK (delivery_count > 0),
  commercial_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_count >= 0),
  commercial_cylinder_collected INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_collected >= 0),
  commercial_cylinder_closing INTEGER NULL CHECK (commercial_cylinder_closing >= 0),
  domestic_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_count >= 0),
  domestic_cylinder_collected INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_collected >= 0),
  domestic_cylinder_closing INTEGER NULL CHECK (domestic_cylinder_closing >= 0),
  route_sequence INTEGER NULL CHECK (route_sequence > 0),
  delivery_time TIME NULL,
  status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
  receiver_details JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT deliveries_requested_cylinders_check CHECK (
    requested_commercial_cylinders > 0 OR requested_domestic_cylinders > 0
  ),
  CONSTRAINT deliveries_driver_route_sequence_unique UNIQUE (
    delivery_date, assigned_driver_id, route_sequence
  ),
  CONSTRAINT deliveries_branch_delivery_count_unique UNIQUE (
    branch_id, delivery_count
  )
);

CREATE INDEX IF NOT EXISTS deliveries_branch_date_idx ON deliveries (branch_id, delivery_date DESC);
CREATE INDEX IF NOT EXISTS deliveries_driver_date_idx ON deliveries (assigned_driver_id, delivery_date, route_sequence);

COMMENT ON COLUMN deliveries.status IS '0 = pending, 1 = done, 2 = cancelled';
COMMENT ON COLUMN deliveries.route_sequence IS 'Driver route order for this delivery date, for example 1 = first stop.';
COMMENT ON COLUMN deliveries.delivery_count IS 'Sequential supply number for this branch.';
COMMENT ON COLUMN deliveries.commercial_cylinder_count IS 'Filled commercial cylinders delivered.';
COMMENT ON COLUMN deliveries.commercial_cylinder_collected IS 'Empty commercial cylinders collected from the branch.';
COMMENT ON COLUMN deliveries.commercial_cylinder_closing IS 'Actual commercial-cylinder count confirmed at the branch after delivery.';
COMMENT ON COLUMN deliveries.domestic_cylinder_count IS 'Filled domestic cylinders delivered.';
COMMENT ON COLUMN deliveries.domestic_cylinder_collected IS 'Empty domestic cylinders collected from the branch.';
COMMENT ON COLUMN deliveries.domestic_cylinder_closing IS 'Actual domestic-cylinder count confirmed at the branch after delivery.';
COMMENT ON COLUMN deliveries.receiver_details IS 'JSON object containing the receiver name, phone_number, and cnic_number.';

CREATE TABLE IF NOT EXISTS delivery_instructions (
  id BIGSERIAL PRIMARY KEY,
  delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE CASCADE,
  instruction_type TEXT NOT NULL CHECK (
    instruction_type IN (
      'cylinder_inspection',
      'collect_cash',
      'call_after_delivery',
      'cash_before_unloading',
      'other_note'
    )
  ),
  cash_amount NUMERIC(16, 2) NULL CHECK (cash_amount IS NULL OR cash_amount > 0),
  note TEXT NULL,
  status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1, 2)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT delivery_instructions_cash_instruction_check CHECK (
    (instruction_type = 'collect_cash' AND cash_amount IS NOT NULL)
    OR
    (instruction_type <> 'collect_cash' AND cash_amount IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS delivery_instructions_delivery_idx ON delivery_instructions (delivery_id);

COMMENT ON COLUMN delivery_instructions.status IS '0 = pending, 1 = completed, 2 = skipped';
