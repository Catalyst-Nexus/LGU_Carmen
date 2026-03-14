import { useState } from 'react';
import { CheckCircle, AlertCircle, Landmark, DollarSign, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface TransactionRecord {
  id: string;
  date: string;
  description: string;
  bookAmount: number;
  bankAmount: number | null;
  status: 'reconciled' | 'pending' | 'unmatched';
  type: 'debit' | 'credit';
}

interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  institution: string;
  bookBalance: number;
  bankBalance: number;
  difference: number;
  reconciliationStatus: 'complete' | 'in-progress' | 'pending';
}

const BankReconciliation = () => {
  const [selectedAccount, setSelectedAccount] = useState<string>('001');
  const [filterStatus, setFilterStatus] = useState<'all' | 'reconciled' | 'pending' | 'unmatched'>('all');

  // Static data for visualization
  const bankAccounts: BankAccount[] = [
    {
      id: '001',
      name: 'General Fund Account',
      accountNumber: '1234567890',
      institution: 'Philippine National Bank',
      bookBalance: 1620000,
      bankBalance: 1605000,
      difference: 15000,
      reconciliationStatus: 'in-progress',
    },
    {
      id: '002',
      name: 'Special Purpose Fund',
      accountNumber: '0987654321',
      institution: 'Bank of the Philippine Islands',
      bookBalance: 850000,
      bankBalance: 850000,
      difference: 0,
      reconciliationStatus: 'complete',
    },
    {
      id: '003',
      name: 'Trust Fund Account',
      accountNumber: '5555555555',
      institution: 'Metrobank',
      bookBalance: 450000,
      bankBalance: 475000,
      difference: -25000,
      reconciliationStatus: 'pending',
    },
  ];

  const transactions: TransactionRecord[] = [
    {
      id: '001',
      date: '2026-03-01',
      description: 'Opening balance',
      bookAmount: 1605000,
      bankAmount: 1605000,
      status: 'reconciled',
      type: 'credit',
    },
    {
      id: '002',
      date: '2026-03-05',
      description: 'Collection - Property Tax',
      bookAmount: 150000,
      bankAmount: 150000,
      status: 'reconciled',
      type: 'credit',
    },
    {
      id: '003',
      date: '2026-03-07',
      description: 'Disbursement - Supplier Invoice #P123',
      bookAmount: 45000,
      bankAmount: 45000,
      status: 'reconciled',
      type: 'debit',
    },
    {
      id: '004',
      date: '2026-03-10',
      description: 'Salary Payment - February 2026',
      bookAmount: 250000,
      bankAmount: 250000,
      status: 'reconciled',
      type: 'debit',
    },
    {
      id: '005',
      date: '2026-03-12',
      description: 'Bank Service Charge',
      bookAmount: 0,
      bankAmount: 1500,
      status: 'unmatched',
      type: 'debit',
    },
    {
      id: '006',
      date: '2026-03-13',
      description: 'Collection - Business Permits',
      bookAmount: 75000,
      bankAmount: null,
      status: 'pending',
      type: 'credit',
    },
    {
      id: '007',
      date: '2026-03-15',
      description: 'Utility Payment - Electricity',
      bookAmount: 85000,
      bankAmount: 85000,
      status: 'reconciled',
      type: 'debit',
    },
    {
      id: '008',
      date: '2026-03-18',
      description: 'Maintenance Contractor Payment',
      bookAmount: 120000,
      bankAmount: 120000,
      status: 'reconciled',
      type: 'debit',
    },
    {
      id: '009',
      date: '2026-03-20',
      description: 'Interest Income',
      bookAmount: 5000,
      bankAmount: 5000,
      status: 'reconciled',
      type: 'credit',
    },
    {
      id: '010',
      date: '2026-03-22',
      description: 'Check Deposit - Collection',
      bookAmount: 100000,
      bankAmount: null,
      status: 'pending',
      type: 'credit',
    },
  ];

  const currentAccount = bankAccounts.find(a => a.id === selectedAccount);
  const filtered = filterStatus === 'all' ? transactions : transactions.filter(t => t.status === filterStatus);

  const summaryStats = [
    {
      label: 'Total Book Balance',
      value: '₱1,620,000.00',
      color: 'primary' as const,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: 'Total Bank Balance',
      value: '₱1,605,000.00',
      color: 'success' as const,
      icon: <Landmark className="w-5 h-5" />,
    },
    {
      label: 'Unreconciled Items',
      value: '₱91,500.00',
      color: 'warning' as const,
      icon: <AlertCircle className="w-5 h-5" />,
    },
    {
      label: 'Reconciliation Rate',
      value: '94.3%',
      color: 'primary' as const,
      icon: <BarChart3 className="w-5 h-5" />,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reconciled':
        return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'pending':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'unmatched':
        return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'reconciled':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-8 h-8 text-primary" />
            Bank Reconciliation
          </h1>
          <p className="text-muted text-sm mt-1">Reconcile bank accounts and track transaction discrepancies</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors">
          Generate Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => (
          <StatCard key={idx} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />
        ))}
      </div>

      {/* Bank Accounts Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bankAccounts.map(account => (
          <div
            key={account.id}
            onClick={() => setSelectedAccount(account.id)}
            className={cn(
              'p-4 rounded-2xl border-2 cursor-pointer transition-all',
              selectedAccount === account.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-border bg-surface hover:border-primary/50'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-foreground text-sm">{account.name}</p>
                <p className="text-muted text-xs mt-1">{account.institution}</p>
              </div>
              <div
                className={cn(
                  'p-2 rounded-lg',
                  account.reconciliationStatus === 'complete'
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300'
                    : account.reconciliationStatus === 'in-progress'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300'
                )}
              >
                {account.reconciliationStatus === 'complete' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted">Book Balance</span>
                <span className="font-medium text-foreground">₱{account.bookBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted">Bank Balance</span>
                <span className="font-medium text-foreground">₱{account.bankBalance.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-border/50 flex justify-between text-xs">
                <span className="text-muted">Difference</span>
                <span className={cn('font-medium', account.difference === 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                  ₱{account.difference.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transaction Details</h2>
            {currentAccount && (
              <p className="text-xs text-muted mt-1">
                Account {currentAccount.accountNumber} • {currentAccount.institution}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {(['all', 'reconciled', 'pending', 'unmatched'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                  filterStatus === status ? 'bg-primary text-white border-primary' : 'border-border bg-background text-foreground hover:bg-surface'
                )}
              >
                {status === 'all' ? 'All' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Description</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Type</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Book Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Bank Amount</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(transaction => (
                <tr key={transaction.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-foreground text-xs">{transaction.date}</td>
                  <td className="px-4 py-3 text-foreground">{transaction.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-xs font-medium px-2 py-1 rounded', transaction.type === 'debit' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300')}>
                      {transaction.type === 'debit' ? 'Debit' : 'Credit'}
                    </span>
                  </td>
                  <td className={cn('px-4 py-3 text-right font-medium', transaction.type === 'debit' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
                    ₱{transaction.bookAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">
                    {transaction.bankAmount !== null ? `₱${transaction.bankAmount.toLocaleString()}` : <span className="text-muted">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getStatusColor(transaction.status))}>
                      {getStatusIcon(transaction.status)}
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reconciliation Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Adjustment Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted">Book Balance</span>
              <span className="font-medium text-foreground">₱1,620,000.00</span>
            </div>
            <div className="border-t border-border/50">
              <div className="flex justify-between py-3">
                <span className="text-muted text-sm">Add: Bank Interest</span>
                <span className="text-green-600 dark:text-green-400 font-medium">+ ₱5,000.00</span>
              </div>
              <div className="flex justify-between py-3 border-t border-border/50">
                <span className="text-muted text-sm">Less: Service Charges</span>
                <span className="text-red-600 dark:text-red-400 font-medium">- ₱1,500.00</span>
              </div>
            </div>
            <div className="border-t border-border/50 pt-3 flex justify-between">
              <span className="text-muted">Adjusted Balance</span>
              <span className="font-semibold text-foreground">₱1,623,500.00</span>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h3 className="font-semibold text-foreground mb-4">Outstanding Items</h3>
          <div className="space-y-3">
            {[
              { type: 'Check Deposit', amount: 100000, date: '2026-03-22', days: 1 },
              { type: 'Collection (in transit)', amount: 75000, date: '2026-03-13', days: 9 },
            ].map((item, idx) => (
              <div key={idx} className="p-3 bg-background/50 rounded-lg border border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.type}</p>
                    <p className="text-xs text-muted mt-1">{item.date} ({item.days} days old)</p>
                  </div>
                  <span className="font-medium text-foreground">₱{item.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;
