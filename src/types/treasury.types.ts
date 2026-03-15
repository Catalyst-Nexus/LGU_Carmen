// Treasury Module Types

export interface CollectionType {
  id: string;
  code: string;
  description: string;
  account_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  code: string;
  description: string;
  requires_reference: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ORSeries {
  id: string;
  series_name: string;
  prefix: string;
  start_number: number;
  end_number: number;
  current_number: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type OfficialReceiptStatus = 'active' | 'cancelled' | 'void';

export interface OfficialReceipt {
  id: string;
  or_number: string;
  or_series_id: string;
  or_date: string;
  
  // Payor information
  payor_name: string;
  payor_address: string | null;
  payor_tin: string | null;
  
  // Collection details
  collection_type_id: string;
  particulars: string;
  amount: number;
  
  // Payment details
  payment_method_id: string;
  payment_reference: string | null;
  
  // Accounting period
  fiscal_year: number;
  fiscal_month: number;
  
  // Status
  status: OfficialReceiptStatus;
  cancellation_reason: string | null;
  cancelled_by: string | null;
  cancelled_at: string | null;
  
  // Audit trail
  prepared_by: string;
  created_at: string;
  updated_at: string;
  
  // Joined data (optional)
  collection_type?: CollectionType;
  payment_method?: PaymentMethod;
  or_series?: ORSeries;
}

export interface OfficialReceiptFormData {
  or_series_id: string;
  or_date: string;
  payor_name: string;
  payor_address?: string;
  payor_tin?: string;
  collection_type_id: string;
  particulars: string;
  amount: number;
  payment_method_id: string;
  payment_reference?: string;
  fiscal_year: number;
  fiscal_month: number;
}

export interface OfficialReceiptCancellation {
  cancellation_reason: string;
}

// For display purposes with joined data
export interface OfficialReceiptWithDetails extends OfficialReceipt {
  collection_type: CollectionType;
  payment_method: PaymentMethod;
  or_series: ORSeries;
  prepared_by_user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

// Stats for dashboard
export interface TreasuryStats {
  total_receipts_today: number;
  total_amount_today: number;
  total_receipts_month: number;
  total_amount_month: number;
  total_receipts_year: number;
  total_amount_year: number;
}

export type TreasuryFundType = 'General' | 'SEF' | 'Trust';

export interface TreasuryAccountCode {
  id: string;
  code: string;
  description: string;
  fund_type: TreasuryFundType;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CreateTreasuryAccountCodePayload {
  code: string;
  description: string;
  fund_type: TreasuryFundType;
  is_active: boolean;
}

export interface UpdateTreasuryAccountCodePayload {
  code?: string;
  description?: string;
  fund_type?: TreasuryFundType;
  is_active?: boolean;
}

export interface TreasuryOfficialReceipt {
  id: string;
  or_number: string;
  or_date: string;
  payor: string;
  type: string;
  amount: number;
  account_code_id: string;
  account_code?: string;
  is_printed: boolean;
  printed_at: string | null;
  created_at: string;
  account?: TreasuryAccountCode;
}

export interface CreateTreasuryOfficialReceiptPayload {
  or_number: string;
  or_date: string;
  payor: string;
  type: string;
  amount: number;
  account_code_id: string;
}
