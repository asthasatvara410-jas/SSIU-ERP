/**
 * Official SSIU Events & TechFest Circular PDF Generator Service
 * Generates an official A4 Portrait (210mm x 297mm) Event Circular / Brochure PDF using jsPDF.
 * Opens directly in a new browser tab with zero 404 errors.
 */

import { jsPDF } from 'jspdf';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

export interface EventCircularData {
  id: string;
  title: string;
  category: string;
  date: string;
  time?: string;
  venue?: string;
  organizer?: string;
  registeredCount?: number;
  description?: string;
  officialCircularUrl?: string;
  officialDocumentUrl?: string;
  fileUrl?: string;
}

/**
 * Generates an official A4 Event Circular PDF Blob
 */
export async function generateEventCircularPDF(event: EventCircularData): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2; // 178mm
  const brandNavy: [number, number, number] = [15, 44, 89]; // #0F2C59
  const brandOrange: [number, number, number] = [242, 107, 33]; // #F26B21
  const textDark: [number, number, number] = [15, 23, 42]; // #0F172A
  const textMuted: [number, number, number] = [100, 116, 139]; // #64748B
  const bgLight: [number, number, number] = [248, 250, 252]; // #F8FAFC
  const borderSlate: [number, number, number] = [226, 232, 240]; // #E2E8F0

  let curY = 16;

  // 1. Header with Logo
  try {
    if (SWARRNIM_LOGO_PNG_BASE64) {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', marginX, curY - 2, 20, 20);
    }
  } catch {
    // fallback if logo fails
  }

  const headerTextX = marginX + 24;

  // University Header
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', headerTextX, curY + 3);

  // Subtitle
  doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setFontSize(9.5);
  doc.text('OFFICIAL EVENT CIRCULAR & TECHFEST BULLETIN', headerTextX, curY + 8);

  // Campus location
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar - 382420, Gujarat, India | www.swarrnim.edu.in', headerTextX, curY + 12.5);

  // Accent divider bar
  curY += 18;
  doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.rect(marginX, curY, contentWidth * 0.75, 1.2, 'F');
  doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.rect(marginX + contentWidth * 0.75, curY, contentWidth * 0.25, 1.2, 'F');
  curY += 6;

  // 2. Metadata Box
  const refNumber = `SSIU/EVT/${event.category?.toUpperCase() || 'GEN'}/${(event.date || '2024-04-01').replace(/-/g, '')}/${event.id?.replace('evt-', '') || '001'}`;
  const metaBoxY = curY;
  const metaBoxHeight = 22;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD');

  // Left Column
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CIRCULAR REF NO:', marginX + 4, metaBoxY + 6);
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(refNumber, marginX + 4, metaBoxY + 11);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('ORGANIZING CELL:', marginX + 4, metaBoxY + 16);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(event.organizer || 'Student Activity Council & University Cell', marginX + 32, metaBoxY + 16);

  // Right Column
  const rightColX = marginX + contentWidth - 4;
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EVENT DATE:', rightColX - 52, metaBoxY + 6);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.date, rightColX, metaBoxY + 6, { align: 'right' });

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('EVENT CATEGORY:', rightColX - 52, metaBoxY + 16);
  doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.category?.toUpperCase() || 'TECHFEST', rightColX, metaBoxY + 16, { align: 'right' });

  curY += metaBoxHeight + 8;

  // 3. Event Subject / Title
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);

  const titlePrefix = 'OFFICIAL ANNOUNCEMENT: ';
  const titleLines = doc.splitTextToSize(titlePrefix + event.title.toUpperCase(), contentWidth);
  doc.text(titleLines, marginX, curY);
  curY += titleLines.length * 5.5 + 2;

  // Underline
  doc.setDrawColor(brandOrange[0], brandOrange[1], brandOrange[2]);
  doc.setLineWidth(0.6);
  doc.line(marginX, curY, marginX + contentWidth, curY);
  curY += 7;

  // 4. Schedule & Venue Details Grid Box
  const schedBoxY = curY;
  const schedBoxHeight = 18;

  doc.setFillColor(254, 243, 199); // Amber 50
  doc.setDrawColor(251, 191, 36); // Amber 400
  doc.setLineWidth(0.4);
  doc.roundedRect(marginX, schedBoxY, contentWidth, schedBoxHeight, 2, 2, 'FD');

  doc.setTextColor(146, 64, 14); // Amber 800
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TIME & SCHEDULE:', marginX + 4, schedBoxY + 6);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.time || '10:00 AM - 05:00 PM', marginX + 32, schedBoxY + 6);

  doc.setTextColor(146, 64, 14);
  doc.setFont('helvetica', 'bold');
  doc.text('CAMPUS VENUE:', marginX + 4, schedBoxY + 12.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.text(event.venue || 'University Main Campus, Swarrnim Campus Block', marginX + 32, schedBoxY + 12.5);

  curY += schedBoxHeight + 8;

  // 5. Description / Event Scope
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('EVENT OVERVIEW & PARTICIPATION GUIDELINES:', marginX, curY);
  curY += 5.5;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const fullDesc = event.description || 
    'All interested students, faculty members, and researchers are invited to register and participate in this official university event. Please ensure prior registration through the Swarrnim ERP Portal to receive participation certificates and event kits.';

  const descLines = doc.splitTextToSize(fullDesc, contentWidth);
  doc.text(descLines, marginX, curY);
  curY += descLines.length * 5 + 6;

  // Key Highlights / Bullet Points
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('IMPORTANT INSTRUCTIONS FOR PARTICIPANTS:', marginX, curY);
  curY += 5;

  const points = [
    '• Valid University Student ID Card is mandatory at the entrance registration desk.',
    '• All registered participants will receive official Certificates of Participation recognized by SSIU.',
    '• Teams for Hackathons and Competitions must complete registration before the published deadline.',
    '• Winners will be awarded cash prizes, incubation grants, and mementos during the closing valedictory session.'
  ];

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  for (const pt of points) {
    doc.text(pt, marginX + 2, curY);
    curY += 4.5;
  }

  // 6. Signatory Block
  curY += 8;
  const signX = marginX + contentWidth - 65;
  doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Convener / Event Head,', signX, curY);
  curY += 4.5;

  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(event.organizer || 'Student Activity Council & Dean Academics', signX, curY);
  curY += 4;

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Swarrnim Startup & Innovation University', signX, curY);

  // 7. Footer
  const footerY = pageHeight - 12;
  doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
  doc.setLineWidth(0.3);
  doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(
    'This is an official event circular verified by Swarrnim University Events Directorate. Valid without physical signature.',
    marginX,
    footerY
  );

  doc.setFont('helvetica', 'bold');
  doc.text('Page 1 of 1', pageWidth - marginX, footerY, { align: 'right' });

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

/**
 * Opens the official event circular PDF in a new browser tab with zero 404 errors.
 */
export async function openEventCircularPDF(event: EventCircularData): Promise<string> {
  try {
    const pdfBlob = await generateEventCircularPDF(event);
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Open in a new tab safely
    const newTab = window.open(pdfUrl, '_blank', 'noopener,noreferrer');

    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      // Fallback for pop-up blockers
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    return pdfUrl;
  } catch (err) {
    console.error('Failed to open event circular PDF:', err);
    throw err;
  }
}
