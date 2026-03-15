import { useState, useEffect } from "react";
import {
  X,
  User,
  Briefcase,
  Clock,
  FileText,
  DollarSign,
  FolderOpen,
  Activity,
  Plus,
  Pencil,
  Check,
  XCircle,
} from "lucide-react";
import type {
  Employee,
  PayrollEntry,
  PaySlipDeduction,
} from "@/types/hr.types";
import {
  fetchServiceRecords,
  fetchLeaveCredits,
  fetchPersonnelLeaveApplications,
  fetchPersonnelPaySlips,
  fetchPersonnelDocuments,
  fetchPersonnelAuditLog,
  updateLeaveCredit,
  type ServiceRecord,
  type LeaveCredit,
  type PersonnelDocument,
  type PersonnelAuditEntry,
} from "@/services/hrService";
import ServiceRecordDialog from "./ServiceRecordDialog";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type TabId =
  | "personal"
  | "appointment"
  | "history"
  | "leave"
  | "payroll"
  | "documents"
  | "audit";

type LeaveApp = Awaited<
  ReturnType<typeof fetchPersonnelLeaveApplications>
>[number];

const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
  { id: "personal", label: "Personal Information", Icon: User },
  { id: "appointment", label: "Appointment Details", Icon: Briefcase },
  { id: "history", label: "Employment History", Icon: Clock },
  { id: "leave", label: "Leave Records", Icon: FileText },
  { id: "payroll", label: "Payroll & Benefits", Icon: DollarSign },
  { id: "documents", label: "Documents", Icon: FolderOpen },
  { id: "audit", label: "Audit Log", Icon: Activity },
];

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <span className="block text-xs font-medium text-muted uppercase tracking-wider mb-0.5">
      {label}
    </span>
    <span className="block text-sm text-foreground">{value ?? "—"}</span>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 className="text-xs font-semibold text-success uppercase tracking-wider border-b border-border pb-1 mb-3">
    {children}
  </h4>
);

const Spinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success" />
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface EmployeeProfileProps {
  employee: Employee | null;
  onClose: () => void;
}

const EmployeeProfile = ({ employee, onClose }: EmployeeProfileProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const [tabLoading, setTabLoading] = useState(false);

  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [leaveCredits, setLeaveCredits] = useState<LeaveCredit[]>([]);
  const [leaveApps, setLeaveApps] = useState<LeaveApp[]>([]);
  const [paySlips, setPaySlips] = useState<PayrollEntry[]>([]);
  const [documents, setDocuments] = useState<PersonnelDocument[]>([]);
  const [auditLog, setAuditLog] = useState<PersonnelAuditEntry[]>([]);
  const [loadedTabs, setLoadedTabs] = useState(new Set<TabId>());
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  // ── Leave credit edit state ──────────────────────────────────────────────
  const [editCreditId, setEditCreditId] = useState<string | null>(null);
  const [editCreditForm, setEditCreditForm] = useState({
    begin_balance: "0",
    earned: "0",
    current_balance: "0",
  });
  const [savingCredit, setSavingCredit] = useState(false);

  const handleRecordSaved = () => {
    setLoadedTabs((prev) => {
      const next = new Set(prev);
      next.delete("history");
      return next;
    });
    setShowRecordDialog(false);
  };

  // ── Leave credit edit handlers ───────────────────────────────────────────
  const startEditCredit = (credit: LeaveCredit) => {
    setEditCreditId(credit.id);
    setEditCreditForm({
      begin_balance: credit.begin_balance.toString(),
      earned: credit.earned.toString(),
      current_balance: credit.current_balance.toString(),
    });
  };

  const handleSaveCredit = async () => {
    if (!editCreditId) return;
    setSavingCredit(true);
    const result = await updateLeaveCredit(editCreditId, {
      begin_balance: parseFloat(editCreditForm.begin_balance) || 0,
      earned: parseFloat(editCreditForm.earned) || 0,
      current_balance: parseFloat(editCreditForm.current_balance) || 0,
    });
    setSavingCredit(false);
    if (result.success) {
      setEditCreditId(null);
      setLoadedTabs((prev) => {
        const next = new Set(prev);
        next.delete("leave");
        return next;
      });
    } else {
      alert(result.error || "Failed to update leave credits");
    }
  };

  // Reset all tab data when the selected employee changes
  useEffect(() => {
    setActiveTab("personal");
    setLoadedTabs(new Set());
    setServiceRecords([]);
    setLeaveCredits([]);
    setLeaveApps([]);
    setPaySlips([]);
    setDocuments([]);
    setAuditLog([]);
  }, [employee?.id]);

  // Lazy-load data when a data-backed tab is first opened
  useEffect(() => {
    if (!employee || loadedTabs.has(activeTab)) return;

    const load = async () => {
      setTabLoading(true);
      try {
        if (activeTab === "history") {
          const data = await fetchServiceRecords(employee.id);
          setServiceRecords(data);
        } else if (activeTab === "leave") {
          const [credits, apps] = await Promise.all([
            fetchLeaveCredits(employee.id),
            fetchPersonnelLeaveApplications(employee.id),
          ]);
          setLeaveCredits(credits as LeaveCredit[]);
          setLeaveApps(apps);
        } else if (activeTab === "payroll") {
          const slips = await fetchPersonnelPaySlips(employee.id);
          setPaySlips(slips);
        } else if (activeTab === "documents") {
          const docs = await fetchPersonnelDocuments(employee.id);
          setDocuments(docs);
        } else if (activeTab === "audit") {
          const log = await fetchPersonnelAuditLog(employee.id);
          setAuditLog(log);
        }
        setLoadedTabs((prev) => new Set([...prev, activeTab]));
      } finally {
        setTabLoading(false);
      }
    };
    load();
  }, [activeTab, employee, loadedTabs]);

  if (!employee) return null;

  // Access fields that are spread on via `...(row as unknown as Record<string, unknown>)`
  const raw = employee as unknown as Record<string, unknown>;

  const getStatusLabel = (): "Active" | "Separated" | "Inactive" => {
    if (!employee.is_active)
      return raw.separation_date ? "Separated" : "Inactive";
    return "Active";
  };

  const statusLabel = getStatusLabel();

  // -------------------------------------------------------------------------
  // Tab content renderers
  // -------------------------------------------------------------------------

  const renderPersonal = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>Basic Information</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Employee ID" value={employee.employee_no} />
          <Field label="Last Name" value={employee.last_name} />
          <Field label="First Name" value={employee.first_name} />
          <Field
            label="Middle Name"
            value={(raw.middle_name as string) || "—"}
          />
          <Field label="Suffix" value={(raw.suffix as string) || "—"} />
          <Field
            label="Date of Birth"
            value={(raw.birth_date as string) || "—"}
          />
          <Field
            label="Sex"
            value={
              (raw.sex as string)
                ? (raw.sex as string).replace(/\b\w/g, (c) => c.toUpperCase())
                : "—"
            }
          />
          <Field
            label="Civil Status"
            value={
              (raw.civil_status as string)
                ?.replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase()) || "—"
            }
          />
          <Field
            label="Nationality"
            value={(raw.nationality as string) || "Filipino"}
          />
          <Field label="Blood Type" value={(raw.blood_type as string) || "—"} />
        </div>
      </div>

      <div>
        <SectionTitle>Contact Information</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Contact Number"
            value={(raw.contact_number as string) || "—"}
          />
          <Field label="Email Address" value={(raw.email as string) || "—"} />
          <div className="sm:col-span-2">
            <Field
              label="Home Address"
              value={(raw.address as string) || "—"}
            />
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Government IDs</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="TIN" value={(raw.tin as string) || "—"} />
          <Field
            label="GSIS BP No."
            value={(raw.gsis_number as string) || "—"}
          />
          <Field
            label="Pag-IBIG MID"
            value={(raw.pagibig_number as string) || "—"}
          />
          <Field
            label="PhilHealth No."
            value={(raw.philhealth_number as string) || "—"}
          />
        </div>
      </div>
    </div>
  );

  const renderAppointment = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>Position</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field
            label="Plantilla Item No."
            value={employee.plantilla_item_no || "—"}
          />
          <Field label="Position Title" value={employee.position_title} />
          <Field label="Office / Department" value={employee.office_name} />
          <Field
            label="Salary Grade"
            value={
              employee.salary_grade != null
                ? `SG-${employee.salary_grade}`
                : "—"
            }
          />
          <Field
            label="Step"
            value={employee.step != null ? `Step ${employee.step}` : "—"}
          />
        </div>
      </div>

      <div>
        <SectionTitle>Appointment (CSC Form 33)</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field
            label="Nature of Appointment"
            value={employee.employment_status
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          />
          <Field
            label="Appointment Type"
            value={
              (raw.appointment_type as string)
                ? (raw.appointment_type as string)
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())
                : "—"
            }
          />
          <Field
            label="Date of Original Appointment"
            value={employee.date_hired || "—"}
          />
          <Field
            label="Date Assumed"
            value={(raw.date_assumed as string) || "—"}
          />
          <Field
            label="Civil Service Eligibility"
            value={(raw.civil_service_eligibility as string) || "—"}
          />
          <Field
            label="Record Status"
            value={
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                  statusLabel === "Active"
                    ? "bg-success/10 text-success"
                    : statusLabel === "Separated"
                      ? "bg-danger/10 text-danger"
                      : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {statusLabel}
              </span>
            }
          />
        </div>
      </div>

      {(raw.separation_date as string) && (
        <div>
          <SectionTitle>Separation</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field
              label="Separation Date"
              value={raw.separation_date as string}
            />
            <Field
              label="Separation Type"
              value={
                (raw.separation_type as string)
                  ?.replace(/_/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase()) || "—"
              }
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    const actionStyle: Record<string, string> = {
      appointment: "bg-blue-500/10 text-blue-500",
      promotion: "bg-green-500/10 text-green-500",
      transfer: "bg-purple-500/10 text-purple-500",
      reinstatement: "bg-cyan-500/10 text-cyan-500",
      reappointment: "bg-indigo-500/10 text-indigo-500",
      separation: "bg-red-500/10 text-red-500",
      step_increment: "bg-teal-500/10 text-teal-500",
    };

    return (
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Employment History
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
              (CSC Form 241)
            </span>
          </h3>
          <button
            onClick={() => setShowRecordDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Record
          </button>
        </div>

        {serviceRecords.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">
            No employment history records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 pr-4 text-left font-medium text-muted text-xs uppercase whitespace-nowrap">
                    Date
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-muted text-xs uppercase">
                    Action
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-muted text-xs uppercase">
                    Position
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-muted text-xs uppercase whitespace-nowrap">
                    SG
                  </th>
                  <th className="pb-2 pr-4 text-left font-medium text-muted text-xs uppercase">
                    Office
                  </th>
                  <th className="pb-2 text-left font-medium text-muted text-xs uppercase">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 hover:bg-surface align-top"
                  >
                    <td className="py-2.5 pr-4 text-xs text-muted whitespace-nowrap">
                      {r.effective_date}
                      {r.end_date && (
                        <span className="block text-muted/60">
                          → {r.end_date}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                          actionStyle[r.record_type] ??
                          "bg-gray-500/10 text-gray-500"
                        }`}
                      >
                        {r.record_type.replace(/_/g, " ")}
                      </span>
                      {r.appointment_status && (
                        <span className="block text-xs text-muted mt-0.5">
                          {r.appointment_status}
                        </span>
                      )}
                      {r.separation_type && (
                        <span className="block text-xs text-muted mt-0.5">
                          {r.separation_type.replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      {r.position_title ?? (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-xs whitespace-nowrap">
                      {r.salary_grade != null ? (
                        `SG-${r.salary_grade}`
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-xs">
                      {r.office_name ?? <span className="text-muted">—</span>}
                    </td>
                    <td className="py-2.5 text-xs text-muted italic">
                      {r.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderLeave = () => {
    return (
      <div className="space-y-6">
        {/* ── Leave Credit Balances ────────────────────────────────────── */}
        <div>
          <SectionTitle>Leave Credit Balances</SectionTitle>
          {leaveCredits.length === 0 ? (
            <p className="text-sm text-muted">No leave credits on record.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {leaveCredits.map((c) => (
                <div
                  key={c.id}
                  className={`border rounded-lg p-3 bg-surface transition-colors ${
                    editCreditId === c.id
                      ? "border-warning/50"
                      : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1 gap-1">
                    <p className="text-xs font-medium text-muted leading-tight">
                      {c.lot_description}
                    </p>
                    <button
                      onClick={() =>
                        editCreditId === c.id
                          ? setEditCreditId(null)
                          : startEditCredit(c)
                      }
                      title="Edit credits"
                      className="p-0.5 rounded hover:bg-muted/20 text-muted hover:text-foreground transition-colors shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {c.current_balance}{" "}
                    <span className="text-xs font-normal text-muted">days</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Earned: {c.earned} · Start: {c.begin_balance}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Inline Credit Edit Form ───────────────────────────────────── */}
        {editCreditId &&
          (() => {
            const editing = leaveCredits.find((c) => c.id === editCreditId);
            return (
              <div className="border border-warning/40 bg-warning/5 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-foreground">
                  Edit Credits — {editing?.lot_description}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      ["begin_balance", "Opening Balance"],
                      ["earned", "Earned"],
                      ["current_balance", "Current Balance"],
                    ] as [keyof typeof editCreditForm, string][]
                  ).map(([field, label]) => (
                    <div key={field} className="space-y-1">
                      <label className="block text-xs font-medium text-muted">
                        {label}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="w-full px-2.5 py-1.5 border border-border rounded text-sm bg-background focus:outline-none focus:border-warning"
                        value={editCreditForm[field]}
                        onChange={(e) =>
                          setEditCreditForm((prev) => ({
                            ...prev,
                            [field]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveCredit}
                    disabled={savingCredit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-60"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {savingCredit ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setEditCreditId(null)}
                    disabled={savingCredit}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-muted/20 transition-colors text-muted"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              </div>
            );
          })()}

        {/* ── Leave Ledger (CSC Form 6 style) ──────────────────────────── */}
        <div>
          <SectionTitle>Leave Ledger</SectionTitle>
          {leaveCredits.length === 0 ? (
            <p className="text-sm text-muted">No leave credits on record.</p>
          ) : (
            <div className="space-y-4">
              {leaveCredits.map((credit) => {
                const entries = leaveApps
                  .filter(
                    (la) =>
                      la.lot_id === credit.lot_id && la.status === "approved",
                  )
                  .slice()
                  .sort((a, b) => a.applied_date.localeCompare(b.applied_date));
                let running = credit.begin_balance + credit.earned;

                return (
                  <div key={credit.id}>
                    <p className="text-xs font-semibold text-foreground mb-1.5">
                      {credit.lot_description}
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-border bg-surface">
                            <th className="py-1.5 pr-4 text-left font-medium text-muted uppercase tracking-wide">
                              Date
                            </th>
                            <th className="py-1.5 pr-4 text-left font-medium text-muted uppercase tracking-wide">
                              Transaction
                            </th>
                            <th className="py-1.5 pr-4 text-right font-medium text-muted uppercase tracking-wide">
                              Used
                            </th>
                            <th className="py-1.5 text-right font-medium text-muted uppercase tracking-wide">
                              Balance
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Opening row */}
                          <tr className="border-b border-border/40 bg-success/5">
                            <td className="py-1.5 pr-4 text-muted">—</td>
                            <td className="py-1.5 pr-4 font-medium text-foreground">
                              Opening Balance
                              <span className="ml-1 text-muted font-normal">
                                (Start: {credit.begin_balance.toFixed(3)} +
                                Earned: {credit.earned.toFixed(3)})
                              </span>
                            </td>
                            <td className="py-1.5 pr-4 text-right text-muted">
                              —
                            </td>
                            <td className="py-1.5 text-right font-bold text-foreground">
                              {(credit.begin_balance + credit.earned).toFixed(
                                3,
                              )}
                            </td>
                          </tr>

                          {/* Approved leave entries */}
                          {entries.map((la) => {
                            running -= la.credits;
                            return (
                              <tr
                                key={la.id}
                                className="border-b border-border/40 hover:bg-surface"
                              >
                                <td className="py-1.5 pr-4 text-muted">
                                  {la.applied_date}
                                </td>
                                <td className="py-1.5 pr-4">
                                  <span className="font-medium">
                                    {la.leave_type}
                                  </span>
                                  <span className="ml-1 text-muted">
                                    — {la.leave_type_desc}
                                  </span>
                                </td>
                                <td className="py-1.5 pr-4 text-right text-danger">
                                  ({la.credits.toFixed(3)})
                                </td>
                                <td
                                  className={`py-1.5 text-right font-semibold ${
                                    running < 0
                                      ? "text-danger"
                                      : "text-foreground"
                                  }`}
                                >
                                  {running.toFixed(3)}
                                </td>
                              </tr>
                            );
                          })}

                          {entries.length === 0 && (
                            <tr>
                              <td
                                colSpan={4}
                                className="py-3 text-center text-muted italic"
                              >
                                No approved leaves on record.
                              </td>
                            </tr>
                          )}

                          {/* Closing balance row */}
                          {entries.length > 0 && (
                            <tr className="border-t border-border bg-surface">
                              <td
                                colSpan={3}
                                className="py-1.5 pr-4 font-semibold text-foreground"
                              >
                                Closing Balance
                              </td>
                              <td
                                className={`py-1.5 text-right font-bold ${
                                  running < 0 ? "text-danger" : "text-success"
                                }`}
                              >
                                {running.toFixed(3)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Leave Applications ────────────────────────────────────────── */}
        <div>
          <SectionTitle>Leave Applications</SectionTitle>
          {leaveApps.length === 0 ? (
            <p className="text-sm text-muted">No leave applications found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                      Type
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                      Applied
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                      Days
                    </th>
                    <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                      Pay
                    </th>
                    <th className="pb-2 font-medium text-muted text-xs uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leaveApps.map((la) => (
                    <tr key={la.id} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        {la.leave_type}
                        <span className="text-muted text-xs">
                          {" "}
                          ({la.leave_type_desc})
                        </span>
                      </td>
                      <td className="py-2 pr-4">{la.applied_date}</td>
                      <td className="py-2 pr-4">{la.credits}</td>
                      <td className="py-2 pr-4">
                        ₱{la.pay_amount.toLocaleString()}
                      </td>
                      <td className="py-2">
                        <span
                          className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                            la.status === "approved"
                              ? "bg-success/10 text-success"
                              : la.status === "denied"
                                ? "bg-danger/10 text-danger"
                                : la.status === "cancelled"
                                  ? "bg-gray-500/10 text-gray-500"
                                  : "bg-warning/10 text-warning"
                          }`}
                        >
                          {la.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayroll = () => (
    <div>
      <SectionTitle>Pay Slip History</SectionTitle>
      {paySlips.length === 0 ? (
        <p className="text-sm text-muted">No pay slips found.</p>
      ) : (
        <div className="space-y-3">
          {paySlips.map((ps) => (
            <div
              key={ps.id}
              className="border border-border rounded-lg p-4 bg-surface"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">
                  {ps.period_start} – {ps.period_end}
                </span>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                    ps.status === "released"
                      ? "bg-success/10 text-success"
                      : ps.status === "approved"
                        ? "bg-blue-500/10 text-blue-500"
                        : ps.status === "computed"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-warning/10 text-warning"
                  }`}
                >
                  {ps.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field
                  label="Gross Pay"
                  value={`₱${ps.gross_amount.toLocaleString()}`}
                />
                <Field
                  label="Deductions"
                  value={
                    <span className="text-danger">
                      ₱{ps.total_deductions.toLocaleString()}
                    </span>
                  }
                />
                <Field
                  label="Net Pay"
                  value={
                    <span className="font-bold text-success">
                      ₱{ps.net_amount.toLocaleString()}
                    </span>
                  }
                />
              </div>
              {ps.deductions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 flex flex-wrap gap-3">
                  {ps.deductions.map((d: PaySlipDeduction) => (
                    <span key={d.id} className="text-xs text-muted">
                      {d.code}: ₱{d.amount.toLocaleString()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Panel
  // -------------------------------------------------------------------------

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <div className="flex-1 bg-black/50" onClick={onClose} />

        {/* Slide-over panel */}
        <div className="w-full max-w-3xl bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface shrink-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {employee.last_name}, {employee.first_name}
                  {(raw.middle_name as string)
                    ? " " + (raw.middle_name as string)[0] + "."
                    : ""}
                </h2>
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${
                    statusLabel === "Active"
                      ? "bg-success/10 text-success"
                      : statusLabel === "Separated"
                        ? "bg-danger/10 text-danger"
                        : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-sm text-muted mt-0.5 truncate">
                {employee.employee_no} · {employee.position_title} ·{" "}
                {employee.office_name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted/20 text-muted hover:text-foreground transition-colors shrink-0"
              aria-label="Close profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-border bg-surface overflow-x-auto shrink-0">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id
                    ? "border-success text-success"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tabLoading ? (
              <Spinner />
            ) : (
              <>
                {activeTab === "personal" && renderPersonal()}
                {activeTab === "appointment" && renderAppointment()}
                {activeTab === "history" && renderHistory()}
                {activeTab === "leave" && renderLeave()}
                {activeTab === "payroll" && renderPayroll()}
                {activeTab === "documents" && (
                  <div>
                    {documents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                        <FolderOpen className="w-10 h-10 text-muted/40" />
                        <p className="text-sm font-medium text-muted">
                          No documents uploaded yet
                        </p>
                        <p className="text-xs text-muted/60">
                          Uploaded files will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border text-left">
                              <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                                Type
                              </th>
                              <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                                File Name
                              </th>
                              <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                                Size
                              </th>
                              <th className="pb-2 pr-4 font-medium text-muted text-xs uppercase">
                                Uploaded
                              </th>
                              <th className="pb-2 font-medium text-muted text-xs uppercase">
                                Remarks
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {documents.map((doc) => (
                              <tr
                                key={doc.id}
                                className="border-b border-border/50 hover:bg-surface"
                              >
                                <td className="py-2 pr-4 font-medium">
                                  {doc.document_type}
                                </td>
                                <td className="py-2 pr-4">
                                  {doc.file_path ? (
                                    <a
                                      href={doc.file_path}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-success underline underline-offset-2 hover:opacity-80"
                                    >
                                      {doc.file_name}
                                    </a>
                                  ) : (
                                    doc.file_name
                                  )}
                                </td>
                                <td className="py-2 pr-4 text-muted text-xs">
                                  {doc.file_size
                                    ? doc.file_size > 1_048_576
                                      ? `${(doc.file_size / 1_048_576).toFixed(1)} MB`
                                      : `${(doc.file_size / 1024).toFixed(0)} KB`
                                    : "—"}
                                </td>
                                <td className="py-2 pr-4 text-muted text-xs">
                                  {doc.created_at.slice(0, 10)}
                                </td>
                                <td className="py-2 text-muted text-xs">
                                  {doc.remarks || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === "audit" && (
                  <div>
                    {auditLog.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                        <Activity className="w-10 h-10 text-muted/40" />
                        <p className="text-sm font-medium text-muted">
                          No audit entries found
                        </p>
                        <p className="text-xs text-muted/60">
                          Changes to this employee record will appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {auditLog.map((entry) => (
                          <div
                            key={entry.id}
                            className="border border-border rounded-lg p-4 bg-surface space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`inline-block px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                                  entry.action === "create"
                                    ? "bg-success/10 text-success"
                                    : entry.action === "update"
                                      ? "bg-blue-500/10 text-blue-500"
                                      : entry.action === "delete"
                                        ? "bg-danger/10 text-danger"
                                        : "bg-gray-500/10 text-gray-500"
                                }`}
                              >
                                {entry.action.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs text-muted">
                                {entry.created_at
                                  .slice(0, 19)
                                  .replace("T", " ")}
                              </span>
                            </div>
                            {entry.changed_fields &&
                              entry.changed_fields.length > 0 && (
                                <p className="text-xs text-muted">
                                  <span className="font-medium">Changed:</span>{" "}
                                  {entry.changed_fields.join(", ")}
                                </p>
                              )}
                            {entry.remarks && (
                              <p className="text-xs text-muted italic">
                                {entry.remarks}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {employee && (
        <ServiceRecordDialog
          open={showRecordDialog}
          personnelId={employee.id}
          defaultPosId={employee.position_id || undefined}
          defaultOId={employee.office_id || undefined}
          onClose={() => setShowRecordDialog(false)}
          onSaved={handleRecordSaved}
        />
      )}
    </>
  );
};

export default EmployeeProfile;
