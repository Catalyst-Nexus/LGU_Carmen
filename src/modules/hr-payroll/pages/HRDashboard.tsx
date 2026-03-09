import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { PageHeader, StatsRow, StatCard, Tabs } from "@/components/ui";
import {
  Users,
  Briefcase,
  CalendarOff,
  UserCheck,
  UserX,
  Building2,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";

/* ── Types ─────────────────────────────────────────────────────────── */

interface EmploymentBreakdown {
  permanent: number;
  casual: number;
  coterminous: number;
  contractual: number;
  job_order: number;
}

interface OfficeCount {
  office: string;
  count: number;
}

interface RecentHire {
  id: string;
  name: string;
  position: string;
  office: string;
  date_hired: string;
  status: string;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  totalPositions: number;
  filledPositions: number;
  vacantPositions: number;
  pendingLeaves: number;
  offices: number;
  breakdown: EmploymentBreakdown;
  officeDistribution: OfficeCount[];
  recentHires: RecentHire[];
}

interface PersonnelRow {
  id: string;
  employment_status: string;
  is_active: boolean;
  date_hired: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  pos_id: string | null;
  o_id: string | null;
  position: { description: string } | { description: string }[] | null;
  office: { description: string } | { description: string }[] | null;
}

interface PositionRow {
  id: string;
  is_filled: boolean;
  is_active: boolean;
}
interface OfficeRow {
  id: string;
  description: string;
}
interface LeaveRow {
  id: string;
}

const emptyStats: DashboardStats = {
  totalEmployees: 0,
  activeEmployees: 0,
  inactiveEmployees: 0,
  totalPositions: 0,
  filledPositions: 0,
  vacantPositions: 0,
  pendingLeaves: 0,
  offices: 0,
  breakdown: {
    permanent: 0,
    casual: 0,
    coterminous: 0,
    contractual: 0,
    job_order: 0,
  },
  officeDistribution: [],
  recentHires: [],
};

/* ── Data fetch ────────────────────────────────────────────────────── */

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  if (!isSupabaseConfigured() || !supabase) return emptyStats;

  const hr = (supabase as NonNullable<typeof supabase>).schema("hr");

  const [personnelRes, positionRes, officeRes, leaveRes] = await Promise.all([
    hr
      .from("personnel")
      .select(
        "id, employment_status, is_active, date_hired, first_name, middle_name, last_name, pos_id, o_id, position:pos_id(description), office:o_id(description)",
      )
      .order("date_hired", { ascending: false }),
    hr.from("position").select("id, is_filled, is_active"),
    hr.from("office").select("id, description").eq("is_active", true),
    hr.from("personnel_leave_out").select("id").eq("status", "pending"),
  ]);

  const personnel = (personnelRes.data || []) as PersonnelRow[];
  const positions = (positionRes.data || []) as PositionRow[];
  const offices = (officeRes.data || []) as OfficeRow[];
  const pendingLeaves = (leaveRes.data || []) as LeaveRow[];

  const active = personnel.filter((p) => p.is_active);
  const inactive = personnel.filter((p) => !p.is_active);

  const breakdown: EmploymentBreakdown = {
    permanent: active.filter((p) => p.employment_status === "permanent").length,
    casual: active.filter((p) => p.employment_status === "casual").length,
    coterminous: active.filter((p) => p.employment_status === "coterminous")
      .length,
    contractual: active.filter((p) => p.employment_status === "contractual")
      .length,
    job_order: active.filter((p) => p.employment_status === "job_order").length,
  };

  // Office distribution
  const officeMap = new Map<string, number>();
  active.forEach((p) => {
    const name = Array.isArray(p.office)
      ? p.office[0]?.description
      : p.office?.description;
    if (name) officeMap.set(name, (officeMap.get(name) || 0) + 1);
  });
  const officeDistribution: OfficeCount[] = [...officeMap.entries()]
    .map(([office, count]) => ({ office, count }))
    .sort((a, b) => b.count - a.count);

  const filledPositions = positions.filter((p) => p.is_filled).length;

  // Recent hires — top 5
  const recentHires: RecentHire[] = active.slice(0, 5).map((p) => {
    const pos = Array.isArray(p.position) ? p.position[0] : p.position;
    const off = Array.isArray(p.office) ? p.office[0] : p.office;
    return {
      id: p.id,
      name: `${p.last_name}, ${p.first_name} ${p.middle_name || ""}`.trim(),
      position: pos?.description ?? "Unassigned",
      office: off?.description ?? "—",
      date_hired: p.date_hired,
      status: p.employment_status,
    };
  });

  return {
    totalEmployees: personnel.length,
    activeEmployees: active.length,
    inactiveEmployees: inactive.length,
    totalPositions: positions.length,
    filledPositions,
    vacantPositions: positions.length - filledPositions,
    pendingLeaves: pendingLeaves.length,
    offices: offices.length,
    breakdown,
    officeDistribution,
    recentHires,
  };
};

/* ── Status badge colours ──────────────────────────────────────────── */

const statusColor: Record<string, string> = {
  permanent:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  casual:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  coterminous: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  contractual:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  job_order:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

/* ── Component ─────────────────────────────────────────────────────── */

const HRDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchDashboardStats();
    setStats(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const breakdownLabels: { key: keyof EmploymentBreakdown; label: string }[] = [
    { key: "permanent", label: "Permanent" },
    { key: "casual", label: "Casual" },
    { key: "coterminous", label: "Coterminous" },
    { key: "contractual", label: "Contractual" },
    { key: "job_order", label: "Job Order" },
  ];

  const quickLinks = [
    {
      label: "Employee Masterlist",
      path: "/dashboard/hr-payroll/employees",
      icon: Users,
    },
    {
      label: "Plantilla Positions",
      path: "/dashboard/hr-payroll/plantilla",
      icon: Briefcase,
    },
    {
      label: "Leave Management",
      path: "/dashboard/hr-payroll/leave",
      icon: CalendarOff,
    },
    {
      label: "Payroll Computation",
      path: "/dashboard/hr-payroll/payroll",
      icon: Briefcase,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="HR & Payroll Dashboard"
          subtitle="Real-time overview of human resources, plantilla, and payroll"
          icon={<Users className="w-6 h-6" />}
        />
        <button
          onClick={load}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-primary transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ── Row 1 — Workforce ───────────────────────────────────────── */}
      <StatsRow>
        <StatCard
          label="Total Employees"
          value={stats.totalEmployees}
          color="primary"
        />
        <StatCard
          label="Active"
          value={stats.activeEmployees}
          color="success"
        />
        <StatCard
          label="Inactive"
          value={stats.inactiveEmployees}
          color="danger"
        />
        <StatCard label="Offices" value={stats.offices} />
      </StatsRow>

      {/* ── Row 2 — Plantilla & Leave ──────────────────────────────── */}
      <StatsRow>
        <StatCard label="Total Positions" value={stats.totalPositions} />
        <StatCard
          label="Filled"
          value={stats.filledPositions}
          color="success"
        />
        <StatCard
          label="Vacant"
          value={stats.vacantPositions}
          color="warning"
        />
        <StatCard
          label="Pending Leaves"
          value={stats.pendingLeaves}
          color="danger"
        />
      </StatsRow>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "offices", label: "By Office" },
          { id: "recent", label: "Recent Hires" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* ── Overview Tab ────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employment Breakdown */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-success" />
              Employment Breakdown
            </h3>
            <div className="space-y-3">
              {breakdownLabels.map(({ key, label }) => {
                const count = stats.breakdown[key];
                const pct =
                  stats.activeEmployees > 0
                    ? Math.round((count / stats.activeEmployees) * 100)
                    : 0;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted">{label}</span>
                      <span className="text-sm font-semibold text-primary">
                        {count}{" "}
                        <span className="text-xs text-muted font-normal">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-success" />
              Quick Links
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {quickLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 border border-transparent hover:border-border transition-all text-left group"
                >
                  <link.icon className="w-5 h-5 text-muted group-hover:text-success transition-colors" />
                  <span className="flex-1 text-sm font-medium text-primary">
                    {link.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Offices Tab ─────────────────────────────────────────────── */}
      {activeTab === "offices" && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-success" />
            Employee Distribution by Office
          </h3>
          {stats.officeDistribution.length === 0 ? (
            <p className="text-sm text-muted">No office data available.</p>
          ) : (
            <div className="space-y-3">
              {stats.officeDistribution.map(({ office, count }) => {
                const pct =
                  stats.activeEmployees > 0
                    ? Math.round((count / stats.activeEmployees) * 100)
                    : 0;
                return (
                  <div key={office}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted truncate max-w-[60%]">
                        {office}
                      </span>
                      <span className="text-sm font-semibold text-primary">
                        {count}{" "}
                        <span className="text-xs text-muted font-normal">
                          ({pct}%)
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Recent Hires Tab ────────────────────────────────────────── */}
      {activeTab === "recent" && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <UserX className="w-5 h-5 text-success" />
            Recent Hires
          </h3>
          {stats.recentHires.length === 0 ? (
            <p className="text-sm text-muted">No personnel records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Position</th>
                    <th className="pb-3 font-medium">Office</th>
                    <th className="pb-3 font-medium">Date Hired</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.recentHires.map((hire) => (
                    <tr
                      key={hire.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 font-medium text-primary">
                        {hire.name}
                      </td>
                      <td className="py-3 text-muted">{hire.position}</td>
                      <td className="py-3 text-muted">{hire.office}</td>
                      <td className="py-3 text-muted">
                        {new Date(hire.date_hired).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor[hire.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {hire.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
