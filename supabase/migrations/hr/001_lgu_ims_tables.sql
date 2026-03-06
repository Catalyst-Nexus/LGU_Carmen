-- =============================================================================
-- LGU Integrated Management System — HR & Payroll Migration
-- Municipality of Carmen | hr schema
--
-- All fixes and improvements applied:
--   FIX #1  pay_slip_deductions table (flexible, no hardcoded columns)
--   FIX #2  personnel_leave_credits.current_balance + guard triggers
--   FIX #3  hr.ot_type — dynamic OT multipliers (Regular 1.25, Night 1.10, etc.)
--   FIX #4  RAISE WARNING in pay trigger when personnel has no position
--   FIX #5  pay_slip uses period_start DATE + period_end DATE (not TEXT month)
--   FIX #6  time_record stores rate_snapshot + is_perday_snapshot (audit trail)
--   IMP #7  Civil service fields on personnel (GSIS, PhilHealth, Pag-IBIG, TIN)
--   IMP #8  hr.deduction_type — dynamic deduction registry
--   IMP #9  Approval workflow on pay_slip and payroll (prepared/certified/approved)
--   IMP #10 hr.payroll_fund_lines — GF/SEF/TRUST breakdown per payroll run
--   IMP #11 hr.service_record — CSC employment history per personnel
--   IMP #12 Leave credit restore trigger on delete
--   IMP #13 Covering indexes for payroll batch generation
-- =============================================================================

-- =============================================================================
-- SCHEMA + GRANTS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS hr;

GRANT USAGE ON SCHEMA hr TO authenticated;
GRANT USAGE ON SCHEMA hr TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA hr
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA hr
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

-- =============================================================================
-- SECTION 1 — LOOKUP / REFERENCE TABLES
--   Fully dynamic: add rows to these tables, no code changes needed.
-- =============================================================================

-- --------------------------
-- POSITION TYPE
-- e.g. Permanent, Casual, Coterminous, Job Order
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.pos_type (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- OFFICE / DEPARTMENT
-- Normalized list — add new offices here without touching other tables
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.office (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL,
  code        TEXT        UNIQUE,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- RATE
-- The base peso amount per computation unit (daily or hourly)
-- Add new salary grades here without altering application code
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.rate (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT          NOT NULL,          -- e.g. "SG-10 Step 1"
  amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- --------------------------
-- SALARY RATE
-- Binds a rate to a computation mode.
-- is_perday = true  → fixed daily amount regardless of hours
-- is_perday = false → amount × hours (+ OT multiplier from ot_type)
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.salary_rate (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL,
  rate_id     UUID        NOT NULL REFERENCES hr.rate(id),
  is_perday   BOOLEAN     NOT NULL DEFAULT false,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- OT TYPE  (FIX #3)
-- Dynamic OT multipliers — fully mutable.
-- • Add / edit / deactivate rows in the system UI (Settings → OT Types).
-- • Update multipliers here and re-run the migration; existing rows are
--   updated via ON CONFLICT DO UPDATE, user-added rows are untouched.
-- • base_type 'hourly' → multiplier × hourly_rate × ot_hours
-- • base_type 'daily'  → multiplier × daily_rate (flat day premium)
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.ot_type (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT          NOT NULL UNIQUE,
  multiplier  NUMERIC(5,3)  NOT NULL DEFAULT 1.25
              CHECK (multiplier > 0),
  base_type   TEXT          NOT NULL DEFAULT 'hourly'
              CHECK (base_type IN ('hourly', 'daily')),
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Seed standard OT types.
-- ON CONFLICT DO UPDATE: re-running this migration (or a newer one with
-- revised multipliers) will update the seeded rows while leaving any
-- custom rows the admin added through the UI completely untouched.
INSERT INTO hr.ot_type (description, multiplier, base_type) VALUES
  ('Regular Overtime',    1.250, 'hourly'),
  ('Night Differential',  1.100, 'hourly'),
  ('Legal Holiday OT',    2.000, 'hourly'),
  ('Special Holiday OT',  1.300, 'hourly')
ON CONFLICT (description) DO UPDATE
  SET multiplier = EXCLUDED.multiplier,
      base_type  = EXCLUDED.base_type;

-- --------------------------
-- DEDUCTION TYPE  (FIX #1 / IMP #8)
-- Dynamic deduction registry — add new deduction types without schema changes.
-- computation_type:
--   'fixed'      → amount column is the flat deduction
--   'percentage' → amount column is the % of gross (e.g. 0.09 for 9%)
--   'tax_table'  → amount is looked up via BIR withholding table (app logic)
--   'manual'     → entered manually on each pay slip
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.deduction_type (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code             TEXT          NOT NULL UNIQUE,   -- 'GSIS', 'PHILHEALTH', 'PAGIBIG', 'BIR', 'GSIS_LOAN'
  description      TEXT          NOT NULL,
  computation_type TEXT          NOT NULL DEFAULT 'percentage'
                   CHECK (computation_type IN ('fixed','percentage','tax_table','manual')),
  default_rate     NUMERIC(12,4) NOT NULL DEFAULT 0, -- % as decimal (0.09) or fixed peso amount (100, 200, etc.)
  is_mandatory     BOOLEAN       NOT NULL DEFAULT false,
  is_active        BOOLEAN       NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Seed standard government deductions.
-- ON CONFLICT DO UPDATE: re-running updates seeded rows;
-- custom deduction types added via the UI are untouched.
INSERT INTO hr.deduction_type (code, description, computation_type, default_rate, is_mandatory) VALUES
  ('GSIS_PS',      'GSIS Personal Share (9%)',   'percentage', 0.09000, true),
  ('GSIS_GS',      'GSIS Government Share (12%)','percentage', 0.12000, true),
  ('PHILHEALTH',   'PhilHealth Contribution',     'percentage', 0.05000, true),
  ('PAGIBIG',      'Pag-IBIG Fund Contribution',  'fixed',      100.000, true),
  ('BIR_WTX',      'BIR Withholding Tax',         'tax_table',  0.00000, true),
  ('GSIS_LOAN',    'GSIS Loan',                   'manual',     0.00000, false),
  ('PAGIBIG_LOAN', 'Pag-IBIG Loan',               'manual',     0.00000, false),
  ('SALARY_LOAN',  'Salary Loan',                 'manual',     0.00000, false)
ON CONFLICT (code) DO UPDATE
  SET description      = EXCLUDED.description,
      computation_type = EXCLUDED.computation_type,
      default_rate     = EXCLUDED.default_rate,
      is_mandatory     = EXCLUDED.is_mandatory;

-- --------------------------
-- POSITION  (plantilla item)
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.position (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL,
  item_no     TEXT        NOT NULL UNIQUE,
  sr_id       UUID        NOT NULL REFERENCES hr.salary_rate(id),
  pt_id       UUID        NOT NULL REFERENCES hr.pos_type(id),
  o_id        UUID        REFERENCES hr.office(id),
  is_filled   BOOLEAN     NOT NULL DEFAULT false,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- SECTION 2 — PERSONNEL  (IMP #7 civil service fields)
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr.personnel (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Supabase auth link (optional — not all personnel have system accounts)
  user_id           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Position & Office
  pos_id            UUID        REFERENCES hr.position(id) ON DELETE SET NULL,
  o_id              UUID        NOT NULL REFERENCES hr.office(id),
  -- Name
  first_name        TEXT        NOT NULL,
  middle_name       TEXT        NOT NULL DEFAULT '',
  last_name         TEXT        NOT NULL,
  suffix            TEXT        NOT NULL DEFAULT '',
  -- Civil Service / HR fields
  birth_date        DATE,
  civil_status      TEXT        CHECK (civil_status IN ('single','married','widowed','separated')),
  blood_type        TEXT,
  contact_number    TEXT,
  address           TEXT        NOT NULL DEFAULT '',
  -- Government IDs
  gsis_number       TEXT        UNIQUE,
  philhealth_number TEXT        UNIQUE,
  pagibig_number    TEXT        UNIQUE,
  tin               TEXT        UNIQUE,
  -- Employment
  employment_status TEXT        NOT NULL DEFAULT 'permanent'
                    CHECK (employment_status IN ('permanent','casual','coterminous','contractual','job_order')),
  date_hired        DATE        NOT NULL,
  -- Separation (nullable until separated)
  separation_date   DATE,
  separation_type   TEXT        CHECK (separation_type IN
                    ('resignation','retirement','dismissed','end_of_contract','death','transfer','promotion')),
  -- Status
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- SECTION 3 — SERVICE RECORD  (IMP #11)
-- CSC employment history — each row = one period/appointment for a person
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr.service_record (
  id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id           UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  pos_id           UUID          REFERENCES hr.position(id) ON DELETE SET NULL,
  o_id             UUID          REFERENCES hr.office(id) ON DELETE SET NULL,
  record_type      TEXT          NOT NULL
                   CHECK (record_type IN
                   ('appointment','promotion','transfer','reinstatement','reappointment','separation','step_increment')),
  appointment_status TEXT,
  monthly_salary   NUMERIC(12,2) NOT NULL DEFAULT 0,
  effective_date   DATE          NOT NULL,
  end_date         DATE,
  separation_type  TEXT          CHECK (separation_type IN
                   ('resignation','retirement','dismissed','end_of_contract','death','transfer','promotion')),
  remarks          TEXT          NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================================
-- SECTION 4 — LEAVE SYSTEM
-- =============================================================================

-- --------------------------
-- LEAVE OUT TYPE
-- Top-level: "Leave" or "Travel" (dynamic — add rows)
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.leave_out_type (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL UNIQUE,   -- "Leave", "Travel"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- LEAVE OUT SUBTYPE
-- e.g. Vacation Leave, Sick Leave, Maternity, Paternity, SPL
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.leave_out_subtype (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT        NOT NULL,
  code        TEXT        NOT NULL UNIQUE,   -- 'VL', 'SL', 'ML', 'PL', 'SPL', 'FL', 'CL'
  lot_id      UUID        NOT NULL REFERENCES hr.leave_out_type(id),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- PERSONNEL LEAVE CREDITS  (FIX #2)
-- One row per person × leave_out_type.
-- current_balance is updated by triggers on leave_out_dates insert/delete.
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.personnel_leave_credits (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id          UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  lot_id          UUID          NOT NULL REFERENCES hr.leave_out_type(id),
  begin_balance   NUMERIC(7,3)  NOT NULL DEFAULT 0,   -- credits at period start
  earned          NUMERIC(7,3)  NOT NULL DEFAULT 0,   -- credits earned this period
  current_balance NUMERIC(7,3)  NOT NULL DEFAULT 0,   -- live running balance
  is_available    BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (per_id, lot_id)
);

-- --------------------------
-- PERSONNEL LEAVE OUT  (the leave/travel application)
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.personnel_leave_out (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id         UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  los_id         UUID          NOT NULL REFERENCES hr.leave_out_subtype(id),
  applied_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  approved_date  DATE,
  approved_by    UUID          REFERENCES hr.personnel(id) ON DELETE SET NULL,
  pay_amount     NUMERIC(12,2) NOT NULL DEFAULT 0,   -- cash advance / monetization
  credits        NUMERIC(7,3)  NOT NULL DEFAULT 0,   -- total leave credits consumed
  status         TEXT          NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','denied','cancelled')),
  remarks        TEXT          NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- --------------------------
-- LEAVE OUT DATES
-- One row = one calendar day deducted from a leave_credits entry.
-- Triggers enforce: (a) balance doesn't go negative; (b) restores on delete.
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.leave_out_dates (
  id      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  plaid   UUID        NOT NULL REFERENCES hr.personnel_leave_out(id) ON DELETE CASCADE,
  plc_id  UUID        NOT NULL REFERENCES hr.personnel_leave_credits(id),
  date    DATE        NOT NULL,
  UNIQUE (plaid, date)
);

-- Trigger: deduct 1 credit when a leave date is filed  (FIX #2 / IMP #12)
CREATE OR REPLACE FUNCTION hr.deduct_leave_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE hr.personnel_leave_credits
    SET current_balance = current_balance - 1.0
  WHERE id = NEW.plc_id
  RETURNING current_balance INTO v_new_balance;

  IF v_new_balance < 0 THEN
    RAISE EXCEPTION
      'Insufficient leave credits. Balance would be % for personnel_leave_credits.id = %',
      v_new_balance + 1.0, NEW.plc_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deduct_leave_credit
  AFTER INSERT ON hr.leave_out_dates
  FOR EACH ROW EXECUTE FUNCTION hr.deduct_leave_credit();

-- Trigger: restore 1 credit when a leave date is removed (IMP #12)
CREATE OR REPLACE FUNCTION hr.restore_leave_credit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE hr.personnel_leave_credits
    SET current_balance = current_balance + 1.0
  WHERE id = OLD.plc_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_restore_leave_credit
  AFTER DELETE ON hr.leave_out_dates
  FOR EACH ROW EXECUTE FUNCTION hr.restore_leave_credit();

-- =============================================================================
-- SECTION 5 — TIME RECORD  (FIX #3 #4 #6)
-- pay_amount and rate_snapshot are AUTO-SET by trigger.
-- =============================================================================

CREATE TABLE IF NOT EXISTS hr.time_record (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id              UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  date                DATE          NOT NULL,
  -- AM/PM slots
  in1                 TIME,
  out1                TIME,
  in2                 TIME,
  out2                TIME,
  -- Overtime slot + type (FIX #3 — dynamic multiplier)
  ot_in               TIME,
  ot_out              TIME,
  ot_type_id          UUID          REFERENCES hr.ot_type(id) ON DELETE SET NULL,
  -- Rate snapshot at computation time (FIX #6 — protects history)
  rate_snapshot       NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_perday_snapshot  BOOLEAN       NOT NULL DEFAULT false,
  -- Auto-computed by trigger — do NOT set manually
  pay_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (per_id, date)
);

-- --------------------------
-- TRIGGER: auto-calculate time_record.pay_amount  (FIX #3 #4 #6)
--
-- Logic:
--   1. Resolve personnel → position → salary_rate → rate  (snapshot saved)
--   2. If is_perday  → pay_amount = rate.amount  (flat daily)
--   3. If hourly     → pay_amount = reg_hours × rate + ot_hours × rate × ot_multiplier
--       reg_hours = (out1-in1) + (out2-in2)   [decimal hours]
--       ot_hours  = ot_out - ot_in
--       ot_multiplier from hr.ot_type.multiplier (dynamic, defaults to 1.25)
--   4. RAISE WARNING if personnel has no position (FIX #4)
-- --------------------------
CREATE OR REPLACE FUNCTION hr.calc_time_record_pay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate_amount   NUMERIC(12,2);
  v_is_perday     BOOLEAN;
  v_ot_multiplier NUMERIC(5,3) := 1.25;
  v_reg_hours     NUMERIC := 0;
  v_ot_hours      NUMERIC := 0;
BEGIN
  -- Resolve rate chain: personnel → position → salary_rate → rate
  SELECT r.amount, sr.is_perday
    INTO v_rate_amount, v_is_perday
    FROM hr.personnel   p
    JOIN hr.position    pos ON pos.id = p.pos_id
    JOIN hr.salary_rate sr  ON sr.id  = pos.sr_id
    JOIN hr.rate        r   ON r.id   = sr.rate_id
   WHERE p.id = NEW.per_id;

  -- FIX #4: warn instead of silently zeroing out
  IF NOT FOUND THEN
    RAISE WARNING
      'hr.time_record: personnel id % has no position assigned — pay_amount set to 0. Assign a position to compute pay.',
      NEW.per_id;
    NEW.pay_amount         := 0;
    NEW.rate_snapshot      := 0;
    NEW.is_perday_snapshot := false;
    RETURN NEW;
  END IF;

  -- FIX #6: snapshot rate at computation time
  NEW.rate_snapshot      := v_rate_amount;
  NEW.is_perday_snapshot := v_is_perday;

  -- FIX #3: dynamic OT multiplier from ot_type row
  IF NEW.ot_type_id IS NOT NULL THEN
    SELECT multiplier INTO v_ot_multiplier
      FROM hr.ot_type
     WHERE id = NEW.ot_type_id AND is_active = true;
  END IF;

  IF v_is_perday THEN
    NEW.pay_amount := v_rate_amount;

  ELSE
    -- Regular hours — AM slot
    IF NEW.in1 IS NOT NULL AND NEW.out1 IS NOT NULL AND NEW.out1 > NEW.in1 THEN
      v_reg_hours := v_reg_hours
        + EXTRACT(EPOCH FROM (NEW.out1 - NEW.in1)) / 3600.0;
    END IF;
    -- Regular hours — PM slot
    IF NEW.in2 IS NOT NULL AND NEW.out2 IS NOT NULL AND NEW.out2 > NEW.in2 THEN
      v_reg_hours := v_reg_hours
        + EXTRACT(EPOCH FROM (NEW.out2 - NEW.in2)) / 3600.0;
    END IF;
    -- Overtime hours
    IF NEW.ot_in IS NOT NULL AND NEW.ot_out IS NOT NULL AND NEW.ot_out > NEW.ot_in THEN
      v_ot_hours := EXTRACT(EPOCH FROM (NEW.ot_out - NEW.ot_in)) / 3600.0;
    END IF;

    NEW.pay_amount := ROUND(
      (v_reg_hours * v_rate_amount) + (v_ot_hours * v_rate_amount * v_ot_multiplier),
    2);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_calc_time_record_pay
  BEFORE INSERT OR UPDATE OF in1, out1, in2, out2, ot_in, ot_out, ot_type_id
  ON hr.time_record
  FOR EACH ROW EXECUTE FUNCTION hr.calc_time_record_pay();

-- =============================================================================
-- SECTION 6 — PAY SLIP  (FIX #1 #5, IMP #9)
-- =============================================================================

-- --------------------------
-- PAY SLIP
-- One record per person per pay period.
-- gross_amount and deductions are populated when payroll is computed.
-- FIX #5: period_start/end DATE  (not TEXT month)
-- IMP #9: approval workflow columns
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.pay_slip (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  per_id            UUID          NOT NULL REFERENCES hr.personnel(id) ON DELETE CASCADE,
  -- Period (FIX #5)
  period_start      DATE          NOT NULL,
  period_end        DATE          NOT NULL,
  period_type       TEXT          NOT NULL DEFAULT 'first_half'
                    CHECK (period_type IN ('first_half','second_half','monthly','special')),
  -- Computed amounts (populated by app when generating)
  gross_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions  NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount        NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - total_deductions) STORED,
  -- Approval workflow (IMP #9)
  status            TEXT          NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','computed','approved','released')),
  prepared_by       UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  certified_by      UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by       UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  date_prepared     TIMESTAMPTZ,
  date_certified    TIMESTAMPTZ,
  date_approved     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (per_id, period_start, period_end)
);

-- --------------------------
-- PAY SLIP DEDUCTIONS  (FIX #1 / IMP #8)
-- Flexible per-slip deductions — add new types to deduction_type without schema changes.
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.pay_slip_deductions (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_slip_id       UUID          NOT NULL REFERENCES hr.pay_slip(id) ON DELETE CASCADE,
  deduction_type_id UUID          NOT NULL REFERENCES hr.deduction_type(id),
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  remarks           TEXT          NOT NULL DEFAULT '',
  UNIQUE (pay_slip_id, deduction_type_id)
);

-- Junction: pay_slip ↔ time_record (replaces array columns)
CREATE TABLE IF NOT EXISTS hr.pay_slip_time_records (
  pay_slip_id    UUID NOT NULL REFERENCES hr.pay_slip(id) ON DELETE CASCADE,
  time_record_id UUID NOT NULL REFERENCES hr.time_record(id) ON DELETE CASCADE,
  PRIMARY KEY (pay_slip_id, time_record_id)
);

-- Junction: pay_slip ↔ leave_out (leave deductions on a pay slip)
CREATE TABLE IF NOT EXISTS hr.pay_slip_leave_outs (
  pay_slip_id  UUID NOT NULL REFERENCES hr.pay_slip(id) ON DELETE CASCADE,
  leave_out_id UUID NOT NULL REFERENCES hr.personnel_leave_out(id) ON DELETE CASCADE,
  PRIMARY KEY (pay_slip_id, leave_out_id)
);

-- =============================================================================
-- SECTION 7 — PAYROLL  (IMP #9 #10)
-- =============================================================================

-- --------------------------
-- PAYROLL (batch register)
-- Groups multiple pay_slips into one payroll run.
-- IMP #9: approval workflow
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.payroll (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  period_name    TEXT          NOT NULL,
  date_from      DATE          NOT NULL,
  date_to        DATE          NOT NULL,
  fiscal_year    INT           NOT NULL,
  fund_type      TEXT          NOT NULL,   -- primary fund for this batch
  total_amount   NUMERIC(15,2) NOT NULL DEFAULT 0,
  -- Approval workflow (IMP #9)
  status         TEXT          NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','computed','approved','released')),
  prepared_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  certified_by   UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by    UUID          REFERENCES auth.users(id) ON DELETE SET NULL,
  date_prepared  TIMESTAMPTZ,
  date_certified TIMESTAMPTZ,
  date_approved  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- --------------------------
-- PAYROLL FUND LINES  (IMP #10)
-- Breaks down each payroll batch by LGU fund type.
-- e.g. GF = 80%, SEF = 20% of total payroll
-- --------------------------
CREATE TABLE IF NOT EXISTS hr.payroll_fund_lines (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_id  UUID          NOT NULL REFERENCES hr.payroll(id) ON DELETE CASCADE,
  fund_type   TEXT          NOT NULL
              CHECK (fund_type IN ('GF','SEF','LDRRMF','SHF','DEVFUND','TRUST')),
  amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (payroll_id, fund_type)
);

-- Junction: payroll ↔ pay_slip
CREATE TABLE IF NOT EXISTS hr.payroll_pay_slips (
  payroll_id  UUID NOT NULL REFERENCES hr.payroll(id) ON DELETE CASCADE,
  pay_slip_id UUID NOT NULL REFERENCES hr.pay_slip(id) ON DELETE CASCADE,
  PRIMARY KEY (payroll_id, pay_slip_id)
);

-- =============================================================================
-- SECTION 8 — INDEXES  (IMP #13 covering indexes)
-- =============================================================================

-- Personnel lookups
CREATE INDEX idx_personnel_user_id      ON hr.personnel(user_id);
CREATE INDEX idx_personnel_office       ON hr.personnel(o_id);
CREATE INDEX idx_personnel_position     ON hr.personnel(pos_id);
CREATE INDEX idx_personnel_active       ON hr.personnel(is_active);

-- Time records — covering index for payroll batch generation
-- Query: WHERE per_id = ? AND date BETWEEN ? AND ?  → includes pay_amount
CREATE INDEX idx_time_record_per_date   ON hr.time_record(per_id, date);
CREATE INDEX idx_time_record_pay        ON hr.time_record(per_id, date, pay_amount);

-- Leave system
CREATE INDEX idx_leave_out_per          ON hr.personnel_leave_out(per_id, status);
CREATE INDEX idx_leave_credits_per      ON hr.personnel_leave_credits(per_id);
CREATE INDEX idx_leave_dates_plaid      ON hr.leave_out_dates(plaid);

-- Pay slip
CREATE INDEX idx_pay_slip_per_period    ON hr.pay_slip(per_id, period_start, period_end);
CREATE INDEX idx_pay_slip_status        ON hr.pay_slip(status);

-- Payroll
CREATE INDEX idx_payroll_fiscal_status  ON hr.payroll(fiscal_year, status);
CREATE INDEX idx_payroll_fund_lines     ON hr.payroll_fund_lines(payroll_id);

-- Service record
CREATE INDEX idx_service_record_per     ON hr.service_record(per_id, effective_date);

-- Deductions
CREATE INDEX idx_pay_slip_deductions    ON hr.pay_slip_deductions(pay_slip_id);

-- =============================================================================
-- SECTION 9 — GRANTS (all tables in hr schema)
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hr TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA hr TO service_role;

-- =============================================================================
-- SECTION 10 — ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on every table
ALTER TABLE hr.pos_type                ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.office                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.rate                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.salary_rate             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.ot_type                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.deduction_type          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.position                ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.personnel               ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.service_record          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.leave_out_type          ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.leave_out_subtype       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.personnel_leave_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.personnel_leave_out     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.leave_out_dates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.time_record             ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.pay_slip                ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.pay_slip_deductions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.pay_slip_time_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.pay_slip_leave_outs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.payroll                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.payroll_fund_lines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr.payroll_pay_slips       ENABLE ROW LEVEL SECURITY;

-- Reference / lookup tables — read for all authenticated
CREATE POLICY "hr_pos_type_r"        ON hr.pos_type         FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_office_r"          ON hr.office            FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_rate_r"            ON hr.rate              FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_salary_rate_r"     ON hr.salary_rate       FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_ot_type_r"         ON hr.ot_type           FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_deduction_type_r"  ON hr.deduction_type    FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_position_r"        ON hr.position          FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_leave_type_r"      ON hr.leave_out_type    FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_leave_subtype_r"   ON hr.leave_out_subtype FOR SELECT TO authenticated USING (true);

-- Admin-writable lookup tables
CREATE POLICY "hr_pos_type_w"        ON hr.pos_type         FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_office_w"          ON hr.office            FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_rate_w"            ON hr.rate              FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_salary_rate_w"     ON hr.salary_rate       FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_ot_type_w"         ON hr.ot_type           FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_deduction_type_w"  ON hr.deduction_type    FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_position_w"        ON hr.position          FOR ALL     TO authenticated USING (true) WITH CHECK (true);

-- Personnel
CREATE POLICY "hr_personnel_r"       ON hr.personnel         FOR SELECT  TO authenticated USING (true);
CREATE POLICY "hr_personnel_w"       ON hr.personnel         FOR ALL     TO authenticated USING (true) WITH CHECK (true);

-- Service record
CREATE POLICY "hr_service_r"         ON hr.service_record    FOR SELECT  TO authenticated USING (true);
CREATE POLICY "hr_service_w"         ON hr.service_record    FOR ALL     TO authenticated USING (true) WITH CHECK (true);

-- Leave system
CREATE POLICY "hr_leave_credits_r"   ON hr.personnel_leave_credits FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_leave_credits_w"   ON hr.personnel_leave_credits FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_leave_out_r"       ON hr.personnel_leave_out   FOR SELECT   TO authenticated USING (true);
CREATE POLICY "hr_leave_out_w"       ON hr.personnel_leave_out   FOR ALL      TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_leave_dates_r"     ON hr.leave_out_dates       FOR SELECT   TO authenticated USING (true);
CREATE POLICY "hr_leave_dates_w"     ON hr.leave_out_dates       FOR ALL      TO authenticated USING (true) WITH CHECK (true);

-- Time record
CREATE POLICY "hr_time_record_r"     ON hr.time_record       FOR SELECT  TO authenticated USING (true);
CREATE POLICY "hr_time_record_w"     ON hr.time_record       FOR ALL     TO authenticated USING (true) WITH CHECK (true);

-- Pay slip
CREATE POLICY "hr_pay_slip_r"        ON hr.pay_slip          FOR SELECT  TO authenticated USING (true);
CREATE POLICY "hr_pay_slip_w"        ON hr.pay_slip          FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_pay_deductions_r"  ON hr.pay_slip_deductions FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_pay_deductions_w"  ON hr.pay_slip_deductions FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_ps_tr_r"           ON hr.pay_slip_time_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_ps_tr_w"           ON hr.pay_slip_time_records FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_ps_lo_r"           ON hr.pay_slip_leave_outs   FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_ps_lo_w"           ON hr.pay_slip_leave_outs   FOR ALL    TO authenticated USING (true) WITH CHECK (true);

-- Payroll
CREATE POLICY "hr_payroll_r"         ON hr.payroll           FOR SELECT  TO authenticated USING (true);
CREATE POLICY "hr_payroll_w"         ON hr.payroll           FOR ALL     TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_fund_lines_r"      ON hr.payroll_fund_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_fund_lines_w"      ON hr.payroll_fund_lines FOR ALL    TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_payroll_ps_r"      ON hr.payroll_pay_slips  FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_payroll_ps_w"      ON hr.payroll_pay_slips  FOR ALL    TO authenticated USING (true) WITH CHECK (true);
