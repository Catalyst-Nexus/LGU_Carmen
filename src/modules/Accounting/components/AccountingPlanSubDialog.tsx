import { BaseDialog, FormInput } from '@/components/ui/dialog';

interface AccountingPlanSubDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  parentPlanDescription?: string;
  isLoading?: boolean;
  editMode?: boolean;
  error?: string;
}

const AccountingPlanSubDialog = ({
  open,
  onClose,
  onSubmit,
  description,
  onDescriptionChange,
  parentPlanDescription,
  isLoading = false,
  editMode = false,
  error,
}: AccountingPlanSubDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit Sub-record' : 'Add Sub-record'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add Sub-record'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {parentPlanDescription && (
          <div className="text-sm bg-background border border-border rounded-lg px-3 py-2">
            <span className="text-muted">Parent Plan: </span>
            <span className="font-medium text-foreground">{parentPlanDescription}</span>
          </div>
        )}

        <FormInput
          id="sub-description"
          label="Description"
          placeholder="e.g., Cash, Check, Authority to Debit Account"
          value={description}
          onChange={onDescriptionChange}
          required
        />
      </div>
    </BaseDialog>
  );
};

export default AccountingPlanSubDialog;
