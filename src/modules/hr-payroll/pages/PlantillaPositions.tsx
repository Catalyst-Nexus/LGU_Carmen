import { useState, useEffect, useCallback } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, DataTable, IconButton } from '@/components/ui'
import { LayoutList, Plus, RefreshCw, Edit, Trash2 } from 'lucide-react'
import type { PlantillaPosition } from '@/types/hr.types'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import PositionDialog, { type PositionFormData } from '../components/PositionDialog'
import { createPosition, updatePosition, deletePosition } from '@/services/hrService'

const fetchPlantillaPositions = async (): Promise<PlantillaPosition[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .select(
      `
      id, item_no, description, is_filled, created_at,
      salary_rate:sr_id ( id, description ),
      position_type:pt_id ( id, description ),
      office:o_id ( id, description )
    `
    )
    .order('item_no');

  if (error) {
    console.error('Error fetching positions:', error);
    return [];
  }

  return (data || []).map((row: any) => {
    // Extract SG number from salary rate description (e.g., "SG-6 Step 1 Monthly" -> 6)
    const sgMatch = row.salary_rate?.description?.match(/SG-(\d+)/);
    const salaryGrade = sgMatch ? parseInt(sgMatch[1], 10) : 0;

    return {
      id: row.id,
      item_number: row.item_no,
      position_title: row.description,
      salary_grade: salaryGrade,
      office_id: row.office?.id ?? '',
      office_name: row.office?.description ?? 'Unassigned',
      is_filled: row.is_filled,
      incumbent_id: null,
      authorization: row.position_type?.description ?? '',
      created_at: row.created_at,
    };
  });
};

const PlantillaPositions = () => {
  const [positions, setPositions] = useState<PlantillaPosition[]>([])
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [positionDialogOpen, setPositionDialogOpen] = useState(false)
  const [editingPosition, setEditingPosition] = useState<PlantillaPosition | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPlantillaPositions();
    setPositions(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const handleOpenAddDialog = () => {
    setEditingPosition(null);
    setPositionDialogOpen(true);
  };

  const handleOpenEditDialog = (position: PlantillaPosition) => {
    setEditingPosition(position);
    setPositionDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setPositionDialogOpen(false);
    setEditingPosition(null);
  };

  const handleSubmitPosition = async (positionData: PositionFormData) => {
    setIsSaving(true);
    
    if (editingPosition) {
      // Update existing position
      const result = await updatePosition(editingPosition.id, positionData);
      if (result.success) {
        await loadPositions();
        handleCloseDialog();
      } else {
        alert(`Failed to update position: ${result.error}`);
      }
    } else {
      // Create new position
      const result = await createPosition(positionData);
      if (result.success) {
        await loadPositions();
        handleCloseDialog();
      } else {
        alert(`Failed to create position: ${result.error}`);
      }
    }
    
    setIsSaving(false);
  };

  const handleDeletePosition = async (position: PlantillaPosition) => {
    if (!confirm(`Are you sure you want to delete position "${position.position_title}" (${position.item_number})?`)) {
      return;
    }

    const result = await deletePosition(position.id);
    if (result.success) {
      await loadPositions();
    } else {
      alert(`Failed to delete position: ${result.error}`);
    }
  };

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
        <PrimaryButton onClick={handleOpenAddDialog}>
          <Plus className="w-4 h-4" />
          Add Position
        </PrimaryButton>
        <PrimaryButton onClick={loadPositions} disabled={isLoading}>
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
          {
            key: 'id',
            header: 'Actions',
            render: (item) => (
              <div className="flex items-center gap-1">
                <IconButton
                  onClick={() => handleOpenEditDialog(item)}
                  title="Edit position"
                >
                  <Edit className="w-4 h-4" />
                </IconButton>
                <IconButton
                  onClick={() => handleDeletePosition(item)}
                  title="Delete position"
                >
                  <Trash2 className="w-4 h-4 text-error" />
                </IconButton>
              </div>
            ),
          },
        ]}
        title="Plantilla Positions"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item no., position, or office..."
        emptyMessage={isLoading ? 'Loading positions...' : 'No positions found.'}
      />

      <PositionDialog
        open={positionDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitPosition}
        position={editingPosition}
        isLoading={isSaving}
      />
    </div>
  )
}

export default PlantillaPositions
