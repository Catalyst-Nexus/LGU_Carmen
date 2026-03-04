import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import PrivateRoute from './components/PrivateRoute'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <SettingsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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
        </SettingsProvider>
      </Router>
    </AuthProvider>
  )
}

export default App
