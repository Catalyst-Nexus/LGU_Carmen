import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Calculator, RefreshCw, FileText, Download } from 'lucide-react'
import type { PayrollEntry, DeductionType } from '@/types/hr.types'
import {
  fetchEmployeePaySummaries,
  fetchPaySlips,
  fetchDeductionTypes,
  generatePayroll,
  fetchPaySlipDetailForPDF,
  type EmployeePaySummary,
} from '@/services/hrService'
import {
  downloadPayrollRegisterPDF,
  downloadPaySlipPDF,
  type PaySlipPDFData,
} from '@/lib/generatePaySlipPDF'

// ── Constants ────────────────────────────────────────────────────────────────

const LGU_NAME = 'Municipality of Carmen'
const LGU_ADDRESS = 'Carmen, Agusan del Norte'

// ── Period helpers ────────────────────────────────────────────────────────────

const isoDate = (d: Date) => d.toISOString().split('T')[0]

const today = new Date()
const DEFAULT_START = isoDate(new Date(today.getFullYear(), today.getMonth(), 1))
const DEFAULT_END   = isoDate(today)

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtPeso = (n: number) =>
  `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ── Component ─────────────────────────────────────────────────────────────────

const PayrollComputation = () => {
  const [activeTab, setActiveTab]           = useState('summary')
  const [isLoading, setIsLoading]           = useState(false)
  const [periodStart, setPeriodStart]       = useState(DEFAULT_START)
  const [periodEnd, setPeriodEnd]           = useState(DEFAULT_END)
  const [search, setSearch]                 = useState('')

  const [summaries, setSummaries]           = useState<EmployeePaySummary[]>([])
  const [entries, setEntries]               = useState<PayrollEntry[]>([])
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([])
  const [isGenerating, setIsGenerating]     = useState(false)
  const [hasPayroll, setHasPayroll]         = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [summary, slips, types] = await Promise.all([
        fetchEmployeePaySummaries(periodStart, periodEnd),
        fetchPaySlips(),
        fetchDeductionTypes(),
      ])
      setSummaries(summary)
      setEntries(slips)
      setDeductionTypes(types)

      // Check if any pay slips exist for the selected period with status >= computed
      const periodSlips = slips.filter(
        s => s.period_start === periodStart && s.period_end === periodEnd && s.status !== 'draft',
      )
      setHasPayroll(periodSlips.length > 0)
    } finally {
      setIsLoading(false)
    }
  }, [periodStart, periodEnd])

  useEffect(() => { loadData() }, [loadData])

  // ── Generate Payroll handler ────────────────────────────────────────────
  const handleGeneratePayroll = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const result = await generatePayroll(periodStart, periodEnd)

      // Download the payroll register PDF
      downloadPayrollRegisterPDF({
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart,
        periodEnd,
        employees: result.employees,
        preparedBy: 'System Administrator',
      })

      alert(`Payroll generated: ${result.employees.length} employee(s). PDF downloaded.`)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate payroll.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Individual payslip PDF handler ──────────────────────────────────────
  const handleDownloadPayslip = async (paySlipId: string) => {
    try {
      const detail = await fetchPaySlipDetailForPDF(paySlipId)
      if (!detail) {
        alert('Could not fetch pay slip details.')
        return
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
        preparedBy: 'System Administrator',
      }

      downloadPaySlipPDF(pdfData)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate payslip.')
    }
  }

  // ── Aggregate stats ─────────────────────────────────────────────────────
  const totalHours = summaries.reduce((s, e) => s + e.total_hours, 0)
  const totalGross = summaries.reduce((s, e) => s + e.gross_pay, 0)

  const totals = useMemo(() => ({
    gross:      entries.reduce((s, e) => s + e.gross_amount, 0),
    deductions: entries.reduce((s, e) => s + e.total_deductions, 0),
    net:        entries.reduce((s, e) => s + e.net_amount, 0),
  }), [entries])

  // ── Deduction columns ───────────────────────────────────────────────────
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter(dt => dt.is_mandatory),
    [deductionTypes],
  )

  const getDeductionAmount = (entry: PayrollEntry, code: string): number => {
    const found = entry.deductions.find(d => d.code === code)
    return found ? found.amount : 0
  }

  // ── Filtered views ──────────────────────────────────────────────────────
  const filteredSummary = summaries.filter(s =>
    s.employee_name.toLowerCase().includes(search.toLowerCase()),
  )
  const filtered = entries.filter(e => {
    const matchSearch = e.employee_name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && e.status === activeTab
  })

  const PAY_SLIP_TABS = ['all', 'draft', 'computed', 'approved', 'released']

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Computation"
        subtitle="Compute payroll from DTR attendance records and generate pay slips"
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
        <StatCard label="Employees w/ Records" value={summaries.length} />
        <StatCard label="Total Hours Worked"   value={totalHours.toFixed(2)}       color="primary" />
        <StatCard label="Gross Pay (DTR)"      value={fmtPeso(totalGross)}         color="success" />
        <StatCard label="Total Entries"        value={entries.length} />
        <StatCard label="Total Deductions"     value={fmtPeso(totals.deductions)}  color="danger" />
        <StatCard label="Net Pay"              value={fmtPeso(totals.net)}         color="success" />
      </StatsRow>

      {/* ── Tabs ── */}
      <Tabs
        tabs={[
          { id: 'summary',    label: 'Payroll Summary'   },
          { id: 'all',        label: 'All'               },
          { id: 'draft',      label: 'Draft'             },
          { id: 'computed',   label: 'Computed'          },
          { id: 'approved',   label: 'Approved'          },
          { id: 'released',   label: 'Released'          },
        ]}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setSearch('') }}
      />

      {/* ── Actions ── */}
      <ActionsBar>
        <PrimaryButton onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={handleGeneratePayroll} disabled={isGenerating || summaries.length === 0}>
          <FileText className="w-4 h-4" />
          {isGenerating ? 'Generating…' : 'Generate Payroll'}
        </PrimaryButton>
      </ActionsBar>

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

      {/* ── Pay Slip entries (All / Draft / Computed / Approved / Released) ── */}
      {PAY_SLIP_TABS.includes(activeTab) && (
        <DataTable<PayrollEntry>
          data={filtered}
          columns={[
            { key: 'employee_name', header: 'Employee' },
            { key: 'period_start',  header: 'Period Start' },
            { key: 'period_end',    header: 'Period End' },
            {
              key: 'period_type',
              header: 'Type',
              render: item => (
                <span className="capitalize">
                  {item.period_type.replace('_', ' ')}
                </span>
              ),
            },
            {
              key: 'gross_amount',
              header: 'Gross',
              render: item => (
                <span className="font-medium">
                  ₱{item.gross_amount.toLocaleString()}
                </span>
              ),
            },
            ...mandatoryTypes.map(dt => ({
              key: `ded_${dt.code}` as keyof PayrollEntry,
              header: dt.code.replace(/_/g, ' '),
              render: (item: PayrollEntry) => {
                const amt = getDeductionAmount(item, dt.code)
                return <span>{amt > 0 ? `₱${amt.toLocaleString()}` : '—'}</span>
              },
            })),
            {
              key: 'total_deductions',
              header: 'Deductions',
              render: item => (
                <span className="text-red-500">
                  ₱{item.total_deductions.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'net_amount',
              header: 'Net Pay',
              render: item => (
                <span className="font-bold text-green-600">
                  ₱{item.net_amount.toLocaleString()}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: item => (
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === 'released'
                    ? 'bg-success/10 text-success'
                    : item.status === 'approved'
                      ? 'bg-blue-500/10 text-blue-500'
                      : item.status === 'computed'
                        ? 'bg-purple-500/10 text-purple-500'
                        : 'bg-warning/10 text-warning'
                }`}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
              ),
            },
            {
              key: 'id',
              header: 'Payslip',
              render: item => (
                <button
                  onClick={() => handleDownloadPayslip(item.id)}
                  disabled={!hasPayroll || item.status === 'draft'}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                    bg-primary/10 text-primary hover:bg-primary/20
                    disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    !hasPayroll
                      ? 'Generate a payroll first'
                      : item.status === 'draft'
                        ? 'Pay slip must be computed first'
                        : 'Download individual payslip PDF'
                  }
                >
                  <Download className="w-3 h-3" />
                  PDF
                </button>
              ),
            },
          ]}
          title={`Payroll Entries (${filtered.length})`}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by employee name..."
          emptyMessage="No payroll entries found."
        />
      )}
    </div>
  )
}

export default PayrollComputation
