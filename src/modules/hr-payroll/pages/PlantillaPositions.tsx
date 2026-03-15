import { useState, useEffect, useCallback, useRef } from "react";
import {
  PageShell,
  StatCard,
  AccentButton,
  Badge,
  Card,
  ConfirmModal,
  DropdownMenu,
  EmptyState,
  fmtPeso,
  usePagination,
  Pagination,
  EmptyRows,
} from "../components/ui";
import {
  LayoutList,
  Plus,
  Pencil,
  UserPlus,
  UserMinus,
  Trash2,
  MoreHorizontal,
  Search,
  Users,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import type { PlantillaPosition } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  createPosition,
  updatePosition,
  deletePosition,
  unassignEmployeeFromPosition,
} from "../services/hrService";
import type { PlantillaPositionFormData } from "../services/hrService";
import PositionDialog from "../components/PositionDialog";
import type { PositionFormData } from "../components/PositionDialog";
import AssignEmployeeDialog from "../components/AssignEmployeeDialog";

/* ── Types ────────────────────────────────────────────────────────── */

interface PositionRow {
  id: string;
  item_no: string;
  description: string;
  authorization: string | null;
  funding_source: string | null;
  is_filled: boolean;
  is_active: boolean;
  created_at: string;
  sr_id: string;
  pt_id: string | null;
  office:
    | { id: string; description: string }[]
    | { id: string; description: string }
    | null;
  salary_rate:
    | {
        description: string;
        rate:
          | { sg_number: number | null; step: number | null; amount: number }
          | { sg_number: number | null; step: number | null; amount: number }[]
          | null;
      }[]
    | {
        description: string;
        rate:
          | { sg_number: number | null; step: number | null; amount: number }
          | { sg_number: number | null; step: number | null; amount: number }[]
          | null;
      }
    | null;
  pos_type: { description: string }[] | { description: string } | null;
  personnel: { id: string; first_name: string; last_name: string }[] | null;
}

/* ── Data fetching ────────────────────────────────────────────────── */

const fetchPositions = async (): Promise<PlantillaPosition[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  const { data, error } = await (supabase as NonNullable<typeof supabase>)
    .schema("hr")
    .from("position")
    .select(
      `
      id, item_no, description, authorization, funding_source,
      is_filled, is_active, created_at, sr_id, pt_id,
      office:o_id ( id, description ),
      salary_rate:sr_id ( description, rate:rate_id ( sg_number, step, amount ) ),
      pos_type:pt_id ( description ),
      personnel ( id, first_name, last_name )
    `,
    )
    .order("item_no");

  if (error) {
    console.error("Error fetching positions:", error);
    return [];
  }

  return ((data as unknown as PositionRow[]) || []).map((row) => {
    const office = Array.isArray(row.office) ? row.office[0] : row.office;
    const salaryRate = Array.isArray(row.salary_rate)
      ? row.salary_rate[0]
      : row.salary_rate;
    const rate = salaryRate
      ? Array.isArray(salaryRate.rate)
        ? salaryRate.rate[0]
        : salaryRate.rate
      : null;
    const posType = Array.isArray(row.pos_type)
      ? row.pos_type[0]
      : row.pos_type;
    const incumbent = row.personnel?.[0] ?? null;

    const sgLabel = rate?.sg_number
      ? `SG-${rate.sg_number} Step ${rate.step ?? 1}`
      : (salaryRate?.description ?? "\u2014");
    const monthlyAmount = rate?.amount ?? 0;

    return {
      id: row.id,
      item_number: row.item_no,
      position_title: row.description,
      salary_grade: sgLabel,
      monthly_salary: monthlyAmount,
      authorization: row.authorization ?? "\u2014",
      funding_source: row.funding_source ?? null,
      office_id: office?.id ?? "",
      office_name: office?.description ?? "Unassigned",
      sr_id: row.sr_id ?? "",
      pt_id: row.pt_id ?? "",
      pos_type: posType?.description ?? "\u2014",
      is_filled: row.is_filled,
      is_active: row.is_active,
      incumbent_name: incumbent
        ? `${incumbent.last_name}, ${incumbent.first_name}`
        : null,
      incumbent_id: incumbent?.id ?? null,
      created_at: row.created_at,
      slot_info: "", // computed after mapping
    };
  });
};

/** Compute slot_info for each position: "filled/total" grouped by title + office */
const computeSlotInfo = (
  positions: PlantillaPosition[],
): PlantillaPosition[] => {
  const groups = new Map<string, { total: number; filled: number }>();
  for (const p of positions) {
    const key = `${p.position_title}||${p.office_id}`;
    const g = groups.get(key) ?? { total: 0, filled: 0 };
    g.total++;
    if (p.is_filled) g.filled++;
    groups.set(key, g);
  }
  return positions.map((p) => {
    const key = `${p.position_title}||${p.office_id}`;
    const g = groups.get(key)!;
    return { ...p, slot_info: `${g.filled}/${g.total}` };
  });
};

/** Convert PositionFormData (from dialog) to PlantillaPositionFormData (for service) */
const toServiceData = (
  formData: PositionFormData,
): PlantillaPositionFormData => ({
  item_no: formData.item_no,
  description: formData.description,
  sr_id: formData.sr_id,
  pt_id: formData.pt_id,
  o_id: formData.o_id,
  authorization: formData.authorization,
  ...(formData.funding_source
    ? { funding_source: formData.funding_source }
    : {}),
  ...(formData.slots ? { slots: formData.slots } : {}),
});

/* ── Component ────────────────────────────────────────────────────── */

const PlantillaPositions = () => {
  const [positions, setPositions] = useState<PlantillaPosition[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Add dialog
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Edit dialog
  const [editingPosition, setEditingPosition] =
    useState<PlantillaPosition | null>(null);

  // Assign employee dialog
  const [assignTarget, setAssignTarget] = useState<PlantillaPosition | null>(
    null,
  );

  // Confirm unassign / delete
  const [confirmUnassignId, setConfirmUnassignId] = useState<string | null>(
    null,
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Three-dot dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const loadPositions = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchPositions();
    setPositions(computeSlotInfo(data));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadPositions();
  }, [loadPositions]);

  const handleAddPosition = async (formData: PositionFormData) => {
    setIsSaving(true);
    const result = await createPosition(toServiceData(formData));
    setIsSaving(false);
    if (result.success) {
      setShowAddDialog(false);
      loadPositions();
    } else {
      alert(result.error || "Failed to add position");
    }
  };

  const handleEditPosition = async (formData: PositionFormData) => {
    if (!editingPosition) return;
    setIsSaving(true);
    const result = await updatePosition(
      editingPosition.id,
      toServiceData(formData),
    );
    setIsSaving(false);
    if (result.success) {
      setEditingPosition(null);
      loadPositions();
    } else {
      alert(result.error || "Failed to update position");
    }
  };

  const handleUnassign = async (position: PlantillaPosition) => {
    if (!position.incumbent_id) return;
    setIsSaving(true);
    const result = await unassignEmployeeFromPosition(position.incumbent_id);
    setIsSaving(false);
    if (result.success) {
      setConfirmUnassignId(null);
      loadPositions();
    } else {
      alert(result.error || "Failed to unassign employee");
    }
  };

  const handleDelete = async (positionId: string) => {
    setIsSaving(true);
    const result = await deletePosition(positionId);
    setIsSaving(false);
    if (result.success) {
      setConfirmDeleteId(null);
      loadPositions();
    } else {
      alert(result.error || "Failed to delete position");
    }
  };

  const unassignTarget = confirmUnassignId
    ? (positions.find((p) => p.id === confirmUnassignId) ?? null)
    : null;

  const filtered = positions.filter(
    (p) =>
      p.position_title.toLowerCase().includes(search.toLowerCase()) ||
      p.item_number.toLowerCase().includes(search.toLowerCase()) ||
      p.office_name.toLowerCase().includes(search.toLowerCase()),
  );

  const { page, setPage, totalPages, pageItems, emptyRows, totalItems } = usePagination(filtered);

  const filledCount = positions.filter((p) => p.is_filled).length;
  const vacantCount = positions.filter((p) => !p.is_filled).length;
  const fillRate = positions.length
    ? `${Math.round((filledCount / positions.length) * 100)}%`
    : "0%";

  /* ── Render helpers ───────────────────────────────────────────────── */

  const SlotBadge = ({ info }: { info: string }) => {
    const [filled, total] = info.split("/").map(Number);
    return (
      <Badge label={info} variant={filled === total ? "accent" : "warning"} />
    );
  };

  const StatusBadge = ({ isFilled }: { isFilled: boolean }) => (
    <Badge
      label={isFilled ? "Filled" : "Vacant"}
      variant={isFilled ? "success" : "danger"}
    />
  );

  const FundingBadge = ({ source }: { source: string | null }) =>
    source ? (
      <Badge label={source} variant="info" />
    ) : (
      <span className="text-muted text-xs">{"\u2014"}</span>
    );

  const ActionsMenu = ({ item }: { item: PlantillaPosition }) => {
    const menuItems = [
      {
        label: "Edit Position",
        icon: <Pencil className="w-4 h-4" />,
        onClick: () => {
          setEditingPosition(item);
          setOpenMenuId(null);
        },
      },
      ...(!item.is_filled
        ? [
            {
              label: "Assign Employee",
              icon: <UserPlus className="w-4 h-4" />,
              onClick: () => {
                setAssignTarget(item);
                setOpenMenuId(null);
              },
              variant: "success" as const,
            },
          ]
        : [
            {
              label: "Unassign Incumbent",
              icon: <UserMinus className="w-4 h-4" />,
              onClick: () => {
                setConfirmUnassignId(item.id);
                setOpenMenuId(null);
              },
              variant: "warning" as const,
            },
          ]),
      ...(!item.is_filled
        ? [
            {
              label: "Delete Position",
              icon: <Trash2 className="w-4 h-4" />,
              onClick: () => {
                setConfirmDeleteId(item.id);
                setOpenMenuId(null);
              },
              variant: "danger" as const,
            },
          ]
        : []),
    ];

    return (
      <div className="relative" ref={openMenuId === item.id ? menuRef : null}>
        <button
          onClick={() =>
            setOpenMenuId((prev) => (prev === item.id ? null : item.id))
          }
          className="p-1.5 rounded-lg hover:bg-muted/20 transition-colors text-muted hover:text-foreground"
          title="Actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
        {openMenuId === item.id && <DropdownMenu items={menuItems} />}
      </div>
    );
  };

  /* ── Main render ──────────────────────────────────────────────────── */

  return (
    <PageShell
      title="Plantilla of Positions"
      subtitle="Authorized positions per DBM-approved plantilla"
      onRefresh={loadPositions}
      isLoading={isLoading}
      actions={
        <AccentButton onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Position
        </AccentButton>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Positions"
          value={positions.length}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Filled"
          value={filledCount}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="text-accent"
        />
        <StatCard
          label="Vacant"
          value={vacantCount}
          icon={<XCircle className="w-5 h-5" />}
          accent="text-red-500 dark:text-red-400"
        />
        <StatCard
          label="Fill Rate"
          value={fillRate}
          icon={<TrendingUp className="w-5 h-5" />}
          accent="text-accent"
        />
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item no., position, or office..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-transparent border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 text-foreground placeholder:text-muted transition-colors"
          />
        </div>
      </Card>

      {/* Data Table / Cards */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<LayoutList className="w-10 h-10 mb-2 opacity-40" />}
            message="No positions found."
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Item No.
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Position Title
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Slots
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      SG / Step
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Monthly Salary
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Authorization
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Fund Source
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Office
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider">
                      Incumbent
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted text-xs uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-muted/5 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                        {item.item_number}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.position_title}
                      </td>
                      <td className="px-4 py-3">
                        <SlotBadge info={item.slot_info} />
                      </td>
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {item.salary_grade}
                      </td>
                      <td className="px-4 py-3 text-foreground tabular-nums whitespace-nowrap">
                        {item.monthly_salary
                          ? fmtPeso(item.monthly_salary)
                          : "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.authorization}
                      </td>
                      <td className="px-4 py-3">
                        <FundingBadge source={item.funding_source} />
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.office_name}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.pos_type}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge isFilled={item.is_filled} />
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {item.incumbent_name ?? "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ActionsMenu item={item} />
                      </td>
                    </tr>
                  ))}
                  <EmptyRows count={emptyRows} columns={12} />
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="lg:hidden divide-y divide-border">
              {pageItems.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {item.position_title}
                      </p>
                      <p className="text-xs text-muted mt-0.5">
                        {item.item_number} &middot; {item.office_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge isFilled={item.is_filled} />
                      <ActionsMenu item={item} />
                    </div>
                  </div>

                  {/* Detail grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <span className="text-xs text-muted">SG / Step</span>
                      <p className="text-foreground">{item.salary_grade}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Monthly Salary</span>
                      <p className="text-foreground tabular-nums">
                        {item.monthly_salary
                          ? fmtPeso(item.monthly_salary)
                          : "\u2014"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Slots</span>
                      <p>
                        <SlotBadge info={item.slot_info} />
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Type</span>
                      <p className="text-foreground">{item.pos_type}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Authorization</span>
                      <p className="text-foreground">{item.authorization}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted">Fund Source</span>
                      <p>
                        <FundingBadge source={item.funding_source} />
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-muted">Incumbent</span>
                      <p className="text-foreground">
                        {item.incumbent_name ?? "\u2014"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Add Position Dialog */}
      <PositionDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSubmit={handleAddPosition}
        isLoading={isSaving}
      />

      {/* Edit Position Dialog */}
      <PositionDialog
        open={editingPosition !== null}
        onClose={() => setEditingPosition(null)}
        onSubmit={handleEditPosition}
        position={editingPosition}
        isLoading={isSaving}
      />

      {/* Assign Employee Dialog */}
      <AssignEmployeeDialog
        open={assignTarget !== null}
        position={assignTarget}
        onClose={() => setAssignTarget(null)}
        onAssigned={loadPositions}
      />

      {/* Confirm Unassign Modal */}
      <ConfirmModal
        open={!!confirmUnassignId && !!unassignTarget}
        title="Unassign Incumbent?"
        confirmLabel="Unassign"
        confirmVariant="warning"
        isLoading={isSaving}
        onConfirm={() => unassignTarget && handleUnassign(unassignTarget)}
        onCancel={() => setConfirmUnassignId(null)}
      >
        {unassignTarget && (
          <p>
            This will remove{" "}
            <strong className="text-foreground">
              {unassignTarget.incumbent_name}
            </strong>{" "}
            from{" "}
            <strong className="text-foreground">
              {unassignTarget.position_title}
            </strong>{" "}
            ({unassignTarget.item_number}). The position will become vacant.
          </p>
        )}
      </ConfirmModal>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={!!confirmDeleteId}
        title="Delete Position?"
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isSaving}
        onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      >
        <p>
          This will permanently delete{" "}
          <strong className="text-foreground">
            {positions.find((p) => p.id === confirmDeleteId)?.item_number}
          </strong>
          . This action cannot be undone.
        </p>
      </ConfirmModal>
    </PageShell>
  );
};

export default PlantillaPositions;
