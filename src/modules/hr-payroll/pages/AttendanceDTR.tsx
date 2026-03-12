import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
} from "@/components/ui";
import { Clock, RefreshCw, Download } from "lucide-react";
import type { AttendanceRecord, TimeSlotSchedule } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { fetchTimeSlotSchedules } from "@/services/hrService";

interface TimeRecordRow {
  id: string;
  per_id: string;
  date: string;
  in: string | null;
  out: string | null;
  time_slot_id: string | null;
  time_identifier: number | null;
  total_hours: number | null;
  pay_amount: number;
  created_at: string;
  personnel:
    | { first_name: string; last_name: string }
    | { first_name: string; last_name: string }[]
    | null;
  time_slot_schedule:
    | { description: string }
    | { description: string }[]
    | null;
}

const fetchTimeRecords = async (): Promise<AttendanceRecord[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("time_record")
    .select(
      `
      id, per_id, date, in, out,
      time_slot_id, time_identifier, total_hours,
      pay_amount, created_at,
      personnel:per_id ( first_name, last_name ),
      time_slot_schedule:time_slot_id ( description )
    `,
    )
    .order("date", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Error fetching time records:", error);
    return [];
  }

  return ((data as unknown as TimeRecordRow[]) || []).map((row) => {
    const per = Array.isArray(row.personnel) ? row.personnel[0] : row.personnel;
    const slot = Array.isArray(row.time_slot_schedule)
      ? row.time_slot_schedule[0]
      : row.time_slot_schedule;
    return {
      id: row.id,
      employee_id: row.per_id,
      employee_name: per ? `${per.last_name}, ${per.first_name}` : "—",
      date: row.date,
      in: row.in,
      out: row.out,
      time_slot_id: row.time_slot_id,
      time_slot_desc: slot?.description ?? null,
      time_identifier: (row.time_identifier ?? 1) as 1 | 2,
      total_hours: row.total_hours ?? 0,
      pay_amount: row.pay_amount,
      created_at: row.created_at,
    };
  });
};

const AttendanceDTR = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotSchedule[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [isLoading, setIsLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    const [data, slots] = await Promise.all([
      fetchTimeRecords(),
      fetchTimeSlotSchedules(),
    ]);
    setRecords(data);
    setTimeSlots(slots);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance / DTR"
        subtitle="Daily Time Record tracking per CSC Memorandum Circular"
        icon={<Clock className="w-6 h-6" />}
      />

      <Tabs
        tabs={[
          { id: "today", label: "Today" },
          { id: "weekly", label: "This Week" },
          { id: "monthly", label: "This Month" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={loadRecords} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export DTR
        </PrimaryButton>
      </ActionsBar>

      <DataTable<AttendanceRecord>
        data={records.filter((r) =>
          r.employee_name.toLowerCase().includes(search.toLowerCase()),
        )}
        columns={[
          { key: "employee_name", header: "Employee" },
          { key: "date", header: "Date" },
          {
            key: "in" as keyof AttendanceRecord,
            header: "In",
            render: (item) => <span>{item.in || "\u2014"}</span>,
          },
          {
            key: "out" as keyof AttendanceRecord,
            header: "Out",
            render: (item) => <span>{item.out || "\u2014"}</span>,
          },
          {
            key: "time_slot_desc",
            header: "Time Slot",
            render: (item) => (
              <span className="capitalize">
                {item.time_slot_desc?.replace(/_/g, " ") || "—"}
              </span>
            ),
          },
          {
            key: "time_identifier",
            header: "Type",
            render: (item) => (
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                  item.time_identifier === 1
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-orange-500/10 text-orange-600"
                }`}
              >
                {item.time_identifier === 1 ? "IN" : "OUT"}
              </span>
            ),
          },
          {
            key: "total_hours",
            header: "Total Hours",
            render: (item) => {
              if (!item.total_hours) return <span>—</span>;
              const hrs = Math.floor(item.total_hours);
              const mins = Math.round((item.total_hours - hrs) * 60);
              return (
                <span>
                  {hrs}h{mins > 0 ? ` ${mins}m` : ""}
                </span>
              );
            },
          },
          {
            key: "pay_amount",
            header: "Pay",
            render: (item) => <span>₱{item.pay_amount.toFixed(2)}</span>,
          },
        ]}
        title="Attendance Records"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by employee name..."
        emptyMessage="No attendance records found."
      />

      {/* Time Slot Schedule Reference Table */}
      <div className="bg-surface rounded-lg border border-border p-4">
        <h3 className="text-lg font-semibold mb-3">Time Slot Schedule</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Description</th>
                <th className="pb-2 pr-4 font-medium">Time Range</th>
                <th className="pb-2 pr-4 font-medium">Actual Date</th>
                <th className="pb-2 font-medium">Midnight Crossing</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id} className="border-b border-border/50">
                  <td className="py-2 pr-4 capitalize">
                    {slot.description.replace(/_/g, " ")}
                  </td>
                  <td className="py-2 pr-4">
                    {slot.time_start} – {slot.time_end}
                  </td>
                  <td className="py-2 pr-4">
                    {slot.actual_date === 1 ? "Same day" : "Next day"}
                  </td>
                  <td className="py-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                        slot.is_midnight_crossing
                          ? "bg-amber-500/10 text-amber-600"
                          : "bg-green-500/10 text-green-600"
                      }`}
                    >
                      {slot.is_midnight_crossing ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
              {timeSlots.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-muted">
                    No time slot schedules found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDTR;
