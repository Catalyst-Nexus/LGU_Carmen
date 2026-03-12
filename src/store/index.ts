import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Re-export auth store
export { useAuthStore, type User, type AuthState } from './authStore'

// Settings store using Zustand
interface SettingsState {
  darkMode: boolean
  compactMode: boolean
  fontSize: 'small' | 'medium' | 'large'
  tableDensity: 'comfortable' | 'standard' | 'compact'
  autoLogout: boolean
  highContrast: boolean
  reducedMotion: boolean
  sidebarCollapsed: boolean
  systemLogo: string | null
  systemLogoPath: string | null
  sidebarOrder: Record<string, string[]> // category -> ordered item ids
  sidebarSectionOrder: string[] // ordered section titles
  setDarkMode: (value: boolean) => void
  setCompactMode: (value: boolean) => void
  setFontSize: (value: 'small' | 'medium' | 'large') => void
  setTableDensity: (value: 'comfortable' | 'standard' | 'compact') => void
  setAutoLogout: (value: boolean) => void
  setHighContrast: (value: boolean) => void
  setReducedMotion: (value: boolean) => void
  setSidebarCollapsed: (value: boolean) => void
  setSystemLogo: (url: string | null, path?: string | null) => void
  setSidebarOrder: (order: Record<string, string[]>) => void
  setSidebarSectionOrder: (order: string[]) => void
  resetSidebarOrder: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      darkMode: false,
      compactMode: false,
      fontSize: 'medium',
      tableDensity: 'standard',
      autoLogout: false,
      highContrast: false,
      reducedMotion: false,
      sidebarCollapsed: false,
      systemLogo: null,
      systemLogoPath: null,
      sidebarOrder: {},
      sidebarSectionOrder: [],
      setDarkMode: (value) => set({ darkMode: value }),
      setCompactMode: (value) => set({ compactMode: value }),
      setFontSize: (value) => set({ fontSize: value }),
      setTableDensity: (value) => set({ tableDensity: value }),
      setAutoLogout: (value) => set({ autoLogout: value }),
      setHighContrast: (value) => set({ highContrast: value }),
      setReducedMotion: (value) => set({ reducedMotion: value }),
      setSidebarCollapsed: (value) => set({ sidebarCollapsed: value }),
      setSystemLogo: (url, path) => set({ systemLogo: url, systemLogoPath: path ?? null }),
      setSidebarOrder: (order) => set({ sidebarOrder: order }),
      setSidebarSectionOrder: (order) => set({ sidebarSectionOrder: order }),
      resetSidebarOrder: () => set({ sidebarOrder: {}, sidebarSectionOrder: [] }),
    }),
    {
      name: 'settings-storage',
    }
  )
)
