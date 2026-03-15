import { useState, useEffect, useCallback } from "react";
import {
  PageShell,
  Section,
  StatCard,
  AccentButton,
  GhostButton,
  TabBar,
  LeaveBadge,
  Card,
  fmtPeso,
  EmptyState,
  usePagination,
  Pagination,
  EmptyRows,
} from "../components/ui";
import {
  CalendarOff,
  Plus,
  CalendarDays,
  Check,
  X,
  Ban,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileX2,
} from "lucide-react";
import type { LeaveApplication } from "@/types/hr.types";
import {
  createLeaveApplication,
  fetchLeaveApplications,
  updateLeaveApplication,
  clearLeaveOutDates,
  fetchPersonnelIdByUserId,
} from "../services/hrService";
import type { LeaveApplicationFormData } from "../services/hrService";
import { useAuthStore } from "@/store/authStore";
import LeaveDialog from "../components/LeaveDialog";
import type { LeaveFormData } from "../components/LeaveDialog";
import HolidayManagerDialog from "../components/HolidayManagerDialog";

const LeaveManagement = () => {
  const user = useAuthStore((s) => s.user);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = useState(false);

  const loadLeaves = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchLeaveApplications();
    setLeaves(data as LeaveApplication[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLeaves();
  }, [loadLeaves]);

  const handleFileLeave = async (data: LeaveFormData) => {
    setIsSaving(true);
    const payload: LeaveApplicationFormData = {
      per_id: data.per_id,
      los_id: data.los_id,
      applied_date: data.applied_date,
      credits: data.credits,
      pay_amount: data.pay_amount,
      remarks: data.remarks,
      status: data.status,
      leave_dates: data.leave_dates,
      plc_id: data.plc_id,
      details: data.details ?? null,
      credit_balance_before: data.credit_balance_before ?? null,
    };
    const result = await createLeaveApplication(payload);
    setIsSaving(false);
    if (result.success) {
      setShowFileDialog(false);
      loadLeaves();
    } else {
      alert(result.error || "Failed to file leave application");
    }
  };

  const handleStatusChange = async (
    id: string,
    status: "approved" | "denied" | "cancelled",
  ) => {
    const updatePayload: Partial<LeaveApplicationFormData> = { status };

    if (status === "approved" && user) {
      updatePayload.approved_date = new Date().toISOString().split("T")[0];
      const personnelId = await fetchPersonnelIdByUserId(user.id);
      if (personnelId) updatePayload.approved_by = personnelId;
    }

    // Restore leave credits: delete the dated rows so trg_restore_leave_credit fires
    if (status === "denied" || status === "cancelled") {
      await clearLeaveOutDates(id);
    }

    const result = await updateLeaveApplication(id, updatePayload);
    if (result.success) {
      loadLeaves();
    } else {
      const action =
        status === "approved"
          ? "approve"
          : status === "denied"
            ? "deny"
            : "cancel";
      alert(result.error || `Failed to ${action} leave`);
    }
  };

  const filtered = leaves.filter((l) => {
    const matchSearch = l.employee_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    return matchSearch && l.status === activeTab;
  });

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);

  const pendingCount = leaves.filter((l) => l.status === "pending").length;
  const approvedCount = leaves.filter((l) => l.status === "approved").length;
  const deniedCount = leaves.filter((l) => l.status === "denied").length;
  const cancelledCount = leaves.filter((l) => l.status === "cancelled").length;

  /* ── CSC Form 6 detail line ──────────────────────────────────────── */
  const renderDetails = (item: LeaveApplication) => {
    if (!item.details) return null;
    return (
      <div className="text-xs text-muted mt-0.5">
        {item.leave_type === "VL" &&
          typeof item.details.place_visited === "string" && (
            <span>{item.details.place_visited}</span>
          )}
        {item.leave_type === "SL" &&
          typeof item.details.illness === "string" && (
            <span>
              {item.details.illness}
              {item.details.hospitalized ? " (Hosp.)" : ""}
            </span>
          )}
      </div>
    );
  };

  /* ── Action buttons for pending rows ─────────────────────────────── */
  const renderActions = (item: LeaveApplication) => {
    if (item.status !== "pending")
      return <span className="text-xs text-muted">&mdash;</span>;

    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => handleStatusChange(item.id, "approved")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          title="Approve"
        >
          <Check className="w-3.5 h-3.5" />
          Approve
        </button>
        <button
          onClick={() => handleStatusChange(item.id, "denied")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          title="Deny"
        >
          <X className="w-3.5 h-3.5" />
          Deny
        </button>
        <button
          onClick={() => handleStatusChange(item.id, "cancelled")}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          title="Cancel"
        >
          <Ban className="w-3.5 h-3.5" />
          Cancel
        </button>
      </div>
    );
  };

  return (
    <PageShell
      title="Leave Management"
      subtitle="Leave applications and tracking per CSC rules"
      onRefresh={loadLeaves}
      isLoading={isLoading}
      actions={
        <>
          <AccentButton onClick={() => setShowFileDialog(true)}>
            <Plus className="w-4 h-4" />
            File Leave
          </AccentButton>
          <GhostButton onClick={() => setShowHolidayDialog(true)}>
            <CalendarDays className="w-4 h-4" />
            Manage Holidays
          </GhostButton>
        </>
      }
    >
      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total Applications"
            value={leaves.length}
            icon={<CalendarOff className="w-5 h-5" />}
          />
          <StatCard
            label="Pending"
            value={pendingCount}
            icon={<Clock className="w-5 h-5" />}
            accent="text-amber-500"
          />
          <StatCard
            label="Approved"
            value={approvedCount}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accent="text-accent"
          />
          <StatCard
            label="Denied"
            value={deniedCount}
            icon={<XCircle className="w-5 h-5" />}
            accent="text-red-500"
          />
          <StatCard
            label="Cancelled"
            value={cancelledCount}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </div>
      </Section>

      {/* ── Tabs + Search ──────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabBar
          tabs={[
            { id: "all", label: "All", count: leaves.length },
            { id: "pending", label: "Pending", count: pendingCount },
            { id: "approved", label: "Approved", count: approvedCount },
            { id: "denied", label: "Denied", count: deniedCount },
            { id: "cancelled", label: "Cancelled", count: cancelledCount },
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name..."
            className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* ── Data ───────────────────────────────────────────────────────── */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileX2 className="w-10 h-10 mb-2 opacity-40" />}
            message="No leave applications found."
          />
        ) : (
          <>
            {/* ── Desktop Table ───────────────────────────────────────── */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted">
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Date Filed</th>
                    <th className="px-4 py-3 text-right">Days</th>
                    <th className="px-4 py-3 text-right">Bal. Before</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Date of Action</th>
                    <th className="px-4 py-3">Approved By</th>
                    <th className="px-4 py-3 text-right">Pay Amount</th>
                    <th className="px-4 py-3">Remarks</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-accent/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {item.employee_name}
                      </td>
                      <td className="px-4 py-3">
                        <span title={item.leave_type_desc}>
                          {item.leave_type}
                        </span>
                        {renderDetails(item)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.applied_date}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.credits}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {item.credit_balance_before != null
                          ? item.credit_balance_before.toFixed(3)
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3">
                        <LeaveBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.approved_date ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.approved_by_name ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap">
                        {item.pay_amount ? fmtPeso(item.pay_amount) : "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-muted max-w-[180px] truncate">
                        {item.remarks || "\u2014"}
                      </td>
                      <td className="px-4 py-3">{renderActions(item)}</td>
                    </tr>
                  ))}
                  <EmptyRows count={emptyRows} columns={11} />
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ────────────────────────────────────── */}
            <div className="lg:hidden divide-y divide-border">
              {pageItems.map((item) => (
                <div key={item.id} className="p-4 space-y-2">
                  {/* Name + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {item.employee_name}
                      </p>
                      <p className="text-xs text-muted">
                        <span title={item.leave_type_desc}>
                          {item.leave_type}
                        </span>
                        {" \u00b7 "}
                        {item.applied_date}
                      </p>
                      {renderDetails(item)}
                    </div>
                    <LeaveBadge status={item.status} />
                  </div>

                  {/* Key-value pairs */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div>
                      <span className="text-muted">Days:</span>{" "}
                      <span className="tabular-nums font-medium">
                        {item.credits}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Bal. Before:</span>{" "}
                      <span className="tabular-nums font-medium">
                        {item.credit_balance_before != null
                          ? item.credit_balance_before.toFixed(3)
                          : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Pay:</span>{" "}
                      <span className="tabular-nums font-medium">
                        {item.pay_amount ? fmtPeso(item.pay_amount) : "\u2014"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted">Action Date:</span>{" "}
                      <span className="font-medium">
                        {item.approved_date ?? "\u2014"}
                      </span>
                    </div>
                    {item.approved_by_name && (
                      <div className="col-span-2">
                        <span className="text-muted">Approved By:</span>{" "}
                        <span className="font-medium">
                          {item.approved_by_name}
                        </span>
                      </div>
                    )}
                    {item.remarks && (
                      <div className="col-span-2">
                        <span className="text-muted">Remarks:</span>{" "}
                        <span className="font-medium">{item.remarks}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {item.status === "pending" && (
                    <div className="pt-1">{renderActions(item)}</div>
                  )}
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* ── Dialogs (unchanged) ────────────────────────────────────────── */}
      <LeaveDialog
        open={showFileDialog}
        onClose={() => setShowFileDialog(false)}
        onSubmit={handleFileLeave}
        isLoading={isSaving}
      />

      <HolidayManagerDialog
        open={showHolidayDialog}
        onClose={() => setShowHolidayDialog(false)}
      />
    </PageShell>
  );
};

export default LeaveManagement;
