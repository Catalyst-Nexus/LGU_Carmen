import React from 'react'
import { DataTable, StatusBadge, IconButton } from '@/components/ui'
import { Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Module {
  id: string
  module_name: string
  route_path: string
  icons: string | null
  file_path: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

interface ModuleListProps {
  modules: Module[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (module: Module) => void
  onDelete: (id: string) => void
}

const ModuleList = ({ modules, search, onSearchChange, onEdit, onDelete }: ModuleListProps) => {
  const filteredModules = modules.filter(
    (module) =>
      module.module_name.toLowerCase().includes(search.toLowerCase()) ||
      module.route_path.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Array<{ key: keyof Module | 'actions'; header: string; render: (module: Module) => React.ReactNode }> = [
    { key: 'module_name', header: 'Module Name', render: (module: Module) => module.module_name },
    { key: 'route_path', header: 'Route Path', render: (module: Module) => module.route_path },
    {
      key: 'icons',
      header: 'Icon',
      render: (module: Module) =>
        module.icons ? (
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
            {module.icons}
          </span>
        ) : (
          <span className="text-xs text-muted">-</span>
        ),
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (module: Module) => (
        <StatusBadge status={module.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (module: Module) =>
        format(new Date(module.created_at), 'MMM dd, yyyy HH:mm'),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (module: Module) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => onEdit(module)} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => onDelete(module.id)} title="Delete" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={filteredModules}
      columns={columns}
      keyField="id"
      searchPlaceholder="Search modules..."
      searchValue={search}
      onSearchChange={onSearchChange}
      emptyMessage="No modules found"
    />
  )
}

export default ModuleList
