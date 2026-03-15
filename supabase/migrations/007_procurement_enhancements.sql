-- =============================================================================
-- Procurement System Enhancements
-- Adds workflow logging, delivery receipts, and procurement tracking
-- Run this in the Supabase SQL Editor (bac schema)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. WORKFLOW LOG - Track all status changes across PR, Abstract, PO
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bac.workflow_log (
  log_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type varchar(20) NOT NULL CHECK (entity_type IN ('PR', 'ABSTRACT', 'PO', 'DR')),
  entity_id uuid NOT NULL,
  entity_no varchar(50),
  from_status varchar(20),
  to_status varchar(20) NOT NULL,
  changed_by varchar(100),
  changed_at timestamptz DEFAULT now(),
  remarks text,
  ip_address varchar(50),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_log_entity ON bac.workflow_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_log_date ON bac.workflow_log(changed_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. DELIVERY RECEIPT - Track deliveries against POs
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bac.delivery_receipt (
  dr_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dr_no varchar(50) NOT NULL,
  dr_date date NOT NULL DEFAULT CURRENT_DATE,
  po_id uuid NOT NULL REFERENCES bac.purchase_order(po_id) ON DELETE CASCADE,
  supplier_dr_no varchar(50),
  supplier_invoice_no varchar(50),
  delivery_date date,
  received_by varchar(100),
  inspected_by varchar(100),
  approved_by varchar(100),
  status varchar(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'INSPECTED', 'ACCEPTED', 'PARTIAL', 'REJECTED')),
  remarks text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_receipt_po ON bac.delivery_receipt(po_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receipt_date ON bac.delivery_receipt(dr_date DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DELIVERY RECEIPT LINE - Line items for each delivery
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bac.delivery_receipt_line (
  drl_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dr_id uuid NOT NULL REFERENCES bac.delivery_receipt(dr_id) ON DELETE CASCADE,
  pol_id uuid NOT NULL REFERENCES bac.purchase_order_list(pol_id) ON DELETE CASCADE,
  qty_delivered numeric NOT NULL DEFAULT 0,
  qty_accepted numeric NOT NULL DEFAULT 0,
  qty_rejected numeric DEFAULT 0,
  rejection_reason text,
  inspection_notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_receipt_line_dr ON bac.delivery_receipt_line(dr_id);
CREATE INDEX IF NOT EXISTS idx_delivery_receipt_line_pol ON bac.delivery_receipt_line(pol_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SEQUENCE FOR DR NUMBERS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS bac.delivery_receipt_seq START 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FUNCTION TO GENERATE DR NUMBER
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION bac.generate_dr_number()
RETURNS varchar AS $$
DECLARE
  year_part varchar;
  seq_part varchar;
BEGIN
  year_part := to_char(CURRENT_DATE, 'YYYY');
  seq_part := lpad(nextval('bac.delivery_receipt_seq')::text, 5, '0');
  RETURN 'DR-' || year_part || '-' || seq_part;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. UPDATE PO LIST - Add delivery tracking fields if not exists
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  -- Add qty_delivered if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'bac' AND table_name = 'purchase_order_list' AND column_name = 'qty_delivered'
  ) THEN
    ALTER TABLE bac.purchase_order_list ADD COLUMN qty_delivered numeric DEFAULT 0;
  END IF;

  -- Add delivery_status if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'bac' AND table_name = 'purchase_order_list' AND column_name = 'delivery_status'
  ) THEN
    ALTER TABLE bac.purchase_order_list ADD COLUMN delivery_status varchar(20) DEFAULT 'PENDING';
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. TRIGGER TO LOG WORKFLOW CHANGES (Optional - for automatic logging)
-- ─────────────────────────────────────────────────────────────────────────────

-- Note: You can also call the logging function from your application code
-- instead of using triggers, which gives you more control over the logged data.

CREATE OR REPLACE FUNCTION bac.log_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO bac.workflow_log (entity_type, entity_id, entity_no, from_status, to_status)
    VALUES (
      TG_ARGV[0],
      NEW.po_id,  -- Assumes po_id, adjust for other tables
      NEW.po_no,  -- Assumes po_no, adjust for other tables
      OLD.status,
      NEW.status
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. VIEW FOR PROCUREMENT DASHBOARD STATS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW bac.procurement_dashboard AS
SELECT
  -- PR Stats
  (SELECT COUNT(*) FROM gse.purchase_request WHERE status = 'DRAFT') as pr_draft,
  (SELECT COUNT(*) FROM gse.purchase_request WHERE status = 'SUBMITTED') as pr_pending,
  (SELECT COUNT(*) FROM gse.purchase_request WHERE status = 'APPROVED') as pr_approved,
  (SELECT COUNT(*) FROM gse.purchase_request WHERE status = 'REJECTED') as pr_rejected,
  (SELECT COALESCE(SUM(pr_total_amount), 0) FROM gse.purchase_request WHERE status = 'APPROVED') as pr_total_approved_amount,

  -- Abstract Stats
  (SELECT COUNT(*) FROM bac.abstract WHERE status = 'DRAFT') as abs_draft,
  (SELECT COUNT(*) FROM bac.abstract WHERE status = 'EVALUATED') as abs_evaluated,
  (SELECT COUNT(*) FROM bac.abstract WHERE status = 'AWARDED') as abs_awarded,

  -- PO Stats
  (SELECT COUNT(*) FROM bac.purchase_order WHERE status = 'DRAFT') as po_draft,
  (SELECT COUNT(*) FROM bac.purchase_order WHERE status = 'ISSUED') as po_issued,
  (SELECT COUNT(*) FROM bac.purchase_order WHERE status = 'RECEIVED') as po_received,
  (SELECT COALESCE(SUM(po_total_amount), 0) FROM bac.purchase_order WHERE status = 'ISSUED') as po_total_issued_amount,
  (SELECT COALESCE(SUM(po_total_amount), 0) FROM bac.purchase_order WHERE status = 'RECEIVED') as po_total_received_amount,

  -- DR Stats (if table exists)
  (SELECT COUNT(*) FROM bac.delivery_receipt WHERE status = 'DRAFT') as dr_draft,
  (SELECT COUNT(*) FROM bac.delivery_receipt WHERE status = 'ACCEPTED') as dr_accepted;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. GRANTS - Allow authenticated users to access the tables
-- ─────────────────────────────────────────────────────────────────────────────

-- Workflow Log
GRANT SELECT, INSERT ON bac.workflow_log TO authenticated;
GRANT SELECT ON bac.workflow_log TO anon;

-- Delivery Receipt
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.delivery_receipt TO authenticated;
GRANT SELECT ON bac.delivery_receipt TO anon;

-- Delivery Receipt Line
GRANT SELECT, INSERT, UPDATE, DELETE ON bac.delivery_receipt_line TO authenticated;
GRANT SELECT ON bac.delivery_receipt_line TO anon;

-- Sequence for DR Numbers
GRANT USAGE, SELECT ON SEQUENCE bac.delivery_receipt_seq TO authenticated;

-- Functions
GRANT EXECUTE ON FUNCTION bac.generate_dr_number() TO authenticated;
GRANT EXECUTE ON FUNCTION bac.log_status_change() TO authenticated;

-- Dashboard View
GRANT SELECT ON bac.procurement_dashboard TO authenticated;
GRANT SELECT ON bac.procurement_dashboard TO anon;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────────────
