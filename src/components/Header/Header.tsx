import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const { user, logout } = useAuth()
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
    <div className="header">
      <div className="header-left">
        <div className="header-search">
          <span className="header-search-icon">🔍</span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
      </div>
      <div className="header-user">
        <button className="header-notification" aria-label="Notifications">
          🔔
        </button>
        <div className="header-profile-wrapper" ref={profileMenuRef}>
          <div 
            className="header-avatar"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            {user?.username ? getInitials(user.username) : 'U'}
          </div>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-dropdown-header">
                <div className="profile-dropdown-avatar">
                  {user?.username ? getInitials(user.username) : 'U'}
                </div>
                <button 
                  className="profile-dropdown-close"
                  onClick={() => setShowProfileMenu(false)}
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              
              <div className="profile-dropdown-menu">
                <button 
                  className="profile-dropdown-item"
                  onClick={() => {
                    navigate('/dashboard/profile')
                    setShowProfileMenu(false)
                  }}
                >
                  <span className="profile-dropdown-icon">👤</span>
                  <span>My Profile</span>
                </button>
                
                <button 
                  className="profile-dropdown-item"
                  onClick={() => {
                    navigate('/dashboard/settings')
                    setShowProfileMenu(false)
                  }}
                >
                  <span className="profile-dropdown-icon">⚙️</span>
                  <span>Settings</span>
                </button>
                
                <div className="profile-dropdown-divider"></div>
                
                <button 
                  className="profile-dropdown-item profile-dropdown-logout"
                  onClick={handleLogout}
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Header
