/**
 * Centralized SSIU ERP Digital Hostel Gate Pass PDF Generator Service
 * Generates an official University Hostel Gate Pass on A4 PORTRAIT (1 Page, 210mm x 297mm).
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentGatePass } from '../types';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';

export async function generateGatePassPDF(pass: StudentGatePass): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  renderSingleGatePassPage(doc, pass);

  const arrayBuffer = doc.output('arraybuffer');
  return new Blob([arrayBuffer], { type: 'application/pdf' });
}

export async function downloadGatePassPDF(pass: StudentGatePass): Promise<void> {
  const blob = await generateGatePassPDF(pass);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `SSIU_GatePass_${pass.requestNo.replace(/[^a-zA-Z0-9]/g, '_')}_${pass.enrollmentNo}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function renderSingleGatePassPage(doc: jsPDF, pass: StudentGatePass): void {
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 190mm

  // Outer Border
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  // Inner subtle border
  doc.setLineWidth(0.15);
  doc.rect(margin + 1.2, margin + 1.2, contentWidth - 2.4, pageHeight - margin * 2 - 2.4);

  let curY = margin + 5;

  // University Logo (Left)
  try {
    if (SWARRNIM_LOGO_PNG_BASE64) {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', margin + 4, curY, 20, 20);
    }
  } catch {
    // Fallback if logo fails
  }

  // University Header (Center)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', pageWidth / 2, curY + 6, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar-Ahmedabad Highway, Gujarat - 382420', pageWidth / 2, curY + 11, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12); // SSIU Orange
  doc.text('DIGITAL HOSTEL GATE PASS / CAMPUS LEAVE PERMIT', pageWidth / 2, curY + 17, { align: 'center' });

  curY += 22;

  // Horizontal divider
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin + 2, curY, pageWidth - margin - 2, curY);

  curY += 4;

  // Top Bar: Request No & Status
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`REQUEST NO: ${pass.requestNo || pass.gatePassNo}`, margin + 5, curY + 2);

  const statusStr = `STATUS: ${(pass.status || 'SUBMITTED').toUpperCase()}`;
  doc.text(statusStr, pageWidth - margin - 5, curY + 2, { align: 'right' });

  curY += 6;

  // Student Information & Hostel Details Table (Left 145mm, Right 45mm for QR & Photo)
  const leftTableWidth = 142;
  const rightColX = margin + leftTableWidth + 3;
  const rightColWidth = contentWidth - leftTableWidth - 3; // 45mm

  const studentDetailsData = [
    [
      { content: 'ENROLLMENT NO (ID):', styles: { fontStyle: 'bold' as const } },
      { content: pass.enrollmentNo, styles: { fontStyle: 'bold' as const, textColor: [15, 44, 89] as [number, number, number] } },
      { content: 'PASS TYPE:', styles: { fontStyle: 'bold' as const } },
      { content: pass.passType || 'Day Out', styles: { fontStyle: 'bold' as const, textColor: [234, 88, 12] as [number, number, number] } }
    ],
    [
      { content: 'STUDENT NAME:', styles: { fontStyle: 'bold' as const } },
      { content: pass.studentName, styles: { fontStyle: 'bold' as const } },
      { content: 'SEMESTER:', styles: { fontStyle: 'bold' as const } },
      { content: `Sem ${pass.semester || 4}` }
    ],
    [
      { content: 'PROGRAM / BRANCH:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.programName || 'B.Tech CSE'} (${pass.departmentName || 'CSE'})`, colSpan: 3 }
    ],
    [
      { content: 'HOSTEL & BLOCK:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.hostelName || 'Hostel'} (${pass.block || 'Block A'})` },
      { content: 'ROOM / BED NO:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.roomNo || 'A-204'} / ${pass.bedNo || 'Bed-1'}` }
    ],
    [
      { content: 'PARENT / GUARDIAN:', styles: { fontStyle: 'bold' as const } },
      { content: pass.parentGuardianName || 'Guardian' },
      { content: 'CONTACT NO:', styles: { fontStyle: 'bold' as const } },
      { content: pass.emergencyContact || pass.parentGuardianMobile || '' }
    ]
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: margin + 2 },
    tableWidth: leftTableWidth,
    body: studentDetailsData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 46 },
      2: { cellWidth: 28, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 33 }
    }
  });

  // Right Box: QR Code / Verification Token Box
  const tableHeight = (doc as any).lastAutoTable.finalY - curY;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.25);
  doc.rect(rightColX, curY, rightColWidth, tableHeight);

  // QR Code Mock Vector / Symbol
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 44, 89);
  doc.text('OFFICIAL VERIFICATION', rightColX + rightColWidth / 2, curY + 4, { align: 'center' });

  // Draw QR Frame
  const qrBoxSize = 22;
  const qrX = rightColX + (rightColWidth - qrBoxSize) / 2;
  const qrY = curY + 6;
  doc.rect(qrX, qrY, qrBoxSize, qrBoxSize);
  
  // Draw simulated QR matrix elements
  doc.setFillColor(15, 44, 89);
  doc.rect(qrX + 2, qrY + 2, 5, 5, 'F');
  doc.rect(qrX + 15, qrY + 2, 5, 5, 'F');
  doc.rect(qrX + 2, qrY + 15, 5, 5, 'F');
  doc.rect(qrX + 9, qrY + 9, 4, 4, 'F');
  doc.setFillColor(234, 88, 12);
  doc.rect(qrX + 9, qrY + 3, 3, 3, 'F');
  doc.rect(qrX + 3, qrY + 9, 3, 3, 'F');
  doc.rect(qrX + 15, qrY + 15, 4, 4, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(pass.qrToken || 'GP_TOKEN_VERIFIED', rightColX + rightColWidth / 2, qrY + qrBoxSize + 3.5, { align: 'center' });
  doc.text('SCAN TO VERIFY', rightColX + rightColWidth / 2, qrY + qrBoxSize + 6.5, { align: 'center' });

  curY = (doc as any).lastAutoTable.finalY + 4;

  // Leave & Movement Schedule Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('LEAVE & MOVEMENT SCHEDULE', margin + 3, curY + 2);
  curY += 4;

  const movementData = [
    [
      { content: 'LEAVING DATE & TIME:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.leavingDate || pass.outingDate} at ${pass.leavingTime || pass.expectedOutTime}`, styles: { fontStyle: 'bold' as const, textColor: [16, 185, 129] as [number, number, number] } },
      { content: 'EXPECTED RETURN:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.expectedReturnDate || pass.leavingDate} at ${pass.expectedReturnTime || '21:00'}`, styles: { fontStyle: 'bold' as const, textColor: [225, 29, 72] as [number, number, number] } }
    ],
    [
      { content: 'DESTINATION:', styles: { fontStyle: 'bold' as const } },
      { content: `${pass.destination} (${pass.destinationAddress || ''})`, colSpan: 3 }
    ],
    [
      { content: 'REASON / PURPOSE:', styles: { fontStyle: 'bold' as const } },
      { content: pass.reason || pass.purpose || '', colSpan: 3 }
    ],
    [
      { content: 'TRAVEL MODE:', styles: { fontStyle: 'bold' as const } },
      { content: pass.travelMode || pass.modeOfTravel || 'Public Transport' },
      { content: 'TRAVELING WITH:', styles: { fontStyle: 'bold' as const } },
      { content: pass.travelingWith || 'Alone' }
    ]
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: margin + 2 },
    tableWidth: contentWidth - 4,
    body: movementData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 51 },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 51 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 4;

  // Approval & Verification Section Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(0, 0, 0);
  doc.text('APPROVAL & GATE RECORD VERIFICATION', margin + 3, curY + 2);
  curY += 4;

  const approvalData = [
    [
      { content: 'APPROVED BY:', styles: { fontStyle: 'bold' as const } },
      { content: pass.approvedByName || 'Hostel Warden Office' },
      { content: 'APPROVAL DATE / TIME:', styles: { fontStyle: 'bold' as const } },
      { content: pass.approvedAt ? new Date(pass.approvedAt).toLocaleString() : 'N/A' }
    ],
    [
      { content: 'WARDEN REMARKS:', styles: { fontStyle: 'bold' as const } },
      { content: pass.wardenRemarks || 'Approved. Ensure timely return before hostel curfew.', colSpan: 3 }
    ],
    [
      { content: 'ACTUAL CHECK-OUT (GATE):', styles: { fontStyle: 'bold' as const } },
      { content: pass.actualCheckOutTime || pass.actualOutDateTime ? new Date(pass.actualCheckOutTime || pass.actualOutDateTime!).toLocaleString() : 'Pending Gate Exit' },
      { content: 'SECURITY OFFICER (OUT):', styles: { fontStyle: 'bold' as const } },
      { content: pass.actualCheckOutStaff || pass.actualOutRecordedByName || 'Main Gate Staff' }
    ],
    [
      { content: 'ACTUAL CHECK-IN (GATE):', styles: { fontStyle: 'bold' as const } },
      { content: pass.actualCheckInTime || pass.actualInDateTime ? new Date(pass.actualCheckInTime || pass.actualInDateTime!).toLocaleString() : 'Pending Gate Return' },
      { content: 'SECURITY OFFICER (IN):', styles: { fontStyle: 'bold' as const } },
      { content: pass.actualCheckInStaff || pass.actualInRecordedByName || 'Main Gate Staff' }
    ]
  ];

  autoTable(doc, {
    startY: curY,
    margin: { left: margin + 2 },
    tableWidth: contentWidth - 4,
    body: approvalData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      lineColor: [0, 0, 0],
      lineWidth: 0.2,
      textColor: [0, 0, 0],
      font: 'helvetica'
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 47 },
      2: { cellWidth: 46, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 47 }
    }
  });

  curY = (doc as any).lastAutoTable.finalY + 4;

  // Important Instructions Box
  doc.setFillColor(250, 250, 250);
  doc.rect(margin + 2, curY, contentWidth - 4, 25, 'F');
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.rect(margin + 2, curY, contentWidth - 4, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('IMPORTANT CANDIDATE & GATE RULES:', margin + 4, curY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(51, 65, 85);
  const instructions = [
    '1. This Gate Pass is digitally authorized and must be produced at the university security gate during Check-Out and Check-In.',
    '2. Return after the authorized Expected Return Time will automatically flag the candidate as OVERDUE and report to the Chief Warden.',
    '3. Students are strictly required to abide by university disciplinary rules and curfew timings while outside the campus.',
    '4. Misuse, forgery, or unauthorized leave outside declared timings will attract disciplinary action as per university hostel ordinances.'
  ];
  instructions.forEach((ins, idx) => {
    doc.text(ins, margin + 4, curY + 8.5 + idx * 4);
  });

  curY += 29;

  // Signatures Section
  const sigY = pageHeight - margin - 15;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  // Student Signature
  doc.line(margin + 10, sigY, margin + 55, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Candidate Signature', margin + 32, sigY + 4, { align: 'center' });

  // Hostel Warden Signature
  doc.line(pageWidth / 2 - 25, sigY, pageWidth / 2 + 25, sigY);
  doc.text('Hostel Warden / Rector', pageWidth / 2, sigY + 4, { align: 'center' });

  // Security Verification Stamp
  doc.line(pageWidth - margin - 55, sigY, pageWidth - margin - 10, sigY);
  doc.text('Gate Security Verification', pageWidth - margin - 32, sigY + 4, { align: 'center' });
}
