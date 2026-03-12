import { useState, useEffect } from 'react';
import { FileText, Plus, Download, Filter } from 'lucide-react';
import OfficialReceiptDialog from '../components/OfficialReceiptDialog';
import OfficialReceiptList from '../components/OfficialReceiptList';
import type {
  OfficialReceiptWithDetails,
  OfficialReceiptFormData,
  CollectionType,
} from '@/types/treasury.types';
import {
  getOfficialReceipts,
  createOfficialReceipt,
  cancelOfficialReceipt,
  getCollectionTypes,
} from '@/services/treasuryService';

export default function OfficialReceipts() {
  const [receipts, setReceipts] = useState<OfficialReceiptWithDetails[]>([]);
  const [collectionTypes, setCollectionTypes] = useState<CollectionType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [collectionTypeFilter, setCollectionTypeFilter] = useState<string>('');
  const [fiscalYear] = useState(new Date().getFullYear());
  const [fiscalMonth, setFiscalMonth] = useState<number | undefined>(undefined);

  useEffect(() => {
    loadReceipts();
    loadCollectionTypes();
  }, [statusFilter, collectionTypeFilter, fiscalMonth]);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (collectionTypeFilter) {
        filters.collection_type_id = collectionTypeFilter;
      }
      if (fiscalMonth) {
        filters.fiscal_month = fiscalMonth;
        filters.fiscal_year = fiscalYear;
      }

      const data = await getOfficialReceipts(filters);
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
      alert('Failed to load official receipts');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollectionTypes = async () => {
    try {
      const types = await getCollectionTypes();
      setCollectionTypes(types);
    } catch (error) {
      console.error('Error loading collection types:', error);
    }
  };

  const handleCreateReceipt = async (formData: OfficialReceiptFormData) => {
    setIsSaving(true);
    try {
      const newReceipt = await createOfficialReceipt(formData);
      setReceipts([newReceipt, ...receipts]);
      setIsDialogOpen(false);
      alert(`Official Receipt ${newReceipt.or_number} generated successfully!`);
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      alert(error.message || 'Failed to generate official receipt');
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewReceipt = (receipt: OfficialReceiptWithDetails) => {
    // You could open a view-only dialog here
    alert(`Viewing OR ${receipt.or_number}\n\nPayor: ${receipt.payor_name}\nAmount: ₱${receipt.amount.toLocaleString()}\nParticulars: ${receipt.particulars}`);
  };

  const handleCancelReceipt = async (receipt: OfficialReceiptWithDetails) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason || reason.trim() === '') {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to cancel OR ${receipt.or_number}?\n\nThis action cannot be undone.`
    );
    if (!confirmed) {
      return;
    }

    try {
      const updatedReceipt = await cancelOfficialReceipt(receipt.id, {
        cancellation_reason: reason.trim(),
      });
      setReceipts(receipts.map((r) => (r.id === updatedReceipt.id ? updatedReceipt : r)));
      alert(`OR ${receipt.or_number} has been cancelled`);
    } catch (error: any) {
      console.error('Error cancelling receipt:', error);
      alert(error.message || 'Failed to cancel receipt');
    }
  };

  const handlePrintReceipt = (receipt: OfficialReceiptWithDetails) => {
    // Generate a simple print view
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Official Receipt - ${receipt.or_number}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            max-width: 800px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0;
            font-size: 14px;
          }
          .or-number {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .section {
            margin-bottom: 20px;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .field {
            margin-bottom: 10px;
            display: flex;
          }
          .field-label {
            width: 150px;
            font-weight: bold;
          }
          .field-value {
            flex: 1;
          }
          .amount-box {
            border: 2px solid #333;
            padding: 15px;
            text-align: center;
            margin: 20px 0;
          }
          .amount-box .label {
            font-size: 14px;
            margin-bottom: 5px;
          }
          .amount-box .value {
            font-size: 28px;
            font-weight: bold;
          }
          .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 5px;
          }
          @media print {
            body {
              margin: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MUNICIPALITY OF CARMEN</h1>
          <p>Province of [Province Name]</p>
          <p>OFFICIAL RECEIPT</p>
        </div>

        <div class="or-number">
          OR No.: ${receipt.or_number}
        </div>

        <div class="section">
          <div class="field">
            <div class="field-label">Date:</div>
            <div class="field-value">${new Date(receipt.or_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Received From</div>
          <div class="field">
            <div class="field-label">Name:</div>
            <div class="field-value">${receipt.payor_name}</div>
          </div>
          ${receipt.payor_address ? `
          <div class="field">
            <div class="field-label">Address:</div>
            <div class="field-value">${receipt.payor_address}</div>
          </div>
          ` : ''}
          ${receipt.payor_tin ? `
          <div class="field">
            <div class="field-label">TIN:</div>
            <div class="field-value">${receipt.payor_tin}</div>
          </div>
          ` : ''}
        </div>

        <div class="amount-box">
          <div class="label">Amount Paid</div>
          <div class="value">₱${receipt.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        <div class="section">
          <div class="section-title">Payment Details</div>
          <div class="field">
            <div class="field-label">Collection Type:</div>
            <div class="field-value">${receipt.collection_type?.description}</div>
          </div>
          <div class="field">
            <div class="field-label">Particulars:</div>
            <div class="field-value">${receipt.particulars}</div>
          </div>
          <div class="field">
            <div class="field-label">Payment Method:</div>
            <div class="field-value">${receipt.payment_method?.description}${receipt.payment_reference ? ` (${receipt.payment_reference})` : ''}</div>
          </div>
        </div>

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-line">Taxpayer's Signature</div>
          </div>
          <div class="signature-box">
            <div class="signature-line">Received By</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExportReceipts = () => {
    // Generate CSV export
    const csv = [
      ['OR Number', 'Date', 'Payor', 'Collection Type', 'Amount', 'Payment Method', 'Status'].join(','),
      ...receipts.map((r) =>
        [
          r.or_number,
          r.or_date,
          r.payor_name,
          r.collection_type?.description,
          r.amount,
          r.payment_method?.description,
          r.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `official-receipts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const totalAmount = receipts
    .filter((r) => r.status === 'active')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Official Receipts</h1>
            <p className="text-sm text-muted">Generate and manage official receipts</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportReceipts}
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Receipt
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-muted">Total Receipts</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">{receipts.length}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-muted">Active Receipts</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {receipts.filter((r) => r.status === 'active').length}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-muted">Total Amount</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            ₱{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted" />
          <h3 className="text-sm font-semibold text-foreground">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Status</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Collection Type</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
              value={collectionTypeFilter}
              onChange={(e) => setCollectionTypeFilter(e.target.value)}
            >
              <option value="">All Collection Types</option>
              {collectionTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Month</label>
            <select
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
              value={fiscalMonth || ''}
              onChange={(e) => setFiscalMonth(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts List */}
      <OfficialReceiptList
        receipts={receipts}
        onView={handleViewReceipt}
        onCancel={handleCancelReceipt}
        onPrint={handlePrintReceipt}
        isLoading={isLoading}
      />

      {/* Dialog */}
      <OfficialReceiptDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateReceipt}
        isLoading={isSaving}
      />
    </div>
  );
}
