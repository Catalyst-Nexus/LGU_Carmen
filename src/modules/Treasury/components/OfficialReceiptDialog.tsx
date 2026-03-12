import { useState, useEffect } from 'react';
import { BaseDialog, FormInput } from '@/components/ui/dialog';
import type {
  OfficialReceipt,
  OfficialReceiptFormData,
  CollectionType,
  PaymentMethod,
  ORSeries,
} from '@/types/treasury.types';
import {
  getCollectionTypes,
  getPaymentMethods,
  getORSeries,
} from '@/services/treasuryService';

interface OfficialReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (receiptData: OfficialReceiptFormData) => void;
  receipt?: OfficialReceipt | null;
  isLoading?: boolean;
}

/* ── Dropdown option component (reuse across selects) ─────────────── */
const FormSelect = ({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <select
      id={id}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success disabled:bg-muted disabled:cursor-not-allowed"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      {children}
    </select>
  </div>
);

const FormTextarea = ({
  id,
  label,
  value,
  onChange,
  required,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <textarea
      id={id}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success resize-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      rows={rows}
      placeholder={placeholder}
    />
  </div>
);

export default function OfficialReceiptDialog({
  open,
  onClose,
  onSubmit,
  receipt,
  isLoading = false,
}: OfficialReceiptDialogProps) {
  const isEditMode = Boolean(receipt);

  // Lookup data
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [orSeriesList, setOrSeriesList] = useState<ORSeries[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  // Form state
  const [orSeriesId, setOrSeriesId] = useState('');
  const [orDate, setOrDate] = useState(new Date().toISOString().split('T')[0]);
  const [payorName, setPayorName] = useState('');
  const [payorAddress, setPayorAddress] = useState('');
  const [payorTin, setPayorTin] = useState('');
  const [collectionTypeId, setCollectionTypeId] = useState('');
  const [particulars, setParticulars] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentReference, setPaymentReference] = useState('');

  // Get selected payment method to check if reference is required
  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === paymentMethodId);
  const requiresReference = selectedPaymentMethod?.requires_reference || false;

  // Load lookup data
  useEffect(() => {
    if (open) {
      loadLookupData();
    }
  }, [open]);

  // Populate form when editing
  useEffect(() => {
    if (receipt && open) {
      setOrSeriesId(receipt.or_series_id);
      setOrDate(receipt.or_date);
      setPayorName(receipt.payor_name);
      setPayorAddress(receipt.payor_address || '');
      setPayorTin(receipt.payor_tin || '');
      setCollectionTypeId(receipt.collection_type_id);
      setParticulars(receipt.particulars);
      setAmount(receipt.amount.toString());
      setPaymentMethodId(receipt.payment_method_id);
      setPaymentReference(receipt.payment_reference || '');
    } else if (open) {
      resetForm();
    }
  }, [receipt, open]);

  const loadLookupData = async () => {
    setLoadingLookups(true);
    try {
      const [types, methods, series] = await Promise.all([
        getCollectionTypes(),
        getPaymentMethods(),
        getORSeries(),
      ]);
      setCollectionTypes(types);
      setPaymentMethods(methods);
      setOrSeriesList(series);

      // Auto-select first active OR series if available
      if (series.length > 0 && !receipt) {
        setOrSeriesId(series[0].id);
      }
    } catch (error) {
      console.error('Error loading lookup data:', error);
    } finally {
      setLoadingLookups(false);
    }
  };

  const resetForm = () => {
    setOrDate(new Date().toISOString().split('T')[0]);
    setPayorName('');
    setPayorAddress('');
    setPayorTin('');
    setCollectionTypeId('');
    setParticulars('');
    setAmount('');
    setPaymentMethodId('');
    setPaymentReference('');
  };

  const handleSubmit = () => {
    if (!orSeriesId || !collectionTypeId || !paymentMethodId) {
      alert('Please fill in all required fields');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount greater than zero');
      return;
    }

    const date = new Date(orDate);
    const fiscalYear = date.getFullYear();
    const fiscalMonth = date.getMonth() + 1;

    const formData: OfficialReceiptFormData = {
      or_series_id: orSeriesId,
      or_date: orDate,
      payor_name: payorName.trim(),
      payor_address: payorAddress.trim() || undefined,
      payor_tin: payorTin.trim() || undefined,
      collection_type_id: collectionTypeId,
      particulars: particulars.trim(),
      amount: numericAmount,
      payment_method_id: paymentMethodId,
      payment_reference: paymentReference.trim() || undefined,
      fiscal_year: fiscalYear,
      fiscal_month: fiscalMonth,
    };

    onSubmit(formData);
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={isEditMode ? 'Edit Official Receipt' : 'Generate Official Receipt'}
      onSubmit={handleSubmit}
      submitLabel={isEditMode ? 'Update Receipt' : 'Generate Receipt'}
      isLoading={isLoading || loadingLookups}
      size="xl"
    >
      {loadingLookups ? (
        <div className="text-center py-8 text-muted">
          <p>Loading form data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* OR Series and Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              id="or_series"
              label="OR Series"
              value={orSeriesId}
              onChange={setOrSeriesId}
              required
              disabled={isEditMode}
            >
              <option value="">Select OR Series</option>
              {orSeriesList.map((series) => (
                <option key={series.id} value={series.id}>
                  {series.series_name} ({series.prefix}{series.current_number.toString().padStart(5, '0')} - {series.prefix}{series.end_number.toString().padStart(5, '0')})
                </option>
              ))}
            </FormSelect>

            <div className="space-y-1.5">
              <label htmlFor="or_date" className="block text-sm font-medium text-foreground">
                OR Date
                <span className="text-error ml-1">*</span>
              </label>
              <input
                id="or_date"
                type="date"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                value={orDate}
                onChange={(e) => setOrDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Payor Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Payor Information</h3>
            
            <div className="space-y-4">
              <FormInput
                id="payor_name"
                type="text"
                label="Payor Name"
                value={payorName}
                onChange={setPayorName}
                required
                placeholder="Enter payor's full name"
              />

              <FormInput
                id="payor_address"
                type="text"
                label="Address"
                value={payorAddress}
                onChange={setPayorAddress}
                placeholder="Enter payor's address (optional)"
              />

              <FormInput
                id="payor_tin"
                type="text"
                label="TIN"
                value={payorTin}
                onChange={setPayorTin}
                placeholder="Tax Identification Number (optional)"
              />
            </div>
          </div>

          {/* Collection Details */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Collection Details</h3>
            
            <div className="space-y-4">
              <FormSelect
                id="collection_type"
                label="Collection Type"
                value={collectionTypeId}
                onChange={setCollectionTypeId}
                required
              >
                <option value="">Select Collection Type</option>
                {collectionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.description}
                  </option>
                ))}
              </FormSelect>

              <FormTextarea
                id="particulars"
                label="Particulars"
                value={particulars}
                onChange={setParticulars}
                required
                rows={3}
                placeholder="Enter payment details and purpose"
              />

              <div className="space-y-1.5">
                <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                  Amount
                  <span className="text-error ml-1">*</span>
                </label>
                <input
                  id="amount"
                  type="number"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Payment Details</h3>
            
            <div className="space-y-4">
              <FormSelect
                id="payment_method"
                label="Payment Method"
                value={paymentMethodId}
                onChange={setPaymentMethodId}
                required
              >
                <option value="">Select Payment Method</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.description}
                  </option>
                ))}
              </FormSelect>

              {requiresReference && (
                <FormInput
                  id="payment_reference"
                  type="text"
                  label="Payment Reference"
                  value={paymentReference}
                  onChange={setPaymentReference}
                  required={requiresReference}
                  placeholder="Check number, transaction ID, etc."
                />
              )}
            </div>
          </div>
        </div>
      )}
    </BaseDialog>
  );
}
