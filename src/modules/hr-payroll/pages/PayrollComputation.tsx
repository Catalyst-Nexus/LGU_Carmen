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
} from "../components/ui";
import {
  FileText,
  Download,
  Search,
  DollarSign,
  ReceiptText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { PayrollPeriod } from "@/types/hr.types";
import {
  fetchPayrollPeriods,
  fetchEmployeePaySummaries,
  generatePayroll,
  fetchPayrollPaySlips,
  fetchPaySlipDetailForPDF,
  type PayrollPaySlipRow,
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
  // ── Primary data ──
  const [payrolls, setPayrolls] = useState<PayrollPeriod[]>([]);
  const [employeeCount, setEmployeeCount] = useState(0);

  // ── Filters ──
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  // ── Loading flags ──
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Period selector (for generating new payrolls) ──
  const [periodStart, setPeriodStart] = useState(DEFAULT_START);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_END);

  // ── Expand/collapse: selected payroll's employees ──
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(
    null,
  );
  const [payrollSlips, setPayrollSlips] = useState<PayrollPaySlipRow[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(false);
  const [empSearch, setEmpSearch] = useState("");

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [periods, summaries] = await Promise.all([
        fetchPayrollPeriods(),
        fetchEmployeePaySummaries(periodStart, periodEnd),
      ]);
      setPayrolls(periods);
      setEmployeeCount(summaries.length);
      setSelectedPayrollId(null);
      setPayrollSlips([]);
    } finally {
      setIsLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Generate Payroll handler ──────────────────────────────────────────────
  const handleGeneratePayroll = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const result = await generatePayroll(periodStart, periodEnd);

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
      alert(
        err instanceof Error ? err.message : "Failed to generate payroll.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Toggle expand/collapse a payroll to show employees ────────────────────
  const handleSelectPayroll = async (payrollId: string) => {
    if (selectedPayrollId === payrollId) {
      setSelectedPayrollId(null);
      setPayrollSlips([]);
      setEmpSearch("");
      return;
    }
    setSelectedPayrollId(payrollId);
    setPayrollSlips([]);
    setEmpSearch("");
    setSlipsLoading(true);
    try {
      const slips = await fetchPayrollPaySlips(payrollId);
      setPayrollSlips(slips);
    } catch {
      setPayrollSlips([]);
    } finally {
      setSlipsLoading(false);
    }
  };

  // ── Download payroll register PDF for any existing payroll ────────────────
  const handleDownloadPayrollPDF = async (payroll: PayrollPeriod) => {
    try {
      const slips = await fetchPayrollPaySlips(payroll.id);
      if (slips.length === 0) {
        alert("No pay slips found for this payroll.");
        return;
      }
      downloadPayrollRegisterPDF({
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart: payroll.date_from,
        periodEnd: payroll.date_to,
        employees: slips.map((s) => ({
          employeeName: s.employeeName,
          employeeNo: s.employeeNo,
          positionTitle: s.positionTitle,
          officeName: s.officeName,
          rate: s.rate,
          daysWorked: s.daysWorked,
          basicPay: s.basicPay,
          overtimeHours: 0,
          overtimePay: 0,
          grossAmount: s.grossAmount,
          deductions: s.deductions,
          totalDeductions: s.totalDeductions,
          netPay: s.netAmount,
        })),
        preparedBy: payroll.prepared_by ?? "System Administrator",
      });
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to download payroll PDF.",
      );
    }
  };

  // ── Download individual payslip PDF ───────────────────────────────────────
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
      alert(
        err instanceof Error ? err.message : "Failed to generate payslip.",
      );
    }
  };

  // ── Filter payrolls by tab + search ───────────────────────────────────────
  const filtered = useMemo(() => {
    return payrolls.filter((p) => {
      const matchSearch = p.period_name
        .toLowerCase()
        .includes(search.toLowerCase());
      if (activeTab === "all") return matchSearch;
      return matchSearch && p.status === activeTab;
    });
  }, [payrolls, search, activeTab]);

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } =
    usePagination(filtered);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const countByStatus = (s: string) =>
      payrolls.filter((p) => p.status === s).length;
    const totalAmount = payrolls.reduce((sum, p) => sum + p.total_amount, 0);
    return {
      total: payrolls.length,
      draft: countByStatus("draft"),
      computed: countByStatus("computed"),
      approved: countByStatus("approved"),
      released: countByStatus("released"),
      totalAmount,
    };
  }, [payrolls]);

  // ── Tab definitions ───────────────────────────────────────────────────────
  const tabDefs = useMemo(
    () => [
      { id: "all", label: "All", count: stats.total },
      { id: "draft", label: "Draft", count: stats.draft },
      { id: "computed", label: "Computed", count: stats.computed },
      { id: "approved", label: "Approved", count: stats.approved },
      { id: "released", label: "Released", count: stats.released },
    ],
    [stats],
  );

  // ── Filter employees within expanded payroll ─────────────────────────────
  const filteredSlips = useMemo(() => {
    if (!empSearch) return payrollSlips;
    return payrollSlips.filter((s) =>
      s.employeeName.toLowerCase().includes(empSearch.toLowerCase()),
    );
  }, [payrollSlips, empSearch]);

  // ── Selected payroll reference ────────────────────────────────────────────
  const selectedPayroll = payrolls.find((p) => p.id === selectedPayrollId);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <PageShell
      title="Payroll Computation"
      subtitle="Generate payrolls from DTR records, download payroll sheets and individual payslips"
      onRefresh={loadData}
      isLoading={isLoading}
      actions={
        <AccentButton
          onClick={handleGeneratePayroll}
          disabled={isGenerating || employeeCount === 0}
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
            <label className="text-xs font-medium text-muted">
              Period End
            </label>
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
            {employeeCount} employee(s) with DTR records in this period
          </span>
        </div>
      </Card>

      {/* ── Stats ── */}
      <Section title="Overview">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Payrolls"
            value={stats.total}
            icon={<ReceiptText className="w-5 h-5" />}
          />
          <StatCard
            label="Draft"
            value={stats.draft}
            icon={<FileText className="w-5 h-5" />}
            accent="text-amber-500"
          />
          <StatCard
            label="Computed"
            value={stats.computed}
            icon={<FileText className="w-5 h-5" />}
            accent="text-violet-500"
          />
          <StatCard
            label="Approved"
            value={stats.approved}
            icon={<FileText className="w-5 h-5" />}
            accent="text-blue-500"
          />
          <StatCard
            label="Total Amount"
            value={fmtPeso(stats.totalAmount)}
            icon={<DollarSign className="w-5 h-5" />}
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
          setSelectedPayrollId(null);
          setPayrollSlips([]);
        }}
        className="overflow-x-auto"
      />

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedPayrollId(null);
            setPayrollSlips([]);
          }}
          placeholder="Search by period name..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
        />
      </div>

      {/* ── Payroll Table ── */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState message="No payroll records found. Select a period and click Generate Payroll." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                      Period Name
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                      To
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                      FY
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-center">
                      Status
                    </th>
                    <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((p) => (
                    <tr
                      key={p.id}
                      className={`hover:bg-accent/5 transition-colors ${selectedPayrollId === p.id ? "bg-accent/5" : ""}`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {p.period_name}
                      </td>
                      <td className="px-4 py-3 text-muted">{p.date_from}</td>
                      <td className="px-4 py-3 text-muted">{p.date_to}</td>
                      <td className="px-4 py-3 text-muted">{p.fiscal_year}</td>
                      <td className="px-4 py-3 text-muted">{p.fund_type}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtPeso(p.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <PayrollBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleDownloadPayrollPDF(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title="Download Payroll Register PDF"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                          <button
                            onClick={() => handleSelectPayroll(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title={
                              selectedPayrollId === p.id
                                ? "Collapse payslips"
                                : "View payslips"
                            }
                          >
                            {selectedPayrollId === p.id ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                            Payslips
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  <EmptyRows count={emptyRows} columns={8} />
                </tbody>
              </table>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={setPage}
              />
            </div>

            {/* Mobile card list */}
            <div className="md:hidden divide-y divide-border">
              {pageItems.map((p) => (
                <div key={p.id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-foreground text-sm leading-tight">
                      {p.period_name}
                    </p>
                    <PayrollBadge status={p.status} />
                  </div>
                  <div className="text-xs text-muted space-y-0.5">
                    <p>
                      {p.date_from} to {p.date_to}
                    </p>
                    <p>
                      {p.fund_type} &middot; FY {p.fiscal_year}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {fmtPeso(p.total_amount)}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDownloadPayrollPDF(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Download className="w-3 h-3" /> PDF
                    </button>
                    <button
                      onClick={() => handleSelectPayroll(p.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                    >
                      {selectedPayrollId === p.id ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                      Payslips
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* ── Employee Sub-Table (expanded payroll) ── */}
      {selectedPayrollId && (
        <Card>
          <div className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              Employees — {selectedPayroll?.period_name ?? ""} (
              {filteredSlips.length})
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Search employee..."
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
              />
            </div>
          </div>

          {slipsLoading ? (
            <div className="flex items-center justify-center py-10 text-muted text-sm">
              Loading employees...
            </div>
          ) : filteredSlips.length === 0 ? (
            <EmptyState message="No employees found for this payroll." />
          ) : (
            <>
              {/* Desktop employee table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Rate
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Days
                      </th>
                      <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider text-right">
                        Gross
                      </th>
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
                    {filteredSlips.map((s) => (
                      <tr
                        key={s.id}
                        className="hover:bg-accent/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">
                            {s.employeeName}
                          </div>
                          <div className="text-xs text-muted">
                            {s.positionTitle} &middot; {s.officeName}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {fmtPeso(s.rate)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {s.daysWorked}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {fmtPeso(s.grossAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-red-600 dark:text-red-400">
                          {fmtPeso(s.totalDeductions)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {fmtPeso(s.netAmount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <PayrollBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDownloadPayslip(s.paySlipId)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            title="Download individual payslip PDF"
                          >
                            <Download className="w-3 h-3" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile employee cards */}
              <div className="md:hidden divide-y divide-border">
                {filteredSlips.map((s) => (
                  <div key={s.id} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {s.employeeName}
                        </p>
                        <p className="text-xs text-muted">
                          {s.positionTitle} &middot; {s.officeName}
                        </p>
                      </div>
                      <PayrollBadge status={s.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div>
                        <span className="text-muted">Rate:</span>{" "}
                        <span className="font-medium tabular-nums">
                          {fmtPeso(s.rate)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Days:</span>{" "}
                        <span className="font-medium tabular-nums">
                          {s.daysWorked}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Gross:</span>{" "}
                        <span className="font-medium tabular-nums">
                          {fmtPeso(s.grossAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted">Deductions:</span>{" "}
                        <span className="font-medium tabular-nums text-red-600 dark:text-red-400">
                          {fmtPeso(s.totalDeductions)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted">Net Pay</span>
                      <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {fmtPeso(s.netAmount)}
                      </span>
                    </div>
                    <div className="pt-1">
                      <button
                        onClick={() => handleDownloadPayslip(s.paySlipId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                      >
                        <Download className="w-3 h-3" /> Download Payslip
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
