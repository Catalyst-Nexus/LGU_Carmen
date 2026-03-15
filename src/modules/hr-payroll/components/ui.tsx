/**
 * Shared HR Module UI Components
 *
 * Reusable building blocks for all HR & Payroll pages.
 * Uses the `accent` CSS variable (#7a1a1a light / #d05050 dark).
 */

import { useState, useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, Inbox, ChevronLeft, ChevronRight } from "lucide-react";

/* ── Table Pagination ─────────────────────────────────────────────── */

const ROWS_PER_PAGE = 10;

export function usePagination<T>(items: T[], perPage = ROWS_PER_PAGE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safePage = Math.min(page, totalPages);

  // Reset to page 1 when total items count changes
  useEffect(() => {
    setPage(1);
  }, [items.length]);

  const start = (safePage - 1) * perPage;
  const pageItems = items.slice(start, start + perPage);
  const emptyRows = perPage - pageItems.length;

  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    emptyRows,
    totalItems: items.length,
  };
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  perPage = ROWS_PER_PAGE,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage?: number;
  onPageChange: (p: number) => void;
}) {
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-muted">
      <span>
        {totalItems > 0
          ? `Showing ${start}\u2013${end} of ${totalItems}`
          : "No records"}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1 rounded border border-border enabled:hover:bg-muted/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="tabular-nums text-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1 rounded border border-border enabled:hover:bg-muted/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function EmptyRows({
  count,
  columns,
}: {
  count: number;
  columns: number;
}) {
  if (count <= 0) return null;
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <tr key={`empty-${i}`} className="border-b border-border last:border-0">
          <td colSpan={columns} className="px-3 py-2.5">
            &nbsp;
          </td>
        </tr>
      ))}
    </>
  );
}

/* ── Page Shell ────────────────────────────────────────────────────── */

interface PageShellProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  onRefresh,
  isLoading,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {actions}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted hover:text-accent border border-border rounded-lg hover:border-accent/30 transition-colors"
            >
              <RefreshCw
                className={cn("w-3.5 h-3.5", isLoading && "animate-spin")}
              />
              Refresh
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ── Section ───────────────────────────────────────────────────────── */

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <section className={className}>
      {title && (
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted mb-3">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/* ── Card ──────────────────────────────────────────────────────────── */

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn("bg-surface border border-border rounded-xl", className)}
    >
      {children}
    </div>
  );
}

/* ── Stat Card ─────────────────────────────────────────────────────── */

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  accent?: string;
}

export function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4 flex items-start gap-3">
      {icon && <span className={cn("mt-0.5 text-accent", accent)}>{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-muted leading-tight">{label}</p>
        <p
          className={cn(
            "text-xl font-bold tabular-nums text-foreground mt-0.5",
            accent,
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ── Accent Button ─────────────────────────────────────────────────── */

interface AccentButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline" | "ghost";
  className?: string;
}

export function AccentButton({
  children,
  onClick,
  disabled,
  variant = "solid",
  className,
}: AccentButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "solid" && "bg-accent text-white hover:bg-accent-light",
        variant === "outline" &&
          "border border-accent text-accent hover:bg-accent/10",
        variant === "ghost" && "text-accent hover:bg-accent/10",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Ghost Button ──────────────────────────────────────────────────── */

interface GhostButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className,
}: GhostButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted border border-border rounded-lg hover:text-foreground hover:border-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Filter Select ─────────────────────────────────────────────────── */

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  className?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className,
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "text-sm border border-border rounded-lg px-3 py-2 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors",
        className,
      )}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ── Tab Bar ───────────────────────────────────────────────────────── */

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, active, onChange, className }: TabBarProps) {
  return (
    <div className={cn("flex gap-1 p-1 bg-background rounded-lg", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            active === tab.id
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1.5 text-xs text-muted">({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Badge ─────────────────────────────────────────────────────────── */

type BadgeVariant =
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted"
  | "blue"
  | "violet";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  accent: "bg-accent/10 text-accent",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  muted: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  violet:
    "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant = "muted", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2.5 py-0.5 rounded-full text-xs font-medium",
        BADGE_STYLES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}

/* ── Status Badge (payroll flow) ───────────────────────────────────── */

const PAYROLL_STATUS_MAP: Record<string, BadgeVariant> = {
  draft: "warning",
  computed: "violet",
  approved: "blue",
  released: "success",
};

const LEAVE_STATUS_MAP: Record<string, BadgeVariant> = {
  pending: "warning",
  approved: "success",
  denied: "danger",
  cancelled: "muted",
};

const EMPLOYMENT_STATUS_MAP: Record<string, BadgeVariant> = {
  permanent: "accent",
  casual: "warning",
  coterminous: "info",
  contractual: "violet",
  job_order: "warning",
};

export function PayrollBadge({ status }: { status: string }) {
  return (
    <Badge
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={PAYROLL_STATUS_MAP[status] || "muted"}
    />
  );
}

export function LeaveBadge({ status }: { status: string }) {
  return (
    <Badge
      label={status.charAt(0).toUpperCase() + status.slice(1)}
      variant={LEAVE_STATUS_MAP[status] || "muted"}
    />
  );
}

export function EmploymentBadge({ status }: { status: string }) {
  return (
    <Badge
      label={status.replace(/_/g, " ").toUpperCase()}
      variant={EMPLOYMENT_STATUS_MAP[status] || "muted"}
    />
  );
}

export function ActiveBadge({
  isActive,
  separationDate,
}: {
  isActive: boolean;
  separationDate?: string | null;
}) {
  const label = isActive ? "Active" : separationDate ? "Separated" : "Inactive";
  const variant: BadgeVariant = isActive
    ? "success"
    : separationDate
      ? "danger"
      : "muted";
  return <Badge label={label} variant={variant} />;
}

/* ── Empty State ───────────────────────────────────────────────────── */

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted">
      {icon || <Inbox className="w-10 h-10 mb-2 opacity-40" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ── Dropdown Menu (three-dot) ─────────────────────────────────────── */

interface MenuItemProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warning";
}

export function DropdownMenu({ items }: { items: MenuItemProps[] }) {
  const variantClasses: Record<string, string> = {
    default: "hover:bg-muted/20",
    danger: "text-danger hover:bg-danger/10",
    success: "text-emerald-600 hover:bg-emerald-500/10",
    warning: "text-amber-600 hover:bg-amber-500/10",
  };

  return (
    <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] bg-surface border border-border rounded-lg shadow-lg py-1 text-sm">
      {items.map((item, i) => (
        <button
          key={i}
          onClick={item.onClick}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 text-left transition-colors",
            variantClasses[item.variant || "default"],
          )}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ── Peso formatter ────────────────────────────────────────────────── */

export const fmtPeso = (n: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(n);

/* ── Confirm Modal ─────────────────────────────────────────────────── */

interface ConfirmModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "accent";
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_STYLES: Record<string, string> = {
  danger: "bg-danger text-white hover:bg-danger/90",
  warning: "bg-warning text-white hover:bg-warning/90",
  accent: "bg-accent text-white hover:bg-accent-light",
};

export function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <div className="text-sm text-muted">{children}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/20 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-60",
              CONFIRM_STYLES[confirmVariant],
            )}
          >
            {isLoading ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
