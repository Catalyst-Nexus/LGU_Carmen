-- =============================================================================
-- Treasury Account Plan + Official Receipts Tables
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS treasury;

CREATE TABLE IF NOT EXISTS treasury.account_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL,
  fund_type VARCHAR(20) NOT NULL DEFAULT 'General' CHECK (fund_type IN ('General', 'SEF', 'Trust')),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS treasury.official_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  or_number VARCHAR(100) NOT NULL UNIQUE,
  or_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payor VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  account_code_id UUID NOT NULL REFERENCES treasury.account_codes(id),
  account_code VARCHAR(50),
  is_printed BOOLEAN NOT NULL DEFAULT false,
  printed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_treasury_account_codes_code ON treasury.account_codes(code);
CREATE INDEX IF NOT EXISTS idx_treasury_account_codes_fund_type ON treasury.account_codes(fund_type);
CREATE INDEX IF NOT EXISTS idx_treasury_official_receipts_or_number ON treasury.official_receipts(or_number);
CREATE INDEX IF NOT EXISTS idx_treasury_official_receipts_or_date ON treasury.official_receipts(or_date);
CREATE INDEX IF NOT EXISTS idx_treasury_official_receipts_account_code_id ON treasury.official_receipts(account_code_id);

CREATE OR REPLACE FUNCTION treasury.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_treasury_account_codes_updated_at ON treasury.account_codes;
CREATE TRIGGER trg_treasury_account_codes_updated_at
  BEFORE UPDATE ON treasury.account_codes
  FOR EACH ROW
  EXECUTE FUNCTION treasury.set_updated_at();

DROP TRIGGER IF EXISTS trg_treasury_official_receipts_updated_at ON treasury.official_receipts;
CREATE TRIGGER trg_treasury_official_receipts_updated_at
  BEFORE UPDATE ON treasury.official_receipts
  FOR EACH ROW
  EXECUTE FUNCTION treasury.set_updated_at();

CREATE OR REPLACE FUNCTION treasury.sync_receipt_account_code()
RETURNS TRIGGER AS $$
BEGIN
  SELECT code INTO NEW.account_code
  FROM treasury.account_codes
  WHERE id = NEW.account_code_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_treasury_sync_receipt_account_code ON treasury.official_receipts;
CREATE TRIGGER trg_treasury_sync_receipt_account_code
  BEFORE INSERT OR UPDATE OF account_code_id
  ON treasury.official_receipts
  FOR EACH ROW
  EXECUTE FUNCTION treasury.sync_receipt_account_code();
