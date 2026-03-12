import { useState, useEffect } from "react";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import type { Employee } from "@/types/hr.types";
import type { Office, Position, EmployeeFormData } from "@/services/hrService";
import { fetchOffices, fetchPositions } from "@/services/hrService";

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (employeeData: EmployeeFormData) => void;
  employee?: Employee | null;
  isLoading?: boolean;
}

/* ── Dropdown option component (reuse across selects) ─────────────── */
const FormSelect = ({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="block text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    <select
      id={id}
      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      disabled={disabled}
    >
      {children}
    </select>
  </div>
);

/* ── Section heading inside the dialog ────────────────────────────── */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-sm font-semibold text-success uppercase tracking-wider pt-4 pb-1 border-b border-border mb-3">
    {children}
  </h3>
);

const EmployeeDialog = ({
  open,
  onClose,
  onSubmit,
  employee,
  isLoading = false,
}: EmployeeDialogProps) => {
  // ── Personal Information ──
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [suffix, setSuffix] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [civilStatus, setCivilStatus] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [address, setAddress] = useState("");

  // ── Government IDs ──
  const [gsisNumber, setGsisNumber] = useState("");
  const [philhealthNumber, setPhilhealthNumber] = useState("");
  const [pagibigNumber, setPagibigNumber] = useState("");
  const [tin, setTin] = useState("");

  // ── Employment ──
  const [positionId, setPositionId] = useState("");
  const [officeId, setOfficeId] = useState("");
  const [employmentStatus, setEmploymentStatus] =
    useState<EmployeeFormData["employment_status"]>("permanent");
  const [dateHired, setDateHired] = useState("");
  const [isActive, setIsActive] = useState(true);

  // ── Dropdown data ──
  const [offices, setOffices] = useState<Office[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (open) loadDropdownData();
  }, [open]);

  useEffect(() => {
    if (employee) {
      const raw = employee as unknown as Record<string, string>;
      setFirstName(employee.first_name);
      setMiddleName(employee.middle_name);
      setLastName(employee.last_name);
      setSuffix(raw.suffix ?? "");
      setBirthDate(raw.birth_date ?? "");
      setCivilStatus(raw.civil_status ?? "");
      setBloodType(raw.blood_type ?? "");
      setContactNumber(raw.contact_number ?? "");
      setAddress(raw.address ?? "");
      setGsisNumber(raw.gsis_number ?? "");
      setPhilhealthNumber(raw.philhealth_number ?? "");
      setPagibigNumber(raw.pagibig_number ?? "");
      setTin(raw.tin ?? "");
      setPositionId(employee.position_id);
      setOfficeId(employee.office_id);
      setEmploymentStatus(employee.employment_status);
      setDateHired(employee.date_hired);
      setIsActive(employee.is_active);
    } else {
      resetForm();
    }
  }, [employee]);

  const loadDropdownData = async () => {
    setLoadingData(true);
    const [officesData, positionsData] = await Promise.all([
      fetchOffices(),
      fetchPositions(),
    ]);
    setOffices(officesData);
    setPositions(positionsData);
    setLoadingData(false);
  };

  const resetForm = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setSuffix("");
    setBirthDate("");
    setCivilStatus("");
    setBloodType("");
    setContactNumber("");
    setAddress("");
    setGsisNumber("");
    setPhilhealthNumber("");
    setPagibigNumber("");
    setTin("");
    setPositionId("");
    setOfficeId("");
    setEmploymentStatus("permanent");
    setDateHired("");
    setIsActive(true);
  };

  const handleSubmit = () => {
    onSubmit({
      first_name: firstName.trim(),
      middle_name: middleName.trim(),
      last_name: lastName.trim(),
      suffix: suffix.trim(),
      pos_id: positionId,
      o_id: officeId,
      employment_status: employmentStatus,
      date_hired: dateHired,
      is_active: isActive,
      birth_date: birthDate,
      civil_status: civilStatus as EmployeeFormData["civil_status"],
      blood_type: bloodType,
      contact_number: contactNumber.trim(),
      address: address.trim(),
      gsis_number: gsisNumber.trim(),
      philhealth_number: philhealthNumber.trim(),
      pagibig_number: pagibigNumber.trim(),
      tin: tin.trim(),
    });
  };

  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    officeId !== "" &&
    dateHired !== "";

  const selectedPosition = positions.find((p) => p.id === positionId);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={employee ? "Edit Employee" : "Add New Employee"}
      onSubmit={handleSubmit}
      submitLabel={employee ? "Save Changes" : "Add Employee"}
      isLoading={isLoading || loadingData}
      size="lg"
    >
      <div className="space-y-1">
        {/* Employee No. badge — read-only, only shown in edit mode */}
        {employee && (
          <div className="flex items-center gap-3 bg-muted/20 border border-border rounded-lg px-4 py-2.5 mb-2">
            <span className="text-xs font-medium text-muted uppercase tracking-wider">
              Employee No.
            </span>
            <span className="font-bold text-foreground">
              {(employee as unknown as Record<string, string>).employee_no ??
                "—"}
            </span>
            <span className="ml-auto text-xs text-muted italic">
              Auto-generated · linked to this person's record
            </span>
          </div>
        )}

        {/* ═══ SECTION 1 — Personal Information ═══ */}
        <SectionHeading>Personal Information</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="first-name"
            label="First Name"
            placeholder="Juan"
            value={firstName}
            onChange={setFirstName}
            required
          />
          <FormInput
            id="middle-name"
            label="Middle Name"
            placeholder="Santos (optional)"
            value={middleName}
            onChange={setMiddleName}
          />
          <FormInput
            id="last-name"
            label="Last Name"
            placeholder="Dela Cruz"
            value={lastName}
            onChange={setLastName}
            required
          />
          <FormInput
            id="suffix"
            label="Suffix"
            placeholder="Jr., Sr., III (optional)"
            value={suffix}
            onChange={setSuffix}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Birth Date */}
          <div className="space-y-1.5">
            <label
              htmlFor="birth-date"
              className="block text-sm font-medium text-foreground"
            >
              Date of Birth
            </label>
            <input
              id="birth-date"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>

          <FormSelect
            id="civil-status"
            label="Civil Status"
            value={civilStatus}
            onChange={setCivilStatus}
          >
            <option value="">-- Select --</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
            <option value="separated">Separated</option>
          </FormSelect>

          <FormSelect
            id="blood-type"
            label="Blood Type"
            value={bloodType}
            onChange={setBloodType}
          >
            <option value="">-- Select --</option>
            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bt) => (
              <option key={bt} value={bt}>
                {bt}
              </option>
            ))}
          </FormSelect>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <FormInput
            id="contact-number"
            label="Contact Number"
            placeholder="09XX-XXX-XXXX"
            value={contactNumber}
            onChange={setContactNumber}
          />
          <FormInput
            id="address"
            label="Address"
            placeholder="Complete residential address"
            value={address}
            onChange={setAddress}
          />
        </div>

        {/* ═══ SECTION 2 — Government IDs ═══ */}
        <SectionHeading>Government IDs</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput
            id="gsis-number"
            label="GSIS BP No."
            placeholder="GSIS number"
            value={gsisNumber}
            onChange={setGsisNumber}
          />
          <FormInput
            id="philhealth-number"
            label="PhilHealth No."
            placeholder="PhilHealth number"
            value={philhealthNumber}
            onChange={setPhilhealthNumber}
          />
          <FormInput
            id="pagibig-number"
            label="Pag-IBIG MID No."
            placeholder="Pag-IBIG number"
            value={pagibigNumber}
            onChange={setPagibigNumber}
          />
          <FormInput
            id="tin"
            label="TIN"
            placeholder="Tax Identification Number"
            value={tin}
            onChange={setTin}
          />
        </div>

        {/* ═══ SECTION 3 — Employment ═══ */}
        <SectionHeading>Employment Details</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormSelect
            id="position"
            label="Position (Plantilla Item)"
            value={positionId}
            onChange={setPositionId}
            disabled={loadingData}
          >
            <option value="">-- Select a position --</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.item_no} — {p.description}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="office"
            label="Office / Department"
            value={officeId}
            onChange={setOfficeId}
            required
            disabled={loadingData}
          >
            <option value="">-- Select an office --</option>
            {offices.map((o) => (
              <option key={o.id} value={o.id}>
                {o.description}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            id="employment-status"
            label="Employment Type"
            value={employmentStatus}
            onChange={(v) =>
              setEmploymentStatus(v as EmployeeFormData["employment_status"])
            }
            required
          >
            <option value="permanent">Permanent</option>
            <option value="casual">Casual</option>
            <option value="coterminous">Coterminous</option>
            <option value="contractual">Contractual</option>
            <option value="job_order">Job Order</option>
          </FormSelect>

          {/* Date Hired */}
          <div className="space-y-1.5">
            <label
              htmlFor="date-hired"
              className="block text-sm font-medium text-foreground"
            >
              Date Hired
              <span className="text-error ml-1">*</span>
            </label>
            <input
              id="date-hired"
              type="date"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-success"
              value={dateHired}
              onChange={(e) => setDateHired(e.target.value)}
              required
            />
          </div>
        </div>

        {selectedPosition && (
          <p className="text-xs text-muted mt-2">
            Plantilla Item No:{" "}
            <span className="font-semibold">{selectedPosition.item_no}</span>
          </p>
        )}

        {/* Active toggle */}
        <div className="flex items-center gap-2 mt-4">
          <input
            id="is-active"
            type="checkbox"
            className="w-4 h-4 border border-border rounded text-success focus:ring-success"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          <label
            htmlFor="is-active"
            className="text-sm font-medium text-foreground"
          >
            Active Employee
          </label>
        </div>

        {!isFormValid && (
          <p className="text-xs text-error mt-3">
            * Please fill in all required fields (name, office, date hired)
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default EmployeeDialog;
