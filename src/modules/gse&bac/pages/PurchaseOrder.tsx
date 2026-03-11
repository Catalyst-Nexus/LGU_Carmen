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
  PurchaseOrder as PO,
  Abstract,
  Supplier,
  DeliveryTerm,
  PaymentTerm,
  ModeProcurement,
  PurchaseRequest,
  PurchaseRequestLine,
} from "@/types/gse.types";
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  fetchPOLines,
  upsertPOLines,
  deletePOLinesByOrder,
  generateNextPONumber,
  fetchAwardedAbstracts,
  fetchWinningBidtures,
  fetchSuppliers,
  fetchDeliveryTerms,
  fetchPaymentTerms,
  fetchModesProcurement,
  fetchSubmittedPRs,
  fetchPRLinesForAbstract,
} from "@/services/bacService";

// ────────────────────────────────────────────────────────────
// HELPERS & TYPES
// ────────────────────────────────────────────────────────────

type ViewMode = "list" | "form";

/** Enriched line item for the PO form */
interface POLineRow {
  b_id: string;
  prl_id: string;
  item_description: string;
  item_code: string;
  unit_code: string;
  qty: number;
  unit_price: number;
  total_amount: number;
  specifications: string | null;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500",
  APPROVED: "bg-green-500/10 text-green-500",
  CANCELLED: "bg-orange-500/10 text-orange-500",
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

const PurchaseOrder = () => {
  const [mode, setMode] = useState<ViewMode>("list");

  // ─── List state ─────────────────────────────────
  const [orders, setOrders] = useState<PO[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [listLoading, setListLoading] = useState(false);

  // ─── Form header state ──────────────────────────
  const [editingPO, setEditingPO] = useState<PO | null>(null);
  const [poNo, setPoNo] = useState("");
  const [poDate, setPoDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [aId, setAId] = useState("");
  const [placeOfDelivery, setPlaceOfDelivery] = useState("");
  const [dateOfDelivery, setDateOfDelivery] = useState("");
  const [daysToDeliver, setDaysToDeliver] = useState("");
  const [dtId, setDtId] = useState("");
  const [ptId, setPtId] = useState("");
  const [remarks, setRemarks] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ─── PO line items ─────────────────────────────
  const [poLines, setPoLines] = useState<POLineRow[]>([]);

  // ─── Lookups ────────────────────────────────────
  const [awardedAbstracts, setAwardedAbstracts] = useState<Abstract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [deliveryTerms, setDeliveryTerms] = useState<DeliveryTerm[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [modes, setModes] = useState<ModeProcurement[]>([]);
  const [submittedPRs, setSubmittedPRs] = useState<PurchaseRequest[]>([]);

  // ───────────────────────────────────────────────
  // DATA LOADING
  // ───────────────────────────────────────────────

  const loadList = useCallback(async () => {
    setListLoading(true);
    const [pos, abs, sups, dts, pts, mps, prs] = await Promise.all([
      fetchPurchaseOrders(),
      fetchAwardedAbstracts(),
      fetchSuppliers(),
      fetchDeliveryTerms(),
      fetchPaymentTerms(),
      fetchModesProcurement(),
      fetchSubmittedPRs(),
    ]);
    setOrders(pos);
    setAwardedAbstracts(abs);
    setSuppliers(sups);
    setDeliveryTerms(dts);
    setPaymentTerms(pts);
    setModes(mps);
    setSubmittedPRs(prs);
    setListLoading(false);
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // ───────────────────────────────────────────────
  // OPEN / CLOSE FORM
  // ───────────────────────────────────────────────

  const openForm = async (po?: PO) => {
    if (po) {
      setEditingPO(po);
      setPoNo(po.po_no || "");
      setPoDate(po.po_date || new Date().toISOString().slice(0, 10));
      setAId(po.a_id || "");
      setPlaceOfDelivery(po.place_of_delivery || "");
      setDateOfDelivery(po.date_of_delivery || "");
      setDaysToDeliver(
        po.days_to_deliver != null ? String(po.days_to_deliver) : "",
      );
      setDtId(po.dt_id || "");
      setPtId(po.pt_id || "");
      setRemarks(po.remarks || "");
      setIssuedBy(po.issued_by || "");
      setReceivedBy(po.received_by || "");

      // Load saved PO lines and enrich with PR line data
      const [savedLines, prLines] = await Promise.all([
        fetchPOLines(po.po_id),
        po.a_id ? fetchAbstractPRLines(po.a_id) : Promise.resolve([]),
      ]);

      const enriched: POLineRow[] = savedLines.map((sl) => {
        const prl = prLines.find((l) => l.prl_id === sl.prl_id);
        return {
          b_id: sl.b_id,
          prl_id: sl.prl_id,
          item_description: prl?.item_description || "",
          item_code: prl?.item_code || "",
          unit_code: prl?.unit_code || "",
          qty: sl.qty_ordered,
          unit_price: sl.unit_price,
          total_amount: sl.pol_total_amount,
          specifications: prl?.specifications || null,
        };
      });
      setPoLines(enriched);
    } else {
      setEditingPO(null);
      const nextNo = await generateNextPONumber();
      setPoNo(nextNo);
      setPoDate(new Date().toISOString().slice(0, 10));
      setAId("");
      setPlaceOfDelivery("");
      setDateOfDelivery("");
      setDaysToDeliver("");
      setDtId("");
      setPtId("");
      setRemarks("");
      setIssuedBy("");
      setReceivedBy("");
      setPoLines([]);
    }
    setFormError("");
    setMode("form");
  };

  const closeForm = () => {
    setMode("list");
    setEditingPO(null);
    setFormError("");
    loadList();
  };

  // Helper: fetch PR lines through the abstract's pr_id
  const fetchAbstractPRLines = async (
    abstractId: string,
  ): Promise<PurchaseRequestLine[]> => {
    const abs = awardedAbstracts.find((a) => a.a_id === abstractId);
    if (!abs) return [];
    return fetchPRLinesForAbstract(abs.pr_id);
  };

  // ───────────────────────────────────────────────
  // ABSTRACT SELECTION — auto-populate lines
  // ───────────────────────────────────────────────

  const handleAbstractChange = async (abstractId: string) => {
    setAId(abstractId);
    setFormError("");

    if (!abstractId) {
      setPoLines([]);
      setDtId("");
      setPtId("");
      return;
    }

    const abs = awardedAbstracts.find((a) => a.a_id === abstractId);
    if (!abs) return;

    // Inherit delivery/payment terms from abstract
    if (abs.dt_id) setDtId(abs.dt_id);
    if (abs.pt_id) setPtId(abs.pt_id);

    // Fetch winning bidtures and PR lines
    const [winBids, prLines] = await Promise.all([
      fetchWinningBidtures(abstractId),
      fetchPRLinesForAbstract(abs.pr_id),
    ]);

    // Build PO line rows from winning bids
    const lines: POLineRow[] = winBids.map((bid) => {
      const prl = prLines.find((l) => l.prl_id === bid.prl_id);
      return {
        b_id: bid.b_id,
        prl_id: bid.prl_id,
        item_description: prl?.item_description || "",
        item_code: prl?.item_code || "",
        unit_code: prl?.unit_code || "",
        qty: prl?.qty || 0,
        unit_price: bid.unit_price_bid,
        total_amount: bid.unit_total_amount_bid,
        specifications: prl?.specifications || null,
      };
    });
    setPoLines(lines);
  };

  // ───────────────────────────────────────────────
  // LINE ITEM EDITING
  // ───────────────────────────────────────────────

  const updateLine = (
    idx: number,
    field: "qty" | "unit_price",
    value: string,
  ) => {
    setPoLines((prev) => {
      const updated = [...prev];
      const num = parseFloat(value) || 0;
      updated[idx] = {
        ...updated[idx],
        [field]: num,
        total_amount:
          field === "qty"
            ? num * updated[idx].unit_price
            : updated[idx].qty * num,
      };
      return updated;
    });
  };

  const subtotal = poLines.reduce((s, l) => s + l.total_amount, 0);

  // ───────────────────────────────────────────────
  // SAVE
  // ───────────────────────────────────────────────

  const handleSave = async (status?: string) => {
    if (!aId) {
      setFormError("Please select an Abstract (awarded bid).");
      return;
    }
    setFormError("");
    setIsSaving(true);

    const formData = {
      po_no: poNo,
      po_date: poDate,
      a_id: aId,
      place_of_delivery: placeOfDelivery || undefined,
      date_of_delivery: dateOfDelivery || undefined,
      days_to_deliver: daysToDeliver ? parseInt(daysToDeliver, 10) : null,
      pt_id: ptId || null,
      dt_id: dtId || null,
      po_total_amount: subtotal,
      remarks: remarks.trim() || undefined,
      issued_by: issuedBy.trim() || undefined,
      received_by: receivedBy.trim() || undefined,
      status: status || undefined,
    };

    if (editingPO) {
      const payload = status ? { ...formData, status } : formData;
      const res = await updatePurchaseOrder(editingPO.po_id, payload);
      if (!res.success) {
        setIsSaving(false);
        setFormError(res.error || "Failed to update purchase order");
        return;
      }
      // Re-insert PO lines
      await deletePOLinesByOrder(editingPO.po_id);
      const lineRows = buildPOLineRows(editingPO.po_id);
      if (lineRows.length > 0) await upsertPOLines(lineRows);
    } else {
      const res = await createPurchaseOrder({
        ...formData,
        status: status || "DRAFT",
      });
      if (!res.success || !res.po_id) {
        setIsSaving(false);
        setFormError(res.error || "Failed to create purchase order");
        return;
      }
      const lineRows = buildPOLineRows(res.po_id);
      if (lineRows.length > 0) await upsertPOLines(lineRows);
    }

    setIsSaving(false);
    closeForm();
  };

  const buildPOLineRows = (poId: string) =>
    poLines
      .filter((l) => l.qty > 0 && l.unit_price > 0)
      .map((l) => ({
        po_id: poId,
        b_id: l.b_id,
        prl_id: l.prl_id,
        qty_ordered: l.qty,
        unit_price: l.unit_price,
        pol_total_amount: l.total_amount,
      }));

  // ───────────────────────────────────────────────
  // DELETE
  // ───────────────────────────────────────────────

  const handleDelete = async (po: PO) => {
    if (!confirm(`Delete PO ${po.po_no || po.po_id}?`)) return;
    const res = await deletePurchaseOrder(po.po_id);
    if (res.success) loadList();
    else setFormError(res.error || "Failed to delete");
  };

  // ───────────────────────────────────────────────
  // LABEL HELPERS
  // ───────────────────────────────────────────────

  const abstractLabel = (id: string) => {
    const abs = awardedAbstracts.find((a) => a.a_id === id);
    return abs?.a_no || id;
  };

  const supplierForAbstract = (abstractId: string) => {
    const abs = awardedAbstracts.find((a) => a.a_id === abstractId);
    if (!abs?.winning_b_id) return null;
    // winning_b_id stores s_id (supplier id) based on AbstractOfBids save logic
    return suppliers.find((s) => s.s_id === abs.winning_b_id) || null;
  };

  const mpLabel = (abstractId: string) => {
    const abs = awardedAbstracts.find((a) => a.a_id === abstractId);
    if (!abs) return "—";
    return modes.find((m) => m.mp_id === abs.mp_id)?.description ?? "—";
  };

  const prLabel = (abstractId: string) => {
    const abs = awardedAbstracts.find((a) => a.a_id === abstractId);
    if (!abs) return "—";
    return submittedPRs.find((p) => p.pr_id === abs.pr_id)?.pr_no ?? "—";
  };

  const supplierLabel = (abstractId: string) => {
    const sup = supplierForAbstract(abstractId);
    return sup?.description ?? "—";
  };

  // ───────────────────────────────────────────────
  // FILTERED LIST
  // ───────────────────────────────────────────────

  const filtered = orders.filter((po) => {
    const q = search.toLowerCase();
    const matchSearch =
      (po.po_no || "").toLowerCase().includes(q) ||
      supplierLabel(po.a_id).toLowerCase().includes(q) ||
      abstractLabel(po.a_id).toLowerCase().includes(q);
    if (activeTab === "all") return matchSearch;
    return matchSearch && po.status === activeTab;
  });

  // ═══════════════════════════════════════════════
  //  RENDER — DOCUMENT FORM VIEW
  // ═══════════════════════════════════════════════

  if (mode === "form") {
    const isReadOnly = !!editingPO && editingPO.status !== "DRAFT";
    const cellBorder = "border border-gray-800";
    const cellPad = "px-3 py-2";
    const labelCls = "text-[10px] text-gray-500 font-medium uppercase";
    const inputCls =
      "block w-full text-xs bg-transparent border-0 border-b border-gray-300 py-0.5 focus:outline-none focus:border-gray-800";

    const selectedAbstract = awardedAbstracts.find((a) => a.a_id === aId);
    const winSupplier = aId ? supplierForAbstract(aId) : null;

    return (
      <div className="space-y-4 pb-10">
        {/* Top action bar */}
        <div className="flex items-center justify-between max-w-275 mx-auto">
          <button
            onClick={closeForm}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="flex gap-2">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => handleSave()}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {editingPO ? "Save Changes" : "Save as Draft"}
                </button>
                {editingPO && editingPO.status === "DRAFT" && (
                  <button
                    onClick={() => handleSave("APPROVED")}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Approve PO
                  </button>
                )}
              </>
            )}
            {isReadOnly && (
              <span className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium border border-gray-300">
                Read-only — {editingPO!.status}
              </span>
            )}
          </div>
        </div>

        {/* Inline form error */}
        {formError && (
          <div className="max-w-275 mx-auto bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-2 flex items-center justify-between">
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
        <div className="bg-white border-2 border-gray-800 max-w-275 mx-auto shadow-lg print:shadow-none text-gray-900">
          {/* Title */}
          <div className="text-center border-b-2 border-gray-800 py-4 px-6">
            <h1 className="font-bold text-lg tracking-widest">
              PURCHASE ORDER
            </h1>
          </div>

          {/* ── Meta fields ──────────────────────────── */}
          <table className="w-full text-xs border-collapse">
            <tbody>
              {/* Row 1: Supplier, PO No, Date */}
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-l-0`}
                  style={{ width: "50%" }}
                >
                  <span className={labelCls}>Supplier:</span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {winSupplier?.description || "—"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0`}
                  style={{ width: "25%" }}
                >
                  <span className={labelCls}>P.O. No.</span>
                  <div className="font-semibold mt-0.5">
                    {poNo || "(generating...)"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-r-0`}
                  style={{ width: "25%" }}
                >
                  <span className={labelCls}>Date:</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
              </tr>

              {/* Row 2: Address, Mode of Procurement */}
              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <span className={labelCls}>Address:</span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {winSupplier?.address || "—"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-r-0`}
                  colSpan={2}
                >
                  <span className={labelCls}>Mode of Procurement:</span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {aId ? mpLabel(aId) : "—"}
                  </div>
                </td>
              </tr>

              {/* Row 3: TIN / Contact, Abstract / PR No */}
              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <div className="flex gap-6">
                    <div>
                      <span className={labelCls}>TIN:</span>
                      <div className="font-semibold mt-0.5 text-xs">
                        {winSupplier?.tin || "—"}
                      </div>
                    </div>
                    <div>
                      <span className={labelCls}>Contact:</span>
                      <div className="font-semibold mt-0.5 text-xs">
                        {winSupplier?.contact || "—"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`${cellBorder} ${cellPad}`}>
                  <span className={labelCls}>Abstract No.:</span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {selectedAbstract?.a_no || "—"}
                  </div>
                </td>
                <td className={`${cellBorder} ${cellPad} border-r-0`}>
                  <span className={labelCls}>PR No.:</span>
                  <div className="font-semibold mt-0.5 text-xs">
                    {aId ? prLabel(aId) : "—"}
                  </div>
                </td>
              </tr>

              {/* Row 4: Place / Date of Delivery, Days to Deliver */}
              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <span className={labelCls}>Place of Delivery:</span>
                  <input
                    type="text"
                    className={inputCls}
                    value={placeOfDelivery}
                    onChange={(e) => setPlaceOfDelivery(e.target.value)}
                    placeholder="e.g. Municipal Hall, Carmen"
                    disabled={isReadOnly}
                  />
                </td>
                <td className={`${cellBorder} ${cellPad}`}>
                  <span className={labelCls}>Date of Delivery:</span>
                  <input
                    type="date"
                    className={inputCls}
                    value={dateOfDelivery}
                    onChange={(e) => setDateOfDelivery(e.target.value)}
                    disabled={isReadOnly}
                  />
                </td>
                <td className={`${cellBorder} ${cellPad} border-r-0`}>
                  <span className={labelCls}>Days to Deliver:</span>
                  <input
                    type="number"
                    className={inputCls}
                    value={daysToDeliver}
                    onChange={(e) => setDaysToDeliver(e.target.value)}
                    placeholder="e.g. 30"
                    disabled={isReadOnly}
                  />
                </td>
              </tr>

              {/* Row 5: Delivery Term, Payment Term */}
              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <span className={labelCls}>Delivery Term:</span>
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
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-r-0`}
                  colSpan={2}
                >
                  <span className={labelCls}>Payment Term:</span>
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
                </td>
              </tr>
            </tbody>
          </table>

          {/* Abstract selector (only shown on new PO or draft) */}
          {!isReadOnly && (
            <div className="border-b-2 border-gray-800 px-3 py-3 bg-blue-50/60">
              <label className="text-[10px] text-gray-500 font-medium uppercase block mb-1">
                Select Awarded Abstract *
              </label>
              <select
                className="block w-full text-xs border border-gray-400 rounded px-2 py-1.5 bg-white focus:outline-none focus:border-gray-800"
                value={aId}
                onChange={(e) => handleAbstractChange(e.target.value)}
              >
                <option value="">-- Select Awarded Abstract --</option>
                {awardedAbstracts.map((a) => {
                  const sup = supplierForAbstract(a.a_id);
                  const pr = submittedPRs.find((p) => p.pr_id === a.pr_id);
                  return (
                    <option key={a.a_id} value={a.a_id}>
                      {a.a_no} — PR: {pr?.pr_no || "?"} — Winner:{" "}
                      {sup?.description || "?"}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* ── Line Items Table ──────────────────────── */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th
                  className={`${cellBorder} ${cellPad} border-l-0 text-center font-bold`}
                  style={{ width: "6%" }}
                >
                  Item No.
                </th>
                <th
                  className={`${cellBorder} ${cellPad} text-center font-bold`}
                  style={{ width: "8%" }}
                >
                  QTY
                </th>
                <th
                  className={`${cellBorder} ${cellPad} text-center font-bold`}
                  style={{ width: "8%" }}
                >
                  UNIT
                </th>
                <th
                  className={`${cellBorder} ${cellPad} text-left font-bold`}
                  style={{ width: "44%" }}
                >
                  DESCRIPTION
                </th>
                <th
                  className={`${cellBorder} ${cellPad} text-right font-bold`}
                  style={{ width: "15%" }}
                >
                  UNIT COST
                </th>
                <th
                  className={`${cellBorder} ${cellPad} border-r-0 text-right font-bold`}
                  style={{ width: "19%" }}
                >
                  AMOUNT
                </th>
              </tr>
            </thead>
            <tbody>
              {poLines.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className={`${cellBorder} border-l-0 border-r-0 ${cellPad} text-center text-gray-400 py-8`}
                  >
                    {aId
                      ? "No winning bid items found for this abstract."
                      : "Select an awarded abstract to populate line items."}
                  </td>
                </tr>
              )}
              {poLines.map((line, idx) => {
                const specs = parseSpecEntries(line.specifications);
                return (
                  <tr key={line.prl_id}>
                    <td
                      className={`${cellBorder} ${cellPad} border-l-0 text-center`}
                    >
                      {idx + 1}
                    </td>
                    <td className={`${cellBorder} ${cellPad} text-center`}>
                      {isReadOnly ? (
                        line.qty
                      ) : (
                        <input
                          type="number"
                          className="w-full text-center text-xs border-0 border-b border-gray-300 bg-transparent py-0.5 focus:outline-none focus:border-gray-800"
                          value={line.qty || ""}
                          onChange={(e) =>
                            updateLine(idx, "qty", e.target.value)
                          }
                        />
                      )}
                    </td>
                    <td
                      className={`${cellBorder} ${cellPad} text-center uppercase`}
                    >
                      {line.unit_code}
                    </td>
                    <td className={`${cellBorder} ${cellPad}`}>
                      <div className="font-semibold">
                        {line.item_description}
                      </div>
                      {specs.length > 0 && (
                        <div className="mt-0.5 text-[10px] text-gray-500 space-y-0.5">
                          {specs.map((sp, si) => (
                            <div key={si}>
                              {sp.label}
                              {sp.value ? `: ${sp.value}` : ""}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className={`${cellBorder} ${cellPad} text-right`}>
                      {isReadOnly ? (
                        `₱${peso(line.unit_price)}`
                      ) : (
                        <input
                          type="number"
                          className="w-full text-right text-xs border-0 border-b border-gray-300 bg-transparent py-0.5 focus:outline-none focus:border-gray-800"
                          value={line.unit_price || ""}
                          onChange={(e) =>
                            updateLine(idx, "unit_price", e.target.value)
                          }
                          step="0.01"
                        />
                      )}
                    </td>
                    <td
                      className={`${cellBorder} ${cellPad} border-r-0 text-right font-semibold`}
                    >
                      ₱{peso(line.total_amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Subtotal */}
            {poLines.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={5}
                    className={`${cellBorder} ${cellPad} border-l-0 text-right font-bold uppercase`}
                  >
                    SUBTOTAL
                  </td>
                  <td
                    className={`${cellBorder} ${cellPad} border-r-0 text-right font-bold text-sm`}
                  >
                    ₱{peso(subtotal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* ── Remarks ────────────────────────────── */}
          <div className="border-t-2 border-gray-800 px-3 py-3">
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0 pt-1">
                Remarks
              </span>
              <textarea
                className="flex-1 text-xs border-0 border-b border-gray-300 bg-transparent resize-none py-0.5 focus:outline-none focus:border-gray-800"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks..."
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* ── Signatories ────────────────────────── */}
          <div className="border-t-2 border-gray-800 px-3 py-4">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <span className={labelCls}>Issued by:</span>
                <input
                  type="text"
                  className={inputCls + " mt-1"}
                  value={issuedBy}
                  onChange={(e) => setIssuedBy(e.target.value)}
                  placeholder="Name / Position"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <span className={labelCls}>Received by:</span>
                <input
                  type="text"
                  className={inputCls + " mt-1"}
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                  placeholder="Name / Position"
                  disabled={isReadOnly}
                />
              </div>
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
        title="Purchase Orders"
        subtitle="Bids and Awards Committee — Manage Purchase Orders"
        icon={<FileText className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total POs" value={orders.length} />
        <StatCard
          label="Draft"
          value={orders.filter((o) => o.status === "DRAFT").length}
          color="default"
        />
        <StatCard
          label="Approved"
          value={orders.filter((o) => o.status === "APPROVED").length}
          color="success"
        />
        <StatCard
          label="Cancelled"
          value={orders.filter((o) => o.status === "CANCELLED").length}
          color="danger"
        />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "all", label: "All" },
          { id: "DRAFT", label: "Draft" },
          { id: "APPROVED", label: "Approved" },
          { id: "CANCELLED", label: "Cancelled" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={() => openForm()}>
          <Plus className="w-4 h-4" />
          New Purchase Order
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

      <DataTable<PO>
        data={filtered}
        columns={[
          { key: "po_no", header: "PO No." },
          { key: "po_date", header: "Date" },
          {
            key: "a_id",
            header: "Abstract No.",
            render: (row) => <span>{abstractLabel(row.a_id)}</span>,
          },
          {
            key: "supplier" as any,
            header: "Supplier",
            render: (row) => <span>{supplierLabel(row.a_id)}</span>,
          },
          {
            key: "po_total_amount",
            header: "Total Amount",
            render: (row) => (
              <span className="font-semibold">
                ₱{peso(row.po_total_amount ?? 0)}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${statusColors[row.status] || "bg-gray-200 text-gray-600"}`}
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
                  <IconButton onClick={() => openForm(row)} title="View">
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                )}
                <IconButton
                  onClick={() => handleDelete(row)}
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
        title={`Purchase Orders (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by PO no., abstract no., or supplier..."
        emptyMessage={
          listLoading ? "Loading purchase orders…" : "No purchase orders found."
        }
      />
    </div>
  );
};

export default PurchaseOrder;
