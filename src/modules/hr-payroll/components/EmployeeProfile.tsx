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
  type ServiceRecord,
  type LeaveCredit,
} from "@/services/hrService";

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
  const [loadedTabs, setLoadedTabs] = useState(new Set<TabId>());

  // Reset all tab data when the selected employee changes
  useEffect(() => {
    setActiveTab("personal");
    setLoadedTabs(new Set());
    setServiceRecords([]);
    setLeaveCredits([]);
    setLeaveApps([]);
    setPaySlips([]);
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
          <Field label="Employee No." value={employee.employee_no} />
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
            label="Civil Status"
            value={(raw.civil_status as string)?.replace(/_/g, " ") || "—"}
          />
          <Field label="Blood Type" value={(raw.blood_type as string) || "—"} />
        </div>
      </div>
      <div>
        <SectionTitle>Contact</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Contact Number"
            value={(raw.contact_number as string) || "—"}
          />
          <Field label="Address" value={(raw.address as string) || "—"} />
        </div>
      </div>
      <div>
        <SectionTitle>Government IDs</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field
            label="GSIS BP No."
            value={(raw.gsis_number as string) || "—"}
          />
          <Field
            label="PhilHealth No."
            value={(raw.philhealth_number as string) || "—"}
          />
          <Field
            label="Pag-IBIG MID"
            value={(raw.pagibig_number as string) || "—"}
          />
          <Field label="TIN" value={(raw.tin as string) || "—"} />
        </div>
      </div>
    </div>
  );

  const renderAppointment = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>Current Position</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field
            label="Plantilla Item No."
            value={employee.plantilla_item_no}
          />
          <Field label="Position Title" value={employee.position_title} />
          <Field label="Office / Dept." value={employee.office_name} />
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
        <SectionTitle>Employment</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field
            label="Employment Status"
            value={employee.employment_status.replace(/_/g, " ").toUpperCase()}
          />
          <Field label="Date Hired / Appointed" value={employee.date_hired} />
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
          {(raw.separation_date as string) && (
            <>
              <Field
                label="Separation Date"
                value={raw.separation_date as string}
              />
              <Field
                label="Separation Type"
                value={
                  (raw.separation_type as string)?.replace(/_/g, " ") || "—"
                }
              />
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div>
      {serviceRecords.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No employment history records found.
        </div>
      ) : (
        <div className="space-y-3">
          {serviceRecords.map((r) => (
            <div
              key={r.id}
              className="border border-border rounded-lg p-4 space-y-2 bg-surface"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-block px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                    r.record_type === "appointment"
                      ? "bg-blue-500/10 text-blue-500"
                      : r.record_type === "promotion"
                        ? "bg-green-500/10 text-green-500"
                        : r.record_type === "transfer"
                          ? "bg-purple-500/10 text-purple-500"
                          : r.record_type === "separation"
                            ? "bg-red-500/10 text-red-500"
                            : r.record_type === "step_increment"
                              ? "bg-teal-500/10 text-teal-500"
                              : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {r.record_type.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-muted">
                  {r.effective_date}
                  {r.end_date ? ` → ${r.end_date}` : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {r.position_title && (
                  <Field label="Position" value={r.position_title} />
                )}
                {r.office_name && (
                  <Field label="Office" value={r.office_name} />
                )}
                <Field
                  label="Monthly Salary"
                  value={`₱${r.monthly_salary.toLocaleString()}`}
                />
                {r.appointment_status && (
                  <Field
                    label="Appointment Status"
                    value={r.appointment_status}
                  />
                )}
                {r.separation_type && (
                  <Field
                    label="Separation Type"
                    value={r.separation_type.replace(/_/g, " ")}
                  />
                )}
              </div>
              {r.remarks && (
                <p className="text-xs text-muted italic">{r.remarks}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderLeave = () => (
    <div className="space-y-6">
      <div>
        <SectionTitle>Leave Credit Balances</SectionTitle>
        {leaveCredits.length === 0 ? (
          <p className="text-sm text-muted">No leave credits on record.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {leaveCredits.map((c) => (
              <div
                key={c.id}
                className="border border-border rounded-lg p-3 bg-surface"
              >
                <p className="text-xs font-medium text-muted mb-1">
                  {
                    (c as unknown as Record<string, unknown>)
                      .lot_description as string
                  }
                </p>
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
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                  <FolderOpen className="w-10 h-10 text-muted/40" />
                  <p className="text-sm font-medium text-muted">
                    Document management not yet available
                  </p>
                  <p className="text-xs text-muted/60">
                    This feature requires a documents table in the database.
                  </p>
                </div>
              )}
              {activeTab === "audit" && (
                <div className="flex flex-col items-center justify-center h-48 text-center gap-2">
                  <Activity className="w-10 h-10 text-muted/40" />
                  <p className="text-sm font-medium text-muted">
                    Audit log not yet available
                  </p>
                  <p className="text-xs text-muted/60">
                    This feature requires an audit_log table in the database.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;
