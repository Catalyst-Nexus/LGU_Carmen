import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  IconButton,
} from "@/components/ui";
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
} from "lucide-react";
import type { Employee } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  reinstateEmployee,
} from "@/services/hrService";
import type { EmployeeFormData } from "@/services/hrService";
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

    // Drill: position → salary_rate → rate → step
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

  // Derive employee status label
  const getStatusLabel = (e: Employee): "Active" | "Separated" | "Inactive" => {
    if (!e.is_active) {
      return e.separation_date ? "Separated" : "Inactive";
    }
    return "Active";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employee Masterlist"
        subtitle="Complete employee records per CSC and DBM standards"
        icon={<UserCheck className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard
          label="Active"
          value={employees.filter((e) => e.is_active).length}
          color="success"
        />
        <StatCard
          label="Permanent"
          value={
            employees.filter((e) => e.employment_status === "permanent").length
          }
          color="primary"
        />
        <StatCard
          label="Job Order"
          value={
            employees.filter((e) => e.employment_status === "job_order").length
          }
          color="warning"
        />
      </StatsRow>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filterOffice}
          onChange={(e) => setFilterOffice(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
        >
          <option value="">All Offices</option>
          {uniqueOffices.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
        >
          <option value="">All Employment Types</option>
          <option value="permanent">Permanent</option>
          <option value="casual">Casual</option>
          <option value="coterminous">Coterminous</option>
          <option value="contractual">Contractual</option>
          <option value="job_order">Job Order</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Separated">Separated</option>
        </select>

        <select
          value={filterSG}
          onChange={(e) => setFilterSG(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
        >
          <option value="">All Salary Grades</option>
          {uniqueSGs.map((sg) => (
            <option key={sg} value={sg}>
              {sg}
            </option>
          ))}
        </select>

        <select
          value={filterPosition}
          onChange={(e) => setFilterPosition(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-success/50"
        >
          <option value="">All Positions</option>
          {uniquePositions.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {(filterOffice ||
          filterType ||
          filterStatus ||
          filterSG ||
          filterPosition) && (
          <button
            onClick={() => {
              setFilterOffice("");
              setFilterType("");
              setFilterStatus("");
              setFilterSG("");
              setFilterPosition("");
            }}
            className="text-xs text-muted hover:text-foreground underline px-2 py-1"
          >
            Clear filters
          </button>
        )}
      </div>

      <ActionsBar>
        <PrimaryButton onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Employee
        </PrimaryButton>
        <PrimaryButton onClick={loadEmployees} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<Employee>
        data={filtered}
        columns={[
          { key: "employee_no", header: "Employee ID" },
          { key: "plantilla_item_no", header: "Plantilla Item" },
          {
            key: "last_name",
            header: "Full Name",
            render: (item) => (
              <span>
                {item.last_name}, {item.first_name}
                {item.middle_name ? " " + item.middle_name[0] + "." : ""}
              </span>
            ),
          },
          { key: "position_title", header: "Position Title" },
          {
            key: "salary_grade",
            header: "SG",
            render: (item) => (
              <span>
                {item.salary_grade != null ? `SG-${item.salary_grade}` : "—"}
              </span>
            ),
          },
          {
            key: "step",
            header: "Step",
            render: (item) => (
              <span>{item.step != null ? `Step ${item.step}` : "—"}</span>
            ),
          },
          { key: "office_name", header: "Office / Dept." },
          {
            key: "employment_status",
            header: "Employment Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.employment_status === "permanent"
                    ? "bg-green-500/10 text-green-500"
                    : item.employment_status === "casual"
                      ? "bg-blue-500/10 text-blue-500"
                      : item.employment_status === "job_order"
                        ? "bg-orange-500/10 text-orange-500"
                        : item.employment_status === "contractual"
                          ? "bg-purple-500/10 text-purple-500"
                          : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {item.employment_status.replace(/_/g, " ").toUpperCase()}
              </span>
            ),
          },
          { key: "date_hired", header: "Appointment Date" },
          {
            key: "is_active",
            header: "Status",
            render: (item) => {
              const label = getStatusLabel(item);
              return (
                <span
                  className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                    label === "Active"
                      ? "bg-success/10 text-success"
                      : label === "Separated"
                        ? "bg-danger/10 text-danger"
                        : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {label}
                </span>
              );
            },
          },
          {
            key: "user_id",
            header: "Actions",
            render: (item) => (
              <div
                className="relative"
                ref={openMenuId === item.id ? menuRef : null}
              >
                <IconButton
                  onClick={() =>
                    setOpenMenuId((prev) => (prev === item.id ? null : item.id))
                  }
                  title="Actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </IconButton>

                {openMenuId === item.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] bg-background border border-border rounded-lg shadow-lg py-1 text-sm">
                    <button
                      onClick={() => {
                        setSelectedEmployee(item);
                        setOpenMenuId(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                    >
                      <Eye className="w-4 h-4 text-primary" />
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
                        <Link2 className="w-4 h-4 text-success" />
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
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-success/10 text-success transition-colors"
                      >
                        <UserCheck2 className="w-4 h-4" />
                        Reinstate Employee
                      </button>
                    )}
                  </div>
                )}
              </div>
            ),
          },
        ]}
        title={`Employees (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, ID, or position..."
        emptyMessage={isLoading ? "Loading employees…" : "No employees found."}
      />

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
    </div>
  );
};

export default EmployeeMasterlist;
