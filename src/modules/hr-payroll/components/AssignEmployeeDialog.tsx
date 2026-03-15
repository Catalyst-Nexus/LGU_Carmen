import { useState, useEffect, useMemo } from "react";
import { BaseDialog } from "@/components/ui/dialog";
import type { PlantillaPosition } from "@/types/hr.types";
import {
  assignEmployeeToPosition,
  fetchUnassignedPersonnel,
  type UnassignedPersonnel,
} from "../services/hrService";

interface AssignEmployeeDialogProps {
  open: boolean;
  position: PlantillaPosition | null;
  onClose: () => void;
  onAssigned: () => void;
}

const EMPLOYMENT_STATUS_LABELS: Record<string, string> = {
  permanent: "Permanent",
  casual: "Casual",
  coterminous: "Co-terminous",
  contractual: "Contractual",
  job_order: "Job Order",
};

const AssignEmployeeDialog = ({
  open,
  position,
  onClose,
  onAssigned,
}: AssignEmployeeDialogProps) => {
  const [personnel, setPersonnel] = useState<UnassignedPersonnel[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadPersonnel();
      setSelectedId("");
      setSearch("");
    }
  }, [open]);

  const loadPersonnel = async () => {
    setIsLoading(true);
    const data = await fetchUnassignedPersonnel();
    setPersonnel(data);
    setIsLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return personnel;
    const q = search.toLowerCase();
    return personnel.filter(
      (p) =>
        p.last_name.toLowerCase().includes(q) ||
        p.first_name.toLowerCase().includes(q) ||
        (p.middle_name ?? "").toLowerCase().includes(q),
    );
  }, [personnel, search]);

  const handleSubmit = async () => {
    if (!position || !selectedId) return;
    setIsSaving(true);
    const result = await assignEmployeeToPosition(position.id, selectedId);
    setIsSaving(false);
    if (result.success) {
      onAssigned();
      onClose();
    } else {
      alert(result.error || "Failed to assign employee");
    }
  };

  const selectedPerson = personnel.find((p) => p.id === selectedId);

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Assign Employee to Position"
      onSubmit={handleSubmit}
      submitLabel="Assign"
      isLoading={isSaving}
    >
      {position && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border space-y-1">
          <p className="text-xs text-muted-foreground">Assigning to:</p>
          <p className="text-sm font-semibold text-foreground">
            {position.position_title}
          </p>
          <p className="text-xs text-muted-foreground">
            {position.item_number} · {position.salary_grade} ·{" "}
            {position.office_name}
          </p>
        </div>
      )}

      {/* Search */}
      <div className="space-y-1.5 mb-3">
        <label className="block text-sm font-medium text-foreground">
          Search Employee
        </label>
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-accent"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Employee list */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-foreground">
          Select Employee
          <span className="text-error ml-1">*</span>
        </label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Loading personnel...
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {search
              ? "No matching employees found."
              : "No unassigned active employees."}
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 ${
                  selectedId === p.id
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-foreground"
                }`}
              >
                <span>
                  {p.last_name}, {p.first_name}
                  {p.middle_name ? ` ${p.middle_name.charAt(0)}.` : ""}
                </span>
                {p.employment_status && (
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    {EMPLOYMENT_STATUS_LABELS[p.employment_status] ??
                      p.employment_status}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPerson && (
        <p className="mt-2 text-xs text-accent">
          Selected:{" "}
          <strong>
            {selectedPerson.last_name}, {selectedPerson.first_name}
          </strong>
        </p>
      )}

      {!selectedId && !isLoading && (
        <p className="mt-2 text-xs text-error">
          * Please select an employee to assign
        </p>
      )}
    </BaseDialog>
  );
};

export default AssignEmployeeDialog;
