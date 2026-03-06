import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, Tabs } from '@/components/ui'
import { CalendarOff, Plus, RefreshCw } from 'lucide-react'
import type { LeaveApplication } from '@/types/hr.types'

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState<LeaveApplication[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setLeaves([]); setIsLoading(false) }, 500)
  }

  const filtered = leaves.filter(l => {
    const matchSearch = l.employee_name.toLowerCase().includes(search.toLowerCase())
    if (activeTab === 'all') return matchSearch
    return matchSearch && l.status === activeTab
  })

  const leaveTypeLabel: Record<string, string> = {
    VL: 'Vacation Leave',
    SL: 'Sick Leave',
    ML: 'Maternity Leave',
    PL: 'Paternity Leave',
    SPL: 'Special Privilege Leave',
    FL: 'Forced Leave',
    CL: 'Compensatory Leave',
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Leave applications and tracking per CSC rules"
        icon={<CalendarOff className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Applications" value={leaves.length} />
        <StatCard label="Pending" value={leaves.filter(l => l.status === 'pending').length} color="warning" />
        <StatCard label="Approved" value={leaves.filter(l => l.status === 'approved').length} color="success" />
        <StatCard label="Denied" value={leaves.filter(l => l.status === 'denied').length} color="danger" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: 'all', label: 'All' },
          { id: 'pending', label: 'Pending' },
          { id: 'approved', label: 'Approved' },
          { id: 'denied', label: 'Denied' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={() => {}}>
          <Plus className="w-4 h-4" />
          File Leave
        </PrimaryButton>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<LeaveApplication>
        data={filtered}
        columns={[
          { key: 'employee_name', header: 'Employee' },
          { key: 'leave_type', header: 'Type', render: (item) => <span title={leaveTypeLabel[item.leave_type]}>{item.leave_type}</span> },
          { key: 'date_from', header: 'From' },
          { key: 'date_to', header: 'To' },
          { key: 'days', header: 'Days' },
          { key: 'reason', header: 'Reason' },
          {
            key: 'status', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.status === 'approved' ? 'bg-success/10 text-success' :
                item.status === 'pending' ? 'bg-warning/10 text-warning' :
                item.status === 'denied' ? 'bg-danger/10 text-danger' :
                'bg-gray-500/10 text-gray-500'
              }`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
        ]}
        title={`Leave Applications (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No leave applications found."
      />
    </div>
  )
}

export default LeaveManagement
