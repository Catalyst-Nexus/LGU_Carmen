/**
 * generatePaySlipPDF.ts
 *
 * Two PDF generators:
 *  1. downloadPayrollRegisterPDF  — landscape table (all employees)
 *  2. downloadPaySlipPDF          — portrait individual payslip
 *
 * Install: npm install jspdf jspdf-autotable
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// ── Helpers ──────────────────────────────────────────────────────────────────

const peso = (n: number): string =>
  n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (iso: string): string => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

const dedAmt = (
  deds: { code: string; amount: number }[],
  ...codes: string[]
): number =>
  deds
    .filter((d) => codes.includes(d.code))
    .reduce((s, d) => s + d.amount, 0);

// ── Shared employee shape ────────────────────────────────────────────────────

export interface PayrollEmployee {
  employeeName: string;
  employeeNo: string;
  positionTitle: string;
  officeName: string;
  rate: number;
  daysWorked: number;
  basicPay: number;
  overtimeHours: number;
  overtimePay: number;
  grossAmount: number;
  deductions: { code: string; label: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1.  PAYROLL REGISTER PDF  (landscape table — matches the LGU payroll format)
// ═════════════════════════════════════════════════════════════════════════════

export interface PayrollRegisterPDFData {
  companyName: string;
  companyAddress: string;
  periodStart: string;
  periodEnd: string;
  employees: PayrollEmployee[];
  preparedBy: string;
}

export const downloadPayrollRegisterPDF = (data: PayrollRegisterPDFData): void => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "legal" });
  const pw = doc.internal.pageSize.getWidth();
  let y = 12;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(data.companyName, pw / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.companyAddress, pw / 2, y, { align: "center" });
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("P A Y R O L L", pw / 2, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `For the period of ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`,
    pw / 2,
    y,
    { align: "center" },
  );
  y += 6;

  // ── Table ───────────────────────────────────────────────────────────────
  const hdrStyles = {
    fillColor: [44, 62, 80] as [number, number, number],
    textColor: 255 as const,
    fontSize: 5.5,
    halign: "center" as const,
    valign: "middle" as const,
    cellPadding: 1,
  };

  const head = [
    [
      { content: "#", rowSpan: 2, styles: hdrStyles },
      { content: "NAME", rowSpan: 2, styles: hdrStyles },
      { content: "RATE", rowSpan: 2, styles: hdrStyles },
      { content: "NO. OF\nDAYS", rowSpan: 2, styles: hdrStyles },
      { content: "AMOUNT", rowSpan: 2, styles: hdrStyles },
      { content: "OVERTIME", colSpan: 4, styles: hdrStyles },
      { content: "ADJ. PREV.\nSALARY", rowSpan: 2, styles: hdrStyles },
      { content: "ALLOW-\nANCE", rowSpan: 2, styles: hdrStyles },
      { content: "GROSS\nAMOUNT", rowSpan: 2, styles: hdrStyles },
      { content: "EMP.\nSAVINGS", rowSpan: 2, styles: hdrStyles },
      { content: "LOANS", rowSpan: 2, styles: hdrStyles },
      { content: "UT", rowSpan: 2, styles: hdrStyles },
      { content: "DEDUC-\nTIONS", rowSpan: 2, styles: hdrStyles },
      { content: "PREMIUMS", colSpan: 3, styles: hdrStyles },
      { content: "NET\nAMOUNT", rowSpan: 2, styles: hdrStyles },
      { content: "SIGNATURE", rowSpan: 2, styles: hdrStyles },
    ],
    [
      { content: "HRS", styles: hdrStyles },
      { content: "REG OT", styles: hdrStyles },
      { content: "HRS", styles: hdrStyles },
      { content: "SUN/SPL.\nHOL.", styles: hdrStyles },
      { content: "GSIS", styles: hdrStyles },
      { content: "PHIC", styles: hdrStyles },
      { content: "HDMF", styles: hdrStyles },
    ],
  ];

  const body = data.employees.map((e, i) => {
    const gsis = dedAmt(e.deductions, "GSIS_PS");
    const phic = dedAmt(e.deductions, "PHILHEALTH");
    const hdmf = dedAmt(e.deductions, "PAGIBIG");
    const loans = dedAmt(e.deductions, "GSIS_LOAN", "PAGIBIG_LOAN", "SALARY_LOAN");
    const otherDed = e.totalDeductions - gsis - phic - hdmf - loans;

    return [
      i + 1,
      e.employeeName,
      peso(e.rate),
      e.daysWorked,
      peso(e.basicPay),
      e.overtimeHours > 0 ? e.overtimeHours.toFixed(2) : "",
      e.overtimePay > 0 ? peso(e.overtimePay) : "",
      "", // OT HRS 2
      "", // SUN/SPL HOL
      "", // ADJ PREV SALARY
      "", // ALLOWANCE
      peso(e.grossAmount),
      "", // EMPLOYEE'S SAVINGS
      loans > 0 ? peso(loans) : "",
      "", // UT
      otherDed > 0 ? peso(otherDed) : "",
      gsis > 0 ? peso(gsis) : "",
      phic > 0 ? peso(phic) : "",
      hdmf > 0 ? peso(hdmf) : "",
      peso(e.netPay),
      "", // SIGNATURE
    ];
  });

  // Totals row
  const totals = data.employees.reduce(
    (acc, e) => {
      acc.basic += e.basicPay;
      acc.gross += e.grossAmount;
      acc.gsis += dedAmt(e.deductions, "GSIS_PS");
      acc.phic += dedAmt(e.deductions, "PHILHEALTH");
      acc.hdmf += dedAmt(e.deductions, "PAGIBIG");
      acc.loans += dedAmt(e.deductions, "GSIS_LOAN", "PAGIBIG_LOAN", "SALARY_LOAN");
      acc.net += e.netPay;
      acc.ded += e.totalDeductions;
      return acc;
    },
    { basic: 0, gross: 0, gsis: 0, phic: 0, hdmf: 0, loans: 0, net: 0, ded: 0 },
  );
  const otherDedTotal = totals.ded - totals.gsis - totals.phic - totals.hdmf - totals.loans;

  body.push([
    "",
    "TOTAL",
    "",
    "",
    peso(totals.basic),
    "", "", "", "",
    "", "",
    peso(totals.gross),
    "",
    totals.loans > 0 ? peso(totals.loans) : "",
    "",
    otherDedTotal > 0 ? peso(otherDedTotal) : "",
    totals.gsis > 0 ? peso(totals.gsis) : "",
    totals.phic > 0 ? peso(totals.phic) : "",
    totals.hdmf > 0 ? peso(totals.hdmf) : "",
    peso(totals.net),
    "",
  ]);

  autoTable(doc, {
    startY: y,
    head,
    body,
    theme: "grid",
    styles: { fontSize: 5.5, cellPadding: 1, overflow: "linebreak" },
    headStyles: { fillColor: [44, 62, 80], textColor: 255, halign: "center", valign: "middle" },
    bodyStyles: { valign: "middle" },
    columnStyles: {
      0: { cellWidth: 7, halign: "center" },          // #
      1: { cellWidth: 32 },                            // NAME
      2: { cellWidth: 14, halign: "right" },           // RATE
      3: { cellWidth: 10, halign: "center" },          // DAYS
      4: { cellWidth: 18, halign: "right" },           // AMOUNT
      5: { cellWidth: 10, halign: "center" },          // OT HRS
      6: { cellWidth: 14, halign: "right" },           // REG OT
      7: { cellWidth: 10, halign: "center" },          // OT HRS 2
      8: { cellWidth: 14, halign: "right" },           // SUN/SPL
      9: { cellWidth: 14, halign: "right" },           // ADJ PREV
      10: { cellWidth: 14, halign: "right" },          // ALLOWANCE
      11: { cellWidth: 18, halign: "right" },          // GROSS
      12: { cellWidth: 14, halign: "right" },          // SAVINGS
      13: { cellWidth: 14, halign: "right" },          // LOANS
      14: { cellWidth: 10, halign: "right" },          // UT
      15: { cellWidth: 14, halign: "right" },          // DEDUCTIONS
      16: { cellWidth: 14, halign: "right" },          // GSIS
      17: { cellWidth: 14, halign: "right" },          // PHIC
      18: { cellWidth: 14, halign: "right" },          // HDMF
      19: { cellWidth: 18, halign: "right" },          // NET
      20: { cellWidth: 24 },                           // SIGNATURE
    },
    didParseCell: (hookData) => {
      // Bold the totals row
      if (hookData.section === "body" && hookData.row.index === body.length - 1) {
        hookData.cell.styles.fontStyle = "bold";
      }
    },
  });

  // ── Footer / Signatures ─────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY ?? 160;
  y = finalY + 6;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.text(
    "I hereby acknowledge that the computation and total of my salary stated above for the given period is correct.",
    pw / 2,
    y,
    { align: "center" },
  );
  y += 8;

  const leftM = 15;
  const col2 = pw / 4 + 10;
  const col3 = pw / 2 + 10;
  const col4 = (pw * 3) / 4 + 5;
  const lineW = 55;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("PREPARED BY:", leftM, y);
  doc.text("CHECKED AND VERIFIED BY:", col2, y);
  doc.text("RECOMMENDED BY:", col3, y);
  doc.text("APPROVED BY:", col4, y);
  y += 10;

  doc.setLineWidth(0.3);
  doc.line(leftM, y, leftM + lineW, y);
  doc.line(col2, y, col2 + lineW, y);
  doc.line(col3, y, col3 + lineW, y);
  doc.line(col4, y, col4 + lineW, y);
  y += 3;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(data.preparedBy, leftM, y);

  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleString("en-US")}`, pw / 2, y, {
    align: "center",
  });

  // ── Save ────────────────────────────────────────────────────────────────
  doc.save(`payroll_${data.periodStart}_${data.periodEnd}.pdf`);
};

// ═════════════════════════════════════════════════════════════════════════════
// 2.  INDIVIDUAL PAYSLIP PDF  (portrait, single employee)
// ═════════════════════════════════════════════════════════════════════════════

export interface PaySlipPDFData {
  companyName: string;
  companyAddress: string;
  periodStart: string;
  periodEnd: string;
  employeeName: string;
  employeeNo: string;
  positionTitle: string;
  officeName: string;
  rate: number;
  daysWorked: number;
  basicPay: number;
  overtimeHours: number;
  overtimePay: number;
  grossAmount: number;
  deductions: { code: string; label: string; amount: number }[];
  totalDeductions: number;
  netPay: number;
  preparedBy: string;
}

export const downloadPaySlipPDF = (data: PaySlipPDFData): void => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const leftM = 20;
  const rightM = pw - 20;
  const contentW = rightM - leftM;
  let y = 20;

  const hLine = (y1: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(leftM, y1, rightM, y1);
  };

  const sectionHeader = (title: string) => {
    doc.setFillColor(230, 230, 230);
    doc.rect(leftM, y - 4, contentW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(title, leftM + 2, y);
    y += 5;
  };

  const rowPair = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(label, leftM + 4, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(value, rightM - 4, y, { align: "right" });
    y += 5;
  };

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.companyName, pw / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(data.companyAddress, pw / 2, y, { align: "center" });
  y += 8;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("PAYROLL", pw / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `For the period of ${fmtDate(data.periodStart)} - ${fmtDate(data.periodEnd)}`,
    pw / 2,
    y,
    { align: "center" },
  );
  y += 6;
  hLine(y);
  y += 6;

  // ── Employee Info ───────────────────────────────────────────────────────
  const infoValueX = leftM + 30;
  doc.setFontSize(9);
  for (const [label, value] of [
    ["NAME:", data.employeeName],
    ["EMPLOYEE #:", data.employeeNo],
    ["POSITION:", data.positionTitle],
    ["OFFICE:", data.officeName],
  ] as const) {
    doc.setFont("helvetica", "bold");
    doc.text(label, leftM, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, infoValueX, y);
    y += 5;
  }
  y += 3;
  hLine(y);
  y += 6;

  // ── Earnings ────────────────────────────────────────────────────────────
  sectionHeader("EARNINGS");
  rowPair("RATE", `PHP ${peso(data.rate)}`);
  rowPair("No. of Days", data.daysWorked.toFixed(2));
  rowPair("BASIC PAY (AMOUNT)", `PHP ${peso(data.basicPay)}`);
  if (data.overtimeHours > 0) {
    rowPair("REGULAR OT (HRS)", data.overtimeHours.toFixed(2));
    rowPair("REGULAR OT PAY", `PHP ${peso(data.overtimePay)}`);
  }
  y += 1;
  hLine(y);
  y += 5;
  rowPair("GROSS AMOUNT", `PHP ${peso(data.grossAmount)}`, true);
  y += 3;

  // ── Deductions ──────────────────────────────────────────────────────────
  sectionHeader("DEDUCTIONS");
  for (const ded of data.deductions) {
    if (ded.amount > 0) rowPair(ded.label, `PHP ${peso(ded.amount)}`);
  }
  y += 1;
  hLine(y);
  y += 5;
  rowPair("TOTAL DEDUCTIONS", `PHP ${peso(data.totalDeductions)}`, true);
  y += 4;

  // ── Net Pay ─────────────────────────────────────────────────────────────
  doc.setFillColor(34, 139, 34);
  doc.rect(leftM, y - 4, contentW, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAY", leftM + 4, y + 1);
  doc.text(`PHP ${peso(data.netPay)}`, rightM - 4, y + 1, { align: "right" });
  doc.setTextColor(0, 0, 0);
  y += 12;

  // ── Footer ──────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text(
    "I acknowledge that the above reflects my compensation for the stated period.",
    pw / 2,
    y,
    { align: "center" },
  );
  y += 10;

  const sigColRight = pw / 2 + 10;
  const sigLineW = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("PREPARED BY:", leftM, y);
  doc.text("EMPLOYEE SIGNATURE:", sigColRight, y);
  y += 8;

  doc.setLineWidth(0.4);
  doc.line(leftM, y, leftM + sigLineW, y);
  doc.line(sigColRight, y, sigColRight + sigLineW, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(data.preparedBy, leftM, y);
  doc.text(data.employeeName, sigColRight, y);
  y += 10;

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on ${new Date().toLocaleString("en-US")}`, pw / 2, y, {
    align: "center",
  });

  const safeName = data.employeeName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "_");
  doc.save(`payslip_${safeName}_${data.periodStart}_${data.periodEnd}.pdf`);
};
