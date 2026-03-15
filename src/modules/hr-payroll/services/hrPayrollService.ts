/**
 * hrPayrollService.ts
 * Payroll periods, pay slips, deduction types, and remittance reports.
 * Covers: hr.deduction_type, hr.payroll, hr.pay_slip, hr.pay_slip_deductions
 */
import { supabase, isSupabaseConfigured } from "@/services/supabase";
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
// Generate Payroll
// =============================================================================

/** Per-employee data returned by generatePayroll — feeds both payroll register & payslip PDFs. */
export interface GeneratedSlipInfo {
  paySlipId: string;
  perId: string;
  employeeName: string;
  employeeNo: string;
  positionTitle: string;
  officeName: string;
  rate: number;
  daysWorked: number;
  basicPay: number;
  overtimeHours: number;
  overtimePay: number;
  grossAmount: number;
  deductions: { code: string; label: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
}

export interface GeneratedPayrollResult {
  payrollId: string;
  employees: GeneratedSlipInfo[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJoin = any;

/** Unwrap a Supabase join that may be object or single-element array. */
const unwrap = <T>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/**
 * Generate a full payroll for the given period:
 * 1. Upsert pay_slip rows from time records
 * 2. Upsert mandatory deductions on each slip
 * 3. Create / update the hr.payroll batch record
 * 4. Link pay slips → payroll via hr.payroll_pay_slips
 *
 * Returns the payroll ID + per-employee data for PDF generation.
 */
export const generatePayroll = async (
  periodStart: string,
  periodEnd: string,
  periodType:
    | "first_half"
    | "second_half"
    | "monthly"
    | "special" = "first_half",
): Promise<GeneratedPayrollResult> => {
  if (!isSupabaseConfigured() || !supabase)
    throw new Error("Supabase not configured");
  const sb = supabase as NonNullable<typeof supabase>;

  // 1. Fetch complete time records for the period
  const { data: timeRecords, error: trErr } = await sb
    .schema("hr")
    .from("time_record")
    .select("id, per_id, date, pay_amount, out")
    .gte("date", periodStart)
    .lte("date", periodEnd)
    .not("out", "is", null);

  if (trErr) throw new Error(`Failed to fetch time records: ${trErr.message}`);
  if (!timeRecords || timeRecords.length === 0)
    throw new Error("No complete time records found for this period.");

  // 2. Group time records by employee
  const byEmployee = new Map<
    string,
    { ids: string[]; gross: number; dates: Set<string> }
  >();
  for (const tr of timeRecords) {
    const perId = tr.per_id as string;
    if (!byEmployee.has(perId))
      byEmployee.set(perId, { ids: [], gross: 0, dates: new Set() });
    const entry = byEmployee.get(perId)!;
    entry.ids.push(tr.id as string);
    entry.gross += Number(tr.pay_amount) || 0;
    entry.dates.add(tr.date as string);
  }

  // 3. Fetch personnel details
  const perIds = Array.from(byEmployee.keys());
  const { data: personnelRows } = await sb
    .schema("hr")
    .from("personnel")
    .select(
      `id, first_name, last_name, employee_no,
       position:pos_id ( description, salary_rate:sr_id ( rate:rate_id ( amount ) ) ),
       office:o_id ( description )`,
    )
    .in("id", perIds);

  const personnelMap = new Map<string, AnyJoin>();
  for (const p of personnelRows ?? []) personnelMap.set(p.id as string, p);

  // 4. Fetch active mandatory deduction types
  const { data: dedTypes, error: dtErr } = await sb
    .schema("hr")
    .from("deduction_type")
    .select(
      "id, code, description, computation_type, default_rate, is_mandatory",
    )
    .eq("is_active", true)
    .eq("is_mandatory", true);
  if (dtErr)
    throw new Error(`Failed to fetch deduction types: ${dtErr.message}`);

  // 5. Fetch approved leave_outs in the period
  const { data: leaveOuts } = await sb
    .schema("hr")
    .from("personnel_leave_out")
    .select("id, per_id")
    .eq("status", "approved")
    .gte("applied_date", periodStart)
    .lte("applied_date", periodEnd);

  const leavesByEmployee = new Map<string, string[]>();
  for (const lo of leaveOuts || []) {
    const perId = lo.per_id as string;
    if (!leavesByEmployee.has(perId)) leavesByEmployee.set(perId, []);
    leavesByEmployee.get(perId)!.push(lo.id as string);
  }

  // 6. Process each employee
  const results: GeneratedSlipInfo[] = [];
  const slipIds: string[] = [];

  for (const [perId, { ids: trIds, gross, dates }] of byEmployee) {
    const person = personnelMap.get(perId);
    const pos = unwrap(person?.position);
    const ofc = unwrap(person?.office);

    let dailyRate = 0;
    if (pos?.salary_rate) {
      const sr = unwrap(pos.salary_rate);
      const r = unwrap(sr?.rate);
      dailyRate = Number(r?.amount) || 0;
    }

    const daysWorked = dates.size;

    // Compute mandatory deductions
    const deductions: {
      deduction_type_id: string;
      code: string;
      label: string;
      amount: number;
    }[] = [];
    let totalDeductions = 0;
    for (const dt of dedTypes || []) {
      let amount = 0;
      if (dt.computation_type === "percentage") {
        amount = Math.round(gross * Number(dt.default_rate) * 100) / 100;
      } else if (dt.computation_type === "fixed") {
        amount = Number(dt.default_rate);
      }
      if (amount > 0) {
        deductions.push({
          deduction_type_id: dt.id as string,
          code: dt.code as string,
          label: dt.description as string,
          amount,
        });
        totalDeductions += amount;
      }
    }
    totalDeductions = Math.round(totalDeductions * 100) / 100;

    // Upsert pay_slip
    const { data: slip, error: slipErr } = await sb
      .schema("hr")
      .from("pay_slip")
      .upsert(
        {
          per_id: perId,
          period_start: periodStart,
          period_end: periodEnd,
          period_type: periodType,
          gross_amount: Math.round(gross * 100) / 100,
          total_deductions: totalDeductions,
          status: "computed",
        },
        { onConflict: "per_id,period_start,period_end" },
      )
      .select("id")
      .single();

    if (slipErr || !slip) {
      console.error(`Failed to upsert pay_slip for ${perId}:`, slipErr);
      continue;
    }
    const slipId = slip.id as string;
    slipIds.push(slipId);

    // Link time records
    await sb
      .schema("hr")
      .from("pay_slip_time_records")
      .delete()
      .eq("pay_slip_id", slipId);
    await sb
      .schema("hr")
      .from("pay_slip_time_records")
      .insert(
        trIds.map((time_record_id) => ({
          pay_slip_id: slipId,
          time_record_id,
        })),
      );

    // Upsert deductions
    if (deductions.length > 0) {
      await sb
        .schema("hr")
        .from("pay_slip_deductions")
        .upsert(
          deductions.map((d) => ({
            pay_slip_id: slipId,
            deduction_type_id: d.deduction_type_id,
            amount: d.amount,
          })),
          { onConflict: "pay_slip_id,deduction_type_id" },
        );
    }

    // Link leave outs
    const empLeaves = leavesByEmployee.get(perId);
    if (empLeaves && empLeaves.length > 0) {
      await sb
        .schema("hr")
        .from("pay_slip_leave_outs")
        .delete()
        .eq("pay_slip_id", slipId);
      await sb
        .schema("hr")
        .from("pay_slip_leave_outs")
        .insert(
          empLeaves.map((leave_out_id) => ({
            pay_slip_id: slipId,
            leave_out_id,
          })),
        );
    }

    results.push({
      paySlipId: slipId,
      perId,
      employeeName: person
        ? `${person.first_name} ${person.last_name}`.toUpperCase()
        : "—",
      employeeNo: person?.employee_no ?? "—",
      positionTitle: pos?.description ?? "—",
      officeName: ofc?.description ?? "—",
      rate: dailyRate,
      daysWorked,
      basicPay: Math.round(gross * 100) / 100,
      overtimeHours: 0,
      overtimePay: 0,
      grossAmount: Math.round(gross * 100) / 100,
      deductions: deductions.map((d) => ({
        code: d.code,
        label: d.label,
        amount: d.amount,
      })),
      totalDeductions,
      netPay: Math.round((gross - totalDeductions) * 100) / 100,
    });
  }

  // 7. Create / update payroll batch record
  const totalGross = results.reduce((s, e) => s + e.grossAmount, 0);
  const fmtD = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };
  const year = new Date(periodStart + "T00:00:00").getFullYear();
  const periodName = `${fmtD(periodStart)} - ${fmtD(periodEnd)}, ${year}`;

  // Check if payroll already exists for this period
  const { data: existing } = await sb
    .schema("hr")
    .from("payroll")
    .select("id")
    .eq("date_from", periodStart)
    .eq("date_to", periodEnd)
    .eq("fund_type", "GF")
    .maybeSingle();

  let payrollId: string;

  if (existing) {
    await sb
      .schema("hr")
      .from("payroll")
      .update({
        total_amount: Math.round(totalGross * 100) / 100,
        status: "computed",
      })
      .eq("id", existing.id);
    payrollId = existing.id as string;
  } else {
    const { data: payroll, error: payrollErr } = await sb
      .schema("hr")
      .from("payroll")
      .insert({
        period_name: periodName,
        date_from: periodStart,
        date_to: periodEnd,
        fiscal_year: year,
        fund_type: "GF",
        total_amount: Math.round(totalGross * 100) / 100,
        status: "computed",
      })
      .select("id")
      .single();
    if (payrollErr || !payroll)
      throw new Error(`Failed to create payroll: ${payrollErr?.message}`);
    payrollId = payroll.id as string;
  }

  // 8. Link pay slips to payroll
  await sb
    .schema("hr")
    .from("payroll_pay_slips")
    .delete()
    .eq("payroll_id", payrollId);
  if (slipIds.length > 0) {
    await sb
      .schema("hr")
      .from("payroll_pay_slips")
      .insert(
        slipIds.map((pay_slip_id) => ({ payroll_id: payrollId, pay_slip_id })),
      );
  }

  return { payrollId, employees: results };
};

// =============================================================================
// Fetch single pay slip detail for individual payslip PDF
// =============================================================================

export interface PaySlipDetail {
  paySlipId: string;
  employeeName: string;
  employeeNo: string;
  positionTitle: string;
  officeName: string;
  periodStart: string;
  periodEnd: string;
  rate: number;
  daysWorked: number;
  basicPay: number;
  grossAmount: number;
  deductions: { code: string; label: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
}

export const fetchPaySlipDetailForPDF = async (
  paySlipId: string,
): Promise<PaySlipDetail | null> => {
  if (!isSupabaseConfigured() || !supabase) return null;
  const sb = supabase as NonNullable<typeof supabase>;

  const { data, error } = await sb
    .schema("hr")
    .from("pay_slip")
    .select(
      `id, per_id, period_start, period_end,
       gross_amount, total_deductions, net_amount,
       personnel:per_id (
         first_name, last_name, employee_no,
         position:pos_id ( description, salary_rate:sr_id ( rate:rate_id ( amount ) ) ),
         office:o_id ( description )
       ),
       pay_slip_deductions (
         amount,
         deduction_type:deduction_type_id ( code, description )
       ),
       pay_slip_time_records ( time_record_id )`,
    )
    .eq("id", paySlipId)
    .single();

  if (error || !data) return null;

  const person = unwrap((data as AnyJoin).personnel);
  const pos = unwrap(person?.position);
  const ofc = unwrap(person?.office);

  let rate = 0;
  if (pos?.salary_rate) {
    const sr = unwrap(pos.salary_rate);
    const r = unwrap(sr?.rate);
    rate = Number(r?.amount) || 0;
  }

  const rawDeds = ((data as AnyJoin).pay_slip_deductions ?? []) as AnyJoin[];
  const deductions = rawDeds.map((d: AnyJoin) => {
    const dt = unwrap(d.deduction_type);
    return {
      code: (dt?.code as string) ?? "",
      label: (dt?.description as string) ?? "",
      amount: Number(d.amount) || 0,
    };
  });

  const trCount = ((data as AnyJoin).pay_slip_time_records ?? []).length;

  return {
    paySlipId: data.id as string,
    employeeName: person
      ? `${person.first_name} ${person.last_name}`.toUpperCase()
      : "—",
    employeeNo: person?.employee_no ?? "—",
    positionTitle: pos?.description ?? "—",
    officeName: ofc?.description ?? "—",
    periodStart: data.period_start as string,
    periodEnd: data.period_end as string,
    rate,
    daysWorked: trCount,
    basicPay: Number(data.gross_amount) || 0,
    grossAmount: Number(data.gross_amount) || 0,
    deductions,
    totalDeductions: Number(data.total_deductions) || 0,
    netPay: Number(data.net_amount) || 0,
  };
};

// =============================================================================
// Fetch pay slips linked to a specific payroll (for employee table + PDF)
// =============================================================================

export interface PayrollPaySlipRow {
  id: string;
  paySlipId: string;
  employeeName: string;
  employeeNo: string;
  positionTitle: string;
  officeName: string;
  rate: number;
  daysWorked: number;
  basicPay: number;
  grossAmount: number;
  deductions: { code: string; label: string; amount: number }[];
  totalDeductions: number;
  netAmount: number;
  status: string;
}

/**
 * Fetch all pay slips linked to a payroll, with full employee & deduction details.
 * Used both for the employee table UI and payroll register PDF regeneration.
 */
export const fetchPayrollPaySlips = async (
  payrollId: string,
): Promise<PayrollPaySlipRow[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];
  const sb = supabase as NonNullable<typeof supabase>;

  const { data: links, error: linkErr } = await sb
    .schema("hr")
    .from("payroll_pay_slips")
    .select(
      `pay_slip:pay_slip_id (
        id, per_id, gross_amount, total_deductions, net_amount, status,
        personnel:per_id (
          first_name, last_name, employee_no,
          position:pos_id ( description, salary_rate:sr_id ( rate:rate_id ( amount ) ) ),
          office:o_id ( description )
        ),
        pay_slip_deductions (
          amount,
          deduction_type:deduction_type_id ( code, description )
        ),
        pay_slip_time_records ( time_record_id )
      )`,
    )
    .eq("payroll_id", payrollId);

  if (linkErr || !links) {
    console.error("Error fetching payroll pay slips:", linkErr);
    return [];
  }

  return (links as AnyJoin[]).map((link) => {
    const slip = unwrap(link.pay_slip);
    if (!slip) return null;

    const person = unwrap(slip.personnel);
    const pos = unwrap(person?.position);
    const ofc = unwrap(person?.office);

    let rate = 0;
    if (pos?.salary_rate) {
      const sr = unwrap(pos.salary_rate);
      const r = unwrap(sr?.rate);
      rate = Number(r?.amount) || 0;
    }

    const rawDeds = (slip.pay_slip_deductions ?? []) as AnyJoin[];
    const deductions = rawDeds.map((d: AnyJoin) => {
      const dt = unwrap(d.deduction_type);
      return {
        code: (dt?.code as string) ?? "",
        label: (dt?.description as string) ?? "",
        amount: Number(d.amount) || 0,
      };
    });

    const trCount = (slip.pay_slip_time_records ?? []).length;

    return {
      id: slip.id as string,
      paySlipId: slip.id as string,
      employeeName: person
        ? `${person.first_name} ${person.last_name}`.toUpperCase()
        : "—",
      employeeNo: person?.employee_no ?? "—",
      positionTitle: pos?.description ?? "—",
      officeName: ofc?.description ?? "—",
      rate,
      daysWorked: trCount,
      basicPay: Number(slip.gross_amount) || 0,
      grossAmount: Number(slip.gross_amount) || 0,
      deductions,
      totalDeductions: Number(slip.total_deductions) || 0,
      netAmount: Number(slip.net_amount) || 0,
      status: slip.status as string,
    };
  }).filter(Boolean) as PayrollPaySlipRow[];
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
