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
import { Send, Download, Search } from "lucide-react";
import type { DeductionType } from "@/types/hr.types";
import {
  fetchDeductionTypes,
  fetchRemittanceSummary,
} from "../services/hrService";

interface RemittanceRow {
  id: string;
  code: string;
  description: string;
  employee_name: string;
  period: string;
  amount: number;
  pay_slip_status: string;
}

const RemittanceReports = () => {
  const [rows, setRows] = useState<RemittanceRow[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rawData, types] = await Promise.all([
        fetchRemittanceSummary(),
        fetchDeductionTypes(),
      ]);
      setDeductionTypes(types);

      // Transform raw join data into flat rows
      const mapped: RemittanceRow[] = (rawData || []).map(
        (r: Record<string, unknown>) => {
          const dt = r.deduction_type as
            | Record<string, string>
            | Record<string, string>[]
            | null;
          const dtObj = Array.isArray(dt) ? dt[0] : dt;
          const ps = r.pay_slip as
            | Record<string, unknown>
            | Record<string, unknown>[]
            | null;
          const psObj = Array.isArray(ps) ? ps[0] : ps;
          const per = psObj?.personnel as
            | Record<string, string>
            | Record<string, string>[]
            | null;
          const perObj = Array.isArray(per) ? per[0] : per;
          const periodStart = (psObj?.period_start ?? "") as string;
          const periodEnd = (psObj?.period_end ?? "") as string;
          return {
            id: r.id as string,
            code: dtObj?.code ?? "---",
            description: dtObj?.description ?? "---",
            employee_name: perObj
              ? `${perObj.last_name}, ${perObj.first_name}`
              : "---",
            period:
              periodStart && periodEnd
                ? `${periodStart} -- ${periodEnd}`
                : "---",
            amount: Number(r.amount) || 0,
            pay_slip_status: (psObj?.status as string) ?? "---",
          };
        },
      );
      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group tabs by mandatory deduction types (GSIS, PhilHealth, etc.)
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter((dt) => dt.is_mandatory),
    [deductionTypes],
  );

  const tabList = useMemo(
    () => [
      { id: "all", label: "All", count: rows.length },
      ...mandatoryTypes.map((dt) => ({
        id: dt.code,
        label: dt.description,
        count: rows.filter((r) => r.code === dt.code).length,
      })),
    ],
    [mandatoryTypes, rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "all") return matchSearch;
      return matchSearch && r.code === activeTab;
    });
  }, [rows, search, activeTab]);

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);

  // Compute totals per mandatory type for stat cards
  const statTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.code] = (map[r.code] || 0) + r.amount;
    }
    return map;
  }, [rows]);

  return (
    <PageShell
      title="Remittance Reports"
      subtitle="Government mandatory remittances -- GSIS, PhilHealth, Pag-IBIG, BIR"
      onRefresh={loadData}
      isLoading={isLoading}
      actions={
        <GhostButton onClick={() => {}} disabled={filtered.length === 0}>
          <Download className="w-3.5 h-3.5" />
          Export
        </GhostButton>
      }
    >
      {/* Stats Grid -- 2-col mobile, 4-col desktop */}
      <Section title="Totals by Agency">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {mandatoryTypes.slice(0, 4).map((dt) => (
            <StatCard
              key={dt.code}
              label={dt.description}
              value={fmtPeso(statTotals[dt.code] || 0)}
              icon={<Send className="w-4 h-4" />}
              accent="text-accent"
            />
          ))}
        </div>
      </Section>

      {/* Tab Bar for deduction-type filtering */}
      <TabBar tabs={tabList} active={activeTab} onChange={setActiveTab} />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by type or employee..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* Responsive Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No remittance records found." />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Slip Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-accent/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {r.code}
                      </td>
                      <td className="px-4 py-3 text-muted">{r.description}</td>
                      <td className="px-4 py-3 text-foreground">
                        {r.employee_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{r.period}</td>
                      <td className="px-4 py-3 text-right font-bold text-accent tabular-nums">
                        {fmtPeso(r.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <PayrollBadge status={r.pay_slip_status} />
                      </td>
                    </tr>
                  ))}
                  <EmptyRows count={emptyRows} columns={6} />
                </tbody>
              </table>
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-border">
              {pageItems.map((r) => (
                <div key={r.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm leading-tight">
                        {r.employee_name}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {r.code} &middot; {r.description}
                      </p>
                    </div>
                    <PayrollBadge status={r.pay_slip_status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{r.period}</p>
                    <p className="text-sm font-bold text-accent tabular-nums">
                      {fmtPeso(r.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
};

export default RemittanceReports;
