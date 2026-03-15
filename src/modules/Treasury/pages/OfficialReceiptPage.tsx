import { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ActionsBar, Alert, IconButton, PageHeader, PrimaryButton, StatusBadge } from '@/components/ui';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import {
  createTreasuryAccountCode,
  createTreasuryOfficialReceipt,
  deleteTreasuryAccountCode,
  getTreasuryAccountCodes,
  getTreasuryOfficialReceipts,
  updateTreasuryAccountCode,
} from '@/services/treasuryService';
import type {
  CreateTreasuryAccountCodePayload,
  TreasuryAccountCode,
  TreasuryFundType,
  TreasuryOfficialReceipt,
} from '@/types/treasury.types';

type Tab = 'plan' | 'operation';

const FUND_TYPES: TreasuryFundType[] = ['General', 'SEF', 'Trust'];

interface AccountCodeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  editMode: boolean;
  code: string;
  onCodeChange: (value: string) => void;
  title: string;
  onTitleChange: (value: string) => void;
  fundType: TreasuryFundType;
  onFundTypeChange: (value: TreasuryFundType) => void;
  isActive: boolean;
  onIsActiveChange: (value: boolean) => void;
  error: string;
}

const AccountCodeDialog = ({
  open,
  onClose,
  onSubmit,
  isLoading,
  editMode,
  code,
  onCodeChange,
  title,
  onTitleChange,
  fundType,
  onFundTypeChange,
  isActive,
  onIsActiveChange,
  error,
}: AccountCodeDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={editMode ? 'Edit Account Code' : 'Create Account Code'}
      submitLabel={editMode ? 'Save Changes' : 'Add Code'}
      isLoading={isLoading}
    >
      <div className="space-y-4">
        {error && (
          <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <FormInput
          id="account-code"
          label="Code"
          value={code}
          onChange={onCodeChange}
          placeholder="e.g., 4-01-01-010"
          required
        />

        <FormInput
          id="account-title"
          label="Account Title"
          value={title}
          onChange={onTitleChange}
          placeholder="e.g., Real Property Tax"
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="fund-type" className="block text-sm font-medium text-foreground">
            Fund Type <span className="text-error ml-1">*</span>
          </label>
          <select
            id="fund-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={fundType}
            onChange={(event) => onFundTypeChange(event.target.value as TreasuryFundType)}
          >
            {FUND_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between py-2.5 px-4 border border-border rounded-lg">
          <label htmlFor="code-status" className="text-sm font-medium text-foreground cursor-pointer select-none">
            Status
          </label>
          <button
            id="code-status"
            type="button"
            role="switch"
            aria-checked={isActive}
            onClick={() => onIsActiveChange(!isActive)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isActive ? 'bg-success' : 'bg-border'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </BaseDialog>
  );
};

export default function OfficialReceiptPage() {
  const [activeTab, setActiveTab] = useState<Tab>('plan');

  const [accountCodes, setAccountCodes] = useState<TreasuryAccountCode[]>([]);
  const [receipts, setReceipts] = useState<TreasuryOfficialReceipt[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [loadingReceipts, setLoadingReceipts] = useState(false);

  const [planSearch, setPlanSearch] = useState('');
  const [planFundFilter, setPlanFundFilter] = useState<'all' | TreasuryFundType>('all');
  const [planStatusFilter, setPlanStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<TreasuryAccountCode | null>(null);
  const [dialogCode, setDialogCode] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogFundType, setDialogFundType] = useState<TreasuryFundType>('General');
  const [dialogIsActive, setDialogIsActive] = useState(true);
  const [dialogError, setDialogError] = useState('');
  const [dialogLoading, setDialogLoading] = useState(false);

  const [orNumber, setOrNumber] = useState('');
  const [orDate, setOrDate] = useState(new Date().toISOString().split('T')[0]);
  const [payor, setPayor] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [selectedAccountCodeId, setSelectedAccountCodeId] = useState('');
  const [amount, setAmount] = useState('');
  const [orSearch, setOrSearch] = useState('');
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const loadAccountCodes = async () => {
    setLoadingCodes(true);
    try {
      const data = await getTreasuryAccountCodes();
      setAccountCodes(data);
    } catch (error) {
      console.error('Failed to load account codes:', error);
      alert('Failed to load account codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const data = await getTreasuryOfficialReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Failed to load official receipts:', error);
      alert('Failed to load official receipts');
    } finally {
      setLoadingReceipts(false);
    }
  };

  useEffect(() => {
    loadAccountCodes();
    loadReceipts();
  }, []);

  const filteredCodes = useMemo(() => {
    return accountCodes.filter((item) => {
      const matchesSearch =
        !planSearch.trim() ||
        item.code.toLowerCase().includes(planSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(planSearch.toLowerCase());
      const matchesFund = planFundFilter === 'all' || item.fund_type === planFundFilter;
      const matchesStatus =
        planStatusFilter === 'all' ||
        (planStatusFilter === 'active' ? item.is_active : !item.is_active);

      return matchesSearch && matchesFund && matchesStatus;
    });
  }, [accountCodes, planFundFilter, planSearch, planStatusFilter]);

  const activeCodes = useMemo(() => accountCodes.filter((item) => item.is_active), [accountCodes]);

  const filteredReceipts = useMemo(() => {
    if (!orSearch.trim()) return receipts;
    return receipts.filter((item) => {
      const term = orSearch.toLowerCase();
      return (
        item.or_number.toLowerCase().includes(term) ||
        item.payor.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        (item.account?.description || '').toLowerCase().includes(term) ||
        (item.account_code || '').toLowerCase().includes(term)
      );
    });
  }, [receipts, orSearch]);

  const openAddCode = () => {
    setEditingCode(null);
    setDialogCode('');
    setDialogTitle('');
    setDialogFundType('General');
    setDialogIsActive(true);
    setDialogError('');
    setPlanDialogOpen(true);
  };

  const openEditCode = (code: TreasuryAccountCode) => {
    setEditingCode(code);
    setDialogCode(code.code);
    setDialogTitle(code.description);
    setDialogFundType(code.fund_type);
    setDialogIsActive(code.is_active);
    setDialogError('');
    setPlanDialogOpen(true);
  };

  const handleSaveAccountCode = async () => {
    if (!dialogCode.trim()) {
      setDialogError('Code is required.');
      return;
    }
    if (!dialogTitle.trim()) {
      setDialogError('Account Title is required.');
      return;
    }

    setDialogLoading(true);
    setDialogError('');
    const payload: CreateTreasuryAccountCodePayload = {
      code: dialogCode.trim(),
      description: dialogTitle.trim(),
      fund_type: dialogFundType,
      is_active: dialogIsActive,
    };

    try {
      if (editingCode) {
        const updated = await updateTreasuryAccountCode(editingCode.id, payload);
        setAccountCodes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createTreasuryAccountCode(payload);
        setAccountCodes((prev) => [...prev, created].sort((a, b) => a.code.localeCompare(b.code)));
      }
      setPlanDialogOpen(false);
    } catch (error: any) {
      setDialogError(error.message || 'Failed to save account code.');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleDeleteAccountCode = async (item: TreasuryAccountCode) => {
    const confirmed = confirm(`Delete account code ${item.code}?`);
    if (!confirmed) return;

    try {
      await deleteTreasuryAccountCode(item.id);
      setAccountCodes((prev) => prev.filter((code) => code.id !== item.id));
    } catch (error: any) {
      alert(error.message || 'Failed to delete account code');
    }
  };

  const showSuccessToast = (message: string) => {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(''), 2500);
  };

  const onSubmit = async () => {
    if (!orNumber.trim() || !orDate || !payor.trim() || !receiptType.trim() || !selectedAccountCodeId || !amount) {
      alert('Please fill in all required fields');
      return;
    }

    const selectedPlanCode = activeCodes.find((item) => item.id === selectedAccountCodeId);
    if (!selectedPlanCode) {
      alert('Please select a valid Account Title from Treasury Account Plan');
      return;
    }

    const numericAmount = Number(amount);
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    setSavingReceipt(true);
    try {
      const created = await createTreasuryOfficialReceipt({
        or_number: orNumber.trim(),
        or_date: orDate,
        payor: payor.trim(),
        type: receiptType.trim(),
        amount: numericAmount,
        account_code_id: selectedPlanCode.id,
      });

      setReceipts((prev) => [created, ...prev]);
      showSuccessToast(`Official Receipt ${created.or_number} saved successfully`);

      setOrNumber('');
      setOrDate(new Date().toISOString().split('T')[0]);
      setPayor('');
      setReceiptType('');
      setSelectedAccountCodeId('');
      setAmount('');
    } catch (error: any) {
      alert(error.message || 'Failed to save official receipt');
    } finally {
      setSavingReceipt(false);
    }
  };

  const thCls = 'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wide';
  const tdCls = 'px-4 py-3 border-b border-border/50 text-sm';

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Official Receipt Management"
        subtitle="Maintain treasury account plan and generate official receipts"
        icon={<FileText className="w-6 h-6" />}
      />

      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'plan'
              ? 'border-success text-success'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Treasury Account Plan
        </button>
        <button
          onClick={() => setActiveTab('operation')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'operation'
              ? 'border-success text-success'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          OR Generation
        </button>
      </div>

      {activeTab === 'plan' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={openAddCode}>
              <Plus className="w-4 h-4" />
              Create Account Code
            </PrimaryButton>
          </ActionsBar>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
                  placeholder="Search code or account title..."
                  value={planSearch}
                  onChange={(event) => setPlanSearch(event.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                value={planFundFilter}
                onChange={(event) => setPlanFundFilter(event.target.value as 'all' | TreasuryFundType)}
              >
                <option value="all">All Fund Types</option>
                {FUND_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                value={planStatusFilter}
                onChange={(event) => setPlanStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={thCls}>#</th>
                    <th className={thCls}>Code</th>
                    <th className={thCls}>Account Title</th>
                    <th className={thCls}>Fund Type</th>
                    <th className={thCls}>Status</th>
                    <th className={`${thCls} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCodes ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-8 border-b border-border/50">
                        Loading account codes...
                      </td>
                    </tr>
                  ) : filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-8 border-b border-border/50">
                        No account codes found.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((item, index) => (
                      <tr key={item.id} className="hover:bg-background transition-colors">
                        <td className={tdCls}>{index + 1}</td>
                        <td className={tdCls}>{item.code}</td>
                        <td className={tdCls}>{item.description}</td>
                        <td className={tdCls}>{item.fund_type}</td>
                        <td className={tdCls}>
                          <StatusBadge status={item.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className={`${tdCls} text-right`}>
                          <div className="flex items-center justify-end gap-1">
                            <IconButton title="Edit" onClick={() => openEditCode(item)}>
                              <Pencil className="w-4 h-4" />
                            </IconButton>
                            <IconButton title="Delete" variant="danger" onClick={() => handleDeleteAccountCode(item)}>
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'operation' && (
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-success" />
              <h2 className="text-lg font-semibold text-foreground">Generate Official Receipt</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                id="or-number"
                label="OR Number"
                value={orNumber}
                onChange={setOrNumber}
                placeholder="e.g., OR-2026-00001"
                required
              />

              <div className="space-y-1.5">
                <label htmlFor="or-date" className="block text-sm font-medium text-foreground">
                  OR Date <span className="text-error ml-1">*</span>
                </label>
                <input
                  id="or-date"
                  type="date"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={orDate}
                  onChange={(event) => setOrDate(event.target.value)}
                />
              </div>

              <FormInput
                id="payor"
                label="Payor"
                value={payor}
                onChange={setPayor}
                placeholder="Enter payor name"
                required
              />

              <FormInput
                id="receipt-type"
                label="Type"
                value={receiptType}
                onChange={setReceiptType}
                placeholder="e.g., Business Tax"
                required
              />

              <div className="space-y-1.5">
                <label htmlFor="account-title-selector" className="block text-sm font-medium text-foreground">
                  Account Title <span className="text-error ml-1">*</span>
                </label>
                <select
                  id="account-title-selector"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={selectedAccountCodeId}
                  onChange={(event) => setSelectedAccountCodeId(event.target.value)}
                >
                  <option value="">Select account title</option>
                  {activeCodes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.code} - {item.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                  Amount <span className="text-error ml-1">*</span>
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <PrimaryButton onClick={onSubmit} disabled={savingReceipt || activeCodes.length === 0}>
                <Plus className="w-4 h-4" />
                {savingReceipt ? 'Saving...' : 'Generate Receipt'}
              </PrimaryButton>
            </div>

            {activeCodes.length === 0 && (
              <p className="text-xs text-warning mt-2">No active account codes found. Please add active codes in Treasury Account Plan first.</p>
            )}
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="relative w-full md:w-72 mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
                placeholder="Search OR records..."
                value={orSearch}
                onChange={(event) => setOrSearch(event.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={thCls}>OR Number</th>
                    <th className={thCls}>Date</th>
                    <th className={thCls}>Payor</th>
                    <th className={thCls}>Account Title</th>
                    <th className={thCls}>Type</th>
                    <th className={`${thCls} text-right`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingReceipts ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-8 border-b border-border/50">
                        Loading receipt records...
                      </td>
                    </tr>
                  ) : filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-8 border-b border-border/50">
                        No official receipts found.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map((item) => (
                      <tr key={item.id} className="hover:bg-background transition-colors">
                        <td className={tdCls}>{item.or_number}</td>
                        <td className={tdCls}>{item.or_date}</td>
                        <td className={tdCls}>{item.payor}</td>
                        <td className={tdCls}>{item.account?.description || item.account_code || '—'}</td>
                        <td className={tdCls}>{item.type}</td>
                        <td className={`${tdCls} text-right`}>₱{Number(item.amount).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AccountCodeDialog
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
        onSubmit={handleSaveAccountCode}
        isLoading={dialogLoading}
        editMode={Boolean(editingCode)}
        code={dialogCode}
        onCodeChange={setDialogCode}
        title={dialogTitle}
        onTitleChange={setDialogTitle}
        fundType={dialogFundType}
        onFundTypeChange={setDialogFundType}
        isActive={dialogIsActive}
        onIsActiveChange={setDialogIsActive}
        error={dialogError}
      />

      {successToast && (
        <Alert
          variant="success"
          title="Saved"
          message={successToast}
          onClose={() => setSuccessToast('')}
        />
      )}
    </div>
  );
}
