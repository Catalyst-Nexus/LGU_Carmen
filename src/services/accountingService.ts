import { supabase } from './supabase'

// Types for Estimate Income
export interface EstimateIncome {
  id: string
  created_at: string
  editable: boolean
  status: boolean
  description: string
}

export interface EstimateIncomeSub {
  id: string
  created_at: string
  editable: boolean
  status: boolean
  description: string
  estimate_income: string
}

export interface EstimateIncomeSubWithParent extends EstimateIncomeSub {
  estimate_income_data?: EstimateIncome
}

// ============================================================================
// ESTIMATE INCOME (Main Categories)
// ============================================================================

/**
 * Fetch all estimate income categories (Local Sources, External Sources)
 */
export async function fetchEstimateIncomeCategories(): Promise<EstimateIncome[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income')
    .select('*')
    .eq('status', true)
    .order('description', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Get a single estimate income category by ID
 */
export async function getEstimateIncomeById(id: string): Promise<EstimateIncome | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// ESTIMATE INCOME SUB (Subcategories)
// ============================================================================

/**
 * Fetch all subcategories for a specific estimate income category
 */
export async function fetchEstimateIncomeSubs(
  estimateIncomeId: string
): Promise<EstimateIncomeSub[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .select('*')
    .eq('estimate_income', estimateIncomeId)
    .eq('status', true)
    .order('description', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch all subcategories with parent information
 */
export async function fetchAllEstimateIncomeSubsWithParent(): Promise<EstimateIncomeSubWithParent[]> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .select(`
      *,
      estimate_income_data:estimate_income (*)
    `)
    .eq('status', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single estimate income sub by ID
 */
export async function getEstimateIncomeSubById(id: string): Promise<EstimateIncomeSub | null> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new estimate income subcategory
 */
export async function createEstimateIncomeSub(
  payload: Omit<EstimateIncomeSub, 'id' | 'created_at'>
): Promise<EstimateIncomeSub> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an existing estimate income subcategory
 */
export async function updateEstimateIncomeSub(
  id: string,
  payload: Partial<Omit<EstimateIncomeSub, 'id' | 'created_at'>>
): Promise<EstimateIncomeSub> {
  if (!supabase) throw new Error('Supabase not configured')

  const { data, error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an estimate income subcategory (soft delete by setting status to false)
 */
export async function deleteEstimateIncomeSub(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .update({ status: false })
    .eq('id', id)

  if (error) throw error
}

/**
 * Hard delete an estimate income subcategory
 */
export async function hardDeleteEstimateIncomeSub(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured')

  const { error } = await supabase
    .schema('accounting')
    .from('estimate_income_sub')
    .delete()
    .eq('id', id)

  if (error) throw error
}
