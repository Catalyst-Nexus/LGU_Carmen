import { BaseDialog, FormInput } from '@/components/ui/dialog'

interface RoleDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  roleName: string
  onRoleNameChange: (value: string) => void
  roleCode: string
  onRoleCodeChange: (value: string) => void
  editMode?: boolean
}

const RoleDialog = ({
  open,
  onClose,
  onSubmit,
  roleName,
  onRoleNameChange,
  roleCode,
  onRoleCodeChange,
  editMode = false,
}: RoleDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit Role' : 'Create New Role'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Create Role'}
    >
      <FormInput
        id="role-name"
        label="Role Name"
        placeholder="Enter role name"
        value={roleName}
        onChange={onRoleNameChange}
        required
      />
      <FormInput
        id="role-code"
        label="Role Code"
        placeholder="Enter role code (e.g., ADMIN, USER)"
        value={roleCode}
        onChange={onRoleCodeChange}
        required
      />
    </BaseDialog>
  )
}

export default RoleDialog
