import { useState, useEffect, useRef } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import type { LeaveApplication } from "@/types/hr.types";
import type { LeaveSubtype } from "@/services/hrService";
import {
  fetchLeaveSubtypes,
  fetchPersonnelForLeave,
} from "@/services/hrService";

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
}

interface PersonnelOption {
  id: string;
  name: string;
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
  const [credits, setCredits] = useState("");
  const [payAmount, setPayAmount] = useState("0");
  const [remarks, setRemarks] = useState("");

  const [employees, setEmployees] = useState<PersonnelOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveSubtype[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Searchable employee dropdown states
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [filteredEmployees, setFilteredEmployees] = useState<PersonnelOption[]>(
    [],
  );

  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      loadDropdownData();
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        employeeDropdownRef.current &&
        !employeeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowEmployeeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (leave) {
      setEmployeeId(leave.employee_id);
      const employee = employees.find((emp) => emp.id === leave.employee_id);
      if (employee) setEmployeeSearch(employee.name);
      setAppliedDate(leave.applied_date);
      setCredits(leave.credits.toString());
      setPayAmount(leave.pay_amount.toString());
      setRemarks(leave.remarks);
    } else {
      resetForm();
    }
  }, [leave, employees]);

  useEffect(() => {
    if (employeeSearch.trim() === "") {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(
        employees.filter((emp) =>
          emp.name.toLowerCase().includes(employeeSearch.toLowerCase()),
        ),
      );
    }
  }, [employeeSearch, employees]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const [employeesData, leaveTypesData] = await Promise.all([
      fetchPersonnelForLeave(),
      fetchLeaveSubtypes(),
    ]);
    setEmployees(employeesData);
    setLeaveTypes(leaveTypesData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setEmployeeId("");
    setEmployeeSearch("");
    setLeaveTypeId("");
    setAppliedDate(new Date().toISOString().split("T")[0]);
    setCredits("");
    setPayAmount("0");
    setRemarks("");
    setShowEmployeeDropdown(false);
  };

  const handleEmployeeSelect = (employee: PersonnelOption) => {
    setEmployeeId(employee.id);
    setEmployeeSearch(employee.name);
    setShowEmployeeDropdown(false);
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    onSubmit({
      per_id: employeeId,
      los_id: leaveTypeId,
      applied_date: appliedDate,
      credits: parseFloat(credits),
      pay_amount: parseFloat(payAmount) || 0,
      remarks: remarks.trim(),
      status: "pending",
    });
  };

  const isFormValid = () =>
    employeeId !== "" &&
    leaveTypeId !== "" &&
    appliedDate !== "" &&
    credits !== "" &&
    !isNaN(parseFloat(credits)) &&
    parseFloat(credits) > 0;

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
        {/* Employee — searchable */}
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
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
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
              <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-background border border-border rounded-lg shadow-lg">
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

        {/* Leave Type */}
        <div className="space-y-1.5">
          <label
            htmlFor="leave-type"
            className="block text-sm font-medium text-foreground"
          >
            Leave Type <span className="text-error">*</span>
          </label>
          <select
            id="leave-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            required
            disabled={loadingData}
          >
            <option value="">-- Select leave type --</option>
            {leaveTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.description} ({type.code})
              </option>
            ))}
          </select>
        </div>

        {/* Applied Date */}
        <div className="space-y-1.5">
          <label
            htmlFor="applied-date"
            className="block text-sm font-medium text-foreground"
          >
            Applied Date <span className="text-error">*</span>
          </label>
          <input
            id="applied-date"
            type="date"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            required
          />
        </div>

        {/* Credits (leave days — supports half-days) */}
        <div className="space-y-1.5">
          <label
            htmlFor="credits"
            className="block text-sm font-medium text-foreground"
          >
            Credits (Days) <span className="text-error">*</span>
          </label>
          <input
            id="credits"
            type="number"
            min="0.5"
            step="0.5"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            placeholder="e.g., 1, 0.5, 3"
            required
          />
          <p className="text-xs text-muted">
            Number of leave credits to deduct (supports half-days)
          </p>
        </div>

        {/* Pay Amount */}
        <div className="space-y-1.5">
          <label
            htmlFor="pay-amount"
            className="block text-sm font-medium text-foreground"
          >
            Pay Amount
          </label>
          <input
            id="pay-amount"
            type="number"
            min="0"
            step="0.01"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            placeholder="0.00"
          />
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

        {!isFormValid() && (
          <p className="text-xs text-error">
            * Please fill in all required fields
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default LeaveDialog;
