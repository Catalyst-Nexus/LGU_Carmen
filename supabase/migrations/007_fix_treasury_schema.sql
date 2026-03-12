-- =============================================================================
-- Fix Treasury Tables - Move to Public Schema
-- =============================================================================
-- This migration fixes the treasury tables by creating them in the public schema
-- where the Supabase JS client can access them directly.
-- We use table name prefixes instead of a separate schema.
-- =============================================================================

-- Drop existing policies and tables in treasury schema
DROP POLICY IF EXISTS "Users can view official receipts" ON treasury.official_receipt;
DROP POLICY IF EXISTS "Users can insert official receipts" ON treasury.official_receipt;
DROP POLICY IF EXISTS "Users can update their own receipts" ON treasury.official_receipt;
DROP POLICY IF EXISTS "Users can view collection types" ON treasury.collection_type;
DROP POLICY IF EXISTS "Users can view payment methods" ON treasury.payment_method;
DROP POLICY IF EXISTS "Users can view OR series" ON treasury.or_series;
DROP POLICY IF EXISTS "Service role can manage collection types" ON treasury.collection_type;
DROP POLICY IF EXISTS "Service role can manage payment methods" ON treasury.payment_method;

DROP TABLE IF EXISTS treasury.official_receipt CASCADE;
DROP TABLE IF EXISTS treasury.or_series CASCADE;
DROP TABLE IF EXISTS treasury.payment_method CASCADE;
DROP TABLE IF EXISTS treasury.collection_type CASCADE;

DROP FUNCTION IF EXISTS treasury.generate_or_number(UUID) CASCADE;
DROP FUNCTION IF EXISTS treasury.auto_generate_or_number() CASCADE;
DROP FUNCTION IF EXISTS treasury.update_updated_at() CASCADE;

-- =============================================================================
-- CREATE TABLES IN PUBLIC SCHEMA
-- =============================================================================

-- --------------------------
-- COLLECTION TYPE
-- Different types of government collections
-- --------------------------
CREATE TABLE IF NOT EXISTS public.collection_type (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL,
  account_code TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- PAYMENT METHOD
-- How the payment was received
-- --------------------------
CREATE TABLE IF NOT EXISTS public.payment_method (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL,
  requires_reference BOOLEAN NOT NULL DEFAULT false,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------
-- OR SERIES
-- Manages official receipt number series
-- --------------------------
CREATE TABLE IF NOT EXISTS public.or_series (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  series_name TEXT        NOT NULL,
  prefix      TEXT        NOT NULL,
  start_number INTEGER    NOT NULL,
  end_number  INTEGER     NOT NULL,
  current_number INTEGER  NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT check_series_range CHECK (current_number >= start_number AND current_number <= end_number)
);

-- --------------------------
-- OFFICIAL RECEIPT
-- Main table for official receipts
-- --------------------------
CREATE TABLE IF NOT EXISTS public.official_receipt (
  id                UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  or_number         TEXT          NOT NULL UNIQUE,
  or_series_id      UUID          NOT NULL REFERENCES public.or_series(id),
  or_date           DATE          NOT NULL DEFAULT CURRENT_DATE,
  
  -- Payor information
  payor_name        TEXT          NOT NULL,
  payor_address     TEXT,
  payor_tin         TEXT,
  
  -- Collection details
  collection_type_id UUID         NOT NULL REFERENCES public.collection_type(id),
  particulars       TEXT          NOT NULL,
  amount            NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  
  -- Payment details
  payment_method_id UUID          NOT NULL REFERENCES public.payment_method(id),
  payment_reference TEXT,
  
  -- Accounting period
  fiscal_year       INTEGER       NOT NULL,
  fiscal_month      INTEGER       NOT NULL CHECK (fiscal_month BETWEEN 1 AND 12),
  
  -- Status
  status            TEXT          NOT NULL DEFAULT 'active',
  cancellation_reason TEXT,
  cancelled_by      UUID          REFERENCES auth.users(id),
  cancelled_at      TIMESTAMPTZ,
  
  -- Audit trail
  prepared_by       UUID          NOT NULL REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  
  CONSTRAINT check_status CHECK (status IN ('active', 'cancelled', 'void'))
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_official_receipt_or_number ON public.official_receipt(or_number);
CREATE INDEX IF NOT EXISTS idx_official_receipt_or_date ON public.official_receipt(or_date);
CREATE INDEX IF NOT EXISTS idx_official_receipt_payor_name ON public.official_receipt(payor_name);
CREATE INDEX IF NOT EXISTS idx_official_receipt_collection_type ON public.official_receipt(collection_type_id);
CREATE INDEX IF NOT EXISTS idx_official_receipt_status ON public.official_receipt(status);
CREATE INDEX IF NOT EXISTS idx_official_receipt_fiscal ON public.official_receipt(fiscal_year, fiscal_month);
CREATE INDEX IF NOT EXISTS idx_official_receipt_prepared_by ON public.official_receipt(prepared_by);

-- =============================================================================
-- FUNCTIONS & TRIGGERS
-- =============================================================================

-- Function to generate the next OR number
CREATE OR REPLACE FUNCTION public.generate_or_number(p_series_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_series RECORD;
  v_or_number TEXT;
BEGIN
  -- Get and lock the series record
  SELECT * INTO v_series
  FROM public.or_series
  WHERE id = p_series_id
    AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'OR series not found or inactive';
  END IF;
  
  -- Check if series is exhausted
  IF v_series.current_number > v_series.end_number THEN
    RAISE EXCEPTION 'OR series exhausted. Current: %, End: %', 
      v_series.current_number, v_series.end_number;
  END IF;
  
  -- Generate OR number with zero padding
  v_or_number := v_series.prefix || LPAD(v_series.current_number::TEXT, 5, '0');
  
  -- Increment the current number
  UPDATE public.or_series
  SET current_number = current_number + 1,
      updated_at = now()
  WHERE id = p_series_id;
  
  RETURN v_or_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate OR number if not provided
CREATE OR REPLACE FUNCTION public.auto_generate_or_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.or_number IS NULL OR NEW.or_number = '' THEN
    NEW.or_number := public.generate_or_number(NEW.or_series_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_or_number
  BEFORE INSERT ON public.official_receipt
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_or_number();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_treasury_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_official_receipt_timestamp
  BEFORE UPDATE ON public.official_receipt
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_timestamp();

CREATE TRIGGER trigger_update_or_series_timestamp
  BEFORE UPDATE ON public.or_series
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_timestamp();

CREATE TRIGGER trigger_update_collection_type_timestamp
  BEFORE UPDATE ON public.collection_type
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_timestamp();

CREATE TRIGGER trigger_update_payment_method_timestamp
  BEFORE UPDATE ON public.payment_method
  FOR EACH ROW
  EXECUTE FUNCTION public.update_treasury_timestamp();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Seed Collection Types
INSERT INTO public.collection_type (id, code, description, is_active) VALUES
  ('11111111-1111-1111-1111-000000000001', 'BTAX', 'Business Tax', true),
  ('11111111-1111-1111-1111-000000000002', 'RPTAX', 'Real Property Tax', true),
  ('11111111-1111-1111-1111-000000000003', 'PERMIT', 'Business Permit', true),
  ('11111111-1111-1111-1111-000000000004', 'BLDG', 'Building Permit', true),
  ('11111111-1111-1111-1111-000000000005', 'CEDULA', 'Community Tax Certificate (Cedula)', true),
  ('11111111-1111-1111-1111-000000000006', 'MARKET', 'Market Fees', true),
  ('11111111-1111-1111-1111-000000000007', 'WATER', 'Water Service Fees', true),
  ('11111111-1111-1111-1111-000000000008', 'GARBAGE', 'Garbage Collection Fees', true),
  ('11111111-1111-1111-1111-000000000009', 'OTHER', 'Other Collections', true)
ON CONFLICT (code) DO NOTHING;

-- Seed Payment Methods
INSERT INTO public.payment_method (id, code, description, requires_reference, is_active) VALUES
  ('22222222-2222-2222-2222-000000000001', 'CASH', 'Cash', false, true),
  ('22222222-2222-2222-2222-000000000002', 'CHECK', 'Check', true, true),
  ('22222222-2222-2222-2222-000000000003', 'ONLINE', 'Online Bank Transfer', true, true),
  ('22222222-2222-2222-2222-000000000004', 'GCASH', 'GCash', true, true),
  ('22222222-2222-2222-2222-000000000005', 'PAYMAYA', 'PayMaya', true, true),
  ('22222222-2222-2222-2222-000000000006', 'LANDBANK', 'LandBank Link.BizPortal', true, true)
ON CONFLICT (code) DO NOTHING;

-- Seed OR Series for 2026
INSERT INTO public.or_series (id, series_name, prefix, start_number, end_number, current_number, is_active) VALUES
  ('33333333-3333-3333-3333-000000000001', '2026 Official Receipt Series 1', '2026-', 1, 10000, 1, true)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- RLS POLICIES (Row Level Security)
-- =============================================================================

-- Enable RLS
ALTER TABLE public.official_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_method ENABLE ROW LEVEL SECURITY;

-- Policies for official_receipt
CREATE POLICY "Users can view official receipts"
  ON public.official_receipt FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert official receipts"
  ON public.official_receipt FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND prepared_by = auth.uid());

CREATE POLICY "Users can update their own receipts"
  ON public.official_receipt FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policies for lookup tables
CREATE POLICY "Users can view collection types"
  ON public.collection_type FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view payment methods"
  ON public.payment_method FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view OR series"
  ON public.or_series FOR SELECT
  USING (auth.role() = 'authenticated');

-- Admin policies
CREATE POLICY "Service role can manage collection types"
  ON public.collection_type FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payment methods"
  ON public.payment_method FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
