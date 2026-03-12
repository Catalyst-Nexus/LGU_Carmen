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
import { Send, RefreshCw, Download } from "lucide-react";
import type { DeductionType } from "@/types/hr.types";
import {
  fetchDeductionTypes,
  fetchRemittanceSummary,
} from "@/services/hrService";

interface RemittanceRow {
  id: string;
  code: string;
  description: string;
  employee_name: string;
  period: string;
  amount: number;
  pay_slip_status: string;
}

const RemittanceReports = () => {
  const [rows, setRows] = useState<RemittanceRow[]>([]);
  const [deductionTypes, setDeductionTypes] = useState<DeductionType[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rawData, types] = await Promise.all([
        fetchRemittanceSummary(),
        fetchDeductionTypes(),
      ]);
      setDeductionTypes(types);

      // Transform raw join data into flat rows
      const mapped: RemittanceRow[] = (rawData || []).map(
        (r: Record<string, unknown>) => {
          const dt = r.deduction_type as
            | Record<string, string>
            | Record<string, string>[]
            | null;
          const dtObj = Array.isArray(dt) ? dt[0] : dt;
          const ps = r.pay_slip as
            | Record<string, unknown>
            | Record<string, unknown>[]
            | null;
          const psObj = Array.isArray(ps) ? ps[0] : ps;
          const per = psObj?.personnel as
            | Record<string, string>
            | Record<string, string>[]
            | null;
          const perObj = Array.isArray(per) ? per[0] : per;
          const periodStart = (psObj?.period_start ?? "") as string;
          const periodEnd = (psObj?.period_end ?? "") as string;
          return {
            id: r.id as string,
            code: dtObj?.code ?? "—",
            description: dtObj?.description ?? "—",
            employee_name: perObj
              ? `${perObj.last_name}, ${perObj.first_name}`
              : "—",
            period:
              periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "—",
            amount: Number(r.amount) || 0,
            pay_slip_status: (psObj?.status as string) ?? "—",
          };
        },
      );
      setRows(mapped);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Group tabs by mandatory deduction types (GSIS, PhilHealth, etc.)
  const mandatoryTypes = useMemo(
    () => deductionTypes.filter((dt) => dt.is_mandatory),
    [deductionTypes],
  );

  const tabList = useMemo(
    () => [
      { id: "all", label: "All" },
      ...mandatoryTypes.map((dt) => ({ id: dt.code, label: dt.description })),
    ],
    [mandatoryTypes],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchSearch =
        r.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      if (activeTab === "all") return matchSearch;
      return matchSearch && r.code === activeTab;
    });
  }, [rows, search, activeTab]);

  // Compute totals per mandatory type for stat cards
  const statTotals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      map[r.code] = (map[r.code] || 0) + r.amount;
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remittance Reports"
        subtitle="Government mandatory remittances — GSIS, PhilHealth, Pag-IBIG, BIR"
        icon={<Send className="w-6 h-6" />}
      />

      <StatsRow>
        {mandatoryTypes.slice(0, 4).map((dt) => (
          <StatCard
            key={dt.code}
            label={dt.description}
            value={`₱${(statTotals[dt.code] || 0).toLocaleString()}`}
          />
        ))}
      </StatsRow>

      <Tabs tabs={tabList} activeTab={activeTab} onTabChange={setActiveTab} />

      <ActionsBar>
        <PrimaryButton onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<RemittanceRow>
        data={filtered}
        columns={[
          { key: "code", header: "Type" },
          { key: "description", header: "Description" },
          { key: "employee_name", header: "Employee" },
          { key: "period", header: "Period" },
          {
            key: "amount",
            header: "Amount",
            render: (item) => (
              <span className="font-bold">₱{item.amount.toLocaleString()}</span>
            ),
          },
          {
            key: "pay_slip_status",
            header: "Slip Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.pay_slip_status === "released"
                    ? "bg-success/10 text-success"
                    : item.pay_slip_status === "approved"
                      ? "bg-blue-500/10 text-blue-500"
                      : item.pay_slip_status === "computed"
                        ? "bg-purple-500/10 text-purple-500"
                        : "bg-warning/10 text-warning"
                }`}
              >
                {item.pay_slip_status.charAt(0).toUpperCase() +
                  item.pay_slip_status.slice(1)}
              </span>
            ),
          },
        ]}
        title={`Remittances (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by type or employee..."
        emptyMessage="No remittance records found."
      />
    </div>
  );
};

export default RemittanceReports;
