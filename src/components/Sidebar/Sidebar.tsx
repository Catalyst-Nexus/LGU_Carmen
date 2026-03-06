import { useMemo } from 'react'
import { Link, useLocation } from 'react-router'
import { useSettingsStore } from '@/store'
import { useRBAC } from '@/contexts/RBACContext'
import { getIconByName } from '@/lib/iconMap'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react'

interface MenuItem {
  to: string
  icon: LucideIcon
  label: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const Sidebar = () => {
  const location = useLocation()
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed)
  const compactMode = useSettingsStore((state) => state.compactMode)
  const systemLogo = useSettingsStore((state) => state.systemLogo)
  
  // Get modules from RBAC context
  const { userModules } = useRBAC()

  // Static menu sections
  const staticSections: MenuSection[] = useMemo(() => [
    {
      title: 'MAIN',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      ],
    },
    {
      title: 'USER',
      items: [
        { to: '/dashboard/profile', icon: User, label: 'User Profile' },
      ],
    },
  ], [])

  // Build dynamic sections from RBAC user modules grouped by category
  const dynamicSections: MenuSection[] = useMemo(() => {
    if (userModules.length === 0) return []
    
    // Group modules by category
    const grouped = userModules.reduce((acc, module) => {
      const category = module.category || 'MODULES'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push({
        to: module.route_path,
        icon: getIconByName(module.icons),
        label: module.module_name,
      })
      return acc
    }, {} as Record<string, MenuItem[]>)
    
    // Convert to MenuSection array
    return Object.entries(grouped).map(([title, items]) => ({
      title: title.toUpperCase(),
      items,
    }))
  }, [userModules])

  // Combine static and dynamic sections
  const menuSections: MenuSection[] = useMemo(() => {
    return [...staticSections, ...dynamicSections]
  }, [staticSections, dynamicSections])

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2.5 border-b border-border',
        compactMode ? 'px-3 py-4' : 'px-5 py-6',
        sidebarCollapsed && 'justify-center px-2'
      )}>
        {systemLogo ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-border shrink-0 flex items-center justify-center">
            <img
              src={systemLogo}
              alt="System Logo"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg shrink-0" />
        )}
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-primary">LGU Ims System</span>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-2">
            {!sidebarCollapsed && (
              <div className={cn(
                'px-3 text-xs font-semibold uppercase tracking-wider text-muted',
                compactMode ? 'py-3' : 'py-5'
              )}>
                {section.title}
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to

                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                        compactMode ? 'px-3 py-2' : 'px-4 py-3',
                        sidebarCollapsed && 'justify-center px-2',
                        isActive
                          ? 'bg-success text-white'
                          : 'text-foreground hover:bg-background'
                      )}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 z-50',
          'flex items-center justify-center w-6 h-6 rounded-full',
          'bg-success text-white cursor-pointer',
          'hover:bg-success/90 transition-colors shadow-md'
        )}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}

export default Sidebar
