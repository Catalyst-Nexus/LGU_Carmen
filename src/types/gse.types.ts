// ── Responsibility Center (public schema) ──
export interface ResponsibilityCenter {
  id: string;
  rc_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface ResponsibilityCenterSection {
  id: string;
  rcs_code: string;
  description: string;
  rc_id: string;
  is_active: boolean;
  created_at: string;
}

// ── Specs ──
export interface Spec {
  id: string;
  s_code: string;
  description: string;
  is_active: boolean;
}

// ── Unit of Measure ──
export interface Unit {
  id: string;
  u_code: string;
  description: string;
  is_active: boolean;
}

// ── Items ──
export interface Item {
  id: string;
  i_code: string;
  description: string;
  default_u_id: string | null;
  is_active: boolean;
}

// ── Purchase Request (header) ──
export interface PurchaseRequest {
  id: string;
  pr_id: string;
  pr_no: string;
  pr_date: string;
  rc_id: string;
  rcs_id: string | null;
  purpose: string;
  remarks: string | null;
  pr_total_amount: number;
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED";
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  rc_description?: string;
  rcs_description?: string;
}

// ── Purchase Request Line Item ──
export interface PurchaseRequestLine {
  id: string;
  prl_id: string;
  pr_id: string;
  i_id: string;
  u_id: string;
  qty: number;
  unit_price_estimated: number;
  prl_total_amount_estimated: number;
  specifications: string | null;
  created_at: string;
  updated_at: string;
  // joined fields
  item_description?: string;
  item_code?: string;
  unit_code?: string;
}

// ── Form data for creating / editing a PR ──
export interface PurchaseRequestFormData {
  pr_no?: string;
  pr_date: string;
  rc_id: string;
  rcs_id: string;
  purpose: string;
  remarks: string;
  requested_by: string;
  pr_total_amount?: number;
}

// ── Form data for a PR line item ──
export interface PRLineFormData {
  i_id: string;
  u_id: string;
  qty: number;
  unit_price_estimated: number;
  prl_total_amount_estimated?: number;
  specifications: string;
  item_description?: string;
  unit_code?: string;
}

// ── BAC Schema Types ──────────────────────────────────────

export interface Supplier {
  s_id: string;
  s_code: string;
  description: string;
  address: string | null;
  contact: string | null;
  tin: string | null;
  is_active: boolean;
}

export interface ModeProcurement {
  mp_id: string;
  mp_code: string;
  description: string;
  is_active: boolean;
}

export interface DeliveryTerm {
  dt_id: string;
  dt_code: string;
  description: string;
  is_active: boolean;
}

export interface PaymentTerm {
  pt_id: string;
  pt_code: string;
  description: string;
  is_active: boolean;
}

export interface Abstract {
  id: string;
  a_id: string;
  a_no: string;
  a_date: string;
  mp_id: string;
  pr_id: string;
  approved_budget: number;
  dt_id: string | null;
  pt_id: string | null;
  winning_b_id: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
  // joined
  mp_description?: string;
  pr_no?: string;
  rc_description?: string;
}

export interface Bidture {
  b_id: string;
  a_id: string;
  s_id: string;
  prl_id: string;
  unit_price_bid: number;
  unit_total_amount_bid: number;
  winner_status: boolean;
  created_at: string;
  updated_at: string;
  // joined
  supplier_name?: string;
}

export interface AbstractFormData {
  a_no?: string;
  a_date: string;
  mp_id: string;
  pr_id: string;
  approved_budget: number;
  dt_id?: string | null;
  pt_id?: string | null;
  status?: string;
  remarks?: string;
}

export interface BidtureFormData {
  a_id: string;
  s_id: string;
  prl_id: string;
  unit_price_bid: number;
  unit_total_amount_bid: number;
  winner_status?: boolean;
}

// ── Purchase Order ──────────────────────────────────────

export interface PurchaseOrder {
  id: string;
  po_id: string;
  po_no: string;
  po_date: string;
  a_id: string;
  place_of_delivery: string | null;
  date_of_delivery: string | null;
  days_to_deliver: number | null;
  pt_id: string | null;
  dt_id: string | null;
  po_total_amount: number;
  status: string;
  remarks: string | null;
  issued_by: string | null;
  received_by: string | null;
  created_at: string;
  updated_at: string;
  // joined
  a_no?: string;
  pr_no?: string;
  supplier_name?: string;
  mp_description?: string;
}

export interface PurchaseOrderLine {
  pol_id: string;
  po_id: string;
  b_id: string;
  prl_id: string;
  qty_ordered: number;
  unit_price: number;
  pol_total_amount: number;
  qty_delivered: number;
  delivery_status: string;
  created_at: string;
  updated_at: string;
  // joined
  item_description?: string;
  item_code?: string;
  unit_code?: string;
  qty?: number;
  specifications?: string | null;
}

export interface PurchaseOrderFormData {
  po_no?: string;
  po_date: string;
  a_id: string;
  place_of_delivery?: string;
  date_of_delivery?: string;
  days_to_deliver?: number | null;
  pt_id?: string | null;
  dt_id?: string | null;
  po_total_amount?: number;
  status?: string;
  remarks?: string;
  issued_by?: string;
  received_by?: string;
}
