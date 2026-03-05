import { useState, useMemo } from 'react'
import { Edit2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface UserFacilityAssignment {
  id: string
  userName: string
  userEmail: string
  facilities: string[]
  assignedAt: string
}

interface UserFacilityAssignmentListProps {
  assignments: UserFacilityAssignment[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (assignment: UserFacilityAssignment) => void
  onDelete: (id: string) => void
}

type SortField = 'userName' | 'userEmail' | 'facilities' | 'assignedAt'
type SortDir = 'asc' | 'desc'
type AssignmentFilter = 'all' | 'with-facilities' | 'without-facilities'

const UserFacilityAssignmentList = ({
  assignments,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: UserFacilityAssignmentListProps) => {
  const [sortField, setSortField] = useState<SortField>('userName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredAndSorted = useMemo(() => {
    let result = [...assignments]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        a.facilities.some(f => f.toLowerCase().includes(q))
      )
    }

    // Assignment filter
    if (assignmentFilter === 'with-facilities') {
      result = result.filter(a => a.facilities.length > 0)
    } else if (assignmentFilter === 'without-facilities') {
      result = result.filter(a => a.facilities.length === 0)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'userName') {
        cmp = a.userName.localeCompare(b.userName)
      } else if (sortField === 'userEmail') {
        cmp = a.userEmail.localeCompare(b.userEmail)
      } else if (sortField === 'facilities') {
        cmp = a.facilities.length - b.facilities.length
      } else if (sortField === 'assignedAt') {
        cmp = a.assignedAt.localeCompare(b.assignedAt)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [assignments, search, assignmentFilter, sortField, sortDir])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
  }

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1.5 font-semibold text-muted hover:text-foreground transition-colors"
    >
      {children}
      <SortIcon field={field} />
    </button>
  )

  const usersWithFacilities = assignments.filter(a => a.facilities.length > 0).length

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      {/* Search & Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search users or facilities..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value as AssignmentFilter)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
        >
          <option value="all">All Users</option>
          <option value="with-facilities">With Facilities</option>
          <option value="without-facilities">Without Facilities</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted">
          Users with facilities: <span className="text-success font-medium">{usersWithFacilities}</span>
        </span>
        <span className="text-muted">
          Users without: <span className="text-warning font-medium">{assignments.length - usersWithFacilities}</span>
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="userName">User Name</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="userEmail">Email</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="facilities">Facilities</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="assignedAt">Assigned At</SortableHeader>
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">
                  No user facility assignments found.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-background transition-colors">
                  <td className="px-4 py-3 border-b border-border/50 font-medium">
                    {assignment.userName}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    {assignment.userEmail}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex flex-wrap gap-1">
                      {assignment.facilities.length === 0 ? (
                        <span className="text-muted text-xs">No facilities assigned</span>
                      ) : (
                        assignment.facilities.map((facility, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-success/10 text-success text-xs rounded"
                          >
                            {facility}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    {assignment.assignedAt}
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEdit(assignment)}
                        className="text-primary hover:text-success transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(assignment.id)}
                        className="text-muted hover:text-danger transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-sm text-muted">
        Showing {filteredAndSorted.length} of {assignments.length} users
      </div>
    </div>
  )
}

export default UserFacilityAssignmentList
