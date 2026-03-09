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

export const STATIC_CLASSIFICATIONS: ClassificationRow[] = [
  {
    id: 'general-public-services',
    description: 'General Public Services',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'education-culture-sports-manpower',
    description: 'Education, Culture, Sports and Manpower Development',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'health-services',
    description: 'Health Services',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'labor-and-employment',
    description: 'Labor and Employment',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'housing-and-community-development',
    description: 'Housing and Community Development',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'social-welfare-services',
    description: 'Social Welfare Services',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'economic-services',
    description: 'Economic Services',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'other-services',
    description: 'Other Services',
    status: true,
    editable: false,
    created_at: new Date().toISOString(),
  },
]

const classificationState: ClassificationRow[] = STATIC_CLASSIFICATIONS.map((category) => ({
  ...category,
}))

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
}

const inMemorySubClassifications: SubClassificationRow[] = []

const createSubRecord = (payload: CreateSubClassificationPayload): SubClassificationRow => ({
  id: crypto.randomUUID(),
  created_at: new Date().toISOString(),
  editable: true,
  status: payload.status,
  description: payload.description,
  classification_appropriation: payload.classificationId,
})

export async function fetchSubClassifications(): Promise<SubClassificationRow[]> {
  return [...inMemorySubClassifications]
}

export async function fetchClassificationAppropriations(): Promise<ClassificationWithSubs[]> {
  const subs = await fetchSubClassifications()

  return classificationState.map((category) => ({
    ...category,
    subClassifications: subs.filter(
      (sub) => sub.classification_appropriation === category.id,
    ),
  }))
}

export async function createSubClassification(payload: CreateSubClassificationPayload) {
  const record = createSubRecord(payload)
  inMemorySubClassifications.push(record)
  return record
}

export async function updateSubClassification(payload: UpdateSubClassificationPayload) {
  const index = inMemorySubClassifications.findIndex((sub) => sub.id === payload.id)
  if (index === -1) throw new Error('Sub-classification not found')

  const updated: SubClassificationRow = {
    ...inMemorySubClassifications[index],
    description: payload.description,
    status: payload.status,
  }

  inMemorySubClassifications[index] = updated
  return updated
}

export async function deleteSubClassification(id: string): Promise<void> {
  const index = inMemorySubClassifications.findIndex((sub) => sub.id === id)
  if (index === -1) throw new Error('Sub-classification not found')

  inMemorySubClassifications.splice(index, 1)
}

export function toggleCategoryStatus(categoryId: string, isActive: boolean) {
  const target = classificationState.find((category) => category.id === categoryId)
  if (!target) throw new Error('Classification not found')

  target.status = isActive
  return target
}
