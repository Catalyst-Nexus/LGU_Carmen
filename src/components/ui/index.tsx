import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

// Alert Component
type AlertVariant = "success" | "error" | "warning" | "info";

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

const alertStyles: Record<
  AlertVariant,
  { wrapper: string; icon: string; iconComponent: typeof CheckCircle }
> = {
  success: {
    wrapper: "bg-success/10 border-success/30 text-success",
    icon: "text-success",
    iconComponent: CheckCircle,
  },
  error: {
    wrapper: "bg-danger/10  border-danger/30  text-danger",
    icon: "text-danger",
    iconComponent: AlertCircle,
  },
  warning: {
    wrapper: "bg-warning/10 border-warning/30 text-warning",
    icon: "text-warning",
    iconComponent: AlertTriangle,
  },
  info: {
    wrapper: "bg-info/10    border-info/30    text-info",
    icon: "text-info",
    iconComponent: Info,
  },
};

export const Alert = ({
  variant = "success",
  title,
  message,
  onClose,
  className,
}: AlertProps) => {
  const styles = alertStyles[variant];
  const Icon = styles.iconComponent;
  return (
    <div
      role="alert"
      style={{ animation: "toast-in 0.25s ease-out forwards" }}
      className={cn(
        "fixed bottom-5 right-5 z-[9999] w-80 max-w-[calc(100vw-2.5rem)]",
        "flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-xl",
        styles.wrapper,
        className,
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", styles.icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className="font-semibold text-sm leading-none mb-0.5">{title}</p>
        )}
        <p className="text-xs leading-snug opacity-90">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

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
  rowsPerPage?: number;
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
  rowsPerPage = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 when data changes length (e.g. filter / search)
  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) setCurrentPage(safePage);

  const startIdx = (safePage - 1) * rowsPerPage;
  const pageData = data.slice(startIdx, startIdx + rowsPerPage);
  const emptyRows = rowsPerPage - pageData.length;

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
            {pageData.length === 0 && emptyRows === rowsPerPage ? (
              <>
                <tr>
                  <td
                    colSpan={columns.length}
                    className="text-center text-muted py-3 border-b border-border/50"
                  >
                    {emptyMessage}
                  </td>
                </tr>
                {/* Fill remaining rows so the table stays the same height */}
                {Array.from({ length: rowsPerPage - 1 }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-3 border-b border-border/50"
                    >
                      &nbsp;
                    </td>
                  </tr>
                ))}
              </>
            ) : (
              <>
                {pageData.map((item) => (
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
                ))}
                {/* Pad with empty rows to keep table height consistent */}
                {Array.from({ length: emptyRows }).map((_, i) => (
                  <tr key={`pad-${i}`}>
                    {columns.map((col) => (
                      <td
                        key={String(col.key)}
                        className={cn(
                          "px-4 py-3 border-b border-border/50",
                          col.className,
                        )}
                      >
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4 text-sm text-muted">
        <span>
          {data.length > 0
            ? `Showing ${startIdx + 1}–${Math.min(startIdx + rowsPerPage, data.length)} of ${data.length}`
            : `0 results`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const page = i + 1;
              // Show first, last, and pages near current
              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - safePage) <= 1
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "min-w-[32px] h-8 rounded text-sm font-medium transition-colors",
                      page === safePage
                        ? "bg-success text-white"
                        : "hover:bg-background",
                    )}
                  >
                    {page}
                  </button>
                );
              }
              // Ellipsis — only render once per gap
              if (page === 2 && safePage > 3) {
                return (
                  <span key="start-dots" className="px-1">
                    …
                  </span>
                );
              }
              if (page === totalPages - 1 && safePage < totalPages - 2) {
                return (
                  <span key="end-dots" className="px-1">
                    …
                  </span>
                );
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded hover:bg-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
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
