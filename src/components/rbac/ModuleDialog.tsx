import { BaseDialog, FormInput } from '@/components/ui/dialog'

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
              {icon.charAt(0).toUpperCase() + icon.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </BaseDialog>
  )
}

export default ModuleDialog
