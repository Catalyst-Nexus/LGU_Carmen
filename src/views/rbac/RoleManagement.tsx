import { useState, useEffect } from 'react'
import { RoleList, RoleDialog } from '@/components/rbac'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton } from '@/components/ui'
import { Shield, Plus } from 'lucide-react'
import { supabase } from '@/services/supabase'

interface Role {
  id: string
  role_name: string
  role_code: string
  created_at: string
}

const RoleManagement = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [roleCode, setRoleCode] = useState('')
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)

  // Load roles on mount
  useEffect(() => {
    loadRoles()
  }, [])

  const loadRoles = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      return
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoles(data || [])
    } catch (error) {
      console.error('Error loading roles:', error)
    }
  }

  const handleCreate = async () => {
    if (!roleName.trim() || !roleCode.trim()) {
      alert('Please fill in all fields')
      return
    }

    if (!supabase) {
      alert('Supabase is not configured')
      return
    }

    try {
      if (editingRoleId) {
        // Update existing role
        const { error } = await supabase
          .from('roles')
          .update({
            role_name: roleName,
            role_code: roleCode.toUpperCase(),
          })
          .eq('id', editingRoleId)

        if (error) throw error
        setRoles(
          roles.map((r) =>
            r.id === editingRoleId ? { ...r, role_name: roleName, role_code: roleCode.toUpperCase() } : r
          )
        )
      } else {
        // Insert new role
        const { data, error } = await supabase
          .from('roles')
          .insert([
            {
              role_name: roleName,
              role_code: roleCode.toUpperCase(),
            },
          ])
          .select()

        if (error) {
          console.error('Supabase error:', error)
          throw error
        }
        if (data) {
          setRoles([...roles, ...data])
        }
      }

      setRoleName('')
      setRoleCode('')
      setEditingRoleId(null)
      setShowModal(false)
    } catch (error) {
      console.error('Error saving role:', error)
      alert(`Failed to save role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleEdit = (role: Role) => {
    setEditingRoleId(role.id)
    setRoleName(role.role_name)
    setRoleCode(role.role_code)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return
    }

    if (!supabase) {
      alert('Supabase is not configured')
      return
    }

    try {
      const { error } = await supabase.from('roles').delete().eq('id', id)

      if (error) throw error
      setRoles(roles.filter((r) => r.id !== id))
    } catch (error) {
      console.error('Error deleting role:', error)
      alert('Failed to delete role')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setRoleName('')
    setRoleCode('')
    setEditingRoleId(null)
  }

  const total = roles.length
  const active = roles.length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Management"
        subtitle="Manage roles in your role-based access control system"
        icon={<Shield className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Roles" value={total} />
        <StatCard label="Active Roles" value={active} color="success" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setEditingRoleId(null)
            setRoleName('')
            setRoleCode('')
            setShowModal(true)
          }}
        >
          <Plus className="w-4 h-4" />
          Create Role
        </PrimaryButton>
      </ActionsBar>

      <RoleList
        roles={roles}
        search={search}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RoleDialog
        open={showModal}
        onClose={handleCloseModal}
        onSubmit={handleCreate}
        roleName={roleName}
        onRoleNameChange={setRoleName}
        roleCode={roleCode}
        onRoleCodeChange={setRoleCode}
        editMode={editingRoleId !== null}
      />
    </div>
  )
}

export default RoleManagement
