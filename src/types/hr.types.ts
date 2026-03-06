export interface Employee {
  id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  position_id: string;
  position_title: string;
  office_id: string;
  office_name: string;
  salary_grade: number;
  step: number;
  monthly_salary: number;
  employment_status:
    | "permanent"
    | "casual"
    | "coterminous"
    | "contractual"
    | "job_order";
  date_hired: string;
  is_active: boolean;
  created_at: string;
}

export interface PlantillaPosition {
  id: string;
  item_number: string;
  position_title: string;
  salary_grade: number;
  office_id: string;
  office_name: string;
  is_filled: boolean;
  incumbent_id: string | null;
  authorization: string;
  created_at: string;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  leave_type: "VL" | "SL" | "ML" | "PL" | "SPL" | "FL" | "CL";
  date_from: string;
  date_to: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  approved_by: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  hours_worked: number;
  status: "present" | "absent" | "late" | "halfday" | "holiday";
  created_at: string;
}

export interface PayrollEntry {
  id: string;
  payroll_period_id: string;
  employee_id: string;
  employee_name: string;
  fund_type: string;
  basic_pay: number;
  pera: number;
  gross_pay: number;
  gsis: number;
  philhealth: number;
  pagibig: number;
  bir_tax: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
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
  status: "open" | "computed" | "approved" | "closed";
  created_at: string;
}
