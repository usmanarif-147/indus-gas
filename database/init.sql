CREATE TYPE employee_role AS ENUM ('driver', 'helper', 'salesman', 'partner_admin');

CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  role employee_role NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX activity_log_created_at_idx ON activity_log (created_at DESC);
