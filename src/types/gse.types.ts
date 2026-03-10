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
