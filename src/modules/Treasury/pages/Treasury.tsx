import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router';
import { Coins, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Landmark, ArrowLeft, FileText } from 'lucide-react';
import CashflowMonitoring from './CashflowMonitoring';
import CollectionMonitoring from './CollectionMonitoring';
import DisbursementTracking from './DisbursementTracking';
import BankReconciliation from './BankReconciliation';
import OfficialReceipts from './OfficialReceipts';

const TreasuryHome = () => {
  const navigate = useNavigate();

  // TODO: Replace with actual API calls
  const [stats] = useState([
    {
      title: "Treasury Accounts",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Wallet,
      color: "blue",
    },
    {
      title: "Total Receipts",
      value: "₱0.00",
      change: "+0%",
      trend: "up",
      icon: ArrowDownRight,
      color: "green",
    },
    {
      title: "Total Disbursements",
      value: "₱0.00",
      change: "+0%",
      trend: "down",
      icon: ArrowUpRight,
      color: "orange",
    },
    {
      title: "Current Balance",
      value: "₱0.00",
      change: "+0%",
      trend: "up",
      icon: Coins,
      color: "purple",
    },
  ]);

  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> =
    {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-500/10",
        text: "text-blue-700 dark:text-blue-400",
        iconBg: "bg-blue-500",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-500/10",
        text: "text-green-700 dark:text-green-400",
        iconBg: "bg-green-500",
      },
      orange: {
        bg: "bg-orange-50 dark:bg-orange-500/10",
        text: "text-orange-700 dark:text-orange-400",
        iconBg: "bg-orange-500",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-500/10",
        text: "text-purple-700 dark:text-purple-400",
        iconBg: "bg-purple-500",
      },
    };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-xl shadow-lg">
          <Coins className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Treasury</h1>
          <p className="text-sm text-muted">
            Manage treasury accounts, receipts, and disbursements
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const colors = colorMap[stat.color];
          const Icon = stat.icon;
          const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;

          return (
            <div
              key={idx}
              className="bg-surface border border-border rounded-xl p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${colors.iconBg}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  <TrendIcon className="w-3 h-3" />
                  {stat.change}
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-1">
                {stat.value}
              </h3>
              <p className="text-sm text-muted">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Module Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => navigate('official-receipts')}
          className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary group text-left"
        >
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-400 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Official Receipts</h3>
          <p className="text-xs text-muted">Generate and manage official receipts</p>
        </button>

        <button
          onClick={() => navigate("cashflow")}
          className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary group text-left"
        >
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-400 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            Cashflow Monitoring
          </h3>
          <p className="text-xs text-muted">Track cash inflows and outflows</p>
        </button>

        <button
          onClick={() => navigate("collections")}
          className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary group text-left"
        >
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-400 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            Collection Monitoring
          </h3>
          <p className="text-xs text-muted">Monitor revenue collections</p>
        </button>

        <button
          onClick={() => navigate("disbursements")}
          className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary group text-left"
        >
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            Disbursement Tracking
          </h3>
          <p className="text-xs text-muted">Monitor all fund disbursements</p>
        </button>

        <button
          onClick={() => navigate("reconciliation")}
          className="bg-surface border border-border rounded-xl p-6 hover:shadow-lg transition-all hover:border-primary group text-left"
        >
          <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-400 rounded-lg w-fit mb-3 group-hover:shadow-lg transition-shadow">
            <Landmark className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">
            Bank Reconciliation
          </h3>
          <p className="text-xs text-muted">Reconcile bank accounts</p>
        </button>
      </div>

      {/* Placeholder Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Receipts */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Receipts
            </h2>
          </div>
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No recent receipts</p>
            <p className="text-xs mt-1">Treasury receipts will appear here</p>
          </div>
        </div>

        {/* Cash Disbursements */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Recent Disbursements
            </h2>
          </div>
          <div className="text-center py-12 text-muted">
            <p className="text-sm">No recent disbursements</p>
            <p className="text-xs mt-1">
              Treasury disbursements will appear here
            </p>
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Treasury Account Summary
        </h2>
        <div className="text-center py-12 text-muted">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No treasury accounts configured</p>
          <p className="text-xs mt-1">
            Configure treasury accounts in the General Accounting Plan
          </p>
        </div>
      </div>
    </div>
  );
};

const Treasury = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route index element={<TreasuryHome />} />
      <Route
        path="cashflow"
        element={
          <div>
            <button
              onClick={() => navigate("..")}
              className="p-2 mb-4 flex items-center gap-2 text-sm text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Treasury
            </button>
            <CashflowMonitoring />
          </div>
        }
      />
      <Route
        path="collections"
        element={
          <div>
            <button
              onClick={() => navigate("..")}
              className="p-2 mb-4 flex items-center gap-2 text-sm text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Treasury
            </button>
            <CollectionMonitoring />
          </div>
        }
      />
      <Route
        path="disbursements"
        element={
          <div>
            <button
              onClick={() => navigate("..")}
              className="p-2 mb-4 flex items-center gap-2 text-sm text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Treasury
            </button>
            <DisbursementTracking />
          </div>
        }
      />
      <Route
        path="reconciliation"
        element={
          <div>
            <button
              onClick={() => navigate("..")}
              className="p-2 mb-4 flex items-center gap-2 text-sm text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Treasury
            </button>
            <BankReconciliation />
          </div>
        }
      />
      <Route
        path="official-receipts"
        element={
          <div>
            <button
              onClick={() => navigate('..')}
              className="p-2 mb-4 flex items-center gap-2 text-sm text-foreground hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Treasury
            </button>
            <OfficialReceipts />
          </div>
        }
      />
    </Routes>
  );
};

export default Treasury;
