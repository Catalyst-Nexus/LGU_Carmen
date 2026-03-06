import { supabase, isSupabaseConfigured } from './supabase';

export interface Office {
  id: string;
  description: string;
}

export interface Position {
  id: string;
  description: string;
  item_no: string;
}

export interface SalaryRate {
  id: string;
  description: string;
}

export interface PositionType {
  id: string;
  description: string;
}

export interface EmployeeFormData {
  first_name: string;
  middle_name: string;
  last_name: string;
  pos_id: string;
  o_id: string;
  employment_status: 'permanent' | 'casual' | 'coterminous' | 'contractual' | 'job_order';
  date_hired: string;
  is_active: boolean;
}

/**
 * Fetch all offices from hr.office table
 */
export const fetchOffices = async (): Promise<Office[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('office')
    .select('id, description')
    .order('description');

  if (error) {
    console.error('Error fetching offices:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all positions from hr.position table
 */
export const fetchPositions = async (): Promise<Position[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .select('id, description, item_no')
    .order('description');

  if (error) {
    console.error('Error fetching positions:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all salary rates from hr.salary_rate table
 */
export const fetchSalaryRates = async (): Promise<SalaryRate[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('salary_rate')
    .select('id, description')
    .eq('is_active', true)
    .order('description');

  if (error) {
    console.error('Error fetching salary rates:', error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all position types from hr.pos_type table
 */
export const fetchPositionTypes = async (): Promise<PositionType[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('pos_type')
    .select('id, description')
    .order('description');

  if (error) {
    console.error('Error fetching position types:', error);
    return [];
  }

  return data || [];
};

/**
 * Create a new employee in hr.personnel table
 */
export const createEmployee = async (
  employeeData: EmployeeFormData
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .insert([employeeData]);

  if (error) {
    console.error('Error creating employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing employee in hr.personnel table
 */
export const updateEmployee = async (
  id: string,
  employeeData: Partial<EmployeeFormData>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .update(employeeData)
    .eq('id', id);

  if (error) {
    console.error('Error updating employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete an employee from hr.personnel table
 */
export const deleteEmployee = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('personnel')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ============================================
// PLANTILLA POSITION MANAGEMENT
// ============================================

export interface PlantillaPositionFormData {
  item_no: string;
  description: string;
  sr_id: string;
  pt_id: string;
  o_id: string;
  is_filled: boolean;
}

/**
 * Create a new position in hr.position table
 */
export const createPosition = async (
  positionData: PlantillaPositionFormData
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .insert([positionData]);

  if (error) {
    console.error('Error creating position:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing position in hr.position table
 */
export const updatePosition = async (
  id: string,
  positionData: Partial<PlantillaPositionFormData>
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .update(positionData)
    .eq('id', id);

  if (error) {
    console.error('Error updating position:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete a position from hr.position table
 */
export const deletePosition = async (
  id: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema('hr')
    .from('position')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting position:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
