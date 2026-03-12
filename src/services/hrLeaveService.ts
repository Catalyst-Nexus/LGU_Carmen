/**
 * hrLeaveService.ts
 * Leave management: subtypes, credits, applications, and date deductions.
 * Covers: hr.leave_out_subtype, hr.personnel_leave_credits,
 *         hr.personnel_leave_out, hr.leave_out_dates
 */
import { supabase, isSupabaseConfigured } from "./supabase";

// =============================================================================
// Interfaces
// =============================================================================

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

// =============================================================================
// Fetch helpers
// =============================================================================

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
 * Fetch all active personnel for leave application dropdown.
 * Also returns monthly_salary via the position → salary_rate → rate chain.
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
