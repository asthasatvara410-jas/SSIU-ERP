/**
 * Centralized SSIU ERP-Wide Examination Hall Ticket PDF Generator Service
 * Generates an official University Examination Hall Ticket / Admit Card on A4 PORTRAIT (1 Page, 210mm x 297mm).
 * Matches the official university physical Hall Ticket reference layout.
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { HallTicketData } from '../types/hallTicket';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

/**
 * 1. Single Hall Ticket PDF Generator (1 Page A4 Portrait)
 */
export async function generateHallTicketPDF(ticket: HallTicketData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  renderSingleHallTicketPage(doc, ticket);

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * 2. Multi-Student Bulk Hall Tickets PDF Generator
 */
export async function generateBulkHallTicketsPDF(tickets: HallTicketData[]): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  tickets.forEach((ticket, index) => {
    if (index > 0) {
      doc.addPage('a4', 'portrait');
    }
    renderSingleHallTicketPage(doc, ticket);
  });

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Draw Official University Circular Exam Section Seal Stamp
 */
function drawOfficialExamSeal(doc: jsPDF, centerX: number, centerY: number): void {
  const sealBlue: [number, number, number] = [30, 58, 138]; // #1E3A8A

  doc.setDrawColor(sealBlue[0], sealBlue[1], sealBlue[2]);
  doc.setTextColor(sealBlue[0], sealBlue[1], sealBlue[2]);
  doc.setLineWidth(0.35);

  // Outer circle
  doc.circle(centerX, centerY, 12.5, 'S');

  // Inner dashed circle
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.circle(centerX, centerY, 11, 'S');
  doc.setLineDashPattern([], 0);

  // Center text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4.2);
  doc.text('SWARRNIM STARTUP &', centerX, centerY - 6, { align: 'center' });
  doc.text('INNOVATION UNIVERSITY', centerX, centerY - 3.8, { align: 'center' });

  // Center banner
  doc.setLineWidth(0.2);
  doc.line(centerX - 9, centerY - 2.2, centerX + 9, centerY - 2.2);
  doc.setFontSize(6);
  doc.text('EXAM SECTION', centerX, centerY + 0.8, { align: 'center' });
  doc.line(centerX - 9, centerY + 2.5, centerX + 9, centerY + 2.5);

  doc.setFontSize(4.5);
  doc.text('GANDHINAGAR', centerX, centerY + 5.5, { align: 'center' });
}

/**
 * Core Renderer: Draws one complete official Hall Ticket on the current jsPDF page (210mm x 297mm)
 */
export function renderSingleHallTicketPage(doc: jsPDF, ticket: HallTicketData): void {
  const pageWidth = 210;
  const marginX = 10;
  const contentWidth = pageWidth - (marginX * 2); // 190mm
  const startX = marginX;
  const startY = 10;

  let curY = startY;

  // ─── 1. HEADER (LOGO + UNIVERSITY NAME + SESSION + HALL TICKET) ─────
  try {
    if (SWARRNIM_LOGO_PNG_BASE64) {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', startX + 2, curY + 1, 20, 12);
    }
  } catch {
    // Fallback
  }

  // Header Titles Centered
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', startX + (contentWidth / 2) + 6, curY + 4, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`END SEM EXAM ${ticket.examSession?.toUpperCase() || 'SUMMER- 2026'}`, startX + (contentWidth / 2) + 6, curY + 8, { align: 'center' });

  doc.setFontSize(10);
  doc.text('HALL TICKET', startX + (contentWidth / 2) + 6, curY + 12.2, { align: 'center' });

  curY += 14.5;

  // Header bottom dividing line
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.line(startX, curY, startX + contentWidth, curY);

  curY += 1.5;

  // ─── 2. STUDENT INFORMATION & PHOTO / SIGNATURE COLUMN ──────────────
  const photoColWidth = 32;
  const infoTableWidth = contentWidth - photoColWidth; // 190 - 32 = 158mm

  const studentRows = [
    ['STUDENT NAME', (ticket.studentName || '—').toUpperCase()],
    ['ENROLLMENT NO', ticket.enrollmentNo || '—'],
    ['BRANCH NAME', (ticket.programName || '—').toUpperCase()],
    ['SEMESTER', ticket.semesterName?.replace(/Semester\s*/i, '') || '2'],
    ['HALL TICKET NO', ticket.hallTicketNo || '—'],
    ['EXAM CENTRE', `${(ticket.centreName || 'SSIU MAIN CAMPUS').toUpperCase()} (CODE: ${ticket.centreCode || '01'})`],
    ['ROOM & SEAT NO', `ROOM: ${ticket.subjects[0]?.roomNo || '101'}   |   SEAT: ${ticket.examSeatNo || '—'}`]
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: startX },
    tableWidth: infoTableWidth,
    theme: 'grid',
    styles: {
      fontSize: 6.8,
      cellPadding: 1.6,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: infoTableWidth - 38, fontStyle: 'bold' }
    },
    body: studentRows
  });

  const infoTableFinalY = (doc as any).lastAutoTable?.finalY ?? curY + 36;
  const photoColHeight = infoTableFinalY - curY;

  // Render Right Column: Photo Box + Student Signature Box
  const photoX = startX + infoTableWidth;
  const photoY = curY;
  const photoH = photoColHeight - 11;

  // Photo outer box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(photoX, photoY, photoColWidth, photoH);

  let photoRendered = false;
  if (ticket.photoUrl && ticket.photoUrl.startsWith('data:image')) {
    try {
      const format = ticket.photoUrl.includes('image/png') ? 'PNG' : 'JPEG';
      doc.addImage(ticket.photoUrl, format, photoX + 0.5, photoY + 0.5, photoColWidth - 1, photoH - 1);
      photoRendered = true;
    } catch {
      photoRendered = false;
    }
  }

  if (!photoRendered) {
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('PHOTO', photoX + (photoColWidth / 2), photoY + (photoH / 2), { align: 'center' });
  }

  // Signature Box directly under Photo (Matching Reference Design)
  const signBoxY = photoY + photoH;
  doc.rect(photoX, signBoxY, photoColWidth, 11);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('SIGN', photoX + (photoColWidth / 2), signBoxY + 8.5, { align: 'center' });

  curY = infoTableFinalY + 3;

  // ─── 3. CIRCULAR UNIVERSITY EXAM SECTION SEAL STAMP ──────────────────
  drawOfficialExamSeal(doc, startX + (contentWidth / 2), curY + 11);
  curY += 24;

  // ─── 4. EXAMINATION SCHEDULE TABLE (REFERENCE DESIGN) ────────────────
  const scheduleTableBody = (ticket.subjects || []).map((sub) => [
    sub.examDate || '—',
    sub.subjectCode || '—',
    sub.subjectName || 'Theory Paper',
    sub.examTime || `${ticket.examStartTime} - ${ticket.examEndTime}`,
    `${sub.roomNo || '101'} / ${sub.seatNo || ticket.examSeatNo}`,
    '' // Space for Invigilator's Signature
  ]);

  autoTable(doc, {
    startY: curY,
    margin: { left: startX },
    tableWidth: contentWidth,
    theme: 'grid',
    head: [['DATE', 'SUB. CODE', 'SUBJECT / PAPER TITLE', 'TIME', 'ROOM & SEAT', 'SIGN']],
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 6.8,
      fontStyle: 'bold',
      halign: 'center',
      cellPadding: 1.6,
      lineColor: [0, 0, 0],
      lineWidth: 0.25
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 70, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 26, halign: 'center' },
      4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center' }
    },
    styles: {
      fontSize: 6.2,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      lineWidth: 0.25,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    body: scheduleTableBody
  });

  curY = ((doc as any).lastAutoTable?.finalY ?? curY + 30) + 3;

  // ─── 5. IMPORTANT CANDIDATE INSTRUCTIONS ─────────────────────────────
  const instBoxH = 22;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(startX, curY, contentWidth, instBoxH);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('IMPORTANT CANDIDATE INSTRUCTIONS:', startX + 2, curY + 3);

  const instructions = [
    '1. Candidate must carry this Hall Ticket to the examination centre for every examination session.',
    '2. Candidate must carry a valid University Enrollment Card / Photo ID along with this Hall Ticket.',
    '3. Candidate must report to the allocated examination centre at least 30 minutes before the scheduled commencement.',
    '4. Electronic gadgets, mobile phones, smart watches, and programmable calculators are strictly prohibited inside the hall.',
    '5. Follow all instructions issued by the examination authorities and invigilators. Verify question paper code before writing.',
    '6. Hall Ticket must be preserved until completion of the entire examination process and result declaration.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  let instY = curY + 6.2;
  instructions.forEach(inst => {
    doc.text(inst, startX + 2, instY);
    instY += 2.6;
  });

  curY += instBoxH + 4;

  // ─── 6. AUTHORIZATION / SIGNATURES (REFERENCE DESIGN) ────────────────
  const sigColW = contentWidth / 3;

  // Left: Controller of Examination
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.line(startX + 2, curY + 12, startX + 48, curY + 12);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('Controller of Examination', startX + 25, curY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.text('Swarrnim Startup & Innovation University', startX + 25, curY + 18.5, { align: 'center' });

  // Center: Issue Date
  doc.setFontSize(5.2);
  doc.text(`Date of Issue: ${ticket.generatedDate || new Date().toLocaleDateString('en-IN')}`, startX + (contentWidth / 2), curY + 15, { align: 'center' });
  doc.text(`Ref: ${ticket.hallTicketNo || 'HT-2026-001'}`, startX + (contentWidth / 2), curY + 18, { align: 'center' });

  // Right: Centre Superintendent
  doc.line(startX + contentWidth - 48, curY + 12, startX + contentWidth - 2, curY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.text('Centre Superintendent', startX + contentWidth - 25, curY + 15.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(4.8);
  doc.text('Signature & Examination Seal', startX + contentWidth - 25, curY + 18.5, { align: 'center' });

  curY += 22;

  // ─── 7. THIN PROFESSIONAL OUTER BORDER AROUND COMPLETE DOCUMENT ─────
  const totalBoxHeight = (curY + 2) - startY;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.35);
  doc.rect(startX, startY, contentWidth, totalBoxHeight);
}

/**
 * 3. Open Hall Ticket PDF in a New Tab
 */
export async function openHallTicketPDF(ticket: HallTicketData): Promise<string> {
  try {
    const pdfBlob = await generateHallTicketPDF(ticket);
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const newTab = window.open(pdfUrl, '_blank');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return pdfUrl;
  } catch (error) {
    console.error('Hall Ticket PDF generation failed:', error);
    throw error;
  }
}

/**
 * 4. Download Hall Ticket PDF
 */
export async function downloadHallTicketPDF(ticket: HallTicketData, filename?: string): Promise<void> {
  try {
    const pdfBlob = await generateHallTicketPDF(ticket);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const safeName = filename || `HallTicket_${ticket.enrollmentNo || 'Student'}_${(ticket.examCode || 'EXAM').replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(pdfUrl);
  } catch (error) {
    console.error('Download Hall Ticket PDF failed:', error);
  }
}

/**
 * 5. Download Bulk Hall Tickets PDF
 */
export async function downloadBulkHallTicketsPDF(tickets: HallTicketData[], filename?: string): Promise<void> {
  try {
    const pdfBlob = await generateBulkHallTicketsPDF(tickets);
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const safeName = filename || `BulkHallTickets_${tickets.length}_Students.pdf`;
    
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(pdfUrl);
  } catch (error) {
    console.error('Download Bulk Hall Tickets failed:', error);
  }
}

export class HallTicketPdfService {
  public generatePdf(ticket: HallTicketData): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    renderSingleHallTicketPage(doc, ticket);
    return doc;
  }

  public async generateBlob(ticket: HallTicketData): Promise<Blob> {
    return generateHallTicketPDF(ticket);
  }

  public openInNewTab(ticket: HallTicketData): void {
    openHallTicketPDF(ticket).catch(err => {
      console.error('Error opening Hall Ticket PDF:', err);
    });
  }

  public downloadPdf(ticket: HallTicketData, filename?: string): void {
    downloadHallTicketPDF(ticket, filename);
  }

  public downloadBulkPdf(tickets: HallTicketData[], filename?: string): void {
    downloadBulkHallTicketsPDF(tickets, filename);
  }
}

export const hallTicketPdfService = new HallTicketPdfService();
