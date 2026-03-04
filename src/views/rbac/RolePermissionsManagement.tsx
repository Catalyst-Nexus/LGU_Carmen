import { useState, useEffect, useCallback, useMemo } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton } from '@/components/ui'
import { BaseDialog } from '@/components/ui/dialog'
import { Shield, RefreshCw, Search, Pencil, Trash2 } from 'lucide-react'
import {
  fetchRoles,
  getRolePermissions,
  fetchModules,
  upsertRolePermission,
  deleteRolePermission,
  type Role,
  type RolePermission,
  type Module,
} from '@/services/rbacService'

const RolePermissionManagement = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [rolePermissions, setRolePermissions] = useState<Map<string, RolePermission[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Search state
  const [roleSearch, setRoleSearch] = useState('')
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())

  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingPermission, setEditingPermission] = useState<RolePermission | null>(null)
  const [dialogRoleId, setDialogRoleId] = useState('')
  const [dialogModuleIds, setDialogModuleIds] = useState<string[]>([])
  const [dialogModuleSearch, setDialogModuleSearch] = useState('')
  const [dialogCanSelect, setDialogCanSelect] = useState(false)
  const [dialogCanInsert, setDialogCanInsert] = useState(false)
  const [dialogCanUpdate, setDialogCanUpdate] = useState(false)
  const [dialogCanDelete, setDialogCanDelete] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [r, m] = await Promise.all([fetchRoles(), fetchModules()])
      setRoles(r)
      setModules(m)

      // Load permissions for all roles
      const permMap = new Map<string, RolePermission[]>()
      await Promise.all(
        r.map(async (role) => {
          const perms = await getRolePermissions(role.id)
          permMap.set(role.id, perms)
        })
      )
      setRolePermissions(permMap)

      // Expand all roles by default
      setExpandedRoles(new Set(r.map(role => role.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const getModuleName = useCallback((moduleId: string) =>
    modules.find(m => m.id === moduleId)?.module_name ?? moduleId, [modules])

  const getModuleRoutePath = useCallback((moduleId: string) =>
    modules.find(m => m.id === moduleId)?.route_path ?? '', [modules])

  // Filter roles by search
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return roles
    const q = roleSearch.toLowerCase()
    return roles.filter(r =>
      r.role_name.toLowerCase().includes(q) ||
      r.role_code.toLowerCase().includes(q)
    )
  }, [roles, roleSearch])

  // Get modules available for adding (not already assigned to role)
  const getAvailableModules = useCallback((roleId: string) => {
    const existingModuleIds = rolePermissions.get(roleId)?.map(p => p.module_id) || []
    return modules.filter(m => !existingModuleIds.includes(m.id))
  }, [modules, rolePermissions])

  // Filter modules in dialog
  const filteredDialogModules = useMemo(() => {
    const available = editingPermission
      ? modules // When editing, show all modules
      : getAvailableModules(dialogRoleId)

    if (!dialogModuleSearch.trim()) return available
    const q = dialogModuleSearch.toLowerCase()
    return available.filter(m =>
      m.module_name.toLowerCase().includes(q) ||
      m.route_path.toLowerCase().includes(q)
    )
  }, [modules, dialogRoleId, dialogModuleSearch, editingPermission, getAvailableModules])

  const toggleRole = (roleId: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev)
      if (next.has(roleId)) {
        next.delete(roleId)
      } else {
        next.add(roleId)
      }
      return next
    })
  }

  const openAddDialog = (roleId: string) => {
    setDialogRoleId(roleId)
    setDialogModuleIds([])
    setDialogModuleSearch('')
    setDialogCanSelect(false)
    setDialogCanInsert(false)
    setDialogCanUpdate(false)
    setDialogCanDelete(false)
    setEditingPermission(null)
    setShowDialog(true)
  }

  const openEditDialog = (roleId: string, perm: RolePermission) => {
    setDialogRoleId(roleId)
    setDialogModuleIds([perm.module_id])
    setDialogModuleSearch('')
    setDialogCanSelect(perm.can_select)
    setDialogCanInsert(perm.can_insert)
    setDialogCanUpdate(perm.can_update)
    setDialogCanDelete(perm.can_delete)
    setEditingPermission(perm)
    setShowDialog(true)
  }

  const handleDialogModuleToggle = (moduleId: string) => {
    if (editingPermission) return // Can't change module when editing
    setDialogModuleIds(prev =>
      prev.includes(moduleId)
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    )
  }

  const handleSavePermission = async () => {
    if (dialogModuleIds.length === 0) {
      setError('Please select at least one module')
      return
    }
    if (!dialogCanSelect && !dialogCanInsert && !dialogCanUpdate && !dialogCanDelete) {
      setError('Please select at least one permission')
      return
    }

    setIsSaving(true)
    setError('')
    try {
      // Save permission for each selected module
      for (const moduleId of dialogModuleIds) {
        const result = await upsertRolePermission(dialogRoleId, moduleId, {
          can_select: dialogCanSelect,
          can_insert: dialogCanInsert,
          can_update: dialogCanUpdate,
          can_delete: dialogCanDelete,
        })
        if (!result.success) {
          setError(result.error || 'Failed to save permission')
          setIsSaving(false)
          return
        }
      }

      setSuccess('Permission(s) saved successfully')
      setTimeout(() => setSuccess(''), 3000)
      setShowDialog(false)
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeletePermission = async (roleId: string, moduleId: string) => {
    if (!window.confirm('Are you sure you want to remove this module access?')) return

    try {
      const result = await deleteRolePermission(roleId, moduleId)
      if (result.success) {
        setSuccess('Module access removed')
        setTimeout(() => setSuccess(''), 3000)
        await loadData()
      } else {
        setError(result.error || 'Failed to remove permission')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const totalPermissions = Array.from(rolePermissions.values()).reduce((acc, perms) => acc + perms.length, 0)

  const getRoleName = (roleId: string) => roles.find(r => r.id === roleId)?.role_name ?? ''

  const PermissionBadge = ({ enabled, label }: { enabled: boolean; label: string }) => (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${
      enabled
        ? 'bg-success/10 text-success border-success/30'
        : 'bg-muted/10 text-muted border-border opacity-50'
    }`}>
      {label}
    </span>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Permissions"
        subtitle="Manage module access and CRUD permissions for each role"
        icon={<Shield className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Roles" value={roles.length} />
        <StatCard label="Total Modules" value={modules.length} />
        <StatCard
          label="Total Assignments"
          value={totalPermissions}
          color={totalPermissions > 0 ? 'success' : 'warning'}
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={loadData} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">{success}</div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Search roles..."
          value={roleSearch}
          onChange={(e) => setRoleSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
        />
      </div>

      {/* Roles & Permissions List */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-background/50 border-b border-border">
          <div className="col-span-2 text-sm font-semibold text-foreground">Role</div>
          <div className="col-span-9 text-sm font-semibold text-foreground">Modules & Permissions</div>
          <div className="col-span-1 text-sm font-semibold text-foreground text-right">Actions</div>
        </div>

        {/* Body */}
        {isLoading ? (
          <div className="px-6 py-12 text-center text-muted">Loading...</div>
        ) : filteredRoles.length === 0 ? (
          <div className="px-6 py-12 text-center text-muted">No roles found</div>
        ) : (
          filteredRoles.map((role) => {
            const perms = rolePermissions.get(role.id) || []
            const isExpanded = expandedRoles.has(role.id)

            return (
              <div key={role.id} className="border-b border-border last:border-0">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-background/30">
                  {/* Role info */}
                  <div className="col-span-2">
                    <button
                      onClick={() => toggleRole(role.id)}
                      className="text-left w-full"
                    >
                      <p className="font-semibold text-foreground">{role.role_name}</p>
                      <p className="text-xs text-muted">{perms.length} modules</p>
                    </button>
                  </div>

                  {/* Modules & Permissions */}
                  <div className="col-span-9 space-y-3">
                    {perms.length === 0 ? (
                      <p className="text-sm text-muted italic">No modules assigned</p>
                    ) : isExpanded ? (
                      perms.map((perm) => (
                        <div
                          key={perm.module_id}
                          className="flex items-center gap-4 p-3 bg-background/50 rounded-lg border border-border/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {getModuleName(perm.module_id)}
                            </p>
                            <p className="text-xs text-muted truncate">
                              {getModuleRoutePath(perm.module_id)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <PermissionBadge enabled={perm.can_insert} label="Create" />
                            <PermissionBadge enabled={perm.can_select} label="Read" />
                            <PermissionBadge enabled={perm.can_update} label="Update" />
                            <PermissionBadge enabled={perm.can_delete} label="Delete" />
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openEditDialog(role.id, perm)}
                              className="p-1.5 rounded hover:bg-primary/10 text-primary transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePermission(role.id, perm.module_id)}
                              className="p-1.5 rounded hover:bg-danger/10 text-muted hover:text-danger transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted">
                        Click to expand {perms.length} module(s)
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => openAddDialog(role.id)}
                      className="px-3 py-1.5 text-xs font-medium text-success border border-success/30 rounded-lg hover:bg-success/10 transition-colors"
                    >
                      Add Module
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add/Edit Dialog */}
      <BaseDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        title={editingPermission
          ? `Edit Module Access for Role: ${getRoleName(dialogRoleId)}`
          : `Create Module Access for Role: ${getRoleName(dialogRoleId)}`
        }
        onSubmit={handleSavePermission}
        submitLabel={editingPermission ? 'Save Changes' : 'Create Access Rule'}
        isLoading={isSaving}
      >
        <div className="space-y-5">
          {/* Module Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              {editingPermission ? 'Module' : 'Modules (select one or more)'}
            </label>

            {editingPermission ? (
              <div className="px-3 py-2 bg-background border border-border rounded-lg text-sm text-muted">
                {getModuleName(editingPermission.module_id)}
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    placeholder="Search modules..."
                    value={dialogModuleSearch}
                    onChange={(e) => setDialogModuleSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-border rounded-lg">
                  {filteredDialogModules.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-muted text-center">
                      No available modules
                    </p>
                  ) : (
                    filteredDialogModules.map((mod) => (
                      <label
                        key={mod.id}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-background/70 cursor-pointer border-b border-border/50 last:border-0"
                      >
                        <input
                          type="checkbox"
                          checked={dialogModuleIds.includes(mod.id)}
                          onChange={() => handleDialogModuleToggle(mod.id)}
                          className="w-4 h-4 rounded border-border text-success"
                        />
                        <span className="text-sm text-foreground">{mod.module_name}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">Permissions</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dialogCanSelect}
                  onChange={(e) => setDialogCanSelect(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-success"
                />
                <span className="text-sm text-foreground">Select (Read)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dialogCanInsert}
                  onChange={(e) => setDialogCanInsert(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-success"
                />
                <span className="text-sm text-foreground">Insert (Create)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dialogCanUpdate}
                  onChange={(e) => setDialogCanUpdate(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-success"
                />
                <span className="text-sm text-foreground">Update (Modify)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dialogCanDelete}
                  onChange={(e) => setDialogCanDelete(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-success"
                />
                <span className="text-sm text-foreground">Delete (Remove)</span>
              </label>
            </div>
          </div>
        </div>
      </BaseDialog>
    </div>
  )
}

export default RolePermissionManagement
