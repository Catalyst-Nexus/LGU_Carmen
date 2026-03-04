import { DataTable, IconButton } from '@/components/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Role {
  id: string
  role_name: string
  role_code: string
  created_at: string
}

interface RoleListProps {
  roles: Role[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (role: Role) => void
  onDelete: (id: string) => void
}

interface Column<T> {
  key: keyof T | 'actions'
  header: string
  render?: (item: T) => ReactNode
  className?: string
}

const RoleList = ({ roles, search, onSearchChange, onEdit, onDelete }: RoleListProps) => {
  const filteredRoles = roles.filter(
    (role) =>
      role.id.toLowerCase().includes(search.toLowerCase()) ||
      role.role_name.toLowerCase().includes(search.toLowerCase()) ||
      role.role_code.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<Role>[] = [
    { key: 'id', header: 'Role ID', render: (role: Role) => role.id },
    { key: 'role_name', header: 'Role Name', render: (role: Role) => role.role_name },
    { key: 'role_code', header: 'Role Code', render: (role: Role) => role.role_code },
    {
      key: 'created_at',
      header: 'Created At',
      render: (role: Role) => new Date(role.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (role: Role) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => onEdit(role)} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => onDelete(role.id)} title="Delete" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={filteredRoles}
      columns={columns}
      searchPlaceholder="Search roles..."
      searchValue={search}
      onSearchChange={onSearchChange}
      emptyMessage="No roles found"
    />
  )
}

export default RoleList
