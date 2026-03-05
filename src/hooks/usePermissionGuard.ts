/**
 * usePermissionGuard Hook
 * 
 * Provides easy-to-use guarded CRUD operations for any module.
 * Automatically checks permissions before executing operations.
 * 
 * Usage:
 * const { insert, update, remove, select } = usePermissionGuard('/dashboard/my-module')
 * 
 * const handleCreate = async (data) => {
 *   const result = await insert('my_table', data)
 *   if (!result.success) {
 *     // Shows: "You don't have permission to create in this module"
 *     showError(result.error)
 *     return
 *   }
 *   // Success
 * }
 */

import { useCallback } from 'react'
import { useAuthStore } from '@/store'
import {
  guardedInsert,
  guardedUpdate,
  guardedDelete,
  guardedSelect,
  checkPermission,
  type GuardedResult,
} from '@/services/permissionGuard'

interface UsePermissionGuardReturn {
  /** Insert a new record with permission check */
  insert: <T>(table: string, data: Record<string, unknown>) => Promise<GuardedResult<T>>
  /** Update a record with permission check */
  update: <T>(table: string, id: string, data: Record<string, unknown>) => Promise<GuardedResult<T>>
  /** Delete a record with permission check */
  remove: (table: string, id: string) => Promise<GuardedResult>
  /** Select records with permission check */
  select: <T>(table: string, query?: { column: string; value: unknown }) => Promise<GuardedResult<T[]>>
  /** Check if user can perform an action */
  canPerform: (action: 'select' | 'insert' | 'update' | 'delete') => Promise<boolean>
}

export const usePermissionGuard = (moduleRoutePath: string): UsePermissionGuardReturn => {
  const user = useAuthStore((state) => state.user)
  const userId = user?.id || ''

  const insert = useCallback(
    async <T>(table: string, data: Record<string, unknown>): Promise<GuardedResult<T>> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated', permissionDenied: true }
      }
      return guardedInsert<T>(userId, moduleRoutePath, table, data)
    },
    [userId, moduleRoutePath]
  )

  const update = useCallback(
    async <T>(table: string, id: string, data: Record<string, unknown>): Promise<GuardedResult<T>> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated', permissionDenied: true }
      }
      return guardedUpdate<T>(userId, moduleRoutePath, table, id, data)
    },
    [userId, moduleRoutePath]
  )

  const remove = useCallback(
    async (table: string, id: string): Promise<GuardedResult> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated', permissionDenied: true }
      }
      return guardedDelete(userId, moduleRoutePath, table, id)
    },
    [userId, moduleRoutePath]
  )

  const select = useCallback(
    async <T>(table: string, query?: { column: string; value: unknown }): Promise<GuardedResult<T[]>> => {
      if (!userId) {
        return { success: false, error: 'Not authenticated', permissionDenied: true }
      }
      return guardedSelect<T>(userId, moduleRoutePath, table, query)
    },
    [userId, moduleRoutePath]
  )

  const canPerform = useCallback(
    async (action: 'select' | 'insert' | 'update' | 'delete'): Promise<boolean> => {
      if (!userId) return false
      const result = await checkPermission(userId, moduleRoutePath, action)
      return result.allowed
    },
    [userId, moduleRoutePath]
  )

  return { insert, update, remove, select, canPerform }
}

export default usePermissionGuard
