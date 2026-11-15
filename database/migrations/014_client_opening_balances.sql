-- Opening financial receivable per client on the go-live date.
-- Positive amount = client owes the company; negative amount = client credit.

CREATE TABLE IF NOT EXISTS client_opening_balances (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  opening_date DATE NOT NULL,
  opening_receivable_amount NUMERIC(16, 2) NOT NULL DEFAULT 0,
  notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT client_opening_balances_client_date_unique UNIQUE (client_id, opening_date)
);

CREATE INDEX IF NOT EXISTS client_opening_balances_date_idx
  ON client_opening_balances (opening_date, client_id);
