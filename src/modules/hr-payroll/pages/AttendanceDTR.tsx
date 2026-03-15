import { useState, useEffect, useCallback } from "react";
import {
  PageShell,
  Section,
  TabBar,
  GhostButton,
  Card,
  Badge,
  EmptyState,
  usePagination,
  Pagination,
  EmptyRows,
} from "../components/ui";
import { Download, Clock, Search } from "lucide-react";
import type { AttendanceRecord, TimeSlotSchedule } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { fetchTimeSlotSchedules } from "../services/hrService";

/* ── Types ────────────────────────────────────────────────────────── */

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

/* ── Data fetching ────────────────────────────────────────────────── */

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
      employee_name: per ? `${per.last_name}, ${per.first_name}` : "\u2014",
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

/* ── Helpers ──────────────────────────────────────────────────────── */

/** Format an ISO / timestamptz string to a readable time like "8:00 AM" */
function fmtTime(raw: string | null): string {
  if (!raw) return "\u2014";
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) {
      // If it's just a time string like "08:00:00", parse manually
      const [h, m] = raw.split(":");
      const hour = parseInt(h, 10);
      const minute = m ?? "00";
      const ampm = hour >= 12 ? "PM" : "AM";
      const h12 = hour % 12 || 12;
      return `${h12}:${minute} ${ampm}`;
    }
    return d.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return raw;
  }
}

/** Format a date string to "Mar 15, 2026" */
function fmtDate(raw: string): string {
  try {
    return new Date(raw).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return raw;
  }
}

/** Format decimal hours to "Xh Ym" */
function fmtHours(n: number | null | undefined): string {
  if (!n) return "\u2014";
  const hrs = Math.floor(n);
  const mins = Math.round((n - hrs) * 60);
  if (hrs === 0 && mins === 0) return "\u2014";
  if (mins === 0) return `${hrs}h`;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${mins}m`;
}

/* ── Tab definitions ──────────────────────────────────────────────── */

const PERIOD_TABS = [
  { id: "today", label: "Today" },
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
];

const VIEW_TABS = [
  { id: "records", label: "Records" },
  { id: "timeslots", label: "Time Slots" },
];

/* ── Component ────────────────────────────────────────────────────── */

const AttendanceDTR = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlotSchedule[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("today");
  const [activeView, setActiveView] = useState("records");
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

  const filtered = records.filter((r) =>
    r.employee_name.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);
  const { page: slotPage, setPage: setSlotPage, totalPages: slotTotalPages, pageItems: slotPageItems, emptyRows: slotEmptyRows, totalItems: slotTotalItems } = usePagination(timeSlots);

  return (
    <PageShell
      title="Attendance / DTR"
      subtitle="Daily Time Record tracking per CSC Memorandum Circular"
      onRefresh={loadRecords}
      isLoading={isLoading}
      actions={
        <GhostButton onClick={() => {}} disabled={false}>
          <Download className="w-3.5 h-3.5" />
          Export DTR
        </GhostButton>
      }
    >
      {/* ── Period + View tabs ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabBar
          tabs={PERIOD_TABS}
          active={activeTab}
          onChange={(id) => {
            setActiveTab(id);
            setSearch("");
          }}
        />
        <TabBar tabs={VIEW_TABS} active={activeView} onChange={setActiveView} />
      </div>

      {/* ── Attendance Records view ──────────────────────────────── */}
      {activeView === "records" && (
        <Section title="Attendance Records">
          {/* Search bar */}
          <div className="mb-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by employee name..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-colors"
            />
          </div>

          <Card>
            {filtered.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-10 h-10 mb-2 opacity-40" />}
                message="No attendance records found."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Time In
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Time Out
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Time Slot
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Total Hours
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider text-right">
                          Pay
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pageItems.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-accent/5 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                            {r.employee_name}
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {fmtDate(r.date)}
                          </td>
                          <td className="px-4 py-3 text-foreground tabular-nums whitespace-nowrap">
                            {fmtTime(r.in)}
                          </td>
                          <td className="px-4 py-3 text-foreground tabular-nums whitespace-nowrap">
                            {fmtTime(r.out)}
                          </td>
                          <td className="px-4 py-3 text-muted capitalize whitespace-nowrap">
                            {r.time_slot_desc?.replace(/_/g, " ") || "\u2014"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              label={r.time_identifier === 1 ? "IN" : "OUT"}
                              variant={
                                r.time_identifier === 1 ? "info" : "warning"
                              }
                            />
                          </td>
                          <td className="px-4 py-3 tabular-nums text-foreground whitespace-nowrap">
                            {fmtHours(r.total_hours)}
                          </td>
                          <td className="px-4 py-3 tabular-nums text-foreground text-right whitespace-nowrap">
                            {"\u20B1"}
                            {r.pay_amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <EmptyRows count={emptyRows} columns={8} />
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-border/50">
                  {pageItems.map((r) => (
                    <div key={r.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {r.employee_name}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {fmtDate(r.date)}
                          </p>
                        </div>
                        <Badge
                          label={r.time_identifier === 1 ? "IN" : "OUT"}
                          variant={r.time_identifier === 1 ? "info" : "warning"}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-xs text-accent font-medium">
                            Time In
                          </span>
                          <p className="text-foreground tabular-nums">
                            {fmtTime(r.in)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-accent font-medium">
                            Time Out
                          </span>
                          <p className="text-foreground tabular-nums">
                            {fmtTime(r.out)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-accent font-medium">
                            Total
                          </span>
                          <p className="text-foreground tabular-nums">
                            {fmtHours(r.total_hours)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-accent font-medium">
                            Pay
                          </span>
                          <p className="text-foreground tabular-nums">
                            {"\u20B1"}
                            {r.pay_amount.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {r.time_slot_desc && (
                        <p className="text-xs text-muted capitalize">
                          Slot: {r.time_slot_desc.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {filtered.length > 0 && (
              <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
            )}
          </Card>
        </Section>
      )}

      {/* ── Time Slot Schedule view ──────────────────────────────── */}
      {activeView === "timeslots" && (
        <Section title="Time Slot Schedule">
          <Card>
            {timeSlots.length === 0 ? (
              <EmptyState
                icon={<Clock className="w-10 h-10 mb-2 opacity-40" />}
                message="No time slot schedules found."
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left">
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Time Start
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Time End
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Actual Date
                        </th>
                        <th className="px-4 py-3 font-medium text-accent text-xs uppercase tracking-wider">
                          Midnight Crossing
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {slotPageItems.map((slot) => (
                        <tr
                          key={slot.id}
                          className="hover:bg-accent/5 transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground capitalize whitespace-nowrap">
                            {slot.description.replace(/_/g, " ")}
                          </td>
                          <td className="px-4 py-3 text-foreground tabular-nums whitespace-nowrap">
                            {fmtTime(slot.time_start)}
                          </td>
                          <td className="px-4 py-3 text-foreground tabular-nums whitespace-nowrap">
                            {fmtTime(slot.time_end)}
                          </td>
                          <td className="px-4 py-3 text-muted whitespace-nowrap">
                            {slot.actual_date === 1 ? "Same day" : "Next day"}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              label={slot.is_midnight_crossing ? "Yes" : "No"}
                              variant={
                                slot.is_midnight_crossing
                                  ? "warning"
                                  : "success"
                              }
                            />
                          </td>
                        </tr>
                      ))}
                      <EmptyRows count={slotEmptyRows} columns={5} />
                    </tbody>
                  </table>
                </div>

                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-border/50">
                  {slotPageItems.map((slot) => (
                    <div key={slot.id} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground text-sm capitalize">
                          {slot.description.replace(/_/g, " ")}
                        </p>
                        <Badge
                          label={slot.is_midnight_crossing ? "Yes" : "No"}
                          variant={
                            slot.is_midnight_crossing ? "warning" : "success"
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-xs text-accent font-medium">
                            Start
                          </span>
                          <p className="text-foreground tabular-nums">
                            {fmtTime(slot.time_start)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-accent font-medium">
                            End
                          </span>
                          <p className="text-foreground tabular-nums">
                            {fmtTime(slot.time_end)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-xs text-accent font-medium">
                            Actual Date
                          </span>
                          <p className="text-muted">
                            {slot.actual_date === 1 ? "Same day" : "Next day"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {timeSlots.length > 0 && (
              <Pagination page={slotPage} totalPages={slotTotalPages} totalItems={slotTotalItems} onPageChange={setSlotPage} />
            )}
          </Card>
        </Section>
      )}
    </PageShell>
  );
};

export default AttendanceDTR;
