import { useState } from 'react';
import { TrendingUp, CheckCircle, AlertCircle, Clock, Percent } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CollectionRecord {
  id: string;
  source: string;
  description: string;
  target: number;
  collected: number;
  status: 'completed' | 'in-progress' | 'pending' | 'overdue';
  dueDate: string;
  percentage: number;
}

const CollectionMonitoring = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'pending' | 'overdue'>('all');

  // Static data for visualization
  const collections: CollectionRecord[] = [
    {
      id: '001',
      source: 'Business Permit Fees',
      description: 'Monthly business licensing and permits collection',
      target: 500000,
      collected: 485000,
      status: 'completed',
      dueDate: '2026-02-28',
      percentage: 97,
    },
    {
      id: '002',
      source: 'Property Tax',
      description: 'Real property tax collection for the municipality',
      target: 1200000,
      collected: 950000,
      status: 'in-progress',
      dueDate: '2026-03-31',
      percentage: 79,
    },
    {
      id: '003',
      source: 'Water Service Fees',
      description: 'Water utility billing and collection',
      target: 350000,
      collected: 220000,
      status: 'in-progress',
      dueDate: '2026-03-15',
      percentage: 63,
    },
    {
      id: '004',
      source: 'Building Permits',
      description: 'Building and construction permit fees',
      target: 280000,
      collected: 180000,
      status: 'pending',
      dueDate: '2026-03-20',
      percentage: 64,
    },
    {
      id: '005',
      source: 'Sanitation Fees',
      description: 'Waste management and sanitation charges',
      target: 150000,
      collected: 120000,
      status: 'in-progress',
      dueDate: '2026-03-10',
      percentage: 80,
    },
    {
      id: '006',
      source: 'Barangay Fees',
      description: 'Barangay clearance and administrative fees',
      target: 200000,
      collected: 85000,
      status: 'overdue',
      dueDate: '2026-01-31',
      percentage: 42,
    },
  ];

  const summaryStats = [
    {
      label: 'Total Collection Target',
      value: '₱2,680,000.00',
      color: 'primary' as const,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: 'Total Collected',
      value: '₱2,040,000.00',
      color: 'success' as const,
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      label: 'Collection Rate',
      value: '76.1%',
      color: 'default' as const,
      icon: <Percent className="w-5 h-5" />,
    },
    {
      label: 'Outstanding',
      value: '₱640,000.00',
      color: 'warning' as const,
      icon: <Clock className="w-5 h-5" />,
    },
  ];

  const filtered = filterStatus === 'all' ? collections : collections.filter(c => c.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400';
      case 'in-progress':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400';
      case 'overdue':
        return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-primary" />
            Collection Monitoring
          </h1>
          <p className="text-muted text-sm mt-1">Track revenue collections from various sources</p>
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

      {/* Collections Table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Collection Sources</h2>
          <div className="flex gap-2">
            {(['all', 'completed', 'in-progress', 'pending', 'overdue'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-full border transition-colors',
                  filterStatus === status ? 'bg-primary text-white border-primary' : 'border-border bg-background text-foreground hover:bg-surface'
                )}
              >
                {status === 'all' ? 'All' : status.replace('-', ' ').charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Source</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Description</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Target</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Collected</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Progress</th>
                <th className="px-4 py-3 text-center font-semibold text-muted uppercase text-xs tracking-wide">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(collection => (
                <tr key={collection.id} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{collection.source}</td>
                  <td className="px-4 py-3 text-foreground text-xs">{collection.description}</td>
                  <td className="px-4 py-3 text-right text-foreground">₱{collection.target.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">₱{collection.collected.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-blue-500" style={{ width: `${collection.percentage}%` }} />
                      </div>
                      <span className="text-xs font-medium text-foreground whitespace-nowrap w-10 text-right">{collection.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', getStatusColor(collection.status))}>
                      {getStatusIcon(collection.status)}
                      {collection.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground text-xs">{collection.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionMonitoring;
