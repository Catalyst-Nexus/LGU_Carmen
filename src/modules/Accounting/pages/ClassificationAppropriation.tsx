import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  Alert,
} from "@/components/ui";
import { BaseDialog, FormInput } from "@/components/ui/dialog";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchClassificationAppropriations,
  createSubClassification,
  updateSubClassification,
  deleteSubClassification,
  toggleCategoryStatus,
  ClassificationWithSubs,
  SubClassificationRow,
} from "@/services/accountingService";

export default function ClassificationAppropriationPage() {
  const [classifications, setClassifications] = useState<ClassificationWithSubs[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingParentId, setEditingParentId] = useState<string | null>(null);
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<
    | {
        message: string;
        variant: "success" | "error";
      }
    | null
  >(null);

  const showAlert = useCallback(
    (message: string, variant: "success" | "error" = "success") => {
      setAlert({ message, variant });
      setTimeout(() => setAlert(null), 3000);
    },
    [],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClassificationAppropriations();
      setClassifications(data);
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleCategory = useCallback(
    async (categoryId: string, currentStatus: boolean) => {
      try {
        toggleCategoryStatus(categoryId, !currentStatus);
        showAlert(`Category marked as ${currentStatus ? "inactive" : "active"}`);
        await fetchData();
      } catch (err) {
        showAlert(err instanceof Error ? err.message : "Unable to update category", "error");
      }
    },
    [fetchData, showAlert],
  );

  const totalCategories = classifications.length;
  const totalSubs = classifications.reduce((sum, cat) => sum + cat.subClassifications.length, 0);
  const activeSubs = classifications.reduce(
    (sum, cat) => sum + cat.subClassifications.filter((sc) => sc.status).length,
    0,
  );
  const inactiveSubs = totalSubs - activeSubs;

  const filtered = useMemo(() => {
    if (!search.trim()) return classifications;
    const query = search.toLowerCase();
    return classifications.filter(
      (cat) =>
        cat.description.toLowerCase().includes(query) ||
        cat.subClassifications.some((sc) => sc.description.toLowerCase().includes(query)),
    );
  }, [classifications, search]);

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function resetDialog() {
    setDialogOpen(false);
    setEditMode(false);
    setEditingId(null);
    setEditingParentId(null);
    setFormDescription("");
    setFormStatus(true);
  }

  function openAddSub(categoryId: string) {
    resetDialog();
    setEditingParentId(categoryId);
    setDialogOpen(true);
  }

  function openEditSub(categoryId: string, sub: SubClassificationRow) {
    resetDialog();
    setEditMode(true);
    setEditingId(sub.id);
    setEditingParentId(categoryId);
    setFormDescription(sub.description);
    setFormStatus(sub.status);
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formDescription.trim() || !editingParentId) return;
    setSaving(true);

    try {
      if (editMode && editingId) {
        await updateSubClassification({
          id: editingId,
          description: formDescription.trim(),
          status: formStatus,
        });
        showAlert("Sub-classification updated successfully");
      } else {
        await createSubClassification({
          description: formDescription.trim(),
          status: formStatus,
          classificationId: editingParentId,
        });
        showAlert("Sub-classification added successfully");
      }

      resetDialog();
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Operation failed", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSub(subId: string) {
    if (!subId) return;
    if (!confirm("Are you sure you want to delete this sub-classification?")) return;

    try {
      await deleteSubClassification(subId);
      showAlert("Sub-classification deleted");
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div>
      <PageHeader
        title="Classification of Appropriations"
        subtitle="Functional Classification of Appropriations, Allotments and Obligations"
        icon={<ClipboardList className="w-7 h-7" />}
      />

      <StatsRow>
        <StatCard label="Categories" value={totalCategories} color="primary" />
        <StatCard label="Sub-Classifications" value={totalSubs} color="success" />
        <StatCard label="Active" value={activeSubs} color="success" />
        <StatCard label="Inactive" value={inactiveSubs} color="danger" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={fetchData}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </PrimaryButton>
      </ActionsBar>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Appropriation Classifications</h2>
          <div className="relative w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
              placeholder="Search classifications..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
            <span className="ml-2 text-sm text-muted">Loading classifications...</span>
          </div>
        )}

        {!loading && (
          <div className="space-y-2">
            {filtered.length === 0 && (
              <p className="text-center text-muted py-8">No classifications found.</p>
            )}
            {filtered.map((cat) => {
              const isExpanded = expandedIds.has(cat.id);
              return (
                <div key={cat.id} className="border border-border rounded-xl overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-background cursor-pointer select-none hover:bg-background/80 transition-colors"
                    onClick={() => toggleExpand(cat.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted shrink-0" />
                    )}
                    <span className="flex-1 font-semibold text-sm text-foreground">
                      {cat.description}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        cat.status ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
                      )}
                    >
                      {cat.status ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        handleToggleCategory(cat.id, cat.status);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-border/70 text-foreground/70 hover:text-foreground transition"
                    >
                      {cat.status ? "Deactivate" : "Activate"}
                    </button>
                    <span className="text-xs text-muted">{cat.subClassifications.length} items</span>
                    <div className="flex gap-1 ml-2" onClick={(event) => event.stopPropagation()}>
                      <button
                        title="Add sub-classification"
                        className="p-1.5 rounded-lg hover:bg-success/10 text-success transition-colors"
                        onClick={() => openAddSub(cat.id)}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="divide-y divide-border/50">
                      {cat.subClassifications.length === 0 && (
                        <p className="text-sm text-muted px-4 py-3 pl-11">No sub-classifications yet.</p>
                      )}
                      {cat.subClassifications.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-3 px-4 py-2.5 pl-11 hover:bg-background/50 transition-colors"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0" />
                          <span className="flex-1 text-sm text-foreground">{sub.description}</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              sub.status ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
                            )}
                          >
                            {sub.status ? "Active" : "Inactive"}
                          </span>
                          <div className="flex gap-1">
                            <button
                              title="Edit"
                              className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"
                              onClick={() => openEditSub(cat.id, sub)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-danger/10 text-danger transition-colors"
                              onClick={() => handleDeleteSub(sub.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BaseDialog
        open={dialogOpen}
        onClose={resetDialog}
        title={editMode ? "Edit Sub-Classification" : "Add Sub-Classification"}
        onSubmit={handleSubmit}
        submitLabel={editMode ? "Update" : "Create"}
        isLoading={saving}
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            id="description"
            label="Description"
            value={formDescription}
            onChange={setFormDescription}
            placeholder="Enter sub-classification description"
            required
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-foreground">Status</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formStatus === true}
                  onChange={() => setFormStatus(true)}
                  className="accent-success"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={formStatus === false}
                  onChange={() => setFormStatus(false)}
                  className="accent-danger"
                />
                Inactive
              </label>
            </div>
          </div>
        </div>
      </BaseDialog>

      {alert && <Alert variant={alert.variant} message={alert.message} onClose={() => setAlert(null)} />}
    </div>
  );
}