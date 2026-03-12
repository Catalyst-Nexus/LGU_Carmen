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
import { Calculator, RefreshCw } from "lucide-react";
import type { PayrollEntry, DeductionType } from "@/types/hr.types";
import { fetchPaySlips, fetchDeductionTypes } from "@/services/hrService";

const PayrollComputation = () => {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [slips, types] = await Promise.all([
        fetchPaySlips(),
        fetchDeductionTypes(),
      ]);
      setEntries(slips);
      setDeductionTypes(types);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = entries.filter((e) => {
    const matchSearch = e.employee_name
      .toLowerCase()
      .includes(search.toLowerCase());
    if (activeTab === "all") return matchSearch;
    return matchSearch && e.status === activeTab;
  });

  const totals = useMemo(
    () => ({
      gross: entries.reduce((s, e) => s + e.gross_amount, 0),
      deductions: entries.reduce((s, e) => s + e.total_deductions, 0),
      net: entries.reduce((s, e) => s + e.net_amount, 0),
    }),
    [entries],
  );

  // Build mandatory deduction columns dynamically from hr.deduction_type
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter((dt) => dt.is_mandatory),
    [deductionTypes],
  );

  const getDeductionAmount = (entry: PayrollEntry, code: string): number => {
    const found = entry.deductions.find((d) => d.code === code);
    return found ? found.amount : 0;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll Computation"
        subtitle="Compute payroll per DBM salary standardization law"
        icon={<Calculator className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Entries" value={entries.length} />
        <StatCard
          label="Gross Pay"
          value={`₱${totals.gross.toLocaleString()}`}
          color="primary"
        />
        <StatCard
          label="Total Deductions"
          value={`₱${totals.deductions.toLocaleString()}`}
          color="danger"
        />
        <StatCard
          label="Net Pay"
          value={`₱${totals.net.toLocaleString()}`}
          color="success"
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
          <Calculator className="w-4 h-4" />
          Compute Payroll
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PayrollEntry>
        data={filtered}
        columns={[
          { key: "employee_name", header: "Employee" },
          { key: "period_start", header: "Period Start" },
          { key: "period_end", header: "Period End" },
          {
            key: "period_type",
            header: "Type",
            render: (item) => (
              <span className="capitalize">
                {item.period_type.replace("_", " ")}
              </span>
            ),
          },
          {
            key: "gross_amount",
            header: "Gross",
            render: (item) => (
              <span className="font-medium">
                ₱{item.gross_amount.toLocaleString()}
              </span>
            ),
          },
          // Dynamic mandatory deduction columns (GSIS, PhilHealth, Pag-IBIG, BIR, etc.)
          ...mandatoryTypes.map((dt) => ({
            key: `ded_${dt.code}` as keyof PayrollEntry,
            header: dt.code.replace(/_/g, " "),
            render: (item: PayrollEntry) => {
              const amt = getDeductionAmount(item, dt.code);
              return <span>{amt > 0 ? `₱${amt.toLocaleString()}` : "—"}</span>;
            },
          })),
          {
            key: "total_deductions",
            header: "Deductions",
            render: (item) => (
              <span className="text-red-500">
                ₱{item.total_deductions.toLocaleString()}
              </span>
            ),
          },
          {
            key: "net_amount",
            header: "Net Pay",
            render: (item) => (
              <span className="font-bold text-green-600">
                ₱{item.net_amount.toLocaleString()}
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
        title={`Payroll Entries (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No payroll entries found."
      />
    </div>
  );
};

export default PayrollComputation;
