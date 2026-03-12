/**
 * hrPayrollService.ts
 * Payroll periods, pay slips, deduction types, and remittance reports.
 * Covers: hr.deduction_type, hr.payroll, hr.pay_slip, hr.pay_slip_deductions
 */
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  DeductionType,
  PayrollPeriod,
  PayrollEntry,
  PaySlipDeduction,
} from "@/types/hr.types";

// =============================================================================
// Deduction Types
// =============================================================================

/**
 * Fetch all active deduction types from hr.deduction_type
 */
export const fetchDeductionTypes = async (): Promise<DeductionType[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("deduction_type")
    .select(
      "id, code, description, computation_type, default_rate, is_mandatory, is_active",
    )
    .eq("is_active", true)
    .order("code");

  if (error) {
    console.error("Error fetching deduction types:", error);
    return [];
  }

  return (data || []).map((d) => ({
    id: d.id as string,
    code: d.code as string,
    description: d.description as string,
    computation_type: d.computation_type as DeductionType["computation_type"],
    default_rate: Number(d.default_rate) || 0,
    is_mandatory: d.is_mandatory as boolean,
    is_active: d.is_active as boolean,
  }));
};

// =============================================================================
// Payroll Periods
// =============================================================================

/**
 * Fetch all payroll periods from hr.payroll
 */
export const fetchPayrollPeriods = async (): Promise<PayrollPeriod[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("payroll")
    .select("*")
    .order("date_from", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching payroll periods:", error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id as string,
    period_name: p.period_name as string,
    date_from: p.date_from as string,
    date_to: p.date_to as string,
    fiscal_year: Number(p.fiscal_year),
    fund_type: p.fund_type as string,
    total_amount: Number(p.total_amount) || 0,
    status: p.status as PayrollPeriod["status"],
    prepared_by: (p.prepared_by as string) ?? null,
    certified_by: (p.certified_by as string) ?? null,
    approved_by: (p.approved_by as string) ?? null,
    date_prepared: (p.date_prepared as string) ?? null,
    date_certified: (p.date_certified as string) ?? null,
    date_approved: (p.date_approved as string) ?? null,
    created_at: p.created_at as string,
  }));
};

// =============================================================================
// Pay Slips
// =============================================================================

/**
 * Fetch all pay slips with nested deductions and employee info.
 */
export const fetchPaySlips = async (): Promise<PayrollEntry[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("pay_slip")
    .select(
      `
      id, per_id, period_start, period_end, period_type,
      gross_amount, total_deductions, net_amount,
      status, created_at,
      personnel:per_id ( first_name, last_name ),
      pay_slip_deductions (
        id, deduction_type_id, amount, remarks,
        deduction_type:deduction_type_id ( code, description )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    console.error("Error fetching pay slips:", error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const per = row.personnel as
      | Record<string, string>
      | Record<string, string>[]
      | null;
    const person = Array.isArray(per) ? per[0] : per;
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
      employee_name: person ? `${person.last_name}, ${person.first_name}` : "—",
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

// =============================================================================
// Daily Pay Records (Attendance Detail)
// =============================================================================

export interface DailyPayRecord {
  id: string;
  date: string;
  employee_id: string;
  employee_name: string;
  time_slot_desc: string | null;
  time_in: string | null;
  time_out: string | null;
  has_out: boolean;
  total_hours: number;
  pay_amount: number;
}

type TimeRecordJoinRow = {
  id: string;
  per_id: string;
  date: string;
  in: string | null;
  out: string | null;
  total_hours: number | null;
  pay_amount: number | null;
  personnel:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null;
  time_slot_schedule:
    | { description: string }
    | { description: string }[]
    | null;
};

/**
 * Fetch per-employee per-day time records for a given date range.
 * Maps each row to a DailyPayRecord; has_out is true when the out time is set.
 */
export const fetchDailyPayRecords = async (
  periodStart: string,
  periodEnd: string,
): Promise<DailyPayRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_record")
    .select(
      `
      id, per_id, date, in, out,
      total_hours, pay_amount,
      personnel:per_id ( first_name, last_name ),
      time_slot_schedule:time_slot_id ( description )
    `,
    )
    .gte("date", periodStart)
    .lte("date", periodEnd)
    .order("date", { ascending: true })
    .order("in", { ascending: true });

  if (error) {
    console.error("Error fetching daily pay records:", error);
    return [];
  }

  return ((data as unknown as TimeRecordJoinRow[]) || []).map((row) => {
    const per = Array.isArray(row.personnel) ? row.personnel[0] : row.personnel;
    const slot = Array.isArray(row.time_slot_schedule)
      ? row.time_slot_schedule[0]
      : row.time_slot_schedule;
    return {
      id: row.id,
      date: row.date,
      employee_id: row.per_id,
      employee_name: per ? `${per.last_name}, ${per.first_name}` : "—",
      time_slot_desc: slot?.description ?? null,
      time_in: row.in,
      time_out: row.out,
      has_out: row.out !== null,
      total_hours: Number(row.total_hours) || 0,
      pay_amount: Number(row.pay_amount) || 0,
    };
  });
};

// =============================================================================
// Employee Pay Summaries
// =============================================================================

export interface EmployeePaySummary {
  id: string;
  employee_id: string;
  employee_name: string;
  days_worked: number;
  total_hours: number;
  gross_pay: number;
}

/**
 * Aggregate time records for a period into per-employee summaries.
 * days_worked = distinct dates with a complete (out != null) session.
 * total_hours / gross_pay = sum across all complete sessions.
 */
export const fetchEmployeePaySummaries = async (
  periodStart: string,
  periodEnd: string,
): Promise<EmployeePaySummary[]> => {
  const records = await fetchDailyPayRecords(periodStart, periodEnd);

  const map = new Map<
    string,
    {
      employee_id: string;
      employee_name: string;
      completeDates: Set<string>;
      total_hours: number;
      gross_pay: number;
    }
  >();

  for (const r of records) {
    if (!map.has(r.employee_id)) {
      map.set(r.employee_id, {
        employee_id: r.employee_id,
        employee_name: r.employee_name,
        completeDates: new Set(),
        total_hours: 0,
        gross_pay: 0,
      });
    }
    const entry = map.get(r.employee_id)!;
    if (r.has_out) {
      entry.completeDates.add(r.date);
      entry.total_hours += r.total_hours;
      entry.gross_pay += r.pay_amount;
    }
  }

  return Array.from(map.values())
    .map((e) => ({
      id: e.employee_id,
      employee_id: e.employee_id,
      employee_name: e.employee_name,
      days_worked: e.completeDates.size,
      total_hours: e.total_hours,
      gross_pay: e.gross_pay,
    }))
    .sort((a, b) => a.employee_name.localeCompare(b.employee_name));
};

// =============================================================================
// Remittance
// =============================================================================

/**
 * Fetch remittance summary — pay_slip_deductions grouped by deduction type,
 * joined with pay_slip for period info.
 */
export const fetchRemittanceSummary = async () => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("pay_slip_deductions")
    .select(
      `
      id, deduction_type_id, amount, remarks,
      deduction_type:deduction_type_id ( code, description ),
      pay_slip:pay_slip_id (
        period_start, period_end, status,
        personnel:per_id ( first_name, last_name )
      )
    `,
    )
    .order("deduction_type_id");

  if (error) {
    console.error("Error fetching remittance data:", error);
    return [];
  }

  return data || [];
};
