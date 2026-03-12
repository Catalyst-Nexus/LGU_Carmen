import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Calculator, RefreshCw, FileText } from 'lucide-react'
import {
  fetchDailyPayRecords,
  fetchEmployeePaySummaries,
  type DailyPayRecord,
  type EmployeePaySummary,
} from '@/services/hrService'

// ── Period helpers ────────────────────────────────────────────────────────────

const isoDate = (d: Date) => d.toISOString().split('T')[0]

const today = new Date()
const DEFAULT_START = isoDate(new Date(today.getFullYear(), today.getMonth(), 1))
const DEFAULT_END   = isoDate(today)

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtTime = (t: string | null) => (t ? t.substring(0, 5) : '—')
const fmtPeso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── Component ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
} from "@/components/ui";
import { Calculator, RefreshCw } from "lucide-react";
import type { PayrollEntry, DeductionType } from "@/types/hr.types";
import { fetchPaySlips, fetchDeductionTypes } from "@/services/hrService";

const PayrollComputation = () => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab]     = useState('attendance')
  const [isLoading, setIsLoading]     = useState(false)
  const [periodStart, setPeriodStart] = useState(DEFAULT_START)
  const [periodEnd, setPeriodEnd]     = useState(DEFAULT_END)
  const [search, setSearch]           = useState('')

  const [dailyRecords, setDailyRecords] = useState<DailyPayRecord[]>([])
  const [summaries, setSummaries]       = useState<EmployeePaySummary[]>([])

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slips, types] = await Promise.all([
        fetchPaySlips(),
        fetchDeductionTypes(),
      ]);
      setEntries(slips);
      setDeductionTypes(types);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = entries.filter((e) => {
    const matchSearch = e.employee_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    return matchSearch && e.status === activeTab;
  });

  const totals = useMemo(
    () => ({
      gross: entries.reduce((s, e) => s + e.gross_amount, 0),
      deductions: entries.reduce((s, e) => s + e.total_deductions, 0),
      net: entries.reduce((s, e) => s + e.net_amount, 0),
    }),
    [entries],
  );

  // Build mandatory deduction columns dynamically from hr.deduction_type
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter((dt) => dt.is_mandatory),
    [deductionTypes],
  );

  const getDeductionAmount = (entry: PayrollEntry, code: string): number => {
    const found = entry.deductions.find((d) => d.code === code);
    return found ? found.amount : 0;
  };
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const [daily, summary] = await Promise.all([
      fetchDailyPayRecords(periodStart, periodEnd),
      fetchEmployeePaySummaries(periodStart, periodEnd),
    ])
    setDailyRecords(daily)
    setSummaries(summary)
    setIsLoading(false)
  }, [periodStart, periodEnd])

  useEffect(() => { loadData() }, [loadData])

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const completeSessions = dailyRecords.filter(r => r.has_out).length
  const totalHours       = summaries.reduce((s, e) => s + e.total_hours, 0)
  const totalGross       = summaries.reduce((s, e) => s + e.gross_pay, 0)

  // ── Filtered views ────────────────────────────────────────────────────────
  const filteredDaily = dailyRecords.filter(r =>
    r.employee_name.toLowerCase().includes(search.toLowerCase()),
  )
  const filteredSummary = summaries.filter(s =>
    s.employee_name.toLowerCase().includes(search.toLowerCase()),
  )

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Computation"
        subtitle="Daily pay computed automatically from DTR attendance records"
        icon={<Calculator className="w-6 h-6" />}
      />

      {/* ── Period selector ── */}
      <div className="flex flex-wrap gap-4 items-end p-4 bg-card rounded-lg border">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Period Start</label>
          <input
            type="date"
            value={periodStart}
            onChange={e => { setPeriodStart(e.target.value); setSearch('') }}
            className="border rounded px-3 py-1.5 text-sm bg-background"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Period End</label>
          <input
            type="date"
            value={periodEnd}
            onChange={e => { setPeriodEnd(e.target.value); setSearch('') }}
            className="border rounded px-3 py-1.5 text-sm bg-background"
          />
        </div>
        <span className="text-xs text-muted-foreground pb-1">
          Pay is calculated by the database trigger on every clock-out.
        </span>
      </div>

      {/* ── Stats ── */}
      <StatsRow>
        <StatCard label="Total Entries" value={entries.length} />
        <StatCard
          label="Gross Pay"
          value={`₱${totals.gross.toLocaleString()}`}
          color="primary"
        />
        <StatCard
          label="Total Deductions"
          value={`₱${totals.deductions.toLocaleString()}`}
          color="danger"
        />
        <StatCard
          label="Net Pay"
          value={`₱${totals.net.toLocaleString()}`}
          color="success"
        />
        <StatCard label="Employees w/ Records" value={summaries.length} />
        <StatCard
          label="Complete Sessions"
          value={completeSessions}
          color="primary"
        />
        <StatCard
          label="Total Hours Worked"
          value={totalHours.toFixed(2)}
          color="primary"
        />
        <StatCard
          label="Gross Pay"
          value={fmtPeso(totalGross)}
          color="success"
        />
      </StatsRow>

      {/* ── Tabs ── */}
      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "draft", label: "Draft" },
          { id: "computed", label: "Computed" },
          { id: "approved", label: "Approved" },
          { id: "released", label: "Released" },
          { id: 'attendance', label: 'Attendance Detail' },
          { id: 'summary',    label: 'Payroll Summary'    },
        ]}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setSearch('') }}
      />

      {/* ── Actions ── */}
      <ActionsBar>
        <PrimaryButton onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
        <PrimaryButton onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <FileText className="w-4 h-4" />
          Generate Pay Slips
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollEntry>
        data={filtered}
        columns={[
          { key: "employee_name", header: "Employee" },
          { key: "period_start", header: "Period Start" },
          { key: "period_end", header: "Period End" },
          {
            key: "period_type",
            header: "Type",
            render: (item) => (
              <span className="capitalize">
                {item.period_type.replace("_", " ")}
              </span>
            ),
          },
          {
            key: "gross_amount",
            header: "Gross",
            render: (item) => (
              <span className="font-medium">
                ₱{item.gross_amount.toLocaleString()}
              </span>
            ),
          },
          // Dynamic mandatory deduction columns (GSIS, PhilHealth, Pag-IBIG, BIR, etc.)
          ...mandatoryTypes.map((dt) => ({
            key: `ded_${dt.code}` as keyof PayrollEntry,
            header: dt.code.replace(/_/g, " "),
            render: (item: PayrollEntry) => {
              const amt = getDeductionAmount(item, dt.code);
              return <span>{amt > 0 ? `₱${amt.toLocaleString()}` : "—"}</span>;
            },
          })),
          {
            key: "total_deductions",
            header: "Deductions",
            render: (item) => (
              <span className="text-red-500">
                ₱{item.total_deductions.toLocaleString()}
              </span>
            ),
          },
          {
            key: "net_amount",
            header: "Net Pay",
            render: (item) => (
              <span className="font-bold text-green-600">
                ₱{item.net_amount.toLocaleString()}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "released"
                    ? "bg-success/10 text-success"
                    : item.status === "approved"
                      ? "bg-blue-500/10 text-blue-500"
                      : item.status === "computed"
                        ? "bg-purple-500/10 text-purple-500"
                        : "bg-warning/10 text-warning"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
        ]}
        title={`Payroll Entries (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No payroll entries found."
      />
      {/* ── Attendance Detail ── */}
      {activeTab === 'attendance' && (
        <DataTable<DailyPayRecord>
          data={filteredDaily}
          columns={[
            { key: 'date',          header: 'Date' },
            { key: 'employee_name', header: 'Employee' },
            {
              key: 'time_slot_desc',
              header: 'Shift',
              render: r => (
                <span className="capitalize">
                  {r.time_slot_desc?.replace(/_/g, ' ') || '—'}
                </span>
              ),
            },
            {
              key: 'time_in',
              header: 'Time In',
              render: r => (
                <span className="font-mono text-sm">{fmtTime(r.time_in)}</span>
              ),
            },
            {
              key: 'time_out',
              header: 'Time Out',
              render: r => (
                <span className={`font-mono text-sm ${!r.has_out ? 'text-warning' : ''}`}>
                  {fmtTime(r.time_out)}
                </span>
              ),
            },
            {
              key: 'total_hours',
              header: 'Hours Worked',
              render: r => (
                <span className="font-medium">
                  {r.has_out ? r.total_hours.toFixed(2) : '—'}
                </span>
              ),
            },
            {
              key: 'pay_amount',
              header: 'Daily Pay',
              render: r => (
                <span className={`font-semibold ${r.pay_amount > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {r.has_out ? fmtPeso(r.pay_amount) : '—'}
                </span>
              ),
            },
            {
              key: 'has_out',
              header: 'Status',
              render: r => (
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                  r.has_out
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}>
                  {r.has_out ? 'Complete' : 'No Time-Out'}
                </span>
              ),
            },
          ]}
          title={`Attendance Records (${filteredDaily.length})`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by employee name…"
          emptyMessage="No attendance records for the selected period."
        />
      )}

      {/* ── Payroll Summary ── */}
      {activeTab === 'summary' && (
        <DataTable<EmployeePaySummary>
          data={filteredSummary}
          columns={[
            { key: 'employee_name', header: 'Employee' },
            {
              key: 'days_worked',
              header: 'Days Worked',
              render: r => <span className="font-medium">{r.days_worked}</span>,
            },
            {
              key: 'total_hours',
              header: 'Total Hours',
              render: r => (
                <span className="font-medium">{r.total_hours.toFixed(2)}</span>
              ),
            },
            {
              key: 'gross_pay',
              header: 'Gross Pay',
              render: r => (
                <span className="font-bold text-green-600">
                  {fmtPeso(r.gross_pay)}
                </span>
              ),
            },
          ]}
          title={`Payroll Summary — ${filteredSummary.length} employee(s)`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by employee name…"
          emptyMessage="No payroll data for the selected period."
        />
      )}
    </div>
  );
};

export default PayrollComputation;
