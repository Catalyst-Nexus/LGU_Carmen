import { useState, useMemo } from 'react'
import { StatusBadge, IconButton } from '@/components/ui'
import { Pencil, Trash2, ArrowUpDown, ChevronUp, ChevronDown, Search } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  registeredAt: string
}

interface UserListProps {
  users: User[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (user: User) => void
  onDelete: (id: string) => void
}

type SortField = 'name' | 'email' | 'status' | 'registeredAt'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'active' | 'inactive'

const UserList = ({ users, search, onSearchChange, onEdit, onDelete }: UserListProps) => {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users]

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(user =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter)
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === 'email') {
        cmp = a.email.localeCompare(b.email)
      } else if (sortField === 'status') {
        cmp = a.status.localeCompare(b.status)
      } else if (sortField === 'registeredAt') {
        cmp = a.registeredAt.localeCompare(b.registeredAt)
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  }, [users, search, statusFilter, sortField, sortDir])

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

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      {/* Search & Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search users..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="name">Name</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="email">Email</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="status">Status</SortableHeader>
              </th>
              <th className="bg-background text-left px-4 py-3 border-b border-border">
                <SortableHeader field="registeredAt">Registered</SortableHeader>
              </th>
              <th className="bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-8">
                  No users found
                </td>
              </tr>
            ) : (
              filteredAndSortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-background transition-colors">
                  <td className="px-4 py-3 border-b border-border/50 font-medium">{user.name}</td>
                  <td className="px-4 py-3 border-b border-border/50">{user.email}</td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-4 py-3 border-b border-border/50">{user.registeredAt}</td>
                  <td className="px-4 py-3 border-b border-border/50">
                    <div className="flex items-center gap-2">
                      <IconButton onClick={() => onEdit(user)} title="Edit">
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton onClick={() => onDelete(user.id)} title="Delete" variant="danger">
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
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
        Showing {filteredAndSortedUsers.length} of {users.length} users
      </div>
    </div>
  )
}

export default UserList
