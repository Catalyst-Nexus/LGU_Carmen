// GSE & BAC Types

export interface Unit {
  u_id: string;
  u_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Spec {
  s_id: string;
  s_code: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  i_id: string;
  i_code: string;
  description: string;
  default_u_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  default_unit?: Unit;
}

export interface ItemSpec {
  is_id: string;
  i_id: string;
  s_id: string;
  spec_value: string;
  created_at: string;
  updated_at: string;
  spec?: Spec;
}

export type PurchaseRequestStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'CANCELLED';

export interface PurchaseRequest {
  pr_id: string;
  pr_no: string;
  pr_date: string;
  rc_id: string;
  rcs_id: string | null;
  purpose: string;
  remarks: string | null;
  pr_total_amount: number;
  status: PurchaseRequestStatus;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  responsibility_center?: {
    id: string;
    name: string;
  };
  responsibility_center_section?: {
    id: string;
    name: string;
  };
}

export interface PurchaseRequestList {
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
  item?: Item;
  unit?: Unit;
}

export interface PurchaseRequestFormData {
  pr_no: string;
  pr_date: string;
  rc_id: string;
  rcs_id: string | null;
  purpose: string;
  remarks: string | null;
  requested_by: string | null;
}

export interface PurchaseRequestListFormData {
  i_id: string;
  u_id: string;
  qty: number;
  unit_price_estimated: number;
  specifications: string | null;
}
