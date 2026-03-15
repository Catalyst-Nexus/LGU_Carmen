import { useState, useEffect, useRef } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import type { LeaveApplication } from "@/types/hr.types";
import type { LeaveSubtype, LeaveCredit } from "../services/hrService";
import {
  fetchLeaveSubtypes,
  fetchPersonnelForLeave,
  fetchLeaveCredits,
  fetchHolidays,
} from "../services/hrService";

interface LeaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (leaveData: LeaveFormData) => void;
  leave?: LeaveApplication | null;
  isLoading?: boolean;
}

export interface LeaveFormData {
  per_id: string;
  los_id: string;
  applied_date: string;
  credits: number;
  pay_amount: number;
  remarks: string;
  status: "pending" | "approved" | "denied" | "cancelled";
  /** Specific calendar dates of leave for leave_out_dates */
  leave_dates: string[];
  /** personnel_leave_credits.id for the matched credit row */
  plc_id: string;
  /** CSC Form 6 type-specific details: VL = { place_visited }, SL = { hospitalized, illness } */
  details?: Record<string, unknown> | null;
  /** Employee's leave credit balance at time of filing */
  credit_balance_before?: number | null;
}

interface PersonnelOption {
  id: string;
  name: string;
  monthly_salary: number;
}

// Leave types that are WITHOUT PAY — pay_amount should be 0
const WITHOUT_PAY_CODES = new Set(["LWOP", "STL", "SABL"]);

// Standard working days divisor for Philippine government daily rate computation
const WORKING_DAYS_PER_MONTH = 22;

// Returns an array of ISO date strings between start and end (inclusive),
// skipping weekends (Sat=6, Sun=0) and Philippine public holidays.
function getWorkdaysBetween(
  start: string,
  end: string,
  holidays: Set<string> = new Set(),
): string[] {
  if (!start || !end || start > end) return [];
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    const dow = cur.getDay();
    const iso = cur.toISOString().split("T")[0];
    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) {
      dates.push(iso);
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

const LeaveDialog = ({
  open,
  onClose,
  onSubmit,
  leave,
  isLoading = false,
}: LeaveDialogProps) => {
  const [employeeId, setEmployeeId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [payAmountOverride, setPayAmountOverride] = useState<string>("");
  const [payAmountManual, setPayAmountManual] = useState(false);
  const [remarks, setRemarks] = useState("");

  // CSC Form 6 — VL / SL specific detail fields
  const [placeVisited, setPlaceVisited] = useState("");
  const [hospitalized, setHospitalized] = useState(false);
  const [illness, setIllness] = useState("");

  const [employees, setEmployees] = useState<PersonnelOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveSubtype[]>([]);
  const [leaveCredits, setLeaveCredits] = useState<LeaveCredit[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  // Searchable employee dropdown
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<PersonnelOption[]>(
    [],
  );
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  // Derived: computed workdays + matched credit row
  const holidaySet = new Set(holidays);
  const leaveDates = getWorkdaysBetween(dateFrom, dateTo, holidaySet);
  const credits = leaveDates.length;

  const selectedSubtype = leaveTypes.find((lt) => lt.id === leaveTypeId);
  const matchedCredit = leaveCredits.find(
    (c) => c.lot_id === selectedSubtype?.lot_id,
  );
  const hasEnoughCredits =
    !matchedCredit || matchedCredit.current_balance >= credits;

  // Auto-compute pay amount
  const selectedEmployee = employees.find((e) => e.id === employeeId);
  const isWithoutPay = selectedSubtype
    ? WITHOUT_PAY_CODES.has(selectedSubtype.code)
    : false;
  const dailyRate = selectedEmployee
    ? selectedEmployee.monthly_salary / WORKING_DAYS_PER_MONTH
    : 0;
  const computedPayAmount = isWithoutPay ? 0 : dailyRate * credits;
  const displayPayAmount = payAmountManual
    ? payAmountOverride
    : computedPayAmount.toFixed(2);

  useEffect(() => {
    if (open) loadDropdownData();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(e.target as Node)
      ) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load credits when employee changes
  useEffect(() => {
    if (employeeId) {
      setLoadingCredits(true);
      fetchLeaveCredits(employeeId).then((data) => {
        setLeaveCredits(data);
        setLoadingCredits(false);
      });
    } else {
      setLeaveCredits([]);
    }
  }, [employeeId]);

  useEffect(() => {
    if (leave) {
      setEmployeeId(leave.employee_id);
      const emp = employees.find((e) => e.id === leave.employee_id);
      if (emp) setEmployeeSearch(emp.name);
      setAppliedDate(leave.applied_date);
      // When editing, show the stored pay amount as a manual override
      setPayAmountOverride(leave.pay_amount.toString());
      setPayAmountManual(true);
      setRemarks(leave.remarks);
      // Restore CSC detail fields
      const d = leave.details;
      if (d) {
        if (typeof d.place_visited === "string")
          setPlaceVisited(d.place_visited);
        if (typeof d.hospitalized === "boolean")
          setHospitalized(d.hospitalized);
        if (typeof d.illness === "string") setIllness(d.illness);
      }
    } else {
      resetForm();
    }
  }, [leave, employees]);

  useEffect(() => {
    setFilteredEmployees(
      employeeSearch.trim() === ""
        ? employees
        : employees.filter((emp) =>
            emp.name.toLowerCase().includes(employeeSearch.toLowerCase()),
          ),
    );
  }, [employeeSearch, employees]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const year = new Date().getFullYear();
    const [emps, types, dates] = await Promise.all([
      fetchPersonnelForLeave(),
      fetchLeaveSubtypes(),
      fetchHolidays(year, year + 1),
    ]);
    setEmployees(emps);
    setLeaveTypes(types);
    setHolidays(dates);
    setLoadingData(false);
  };

  const resetForm = () => {
    setEmployeeId("");
    setEmployeeSearch("");
    setLeaveTypeId("");
    setAppliedDate(new Date().toISOString().split("T")[0]);
    setDateFrom("");
    setDateTo("");
    setPayAmountOverride("");
    setPayAmountManual(false);
    setRemarks("");
    setPlaceVisited("");
    setHospitalized(false);
    setIllness("");
    setShowEmployeeDropdown(false);
    setLeaveCredits([]);
  };

  const handleEmployeeSelect = (emp: PersonnelOption) => {
    setEmployeeId(emp.id);
    setEmployeeSearch(emp.name);
    setShowEmployeeDropdown(false);
  };

  const isFormValid = () => {
    if (
      !employeeId ||
      !leaveTypeId ||
      !appliedDate ||
      !dateFrom ||
      !dateTo ||
      leaveDates.length === 0 ||
      !hasEnoughCredits ||
      !matchedCredit
    )
      return false;
    // CSC Form 6 type-specific validation
    if (selectedSubtype?.code === "VL" && placeVisited.trim() === "")
      return false;
    if (selectedSubtype?.code === "SL" && illness.trim() === "") return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isFormValid() || !matchedCredit) return;

    // Build CSC Form 6 details based on leave type
    let details: Record<string, unknown> | null = null;
    if (selectedSubtype?.code === "VL") {
      details = { place_visited: placeVisited.trim() };
    } else if (selectedSubtype?.code === "SL") {
      details = { hospitalized, illness: illness.trim() };
    }

    onSubmit({
      per_id: employeeId,
      los_id: leaveTypeId,
      applied_date: appliedDate,
      credits,
      pay_amount: parseFloat(displayPayAmount) || 0,
      remarks: remarks.trim(),
      status: "pending",
      leave_dates: leaveDates,
      plc_id: matchedCredit.id,
      details,
      credit_balance_before: matchedCredit.current_balance,
    });
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={leave ? "Edit Leave Application" : "File Leave Application"}
      onSubmit={handleSubmit}
      submitLabel={leave ? "Save Changes" : "File Leave"}
      isLoading={isLoading || loadingData}
    >
      <div className="space-y-4">
        {/* Employee — searchable typeahead */}
        <div className="space-y-1.5">
          <label
            htmlFor="employee"
            className="block text-sm font-medium text-foreground"
          >
            Employee <span className="text-error">*</span>
          </label>
          <div className="relative" ref={employeeDropdownRef}>
            <input
              id="employee"
              type="text"
              placeholder="Search employee by name..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setShowEmployeeDropdown(true);
                if (e.target.value === "") setEmployeeId("");
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
              disabled={loadingData}
              autoComplete="off"
            />
            {showEmployeeDropdown && filteredEmployees.length > 0 && (
              <div className="absolute z-50 w-full mt-1 max-h-48 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                    onClick={() => handleEmployeeSelect(emp)}
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            )}
            {showEmployeeDropdown &&
              filteredEmployees.length === 0 &&
              employeeSearch && (
                <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg px-3 py-2 text-sm text-muted-foreground">
                  No employees found
                </div>
              )}
          </div>
        </div>

        {/* Leave Type + Credit Balance */}
        <div className="space-y-1.5">
          <label
            htmlFor="leave-type"
            className="block text-sm font-medium text-foreground"
          >
            Leave Type <span className="text-error">*</span>
          </label>
          <select
            id="leave-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
            value={leaveTypeId}
            onChange={(e) => {
              setLeaveTypeId(e.target.value);
              // Clear CSC detail fields when leave type changes
              setPlaceVisited("");
              setHospitalized(false);
              setIllness("");
            }}
            disabled={loadingData}
          >
            <option value="">-- Select leave type --</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.description} ({type.code})
              </option>
            ))}
          </select>

          {/* Credit balance badge */}
          {employeeId &&
            leaveTypeId &&
            !loadingCredits &&
            (matchedCredit ? (
              <div
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border ${
                  hasEnoughCredits
                    ? "bg-accent/10 text-accent border-accent/20"
                    : "bg-danger/10 text-danger border-danger/20"
                }`}
              >
                <span className="font-medium">Credit Balance:</span>
                <span className="font-bold">
                  {matchedCredit.current_balance.toFixed(3)} days
                </span>
                {!hasEnoughCredits && (
                  <span className="ml-1">
                    (Insufficient — need {credits} days)
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning border border-warning/20">
                No credit record found for this leave type. Please set up leave
                credits first.
              </div>
            ))}
          {employeeId && leaveTypeId && loadingCredits && (
            <p className="text-xs text-muted">Loading credit balance...</p>
          )}
        </div>

        {/* CSC Form 6 — VL: Place to be Visited */}
        {selectedSubtype?.code === "VL" && (
          <FormInput
            id="place-visited"
            label="Place to be Visited (CSC Form 6)"
            placeholder="e.g. Manila, NCR or Abroad"
            value={placeVisited}
            onChange={setPlaceVisited}
            required
          />
        )}

        {/* CSC Form 6 — SL: Hospitalized + Nature of Illness */}
        {selectedSubtype?.code === "SL" && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                In Hospital? <span className="text-error">*</span>
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalized"
                    value="yes"
                    checked={hospitalized}
                    onChange={() => setHospitalized(true)}
                    className="accent-accent"
                  />
                  Yes (Hospitalized)
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="hospitalized"
                    value="no"
                    checked={!hospitalized}
                    onChange={() => setHospitalized(false)}
                    className="accent-accent"
                  />
                  No (Out-Patient)
                </label>
              </div>
            </div>
            <FormInput
              id="illness"
              label="Nature of Illness / Injury (CSC Form 6)"
              placeholder="e.g. Acute Gastroenteritis"
              value={illness}
              onChange={setIllness}
              required
            />
          </div>
        )}

        {/* Date Filed */}
        <div className="space-y-1.5">
          <label
            htmlFor="applied-date"
            className="block text-sm font-medium text-foreground"
          >
            Date Filed <span className="text-error">*</span>
          </label>
          <input
            id="applied-date"
            type="date"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
          />
        </div>

        {/* Leave Period (date range) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            Leave Period <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="date-from"
                className="block text-xs text-muted mb-1"
              >
                From
              </label>
              <input
                id="date-from"
                type="date"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  if (!dateTo || e.target.value > dateTo)
                    setDateTo(e.target.value);
                }}
              />
            </div>
            <div>
              <label
                htmlFor="date-to"
                className="block text-xs text-muted mb-1"
              >
                To
              </label>
              <input
                id="date-to"
                type="date"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Computed days summary */}
          {dateFrom && dateTo && (
            <div className="text-xs text-muted space-y-1 pt-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {credits} working day{credits !== 1 ? "s" : ""}
                </span>
                <span>(weekends &amp; holidays excluded)</span>
              </div>
              {leaveDates.length > 0 && leaveDates.length <= 10 && (
                <div className="flex flex-wrap gap-1">
                  {leaveDates.map((d) => (
                    <span
                      key={d}
                      className="px-1.5 py-0.5 bg-accent rounded text-xs"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {leaveDates.length > 10 && (
                <div>
                  {leaveDates.slice(0, 5).map((d) => (
                    <span
                      key={d}
                      className="px-1.5 py-0.5 bg-accent rounded text-xs mr-1"
                    >
                      {d}
                    </span>
                  ))}
                  <span className="text-xs text-muted">
                    ... +{leaveDates.length - 5} more dates
                  </span>
                </div>
              )}
            </div>
          )}
          {dateFrom && dateTo && leaveDates.length === 0 && (
            <p className="text-xs text-warning">
              Selected range falls entirely on weekends or holidays.
            </p>
          )}
        </div>

        {/* Pay Amount — auto-computed, manually overridable */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="pay-amount"
              className="block text-sm font-medium text-foreground"
            >
              Pay Amount
            </label>
            {credits > 0 && dailyRate > 0 && (
              <button
                type="button"
                className="text-xs text-primary underline"
                onClick={() => {
                  setPayAmountManual(false);
                  setPayAmountOverride("");
                }}
              >
                {payAmountManual ? "Reset to computed" : ""}
              </button>
            )}
          </div>
          <input
            id="pay-amount"
            type="number"
            min="0"
            step="0.01"
            className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent ${
              payAmountManual ? "border-warning" : "border-border"
            }`}
            value={displayPayAmount}
            onChange={(e) => {
              setPayAmountManual(true);
              setPayAmountOverride(e.target.value);
            }}
            placeholder="0.00"
          />
          {/* Computation breakdown */}
          {credits > 0 && dailyRate > 0 && !isWithoutPay && (
            <p className="text-xs text-muted">
              Daily rate: ₱{dailyRate.toFixed(2)} × {credits} day
              {credits !== 1 ? "s" : ""} = ₱{computedPayAmount.toFixed(2)}
              {payAmountManual && (
                <span className="ml-2 text-warning">(manually overridden)</span>
              )}
            </p>
          )}
          {isWithoutPay && (
            <p className="text-xs text-muted">
              Leave Without Pay — no pay amount.
            </p>
          )}
          {credits > 0 && dailyRate === 0 && (
            <p className="text-xs text-warning">
              No salary on file for this employee. Enter pay amount manually.
            </p>
          )}
        </div>

        {/* Remarks */}
        <FormInput
          id="remarks"
          label="Remarks"
          type="textarea"
          rows={3}
          placeholder="Enter reason for leave application..."
          value={remarks}
          onChange={setRemarks}
        />

        {!isFormValid() && employeeId && leaveTypeId && dateFrom && dateTo && (
          <p className="text-xs text-error">
            {!matchedCredit
              ? "* No leave credit record found for this leave type."
              : !hasEnoughCredits
                ? `* Insufficient credits. Balance: ${matchedCredit?.current_balance.toFixed(3)} days, Requested: ${credits} days.`
                : selectedSubtype?.code === "VL" && placeVisited.trim() === ""
                  ? "* Please enter the place to be visited (required for Vacation Leave)."
                  : selectedSubtype?.code === "SL" && illness.trim() === ""
                    ? "* Please enter the nature of illness (required for Sick Leave)."
                    : "* Please fill in all required fields."}
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default LeaveDialog;
