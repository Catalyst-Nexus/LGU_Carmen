import { useState, useEffect, useCallback, useRef } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  IconButton,
} from "@/components/ui";
import {
  LayoutList,
  Plus,
  RefreshCw,
  Pencil,
  UserPlus,
  UserMinus,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import type { PlantillaPosition } from "@/types/hr.types";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import {
  createPosition,
  updatePosition,
  deletePosition,
  unassignEmployeeFromPosition,
} from "@/services/hrService";
import type { PlantillaPositionFormData } from "@/services/hrService";
import PositionDialog from "../components/PositionDialog";
import type { PositionFormData } from "../components/PositionDialog";
import AssignEmployeeDialog from "../components/AssignEmployeeDialog";

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
      : (salaryRate?.description ?? "—");
    const monthlyAmount = rate?.amount ?? 0;

    return {
      id: row.id,
      item_number: row.item_no,
      position_title: row.description,
      salary_grade: sgLabel,
      monthly_salary: monthlyAmount,
      authorization: row.authorization ?? "—",
      funding_source: row.funding_source ?? null,
      office_id: office?.id ?? "",
      office_name: office?.description ?? "Unassigned",
      sr_id: row.sr_id ?? "",
      pt_id: row.pt_id ?? "",
      pos_type: posType?.description ?? "—",
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantilla of Positions"
        subtitle="Authorized positions per DBM-approved plantilla"
        icon={<LayoutList className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Positions" value={positions.length} />
        <StatCard
          label="Filled"
          value={positions.filter((p) => p.is_filled).length}
          color="success"
        />
        <StatCard
          label="Vacant"
          value={positions.filter((p) => !p.is_filled).length}
          color="danger"
        />
        <StatCard
          label="Fill Rate"
          value={
            positions.length
              ? `${Math.round((positions.filter((p) => p.is_filled).length / positions.length) * 100)}%`
              : "0%"
          }
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4" />
          Add Position
        </PrimaryButton>
        <PrimaryButton onClick={loadPositions} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PlantillaPosition>
        data={positions.filter(
          (p) =>
            p.position_title.toLowerCase().includes(search.toLowerCase()) ||
            p.item_number.toLowerCase().includes(search.toLowerCase()) ||
            p.office_name.toLowerCase().includes(search.toLowerCase()),
        )}
        columns={[
          { key: "item_number", header: "Item No." },
          { key: "position_title", header: "Position Title" },
          {
            key: "slot_info",
            header: "Slots",
            render: (item) => {
              const [filled, total] = item.slot_info.split("/").map(Number);
              return (
                <span
                  className={`text-xs font-medium ${filled === total ? "text-success" : "text-warning"}`}
                >
                  {item.slot_info}
                </span>
              );
            },
          },
          { key: "salary_grade", header: "SG / Step" },
          {
            key: "monthly_salary",
            header: "Monthly Salary",
            render: (item) => (
              <span>
                {item.monthly_salary
                  ? new Intl.NumberFormat("en-PH", {
                      style: "currency",
                      currency: "PHP",
                    }).format(item.monthly_salary)
                  : "—"}
              </span>
            ),
          },
          { key: "authorization", header: "Authorization" },
          {
            key: "funding_source",
            header: "Fund Source",
            render: (item) =>
              item.funding_source ? (
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                  {item.funding_source}
                </span>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              ),
          },
          { key: "office_name", header: "Office" },
          { key: "pos_type", header: "Type" },
          {
            key: "is_filled",
            header: "Status",
            render: (item) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  item.is_filled
                    ? "bg-success/10 text-success"
                    : "bg-danger/10 text-danger"
                }`}
              >
                {item.is_filled ? "Filled" : "Vacant"}
              </span>
            ),
          },
          {
            key: "incumbent_name",
            header: "Incumbent",
            render: (item) => <span>{item.incumbent_name ?? "—"}</span>,
          },
          {
            key: "id",
            header: "Actions",
            render: (item) => (
              <div
                className="relative"
                ref={openMenuId === item.id ? menuRef : null}
              >
                <IconButton
                  onClick={() =>
                    setOpenMenuId((prev) => (prev === item.id ? null : item.id))
                  }
                  title="Actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </IconButton>

                {openMenuId === item.id && (
                  <div className="absolute right-0 top-full mt-1 z-50 min-w-[170px] bg-background border border-border rounded-lg shadow-lg py-1 text-sm">
                    <button
                      onClick={() => {
                        setEditingPosition(item);
                        setOpenMenuId(null);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/20 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Position
                    </button>

                    {!item.is_filled ? (
                      <button
                        onClick={() => {
                          setAssignTarget(item);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-success/10 text-success transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign Employee
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setConfirmUnassignId(item.id);
                          setOpenMenuId(null);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-warning/10 text-warning transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                        Unassign Incumbent
                      </button>
                    )}

                    {!item.is_filled && (
                      <>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => {
                            setConfirmDeleteId(item.id);
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-danger/10 text-danger transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Position
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ),
          },
        ]}
        title="Plantilla Positions"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by item no., position, or office..."
        emptyMessage="No positions found."
      />

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
      {confirmUnassignId && unassignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Unassign Incumbent?
            </h3>
            <p className="text-sm text-muted-foreground">
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
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmUnassignId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnassign(unassignTarget)}
                disabled={isSaving}
                className="px-4 py-2 text-sm rounded-lg bg-warning text-white hover:bg-warning/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Unassigning…" : "Unassign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Delete Position?
            </h3>
            <p className="text-sm text-muted-foreground">
              This will permanently delete{" "}
              <strong className="text-foreground">
                {positions.find((p) => p.id === confirmDeleteId)?.item_number}
              </strong>
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isSaving}
                className="px-4 py-2 text-sm rounded-lg bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlantillaPositions;
