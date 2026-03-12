-- =============================================================================
-- Migration 009 — Add "in"/"out" columns to hr.time_record and fix triggers
--
-- PROBLEM:
--   Migration 001 built time_record with in1/out1/in2/out2 columns.
--   Migration 007 added time_slot_id / time_identifier / total_hours but
--   its calc_time_record_hours() function still referenced in1/out1/out2.
--   The application layer (insertTimeRecord) already sends the columns as
--   "in" / "out". This migration wires everything together.
--
-- CHANGES:
--   1. Add "in" TIME and "out" TIME columns to hr.time_record.
--   2. RLS write policies for hr.time_record so authenticated users can
--      INSERT/UPDATE records (DTR clock-in / clock-out).
--   3. Replace calc_time_record_hours() — use NEW."out" / v_in_record."in".
--   4. Replace calc_time_record_pay()  — derive pay from total_hours
--      (set by the hours trigger which fires first alphabetically) or from
--      the flat daily rate for is_perday employees.
--   5. Recreate both triggers referencing the correct columns.
--   6. RLS write policy for hr.pay_slip.
-- =============================================================================

-- =============================================================================
-- SECTION 1 — Add "in" and "out" columns
-- =============================================================================

ALTER TABLE hr.time_record
  ADD COLUMN IF NOT EXISTS "in"  TIME,
  ADD COLUMN IF NOT EXISTS "out" TIME;

-- =============================================================================
-- SECTION 2 — RLS write policies for hr.time_record
-- =============================================================================

-- Allow authenticated HR users to insert clock-in / clock-out rows.
-- The trigger (SECURITY DEFINER) handles the sensitive pay computation.
DROP POLICY IF EXISTS "hr_time_record_insert" ON hr.time_record;
CREATE POLICY "hr_time_record_insert"
  ON hr.time_record FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "hr_time_record_update" ON hr.time_record;
CREATE POLICY "hr_time_record_update"
  ON hr.time_record FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "hr_time_record_service_w" ON hr.time_record;
CREATE POLICY "hr_time_record_service_w"
  ON hr.time_record FOR ALL TO service_role USING (true);

-- =============================================================================
-- SECTION 3 — FUNCTION: calc_time_record_hours
--
-- Fires BEFORE INSERT OR UPDATE OF "out", time_slot_id, time_identifier.
-- Only runs for OUT records (time_identifier = 2).
-- Finds the paired IN record and computes total_hours for both rows.
-- Midnight-crossing shifts are handled via the is_midnight_crossing flag.
-- =============================================================================

CREATE OR REPLACE FUNCTION hr.calc_time_record_hours()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_midnight  BOOLEAN;
  v_in_record    RECORD;
  v_in_time      TIME;
  v_out_time     TIME;
  v_hours        NUMERIC(6,2);
BEGIN
  -- Only process OUT records
  IF NEW.time_identifier <> 2 THEN
    RETURN NEW;
  END IF;

  -- Skip if no time slot assigned (unscheduled record)
  IF NEW.time_slot_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Look up midnight-crossing flag for this shift
  SELECT is_midnight_crossing INTO v_is_midnight
    FROM hr.time_slot_schedule
   WHERE id = NEW.time_slot_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Get clock-out time from the new "out" column
  v_out_time := NEW."out";

  IF v_out_time IS NULL THEN
    RETURN NEW;
  END IF;

  -- ── Find the paired IN record (time_identifier = 1) ──────────────────────
  IF v_is_midnight THEN
    -- Midnight-crossing shift: try same date first
    SELECT * INTO v_in_record
      FROM hr.time_record
     WHERE per_id          = NEW.per_id
       AND time_slot_id    = NEW.time_slot_id
       AND time_identifier = 1
       AND date            = NEW.date
     LIMIT 1;

    -- Fallback: previous calendar date (employee clocked in before midnight)
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
    -- Regular (non-midnight) shift: same date only
    SELECT * INTO v_in_record
      FROM hr.time_record
     WHERE per_id          = NEW.per_id
       AND time_slot_id    = NEW.time_slot_id
       AND time_identifier = 1
       AND date            = NEW.date
     LIMIT 1;
  END IF;

  IF NOT FOUND OR v_in_record IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  -- Get clock-in time from the "in" column of the paired record
  v_in_time := v_in_record."in";

  IF v_in_time IS NULL THEN
    NEW.total_hours := 0;
    RETURN NEW;
  END IF;

  -- ── Compute hours worked ──────────────────────────────────────────────────
  IF v_is_midnight AND v_out_time < v_in_time THEN
    -- Crosses midnight: add 24 hours to the elapsed epoch
    v_hours := ROUND(
      (EXTRACT(EPOCH FROM (v_out_time - v_in_time)) + 86400) / 3600.0, 2
    );
  ELSE
    v_hours := ROUND(
      EXTRACT(EPOCH FROM (v_out_time - v_in_time)) / 3600.0, 2
    );
  END IF;

  -- Guard against negative values (e.g., data entry error)
  IF v_hours < 0 THEN
    v_hours := 0;
  END IF;

  -- Set total_hours on the OUT record (NEW row)
  NEW.total_hours := v_hours;

  -- Also back-fill total_hours on the matched IN record
  UPDATE hr.time_record
     SET total_hours = v_hours
   WHERE id = v_in_record.id;

  RETURN NEW;
END;
$$;

-- Drop the old trigger (may reference out1/out2 columns from migration 007)
DROP TRIGGER IF EXISTS trg_calc_time_record_hours ON hr.time_record;

CREATE TRIGGER trg_calc_time_record_hours
  BEFORE INSERT OR UPDATE OF "out", time_slot_id, time_identifier
  ON hr.time_record
  FOR EACH ROW EXECUTE FUNCTION hr.calc_time_record_hours();

-- =============================================================================
-- SECTION 4 — FUNCTION: calc_time_record_pay
--
-- Fires BEFORE INSERT OR UPDATE OF "in", "out".
-- trg_calc_time_record_hours fires first (alphabetically h < p), so
-- NEW.total_hours is already populated when this function runs.
--
-- Formula — CSC-DBM Joint Circular No. 1, s. 2023:
--   Daily rate  = Monthly Salary ÷ 22 working days
--   Hourly rate = Daily rate ÷ 8 hours
--
--   is_perday = true  →  OUT record: pay = ROUND(monthly_salary / 22, 2)
--                        IN  record: pay = 0
--   is_perday = false →  pay = ROUND(total_hours × (monthly_salary / 22 / 8), 2)
-- =============================================================================

CREATE OR REPLACE FUNCTION hr.calc_time_record_pay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_monthly_salary  NUMERIC(12,2);
  v_is_perday       BOOLEAN;
  v_daily_rate      NUMERIC(14,6);
  v_hourly_rate     NUMERIC(14,6);
BEGIN
  -- ── Resolve rate chain ────────────────────────────────────────────────────
  -- hr.rate.amount is the DBM monthly salary for the position's salary grade.
  SELECT r.amount, sr.is_perday
    INTO v_monthly_salary, v_is_perday
    FROM hr.personnel   p
    JOIN hr.position    pos ON pos.id = p.pos_id
    JOIN hr.salary_rate sr  ON sr.id  = pos.sr_id
    JOIN hr.rate        r   ON r.id   = sr.rate_id
   WHERE p.id = NEW.per_id;

  IF NOT FOUND THEN
    RAISE WARNING
      'hr.time_record: personnel id % has no position assigned — pay_amount set to 0.',
      NEW.per_id;
    NEW.pay_amount := 0;
    RETURN NEW;
  END IF;

  -- ── CSC-DBM JC No. 1, s. 2023 ────────────────────────────────────────────
  v_daily_rate  := v_monthly_salary / 22.0;
  v_hourly_rate := v_daily_rate / 8.0;

  IF v_is_perday THEN
    -- Per-day mode: one full daily rate on the OUT record only.
    -- SUM(pay_amount) over a period = days_worked × (monthly_salary / 22).
    IF NEW.time_identifier = 2 THEN
      NEW.pay_amount := ROUND(v_daily_rate, 2);
    ELSE
      NEW.pay_amount := 0;
    END IF;

  ELSE
    -- Hourly mode: total_hours already set by trg_calc_time_record_hours.
    -- pay = hours_worked × (monthly_salary / 22 / 8)
    NEW.pay_amount := ROUND(COALESCE(NEW.total_hours, 0) * v_hourly_rate, 2);
  END IF;

  RETURN NEW;
END;
$$;

-- Drop old trigger that referenced in1/out1/in2/out2
DROP TRIGGER IF EXISTS trg_calc_time_record_pay ON hr.time_record;

CREATE TRIGGER trg_calc_time_record_pay
  BEFORE INSERT OR UPDATE OF "in", "out"
  ON hr.time_record
  FOR EACH ROW EXECUTE FUNCTION hr.calc_time_record_pay();

-- =============================================================================
-- SECTION 5 — hr.pay_slip RLS policies
-- =============================================================================

ALTER TABLE hr.pay_slip ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_pay_slip_r" ON hr.pay_slip;
CREATE POLICY "hr_pay_slip_r"
  ON hr.pay_slip FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "hr_pay_slip_insert" ON hr.pay_slip;
CREATE POLICY "hr_pay_slip_insert"
  ON hr.pay_slip FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "hr_pay_slip_update" ON hr.pay_slip;
CREATE POLICY "hr_pay_slip_update"
  ON hr.pay_slip FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "hr_pay_slip_service_w" ON hr.pay_slip;
CREATE POLICY "hr_pay_slip_service_w"
  ON hr.pay_slip FOR ALL TO service_role USING (true);
