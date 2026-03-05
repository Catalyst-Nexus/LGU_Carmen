import { useState, useEffect } from 'react'
import { PageHeader, StatsRow, StatCard, ActionsBar, PrimaryButton } from '@/components/ui'
import { Settings, RefreshCw, Save } from 'lucide-react'
import { 
  fetchRoles, 
  fetchModules, 
  getRoleModules, 
  assignModulesToRole, 
  type Role, 
  type Module 
} from '@/services/rbacService'

const RoleModuleAccessManagement = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedModules, setSelectedModules] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Load roles and modules on mount
  useEffect(() => {
    loadData()
  }, [])

  // Load assigned modules when role selection changes
  useEffect(() => {
    if (selectedRoleId) {
      loadRoleModules(selectedRoleId)
    } else {
      setSelectedModules([])
    }
  }, [selectedRoleId])

  const loadData = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [fetchedRoles, fetchedModules] = await Promise.all([
        fetchRoles(),
        fetchModules()
      ])
      setRoles(fetchedRoles)
      setModules(fetchedModules)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRoleModules = async (roleId: string) => {
    try {
      const roleModules = await getRoleModules(roleId)
      setSelectedModules(roleModules.map((m) => m.id))
    } catch (err) {
      console.error('Error loading role modules:', err)
      setSelectedModules([])
    }
  }

  const handleModuleToggle = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    )
  }

  const handleSave = async () => {
    if (!selectedRoleId) {
      setError('Please select a role first')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccess('')
    try {
      const result = await assignModulesToRole(selectedRoleId, selectedModules)
      if (result.success) {
        setSuccess('Module access updated successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(result.error || 'Failed to update module access')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Role Module Access"
        subtitle="Assign modules and permissions to roles"
        icon={<Settings className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Roles" value={roles.length} />
        <StatCard label="Total Modules" value={modules.length} />
        <StatCard 
          label="Selected Modules" 
          value={selectedModules.length}
          color={selectedModules.length > 0 ? 'success' : 'warning'}
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Refresh'}
        </PrimaryButton>
      </ActionsBar>

      {error && (
        <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="px-4 py-3 bg-success/10 border border-success/20 rounded-lg text-sm text-success">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Role Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Select Role</h3>
            <select
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              disabled={isLoading}
            >
              <option value="">-- Choose a role --</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>

            {selectedRole && (
              <div className="text-sm space-y-1 pt-3 border-t border-border">
                <p className="text-muted">Selected:</p>
                <p className="font-medium text-foreground">{selectedRole.role_name}</p>
                <p className="text-xs text-muted uppercase">{selectedRole.role_code}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modules List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Available Modules</h3>
              <span className="text-xs font-medium text-muted bg-background px-2 py-1 rounded">
                {selectedModules.length} selected
              </span>
            </div>

            {isLoading ? (
              <p className="text-center text-muted py-8">Loading modules...</p>
            ) : modules.length === 0 ? (
              <p className="text-center text-muted py-8">No modules available</p>
            ) : (
              <div className="space-y-3">
                {modules.map((module) => (
                  <label
                    key={module.id}
                    className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-background/50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedModules.includes(module.id)}
                      onChange={() => handleModuleToggle(module.id)}
                      disabled={!selectedRoleId || isLoading}
                      className="w-4 h-4 rounded border-border text-success"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{module.module_name}</p>
                      <p className="text-xs text-muted truncate">{module.route_path}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedRoleId && (
            <div className="flex justify-end gap-3">
              <PrimaryButton onClick={handleSave}>
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoleModuleAccessManagement
