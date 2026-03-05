import { BaseDialog, FormInput } from '@/components/ui/dialog'
import type { Role } from '@/services/rbacService'

interface UserDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  name: string
  onNameChange: (value: string) => void
  email: string
  onEmailChange: (value: string) => void
  roles: Role[]
  selectedRole: string
  onRoleChange: (roleId: string) => void
  editMode?: boolean
}

const UserDialog = ({
  open,
  onClose,
  onSubmit,
  name,
  onNameChange,
  email,
  onEmailChange,
  roles,
  selectedRole,
  onRoleChange,
  editMode = false,
}: UserDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit User Role' : 'Add New User'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add User'}
    >
      {!editMode && (
        <>
          <FormInput
            id="user-name"
            label="Full Name"
            placeholder="Enter full name"
            value={name}
            onChange={onNameChange}
            required
          />
          <FormInput
            id="user-email"
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={onEmailChange}
            required
          />
        </>
      )}
      
      <div className="space-y-1.5">
        <label htmlFor="user-role" className="block text-sm font-medium text-foreground">
          Assign Role
          <span className="text-error ml-1">*</span>
        </label>
        <select
          id="user-role"
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          required
        >
          <option value="">-- Select a role --</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </select>
      </div>
    </BaseDialog>
  )
}

export default UserDialog
