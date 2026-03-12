import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';

interface CashflowData {
  date: string;
  inflow: number;
  outflow: number;
  balance: number;
}

const CashflowMonitoring = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  // Static data for visualization
  const cashflowData: CashflowData[] = [
    { date: 'Jan 1', inflow: 250000, outflow: 180000, balance: 1250000 },
    { date: 'Jan 8', inflow: 320000, outflow: 210000, balance: 1360000 },
    { date: 'Jan 15', inflow: 180000, outflow: 220000, balance: 1320000 },
    { date: 'Jan 22', inflow: 450000, outflow: 320000, balance: 1450000 },
    { date: 'Jan 29', inflow: 290000, outflow: 190000, balance: 1550000 },
    { date: 'Feb 5', inflow: 380000, outflow: 280000, balance: 1650000 },
    { date: 'Feb 12', inflow: 220000, outflow: 250000, balance: 1620000 },
  ];

  const summaryStats = [
    {
      label: 'Total Inflows',
      value: '₱2,090,000.00',
      color: 'success' as const,
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: 'Total Outflows',
      value: '₱1,650,000.00',
      color: 'danger' as const,
      icon: <TrendingDown className="w-5 h-5" />,
    },
    {
      label: 'Net Cashflow',
      value: '₱440,000.00',
      color: 'primary' as const,
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      label: 'Current Balance',
      value: '₱1,620,000.00',
      color: 'default' as const,
      icon: <Wallet className="w-5 h-5" />,
    },
  ];

  const maxValue = Math.max(...cashflowData.map(d => Math.max(d.inflow, d.outflow)));

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-primary" />
            Cashflow Monitoring
          </h1>
          <p className="text-muted text-sm mt-1">Track cash inflows and outflows over time</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | 'quarter')}
          className="px-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-primary"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </select>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, idx) => (
          <StatCard key={idx} label={stat.label} value={stat.value} color={stat.color} icon={stat.icon} />
        ))}
      </div>

      {/* Chart Section */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Inflow vs Outflow Trend</h2>
        <div className="h-80 flex flex-col justify-end gap-2">
          <div className="flex items-end gap-3 h-full">
            {cashflowData.map((item, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                {/* Dual bar chart */}
                <div className="flex items-end gap-1 h-56">
                  <div className="flex-1 bg-green-500 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(item.inflow / maxValue) * 100}%` }} title={`Inflow: ₱${item.inflow.toLocaleString()}`} />
                  <div className="flex-1 bg-red-500 rounded-t opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${(item.outflow / maxValue) * 100}%` }} title={`Outflow: ₱${item.outflow.toLocaleString()}`} />
                </div>
                <span className="text-xs text-muted text-center">{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-foreground">Inflows</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-foreground">Outflows</span>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-surface border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Detailed Cashflow</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-4 py-3 text-left font-semibold text-muted uppercase text-xs tracking-wide">Date</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Inflow</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Outflow</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Net Change</th>
                <th className="px-4 py-3 text-right font-semibold text-muted uppercase text-xs tracking-wide">Balance</th>
              </tr>
            </thead>
            <tbody>
              {cashflowData.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-background/50 transition-colors">
                  <td className="px-4 py-3 text-foreground">{item.date}</td>
                  <td className="px-4 py-3 text-right text-green-600 dark:text-green-400 font-medium">₱{item.inflow.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-red-600 dark:text-red-400 font-medium">₱{item.outflow.toLocaleString()}</td>
                  <td className={cn('px-4 py-3 text-right font-medium', item.inflow > item.outflow ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                    ₱{(item.inflow - item.outflow).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-foreground font-semibold">₱{item.balance.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashflowMonitoring;
