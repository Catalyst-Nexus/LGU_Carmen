import { useState, useEffect } from 'react'
import { FacilitiesList, FacilitiesDialog } from '@/components/rbac'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton } from '@/components/ui'
import { Building, Plus } from 'lucide-react'
import { supabase } from '@/services/supabase'

interface Facility {
  id: string
  facility_name: string
  is_active: boolean
  created_at: string
}

const FacilitiesManagement = () => {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [facilityName, setFacilityName] = useState('')
  const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null)

  // Load facilities on mount
  useEffect(() => {
    loadFacilities()
  }, [])

  const loadFacilities = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      return
    }

    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFacilities(data || [])
    } catch (error) {
      console.error('Error loading facilities:', error)
    }
  }

  const handleCreate = async () => {
    if (!facilityName.trim()) {
      alert('Please fill in facility name')
      return
    }

    if (!supabase) {
      alert('Supabase is not configured')
      return
    }

    try {
      if (editingFacilityId) {
        // Update existing facility
        const { error } = await supabase
          .from('facilities')
          .update({
            facility_name: facilityName,
          })
          .eq('id', editingFacilityId)

        if (error) throw error
        setFacilities(
          facilities.map((f) =>
            f.id === editingFacilityId ? { ...f, facility_name: facilityName } : f
          )
        )
      } else {
        // Insert new facility
        const { data, error } = await supabase
          .from('facilities')
          .insert([
            {
              facility_name: facilityName,
              is_active: true,
            },
          ])
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        if (data) {
          setFacilities([...facilities, ...data])
        }
      }

      setFacilityName('')
      setEditingFacilityId(null)
      setShowModal(false)
    } catch (error) {
      console.error('Error saving facility:', error)
      alert(`Failed to save facility: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEdit = (facility: Facility) => {
    setEditingFacilityId(facility.id)
    setFacilityName(facility.facility_name)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this facility?')) {
      return
    }

    if (!supabase) {
      alert('Supabase is not configured')
      return
    }

    try {
      const { error } = await supabase.from('facilities').delete().eq('id', id)

      if (error) throw error
      setFacilities(facilities.filter((f) => f.id !== id))
    } catch (error) {
      console.error('Error deleting facility:', error)
      alert('Failed to delete facility')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setFacilityName('')
    setEditingFacilityId(null)
  }

  const total = facilities.length
  const active = facilities.filter((f) => f.is_active).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facilities Management"
        subtitle="Manage facilities in your role-based access control system"
        icon={<Building className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Facilities" value={total} />
        <StatCard label="Active Facilities" value={active} color="success" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setEditingFacilityId(null)
            setFacilityName('')
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Add Facility
        </PrimaryButton>
      </ActionsBar>

      <FacilitiesList
        facilities={facilities}
        search={search}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <FacilitiesDialog
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleCreate}
        facilityName={facilityName}
        onFacilityNameChange={setFacilityName}
        editMode={editingFacilityId !== null}
      />
    </div>
  )
}

export default FacilitiesManagement
