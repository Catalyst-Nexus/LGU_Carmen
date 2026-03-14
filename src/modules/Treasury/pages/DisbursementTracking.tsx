import { useState } from 'react';
import { TrendingDown, Check, Clock, AlertCircle, CreditCard } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface DisbursementRecord {
  id: string;
  referenceNo: string;
  payee: string;
  description: string;
  amount: number;
  date: string;
  status: 'processed' | 'pending' | 'rejected' | 'on-hold';
  type: 'salary' | 'supplies' | 'maintenance' | 'utilities' | 'other';
  approvedBy: string;
}

const DisbursementTracking = () => {
  const [filterType, setFilterType] = useState<'all' | 'salary' | 'supplies' | 'maintenance' | 'utilities' | 'other'>('all');

  // Static data for visualization
  const disbursements: DisbursementRecord[] = [
    {
      id: '001',
      referenceNo: 'DIS-2026-001',
      payee: 'HR Department',
      description: 'Monthly Salary - February 2026',
      amount: 850000,
      date: '2026-02-28',
      status: 'processed',
      type: 'salary',
      approvedBy: 'Mayor Santos',
    },
    {
      id: '002',
      referenceNo: 'DIS-2026-002',
      payee: 'Office Solutions Inc.',
      description: 'Office supplies and equipment',
      amount: 45000,
      date: '2026-03-05',
      status: 'processed',
      type: 'supplies',
      approvedBy: 'Administrator Cruz',
    },
    {
      id: '003',
      referenceNo: 'DIS-2026-003',
      payee: 'Maintenance Contractor',
      description: 'Building maintenance and repairs',
      amount: 120000,
      date: '2026-03-10',
      status: 'pending',
      type: 'maintenance',
      approvedBy: 'Treasurer Lopez',
    },
    {
      id: '004',
      referenceNo: 'DIS-2026-004',
      payee: 'Philippine Electric Company',
      description: 'Electricity bill - March 2026',
      amount: 85000,
      date: '2026-03-15',
      status: 'processed',
      type: 'utilities',
      approvedBy: 'Administrator Cruz',
    },
    {
      id: '005',
      referenceNo: 'DIS-2026-005',
      payee: 'Maynilad Water Services',
      description: 'Water supply and sewage - March 2026',
      amount: 35000,
      date: '2026-03-15',
      status: 'on-hold',
      type: 'utilities',
      approvedBy: 'Pending',
    },
    {
      id: '006',
      referenceNo: 'DIS-2026-006',
      payee: 'Professional Consulting Ltd.',
      description: 'IT system audit and consultation',
      amount: 75000,
      date: '2026-03-12',
      status: 'rejected',
      type: 'other',
      approvedBy: 'Treasurer Lopez',
    },
    {
      id: '007',
      referenceNo: 'DIS-2026-007',
      payee: 'Training Academy',
      description: 'Employee training and development',
      amount: 60000,
      date: '2026-03-18',
      status: 'pending',
      type: 'other',
      approvedBy: 'Administrator Cruz',
    },
    {
      id: '008',
      referenceNo: 'DIS-2026-008',
      payee: 'Medical Clinic Partner',
      description: 'Employee medical check-ups and services',
      amount: 50000,
      date: '2026-03-20',
      status: 'processed',
      type: 'other',
      approvedBy: 'Mayor Santos',
    },
  ];

  const summaryStats = [
    {
      label: 'Total Disbursements',
      value: '₱1,320,000.00',
      color: 'primary' as const,
      icon: <CreditCard className="w-5 h-5" />,
    },
    {
      label: 'Processed',
      value: '₱1,185,000.00',
      color: 'success' as const,
      icon: <Check className="w-5 h-5" />,
    },
    {
      label: 'Pending',
      value: '₱180,000.00',
      color: 'warning' as const,
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'On Hold / Rejected',
      value: '₱110,000.00',
      color: 'danger' as const,
      icon: <AlertCircle className="w-5 h-5" />,
    },
  ];

  const filtered = filterType === 'all' ? disbursements : disbursements.filter(d => d.type === filterType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'pending':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'on-hold':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <Check className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'salary':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300';
      case 'supplies':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
      case 'utilities':
        return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="w-8 h-8 text-primary" />
            Disbursement Tracking
          </h1>
          <p className="text-muted text-sm mt-1">Monitor and manage all fund disbursements</p>
        </div>
        <select className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary">
          <option value="current">Current Month</option>
          <option value="previous">Previous Month</option>
          <option value="quarter">This Quarter</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => (
          <StatCard key={idx} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />
        ))}
      </div>

      {/* Disbursements Table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Disbursement Records</h2>
          <div className="flex gap-2 overflow-x-auto">
            {(['all', 'salary', 'supplies', 'maintenance', 'utilities', 'other'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full border transition-colors whitespace-nowrap',
                  filterType === type ? 'bg-primary text-white border-primary' : 'border-border bg-background text-foreground hover:bg-surface'
                )}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Reference #</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Payee</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Description</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Amount</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Type</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(disbursement => (
                <tr key={disbursement.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{disbursement.referenceNo}</td>
                  <td className="px-4 py-3 text-foreground">{disbursement.payee}</td>
                  <td className="px-4 py-3 text-foreground text-xs max-w-xs truncate" title={disbursement.description}>
                    {disbursement.description}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">₱{disbursement.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-block px-2 py-1 rounded text-xs font-medium', getTypeColor(disbursement.type))}>
                      {disbursement.type.charAt(0).toUpperCase() + disbursement.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getStatusColor(disbursement.status))}>
                      {getStatusIcon(disbursement.status)}
                      {disbursement.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground text-xs">{disbursement.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* By Payee Summary */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Top Disbursements by Payee</h2>
        <div className="space-y-3">
          {[
            { payee: 'HR Department', amount: 850000, percentage: 64 },
            { payee: 'Maintenance Contractor', amount: 120000, percentage: 9 },
            { payee: 'Philippine Electric Company', amount: 85000, percentage: 6 },
            { payee: 'Professional Consulting Ltd.', amount: 75000, percentage: 6 },
            { payee: 'Office Solutions Inc.', amount: 45000, percentage: 3 },
            { payee: 'Others', amount: 145000, percentage: 11 },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{item.payee}</span>
                  <span className="text-sm text-muted">₱{item.amount.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-blue-500" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
              <span className="text-sm font-medium text-foreground w-12 text-right">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DisbursementTracking;
