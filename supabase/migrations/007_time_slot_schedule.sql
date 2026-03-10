-- =============================================================================
-- Migration 007 — Time Slot Schedule + Time Record restructure
--
-- 1. hr.time_slot_schedule  — defines shift types (graveyard, AM, PM, etc.)
-- 2. ALTER hr.time_record   — add time_slot_id, time_identifier, total_hours
-- 3. hr.calc_time_record_hours() — pairs IN/OUT records to compute total_hours
-- =============================================================================

-- =============================================================================
-- SECTION 1 — TIME SLOT SCHEDULE
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr.time_slot_schedule (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  description           TEXT          NOT NULL UNIQUE,       -- e.g. "grave_yard", "am", "pm", "shift1", "regular_1"
  time_start            TIME          NOT NULL,              -- e.g. 00:00 (12am), 08:00, 16:00
  time_end              TIME          NOT NULL,              -- e.g. 08:00, 16:00, 00:00
  actual_date           SMALLINT      NOT NULL DEFAULT 1     -- 1 = count on clock-in day, 2 = count on next day
                        CHECK (actual_date IN (1, 2)),
  is_midnight_crossing  BOOLEAN       NOT NULL DEFAULT false,
  is_active             BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Seed standard time slots from the schedule reference
INSERT INTO hr.time_slot_schedule (description, time_start, time_end, actual_date, is_midnight_crossing) VALUES
  ('grave_yard',  '00:00', '08:00', 2, true),
  ('am',          '08:00', '16:00', 1, false),
  ('pm',          '16:00', '00:00', 1, true),
  ('shift1',      '20:00', '08:00', 1, true),
  ('regular_1',   '08:00', '12:00', 1, false),
  ('regular_2',   '13:00', '17:00', 1, false)
ON CONFLICT (description) DO UPDATE
  SET time_start           = EXCLUDED.time_start,
      time_end             = EXCLUDED.time_end,
      actual_date          = EXCLUDED.actual_date,
      is_midnight_crossing = EXCLUDED.is_midnight_crossing;

-- RLS
ALTER TABLE hr.time_slot_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hr_time_slot_schedule_r"
  ON hr.time_slot_schedule FOR SELECT TO authenticated USING (true);

CREATE POLICY "hr_time_slot_schedule_w"
  ON hr.time_slot_schedule FOR ALL TO service_role USING (true);

-- =============================================================================
-- SECTION 2 — ALTER TIME RECORD
-- Add time_slot_id, time_identifier (1=IN, 2=OUT), total_hours
-- Drop old unique constraint, add new one that allows multiple entries per day
-- =============================================================================

-- Add new columns
ALTER TABLE hr.time_record
  ADD COLUMN IF NOT EXISTS time_slot_id     UUID      REFERENCES hr.time_slot_schedule(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_identifier  SMALLINT  DEFAULT 1 CHECK (time_identifier IN (1, 2)),
  ADD COLUMN IF NOT EXISTS total_hours      NUMERIC(6,2) DEFAULT 0;

-- Drop old unique constraint to allow multiple records per person per date
-- (e.g. regular_1 + regular_2 on same day, or IN + OUT as separate rows)
ALTER TABLE hr.time_record DROP CONSTRAINT IF EXISTS time_record_per_id_date_key;

-- New unique: one IN or OUT per person × date × time_slot
CREATE UNIQUE INDEX IF NOT EXISTS uq_time_record_per_date_slot_ident
  ON hr.time_record (per_id, date, time_slot_id, time_identifier);

-- Index for the pairing lookup
CREATE INDEX IF NOT EXISTS idx_time_record_slot_lookup
  ON hr.time_record (per_id, time_slot_id, time_identifier, date);

-- =============================================================================
-- SECTION 3 — HOURS CALCULATION FUNCTION
--
-- Runs when a time_identifier=2 (OUT) record is inserted or updated.
-- Finds the matching time_identifier=1 (IN) record:
--   • If midnight_crossing: look on same date first, then previous date
--   • If NOT midnight_crossing: look on same date only
-- Computes total_hours = out_time - in_time (handling midnight wrap)
-- Stores total_hours on BOTH the OUT record and the IN record.
-- =============================================================================

CREATE OR REPLACE FUNCTION hr.calc_time_record_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_midnight   BOOLEAN;
  v_in_record     RECORD;
  v_in_time       TIME;
  v_out_time      TIME;
  v_hours         NUMERIC(6,2);
BEGIN
  -- Only calculate when processing an OUT record (time_identifier = 2)
  IF NEW.time_identifier <> 2 THEN
    RETURN NEW;
  END IF;

  -- Skip if no time_slot assigned
  IF NEW.time_slot_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get midnight crossing flag for this time slot
  SELECT is_midnight_crossing INTO v_is_midnight
    FROM hr.time_slot_schedule
   WHERE id = NEW.time_slot_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Determine the out time from whichever column is set (in1/out1/in2/out2 or legacy)
  v_out_time := COALESCE(NEW.out1, NEW.out2);

  IF v_out_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the matching IN record (time_identifier = 1)
  IF v_is_midnight THEN
    -- Midnight crossing: try same date first
    SELECT * INTO v_in_record
      FROM hr.time_record
     WHERE per_id          = NEW.per_id
       AND time_slot_id    = NEW.time_slot_id
       AND time_identifier = 1
       AND date            = NEW.date
     LIMIT 1;

    -- If not found, try previous date
    IF NOT FOUND THEN
      SELECT * INTO v_in_record
        FROM hr.time_record
       WHERE per_id          = NEW.per_id
         AND time_slot_id    = NEW.time_slot_id
         AND time_identifier = 1
         AND date            = NEW.date - INTERVAL '1 day'
       LIMIT 1;
    END IF;
  ELSE
    -- Non-midnight crossing: same date only
    SELECT * INTO v_in_record
      FROM hr.time_record
     WHERE per_id          = NEW.per_id
       AND time_slot_id    = NEW.time_slot_id
       AND time_identifier = 1
       AND date            = NEW.date
     LIMIT 1;
  END IF;

  -- If no matching IN record found, cannot calculate
  IF NOT FOUND OR v_in_record IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  -- Get the in time
  v_in_time := COALESCE(v_in_record.in1, v_in_record.in2);

  IF v_in_time IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  -- Calculate hours
  IF v_is_midnight AND v_out_time < v_in_time THEN
    -- Crosses midnight: add 24h to out_time for calculation
    v_hours := ROUND(
      (EXTRACT(EPOCH FROM (v_out_time - v_in_time)) + 86400) / 3600.0, 2
    );
  ELSE
    v_hours := ROUND(
      EXTRACT(EPOCH FROM (v_out_time - v_in_time)) / 3600.0, 2
    );
  END IF;

  -- Ensure non-negative
  IF v_hours < 0 THEN
    v_hours := 0;
  END IF;

  -- Set total_hours on the OUT record
  NEW.total_hours := v_hours;

  -- Also update total_hours on the matching IN record
  UPDATE hr.time_record
     SET total_hours = v_hours
   WHERE id = v_in_record.id;

  RETURN NEW;
END;
$$;

-- Trigger: fires on INSERT or UPDATE of OUT records
DROP TRIGGER IF EXISTS trg_calc_time_record_hours ON hr.time_record;

CREATE TRIGGER trg_calc_time_record_hours
  BEFORE INSERT OR UPDATE OF out1, out2, time_slot_id, time_identifier
  ON hr.time_record
  FOR EACH ROW EXECUTE FUNCTION hr.calc_time_record_hours();
