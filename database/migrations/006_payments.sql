-- Payments received from a particular client branch.

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_mode SMALLINT NOT NULL DEFAULT 0 CHECK (payment_mode IN (0, 1, 2)),
  debit NUMERIC(16, 2) NOT NULL DEFAULT 0,
  credit NUMERIC(16, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(16, 2) GENERATED ALWAYS AS (debit - credit) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_non_negative_amounts_check CHECK (debit >= 0 AND credit >= 0)
);

CREATE INDEX IF NOT EXISTS payments_branch_date_idx ON payments (branch_id, payment_date DESC);

COMMENT ON COLUMN payments.payment_mode IS '0 = cash, 1 = bank transfer, 2 = cheque';
COMMENT ON COLUMN payments.balance IS 'Automatically calculated as debit minus credit';
