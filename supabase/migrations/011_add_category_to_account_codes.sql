-- Add category column to treasury.account_codes (free text)
ALTER TABLE treasury.account_codes
  ADD COLUMN IF NOT EXISTS category VARCHAR(100) NOT NULL DEFAULT '';
