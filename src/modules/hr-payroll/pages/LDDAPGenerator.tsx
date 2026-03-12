import { useState, useEffect, useCallback, useMemo } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
} from "@/components/ui";
import { FileText, RefreshCw, Printer } from "lucide-react";
import type { PayrollPeriod } from "@/types/hr.types";
import { fetchPayrollPeriods } from "@/services/hrService";

const LDDAPGenerator = () => {
  const [payrolls, setPayrolls] = useState<PayrollPeriod[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollPeriods();
      setPayrolls(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return payrolls.filter((p) => {
      const matchSearch =
        p.period_name.toLowerCase().includes(search.toLowerCase()) ||
        p.fund_type.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "all") return matchSearch;
      return matchSearch && p.status === activeTab;
    });
  }, [payrolls, search, activeTab]);

  const totals = useMemo(
    () => ({
      total: payrolls.reduce((s, p) => s + p.total_amount, 0),
      approved: payrolls
        .filter((p) => p.status === "approved" || p.status === "released")
        .reduce((s, p) => s + p.total_amount, 0),
    }),
    [payrolls],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="LDDAP-ADA Generator"
        subtitle="List of Due and Demandable Accounts Payable — Advice to Debit Account"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Payrolls" value={payrolls.length} />
        <StatCard
          label="Draft"
          value={payrolls.filter((p) => p.status === "draft").length}
          color="warning"
        />
        <StatCard
          label="Approved"
          value={payrolls.filter((p) => p.status === "approved").length}
          color="success"
        />
        <StatCard
          label="Approved Amount"
          value={`₱${totals.approved.toLocaleString()}`}
          color="primary"
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "draft", label: "Draft" },
          { id: "computed", label: "Computed" },
          { id: "approved", label: "Approved" },
          { id: "released", label: "Released" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Printer className="w-4 h-4" />
          Print LDDAP-ADA
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollPeriod>
        data={filtered}
        columns={[
          { key: "period_name", header: "Payroll Period" },
          { key: "date_from", header: "From" },
          { key: "date_to", header: "To" },
          { key: "fund_type", header: "Fund Type" },
          { key: "fiscal_year", header: "FY" },
          {
            key: "total_amount",
            header: "Total Amount",
            render: (item) => (
              <span className="font-bold">
                ₱{item.total_amount.toLocaleString()}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.status === "released"
                    ? "bg-success/10 text-success"
                    : item.status === "approved"
                      ? "bg-blue-500/10 text-blue-500"
                      : item.status === "computed"
                        ? "bg-purple-500/10 text-purple-500"
                        : "bg-warning/10 text-warning"
                }`}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            ),
          },
          {
            key: "date_prepared",
            header: "Prepared",
            render: (item) => (
              <span>
                {item.date_prepared
                  ? new Date(item.date_prepared).toLocaleDateString()
                  : "—"}
              </span>
            ),
          },
        ]}
        title="LDDAP-ADA Records"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by period name or fund type..."
        emptyMessage="No payroll records found."
      />
    </div>
  );
};

export default LDDAPGenerator;
