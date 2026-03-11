import { useState, useEffect } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  DataTable,
  IconButton,
} from "@/components/ui";
import {
  FileText,
  Plus,
  RefreshCw,
  Download,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import type { PurchaseRequest as PR } from "@/types/gse.types";
import { fetchPurchaseRequests } from "@/services/gseService";
import PurchaseRequestDialog from "../components/PurchaseRequestDialog";

const PurchaseRequest = () => {
  const [purchaseRequests, setPurchaseRequests] = useState<PR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedPrId, setSelectedPrId] = useState<string | undefined>(
    undefined
  );

  // Statistics
  const stats = {
    total: purchaseRequests.length,
    draft: purchaseRequests.filter((pr) => pr.status === "DRAFT").length,
    submitted: purchaseRequests.filter((pr) => pr.status === "SUBMITTED")
      .length,
    approved: purchaseRequests.filter((pr) => pr.status === "APPROVED").length,
    rejected: purchaseRequests.filter((pr) => pr.status === "REJECTED").length,
  };

  // Load purchase requests
  const loadPurchaseRequests = async () => {
    setLoading(true);
    const data = await fetchPurchaseRequests();
    setPurchaseRequests(data);
    setLoading(false);
  };

  useEffect(() => {
    loadPurchaseRequests();
  }, []);

  // Filter by status
  const filteredRequests = purchaseRequests.filter((pr) => {
    if (selectedTab === "all") return true;
    return pr.status.toLowerCase() === selectedTab;
  });

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-100 text-gray-800", icon: Clock },
      SUBMITTED: { color: "bg-blue-100 text-blue-800", icon: FileText },
      APPROVED: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      REJECTED: { color: "bg-red-100 text-red-800", icon: XCircle },
      CANCELLED: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  // Table columns
  const columns: Array<{
    key: string;
    header: string;
    render?: (row: PR & { id: string }) => React.ReactNode;
  }> = [
    {
      key: "pr_no",
      header: "PR No.",
      render: (row: PR) => (
        <span className="font-medium text-primary">{row.pr_no}</span>
      ),
    },
    {
      key: "pr_date",
      header: "Date",
      render: (row: PR) =>
        new Date(row.pr_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "responsibility_center",
      header: "Requesting Office",
      render: (row: PR) => row.responsibility_center?.name || "N/A",
    },
    {
      key: "purpose",
      header: "Purpose",
      render: (row: PR) => (
        <span className="text-sm line-clamp-2" title={row.purpose}>
          {row.purpose}
        </span>
      ),
    },
    {
      key: "pr_total_amount",
      header: "Total Amount",
      render: (row: PR) => (
        <span className="font-medium">
          ₱{row.pr_total_amount.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row: PR) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: PR) => (
        <div className="flex items-center gap-1">
          <IconButton
            onClick={() => handleView(row.pr_id)}
            title="View"
          >
            <Eye className="w-4 h-4" />
          </IconButton>
          {row.status === "DRAFT" && (
            <>
              <IconButton
                onClick={() => handleEdit(row.pr_id)}
                title="Edit"
              >
                <Edit className="w-4 h-4" />
              </IconButton>
              <IconButton
                onClick={() => handleDelete(row.pr_id)}
                title="Delete"
                variant="danger"
              >
                <Trash2 className="w-4 h-4" />
              </IconButton>
            </>
          )}
        </div>
      ),
    },
  ];

  // Action handlers
  const handleNew = () => {
    setDialogMode("create");
    setSelectedPrId(undefined);
    setDialogOpen(true);
  };

  const handleView = (pr_id: string) => {
    console.log("View PR:", pr_id);
    // TODO: Open view dialog/page
  };

  const handleEdit = (pr_id: string) => {
    setDialogMode("edit");
    setSelectedPrId(pr_id);
    setDialogOpen(true);
  };

  const handleDelete = async (pr_id: string) => {
    if (confirm("Are you sure you want to delete this purchase request?")) {
      // TODO: Implement delete functionality
      console.log("Delete PR:", pr_id);
      await loadPurchaseRequests();
    }
  };

  const handleExport = () => {
    console.log("Export to Excel");
    // TODO: Implement export functionality
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Purchase Request"
        subtitle="Manage and track all purchase requests"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Requests" value={stats.total} color="primary" />
        <StatCard label="Draft" value={stats.draft} color="default" />
        <StatCard label="Submitted" value={stats.submitted} color="warning" />
        <StatCard label="Approved" value={stats.approved} color="success" />
        <StatCard label="Rejected" value={stats.rejected} color="danger" />
      </StatsRow>

      <ActionsBar>
        <div className="flex gap-2">
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Purchase Request
          </button>
          <button
            onClick={loadPurchaseRequests}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 active:scale-98 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 active:scale-98 transition-all"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </ActionsBar>

      {/* Tabs */}
      <div className="mb-4 flex gap-2 border-b border-border">
        {[
          { key: "all", label: "All" },
          { key: "draft", label: "Draft" },
          { key: "submitted", label: "Submitted" },
          { key: "approved", label: "Approved" },
          { key: "rejected", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              selectedTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns as any}
        data={filteredRequests.map((pr) => ({ ...pr, id: pr.pr_id }))}
        emptyMessage="No purchase requests found"
      />

      {/* Purchase Request Dialog */}
      <PurchaseRequestDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={loadPurchaseRequests}
        pr_id={selectedPrId}
        mode={dialogMode}
      />
    </div>
  );
};

export default PurchaseRequest;
