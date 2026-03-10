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
