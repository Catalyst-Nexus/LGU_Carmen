import { useSettings } from '../../contexts/SettingsContext'
import './Settings.css'

const Settings = () => {
  const {
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
  } = useSettings()

  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: 'numeric', 
    day: 'numeric', 
    year: 'numeric' 
  })

  const getBrowserName = () => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Edg')) return 'Edg'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    return 'Unknown'
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your application preferences</p>
      </div>

      <div className="settings-content">
        {/* Search Bar */}
        <div className="settings-search">
          <span className="settings-search-icon">🔍</span>
          <input
            type="text"
            className="settings-search-input"
            placeholder="Search..."
            aria-label="Search settings"
          />
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon settings-icon-appearance">
              🎨
            </div>
            <h2 className="settings-section-title">Appearance</h2>
          </div>

          <div className="settings-list">
            {/* Dark Mode */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-dark">
                  ☀️
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Dark Mode</h3>
                  <p className="settings-item-description">Switch to dark theme</p>
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={(e) => setDarkMode(e.target.checked)}
                  aria-label="Dark Mode"
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            {/* Compact Mode */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-compact">
                  ✨
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Compact Mode</h3>
                  <p className="settings-item-description">Reduce spacing and padding for more content</p>
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={compactMode}
                  onChange={(e) => setCompactMode(e.target.checked)}
                  aria-label="Compact Mode"
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            {/* Font Size */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-font">
                  T
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Font Size</h3>
                  <p className="settings-item-description">Adjust text size across the application</p>
                </div>
              </div>
              <select
                className="settings-select"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                aria-label="Font Size"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Table Density */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-table">
                  ☰
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Table Density</h3>
                  <p className="settings-item-description">Control row spacing in tables</p>
                </div>
              </div>
              <select
                className="settings-select"
                value={tableDensity}
                onChange={(e) => setTableDensity(e.target.value as 'comfortable' | 'standard' | 'compact')}
                aria-label="Table Density"
              >
                <option value="comfortable">Comfortable</option>
                <option value="standard">Standard</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        </div>

        {/* Session & Security Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon settings-icon-security">
              🛡️
            </div>
            <h2 className="settings-section-title">Session & Security</h2>
          </div>

          <div className="settings-list">
            {/* Auto Logout */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-logout">
                  🚪
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Auto Logout</h3>
                  <p className="settings-item-description">Automatically log out after 15 minutes of inactivity</p>
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={autoLogout}
                  onChange={(e) => setAutoLogout(e.target.checked)}
                  aria-label="Auto Logout"
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Accessibility Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon settings-icon-accessibility">
              ♿
            </div>
            <h2 className="settings-section-title">Accessibility</h2>
          </div>

          <div className="settings-list">
            {/* High Contrast */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-contrast">
                  💡
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">High Contrast</h3>
                  <p className="settings-item-description">Increase color contrast for better visibility</p>
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => setHighContrast(e.target.checked)}
                  aria-label="High Contrast"
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>

            {/* Reduced Motion */}
            <div className="settings-item">
              <div className="settings-item-left">
                <div className="settings-item-icon settings-icon-motion">
                  ⏸
                </div>
                <div className="settings-item-info">
                  <h3 className="settings-item-title">Reduced Motion</h3>
                  <p className="settings-item-description">Minimize animations and transitions</p>
                </div>
              </div>
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  aria-label="Reduced Motion"
                />
                <span className="settings-toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        {/* System Information Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-section-icon settings-icon-info">
              ℹ️
            </div>
            <h2 className="settings-section-title">System Information</h2>
          </div>

          <div className="settings-list">
            <div className="settings-info-row">
              <span className="settings-info-label">Current Theme</span>
              <span className="settings-info-value">
                <span className="settings-info-icon">{darkMode ? '🌙' : '☀️'}</span>
                {darkMode ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">Application Version</span>
              <span className="settings-info-value">v1.0.0</span>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">Last Updated</span>
              <span className="settings-info-value">{currentDate}</span>
            </div>

            <div className="settings-info-row">
              <span className="settings-info-label">Browser</span>
              <span className="settings-info-value">{getBrowserName()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
