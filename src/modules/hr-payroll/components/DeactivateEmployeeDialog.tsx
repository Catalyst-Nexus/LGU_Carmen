import { useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/dialog";
import type { Employee } from "@/types/hr.types";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const SEPARATION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "resignation", label: "Voluntary Resignation" },
  { value: "retirement", label: "Retirement (RA 8291 / GSIS)" },
  { value: "dismissed", label: "Dropped from Rolls / Dismissed" },
  { value: "end_of_contract", label: "End of Contract / Term" },
  { value: "death", label: "Death" },
  { value: "transfer", label: "Transfer to Another Agency" },
  { value: "promotion", label: "Promotion to Another Agency" },
];

// Today's date in YYYY-MM-DD (local timezone)
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

export interface DeactivatePayload {
  separation_type: string;
  separation_date: string;
  remarks: string;
}

interface DeactivateEmployeeDialogProps {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
  /** Called with the collected reason after the user confirms */
  onConfirm: (payload: DeactivatePayload) => Promise<void>;
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

const DeactivateEmployeeDialog = ({
  open,
  employee,
  onClose,
  onConfirm,
}: DeactivateEmployeeDialogProps) => {
  const [separationType, setSeparationType] = useState("");
  const [separationDate, setSeparationDate] = useState(todayIso());
  const [remarks, setRemarks] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever a new employee is targeted
  useEffect(() => {
    if (open) {
      setSeparationType("");
      setSeparationDate(todayIso());
      setRemarks("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!separationType) {
      setError("Please select a separation reason.");
      return;
    }
    if (!separationDate) {
      setError("Please enter the separation date.");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onConfirm({
        separation_type: separationType,
        separation_date: separationDate,
        remarks,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to deactivate employee.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const employeeName = employee
    ? `${employee.last_name}, ${employee.first_name}${employee.middle_name ? " " + employee.middle_name[0] + "." : ""}`
    : "";

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Deactivate Employee"
      onSubmit={handleSubmit}
      submitLabel="Confirm Deactivation"
      isLoading={isSaving}
    >
      {/* Warning banner */}
      <div className="mb-4 rounded-lg bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger">
        <p className="font-semibold">{employeeName}</p>
        <p className="mt-1 text-danger/80">
          This will mark the employee as <strong>Separated</strong> and create a
          CSC service record entry. The action can be reversed by reinstating
          the employee.
        </p>
      </div>

      <div className="space-y-4">
        {/* Separation reason */}
        <div className="space-y-1.5">
          <label
            htmlFor="sep-type"
            className="block text-sm font-medium text-foreground"
          >
            Separation Reason <span className="text-error ml-1">*</span>
          </label>
          <select
            id="sep-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
            value={separationType}
            onChange={(e) => setSeparationType(e.target.value)}
          >
            <option value="">— Select reason —</option>
            {SEPARATION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Separation date */}
        <div className="space-y-1.5">
          <label
            htmlFor="sep-date"
            className="block text-sm font-medium text-foreground"
          >
            Effective Date of Separation{" "}
            <span className="text-error ml-1">*</span>
          </label>
          <input
            id="sep-date"
            type="date"
            required
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
            value={separationDate}
            onChange={(e) => setSeparationDate(e.target.value)}
          />
        </div>

        {/* Optional remarks */}
        <div className="space-y-1.5">
          <label
            htmlFor="sep-remarks"
            className="block text-sm font-medium text-foreground"
          >
            Remarks{" "}
            <span className="text-xs text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="sep-remarks"
            rows={2}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent resize-none"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Per SB Resolution 2026-035"
          />
        </div>

        {error && (
          <p className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default DeactivateEmployeeDialog;
