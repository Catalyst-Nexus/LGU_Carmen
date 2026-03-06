import { useState } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable } from '@/components/ui'
import { LayoutList, Plus, RefreshCw } from 'lucide-react'
import type { PlantillaPosition } from '@/types/hr.types'

const PlantillaPositions = () => {
  const [positions, setPositions] = useState<PlantillaPosition[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleRefresh = () => {
    setIsLoading(true)
    setTimeout(() => { setPositions([]); setIsLoading(false) }, 500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantilla of Positions"
        subtitle="Authorized positions per DBM-approved plantilla"
        icon={<LayoutList className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Positions" value={positions.length} />
        <StatCard label="Filled" value={positions.filter(p => p.is_filled).length} color="success" />
        <StatCard label="Vacant" value={positions.filter(p => !p.is_filled).length} color="danger" />
        <StatCard label="Fill Rate" value={positions.length ? `${Math.round((positions.filter(p => p.is_filled).length / positions.length) * 100)}%` : '0%'} />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={() => {}}>
          <Plus className="w-4 h-4" />
          Add Position
        </PrimaryButton>
        <PrimaryButton onClick={handleRefresh}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PlantillaPosition>
        data={positions.filter(p =>
          p.position_title.toLowerCase().includes(search.toLowerCase()) ||
          p.item_number.toLowerCase().includes(search.toLowerCase()) ||
          p.office_name.toLowerCase().includes(search.toLowerCase())
        )}
        columns={[
          { key: 'item_number', header: 'Item No.' },
          { key: 'position_title', header: 'Position Title' },
          { key: 'salary_grade', header: 'SG' },
          { key: 'office_name', header: 'Office' },
          {
            key: 'is_filled', header: 'Status', render: (item) => (
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                item.is_filled ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {item.is_filled ? 'Filled' : 'Vacant'}
              </span>
            ),
          },
          { key: 'authorization', header: 'Authorization' },
        ]}
        title="Plantilla Positions"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item no., position, or office..."
        emptyMessage="No positions found."
      />
    </div>
  )
}

export default PlantillaPositions
