import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

// Stat Card Component
interface StatCardProps {
  label: string;
  value: number | string;
  color?: "default" | "success" | "warning" | "danger" | "primary";
}

const colorStyles: Record<string, string> = {
  default: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  primary: "text-blue-600",
};

const borderStyles: Record<string, string> = {
  default: "from-green-500 to-green-400",
  success: "from-green-500 to-green-400",
  warning: "from-orange-500 to-orange-400",
  danger: "from-red-500 to-red-400",
  primary: "from-blue-500 to-blue-400",
};

export const StatCard = ({
  label,
  value,
  color = "default",
}: StatCardProps) => (
  <div className="relative flex-1 min-w-0 bg-surface border border-border rounded-xl p-5 overflow-hidden">
    {/* Animated border */}
    <span
      className={cn(
        "absolute inset-0 rounded-xl pointer-events-none",
        "bg-gradient-to-r opacity-20",
        borderStyles[color],
      )}
      style={{
        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        maskComposite: "exclude",
        padding: "1px",
      }}
    />
    <span className="block text-xs font-medium uppercase tracking-wider text-muted mb-1">
      {label}
    </span>
    <span className={cn("block text-2xl font-bold", colorStyles[color])}>
      {value}
    </span>
  </div>
);

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
}

export const PageHeader = ({ title, subtitle, icon }: PageHeaderProps) => (
  <div className="mb-6">
    <h1 className="flex items-center gap-2.5 text-2xl font-bold text-primary">
      {icon && <span className="text-success">{icon}</span>}
      {title}
    </h1>
    <p className="text-sm text-muted mt-1">{subtitle}</p>
  </div>
);

// Stats Row Component
interface StatsRowProps {
  children: ReactNode;
}

export const StatsRow = ({ children }: StatsRowProps) => (
  <div className="flex gap-5 mb-6">{children}</div>
);

// Actions Bar Component
interface ActionsBarProps {
  children: ReactNode;
}

export const ActionsBar = ({ children }: ActionsBarProps) => (
  <div className="flex justify-end mb-4">{children}</div>
);

// Primary Button Component
interface PrimaryButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

export const PrimaryButton = ({
  onClick,
  children,
  disabled = false,
}: PrimaryButtonProps) => (
  <button
    className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// Data Table Component
interface Column<T> {
  key: keyof T | "actions";
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  title?: string;
  titleIcon?: ReactNode;
  keyField?: keyof T;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  emptyMessage = "No data found.",
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  title,
  titleIcon,
}: DataTableProps<T>) {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6">
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {titleIcon && <span className="text-success">{titleIcon}</span>}
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
      )}

      {/* Search */}
      {onSearchChange && (
        <div className="relative w-64 mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "bg-background text-muted font-semibold text-left px-4 py-3 border-b border-border",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center text-muted py-8"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-background transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "px-4 py-3 border-b border-border/50",
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(item)
                        : col.key !== "actions"
                          ? String(item[col.key as keyof T])
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "danger" | "default" | "primary";
}

const badgeColors: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  primary: "bg-blue-50 text-blue-600",
  default: "bg-muted/10 text-muted",
};

export const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  const colorKey = variant || status.toLowerCase();
  const color = badgeColors[colorKey] || badgeColors.default;
  return (
    <span
      className={cn(
        "inline-block px-3 py-1 text-xs font-medium rounded-full",
        color,
      )}
    >
      {status}
    </span>
  );
};

// Icon Button Component
interface IconButtonProps {
  onClick: () => void;
  title: string;
  children: ReactNode;
  variant?: "default" | "success" | "danger";
}

export const IconButton = ({
  onClick,
  title,
  children,
  variant = "default",
}: IconButtonProps) => (
  <button
    className={cn(
      "p-1.5 rounded transition-colors",
      variant === "danger"
        ? "text-muted hover:text-danger hover:bg-danger/10"
        : variant === "success"
          ? "text-success hover:text-success hover:bg-success/10"
          : "text-muted hover:text-success hover:bg-success/10",
    )}
    onClick={onClick}
    title={title}
  >
    {children}
  </button>
);

// Tab Component
interface Tab {
  key?: string;
  id?: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => (
  <div className="flex gap-1 p-1 bg-background rounded-lg mb-4">
    {tabs.map((tab) => {
      const tabKey = tab.key || tab.id || tab.label;
      return (
        <button
          key={tabKey}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            activeTab === tabKey
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
          onClick={() => onTabChange(tabKey)}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

// Placeholder Card Component
interface PlaceholderCardProps {
  children: ReactNode;
}

export const PlaceholderCard = ({ children }: PlaceholderCardProps) => (
  <div className="flex items-center justify-center p-12 bg-surface border border-border rounded-xl text-muted">
    {children}
  </div>
);
