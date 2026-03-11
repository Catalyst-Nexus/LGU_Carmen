-- =============================================================================
-- Add delivery_term and payment_term FK columns to bac.abstract
-- Run this in the Supabase SQL Editor.
-- =============================================================================

ALTER TABLE bac.abstract
  ADD COLUMN IF NOT EXISTS dt_id UUID REFERENCES bac.delivery_term(dt_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pt_id UUID REFERENCES bac.payment_term(pt_id)  ON DELETE SET NULL;
