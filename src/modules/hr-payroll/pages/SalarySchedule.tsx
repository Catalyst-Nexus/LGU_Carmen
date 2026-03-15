import { useState, useEffect, useCallback } from "react";
import { PageShell, Card, AccentButton, GhostButton } from "../components/ui";
import { Save, Pencil, X } from "lucide-react";
import { fetchRates, updateRate } from "../services/hrService";
import type { RateRow } from "../services/hrService";

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const formatPeso = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const SalarySchedule = () => {
  const [rates, setRates] = useState<RateRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  const loadRates = useCallback(async () => {
    setIsLoading(true);
    const data = await fetchRates();
    setRates(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  // Group rates into a map: sg_number → { step → RateRow }
  const sgMap = new Map<number, Map<number, RateRow>>();
  const joRates: RateRow[] = [];

  for (const r of rates) {
    if (r.sg_number === null) {
      joRates.push(r);
      continue;
    }
    if (!sgMap.has(r.sg_number)) sgMap.set(r.sg_number, new Map());
    if (r.step !== null) sgMap.get(r.sg_number)!.set(r.step, r);
  }

  const sgNumbers = Array.from(sgMap.keys()).sort((a, b) => a - b);

  const handleAmountChange = (id: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      setEdits((prev) => ({ ...prev, [id]: num }));
    }
  };

  const getDisplayAmount = (r: RateRow) =>
    edits[r.id] !== undefined ? edits[r.id] : r.amount;

  const hasChanges = Object.keys(edits).length > 0;

  const handleSave = async () => {
    setSaving(true);
    const entries = Object.entries(edits);
    let failed = 0;
    for (const [id, amount] of entries) {
      const result = await updateRate(id, amount);
      if (!result.success) failed++;
    }
    setSaving(false);
    if (failed > 0) {
      alert(`${failed} of ${entries.length} updates failed.`);
    }
    setEdits({});
    setEditMode(false);
    loadRates();
  };

  const handleCancel = () => {
    setEdits({});
    setEditMode(false);
  };

  const totalPositions = rates.filter((r) => r.sg_number !== null).length;

  return (
    <PageShell
      title="Salary Schedule"
      subtitle="DBM Salary Standardization — adjust rates to match your LGU's salary ordinance"
      onRefresh={!editMode ? loadRates : undefined}
      isLoading={isLoading}
      actions={
        !editMode ? (
          <AccentButton onClick={() => setEditMode(true)}>
            <Pencil className="w-4 h-4" />
            Edit Rates
          </AccentButton>
        ) : (
          <>
            <AccentButton onClick={handleSave} disabled={!hasChanges || saving}>
              <Save className="w-4 h-4" />
              {saving
                ? "Saving..."
                : `Save Changes (${Object.keys(edits).length})`}
            </AccentButton>
            <GhostButton onClick={handleCancel}>
              <X className="w-4 h-4" />
              Cancel
            </GhostButton>
          </>
        )
      }
    >
      {editMode && (
        <div className="px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
          Editing mode — click on any amount to change it. Changes are saved in
          bulk.
        </div>
      )}

      {/* Main salary grid */}
      <Card>
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Monthly Salary Schedule — SG 1–33, Steps 1–8
          </h3>
          <span className="text-xs text-muted">
            {totalPositions} rate entries • {sgNumbers.length} salary grades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent/5 border-b border-border">
                <th className="px-4 py-3 text-left font-semibold text-foreground sticky left-0 bg-accent/5 z-10 min-w-[80px]">
                  SG
                </th>
                {STEPS.map((s) => (
                  <th
                    key={s}
                    className="px-4 py-3 text-right font-semibold text-foreground min-w-[130px]"
                  >
                    Step {s}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sgNumbers.map((sg) => {
                const stepMap = sgMap.get(sg)!;
                return (
                  <tr
                    key={sg}
                    className="border-b border-border hover:bg-muted/10 transition-colors"
                  >
                    <td className="px-4 py-2.5 font-semibold text-foreground sticky left-0 bg-surface z-10">
                      SG-{sg}
                    </td>
                    {STEPS.map((step) => {
                      const rate = stepMap.get(step);
                      if (!rate) {
                        return (
                          <td
                            key={step}
                            className="px-4 py-2.5 text-right text-muted"
                          >
                            —
                          </td>
                        );
                      }
                      const displayAmt = getDisplayAmount(rate);
                      const isEdited = edits[rate.id] !== undefined;
                      return (
                        <td key={step} className="px-4 py-2.5 text-right">
                          {editMode ? (
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              className={`w-full text-right text-sm px-2 py-1 border rounded bg-background text-foreground focus:outline-none focus:border-accent ${
                                isEdited
                                  ? "border-warning bg-warning/5"
                                  : "border-border"
                              }`}
                              value={displayAmt}
                              onChange={(e) =>
                                handleAmountChange(rate.id, e.target.value)
                              }
                            />
                          ) : (
                            <span className="text-foreground tabular-nums">
                              {formatPeso(rate.amount)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Job Order / Non-SG rates */}
      {joRates.length > 0 && (
        <Card>
          <div className="px-5 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Non-SG Rates (Job Orders, etc.)
            </h3>
          </div>
          <div className="divide-y divide-border">
            {joRates.map((r) => {
              const displayAmt = getDisplayAmount(r);
              const isEdited = edits[r.id] !== undefined;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <span className="text-foreground font-medium">
                    {r.description}
                  </span>
                  {editMode ? (
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      className={`w-40 text-right text-sm px-2 py-1 border rounded bg-background text-foreground focus:outline-none focus:border-accent ${
                        isEdited
                          ? "border-warning bg-warning/5"
                          : "border-border"
                      }`}
                      value={displayAmt}
                      onChange={(e) => handleAmountChange(r.id, e.target.value)}
                    />
                  ) : (
                    <span className="text-foreground tabular-nums font-medium">
                      ₱{formatPeso(r.amount)} / day
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </PageShell>
  );
};

export default SalarySchedule;
