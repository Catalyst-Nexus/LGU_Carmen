import { BaseDialog } from '@/components/ui/dialog'
import type { User, Facility } from '@/services/rbacService'

interface UserFacilityAssignmentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  users: User[]
  facilities: Facility[]
  selectedUserId: string
  onUserChange: (userId: string) => void
  selectedFacilityIds: string[]
  onFacilityIdsChange: (facilityIds: string[]) => void
}

const UserFacilityAssignmentDialog = ({
  open,
  onClose,
  onSubmit,
  users,
  facilities,
  selectedUserId,
  onUserChange,
  selectedFacilityIds,
  onFacilityIdsChange,
}: UserFacilityAssignmentDialogProps) => {
  const handleToggleFacility = (facilityId: string) => {
    if (selectedFacilityIds.includes(facilityId)) {
      onFacilityIdsChange(selectedFacilityIds.filter((id) => id !== facilityId))
    } else {
      onFacilityIdsChange([...selectedFacilityIds, facilityId])
    }
  }

  return (
    <BaseDialog 
      open={open} 
      onClose={onClose}
      title="Assign Facilities to User"
      onSubmit={onSubmit}
      submitLabel="Save Changes"
    >
      <div className="space-y-4">
        {/* User Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Select User *
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-success"
            value={selectedUserId}
            onChange={(e) => onUserChange(e.target.value)}
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Facilities Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Select Facilities
          </label>
          <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-background p-3 space-y-2">
            {facilities.length === 0 ? (
              <p className="text-muted text-sm">No facilities available</p>
            ) : (
              facilities.map((facility) => (
                <label
                  key={facility.id}
                  className="flex items-center gap-2 cursor-pointer hover:bg-surface/50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedFacilityIds.includes(facility.id)}
                    onChange={() => handleToggleFacility(facility.id)}
                    className="w-4 h-4 text-success border-border rounded focus:ring-success focus:ring-2"
                  />
                  <span className="text-sm text-foreground">{facility.facility_name}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>
    </BaseDialog>
  )
}

export default UserFacilityAssignmentDialog
