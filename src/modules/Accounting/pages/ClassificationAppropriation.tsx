import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
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
  Loader2,
  ShieldCheck,
  Layers,
  ChevronDown,
  ChevronRight,
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
  const [search, setSearch] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  const toggleExpanded = (catId: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedIds(newExpanded);
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
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted focus:outline-none focus:border-success"
            placeholder="Search functional classifications..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
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
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="ml-2 text-sm text-slate-500">Loading classifications...</span>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-slate-400 py-12 text-sm">No classifications found.</p>
        )}

        {!loading && filtered.length > 0 && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[3rem_1fr_6rem_7rem_auto] gap-4 px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-300 sticky top-0 z-10">
              <span />
              <span className="text-xs font-black uppercase tracking-widest text-white">Classification</span>
              <span className="text-xs font-black uppercase tracking-widest text-white text-center">Items</span>
              <span className="text-xs font-black uppercase tracking-widest text-white text-center">Status</span>
              <span />
            </div>

            {/* Classification entries - always expanded */}
            {filtered.map((cat, idx) => (
              <div key={cat.id}>
                {/* Main classification row */}
                <div
                  className={cn(
                    "grid grid-cols-[3rem_1fr_6rem_7rem_auto] gap-4 items-center px-6 py-4 border-b border-slate-100 hover:bg-blue-50/40 transition-all duration-200 cursor-pointer group",
                    idx === 0 ? "border-t border-slate-100" : "",
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                  )}
                  onClick={() => cat.subClassifications.length > 0 && toggleExpanded(cat.id)}
                >
                  <button
                    className="flex items-center justify-center text-slate-500 group-hover:text-slate-700 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      cat.subClassifications.length > 0 && toggleExpanded(cat.id);
                    }}
                  >
                    {cat.subClassifications.length > 0 ? (
                      expandedIds.has(cat.id) ? (
                        <ChevronDown className="w-5 h-5 transition-transform" />
                      ) : (
                        <ChevronRight className="w-5 h-5 transition-transform" />
                      )
                    ) : null}
                  </button>
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-slate-950 transition-colors">{cat.description}</span>
                  <span className="text-center text-xs font-bold text-slate-600 tabular-nums">{cat.subClassifications.length}</span>
                  <div className="text-center">
                    <span className={cn(
                      "inline-block px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                      cat.status
                        ? "bg-emerald-100/80 text-emerald-700 group-hover:bg-emerald-100"
                        : "bg-slate-200/80 text-slate-600 group-hover:bg-slate-200"
                    )}>
                      {cat.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <span />
                </div>

                {/* Sub-classifications - conditionally visible */}
                {expandedIds.has(cat.id) && cat.subClassifications.length > 0 && (
                  <div className="bg-slate-50/60 border-t border-slate-100">
                    {/* Sub-items */}
                    {cat.subClassifications.map((sub, subIdx) => (
                      <div
                        key={sub.id}
                        className={cn(
                          "flex items-center justify-between px-12 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-blue-50/80 transition-all duration-150 group/item",
                          subIdx % 2 === 0 ? "bg-slate-50/20" : "bg-slate-50/50"
                        )}
                      >
                        <span className="text-sm text-slate-800 font-medium min-w-0 flex-1 group-hover/item:text-slate-950">{sub.description}</span>
                        <div className="flex gap-2 justify-end flex-shrink-0 ml-4 opacity-80 group-hover/item:opacity-100 transition-opacity">
                          <button
                            title="Edit"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50/80 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-all"
                            onClick={() => openEditSub(cat.id, sub)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            title="Remove"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-semibold text-red-600 bg-red-50/80 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-all"
                            onClick={() => handleDeleteSub(sub.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {cat.subClassifications.length === 0 && (
                  <div className="px-6 py-3 bg-slate-50/40 border-b border-slate-200 text-xs italic text-slate-500">
                    — No line items recorded
                  </div>
                )}
              </div>
            ))}

            {/* Ledger footer with totals */}
            </>
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