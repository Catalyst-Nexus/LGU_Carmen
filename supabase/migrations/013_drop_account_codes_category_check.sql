-- =============================================================================
-- Drop check constraint on category column in treasury.account_codes
-- The category field should accept free text, not be restricted to set values.
-- =============================================================================

ALTER TABLE treasury.account_codes
  DROP CONSTRAINT IF EXISTS account_codes_category_check;
