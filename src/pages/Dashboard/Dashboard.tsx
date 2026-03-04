import { Routes, Route, Link } from 'react-router'
import { lazy, Suspense } from 'react'
import Layout from '@/components/Layout/Layout'
import { useRBAC } from '@/contexts/RBACContext'
import UserProfile from '../UserProfile/UserProfile'
import Settings from '../Settings/Settings'

import { cn } from '@/lib/utils'
import {
  Users,
  Shield,
  ClipboardList,
  Zap,
  User,
  Settings as SettingsIcon,
  Key,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from 'lucide-react'

const colorClasses = {
  blue: {
    gradient: 'from-blue-500 to-blue-400',
    light: 'bg-blue-50 text-blue-500',
    bar: 'bg-gradient-to-r from-blue-500 to-blue-400',
  },
  green: {
    gradient: 'from-green-500 to-green-400',
    light: 'bg-green-50 text-green-500',
    bar: 'bg-gradient-to-r from-green-500 to-green-400',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-400',
    light: 'bg-purple-50 text-purple-500',
    bar: 'bg-gradient-to-r from-purple-500 to-purple-400',
  },
  orange: {
    gradient: 'from-orange-500 to-orange-400',
    light: 'bg-orange-50 text-orange-500',
    bar: 'bg-gradient-to-r from-orange-500 to-orange-400',
  },
  teal: {
    gradient: 'from-teal-500 to-teal-400',
    light: 'bg-teal-50 text-teal-500',
    bar: 'bg-gradient-to-r from-teal-500 to-teal-400',
  },
  pink: {
    gradient: 'from-pink-500 to-pink-400',
    light: 'bg-pink-50 text-pink-500',
    bar: 'bg-gradient-to-r from-pink-500 to-pink-400',
  },
}

const DashboardHome = () => {
  // TODO: Replace with API call to fetch dashboard stats
  const stats = [
    {
      icon: Users,
      value: '0',
      label: 'Total Users',
      trend: '+12%',
      trendUp: true,
      color: 'blue' as const,
    },
    {
      icon: Shield,
      value: '0',
      label: 'Active Roles',
      trend: '+3%',
      trendUp: true,
      color: 'green' as const,
    },
    {
      icon: ClipboardList,
      value: '0',
      label: 'Facilities',
      trend: '-2%',
      trendUp: false,
      color: 'purple' as const,
    },
    {
      icon: Zap,
      value: '0',
      label: 'Dynamic Modules',
      trend: '+8%',
      trendUp: true,
      color: 'orange' as const,
    },
  ]

  const quickLinks = [
    {
      to: '/dashboard/profile',
      icon: User,
      text: 'User Profile',
      description: 'View and edit your profile',
      color: 'green' as const,
    },
    {
      to: '/dashboard/facilities',
      icon: ClipboardList,
      text: 'Facilities Management',
      description: 'Manage facilities',
      color: 'purple' as const,
    },
    {
      to: '/dashboard/dynamic',
      icon: Zap,
      text: 'Module Management',
      description: 'Configure system modules',
      color: 'orange' as const,
    },
    {
      to: '/dashboard/rbac',
      icon: Shield,
      text: 'Role Management',
      description: 'Manage roles and permissions',
      color: 'blue' as const,
    },
    {
      to: '/dashboard/user-management',
      icon: Users,
      text: 'User Management',
      description: 'Manage system users',
      color: 'teal' as const,
    },
    {
      to: '/dashboard/user-activation',
      icon: Key,
      text: 'User Activation',
      description: 'Activate or deactivate users',
      color: 'pink' as const,
    },
  ]

  const recentActivities = [
    {
      icon: UserPlus,
      title: 'New user registered',
      description: 'John Doe joined the system',
      time: '2 minutes ago',
      type: 'success' as const,
    },
    {
      icon: CheckCircle,
      title: 'Role updated',
      description: 'Admin role permissions modified',
      time: '1 hour ago',
      type: 'info' as const,
    },
    {
      icon: AlertCircle,
      title: 'Login attempt failed',
      description: 'Multiple failed login attempts detected',
      time: '3 hours ago',
      type: 'warning' as const,
    },
  ]

  const activityColors = {
    success: 'bg-green-50 text-green-500',
    info: 'bg-blue-50 text-blue-500',
    warning: 'bg-orange-50 text-orange-500',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">
            Dashboard Overview
          </h1>
          <p className="text-muted text-sm">
            Welcome back! Here's what's happening in your system.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-muted font-medium">
          <Calendar className="w-4 h-4 text-success" />
          <span>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          const colors = colorClasses[stat.color]

          return (
            <div
              key={index}
              className="relative bg-surface border border-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Top gradient bar */}
              <div className={cn('absolute top-0 inset-x-0 h-1 bg-gradient-to-r', colors.gradient)} />

              <div className="flex items-start justify-between mb-5">
                <div className={cn('flex items-center justify-center w-13 h-13 rounded-xl text-2xl', colors.light)}>
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold',
                    stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  )}
                >
                  {stat.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{stat.trend}</span>
                </div>
              </div>

              <div className="text-4xl font-extrabold text-primary tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted font-medium mb-4">
                {stat.label}
              </div>

              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div className={cn('h-full w-2/3 rounded-full', colors.bar)} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Quick Links */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary">
              <SettingsIcon className="w-5 h-5" />
              Quick Actions
            </h2>
            <span className="px-3 py-1 bg-background rounded-full text-xs font-semibold text-muted">
              {quickLinks.length} modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon
              const colors = colorClasses[link.color]

              return (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-success hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
                >
                  <div className={cn('flex items-center justify-center w-11 h-11 rounded-lg', colors.light)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground truncate">
                      {link.text}
                    </span>
                    <span className="block text-xs text-muted truncate">
                      {link.description}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted group-hover:text-success group-hover:translate-x-1 transition-all" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
            <button className="text-sm font-medium text-success hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl"
                >
                  <div className={cn('flex items-center justify-center w-10 h-10 rounded-lg shrink-0', activityColors[activity.type])}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {activity.title}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {activity.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Component Registry for dynamic routes
const componentRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'views/rbac/UserActivation': lazy(() => import('@/views/rbac/UserActivation')),
  'views/rbac/RoleManagement': lazy(() => import('@/views/rbac/RoleManagement')),
  'views/rbac/UserManagement': lazy(() => import('@/views/rbac/UserManagement')),
  'views/rbac/ModuleManagement': lazy(() => import('@/views/rbac/ModuleManagement')),
  'views/rbac/FacilitiesManagement': lazy(() => import('@/views/rbac/FacilitiesManagement')),
  // Add your custom module components here
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
      <p className="text-muted">Loading module...</p>
    </div>
  </div>
)

const Dashboard = () => {
  const { userModules } = useRBAC()
  
  // Get dynamic routes from modules that have valid file_path
  const dynamicRoutes = userModules
    .filter(module => module.file_path && module.file_path in componentRegistry)
    .map(module => ({
      path: module.route_path.replace(/^\/dashboard/, ''),
      Component: componentRegistry[module.file_path!],
    }))

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />
        
        {/* Dynamic routes from database modules */}
        {dynamicRoutes.map(({ path, Component }) => (
          <Route
            key={path}
            path={path}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Component />
              </Suspense>
            }
          />
        ))}
      </Routes>
    </Layout>
  )
}

export default Dashboard
