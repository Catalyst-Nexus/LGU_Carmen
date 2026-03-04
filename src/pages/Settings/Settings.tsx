import { useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'
import { uploadImage } from '@/services/imageUpload'
import { useState, useRef } from 'react'
import {
  Search,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Type,
  AlignJustify,
  Shield,
  LogOut,
  Eye,
  History,
  Info,
  Monitor,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react'
import * as Switch from '@radix-ui/react-switch'
import * as Select from '@radix-ui/react-select'

const Settings = () => {
  const {
    darkMode,
    compactMode,
    fontSize,
    tableDensity,
    autoLogout,
    highContrast,
    reducedMotion,
    systemLogo,
    setDarkMode,
    setCompactMode,
    setFontSize,
    setTableDensity,
    setAutoLogout,
    setHighContrast,
    setReducedMotion,
    setSystemLogo,
  } = useSettingsStore()

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  })

  const getBrowserName = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Edg')) return 'Microsoft Edge'
    if (userAgent.includes('Chrome')) return 'Google Chrome'
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    return 'Unknown Browser'
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setLogoError(null)

    const result = await uploadImage(file, 'system_logo', `logo-${Date.now()}`)

    if (result.success && result.url) {
      setSystemLogo(result.url)
    } else {
      setLogoError(result.error || 'Failed to upload logo')
    }

    setUploadingLogo(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = () => {
    setSystemLogo(null)
            {/* System Logo Upload */}
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground">System Logo</h3>
                  <p className="text-xs text-muted mt-0.5">Upload a custom logo for your application</p>
                </div>
              </div>

              {systemLogo ? (
                <div className="flex items-center gap-4 p-4 bg-background rounded-xl">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-border flex items-center justify-center">
                    <img
                      src={systemLogo}
                      alt="System Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Logo uploaded</p>
                    <p className="text-xs text-muted mt-0.5">This logo will appear in the header</p>
                  </div>
                  <button
                    onClick={handleRemoveLogo}
                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    title="Remove logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                    disabled={uploadingLogo}
                  />
                  <label
                    htmlFor="logo-upload"
                    className={cn(
                      'flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer',
                      'hover:border-primary hover:bg-primary/5 transition-colors',
                      uploadingLogo && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">
                        {uploadingLogo ? 'Uploading...' : 'Click to upload logo'}
                      </p>
                      <p className="text-xs text-muted mt-1">PNG, JPG, GIF or WebP (max 5MB)</p>
                    </div>
                  </label>
                </div>
              )}

              {logoError && (
                <div className="mt-3 p-3 rounded-lg text-xs bg-danger/10 text-danger border border-danger/20">
                  {logoError}
                </div>
              )}
            </div>
    setLogoError(null)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your application preferences</p>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            className="w-full pl-11 pr-4 py-3 border border-border rounded-xl text-sm bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-primary"
            placeholder="Search settings..."
          />
        </div>

        {/* Appearance Section */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-600">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Appearance</h2>
          </div>

          <div className="divide-y divide-border">
            {/* Dark Mode */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 text-amber-600">
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Dark Mode</h3>
                  <p className="text-xs text-muted mt-0.5">Switch to dark theme</p>
                </div>
              </div>
              <Switch.Root
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  darkMode ? 'bg-success' : 'bg-border'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-5 h-5 bg-white rounded-full shadow transition-transform',
                    darkMode ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </Switch.Root>
            </div>

            {/* Compact Mode */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-pink-100 text-pink-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Compact Mode</h3>
                  <p className="text-xs text-muted mt-0.5">Reduce spacing and padding for more content</p>
                </div>
              </div>
              <Switch.Root
                checked={compactMode}
                onCheckedChange={setCompactMode}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  compactMode ? 'bg-success' : 'bg-border'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-5 h-5 bg-white rounded-full shadow transition-transform',
                    compactMode ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </Switch.Root>
            </div>

            {/* Font Size */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Font Size</h3>
                  <p className="text-xs text-muted mt-0.5">Adjust text size across the application</p>
                </div>
              </div>
              <Select.Root value={fontSize} onValueChange={(v) => setFontSize(v as 'small' | 'medium' | 'large')}>
                <Select.Trigger className="inline-flex items-center justify-between gap-2 px-4 py-2 min-w-32 border border-border rounded-lg text-sm font-medium bg-background text-foreground hover:bg-border/50 transition-colors">
                  <Select.Value />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <Select.Viewport className="p-1">
                      <Select.Item value="small" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Small</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="medium" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Medium</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="large" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Large</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>

            {/* Table Density */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 text-green-600">
                  <AlignJustify className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Table Density</h3>
                  <p className="text-xs text-muted mt-0.5">Control row spacing in tables</p>
                </div>
              </div>
              <Select.Root value={tableDensity} onValueChange={(v) => setTableDensity(v as 'comfortable' | 'standard' | 'compact')}>
                <Select.Trigger className="inline-flex items-center justify-between gap-2 px-4 py-2 min-w-32 border border-border rounded-lg text-sm font-medium bg-background text-foreground hover:bg-border/50 transition-colors">
                  <Select.Value />
                  <Select.Icon />
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="bg-surface border border-border rounded-lg shadow-lg z-50 overflow-hidden">
                    <Select.Viewport className="p-1">
                      <Select.Item value="comfortable" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Comfortable</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="standard" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Standard</Select.ItemText>
                      </Select.Item>
                      <Select.Item value="compact" className="px-3 py-2 text-sm text-foreground rounded cursor-pointer hover:bg-background outline-none">
                        <Select.ItemText>Compact</Select.ItemText>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>
            </div>
          </div>
        </section>

        {/* Session & Security Section */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 text-red-600">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Session & Security</h2>
          </div>

          <div className="divide-y divide-border">
            {/* Auto Logout */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-orange-100 text-orange-600">
                  <LogOut className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Auto Logout</h3>
                  <p className="text-xs text-muted mt-0.5">Automatically log out after 15 minutes of inactivity</p>
                </div>
              </div>
              <Switch.Root
                checked={autoLogout}
                onCheckedChange={setAutoLogout}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  autoLogout ? 'bg-success' : 'bg-border'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-5 h-5 bg-white rounded-full shadow transition-transform',
                    autoLogout ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </Switch.Root>
            </div>
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
              <Eye className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">Accessibility</h2>
          </div>

          <div className="divide-y divide-border">
            {/* High Contrast */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-100 text-yellow-600">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">High Contrast</h3>
                  <p className="text-xs text-muted mt-0.5">Increase color contrast for better visibility</p>
                </div>
              </div>
              <Switch.Root
                checked={highContrast}
                onCheckedChange={setHighContrast}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  highContrast ? 'bg-success' : 'bg-border'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-5 h-5 bg-white rounded-full shadow transition-transform',
                    highContrast ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </Switch.Root>
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-100 text-cyan-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Reduced Motion</h3>
                  <p className="text-xs text-muted mt-0.5">Minimize animations and transitions</p>
                </div>
              </div>
              <Switch.Root
                checked={reducedMotion}
                onCheckedChange={setReducedMotion}
                className={cn(
                  'w-11 h-6 rounded-full transition-colors relative',
                  reducedMotion ? 'bg-success' : 'bg-border'
                )}
              >
                <Switch.Thumb
                  className={cn(
                    'block w-5 h-5 bg-white rounded-full shadow transition-transform',
                    reducedMotion ? 'translate-x-5.5' : 'translate-x-0.5'
                  )}
                />
              </Switch.Root>
            </div>
          </div>
        </section>

        {/* System Information Section */}
        <section className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 text-gray-600">
              <Info className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-semibold text-primary">System Information</h2>
          </div>

          <div className="divide-y divide-border">
            <div className="flex items-center justify-between p-5">
              <span className="text-sm text-muted">Current Theme</span>
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-sm text-muted">Application Version</span>
              <span className="text-sm font-medium text-foreground">v2.0.0</span>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-sm text-muted">Last Updated</span>
              <span className="text-sm font-medium text-foreground">{currentDate}</span>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-sm text-muted">Browser</span>
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Monitor className="w-4 h-4" />
                {getBrowserName()}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Settings
