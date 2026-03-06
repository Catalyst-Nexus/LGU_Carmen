import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { UserCheck, Plus, RefreshCw, Download } from 'lucide-react'
import type { Employee } from '@/types/hr.types'

const EmployeeMasterlist = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setEmployees([]); setIsLoading(false) }, 500)
  }

  const filtered = employees.filter(e => {
    const matchSearch = `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_number.toLowerCase().includes(search.toLowerCase()) ||
      e.position_title.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    if (activeTab === 'active') return matchSearch && e.is_active
    if (activeTab === 'inactive') return matchSearch && !e.is_active
    return matchSearch && e.employment_status === activeTab
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Masterlist"
        subtitle="Complete employee records per CSC and DBM standards"
        icon={<UserCheck className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard label="Active" value={employees.filter(e => e.is_active).length} color="success" />
        <StatCard label="Permanent" value={employees.filter(e => e.employment_status === 'permanent').length} color="primary" />
        <StatCard label="Job Order" value={employees.filter(e => e.employment_status === 'job_order').length} color="warning" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'permanent', label: 'Permanent' },
          { id: 'casual', label: 'Casual' },
          { id: 'contractual', label: 'Contractual' },
          { id: 'job_order', label: 'Job Order' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={() => {}}>
          <Plus className="w-4 h-4" />
          Add Employee
        </PrimaryButton>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<Employee>
        data={filtered}
        columns={[
          { key: 'employee_number', header: 'Emp. No.' },
          { key: 'last_name', header: 'Name', render: (item) => <span>{item.last_name}, {item.first_name} {item.middle_name}</span> },
          { key: 'position_title', header: 'Position' },
          { key: 'office_name', header: 'Office' },
          { key: 'salary_grade', header: 'SG', render: (item) => <span>SG {item.salary_grade}-{item.step}</span> },
          { key: 'monthly_salary', header: 'Monthly Salary', render: (item) => <span>₱{item.monthly_salary.toLocaleString()}</span> },
          {
            key: 'employment_status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.employment_status === 'permanent' ? 'bg-green-500/10 text-green-500' :
                item.employment_status === 'casual' ? 'bg-blue-500/10 text-blue-500' :
                item.employment_status === 'job_order' ? 'bg-orange-500/10 text-orange-500' :
                item.employment_status === 'contractual' ? 'bg-purple-500/10 text-purple-500' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {item.employment_status.replace('_', ' ').toUpperCase()}
              </span>
            ),
          },
          { key: 'date_hired', header: 'Date Hired' },
        ]}
        title={`Employees (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, number, or position..."
        emptyMessage="No employees found."
      />
    </div>
  )
}

export default EmployeeMasterlist
