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
  Plus,
  RefreshCw,
  Download,
  Eye,
  ArrowLeft,
  Save,
  CheckCircle,
} from "lucide-react";
import jsPDF from "jspdf";
import type { DeliveryReceipt as DR, PurchaseOrder } from "@/types/gse.types";
import {
  fetchDeliveryReceipts,
  fetchDeliveryReceiptLines,
  createDeliveryReceipt,
  updateDeliveryReceipt,
  upsertDeliveryReceiptLines,
  deleteDeliveryReceiptLinesByDR,
  generateNextDRNumber,
  fetchIssuedPurchaseOrders,
  fetchPOLinesForDR,
  updatePOLineDelivery,
  logWorkflowChange,
  fetchWinningBidtures,
  fetchPRLinesForAbstract,
  upsertPOLines,
} from "@/services/bacService";
import { supabase } from "@/services/supabase";

// ────────────────────────────────────────────────────────────
// HELPERS & TYPES
// ────────────────────────────────────────────────────────────

type ViewMode = "list" | "form";

interface DRLineRow {
  pol_id: string;
  item_description: string;
  item_code: string;
  unit_code: string;
  qty_ordered: number;
  qty_previously_delivered: number;
  qty_pending: number;
  qty_this_delivery: number;
  qty_accepted: number;
  qty_rejected: number;
  rejection_reason: string;
  inspection_notes: string;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500/10 text-gray-500",
  INSPECTED: "bg-blue-500/10 text-blue-500",
  ACCEPTED: "bg-green-500/10 text-green-500",
  PARTIAL: "bg-yellow-500/10 text-yellow-600",
  REJECTED: "bg-red-500/10 text-red-500",
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ────────────────────────────────────────────────────────────
// PDF GENERATION
// ────────────────────────────────────────────────────────────

const generateDRPDF = (
  dr: DR,
  lines: DRLineRow[],
  poNo: string,
  supplierName: string,
) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("DELIVERY RECEIPT", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Municipality of Carmen", pageWidth / 2, y, { align: "center" });
  y += 15;

  // DR Info Box
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentWidth, 28);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DR No:", margin + 3, y + 6);
  doc.text("DR Date:", margin + 3, y + 12);
  doc.text("PO No:", margin + 3, y + 18);
  doc.text("Supplier:", margin + 3, y + 24);

  doc.setFont("helvetica", "normal");
  doc.text(dr.dr_no || "-", margin + 25, y + 6);
  doc.text(formatDate(dr.dr_date), margin + 25, y + 12);
  doc.text(poNo, margin + 25, y + 18);
  doc.text(supplierName, margin + 25, y + 24);

  doc.setFont("helvetica", "bold");
  doc.text("Supplier DR No:", margin + 90, y + 6);
  doc.text("Supplier Invoice:", margin + 90, y + 12);
  doc.text("Delivery Date:", margin + 90, y + 18);
  doc.text("Status:", margin + 90, y + 24);

  doc.setFont("helvetica", "normal");
  doc.text(dr.supplier_dr_no || "-", margin + 120, y + 6);
  doc.text(dr.supplier_invoice_no || "-", margin + 120, y + 12);
  doc.text(formatDate(dr.delivery_date), margin + 120, y + 18);
  doc.text(dr.status, margin + 120, y + 24);

  y += 35;

  // Line Items Table Header
  const colWidths = [10, 50, 15, 20, 20, 20, 20, 25];
  const headers = [
    "#",
    "Description",
    "Unit",
    "Ordered",
    "Delivered",
    "Accepted",
    "Rejected",
    "Notes",
  ];

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.rect(margin, y, contentWidth, 8);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  let xPos = margin;
  headers.forEach((header, i) => {
    doc.text(header, xPos + 2, y + 5.5);
    xPos += colWidths[i];
  });
  y += 8;

  // Line Items
  doc.setFont("helvetica", "normal");
  lines.forEach((line, index) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const rowHeight = 7;
    doc.rect(margin, y, contentWidth, rowHeight);

    xPos = margin;
    const rowData = [
      String(index + 1),
      line.item_description.substring(0, 30),
      line.unit_code,
      String(line.qty_ordered),
      String(line.qty_this_delivery),
      String(line.qty_accepted),
      String(line.qty_rejected),
      (line.inspection_notes || "").substring(0, 15),
    ];

    rowData.forEach((cell, i) => {
      doc.text(cell, xPos + 2, y + 5);
      xPos += colWidths[i];
    });
    y += rowHeight;
  });

  y += 15;

  // Signatures
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  const sigWidth = (contentWidth - 10) / 3;

  doc.setFontSize(8);
  doc.text("Received By:", margin, y);
  doc.text("Inspected By:", margin + sigWidth + 5, y);
  doc.text("Approved By:", margin + (sigWidth + 5) * 2, y);
  y += 15;

  doc.line(margin, y, margin + sigWidth - 5, y);
  doc.line(margin + sigWidth + 5, y, margin + sigWidth * 2, y);
  doc.line(margin + (sigWidth + 5) * 2, y, margin + contentWidth, y);
  y += 4;

  doc.text(dr.received_by || "____________________", margin, y);
  doc.text(dr.inspected_by || "____________________", margin + sigWidth + 5, y);
  doc.text(
    dr.approved_by || "____________________",
    margin + (sigWidth + 5) * 2,
    y,
  );

  doc.save(`DR_${dr.dr_no || "draft"}.pdf`);
};

// ────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────────────────────────────────

const DeliveryReceipt = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [deliveryReceipts, setDeliveryReceipts] = useState<
    (DR & { id: string })[]
  >([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [selectedDR, setSelectedDR] = useState<DR | null>(null);
  const [isNewDR, setIsNewDR] = useState(false);
  const [drNo, setDRNo] = useState("");
  const [drDate, setDRDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedPOId, setSelectedPOId] = useState("");
  const [supplierDRNo, setSupplierDRNo] = useState("");
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [inspectedBy, setInspectedBy] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [remarks, setRemarks] = useState("");
  const [drStatus, setDRStatus] = useState<DR["status"]>("DRAFT");
  const [drLines, setDRLines] = useState<DRLineRow[]>([]);

  // ──────────────────────────────────────────────────────────
  // DATA LOADING
  // ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [drs, pos] = await Promise.all([
        fetchDeliveryReceipts(),
        fetchIssuedPurchaseOrders(),
      ]);
      setDeliveryReceipts(drs.map((dr) => ({ ...dr, id: dr.dr_id })));
      setPurchaseOrders(pos);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load PO lines when PO is selected
  const loadPOLines = useCallback(
    async (poId: string) => {
      if (!poId) {
        setDRLines([]);
        return;
      }

      const po = purchaseOrders.find((p) => p.po_id === poId);
      const poLines = await fetchPOLinesForDR(poId, po?.a_id);
      const lines: DRLineRow[] = poLines.map((pol) => ({
        pol_id: pol.pol_id,
        item_description: pol.item_description,
        item_code: pol.item_code,
        unit_code: pol.unit_code,
        qty_ordered: pol.qty_ordered,
        qty_previously_delivered: pol.qty_delivered || 0,
        qty_pending: pol.pending_qty,
        qty_this_delivery: 0,
        qty_accepted: 0,
        qty_rejected: 0,
        rejection_reason: "",
        inspection_notes: "",
      }));
      setDRLines(lines);
    },
    [purchaseOrders],
  );

  useEffect(() => {
    if (isNewDR && selectedPOId) {
      loadPOLines(selectedPOId);
    }
  }, [isNewDR, selectedPOId, loadPOLines]);

  // ──────────────────────────────────────────────────────────
  // FORM HANDLERS
  // ──────────────────────────────────────────────────────────

  const resetForm = () => {
    setSelectedDR(null);
    setIsNewDR(false);
    setDRNo("");
    setDRDate(new Date().toISOString().slice(0, 10));
    setSelectedPOId("");
    setSupplierDRNo("");
    setSupplierInvoiceNo("");
    setDeliveryDate("");
    setReceivedBy("");
    setInspectedBy("");
    setApprovedBy("");
    setRemarks("");
    setDRStatus("DRAFT");
    setDRLines([]);
  };

  const handleNewDR = async () => {
    resetForm();
    const nextNo = await generateNextDRNumber();
    setDRNo(nextNo);
    setIsNewDR(true);
    setViewMode("form");
  };

  const handleViewDR = async (dr: DR) => {
    setSelectedDR(dr);
    setIsNewDR(false);
    setDRNo(dr.dr_no || "");
    setDRDate(dr.dr_date);
    setSelectedPOId(dr.po_id);
    setSupplierDRNo(dr.supplier_dr_no || "");
    setSupplierInvoiceNo(dr.supplier_invoice_no || "");
    setDeliveryDate(dr.delivery_date || "");
    setReceivedBy(dr.received_by || "");
    setInspectedBy(dr.inspected_by || "");
    setApprovedBy(dr.approved_by || "");
    setRemarks(dr.remarks || "");
    setDRStatus(dr.status);

    // Load DR lines
    const existingLines = await fetchDeliveryReceiptLines(dr.dr_id);
    const po = purchaseOrders.find((p) => p.po_id === dr.po_id);
    const poLines = await fetchPOLinesForDR(dr.po_id, po?.a_id);

    const lines: DRLineRow[] = poLines.map((pol) => {
      const drLine = existingLines.find((l) => l.pol_id === pol.pol_id);
      return {
        pol_id: pol.pol_id,
        item_description: pol.item_description,
        item_code: pol.item_code,
        unit_code: pol.unit_code,
        qty_ordered: pol.qty_ordered,
        qty_previously_delivered:
          (pol.qty_delivered || 0) - (drLine?.qty_delivered || 0),
        qty_pending: pol.pending_qty + (drLine?.qty_delivered || 0),
        qty_this_delivery: drLine?.qty_delivered || 0,
        qty_accepted: drLine?.qty_accepted || 0,
        qty_rejected: drLine?.qty_rejected || 0,
        rejection_reason: drLine?.rejection_reason || "",
        inspection_notes: drLine?.inspection_notes || "",
      };
    });
    setDRLines(lines);
    setViewMode("form");
  };

  const handleLineChange = (
    index: number,
    field: keyof DRLineRow,
    value: string | number,
  ) => {
    setDRLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[index] };

      if (field === "qty_this_delivery") {
        const qty = Math.min(Number(value) || 0, line.qty_pending);
        line.qty_this_delivery = qty;
        line.qty_accepted = qty; // Default accepted = delivered
        line.qty_rejected = 0;
      } else if (field === "qty_accepted") {
        const accepted = Math.min(Number(value) || 0, line.qty_this_delivery);
        line.qty_accepted = accepted;
        line.qty_rejected = line.qty_this_delivery - accepted;
      } else if (field === "qty_rejected") {
        const rejected = Math.min(Number(value) || 0, line.qty_this_delivery);
        line.qty_rejected = rejected;
        line.qty_accepted = line.qty_this_delivery - rejected;
      } else {
        (line as any)[field] = value;
      }

      updated[index] = line;
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedPOId) {
      alert("Please select a Purchase Order");
      return;
    }

    setSaving(true);

    // Check if items are "pending" (no actual PO lines exist yet)
    const hasPendingItems = drLines.some((l) =>
      l.pol_id.startsWith("pending:"),
    );
    if (hasPendingItems) {
      // Auto-save PO lines first
      const po = purchaseOrders.find((p) => p.po_id === selectedPOId);
      if (!po || !po.a_id) {
        setSaving(false);
        alert("Cannot save: Purchase Order or Abstract not found.");
        return;
      }

      // Fetch abstract PR ID
      const { data: abstractData } = await (supabase as NonNullable<typeof supabase>)
        .schema("bac")
        .from("abstract")
        .select("pr_id")
        .eq("a_id", po.a_id)
        .single();

      if (!abstractData?.pr_id) {
        setSaving(false);
        alert("Cannot save: Abstract PR not found.");
        return;
      }

      // Fetch winning bidtures and PR lines
      const [winBids, prLinesData] = await Promise.all([
        fetchWinningBidtures(po.a_id),
        fetchPRLinesForAbstract(abstractData.pr_id),
      ]);

      const poLinesToCreate = winBids.map((bid) => {
        const prl = prLinesData.find((l) => l.prl_id === bid.prl_id);
        return {
          po_id: selectedPOId,
          b_id: bid.b_id,
          prl_id: bid.prl_id,
          qty_ordered: prl?.qty || 1,
          unit_price: bid.unit_price_bid,
          pol_total_amount: bid.unit_total_amount_bid,
        };
      });

      if (poLinesToCreate.length > 0) {
        const lineRes = await upsertPOLines(poLinesToCreate);
        if (!lineRes.success) {
          setSaving(false);
          alert(
            "Failed to create PO line items: " +
              (lineRes.error || "Unknown error"),
          );
          return;
        }

        // Reload PO lines with real pol_id values
        await loadPOLines(selectedPOId);
      }
    }

    try {
      const formData = {
        dr_no: drNo,
        dr_date: drDate,
        po_id: selectedPOId,
        supplier_dr_no: supplierDRNo || undefined,
        supplier_invoice_no: supplierInvoiceNo || undefined,
        delivery_date: deliveryDate || undefined,
        received_by: receivedBy || undefined,
        inspected_by: inspectedBy || undefined,
        approved_by: approvedBy || undefined,
        status: drStatus,
        remarks: remarks || undefined,
      };

      let drId: string;

      if (isNewDR) {
        const result = await createDeliveryReceipt(formData as any);
        if (!result.success || !result.dr_id) {
          alert("Failed to create Delivery Receipt: " + result.error);
          return;
        }
        drId = result.dr_id;

        // Log workflow
        await logWorkflowChange(
          "DR",
          drId,
          drNo,
          null,
          "DRAFT",
          undefined,
          "Created",
        );
      } else if (selectedDR) {
        drId = selectedDR.dr_id;
        const result = await updateDeliveryReceipt(drId, formData);
        if (!result.success) {
          alert("Failed to update Delivery Receipt: " + result.error);
          return;
        }

        // Log status change if changed
        if (selectedDR.status !== drStatus) {
          await logWorkflowChange(
            "DR",
            drId,
            drNo,
            selectedDR.status,
            drStatus,
          );
        }

        // Delete existing lines before re-inserting
        await deleteDeliveryReceiptLinesByDR(drId);
      } else {
        return;
      }

      // Save DR lines
      const linesToSave = drLines
        .filter((l) => l.qty_this_delivery > 0)
        .map((l) => ({
          dr_id: drId,
          pol_id: l.pol_id,
          qty_delivered: l.qty_this_delivery,
          qty_accepted: l.qty_accepted,
          qty_rejected: l.qty_rejected,
          rejection_reason: l.rejection_reason || undefined,
          inspection_notes: l.inspection_notes || undefined,
        }));

      if (linesToSave.length > 0) {
        await upsertDeliveryReceiptLines(linesToSave);

        // Update PO line delivery tracking
        for (const line of drLines) {
          if (line.qty_this_delivery > 0) {
            const totalDelivered =
              line.qty_previously_delivered + line.qty_this_delivery;
            const status =
              totalDelivered >= line.qty_ordered
                ? "COMPLETE"
                : totalDelivered > 0
                  ? "PARTIAL"
                  : "PENDING";
            await updatePOLineDelivery(line.pol_id, totalDelivered, status);
          }
        }
      }

      alert("Delivery Receipt saved successfully!");
      resetForm();
      setViewMode("list");
      loadData();
    } catch (err) {
      console.error("Error saving DR:", err);
      alert("An error occurred while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedDR) return;
    setDRStatus("ACCEPTED");
    await handleSave();
  };

  const handleDownloadPDF = () => {
    if (!selectedDR && !isNewDR) return;

    const po = purchaseOrders.find((p) => p.po_id === selectedPOId);
    // Get supplier name from PO -> Abstract -> Bidture
    const supplierName = "Supplier"; // Would need to trace through abstract

    const dr: DR = selectedDR || {
      dr_id: "",
      dr_no: drNo,
      dr_date: drDate,
      po_id: selectedPOId,
      supplier_dr_no: supplierDRNo,
      supplier_invoice_no: supplierInvoiceNo,
      delivery_date: deliveryDate,
      received_by: receivedBy,
      inspected_by: inspectedBy,
      approved_by: approvedBy,
      status: drStatus,
      remarks,
      created_at: "",
      updated_at: "",
    };

    generateDRPDF(dr, drLines, po?.po_no || "-", supplierName);
  };

  // ──────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ──────────────────────────────────────────────────────────

  const stats = {
    total: deliveryReceipts.length,
    draft: deliveryReceipts.filter((d) => d.status === "DRAFT").length,
    accepted: deliveryReceipts.filter((d) => d.status === "ACCEPTED").length,
    partial: deliveryReceipts.filter((d) => d.status === "PARTIAL").length,
  };

  const isReadonly = selectedDR?.status === "ACCEPTED";

  // ──────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────

  if (viewMode === "form") {
    return (
      <div className="space-y-6">
        <PageHeader
          title={isNewDR ? "New Delivery Receipt" : `DR: ${drNo}`}
          subtitle={
            isNewDR
              ? "Record items delivered against a Purchase Order"
              : "View/Edit delivery receipt"
          }
        />

        <ActionsBar>
          <button
            onClick={() => {
              resetForm();
              setViewMode("list");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="flex-1" />

          {!isReadonly && (
            <PrimaryButton onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Draft"}
            </PrimaryButton>
          )}

          {!isNewDR && drStatus === "DRAFT" && (
            <button
              onClick={handleAccept}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Accept Delivery
            </button>
          )}

          {!isNewDR && (
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
          )}
        </ActionsBar>

        {/* DR Header Form */}
        <div className="bg-surface border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">
            Delivery Receipt Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                DR No.
              </label>
              <input
                type="text"
                value={drNo}
                onChange={(e) => setDRNo(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                DR Date *
              </label>
              <input
                type="date"
                value={drDate}
                onChange={(e) => setDRDate(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Status
              </label>
              <span
                className={`inline-block px-3 py-2 rounded-lg text-sm font-medium ${statusColors[drStatus]}`}
              >
                {drStatus}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Purchase Order *
              </label>
              <select
                value={selectedPOId}
                onChange={(e) => setSelectedPOId(e.target.value)}
                disabled={!isNewDR || isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              >
                <option value="">-- Select PO --</option>
                {purchaseOrders.map((po) => (
                  <option key={po.po_id} value={po.po_id}>
                    {po.po_no} - {formatDate(po.po_date)} ({po.status})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Supplier DR No.
              </label>
              <input
                type="text"
                value={supplierDRNo}
                onChange={(e) => setSupplierDRNo(e.target.value)}
                disabled={isReadonly}
                placeholder="Reference number from supplier"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Supplier Invoice No.
              </label>
              <input
                type="text"
                value={supplierInvoiceNo}
                onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                disabled={isReadonly}
                placeholder="Invoice number from supplier"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Received By
              </label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Inspected By
              </label>
              <input
                type="text"
                value={inspectedBy}
                onChange={(e) => setInspectedBy(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                Approved By
              </label>
              <input
                type="text"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                disabled={isReadonly}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-muted mb-1">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={isReadonly}
              rows={2}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Line Items */}
        {selectedPOId && (
          <div className="bg-surface border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Items</h3>

            {drLines.length === 0 ? (
              <p className="text-muted text-sm">
                No line items found for selected PO
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted">
                        #
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted">
                        Item
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        Ordered
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        Previously Delivered
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        Pending
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        This Delivery
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        Accepted
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-muted">
                        Rejected
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-muted">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {drLines.map((line, index) => (
                      <tr
                        key={line.pol_id}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 px-2">{index + 1}</td>
                        <td className="py-2 px-2">{line.item_description}</td>
                        <td className="py-2 px-2 text-right">
                          {line.qty_ordered}
                        </td>
                        <td className="py-2 px-2 text-right">
                          {line.qty_previously_delivered}
                        </td>
                        <td className="py-2 px-2 text-right font-medium text-blue-600">
                          {line.qty_pending}
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            max={line.qty_pending}
                            value={line.qty_this_delivery}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "qty_this_delivery",
                                e.target.value,
                              )
                            }
                            disabled={isReadonly}
                            className="w-20 px-2 py-1 bg-background border border-border rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            max={line.qty_this_delivery}
                            value={line.qty_accepted}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "qty_accepted",
                                e.target.value,
                              )
                            }
                            disabled={
                              isReadonly || line.qty_this_delivery === 0
                            }
                            className="w-20 px-2 py-1 bg-background border border-border rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            max={line.qty_this_delivery}
                            value={line.qty_rejected}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "qty_rejected",
                                e.target.value,
                              )
                            }
                            disabled={
                              isReadonly || line.qty_this_delivery === 0
                            }
                            className="w-20 px-2 py-1 bg-background border border-border rounded text-right text-sm"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.inspection_notes}
                            onChange={(e) =>
                              handleLineChange(
                                index,
                                "inspection_notes",
                                e.target.value,
                              )
                            }
                            disabled={isReadonly}
                            placeholder="Notes..."
                            className="w-full px-2 py-1 bg-background border border-border rounded text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Receipts"
        subtitle="Track deliveries against Purchase Orders"
      />

      <StatsRow>
        <StatCard label="Total DRs" value={stats.total} color="primary" />
        <StatCard label="Draft" value={stats.draft} color="default" />
        <StatCard label="Accepted" value={stats.accepted} color="success" />
        <StatCard label="Partial" value={stats.partial} color="warning" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton onClick={handleNewDR}>
          <Plus className="w-4 h-4" />
          New Delivery Receipt
        </PrimaryButton>
        <IconButton onClick={loadData} disabled={loading} title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </IconButton>
      </ActionsBar>

      <DataTable
        columns={[
          { key: "dr_no", header: "DR No." },
          {
            key: "dr_date",
            header: "Date",
            render: (row) => formatDate(row.dr_date),
          },
          {
            key: "po_id",
            header: "PO No.",
            render: (row) => {
              const po = purchaseOrders.find((p) => p.po_id === row.po_id);
              return po?.po_no || "-";
            },
          },
          {
            key: "delivery_date",
            header: "Delivery Date",
            render: (row) => formatDate(row.delivery_date),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[row.status]}`}
              >
                {row.status}
              </span>
            ),
          },
          {
            key: "actions",
            header: "",
            render: (row) => (
              <div className="flex items-center gap-2">
                <IconButton onClick={() => handleViewDR(row)} title="View">
                  <Eye className="w-4 h-4" />
                </IconButton>
              </div>
            ),
          },
        ]}
        data={deliveryReceipts}
        emptyMessage="No delivery receipts found"
      />
    </div>
  );
};

export default DeliveryReceipt;
