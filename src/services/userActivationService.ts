import { supabase, isSupabaseConfigured } from './supabase'

export interface PendingUser {
  id: string
  username: string
  email: string
  created_at: string
  is_confirmed: boolean
}

// Fetch all pending users
export const fetchPendingUsers = async (): Promise<PendingUser[]> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      console.error('Supabase is not configured')
      return []
    }

    const { data, error } = await supabase
      .from('pending_users')
      .select('id, username, email, created_at, is_confirmed')
      .eq('is_confirmed', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending users:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching pending users:', error)
    return []
  }
}

// Create a pending user registration
export const createPendingUser = async (
  username: string,
  email: string
): Promise<{ success: boolean; error?: string; userId?: string }> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { data, error } = await supabase
      .from('pending_users')
      .insert({
        username,
        email: email.toLowerCase().trim(),
        is_confirmed: false,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, userId: data?.id }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: message }
  }
}

// Confirm a pending user (set is_confirmed to true)
export const confirmPendingUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    // Get the pending user data
    const { data: pendingUser, error: fetchError } = await supabase
      .from('pending_users')
      .select('*')
      .eq('id', userId)
      .single()

    if (fetchError || !pendingUser) {
      return { success: false, error: 'Pending user not found' }
    }

    // Update is_confirmed to true
    const { error: updateError } = await supabase
      .from('pending_users')
      .update({ is_confirmed: true })
      .eq('id', userId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: message }
  }
}

// Reject a pending user (delete from pending_users)
export const rejectPendingUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase is not configured' }
    }

    const { error } = await supabase
      .from('pending_users')
      .delete()
      .eq('id', userId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An error occurred'
    return { success: false, error: message }
  }
}

// Check if a user is confirmed
export const isPendingUserConfirmed = async (email: string): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      return true
    }

    const { data, error } = await supabase
      .from('pending_users')
      .select('is_confirmed')
      .eq('email', email.toLowerCase().trim())

    if (error || !data || data.length === 0) {
      // User not found in pending_users table
      // This means they're either not registered or already confirmed
      return true
    }

    // Return the confirmation status - user must be confirmed to login
    return data[0]?.is_confirmed || false
  } catch (error) {
    console.error('Error checking user confirmation:', error)
    return true
  }
}
