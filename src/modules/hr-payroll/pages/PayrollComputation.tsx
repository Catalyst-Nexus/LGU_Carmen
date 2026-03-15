import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { Calculator, RefreshCw, FileText, Download } from 'lucide-react'
import type { PayrollPeriod } from '@/types/hr.types'
import {
  fetchPayrollPeriods,
  fetchEmployeePaySummaries,
  generatePayroll,
  fetchPayrollPaySlips,
  fetchPaySlipDetailForPDF,
  type PayrollPaySlipRow,
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
  const [activeTab, setActiveTab]               = useState('all')
  const [isLoading, setIsLoading]               = useState(false)
  const [periodStart, setPeriodStart]           = useState(DEFAULT_START)
  const [periodEnd, setPeriodEnd]               = useState(DEFAULT_END)
  const [search, setSearch]                     = useState('')
  const [isGenerating, setIsGenerating]         = useState(false)
  const [employeeCount, setEmployeeCount]       = useState(0)

  // Payroll list
  const [payrolls, setPayrolls]                 = useState<PayrollPeriod[]>([])

  // Selected payroll → employees
  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null)
  const [payrollSlips, setPayrollSlips]           = useState<PayrollPaySlipRow[]>([])
  const [slipsLoading, setSlipsLoading]           = useState(false)
  const [empSearch, setEmpSearch]                 = useState('')

  // ── Load payrolls ───────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [periods, summaries] = await Promise.all([
        fetchPayrollPeriods(),
        fetchEmployeePaySummaries(periodStart, periodEnd),
      ])
      setPayrolls(periods)
      setEmployeeCount(summaries.length)
    } finally {
      setIsLoading(false)
    }
  }, [periodStart, periodEnd])

  useEffect(() => { loadData() }, [loadData])

  // ── Load employees for selected payroll ─────────────────────────────────
  const handleSelectPayroll = async (payrollId: string) => {
    if (selectedPayrollId === payrollId) {
      setSelectedPayrollId(null)
      setPayrollSlips([])
      return
    }
    setSelectedPayrollId(payrollId)
    setSlipsLoading(true)
    setEmpSearch('')
    try {
      const slips = await fetchPayrollPaySlips(payrollId)
      setPayrollSlips(slips)
    } finally {
      setSlipsLoading(false)
    }
  }

  // ── Generate Payroll handler ────────────────────────────────────────────
  const handleGeneratePayroll = async () => {
    if (isGenerating) return
    setIsGenerating(true)
    try {
      const result = await generatePayroll(periodStart, periodEnd)

      downloadPayrollRegisterPDF({
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart,
        periodEnd,
        employees: result.employees,
        preparedBy: 'System Administrator',
      })

      alert(`Payroll generated: ${result.employees.length} employee(s). PDF downloaded.`)
      setSelectedPayrollId(null)
      setPayrollSlips([])
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to generate payroll.')
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Download payroll register PDF from existing payroll ─────────────────
  const handleDownloadPayrollPDF = async (payroll: PayrollPeriod) => {
    try {
      const slips = await fetchPayrollPaySlips(payroll.id)
      if (slips.length === 0) {
        alert('No employees linked to this payroll.')
        return
      }
      downloadPayrollRegisterPDF({
        companyName: LGU_NAME,
        companyAddress: LGU_ADDRESS,
        periodStart: payroll.date_from,
        periodEnd: payroll.date_to,
        employees: slips.map(s => ({
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
        preparedBy: 'System Administrator',
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download payroll PDF.')
    }
  }

  // ── Download individual payslip PDF ─────────────────────────────────────
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

  // ── Filtered payrolls ───────────────────────────────────────────────────
  const filtered = payrolls.filter(p => {
    const matchSearch = p.period_name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && p.status === activeTab
  })

  const filteredEmps = payrollSlips.filter(s =>
    s.employeeName.toLowerCase().includes(empSearch.toLowerCase()),
  )

  // ── Stats ───────────────────────────────────────────────────────────────
  const statusCount = (s: string) => payrolls.filter(p => p.status === s).length
  const selectedPayroll = payrolls.find(p => p.id === selectedPayrollId)

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Computation"
        subtitle="Generate payrolls from DTR records, download payroll sheets and individual payslips"
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
          Employees with DTR records: <strong>{employeeCount}</strong>
        </span>
      </div>

      {/* ── Stats ── */}
      <StatsRow>
        <StatCard label="Total Payrolls" value={payrolls.length} />
        <StatCard label="Draft"          value={statusCount('draft')}    color="warning" />
        <StatCard label="Computed"       value={statusCount('computed')} color="primary" />
        <StatCard label="Approved"       value={statusCount('approved')} color="success" />
        <StatCard label="Released"       value={statusCount('released')} color="success" />
      </StatsRow>

      {/* ── Tabs ── */}
      <Tabs
        tabs={[
          { id: 'all',      label: 'All'      },
          { id: 'draft',    label: 'Draft'    },
          { id: 'computed', label: 'Computed' },
          { id: 'approved', label: 'Approved' },
          { id: 'released', label: 'Released' },
        ]}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setSearch(''); setSelectedPayrollId(null); setPayrollSlips([]) }}
      />

      {/* ── Actions ── */}
      <ActionsBar>
        <PrimaryButton onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={handleGeneratePayroll} disabled={isGenerating || employeeCount === 0}>
          <FileText className="w-4 h-4" />
          {isGenerating ? 'Generating…' : 'Generate Payroll'}
        </PrimaryButton>
      </ActionsBar>

      {/* ── Payrolls Table ── */}
      <DataTable<PayrollPeriod>
        data={filtered}
        columns={[
          { key: 'period_name', header: 'Period' },
          { key: 'date_from',   header: 'From' },
          { key: 'date_to',     header: 'To' },
          { key: 'fiscal_year', header: 'FY' },
          { key: 'fund_type',   header: 'Fund' },
          {
            key: 'total_amount',
            header: 'Total Amount',
            render: item => (
              <span className="font-medium">{fmtPeso(item.total_amount)}</span>
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
            header: 'Actions',
            render: item => (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownloadPayrollPDF(item) }}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                    bg-primary/10 text-primary hover:bg-primary/20"
                  title="Download payroll register PDF"
                >
                  <Download className="w-3 h-3" />
                  Payroll
                </button>
                <button
                  onClick={() => handleSelectPayroll(item.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                    ${selectedPayrollId === item.id
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  title="View employees & download payslips"
                >
                  <FileText className="w-3 h-3" />
                  Payslips
                </button>
              </div>
            ),
          },
        ]}
        title={`Payrolls (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by period name..."
        emptyMessage="No payrolls found. Select a period and click Generate Payroll."
      />

      {/* ── Employees in Selected Payroll ── */}
      {selectedPayrollId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <h3 className="text-sm font-semibold">
              Employees — {selectedPayroll?.period_name ?? ''}
            </h3>
            {slipsLoading && (
              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
            )}
          </div>

          <DataTable<PayrollPaySlipRow>
            data={filteredEmps}
            columns={[
              { key: 'employeeName', header: 'Employee' },
              {
                key: 'rate',
                header: 'Rate',
                render: r => <span>{fmtPeso(r.rate)}</span>,
              },
              {
                key: 'daysWorked',
                header: 'Days',
                render: r => <span className="font-medium">{r.daysWorked}</span>,
              },
              {
                key: 'grossAmount',
                header: 'Gross',
                render: r => <span className="font-medium">{fmtPeso(r.grossAmount)}</span>,
              },
              {
                key: 'totalDeductions',
                header: 'Deductions',
                render: r => <span className="text-red-500">{fmtPeso(r.totalDeductions)}</span>,
              },
              {
                key: 'netAmount',
                header: 'Net Pay',
                render: r => (
                  <span className="font-bold text-green-600">{fmtPeso(r.netAmount)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: r => (
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    r.status === 'released'
                      ? 'bg-success/10 text-success'
                      : r.status === 'approved'
                        ? 'bg-blue-500/10 text-blue-500'
                        : r.status === 'computed'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-warning/10 text-warning'
                  }`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                ),
              },
              {
                key: 'paySlipId',
                header: 'Payslip',
                render: r => (
                  <button
                    onClick={() => handleDownloadPayslip(r.paySlipId)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded
                      bg-primary/10 text-primary hover:bg-primary/20"
                    title="Download individual payslip PDF"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </button>
                ),
              },
            ]}
            title={`Employees (${filteredEmps.length})`}
            searchValue={empSearch}
            onSearchChange={setEmpSearch}
            searchPlaceholder="Search by employee name..."
            emptyMessage={slipsLoading ? 'Loading...' : 'No employees in this payroll.'}
          />
        </div>
      )}
    </div>
  )
}

export default PayrollComputation
