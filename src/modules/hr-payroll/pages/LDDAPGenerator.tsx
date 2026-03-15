import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageShell,
  Section,
  StatCard,
  GhostButton,
  TabBar,
  PayrollBadge,
  Card,
  fmtPeso,
  EmptyState,
  usePagination,
  Pagination,
  EmptyRows,
} from "../components/ui";
import { FileText, Printer, Search, Calendar, Landmark } from "lucide-react";
import type { PayrollPeriod } from "@/types/hr.types";
import { fetchPayrollPeriods } from "../services/hrService";

const LDDAPGenerator = () => {
  const [payrolls, setPayrolls] = useState<PayrollPeriod[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollPeriods();
      setPayrolls(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return payrolls.filter((p) => {
      const matchSearch =
        p.period_name.toLowerCase().includes(search.toLowerCase()) ||
        p.fund_type.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "all") return matchSearch;
      return matchSearch && p.status === activeTab;
    });
  }, [payrolls, search, activeTab]);

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);

  const totals = useMemo(
    () => ({
      total: payrolls.reduce((s, p) => s + p.total_amount, 0),
      approved: payrolls
        .filter((p) => p.status === "approved" || p.status === "released")
        .reduce((s, p) => s + p.total_amount, 0),
    }),
    [payrolls],
  );

  const tabs = useMemo(
    () => [
      { id: "all", label: "All", count: payrolls.length },
      {
        id: "draft",
        label: "Draft",
        count: payrolls.filter((p) => p.status === "draft").length,
      },
      {
        id: "computed",
        label: "Computed",
        count: payrolls.filter((p) => p.status === "computed").length,
      },
      {
        id: "approved",
        label: "Approved",
        count: payrolls.filter((p) => p.status === "approved").length,
      },
      {
        id: "released",
        label: "Released",
        count: payrolls.filter((p) => p.status === "released").length,
      },
    ],
    [payrolls],
  );

  return (
    <PageShell
      title="LDDAP-ADA Generator"
      subtitle="List of Due and Demandable Accounts Payable — Advice to Debit Account"
      onRefresh={loadData}
      isLoading={isLoading}
      actions={
        <>
          <GhostButton onClick={() => {}} disabled={filtered.length === 0}>
            <Printer className="w-3.5 h-3.5" />
            Print LDDAP-ADA
          </GhostButton>
        </>
      }
    >
      {/* Stats Grid -- 2-col mobile, 4-col desktop */}
      <Section title="Overview">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Payrolls"
            value={payrolls.length}
            icon={<FileText className="w-4 h-4" />}
          />
          <StatCard
            label="Draft"
            value={payrolls.filter((p) => p.status === "draft").length}
            icon={<Calendar className="w-4 h-4" />}
            accent="text-amber-500"
          />
          <StatCard
            label="Approved"
            value={payrolls.filter((p) => p.status === "approved").length}
            icon={<Landmark className="w-4 h-4" />}
            accent="text-emerald-500"
          />
          <StatCard
            label="Approved Amount"
            value={fmtPeso(totals.approved)}
            icon={<Landmark className="w-4 h-4" />}
            accent="text-accent"
          />
        </div>
      </Section>

      {/* Tab Bar for status filtering */}
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by period name or fund type..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Responsive Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No payroll records found." />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Payroll Period
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Fund Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      FY
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Prepared
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-accent/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {p.period_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{p.date_from}</td>
                      <td className="px-4 py-3 text-muted">{p.date_to}</td>
                      <td className="px-4 py-3 text-muted">{p.fund_type}</td>
                      <td className="px-4 py-3 text-muted">{p.fiscal_year}</td>
                      <td className="px-4 py-3 text-right font-bold text-accent tabular-nums">
                        {fmtPeso(p.total_amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PayrollBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {p.date_prepared
                          ? new Date(p.date_prepared).toLocaleDateString()
                          : "---"}
                      </td>
                    </tr>
                  ))}
                  <EmptyRows count={emptyRows} columns={8} />
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border">
              {pageItems.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-sm leading-tight">
                      {p.period_name}
                    </p>
                    <PayrollBadge status={p.status} />
                  </div>
                  <div className="text-xs text-muted space-y-1">
                    <p>
                      {p.date_from} to {p.date_to}
                    </p>
                    <p>
                      {p.fund_type} &middot; FY {p.fiscal_year}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-accent tabular-nums">
                    {fmtPeso(p.total_amount)}
                  </p>
                  {p.date_prepared && (
                    <p className="text-xs text-muted">
                      Prepared: {new Date(p.date_prepared).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
};

export default LDDAPGenerator;
