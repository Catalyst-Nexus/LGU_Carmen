import { Routes, Route, Link } from "react-router";
import { lazy, Suspense, useMemo } from "react";
import Layout from "@/layouts/Layout";
import { useRBAC } from "@/contexts/RBACContext";
import UserProfile from "../UserProfile/UserProfile";
import Settings from "../Settings/Settings";

// Dynamic component loader - loads any component by its file path
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-success mx-auto mb-4"></div>
      <p className="text-muted">Loading module...</p>
    </div>
  </div>
);

// Build a map of all available modules using Vite's glob pattern
// This allows truly dynamic loading without hardcoding individual imports
const moduleMap = import.meta.glob("../../modules/**/pages/*.tsx", {
  eager: false,
  import: "default",
});

const DynamicComponentLoader = ({ filePath }: { filePath: string }) => {
  // Normalize the path (convert backslashes to forward slashes)
  const normalizedPath = filePath.replace(/\\/g, "/");
  const modulePath = `../../${normalizedPath}.tsx`;

  // Memoize the lazy component based on filePath to ensure stable component reference
  // This prevents React Router from losing track of component transitions
  const Component = useMemo(() => {
    return lazy(() =>
      (async () => {
        try {
          const moduleLoader = moduleMap[modulePath];
          if (!moduleLoader) {
            throw new Error(`Module not found: ${modulePath}`);
          }
          const defaultExport = await moduleLoader();
          return { default: defaultExport as React.ComponentType };
        } catch (error: unknown) {
          console.error(`Failed to load module ${normalizedPath}:`, error);
          return {
            default: (() => (
              <div className="flex items-center justify-center h-96 text-red-500 flex-col gap-4">
                <p className="text-lg font-semibold">Failed to load module</p>
                <p className="text-sm text-muted">{normalizedPath}</p>
                <p className="text-xs text-muted">
                  Check that the file exists and exports a default component
                </p>
              </div>
            )) as unknown as React.ComponentType,
          };
        }
      })(),
    );
  }, [modulePath, normalizedPath]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

import { cn } from "@/lib/utils";
import {
  Users,
  Settings as SettingsIcon,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  Activity,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Briefcase,
  CalendarOff,
  Calculator,
  FileSpreadsheet,
} from "lucide-react";

const colorClasses = {
  blue: {
    gradient: "from-blue-500 to-blue-400",
    light: "bg-blue-50 text-blue-500",
    bar: "bg-gradient-to-r from-blue-500 to-blue-400",
  },
  green: {
    gradient: "from-green-500 to-green-400",
    light: "bg-green-50 text-green-500",
    bar: "bg-gradient-to-r from-green-500 to-green-400",
  },
  purple: {
    gradient: "from-purple-500 to-purple-400",
    light: "bg-purple-50 text-purple-500",
    bar: "bg-gradient-to-r from-purple-500 to-purple-400",
  },
  orange: {
    gradient: "from-orange-500 to-orange-400",
    light: "bg-orange-50 text-orange-500",
    bar: "bg-gradient-to-r from-orange-500 to-orange-400",
  },
  teal: {
    gradient: "from-teal-500 to-teal-400",
    light: "bg-teal-50 text-teal-500",
    bar: "bg-gradient-to-r from-teal-500 to-teal-400",
  },
  pink: {
    gradient: "from-pink-500 to-pink-400",
    light: "bg-pink-50 text-pink-500",
    bar: "bg-gradient-to-r from-pink-500 to-pink-400",
  },
};

const DashboardHome = () => {
  // TODO: Replace with API calls to fetch real-time HR dashboard stats
  const stats = [
    {
      icon: Users,
      value: "0",
      label: "Active Employees",
      trend: "+2%",
      trendUp: true,
      color: "blue" as const,
    },
    {
      icon: Briefcase,
      value: "0",
      label: "Plantilla Positions",
      trend: "0%",
      trendUp: true,
      color: "green" as const,
    },
    {
      icon: CalendarOff,
      value: "0",
      label: "Pending Leave Requests",
      trend: "-3%",
      trendUp: true,
      color: "purple" as const,
    },
    {
      icon: Calculator,
      value: "₱0.00",
      label: "Total Payroll",
      trend: "+1.5%",
      trendUp: true,
      color: "orange" as const,
    },
  ];

  const quickLinks = [
    {
      to: "/dashboard/hr-payroll",
      icon: Users,
      text: "HR Dashboard",
      description: "Overview of HR & Payroll",
      color: "blue" as const,
    },
    {
      to: "/dashboard/hr-payroll/employees",
      icon: Users,
      text: "Employee Masterlist",
      description: "Manage employee records",
      color: "green" as const,
    },
    {
      to: "/dashboard/hr-payroll/plantilla",
      icon: Briefcase,
      text: "Plantilla Positions",
      description: "Position items & incumbents",
      color: "purple" as const,
    },
    {
      to: "/dashboard/hr-payroll/leave",
      icon: CalendarOff,
      text: "Leave Management",
      description: "Leave applications & balances",
      color: "orange" as const,
    },
    {
      to: "/dashboard/hr-payroll/attendance",
      icon: Clock,
      text: "Attendance & DTR",
      description: "Daily time records",
      color: "teal" as const,
    },
    {
      to: "/dashboard/hr-payroll/payroll",
      icon: Calculator,
      text: "Payroll Computation",
      description: "Compute payroll & deductions",
      color: "pink" as const,
    },
    {
      to: "/dashboard/hr-payroll/register",
      icon: FileSpreadsheet,
      text: "Payroll Register",
      description: "Payroll summary & history",
      color: "blue" as const,
    },
    {
      to: "/dashboard/hr-payroll/remittance",
      icon: Activity,
      text: "Remittance Reports",
      description: "GSIS, PhilHealth, Pag-IBIG",
      color: "green" as const,
    },
  ];

  const recentActivities = [
    {
      icon: CheckCircle,
      title: "Payroll approved",
      description: "March 1-15, 2026 payroll released for General Fund",
      time: "15 minutes ago",
      type: "success" as const,
    },
    {
      icon: UserPlus,
      title: "New employee onboarded",
      description: "Juan Dela Cruz — Administrative Aide IV",
      time: "1 hour ago",
      type: "info" as const,
    },
    {
      icon: AlertCircle,
      title: "Leave balance low",
      description: "3 employees with less than 5 days VL remaining",
      time: "3 hours ago",
      type: "warning" as const,
    },
  ];

  const activityColors = {
    success: "bg-green-50 text-green-500",
    info: "bg-blue-50 text-blue-500",
    warning: "bg-orange-50 text-orange-500",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-2">
            LGU Integrated Management System
          </h1>
          <p className="text-muted text-sm">
            Municipality of Carmen — HR & Payroll Overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-lg text-sm text-muted font-medium">
          <Calendar className="w-4 h-4 text-success" />
          <span>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = colorClasses[stat.color];

          return (
            <div
              key={index}
              className="relative bg-surface border border-border rounded-2xl p-6 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden group"
            >
              {/* Top gradient bar */}
              <div
                className={cn(
                  "absolute top-0 inset-x-0 h-1 bg-gradient-to-r",
                  colors.gradient,
                )}
              />

              <div className="flex items-start justify-between mb-5">
                <div
                  className={cn(
                    "flex items-center justify-center w-13 h-13 rounded-xl text-2xl",
                    colors.light,
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold",
                    stat.trendUp
                      ? "bg-green-50 text-green-600"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {stat.trendUp ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{stat.trend}</span>
                </div>
              </div>

              <div className="text-4xl font-extrabold text-primary tracking-tight mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted font-medium mb-4">
                {stat.label}
              </div>

              <div className="h-1.5 bg-background rounded-full overflow-hidden">
                <div className={cn("h-full w-2/3 rounded-full", colors.bar)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Quick Links */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary">
              <SettingsIcon className="w-5 h-5" />
              Quick Actions
            </h2>
            <span className="px-3 py-1 bg-background rounded-full text-xs font-semibold text-muted">
              {quickLinks.length} modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              const colors = colorClasses[link.color];

              return (
                <Link
                  key={index}
                  to={link.to}
                  className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-success hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-11 h-11 rounded-lg",
                      colors.light,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground truncate">
                      {link.text}
                    </span>
                    <span className="block text-xs text-muted truncate">
                      {link.description}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted group-hover:text-success group-hover:translate-x-1 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-primary">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
            <button className="text-sm font-medium text-success hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentActivities.map((activity, index) => {
              const Icon = activity.icon;

              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl"
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                      activityColors[activity.type],
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {activity.title}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {activity.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component Registry for dynamic routes
const componentRegistry: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  "modules/system-admin/pages/UserActivation": lazy(
    () => import("@/modules/system-admin/pages/UserActivation"),
  ),
  "modules/system-admin/pages/RoleManagement": lazy(
    () => import("@/modules/system-admin/pages/RoleManagement"),
  ),
  "modules/system-admin/pages/UserManagement": lazy(
    () => import("@/modules/system-admin/pages/UserManagement"),
  ),
  "modules/system-admin/pages/ModuleManagement": lazy(
    () => import("@/modules/system-admin/pages/ModuleManagement"),
  ),
  "modules/system-admin/pages/FacilitiesManagement": lazy(
    () => import("@/modules/system-admin/pages/FacilitiesManagement"),
  ),
};

const Dashboard = () => {
  const { userModules } = useRBAC();

  // Get dynamic routes from all modules
  const dynamicRoutes = userModules.map((module) => {
    const basePath = module.route_path.replace(/^\/dashboard/, "");
    const normalizedPath = module.file_path?.replace(/\\/g, "/") || "";

    // Check if this is a legacy RBAC module in the registry
    const isLegacyModule = normalizedPath in componentRegistry;

    return {
      path: basePath,
      type: isLegacyModule ? ("registry" as const) : ("dynamic" as const),
      filePath: module.file_path,
      registryKey: normalizedPath,
    };
  });

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/settings" element={<Settings />} />

        {/* Dynamic routes from database modules */}
        {dynamicRoutes.map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={
              route.type === "registry" ? (
                // Legacy module from registry
                <Suspense fallback={<LoadingFallback />}>
                  {(() => {
                    const Component = componentRegistry[route.registryKey];
                    return <Component />;
                  })()}
                </Suspense>
              ) : (
                // New dynamic module loaded from file path
                // Use filePath as key to force remount when route changes
                <DynamicComponentLoader
                  key={route.filePath}
                  filePath={route.filePath || ""}
                />
              )
            }
          />
        ))}
      </Routes>
    </Layout>
  );
};

export default Dashboard;
