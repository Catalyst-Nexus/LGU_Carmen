/**
 * Permission Guard Service
 * 
 * Wraps database operations with automatic permission checking.
 * Before any insert/update/delete operation, it validates the user's permissions
 * for the given module. If unauthorized, returns an error instead of executing.
 */

import { supabase, isSupabaseConfigured } from './supabase'

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean
  error?: string
}

// Operation result with permission awareness
export interface GuardedResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  permissionDenied?: boolean
}

/**
 * Check if the current user has a specific permission for a module
 */
export const checkPermission = async (
  userId: string,
  moduleRoutePath: string,
  action: 'select' | 'insert' | 'update' | 'delete'
): Promise<PermissionCheckResult> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { allowed: false, error: 'Database not configured' }
  }

  try {
    // Step 1: Check if user is super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', userId)
      .single()

    if (profile?.is_super_admin) {
      return { allowed: true }
    }

    // Step 2: Get the module by route path
    const { data: module } = await supabase
      .from('modules')
      .select('id')
      .eq('route_path', moduleRoutePath)
      .eq('is_active', true)
      .single()

    if (!module) {
      return { allowed: false, error: 'Module not found or inactive' }
    }

    // Step 3: Get user's roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId)

    if (!userRoles || userRoles.length === 0) {
      return { allowed: false, error: 'No roles assigned' }
    }

    const roleIds = userRoles.map(ur => ur.role_id)

    // Step 4: Check role_permissions for the module and action
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select('can_select, can_insert, can_update, can_delete')
      .eq('module_id', module.id)
      .in('role_id', roleIds)

    if (!permissions || permissions.length === 0) {
      return { allowed: false, error: 'No permissions for this module' }
    }

    // Check if any role grants the requested action
    const hasPermission = permissions.some(p => {
      switch (action) {
        case 'select': return p.can_select
        case 'insert': return p.can_insert
        case 'update': return p.can_update
        case 'delete': return p.can_delete
        default: return false
      }
    })

    if (!hasPermission) {
      const actionLabel = {
        select: 'view',
        insert: 'create',
        update: 'update',
        delete: 'delete'
      }[action]
      return { allowed: false, error: `You don't have permission to ${actionLabel} in this module` }
    }

    return { allowed: true }
  } catch (err) {
    console.error('Permission check error:', err)
    return { allowed: false, error: 'Permission check failed' }
  }
}

/**
 * Execute a guarded insert operation
 */
export const guardedInsert = async <T>(
  userId: string,
  moduleRoutePath: string,
  table: string,
  data: Record<string, unknown>
): Promise<GuardedResult<T>> => {
  // Check permission first
  const permCheck = await checkPermission(userId, moduleRoutePath, 'insert')
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error, permissionDenied: true }
  }

  // Execute operation
  if (!supabase) return { success: false, error: 'Database not configured' }
  
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: result as T }
}

/**
 * Execute a guarded update operation
 */
export const guardedUpdate = async <T>(
  userId: string,
  moduleRoutePath: string,
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<GuardedResult<T>> => {
  // Check permission first
  const permCheck = await checkPermission(userId, moduleRoutePath, 'update')
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error, permissionDenied: true }
  }

  // Execute operation
  if (!supabase) return { success: false, error: 'Database not configured' }
  
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: result as T }
}

/**
 * Execute a guarded delete operation
 */
export const guardedDelete = async (
  userId: string,
  moduleRoutePath: string,
  table: string,
  id: string
): Promise<GuardedResult> => {
  // Check permission first
  const permCheck = await checkPermission(userId, moduleRoutePath, 'delete')
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error, permissionDenied: true }
  }

  // Execute operation
  if (!supabase) return { success: false, error: 'Database not configured' }
  
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Execute a guarded select operation (for restricted data)
 */
export const guardedSelect = async <T>(
  userId: string,
  moduleRoutePath: string,
  table: string,
  query?: { column: string; value: unknown }
): Promise<GuardedResult<T[]>> => {
  // Check permission first
  const permCheck = await checkPermission(userId, moduleRoutePath, 'select')
  if (!permCheck.allowed) {
    return { success: false, error: permCheck.error, permissionDenied: true }
  }

  // Execute operation
  if (!supabase) return { success: false, error: 'Database not configured' }
  
  let queryBuilder = supabase.from(table).select('*')
  
  if (query) {
    queryBuilder = queryBuilder.eq(query.column, query.value)
  }

  const { data, error } = await queryBuilder

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: data as T[] }
}
