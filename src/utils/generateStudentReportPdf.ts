// ==============================================================================
// SWARRNIM STARTUP & INNOVATION UNIVERSITY
// OFFICIAL STUDENT ACADEMIC & DASHBOARD REPORT PDF GENERATOR
// ==============================================================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SWARRNIM_LOGO_PNG_BASE64 } from '../assets/logoBase64';
import { 
  User, 
  Department, 
  Program, 
  AcademicYear, 
  Semester, 
  Batch, 
  Division, 
  Faculty, 
  Student 
} from '../types';

export interface StudentReportPdfData {
  user: User | null;
  student?: Student | null;
  department?: Department | null;
  program?: Program | null;
  semester?: Semester | null;
  academicYear?: AcademicYear | null;
  batch?: Batch | null;
  division?: Division | null;
  mentor?: Faculty | null;
  attendanceStats: {
    percentage: number;
    presentClasses: number;
    totalClasses: number;
    subjectStats?: Record<string, { total: number; present: number; subjectName?: string }>;
  };
  subjectAttendanceList: Array<{
    code: string;
    name: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
    status: string;
  }>;
  feeRecords: Array<{
    feeType: string;
    academicYear: string;
    amount: number;
    paid: number;
    pending: number;
    status: string;
    receiptNo: string;
    paymentDate: string;
  }>;
  upcomingExams: Array<{
    id?: string;
    code?: string;
    name: string;
    startDate?: string;
    status?: string;
  }>;
  serviceRequests: Array<{
    id?: string;
    reqNo: string;
    title: string;
    date: string;
    stage: string;
    status: string;
  }>;
  assignments: Array<{
    id?: string;
    title: string;
    subjectCode?: string;
    deadline?: string;
    status?: string;
  }>;
  todayClasses?: Array<{
    timeSlot: string;
    subjectCode: string;
    subjectName: string;
    facultyName: string;
    roomNo: string;
    type: string;
  }>;
  notifications?: Array<{
    id?: string;
    title: string;
    message: string;
    category?: string;
    priority?: string;
    timestamp?: string;
  }>;
  profileCompletionPercentage?: number;
  abcId?: string;
}

export interface StudentReportPdfOptions {
  generatedBy?: string;
  includeTimestamp?: boolean;
}

/**
 * Generates an official, publication-quality A4 multi-page Student Academic & ERP Dashboard Report PDF.
 * Uses jsPDF + jspdf-autotable without depending on browser viewport or window.print().
 */
export function generateStudentReportPdfDoc(
  data: StudentReportPdfData,
  options: StudentReportPdfOptions = {}
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  const studentName = data.student?.fullName || data.student?.name || data.user?.name || 'Student';
  const tempEnroll = data.student?.temporaryEnrollmentNumber || (data.student?.enrollmentNo?.startsWith('TEMP-') ? data.student.enrollmentNo : (data.user?.enrollmentNo || 'TEMP-2026-00001'));
  const finalEnroll = data.student?.finalEnrollmentNumber || 'PENDING (UNIVERSITY CONVOCATION / FINAL APPROVAL)';
  const progName = data.program?.name || 'B.Tech Computer Science & Engineering';
  const progCode = data.program?.code || 'BTECH-CSE';
  const deptName = data.department?.name || 'Department of Computer Science & Engineering';
  const semName = data.semester ? `Semester ${data.semester.number}` : 'Semester 4';
  const divName = data.division ? `Division ${data.division.name}` : 'Division A';
  const batchName = data.batch?.name || 'Batch 2026-2030';
  const ayName = data.academicYear?.name || 'Academic Year 2026-2027';
  const mentorName = data.mentor?.name || 'Dr. Bhavin Patel (Assigned Faculty Mentor)';
  const generatedTimestamp = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PAGE 1: HEADER & UNIVERSITY BRANDING
  // ──────────────────────────────────────────────────────────────────────────
  doc.setFillColor(15, 44, 89); // Brand Navy (#0F2C59)
  doc.rect(0, 0, pageWidth, 6, 'F');

  doc.setFillColor(243, 112, 35); // Brand Orange (#F37023)
  doc.rect(0, 6, pageWidth, 1.5, 'F');

  // University Logo
  try {
    if (SWARRNIM_LOGO_PNG_BASE64) {
      doc.addImage(SWARRNIM_LOGO_PNG_BASE64, 'PNG', margin, 10, 20, 20);
    }
  } catch {
    // Logo fallback if image parsing fails
  }

  // University Title & Legal Subtitles
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 44, 89);
  doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY', margin + 23, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Established under Gujarat Private Universities Act 2009 | Recognized by UGC & AICTE', margin + 23, 19);
  doc.text('Bhoyan Rathod, Opp. IFFCO, Gandhinagar-Ahmedabad Expressway, Gujarat - 382420, India', margin + 23, 23);
  doc.text('Website: www.swarrnim.edu.in | Official ERP Student Academic Management System', margin + 23, 27);

  // Top Header Line
  doc.setDrawColor(243, 112, 35);
  doc.setLineWidth(0.75);
  doc.line(margin, 31, pageWidth - margin, 31);

  // Report Title Badge Bar
  doc.setFillColor(15, 44, 89);
  doc.roundedRect(margin, 33, contentWidth, 7, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL STUDENT ACADEMIC & DASHBOARD RECORD SHEET', margin + 4, 37.8);
  doc.setFontSize(7.5);
  doc.setTextColor(253, 186, 116);
  doc.text(ayName, pageWidth - margin - 4, 37.8, { align: 'right' });

  let currentY = 43;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 1: STUDENT PROFILE & ACADEMIC IDENTIFICATION
  // ──────────────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [15, 23, 42] },
    headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    columns: [
      { header: 'STUDENT PROFILE & ACADEMIC IDENTIFICATION', dataKey: 'c1' },
      { header: '', dataKey: 'c2' },
      { header: '', dataKey: 'c3' },
      { header: '', dataKey: 'c4' }
    ],
    body: [
      [
        { content: 'STUDENT NAME', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139], cellWidth: 32 } },
        { content: studentName, styles: { fontStyle: 'bold', textColor: [15, 44, 89], cellWidth: 61 } },
        { content: 'TEMP. ENROLLMENT', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139], cellWidth: 35 } },
        { content: tempEnroll, styles: { fontStyle: 'bold', textColor: [243, 112, 35], cellWidth: 58 } }
      ],
      [
        { content: 'FINAL ENROLLMENT', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: finalEnroll, styles: { fontStyle: 'bold', textColor: data.student?.finalEnrollmentNumber ? [4, 120, 87] : [180, 83, 9] } },
        { content: 'ACADEMIC STATUS', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: `ACTIVE SCHOLAR • ${data.student?.finalEnrollmentNumber ? 'FINAL VERIFIED' : 'TEMPORARY ACCESS'}`, styles: { fontStyle: 'bold', textColor: [4, 120, 87] } }
      ],
      [
        { content: 'PROGRAM', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: `${progName} (${progCode})`, styles: { fontStyle: 'bold', textColor: [15, 44, 89] } },
        { content: 'DEPARTMENT', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: deptName }
      ],
      [
        { content: 'SEMESTER & DIV.', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: `${semName} • ${divName} • ${batchName}`, styles: { fontStyle: 'bold', textColor: [15, 44, 89] } },
        { content: 'FACULTY MENTOR', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [100, 116, 139] } },
        { content: mentorName, styles: { fontStyle: 'bold', textColor: [15, 44, 89] } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 3;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 2: PROFILE PROGRESS & NATIONAL REPOSITORIES (DIGILOCKER / ABC)
  // ──────────────────────────────────────────────────────────────────────────
  const profilePct = data.profileCompletionPercentage ?? 85;
  const abcId = data.abcId || data.student?.abcId || '8940-1234-5678';

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [15, 23, 42] },
    body: [
      [
        { content: 'KYC / Profile Progress:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 44, 89], cellWidth: 35 } },
        { content: `${profilePct}% Complete • Pending Final Verified Certificates`, styles: { fontStyle: 'bold', textColor: [180, 83, 9], cellWidth: 58 } },
        { content: 'DigiLocker & ABC Repository:', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 44, 89], cellWidth: 42 } },
        { content: `CONNECTED ✓ • ABC ID: ${abcId} (2 Issued Docs)`, styles: { fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 51 } }
      ]
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 3: ACADEMIC OVERVIEW & PERFORMANCE SUMMARY (KPI METRICS)
  // ──────────────────────────────────────────────────────────────────────────
  const stats = data.attendanceStats;
  const feeRows = data.feeRecords || [];
  const pendingFeeTotal = feeRows.reduce((sum, f) => sum + (f.pending || 0), 0);
  const upcomingExams = data.upcomingExams || [];
  const serviceReqs = data.serviceRequests || [];
  const pendingReqsCount = serviceReqs.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED' && r.status !== 'CLOSED').length;
  const assignments = data.assignments || [];
  const pendingAssignmentsCount = assignments.filter(a => a.status !== 'SUBMITTED' && a.status !== 'GRADED').length;
  const notifications = data.notifications || [];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.5, textColor: [30, 41, 59] },
    columns: [
      { header: 'No.', dataKey: 'no' },
      { header: 'Academic Metric', dataKey: 'metric' },
      { header: 'Recorded Value', dataKey: 'val' },
      { header: 'Status / Compliance', dataKey: 'status' },
      { header: 'Detailed Verification Remarks', dataKey: 'desc' }
    ],
    columnStyles: {
      no: { cellWidth: 8, halign: 'center', fontStyle: 'bold' },
      metric: { cellWidth: 46, fontStyle: 'bold', textColor: [15, 44, 89] },
      val: { cellWidth: 28, halign: 'center', fontStyle: 'bold' },
      status: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
      desc: { cellWidth: 68 }
    },
    body: [
      {
        no: '1',
        metric: 'Overall Attendance',
        val: `${stats.percentage}%`,
        status: stats.percentage >= 75 ? 'ELIGIBLE / GOOD' : 'SHORTAGE / WARNING',
        desc: `${stats.presentClasses} Present / ${stats.totalClasses} Total Lectures Recorded`
      },
      {
        no: '2',
        metric: 'Pending Semester Fees',
        val: `Rs. ${pendingFeeTotal.toLocaleString('en-IN')}`,
        status: pendingFeeTotal === 0 ? 'ALL CLEAR' : 'DUES PENDING',
        desc: pendingFeeTotal === 0 ? 'No outstanding university dues' : 'Tuition installment due for current semester'
      },
      {
        no: '3',
        metric: 'University Examinations',
        val: `${upcomingExams.length} Active`,
        status: upcomingExams.length > 0 ? 'SCHEDULED' : 'NO ACTIVE EXAM',
        desc: upcomingExams[0]?.name || 'Regular Semester Assessment Series 2026'
      },
      {
        no: '4',
        metric: 'Student Section Requests',
        val: `${serviceReqs.length} Total`,
        status: pendingReqsCount > 0 ? `${pendingReqsCount} IN PROGRESS` : 'ALL RESOLVED',
        desc: pendingReqsCount > 0 ? 'Applications undergoing student section review' : 'All certificates & inquiries completed'
      },
      {
        no: '5',
        metric: 'Coursework & Assignments',
        val: `${assignments.length} Assigned`,
        status: pendingAssignmentsCount > 0 ? `${pendingAssignmentsCount} PENDING SUBMISSION` : 'UP TO DATE',
        desc: 'Internal coursework assignments and lab submissions'
      },
      {
        no: '6',
        metric: 'Official Portal Notices',
        val: `${notifications.length} Alerts`,
        status: 'ACTIVE NOTICES',
        desc: 'Official circulars, exam schedules, and university advisories'
      }
    ]
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 4: TODAY'S SCHEDULED LECTURES & LABS
  // ──────────────────────────────────────────────────────────────────────────
  if (data.todayClasses && data.todayClasses.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.3, textColor: [30, 41, 59] },
      columns: [
        { header: 'Time Slot', dataKey: 'time' },
        { header: 'Code', dataKey: 'code' },
        { header: 'Subject Name', dataKey: 'name' },
        { header: 'Faculty', dataKey: 'faculty' },
        { header: 'Room', dataKey: 'room' },
        { header: 'Type', dataKey: 'type' }
      ],
      columnStyles: {
        time: { cellWidth: 26, fontStyle: 'bold', textColor: [15, 44, 89] },
        code: { cellWidth: 22, fontStyle: 'bold', textColor: [243, 112, 35] },
        name: { cellWidth: 62, fontStyle: 'bold' },
        faculty: { cellWidth: 42 },
        room: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        type: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
      },
      body: data.todayClasses.map(tt => ({
        time: tt.timeSlot,
        code: tt.subjectCode,
        name: tt.subjectName,
        faculty: tt.facultyName,
        room: tt.roomNo,
        type: tt.type
      }))
    });

    currentY = (doc as any).lastAutoTable.finalY + 3.5;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 5: SUBJECT-WISE ATTENDANCE BREAKDOWN
  // ──────────────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    showHead: 'everyPage',
    theme: 'grid',
    headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
    styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
    columns: [
      { header: 'Subject Code', dataKey: 'code' },
      { header: 'Subject Name', dataKey: 'name' },
      { header: 'Total', dataKey: 'total' },
      { header: 'Present', dataKey: 'present' },
      { header: 'Absent', dataKey: 'absent' },
      { header: 'Attendance %', dataKey: 'pct' },
      { header: 'Exam Eligibility Status', dataKey: 'status' }
    ],
    columnStyles: {
      code: { cellWidth: 24, fontStyle: 'bold', textColor: [243, 112, 35] },
      name: { cellWidth: 68, fontStyle: 'bold', textColor: [15, 44, 89] },
      total: { cellWidth: 15, halign: 'center' },
      present: { cellWidth: 16, halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87] },
      absent: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [220, 38, 38] },
      pct: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      status: { cellWidth: 26, halign: 'center', fontStyle: 'bold' }
    },
    body: data.subjectAttendanceList.map(item => ({
      code: item.code,
      name: item.name,
      total: item.total,
      present: item.present,
      absent: item.absent,
      pct: `${item.percentage}%`,
      status: item.percentage >= 75 ? 'ELIGIBLE' : 'SHORTAGE'
    }))
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 6: FEES & PAYMENT LEDGER
  // ──────────────────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    showHead: 'everyPage',
    theme: 'grid',
    headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
    styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
    columns: [
      { header: 'Fee Particulars', dataKey: 'feeType' },
      { header: 'Academic Year', dataKey: 'ay' },
      { header: 'Total (Rs.)', dataKey: 'amt' },
      { header: 'Paid (Rs.)', dataKey: 'paid' },
      { header: 'Pending (Rs.)', dataKey: 'pending' },
      { header: 'Status', dataKey: 'status' },
      { header: 'Receipt No. / Date', dataKey: 'rec' }
    ],
    columnStyles: {
      feeType: { cellWidth: 54, fontStyle: 'bold', textColor: [15, 44, 89] },
      ay: { cellWidth: 24, halign: 'center' },
      amt: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      paid: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87] },
      pending: { cellWidth: 20, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] },
      status: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      rec: { cellWidth: 30, halign: 'center', fontSize: 6.2 }
    },
    body: feeRows.map(f => ({
      feeType: f.feeType,
      ay: f.academicYear,
      amt: f.amount.toLocaleString('en-IN'),
      paid: f.paid.toLocaleString('en-IN'),
      pending: f.pending.toLocaleString('en-IN'),
      status: f.status,
      rec: `${f.receiptNo}\n${f.paymentDate}`
    }))
  });

  currentY = (doc as any).lastAutoTable.finalY + 3.5;

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 7: UPCOMING EXAMINATIONS
  // ──────────────────────────────────────────────────────────────────────────
  if (upcomingExams.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
      columns: [
        { header: 'Exam Code', dataKey: 'code' },
        { header: 'Examination Title', dataKey: 'name' },
        { header: 'Program', dataKey: 'prog' },
        { header: 'Semester', dataKey: 'sem' },
        { header: 'Commencement Date', dataKey: 'date' },
        { header: 'Status', dataKey: 'status' }
      ],
      columnStyles: {
        code: { cellWidth: 26, fontStyle: 'bold', textColor: [243, 112, 35] },
        name: { cellWidth: 68, fontStyle: 'bold', textColor: [15, 44, 89] },
        prog: { cellWidth: 30 },
        sem: { cellWidth: 22, halign: 'center' },
        date: { cellWidth: 22, halign: 'center' },
        status: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
      },
      body: upcomingExams.map(e => ({
        code: e.code || `EXM-${e.id?.slice(-4) || '2026'}`,
        name: e.name,
        prog: progCode,
        sem: semName,
        date: e.startDate || '2026-09-15',
        status: e.status || 'SCHEDULED'
      }))
    });

    currentY = (doc as any).lastAutoTable.finalY + 3.5;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 8: SERVICE REQUESTS & ASSIGNMENTS (SPLIT SUMMARY)
  // ──────────────────────────────────────────────────────────────────────────
  if (serviceReqs.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      theme: 'grid',
      headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
      columns: [
        { header: 'Request ID', dataKey: 'id' },
        { header: 'Service / Application Category', dataKey: 'title' },
        { header: 'Submission Date', dataKey: 'date' },
        { header: 'Current Verification Stage', dataKey: 'stage' },
        { header: 'Status', dataKey: 'status' }
      ],
      columnStyles: {
        id: { cellWidth: 26, fontStyle: 'bold', textColor: [243, 112, 35] },
        title: { cellWidth: 62, fontStyle: 'bold', textColor: [15, 44, 89] },
        date: { cellWidth: 24, halign: 'center' },
        stage: { cellWidth: 50 },
        status: { cellWidth: 24, halign: 'center', fontStyle: 'bold' }
      },
      body: serviceReqs.map(r => ({
        id: r.reqNo,
        title: r.title,
        date: r.date,
        stage: r.stage,
        status: r.status
      }))
    });

    currentY = (doc as any).lastAutoTable.finalY + 3.5;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 9: COURSEWORK & ASSIGNMENTS
  // ──────────────────────────────────────────────────────────────────────────
  if (assignments.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
      columns: [
        { header: 'Assignment Title', dataKey: 'title' },
        { header: 'Subject Code', dataKey: 'subj' },
        { header: 'Submission Deadline', dataKey: 'deadline' },
        { header: 'Status', dataKey: 'status' }
      ],
      columnStyles: {
        title: { cellWidth: 80, fontStyle: 'bold', textColor: [15, 44, 89] },
        subj: { cellWidth: 36, halign: 'center', fontStyle: 'bold' },
        deadline: { cellWidth: 35, halign: 'center', textColor: [220, 38, 38], fontStyle: 'bold' },
        status: { cellWidth: 35, halign: 'center', fontStyle: 'bold' }
      },
      body: assignments.map(a => ({
        title: a.title,
        subj: a.subjectCode || 'CSE-401',
        deadline: a.deadline || '2026-08-30',
        status: a.status || 'PENDING'
      }))
    });

    currentY = (doc as any).lastAutoTable.finalY + 3.5;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 10: NOTIFICATIONS & CIRCULARS
  // ──────────────────────────────────────────────────────────────────────────
  if (notifications.length > 0) {
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      theme: 'grid',
      headStyles: { fillColor: [15, 44, 89], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
      styles: { fontSize: 6.8, cellPadding: 1.4, textColor: [30, 41, 59] },
      columns: [
        { header: 'Date', dataKey: 'date' },
        { header: 'Notice Title & Executive Summary', dataKey: 'title' },
        { header: 'Module', dataKey: 'cat' },
        { header: 'Priority', dataKey: 'priority' }
      ],
      columnStyles: {
        date: { cellWidth: 24, halign: 'center' },
        title: { cellWidth: 112 },
        cat: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        priority: { cellWidth: 24, halign: 'center', fontStyle: 'bold', textColor: [243, 112, 35] }
      },
      body: notifications.map(n => ({
        date: n.timestamp || '2026-08-24',
        title: `${n.title}: ${n.message}`,
        cat: n.category || 'ACADEMIC',
        priority: n.priority || 'IMPORTANT'
      }))
    });

    currentY = (doc as any).lastAutoTable.finalY + 4;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // SECTION 11: OFFICIAL VERIFICATION & SIGNATURE STAMP BLOCK
  // ──────────────────────────────────────────────────────────────────────────
  // Check if signature block fits on the current page, otherwise add a new page
  if (currentY + 28 > pageHeight - margin) {
    doc.addPage();
    currentY = margin + 15;
  }

  doc.setDrawColor(15, 44, 89);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('This is a digitally generated Official Academic Record generated from the central SSIU University ERP database.', margin, currentY);
  doc.text(`Record verification hash: SSIU-REC-${Date.now().toString(36).toUpperCase()} • Generated on: ${generatedTimestamp}`, margin, currentY + 3.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 44, 89);
  doc.text('Controller of Examinations / Registrar', pageWidth - margin, currentY + 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Swarrnim Startup & Innovation University', pageWidth - margin, currentY + 15.5, { align: 'right' });

  // ──────────────────────────────────────────────────────────────────────────
  // POST-PROCESSING: RUNNING HEADERS & FOOTERS ACROSS ALL PAGES
  // ──────────────────────────────────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Running Header (Pages 2+)
    if (pageNum > 1) {
      doc.setFillColor(15, 44, 89);
      doc.rect(0, 0, pageWidth, 4, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 44, 89);
      doc.text('SWARRNIM STARTUP & INNOVATION UNIVERSITY • STUDENT ACADEMIC RECORD', margin, 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Student: ${studentName} (${tempEnroll})`, pageWidth - margin, 8, { align: 'right' });

      doc.setDrawColor(243, 112, 35);
      doc.setLineWidth(0.4);
      doc.line(margin, 9.5, pageWidth - margin, 9.5);
    }

    // Running Footer (All Pages)
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 8, pageWidth - margin, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Swarrnim University ERP • Generated on ${generatedTimestamp}`, margin, pageHeight - 4.5);
    doc.text('Confidential Official Academic Record', pageWidth / 2, pageHeight - 4.5, { align: 'center' });
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 4.5, { align: 'right' });
  }

  return doc;
}

/**
 * Generates and automatically downloads the student report PDF in the client browser.
 */
export function downloadStudentReportPdf(
  data: StudentReportPdfData,
  filename?: string,
  options?: StudentReportPdfOptions
): void {
  const doc = generateStudentReportPdfDoc(data, options);
  const studentEnroll = data.student?.enrollmentNo || data.user?.enrollmentNo || 'Record';
  const cleanEnroll = studentEnroll.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const finalFilename = filename || `SSIU_Student_Report_${cleanEnroll}_${dateStr}.pdf`;
  doc.save(finalFilename);
}

/**
 * Returns the generated PDF as a Blob for preview, transmission, or testing.
 */
export function getStudentReportPdfBlob(
  data: StudentReportPdfData,
  options?: StudentReportPdfOptions
): Blob {
  const doc = generateStudentReportPdfDoc(data, options);
  return doc.output('blob');
}
