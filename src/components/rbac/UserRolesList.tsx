import { useState, useMemo } from 'react'
import { Edit2, Trash2, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react'

interface UserRoleAssignment {
  id: string
  userName: string
  userEmail: string
  roleName: string
  roleCode: string
  assignedAt: string
}

interface UserRoleAssignmentListProps {
  assignments: UserRoleAssignment[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (assignment: UserRoleAssignment) => void
  onDelete: (id: string) => void
}

type SortField = 'userName' | 'userEmail' | 'roleName' | 'roleCode' | 'assignedAt'
type SortDir = 'asc' | 'desc'
type RoleFilter = 'all' | 'with-role' | 'without-role'

const UserRoleAssignmentList = ({
  assignments,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: UserRoleAssignmentListProps) => {
  const [sortField, setSortField] = useState<SortField>('userName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const hasRole = (a: UserRoleAssignment) => a.roleName !== 'No role assigned' && a.roleCode !== '-'

  const filteredAndSorted = useMemo(() => {
    let result = [...assignments]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(a =>
        a.userName.toLowerCase().includes(q) ||
        a.userEmail.toLowerCase().includes(q) ||
        a.roleName.toLowerCase().includes(q) ||
        a.roleCode.toLowerCase().includes(q)
      )
    }

    // Role filter
    if (roleFilter === 'with-role') {
      result = result.filter(a => hasRole(a))
    } else if (roleFilter === 'without-role') {
      result = result.filter(a => !hasRole(a))
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'userName') {
        cmp = a.userName.localeCompare(b.userName)
      } else if (sortField === 'userEmail') {
        cmp = a.userEmail.localeCompare(b.userEmail)
      } else if (sortField === 'roleName') {
        cmp = a.roleName.localeCompare(b.roleName)
      } else if (sortField === 'roleCode') {
        cmp = a.roleCode.localeCompare(b.roleCode)
      } else if (sortField === 'assignedAt') {
        cmp = a.assignedAt.localeCompare(b.assignedAt)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [assignments, search, roleFilter, sortField, sortDir])

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

  const usersWithRole = assignments.filter(a => hasRole(a)).length

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      {/* Search & Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search users or roles..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
        >
          <option value="all">All Users</option>
          <option value="with-role">With Role</option>
          <option value="without-role">Without Role</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="text-muted">
          Users with role: <span className="text-success font-medium">{usersWithRole}</span>
        </span>
        <span className="text-muted">
          Users without: <span className="text-warning font-medium">{assignments.length - usersWithRole}</span>
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
                <SortableHeader field="roleName">Role</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="roleCode">Role Code</SortableHeader>
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
                <td colSpan={6} className="text-center text-muted py-8">
                  No user role assignments found.
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
                    <span className={`px-2 py-1 text-xs rounded ${
                      hasRole(assignment)
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {assignment.roleName}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <span className="font-mono text-xs text-muted">{assignment.roleCode}</span>
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

export default UserRoleAssignmentList
