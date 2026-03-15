import jsPDF from "jspdf";

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────

export interface PRDocumentHeader {
  provinceName: string;
  entityName: string;
  subEntityName?: string;
  address: string;
}

export interface PRSignatory {
  name: string;
  position: string;
  title?: string;
}

export interface PRDocumentFooter {
  signatories: PRSignatory[];
}

// ────────────────────────────────────────────────────────────
// DEFAULT CONFIGURATIONS
// ────────────────────────────────────────────────────────────

export const DEFAULT_PR_HEADER: PRDocumentHeader = {
  provinceName: "Province of Agusan del Norte",
  entityName: "PROVINCIAL HEALTH OFFICE",
  subEntityName: "Agusan del Norte Provincial Hospital",
  address: "Libertad, Butuan City",
};

export const DEFAULT_PR_FOOTER_SIGNATORIES: PRSignatory[] = [
  {
    name: "ODELIO Y. FERRER, MD., MBA-HA, FMAS, FICS",
    position: "Provincial Health Officer II",
    title: "Requested by:",
  },
  {
    name: "MA. CECILE A. OKUT",
    position: "Provincial Treasurer",
    title: "Cash Availability:",
  },
  {
    name: "MA. ANGELICA ROSEDELL M. AMANTE",
    position: "Provincial Governor",
    title: "Approved by:",
  },
];

// ────────────────────────────────────────────────────────────
// DOCUMENT HEADER COMPONENT
// ────────────────────────────────────────────────────────────

export const drawPRDocumentHeader = (
  doc: jsPDF,
  headerConfig: PRDocumentHeader = DEFAULT_PR_HEADER,
  startY: number = 10
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  let y = startY;

  // Province Name
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(headerConfig.provinceName, centerX, y, { align: "center" });
  y += 5;

  // Entity Name (Bold)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(headerConfig.entityName, centerX, y, { align: "center" });
  y += 5;

  // Sub-Entity Name (if provided)
  if (headerConfig.subEntityName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(headerConfig.subEntityName, centerX, y, { align: "center" });
    y += 4;
  }

  // Address
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(headerConfig.address, centerX, y, { align: "center" });
  y += 3;

  // Horizontal line separator
  const marginLeft = 15;
  const marginRight = 15;
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 5;

  return y;
};

// ────────────────────────────────────────────────────────────
// DOCUMENT FOOTER COMPONENT
// ────────────────────────────────────────────────────────────

export const drawPRDocumentFooter = (
  doc: jsPDF,
  signatories: PRSignatory[] = DEFAULT_PR_FOOTER_SIGNATORIES,
  startY?: number
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  // Calculate footer height needed
  const signatoryHeight = 25;
  const totalRows = Math.ceil(signatories.length / 3);
  const footerHeight = totalRows * signatoryHeight + 10;

  // Determine starting Y position
  let y = startY ?? pageHeight - footerHeight - 10;

  // Check if we need a new page
  if (y < 50) {
    doc.addPage();
    y = 20;
  }

  // Calculate column widths based on number of signatories
  const signatoriesPerRow = Math.min(signatories.length, 3);
  const colWidth = contentWidth / signatoriesPerRow;
  const signatureLineWidth = colWidth - 20;

  // Draw signatories
  signatories.forEach((signatory, index) => {
    const rowIndex = Math.floor(index / 3);
    const colIndex = index % 3;
    const x = marginLeft + colIndex * colWidth + colWidth / 2;
    const rowY = y + rowIndex * signatoryHeight;

    // Title (e.g., "Requested by:")
    if (signatory.title) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text(signatory.title, x, rowY, { align: "center" });
    }

    // Signature line
    const lineY = rowY + 12;
    doc.setLineWidth(0.3);
    doc.line(
      x - signatureLineWidth / 2,
      lineY,
      x + signatureLineWidth / 2,
      lineY
    );

    // Name (Bold, uppercase)
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(signatory.name.toUpperCase(), x, lineY + 4, { align: "center" });

    // Position
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(signatory.position, x, lineY + 8, { align: "center" });
  });

  return y + totalRows * signatoryHeight;
};
