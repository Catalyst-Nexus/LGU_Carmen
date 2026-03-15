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
  ClipboardCheck,
  RefreshCw,
  Eye,
  Check,
  X,
  ArrowLeft,
  Download,
} from "lucide-react";
import jsPDF from "jspdf";
import type { PurchaseRequest, ResponsibilityCenter, ResponsibilityCenterSection } from "@/types/gse.types";
import {
  fetchPurchaseRequests,
  updatePurchaseRequest,
  fetchPRLines,
  fetchResponsibilityCenters,
  fetchSections,
} from "@/services/gseService";

type ViewMode = "list" | "detail";

type PRLineDisplay = {
  prl_id: string;
  item_description: string;
  unit_code: string;
  qty: number;
  unit_price_estimated: number;
  prl_total_amount_estimated: number;
  specifications: string | null;
};

type SpecEntry = {
  label: string;
  value: string;
};

const parseSpecEntries = (specifications: string | null): SpecEntry[] => {
  if (!specifications) return [];
  try {
    const parsed = JSON.parse(specifications);
    if (Array.isArray(parsed)) {
      return parsed.map((e: any) => ({
        label: String(e.label ?? ""),
        value: String(e.value ?? ""),
      }));
    }
  } catch {
    if (specifications.trim()) {
      return [{ label: specifications.trim(), value: "" }];
    }
  }
  return [];
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

const formatCurrency = (n: number) =>
  "P " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ────────────────────────────────────────────────────────────
// PDF GENERATION FOR PURCHASE REQUEST
// ────────────────────────────────────────────────────────────

const generatePRPDF = (
  pr: PurchaseRequest,
  lines: PRLineDisplay[],
  department: string,
  section: string,
) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 15;

  const headerBg: [number, number, number] = [240, 240, 240];
  const borderColor: [number, number, number] = [0, 0, 0];

  const drawRect = (x: number, yPos: number, w: number, h: number, fill?: [number, number, number]) => {
    if (fill) {
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x, yPos, w, h, "F");
    }
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.rect(x, yPos, w, h, "S");
  };

  const text = (
    str: string,
    x: number,
    yPos: number,
    options?: { align?: "left" | "center" | "right"; bold?: boolean; size?: number }
  ) => {
    const align = options?.align || "left";
    const bold = options?.bold || false;
    const size = options?.size || 9;

    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");

    if (align === "center") {
      const textWidth = doc.getTextWidth(str);
      doc.text(str, x - textWidth / 2, yPos);
    } else if (align === "right") {
      const textWidth = doc.getTextWidth(str);
      doc.text(str, x - textWidth, yPos);
    } else {
      doc.text(str, x, yPos);
    }
  };

  // Title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("PURCHASE REQUEST", pageWidth / 2, y, { align: "center" });
  y += 8;
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  // Header Information Grid
  const colWidth1 = 90;
  const colWidth2 = 45;
  const colWidth3 = 45;
  const rowHeight = 12;
  const labelSize = 7;
  const valueSize = 9;

  // Row 1: Procuring Entity | PR No. | Date
  let rowY = y;
  drawRect(marginLeft, rowY, colWidth1, rowHeight);
  drawRect(marginLeft + colWidth1, rowY, colWidth2, rowHeight);
  drawRect(marginLeft + colWidth1 + colWidth2, rowY, colWidth3, rowHeight);

  text("Procuring Entity:", marginLeft + 2, rowY + 4, { size: labelSize });
  text("Local Government Unit", marginLeft + 2, rowY + 9, { bold: true, size: valueSize });

  text("PR No.:", marginLeft + colWidth1 + 2, rowY + 4, { size: labelSize });
  text(pr.pr_no || "-", marginLeft + colWidth1 + 2, rowY + 9, { bold: true, size: valueSize });

  text("Date:", marginLeft + colWidth1 + colWidth2 + 2, rowY + 4, { size: labelSize });
  text(pr.pr_date || "-", marginLeft + colWidth1 + colWidth2 + 2, rowY + 9, { bold: true, size: valueSize });
  y += rowHeight;

  // Row 2: Department | SAI No. | Date
  rowY = y;
  drawRect(marginLeft, rowY, colWidth1, rowHeight);
  drawRect(marginLeft + colWidth1, rowY, colWidth2, rowHeight);
  drawRect(marginLeft + colWidth1 + colWidth2, rowY, colWidth3, rowHeight);

  text("Department:", marginLeft + 2, rowY + 4, { size: labelSize });
  text(department || "-", marginLeft + 2, rowY + 9, { bold: true, size: valueSize });

  text("SAI No.:", marginLeft + colWidth1 + 2, rowY + 4, { size: labelSize });
  text("-", marginLeft + colWidth1 + 2, rowY + 9, { size: valueSize });

  text("Date:", marginLeft + colWidth1 + colWidth2 + 2, rowY + 4, { size: labelSize });
  text("-", marginLeft + colWidth1 + colWidth2 + 2, rowY + 9, { size: valueSize });
  y += rowHeight;

  // Row 3: Section | ALOBS No. | Date
  rowY = y;
  drawRect(marginLeft, rowY, colWidth1, rowHeight);
  drawRect(marginLeft + colWidth1, rowY, colWidth2, rowHeight);
  drawRect(marginLeft + colWidth1 + colWidth2, rowY, colWidth3, rowHeight);

  text("Section:", marginLeft + 2, rowY + 4, { size: labelSize });
  text(section || "-", marginLeft + 2, rowY + 9, { bold: true, size: valueSize });

  text("ALOBS No.:", marginLeft + colWidth1 + 2, rowY + 4, { size: labelSize });
  text("-", marginLeft + colWidth1 + 2, rowY + 9, { size: valueSize });

  text("Date:", marginLeft + colWidth1 + colWidth2 + 2, rowY + 4, { size: labelSize });
  text("-", marginLeft + colWidth1 + colWidth2 + 2, rowY + 9, { size: valueSize });
  y += rowHeight + 4;

  // Line Items Table
  const col = {
    no: 12,
    qty: 15,
    unit: 18,
    desc: 75,
    unitCost: 30,
    amount: 30,
  };

  // Table header
  const tableHeaderHeight = 10;
  let tableX = marginLeft;

  drawRect(tableX, y, col.no, tableHeaderHeight, headerBg);
  text("ITEM", tableX + col.no / 2, y + 4, { align: "center", bold: true, size: 7 });
  text("No.", tableX + col.no / 2, y + 7.5, { align: "center", bold: true, size: 7 });
  tableX += col.no;

  drawRect(tableX, y, col.qty, tableHeaderHeight, headerBg);
  text("QTY", tableX + col.qty / 2, y + 6, { align: "center", bold: true, size: 7 });
  tableX += col.qty;

  drawRect(tableX, y, col.unit, tableHeaderHeight, headerBg);
  text("UNIT", tableX + col.unit / 2, y + 4, { align: "center", bold: true, size: 7 });
  text("OF ISSUE", tableX + col.unit / 2, y + 7.5, { align: "center", bold: true, size: 6 });
  tableX += col.unit;

  drawRect(tableX, y, col.desc, tableHeaderHeight, headerBg);
  text("ITEM DESCRIPTION", tableX + col.desc / 2, y + 6, { align: "center", bold: true, size: 7 });
  tableX += col.desc;

  drawRect(tableX, y, col.unitCost, tableHeaderHeight, headerBg);
  text("ESTIMATED", tableX + col.unitCost / 2, y + 4, { align: "center", bold: true, size: 6 });
  text("UNIT COST", tableX + col.unitCost / 2, y + 7.5, { align: "center", bold: true, size: 6 });
  tableX += col.unitCost;

  drawRect(tableX, y, col.amount, tableHeaderHeight, headerBg);
  text("ESTIMATED", tableX + col.amount / 2, y + 4, { align: "center", bold: true, size: 6 });
  text("AMOUNT", tableX + col.amount / 2, y + 7.5, { align: "center", bold: true, size: 6 });

  y += tableHeaderHeight;

  // Table rows
  lines.forEach((line, idx) => {
    const specs = parseSpecEntries(line.specifications);
    doc.setFontSize(8);
    const descTextLines = doc.splitTextToSize(line.item_description || "", col.desc - 4);

    let specHeight = 0;
    if (specs.length > 0) {
      doc.setFontSize(7);
      specs.forEach((sp) => {
        const specText = sp.value ? `${sp.label}: ${sp.value}` : sp.label;
        const specLines = doc.splitTextToSize(specText, col.desc - 4);
        specHeight += specLines.length * 3;
      });
    }

    const minRowHeight = 8;
    const textHeight = descTextLines.length * 3.5 + specHeight + 3;
    const rowH = Math.max(minRowHeight, textHeight);

    if (y + rowH > pageHeight - 50) {
      doc.addPage();
      y = 15;
    }

    tableX = marginLeft;

    drawRect(tableX, y, col.no, rowH);
    text(String(idx + 1), tableX + col.no / 2, y + 5, { align: "center", size: 8 });
    tableX += col.no;

    drawRect(tableX, y, col.qty, rowH);
    text(String(line.qty), tableX + col.qty / 2, y + 5, { align: "center", size: 8 });
    tableX += col.qty;

    drawRect(tableX, y, col.unit, rowH);
    text(line.unit_code?.toUpperCase() || "", tableX + col.unit / 2, y + 5, { align: "center", size: 8 });
    tableX += col.unit;

    drawRect(tableX, y, col.desc, rowH);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(descTextLines, tableX + 2, y + 4.5);

    if (specs.length > 0) {
      let specY = y + 4.5 + descTextLines.length * 3.5;
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      specs.forEach((sp) => {
        const specText = sp.value ? `${sp.label}: ${sp.value}` : sp.label;
        const specLines = doc.splitTextToSize(specText, col.desc - 4);
        doc.text(specLines, tableX + 2, specY);
        specY += specLines.length * 3;
      });
      doc.setTextColor(0, 0, 0);
    }
    tableX += col.desc;

    drawRect(tableX, y, col.unitCost, rowH);
    text(formatCurrency(line.unit_price_estimated || 0), tableX + col.unitCost - 2, y + 5, { align: "right", size: 8 });
    tableX += col.unitCost;

    drawRect(tableX, y, col.amount, rowH);
    text(formatCurrency(line.prl_total_amount_estimated || 0), tableX + col.amount - 2, y + 5, { align: "right", bold: true, size: 8 });

    y += rowH;
  });

  // Nothing Follows row
  const nfRowH = 8;
  tableX = marginLeft;
  drawRect(tableX, y, col.no + col.qty + col.unit + col.desc, nfRowH);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  const nfX = marginLeft + (col.no + col.qty + col.unit + col.desc) / 2;
  doc.text("xxxxxNothing Followsxxxxx", nfX, y + 5.5, { align: "center" });
  doc.setTextColor(0, 0, 0);

  tableX = marginLeft + col.no + col.qty + col.unit + col.desc;
  drawRect(tableX, y, col.unitCost, nfRowH);
  tableX += col.unitCost;
  drawRect(tableX, y, col.amount, nfRowH);
  y += nfRowH;

  // Total row
  const totalRowH = 10;
  const total = lines.reduce((sum, l) => sum + (l.prl_total_amount_estimated || 0), 0);
  tableX = marginLeft;
  drawRect(tableX, y, col.no + col.qty + col.unit + col.desc + col.unitCost, totalRowH, headerBg);
  text("TOTAL", marginLeft + col.no + col.qty + col.unit + col.desc + col.unitCost - 2, y + 6.5, { align: "right", bold: true, size: 9 });

  tableX = marginLeft + col.no + col.qty + col.unit + col.desc + col.unitCost;
  drawRect(tableX, y, col.amount, totalRowH, headerBg);
  text(formatCurrency(total), tableX + col.amount - 2, y + 6.5, { align: "right", bold: true, size: 10 });
  y += totalRowH + 4;

  // Purpose
  drawRect(marginLeft, y, contentWidth, 15);
  text("Purpose:", marginLeft + 2, y + 4, { size: labelSize });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const purposeLines = doc.splitTextToSize(pr.purpose || "", contentWidth - 6);
  doc.text(purposeLines.slice(0, 2), marginLeft + 2, y + 9);
  y += 15;

  // Signatories
  if (y > pageHeight - 50) {
    doc.addPage();
    y = 20;
  } else {
    y = Math.max(y + 10, pageHeight - 55);
  }

  const sigWidth = contentWidth / 2 - 10;

  text("Requested by:", marginLeft, y, { size: 8 });
  text("Approved by:", marginLeft + contentWidth / 2 + 10, y, { size: 8 });
  y += 15;

  doc.setLineWidth(0.3);
  doc.line(marginLeft, y, marginLeft + sigWidth, y);
  doc.line(marginLeft + contentWidth / 2 + 10, y, marginLeft + contentWidth / 2 + 10 + sigWidth, y);
  y += 4;

  text(pr.requested_by || "", marginLeft + sigWidth / 2, y, { align: "center", bold: true, size: 9 });
  text(pr.approved_by || "", marginLeft + contentWidth / 2 + 10 + sigWidth / 2, y, { align: "center", bold: true, size: 9 });

  doc.save(`PR_${pr.pr_no || pr.pr_id}.pdf`);
};

const PurchaseRequestApproval = () => {
  const [mode, setMode] = useState<ViewMode>("list");
  const [prs, setPrs] = useState<PurchaseRequest[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("SUBMITTED");
  const [listLoading, setListLoading] = useState(false);
  const [centers, setCenters] = useState<ResponsibilityCenter[]>([]);
  const [sections, setSections] = useState<ResponsibilityCenterSection[]>([]);

  // Detail view state
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);
  const [prLines, setPrLines] = useState<PRLineDisplay[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const loadPRs = useCallback(async () => {
    setListLoading(true);
    const [data, rc, secs] = await Promise.all([
      fetchPurchaseRequests(),
      fetchResponsibilityCenters(),
      fetchSections(),
    ]);
    setPrs(data);
    setCenters(rc);
    setSections(secs);
    setListLoading(false);
  }, []);

  useEffect(() => {
    loadPRs();
  }, [loadPRs]);

  const rcName = (id: string) =>
    centers.find((c) => c.id === id)?.description ?? id;

  const sectionName = (id: string | null) =>
    id ? sections.find((s) => s.id === id)?.description ?? id : "-";

  const openDetail = async (pr: PurchaseRequest) => {
    setSelectedPR(pr);
    const lines = await fetchPRLines(pr.pr_id);
    setPrLines(lines as PRLineDisplay[]);
    setMode("detail");
  };

  const closeDetail = () => {
    setMode("list");
    setSelectedPR(null);
    setPrLines([]);
    setRejectionReason("");
    setShowRejectModal(false);
    loadPRs();
  };

  const handleApprove = async () => {
    if (!selectedPR) return;
    setIsProcessing(true);
    const result = await updatePurchaseRequest(selectedPR.pr_id, {
      status: "APPROVED",
    });
    setIsProcessing(false);
    if (result.success) {
      alert(`PR ${selectedPR.pr_no} has been APPROVED.`);
      closeDetail();
    } else {
      alert(result.error || "Failed to approve PR");
    }
  };

  const handleReject = async () => {
    if (!selectedPR) return;
    setIsProcessing(true);
    const result = await updatePurchaseRequest(selectedPR.pr_id, {
      status: "REJECTED",
      remarks: rejectionReason
        ? `Rejected: ${rejectionReason}`
        : selectedPR.remarks || undefined,
    });
    setIsProcessing(false);
    if (result.success) {
      alert(`PR ${selectedPR.pr_no} has been REJECTED.`);
      closeDetail();
    } else {
      alert(result.error || "Failed to reject PR");
    }
  };

  const filtered = prs.filter((pr) => {
    const q = search.toLowerCase();
    const matchSearch =
      (pr.pr_no || "").toLowerCase().includes(q) ||
      pr.purpose.toLowerCase().includes(q) ||
      rcName(pr.rc_id).toLowerCase().includes(q);
    if (activeTab === "all") return matchSearch;
    return matchSearch && pr.status === activeTab;
  });

  const submittedCount = prs.filter((p) => p.status === "SUBMITTED").length;
  const approvedCount = prs.filter((p) => p.status === "APPROVED").length;
  const rejectedCount = prs.filter((p) => p.status === "REJECTED").length;

  // ═══════════════════════════════════════════════════════
  //  RENDER — DETAIL VIEW
  // ═══════════════════════════════════════════════════════

  if (mode === "detail" && selectedPR) {
    const cellBorder = "border border-gray-800";
    const cellPad = "px-3 py-2";
    const labelCls = "text-[10px] text-gray-500 font-medium uppercase";

    const total = prLines.reduce(
      (sum, line) => sum + (line.prl_total_amount_estimated || 0),
      0,
    );

    return (
      <div className="space-y-4 pb-10">
        {/* Top action bar */}
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button
            onClick={closeDetail}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => {
                generatePRPDF(
                  selectedPR,
                  prLines,
                  rcName(selectedPR.rc_id),
                  sectionName(selectedPR.rcs_id),
                );
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            {selectedPR.status === "SUBMITTED" && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
            {selectedPR.status !== "SUBMITTED" && (
              <span
                className={`inline-block px-4 py-2 text-sm font-medium rounded-lg ${statusColors[selectedPR.status]}`}
              >
                {selectedPR.status}
              </span>
            )}
          </div>
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Reject Purchase Request
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for rejecting PR{" "}
                <strong>{selectedPR.pr_no}</strong>:
              </p>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:border-red-500"
                rows={3}
                placeholder="Enter rejection reason (optional)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    handleReject();
                  }}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Paper document ─────────────────────────────── */}
        <div className="bg-white border-2 border-gray-800 max-w-7xl mx-auto shadow-lg text-gray-900">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 py-4 px-6">
            <h1 className="font-bold text-lg tracking-widest">
              PURCHASE REQUEST
            </h1>
          </div>

          {/* ── Meta fields ──────────────────────────────── */}
          <table className="w-full text-xs border-collapse border-b-2 border-gray-800">
            <colgroup>
              <col style={{ width: "52%" }} />
              <col style={{ width: "24%" }} />
              <col style={{ width: "24%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-l-0`}
                >
                  <span className={labelCls}>Procuring Entity:</span>
                </td>
                <td className={`${cellBorder} ${cellPad} border-t-0`}>
                  <span className={labelCls}>PR No.</span>
                  <div className="font-semibold mt-0.5">
                    {selectedPR.pr_no || "-"}
                  </div>
                </td>
                <td
                  className={`${cellBorder} ${cellPad} border-t-0 border-r-0`}
                >
                  <span className={labelCls}>Date:</span>
                  <div className="font-semibold mt-0.5">
                    {selectedPR.pr_date}
                  </div>
                </td>
              </tr>

              <tr>
                <td className={`${cellBorder} ${cellPad} border-l-0`}>
                  <span className={labelCls}>Department:</span>
                  <div className="font-semibold mt-0.5">
                    {rcName(selectedPR.rc_id)}
                  </div>
                </td>
                <td className={`${cellBorder} ${cellPad}`}>
                  <span className={labelCls}>SAI No.</span>
                </td>
                <td className={`${cellBorder} ${cellPad} border-r-0`}>
                  <span className={labelCls}>Date:</span>
                </td>
              </tr>

              <tr>
                <td
                  className={`${cellBorder} ${cellPad} border-l-0 border-b-0`}
                >
                  <span className={labelCls}>Section:</span>
                  <div className="font-semibold mt-0.5">
                    {sectionName(selectedPR.rcs_id)}
                  </div>
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
              {prLines.map((line, idx) => {
                const specs = parseSpecEntries(line.specifications);
                return (
                  <tr key={line.prl_id} className="border-b border-gray-300">
                    <td className="border-r border-gray-800 px-2 py-1 text-center align-top text-xs">
                      {idx + 1}
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 text-center align-top">
                      {line.qty}
                    </td>
                    <td className="border-r border-gray-800 px-1 py-1 text-center align-top">
                      {line.unit_code}
                    </td>
                    <td className="border-r border-gray-800 px-2 py-1 align-top">
                      <div className="font-semibold">
                        {line.item_description}
                      </div>
                      {specs.length > 0 && (
                        <div className="mt-1 text-[10px] text-gray-600">
                          {specs.map((s, i) => (
                            <div key={i}>
                              <span className="font-medium">{s.label}</span>
                              {s.value && `: ${s.value}`}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border-r border-gray-800 px-2 py-1 text-right align-top">
                      {peso(line.unit_price_estimated)}
                    </td>
                    <td className="px-2 py-1 text-right align-top font-medium">
                      {peso(line.prl_total_amount_estimated)}
                    </td>
                  </tr>
                );
              })}

              {/* Nothing Follows */}
              {prLines.length > 0 && (
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
              <div className="flex-1 text-xs">{selectedPR.purpose}</div>
            </div>
          </div>

          {/* ── Requested by ─────────────────────────────── */}
          <div className="border-t border-gray-800 px-3 py-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0">
                Requested by :
              </span>
              <span className="text-xs">{selectedPR.requested_by || "-"}</span>
            </div>
          </div>

          {/* ── Remarks (if rejected) ─────────────────────── */}
          {selectedPR.remarks && (
            <div className="border-t border-gray-800 px-3 py-3 bg-gray-50">
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase shrink-0 pt-1">
                  Remarks
                </span>
                <div className="flex-1 text-xs text-gray-700">
                  {selectedPR.remarks}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  //  RENDER — LIST VIEW
  // ═══════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Request Approval"
        subtitle="Review and approve submitted Purchase Requests"
        icon={<ClipboardCheck className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard
          label="Pending Approval"
          value={submittedCount}
          color="primary"
        />
        <StatCard label="Approved" value={approvedCount} color="success" />
        <StatCard label="Rejected" value={rejectedCount} color="danger" />
      </StatsRow>

      <Tabs
        tabs={[
          { id: "SUBMITTED", label: `Pending (${submittedCount})` },
          { id: "APPROVED", label: `Approved (${approvedCount})` },
          { id: "REJECTED", label: `Rejected (${rejectedCount})` },
          { id: "all", label: "All" },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <ActionsBar>
        <PrimaryButton onClick={loadPRs} disabled={listLoading}>
          <RefreshCw
            className={`w-4 h-4 ${listLoading ? "animate-spin" : ""}`}
          />
          Refresh
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
                {peso(row.pr_total_amount ?? 0)}
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
                <IconButton
                  onClick={() => openDetail(row)}
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </IconButton>
                {row.status === "SUBMITTED" && (
                  <>
                    <IconButton
                      onClick={async () => {
                        if (confirm(`Approve PR ${row.pr_no}?`)) {
                          const result = await updatePurchaseRequest(
                            row.pr_id,
                            {
                              status: "APPROVED",
                            },
                          );
                          if (result.success) {
                            loadPRs();
                          } else {
                            alert(result.error || "Failed to approve");
                          }
                        }
                      }}
                      title="Approve"
                      variant="success"
                    >
                      <Check className="w-4 h-4" />
                    </IconButton>
                    <IconButton
                      onClick={async () => {
                        const reason = prompt(
                          `Reject PR ${row.pr_no}? Enter reason (optional):`,
                        );
                        if (reason !== null) {
                          const result = await updatePurchaseRequest(
                            row.pr_id,
                            {
                              status: "REJECTED",
                              remarks: reason
                                ? `Rejected: ${reason}`
                                : row.remarks || undefined,
                            },
                          );
                          if (result.success) {
                            loadPRs();
                          } else {
                            alert(result.error || "Failed to reject");
                          }
                        }
                      }}
                      title="Reject"
                      variant="danger"
                    >
                      <X className="w-4 h-4" />
                    </IconButton>
                  </>
                )}
              </div>
            ),
          },
        ]}
        title={`Purchase Requests for Approval (${filtered.length})`}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by PR no., purpose, or department..."
        emptyMessage={
          listLoading
            ? "Loading purchase requests..."
            : activeTab === "SUBMITTED"
              ? "No pending purchase requests for approval."
              : "No purchase requests found."
        }
      />
    </div>
  );
};

export default PurchaseRequestApproval;
