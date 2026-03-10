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
  ShieldCheck,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchClassificationAppropriations,
  createSubClassification,
  updateSubClassification,
  deleteSubClassification,
  createClassification,
  FUNCTIONAL_CLASSIFICATION_TEMPLATES,
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
  const [classificationDialogOpen, setClassificationDialogOpen] = useState(false);
  const [selectedClassificationId, setSelectedClassificationId] = useState("");
  const [classificationSubDescription, setClassificationSubDescription] = useState("");
  const [creatingClassification, setCreatingClassification] = useState(false);
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

  const classificationOptions = FUNCTIONAL_CLASSIFICATION_TEMPLATES;

  const totalCategories = classifications.length;
  const totalSubs = classifications.reduce(
    (sum, cat) => sum + cat.subClassifications.filter((sc) => sc.status).length,
    0,
  );

  const filtered = useMemo(() => {
    const withActiveSubs = classifications.map((cat) => ({
      ...cat,
      subClassifications: cat.subClassifications.filter((sc) => sc.status),
    }));
    if (!search.trim()) return withActiveSubs;
    const query = search.toLowerCase();
    return withActiveSubs.filter(
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

  function openAddClassification() {
    setSelectedClassificationId("");
    setClassificationSubDescription("");
    setClassificationDialogOpen(true);
  }

  const closeClassificationDialog = () => {
    setClassificationDialogOpen(false);
    setSelectedClassificationId("");
    setClassificationSubDescription("");
  }

  function openEditSub(categoryId: string, sub: SubClassificationRow) {
    resetDialog();
    setEditMode(true);
    setEditingId(sub.id);
    setEditingParentId(categoryId);
    setFormDescription(sub.description);
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
          classificationId: editingParentId,
        });
        showAlert("Sub-classification updated successfully");
      } else {
        await createSubClassification({
          description: formDescription.trim(),
          status: true,
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

  async function handleCreateClassification() {
    if (!selectedClassificationId || !classificationSubDescription.trim()) return;
    setCreatingClassification(true);

    try {
      const template = FUNCTIONAL_CLASSIFICATION_TEMPLATES.find((item) => item.id === selectedClassificationId);
      if (!template) return;

      // Reuse existing classification if it already exists, otherwise create a new one
      const existing = classifications.find((cat) => cat.description === template.description);
      const parentId = existing
        ? existing.id
        : (await createClassification({ description: template.description }))?.id;

      if (!parentId) return;

      await createSubClassification({
        description: classificationSubDescription.trim(),
        status: true,
        classificationId: parentId,
      });

      showAlert("Sub-classification added successfully");
      closeClassificationDialog();
      await fetchData();
    } catch (err) {
      showAlert(err instanceof Error ? err.message : "Unable to add classification", "error");
    } finally {
      setCreatingClassification(false);
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
        title="Functional Classification of Appropriations"
        subtitle="Appropriations, Allotments and Obligations"
        icon={<ClipboardList className="w-7 h-7" />}
      />

      <div className="mb-4">
        <StatsRow>
          <StatCard
            label="Functional Classifications"
            value={totalCategories}
            color="primary"
            icon={<ShieldCheck className="w-5 h-5" />}
          />
          <StatCard
            label="Sub-Classifications"
            value={totalSubs}
            color="success"
            icon={<Layers className="w-5 h-5" />}
          />

        </StatsRow>
      </div>

      <ActionsBar>
        <div className="flex gap-2">
          <PrimaryButton onClick={openAddClassification}>
            <Plus className="w-4 h-4" />
            Add Functional Classification
          </PrimaryButton>
          <PrimaryButton onClick={fetchData}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </PrimaryButton>
        </div>
      </ActionsBar>

      <div className="bg-surface border border-border rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Functional Classifications</h2>
            <p className="text-sm text-foreground/70">Browse each functional category and expand to review its sub-classifications.</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="relative w-80">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
                placeholder="Search functional classifications..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <p className="text-xs text-muted">
              Search by classification or sub-classification description.
            </p>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted" />
            <span className="ml-2 text-sm text-muted">Loading classifications...</span>
          </div>
        )}

        {!loading && (
          <div className="grid gap-4">
            {filtered.length === 0 && (
              <p className="text-center text-muted py-8">No classifications found.</p>
            )}
            {filtered.map((cat) => {
              const isExpanded = expandedIds.has(cat.id);
              return (
                <section
                  key={cat.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:shadow-md"
                >
                  {(() => {
                    const headerGradientClasses = cat.status
                      ? "border-success/30 bg-gradient-to-r from-emerald-50 via-success/20 to-white"
                      : "border-danger/30 bg-gradient-to-r from-red-50 via-danger/20 to-white"
                    const ribbonGradient = cat.status ? "from-success to-emerald-400" : "from-danger to-rose-500"
                    return (
                      <div className={`relative border-b ${headerGradientClasses}`}>
                        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ribbonGradient}`} />
                        <div
                          className="relative flex items-center gap-3 px-4 py-4 cursor-pointer select-none"
                          onClick={() => toggleExpand(cat.id)}
                        >
                          {isExpanded ? (
                            <ChevronDown className={cn("w-5 h-5", cat.status ? "text-success" : "text-danger")} />
                          ) : (
                            <ChevronRight className={cn("w-5 h-5", cat.status ? "text-success" : "text-danger/70")} />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-foreground">{cat.description}</p>
                            <p className="text-xs text-foreground/70">
                              {cat.subClassifications.length} sub-classification{cat.subClassifications.length === 1 ? '' : 's'}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-semibold transition",
                              cat.status ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
                            )}
                          >
                            {cat.status ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    )
                  })()}

                  {isExpanded && (
                    <div className="divide-y divide-border/60">
                      {cat.subClassifications.length === 0 && (
                        <p className="text-sm text-muted px-4 py-3">No sub-classifications yet.</p>
                      )}
                      {cat.subClassifications.map((sub) => (
                        <div
                          key={sub.id}
                          className={cn(
                            "flex flex-wrap items-center gap-3 px-4 py-3 text-sm text-foreground transition",
                            sub.status ? "border-success/20" : "border-danger/20",
                            "rounded-b-2xl border border-transparent hover:border-border/60 hover:bg-background/50",
                          )}
                        >
                          <span
                            className={cn(
                              "h-2 w-2 rounded-full",
                              sub.status ? "bg-success" : "bg-danger",
                            )}
                          />
                          <span className="flex-1 font-medium">{sub.description}</span>
                          <span
                            className={cn(
                              "text-[10px] px-2 py-1 rounded-full font-semibold",
                              sub.status ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
                            )}
                          >
                            {sub.status ? "Active" : "Inactive"}
                          </span>
                          <div className="flex gap-2">
                            <button
                              title="Edit"
                              className="flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-blue-600 hover:bg-blue-500/10"
                              onClick={() => openEditSub(cat.id, sub)}
                            >
                              <Pencil className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              title="Delete"
                              className="flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-danger hover:bg-danger/10"
                              onClick={() => handleDeleteSub(sub.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
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
        bodyClassName="space-y-5"
      >
        <div className="space-y-4">
          {editMode && (
            <div className="space-y-1.5">
              <label htmlFor="edit-parent" className="block text-sm font-medium text-foreground">
                Functional Classification
              </label>
              <select
                id="edit-parent"
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-success focus:outline-none"
                value={editingParentId ?? ""}
                onChange={(event) => setEditingParentId(event.target.value)}
              >
                {classifications.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.description}
                  </option>
                ))}
              </select>
            </div>
          )}
          <FormInput
            id="description"
            label="Description"
            value={formDescription}
            onChange={setFormDescription}
            placeholder="Enter sub-classification description"
            required
          />
        </div>
      </BaseDialog>

      <BaseDialog
        open={classificationDialogOpen}
        onClose={closeClassificationDialog}
        title="Add Functional Classification"
        onSubmit={handleCreateClassification}
        submitLabel="Add Classification"
        isLoading={creatingClassification}
        size="md"
        bodyClassName="space-y-4"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="classification" className="block text-sm font-medium text-foreground">
              Functional Classification
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <select
              id="classification"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-success focus:outline-none"
              value={selectedClassificationId}
              onChange={(event) => setSelectedClassificationId(event.target.value)}
              required
            >
              <option value="">-- Choose classification --</option>
              {classificationOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.description}
                </option>
              ))}
            </select>
          </div>
          <FormInput
            id="sub-description"
            label="Sub-Classification"
            value={classificationSubDescription}
            onChange={setClassificationSubDescription}
            placeholder="Enter sub-classification description"
            required
          />
        </div>
      </BaseDialog>

      {alert && <Alert variant={alert.variant} message={alert.message} onClose={() => setAlert(null)} />}
    </div>
  );
}