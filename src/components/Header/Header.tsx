import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore, useSettingsStore } from '@/store'
import { cn } from '@/lib/utils'
import { Search, Bell, User, Settings, LogOut, X } from 'lucide-react'

const Header = () => {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const systemLogo = useSettingsStore((state) => state.systemLogo)
  const navigate = useNavigate()
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-surface px-6 py-4 border-b border-border">
      {/* Logo and Search */}
      <div className="flex items-center gap-6">
        {/* System Logo */}
        {systemLogo && (
          <div className="flex items-center justify-center w-10 h-10 rounded-lg overflow-hidden bg-white border border-border">
            <img
              src={systemLogo}
              alt="System Logo"
              className="w-full h-full object-contain"
            />
          </div>
        )}
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-4 py-2.5 min-w-[300px]">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-5">
        {/* Notifications */}
        <button
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border hover:bg-border transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-muted" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-full',
              'bg-gradient-to-br from-primary to-primary-light',
              'text-white font-semibold text-sm cursor-pointer overflow-hidden',
              'hover:scale-105 hover:shadow-lg transition-all duration-200'
            )}
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{user?.username ? getInitials(user.username) : 'U'}</span>
            )}
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-full right-0 mt-3 w-60 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-background border-b border-border">
                <div className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-full overflow-hidden',
                  'bg-gradient-to-br from-primary to-primary-light text-white font-semibold text-lg'
                )}>
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.username || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user?.username ? getInitials(user.username) : 'U'}</span>
                  )}
                </div>
                <button
                  className="flex items-center justify-center w-7 h-7 rounded hover:bg-border transition-colors text-muted"
                  onClick={() => setShowProfileMenu(false)}
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors"
                  onClick={() => {
                    navigate('/dashboard/profile')
                    setShowProfileMenu(false)
                  }}
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-background transition-colors"
                  onClick={() => {
                    navigate('/dashboard/settings')
                    setShowProfileMenu(false)
                  }}
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>

                <div className="h-px bg-border my-2" />

                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
