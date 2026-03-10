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
  sg_number: number | null;
  step: number | null;
  amount: number;
  is_perday: boolean;
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
    .select(
      "id, description, is_perday, rate:rate_id ( amount, sg_number, step )",
    )
    .eq("is_active", true)
    .order("description");

  if (error) {
    console.error("Error fetching salary rates:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const rate = Array.isArray(row.rate) ? row.rate[0] : row.rate;
    return {
      id: row.id as string,
      description: row.description as string,
      sg_number:
        ((rate as Record<string, unknown>)?.sg_number as number | null) ?? null,
      step: ((rate as Record<string, unknown>)?.step as number | null) ?? null,
      amount: Number((rate as Record<string, unknown>)?.amount ?? 0),
      is_perday: row.is_perday as boolean,
    };
  });
};

export interface RateRow {
  id: string;
  description: string;
  amount: number;
  sg_number: number | null;
  step: number | null;
}

/**
 * Fetch all rows from hr.rate (the raw amount table)
 */
export const fetchRates = async (): Promise<RateRow[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("rate")
    .select("id, description, amount, sg_number, step")
    .order("sg_number")
    .order("step");

  if (error) {
    console.error("Error fetching rates:", error);
    return [];
  }

  return (data || []).map((r) => ({
    id: r.id as string,
    description: r.description as string,
    amount: Number(r.amount),
    sg_number: r.sg_number as number | null,
    step: r.step as number | null,
  }));
};

/**
 * Update a rate amount in hr.rate
 */
export const updateRate = async (
  id: string,
  amount: number,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("rate")
    .update({ amount })
    .eq("id", id);

  if (error) {
    console.error("Error updating rate:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
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
  authorization: string;
  is_filled: boolean;
  slots?: number;
}

/**
 * Parse an item_no like "MO-003" into { prefix: "MO", num: 3, padLength: 3 }.
 * Returns null if the format doesn't match.
 */
const parseItemNo = (itemNo: string) => {
  const lastDash = itemNo.lastIndexOf("-");
  if (lastDash === -1) return null;
  const prefix = itemNo.substring(0, lastDash);
  const numStr = itemNo.substring(lastDash + 1);
  const num = parseInt(numStr, 10);
  if (isNaN(num) || !prefix) return null;
  return { prefix, num, padLength: numStr.length };
};

/**
 * Create one or more positions in hr.position table.
 * When slots > 1, auto-generates sequential item numbers from the base item_no.
 */
export const createPosition = async (
  positionData: PlantillaPositionFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const slots = positionData.slots ?? 1;
  const { slots: _unused, ...baseData } = positionData;

  const rows: Omit<PlantillaPositionFormData, "slots">[] = [];

  if (slots <= 1) {
    rows.push(baseData);
  } else {
    const parsed = parseItemNo(baseData.item_no);
    if (!parsed) {
      return {
        success: false,
        error:
          "Item No. must follow the format PREFIX-NUMBER (e.g., MO-001) when creating multiple slots.",
      };
    }
    for (let i = 0; i < slots; i++) {
      const seq = String(parsed.num + i).padStart(parsed.padLength, "0");
      rows.push({ ...baseData, item_no: `${parsed.prefix}-${seq}` });
    }
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .insert(rows);

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
 * Fetch all leave applications from hr.personnel_leave_out
 */
export const fetchLeaveApplications = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_out")
    .select(
      `
      id, per_id, los_id, applied_date, credits, status, remarks, created_at,
      personnel:per_id ( first_name, last_name ),
      leave_out_subtype:los_id ( code, description )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching leave applications:", error);
    return [];
  }

  return (data || []).map((row: any) => {
    const per = Array.isArray(row.personnel) ? row.personnel[0] : row.personnel;
    const sub = Array.isArray(row.leave_out_subtype)
      ? row.leave_out_subtype[0]
      : row.leave_out_subtype;
    return {
      id: row.id,
      employee_id: row.per_id,
      employee_name: per ? `${per.last_name}, ${per.first_name}` : "—",
      leave_type: (sub?.code ?? "—") as string,
      date_from: row.applied_date,
      date_to: row.applied_date,
      days: Number(row.credits) || 0,
      reason: row.remarks,
      status: row.status,
      approved_by: null,
      created_at: row.created_at,
    };
  });
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
