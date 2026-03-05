import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/services/supabase'
import { isPendingUserConfirmed } from '@/services/userActivationService'

export interface User {
  id: string
  username: string
  email: string
  role: string
  is_super_admin: boolean
  profilePicture?: string | null
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  updateProfilePicture: (url: string | null) => void
  updateUser: (updates: Partial<User>) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => {
      // Helper function to fetch user's role from database
      const fetchUserRole = async (userId: string): Promise<string> => {
        try {
          if (!isSupabaseConfigured() || !supabase) {
            return 'user'
          }

          // Get user's first role from user_roles table
          const { data, error } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle()

          if (error || !data) {
            console.log('No role found for user:', error)
            return 'user'
          }

          // Get role name from roles table
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('role_code')
            .eq('id', data.role_id)
            .maybeSingle()

          if (roleError || !roleData) {
            console.log('Role data not found:', roleError)
            return 'user'
          }

          return roleData.role_code || 'user'
        } catch (err) {
          console.error('Error fetching user role:', err)
          return 'user'
        }
      }

      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null })
          
          try {
            if (!isSupabaseConfigured() || !supabase) {
              set({ error: 'Supabase is not configured', isLoading: false })
              return false
            }

            // Normalize email to lowercase (matches signup)
            const normalizedEmail = email.toLowerCase().trim()
            
            console.log('Login attempt with email:', normalizedEmail)
            console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)

            // Check if user registration is pending confirmation
            const isConfirmed = await isPendingUserConfirmed(normalizedEmail)
            
            if (!isConfirmed) {
              set({ 
                error: 'Your account is awaiting admin confirmation. You will be able to log in once approved.', 
                isLoading: false 
              })
              return false
            }

            const { data, error: authError } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            })

            if (authError) {
              console.error('Auth error:', authError)
              set({ error: authError.message, isLoading: false })
              return false
            }

            if (data.user) {
              console.log('Login successful for user:', data.user.id)
              const meta = data.user.user_metadata || {}
              const role = await fetchUserRole(data.user.id)
              
              const userData: User = {
                id: data.user.id,
                username: meta.username || meta.display_name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                role,
                is_super_admin: meta.is_super_admin || false,
                profilePicture: meta.profile_picture || null,
              }

              set({ user: userData, isAuthenticated: true, isLoading: false })
              return true
            }

            set({ error: 'Login failed', isLoading: false })
            return false
          } catch (error) {
            console.error('Login exception:', error)
            const message = error instanceof Error ? error.message : 'An error occurred during login'
            set({ error: message, isLoading: false })
            return false
          }
        },
        logout: async () => {
          try {
            if (isSupabaseConfigured() && supabase) {
              await supabase.auth.signOut()
            }
            set({ user: null, isAuthenticated: false, error: null })
          } catch (error) {
            console.error('Logout error:', error)
            set({ user: null, isAuthenticated: false })
          }
        },
        updateProfilePicture: (url) => {
          set((state) => ({
            user: state.user ? { ...state.user, profilePicture: url } : null,
          }))
        },
        updateUser: (updates) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }))
        },
        setError: (error) => {
          set({ error })
        },
      }
    },
    {
      name: 'auth-storage',
    }
  )
)
