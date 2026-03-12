import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
} from "@/components/ui";
import { FileSpreadsheet, RefreshCw, Download } from "lucide-react";
import type { PayrollPeriod } from "@/types/hr.types";
import { fetchPayrollPeriods } from "@/services/hrService";

const PayrollRegister = () => {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchPayrollPeriods();
      setPeriods(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Register"
        subtitle="Summary of payroll periods and fund disbursements"
        icon={<FileSpreadsheet className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Periods" value={periods.length} />
        <StatCard
          label="Draft"
          value={periods.filter((p) => p.status === "draft").length}
          color="warning"
        />
        <StatCard
          label="Approved"
          value={periods.filter((p) => p.status === "approved").length}
          color="success"
        />
        <StatCard
          label="Released"
          value={periods.filter((p) => p.status === "released").length}
          color="primary"
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export Register
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollPeriod>
        data={periods.filter((p) =>
          p.period_name.toLowerCase().includes(search.toLowerCase()),
        )}
        columns={[
          { key: "period_name", header: "Period" },
          { key: "date_from", header: "From" },
          { key: "date_to", header: "To" },
          { key: "fiscal_year", header: "FY" },
          { key: "fund_type", header: "Fund Type" },
          {
            key: "total_amount",
            header: "Total Amount",
            render: (item) => (
              <span className="font-medium">
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
        ]}
        title="Payroll Periods"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by period name..."
        emptyMessage="No payroll periods found."
      />
    </div>
  );
};

export default PayrollRegister;
