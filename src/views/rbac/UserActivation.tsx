import { useState, useEffect } from 'react'
import { UserActivationList, UserActivationDialog } from '@/components/rbac'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton } from '@/components/ui'
import { UserCheck, RefreshCw } from 'lucide-react'
import { usePermissionGuard } from '@/hooks/usePermissionGuard'
import { 
  fetchPendingUsers, 
  confirmPendingUser, 
  rejectPendingUser,
  type PendingUser as DBPendingUser
} from '@/services/userActivationService'

interface PendingUser {
  id: string
  name: string
  email: string
  requestedAt: string
}

const UserActivation = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  // Use permission guard for permission-checked operations
  const { canPerform } = usePermissionGuard('/dashboard/user-activation')

  // Fetch pending users on component mount
  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    setIsLoading(true)
    setError('')
    try {
      // Check select permission before loading users
      const hasPermission = await canPerform('select')
      if (!hasPermission) {
        setError("You don't have permission to view pending users")
        setIsLoading(false)
        return
      }

      const users = await fetchPendingUsers()
      const formattedUsers: PendingUser[] = users.map((user: DBPendingUser) => ({
        id: user.id,
        name: user.username,
        email: user.email,
        requestedAt: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }))
      setPendingUsers(formattedUsers)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load pending users'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleActivate = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    setError('')
    
    try {
      // Check permission before performing action
      const hasPermission = await canPerform('update')
      if (!hasPermission) {
        setError("You don't have permission to activate users")
        setIsProcessing(false)
        return
      }
      
      const result = await confirmPendingUser(selectedUser.id)
      
      if (result.success) {
        // Remove the activated user from the list
        setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id))
        setShowModal(false)
        setSelectedUser(null)
      } else {
        setError(result.error || 'Failed to activate user')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedUser) return

    setIsProcessing(true)
    setError('')
    
    try {
      // Check permission before performing action
      const hasPermission = await canPerform('delete')
      if (!hasPermission) {
        setError("You don't have permission to reject users")
        setIsProcessing(false)
        return
      }
      
      const result = await rejectPendingUser(selectedUser.id)
      
      if (result.success) {
        // Remove the rejected user from the list
        setPendingUsers(pendingUsers.filter(u => u.id !== selectedUser.id))
        setShowModal(false)
        setSelectedUser(null)
      } else {
        setError(result.error || 'Failed to reject user')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectUser = async (user: PendingUser) => {
    setError('')
    
    try {
      // Check select permission before allowing user to view details
      const hasPermission = await canPerform('select')
      if (!hasPermission) {
        setError("You don't have permission to view user details")
        return
      }
      
      setSelectedUser(user)
      setShowModal(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    }
  }

  const total = pendingUsers.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Activation"
        subtitle="Review and activate pending user registrations"
        icon={<UserCheck className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Pending Activations" value={total} color="warning" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={loadPendingUsers}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh List
        </PrimaryButton>
      </ActionsBar>

      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted">Loading pending users...</p>
        </div>
      ) : (
        <UserActivationList
          users={pendingUsers}
          search={search}
          onSearchChange={setSearch}
          onActivate={(u) => handleSelectUser(u)}
          onReject={(u) => handleSelectUser(u)}
        />
      )}

      <UserActivationDialog
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onActivate={handleActivate}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
    </div>
  )
}

export default UserActivation
