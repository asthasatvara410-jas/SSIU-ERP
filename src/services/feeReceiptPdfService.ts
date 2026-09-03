/**
 * Centralized SSIU ERP-Wide Fee Receipt PDF Generator Service
 * Generates an official A4 PORTRAIT (1 Page, 210mm x 297mm) PDF with 2 identical vertically-stacked copies:
 * TOP HALF: STUDENT COPY (~126mm height)
 * MIDDLE: CUT / TEAR Dotted Line with Scissors
 * BOTTOM HALF: DEPARTMENT COPY (~126mm height)
 * Perfectly balanced across the A4 sheet with zero excessive blank space.
 * Opens directly in a new browser tab via native browser PDF viewer.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UniversalFeeReceiptData, numberToWords } from '../components/receipt/receiptTypes';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

/**
 * 1. Core Reusable Async PDF Generation Function
 * Generates a real client-side PDF Blob using jsPDF + jspdf-autotable in A4 Portrait (1 Page)
 */
export async function generateReceiptPDF(receipt: UniversalFeeReceiptData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = 210;
  const marginX = 8;
  const copyWidth = pageWidth - (marginX * 2); // 194mm

  // 1. Render Top Copy: STUDENT COPY starting at Y = 8mm
  const topCopyHeight = renderReceiptPortraitCopy(doc, receipt, 'STUDENT COPY', marginX, 8, copyWidth);

  // 2. Middle Dotted Cut-Guide Line positioned immediately after Student Copy
  const separatorY = 8 + topCopyHeight + 6;
  doc.setDrawColor(148, 163, 184); // Slate 400
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(marginX, separatorY, pageWidth - marginX, separatorY);
  doc.setLineDashPattern([], 0); // reset line dash

  // Scissors Cut Guide Text
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.8);
  doc.text(
    '✂ - - - - - - - - - - - - - - - - - - - - CUT / TEAR ALONG THIS LINE (STUDENT COPY ON TOP / DEPARTMENT COPY ON BOTTOM) - - - - - - - - - - - - - - - - - - - - ✂',
    pageWidth / 2,
    separatorY - 0.9,
    { align: 'center' }
  );

  // 3. Render Bottom Copy: DEPARTMENT COPY starting directly below the CUT/TEAR line
  const bottomStartY = separatorY + 6;
  renderReceiptPortraitCopy(doc, receipt, 'DEPARTMENT COPY', marginX, bottomStartY, copyWidth);

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Helper to render one full content-driven receipt copy inside A4 Portrait dimensions (194mm wide)
 * Returns the exact content height rendered.
 */
function renderReceiptPortraitCopy(
  doc: jsPDF,
  receipt: UniversalFeeReceiptData,
  copyType: 'STUDENT COPY' | 'DEPARTMENT COPY',
  startX: number,
  startY: number,
  width: number
): number {
  const brandNavy: [number, number, number] = [15, 44, 89]; // #0F2C59
  const brandOrange: [number, number, number] = [243, 112, 35]; // #F37023
  const textDark: [number, number, number] = [15, 23, 42]; // #0F172A
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const borderCol: [number, number, number] = [148, 163, 184]; // #94A3B8

  let curY = startY + 2.5;

  // 1. Header Section: Logo & University Details
  try {
    if (SWARRNIM_LOGO_PNG_BASE64) {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', startX + 2.5, curY, 18, 9);
    }
  } catch {
    // Fallback if logo fails
  }

  // University Header Texts
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', startX + 23, curY + 3);

  doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setFontSize(6.8);
  const deptTitle = receipt.departmentOrSectionTitle || 'FINANCE & ACCOUNTS DEPARTMENT';
  doc.text(deptTitle.toUpperCase(), startX + 23, curY + 6.3);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.2);
  doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar–382420, Gujarat, India • www.swarrnim.edu.in', startX + 23, curY + 9.2);

  // Far Right: Copy Badge & Status
  const isStudent = copyType === 'STUDENT COPY';
  doc.setFillColor(isStudent ? 239 : 255, isStudent ? 246 : 247, isStudent ? 255 : 237);
  doc.setDrawColor(isStudent ? 59 : 249, isStudent ? 130 : 115, isStudent ? 246 : 22);
  doc.setLineWidth(0.3);
  doc.roundedRect(startX + width - 34, curY, 31.5, 4.5, 0.8, 0.8, 'FD');

  doc.setTextColor(isStudent ? 29 : 194, isStudent ? 78 : 65, isStudent ? 216 : 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text(copyType, startX + width - 18.25, curY + 3.1, { align: 'center' });

  doc.setTextColor(4, 120, 87); // Green #047857
  doc.setFontSize(5.8);
  doc.text(`[ ${receipt.paymentStatus || 'PAID & VERIFIED'} ]`, startX + width - 18.25, curY + 8.2, { align: 'center' });

  curY += 11;

  // Divider Line
  doc.setDrawColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setLineWidth(0.3);
  doc.line(startX + 2, curY, startX + width - 2, curY);
  curY += 1.5;

  // 2. Receipt Title Banner (Full Width)
  const rTitle = receipt.receiptTitle || 'OFFICIAL UNIVERSITY FEE PAYMENT RECEIPT';
  doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.roundedRect(startX + 2, curY, width - 4, 4.8, 0.5, 0.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(rTitle.toUpperCase(), startX + (width / 2), curY + 3.3, { align: 'center' });

  curY += 6;

  // 3. Receipt & Student Metadata Grid Table (Structured 4-Column Layout across 190mm)
  const metaRows: string[][] = [
    [
      'Receipt No:',
      receipt.receiptNo || '-',
      'Date & Time:',
      `${receipt.paymentDate || '-'}${receipt.paymentTime ? ` (${receipt.paymentTime})` : ''}`
    ],
    [
      'Transaction ID:',
      receipt.transactionId || '-',
      'Pay Mode / Status:',
      `${receipt.paymentMode || 'Online UPI'} • ${receipt.paymentStatus || 'PAID'}`
    ],
    [
      'Student Name:',
      receipt.studentName || '-',
      'Enrollment No:',
      receipt.enrollmentNo || '-'
    ],
    [
      'Institute:',
      receipt.instituteName || 'Swarrnim University',
      'Semester / Year:',
      `${receipt.semesterName || 'Semester 1'} • ${receipt.academicYear || '2026-27'}`
    ],
    [
      'Program & Branch:',
      `${receipt.programName || '-'}${receipt.departmentName ? ` (${receipt.departmentName})` : ''}`,
      'Admission / GR No:',
      receipt.admissionNo || '-'
    ]
  ];

  // If extraDetails exist (e.g. Exam Code / Exam Name / Service Name / Delivery Mode), append dynamic rows
  if (receipt.extraDetails && receipt.extraDetails.length > 0) {
    for (let i = 0; i < receipt.extraDetails.length; i += 2) {
      const d1 = receipt.extraDetails[i];
      const d2 = receipt.extraDetails[i + 1];
      metaRows.push([
        d1 ? `${d1.label}:` : '',
        d1 ? d1.value : '',
        d2 ? `${d2.label}:` : '',
        d2 ? d2.value : ''
      ]);
    }
  }

  autoTable(doc, {
    startY: curY,
    margin: { left: startX + 2 },
    tableWidth: width - 4,
    theme: 'grid',
    styles: {
      fontSize: 6,
      cellPadding: 1,
      lineColor: borderCol,
      lineWidth: 0.18,
      textColor: textDark,
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 26, textColor: textMuted },
      1: { cellWidth: 69, fontStyle: 'bold', textColor: brandNavy },
      2: { cellWidth: 28, textColor: textMuted },
      3: { cellWidth: 67, fontStyle: 'bold' }
    },
    body: metaRows
  });

  curY = ((doc as any).lastAutoTable?.finalY ?? curY + 24) + 1.5;

  // 4. Fee Particulars Breakdown Table (4-Column Layout across 190mm)
  const tableBody = (receipt.items || []).map((item, idx) => [
    String(item.sr || idx + 1),
    item.head || 'Fee Component',
    String(item.qty || '1'),
    `Rs. ${(item.amount || 0).toLocaleString('en-IN')}`
  ]);

  // Total Amount Row
  tableBody.push([
    '',
    'TOTAL AMOUNT PAID:',
    '',
    `Rs. ${(receipt.totalPaid || 0).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: startX + 2 },
    tableWidth: width - 4,
    theme: 'grid',
    head: [['Sr.', 'Fee Head / Particulars Description', 'Qty / Term', 'Amount (INR)']],
    headStyles: {
      fillColor: [30, 58, 95], // #1E3A5F
      textColor: [255, 255, 255],
      fontSize: 6.2,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 1.1
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 112 },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 36, halign: 'right', fontStyle: 'bold', textColor: brandNavy }
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.1,
      lineColor: borderCol,
      lineWidth: 0.18,
      textColor: textDark,
      font: 'helvetica'
    },
    didParseCell: (data) => {
      // Highlight the Total Row at the bottom
      if (data.row.index === tableBody.length - 1) {
        data.cell.styles.fillColor = [239, 246, 255]; // #EFF6FF
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = brandNavy;
        if (data.column.index === 1) {
          data.cell.styles.halign = 'right';
        }
      }
    },
    body: tableBody
  });

  curY = ((doc as any).lastAutoTable?.finalY ?? curY + 24) + 1.5;

  // 5. Amount in Words Box
  const wordsText = receipt.amountInWords || numberToWords(receipt.totalPaid || 0);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.rect(startX + 2, curY, width - 4, 4.5, 'FD');
  doc.setLineDashPattern([], 0);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('Amount in Words: ', startX + 3.5, curY + 3);

  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bolditalic');
  doc.text(wordsText, startX + 24, curY + 3);

  curY += 4.5; // Move immediately past Amount in Words box

  // 6. Signatures Section (Directly following Amount in Words with a clean, compact professional margin)
  const sigY = curY + 3;
  const colW = (width - 4) / 3;

  // Col 1: Student Signature
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.2);
  doc.line(startX + 4, sigY + 5, startX + colW - 4, sigY + 5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text(receipt.studentAcknowledgementTitle || 'Student Signature / Acknowledgment', startX + (colW / 2), sigY + 8, { align: 'center' });

  // Col 2: Finance & Accounts Officer
  doc.line(startX + colW + 4, sigY + 5, startX + (colW * 2) - 4, sigY + 5);
  doc.setTextColor(4, 120, 87);
  doc.setFontSize(5);
  doc.text('DIGITALLY VERIFIED & SETTLED', startX + colW + (colW / 2), sigY + 3.5, { align: 'center' });
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(5.5);
  doc.text('Finance & Accounts Officer / Cashier', startX + colW + (colW / 2), sigY + 8, { align: 'center' });

  // Col 3: Controller of Examinations / Authorized Officer
  doc.line(startX + (colW * 2) + 4, sigY + 5, startX + width - 4, sigY + 5);
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFontSize(5);
  doc.text('OFFICIAL REGISTRAR / COE SEAL', startX + (colW * 2) + (colW / 2), sigY + 3.5, { align: 'center' });
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFontSize(5.5);
  const authSign = receipt.authorizedSignatoryTitle || 'Controller of Examinations';
  doc.text(authSign, startX + (colW * 2) + (colW / 2), sigY + 8, { align: 'center' });

  // 7. Bottom Disclaimer Line
  const discY = sigY + 10.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.18);
  doc.line(startX + 2, discY, startX + width - 2, discY);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  const disclaimer = receipt.officialDisclaimer || 'This is a computer-generated official University Fee Receipt. Valid without physical seal.';
  doc.text(`* ${disclaimer} *`, startX + (width / 2), discY + 2.8, { align: 'center' });
  doc.text(`Swarrnim Startup & Innovation University • Generated: ${new Date().toLocaleString('en-IN')}`, startX + (width / 2), discY + 5.2, { align: 'center' });

  // Calculate actual content-driven total height of this receipt copy
  const finalHeight = (discY + 7) - startY;

  // 8. Outer Border Box (wraps exactly the content-driven height)
  doc.setDrawColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setLineWidth(0.35);
  doc.rect(startX, startY, width, finalHeight);

  return finalHeight;
}

/**
 * 2. Opens Generated Fee Receipt PDF in a New Tab with Complete Logging and Fallbacks
 */
export async function openReceiptPDF(receipt: UniversalFeeReceiptData): Promise<string> {
  console.log('Receipt data:', receipt);
  console.log('Generating receipt PDF in A4 Portrait (Top + Bottom compact copies)...');

  try {
    const pdfBlob = await generateReceiptPDF(receipt);
    console.log('PDF generated:', pdfBlob);
    console.log('PDF size:', pdfBlob?.size);

    const pdfUrl = URL.createObjectURL(pdfBlob);
    console.log('PDF URL:', pdfUrl);

    // Open in new browser tab
    const newTab = window.open(pdfUrl, '_blank');

    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      // Fallback 1: programmatic anchor click
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Fallback 2: show toast
      showPopupBlockedToast(pdfUrl, receipt.receiptNo);
    }

    return pdfUrl;
  } catch (error) {
    console.error('Receipt PDF generation failed:', error);
    showReceiptErrorToast(error);
    throw error;
  }
}

/**
 * Shows a toast if the browser blocked window.open
 */
function showPopupBlockedToast(pdfUrl: string, receiptNo: string): void {
  const toastId = 'ssiu-pdf-receipt-toast';
  const existing = document.getElementById(toastId);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #0F2C59;
    color: #FFFFFF;
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 999999;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    border: 1.5px solid #F37023;
  `;

  toast.innerHTML = `
    <span>📄 Receipt <strong>${receiptNo}</strong> generated.</span>
    <a href="${pdfUrl}" target="_blank" style="color: #FDBA74; text-decoration: underline; font-weight: bold;">Open PDF</a>
    <button style="background: none; border: none; color: #94A3B8; cursor: pointer; font-size: 16px; margin-left: 8px;">✕</button>
  `;

  document.body.appendChild(toast);
  const closeBtn = toast.querySelector('button');
  if (closeBtn) closeBtn.onclick = () => toast.remove();
  setTimeout(() => toast.remove(), 10000);
}

/**
 * Shows a toast error if generation fails
 */
function showReceiptErrorToast(error: any): void {
  const toastId = 'ssiu-pdf-error-toast';
  const existing = document.getElementById(toastId);
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = toastId;
  toast.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: #7F1D1D;
    color: #FFFFFF;
    padding: 12px 18px;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    border: 1.5px solid #EF4444;
  `;
  toast.innerHTML = `⚠️ <strong>Error generating Receipt PDF:</strong> ${error?.message || 'Unknown error'}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

/**
 * 3. Class-based wrapper service for easy DI and direct helper access
 */
export class FeeReceiptPdfService {
  public generatePdf(receipt: UniversalFeeReceiptData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const marginX = 8;
    const copyWidth = pageWidth - (marginX * 2); // 194mm

    const topCopyHeight = renderReceiptPortraitCopy(doc, receipt, 'STUDENT COPY', marginX, 8, copyWidth);

    const separatorY = 8 + topCopyHeight + 6;
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(marginX, separatorY, pageWidth - marginX, separatorY);
    doc.setLineDashPattern([], 0);

    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.8);
    doc.text(
      '✂ - - - - - - - - - - - - - - - - - - - - CUT / TEAR ALONG THIS LINE (STUDENT COPY ON TOP / DEPARTMENT COPY ON BOTTOM) - - - - - - - - - - - - - - - - - - - - ✂',
      pageWidth / 2,
      separatorY - 0.9,
      { align: 'center' }
    );

    const bottomStartY = separatorY + 6;
    renderReceiptPortraitCopy(doc, receipt, 'DEPARTMENT COPY', marginX, bottomStartY, copyWidth);

    return doc;
  }

  public async generateBlob(receipt: UniversalFeeReceiptData): Promise<Blob> {
    return generateReceiptPDF(receipt);
  }

  public openInNewTab(receipt: UniversalFeeReceiptData): void {
    openReceiptPDF(receipt).catch(err => {
      console.error('Error opening receipt PDF:', err);
    });
  }

  public downloadPdf(receipt: UniversalFeeReceiptData, filename?: string): void {
    try {
      const doc = this.generatePdf(receipt);
      const safeName = filename || `FeeReceipt_${(receipt.receiptNo || 'SSIU').replace(/[/\\?%*:|"<>]/g, '_')}_${receipt.enrollmentNo || 'Student'}.pdf`;
      doc.save(safeName);
    } catch (err) {
      console.error('Error downloading fee receipt PDF:', err);
    }
  }
}

export const feeReceiptPdfService = new FeeReceiptPdfService();
