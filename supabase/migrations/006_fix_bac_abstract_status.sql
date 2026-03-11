-- =============================================================================
-- Fix BAC abstract status check constraint
-- Adds 'DRAFT' to the allowed status values so the app can save abstracts.
-- Run this in the Supabase SQL Editor (select bac schema / public is fine).
-- =============================================================================

-- Drop the existing constraint (whatever values it currently allows)
ALTER TABLE bac.abstract
  DROP CONSTRAINT IF EXISTS abstract_status_check;

-- Re-create with the full set the app uses
ALTER TABLE bac.abstract
  ADD CONSTRAINT abstract_status_check
  CHECK (status IN ('DRAFT', 'EVALUATED', 'AWARDED', 'CANCELLED'));

-- Also apply a matching fix to purchase_order if it exists
-- (so PO can follow the same DRAFT → EVALUATED → AWARDED flow later)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'bac' AND table_name = 'purchase_order'
  ) THEN
    ALTER TABLE bac.purchase_order
      DROP CONSTRAINT IF EXISTS purchase_order_status_check;
    ALTER TABLE bac.purchase_order
      ADD CONSTRAINT purchase_order_status_check
      CHECK (status IN ('DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'));
  END IF;
END;
$$;
