import { useMemo, useState } from 'react';
import { Calculator, Plus, Printer, Search } from 'lucide-react';
import { Alert, PrimaryButton } from '@/components/ui';
import { FormInput } from '@/components/ui/dialog';
import { supabase } from '@/services/supabase';
import type { TreasuryAccountCode, TreasuryOfficialReceipt } from '@/types/treasury.types';
import AccountTitleCombobox from './AccountTitleCombobox';

interface OfficialReceiptGenerationProps {
  accountCodes: TreasuryAccountCode[];
  receipts: TreasuryOfficialReceipt[];
  isLoadingReceipts: boolean;
  onReceiptCreated: (receipt: TreasuryOfficialReceipt) => void;
}

export default function OfficialReceiptGeneration({
  accountCodes,
  receipts,
  isLoadingReceipts,
  onReceiptCreated,
}: OfficialReceiptGenerationProps) {
  const [orNumber, setOrNumber] = useState('');
  const [orDate, setOrDate] = useState(new Date().toISOString().split('T')[0]);
  const [payor, setPayor] = useState('');
  const [receiptType, setReceiptType] = useState('');
  const [accountCodeId, setAccountCodeId] = useState('');
  const [amount, setAmount] = useState('');
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const activeCodes = useMemo(
    () => accountCodes.filter((item) => item.is_active),
    [accountCodes]
  );

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
    return receipts.filter((item) => {
      return (
        item.or_number.toLowerCase().includes(term) ||
        item.payor.toLowerCase().includes(term) ||
        item.type.toLowerCase().includes(term) ||
        (item.account?.description || '').toLowerCase().includes(term) ||
        (item.account_code || '').toLowerCase().includes(term)
      );
    });
  }, [receipts, search]);

  const showSuccessToast = (message: string) => {
    setSuccessToast(message);
    window.setTimeout(() => setSuccessToast(''), 2500);
  };

  const onSubmit = async () => {
    if (!supabase) {
      alert('Supabase is not configured.');
      return;
    }

    if (!orNumber.trim() || !orDate || !payor.trim() || !receiptType.trim() || !accountCodeId || !amount) {
      alert('Please fill in all required fields');
      return;
    }

    if (!selectedCode) {
      alert('Please select a valid Account Title from Treasury Account Plan');
      return;
    }

    if (totalAmount <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .schema('treasury')
      .from('official_receipts')
      .insert({
        or_number: orNumber.trim(),
        or_date: orDate,
        payor: payor.trim(),
        type: receiptType.trim(),
        amount: totalAmount,
        account_code_id: selectedCode.id,
        account_code: selectedCode.code,
      })
      .select(`
        *,
        account:account_code_id(*)
      `)
      .single();

    setIsSaving(false);

    if (error) {
      alert(error.message || 'Failed to save official receipt');
      return;
    }

    onReceiptCreated(data as TreasuryOfficialReceipt);
    showSuccessToast(`Official Receipt ${(data as TreasuryOfficialReceipt).or_number} saved successfully`);

    setOrNumber('');
    setOrDate(new Date().toISOString().split('T')[0]);
    setPayor('');
    setReceiptType('');
    setAccountCodeId('');
    setAmount('');
  };

  const onPrint = () => {
    if (!orNumber.trim() || !payor.trim() || !selectedCode || totalAmount <= 0) {
      alert('Complete the OR form first before printing.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print official receipt.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Receipt ${orNumber}</title>
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
          <div class="row"><span class="label">OR Number:</span> ${orNumber}</div>
          <div class="row"><span class="label">OR Date:</span> ${orDate}</div>
          <div class="row"><span class="label">Payor:</span> ${payor}</div>
          <div class="row"><span class="label">Type:</span> ${receiptType}</div>
          <div class="row"><span class="label">Account Title:</span> ${selectedCode.description}</div>
          <div class="row"><span class="label">Account Code:</span> ${selectedCode.code}</div>
          <div class="row"><span class="label">Fund Type:</span> ${selectedCode.fund_type}</div>
        </div>

        <div class="total">
          <div class="row"><span class="label">Total Amount:</span> <strong>₱${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
        </div>

        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const thCls = 'bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border text-xs uppercase tracking-wide';
  const tdCls = 'px-4 py-3 border-b border-border/50 text-sm';

  return (
    <div className="space-y-6">
      <div className="bg-surface border border-border rounded-2xl p-6">
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
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground">
            <Calculator className="w-4 h-4 text-success" />
            <span>Total Amount: <strong>₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrint}
              className="px-4 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors inline-flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print OR
            </button>

            <PrimaryButton onClick={onSubmit} disabled={isSaving || activeCodes.length === 0}>
              <Plus className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save OR'}
            </PrimaryButton>
          </div>
        </div>

        {activeCodes.length === 0 && (
          <p className="text-xs text-warning mt-2">
            No active account codes found. Add active account codes in Treasury Account Plan first.
          </p>
        )}
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="relative w-full md:w-72 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search OR records..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
              {isLoadingReceipts ? (
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
                    <td className={`${tdCls} text-right`}>
                      ₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
