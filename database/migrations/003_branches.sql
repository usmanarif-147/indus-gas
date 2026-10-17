CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  branch_name TEXT NOT NULL,
  branch_code TEXT NOT NULL UNIQUE,
  area TEXT NULL,
  address TEXT NULL,
  contact_person JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active SMALLINT NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS branches_client_idx ON branches (client_id);

COMMENT ON COLUMN branches.contact_person IS 'JSON array, for example: [{"name": "Mohsin", "phone": "03001234567"}]';
COMMENT ON COLUMN branches.is_active IS '0 = inactive, 1 = active';
