-- GSE & BAC Module Tables
-- General Services and Equipment - Bids and Awards Committee

-- Create GSE schema if not exists
CREATE SCHEMA IF NOT EXISTS gse;

-- Unit of Measure Table
CREATE TABLE IF NOT EXISTS gse.unit (
  u_id uuid NOT NULL DEFAULT gen_random_uuid(),
  u_code character varying(20) NOT NULL,
  description character varying(100) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unit_pkey PRIMARY KEY (u_id),
  CONSTRAINT unit_u_code_key UNIQUE (u_code)
) TABLESPACE pg_default;

-- Specifications Table
CREATE TABLE IF NOT EXISTS gse.specs (
  s_id uuid NOT NULL DEFAULT gen_random_uuid(),
  s_code character varying(30) NOT NULL,
  description character varying(255) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT specs_pkey PRIMARY KEY (s_id),
  CONSTRAINT specs_s_code_key UNIQUE (s_code)
) TABLESPACE pg_default;

-- Items Table
CREATE TABLE IF NOT EXISTS gse.items (
  i_id uuid NOT NULL DEFAULT gen_random_uuid(),
  i_code character varying(50) NOT NULL,
  description character varying(255) NOT NULL,
  default_u_id uuid NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT items_pkey PRIMARY KEY (i_id),
  CONSTRAINT items_i_code_key UNIQUE (i_code),
  CONSTRAINT items_default_u_id_fkey FOREIGN KEY (default_u_id) 
    REFERENCES gse.unit (u_id)
) TABLESPACE pg_default;

-- Item Specifications Junction Table
CREATE TABLE IF NOT EXISTS gse.item_spec (
  is_id uuid NOT NULL DEFAULT gen_random_uuid(),
  i_id uuid NOT NULL,
  s_id uuid NOT NULL,
  spec_value character varying(255) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT item_spec_pkey PRIMARY KEY (is_id),
  CONSTRAINT item_spec_i_id_s_id_key UNIQUE (i_id, s_id),
  CONSTRAINT item_spec_i_id_fkey FOREIGN KEY (i_id) 
    REFERENCES gse.items (i_id) ON DELETE CASCADE,
  CONSTRAINT item_spec_s_id_fkey FOREIGN KEY (s_id) 
    REFERENCES gse.specs (s_id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Purchase Request Table
CREATE TABLE IF NOT EXISTS gse.purchase_request (
  pr_id uuid NOT NULL DEFAULT gen_random_uuid(),
  pr_no character varying(30) NOT NULL,
  pr_date date NOT NULL DEFAULT CURRENT_DATE,
  rc_id uuid NOT NULL,
  rcs_id uuid NULL,
  purpose text NOT NULL,
  remarks text NULL,
  pr_total_amount numeric(15, 2) NOT NULL DEFAULT 0.00,
  status character varying(20) NOT NULL DEFAULT 'DRAFT'::character varying,
  requested_by character varying(150) NULL,
  approved_by character varying(150) NULL,
  approved_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchase_request_pkey PRIMARY KEY (pr_id),
  CONSTRAINT purchase_request_pr_no_key UNIQUE (pr_no),
  CONSTRAINT purchase_request_rc_id_fkey FOREIGN KEY (rc_id) 
    REFERENCES responsibility_center (id),
  CONSTRAINT purchase_request_rcs_id_fkey FOREIGN KEY (rcs_id) 
    REFERENCES responsibility_center_section (id),
  CONSTRAINT purchase_request_status_check CHECK (
    (status)::text = ANY (
      ARRAY[
        'DRAFT'::character varying,
        'SUBMITTED'::character varying,
        'APPROVED'::character varying,
        'REJECTED'::character varying,
        'CANCELLED'::character varying
      ]::text[]
    )
  )
) TABLESPACE pg_default;

-- Purchase Request Line Items Table
CREATE TABLE IF NOT EXISTS gse.purchase_request_list (
  prl_id uuid NOT NULL DEFAULT gen_random_uuid(),
  pr_id uuid NOT NULL,
  i_id uuid NOT NULL,
  u_id uuid NOT NULL,
  qty numeric(10, 3) NOT NULL,
  unit_price_estimated numeric(15, 2) NOT NULL DEFAULT 0.00,
  prl_total_amount_estimated numeric(15, 2) GENERATED ALWAYS AS (qty * unit_price_estimated) STORED,
  specifications text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchase_request_list_pkey PRIMARY KEY (prl_id),
  CONSTRAINT purchase_request_list_i_id_fkey FOREIGN KEY (i_id) 
    REFERENCES gse.items (i_id),
  CONSTRAINT purchase_request_list_pr_id_fkey FOREIGN KEY (pr_id) 
    REFERENCES gse.purchase_request (pr_id) ON DELETE CASCADE,
  CONSTRAINT purchase_request_list_u_id_fkey FOREIGN KEY (u_id) 
    REFERENCES gse.unit (u_id),
  CONSTRAINT purchase_request_list_qty_check CHECK (qty > 0::numeric)
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_items_is_active ON gse.items(is_active);
CREATE INDEX IF NOT EXISTS idx_purchase_request_status ON gse.purchase_request(status);
CREATE INDEX IF NOT EXISTS idx_purchase_request_pr_date ON gse.purchase_request(pr_date);
CREATE INDEX IF NOT EXISTS idx_purchase_request_list_pr_id ON gse.purchase_request_list(pr_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_gse_unit_updated_at BEFORE UPDATE ON gse.unit 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gse_specs_updated_at BEFORE UPDATE ON gse.specs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gse_items_updated_at BEFORE UPDATE ON gse.items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gse_item_spec_updated_at BEFORE UPDATE ON gse.item_spec 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gse_purchase_request_updated_at BEFORE UPDATE ON gse.purchase_request 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gse_purchase_request_list_updated_at BEFORE UPDATE ON gse.purchase_request_list 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your setup)
-- GRANT USAGE ON SCHEMA gse TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA gse TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA gse TO authenticated;
