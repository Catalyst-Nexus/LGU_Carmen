import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router'
import { useSettingsStore, useAuthStore } from '@/store'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getIconByName } from '@/lib/iconMap'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Cog,
  Shield,
  Users,
  Key,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react'

interface Module {
  id: string
  module_name: string
  route_path: string
  icons: string | null
  is_active: boolean
}

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
  const user = useAuthStore((state) => state.user)

  const [dynamicModules, setDynamicModules] = useState<Module[]>([])
  const [menuSections, setMenuSections] = useState<MenuSection[]>([])

  // Static menu sections
  const staticSections: MenuSection[] = [
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
    {
      title: 'AUTH',
      items: [
        { to: '/dashboard/user-activation', icon: Key, label: 'User Activation' },
      ],
    },
  ]

  // Fetch dynamic modules on mount
  useEffect(() => {
    fetchDynamicModules()
    
    // Subscribe to real-time changes
    if (isSupabaseConfigured() && supabase) {
      const subscription = supabase
        .channel('modules_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
          fetchDynamicModules()
        })
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [])

  const fetchDynamicModules = async () => {
    try {
      if (!isSupabaseConfigured() || !supabase || !user) {
        console.log('Supabase not configured or user not logged in')
        return
      }

      // Step 1: Get user's roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', user.id)

      if (userRolesError) {
        console.error('Error fetching user roles:', userRolesError)
        return
      }

      const roleIds = userRoles?.map((ur) => ur.role_id) || []

      if (roleIds.length === 0) {
        console.log('User has no roles assigned')
        setDynamicModules([])
        setMenuSections([...staticSections])
        return
      }

      // Step 2: Get permissions for those roles
      const { data: rolePermissions, error: rolesPermError } = await supabase
        .from('role_permission')
        .select('permission_id')
        .in('role_id', roleIds)

      if (rolesPermError) {
        console.error('Error fetching role permissions:', rolesPermError)
        return
      }

      const permissionIds = rolePermissions?.map((rp) => rp.permission_id) || []

      if (permissionIds.length === 0) {
        console.log('User roles have no permissions')
        setDynamicModules([])
        setMenuSections([...staticSections])
        return
      }

      // Step 3: Get permission details including module_id
      const { data: permissions, error: permsError } = await supabase
        .from('permissions')
        .select('module_id')
        .in('id', permissionIds)

      if (permsError) {
        console.error('Error fetching permissions:', permsError)
        return
      }

      const moduleIds = [...new Set(permissions?.map((p) => p.module_id) || [])]

      if (moduleIds.length === 0) {
        console.log('No modules associated with user permissions')
        setDynamicModules([])
        setMenuSections([...staticSections])
        return
      }

      // Step 4: Get the actual modules
      const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .in('id', moduleIds)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (modulesError) {
        console.error('Error fetching modules:', modulesError)
        return
      }

      setDynamicModules(modules || [])

      // Build complete menu with dynamic modules
      const dynamicSection: MenuSection = {
        title: 'ROLE-BASED ACCESS CONTROL',
        items: (modules || []).map((module) => ({
          to: module.route_path,
          icon: getIconByName(module.icons),
          label: module.module_name,
        })),
      }

      // Combine static and dynamic sections
      const combinedSections = [...staticSections]
      if (dynamicSection.items.length > 0) {
        combinedSections.splice(2, 0, dynamicSection) // Insert before AUTH section
      }

      setMenuSections(combinedSections)
    } catch (err) {
      console.error('Error in fetchDynamicModules:', err)
    }
  }

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
          <span className="text-xl font-bold text-primary">Animal Farm</span>
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
