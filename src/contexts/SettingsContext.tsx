import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { useNavigate } from 'react-router-dom'

interface SettingsContextType {
  darkMode: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  tableDensity: 'comfortable' | 'standard' | 'compact'
  autoLogout: boolean
  highContrast: boolean
  reducedMotion: boolean
  setDarkMode: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setFontSize: (value: 'small' | 'medium' | 'large') => void
  setTableDensity: (value: 'comfortable' | 'standard' | 'compact') => void
  setAutoLogout: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

interface SettingsProviderProps {
  children: ReactNode
}

export const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  
  // Load settings from localStorage or use defaults
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem('settings.darkMode')
    return saved ? JSON.parse(saved) : false
  })
  
  const [compactMode, setCompactModeState] = useState(() => {
    const saved = localStorage.getItem('settings.compactMode')
    return saved ? JSON.parse(saved) : false
  })
  
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>(() => {
    const saved = localStorage.getItem('settings.fontSize')
    return saved ? JSON.parse(saved) : 'medium'
  })
  
  const [tableDensity, setTableDensityState] = useState<'comfortable' | 'standard' | 'compact'>(() => {
    const saved = localStorage.getItem('settings.tableDensity')
    return saved ? JSON.parse(saved) : 'standard'
  })
  
  const [autoLogout, setAutoLogoutState] = useState(() => {
    const saved = localStorage.getItem('settings.autoLogout')
    return saved ? JSON.parse(saved) : false
  })
  
  const [highContrast, setHighContrastState] = useState(() => {
    const saved = localStorage.getItem('settings.highContrast')
    return saved ? JSON.parse(saved) : false
  })
  
  const [reducedMotion, setReducedMotionState] = useState(() => {
    const saved = localStorage.getItem('settings.reducedMotion')
    return saved ? JSON.parse(saved) : false
  })

  // Setters that also save to localStorage
  const setDarkMode = (value: boolean) => {
    setDarkModeState(value)
    localStorage.setItem('settings.darkMode', JSON.stringify(value))
  }
  
  const setCompactMode = (value: boolean) => {
    setCompactModeState(value)
    localStorage.setItem('settings.compactMode', JSON.stringify(value))
  }
  
  const setFontSize = (value: 'small' | 'medium' | 'large') => {
    setFontSizeState(value)
    localStorage.setItem('settings.fontSize', JSON.stringify(value))
  }
  
  const setTableDensity = (value: 'comfortable' | 'standard' | 'compact') => {
    setTableDensityState(value)
    localStorage.setItem('settings.tableDensity', JSON.stringify(value))
  }
  
  const setAutoLogout = (value: boolean) => {
    setAutoLogoutState(value)
    localStorage.setItem('settings.autoLogout', JSON.stringify(value))
  }
  
  const setHighContrast = (value: boolean) => {
    setHighContrastState(value)
    localStorage.setItem('settings.highContrast', JSON.stringify(value))
  }
  
  const setReducedMotion = (value: boolean) => {
    setReducedMotionState(value)
    localStorage.setItem('settings.reducedMotion', JSON.stringify(value))
  }

  // Apply settings to document root
  useEffect(() => {
    const root = document.documentElement
    
    // Dark mode
    if (darkMode) {
      root.classList.add('dark-mode')
    } else {
      root.classList.remove('dark-mode')
    }
    
    // Compact mode
    if (compactMode) {
      root.classList.add('compact-mode')
    } else {
      root.classList.remove('compact-mode')
    }
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)
    
    // Table density
    root.classList.remove('table-comfortable', 'table-standard', 'table-compact')
    root.classList.add(`table-${tableDensity}`)
    
    // High contrast
    if (highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }
    
    // Reduced motion
    if (reducedMotion) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }
  }, [darkMode, compactMode, fontSize, tableDensity, highContrast, reducedMotion])

  // Auto logout functionality
  useEffect(() => {
    if (!autoLogout) return

    let timeoutId: number
    const INACTIVITY_TIMEOUT = 15 * 60 * 1000 // 15 minutes

    const resetTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        logout()
        navigate('/login')
      }, INACTIVITY_TIMEOUT)
    }

    // Events that reset the inactivity timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, resetTimer)
    })

    // Start the timer
    resetTimer()

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      events.forEach(event => {
        document.removeEventListener(event, resetTimer)
      })
    }
  }, [autoLogout, logout, navigate])

  const value = {
    darkMode,
    compactMode,
    fontSize,
    tableDensity,
    autoLogout,
    highContrast,
    reducedMotion,
    setDarkMode,
    setCompactMode,
    setFontSize,
    setTableDensity,
    setAutoLogout,
    setHighContrast,
    setReducedMotion,
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}
