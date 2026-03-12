export interface Employee {
  id: string;
  /** Auto-generated employee number (e.g. EMP-0001). Follows the person, not the position. */
  employee_no: string;
  /** Plantilla Item No. from hr.position.item_no — follows the position slot */
  plantilla_item_no: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  position_id: string;
  /** Maps to hr.position.description */
  position_title: string;
  office_id: string;
  /** Maps to hr.office.description */
  office_name: string;
  /** Populated when joined via salary_rate chain; optional */
  salary_grade?: number | null;
  step?: number | null;
  monthly_salary?: number | null;
  employment_status:
    | "permanent"
    | "casual"
    | "coterminous"
    | "contractual"
    | "job_order";
  date_hired: string;
  is_active: boolean;
  created_at: string;
  /** auth.users.id — null when no system account has been linked */
  user_id: string | null;
  /** Date the employee was separated (null while still active) */
  separation_date: string | null;
  /** Reason for separation; null while still active */
  separation_type: string | null;
}

export interface PlantillaPosition {
  id: string;
  item_number: string;
  position_title: string;
  /** e.g. "SG-10 Step 1" */
  salary_grade: string;
  /** Monthly salary amount from hr.rate */
  monthly_salary: number;
  /** Legal basis — e.g. "SB Ord. No. 2024-015" or "RA 11466" */
  authorization: string;
  /** DBM fund source: GF, SEF, LDRRMF, SHF, DEVFUND, TRUST */
  funding_source: string | null;
  office_id: string;
  office_name: string;
  /** Raw FK to hr.salary_rate — used for edit form pre-population */
  sr_id: string;
  /** Raw FK to hr.pos_type — used for edit form pre-population */
  pt_id: string;
  pos_type: string;
  is_filled: boolean;
  is_active: boolean;
  incumbent_name: string | null;
  incumbent_id: string | null;
  created_at: string;
  /** Slot info like "2/3" (filled/total) for same position title + office */
  slot_info: string;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  leave_type_desc: string;
  applied_date: string;
  approved_date: string | null;
  approved_by: string | null;
  approved_by_name: string | null;
  pay_amount: number;
  credits: number;
  remarks: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  created_at: string;
}

export interface TimeSlotSchedule {
  id: string;
  description: string;
  time_start: string;
  time_end: string;
  /** 1 = count on clock-in day, 2 = count on next day */
  actual_date: 1 | 2;
  is_midnight_crossing: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  /** Clock-in time (maps to hr.time_record."in") */
  in: string | null;
  /** Clock-out time (maps to hr.time_record."out") */
  out: string | null;
  /** FK to hr.time_slot_schedule */
  time_slot_id: string | null;
  /** Time slot description (joined) */
  time_slot_desc: string | null;
  /** 1 = IN record, 2 = OUT record */
  time_identifier: 1 | 2;
  /** Computed total hours for the paired IN/OUT */
  total_hours: number;
  /** Trigger-computed pay */
  pay_amount: number;
  status: "present" | "absent" | "late" | "halfday" | "holiday";
  created_at: string;
}

export interface PaySlipDeduction {
  id: string;
  deduction_type_id: string;
  /** Deduction type code (e.g. GSIS_PS, PHILHEALTH) */
  code?: string;
  description?: string;
  amount: number;
  remarks: string;
}

export interface PayrollEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  period_start: string;
  period_end: string;
  period_type: "first_half" | "second_half" | "monthly" | "special";
  gross_amount: number;
  total_deductions: number;
  net_amount: number;
  /** Flexible deductions from hr.pay_slip_deductions */
  deductions: PaySlipDeduction[];
  status: "draft" | "computed" | "approved" | "released";
  created_at: string;
}

export interface PayrollPeriod {
  id: string;
  period_name: string;
  date_from: string;
  date_to: string;
  fiscal_year: number;
  fund_type: string;
  total_amount: number;
  status: "draft" | "computed" | "approved" | "released";
  prepared_by: string | null;
  certified_by: string | null;
  approved_by: string | null;
  date_prepared: string | null;
  date_certified: string | null;
  date_approved: string | null;
  created_at: string;
}

export interface DeductionType {
  id: string;
  code: string;
  description: string;
  computation_type: "fixed" | "percentage" | "tax_table" | "manual";
  default_rate: number;
  is_mandatory: boolean;
  is_active: boolean;
}
