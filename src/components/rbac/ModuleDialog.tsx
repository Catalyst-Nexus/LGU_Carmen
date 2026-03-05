import { BaseDialog, FormInput } from '@/components/ui/dialog'
import { getIconDisplayName } from '@/lib/iconMap'

interface ModuleDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  moduleName: string
  onModuleNameChange: (value: string) => void
  routePath: string
  onRoutePathChange: (value: string) => void
  selectedIcon: string
  onSelectedIconChange: (value: string) => void
  filePath: string
  onFilePathChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  isActive: boolean
  onIsActiveChange: (value: boolean) => void
  availableIcons: string[]
  isLoading?: boolean
  editMode?: boolean
}

const ModuleDialog = ({
  open,
  onClose,
  onSubmit,
  moduleName,
  onModuleNameChange,
  routePath,
  onRoutePathChange,
  selectedIcon,
  onSelectedIconChange,
  filePath,
  onFilePathChange,
  category,
  onCategoryChange,
  isActive,
  onIsActiveChange,
  availableIcons = [],
  isLoading = false,
  editMode = false,
}: ModuleDialogProps) => {
  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={editMode ? 'Edit Module' : 'Add New Module'}
      onSubmit={onSubmit}
      submitLabel={editMode ? 'Save Changes' : 'Add Module'}
      isLoading={isLoading}
    >
      <FormInput
        id="module-name"
        label="Module Name"
        placeholder="e.g., User Management, Reports"
        value={moduleName}
        onChange={onModuleNameChange}
        required
      />
      <FormInput
        id="route-path"
        label="Route Path"
        placeholder="e.g., /dashboard/user-management"
        value={routePath}
        onChange={onRoutePathChange}
        required
      />
      <FormInput
        id="file-path"
        label="File Path"
        placeholder="e.g., views/rbac/UserManagement"
        value={filePath}
        onChange={onFilePathChange}
        required
      />
      <div className="text-xs text-muted space-y-1 -mt-1">
        <p>Available component paths:</p>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>views/rbac/UserActivation</li>
          <li>views/rbac/RoleManagement</li>
          <li>views/rbac/UserManagement</li>
          <li>views/rbac/ModuleManagement</li>
          <li>views/rbac/FacilitiesManagement</li>
        </ul>
        <p className="italic">Register new components in Dashboard.tsx</p>
      </div>
      <FormInput
        id="category"
        label="Category"
        placeholder="e.g., RBAC Management, Inventory, Reports"
        value={category}
        onChange={onCategoryChange}
        required
      />
      <div className="text-xs text-muted -mt-1">
        Category name for grouping modules in the sidebar (e.g., "RBAC Management", "Inventory")
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="icon" className="text-sm font-medium text-foreground">
          Icon
        </label>
        <select
          id="icon"
          value={selectedIcon}
          onChange={(e) => onSelectedIconChange(e.target.value)}
          className="w-full px-4 py-3 border border-border rounded-lg text-sm bg-surface text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
        >
          <option value="">Select an icon</option>
          {availableIcons.map((icon) => (
            <option key={icon} value={icon}>
              {getIconDisplayName(icon)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-3">
        <input
          id="is-active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => onIsActiveChange(e.target.checked)}
          className="w-4 h-4 border border-border rounded bg-surface cursor-pointer"
        />
        <label htmlFor="is-active" className="text-sm font-medium text-foreground cursor-pointer">
          Active
        </label>
      </div>
    </BaseDialog>
  )
}

export default ModuleDialog
