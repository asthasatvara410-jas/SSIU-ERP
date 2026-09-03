import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from './db';
import { fileStorage } from './fileStorage';
import { securityAuditService } from './securityAuditService';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';
import { formatIndianNumber, formatIndianCurrency, amountToWords } from '../utils/numberFormat';
import {
  NoteSheet, NoteSheetPdfRecord, NoteSheetPdfResponse,
  User, UserRole
} from '../types';
import {
  UnauthorizedError, ForbiddenError, NotFoundError,
  ApiResponse, successResponse, errorResponse
} from './apiResponse';
import QRCode from 'qrcode';

export interface NoteSheetPdfGenerationOptions {
  watermarkText?: string;
  forceRegenerate?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

class NoteSheetPdfService {
  /**
   * Helper to compute an idempotency hash for a Notesheet's data state.
   */
  private computeDataHash(note: NoteSheet): string {
    const relevantPayload = {
      id: note.id,
      noteSheetNumber: note.noteSheetNumber,
      status: note.status,
      subject: note.subject,
      proposal: note.proposal,
      purposeJustification: note.purposeJustification,
      currentAmount: note.currentAmount,
      finalApprovedAmount: note.finalApprovedAmount,
      movementsCount: (note.movements || []).length,
      revisionsCount: (note.financialRevisionHistory || []).length,
      itemsCount: (note.items || []).length,
      attachmentsCount: (note.attachments || []).length,
      updatedAt: note.updatedAt || note.date
    };
    return JSON.stringify(relevantPayload);
  }

  /**
   * Status text resolver for badge in PDF
   */
  private getStatusText(status: string): string {
    switch (status) {
      case 'DRAFT': return 'DRAFT';
      case 'PENDING_HOD': return 'PENDING HOD ENDORSEMENT';
      case 'PENDING_HOI': return 'PENDING PRINCIPAL / HOI ENDORSEMENT';
      case 'PENDING_DEPUTY_REGISTRAR': return 'PENDING DEPUTY REGISTRAR VERIFICATION';
      case 'PENDING_REGISTRAR': return 'PENDING REGISTRAR ENDORSEMENT';
      case 'PENDING_VICE_PRESIDENT': return 'PENDING VICE PRESIDENT FINAL SANCTION';
      case 'APPROVED': return 'APPROVED & SANCTIONED';
      case 'REJECTED': return 'REJECTED';
      case 'RETURNED': return 'RETURNED FOR REVISION';
      case 'CLARIFICATION': return 'CLARIFICATION SOUGHT';
      case 'CLOSED': return 'CLOSED / COMPLETED';
      default: return status.replace(/_/g, ' ');
    }
  }

  /**
   * Strict Backend Authorization Guard
   * Validates authenticated user, permissions, and institute/department scope.
   */
  public validatePdfAccess(notesheetId: string, user?: User | null, role?: UserRole | null): NoteSheet {
    if (!user) {
      throw new UnauthorizedError('401 Unauthorized: Authentication required to access Notesheet PDF.');
    }

    const effectiveRole = role || user.role;
    if (!effectiveRole || effectiveRole === 'STUDENT' || user.role === 'STUDENT') {
      securityAuditService.logSecurityEvent(
        'UNAUTHORIZED_NOTESHEET_PDF_ACCESS_BLOCKED',
        'NOTESHEET_PDF',
        'NoteSheet',
        `Student role (${user.name}) attempted direct access to Notesheet PDF ID "${notesheetId}". Blocked with 403 Forbidden.`,
        user,
        effectiveRole,
        { recordId: notesheetId, status: 'BLOCKED', severity: 'WARNING' }
      );
      throw new ForbiddenError('403 Forbidden: Students are not authorized to access administrative Notesheet PDFs.');
    }

    const note = db.getNoteSheetById(notesheetId);
    if (!note) {
      throw new NotFoundError(`404 Not Found: Notesheet with identifier "${notesheetId}" does not exist.`);
    }

    const isAuthorized = db.isUserAuthorizedForNotesheet(user, effectiveRole, note);
    if (!isAuthorized) {
      securityAuditService.logSecurityEvent(
        'UNAUTHORIZED_NOTESHEET_PDF_ACCESS_BLOCKED',
        'NOTESHEET_PDF',
        'NoteSheet',
        `User ${user.name} (${effectiveRole}) attempted unauthorized access to Notesheet "${note.noteSheetNumber}". Scope mismatch. Blocked with 403 Forbidden.`,
        user,
        effectiveRole,
        { recordId: notesheetId, status: 'BLOCKED', severity: 'WARNING' }
      );
      throw new ForbiddenError(`403 Forbidden: You do not have permission to view or generate PDF for Notesheet "${note.noteSheetNumber}".`);
    }

    return note;
  }

  /**
   * Core Document Layout & Rendering Engine for Official Swarrnim University Notesheets.
   * Produces authentic A4 Vector Document with strict Word Page Border, Metadata, Items, Revisions,
   * Approver Signatures, Remarks, and Verification Footers.
   */
  public renderPdfDocument(
    note: NoteSheet,
    options: NoteSheetPdfGenerationOptions = {},
    newVersion: number = 1
  ): {
    doc: jsPDF;
    pdfDataUri: string;
    pdfArrayBuffer: ArrayBuffer;
    fileSize: number;
    fileName: string;
    pdfId: string;
    totalPages: number;
  } {
    const isApproved = note.status === 'APPROVED';
    const isFinancial = Boolean(note.financialRequirement || note.budgetRequired);
    const items = note.items || [];
    const revisions = note.financialRevisionHistory || [];
    const movements = note.movements || [];
    const requestedAmt = note.originalRequestedAmount || note.requestedAmount || note.estimatedCost || 0;
    const approvedAmt = note.approvedAmount !== undefined ? note.approvedAmount : (note.finalApprovedAmount !== undefined ? note.finalApprovedAmount : undefined);

    // Collect attachments from both attachmentObjects (rich meta) and attachments string array
    const rawAttachments: any[] = (note.attachmentObjects && note.attachmentObjects.length > 0)
      ? note.attachmentObjects
      : (note.attachments || []);
    const attachments = rawAttachments.filter(Boolean);

    // Initialize A4 Portrait Document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 18;
    const contentWidth = pageWidth - (margin * 2); // 174mm

    // Professional Black/Navy Palette
    const colorNavy: [number, number, number] = [15, 44, 89]; // #0F2C59
    const colorBlack: [number, number, number] = [0, 0, 0];
    const colorSlateDark: [number, number, number] = [15, 23, 42]; // #0F172A
    const colorSlateMuted: [number, number, number] = [100, 116, 139]; // #64748B

    // Start comfortably below top page border (border is at Y=10)
    let currentY = 14.5;

    // Helper: Draw Watermark if Draft or Requested
    const drawWatermark = () => {
      const isDraft = note.status === 'DRAFT';
      const watermark = options.watermarkText || (isDraft ? 'DRAFT NOTE' : (note.status === 'REJECTED' ? 'REJECTED' : ''));
      if (watermark) {
        doc.saveGraphicsState();
        doc.setTextColor(0, 0, 0);
        doc.setFont('times', 'bold');
        doc.setFontSize(48);
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        doc.text(watermark, pageWidth / 2, pageHeight / 2, { align: 'center', angle: -35 });
        doc.restoreGraphicsState();
      }
    };

    drawWatermark();

    // ──────────────────────────────────────────────────────────────────────────
    // TYPOGRAPHY OVERFLOW & FIT PROTECTION HELPERS
    // Ensures text never visually leaves its assigned bounding box or overlaps neighbors
    // ──────────────────────────────────────────────────────────────────────────

    /**
     * Draws single-line text within a max bounding width.
     * If the text exceeds maxWidth, font size is dynamically reduced down to minFontSize.
     * If it still exceeds, it is cleanly truncated with an ellipsis.
     */
    const drawFittedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      options: {
        align?: 'left' | 'center' | 'right';
        initialFontSize?: number;
        minFontSize?: number;
        fontStyle?: 'normal' | 'bold' | 'italic';
        textColor?: [number, number, number];
      } = {}
    ): number => {
      const {
        align = 'left',
        initialFontSize = 8.25,
        minFontSize = 5.5,
        fontStyle = 'normal',
        textColor = colorBlack
      } = options;

      doc.setFont('times', fontStyle);
      doc.setTextColor(...textColor);

      let currentSize = initialFontSize;
      doc.setFontSize(currentSize);
      let textWidth = doc.getTextWidth(text);

      while (textWidth > maxWidth && currentSize > minFontSize) {
        currentSize = Math.max(minFontSize, currentSize - 0.4);
        doc.setFontSize(currentSize);
        textWidth = doc.getTextWidth(text);
      }

      let renderText = text;
      if (textWidth > maxWidth) {
        // Safe character-level truncation with ellipsis
        let truncated = text;
        while (truncated.length > 3 && doc.getTextWidth(truncated + '...') > maxWidth) {
          truncated = truncated.slice(0, -1);
        }
        renderText = truncated + '...';
      }

      doc.text(renderText, x, y, { align });
      return currentSize;
    };

    /**
     * Draws multi-line wrapped text within maxWidth and maxHeight limits.
     * Prevents text from running into lines below it or outside container boxes.
     */
    const drawBoundedWrappedText = (
      text: string,
      x: number,
      startY: number,
      maxWidth: number,
      maxHeight: number,
      options: {
        lineSpacing?: number;
        fontSize?: number;
        fontStyle?: 'normal' | 'bold' | 'italic';
        textColor?: [number, number, number];
        maxLines?: number;
      } = {}
    ): number => {
      const {
        lineSpacing = 3.4,
        fontSize = 8.25,
        fontStyle = 'normal',
        textColor = colorBlack,
        maxLines = 99
      } = options;

      doc.setFont('times', fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(...textColor);

      const rawLines: string[] = doc.splitTextToSize(text, maxWidth);
      const allowedByHeight = Math.max(1, Math.floor(maxHeight / lineSpacing));
      const limit = Math.min(rawLines.length, allowedByHeight, maxLines);

      let currentLineY = startY;
      for (let i = 0; i < limit; i++) {
        let line = rawLines[i];
        if (i === limit - 1 && rawLines.length > limit) {
          while (line.length > 3 && doc.getTextWidth(line + '...') > maxWidth) {
            line = line.slice(0, -1);
          }
          line += '...';
        }
        doc.text(line, x, currentLineY);
        currentLineY += lineSpacing;
      }

      return currentLineY;
    };

    // ─── 1. OFFICIAL UNIVERSITY LETTERHEAD HEADER (STRICT DOCUMENT FLOW) ───
    // A. Official University Logo (Center aligned, reserved layout box, 1:1 aspect ratio)
    const logoWidth = 22; // ~83px on A4 canvas
    const logoHeight = 22;
    try {
      if (SWARRNIM_LOGO_PNG_BASE64) {
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', logoX, currentY, logoWidth, logoHeight);
      }
    } catch {
      // Fallback if image fails
    }

    // A2. Secure Official Verification QR Code (Top-Right, within page border)
    try {
      const verificationToken = note.verificationId || note.noteSheetNumber || note.id;
      const baseUrl = typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://erp.swarrnim.edu.in';
      const verifyUrl = `${baseUrl}/verify/notesheet/${encodeURIComponent(verificationToken)}`;

      const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: 'M' });
      const qrBoxSize = 16.5; // 16.5mm x 16.5mm compact square
      const qrX = pageWidth - margin - qrBoxSize; // right-aligned against content margin
      const qrY = currentY;
      const matrixSize = qr.modules.size;
      const cellSize = qrBoxSize / matrixSize;

      // Draw pure vector QR modules
      doc.setFillColor(255, 255, 255);
      doc.rect(qrX, qrY, qrBoxSize, qrBoxSize, 'F');
      doc.setFillColor(0, 0, 0);

      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (qr.modules.get(r, c)) {
            doc.rect(qrX + c * cellSize, qrY + r * cellSize, cellSize, cellSize, 'F');
          }
        }
      }

      // Small subtitle under QR code
      doc.setFont('times', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...colorBlack);
      doc.text('Scan to Verify', qrX + (qrBoxSize / 2), qrY + qrBoxSize + 2.2, { align: 'center' });
    } catch {
      // Non-blocking fallback
    }

    // Reserved vertical displacement past the logo + clean gap
    currentY += logoHeight + 4.5;

    // B. University Name (14px / 10.5pt Bold, Centered, Black, Overflow-Protected)
    drawFittedText('SWARRNIM STARTUP & INNOVATION UNIVERSITY', pageWidth / 2, currentY, contentWidth - 4, {
      align: 'center',
      initialFontSize: 10.5,
      minFontSize: 8.5,
      fontStyle: 'bold',
      textColor: colorBlack
    });
    currentY += 4.5;

    // C. Institute / Department Full Official Name (14px / 10.5pt Bold, Centered, Black, Overflow-Protected)
    const instituteDisplayName = note.instituteName || note.instituteCode || 'Swarrnim Institute of Technology';
    const departmentDisplayName = note.department || note.departmentName || 'General Administration';
    drawFittedText(instituteDisplayName.toUpperCase(), pageWidth / 2, currentY, contentWidth - 4, {
      align: 'center',
      initialFontSize: 10.5,
      minFontSize: 8,
      fontStyle: 'bold',
      textColor: colorBlack
    });
    currentY += 4.5;

    // D. Thin Horizontal Divider Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4.5;

    // E. Document Title: OFFICIAL NOTESHEET (14px / 10.5pt Bold Underlined, Centered, Black)
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colorBlack);
    doc.text('OFFICIAL NOTESHEET', pageWidth / 2, currentY, { align: 'center' });
    const titleTextWidth = doc.getTextWidth('OFFICIAL NOTESHEET');
    doc.setLineWidth(0.25);
    doc.line((pageWidth - titleTextWidth) / 2, currentY + 0.8, (pageWidth + titleTextWidth) / 2, currentY + 0.8);
    currentY += 5.5;

    // ─── 2. OFFICIAL METADATA (MEMORANDUM STYLE - 11px / 8.25pt Black) ──
    const metadataRows = [
      [
        { content: 'Notesheet Number:', styles: { fontStyle: 'bold' as const } },
        { content: note.noteSheetNumber || 'DRAFT', styles: { fontStyle: 'bold' as const, textColor: colorBlack } },
        { content: 'Date:', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
        { content: note.date || new Date().toISOString().split('T')[0] }
      ],
      [
        { content: 'Initiated By:', styles: { fontStyle: 'bold' as const } },
        { content: `${note.creatorName || 'Faculty / Staff'} (${note.creatorRole || 'Staff'})` },
        { content: 'Priority:', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
        { content: note.priority || 'NORMAL' }
      ],
      [
        { content: 'Department / Office:', styles: { fontStyle: 'bold' as const } },
        { content: departmentDisplayName },
        { content: 'Status:', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
        { content: this.getStatusText(note.status) }
      ],
      [
        { content: 'Document Version:', styles: { fontStyle: 'bold' as const } },
        { content: `v${note.version || '1.0'}${note.amendmentReason ? ' [AMENDED]' : ''}` },
        { content: 'Verification ID:', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
        { content: note.verificationId || note.noteSheetNumber }
      ]
    ];

    if (note.workflowDueDate || note.referenceNumber) {
      metadataRows.push([
        { content: 'Workflow Target Date:', styles: { fontStyle: 'bold' as const } },
        { content: note.workflowDueDate || 'Standard Routine' },
        { content: 'Reference:', styles: { fontStyle: 'bold' as const, halign: 'right' as const } },
        { content: note.referenceNumber || 'N/A' }
      ]);
    }

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      body: metadataRows as any,
      theme: 'plain',
      styles: {
        font: 'times',
        fontSize: 8.25,
        cellPadding: 1,
        textColor: colorBlack
      },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 55 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 46 }
      }
    });

    // @ts-ignore
    currentY = doc.lastAutoTable.finalY + 2;

    // ─── 2.1 REGISTRAR OFFICE INWARD & OUTWARD OFFICIAL TRACKING HEADER ──
    if (note.inwardNumber || note.outwardNumber) {
      const regBoxH = 20; // mm
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, currentY, contentWidth, regBoxH, 'FD');

      const colHalfW = contentWidth / 2;
      const midX = margin + colHalfW;

      // Vertical dividing line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.15);
      doc.line(midX, currentY + 1.5, midX, currentY + regBoxH - 1.5);

      // LEFT COLUMN: ORIGINATING OFFICE / OUTWARD
      const colInnerW = colHalfW - 5;
      drawFittedText('ORIGINATING OFFICE DISPATCH', margin + 2.5, currentY + 3.8, colInnerW, {
        fontStyle: 'bold',
        initialFontSize: 8.25,
        minFontSize: 7,
        textColor: [0, 0, 0]
      });

      drawFittedText(`Institute / Dept: ${departmentDisplayName}`, margin + 2.5, currentY + 7.4, colInnerW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: [0, 0, 0]
      });

      if (note.outwardNumber) {
        drawFittedText(`Outward No.: ${note.outwardNumber}`, margin + 2.5, currentY + 11, colInnerW, {
          fontStyle: 'bold',
          initialFontSize: 8.25,
          minFontSize: 7,
          textColor: [0, 0, 0]
        });
        drawFittedText(`Date: ${note.outwardDate || note.date}`, margin + 2.5, currentY + 14.6, colInnerW, {
          fontStyle: 'normal',
          initialFontSize: 8.25,
          minFontSize: 7,
          textColor: [0, 0, 0]
        });
      } else {
        drawFittedText('Outward No.: Pending Registrar Dispatch', margin + 2.5, currentY + 11, colInnerW, {
          fontStyle: 'italic',
          initialFontSize: 8.25,
          minFontSize: 7,
          textColor: [0, 0, 0]
        });
        drawFittedText(`Date: ${note.date || 'N/A'}`, margin + 2.5, currentY + 14.6, colInnerW, {
          fontStyle: 'normal',
          initialFontSize: 8.25,
          minFontSize: 7,
          textColor: [0, 0, 0]
        });
      }
      drawFittedText(`Person: ${note.creatorName || 'Faculty / Staff'} | Contact: ${note.contactNumber || 'N/A'}`, margin + 2.5, currentY + 18.2, colInnerW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6,
        textColor: [0, 0, 0]
      });

      // RIGHT COLUMN: REGISTRAR OFFICE INWARD
      drawFittedText('REGISTRAR OFFICE', midX + 2.5, currentY + 3.8, colInnerW, {
        fontStyle: 'bold',
        initialFontSize: 9.5,
        minFontSize: 7.5,
        textColor: [0, 0, 0]
      });

      drawFittedText(`Inward No.: ${note.inwardNumber || 'N/A'}`, midX + 2.5, currentY + 7.4, colInnerW, {
        fontStyle: 'bold',
        initialFontSize: 8.25,
        minFontSize: 7,
        textColor: [0, 0, 0]
      });

      drawFittedText(`Date: ${note.inwardDate || note.date}`, midX + 2.5, currentY + 11, colInnerW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 7,
        textColor: [0, 0, 0]
      });
      drawFittedText(`Receiver Name: ${note.inwardReceivedByName || 'Registrar Directorate'}`, midX + 2.5, currentY + 14.6, colInnerW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: [0, 0, 0]
      });
      drawFittedText('Sign: [✓ Authenticated Administrative Record]', midX + 2.5, currentY + 18.2, colInnerW, {
        fontStyle: 'bold',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: [0, 0, 0]
      });

      currentY += regBoxH + 2.5;
    }

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 4.5;

    // Helper: Check for Page Overflow and add page
    const ensureVerticalSpace = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin - 10) {
        doc.addPage();
        drawWatermark();
        currentY = margin + 8; // Extra room for running page header
      }
    };

    // ─── 3. SUBJECT SECTION (11px / 8.25pt Black) ────────────────────────
    ensureVerticalSpace(12);
    doc.setFont('times', 'bold');
    doc.setFontSize(8.25);
    doc.setTextColor(...colorBlack);
    doc.text('SUBJECT: ', margin, currentY);

    const subjectPrefixWidth = doc.getTextWidth('SUBJECT: ');
    const subjectLines = doc.splitTextToSize(note.subject || 'N/A', contentWidth - subjectPrefixWidth);
    
    // Draw subject text
    doc.text(subjectLines[0], margin + subjectPrefixWidth, currentY);
    for (let i = 1; i < subjectLines.length; i++) {
      currentY += 4;
      ensureVerticalSpace(5);
      doc.text(subjectLines[i], margin + subjectPrefixWidth, currentY);
    }
    currentY += 5;

    if (note.previousNoteSheetId) {
      doc.setFont('times', 'italic');
      doc.setFontSize(8.25);
      doc.setTextColor(...colorBlack);
      doc.text(`(Reference to Previous Notesheet: ${note.previousNoteSheetNumber || note.previousNoteSheetId})`, margin, currentY);
      currentY += 4;
    }

    // ─── 4. SECTION 1: PROPOSAL & REQUIREMENT SUMMARY (14px Heading / 11px Body) ─
    ensureVerticalSpace(18);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colorBlack);
    doc.text('1. PROPOSAL & REQUIREMENT SUMMARY', margin, currentY);
    currentY += 4;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.25);
    doc.setTextColor(...colorBlack);
    const proposalLines = doc.splitTextToSize(note.proposal || 'No proposal description provided.', contentWidth);
    for (const line of proposalLines) {
      ensureVerticalSpace(4);
      doc.text(line, margin, currentY);
      currentY += 3.8;
    }
    currentY += 3.5;

    // ─── 5. SECTION 2: PURPOSE & ACADEMIC / ADMINISTRATIVE JUSTIFICATION ─
    ensureVerticalSpace(18);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colorBlack);
    doc.text('2. PURPOSE & ACADEMIC / ADMINISTRATIVE JUSTIFICATION', margin, currentY);
    currentY += 4;

    doc.setFont('times', 'normal');
    doc.setFontSize(8.25);
    doc.setTextColor(...colorBlack);
    const justLines = doc.splitTextToSize(note.purposeJustification || 'No justification details provided.', contentWidth);
    for (const line of justLines) {
      ensureVerticalSpace(4);
      doc.text(line, margin, currentY);
      currentY += 3.8;
    }
    currentY += 3.5;

    // ─── 6. SECTION 3: FINANCIAL IMPLICATION & ITEMIZED ESTIMATE ─────────
    if (isFinancial) {
      ensureVerticalSpace(25);
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...colorBlack);
      doc.text('3. FINANCIAL IMPLICATION & ITEMIZED BREAKDOWN', margin, currentY);
      currentY += 4;

      if (items.length > 0) {
        const itemRows = items.map((it, idx) => [
          String(idx + 1),
          `${it.itemName}${it.description ? `\n(${it.description})` : ''}`,
          `${formatIndianNumber(it.quantity)} ${it.unit ? `(${it.unit})` : ''}`,
          `Rs. ${formatIndianNumber(it.rate)}`,
          `Rs. ${formatIndianNumber(it.amount)}`
        ]);

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['Sr. No.', 'Item Description', 'Qty.', 'Unit Rate (Rs.)', 'Total Amount (Rs.)']],
          body: itemRows,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: 'times',
            fontStyle: 'bold',
            fontSize: 8.25,
            lineColor: [0, 0, 0],
            lineWidth: 0.2
          },
          styles: {
            font: 'times',
            fontSize: 8.25,
            cellPadding: 1.8,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center' },
            1: { cellWidth: 75 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 32, halign: 'right' }
          }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 3;
      }

      // Financial Summary Box (11px / 8.25pt Black on White, Overflow-Protected)
      ensureVerticalSpace(25);
      const finBoxHeight = 22;
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.2);
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, currentY, contentWidth, finBoxHeight, 'FD');

      const finLeftColW = 92; // Up to margin + 95mm
      const finRightColX = margin + 96;
      const finRightColW = contentWidth - 98; // 76mm

      // Left Column: Requested & Approved Amounts with in-words
      drawFittedText(`Requested Amount: Rs. ${formatIndianCurrency(requestedAmt)}`, margin + 3, currentY + 4.5, finLeftColW, {
        fontStyle: 'bold',
        initialFontSize: 8.25,
        minFontSize: 7,
        textColor: colorBlack
      });
      
      const requestedWords = amountToWords(requestedAmt);
      drawFittedText(`(Rupees ${requestedWords} Only)`, margin + 3, currentY + 8.5, finLeftColW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: colorBlack
      });

      if (approvedAmt !== undefined) {
        drawFittedText(`Final Sanctioned Amount: Rs. ${formatIndianCurrency(approvedAmt)}`, margin + 3, currentY + 13.5, finLeftColW, {
          fontStyle: 'bold',
          initialFontSize: 8.25,
          minFontSize: 7,
          textColor: colorBlack
        });

        const approvedWords = amountToWords(approvedAmt);
        drawFittedText(`(Rupees ${approvedWords} Only)`, margin + 3, currentY + 17.5, finLeftColW, {
          fontStyle: 'normal',
          initialFontSize: 8.25,
          minFontSize: 6.5,
          textColor: colorBlack
        });
      } else {
        drawFittedText('Final Sanctioned Amount: Pending Competent Authority Approval', margin + 3, currentY + 14, finLeftColW, {
          fontStyle: 'normal',
          initialFontSize: 8.25,
          minFontSize: 6.5,
          textColor: colorBlack
        });
      }

      // Right Column: Budget Head, Category & Status (11px / 8.25pt Black)
      drawFittedText(`Budget Head: ${note.budgetHead || 'General Operational'}`, finRightColX, currentY + 4.5, finRightColW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: colorBlack
      });
      drawFittedText(`Expense Category: ${note.expenseCategory || 'Operating Expense'}`, finRightColX, currentY + 8.5, finRightColW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: colorBlack
      });
      drawFittedText(`Budget Status: ${note.budgetAvailable ? 'Funds Available & Allocated' : 'Subject to Executive Allocation'}`, finRightColX, currentY + 13.5, finRightColW, {
        fontStyle: 'normal',
        initialFontSize: 8.25,
        minFontSize: 6.5,
        textColor: colorBlack
      });

      currentY += finBoxHeight + 4;

      // ─── 6.1 FINANCIAL REVISION HISTORY (if revisions exist) ──────────────
      if (revisions.length > 0) {
        ensureVerticalSpace(20);
        doc.setFont('times', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(...colorBlack);
        doc.text('3.1 FINANCIAL AMOUNT REVISION AUDIT TRAIL', margin, currentY);
        currentY += 3.5;

        const revRows = revisions.map((rev: any, idx) => {
          const revDate = rev.revisedAt ? rev.revisedAt.split('T')[0] : (rev.createdAt ? rev.createdAt.split('T')[0] : 'N/A');
          const revAuth = rev.revisedByRole || rev.actorRole || rev.revisedByName || rev.actorName || 'Authority';
          const prevAmt = rev.previousAmount || 0;
          const newAmt = rev.revisedAmount !== undefined ? rev.revisedAmount : (rev.newAmount !== undefined ? rev.newAmount : prevAmt);
          const variance = newAmt - prevAmt;
          return [
            String(idx + 1),
            revDate,
            revAuth,
            `Rs. ${formatIndianCurrency(prevAmt)}`,
            `Rs. ${formatIndianCurrency(newAmt)}`,
            `Rs. ${formatIndianCurrency(variance)}`,
            rev.reason || 'Financial refinement'
          ];
        });

        autoTable(doc, {
          startY: currentY,
          margin: { left: margin, right: margin },
          head: [['#', 'Date', 'Authority', 'Previous (Rs.)', 'Revised (Rs.)', 'Variance', 'Reason / Justification']],
          body: revRows,
          theme: 'grid',
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            font: 'times',
            fontStyle: 'bold',
            fontSize: 8.25,
            lineColor: [0, 0, 0],
            lineWidth: 0.2
          },
          styles: {
            font: 'times',
            fontSize: 8.25,
            cellPadding: 1.5,
            lineColor: [0, 0, 0],
            lineWidth: 0.2,
            textColor: [0, 0, 0],
            fillColor: [255, 255, 255]
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 18 },
            2: { cellWidth: 28 },
            3: { cellWidth: 24, halign: 'right' },
            4: { cellWidth: 24, halign: 'right' },
            5: { cellWidth: 22, halign: 'right' },
            6: { cellWidth: 50 }
          }
        });

        // @ts-ignore
        currentY = doc.lastAutoTable.finalY + 3;
      }
    }

    /**
     * Robust text wrapping helper that handles long words, tokens, and multi-line wrapping
     * with exact font and font size matching.
     */
    const wrapRobustText = (
      text: string,
      font: string,
      fontStyle: 'normal' | 'bold' | 'italic',
      fontSize: number,
      maxWidth: number
    ): string[] => {
      doc.setFont(font, fontStyle);
      doc.setFontSize(fontSize);

      if (!text || text.trim().length === 0) return [];

      // Pre-process unbroken tokens that exceed maxWidth by breaking them
      const words = text.split(' ');
      const processedWords: string[] = [];

      for (const w of words) {
        if (doc.getTextWidth(w) <= maxWidth) {
          processedWords.push(w);
        } else {
          // Break token into smaller chunks
          let curChunk = '';
          for (let c = 0; c < w.length; c++) {
            const char = w[c];
            if (doc.getTextWidth(curChunk + char) <= maxWidth - 2) {
              curChunk += char;
            } else {
              if (curChunk) processedWords.push(curChunk);
              curChunk = char;
            }
          }
          if (curChunk) processedWords.push(curChunk);
        }
      }

      const rebuiltText = processedWords.join(' ');
      return doc.splitTextToSize(rebuiltText, maxWidth);
    };

    // ─── 7. SECTION 4: APPROVAL HIERARCHY & SIGNATURE SNAPSHOTS ─────────
    // Keep-Together Pagination: Treat the COMPLETE Approval & Signature Section as ONE atomic block.
    const signatureLevels = [
      { role: 'INITIATOR', label: '1. Initiated By (Faculty / Staff)' },
      { role: 'HOD', label: '2. Head of Department (HOD)' },
      { role: 'HOI', label: '3. Principal / Head of Institute (HOI)' },
      { role: 'DEPUTY_REGISTRAR', label: '4. Deputy Registrar' },
      { role: 'REGISTRAR', label: '5. Registrar Endorsement' },
      { role: 'VICE_PRESIDENT', label: '6. Vice President (Final Sanction)' }
    ];

    const sigBoxWidth = (contentWidth - 6) / 2; // 2 column signature layout (84mm each)
    const cardPaddingX = 3.5; // 3.5mm inner horizontal padding from card edges
    const innerW = sigBoxWidth - (cardPaddingX * 2); // 77mm usable text width inside card

    // Measure card content to determine exact dynamic height for any card
    const measureCardContent = (lvl: { role: string; label: string }) => {
      let matchingMove = movements.find((m: any) => {
        const moveRole = m.fromRole || m.fromUserRole || m.actorRole || '';
        if (lvl.role === 'INITIATOR') return m.action === 'CREATE' || m.action === 'SUBMIT';
        if (lvl.role === 'HOD') return (m.action === 'FORWARD' || m.action === 'APPROVE') && (moveRole === 'HOD' || moveRole.includes('HOD'));
        if (lvl.role === 'HOI') return (m.action === 'FORWARD' || m.action === 'APPROVE') && (moveRole === 'HOI' || moveRole === 'PRINCIPAL' || moveRole.includes('Principal') || moveRole.includes('Director'));
        if (lvl.role === 'DEPUTY_REGISTRAR') return (m.action === 'FORWARD' || m.action === 'APPROVE') && (moveRole === 'DEPUTY_REGISTRAR' || moveRole.includes('Deputy Registrar'));
        if (lvl.role === 'REGISTRAR') return (m.action === 'FORWARD' || m.action === 'APPROVE') && (moveRole === 'REGISTRAR' || moveRole.includes('Registrar'));
        if (lvl.role === 'VICE_PRESIDENT') return m.action === 'APPROVE' && (moveRole === 'VICE_PRESIDENT' || moveRole === 'PRESIDENT' || moveRole.includes('Vice President') || isApproved);
        return false;
      });

      if (!matchingMove && lvl.role === 'INITIATOR' && note.creatorName) {
        matchingMove = {
          id: 'init-1',
          action: 'SUBMIT',
          fromRole: note.creatorRole || 'FACULTY',
          fromUserName: note.creatorName,
          timestamp: note.date,
          remarks: 'Notesheet proposal initiated and submitted for endorsement.'
        } as any;
      }

      if (!matchingMove) {
        return { matchingMove: null, height: 28, lines: {} as any };
      }

      const signerName = (matchingMove as any).fromUserName || matchingMove.fromUser || (matchingMove as any).actorName || 'Authorized Official';
      const signerRole = matchingMove.designation || (matchingMove as any).fromRole || matchingMove.fromUserRole || (matchingMove as any).actorRole || 'Administrative Authority';
      const sigHash = matchingMove.id
        ? `SIG-${matchingMove.id.substring(0, 8).toUpperCase()}`
        : `SIG-${(note.noteSheetNumber || 'NS').substring(0, 6)}`;
      const actionDate = matchingMove.timestamp
        ? new Date(matchingMove.timestamp).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : note.date;

      const nameLines = wrapRobustText(signerName, 'times', 'bold', 8.25, innerW);
      const desigLines = wrapRobustText(`Designation: ${signerRole}`, 'times', 'normal', 7.2, innerW);
      const dateLines = wrapRobustText(`Action Date: ${actionDate}`, 'times', 'normal', 7.2, innerW);
      const stampLines = wrapRobustText(`[✓ DIGITALLY SIGNED & VERIFIED] (${sigHash})`, 'times', 'bold', 6.8, innerW);

      let remarkLines: string[] = [];
      if (matchingMove.remarks && matchingMove.remarks.trim()) {
        remarkLines = wrapRobustText(`Remarks: "${matchingMove.remarks.trim()}"`, 'times', 'italic', 7.0, innerW);
      }

      // Height breakdown:
      // Top padding (3.8) + Header Title (3.8) + Divider (2.0)
      // + Name (nameLines.length * 3.4)
      // + Designation (desigLines.length * 3.0)
      // + Date (dateLines.length * 2.9)
      // + Stamp (stampLines.length * 2.8)
      // + Remarks (remarkLines.length * 2.8)
      // + Bottom padding (3.0)
      let calcH = 3.8 + 2.0 + (nameLines.length * 3.4) + (desigLines.length * 3.0) + (dateLines.length * 2.9) + (stampLines.length * 2.8) + 3.0;
      if (remarkLines.length > 0) {
        calcH += (remarkLines.length * 2.8) + 1.2;
      }

      const totalH = Math.max(28, calcH);
      return {
        matchingMove,
        height: totalH,
        lines: {
          nameLines,
          desigLines,
          dateLines,
          stampLines,
          remarkLines
        }
      };
    };

    // Calculate total height of all 3 rows
    let totalSection4Height = 8;
    const measuredRows: Array<[ReturnType<typeof measureCardContent>, ReturnType<typeof measureCardContent> | null, number]> = [];

    for (let i = 0; i < signatureLevels.length; i += 2) {
      const card0 = measureCardContent(signatureLevels[i]);
      const card1 = (i + 1 < signatureLevels.length) ? measureCardContent(signatureLevels[i + 1]) : null;
      const rowHeight = Math.max(card0.height, card1 ? card1.height : 0);
      measuredRows.push([card0, card1, rowHeight]);
      totalSection4Height += rowHeight + 3.5;
    }

    // If the COMPLETE Approval & Signature Section cannot fit on the current page,
    // move the entire section together to the next page so no approval blocks are split.
    ensureVerticalSpace(totalSection4Height);

    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colorBlack);
    doc.text('4. OFFICIAL APPROVAL & SIGNATURE BLOCKS', margin, currentY);
    currentY += 4.5;

    for (let r = 0; r < measuredRows.length; r++) {
      const [card0, card1, rowHeight] = measuredRows[r];
      const rowItems: Array<{ lvl: typeof signatureLevels[0]; cardData: typeof card0; col: number }> = [
        { lvl: signatureLevels[r * 2], cardData: card0, col: 0 }
      ];
      if (card1 && (r * 2 + 1) < signatureLevels.length) {
        rowItems.push({ lvl: signatureLevels[r * 2 + 1], cardData: card1, col: 1 });
      }

      for (const { lvl, cardData, col } of rowItems) {
        const boxX = margin + (col * (sigBoxWidth + 6));
        const boxY = currentY;
        const textStartX = boxX + cardPaddingX;

        // Draw Signature Cell (Pure White Background, Thin Black Border)
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.setFillColor(255, 255, 255);
        doc.rect(boxX, boxY, sigBoxWidth, rowHeight, 'FD');

        // Header Title (11px / 8.25pt Bold Black, Overflow-Protected)
        doc.setFont('times', 'bold');
        doc.setFontSize(8.25);
        doc.setTextColor(...colorBlack);
        doc.text(lvl.label, textStartX, boxY + 3.8);

        // Divider
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.15);
        doc.line(boxX + 2, boxY + 5.0, boxX + sigBoxWidth - 2, boxY + 5.0);

        if (cardData.matchingMove) {
          let innerY = boxY + 8.4;

          // Signer Name
          doc.setFont('times', 'bold');
          doc.setFontSize(8.25);
          doc.setTextColor(...colorBlack);
          for (const nl of cardData.lines.nameLines!) {
            doc.text(nl, textStartX, innerY);
            innerY += 3.4;
          }

          // Designation
          doc.setFont('times', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(...colorBlack);
          for (const dl of cardData.lines.desigLines!) {
            doc.text(dl, textStartX, innerY);
            innerY += 3.0;
          }

          // Action Date & Time
          doc.setFont('times', 'normal');
          doc.setFontSize(7.2);
          doc.setTextColor(...colorBlack);
          for (const dtl of cardData.lines.dateLines!) {
            doc.text(dtl, textStartX, innerY);
            innerY += 2.9;
          }

          // Digital Signature Verified Tag & Signature ID (Wrapped & styled, NEVER overflows)
          doc.setFont('times', 'bold');
          doc.setFontSize(6.8);
          doc.setTextColor(...colorBlack);
          for (const sl of cardData.lines.stampLines!) {
            doc.text(sl, textStartX, innerY);
            innerY += 2.8;
          }

          // Remarks if present
          if (cardData.lines.remarkLines && cardData.lines.remarkLines.length > 0) {
            doc.setFont('times', 'italic');
            doc.setFontSize(7.0);
            doc.setTextColor(...colorBlack);
            for (const rl of cardData.lines.remarkLines) {
              doc.text(rl, textStartX, innerY);
              innerY += 2.8;
            }
          }
        } else {
          // Empty Signature Block / Pending
          doc.setFont('times', 'italic');
          doc.setFontSize(8.0);
          doc.setTextColor(...colorBlack);
          doc.text('[ PENDING SIGNATURE & ENDORSEMENT ]', textStartX, boxY + 11.5);

          doc.setFont('times', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...colorBlack);
          doc.text('Signature / Stamp:', textStartX, boxY + rowHeight - 4);
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.15);
          doc.line(boxX + 26, boxY + rowHeight - 4, boxX + sigBoxWidth - 3, boxY + rowHeight - 4);
        }
      }

      currentY += rowHeight + 3.5;
    }

    // ─── 8. SECTION 5: OFFICIAL MANUAL REMARKS & AMENDMENT SPACE ─────────
    ensureVerticalSpace(26);
    doc.setFont('times', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...colorBlack);
    doc.text('REMARKS / MODIFICATION, IF ANY:', margin, currentY);
    currentY += 4;

    const manualBoxHeight = 18;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, currentY, contentWidth, manualBoxHeight, 'FD');

    doc.setFont('times', 'italic');
    doc.setFontSize(8.25);
    doc.setTextColor(...colorBlack);
    doc.text('(Space reserved for manual administrative notes, legal counsel observation, or executive proviso)', margin + 2.5, currentY + 4);

    // Subtle lines for handwriting
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(margin + 2.5, currentY + 8.5, margin + contentWidth - 2.5, currentY + 8.5);
    doc.line(margin + 2.5, currentY + 13, margin + contentWidth - 2.5, currentY + 13);
    doc.setLineDashPattern([], 0); // Reset

    currentY += manualBoxHeight + 4;

    // ─── 9. SECTION 6: SUPPORTING ATTACHMENTS & ANNEXURES ────────────────
    if (attachments.length > 0) {
      ensureVerticalSpace(20);
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...colorBlack);
      doc.text('6. ENCLOSED SUPPORTING DOCUMENTS / ANNEXURES', margin, currentY);
      currentY += 4;

      const attRows = attachments.map((att: any, idx) => {
        let attName = typeof att === 'string' ? att : (att.fileName || att.name || `Attachment ${idx + 1}`);
        // Strip potential long file path prefixes if present
        if (attName.includes('/')) attName = attName.split('/').pop() || attName;
        if (attName.includes('\\')) attName = attName.split('\\').pop() || attName;

        const attCategory = typeof att === 'object' && att && att.documentCategory
          ? att.documentCategory
          : 'Supporting Document';
        const attFormat = typeof att === 'string'
          ? (att.split('.').pop()?.toUpperCase() || 'DOCUMENT')
          : (att.fileType || (att.fileName ? att.fileName.split('.').pop()?.toUpperCase() : 'DOCUMENT') || 'DOCUMENT');
        const attSize = typeof att === 'object' && att && att.fileSizeFormatted
          ? att.fileSizeFormatted
          : (typeof att === 'object' && att && att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : 'Attached');
        const attDate = typeof att === 'object' && att && (att.uploadedAt || att.createdAt)
          ? (att.uploadedAt || att.createdAt).split('T')[0]
          : (note.date || 'N/A');
        const attUploader = typeof att === 'object' && att && (att.uploadedByName || att.uploadedBy)
          ? (att.uploadedByName || att.uploadedBy)
          : (note.creatorName || 'Faculty / Staff');

        return [
          String(idx + 1),
          attName,
          attCategory,
          attFormat,
          attSize,
          attDate,
          attUploader
        ];
      });

      autoTable(doc, {
        startY: currentY,
        margin: { left: margin, right: margin },
        head: [['#', 'Document Title / Filename', 'Category / Reference', 'Format', 'Size', 'Date', 'Uploaded By']],
        body: attRows,
        theme: 'grid',
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0],
          font: 'times',
          fontStyle: 'bold',
          fontSize: 8.25,
          lineColor: [0, 0, 0],
          lineWidth: 0.2
        },
        styles: {
          font: 'times',
          fontSize: 8,
          cellPadding: 1.5,
          lineColor: [0, 0, 0],
          lineWidth: 0.2,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          overflow: 'linebreak'
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 50 },
          2: { cellWidth: 34 },
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 28 }
        }
      });

      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 4;
    }

    // Statutory Compliance Statement at end of document body (Black text)
    ensureVerticalSpace(14);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 3.5;

    doc.setFont('times', 'italic');
    doc.setFontSize(8.25);
    doc.setTextColor(...colorBlack);
    doc.text(
      '"This document is an authentic electronic administrative record of Swarrnim Startup & Innovation University. The recorded cryptographic approval trail is legally valid and binding under University administrative statutes."',
      pageWidth / 2,
      currentY,
      { align: 'center', maxWidth: contentWidth }
    );

    // ─── 10. MULTI-PAGE RUNNING HEADERS, WORD PAGE BORDER & FOOTERS ──────────
    // @ts-ignore
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      // Single continuous Microsoft Word style page border on EVERY page
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.35);
      doc.rect(10, 10, 190, 277);

      // Running Header on Page 2+
      if (p > 1) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8.25);
        doc.setTextColor(...colorBlack);
        doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', margin, margin - 3);
        doc.text(`Notesheet: ${note.noteSheetNumber || note.id} • Page ${p} of ${totalPages}`, pageWidth - margin, margin - 3, { align: 'right' });
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.line(margin, margin - 1.5, pageWidth - margin, margin - 1.5);
      }

      // Page Numbering & Verification Footer (clean and minimal, comfortably inside page border)
      doc.setFont('times', 'normal');
      doc.setFontSize(8.25);
      doc.setTextColor(...colorBlack);
      doc.text(`Doc Verification ID: ${note.verificationId || note.noteSheetNumber} • v${note.version || '1.0'}`, margin, 283);
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, 283, { align: 'right' });
    }

    // Generate output buffers
    const pdfDataUri = doc.output('datauristring');
    const pdfArrayBuffer = doc.output('arraybuffer');
    const fileSize = pdfArrayBuffer.byteLength;
    const sanitizedNumber = (note.noteSheetNumber || note.id).replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${sanitizedNumber}_v${newVersion}.pdf`;
    const pdfId = `pdf-${note.id || 'draft'}-v${newVersion}`;

    return {
      doc,
      pdfDataUri,
      pdfArrayBuffer,
      fileSize,
      fileName,
      pdfId,
      totalPages
    };
  }

  /**
   * Helper: Convert data URL to a browser Blob URL (application/pdf)
   */
  public createPdfBlobUrl(dataUrl: string): string {
    if (typeof window === 'undefined') return dataUrl;
    try {
      if (!dataUrl.startsWith('data:application/pdf')) return dataUrl;
      const parts = dataUrl.split(',');
      const byteString = atob(parts[1]);
      const mimeString = parts[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      return URL.createObjectURL(blob);
    } catch {
      return dataUrl;
    }
  }

  /**
   * Generates the Official A4 Multi-Page PDF for a Notesheet.
   */
  public async generatePdf(
    notesheetId: string,
    user: User,
    roleOrOptions?: UserRole | NoteSheetPdfGenerationOptions,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<NoteSheetPdfResponse> {
    const effectiveRole: UserRole = (typeof roleOrOptions === 'string' ? roleOrOptions : (user ? user.role : 'FACULTY')) as UserRole;
    const effectiveOptions: NoteSheetPdfGenerationOptions = (typeof roleOrOptions === 'object' ? roleOrOptions : options) || {};
    const note = this.validatePdfAccess(notesheetId, user, effectiveRole);
    const dataHash = this.computeDataHash(note);

    // Idempotency Check: Reuse existing valid PDF if not forced and data hasn't changed
    const existingPdfs = db.getNoteSheetPdfs(note.id);
    const latestPdf = existingPdfs.sort((a, b) => b.version - a.version)[0];

    if (!effectiveOptions.forceRegenerate && latestPdf && latestPdf.dataHash === dataHash && latestPdf.dataUrl) {
      return {
        success: true,
        notesheetId: note.id,
        noteSheetNumber: note.noteSheetNumber || note.id,
        pdfId: latestPdf.pdfId,
        downloadUrl: latestPdf.dataUrl,
        fileName: latestPdf.fileName,
        version: latestPdf.version,
        fileSize: latestPdf.fileSize,
        generatedAt: latestPdf.generatedAt,
        status: note.status,
        isCached: true
      };
    }

    // Determine version number
    const newVersion = latestPdf ? latestPdf.version + 1 : 1;
    const renderRes = this.renderPdfDocument(note, effectiveOptions, newVersion);
    const generatedAt = new Date().toISOString();

    // Save buffer into project's fileStorage service
    let storageReference = `idb://notesheets/${renderRes.fileName}`;
    try {
      storageReference = await fileStorage.saveBuffer(renderRes.fileName, 'application/pdf', renderRes.pdfArrayBuffer);
    } catch {
      storageReference = `idb://notesheets/${renderRes.fileName}`;
    }

    const record: NoteSheetPdfRecord = {
      pdfId: renderRes.pdfId,
      notesheetId: note.id,
      noteSheetNumber: note.noteSheetNumber || note.id,
      fileName: renderRes.fileName,
      version: newVersion,
      fileSize: renderRes.fileSize,
      dataUrl: renderRes.pdfDataUri,
      storageReference,
      generatedBy: {
        id: user.id,
        name: user.name,
        role: String(effectiveRole)
      },
      generatedAt,
      notesheetStatusAtGeneration: note.status,
      dataHash
    };

    // Store in backend database repository
    db.saveNoteSheetPdf(record);

    // Record Security & Audit Event
    securityAuditService.logSecurityEvent(
      effectiveOptions.forceRegenerate ? 'NOTESHEET_PDF_REGENERATED' : 'NOTESHEET_PDF_GENERATED',
      'NOTESHEET_PDF',
      'NoteSheet',
      `Official Notesheet PDF generated for "${note.noteSheetNumber}" (v${newVersion}, ${renderRes.fileSize} bytes) by ${user.name} (${effectiveRole}). Status: ${note.status}.`,
      user,
      effectiveRole,
      {
        recordId: note.id,
        status: 'SUCCESS',
        severity: 'INFO',
        ipAddress: effectiveOptions.ipAddress,
        userAgent: effectiveOptions.userAgent
      }
    );

    return {
      success: true,
      notesheetId: note.id,
      noteSheetNumber: note.noteSheetNumber || note.id,
      pdfId: renderRes.pdfId,
      downloadUrl: renderRes.pdfDataUri,
      fileName: renderRes.fileName,
      version: newVersion,
      fileSize: renderRes.fileSize,
      generatedAt,
      status: note.status,
      isCached: false
    };
  }

  /**
   * Generates official Draft PDF (for pre-submission review / validation).
   */
  public async generateDraftPdf(
    note: NoteSheet,
    user: User,
    roleOrOptions?: UserRole | NoteSheetPdfGenerationOptions,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<NoteSheetPdfResponse> {
    const effectiveRole: UserRole = (typeof roleOrOptions === 'string' ? roleOrOptions : (user ? user.role : 'FACULTY')) as UserRole;
    const effectiveOptions: NoteSheetPdfGenerationOptions = (typeof roleOrOptions === 'object' ? roleOrOptions : options) || {};
    const renderRes = this.renderPdfDocument(note, { ...effectiveOptions, watermarkText: effectiveOptions.watermarkText || 'DRAFT NOTE' }, 1);

    return {
      success: true,
      notesheetId: note.id || 'draft-notesheet',
      noteSheetNumber: note.noteSheetNumber || 'DRAFT',
      pdfId: renderRes.pdfId,
      downloadUrl: renderRes.pdfDataUri,
      fileName: renderRes.fileName,
      version: 1,
      fileSize: renderRes.fileSize,
      generatedAt: new Date().toISOString(),
      status: note.status || 'DRAFT',
      isCached: false
    };
  }

  /**
   * Generates and prints the official Notesheet PDF directly via an isolated PDF stream.
   * NEVER invokes window.print() on the ERP UI.
   */
  public async printPdf(
    notesheetId: string,
    user: User,
    roleOrOptions?: UserRole | NoteSheetPdfGenerationOptions,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<void> {
    const effectiveRole: UserRole = (typeof roleOrOptions === 'string' ? roleOrOptions : (user ? user.role : 'FACULTY')) as UserRole;
    const effectiveOptions: NoteSheetPdfGenerationOptions = (typeof roleOrOptions === 'object' ? roleOrOptions : options) || {};
    const res = await this.generatePdf(notesheetId, user, effectiveRole, effectiveOptions);
    const blobUrl = this.createPdfBlobUrl(res.downloadUrl);

    // Record Security & Audit Event
    securityAuditService.logSecurityEvent(
      'NOTESHEET_PDF_PRINTED',
      'NOTESHEET_PDF',
      'NoteSheet',
      `Official Notesheet PDF "${res.fileName}" print triggered by ${user.name} (${effectiveRole}).`,
      user,
      effectiveRole,
      { recordId: notesheetId, status: 'SUCCESS', severity: 'INFO' }
    );

    if (typeof window === 'undefined') return;

    // Open the official PDF in a dedicated window/tab for native vector print
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      // Fallback: If popup blocker blocked the new tab, create an iframe to trigger print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {}
        }, 250);
      };
    }
  }

  /**
   * Generates and prints a Draft Notesheet PDF for pre-submission preview.
   */
  public async printDraftPdf(
    note: NoteSheet,
    user: User,
    roleOrOptions?: UserRole | NoteSheetPdfGenerationOptions,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<void> {
    const effectiveRole: UserRole = (typeof roleOrOptions === 'string' ? roleOrOptions : (user ? user.role : 'FACULTY')) as UserRole;
    const effectiveOptions: NoteSheetPdfGenerationOptions = (typeof roleOrOptions === 'object' ? roleOrOptions : options) || {};
    
    const res = await this.generateDraftPdf(note, user, effectiveRole, { ...effectiveOptions, watermarkText: 'DRAFT NOTE' });
    const blobUrl = this.createPdfBlobUrl(res.downloadUrl);

    if (typeof window === 'undefined') return;

    // Open the official Draft PDF in a dedicated window/tab for native vector print
    const printWindow = window.open(blobUrl, '_blank');
    if (!printWindow) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch {}
        }, 250);
      };
    }
  }

  /**
   * Opens the official Notesheet PDF directly in a clean browser tab / native PDF viewer.
   */
  public async openPdfInNewTab(
    notesheetId: string,
    user: User,
    roleOrOptions?: UserRole | NoteSheetPdfGenerationOptions,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<void> {
    const effectiveRole: UserRole = (typeof roleOrOptions === 'string' ? roleOrOptions : (user ? user.role : 'FACULTY')) as UserRole;
    const effectiveOptions: NoteSheetPdfGenerationOptions = (typeof roleOrOptions === 'object' ? roleOrOptions : options) || {};
    const res = await this.generatePdf(notesheetId, user, effectiveRole, effectiveOptions);
    const blobUrl = this.createPdfBlobUrl(res.downloadUrl);

    if (typeof window !== 'undefined') {
      window.open(blobUrl, '_blank');
    }
  }

  /**
   * Regenerates Notesheet PDF with incremented version.
   */
  public async regeneratePdf(
    notesheetId: string,
    user: User,
    role: UserRole,
    options: NoteSheetPdfGenerationOptions = {}
  ): Promise<NoteSheetPdfResponse> {
    return this.generatePdf(notesheetId, user, role, { ...options, forceRegenerate: true });
  }

  /**
   * Secure PDF Download Handler.
   * Validates access and logs download audit record.
   */
  public async downloadPdf(
    notesheetId: string,
    user: User,
    role: UserRole
  ): Promise<{ fileName: string; dataUrl: string; fileSize: number }> {
    const note = this.validatePdfAccess(notesheetId, user, role);
    const pdfRes = await this.generatePdf(notesheetId, user, role, { forceRegenerate: false });

    // Record Download Audit Event
    securityAuditService.logSecurityEvent(
      'NOTESHEET_PDF_DOWNLOADED',
      'NOTESHEET_PDF',
      'NoteSheet',
      `Official Notesheet PDF "${pdfRes.fileName}" downloaded by ${user.name} (${role}).`,
      user,
      role,
      { recordId: note.id, status: 'SUCCESS', severity: 'INFO' }
    );

    return {
      fileName: pdfRes.fileName,
      dataUrl: pdfRes.downloadUrl,
      fileSize: pdfRes.fileSize
    };
  }

  /**
   * Retrieve PDF Version History for a Notesheet.
   */
  public getPdfVersions(notesheetId: string, user: User, role: UserRole): NoteSheetPdfRecord[] {
    this.validatePdfAccess(notesheetId, user, role);
    return db.getNoteSheetPdfs(notesheetId).sort((a, b) => b.version - a.version);
  }

  /**
   * Universal REST API Dispatcher executing:
   * Request -> Authentication -> RBAC Scope -> Service Handler -> Audit -> Standard Response Envelope
   */
  public async handleApiRequest(
    path: string,
    method: 'POST' | 'GET',
    payload: any,
    user?: User | null,
    role?: UserRole | null
  ): Promise<ApiResponse<any>> {
    try {
      if (!user) {
        throw new UnauthorizedError('401 Unauthorized: Authentication required to access Notesheet PDF API.');
      }

      const effectiveRole = role || user.role;

      // Route: POST /api/notesheets/:notesheetId/pdf
      if (method === 'POST' && path.match(/^\/api\/notesheets\/[^/]+\/pdf$/)) {
        const notesheetId = path.split('/')[3];
        const res = await this.generatePdf(notesheetId, user, effectiveRole, payload || {});
        return successResponse(res);
      }

      // Route: POST /api/notesheets/:notesheetId/pdf/regenerate
      if (method === 'POST' && path.match(/^\/api\/notesheets\/[^/]+\/pdf\/regenerate$/)) {
        const notesheetId = path.split('/')[3];
        const res = await this.regeneratePdf(notesheetId, user, effectiveRole, payload || {});
        return successResponse(res);
      }

      // Route: GET /api/notesheets/:notesheetId/pdf/download
      if (method === 'GET' && path.match(/^\/api\/notesheets\/[^/]+\/pdf\/download$/)) {
        const notesheetId = path.split('/')[3];
        const res = await this.downloadPdf(notesheetId, user, effectiveRole);
        return successResponse(res);
      }

      // Route: GET /api/notesheets/:notesheetId/pdf/versions
      if (method === 'GET' && path.match(/^\/api\/notesheets\/[^/]+\/pdf\/versions$/)) {
        const notesheetId = path.split('/')[3];
        const versions = this.getPdfVersions(notesheetId, user, effectiveRole);
        return successResponse({ count: versions.length, versions });
      }

      throw new NotFoundError(`404 Not Found: Unknown Notesheet PDF route "${path}".`);
    } catch (err: unknown) {
      return errorResponse(err, path);
    }
  }
}

export const notesheetPdfService = new NoteSheetPdfService();
