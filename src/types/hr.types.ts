export interface Employee {
  id: string;
  /** Maps to hr.position.item_no */
  employee_number: string;
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
  office_id: string;
  office_name: string;
  pos_type: string;
  is_filled: boolean;
  incumbent_name: string | null;
  created_at: string;
  /** Slot info like "2/3" (filled/total) for same position title + office */
  slot_info: string;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type:
    | "VL"
    | "SL"
    | "ML"
    | "PL"
    | "SPL"
    | "FL"
    | "CL"
    | "BL"
    | "LWOP"
    | "BDAY"
    | "STL"
    | "VAWC"
    | "OB"
    | "REHAB"
    | "SPL_MAGNA_CARTA"
    | "CTO"
    | "FORCE"
    | "COMP"
    | "OT"
    | "RT";
  date_from: string;
  date_to: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  approved_by: string | null;
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
  payroll_period_id: string;
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
  fund_type: "GF" | "SEF" | "LDRRMF" | "SHF" | "DEVFUND" | "TRUST";
  status: "draft" | "computed" | "approved" | "released";
  created_at: string;
}
