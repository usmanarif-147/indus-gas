ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_authenticated SMALLINT NOT NULL DEFAULT 0;
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_is_authenticated_check;
ALTER TABLE employees ADD CONSTRAINT employees_is_authenticated_check CHECK (is_authenticated IN (0, 1));
UPDATE employees SET is_authenticated = 0 WHERE is_authenticated IS NULL;
COMMENT ON COLUMN employees.is_authenticated IS '0 = PWA access blocked, 1 = PWA access allowed with managed credentials';
