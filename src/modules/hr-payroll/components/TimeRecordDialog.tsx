import { useState, useEffect, useRef } from "react";
import { BaseDialog } from "@/components/ui/dialog";
import type { TimeSlotSchedule } from "@/types/hr.types";
import {
  fetchTimeSlotSchedules,
  fetchPersonnelForLeave,
  insertTimeRecord,
} from "../services/hrService";
import { LogIn, LogOut } from "lucide-react";

interface TimeRecordDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PersonnelOption {
  id: string;
  name: string;
}

const TimeRecordDialog = ({
  open,
  onClose,
  onSuccess,
}: TimeRecordDialogProps) => {
  const [timeIdentifier, setTimeIdentifier] = useState<1 | 2>(1);
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employees, setEmployees] = useState<PersonnelOption[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotSchedule[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Searchable employee dropdown
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    Promise.all([fetchPersonnelForLeave(), fetchTimeSlotSchedules()]).then(
      ([emp, slots]) => {
        setEmployees(emp);
        setTimeSlots(slots);
        setLoadingData(false);
      },
    );
  }, [open]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setTimeIdentifier(1);
      setSelectedSlot("");
      setEmployeeId("");
      setEmployeeSearch("");
      setError(null);
      setDate(new Date().toISOString().slice(0, 10));
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      );
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredEmployees = employees.filter((e) =>
    e.name.toLowerCase().includes(employeeSearch.toLowerCase()),
  );

  const handleSubmit = async () => {
    setError(null);

    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (!selectedSlot) {
      setError("Please select a time slot.");
      return;
    }
    if (!time) {
      setError("Please enter the time.");
      return;
    }

    setIsLoading(true);
    const result = await insertTimeRecord({
      per_id: employeeId,
      date,
      time_slot_id: selectedSlot,
      time_identifier: timeIdentifier,
      time,
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to save time record.");
      return;
    }

    onSuccess();
    onClose();
  };

  const selectedEmployeeName =
    employees.find((e) => e.id === employeeId)?.name || "";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Record Time"
      onSubmit={handleSubmit}
      submitLabel="Save"
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-5">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1: IN / OUT selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Type <span className="text-error ml-1">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTimeIdentifier(1)}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-base font-semibold transition-all ${
                timeIdentifier === 1
                  ? "border-blue-500 bg-blue-500/10 text-blue-600"
                  : "border-border bg-background text-muted hover:border-blue-300"
              }`}
            >
              <LogIn className="w-5 h-5" />
              In
            </button>
            <button
              type="button"
              onClick={() => setTimeIdentifier(2)}
              className={`flex items-center justify-center gap-2 py-4 rounded-xl border-2 text-base font-semibold transition-all ${
                timeIdentifier === 2
                  ? "border-orange-500 bg-orange-500/10 text-orange-600"
                  : "border-border bg-background text-muted hover:border-orange-300"
              }`}
            >
              <LogOut className="w-5 h-5" />
              Out
            </button>
          </div>
        </div>

        {/* Step 2: Time Slot selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Time Slot <span className="text-error ml-1">*</span>
          </label>
          <div className="flex flex-col gap-2">
            {loadingData ? (
              <p className="text-sm text-muted">Loading time slots...</p>
            ) : (
              timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                    selectedSlot === slot.id
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-border bg-background text-foreground hover:border-accent/50"
                  }`}
                >
                  <span className="capitalize">
                    {slot.description.replace(/_/g, " ")}
                  </span>
                  <span className="ml-2 text-sm text-muted">
                    {slot.time_start.slice(0, 5)} – {slot.time_end.slice(0, 5)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Step 3: Employee */}
        <div className="space-y-1.5" ref={dropdownRef}>
          <label className="block text-sm font-medium text-foreground">
            Employee <span className="text-error ml-1">*</span>
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
            placeholder="Search employee..."
            value={employeeId ? selectedEmployeeName : employeeSearch}
            onChange={(e) => {
              setEmployeeSearch(e.target.value);
              setEmployeeId("");
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredEmployees.length > 0 && (
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg bg-surface shadow-lg">
              {filteredEmployees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-background transition-colors"
                  onClick={() => {
                    setEmployeeId(emp.id);
                    setEmployeeSearch(emp.name);
                    setShowDropdown(false);
                  }}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="tr-date"
              className="block text-sm font-medium text-foreground"
            >
              Date <span className="text-error ml-1">*</span>
            </label>
            <input
              id="tr-date"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="tr-time"
              className="block text-sm font-medium text-foreground"
            >
              Time <span className="text-error ml-1">*</span>
            </label>
            <input
              id="tr-time"
              type="time"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
      </div>
    </BaseDialog>
  );
};

export default TimeRecordDialog;
