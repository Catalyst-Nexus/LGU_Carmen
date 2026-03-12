import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
} from "@/components/ui";
import { CalendarOff, Plus, RefreshCw, Check, X, Ban } from "lucide-react";
import type { LeaveApplication } from "@/types/hr.types";
import {
  createLeaveApplication,
  fetchLeaveApplications,
  updateLeaveApplication,
  fetchPersonnelIdByUserId,
} from "@/services/hrService";
import type { LeaveApplicationFormData } from "@/services/hrService";
import { useAuthStore } from "@/store/authStore";
import LeaveDialog from "../components/LeaveDialog";
import type { LeaveFormData } from "../components/LeaveDialog";

const LeaveManagement = () => {
  const user = useAuthStore((s) => s.user);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Leave applications and tracking per CSC rules"
        icon={<CalendarOff className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Applications" value={leaves.length} />
        <StatCard
          label="Pending"
          value={leaves.filter((l) => l.status === "pending").length}
          color="warning"
        />
        <StatCard
          label="Approved"
          value={leaves.filter((l) => l.status === "approved").length}
          color="success"
        />
        <StatCard
          label="Denied"
          value={leaves.filter((l) => l.status === "denied").length}
          color="danger"
        />
        <StatCard
          label="Cancelled"
          value={leaves.filter((l) => l.status === "cancelled").length}
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "pending", label: "Pending" },
          { id: "approved", label: "Approved" },
          { id: "denied", label: "Denied" },
          { id: "cancelled", label: "Cancelled" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={() => setShowFileDialog(true)}>
          <Plus className="w-4 h-4" />
          File Leave
        </PrimaryButton>
        <PrimaryButton onClick={loadLeaves}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<LeaveApplication>
        data={filtered}
        columns={[
          { key: "employee_name", header: "Employee" },
          {
            key: "leave_type",
            header: "Type",
            render: (item) => (
              <span title={item.leave_type_desc}>{item.leave_type}</span>
            ),
          },
          { key: "applied_date", header: "Date Filed" },
          {
            key: "credits",
            header: "No. of Days",
            render: (item) => <span>{item.credits}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "approved"
                    ? "bg-success/10 text-success"
                    : item.status === "pending"
                      ? "bg-warning/10 text-warning"
                      : item.status === "denied"
                        ? "bg-danger/10 text-danger"
                        : "bg-gray-500/10 text-gray-500"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
          {
            key: "approved_date",
            header: "Date of Action",
            render: (item) => <span>{item.approved_date ?? "—"}</span>,
          },
          {
            key: "approved_by_name",
            header: "Approved By",
            render: (item) => <span>{item.approved_by_name ?? "—"}</span>,
          },
          {
            key: "pay_amount",
            header: "Pay Amount",
            render: (item) => (
              <span>
                {item.pay_amount
                  ? new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(item.pay_amount)
                  : "—"}
              </span>
            ),
          },
          { key: "remarks", header: "Remarks" },
          {
            key: "id" as keyof LeaveApplication,
            header: "Actions",
            render: (item) =>
              item.status === "pending" ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStatusChange(item.id, "approved")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-success/10 text-success hover:bg-success/20 transition-colors"
                    title="Approve"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, "denied")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                    title="Deny"
                  >
                    <X className="w-3.5 h-3.5" />
                    Deny
                  </button>
                  <button
                    onClick={() => handleStatusChange(item.id, "cancelled")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition-colors"
                    title="Cancel"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
        ]}
        title={`Leave Applications (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No leave applications found."
      />

      <LeaveDialog
        open={showFileDialog}
        onClose={() => setShowFileDialog(false)}
        onSubmit={handleFileLeave}
        isLoading={isSaving}
      />
    </div>
  );
};

export default LeaveManagement;
