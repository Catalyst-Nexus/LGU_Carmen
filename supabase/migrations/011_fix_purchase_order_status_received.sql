-- =============================================================================
-- Fix purchase_order status constraint to include RECEIVED
-- AND add missing GRANTS for BAC tables
-- Run this in the Supabase SQL Editor (bac schema)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FIX STATUS CONSTRAINT
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE bac.purchase_order
  DROP CONSTRAINT IF EXISTS purchase_order_status_check;

ALTER TABLE bac.purchase_order
  ADD CONSTRAINT purchase_order_status_check
  CHECK (status IN ('DRAFT', 'ISSUED', 'RECEIVED', 'CANCELLED'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. ADD MISSING GRANTS FOR BAC TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- Purchase Order
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.purchase_order TO authenticated;
GRANT SELECT ON bac.purchase_order TO anon;

-- Purchase Order List (Line Items)
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.purchase_order_list TO authenticated;
GRANT SELECT ON bac.purchase_order_list TO anon;

-- Abstract
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.abstract TO authenticated;
GRANT SELECT ON bac.abstract TO anon;

-- Bidture (Bids)
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.bidture TO authenticated;
GRANT SELECT ON bac.bidture TO anon;

-- Supplier
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.supplier TO authenticated;
GRANT SELECT ON bac.supplier TO anon;

-- Mode of Procurement
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.mode_procurement TO authenticated;
GRANT SELECT ON bac.mode_procurement TO anon;

-- Delivery Term
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.delivery_term TO authenticated;
GRANT SELECT ON bac.delivery_term TO anon;

-- Payment Term
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.payment_term TO authenticated;
GRANT SELECT ON bac.payment_term TO anon;

-- Sequences (if any)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA bac TO authenticated;
