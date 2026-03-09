import { BaseDialog } from '@/components/ui/dialog';
import type { AccountType, GeneralAccountingPlan, GeneralAccountingPlanSub } from '@/types/accounting.types';

const ACCOUNT_TYPES: AccountType[] = ['Budgetary Accounts', 'Financial Transactions'];

interface AccountingPlanRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  plans: GeneralAccountingPlan[];
  subs: GeneralAccountingPlanSub[];
  accountType: AccountType | '';
  onAccountTypeChange: (value: AccountType | '') => void;
  planId: string;
  onPlanChange: (value: string) => void;
  subId: string;
  onSubIdChange: (value: string) => void;
  request: string;
  onRequestChange: (value: string) => void;
  isLoading?: boolean;
  error?: string;
}

const AccountingPlanRequestDialog = ({
  open,
  onClose,
  onSubmit,
  plans,
  subs,
  accountType,
  onAccountTypeChange,
  planId,
  onPlanChange,
  subId,
  onSubIdChange,
  request,
  onRequestChange,
  isLoading = false,
  error,
}: AccountingPlanRequestDialogProps) => {
  const filteredPlans = accountType
    ? plans.filter((p) => p.accounty_type === accountType && p.status)
    : [];

  const selectedPlan = plans.find((p) => p.id === planId);

  const filteredSubs = planId
    ? subs.filter((s) => s.general_accounting_plan_id === planId && s.status)
    : [];

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Send Request"
      onSubmit={onSubmit}
      submitLabel="Submit Request"
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {/* Account Type */}
        <div className="space-y-1.5">
          <label htmlFor="req-account-type" className="block text-sm font-medium text-foreground">
            Account Type <span className="text-danger ml-1">*</span>
          </label>
          <select
            id="req-account-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={accountType}
            onChange={(e) => onAccountTypeChange(e.target.value as AccountType | '')}
          >
            <option value="">Select account type...</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Accounting Plan */}
        {accountType && (
          <div className="space-y-1.5">
            <label htmlFor="req-plan" className="block text-sm font-medium text-foreground">
              Accounting Plan <span className="text-danger ml-1">*</span>
            </label>
            <select
              id="req-plan"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={planId}
              onChange={(e) => onPlanChange(e.target.value)}
            >
              <option value="">Select plan...</option>
              {filteredPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.description}</option>
              ))}
            </select>
            {filteredPlans.length === 0 && (
              <p className="text-xs text-muted">No plans found for this account type.</p>
            )}
          </div>
        )}

        {/* Sub-type — auto-shown when selected plan has sub-records */}
        {planId && selectedPlan?.has_sub && (
          <div className="space-y-1.5">
            <label htmlFor="req-sub" className="block text-sm font-medium text-foreground">
              Sub-type <span className="text-danger ml-1">*</span>
            </label>
            <select
              id="req-sub"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={subId}
              onChange={(e) => onSubIdChange(e.target.value)}
            >
              <option value="">Select sub-type...</option>
              {filteredSubs.map((s) => (
                <option key={s.id} value={s.id}>{s.description}</option>
              ))}
            </select>
            {filteredSubs.length === 0 && (
              <p className="text-xs text-muted">No sub-types available for this plan.</p>
            )}
          </div>
        )}

        {/* Request details */}
        <div className="space-y-1.5">
          <label htmlFor="req-details" className="block text-sm font-medium text-foreground">
            Request Details <span className="text-danger ml-1">*</span>
          </label>
          <textarea
            id="req-details"
            rows={4}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success resize-none"
            placeholder="Describe your request..."
            value={request}
            onChange={(e) => onRequestChange(e.target.value)}
          />
        </div>
      </div>
    </BaseDialog>
  );
};

export default AccountingPlanRequestDialog;
