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

export interface ClassificationRow {
  id: string
  created_at: string
  editable: boolean
  status: boolean
  description: string
}

export interface SubClassificationRow {
  id: string
  created_at: string
  editable: boolean
  status: boolean
  description: string
  classification_appropriation: string
}

export interface ClassificationWithSubs extends ClassificationRow {
  subClassifications: SubClassificationRow[]
}

export interface ClassificationTemplate {
  id: string
  description: string
}

export const FUNCTIONAL_CLASSIFICATION_TEMPLATES: ClassificationTemplate[] = [
  { id: 'general-public-services', description: 'General Public Services' },
  {
    id: 'education-culture-sports-manpower',
    description: 'Education, Culture, Sports and Manpower Development',
  },
  { id: 'health-services', description: 'Health Services' },
  { id: 'labor-and-employment', description: 'Labor and Employment' },
  { id: 'housing-and-community-development', description: 'Housing and Community Development' },
  { id: 'social-welfare-services', description: 'Social Welfare Services' },
  { id: 'economic-services', description: 'Economic Services' },
  { id: 'other-services', description: 'Other Services' },
]

type ClassificationWithSubsResponse = ClassificationRow & {
  classification_appropriation_sub?: SubClassificationRow[]
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

// ============================================================================
// CLASSIFICATION OF APPROPRIATIONS (IN MEMORY)
// ============================================================================

export interface CreateSubClassificationPayload {
  description: string
  status: boolean
  classificationId: string
}

export interface UpdateSubClassificationPayload {
  id: string
  description: string
  status: boolean
  classificationId?: string
}

export interface CreateClassificationPayload {
  description: string
  status?: boolean
}

const ensureSupabase = () => {
  if (!supabase) throw new Error('Supabase not configured')
  return supabase
}

export async function fetchClassificationAppropriations(): Promise<ClassificationWithSubs[]> {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('classification_appropriation')
    .select(`
      *,
      classification_appropriation_sub (*)
    `)
    .order('description', { ascending: true })

  if (error) throw error

  const rows = (data || []) as ClassificationWithSubsResponse[]

  return rows.map(({ classification_appropriation_sub, ...category }) => ({
    ...category,
    subClassifications: (classification_appropriation_sub ?? [])
      .slice()
      .sort((a, b) => a.description.localeCompare(b.description)),
  }))
}

export async function createSubClassification(payload: CreateSubClassificationPayload) {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('classification_appropriation_sub')
    .insert({
      description: payload.description,
      status: payload.status,
      editable: true,
      classification_appropriation: payload.classificationId,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createClassification(payload: CreateClassificationPayload) {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('classification_appropriation')
    .insert({
      description: payload.description,
      status: payload.status ?? true,
      editable: true,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSubClassification(payload: UpdateSubClassificationPayload) {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('classification_appropriation_sub')
    .update({
      description: payload.description,
      status: payload.status,
      ...(payload.classificationId ? { classification_appropriation: payload.classificationId } : {}),
    })
    .eq('id', payload.id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSubClassification(id: string): Promise<void> {
  const client = ensureSupabase()

  const { error } = await client
    .schema('accounting')
    .from('classification_appropriation_sub')
    .update({ status: false })
    .eq('id', id)

  if (error) throw error
}

export async function toggleCategoryStatus(categoryId: string, isActive: boolean) {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('classification_appropriation')
    .update({ status: isActive })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// SOURCE OF INCOME, REVENUE ACCOUNTS, REVENUE ACCOUNTS SUB
// ============================================================================

export interface SourceOfIncome {
  id: string
  created_at: string
  source_type: string
  editable: boolean
  status: boolean
  estimate_accounting_sub_id: string
}

export interface RevenueAccount {
  id: string
  created_at: string
  revenue_type: string
  editable: boolean
  status: boolean
  source_of_income_id: string
}

export interface RevenueAccountSub {
  id: string
  created_at: string
  revenue_type_sub: string
  editable: boolean
  status: boolean
  revenue_account_id: string
}

/** Flattened view for table display */
export interface FullEstimateEntry {
  source_of_income_id: string
  source_type: string
  estimate_income_sub_id: string
  subcategory_description: string
  estimate_income_id: string
  income_source_description: string
  revenue_account_id: string | null
  revenue_type: string | null
  revenue_account_sub_id: string | null
  revenue_type_sub: string | null
  created_at: string
}

/**
 * Fetch all source_of_income entries with full join chain for display
 */
export async function fetchFullEstimateEntries(): Promise<FullEstimateEntry[]> {
  const client = ensureSupabase()

  const { data, error } = await client
    .schema('accounting')
    .from('source_of_income')
    .select(`
      id, created_at, source_type, editable, status,
      estimate_income_sub!estimate_accounting_sub_id (
        id, description,
        estimate_income (
          id, description
        )
      ),
      revenue_accounts (
        id, revenue_type,
        revenue_accounts_sub (
          id, revenue_type_sub
        )
      )
    `)
    .eq('status', true)
    .order('created_at', { ascending: false })

  if (error) throw error

  const entries: FullEstimateEntry[] = []
  for (const soi of (data || []) as any[]) {
    const sub = soi.estimate_income_sub
    const incomeCategory = sub?.estimate_income
    const revenueAccounts: any[] = soi.revenue_accounts || []

    if (revenueAccounts.length === 0) {
      entries.push({
        source_of_income_id: soi.id,
        source_type: soi.source_type,
        estimate_income_sub_id: sub?.id || '',
        subcategory_description: sub?.description || '',
        estimate_income_id: incomeCategory?.id || '',
        income_source_description: incomeCategory?.description || '',
        revenue_account_id: null,
        revenue_type: null,
        revenue_account_sub_id: null,
        revenue_type_sub: null,
        created_at: soi.created_at,
      })
    } else {
      for (const ra of revenueAccounts) {
        const raSubs: any[] = ra.revenue_accounts_sub || []
        if (raSubs.length === 0) {
          entries.push({
            source_of_income_id: soi.id,
            source_type: soi.source_type,
            estimate_income_sub_id: sub?.id || '',
            subcategory_description: sub?.description || '',
            estimate_income_id: incomeCategory?.id || '',
            income_source_description: incomeCategory?.description || '',
            revenue_account_id: ra.id,
            revenue_type: ra.revenue_type,
            revenue_account_sub_id: null,
            revenue_type_sub: null,
            created_at: soi.created_at,
          })
        } else {
          for (const raSub of raSubs) {
            entries.push({
              source_of_income_id: soi.id,
              source_type: soi.source_type,
              estimate_income_sub_id: sub?.id || '',
              subcategory_description: sub?.description || '',
              estimate_income_id: incomeCategory?.id || '',
              income_source_description: incomeCategory?.description || '',
              revenue_account_id: ra.id,
              revenue_type: ra.revenue_type,
              revenue_account_sub_id: raSub.id,
              revenue_type_sub: raSub.revenue_type_sub,
              created_at: soi.created_at,
            })
          }
        }
      }
    }
  }

  return entries
}

export interface CreateFullEstimatePayload {
  estimate_income_id: string
  description: string
  source_type: string
  revenue_type: string
  revenue_type_sub: string
}

/**
 * Create the full chain: estimate_income_sub (or reuse) → source_of_income → revenue_accounts → revenue_accounts_sub
 */
export async function createFullEstimateEntry(payload: CreateFullEstimatePayload): Promise<void> {
  const client = ensureSupabase()

  // Step 1: Find or create estimate_income_sub
  let estimateIncomeSubId: string

  const { data: existingSub } = await client
    .schema('accounting')
    .from('estimate_income_sub')
    .select('id')
    .eq('estimate_income', payload.estimate_income_id)
    .ilike('description', payload.description.trim())
    .eq('status', true)
    .maybeSingle()

  if (existingSub) {
    estimateIncomeSubId = existingSub.id
  } else {
    const { data: newSub, error: subError } = await client
      .schema('accounting')
      .from('estimate_income_sub')
      .insert({
        estimate_income: payload.estimate_income_id,
        description: payload.description.trim(),
        editable: true,
        status: true,
      })
      .select()
      .single()

    if (subError) throw subError
    estimateIncomeSubId = newSub.id
  }

  // Step 2: Create source_of_income
  const { data: sourceData, error: sourceError } = await client
    .schema('accounting')
    .from('source_of_income')
    .insert({
      source_type: payload.source_type.trim(),
      editable: true,
      status: true,
      estimate_accounting_sub_id: estimateIncomeSubId,
    })
    .select()
    .single()

  if (sourceError) throw sourceError

  // Step 3: Create revenue_accounts
  const { data: revenueData, error: revenueError } = await client
    .schema('accounting')
    .from('revenue_accounts')
    .insert({
      revenue_type: payload.revenue_type.trim(),
      editable: true,
      status: true,
      source_of_income_id: sourceData.id,
    })
    .select()
    .single()

  if (revenueError) throw revenueError

  // Step 4: Create revenue_accounts_sub
  const { error: revenueSubError } = await client
    .schema('accounting')
    .from('revenue_accounts_sub')
    .insert({
      revenue_type_sub: payload.revenue_type_sub.trim(),
      editable: true,
      status: true,
      revenue_account_id: revenueData.id,
    })
    .select()
    .single()

  if (revenueSubError) throw revenueSubError
}

export interface UpdateFullEstimatePayload {
  source_of_income_id: string
  source_type: string
  revenue_account_id: string | null
  revenue_type: string
  revenue_account_sub_id: string | null
  revenue_type_sub: string
}

/**
 * Update editable fields in an existing estimate entry chain
 */
export async function updateFullEstimateEntry(payload: UpdateFullEstimatePayload): Promise<void> {
  const client = ensureSupabase()

  // Update source_of_income
  const { error: soiError } = await client
    .schema('accounting')
    .from('source_of_income')
    .update({ source_type: payload.source_type.trim() })
    .eq('id', payload.source_of_income_id)

  if (soiError) throw soiError

  // Update revenue_accounts
  if (payload.revenue_account_id) {
    const { error: raError } = await client
      .schema('accounting')
      .from('revenue_accounts')
      .update({ revenue_type: payload.revenue_type.trim() })
      .eq('id', payload.revenue_account_id)

    if (raError) throw raError
  }

  // Update revenue_accounts_sub
  if (payload.revenue_account_sub_id) {
    const { error: rasError } = await client
      .schema('accounting')
      .from('revenue_accounts_sub')
      .update({ revenue_type_sub: payload.revenue_type_sub.trim() })
      .eq('id', payload.revenue_account_sub_id)

    if (rasError) throw rasError
  }
}

/**
 * Soft delete a source_of_income entry
 */
export async function deleteFullEstimateEntry(sourceOfIncomeId: string): Promise<void> {
  const client = ensureSupabase()

  const { error } = await client
    .schema('accounting')
    .from('source_of_income')
    .update({ status: false })
    .eq('id', sourceOfIncomeId)

  if (error) throw error
}
