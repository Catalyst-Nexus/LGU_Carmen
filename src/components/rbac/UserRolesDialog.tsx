import { BaseDialog } from '@/components/ui/dialog'
import type { User, Role } from '@/services/rbacService'

interface UserRoleAssignmentDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  users: User[]
  roles: Role[]
  selectedUserId: string
  onUserChange: (userId: string) => void
  selectedRoleId: string
  onRoleChange: (roleId: string) => void
  editMode?: boolean
}

const UserRoleAssignmentDialog = ({
  open,
  onClose,
  onSubmit,
  users,
  roles,
  selectedUserId,
  onUserChange,
  selectedRoleId,
  onRoleChange,
  editMode = false,
}: UserRoleAssignmentDialogProps) => {
  return (
    <BaseDialog 
      open={open} 
      onClose={onClose}
      title={editMode ? 'Edit User Role' : 'Assign Role to User'}
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
            disabled={editMode}
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Assign Role *
          </label>
          <select
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-success"
            value={selectedRoleId}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="">Choose a role...</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role_name} ({role.role_code})
              </option>
            ))}
          </select>
        </div>
      </div>
    </BaseDialog>
  )
}

export default UserRoleAssignmentDialog
