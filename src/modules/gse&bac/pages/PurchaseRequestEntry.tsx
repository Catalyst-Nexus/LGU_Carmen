import { useState, useEffect, useCallback } from "react";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
  DataTable,
  Tabs,
  IconButton,
} from "@/components/ui";
import {
  FileText,
  Plus,
  RefreshCw,
  Download,
  Pencil,
  Trash2,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";
import type {
  PurchaseRequest,
  PurchaseRequestFormData,
  ResponsibilityCenter,
  ResponsibilityCenterSection,
  Item,
  Unit,
  Spec,
} from "@/types/gse.types";
import {
  fetchPurchaseRequests,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  fetchPRLines,
  addPRLine,
  updatePRLine,
  deletePRLine,
  fetchResponsibilityCenters,
  fetchSections,
  createResponsibilityCenter,
  createResponsibilityCenterSection,
  generateNextPRNumber,
  getOrCreateItem,
  getOrCreateUnit,
  fetchItems,
  fetchUnits,
  fetchSpecs,
} from "@/services/gseService";

type ViewMode = "list" | "form";

type SpecEntry = {
  id: string;
  label: string;
  value: string;
};

type DraftRow = {
  localId: string;
  prl_id?: string;
  i_id: string;
  u_id: string;
  qty: string;
  unitPrice: string;
  specEntries: SpecEntry[];
  item_description: string;
  unit_code: string;
};

const newSpecEntry = (label = "", value = ""): SpecEntry => ({
  id: Math.random().toString(36).slice(2),
  label,
  value,
});

const emptyRow = (): DraftRow => ({
  localId: Math.random().toString(36).slice(2),
  i_id: "",
  u_id: "",
  qty: "",
  unitPrice: "",
  specEntries: [],
  item_description: "",
  unit_code: "",
});

const parseSpecEntries = (specifications: string | null): SpecEntry[] => {
  if (!specifications) return [];
  try {
    const parsed = JSON.parse(specifications);
    if (Array.isArray(parsed)) {
      return parsed.map((e: any) => ({
        id: Math.random().toString(36).slice(2),
        label: String(e.label ?? ""),
        value: String(e.value ?? ""),
      }));
    }
  } catch {
    // Legacy plain text — wrap as a single label entry
    if (specifications.trim()) {
      return [
        {
          id: Math.random().toString(36).slice(2),
          label: specifications.trim(),
          value: "",
        },
      ];
    }
  }
  return [];
};

const serializeSpecEntries = (entries: SpecEntry[]): string => {
  const cleaned = entries.filter((e) => e.label.trim() || e.value.trim());
  if (cleaned.length === 0) return "";
  return JSON.stringify(
    cleaned.map((e) => ({ label: e.label, value: e.value })),
  );
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500",
  SUBMITTED: "bg-blue-500/10 text-blue-500",
  APPROVED: "bg-green-500/10 text-green-500",
  REJECTED: "bg-red-500/10 text-red-500",
  CANCELLED: "bg-orange-500/10 text-orange-500",
};

const peso = (n: number) =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const PurchaseRequestEntry = () => {
  const [mode, setMode] = useState<ViewMode>("list");

  // ─── List state ─────────────────────────────────────────
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [listLoading, setListLoading] = useState(false);

  // ─── Form header state ─────────────────────────────────
  const [editingPR, setEditingPR] = useState<PurchaseRequest | null>(null);
  const [prNo, setPrNo] = useState("");
  const [prDate, setPrDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [rcId, setRcId] = useState("");
  const [rcsId, setRcsId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [remarks, setRemarks] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ─── Inline draft rows ──────────────────────────────────
  const [draftRows, setDraftRows] = useState<DraftRow[]>([emptyRow()]);
  const [removedPrlIds, setRemovedPrlIds] = useState<string[]>([]);

  // ─── Lookups ────────────────────────────────────────────
  const [centers, setCenters] = useState<ResponsibilityCenter[]>([]);
  const [sections, setSections] = useState<ResponsibilityCenterSection[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [allSpecs, setAllSpecs] = useState<Spec[]>([]);

  // ─── Quick-add department / section ────────────────────
  const [showAddDept, setShowAddDept] = useState(false);
  const [addDeptName, setAddDeptName] = useState("");
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [showAddSec, setShowAddSec] = useState(false);
  const [addSecName, setAddSecName] = useState("");
  const [isAddingSec, setIsAddingSec] = useState(false);

  // ───────────────────────────────────────────────────────
  // DATA LOADING
  // ───────────────────────────────────────────────────────

  const loadPRs = useCallback(async () => {
    setListLoading(true);
    const [data, rc] = await Promise.all([
      fetchPurchaseRequests(),
      fetchResponsibilityCenters(),
    ]);
    setPrs(data);
    setCenters(rc);
    setListLoading(false);
  }, []);

  useEffect(() => {
    loadPRs();
  }, [loadPRs]);

  useEffect(() => {
    if (rcId) {
      fetchSections(rcId).then(setSections);
    } else {
      setSections([]);
      setRcsId("");
    }
  }, [rcId]);

  // ───────────────────────────────────────────────────────
  // FORM OPEN / CLOSE
  // ───────────────────────────────────────────────────────

  const handleAddDept = async () => {
    if (!addDeptName.trim()) return;
    setIsAddingDept(true);
    const result = await createResponsibilityCenter(addDeptName.trim());
    if (result.success && result.id) {
      const updated = await fetchResponsibilityCenters();
      setCenters(updated);
      setRcId(result.id);
      setShowAddDept(false);
      setAddDeptName("");
    } else {
      alert(result.error || "Failed to create department");
    }
    setIsAddingDept(false);
  };

  const handleAddSection = async () => {
    if (!addSecName.trim() || !rcId) return;
    setIsAddingSec(true);
    const result = await createResponsibilityCenterSection(
      addSecName.trim(),
      rcId,
    );
    if (result.success && result.id) {
      const updated = await fetchSections(rcId);
      setSections(updated);
      setRcsId(result.id);
      setShowAddSec(false);
      setAddSecName("");
    } else {
      alert(result.error || "Failed to create section");
    }
    setIsAddingSec(false);
  };

  const openForm = async (pr?: PurchaseRequest) => {
    // Load all lookups in parallel
    const [rc, items, units, specs] = await Promise.all([
      centers.length === 0
        ? fetchResponsibilityCenters()
        : Promise.resolve(centers),
      fetchItems(),
      fetchUnits(),
      fetchSpecs(),
    ]);
    if (centers.length === 0) setCenters(rc);
    setAllItems(items);
    setAllUnits(units);
    setAllSpecs(specs);

    if (pr) {
      setEditingPR(pr);
      setPrNo(pr.pr_no || "");
      setPrDate(pr.pr_date);
      setRcId(pr.rc_id);
      setRcsId(pr.rcs_id || "");
      setPurpose(pr.purpose);
      setRemarks(pr.remarks || "");
      setRequestedBy(pr.requested_by || "");
      const loadedLines = await fetchPRLines(pr.pr_id);
      const rows: DraftRow[] = loadedLines.map((l) => ({
        localId: l.prl_id,
        prl_id: l.prl_id,
        i_id: l.i_id,
        u_id: l.u_id,
        qty: String(l.qty),
        unitPrice: String(l.unit_price_estimated),
        specEntries: parseSpecEntries(l.specifications ?? null),
        item_description: l.item_description || "",
        unit_code: l.unit_code || "",
      }));
      setDraftRows([...rows, emptyRow()]);
    } else {
      setEditingPR(null);
      const nextPrNo = await generateNextPRNumber();
      setPrNo(nextPrNo);
      setPrDate(new Date().toISOString().slice(0, 10));
      setRcId("");
      setRcsId("");
      setPurpose("");
      setRemarks("");
      setRequestedBy("");
      setDraftRows([emptyRow()]);
    }
    setRemovedPrlIds([]);
    setMode("form");
  };

  const closeForm = () => {
    setMode("list");
    setEditingPR(null);
    loadPRs();
  };

  // ───────────────────────────────────────────────────────
  // PR SAVE
  // ───────────────────────────────────────────────────────

  const handleSave = async (status?: string) => {
    if (!rcId || !purpose.trim()) {
      alert("Please fill in required fields (Department, Purpose)");
      return;
    }

    setIsSaving(true);
    const formData: PurchaseRequestFormData = {
      pr_no: prNo,
      pr_date: prDate,
      rc_id: rcId,
      rcs_id: rcsId,
      purpose: purpose.trim(),
      remarks: remarks.trim(),
      requested_by: requestedBy.trim(),
    };

    const validRows = draftRows.filter(
      (r) =>
        r.item_description.trim() &&
        r.unit_code.trim() &&
        r.qty &&
        parseFloat(r.qty) > 0,
    );

    if (editingPR) {
      const payload = status ? { ...formData, status } : formData;
      const updateResult = await updatePurchaseRequest(
        editingPR.pr_id,
        payload,
      );
      if (!updateResult.success) {
        setIsSaving(false);
        alert(updateResult.error || "Failed to update PR");
        return;
      }
      // Delete removed rows
      for (const id of removedPrlIds) {
        await deletePRLine(id);
      }
      // Update existing / insert new rows
      for (const row of validRows) {
        const resolvedIId =
          row.i_id || (await getOrCreateItem(row.item_description));
        const resolvedUId = row.u_id || (await getOrCreateUnit(row.unit_code));
        if (!resolvedIId || !resolvedUId) continue;
        const qty = parseFloat(row.qty);
        const unitPrice = parseFloat(row.unitPrice) || 0;
        const lineData = {
          i_id: resolvedIId,
          u_id: resolvedUId,
          qty,
          unit_price_estimated: unitPrice,
          prl_total_amount_estimated: qty * unitPrice,
          specifications: serializeSpecEntries(row.specEntries),
        };
        if (row.prl_id) {
          await updatePRLine(row.prl_id, lineData);
        } else {
          await addPRLine(editingPR.pr_id, lineData);
        }
      }
      // Update pr_total_amount on header
      const editTotal = validRows.reduce((sum, r) => {
        return sum + (parseFloat(r.qty) || 0) * (parseFloat(r.unitPrice) || 0);
      }, 0);
      await updatePurchaseRequest(editingPR.pr_id, {
        pr_total_amount: editTotal,
        ...(status ? { status } : {}),
      });
    } else {
      const result = await createPurchaseRequest(formData);
      if (!result.success || !result.pr_id) {
        setIsSaving(false);
        alert(result.error || "Failed to create PR");
        return;
      }
      for (const row of validRows) {
        const resolvedIId =
          row.i_id || (await getOrCreateItem(row.item_description));
        const resolvedUId = row.u_id || (await getOrCreateUnit(row.unit_code));
        if (!resolvedIId || !resolvedUId) continue;
        const qty = parseFloat(row.qty);
        const unitPrice = parseFloat(row.unitPrice) || 0;
        await addPRLine(result.pr_id, {
          i_id: resolvedIId,
          u_id: resolvedUId,
          qty,
          unit_price_estimated: unitPrice,
          prl_total_amount_estimated: qty * unitPrice,
          specifications: serializeSpecEntries(row.specEntries),
        });
      }
      // Update pr_total_amount on header
      const newTotal = validRows.reduce((sum, r) => {
        return sum + (parseFloat(r.qty) || 0) * (parseFloat(r.unitPrice) || 0);
      }, 0);
      await updatePurchaseRequest(result.pr_id, { pr_total_amount: newTotal });
    }
    setIsSaving(false);
    closeForm();
  };

  // ───────────────────────────────────────────────────────
  // DELETE PR
  // ───────────────────────────────────────────────────────

  const handleDeletePR = async (pr: PurchaseRequest) => {
    if (!confirm(`Delete PR ${pr.pr_no || pr.pr_id}?`)) return;
    const result = await deletePurchaseRequest(pr.pr_id);
    if (result.success) loadPRs();
    else alert(result.error || "Failed to delete PR");
  };

  // ───────────────────────────────────────────────────────
  // LINE ITEM CRUD
  // ───────────────────────────────────────────────────────

  const updateDraftRow = (localId: string, changes: Partial<DraftRow>) => {
    setDraftRows((prev) =>
      prev.map((r) => (r.localId === localId ? { ...r, ...changes } : r)),
    );
  };

  const removeDraftRow = (row: DraftRow) => {
    if (row.prl_id) setRemovedPrlIds((prev) => [...prev, row.prl_id!]);
    setDraftRows((prev) => prev.filter((r) => r.localId !== row.localId));
  };

  const addEmptyRow = () => {
    setDraftRows((prev) => [...prev, emptyRow()]);
  };

  // ─── Spec entry CRUD ─────────────────────────────────────

  const addSpecEntryToRow = (rowLocalId: string) => {
    setDraftRows((prev) =>
      prev.map((r) =>
        r.localId === rowLocalId
          ? { ...r, specEntries: [...r.specEntries, newSpecEntry()] }
          : r,
      ),
    );
  };

  const updateSpecEntryInRow = (
    rowLocalId: string,
    entryId: string,
    changes: Partial<SpecEntry>,
  ) => {
    setDraftRows((prev) =>
      prev.map((r) =>
        r.localId === rowLocalId
          ? {
              ...r,
              specEntries: r.specEntries.map((e) =>
                e.id === entryId ? { ...e, ...changes } : e,
              ),
            }
          : r,
      ),
    );
  };

  const removeSpecEntryFromRow = (rowLocalId: string, entryId: string) => {
    setDraftRows((prev) =>
      prev.map((r) =>
        r.localId === rowLocalId
          ? { ...r, specEntries: r.specEntries.filter((e) => e.id !== entryId) }
          : r,
      ),
    );
  };

  // ───────────────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────────────

  const rcName = (id: string) =>
    centers.find((c) => c.id === id)?.description ?? id;

  const total = draftRows.reduce((s, r) => {
    const q = parseFloat(r.qty) || 0;
    const p = parseFloat(r.unitPrice) || 0;
    return s + q * p;
  }, 0);

  const filtered = prs.filter((pr) => {
    const q = search.toLowerCase();
    const matchSearch =
      (pr.pr_no || "").toLowerCase().includes(q) ||
      pr.purpose.toLowerCase().includes(q) ||
      rcName(pr.rc_id).toLowerCase().includes(q);
    if (activeTab === "all") return matchSearch;
    return matchSearch && pr.status === activeTab;
  });

  // ═══════════════════════════════════════════════════════
  //  RENDER — DOCUMENT-STYLE FORM VIEW
  // ═══════════════════════════════════════════════════════

  if (mode === "form") {
    const cellBorder = "border border-gray-800";
    const cellPad = "px-3 py-2";
    const labelCls = "text-[10px] text-gray-500 font-medium uppercase";
    const inputCls =
      "block w-full text-xs bg-transparent border-0 border-b border-gray-300 py-0.5 focus:outline-none focus:border-gray-800";

    return (
      <div className="space-y-4 pb-10">
        {/* Top action bar */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={closeForm}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="flex gap-2">
            {(!editingPR || editingPR.status === "DRAFT") && (
              <button
                onClick={() => handleSave()}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingPR ? "Save Changes" : "Save as Draft"}
              </button>
            )}
            {editingPR && editingPR.status === "DRAFT" && (
              <button
                onClick={() => handleSave("SUBMITTED")}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit
              </button>
            )}
            {editingPR && editingPR.status !== "DRAFT" && (
              <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium border border-gray-300">
                Read-only — {editingPR.status}
              </span>
            )}
          </div>
        </div>

        {/* ── Paper document ─────────────────────────────── */}
        <div className="bg-white border-2 border-gray-800 max-w-7xl mx-auto shadow-lg print:shadow-none text-gray-900">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 py-4 px-6">
            <h1 className="font-bold text-lg tracking-widest">
              PURCHASE REQUEST
            </h1>
          </div>

          {/* ── Meta fields (3 rows × 3 cols) ──────────── */}
          <table className="w-full text-xs border-collapse border-b-2 border-gray-800">
            <colgroup>
              <col style={{ width: "52%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <tbody>
              {/* Row 1 */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-l-0`}
                >
                  <span className={labelCls}>Procuring Entity:</span>
                </td>
                <td className={`${cellBorder} ${cellPad} border-t-0`}>
                  <span className={labelCls}>PR No.</span>
                  <div className="font-semibold mt-0.5">
                    {prNo || "(generating...)"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-r-0`}
                >
                  <span className={labelCls}>Date:</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={prDate}
                    onChange={(e) => setPrDate(e.target.value)}
                  />
                </td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <span className={labelCls}>Department:</span>
                  <div className="flex items-center gap-1">
                    <select
                      className={inputCls + " flex-1"}
                      value={rcId}
                      onChange={(e) => setRcId(e.target.value)}
                    >
                      <option value="">-- Select Department --</option>
                      {centers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.description}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      title="Add new department"
                      onClick={() => {
                        setShowAddDept((v) => !v);
                        setAddDeptName("");
                      }}
                      className="shrink-0 text-green-700 hover:text-green-900"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {showAddDept && (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        autoFocus
                        className={inputCls + " flex-1"}
                        placeholder="New department name"
                        value={addDeptName}
                        onChange={(e) => setAddDeptName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddDept()}
                      />
                      <button
                        type="button"
                        disabled={isAddingDept || !addDeptName.trim()}
                        onClick={handleAddDept}
                        className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded disabled:opacity-50"
                      >
                        {isAddingDept ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddDept(false);
                          setAddDeptName("");
                        }}
                        className="text-xs text-gray-400 hover:text-gray-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
                <td className={`${cellBorder} ${cellPad}`}>
                  <span className={labelCls}>SAI No.</span>
                </td>
                <td className={`${cellBorder} ${cellPad} border-r-0`}>
                  <span className={labelCls}>Date:</span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-l-0 border-b-0`}
                >
                  <span className={labelCls}>Section:</span>
                  <div className="flex items-center gap-1">
                    <select
                      className={inputCls + " flex-1"}
                      value={rcsId}
                      onChange={(e) => setRcsId(e.target.value)}
                      disabled={!rcId}
                    >
                      <option value="">-- None --</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.description}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      title="Add new section"
                      disabled={!rcId}
                      onClick={() => {
                        setShowAddSec((v) => !v);
                        setAddSecName("");
                      }}
                      className="shrink-0 text-green-700 hover:text-green-900 disabled:opacity-30"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {showAddSec && rcId && (
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        autoFocus
                        className={inputCls + " flex-1"}
                        placeholder="New section name"
                        value={addSecName}
                        onChange={(e) => setAddSecName(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleAddSection()
                        }
                      />
                      <button
                        type="button"
                        disabled={isAddingSec || !addSecName.trim()}
                        onClick={handleAddSection}
                        className="text-xs text-white bg-green-600 hover:bg-green-700 px-2 py-0.5 rounded disabled:opacity-50"
                      >
                        {isAddingSec ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSec(false);
                          setAddSecName("");
                        }}
                        className="text-xs text-gray-400 hover:text-gray-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
                <td className={`${cellBorder} ${cellPad} border-b-0`}>
                  <span className={labelCls}>ALOBS No.</span>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-r-0 border-b-0`}
                >
                  <span className={labelCls}>Date:</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Line items table ───────────────────────── */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-800 bg-gray-50">
                <th className="border-r border-gray-800 px-2 py-2.5 font-semibold text-center w-14">
                  ITEM
                  <br />
                  No.
                </th>
                <th className="border-r border-gray-800 px-2 py-2.5 font-semibold text-center w-14">
                  QTY
                </th>
                <th className="border-r border-gray-800 px-2 py-2.5 font-semibold text-center w-20">
                  UNIT OF
                  <br />
                  ISSUE
                </th>
                <th className="border-r border-gray-800 px-2 py-2.5 font-semibold text-left">
                  ITEM DESCRIPTION
                </th>
                <th className="border-r border-gray-800 px-2 py-2.5 font-semibold text-center w-28">
                  ESTIMATED
                  <br />
                  UNIT COST
                </th>
                <th className="px-2 py-2.5 font-semibold text-center w-28">
                  ESTIMATED
                  <br />
                  AMOUNT
                </th>
              </tr>
            </thead>

            <tbody>
              {draftRows.map((row, idx) => {
                const rowQty = parseFloat(row.qty) || 0;
                const rowPrice = parseFloat(row.unitPrice) || 0;
                const rowAmount = rowQty * rowPrice;
                const hasContent = !!(
                  row.item_description ||
                  row.qty ||
                  row.unitPrice
                );
                return (
                  <tr key={row.localId} className="border-b border-gray-300">
                    <td className="border-r border-gray-800 px-2 py-1 text-center align-top text-xs">
                      {hasContent ? idx + 1 : ""}
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.001"
                        className="w-full text-xs text-center bg-transparent border-0 border-b border-transparent focus:border-gray-500 py-0.5 focus:outline-none"
                        placeholder="0"
                        value={row.qty}
                        onChange={(e) =>
                          updateDraftRow(row.localId, { qty: e.target.value })
                        }
                      />
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 align-top">
                      <select
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-gray-500 py-0.5 focus:outline-none"
                        value={row.u_id}
                        onChange={(e) => {
                          const uid = e.target.value;
                          const unit = allUnits.find((u) => u.id === uid);
                          updateDraftRow(row.localId, {
                            u_id: uid,
                            unit_code: unit?.u_code || "",
                          });
                        }}
                      >
                        <option value="">--</option>
                        {allUnits.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.u_code}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 align-top">
                      <input
                        type="text"
                        list={`items-list-${row.localId}`}
                        className="w-full text-xs bg-transparent border-0 border-b border-transparent focus:border-gray-500 py-0.5 focus:outline-none font-semibold"
                        placeholder="Item description"
                        value={row.item_description}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = allItems.find(
                            (it) => it.description === val,
                          );
                          if (matched) {
                            const defUnit = allUnits.find(
                              (u) => u.id === matched.default_u_id,
                            );
                            updateDraftRow(row.localId, {
                              item_description: val,
                              i_id: matched.id,
                              ...(defUnit
                                ? {
                                    u_id: defUnit.id,
                                    unit_code: defUnit.u_code,
                                  }
                                : {}),
                            });
                          } else {
                            updateDraftRow(row.localId, {
                              item_description: val,
                              i_id: "",
                            });
                          }
                        }}
                      />
                      <datalist id={`items-list-${row.localId}`}>
                        {allItems.map((it) => (
                          <option key={it.id} value={it.description} />
                        ))}
                      </datalist>

                      {/* ── Structured specs editor ───── */}
                      {row.specEntries.length > 0 && (
                        <div className="mt-2 border-t border-gray-200 pt-1">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
                            Specs:
                          </span>
                          {row.specEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-start gap-1 mt-1 group"
                            >
                              {/* Bold label input */}
                              <input
                                list="specs-datalist"
                                value={entry.label}
                                placeholder="Spec name"
                                className="text-[11px] font-bold bg-transparent border-0 border-b border-transparent focus:border-gray-400 py-0 focus:outline-none w-[38%] min-w-0"
                                onChange={(e) =>
                                  updateSpecEntryInRow(row.localId, entry.id, {
                                    label: e.target.value,
                                  })
                                }
                              />
                              <span className="text-[11px] font-bold shrink-0 mt-0.5">
                                :
                              </span>
                              {/* Value input */}
                              <input
                                value={entry.value}
                                placeholder="value"
                                className="text-[11px] flex-1 bg-transparent border-0 border-b border-transparent focus:border-gray-400 py-0 focus:outline-none min-w-0 text-gray-700"
                                onChange={(e) =>
                                  updateSpecEntryInRow(row.localId, entry.id, {
                                    value: e.target.value,
                                  })
                                }
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeSpecEntryFromRow(row.localId, entry.id)
                                }
                                className="text-gray-300 hover:text-red-500 text-xs leading-none opacity-0 group-hover:opacity-100 shrink-0 print:hidden"
                                title="Remove spec row"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => addSpecEntryToRow(row.localId)}
                        className="mt-1.5 flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 font-medium print:hidden"
                      >
                        <Plus className="w-3 h-3" />
                        Add Spec
                      </button>
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 align-top">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full text-xs text-right bg-transparent border-0 border-b border-transparent focus:border-gray-500 py-0.5 focus:outline-none"
                        placeholder="0.00"
                        value={row.unitPrice}
                        onChange={(e) =>
                          updateDraftRow(row.localId, {
                            unitPrice: e.target.value,
                          })
                        }
                      />
                    </td>
                    <td className="px-2 py-1 text-right align-top text-xs font-medium">
                      <div className="flex items-center justify-end gap-1">
                        <span>{rowAmount > 0 ? peso(rowAmount) : ""}</span>
                        <button
                          type="button"
                          onClick={() => removeDraftRow(row)}
                          className="text-gray-300 hover:text-red-500 print:hidden leading-none"
                          title="Remove row"
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Add row button */}
              <tr className="border-b border-gray-300 print:hidden">
                <td colSpan={6} className="px-3 py-1.5">
                  <button
                    type="button"
                    onClick={addEmptyRow}
                    className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Row
                  </button>
                </td>
              </tr>

              {/* Nothing Follows */}
              {draftRows.some((r) => r.item_description) && (
                <tr className="border-b border-gray-300">
                  <td
                    colSpan={4}
                    className="border-r border-gray-800 px-2 py-2 text-center italic text-gray-400 text-[11px]"
                  >
                    xxxxxNothing Followsxxxxx
                  </td>
                  <td className="border-r border-gray-800 px-2 py-2">&nbsp;</td>
                  <td className="px-2 py-2">&nbsp;</td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr className="border-t-2 border-gray-800">
                <td
                  colSpan={4}
                  className="border-r border-gray-800 px-3 py-2.5"
                />
                <td className="border-r border-gray-800 px-2 py-2.5 text-right font-bold">
                  TOTAL
                </td>
                <td className="px-2 py-2.5 text-right font-bold">
                  {peso(total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* ── Purpose ────────────────────────────────── */}
          <div className="border-t-2 border-gray-800 px-3 py-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0 pt-1">
                Purpose
              </span>
              <textarea
                className="flex-1 text-xs border-0 border-b border-gray-300 bg-transparent resize-none py-0.5 focus:outline-none focus:border-gray-800"
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Purpose of the purchase request"
              />
            </div>
          </div>

          {/* ── Request by ─────────────────────────────── */}
          <div className="border-t border-gray-800 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0">
                Request by :
              </span>
              <input
                type="text"
                className="flex-1 text-xs border-0 border-b border-gray-300 bg-transparent py-0.5 focus:outline-none focus:border-gray-800"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder="Name of requesting officer"
              />
            </div>
          </div>
        </div>

        {/* Shared datalist for spec names from gse.specs table */}
        <datalist id="specs-datalist">
          {allSpecs.map((s) => (
            <option key={s.id} value={s.description} />
          ))}
        </datalist>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER — LIST VIEW
  // ═══════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Request Entry"
        subtitle="Create and manage Purchase Requests (PR)"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total PRs" value={prs.length} />
        <StatCard
          label="Draft"
          value={prs.filter((p) => p.status === "DRAFT").length}
          color="default"
        />
        <StatCard
          label="Submitted"
          value={prs.filter((p) => p.status === "SUBMITTED").length}
          color="primary"
        />
        <StatCard
          label="Approved"
          value={prs.filter((p) => p.status === "APPROVED").length}
          color="success"
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "DRAFT", label: "Draft" },
          { id: "SUBMITTED", label: "Submitted" },
          { id: "APPROVED", label: "Approved" },
          { id: "REJECTED", label: "Rejected" },
          { id: "CANCELLED", label: "Cancelled" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          New PR
        </PrimaryButton>
        <PrimaryButton onClick={loadPRs} disabled={listLoading}>
          <RefreshCw
            className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </PrimaryButton>
        <PrimaryButton onClick={() => {}}>
          <Download className="w-4 h-4" />
          Export
        </PrimaryButton>
      </ActionsBar>

      <DataTable<PurchaseRequest>
        data={filtered}
        columns={[
          { key: "pr_no", header: "PR No." },
          { key: "pr_date", header: "Date" },
          {
            key: "rc_id",
            header: "Department",
            render: (row) => <span>{rcName(row.rc_id)}</span>,
          },
          {
            key: "purpose",
            header: "Purpose",
            render: (row) => (
              <span className="truncate max-w-50 block">{row.purpose}</span>
            ),
          },
          {
            key: "pr_total_amount",
            header: "Total",
            render: (row) => (
              <span className="font-semibold">
                ₱{peso(row.pr_total_amount ?? 0)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[row.status]}`}
              >
                {row.status}
              </span>
            ),
          },
          {
            key: "actions" as any,
            header: "Actions",
            render: (row) => (
              <div className="flex gap-1">
                {row.status === "DRAFT" ? (
                  <IconButton onClick={() => openForm(row)} title="Edit">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                ) : (
                  <IconButton
                    onClick={() => openForm(row)}
                    title="View (read-only)"
                    disabled
                  >
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleDeletePR(row)}
                  title="Delete"
                  variant="danger"
                  disabled={row.status !== "DRAFT"}
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
        title={`Purchase Requests (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by PR no., purpose, or department..."
        emptyMessage={
          listLoading
            ? "Loading purchase requests…"
            : "No purchase requests found."
        }
      />
    </div>
  );
};

export default PurchaseRequestEntry;
