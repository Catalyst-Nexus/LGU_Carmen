import { useState, useEffect } from 'react'
import { UserList, UserDialog, UserFacilityAssignmentList, UserFacilityAssignmentDialog, UserRoleAssignmentList, UserRoleAssignmentDialog } from '@/components/rbac'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton, Tabs } from '@/components/ui'
import { Users, Plus, RefreshCw } from 'lucide-react'
import { fetchUsers, fetchRoles, assignRoleToUser, getUserRoles, fetchFacilities, assignFacilitiesToUser, getUserFacilities, type User as DBUser, type Role, type Facility } from '@/services/rbacService'
import RolePermissionManagement from './RolePermissionManagement'

interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  registeredAt: string
}

type TabKey = 'users' | 'assignments' | 'roles' | 'access'

const tabs = [
  { key: 'users', label: 'Users' },
  { key: 'assignments', label: 'User Assignments' },
  { key: 'roles', label: 'User Roles' },
  { key: 'access', label: 'Access & Permissions' },
]

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('users')
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUserRole, setSelectedUserRole] = useState<string>('')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // User Assignments (user-facilities) state
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedUserForFacilities, setSelectedUserForFacilities] = useState<string>('')
  const [selectedFacilityIds, setSelectedFacilityIds] = useState<string[]>([])
  const [assignmentSearch, setAssignmentSearch] = useState('')
  const [userFacilityAssignments, setUserFacilityAssignments] = useState<any[]>([])

  // User Roles (user-role assignments) state
  const [showRoleAssignmentModal, setShowRoleAssignmentModal] = useState(false)
  const [selectedUserForRole, setSelectedUserForRole] = useState<string>('')
  const [selectedRoleForAssignment, setSelectedRoleForAssignment] = useState<string>('')
  const [roleAssignmentSearch, setRoleAssignmentSearch] = useState('')
  const [editingUserRoleId, setEditingUserRoleId] = useState<string | null>(null)
  const [userRoleAssignments, setUserRoleAssignments] = useState<any[]>([])

  // Fetch users and roles on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Load user facility assignments when on assignments tab
  useEffect(() => {
    if (activeTab === 'assignments') {
      loadUserFacilityAssignments()
    }
  }, [activeTab, users, facilities])

  // Load user role assignments when on roles tab
  useEffect(() => {
    if (activeTab === 'roles') {
      loadUserRoleAssignments()
    }
  }, [activeTab, users, roles])

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [fetchedUsers, fetchedRoles, fetchedFacilities] = await Promise.all([
        fetchUsers(),
        fetchRoles(),
        fetchFacilities()
      ])

      // Transform DB users to component users
      const transformedUsers: User[] = fetchedUsers.map((user: DBUser) => ({
        id: user.id,
        name: user.username,
        email: user.email,
        status: user.status as 'active' | 'inactive',
        registeredAt: new Date(user.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
      }))

      setUsers(transformedUsers)
      setFacilities(fetchedFacilities)
      setRoles(fetchedRoles)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formName.trim() || !formEmail.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (!selectedUserRole) {
      alert('Please select a role')
      return
    }

    try {
      // If editing, update the role assignment
      if (editingUserId) {
        const result = await assignRoleToUser(editingUserId, selectedUserRole)
        if (!result.success) {
          alert(`Failed to update role: ${result.error}`)
          return
        }
      }

      // Reset form and reload data
      setFormName('')
      setFormEmail('')
      setSelectedUserRole('')
      setEditingUserId(null)
      setShowModal(false)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      alert(message)
    }
  }

  // Load user facility assignments with user and facility details
  const loadUserFacilityAssignments = async () => {
    try {
      const assignments = await Promise.all(
        users.map(async (user) => {
          const userFacilities = await getUserFacilities(user.id)
          return {
            id: user.id,
            userName: user.name,
            userEmail: user.email,
            facilities: userFacilities.map(f => f.facility_name),
            assignedAt: user.registeredAt
          }
        })
      )
      setUserFacilityAssignments(assignments)
    } catch (err) {
      console.error('Error loading user facility assignments:', err)
    }
  }

  // Load user role assignments with user and role details
  const loadUserRoleAssignments = async () => {
    try {
      const assignments = await Promise.all(
        users.map(async (user) => {
          const userRoles = await getUserRoles(user.id)
          const role = userRoles.length > 0 ? userRoles[0] : null
          return {
            id: user.id,
            userName: user.name,
            userEmail: user.email,
            roleName: role ? role.role_name : 'No role assigned',
            roleCode: role ? role.role_code : '-',
            assignedAt: user.registeredAt
          }
        })
      )
      setUserRoleAssignments(assignments)
    } catch (err) {
      console.error('Error loading user role assignments:', err)
      // Reload assignments
      loadUserFacilityAssignments()
    }
  }

  const total = users.length
  const active = users.filter((u) => u.status === 'active').length
  const inactive = users.filter((u) => u.status === 'inactive').length

  const handleEditUser = async (user: User) => {
    setFormName(user.name)
    setFormEmail(user.email)
    setEditingUserId(user.id)
    
    // Fetch current user role
    try {
      const userRoles = await getUserRoles(user.id)
      if (userRoles.length > 0) {
        setSelectedUserRole(userRoles[0].id)
      }
    } catch (err) {
      console.error('Error fetching user roles:', err)
    }
    
    setShowModal(true)
  }

  // User facility assignment handlers
  const handleAssignFacilities = async () => {
    if (!selectedUserForFacilities) {
      alert('Please select a user')
      return
    }

    try {
      const result = await assignFacilitiesToUser(selectedUserForFacilities, selectedFacilityIds)
      if (!result.success) {
        alert(`Failed to assign facilities: ${result.error}`)
        return
      }

      // Reset form
      setSelectedUserForFacilities('')
      setSelectedFacilityIds([])
      setShowAssignmentModal(false)
      alert('Facilities assigned successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      alert(message)
    }
  }

  const handleEditUserFacilities = async (userId: string) => {
    setSelectedUserForFacilities(userId)
    
    // Fetch current user facilities
    try {
      const userFacilities = await getUserFacilities(userId)
      setSelectedFacilityIds(userFacilities.map(f => f.id))
    } catch (err) {
      console.error('Error fetching user facilities:', err)
    }
    
    setShowAssignmentModal(true)
  }

  // User role assignment handlers
  const handleAssignRoleToUser = async () => {
    if (!selectedUserForRole) {
      alert('Please select a user')
      return
    }

    if (!selectedRoleForAssignment) {
      alert('Please select a role')
      return
    }

    try {
      const result = await assignRoleToUser(selectedUserForRole, selectedRoleForAssignment)
      if (!result.success) {
        alert(`Failed to assign role: ${result.error}`)
        return
      }

      // Reset form
      setSelectedUserForRole('')
      setSelectedRoleForAssignment('')
      setEditingUserRoleId(null)
      // Reload assignments
      loadUserRoleAssignments()
      setShowRoleAssignmentModal(false)
      alert('Role assigned successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      alert(message)
    }
  }

  const handleEditUserRole = async (userId: string) => {
    setSelectedUserForRole(userId)
    setEditingUserRoleId(userId)
    
    // Fetch current user role
    try {
      const userRoles = await getUserRoles(userId)
      if (userRoles.length > 0) {
        setSelectedRoleForAssignment(userRoles[0].id)
      }
    } catch (err) {
      console.error('Error fetching user roles:', err)
    }
    
    setShowRoleAssignmentModal(true)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        subtitle="Manage users in your role-based access control system"
        icon={<Users className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Users" value={total} />
        <StatCard label="Active Status" value={active} color="success" />
        <StatCard label="Inactive Status" value={inactive} color="warning" />
      </StatsRow>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as TabKey)}
      />

      {activeTab === 'users' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={loadData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </PrimaryButton>
            <PrimaryButton onClick={() => {
              setFormName('')
              setFormEmail('')
              setSelectedUserRole('')
              setEditingUserId(null)
              setShowModal(true)
            }}>
              <Plus className="w-4 h-4" />
              Add User
            </PrimaryButton>
          </ActionsBar>

          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted">Loading users...</p>
            </div>
          ) : (
            <UserList
              users={users}
              search={search}
              onSearchChange={setSearch}
              onEdit={handleEditUser}
              onDelete={(id) => console.log('Delete', id)}
            />
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => {
              setSelectedUserForFacilities('')
              setSelectedFacilityIds([])
              setShowAssignmentModal(true)
            }}>
              <Plus className="w-4 h-4" />
              Assign Facilities
            </PrimaryButton>
          </ActionsBar>

          <UserFacilityAssignmentList
            assignments={userFacilityAssignments}
            search={assignmentSearch}
            onSearchChange={setAssignmentSearch}
            onEdit={(assignment) => handleEditUserFacilities(assignment.id)}
            onDelete={(id) => console.log('Delete facility assignment', id)}
          />
        </>
      )}

      {activeTab === 'roles' && (
        <>
          <ActionsBar>
            <PrimaryButton onClick={() => {
              setSelectedUserForRole('')
              setSelectedRoleForAssignment('')
              setEditingUserRoleId(null)
              setShowRoleAssignmentModal(true)
            }}>
              <Plus className="w-4 h-4" />
              Assign Role
            </PrimaryButton>
          </ActionsBar>

          <UserRoleAssignmentList
            assignments={userRoleAssignments}
            search={roleAssignmentSearch}
            onSearchChange={setRoleAssignmentSearch}
            onEdit={(assignment) => handleEditUserRole(assignment.id)}
            onDelete={(id) => console.log('Delete role assignment', id)}
          />
        </>
      )}

      {activeTab === 'access' && (
        <RolePermissionManagement />
      )}

      <UserDialog
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingUserId(null)
        }}
        onSubmit={handleCreate}
        name={formName}
        onNameChange={setFormName}
        email={formEmail}
        onEmailChange={setFormEmail}
        roles={roles}
        selectedRole={selectedUserRole}
        onRoleChange={setSelectedUserRole}
        editMode={!!editingUserId}
      />

      <UserFacilityAssignmentDialog
        open={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false)
          setSelectedUserForFacilities('')
          setSelectedFacilityIds([])
        }}
        onSubmit={handleAssignFacilities}
        users={users.map(u => ({
          id: u.id,
          username: u.name,
          email: u.email,
          status: u.status,
          created_at: u.registeredAt,
          is_super_admin: false
        }))}
        facilities={facilities}
        selectedUserId={selectedUserForFacilities}
        onUserChange={setSelectedUserForFacilities}
        selectedFacilityIds={selectedFacilityIds}
        onFacilityIdsChange={setSelectedFacilityIds}
      />

      <UserRoleAssignmentDialog
        open={showRoleAssignmentModal}
        onClose={() => {
          setShowRoleAssignmentModal(false)
          setSelectedUserForRole('')
          setSelectedRoleForAssignment('')
          setEditingUserRoleId(null)
        }}
        onSubmit={handleAssignRoleToUser}
        users={users.map(u => ({
          id: u.id,
          username: u.name,
          email: u.email,
          status: u.status,
          created_at: u.registeredAt,
          is_super_admin: false
        }))}
        roles={roles}
        selectedUserId={selectedUserForRole}
        onUserChange={setSelectedUserForRole}
        selectedRoleId={selectedRoleForAssignment}
        onRoleChange={setSelectedRoleForAssignment}
        editMode={!!editingUserRoleId}
      />
    </div>
  )
}

export default UserManagement
