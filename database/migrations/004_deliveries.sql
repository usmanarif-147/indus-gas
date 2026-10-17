CREATE TABLE IF NOT EXISTS deliveries (
  id BIGSERIAL PRIMARY KEY,
  delivery_no TEXT NOT NULL UNIQUE,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  delivery_date DATE NOT NULL,
  delivery_count INTEGER NOT NULL CHECK (delivery_count >= 0),
  commercial_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_count >= 0),
  commercial_cylinder_collected INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_collected >= 0),
  commercial_cylinder_closing INTEGER NOT NULL DEFAULT 0 CHECK (commercial_cylinder_closing >= 0),
  domestic_cylinder_count INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_count >= 0),
  domestic_cylinder_collected INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_collected >= 0),
  domestic_cylinder_closing INTEGER NOT NULL DEFAULT 0 CHECK (domestic_cylinder_closing >= 0),
  status SMALLINT NOT NULL DEFAULT 0 CHECK (status IN (0, 1)),
  receiver_details JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS deliveries_branch_date_idx ON deliveries (branch_id, delivery_date DESC);

COMMENT ON COLUMN deliveries.delivery_count IS 'Sequential supply number for this branch, for example 15 = fifteenth delivery';
COMMENT ON COLUMN deliveries.status IS '0 = pending, 1 = done';
COMMENT ON COLUMN deliveries.receiver_details IS 'JSON array, for example: [{"name": "Ali", "phone_number": "03001234567", "cnic_number": "..."}]';
