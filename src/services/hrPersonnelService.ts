/**
 * hrPersonnelService.ts
 * Personnel (employee) CRUD, CSC Form 241 service records,
 * and per-employee profile sub-queries (leave, pay slips, documents, audit).
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import type { PayrollEntry, PaySlipDeduction } from "@/types/hr.types";

// =============================================================================
// Interfaces
// =============================================================================

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
  // CSC extended fields (migration 010)
  sex?: "male" | "female" | "";
  nationality?: string;
  email?: string;
  appointment_type?:
    | "original"
    | "reappointment"
    | "promotion"
    | "transfer"
    | "reinstatement"
    | "demotion"
    | "";
  date_assumed?: string;
  civil_service_eligibility?: string;
}

export interface ServiceRecord {
  id: string;
  pos_id: string | null;
  position_title: string | null;
  salary_grade: number | null;
  o_id: string | null;
  office_name: string | null;
  record_type:
    | "appointment"
    | "promotion"
    | "transfer"
    | "reinstatement"
    | "reappointment"
    | "separation"
    | "step_increment";
  appointment_status: string | null;
  monthly_salary: number;
  effective_date: string;
  end_date: string | null;
  separation_type: string | null;
  remarks: string;
  created_at: string;
}

export interface ServiceRecordFormData {
  pos_id?: string;
  o_id?: string;
  record_type: ServiceRecord["record_type"];
  /** CSC appointment status: Permanent, Casual, Temporary, etc. */
  appointment_status?: string;
  monthly_salary: number;
  effective_date: string;
  end_date?: string;
  /** Required when record_type = 'separation' */
  separation_type?: string;
  remarks: string;
}

export interface PersonnelDocument {
  id: string;
  per_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  remarks: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonnelAuditEntry {
  id: string;
  per_id: string;
  action: string;
  changed_fields: string[] | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_by: string | null;
  remarks: string | null;
  created_at: string;
}

// =============================================================================
// Employee CRUD
// =============================================================================

/**
 * Create a new employee in hr.personnel table
 */
export const createEmployee = async (
  employeeData: EmployeeFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  // Convert empty strings to null for optional / unique / constrained columns
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
    // Migration 010 — empty string would violate CHECK constraints
    sex: employeeData.sex || null,
    nationality: employeeData.nationality || "Filipino",
    email: employeeData.email || null,
    appointment_type: employeeData.appointment_type || null,
    date_assumed: employeeData.date_assumed || null,
    civil_service_eligibility: employeeData.civil_service_eligibility || null,
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
 * Persist the profile photo storage path back to hr.personnel.profile_photo_path.
 * Call this after a successful upload to the 'profile_picture' storage bucket.
 * @param personnelId - hr.personnel.id (UUID)
 * @param storagePath - relative path within the bucket (e.g. "per_uuid/photo.jpg")
 */
export const updateEmployeeProfilePhoto = async (
  personnelId: string,
  storagePath: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update({ profile_photo_path: storagePath })
    .eq("id", personnelId);

  if (error) {
    console.error("Error updating profile photo path:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Deactivate an employee (separate from service).
 *
 * Sets is_active = false, separation_type, and separation_date in one atomic
 * UPDATE so that trg_auto_service_record (migration 013) sees the correct
 * separation_type when it fires AFTER UPDATE OF is_active.
 *
 * trg_set_separation_date (migration 014) only stamps CURRENT_DATE when
 * separation_date IS NULL — since we pass it explicitly here, the trigger
 * leaves our value intact.
 */
export const deactivateEmployee = async (
  id: string,
  payload: {
    separation_type: string;
    separation_date: string;
    remarks?: string;
  },
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update({
      is_active: false,
      separation_type: payload.separation_type,
      separation_date: payload.separation_date,
    })
    .eq("id", id);

  if (error) {
    console.error("Error deactivating employee:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * Reinstate a previously separated employee.
 *
 * Sets is_active = true. trg_set_separation_date (migration 014) clears
 * separation_date and separation_type automatically on BEFORE UPDATE.
 */
export const reinstateEmployee = async (
  id: string,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .update({ is_active: true })
    .eq("id", id);

  if (error) {
    console.error("Error reinstating employee:", error);
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

// =============================================================================
// CSC Form 241 — Service Records
// =============================================================================

export const fetchServiceRecords = async (
  perId: string,
): Promise<ServiceRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("service_record")
    .select(
      `
      id, pos_id, o_id, record_type, appointment_status,
      monthly_salary, effective_date, end_date, separation_type, remarks, created_at,
      position:pos_id ( description, salary_grade ),
      office:o_id ( description )
    `,
    )
    .eq("per_id", perId)
    .order("effective_date", { ascending: false });

  if (error) {
    console.error("Error fetching service records:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const pos = row.position as
      | Record<string, string>
      | Record<string, string>[]
      | null;
    const posObj = Array.isArray(pos) ? pos[0] : pos;
    const off = row.office as
      | Record<string, string>
      | Record<string, string>[]
      | null;
    const offObj = Array.isArray(off) ? off[0] : off;
    return {
      id: row.id as string,
      pos_id: (row.pos_id as string) || null,
      position_title: posObj?.description ?? null,
      salary_grade: posObj
        ? ((posObj.salary_grade as unknown as number | null) ?? null)
        : null,
      o_id: (row.o_id as string) || null,
      office_name: offObj?.description ?? null,
      record_type: row.record_type as ServiceRecord["record_type"],
      appointment_status: (row.appointment_status as string) || null,
      monthly_salary: Number(row.monthly_salary) || 0,
      effective_date: row.effective_date as string,
      end_date: (row.end_date as string) || null,
      separation_type: (row.separation_type as string) || null,
      remarks: (row.remarks as string) || "",
      created_at: row.created_at as string,
    };
  });
};

/**
 * Manually create a CSC Form 241 service record entry for a personnel member.
 * Used by HR to record deliberate actions (promotion, step increment, etc.)
 * that may not be auto-detected by the DB trigger.
 */
export const createServiceRecord = async (
  perId: string,
  formData: ServiceRecordFormData,
): Promise<{ success: boolean; error?: string }> => {
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: "Supabase is not configured" };
  }

  const { error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("service_record")
    .insert({
      per_id: perId,
      pos_id: formData.pos_id || null,
      o_id: formData.o_id || null,
      record_type: formData.record_type,
      appointment_status: formData.appointment_status?.trim() || null,
      monthly_salary: formData.monthly_salary,
      effective_date: formData.effective_date,
      end_date: formData.end_date || null,
      separation_type: formData.separation_type || null,
      remarks: formData.remarks.trim(),
    });

  if (error) {
    console.error("Error creating service record:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
};

// =============================================================================
// Per-employee profile sub-queries
// =============================================================================

/**
 * Fetch leave applications for a specific personnel member.
 */
export const fetchPersonnelLeaveApplications = async (perId: string) => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_leave_out")
    .select(
      `
      id, applied_date, approved_date, pay_amount, credits, status, remarks,
      details, credit_balance_before,
      leave_out_subtype:los_id ( code, description, lot_id )
    `,
    )
    .eq("per_id", perId)
    .order("applied_date", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching personnel leave applications:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const sub = row.leave_out_subtype as
      | Record<string, string>
      | Record<string, string>[]
      | null;
    const subObj = Array.isArray(sub) ? sub[0] : sub;
    return {
      id: row.id as string,
      applied_date: row.applied_date as string,
      approved_date: (row.approved_date as string) || null,
      leave_type: subObj?.code ?? "—",
      leave_type_desc: subObj?.description ?? "—",
      lot_id: (subObj?.lot_id ?? null) as string | null,
      credits: Number(row.credits) || 0,
      pay_amount: Number(row.pay_amount) || 0,
      status: row.status as string,
      remarks: (row.remarks as string) || "",
      details: (row.details as Record<string, unknown>) ?? null,
      credit_balance_before:
        row.credit_balance_before != null
          ? Number(row.credit_balance_before)
          : null,
    };
  });
};

/**
 * Fetch pay slips for a specific personnel member.
 */
export const fetchPersonnelPaySlips = async (
  perId: string,
): Promise<PayrollEntry[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("pay_slip")
    .select(
      `
      id, per_id, period_start, period_end, period_type,
      gross_amount, total_deductions, net_amount,
      status, created_at,
      pay_slip_deductions (
        id, deduction_type_id, amount, remarks,
        deduction_type:deduction_type_id ( code, description )
      )
    `,
    )
    .eq("per_id", perId)
    .order("period_start", { ascending: false })
    .limit(24);

  if (error) {
    console.error("Error fetching personnel pay slips:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const rawDeds = (row.pay_slip_deductions ?? []) as Record<
      string,
      unknown
    >[];
    const deductions: PaySlipDeduction[] = rawDeds.map((d) => {
      const dt = d.deduction_type as
        | Record<string, string>
        | Record<string, string>[]
        | null;
      const dtObj = Array.isArray(dt) ? dt[0] : dt;
      return {
        id: d.id as string,
        deduction_type_id: d.deduction_type_id as string,
        code: dtObj?.code ?? "",
        description: dtObj?.description ?? "",
        amount: Number(d.amount) || 0,
        remarks: (d.remarks as string) ?? "",
      };
    });
    return {
      id: row.id as string,
      employee_id: row.per_id as string,
      employee_name: "",
      period_start: row.period_start as string,
      period_end: row.period_end as string,
      period_type: row.period_type as PayrollEntry["period_type"],
      gross_amount: Number(row.gross_amount) || 0,
      total_deductions: Number(row.total_deductions) || 0,
      net_amount: Number(row.net_amount) || 0,
      deductions,
      status: row.status as PayrollEntry["status"],
      created_at: row.created_at as string,
    };
  });
};

/**
 * Fetch uploaded documents for a specific personnel member.
 */
export const fetchPersonnelDocuments = async (
  perId: string,
): Promise<PersonnelDocument[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_document")
    .select(
      "id, per_id, document_type, file_name, file_path, file_size, remarks, uploaded_by, created_at, updated_at",
    )
    .eq("per_id", perId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching personnel documents:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    per_id: row.per_id as string,
    document_type: row.document_type as string,
    file_name: row.file_name as string,
    file_path: row.file_path as string,
    file_size: (row.file_size as number) ?? null,
    remarks: (row.remarks as string) ?? null,
    uploaded_by: (row.uploaded_by as string) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }));
};

/**
 * Fetch audit log entries for a specific personnel member.
 */
export const fetchPersonnelAuditLog = async (
  perId: string,
): Promise<PersonnelAuditEntry[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel_audit_log")
    .select(
      "id, per_id, action, changed_fields, old_values, new_values, changed_by, remarks, created_at",
    )
    .eq("per_id", perId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching personnel audit log:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    per_id: row.per_id as string,
    action: row.action as string,
    changed_fields: (row.changed_fields as string[]) ?? null,
    old_values: (row.old_values as Record<string, unknown>) ?? null,
    new_values: (row.new_values as Record<string, unknown>) ?? null,
    changed_by: (row.changed_by as string) ?? null,
    remarks: (row.remarks as string) ?? null,
    created_at: row.created_at as string,
  }));
};
