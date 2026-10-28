CREATE TABLE IF NOT EXISTS daily_operations (
  id BIGSERIAL PRIMARY KEY,
  operation_date DATE NOT NULL,
  assigned_employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  task_category TEXT NOT NULL,
  title TEXT NOT NULL,
  branch_id BIGINT NULL REFERENCES branches(id) ON DELETE SET NULL,
  scheduled_time TIME NULL,
  notes TEXT NULL,
  status SMALLINT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT daily_operations_status_check CHECK (status IN (0, 1, 2)),
  CONSTRAINT daily_operations_category_check CHECK (
    task_category IN (
      'filling_visit', 'cylinder_delivery', 'vehicle_task',
      'new_client_meeting', 'payment_collection', 'follow_up',
      'cylinder_inspection', 'other'
    )
  ),
  CONSTRAINT daily_operations_title_check CHECK (length(trim(title)) > 0)
);

CREATE INDEX IF NOT EXISTS daily_operations_date_index ON daily_operations(operation_date);
CREATE INDEX IF NOT EXISTS daily_operations_employee_date_index ON daily_operations(assigned_employee_id, operation_date);
CREATE INDEX IF NOT EXISTS daily_operations_employee_published_date_index ON daily_operations(assigned_employee_id, operation_date) WHERE published_at IS NOT NULL;
