import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { useEffect } from 'react'
import { useSettingsStore } from './store'
import { RBACProvider } from './contexts/RBACContext'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import PendingConfirmation from './pages/PendingConfirmation/PendingConfirmation'
import Dashboard from './pages/Dashboard/Dashboard'
import PrivateRoute from './components/PrivateRoute'

function App() {
  const { darkMode, highContrast, reducedMotion, fontSize } = useSettingsStore()

  // Apply settings to document root
  useEffect(() => {
    const root = document.documentElement

    // Dark mode
    root.classList.toggle('dark', darkMode)
    
    // High contrast
    root.classList.toggle('high-contrast', highContrast)
    
    // Reduced motion
    root.classList.toggle('reduced-motion', reducedMotion)
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large')
    root.classList.add(`font-${fontSize}`)
  }, [darkMode, highContrast, reducedMotion, fontSize])

  return (
    <BrowserRouter>
      <RBACProvider>
        <div className="min-h-screen w-full bg-background text-foreground">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pending-confirmation" element={<PendingConfirmation />} />
            <Route
              path="/dashboard/*"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </RBACProvider>
    </BrowserRouter>
  )
}

export default App
