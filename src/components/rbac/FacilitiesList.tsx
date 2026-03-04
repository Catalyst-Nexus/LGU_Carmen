import { DataTable, StatusBadge, IconButton } from '@/components/ui'
import { Pencil, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'

interface Facility {
  id: string
  facility_name: string
  is_active: boolean
  created_at: string
}

interface FacilitiesListProps {
  facilities: Facility[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (facility: Facility) => void
  onDelete: (id: string) => void
}

interface Column<T> {
  key: keyof T | 'actions'
  header: string
  render?: (item: T) => ReactNode
  className?: string
}

const FacilitiesList = ({
  facilities,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: FacilitiesListProps) => {
  const filteredFacilities = facilities.filter(
    (facility) =>
      facility.id.toLowerCase().includes(search.toLowerCase()) ||
      facility.facility_name.toLowerCase().includes(search.toLowerCase())
  )

  const columns: Column<Facility>[] = [
    { key: 'id', header: 'Facility ID', render: (facility: Facility) => facility.id },
    {
      key: 'facility_name',
      header: 'Facility Name',
      render: (facility: Facility) => facility.facility_name,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (facility: Facility) => (
        <StatusBadge status={facility.is_active ? 'active' : 'inactive'} />
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      render: (facility: Facility) => new Date(facility.created_at).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (facility: Facility) => (
        <div className="flex items-center gap-2">
          <IconButton onClick={() => onEdit(facility)} title="Edit">
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton onClick={() => onDelete(facility.id)} title="Delete" variant="danger">
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      ),
    },
  ]

  return (
    <DataTable
      data={filteredFacilities}
      columns={columns}
      searchPlaceholder="Search facilities..."
      searchValue={search}
      onSearchChange={onSearchChange}
      emptyMessage="No facilities found"
    />
  )
}

export default FacilitiesList
