import { Plus, X } from 'lucide-react';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import type { AccountType } from '@/types/accounting.types';

interface AccountingPlanDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  accountyType: AccountType | '';
  onAccountyTypeChange: (value: AccountType) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  hasSub: boolean;
  onHasSubChange: (value: boolean) => void;
  subDescriptions: string[];
  onSubDescriptionsChange: (descriptions: string[]) => void;
  isLoading?: boolean;
  editMode?: boolean;
  error?: string;
}

const AccountingPlanDialog = ({
  open,
  onClose,
  onSubmit,
  accountyType,
  onAccountyTypeChange,
  description,
  onDescriptionChange,
  hasSub,
  onHasSubChange,
  subDescriptions,
  onSubDescriptionsChange,
  isLoading = false,
  editMode = false,
  error,
}: AccountingPlanDialogProps) => {
  const updateSub = (index: number, value: string) => {
    const next = subDescriptions.map((d, i) => (i === index ? value : d));
    onSubDescriptionsChange(next);
  };

  const addSub = () => onSubDescriptionsChange([...subDescriptions, '']);

  const removeSub = (index: number) =>
    onSubDescriptionsChange(subDescriptions.filter((_, i) => i !== index));

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit General Accounting Plan' : 'Add General Accounting Plan'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add Plan'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="plan-accounty-type" className="block text-sm font-medium text-foreground">
            Account Type <span className="text-error ml-1">*</span>
          </label>
          <select
            id="plan-accounty-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={accountyType}
            onChange={(e) => onAccountyTypeChange(e.target.value as AccountType)}
          >
            <option value="">Select type...</option>
            <option value="Budgetary Accounts">Budgetary Accounts</option>
            <option value="Financial Transactions">Financial Transactions</option>
          </select>
        </div>

        <FormInput
          id="plan-description"
          label="Description"
          placeholder="e.g., Annual Budget"
          value={description}
          onChange={onDescriptionChange}
          required
        />

        <div className="flex items-center justify-between py-2.5 px-4 border border-border rounded-lg">
          <label htmlFor="plan-has-sub" className="text-sm font-medium text-foreground cursor-pointer select-none">
            Has Sub-records
          </label>
          <button
            id="plan-has-sub"
            type="button"
            role="switch"
            aria-checked={hasSub}
            onClick={() => onHasSubChange(!hasSub)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              hasSub ? 'bg-success' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                hasSub ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {hasSub && (
          <div className="space-y-2 border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                Sub-records
              </span>
              <button
                type="button"
                onClick={addSub}
                className="flex items-center gap-1 text-xs font-medium text-success hover:text-success/80 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add another
              </button>
            </div>
            {subDescriptions.map((desc, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
                  placeholder={`Sub-record ${i + 1} description`}
                  value={desc}
                  onChange={(e) => updateSub(i, e.target.value)}
                />
                {subDescriptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSub(i)}
                    className="text-muted hover:text-danger transition-colors"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseDialog>
  );
};

export default AccountingPlanDialog;
