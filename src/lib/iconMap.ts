// Icon mapping utility for dynamic icon loading
import {
  LayoutDashboard,
  User,
  ClipboardList,
  Cog,
  Shield,
  Users,
  Key,
  LucideIcon,
} from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  profile: User,
  assignment: ClipboardList,
  module: Cog,
  role: Shield,
  users: Users,
  activation: Key,
}

export const getIconByName = (iconName: string | null): LucideIcon => {
  if (!iconName) return Cog // Default icon
  return iconMap[iconName.toLowerCase()] || Cog
}

export const availableIcons = Object.keys(iconMap)
