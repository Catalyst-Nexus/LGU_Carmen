import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  Users,
  Briefcase,
  CalendarOff,
  Clock,
  ChevronRight,
  Building2,
  ClipboardList,
  Wallet,
  ScanFace,
  UserCheck,
  UserMinus,
  MapPin,
  FileSpreadsheet,
  Receipt,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  PageShell,
  Section,
  Card,
  StatCard,
  EmploymentBadge,
  EmptyState,
} from "../components/ui";

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

/* ── Data Fetch ────────────────────────────────────────────────────── */

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
    coterminous: active.filter((p) => p.employment_status === "coterminous").length,
    contractual: active.filter((p) => p.employment_status === "contractual").length,
    job_order: active.filter((p) => p.employment_status === "job_order").length,
  };

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

/* ── Config ────────────────────────────────────────────────────────── */

const BREAKDOWN_ITEMS: { key: keyof EmploymentBreakdown; label: string; color: string }[] = [
  { key: "permanent", label: "Permanent", color: "bg-accent" },
  { key: "casual", label: "Casual", color: "bg-amber-500" },
  { key: "coterminous", label: "Coterminous", color: "bg-sky-500" },
  { key: "contractual", label: "Contractual", color: "bg-violet-500" },
  { key: "job_order", label: "Job Order", color: "bg-orange-500" },
];

const QUICK_LINKS = [
  { label: "Employee Masterlist", path: "/dashboard/hr-payroll/employees", icon: Users, desc: "View all personnel" },
  { label: "Plantilla Positions", path: "/dashboard/hr-payroll/plantilla", icon: ClipboardList, desc: "DBM plantilla" },
  { label: "Leave Management", path: "/dashboard/hr-payroll/leave", icon: CalendarOff, desc: "Applications & credits" },
  { label: "Attendance & DTR", path: "/dashboard/hr-payroll/attendance", icon: Clock, desc: "Time records" },
  { label: "Payroll", path: "/dashboard/hr-payroll/payroll", icon: Wallet, desc: "Computation & slips" },
  { label: "Time Clock", path: "/dashboard/hr-payroll/time-clock", icon: ScanFace, desc: "Biometric clock" },
  { label: "Salary Schedule", path: "/dashboard/hr-payroll/salary-schedule", icon: FileSpreadsheet, desc: "SG/Step rates" },
  { label: "Remittance", path: "/dashboard/hr-payroll/remittance", icon: Receipt, desc: "Deduction reports" },
];

/* ── Component ─────────────────────────────────────────────────────── */

const HRDashboard = () => {
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

  const maxOfficeCount = Math.max(...stats.officeDistribution.map((o) => o.count), 1);

  return (
    <PageShell
      title="HR & Payroll"
      subtitle="Workforce overview and management"
      onRefresh={load}
      isLoading={isLoading}
    >
      {/* ── Workforce Stats ────────────────────────────────────────── */}
      <Section title="Workforce">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Employees" value={stats.totalEmployees} icon={<Users className="w-4 h-4" />} />
          <StatCard label="Active" value={stats.activeEmployees} icon={<UserCheck className="w-4 h-4" />} accent="text-emerald-600" />
          <StatCard label="Separated / Inactive" value={stats.inactiveEmployees} icon={<UserMinus className="w-4 h-4" />} accent="text-red-600" />
          <StatCard label="Offices" value={stats.offices} icon={<Building2 className="w-4 h-4" />} />
        </div>
      </Section>

      {/* ── Plantilla & Leave Stats ────────────────────────────────── */}
      <Section title="Plantilla & Leave">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Positions" value={stats.totalPositions} icon={<Briefcase className="w-4 h-4" />} />
          <StatCard label="Filled" value={stats.filledPositions} icon={<UserCheck className="w-4 h-4" />} accent="text-emerald-600" />
          <StatCard label="Vacant" value={stats.vacantPositions} icon={<MapPin className="w-4 h-4" />} accent="text-amber-600" />
          <StatCard label="Pending Leaves" value={stats.pendingLeaves} icon={<CalendarOff className="w-4 h-4" />} accent="text-red-600" />
        </div>
      </Section>

      {/* ── Analytics Row ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Employment Breakdown</h3>
          {stats.activeEmployees === 0 ? (
            <EmptyState message="No active employees found." />
          ) : (
            <div className="space-y-3">
              {BREAKDOWN_ITEMS.map(({ key, label, color }) => {
                const count = stats.breakdown[key];
                const pct = Math.round((count / stats.activeEmployees) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />
                        <span className="text-sm text-foreground">{label}</span>
                      </div>
                      <span className="text-sm tabular-nums font-medium text-foreground">
                        {count}
                        <span className="text-muted font-normal ml-1 text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-border/60 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribution by Office</h3>
          {stats.officeDistribution.length === 0 ? (
            <EmptyState message="No office data available." />
          ) : (
            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {stats.officeDistribution.map(({ office, count }) => (
                <div key={office} className="flex items-center gap-3">
                  <span className="text-sm text-foreground truncate min-w-0 flex-1">{office}</span>
                  <div className="w-28 sm:w-36 h-1.5 bg-border/60 rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-500"
                      style={{ width: `${(count / maxOfficeCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums font-medium text-foreground w-6 text-right shrink-0">{count}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ── Quick Navigation ───────────────────────────────────────── */}
      <Section title="Quick Navigation">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="group flex items-start gap-3 p-4 bg-surface border border-border rounded-xl text-left hover:border-accent/40 hover:shadow-sm transition-all"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/8 text-accent shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                <link.icon className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground block leading-tight">{link.label}</span>
                <span className="text-xs text-muted mt-0.5 block">{link.desc}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-border group-hover:text-accent ml-auto shrink-0 mt-0.5 transition-colors" />
            </button>
          ))}
        </div>
      </Section>

      {/* ── Recent Hires ───────────────────────────────────────────── */}
      <Section title="Recent Hires">
        <Card className="overflow-hidden">
          {stats.recentHires.length === 0 ? (
            <EmptyState message="No personnel records found." />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-background/60">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Position</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Office</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Date Hired</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stats.recentHires.map((hire) => (
                      <tr key={hire.id} className="hover:bg-background/40 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">{hire.name}</td>
                        <td className="py-3 px-4 text-muted">{hire.position}</td>
                        <td className="py-3 px-4 text-muted">{hire.office}</td>
                        <td className="py-3 px-4 text-muted tabular-nums">
                          {new Date(hire.date_hired).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </td>
                        <td className="py-3 px-4">
                          <EmploymentBadge status={hire.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden divide-y divide-border">
                {stats.recentHires.map((hire) => (
                  <div key={hire.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-foreground">{hire.name}</span>
                      <EmploymentBadge status={hire.status} />
                    </div>
                    <p className="text-xs text-muted">{hire.position}</p>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{hire.office}</span>
                      <span className="tabular-nums">
                        {new Date(hire.date_hired).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </Section>
    </PageShell>
  );
};

export default HRDashboard;
