/**
 * Official SSIU Notice & Campus Circular PDF Generator Service
 * Generates an official A4 Portrait (210mm x 297mm) University Notice PDF using jsPDF.
 * Supports auto-wrapping, dynamic multi-page flow, official university header, metadata box,
 * formatted subject, and official signature footer.
 */

import { jsPDF } from 'jspdf';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

export interface NoticePdfData {
  id: string;
  title: string;
  category: 'ACADEMIC' | 'EXAM' | 'HOLIDAY' | 'FEES' | 'EVENT' | 'ADMINISTRATIVE' | 'GENERAL' | string;
  publishedDate: string;
  content: string;
  publishedBy?: string;
  serialNo?: number | string;
  isPinned?: boolean;
}

/**
 * Clean and sanitize a string for use in safe filenames
 */
export function sanitizeFilename(str: string): string {
  return str
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 50);
}

/**
 * Generate and download an official University Notice PDF directly in the browser
 */
export async function downloadNoticePdf(notice: NoticePdfData): Promise<boolean> {
  try {
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

    // Helper to render running header on any page
    const renderHeader = (pageNumber: number) => {
      if (pageNumber === 1) {
        // Logo
        try {
          if (SWARRNIM_LOGO_PNG_BASE64) {
            doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', marginX, curY - 2, 20, 20);
          }
        } catch {
          // graceful fallback if logo fails
        }

        const headerTextX = marginX + 24;

        // University Name
        doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', headerTextX, curY + 3);

        // Subtitle
        doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
        doc.setFontSize(9.5);
        doc.text('OFFICIAL NOTICE & CAMPUS CIRCULAR', headerTextX, curY + 8);

        // Address & accreditation
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar - 382420, Gujarat, India | www.swarrnim.edu.in', headerTextX, curY + 12.5);

        // Header separator bars (Navy + Orange dual accent)
        curY += 18;
        doc.setFillColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.rect(marginX, curY, contentWidth * 0.75, 1.2, 'F');
        doc.setFillColor(brandOrange[0], brandOrange[1], brandOrange[2]);
        doc.rect(marginX + contentWidth * 0.75, curY, contentWidth * 0.25, 1.2, 'F');
        curY += 5;
      } else {
        // Running header on continuation pages
        doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY — OFFICIAL CIRCULAR (Contd.)', marginX, 12);
        doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
        doc.setLineWidth(0.3);
        doc.line(marginX, 14, pageWidth - marginX, 14);
        curY = 20;
      }
    };

    // Helper to render footer on every page
    const renderFooter = (pageNumber: number, totalPages: number) => {
      const footerY = pageHeight - 12;
      doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
      doc.setLineWidth(0.3);
      doc.line(marginX, footerY - 4, pageWidth - marginX, footerY - 4);

      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(
        'This is an official computer-generated notice verified by Swarrnim University Portal. Valid without physical signature.',
        marginX,
        footerY
      );

      doc.setFont('helvetica', 'bold');
      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        pageWidth - marginX,
        footerY,
        { align: 'right' }
      );
    };

    // 1. Initial Page Header
    renderHeader(1);

    // 2. Metadata Information Box
    const refNumber = `SSIU/NOT/${notice.category?.toUpperCase() || 'GEN'}/${notice.publishedDate.replace(/-/g, '')}/${String(notice.serialNo || notice.id.replace('not-', '')).padStart(3, '0')}`;
    const metaBoxY = curY;
    const metaBoxHeight = 22;

    doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
    doc.setDrawColor(borderSlate[0], borderSlate[1], borderSlate[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(marginX, metaBoxY, contentWidth, metaBoxHeight, 2, 2, 'FD');

    // Left column: Notice Ref & Issued By
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
    doc.text('ISSUED BY:', marginX + 4, metaBoxY + 16);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(notice.publishedBy || 'Office of University Administration', marginX + 22, metaBoxY + 16);

    // Right column: Date & Category
    const rightColX = marginX + contentWidth - 4;
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('PUBLISHED DATE:', rightColX - 52, metaBoxY + 6);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(notice.publishedDate, rightColX, metaBoxY + 6, { align: 'right' });

    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('CATEGORY:', rightColX - 52, metaBoxY + 16);
    doc.setTextColor(brandOrange[0], brandOrange[1], brandOrange[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(notice.category?.toUpperCase() || 'GENERAL', rightColX, metaBoxY + 16, { align: 'right' });

    curY += metaBoxHeight + 8;

    // 3. Subject / Notice Title
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);

    const titlePrefix = 'SUBJECT: ';
    const titleLines = doc.splitTextToSize(titlePrefix + notice.title.toUpperCase(), contentWidth);
    doc.text(titleLines, marginX, curY);
    curY += titleLines.length * 5.5 + 2;

    // Underline divider for subject
    doc.setDrawColor(brandOrange[0], brandOrange[1], brandOrange[2]);
    doc.setLineWidth(0.6);
    doc.line(marginX, curY, marginX + contentWidth, curY);
    curY += 7;

    // 4. Notice Body / Description
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);

    const fullContent = notice.content || 'Please refer to official university communication channels for further details regarding this circular.';
    const contentParagraphs = fullContent.split('\n');

    for (const paragraph of contentParagraphs) {
      if (!paragraph.trim()) {
        curY += 4;
        continue;
      }

      const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);
      for (const line of lines) {
        // Check if page overflow
        if (curY > pageHeight - 45) {
          doc.addPage();
          renderHeader(doc.getNumberOfPages());
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9.5);
        }

        doc.text(line, marginX, curY);
        curY += 5.5;
      }
      curY += 3;
    }

    // 5. Signature & Signatory Block
    curY += 10;
    if (curY > pageHeight - 45) {
      doc.addPage();
      renderHeader(doc.getNumberOfPages());
    }

    const signX = marginX + contentWidth - 65;
    doc.setTextColor(brandNavy[0], brandNavy[1], brandNavy[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Authorized Signatory,', signX, curY);
    curY += 5;

    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(notice.publishedBy || 'Registrar / Administration', signX, curY);
    curY += 4.5;

    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Swarrnim Startup & Innovation University', signX, curY);

    // 6. Apply running page numbers and footer to all pages
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      renderFooter(i, totalPages);
    }

    // 7. Save / Auto-Download PDF
    const cleanTitle = sanitizeFilename(notice.title) || 'Campus-Notice';
    const serialStr = String(notice.serialNo || '001').padStart(3, '0');
    const fileName = `Notice_${serialStr}_${notice.publishedDate}_${cleanTitle}.pdf`;

    doc.save(fileName);
    return true;
  } catch (error) {
    console.error('Failed to generate notice PDF:', error);
    return false;
  }
}
