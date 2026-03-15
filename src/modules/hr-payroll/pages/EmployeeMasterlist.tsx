import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PageShell,
  Section,
  Card,
  StatCard,
  AccentButton,
  GhostButton,
  FilterSelect,
  EmploymentBadge,
  ActiveBadge,
  EmptyState,
  usePagination,
  Pagination,
  EmptyRows,
} from "../components/ui";
import {
  UserCheck,
  Plus,
  RefreshCw,
  Download,
  Link2,
  Link2Off,
  Pencil,
  Eye,
  MoreHorizontal,
  UserX,
  UserCheck2,
  Search,
  Users,
  Briefcase,
  FileText,
} from "lucide-react";
import type { Employee } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reinstateEmployee,
} from "../services/hrService";
import type { EmployeeFormData } from "../services/hrService";
import LinkAccountDialog from "../components/LinkAccountDialog";
import EmployeeDialog from "../components/EmployeeDialog";
import EmployeeProfile from "../components/EmployeeProfile";
import DeactivateEmployeeDialog from "../components/DeactivateEmployeeDialog";
import type { DeactivatePayload } from "../components/DeactivateEmployeeDialog";

// Raw row shape returned by the Supabase hr.personnel query
interface PersonnelRow {
  id: string;
  employee_no: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string;
  birth_date: string | null;
  sex: string | null;
  civil_status: string | null;
  nationality: string;
  blood_type: string | null;
  contact_number: string | null;
  email: string | null;
  address: string;
  gsis_number: string | null;
  philhealth_number: string | null;
  pagibig_number: string | null;
  tin: string | null;
  employment_status: Employee["employment_status"];
  date_hired: string;
  appointment_type: string | null;
  date_assumed: string | null;
  civil_service_eligibility: string | null;
  separation_date: string | null;
  separation_type: string | null;
  is_active: boolean;
  created_at: string;
  user_id: string | null;
  position: {
    id: string;
    description: string;
    item_no: string;
    salary_grade: number | null;
    salary_rate:
      | {
          rate: { step: number | null } | { step: number | null }[] | null;
        }
      | { rate: { step: number | null } | { step: number | null }[] | null }[]
      | null;
  } | null;
  office: { id: string; description: string } | null;
}

const fetchPersonnel = async (): Promise<Employee[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("personnel")
    .select(
      `
      id, employee_no, first_name, middle_name, last_name, suffix,
      birth_date, sex, civil_status, nationality, blood_type, contact_number, email, address,
      gsis_number, philhealth_number, pagibig_number, tin,
      employment_status, date_hired, appointment_type, date_assumed, civil_service_eligibility,
      separation_date, separation_type, is_active, created_at, user_id,
      position:pos_id (
        id, description, item_no, salary_grade,
        salary_rate:sr_id ( rate:rate_id ( step ) )
      ),
      office:o_id ( id, description )
    `,
    )
    .order("last_name");

  if (error) {
    console.error("Error fetching personnel:", error);
    return [];
  }

  return ((data as unknown as PersonnelRow[]) || []).map((row) => {
    const pos = Array.isArray(row.position) ? row.position[0] : row.position;
    const off = Array.isArray(row.office) ? row.office[0] : row.office;

    // Drill: position -> salary_rate -> rate -> step
    const srRaw = pos?.salary_rate;
    const srObj = Array.isArray(srRaw) ? srRaw[0] : srRaw;
    const rateRaw = srObj?.rate;
    const rateObj = Array.isArray(rateRaw) ? rateRaw[0] : rateRaw;
    const step = (rateObj?.step as number | null) ?? null;

    return {
      id: row.id,
      employee_no: row.employee_no,
      plantilla_item_no: pos?.item_no ?? "—",
      first_name: row.first_name,
      middle_name: row.middle_name,
      last_name: row.last_name,
      // Extra fields for the dialog (cast via unknown since Employee interface is slim)
      ...(row as unknown as Record<string, unknown>),
      position_id: pos?.id ?? "",
      position_title: pos?.description ?? "Unassigned",
      office_id: off?.id ?? "",
      office_name: off?.description ?? "Unassigned",
      salary_grade: pos?.salary_grade ?? null,
      step,
      employment_status: row.employment_status,
      date_hired: row.date_hired,
      separation_date: row.separation_date ?? null,
      separation_type: row.separation_type ?? null,
      is_active: row.is_active,
      created_at: row.created_at,
      user_id: row.user_id,
    };
  });
};

const EmployeeMasterlist = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [linkEmployee, setLinkEmployee] = useState<Employee | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Employee | null>(
    null,
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Filter states
  const [filterOffice, setFilterOffice] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSG, setFilterSG] = useState("");
  const [filterPosition, setFilterPosition] = useState("");

  const loadEmployees = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPersonnel();
    setEmployees(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Update the one row that was just linked/unlinked — no full refetch needed
  const handleLinked = (personnelId: string, userId: string | null) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === personnelId ? { ...e, user_id: userId } : e)),
    );
  };

  // Unique values for filter dropdowns
  const uniqueOffices = useMemo(
    () =>
      [...new Set(employees.map((e) => e.office_name).filter(Boolean))].sort(),
    [employees],
  );
  const uniqueSGs = useMemo(
    () =>
      [
        ...new Set(
          employees
            .filter((e) => e.salary_grade != null)
            .map((e) => `SG-${e.salary_grade}`),
        ),
      ].sort((a, b) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1])),
    [employees],
  );
  const uniquePositions = useMemo(
    () =>
      [
        ...new Set(employees.map((e) => e.position_title).filter(Boolean)),
      ].sort(),
    [employees],
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const label = e.is_active
        ? "Active"
        : e.separation_date
          ? "Separated"
          : "Inactive";

      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.employee_no.toLowerCase().includes(q) ||
        e.position_title.toLowerCase().includes(q);

      return (
        matchSearch &&
        (!filterOffice || e.office_name === filterOffice) &&
        (!filterType || e.employment_status === filterType) &&
        (!filterStatus || label === filterStatus) &&
        (!filterSG ||
          (e.salary_grade != null && `SG-${e.salary_grade}` === filterSG)) &&
        (!filterPosition || e.position_title === filterPosition)
      );
    });
  }, [
    employees,
    search,
    filterOffice,
    filterType,
    filterStatus,
    filterSG,
    filterPosition,
  ]);

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);

  // All user_ids currently claimed — used by the dialog to exclude already-linked accounts
  const linkedUserIds = employees
    .filter((e) => e.user_id !== null)
    .map((e) => e.user_id as string);

  const handleAddEmployee = async (data: EmployeeFormData) => {
    setIsSaving(true);
    const result = await createEmployee(data);
    setIsSaving(false);
    if (result.success) {
      setShowAddDialog(false);
      loadEmployees();
    } else {
      alert(result.error || "Failed to add employee");
    }
  };

  const handleEditEmployee = async (data: EmployeeFormData) => {
    if (!editEmployee) return;
    setIsSaving(true);
    const result = await updateEmployee(editEmployee.id, data);
    setIsSaving(false);
    if (result.success) {
      setEditEmployee(null);
      loadEmployees();
    } else {
      alert(result.error || "Failed to update employee");
    }
  };

  const handleDeactivate = async (payload: DeactivatePayload) => {
    if (!deactivateTarget) return;
    const result = await deactivateEmployee(deactivateTarget.id, payload);
    if (!result.success)
      throw new Error(result.error || "Failed to deactivate employee");
    loadEmployees();
  };

  const handleReinstate = async (employee: Employee) => {
    if (
      !window.confirm(
        `Reinstate ${employee.last_name}, ${employee.first_name}?\nThis will clear the separation record and mark them as active.`,
      )
    )
      return;
    const result = await reinstateEmployee(employee.id);
    if (!result.success) {
      alert(result.error || "Failed to reinstate employee");
      return;
    }
    loadEmployees();
  };

  const hasFilters =
    filterOffice || filterType || filterStatus || filterSG || filterPosition;

  /* ── Action menu for a single employee row ─────────────────────────── */
  const renderActionMenu = (item: Employee) => (
    <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
      <button
        onClick={() =>
          setOpenMenuId((prev) => (prev === item.id ? null : item.id))
        }
        title="Actions"
        className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/20 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {openMenuId === item.id && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] bg-surface border border-border rounded-lg shadow-lg py-1 text-sm">
          <button
            onClick={() => {
              setSelectedEmployee(item);
              setOpenMenuId(null);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
          >
            <Eye className="w-4 h-4 text-accent" />
            View Profile
          </button>
          <button
            onClick={() => {
              setEditEmployee(item);
              setOpenMenuId(null);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Edit Employee
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={() => {
              setLinkEmployee(item);
              setOpenMenuId(null);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
          >
            {item.user_id ? (
              <Link2 className="w-4 h-4 text-accent" />
            ) : (
              <Link2Off className="w-4 h-4 text-muted" />
            )}
            {item.user_id ? "Manage Account Link" : "Link Account"}
          </button>
          <div className="border-t border-border my-1" />
          {item.is_active ? (
            <button
              onClick={() => {
                setDeactivateTarget(item);
                setOpenMenuId(null);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-danger/10 text-danger transition-colors"
            >
              <UserX className="w-4 h-4" />
              Deactivate / Separate
            </button>
          ) : (
            <button
              onClick={() => {
                setOpenMenuId(null);
                handleReinstate(item);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-emerald-500/10 text-emerald-600 transition-colors"
            >
              <UserCheck2 className="w-4 h-4" />
              Reinstate Employee
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <PageShell
      title="Employee Masterlist"
      subtitle="Complete employee records per CSC and DBM standards"
      actions={
        <>
          <AccentButton onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4" />
            Add Employee
          </AccentButton>
          <GhostButton onClick={loadEmployees} disabled={isLoading}>
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </GhostButton>
          <GhostButton onClick={() => {}}>
            <Download className="w-3.5 h-3.5" />
            Export
          </GhostButton>
        </>
      }
    >
      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <Section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Employees"
            value={employees.length}
            icon={<Users className="w-5 h-5" />}
          />
          <StatCard
            label="Active"
            value={employees.filter((e) => e.is_active).length}
            icon={<UserCheck className="w-5 h-5" />}
            accent="text-emerald-600 dark:text-emerald-400"
          />
          <StatCard
            label="Permanent"
            value={
              employees.filter((e) => e.employment_status === "permanent")
                .length
            }
            icon={<Briefcase className="w-5 h-5" />}
          />
          <StatCard
            label="Job Order"
            value={
              employees.filter((e) => e.employment_status === "job_order")
                .length
            }
            icon={<FileText className="w-5 h-5" />}
            accent="text-amber-600 dark:text-amber-400"
          />
        </div>
      </Section>

      {/* ── Filter Bar ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        <FilterSelect
          value={filterOffice}
          onChange={setFilterOffice}
          placeholder="All Offices"
          options={uniqueOffices.map((o) => ({ value: o, label: o }))}
        />

        <FilterSelect
          value={filterType}
          onChange={setFilterType}
          placeholder="All Employment Types"
          options={[
            { value: "permanent", label: "Permanent" },
            { value: "casual", label: "Casual" },
            { value: "coterminous", label: "Coterminous" },
            { value: "contractual", label: "Contractual" },
            { value: "job_order", label: "Job Order" },
          ]}
        />

        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          placeholder="All Statuses"
          options={[
            { value: "Active", label: "Active" },
            { value: "Inactive", label: "Inactive" },
            { value: "Separated", label: "Separated" },
          ]}
        />

        <FilterSelect
          value={filterSG}
          onChange={setFilterSG}
          placeholder="All Salary Grades"
          options={uniqueSGs.map((sg) => ({ value: sg, label: sg }))}
        />

        <FilterSelect
          value={filterPosition}
          onChange={setFilterPosition}
          placeholder="All Positions"
          options={uniquePositions.map((p) => ({ value: p, label: p }))}
        />

        {hasFilters && (
          <button
            onClick={() => {
              setFilterOffice("");
              setFilterType("");
              setFilterStatus("");
              setFilterSG("");
              setFilterPosition("");
            }}
            className="text-xs text-muted hover:text-accent underline px-2 py-1 transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Table Card ──────────────────────────────────────────────── */}
      <Card>
        {/* Search bar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, ID, or position..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
              />
            </div>
            <span className="text-sm text-muted whitespace-nowrap tabular-nums">
              {filtered.length} employee{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* ── Desktop Table ──────────────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState
              message={
                isLoading ? "Loading employees..." : "No employees found."
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Employee ID
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Plantilla Item
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Position Title
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    SG
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Step
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Office / Dept.
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Employment
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Appointment Date
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-foreground font-mono text-xs">
                      {item.employee_no}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.plantilla_item_no}
                    </td>
                    <td className="px-4 py-3 text-foreground font-medium">
                      {item.last_name}, {item.first_name}
                      {item.middle_name ? " " + item.middle_name[0] + "." : ""}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {item.position_title}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {item.salary_grade != null
                        ? `SG-${item.salary_grade}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground tabular-nums">
                      {item.step != null ? `Step ${item.step}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {item.office_name}
                    </td>
                    <td className="px-4 py-3">
                      <EmploymentBadge status={item.employment_status} />
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {item.date_hired}
                    </td>
                    <td className="px-4 py-3">
                      <ActiveBadge
                        isActive={item.is_active}
                        separationDate={item.separation_date}
                      />
                    </td>
                    <td className="px-4 py-3">{renderActionMenu(item)}</td>
                  </tr>
                ))}
                <EmptyRows count={emptyRows} columns={11} />
              </tbody>
            </table>
          )}
        </div>

        {/* ── Mobile Card List ───────────────────────────────────────── */}
        <div className="md:hidden divide-y divide-border">
          {filtered.length === 0 ? (
            <EmptyState
              message={
                isLoading ? "Loading employees..." : "No employees found."
              }
            />
          ) : (
            pageItems.map((item) => (
              <div key={item.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.last_name}, {item.first_name}
                      {item.middle_name ? " " + item.middle_name[0] + "." : ""}
                    </p>
                    <p className="text-xs text-muted truncate">
                      {item.position_title}
                    </p>
                  </div>
                  {renderActionMenu(item)}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <EmploymentBadge status={item.employment_status} />
                  <ActiveBadge
                    isActive={item.is_active}
                    separationDate={item.separation_date}
                  />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-muted">ID: </span>
                    <span className="text-foreground font-mono">
                      {item.employee_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Plantilla: </span>
                    <span className="text-foreground">
                      {item.plantilla_item_no}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">SG: </span>
                    <span className="text-foreground tabular-nums">
                      {item.salary_grade != null
                        ? `SG-${item.salary_grade}`
                        : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">Step: </span>
                    <span className="text-foreground tabular-nums">
                      {item.step != null ? `Step ${item.step}` : "—"}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted">Office: </span>
                    <span className="text-foreground">{item.office_name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted">Appointed: </span>
                    <span className="text-foreground">{item.date_hired}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
      </Card>

      {/* ── Dialogs (unchanged) ─────────────────────────────────────── */}
      <EmployeeDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddEmployee}
        isLoading={isSaving}
      />

      <EmployeeDialog
        open={editEmployee !== null}
        onClose={() => setEditEmployee(null)}
        onSubmit={handleEditEmployee}
        employee={editEmployee}
        isLoading={isSaving}
      />

      <LinkAccountDialog
        open={linkEmployee !== null}
        onClose={() => setLinkEmployee(null)}
        employee={linkEmployee}
        linkedUserIds={linkedUserIds}
        onLinked={handleLinked}
      />

      <EmployeeProfile
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />

      <DeactivateEmployeeDialog
        open={deactivateTarget !== null}
        employee={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />
    </PageShell>
  );
};

export default EmployeeMasterlist;
