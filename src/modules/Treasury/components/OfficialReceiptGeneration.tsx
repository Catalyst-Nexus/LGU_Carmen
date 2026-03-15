import { useMemo, useState } from 'react';
import { Pencil, Plus, Printer, Search, Trash2 } from 'lucide-react';
import { ActionsBar, IconButton, PrimaryButton } from '@/components/ui';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import { supabase } from '@/services/supabase';
import type { TreasuryAccountCode, TreasuryOfficialReceipt } from '@/types/treasury.types';
import AccountTitleCombobox from './AccountTitleCombobox';

interface OfficialReceiptGenerationProps {
  accountCodes: TreasuryAccountCode[];
  receipts: TreasuryOfficialReceipt[];
  isLoadingReceipts: boolean;
  onReceiptCreated: (receipt: TreasuryOfficialReceipt) => void;
  onReceiptUpdated: (receipt: TreasuryOfficialReceipt) => void;
  onReceiptDeleted: (id: string) => void;
}

/** Extract trailing number from an OR number string, e.g. "OR-2026-00005" → { prefix: "OR-2026-", num: 5, pad: 5 } */
function parseOrNumber(orNum: string): { prefix: string; num: number; pad: number } | null {
  const match = orNum.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], num: parseInt(match[2], 10), pad: match[2].length };
}

/** Given all existing OR numbers, compute the next sequential one. */
function computeNextOrNumber(existingReceipts: TreasuryOfficialReceipt[]): string {
  const year = new Date().getFullYear();
  const fallback = `OR-${year}-00001`;

  if (existingReceipts.length === 0) return fallback;

  let maxNum = 0;
  let bestPrefix = `OR-${year}-`;
  let bestPad = 5;

  for (const r of existingReceipts) {
    const parsed = parseOrNumber(r.or_number);
    if (parsed && parsed.num > maxNum) {
      maxNum = parsed.num;
      bestPrefix = parsed.prefix;
      bestPad = parsed.pad;
    }
  }

  return `${bestPrefix}${String(maxNum + 1).padStart(bestPad, '0')}`;
}

export default function OfficialReceiptGeneration({
  accountCodes,
  receipts,
  isLoadingReceipts,
  onReceiptCreated,
  onReceiptUpdated,
  onReceiptDeleted,
}: OfficialReceiptGenerationProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TreasuryOfficialReceipt | null>(null);
  const [orNumber, setOrNumber] = useState('');
  const [orNumberError, setOrNumberError] = useState('');
  const [payor, setPayor] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [accountCodeId, setAccountCodeId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [search, setSearch] = useState('');

  const activeCodes = useMemo(() => accountCodes, [accountCodes]);

  const getAccount = (item: TreasuryOfficialReceipt) =>
    item.account ?? accountCodes.find((c) => c.id === item.account_code_id) ?? null;

  const selectedCode = useMemo(
    () => activeCodes.find((item) => item.id === accountCodeId) || null,
    [accountCodeId, activeCodes]
  );

  const totalAmount = useMemo(() => {
    const numeric = Number(amount);
    return Number.isNaN(numeric) || numeric < 0 ? 0 : numeric;
  }, [amount]);

  const filteredReceipts = useMemo(() => {
    if (!search.trim()) return receipts;
    const term = search.toLowerCase();
    return receipts.filter(
      (item) =>
        item.or_number.toLowerCase().includes(term) ||
        item.payor.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        (getAccount(item)?.description || '').toLowerCase().includes(term)
    );
  }, [receipts, search]);

  const checkOrNumberDuplicate = (value: string, currentEditingId?: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      setOrNumberError('');
      return;
    }
    const duplicate = receipts.find(
      (r) => r.or_number.toLowerCase() === trimmed.toLowerCase() && r.id !== currentEditingId
    );
    if (duplicate) {
      setOrNumberError(`OR Number "${trimmed}" has already been used.`);
    } else {
      setOrNumberError('');
    }
  };

  const handleOrNumberChange = (value: string) => {
    setOrNumber(value);
    checkOrNumberDuplicate(value, editing?.id);
  };

  const resetForm = () => {
    setEditing(null);
    setOrNumber('');
    setOrNumberError('');
    setPayor('');
    setReceiptType('');
    setAccountCodeId('');
    setAmount('');
    setFormError('');
  };

  const openAdd = () => {
    resetForm();
    const next = computeNextOrNumber(receipts);
    setOrNumber(next);
    setDialogOpen(true);
  };

  const openEdit = (item: TreasuryOfficialReceipt) => {
    setEditing(item);
    setOrNumber(item.or_number);
    setOrNumberError('');
    setPayor(item.payor);
    setReceiptType(item.type);
    setAccountCodeId(item.account_code_id);
    setAmount(String(item.amount));
    setFormError('');
    setDialogOpen(true);
  };

  const validate = () => {
    if (!orNumber.trim()) return 'OR Number is required.';
    if (orNumberError) return orNumberError;
    if (!payor.trim()) return 'Payor is required.';
    if (!receiptType.trim()) return 'Type is required.';
    if (!accountCodeId) return 'Please select an Account Title from the list.';
    if (!amount) return 'Amount is required.';
    if (!selectedCode) return 'Please select a valid Account Title from Treasury Account Plan.';
    if (totalAmount <= 0) return 'Please enter a valid amount greater than zero.';
    return null;
  };

  const handleSubmit = async () => {
    if (!supabase) {
      setFormError('Supabase is not configured.');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError('');

    const payload = {
      or_number: orNumber.trim(),
      payor: payor.trim(),
      type: receiptType.trim(),
      amount: totalAmount,
      account_code: selectedCode!.code,
      account_code_id: selectedCode!.id,
    };

    if (editing) {
      const { data, error } = await supabase
        .schema('treasury')
        .from('receipts')
        .update(payload)
        .eq('id', editing.id)
        .select('*')
        .single();

      setIsSaving(false);

      if (error) {
        setFormError(error.message || 'Failed to update official receipt.');
        return;
      }

      onReceiptUpdated({ ...data, account: selectedCode } as TreasuryOfficialReceipt);
    } else {
      const { data, error } = await supabase
        .schema('treasury')
        .from('receipts')
        .insert(payload)
        .select('*')
        .single();

      setIsSaving(false);

      if (error) {
        setFormError(error.message || 'Failed to save official receipt.');
        return;
      }

      onReceiptCreated({ ...data, account: selectedCode } as TreasuryOfficialReceipt);
    }

    setDialogOpen(false);
  };

  const handleDelete = async (item: TreasuryOfficialReceipt) => {
    if (!supabase) return;
    if (!confirm(`Delete OR ${item.or_number}? This cannot be undone.`)) return;

    const { error } = await supabase
      .schema('treasury')
      .from('receipts')
      .delete()
      .eq('id', item.id);

    if (error) {
      alert(error.message);
      return;
    }

    onReceiptDeleted(item.id);
  };

  const handlePrint = (item: TreasuryOfficialReceipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print official receipt.');
      return;
    }

    const account = getAccount(item);
    const accountDesc = account?.description || '—';
    const accountCode = account?.code || item.account_code || '—';
    const formattedAmount = Number(item.amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Receipt ${item.or_number}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 32px; color: #111; }
          .header { text-align: center; margin-bottom: 24px; }
          .header h1 { margin: 0 0 4px 0; font-size: 22px; }
          .header p { margin: 0; font-size: 13px; }
          .section { margin-bottom: 16px; }
          .label { font-weight: bold; min-width: 160px; display: inline-block; }
          .row { margin-bottom: 8px; }
          .total { border: 2px solid #111; padding: 12px; margin-top: 16px; }
          .total strong { font-size: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>OFFICIAL RECEIPT</h1>
          <p>Municipality of Carmen</p>
        </div>
        <div class="section">
          <div class="row"><span class="label">OR Number:</span> ${item.or_number}</div>
          <div class="row"><span class="label">Payor:</span> ${item.payor}</div>
          <div class="row"><span class="label">Type:</span> ${item.type}</div>
          <div class="row"><span class="label">Account Title:</span> ${accountDesc}</div>
          <div class="row"><span class="label">Account Code:</span> ${accountCode}</div>
        </div>
        <div class="total">
          <div class="row"><span class="label">Total Amount:</span> <strong>₱${formattedAmount}</strong></div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const thCls =
    'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wide';
  const tdCls = 'px-4 py-3 border-b border-border/50 text-sm';

  return (
    <>
      <ActionsBar>
        <PrimaryButton onClick={openAdd} disabled={activeCodes.length === 0}>
          <Plus className="w-4 h-4" />
          Generate OR
        </PrimaryButton>
        {activeCodes.length === 0 && (
          <span className="text-xs text-warning">
            No active account codes. Add them in Treasury Account Plan first.
          </span>
        )}
      </ActionsBar>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="relative w-full md:w-72 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search OR records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className={thCls}>#</th>
                <th className={thCls}>OR Number</th>
                <th className={thCls}>Payor</th>
                <th className={thCls}>Account Title</th>
                <th className={thCls}>Type</th>
                <th className={`${thCls} text-right`}>Amount</th>
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingReceipts ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-8 border-b border-border/50">
                    Loading receipt records...
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-8 border-b border-border/50">
                    No official receipts found.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((item, index) => (
                  <tr key={item.id} className="hover:bg-background transition-colors">
                    <td className={`${tdCls} text-muted`}>{index + 1}</td>
                    <td className={tdCls}>{item.or_number}</td>
                    <td className={tdCls}>{item.payor}</td>
                    <td className={tdCls}>{getAccount(item)?.description || item.account_code || '—'}</td>
                    <td className={tdCls}>{item.type}</td>
                    <td className={`${tdCls} text-right`}>
                      ₱
                      {Number(item.amount).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className={`${tdCls} text-right`}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePrint(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-background transition-colors"
                          title="Print OR"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                        <IconButton title="Edit" onClick={() => openEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </IconButton>
                        <IconButton title="Delete" variant="danger" onClick={() => handleDelete(item)}>
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

        {filteredReceipts.length > 0 && (
          <div className="mt-3 text-xs text-muted">
            {filteredReceipts.length} {filteredReceipts.length === 1 ? 'record' : 'records'}
          </div>
        )}
      </div>

      <BaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        title={editing ? 'Edit Official Receipt' : 'Generate Official Receipt'}
        submitLabel={isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Save OR'}
        isLoading={isSaving}
        submitDisabled={!!orNumberError}
      >
        <div className="space-y-4">
          {formError && (
            <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="or-number" className="block text-sm font-medium text-foreground">
              OR Number <span className="text-error ml-1">*</span>
            </label>
            <input
              id="or-number"
              type="text"
              className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-background text-foreground focus:outline-none transition-colors ${
                orNumberError
                  ? 'border-danger focus:border-danger'
                  : 'border-border focus:border-success'
              }`}
              value={orNumber}
              onChange={(e) => handleOrNumberChange(e.target.value)}
              placeholder="e.g., OR-2026-00001"
            />
            {orNumberError && (
              <p className="text-xs text-danger mt-1">{orNumberError}</p>
            )}
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
            <label htmlFor="account-title" className="block text-sm font-medium text-foreground">
              Account Title <span className="text-error ml-1">*</span>
            </label>
            <AccountTitleCombobox
              value={accountCodeId}
              onChange={setAccountCodeId}
              options={activeCodes}
              placeholder="Search account title or code..."
            />
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {totalAmount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border border-success/20 rounded-lg text-sm text-foreground">
              <span className="text-muted">Total:</span>
              <strong>
                ₱
                {totalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
          )}
        </div>
      </BaseDialog>
    </>
  );
}
