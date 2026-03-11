import { useState, useEffect, useCallback } from "react";
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
  FileText,
  Plus,
  RefreshCw,
  Download,
  Eye,
  ArrowLeft,
  Trophy,
  Save,
} from "lucide-react";
import type {
  Abstract,
  Supplier,
  ModeProcurement,
  DeliveryTerm,
  PaymentTerm,
  PurchaseRequest,
  PurchaseRequestLine,
  AbstractFormData,
  BidtureFormData,
} from "@/types/gse.types";
import {
  fetchAbstracts,
  fetchBidtures,
  fetchSuppliers,
  fetchModesProcurement,
  fetchDeliveryTerms,
  fetchPaymentTerms,
  fetchSubmittedPRs,
  fetchPRLinesForAbstract,
  generateNextAbstractNumber,
  createAbstract,
  updateAbstract,
  upsertBidtures,
  createSupplier,
  createModeProcurement,
  createDeliveryTerm,
  createPaymentTerm,
} from "@/services/bacService";
import { fetchResponsibilityCenters } from "@/services/gseService";
import type { ResponsibilityCenter } from "@/types/gse.types";

// ────────────────────────────────────────────────────────────
// HELPERS & TYPES
// ────────────────────────────────────────────────────────────

type ViewMode = "list" | "form";

/** Per-supplier bid for a single PR line item */
type BidCell = {
  unitPriceBid: string;
};

/** A supplier column in the bidding sheet */
type SupplierColumn = {
  localId: string;
  s_id: string;
  name: string;
  address: string;
  contact: string;
  tin: string;
};

const peso = (n: number) =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2 });

const parseSpecEntries = (
  specifications: string | null,
): { label: string; value: string }[] => {
  if (!specifications) return [];
  try {
    const parsed = JSON.parse(specifications);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    if (specifications.trim())
      return [{ label: specifications.trim(), value: "" }];
  }
  return [];
};

// ════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════

const AbstractOfBids = () => {
  const [mode, setMode] = useState<ViewMode>("list");

  // ─── List state ─────────────────────────────────
  const [abstracts, setAbstracts] = useState<Abstract[]>([]);
  const [search, setSearch] = useState("");
  const [listLoading, setListLoading] = useState(false);

  // ─── Form header state ──────────────────────────
  const [aNo, setANo] = useState("");
  const [aDate, setADate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [mpId, setMpId] = useState("");
  const [prId, setPrId] = useState("");
  const [approvedBudget, setApprovedBudget] = useState("");
  const [abstractRemarks, setAbstractRemarks] = useState("");

  // ─── PR line items (rows of the bid table) ──────
  const [prLines, setPrLines] = useState<PurchaseRequestLine[]>([]);

  // ─── Supplier columns ──────────────────────────
  const [supplierCols, setSupplierCols] = useState<SupplierColumn[]>([]);
  /** bids[supplierLocalId][prl_id] = BidCell */
  const [bids, setBids] = useState<Record<string, Record<string, BidCell>>>({});
  /** Track which supplier column is the winner */
  const [winnerColId, setWinnerColId] = useState<string | null>(null);

  // ─── Lookups ────────────────────────────────────
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [modes, setModes] = useState<ModeProcurement[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<DeliveryTerm[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [submittedPRs, setSubmittedPRs] = useState<PurchaseRequest[]>([]);
  const [centers, setCenters] = useState<ResponsibilityCenter[]>([]);

  // ─── Selected delivery / payment term ──────────
  const [dtId, setDtId] = useState("");
  const [ptId, setPtId] = useState("");

  // ─── Quick-add supplier ────────────────────────
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupName, setNewSupName] = useState("");
  const [newSupAddr, setNewSupAddr] = useState("");
  const [newSupContact, setNewSupContact] = useState("");
  const [newSupTin, setNewSupTin] = useState("");
  const [isAddingSup, setIsAddingSup] = useState(false);

  // ─── Quick-add mode of procurement ─────────────
  const [showAddMode, setShowAddMode] = useState(false);
  const [newModeName, setNewModeName] = useState("");
  const [isAddingMode, setIsAddingMode] = useState(false);

  // ─── Quick-add delivery term ──────────────────
  const [showAddDt, setShowAddDt] = useState(false);
  const [newDtName, setNewDtName] = useState("");
  const [isAddingDt, setIsAddingDt] = useState(false);

  // ─── Quick-add payment term ──────────────────
  const [showAddPt, setShowAddPt] = useState(false);
  const [newPtName, setNewPtName] = useState("");
  const [isAddingPt, setIsAddingPt] = useState(false);

  // ─── Form mode ─────────────────────────────────
  const [isNewAbstract, setIsNewAbstract] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Form validation error ──────────────────────
  const [formError, setFormError] = useState("");

  // ───────────────────────────────────────────────
  // DATA LOADING
  // ───────────────────────────────────────────────

  const loadList = useCallback(async () => {
    setListLoading(true);
    const [abs, prs, rc, mp, dt, pt, sups] = await Promise.all([
      fetchAbstracts(),
      fetchSubmittedPRs(),
      fetchResponsibilityCenters(),
      fetchModesProcurement(),
      fetchDeliveryTerms(),
      fetchPaymentTerms(),
      fetchSuppliers(),
    ]);
    setAbstracts(abs);
    setSubmittedPRs(prs);
    setCenters(rc);
    setModes(mp);
    setDeliveryTerms(dt);
    setPaymentTerms(pt);
    setSuppliers(sups);
    setListLoading(false);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // When PR changes in form, load its line items and auto-fill budget
  useEffect(() => {
    if (mode === "form" && prId) {
      fetchPRLinesForAbstract(prId).then(setPrLines);
      // Always derive approved budget from the selected PR
      const pr = submittedPRs.find((p) => p.pr_id === prId);
      if (pr) {
        setApprovedBudget(String(pr.pr_total_amount ?? 0));
      }
    } else if (mode === "form" && !prId) {
      setPrLines([]);
      setApprovedBudget("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prId, mode]);

  // ───────────────────────────────────────────────
  // FORM OPEN / CLOSE
  // ───────────────────────────────────────────────

  const openForm = async (abs?: Abstract) => {
    const [sups, mp, dt, pt, prs, rc] = await Promise.all([
      fetchSuppliers(),
      modes.length ? Promise.resolve(modes) : fetchModesProcurement(),
      deliveryTerms.length
        ? Promise.resolve(deliveryTerms)
        : fetchDeliveryTerms(),
      paymentTerms.length ? Promise.resolve(paymentTerms) : fetchPaymentTerms(),
      submittedPRs.length ? Promise.resolve(submittedPRs) : fetchSubmittedPRs(),
      centers.length ? Promise.resolve(centers) : fetchResponsibilityCenters(),
    ]);
    setSuppliers(sups);
    setModes(mp);
    setDeliveryTerms(dt);
    setPaymentTerms(pt);
    setSubmittedPRs(prs);
    setCenters(rc);

    if (abs) {
      setIsNewAbstract(false);
      setANo(abs.a_no);
      setADate(abs.a_date);
      setMpId(abs.mp_id);
      setPrId(abs.pr_id);
      setApprovedBudget(String(abs.approved_budget));
      setDtId(abs.dt_id || "");
      setPtId(abs.pt_id || "");
      setAbstractRemarks(abs.remarks || "");

      // Load PR lines
      const lines = await fetchPRLinesForAbstract(abs.pr_id);
      setPrLines(lines);

      // Load existing bidtures
      const existingBids = await fetchBidtures(abs.a_id);

      // Reconstruct supplier columns and bids from bidture data
      const supMap = new Map<string, SupplierColumn>();
      const bidMap: Record<string, Record<string, BidCell>> = {};
      let winCol: string | null = null;

      for (const b of existingBids) {
        let col = supMap.get(b.s_id);
        if (!col) {
          const sup = sups.find((s) => s.s_id === b.s_id);
          col = {
            localId: b.s_id,
            s_id: b.s_id,
            name: sup?.description ?? "",
            address: sup?.address ?? "",
            contact: sup?.contact ?? "",
            tin: sup?.tin ?? "",
          };
          supMap.set(b.s_id, col);
          bidMap[b.s_id] = {};
        }
        bidMap[b.s_id][b.prl_id] = {
          unitPriceBid: String(b.unit_price_bid),
        };
        if (b.winner_status) winCol = b.s_id;
      }

      setSupplierCols(Array.from(supMap.values()));
      setBids(bidMap);
      setWinnerColId(winCol);
    } else {
      // New mode
      setIsNewAbstract(true);
      const nextNo = await generateNextAbstractNumber();
      setANo(nextNo);
      setADate(new Date().toISOString().slice(0, 10));
      setMpId("");
      setPrId("");
      setApprovedBudget("");
      setDtId("");
      setPtId("");
      setAbstractRemarks("");
      setPrLines([]);
      setSupplierCols([]);
      setBids({});
      setWinnerColId(null);
    }
    setMode("form");
  };

  const closeForm = () => {
    setMode("list");
    loadList();
  };

  // ───────────────────────────────────────────────
  // SUPPLIER COLUMN MANAGEMENT
  // ───────────────────────────────────────────────

  const addSupplierColumn = (s: Supplier) => {
    if (supplierCols.find((c) => c.s_id === s.s_id)) return; // no duplicates
    const col: SupplierColumn = {
      localId: s.s_id,
      s_id: s.s_id,
      name: s.description,
      address: s.address || "",
      contact: s.contact || "",
      tin: s.tin || "",
    };
    setSupplierCols((prev) => [...prev, col]);
    // Initialize empty bids for this supplier
    setBids((prev) => ({
      ...prev,
      [col.localId]: {},
    }));
  };

  const removeSupplierColumn = (localId: string) => {
    setSupplierCols((prev) => prev.filter((c) => c.localId !== localId));
    setBids((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
    if (winnerColId === localId) setWinnerColId(null);
  };

  const updateBidCell = (
    supLocalId: string,
    prlId: string,
    unitPrice: string,
  ) => {
    setBids((prev) => ({
      ...prev,
      [supLocalId]: {
        ...(prev[supLocalId] || {}),
        [prlId]: { unitPriceBid: unitPrice },
      },
    }));
  };

  /** Total bid amount for a supplier column */
  const supplierTotal = (supLocalId: string): number => {
    const supBids = bids[supLocalId] || {};
    return prLines.reduce((sum, line) => {
      const cell = supBids[line.prl_id];
      const price = parseFloat(cell?.unitPriceBid || "0") || 0;
      return sum + price * line.qty;
    }, 0);
  };

  // ───────────────────────────────────────────────
  // QUICK-ADD SUPPLIER
  // ───────────────────────────────────────────────

  const handleAddSupplier = async () => {
    if (!newSupName.trim()) return;
    setIsAddingSup(true);
    const result = await createSupplier(
      newSupName,
      newSupAddr,
      newSupContact,
      newSupTin,
    );
    if (result.success && result.s_id) {
      const sups = await fetchSuppliers();
      setSuppliers(sups);
      const created = sups.find((s) => s.s_id === result.s_id);
      if (created) addSupplierColumn(created);
      setShowAddSupplier(false);
      setNewSupName("");
      setNewSupAddr("");
      setNewSupContact("");
      setNewSupTin("");
    } else {
      setFormError(result.error || "Failed to create supplier");
    }
    setIsAddingSup(false);
  };

  // ───────────────────────────────────────────────
  // SAVE
  // ───────────────────────────────────────────────

  const handleAddMode = async () => {
    if (!newModeName.trim()) return;
    setIsAddingMode(true);
    const result = await createModeProcurement(newModeName);
    if (result.success && result.mp_id) {
      const updated = await fetchModesProcurement();
      setModes(updated);
      setMpId(result.mp_id);
      setFormError("");
      setShowAddMode(false);
      setNewModeName("");
    } else {
      setFormError(result.error || "Failed to create mode of procurement");
    }
    setIsAddingMode(false);
  };

  const handleAddDeliveryTerm = async () => {
    if (!newDtName.trim()) return;
    setIsAddingDt(true);
    const result = await createDeliveryTerm(newDtName);
    if (result.success && result.dt_id) {
      const updated = await fetchDeliveryTerms();
      setDeliveryTerms(updated);
      setDtId(result.dt_id);
      setShowAddDt(false);
      setNewDtName("");
    } else {
      setFormError(result.error || "Failed to create delivery term");
    }
    setIsAddingDt(false);
  };

  const handleAddPaymentTerm = async () => {
    if (!newPtName.trim()) return;
    setIsAddingPt(true);
    const result = await createPaymentTerm(newPtName);
    if (result.success && result.pt_id) {
      const updated = await fetchPaymentTerms();
      setPaymentTerms(updated);
      setPtId(result.pt_id);
      setShowAddPt(false);
      setNewPtName("");
    } else {
      setFormError(result.error || "Failed to create payment term");
    }
    setIsAddingPt(false);
  };

  // ───────────────────────────────────────────────
  // SAVE (new abstract)
  // ───────────────────────────────────────────────

  const buildBidtureRows = (aId: string): BidtureFormData[] => {
    const rows: BidtureFormData[] = [];
    for (const col of supplierCols) {
      for (const line of prLines) {
        const cell = bids[col.localId]?.[line.prl_id];
        const price = parseFloat(cell?.unitPriceBid || "0") || 0;
        rows.push({
          a_id: aId,
          s_id: col.s_id,
          prl_id: line.prl_id,
          unit_price_bid: price,
          unit_total_amount_bid: price * line.qty,
          winner_status: winnerColId === col.localId,
        });
      }
    }
    return rows;
  };

  const handleSave = async () => {
    setFormError("");
    if (!mpId) {
      setFormError("Please select a Mode of Procurement.");
      return;
    }
    if (!prId) {
      setFormError("Please select a Purchase Request.");
      return;
    }
    if (!winnerColId) {
      setFormError("Please select a winning supplier before saving.");
      return;
    }

    const winnerSup = supplierCols.find((c) => c.localId === winnerColId);
    if (!winnerSup) {
      setFormError("Winner supplier not found.");
      return;
    }

    setIsSaving(true);
    const formData: AbstractFormData = {
      a_no: aNo,
      a_date: aDate,
      mp_id: mpId,
      pr_id: prId,
      approved_budget: parseFloat(approvedBudget) || 0,
      dt_id: dtId || null,
      pt_id: ptId || null,
      status: "AWARDED",
      remarks: abstractRemarks || undefined,
    };

    const createResult = await createAbstract(formData);
    if (!createResult.success || !createResult.a_id) {
      setFormError(createResult.error || "Failed to create abstract.");
      setIsSaving(false);
      return;
    }

    const aId = createResult.a_id;

    // Save winning_b_id on abstract
    await updateAbstract(aId, { winning_b_id: winnerSup.s_id });

    // Save bidture rows
    if (supplierCols.length > 0 && prLines.length > 0) {
      const rows = buildBidtureRows(aId);
      const bidResult = await upsertBidtures(rows);
      if (!bidResult.success) {
        setFormError(
          bidResult.error || "Abstract saved but failed to save bid rows.",
        );
        setIsSaving(false);
        return;
      }
    }

    setIsSaving(false);
    closeForm();
  };

  // ───────────────────────────────────────────────
  // HELPERS
  // ───────────────────────────────────────────────

  const rcName = (rcId: string) =>
    centers.find((c) => c.id === rcId)?.description ?? rcId;

  const prLabel = (id: string) => {
    const pr = submittedPRs.find((p) => p.pr_id === id);
    return pr?.pr_no || id;
  };

  const mpLabel = (id: string) =>
    modes.find((m) => m.mp_id === id)?.description ?? id;

  const winnerLabel = (winningSId: string | null) => {
    if (!winningSId) return "";
    return suppliers.find((s) => s.s_id === winningSId)?.description ?? "";
  };

  const filtered = abstracts.filter((a) => {
    const q = search.toLowerCase();
    return (
      (a.a_no || "").toLowerCase().includes(q) ||
      prLabel(a.pr_id).toLowerCase().includes(q) ||
      mpLabel(a.mp_id).toLowerCase().includes(q)
    );
  });

  // ═══════════════════════════════════════════════
  //  RENDER — DOCUMENT FORM VIEW
  // ═══════════════════════════════════════════════

  if (mode === "form") {
    const isReadOnly = !isNewAbstract; // false when creating, true when viewing existing
    const cellBorder = "border border-gray-800";
    const cellPad = "px-3 py-2";
    const labelCls = "text-[10px] text-gray-500 font-medium uppercase";
    const inputCls =
      "block w-full text-xs bg-transparent border-0 border-b border-gray-300 py-0.5 focus:outline-none focus:border-gray-800";

    return (
      <div className="space-y-4 pb-10">
        {/* Top action bar */}
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <button
            onClick={closeForm}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="flex gap-2">
            {isNewAbstract ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Abstract"}
              </button>
            ) : (
              <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-300">
                <Trophy className="w-4 h-4" />
                View Only — Winner Declared
              </span>
            )}
          </div>
        </div>

        {/* Inline form error */}
        {formError && (
          <div className="max-w-[1400px] mx-auto bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center justify-between">
            <span>{formError}</span>
            <button
              type="button"
              onClick={() => setFormError("")}
              className="text-red-400 hover:text-red-700 text-base leading-none ml-3"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Paper document ────────────────────────── */}
        <div className="bg-white border-2 border-gray-800 max-w-[1400px] mx-auto shadow-lg print:shadow-none text-gray-900 overflow-x-auto">
          {/* Title */}
          <div className="text-center border-b-2 border-gray-800 py-4 px-6">
            <h1 className="font-bold text-lg tracking-widest">
              ABSTRACT OF BID AS CALCULATED
            </h1>
          </div>

          {/* ── Meta fields ──────────────────────────── */}
          <table className="w-full text-xs border-collapse border-b-2 border-gray-800">
            <tbody>
              {/* Row 1 */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-l-0`}
                  style={{ width: "40%" }}
                >
                  <span className={labelCls}>
                    Implementing Office / Requesting Dept.:
                  </span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {prId
                      ? (() => {
                          const pr = submittedPRs.find((p) => p.pr_id === prId);
                          return pr ? rcName(pr.rc_id) : "—";
                        })()
                      : "—"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0`}
                  style={{ width: "30%" }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={labelCls}>Mode of Procurement:</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMode((v) => !v);
                          setNewModeName("");
                        }}
                        className="flex items-center gap-0.5 text-[9px] text-blue-600 hover:text-blue-800 font-semibold print:hidden"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    )}
                  </div>
                  <select
                    className={inputCls}
                    value={mpId}
                    onChange={(e) => {
                      setMpId(e.target.value);
                      setFormError("");
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="">-- Select --</option>
                    {modes.map((m) => (
                      <option key={m.mp_id} value={m.mp_id}>
                        {m.description}
                      </option>
                    ))}
                  </select>
                  {showAddMode && !isReadOnly && (
                    <div className="mt-1.5 flex items-end gap-1.5 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-500 font-medium block">
                          Description *
                        </label>
                        <input
                          autoFocus
                          className="block text-xs border border-gray-300 rounded px-2 py-0.5 w-full mt-0.5"
                          value={newModeName}
                          onChange={(e) => setNewModeName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddMode();
                          }}
                          placeholder="e.g. Public Bidding"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isAddingMode || !newModeName.trim()}
                        onClick={handleAddMode}
                        className="text-[10px] text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {isAddingMode ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddMode(false)}
                        className="text-[10px] text-gray-400 hover:text-gray-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-r-0`}
                  style={{ width: "30%" }}
                >
                  <span className={labelCls}>Abstract No.</span>
                  <div className="font-semibold mt-0.5">
                    {aNo || "(generating...)"}
                  </div>
                </td>
              </tr>

              {/* Row 2 */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-l-0 border-b-0`}
                >
                  <span className={labelCls}>
                    Approved Budget for the Contract:
                  </span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {approvedBudget
                      ? peso(parseFloat(approvedBudget))
                      : prId
                        ? "0.00"
                        : "—"}
                  </div>
                </td>
                <td className={`${cellBorder} ${cellPad} border-b-0`}>
                  <span className={labelCls}>Purchase Request Number:</span>
                  <select
                    className={inputCls}
                    value={prId}
                    onChange={(e) => setPrId(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">-- Select PR --</option>
                    {submittedPRs.map((pr) => (
                      <option key={pr.pr_id} value={pr.pr_id}>
                        {pr.pr_no} — {pr.purpose}
                      </option>
                    ))}
                  </select>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-r-0 border-b-0`}
                >
                  <span className={labelCls}>Date:</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={aDate}
                    onChange={(e) => setADate(e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
              </tr>

              {/* Row 3 — Delivery Term + Payment Term */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-l-0 border-b-0`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={labelCls}>Delivery Term:</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddDt((v) => !v);
                          setNewDtName("");
                        }}
                        className="flex items-center gap-0.5 text-[9px] text-blue-600 hover:text-blue-800 font-semibold print:hidden"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    )}
                  </div>
                  <select
                    className={inputCls}
                    value={dtId}
                    onChange={(e) => setDtId(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">-- Select --</option>
                    {deliveryTerms.map((d) => (
                      <option key={d.dt_id} value={d.dt_id}>
                        {d.description}
                      </option>
                    ))}
                  </select>
                  {showAddDt && !isReadOnly && (
                    <div className="mt-1.5 flex items-end gap-1.5 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-500 font-medium block">
                          Description *
                        </label>
                        <input
                          autoFocus
                          className="block text-xs border border-gray-300 rounded px-2 py-0.5 w-full mt-0.5"
                          value={newDtName}
                          onChange={(e) => setNewDtName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddDeliveryTerm();
                          }}
                          placeholder="e.g. 30 days"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isAddingDt || !newDtName.trim()}
                        onClick={handleAddDeliveryTerm}
                        className="text-[10px] text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {isAddingDt ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddDt(false)}
                        className="text-[10px] text-gray-400 hover:text-gray-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
                <td className={`${cellBorder} ${cellPad} border-b-0`}>
                  <div className="flex items-center justify-between gap-1">
                    <span className={labelCls}>Payment Term:</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPt((v) => !v);
                          setNewPtName("");
                        }}
                        className="flex items-center gap-0.5 text-[9px] text-blue-600 hover:text-blue-800 font-semibold print:hidden"
                      >
                        <Plus className="w-3 h-3" />
                        New
                      </button>
                    )}
                  </div>
                  <select
                    className={inputCls}
                    value={ptId}
                    onChange={(e) => setPtId(e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">-- Select --</option>
                    {paymentTerms.map((p) => (
                      <option key={p.pt_id} value={p.pt_id}>
                        {p.description}
                      </option>
                    ))}
                  </select>
                  {showAddPt && !isReadOnly && (
                    <div className="mt-1.5 flex items-end gap-1.5 bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-gray-500 font-medium block">
                          Description *
                        </label>
                        <input
                          autoFocus
                          className="block text-xs border border-gray-300 rounded px-2 py-0.5 w-full mt-0.5"
                          value={newPtName}
                          onChange={(e) => setNewPtName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddPaymentTerm();
                          }}
                          placeholder="e.g. 30 days after delivery"
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isAddingPt || !newPtName.trim()}
                        onClick={handleAddPaymentTerm}
                        className="text-[10px] text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded disabled:opacity-50"
                      >
                        {isAddingPt ? "..." : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddPt(false)}
                        className="text-[10px] text-gray-400 hover:text-gray-700 px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-r-0 border-b-0`}
                />
              </tr>
            </tbody>
          </table>

          {/* ── Bidding Table ────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[800px]">
              <thead>
                {/* Supplier header row */}
                <tr className="border-b border-gray-800">
                  {/* Fixed columns */}
                  <th
                    className="border-r border-gray-800 px-2 py-1 font-semibold text-center w-10"
                    rowSpan={2}
                  >
                    Item
                  </th>
                  <th
                    className="border-r border-gray-800 px-2 py-1 font-semibold text-center w-12"
                    rowSpan={2}
                  >
                    Qty
                  </th>
                  <th
                    className="border-r border-gray-800 px-2 py-1 font-semibold text-center w-14"
                    rowSpan={2}
                  >
                    Unit
                  </th>
                  <th
                    className="border-r border-gray-800 px-2 py-1 font-semibold text-left min-w-[200px]"
                    rowSpan={2}
                  >
                    DESCRIPTION
                  </th>

                  {/* Supplier columns (each 2 sub-cols: Unit Price + Total Amt) */}
                  {supplierCols.map((col) => (
                    <th
                      key={col.localId}
                      colSpan={2}
                      className="border-r border-gray-800 px-2 py-1 text-center"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-bold text-[11px] uppercase">
                          {col.name}
                        </span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => removeSupplierColumn(col.localId)}
                            className="text-gray-300 hover:text-red-500 text-sm leading-none print:hidden"
                            title="Remove bidder"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="text-[9px] font-normal text-gray-400">
                        {col.address}
                      </div>
                      {col.contact && (
                        <div className="text-[9px] font-normal text-gray-400">
                          Contact: {col.contact}
                        </div>
                      )}
                      {col.tin && (
                        <div className="text-[9px] font-normal text-gray-400">
                          TIN: {col.tin}
                        </div>
                      )}
                    </th>
                  ))}

                  {/* Winning supplier column header */}
                  <th
                    className="px-2 py-1 font-semibold text-center bg-green-50 min-w-[120px]"
                    colSpan={2}
                    rowSpan={1}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-green-600" />
                      <span className="text-green-700">
                        {winnerColId
                          ? (supplierCols.find((c) => c.localId === winnerColId)
                              ?.name ?? "Winning Supplier")
                          : "Winning Supplier"}
                      </span>
                    </div>
                    {winnerColId && (
                      <div className="text-[9px] font-normal text-green-500 mt-0.5">
                        {
                          supplierCols.find((c) => c.localId === winnerColId)
                            ?.address
                        }
                      </div>
                    )}
                  </th>
                </tr>

                {/* Sub-headers (Unit Price / Total Amt per supplier) */}
                <tr className="border-b-2 border-gray-800 bg-gray-50">
                  {supplierCols.map((col) => (
                    <>
                      <th
                        key={`${col.localId}-up`}
                        className="border-r border-gray-800 px-2 py-1.5 font-semibold text-center w-24"
                      >
                        Unit Price
                      </th>
                      <th
                        key={`${col.localId}-ta`}
                        className="border-r border-gray-800 px-2 py-1.5 font-semibold text-center w-28"
                      >
                        Total Amt.
                      </th>
                    </>
                  ))}
                  {/* Winning sub-headers */}
                  <th className="border-r border-gray-800 px-2 py-1.5 font-semibold text-center w-24 bg-green-50">
                    Unit Price
                  </th>
                  <th className="px-2 py-1.5 font-semibold text-center w-28 bg-green-50">
                    Total Amt.
                  </th>
                </tr>
              </thead>

              <tbody>
                {prLines.length === 0 && (
                  <tr>
                    <td
                      colSpan={4 + supplierCols.length * 2 + 2}
                      className="px-4 py-8 text-center text-gray-400 italic"
                    >
                      {prId
                        ? "Loading line items…"
                        : "Select a Purchase Request to load items"}
                    </td>
                  </tr>
                )}

                {prLines.map((line, idx) => {
                  const specs = parseSpecEntries(line.specifications ?? null);
                  // Find winning supplier bids for this line
                  const winSup = winnerColId
                    ? bids[winnerColId]?.[line.prl_id]
                    : null;
                  const winPrice = parseFloat(winSup?.unitPriceBid || "0") || 0;

                  return (
                    <tr
                      key={line.prl_id}
                      className="border-b border-gray-300 align-top"
                    >
                      <td className="border-r border-gray-800 px-2 py-1 text-center">
                        {idx + 1}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center">
                        {line.qty}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1 text-center">
                        {line.unit_code}
                      </td>
                      <td className="border-r border-gray-800 px-2 py-1">
                        <div className="font-semibold">
                          {line.item_description}
                        </div>
                        {specs.length > 0 && (
                          <div className="mt-1 text-[10px] leading-relaxed text-gray-600">
                            <span className="font-semibold uppercase text-gray-500">
                              Product Specifications:
                            </span>
                            {specs.map((sp, i) => (
                              <div key={i}>
                                <span className="font-bold">{sp.label}</span>
                                {sp.value ? `: ${sp.value}` : ""}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Supplier bid cells */}
                      {supplierCols.map((col) => {
                        const cell = bids[col.localId]?.[line.prl_id];
                        const price =
                          parseFloat(cell?.unitPriceBid || "0") || 0;
                        const totalAmt = price * line.qty;
                        return (
                          <>
                            <td
                              key={`${col.localId}-${line.prl_id}-up`}
                              className="border-r border-gray-800 px-1 py-1 text-right"
                            >
                              {isReadOnly ? (
                                <span>{price > 0 ? peso(price) : ""}</span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="w-full text-xs text-right bg-transparent border-0 border-b border-transparent focus:border-gray-500 py-0.5 focus:outline-none"
                                  placeholder="0.00"
                                  value={cell?.unitPriceBid || ""}
                                  onChange={(e) =>
                                    updateBidCell(
                                      col.localId,
                                      line.prl_id,
                                      e.target.value,
                                    )
                                  }
                                />
                              )}
                            </td>
                            <td
                              key={`${col.localId}-${line.prl_id}-ta`}
                              className="border-r border-gray-800 px-2 py-1 text-right text-xs font-medium"
                            >
                              {totalAmt > 0 ? peso(totalAmt) : ""}
                            </td>
                          </>
                        );
                      })}

                      {/* Winning supplier column */}
                      <td className="border-r border-gray-800 px-2 py-1 text-right bg-green-50/50">
                        {winPrice > 0 ? peso(winPrice) : ""}
                      </td>
                      <td className="px-2 py-1 text-right bg-green-50/50 font-medium">
                        {winPrice > 0 ? peso(winPrice * line.qty) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Footer totals */}
              {prLines.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-800 font-bold">
                    <td
                      colSpan={4}
                      className="border-r border-gray-800 px-3 py-2 text-right"
                    >
                      Sub Amount of Bid
                    </td>

                    {supplierCols.map((col) => {
                      const total = supplierTotal(col.localId);
                      return (
                        <>
                          <td
                            key={`${col.localId}-foot-up`}
                            className="border-r border-gray-800 px-2 py-2"
                          />
                          <td
                            key={`${col.localId}-foot-ta`}
                            className="border-r border-gray-800 px-2 py-2 text-right"
                          >
                            {total > 0 ? peso(total) : ""}
                          </td>
                        </>
                      );
                    })}

                    {/* Winning total */}
                    <td className="border-r border-gray-800 px-2 py-2 bg-green-50/50" />
                    <td className="px-2 py-2 text-right bg-green-50/50">
                      {winnerColId ? peso(supplierTotal(winnerColId)) : ""}
                    </td>
                  </tr>

                  {/* Winner selection row */}
                  {!isReadOnly && supplierCols.length > 0 && (
                    <tr className="border-t border-gray-300 print:hidden">
                      <td
                        colSpan={4}
                        className="border-r border-gray-800 px-3 py-2 text-right text-[10px] text-gray-500 font-semibold uppercase"
                      >
                        Select Winner →
                      </td>
                      {supplierCols.map((col) => (
                        <td
                          key={`${col.localId}-win`}
                          colSpan={2}
                          className="border-r border-gray-800 px-2 py-2 text-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setWinnerColId(
                                winnerColId === col.localId
                                  ? null
                                  : col.localId,
                              )
                            }
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                              winnerColId === col.localId
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700"
                            }`}
                          >
                            <Trophy className="w-3 h-3" />
                            {winnerColId === col.localId
                              ? "Winner"
                              : "Set Winner"}
                          </button>
                        </td>
                      ))}
                      <td colSpan={2} className="bg-green-50/50" />
                    </tr>
                  )}
                </tfoot>
              )}
            </table>
          </div>

          {/* ── Add Bidder Bar ─────────────────────── */}
          {!isReadOnly && (
            <div className="border-t-2 border-gray-800 px-3 py-3 print:hidden">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0">
                  Add Bidder:
                </span>
                <select
                  className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                  value=""
                  onChange={(e) => {
                    const sup = suppliers.find(
                      (s) => s.s_id === e.target.value,
                    );
                    if (sup) addSupplierColumn(sup);
                  }}
                >
                  <option value="">-- Select Supplier --</option>
                  {suppliers
                    .filter((s) => !supplierCols.find((c) => c.s_id === s.s_id))
                    .map((s) => (
                      <option key={s.s_id} value={s.s_id}>
                        {s.description}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSupplier((v) => !v);
                    setNewSupName("");
                    setNewSupAddr("");
                    setNewSupContact("");
                    setNewSupTin("");
                  }}
                  className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Supplier
                </button>
              </div>

              {showAddSupplier && (
                <div className="mt-2 flex items-end gap-2 flex-wrap bg-gray-50 border border-gray-200 rounded p-2">
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">
                      Name *
                    </label>
                    <input
                      autoFocus
                      className="block text-xs border border-gray-300 rounded px-2 py-1 w-40"
                      value={newSupName}
                      onChange={(e) => setNewSupName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">
                      Address
                    </label>
                    <input
                      className="block text-xs border border-gray-300 rounded px-2 py-1 w-48"
                      value={newSupAddr}
                      onChange={(e) => setNewSupAddr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">
                      Contact
                    </label>
                    <input
                      className="block text-xs border border-gray-300 rounded px-2 py-1 w-32"
                      value={newSupContact}
                      onChange={(e) => setNewSupContact(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-medium">
                      TIN
                    </label>
                    <input
                      className="block text-xs border border-gray-300 rounded px-2 py-1 w-28"
                      value={newSupTin}
                      onChange={(e) => setNewSupTin(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isAddingSup || !newSupName.trim()}
                    onClick={handleAddSupplier}
                    className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded disabled:opacity-50"
                  >
                    {isAddingSup ? "..." : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddSupplier(false)}
                    className="text-xs text-gray-400 hover:text-gray-700 px-1"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Remarks ────────────────────────────── */}
          <div className="border-t-2 border-gray-800 px-3 py-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0 pt-1">
                Remarks
              </span>
              <textarea
                className="flex-1 text-xs border-0 border-b border-gray-300 bg-transparent resize-none py-0.5 focus:outline-none focus:border-gray-800"
                rows={2}
                value={abstractRemarks}
                onChange={(e) => setAbstractRemarks(e.target.value)}
                placeholder="Remarks..."
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  //  RENDER — LIST VIEW
  // ═══════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abstract of Bids"
        subtitle="Bids and Awards Committee — Manage Abstract of Bid as Calculated"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Abstracts" value={abstracts.length} />
        <StatCard
          label="Awarded"
          value={abstracts.filter((a) => a.status === "AWARDED").length}
          color="success"
        />
        <StatCard
          label="With Winner"
          value={abstracts.filter((a) => !!a.winning_b_id).length}
          color="primary"
        />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          New Abstract
        </PrimaryButton>
        <PrimaryButton onClick={loadList} disabled={listLoading}>
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

      <DataTable<Abstract>
        data={filtered}
        columns={[
          { key: "a_no", header: "Abstract No." },
          { key: "a_date", header: "Date" },
          {
            key: "pr_id",
            header: "PR No.",
            render: (row) => <span>{prLabel(row.pr_id)}</span>,
          },
          {
            key: "mp_id",
            header: "Mode of Procurement",
            render: (row) => <span>{mpLabel(row.mp_id)}</span>,
          },
          {
            key: "approved_budget",
            header: "Approved Budget",
            render: (row) => (
              <span className="font-semibold">
                ₱{peso(row.approved_budget ?? 0)}
              </span>
            ),
          },
          {
            key: "winning_b_id" as any,
            header: "Winning Supplier",
            render: (row) => {
              const name = winnerLabel(row.winning_b_id);
              return name ? (
                <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-xs">
                  <Trophy className="w-3 h-3" />
                  {name}
                </span>
              ) : (
                <span className="text-gray-400 text-xs">—</span>
              );
            },
          },
          {
            key: "actions" as any,
            header: "Actions",
            render: (row) => (
              <div className="flex gap-1">
                <IconButton onClick={() => openForm(row)} title="View">
                  <Eye className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
        title={`Abstracts (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by abstract no., PR no., or mode..."
        emptyMessage={
          listLoading ? "Loading abstracts…" : "No abstracts found."
        }
      />
    </div>
  );
};

export default AbstractOfBids;
