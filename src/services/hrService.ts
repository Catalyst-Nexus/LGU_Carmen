import { supabase, isSupabaseConfigured } from "./supabase";
import type { TimeSlotSchedule } from "@/types/hr.types";

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
  suffix: string;
  pos_id: string;
  o_id: string;
  employment_status:
    | "permanent"
    | "casual"
    | "coterminous"
    | "contractual"
    | "job_order";
  date_hired: string;
  is_active: boolean;
  // CSC personal info
  birth_date: string;
  civil_status: "single" | "married" | "widowed" | "separated" | "";
  blood_type: string;
  contact_number: string;
  address: string;
  // Government IDs
  gsis_number: string;
  philhealth_number: string;
  pagibig_number: string;
  tin: string;
}

/**
 * Fetch all offices from hr.office table
 */
export const fetchOffices = async (): Promise<Office[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("office")
    .select("id, description")
    .order("description");

  if (error) {
    console.error("Error fetching offices:", error);
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
    .schema("hr")
    .from("position")
    .select("id, description, item_no")
    .order("description");

  if (error) {
    console.error("Error fetching positions:", error);
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
    .schema("hr")
    .from("salary_rate")
    .select("id, description")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching salary rates:", error);
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
    .schema("hr")
    .from("pos_type")
    .select("id, description")
    .order("description");

  if (error) {
    console.error("Error fetching position types:", error);
    return [];
  }

  return data || [];
};

/**
 * Create a new employee in hr.personnel table
 */
export const createEmployee = async (
  employeeData: EmployeeFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  // Convert empty strings to null for optional / unique columns
  const cleaned = {
    ...employeeData,
    suffix: employeeData.suffix || "",
    birth_date: employeeData.birth_date || null,
    civil_status: employeeData.civil_status || null,
    blood_type: employeeData.blood_type || null,
    contact_number: employeeData.contact_number || null,
    address: employeeData.address || "",
    gsis_number: employeeData.gsis_number || null,
    philhealth_number: employeeData.philhealth_number || null,
    pagibig_number: employeeData.pagibig_number || null,
    tin: employeeData.tin || null,
  };

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .insert([cleaned]);

  if (error) {
    console.error("Error creating employee:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing employee in hr.personnel table
 */
export const updateEmployee = async (
  id: string,
  employeeData: Partial<EmployeeFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update(employeeData)
    .eq("id", id);

  if (error) {
    console.error("Error updating employee:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete an employee from hr.personnel table
 */
export const deleteEmployee = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting employee:", error);
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
  positionData: PlantillaPositionFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .insert([positionData]);

  if (error) {
    console.error("Error creating position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update an existing position in hr.position table
 */
export const updatePosition = async (
  id: string,
  positionData: Partial<PlantillaPositionFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .update(positionData)
    .eq("id", id);

  if (error) {
    console.error("Error updating position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete a position from hr.position table
 */
export const deletePosition = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting position:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// ============================================
// LEAVE MANAGEMENT
// ============================================

export interface LeaveSubtype {
  id: string;
  description: string;
  code: string;
}

export interface LeaveApplicationFormData {
  per_id: string;
  los_id: string;
  date_from: string;
  date_to: string;
  days: number;
  remarks: string;
  status: "pending" | "approved" | "denied" | "cancelled";
}

/**
 * Fetch all leave subtypes (VL, SL, ML, etc.)
 */
export const fetchLeaveSubtypes = async (): Promise<LeaveSubtype[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("leave_out_subtype")
    .select("id, description, code")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching leave subtypes:", error);
    return [];
  }

  return data || [];
};

/**
 * Fetch all personnel for leave application dropdown
 */
export const fetchPersonnelForLeave = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select("id, first_name, middle_name, last_name")
    .eq("is_active", true)
    .order("last_name");

  if (error) {
    console.error("Error fetching personnel:", error);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    name: `${p.last_name}, ${p.first_name} ${p.middle_name || ""}`.trim(),
  }));
};

/**
 * Create a new leave application
 */
export const createLeaveApplication = async (
  leaveData: LeaveApplicationFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  // Create the leave application
  const { error: leaveError } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_out")
    .insert([
      {
        per_id: leaveData.per_id,
        los_id: leaveData.los_id,
        status: leaveData.status,
        remarks: leaveData.remarks,
        credits: leaveData.days,
      },
    ])
    .select("id")
    .single();

  if (leaveError) {
    console.error("Error creating leave application:", leaveError);
    return { success: false, error: leaveError.message };
  }

  // Note: In a real implementation, you'd also insert records into leave_out_dates
  // for each day between date_from and date_to. This would require additional logic.

  return { success: true };
};

/**
 * Update an existing leave application
 */
export const updateLeaveApplication = async (
  id: string,
  leaveData: Partial<LeaveApplicationFormData>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const updateData: any = {};
  if (leaveData.per_id) updateData.per_id = leaveData.per_id;
  if (leaveData.los_id) updateData.los_id = leaveData.los_id;
  if (leaveData.status) updateData.status = leaveData.status;
  if (leaveData.remarks) updateData.remarks = leaveData.remarks;
  if (leaveData.days) updateData.credits = leaveData.days;

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_out")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error("Error updating leave application:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete a leave application
 */
export const deleteLeaveApplication = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_out")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting leave application:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// =============================================================================
// TIME SLOT SCHEDULE
// =============================================================================

/**
 * Fetch all active time slot schedules
 */
export const fetchTimeSlotSchedules = async (): Promise<TimeSlotSchedule[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .select("*")
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching time slot schedules:", error);
    return [];
  }

  return data || [];
};

/**
 * Create a new time slot schedule
 */
export const createTimeSlotSchedule = async (
  slot: Omit<TimeSlotSchedule, "id" | "created_at">,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .insert([slot]);

  if (error) {
    console.error("Error creating time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Update a time slot schedule
 */
export const updateTimeSlotSchedule = async (
  id: string,
  slot: Partial<Omit<TimeSlotSchedule, "id" | "created_at">>,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .update(slot)
    .eq("id", id);

  if (error) {
    console.error("Error updating time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Delete (soft-deactivate) a time slot schedule
 */
export const deleteTimeSlotSchedule = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_slot_schedule")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    console.error("Error deleting time slot schedule:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Insert a time record (IN or OUT) for an employee.
 * When time_identifier=2 (OUT), the DB trigger will auto-calculate total_hours.
 */
export const insertTimeRecord = async (params: {
  per_id: string;
  date: string;
  time_slot_id: string;
  time_identifier: 1 | 2;
  time: string; // HH:mm format
}): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const row: Record<string, unknown> = {
    per_id: params.per_id,
    date: params.date,
    time_slot_id: params.time_slot_id,
    time_identifier: params.time_identifier,
  };

  if (params.time_identifier === 1) {
    row.in1 = params.time;
  } else {
    row.out1 = params.time;
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_record")
    .insert([row]);

  if (error) {
    console.error("Error inserting time record:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};
