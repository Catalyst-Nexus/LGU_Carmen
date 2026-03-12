import { useState } from 'react';
import { FileText, Eye, XCircle, Printer, Search } from 'lucide-react';
import type { OfficialReceiptWithDetails } from '@/types/treasury.types';
import { cn } from '@/lib/utils';

interface OfficialReceiptListProps {
  receipts: OfficialReceiptWithDetails[];
  onView?: (receipt: OfficialReceiptWithDetails) => void;
  onCancel?: (receipt: OfficialReceiptWithDetails) => void;
  onPrint?: (receipt: OfficialReceiptWithDetails) => void;
  isLoading?: boolean;
}

export default function OfficialReceiptList({
  receipts,
  onView,
  onCancel,
  onPrint,
  isLoading = false,
}: OfficialReceiptListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter receipts based on search
  const filteredReceipts = receipts.filter((receipt) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt.or_number.toLowerCase().includes(searchLower) ||
      receipt.payor.toLowerCase().includes(searchLower) ||
      receipt.particulars.toLowerCase().includes(searchLower) ||
      receipt.account_code_details?.description.toLowerCase().includes(searchLower)
    );
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const config = {
      active: {
        bg: 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        label: 'Active',
      },
      cancelled: {
        bg: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400',
        label: 'Cancelled',
      },
      void: {
        bg: 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400',
        label: 'Void',
      },
    };

    const statusConfig = config[status as keyof typeof config] || config.active;

    return (
      <span
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-medium inline-flex items-center',
          statusConfig.bg
        )}
      >
        {statusConfig.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm">Loading receipts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search by OR number, payor, particulars, or collection type..."
          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Receipts List */}
      {filteredReceipts.length === 0 ? (
        <div className="text-center py-12 bg-surface border border-border rounded-xl">
          <FileText className="w-12 h-12 mx-auto mb-3 text-muted opacity-50" />
          <p className="text-sm text-muted">
            {searchTerm ? 'No receipts found matching your search' : 'No official receipts generated yet'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReceipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-surface border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Receipt Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">
                        OR No: {receipt.or_number}
                      </h3>
                      <p className="text-xs text-muted">
                        {formatDate(receipt.or_date)}
                      </p>
                    </div>
                    {getStatusBadge(receipt.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-muted">Payor</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {receipt.payor}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Collection Type</p>
                      <p className="text-sm font-medium text-foreground truncate">
                        {receipt.account_code_details?.description}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Amount</p>
                      <p className="text-sm font-semibold text-primary">
                        {formatCurrency(receipt.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">Payment Method</p>
                      <p className="text-sm font-medium text-foreground">
                        {receipt.payment_method?.description}
                        {receipt.payment_reference && (
                          <span className="text-xs text-muted ml-1">
                            ({receipt.payment_reference})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-muted">Particulars</p>
                    <p className="text-sm text-foreground line-clamp-2">
                      {receipt.particulars}
                    </p>
                  </div>

                  {receipt.status !== 'active' && receipt.cancellation_reason && (
                    <div className="mt-3 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                      <p className="text-xs text-red-700 dark:text-red-400">
                        <strong>Reason:</strong> {receipt.cancellation_reason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {onView && (
                    <button
                      onClick={() => onView(receipt)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onPrint && receipt.status === 'active' && (
                    <button
                      onClick={() => onPrint(receipt)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Print Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  )}
                  {onCancel && receipt.status === 'active' && (
                    <button
                      onClick={() => onCancel(receipt)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Cancel Receipt"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredReceipts.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">
              Total: {filteredReceipts.length} receipt{filteredReceipts.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm font-semibold text-foreground">
              Total Amount:{' '}
              {formatCurrency(
                filteredReceipts
                  .filter((r) => r.status === 'active')
                  .reduce((sum, r) => sum + r.amount, 0)
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
