import { useState } from 'react';
import { Send } from 'lucide-react';
import { ActionsBar, PrimaryButton } from '@/components/ui';
import AccountingPlanRequestDialog from '@/modules/Accounting/components/AccountingPlanRequestDialog';
import type { AccountType, GeneralAccountingPlan, GeneralAccountingPlanSub } from '@/types/accounting.types';

interface RequestPayload {
  accountyType: AccountType;
  planId: string;
  hasSub: boolean;
  subId: string | null;
  request: string;
}

interface AccountingPlanRequestTabProps {
  plans: GeneralAccountingPlan[];
  subs: GeneralAccountingPlanSub[];
  onSubmit: (payload: RequestPayload) => Promise<boolean>;
  isLoading?: boolean;
}

const AccountingPlanRequestTab = ({
  plans,
  subs,
  onSubmit,
  isLoading = false,
}: AccountingPlanRequestTabProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [accountType, setAccountType] = useState<AccountType | ''>('');
  const [planId, setPlanId] = useState('');
  const [subId, setSubId] = useState('');
  const [request, setRequest] = useState('');
  const [error, setError] = useState('');

  const selectedPlan = plans.find((p) => p.id === planId);

  const openDialog = () => {
    setAccountType('');
    setPlanId('');
    setSubId('');
    setRequest('');
    setError('');
    setDialogOpen(true);
  };

  const handleAccountTypeChange = (val: AccountType | '') => {
    setAccountType(val);
    setPlanId('');
    setSubId('');
  };

  const handlePlanChange = (val: string) => {
    setPlanId(val);
    setSubId('');
  };

  const handleSubmit = async () => {
    if (!accountType) { setError('Account type is required.'); return; }
    if (!planId) { setError('Accounting plan is required.'); return; }
    if (selectedPlan?.has_sub && !subId) { setError('Sub-type is required for this plan.'); return; }
    if (!request.trim()) { setError('Request details are required.'); return; }

    setError('');
    const ok = await onSubmit({
      accountyType: accountType,
      planId,
      hasSub: !!selectedPlan?.has_sub,
      subId: selectedPlan?.has_sub ? subId : null,
      request: request.trim(),
    });

    if (ok) {
      setDialogOpen(false);
    } else {
      setError('Failed to submit request. Please try again.');
    }
  };

  return (
    <>
      <ActionsBar>
        <PrimaryButton onClick={openDialog}>
          <Send className="w-4 h-4" />
          Send Request
        </PrimaryButton>
      </ActionsBar>

      <AccountingPlanRequestDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        plans={plans}
        subs={subs}
        accountType={accountType}
        onAccountTypeChange={handleAccountTypeChange}
        planId={planId}
        onPlanChange={handlePlanChange}
        subId={subId}
        onSubIdChange={setSubId}
        request={request}
        onRequestChange={setRequest}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
};

export default AccountingPlanRequestTab;
