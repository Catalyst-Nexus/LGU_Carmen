import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageShell,
  Section,
  StatCard,
  AccentButton,
  TabBar,
  PayrollBadge,
  Card,
  fmtPeso,
  EmptyState,
  usePagination,
  Pagination,
  EmptyRows,
} from '../components/ui';
import {
  FileText,
  Download,
  Search,
  Users,
  Clock,
  DollarSign,
  ReceiptText,
  Landmark,
  Banknote,
} from "lucide-react";
import type { PayrollEntry, DeductionType } from "@/types/hr.types";
import {
  fetchEmployeePaySummaries,
  fetchPaySlips,
  fetchDeductionTypes,
  generatePayroll,
  fetchPaySlipDetailForPDF,
  type EmployeePaySummary,
} from "../services/hrService";
import {
  downloadPayrollRegisterPDF,
  downloadPaySlipPDF,
  type PaySlipPDFData,
} from "@/lib/generatePaySlipPDF";

// ── Constants ────────────────────────────────────────────────────────────────

const LGU_NAME = "Municipality of Carmen";
const LGU_ADDRESS = "Carmen, Agusan del Norte";

// ── Period helpers ────────────────────────────────────────────────────────────

const isoDate = (d: Date) => d.toISOString().split("T")[0];

const today = new Date();
const DEFAULT_START = isoDate(
  new Date(today.getFullYear(), today.getMonth(), 1),
);
const DEFAULT_END = isoDate(today);

// ── Component ─────────────────────────────────────────────────────────────────

const PayrollComputation = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [isLoading, setIsLoading] = useState(false);
  const [periodStart, setPeriodStart] = useState(DEFAULT_START);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_END);
  const [search, setSearch] = useState("");

  const [summaries, setSummaries] = useState<EmployeePaySummary[]>([]);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasPayroll, setHasPayroll] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summary, slips, types] = await Promise.all([
        fetchEmployeePaySummaries(periodStart, periodEnd),
        fetchPaySlips(),
        fetchDeductionTypes(),
      ]);
      setSummaries(summary);
      setEntries(slips);
      setDeductionTypes(types);

      // Check if any pay slips exist for the selected period with status >= computed
      const periodSlips = slips.filter(
        (s) =>
          s.period_start === periodStart &&
          s.period_end === periodEnd &&
          s.status !== "draft",
      );
      setHasPayroll(periodSlips.length > 0);
    } finally {
      setIsLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Generate Payroll handler ────────────────────────────────────────────
  const handleGeneratePayroll = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await generatePayroll(periodStart, periodEnd);

      // Download the payroll register PDF
      downloadPayrollRegisterPDF({
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart,
        periodEnd,
        employees: result.employees,
        preparedBy: "System Administrator",
      });

      alert(
        `Payroll generated: ${result.employees.length} employee(s). PDF downloaded.`,
      );
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate payroll.");
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Individual payslip PDF handler ──────────────────────────────────────
  const handleDownloadPayslip = async (paySlipId: string) => {
    try {
      const detail = await fetchPaySlipDetailForPDF(paySlipId);
      if (!detail) {
        alert("Could not fetch pay slip details.");
        return;
      }

      const pdfData: PaySlipPDFData = {
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart: detail.periodStart,
        periodEnd: detail.periodEnd,
        employeeName: detail.employeeName,
        employeeNo: detail.employeeNo,
        positionTitle: detail.positionTitle,
        officeName: detail.officeName,
        rate: detail.rate,
        daysWorked: detail.daysWorked,
        basicPay: detail.basicPay,
        overtimeHours: 0,
        overtimePay: 0,
        grossAmount: detail.grossAmount,
        deductions: detail.deductions,
        totalDeductions: detail.totalDeductions,
        netPay: detail.netPay,
        preparedBy: "System Administrator",
      };

      downloadPaySlipPDF(pdfData);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to generate payslip.");
    }
  };

  // ── Aggregate stats ─────────────────────────────────────────────────────
  const totalHours = summaries.reduce((s, e) => s + e.total_hours, 0);
  const totalGross = summaries.reduce((s, e) => s + e.gross_pay, 0);

  const totals = useMemo(
    () => ({
      gross: entries.reduce((s, e) => s + e.gross_amount, 0),
      deductions: entries.reduce((s, e) => s + e.total_deductions, 0),
      net: entries.reduce((s, e) => s + e.net_amount, 0),
    }),
    [entries],
  );

  // ── Deduction columns ───────────────────────────────────────────────────
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter((dt) => dt.is_mandatory),
    [deductionTypes],
  );

  const getDeductionAmount = (entry: PayrollEntry, code: string): number => {
    const found = entry.deductions.find((d) => d.code === code);
    return found ? found.amount : 0;
  };

  // ── Filtered views ──────────────────────────────────────────────────────
  const filteredSummary = summaries.filter((s) =>
    s.employee_name.toLowerCase().includes(search.toLowerCase()),
  );
  const { page: sumPage, setPage: setSumPage, totalPages: sumTotalPages, pageItems: sumPageItems, emptyRows: sumEmptyRows, totalItems: sumTotalItems } = usePagination(filteredSummary);

  const filtered = entries.filter((e) => {
    const matchSearch = e.employee_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    return matchSearch && e.status === activeTab;
  });
  const { page, setPage, totalPages, pageItems, emptyRows: entryEmptyRows, totalItems } = usePagination(filtered);

  const PAY_SLIP_TABS = ["all", "draft", "computed", "approved", "released"];

  // ── Tab definitions with counts ─────────────────────────────────────────
  const tabDefs = useMemo(() => {
    const countByStatus = (status: string) =>
      entries.filter((e) => e.status === status).length;
    return [
      { id: "summary", label: "Summary", count: summaries.length },
      { id: "all", label: "All", count: entries.length },
      { id: "draft", label: "Draft", count: countByStatus("draft") },
      { id: "computed", label: "Computed", count: countByStatus("computed") },
      { id: "approved", label: "Approved", count: countByStatus("approved") },
      { id: "released", label: "Released", count: countByStatus("released") },
    ];
  }, [summaries.length, entries]);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Payroll Computation"
      subtitle="Compute payroll from DTR attendance records and generate pay slips"
      onRefresh={loadData}
      isLoading={isLoading}
      actions={
        <AccentButton
          onClick={handleGeneratePayroll}
          disabled={isGenerating || summaries.length === 0}
        >
          <FileText className="w-4 h-4" />
          {isGenerating ? "Generating..." : "Generate Payroll"}
        </AccentButton>
      }
    >
      {/* ── Period Selector ── */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">
              Period Start
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setSearch("");
              }}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted">Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setSearch("");
              }}
              className="border border-border rounded-lg px-3 py-1.5 text-sm bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
            />
          </div>
          <span className="text-xs text-muted pb-1.5">
            Pay is calculated by the database trigger on every clock-out.
          </span>
        </div>
      </Card>

      {/* ── Stats Grid: 2-col mobile, 3-col desktop ── */}
      <Section title="Overview">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            label="Employees w/ Records"
            value={summaries.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Total Hours Worked"
            value={totalHours.toFixed(2)}
            icon={<Clock className="w-5 h-5" />}
          />
          <StatCard
            label="Gross Pay (DTR)"
            value={fmtPeso(totalGross)}
            icon={<DollarSign className="w-5 h-5" />}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Total Entries"
            value={entries.length}
            icon={<ReceiptText className="w-5 h-5" />}
          />
          <StatCard
            label="Total Deductions"
            value={fmtPeso(totals.deductions)}
            icon={<Landmark className="w-5 h-5" />}
            accent="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Net Pay"
            value={fmtPeso(totals.net)}
            icon={<Banknote className="w-5 h-5" />}
            accent="text-emerald-600 dark:text-emerald-400"
          />
        </div>
      </Section>

      {/* ── Tab Bar ── */}
      <TabBar
        tabs={tabDefs}
        active={activeTab}
        onChange={(id) => {
          setActiveTab(id);
          setSearch("");
        }}
        className="overflow-x-auto"
      />

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by employee name..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* ── Payroll Summary Tab ── */}
      {activeTab === "summary" && (
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Payroll Summary — {filteredSummary.length} employee(s)
            </h3>
          </div>

          {filteredSummary.length === 0 ? (
            <EmptyState message="No payroll data for the selected period." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Days Worked
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Total Hours
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Gross Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sumPageItems.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {r.employee_name}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {r.days_worked}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {r.total_hours.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {fmtPeso(r.gross_pay)}
                        </td>
                      </tr>
                    ))}
                    <EmptyRows count={sumEmptyRows} columns={4} />
                  </tbody>
                </table>
                <Pagination page={sumPage} totalPages={sumTotalPages} totalItems={sumTotalItems} onPageChange={setSumPage} />
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {filteredSummary.map((r) => (
                  <div key={r.id} className="px-4 py-3 space-y-1.5">
                    <p className="font-medium text-foreground">
                      {r.employee_name}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Days Worked</span>
                      <span className="font-medium tabular-nums">
                        {r.days_worked}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Total Hours</span>
                      <span className="font-medium tabular-nums">
                        {r.total_hours.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Gross Pay</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtPeso(r.gross_pay)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── Pay Slip Entries (All / Draft / Computed / Approved / Released) ── */}
      {PAY_SLIP_TABS.includes(activeTab) && (
        <Card>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Payroll Entries ({filtered.length})
            </h3>
          </div>

          {filtered.length === 0 ? (
            <EmptyState message="No payroll entries found." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                        Period
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Gross
                      </th>
                      {mandatoryTypes.map((dt) => (
                        <th
                          key={dt.code}
                          className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right"
                        >
                          {dt.code.replace(/_/g, " ")}
                        </th>
                      ))}
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Deductions
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Net Pay
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-center">
                        Status
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-center">
                        Payslip
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {pageItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-4 py-3 text-foreground">
                          {item.employee_name}
                        </td>
                        <td className="px-4 py-3 text-muted text-xs whitespace-nowrap">
                          {item.period_start} — {item.period_end}
                        </td>
                        <td className="px-4 py-3 capitalize text-foreground">
                          {item.period_type.replace("_", " ")}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {fmtPeso(item.gross_amount)}
                        </td>
                        {mandatoryTypes.map((dt) => {
                          const amt = getDeductionAmount(item, dt.code);
                          return (
                            <td
                              key={dt.code}
                              className="px-4 py-3 text-right tabular-nums text-muted"
                            >
                              {amt > 0 ? fmtPeso(amt) : "\u2014"}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-red-600 dark:text-red-400">
                          {fmtPeso(item.total_deductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {fmtPeso(item.net_amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PayrollBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDownloadPayslip(item.id)}
                            disabled={!hasPayroll || item.status === "draft"}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg
                              bg-accent/10 text-accent hover:bg-accent/20
                              disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title={
                              !hasPayroll
                                ? "Generate a payroll first"
                                : item.status === "draft"
                                  ? "Pay slip must be computed first"
                                  : "Download individual payslip PDF"
                            }
                          >
                            <Download className="w-3 h-3" />
                            PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                    <EmptyRows count={entryEmptyRows} columns={8 + mandatoryTypes.length} />
                  </tbody>
                </table>
                <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {pageItems.map((item) => (
                  <div key={item.id} className="px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {item.employee_name}
                      </p>
                      <PayrollBadge status={item.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {item.period_start} — {item.period_end}
                      <span className="ml-2 capitalize">
                        {item.period_type.replace("_", " ")}
                      </span>
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Gross</span>
                      <span className="font-medium tabular-nums">
                        {fmtPeso(item.gross_amount)}
                      </span>
                    </div>
                    {mandatoryTypes.map((dt) => {
                      const amt = getDeductionAmount(item, dt.code);
                      if (amt <= 0) return null;
                      return (
                        <div
                          key={dt.code}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-muted uppercase text-xs">
                            {dt.code.replace(/_/g, " ")}
                          </span>
                          <span className="tabular-nums text-muted">
                            {fmtPeso(amt)}
                          </span>
                        </div>
                      );
                    })}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Deductions</span>
                      <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                        {fmtPeso(item.total_deductions)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Net Pay</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtPeso(item.net_amount)}
                      </span>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => handleDownloadPayslip(item.id)}
                        disabled={!hasPayroll || item.status === "draft"}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg
                          bg-accent/10 text-accent hover:bg-accent/20
                          disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={
                          !hasPayroll
                            ? "Generate a payroll first"
                            : item.status === "draft"
                              ? "Pay slip must be computed first"
                              : "Download individual payslip PDF"
                        }
                      >
                        <Download className="w-3 h-3" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </PageShell>
  );
};

export default PayrollComputation;
