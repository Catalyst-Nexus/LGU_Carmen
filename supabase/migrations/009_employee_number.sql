-- =============================================================================
-- Migration 009 — Employee Number
--
-- Adds a unique, auto-generated employee_no to hr.personnel.
-- Format: EMP-NNNN (global sequence, never resets)
-- Linked to the person's UUID (hr.personnel.id) via the same row.
-- The trigger fires BEFORE INSERT when employee_no is NULL.
-- =============================================================================

-- Dedicated sequence — thread-safe, no race conditions
CREATE SEQUENCE IF NOT EXISTS hr.employee_no_seq
  START 1 INCREMENT 1 NO MAXVALUE NO CYCLE;

-- Add the column (nullable first so backfill can populate existing rows)
ALTER TABLE hr.personnel
  ADD COLUMN IF NOT EXISTS employee_no TEXT UNIQUE;

-- Auto-generate trigger function
CREATE OR REPLACE FUNCTION hr.generate_employee_no()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.employee_no IS NULL THEN
    NEW.employee_no := 'EMP-' || LPAD(nextval('hr.employee_no_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_employee_no ON hr.personnel;
CREATE TRIGGER trg_generate_employee_no
  BEFORE INSERT ON hr.personnel
  FOR EACH ROW EXECUTE FUNCTION hr.generate_employee_no();

-- Backfill existing records in created_at order
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id FROM hr.personnel
    WHERE employee_no IS NULL
    ORDER BY created_at, id
  LOOP
    UPDATE hr.personnel
       SET employee_no = 'EMP-' || LPAD(nextval('hr.employee_no_seq')::TEXT, 4, '0')
     WHERE id = r.id;
  END LOOP;
END;
$$;

-- Enforce NOT NULL + add a fast lookup index
ALTER TABLE hr.personnel ALTER COLUMN employee_no SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_personnel_employee_no ON hr.personnel(employee_no);
