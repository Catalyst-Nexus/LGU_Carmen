import { BaseDialog, FormInput } from '@/components/ui/dialog'

interface FacilitiesDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  facilityName: string
  onFacilityNameChange: (value: string) => void
  editMode?: boolean
}

const FacilitiesDialog = ({
  open,
  onClose,
  onSubmit,
  facilityName,
  onFacilityNameChange,
  editMode = false,
}: FacilitiesDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit Facility' : 'Add New Facility'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add Facility'}
    >
      <FormInput
        id="facility-name"
        label="Facility Name"
        placeholder="Enter facility name"
        value={facilityName}
        onChange={onFacilityNameChange}
        required
      />
    </BaseDialog>
  )
}

export default FacilitiesDialog
