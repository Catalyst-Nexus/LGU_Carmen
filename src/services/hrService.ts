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
  const { slots: _, ...baseData } = positionData;
  void _;

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
  /** lot_id — the leave_out_type UUID this subtype belongs to */
  lot_id: string;
}

export interface LeaveCredit {
  id: string;
  lot_id: string;
  lot_description: string;
  begin_balance: number;
  earned: number;
  current_balance: number;
  is_available: boolean;
}

export interface LeaveApplicationFormData {
  per_id: string;
  los_id: string;
  applied_date: string;
  credits: number;
  pay_amount?: number;
  remarks: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  approved_date?: string | null;
  approved_by?: string | null;
  /** Specific calendar dates off (for leave_out_dates) */
  leave_dates?: string[];
  /** personnel_leave_credits.id — needed to link dates to the right credit row */
  plc_id?: string;
}

/**
 * Fetch all leave subtypes (VL, SL, ML, etc.)
 */
export const fetchLeaveSubtypes = async (): Promise<LeaveSubtype[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("leave_out_subtype")
    .select("id, description, code, lot_id")
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
      id, per_id, los_id, applied_date, approved_date, approved_by,
      pay_amount, credits, status, remarks, created_at,
      personnel:per_id ( first_name, last_name ),
      leave_out_subtype:los_id ( code, description ),
      approver:approved_by ( first_name, last_name )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching leave applications:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const personnel = row.personnel as
      | Record<string, string>[]
      | Record<string, string>
      | null;
    const leaveSubtype = row.leave_out_subtype as
      | Record<string, string>[]
      | Record<string, string>
      | null;
    const per = Array.isArray(personnel) ? personnel[0] : personnel;
    const sub = Array.isArray(leaveSubtype) ? leaveSubtype[0] : leaveSubtype;
    const approverData = row.approver as
      | Record<string, string>[]
      | Record<string, string>
      | null;
    const appr = Array.isArray(approverData) ? approverData[0] : approverData;
    return {
      id: row.id as string,
      employee_id: row.per_id as string,
      employee_name: per ? `${per.last_name}, ${per.first_name}` : "—",
      leave_type: (sub?.code ?? "—") as string,
      leave_type_desc: (sub?.description ?? "—") as string,
      applied_date: (row.applied_date as string) ?? "",
      approved_date: (row.approved_date as string) ?? null,
      approved_by: (row.approved_by as string) ?? null,
      approved_by_name: appr ? `${appr.last_name}, ${appr.first_name}` : null,
      pay_amount: Number(row.pay_amount) || 0,
      credits: Number(row.credits) || 0,
      remarks: (row.remarks as string) ?? "",
      status: row.status as string,
      created_at: row.created_at as string,
    };
  });
};

/**
 * Fetch all personnel for leave application dropdown.
 * Also returns monthly_salary via the position→salary_rate→rate chain.
 */
export const fetchPersonnelForLeave = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select(
      `
      id, first_name, middle_name, last_name,
      position:pos_id (
        salary_rate:sr_id (
          rate:rate_id ( amount )
        )
      )
    `,
    )
    .eq("is_active", true)
    .order("last_name");

  if (error) {
    console.error("Error fetching personnel:", error);
    return [];
  }

  return (data || []).map((p: Record<string, unknown>) => {
    // Drill through the join chain: position → salary_rate → rate → amount
    const pos = p.position as Record<string, unknown> | null;
    const sr = pos?.salary_rate as Record<string, unknown> | null;
    const rate = sr?.rate as Record<string, unknown> | null;
    const monthly_salary = rate ? Number(rate.amount) || 0 : 0;
    return {
      id: p.id as string,
      name: `${p.last_name}, ${p.first_name} ${(p.middle_name as string) || ""}`.trim(),
      monthly_salary,
    };
  });
};

/**
 * Resolve auth.users UUID → hr.personnel.id for the current logged-in user
 */
export const fetchPersonnelIdByUserId = async (
  userId: string,
): Promise<string | null> => {
  if (!isSupabaseConfigured() || !supabase) return null;

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.id as string;
};

/**
 * Fetch leave credit balances for a specific employee.
 * Joins leave_out_type to get the type description.
 */
export const fetchLeaveCredits = async (
  perId: string,
): Promise<LeaveCredit[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_credits")
    .select(
      `
      id, lot_id, begin_balance, earned, current_balance, is_available,
      leave_out_type:lot_id ( description )
    `,
    )
    .eq("per_id", perId)
    .eq("is_available", true);

  if (error) {
    console.error("Error fetching leave credits:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const lot = row.leave_out_type as
      | Record<string, string>
      | Record<string, string>[]
      | null;
    const lotObj = Array.isArray(lot) ? lot[0] : lot;
    return {
      id: row.id as string,
      lot_id: row.lot_id as string,
      lot_description: (lotObj?.description ?? "—") as string,
      begin_balance: Number(row.begin_balance) || 0,
      earned: Number(row.earned) || 0,
      current_balance: Number(row.current_balance) || 0,
      is_available: Boolean(row.is_available),
    };
  });
};

/**
 * Insert specific leave dates into hr.leave_out_dates.
 * Each row triggers deduct_leave_credit automatically (DB trigger).
 */
export const insertLeaveDates = async (
  leaveOutId: string,
  dates: string[], // ISO date strings, e.g. ["2026-03-13", "2026-03-14"]
  plcId: string, // personnel_leave_credits.id for the matching credit row
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const rows = dates.map((d) => ({
    plaid: leaveOutId,
    plc_id: plcId,
    date: d,
  }));

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("leave_out_dates")
    .insert(rows);

  if (error) {
    console.error("Error inserting leave dates:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Create a new leave application, then insert leave_out_dates rows (which
 * trigger credit deduction automatically via trg_deduct_leave_credit).
 */
export const createLeaveApplication = async (
  leaveData: LeaveApplicationFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  // 1. Insert the leave application header
  const { data: inserted, error } = await (
    supabase as NonNullable<typeof supabase>
  )
    .schema("hr")
    .from("personnel_leave_out")
    .insert([
      {
        per_id: leaveData.per_id,
        los_id: leaveData.los_id,
        applied_date: leaveData.applied_date,
        credits: leaveData.credits,
        pay_amount: leaveData.pay_amount ?? 0,
        status: leaveData.status,
        remarks: leaveData.remarks,
      },
    ])
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("Error creating leave application:", error);
    return { success: false, error: error?.message ?? "Insert failed" };
  }

  // 2. If specific dates + credit row were provided, insert leave_out_dates
  //    The DB trigger trg_deduct_leave_credit fires per row and deducts the credit.
  if (leaveData.leave_dates?.length && leaveData.plc_id) {
    const datesResult = await insertLeaveDates(
      inserted.id,
      leaveData.leave_dates,
      leaveData.plc_id,
    );
    if (!datesResult.success) {
      // Rollback: delete the header we just created
      await (supabase as NonNullable<typeof supabase>)
        .schema("hr")
        .from("personnel_leave_out")
        .delete()
        .eq("id", inserted.id);
      return {
        success: false,
        error: `Leave filed but date deduction failed: ${datesResult.error}`,
      };
    }
  }

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

  const updateData: Record<string, string | number | null> = {};
  if (leaveData.per_id) updateData.per_id = leaveData.per_id;
  if (leaveData.los_id) updateData.los_id = leaveData.los_id;
  if (leaveData.applied_date) updateData.applied_date = leaveData.applied_date;
  if (leaveData.status) updateData.status = leaveData.status;
  if (leaveData.remarks !== undefined) updateData.remarks = leaveData.remarks;
  if (leaveData.credits !== undefined) updateData.credits = leaveData.credits;
  if (leaveData.pay_amount !== undefined)
    updateData.pay_amount = leaveData.pay_amount;
  if (leaveData.approved_date !== undefined)
    updateData.approved_date = leaveData.approved_date;
  if (leaveData.approved_by !== undefined)
    updateData.approved_by = leaveData.approved_by;

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
    row.in = params.time;
  } else {
    row.out = params.time;
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
