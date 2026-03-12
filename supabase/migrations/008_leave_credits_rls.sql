-- =============================================================================
-- Migration 008 — RLS Policies for Leave Credits & Leave Dates
--
-- These two tables are queried by the frontend Leave Management module.
-- Without RLS policies, authenticated users cannot read or write them.
--
-- hr.personnel_leave_credits  — leave credit balances per employee per type
-- hr.leave_out_dates          — specific calendar dates of each leave application
--                               (INSERT triggers trg_deduct_leave_credit)
--                               (DELETE triggers trg_restore_leave_credit)
-- =============================================================================

-- ─── 1. personnel_leave_credits ──────────────────────────────────────────────

ALTER TABLE hr.personnel_leave_credits ENABLE ROW LEVEL SECURITY;

-- HR staff / admins can read all credit balances
CREATE POLICY "leave_credits_select"
  ON hr.personnel_leave_credits
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service_role (backend / admin RPC) can modify balances
-- (The triggers deduct_leave_credit / restore_leave_credit run as SECURITY DEFINER,
--  so they bypass RLS — no additional policy needed for trigger-driven updates.)
CREATE POLICY "leave_credits_service_write"
  ON hr.personnel_leave_credits
  FOR ALL
  TO service_role
  USING (true);

-- ─── 2. leave_out_dates ──────────────────────────────────────────────────────

ALTER TABLE hr.leave_out_dates ENABLE ROW LEVEL SECURITY;

-- Any authenticated HR user can read leave dates
CREATE POLICY "leave_dates_select"
  ON hr.leave_out_dates
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can INSERT new leave dates (filing a leave application)
-- The per-row trigger handles the credit deduction automatically.
CREATE POLICY "leave_dates_insert"
  ON hr.leave_out_dates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow deletion (triggered restore when a leave is cancelled/denied)
CREATE POLICY "leave_dates_delete"
  ON hr.leave_out_dates
  FOR DELETE
  TO authenticated
  USING (true);

-- service_role full access
CREATE POLICY "leave_dates_service_write"
  ON hr.leave_out_dates
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- SECTION 3 — Seed initial leave credits for all active personnel
--
-- Run this block ONCE after running the migration.
-- It inserts a zero-balance credit row for each combination of
-- (active employee) × (leave_out_type) where no record exists yet.
-- The HR admin can then top up balances via the Salary/Leave admin panel.
-- =============================================================================

INSERT INTO hr.personnel_leave_credits (per_id, lot_id, begin_balance, earned, current_balance)
SELECT
  p.id        AS per_id,
  lot.id      AS lot_id,
  0           AS begin_balance,
  0           AS earned,
  0           AS current_balance
FROM hr.personnel p
CROSS JOIN hr.leave_out_type lot
WHERE p.is_active = true
ON CONFLICT (per_id, lot_id) DO NOTHING;
