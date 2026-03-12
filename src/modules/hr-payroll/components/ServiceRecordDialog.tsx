import { useState, useEffect, useRef, useMemo } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import {
  createServiceRecord,
  fetchPositionsForDialog,
  fetchOffices,
  type ServiceRecord,
  type ServiceRecordFormData,
  type PositionForDialog,
  type Office,
} from "@/services/hrService";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RECORD_TYPE_OPTIONS: {
  value: ServiceRecord["record_type"];
  label: string;
}[] = [
  { value: "appointment", label: "Original Appointment" },
  { value: "reappointment", label: "Reappointment" },
  { value: "promotion", label: "Promotion" },
  { value: "transfer", label: "Transfer" },
  { value: "reinstatement", label: "Reinstatement" },
  { value: "step_increment", label: "Within-Step Increment (WSI)" },
  { value: "separation", label: "Separation / Termination" },
];

const APPOINTMENT_STATUS_OPTIONS = [
  "Permanent",
  "Temporary",
  "Casual",
  "Co-terminous",
  "Contractual",
  "Job Order",
];

const SEPARATION_TYPE_OPTIONS: {
  value: string;
  label: string;
}[] = [
  { value: "resignation", label: "Voluntary Resignation" },
  { value: "retirement", label: "Retirement (RA 8291)" },
  { value: "dismissed", label: "Dropped from Rolls / Dismissed" },
  { value: "end_of_contract", label: "End of Contract / Term" },
  { value: "death", label: "Death" },
  { value: "transfer", label: "Transfer to Another Agency" },
  { value: "promotion", label: "Promotion to Another Agency" },
];

const formatPeso = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ServiceRecordDialogProps {
  open: boolean;
  personnelId: string;
  /** Pre-fill position from the employee's current position_id */
  defaultPosId?: string;
  /** Pre-fill office from the employee's current office_id */
  defaultOId?: string;
  onClose: () => void;
  onSaved: () => void;
}

const ServiceRecordDialog = ({
  open,
  personnelId,
  defaultPosId,
  defaultOId,
  onClose,
  onSaved,
}: ServiceRecordDialogProps) => {
  // Form state
  const [recordType, setRecordType] =
    useState<ServiceRecord["record_type"]>("appointment");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [positionId, setPositionId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [appointmentStatus, setAppointmentStatus] = useState("");
  const [separationType, setSeparationType] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [remarks, setRemarks] = useState("");

  // Data
  const [positions, setPositions] = useState<PositionForDialog[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load dropdown data on open
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (open) {
      loadData();
      resetForm();
    }
    // resetForm is redefined each render but is intentionally stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // When position changes, auto-fill salary and office
  // We use a ref to track the current officeId without making it a dep
  const officeIdRef = useRef(officeId);
  officeIdRef.current = officeId;

  useEffect(() => {
    if (!positionId) return;
    const pos = positions.find((p) => p.id === positionId);
    if (!pos) return;
    if (pos.monthly_salary > 0) {
      setMonthlySalary(String(pos.monthly_salary));
    }
    if (pos.o_id && !officeIdRef.current) {
      setOfficeId(pos.o_id);
    }
  }, [positionId, positions]);

  const loadData = async () => {
    setLoadingData(true);
    const [posData, offData] = await Promise.all([
      fetchPositionsForDialog(),
      fetchOffices(),
    ]);
    setPositions(posData);
    setOffices(offData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setRecordType("appointment");
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setEndDate("");
    setPositionId(defaultPosId ?? "");
    setOfficeId(defaultOId ?? "");
    setAppointmentStatus("");
    setSeparationType("");
    setMonthlySalary("");
    setRemarks("");
  };

  const selectedPosition = useMemo(
    () => positions.find((p) => p.id === positionId) ?? null,
    [positions, positionId],
  );

  const isFormValid = () =>
    !!recordType &&
    effectiveDate !== "" &&
    (recordType !== "separation" || separationType !== "");

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSaving(true);

    const formData: ServiceRecordFormData = {
      pos_id: positionId || undefined,
      o_id: officeId || undefined,
      record_type: recordType,
      appointment_status: appointmentStatus || undefined,
      monthly_salary: Number(monthlySalary) || 0,
      effective_date: effectiveDate,
      end_date: endDate || undefined,
      separation_type:
        recordType === "separation" ? separationType || undefined : undefined,
      remarks,
    };

    const result = await createServiceRecord(personnelId, formData);
    setIsSaving(false);

    if (result.success) {
      onSaved();
    } else {
      alert(result.error || "Failed to save record");
    }
  };

  const showSeparationType = recordType === "separation";
  const showAppointmentStatus = [
    "appointment",
    "reappointment",
    "promotion",
    "transfer",
    "reinstatement",
  ].includes(recordType);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Add Employment History Entry"
      onSubmit={handleSubmit}
      submitLabel="Save Record"
      isLoading={isSaving || loadingData}
    >
      <div className="space-y-4">
        {/* CSC Note */}
        <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
          This entry will appear on the employee&apos;s CSC Form 241 (Service
          Record). Auto-detected events (appointment, transfer, etc.) are
          recorded automatically by the system — use this form for manual
          corrections or step-increment entries.
        </p>

        {/* Record Type */}
        <div className="space-y-1.5">
          <label
            htmlFor="record-type"
            className="block text-sm font-medium text-foreground"
          >
            Type of Action
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="record-type"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={recordType}
            onChange={(e) =>
              setRecordType(e.target.value as ServiceRecord["record_type"])
            }
          >
            {RECORD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Effective Date + End Date */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label
              htmlFor="effective-date"
              className="block text-sm font-medium text-foreground"
            >
              Effective Date
              <span className="text-error ml-1">*</span>
            </label>
            <input
              id="effective-date"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-foreground"
            >
              End Date{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <input
              id="end-date"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={effectiveDate}
            />
          </div>
        </div>

        {/* Position */}
        <div className="space-y-1.5">
          <label
            htmlFor="pos-select"
            className="block text-sm font-medium text-foreground"
          >
            Position{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <select
            id="pos-select"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            disabled={loadingData}
          >
            <option value="">-- None / Not applicable --</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.item_no} — {p.description}
              </option>
            ))}
          </select>
          {selectedPosition && selectedPosition.monthly_salary > 0 && (
            <p className="text-xs text-success">
              Monthly: {formatPeso(selectedPosition.monthly_salary)}
            </p>
          )}
        </div>

        {/* Office */}
        <div className="space-y-1.5">
          <label
            htmlFor="office-select"
            className="block text-sm font-medium text-foreground"
          >
            Office / Unit{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </label>
          <select
            id="office-select"
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            value={officeId}
            onChange={(e) => setOfficeId(e.target.value)}
            disabled={loadingData}
          >
            <option value="">-- None / Not applicable --</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.description}
              </option>
            ))}
          </select>
        </div>

        {/* Monthly Salary */}
        <div className="space-y-1.5">
          <label
            htmlFor="monthly-salary"
            className="block text-sm font-medium text-foreground"
          >
            Monthly Salary (₱)
          </label>
          <input
            id="monthly-salary"
            type="number"
            min={0}
            step={0.01}
            className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
            placeholder="e.g., 25573.00"
            value={monthlySalary}
            onChange={(e) => setMonthlySalary(e.target.value)}
          />
        </div>

        {/* Appointment Status (CSC Form 33) */}
        {showAppointmentStatus && (
          <div className="space-y-1.5">
            <label
              htmlFor="appt-status"
              className="block text-sm font-medium text-foreground"
            >
              Nature / Status of Appointment
            </label>
            <select
              id="appt-status"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={appointmentStatus}
              onChange={(e) => setAppointmentStatus(e.target.value)}
            >
              <option value="">-- Select --</option>
              {APPOINTMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Separation Type */}
        {showSeparationType && (
          <div className="space-y-1.5">
            <label
              htmlFor="sep-type"
              className="block text-sm font-medium text-foreground"
            >
              Cause of Separation
              <span className="text-error ml-1">*</span>
            </label>
            <select
              id="sep-type"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={separationType}
              onChange={(e) => setSeparationType(e.target.value)}
              required
            >
              <option value="">-- Select cause --</option>
              {SEPARATION_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Remarks / Authority */}
        <FormInput
          id="remarks"
          label="Remarks / Authority"
          placeholder="e.g., CSC MC No. 40, s. 1998 — WSI; or per SP Res. No. 2024-063"
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

export default ServiceRecordDialog;
