export type AccountType = 'Budgetary Accounts' | 'Financial Transactions';

export interface GeneralAccountingPlan {
  id: string;
  created_at: string;
  description: string;
  accounty_type: AccountType;
  status: boolean;
  editable: boolean;
  has_sub: boolean;
}

export interface GeneralAccountingPlanSub {
  id: string;
  created_at: string;
  description: string;
  general_accounting_plan_id: string;
  status: boolean;
  editable: boolean;
  plan?: Pick<GeneralAccountingPlan, 'id' | 'description' | 'accounty_type'>;
}

export type GeneralAccountingPlanFormData = Omit<GeneralAccountingPlan, 'id' | 'created_at'>;
export type GeneralAccountingPlanSubFormData = Omit<GeneralAccountingPlanSub, 'id' | 'created_at' | 'plan'>;

export interface GeneralAccountingPlanRequest {
  id: string;
  created_at: string;
  accounty_type: AccountType;
  general_accounting_plan_id: string;
  has_sub: boolean;
  general_accounting_plan_sub_id: string | null;
  request: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type GeneralAccountingPlanRequestFormData = Omit<GeneralAccountingPlanRequest, 'id' | 'created_at'>;
