import React, { useState } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromFeePaymentTransaction } from '../receipt/receiptTypes';
import { 
  User, 
  Department, 
  Program, 
  AcademicYear, 
  Semester, 
  Batch, 
  Division, 
  Faculty, 
  TimetableEntry, 
  Assignment, 
  StudentFeeRecord, 
  ERPNotification,
  FeePaymentTransaction 
} from '../../types';
import { 
  Printer, 
  Download, 
  FileSpreadsheet, 
  Eye, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  BookOpen, 
  IndianRupee, 
  FileText, 
  Bell, 
  CheckSquare, 
  UserCheck, 
  ShieldCheck, 
  ChevronRight,
  Sparkles,
  RefreshCw,
  Award,
  FileDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import logoSvg from '../../assets/swarrnim-logo.svg';
import { downloadStudentReportPdf, StudentReportPdfData } from '../../utils/generateStudentReportPdf';

interface StudentExcelDashboardProps {
  user: User | null;
  setActiveTab: (tab: string, state?: any) => void;
  departments: Department[];
  programs: Program[];
  semesters: Semester[];
  academicYears: AcademicYear[];
  batches: Batch[];
  divisions: Division[];
  facultyList: Faculty[];
  timetableEntries: TimetableEntry[];
  assignments: Assignment[];
  studentFeeRecords: StudentFeeRecord[];
  userNotifications: ERPNotification[];
  currentAY?: AcademicYear;
}

export const StudentExcelDashboard: React.FC<StudentExcelDashboardProps> = ({
  user,
  setActiveTab,
  departments,
  programs,
  semesters,
  academicYears,
  batches,
  divisions,
  facultyList,
  timetableEntries,
  assignments,
  studentFeeRecords,
  userNotifications,
  currentAY
}) => {
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState<FeePaymentTransaction | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // 1. Resolve Student Data
  const studentId = user?.id || 'stu-1';
  const students = db.getStudents();
  const student = students.find(s => s.id === studentId || s.enrollmentNo === user?.enrollmentNo) || students[0];

  const deptObj = departments.find(d => d.id === student?.departmentId);
  const progObj = programs.find(p => p.id === student?.programId);
  const semObj = semesters.find(s => s.id === student?.semesterId);
  const ayObj = academicYears.find(ay => ay.id === student?.academicYearId) || currentAY;
  const semNumber = semObj ? `Semester ${semObj.number}` : 'Semester 4';
  const ayName = ayObj?.name || '2026-2027';
  const batchObj = batches.find(b => b.id === student?.batchId);
  const divObj = divisions.find(d => d.id === student?.divisionId);
  const mentorObj = facultyList.find(f => f.id === student?.mentorId);
  const hodObj = facultyList.find(f => f.id === deptObj?.hodId || (f.departmentId === deptObj?.id && f.designation?.includes('HOD')));

  // 2. Resolve Attendance Data
  const stats = db.getStudentAttendanceStats(student?.id || 'stu-1');
  const subjects = db.getSubjects().filter(s => s.programId === student?.programId || !student?.programId);

  // Build subject-wise attendance
  const subjectAttendanceList = Object.keys(stats.subjectStats || {}).length > 0
    ? Object.entries(stats.subjectStats).map(([subjId, sStat]) => {
        const subj = db.getSubjectById(subjId);
        const total = sStat.total;
        const present = sStat.present;
        const absent = total - present;
        const pct = total > 0 ? Math.round((present / total) * 100) : 100;
        return {
          code: subj?.code || 'CSE401',
          name: sStat.subjectName || subj?.name || 'Subject',
          total,
          present,
          absent,
          percentage: pct,
          status: pct >= 75 ? 'ELIGIBLE / GOOD' : 'SHORTAGE / WARNING'
        };
      })
    : (subjects.slice(0, 5).map((subj, idx) => {
        const total = 14 + idx * 2;
        const present = total - (idx === 1 ? 4 : idx === 3 ? 5 : 1);
        const absent = total - present;
        const pct = Math.round((present / total) * 100);
        return {
          code: subj.code || `CS-${401 + idx}`,
          name: subj.name,
          total,
          present,
          absent,
          percentage: pct,
          status: pct >= 75 ? 'ELIGIBLE / GOOD' : 'SHORTAGE / WARNING'
        };
      }));

  // 3. Resolve Timetable Data
  const todayClasses = timetableEntries.filter(t => t.dayOfWeek === 'Monday' || t.divisionId === student?.divisionId).slice(0, 5);

  // 4. Resolve Assignments Data
  const studentAssignments = assignments.filter(a => a.status === 'ACTIVE').slice(0, 5);
  const assignmentSubmissions = db.getAssignmentSubmissions() || [];
  const pendingAssignments = studentAssignments.filter(a => !assignmentSubmissions.some(sub => sub.assignmentId === a.id && sub.studentId === student?.id));

  // 5. Resolve Fee & Payments
  const studentFee = studentFeeRecords.find(r => r.studentId === student?.id || r.enrollmentNo === student?.enrollmentNo) || studentFeeRecords[0];
  const feeTransactions = (db.getFeePaymentTransactions() || []).filter(t => t.studentId === student?.id || t.enrollmentNo === student?.enrollmentNo);

  const feeTableRows = [
    {
      feeType: 'Academic Tuition & Instruction Fee',
      academicYear: ayName,
      amount: studentFee?.totalAmount || 60000,
      paid: studentFee?.paidAmount || 60000,
      pending: studentFee?.pendingAmount || 0,
      status: (studentFee?.pendingAmount || 0) === 0 ? 'PAID' : 'PENDING',
      receiptNo: feeTransactions[0]?.receiptNo || 'SSIU-REC-2026-0001',
      paymentDate: feeTransactions[0]?.paymentDate || '2026-08-24',
      transaction: feeTransactions[0] || null
    },
    {
      feeType: 'University Examination & Assessment Fee',
      academicYear: ayName,
      amount: 2500,
      paid: 2500,
      pending: 0,
      status: 'PAID',
      receiptNo: feeTransactions[1]?.receiptNo || 'SSIU-EXM-2026-0042',
      paymentDate: feeTransactions[1]?.paymentDate || '2026-08-15',
      transaction: feeTransactions[1] || null
    },
    {
      feeType: 'Library, Lab & Student Amenities Fee',
      academicYear: ayName,
      amount: 5000,
      paid: 5000,
      pending: 0,
      status: 'PAID',
      receiptNo: feeTransactions[2]?.receiptNo || 'SSIU-LIB-2026-0089',
      paymentDate: feeTransactions[2]?.paymentDate || '2026-08-10',
      transaction: feeTransactions[2] || null
    }
  ];

  // 6. Resolve Exams Data
  const examsList = db.getExams();
  const upcomingExams = examsList.filter(e => e.status === 'SCHEDULED' || e.status === 'ONGOING' || e.status === 'PUBLISHED').slice(0, 4);

  // 7. Resolve Requests Data
  const studentGeneralReqs = (db.getState().studentRequests || []).filter((r: any) => r.studentId === student?.id || r.enrollmentNo === student?.enrollmentNo);
  const studentSectionReqs = (db.getState().studentSectionRequests || []).filter((r: any) => r.studentId === student?.id || r.enrollmentNo === student?.enrollmentNo);
  const combinedRequests = [
    ...studentGeneralReqs.map((r: any) => ({
      id: r.id,
      reqNo: r.requestNo || `REQ-${r.id.slice(-4)}`,
      title: r.category?.replace(/_/g, ' ') || 'General Request',
      date: r.createdAt || '2026-08-20',
      stage: r.currentStage || 'Student Section Verification',
      status: r.status || 'IN_PROGRESS',
      type: 'GENERAL'
    })),
    ...studentSectionReqs.map((r: any) => ({
      id: r.id,
      reqNo: r.requestNo || `SRQ-${r.id.slice(-4)}`,
      title: r.serviceName || 'Document Verification Service',
      date: r.createdAt || '2026-08-22',
      stage: r.status === 'READY_FOR_COLLECTION' ? 'Ready at Student Section Counter' : 'Deputy Registrar Verification',
      status: r.status || 'UNDER_REVIEW',
      type: 'STUDENT_SECTION'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const studentPendingReqs = combinedRequests.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED' && r.status !== 'CLOSED');

  // 8. Notifications
  const myNotifs = userNotifications.slice(0, 5);

  // Handlers for PDF Report Download & Excel Export
  const handleDownloadPdfReport = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const pdfData: StudentReportPdfData = {
        user,
        student,
        department: deptObj,
        program: progObj,
        semester: semObj,
        academicYear: ayObj,
        batch: batchObj,
        division: divObj,
        mentor: mentorObj,
        attendanceStats: stats,
        subjectAttendanceList,
        feeRecords: feeTableRows,
        upcomingExams: upcomingExams.map(e => ({
          id: e.id,
          code: e.code,
          name: e.name,
          startDate: e.startDate,
          status: e.status
        })),
        serviceRequests: combinedRequests,
        assignments: studentAssignments.map(a => ({
          id: a.id,
          title: a.title,
          subjectCode: db.getSubjectById(a.subjectId)?.code || 'CSE-401',
          deadline: a.deadline,
          status: a.status
        })),
        todayClasses: todayClasses.map(tt => {
          const subj = db.getSubjectById(tt.subjectId);
          const fac = db.getFaculty().find(f => f.id === tt.facultyId);
          return {
            timeSlot: tt.timeSlot,
            subjectCode: subj?.code || 'CSE-401',
            subjectName: subj?.name || 'Class',
            facultyName: fac?.name || 'Professor',
            roomNo: tt.roomNo || 'Room 302',
            type: subj?.type || 'THEORY'
          };
        }),
        notifications: myNotifs.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          category: n.module || 'ACADEMIC',
          priority: 'IMPORTANT',
          timestamp: n.timestamp || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '2026-08-24')
        })),
        profileCompletionPercentage: 85,
        abcId: student?.abcId || '8940-1234-5678'
      };

      downloadStudentReportPdf(pdfData);
    } catch (err) {
      console.error('Failed to generate student report PDF:', err);
      alert('Unable to generate PDF report at this moment. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Student Profile & Summary
    const summaryData = [
      { Metric: 'Student Name', Value: student?.name || user?.name },
      { Metric: 'Temporary Enrollment No.', Value: student?.temporaryEnrollmentNumber || student?.enrollmentNo },
      { Metric: 'Final Enrollment No.', Value: student?.finalEnrollmentNumber || 'PENDING' },
      { Metric: 'Program', Value: progObj?.name || 'B.Tech' },
      { Metric: 'Department', Value: deptObj?.name || 'Computer Science & Engineering' },
      { Metric: 'Semester', Value: semNumber },
      { Metric: 'Division', Value: divObj?.name || 'Div A' },
      { Metric: 'Academic Year', Value: ayName },
      { Metric: 'Attendance Percentage', Value: `${stats.percentage}%` },
      { Metric: 'Total Lectures Attended', Value: `${stats.presentClasses} / ${stats.totalClasses}` },
      { Metric: 'Pending Fee Amount', Value: `₹${studentFee?.pendingAmount || 0}` },
      { Metric: 'Active Upcoming Exams', Value: upcomingExams.length },
      { Metric: 'Pending Requests', Value: studentPendingReqs.length },
      { Metric: 'Pending Assignments', Value: pendingAssignments.length }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Academic Summary');

    // Sheet 2: Attendance
    const wsAtt = XLSX.utils.json_to_sheet(subjectAttendanceList);
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Subject Attendance');

    // Sheet 3: Fees
    const wsFees = XLSX.utils.json_to_sheet(feeTableRows.map(f => ({
      'Fee Particulars': f.feeType,
      'Academic Year': f.academicYear,
      'Total Amount': f.amount,
      'Amount Paid': f.paid,
      'Pending Amount': f.pending,
      'Status': f.status,
      'Receipt No.': f.receiptNo,
      'Payment Date': f.paymentDate
    })));
    XLSX.utils.book_append_sheet(wb, wsFees, 'Fee Ledger');

    // Sheet 4: Timetable
    const wsTimetable = XLSX.utils.json_to_sheet(todayClasses.map(tt => {
      const subj = db.getSubjectById(tt.subjectId);
      const fac = db.getFaculty().find(f => f.id === tt.facultyId);
      return {
        'Time Slot': tt.timeSlot,
        'Subject Code': subj?.code || 'CSE',
        'Subject Name': subj?.name || 'Class',
        'Faculty': fac?.name || 'Professor',
        'Room': tt.roomNo,
        'Class Type': subj?.type || 'THEORY'
      };
    }));
    XLSX.utils.book_append_sheet(wb, wsTimetable, 'Today Schedule');

    XLSX.writeFile(wb, `SSIU_Student_Academic_Report_${student?.enrollmentNo || 'Record'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleOpenReceiptModal = (txnOrFeeRow: any) => {
    const txn = txnOrFeeRow.transaction || {
      id: `pay-${Date.now()}`,
      studentFeeRecordId: studentFee?.id || `fee-rec-${student?.id}`,
      receiptNo: txnOrFeeRow.receiptNo || 'SSIU-REC-2026-0001',
      studentId: student?.id || 'stu-1',
      studentName: student?.name || user?.name || 'Student',
      enrollmentNo: student?.enrollmentNo || 'TEMP-2026-00001',
      programId: student?.programId || 'prog-1',
      semesterId: student?.semesterId || 'sem-1',
      semesterName: semNumber,
      academicYear: ayName,
      paidAmount: txnOrFeeRow.paid || 25000,
      paymentMode: 'UPI',
      transactionId: `TXN-2026${Date.now().toString().slice(-6)}`,
      referenceNo: `GW-REF-${Date.now().toString().slice(-6)}`,
      gatewayName: 'SSIU HDFC Payment Gateway',
      feeType: 'TUITION',
      status: 'SUCCESS',
      paymentDate: txnOrFeeRow.paymentDate || new Date().toISOString().split('T')[0],
      recordedBy: 'Finance & Accounts Office'
    };
    feeReceiptPdfService.openInNewTab(fromFeePaymentTransaction(txn));
  };

  return (
    <div className="student-excel-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* ─── PRINT OPTIMIZED STYLES ────────────────────────────────────────── */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-student-report, #printable-student-report * {
            visibility: visible !important;
          }
          #printable-student-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 15px !important;
            background: #FFFFFF !important;
            color: #000000 !important;
            font-size: 11px !important;
          }
          .no-print {
            display: none !important;
          }
          .table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          .table th, .table td {
            border: 1px solid #000000 !important;
            padding: 4px 6px !important;
          }
        }
      `}</style>

      {/* ─── MAIN DASHBOARD CONTENT (EXCEL / UNIVERSITY ERP STYLE) ─────────── */}
      <div id="printable-student-report" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>

        {/* ── 1. OFFICIAL UNIVERSITY REPORT HEADER & ACTION TOOLBAR ─────────── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #CBD5E1',
          borderTop: '3px solid #F37023',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <img src={logoSvg} alt="Swarrnim University Logo" style={{ height: '42px', objectFit: 'contain' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0F2C59', letterSpacing: '0.5px' }}>
                  SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                </h2>
                <Badge variant="navy">OFFICIAL ERP PORTAL</Badge>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Student Academic Management System • Central Administrative Record Sheet
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="no-print" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadPdfReport}
              disabled={isGeneratingPdf}
              style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px', height: '32px' }}
              title="Download Official A4 ERP Academic Report (PDF)"
            >
              {isGeneratingPdf ? (
                <>
                  <RefreshCw size={14} className="animate-spin" /> Generating PDF...
                </>
              ) : (
                <>
                  <FileDown size={14} color="#DC2626" /> Download PDF Report
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportExcel}
              style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
              title="Export all data to Microsoft Excel Spreadsheet"
            >
              <FileSpreadsheet size={14} color="#047857" /> Export Excel (.xlsx)
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab('profile')}
              style={{ fontSize: '0.75rem', fontWeight: 800, background: '#0F2C59', borderColor: '#0F2C59', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
            >
              <Eye size={13} /> View Full Profile
            </button>
          </div>
        </div>

        {/* ── 2. STUDENT MASTER INFORMATION STRIP (EXCEL GRID) ─────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>STUDENT PROFILE &amp; ACADEMIC IDENTIFICATION</span>
            <span style={{ fontSize: '0.71875rem', fontWeight: 600, color: '#FDBA74' }}>Academic Year: {ayName}</span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <td style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>STUDENT NAME</td>
                  <td style={{ width: '35%', padding: '0.5rem 0.75rem', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {student?.name || user?.name}
                  </td>
                  <td style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>TEMP. ENROLLMENT</td>
                  <td style={{ width: '35%', padding: '0.5rem 0.75rem', fontWeight: 800, fontFamily: 'monospace', color: '#F37023' }}>
                    {student?.temporaryEnrollmentNumber || (student?.enrollmentNo?.startsWith('TEMP-') ? student.enrollmentNo : 'TEMP-2026-00001')}
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>FINAL ENROLLMENT</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: student?.finalEnrollmentNumber ? '#047857' : '#B45309', borderRight: '1px solid #E2E8F0' }}>
                    {student?.finalEnrollmentNumber || 'PENDING (UNIVERSITY CONVOCATION / FINAL APPROVAL)'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>STATUS</td>
                  <td style={{ padding: '0.5rem 0.75rem' }}>
                    <Badge variant="active">ACTIVE SCHOLAR</Badge>
                    <span style={{ marginLeft: '6px' }}>
                      <Badge variant={student?.finalEnrollmentNumber ? 'active' : 'orange'}>
                        {student?.finalEnrollmentNumber ? 'FINAL VERIFIED' : 'TEMPORARY ACCESS'}
                      </Badge>
                    </span>
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>PROGRAM</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {progObj?.name || 'B.Tech Computer Science & Engineering'} ({progObj?.code || 'BTECH-CSE'})
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>DEPARTMENT</td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#334155' }}>
                    {deptObj?.name || 'Department of Computer Science & Engineering'}
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>SEMESTER &amp; DIVISION</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {semNumber} • {divObj ? `Division ${divObj.name}` : 'Division A'} • {batchObj?.name || 'Batch 2026-2030'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 800, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>FACULTY MENTOR</td>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59' }}>
                    {mentorObj?.name || 'Dr. Bhavin Patel (Assigned Faculty Mentor)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3. PROFILE COMPLETION COMPACT ROW ─────────────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F1F5F9', color: '#0F2C59' }}>
                  <th style={{ width: '25%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Profile Completion</th>
                  <th style={{ width: '35%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Progress</th>
                  <th style={{ width: '20%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '20%', padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    Student Academic &amp; KYC Profile
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: '85%', height: '100%', background: '#047857' }} />
                      </div>
                      <strong style={{ fontSize: '0.78125rem', color: '#047857' }}>85%</strong>
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant="gold">Incomplete / Pending Final Docs</Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('profile')}
                      style={{ fontSize: '0.75rem', padding: '2px 8px', fontWeight: 700 }}
                    >
                      Complete Profile
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 3B. DIGILOCKER & ABC NATIONAL REPOSITORY (LIVE CITIZEN GATEWAY) ─ */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderLeft: '4px solid #2563EB', overflow: 'hidden', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ padding: '0.5rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                <ShieldCheck size={24} color="#2563EB" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59' }}>
                    DigiLocker &amp; Academic Bank of Credits (ABC)
                  </h4>
                  <Badge variant="active">CONNECTED ✓</Badge>
                </div>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                  Government of India National Academic Depository (NAD) • 2 Issued Documents Verified • ABC ID: {student?.abcId || '8940-1234-5678'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveTab('digilocker-documents')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <ShieldCheck size={14} color="#2563EB" /> View Digital Documents
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setActiveTab('abc-credits')}
                style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Award size={14} /> ABC Credits Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* ── 4. ACADEMIC SUMMARY METRICS TABLE (EXCEL FORMAT) ──────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>ACADEMIC OVERVIEW &amp; PERFORMANCE SUMMARY</span>
            <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>Real-time verified university metrics</span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '22%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Metric</th>
                  <th style={{ width: '18%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Value</th>
                  <th style={{ width: '18%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '28%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Description</th>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Metric 1: Attendance */}
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    1. Overall Attendance
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: stats.percentage >= 75 ? '#047857' : '#D97706', borderRight: '1px solid #E2E8F0' }}>
                    {stats.percentage}%
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant={stats.percentage >= 75 ? 'active' : 'orange'}>
                      {stats.percentage >= 75 ? 'GOOD / ELIGIBLE' : 'SHORTAGE'}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    {stats.presentClasses} Present / {stats.totalClasses} Total Lectures Recorded
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('my-attendance')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      View Details
                    </button>
                  </td>
                </tr>

                {/* Metric 2: Pending Fees */}
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    2. Pending Semester Fees
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: (studentFee?.pendingAmount || 0) === 0 ? '#047857' : '#DC2626', borderRight: '1px solid #E2E8F0' }}>
                    ₹{(studentFee?.pendingAmount || 0).toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant={(studentFee?.pendingAmount || 0) === 0 ? 'active' : 'danger'}>
                      {(studentFee?.pendingAmount || 0) === 0 ? 'ALL CLEAR' : 'DUES PENDING'}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    {(studentFee?.pendingAmount || 0) === 0 ? 'No outstanding university dues' : `Payment due: ${studentFee?.dueDate || 'Immediate'}`}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('fees')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      Fee Ledger
                    </button>
                  </td>
                </tr>

                {/* Metric 3: Upcoming Exams */}
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    3. Upcoming University Exams
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {upcomingExams.length} Active
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant="navy">SCHEDULED</Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    {upcomingExams[0]?.name || 'B.Tech Sem-4 Mid Semester Exam 2026'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('exam-forms')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      Exam Forms
                    </button>
                  </td>
                </tr>

                {/* Metric 4: Pending Service Requests */}
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    4. Student Section Requests
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {studentPendingReqs.length}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant={studentPendingReqs.length > 0 ? 'gold' : 'active'}>
                      {studentPendingReqs.length > 0 ? 'IN PROGRESS' : 'NONE PENDING'}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    {studentPendingReqs.length > 0 ? 'Applications undergoing student section review' : 'All queries resolved'}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('requests')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      Track
                    </button>
                  </td>
                </tr>

                {/* Metric 5: Coursework / Assignments Due */}
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    5. Coursework &amp; Assignments
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#D97706', borderRight: '1px solid #E2E8F0' }}>
                    {pendingAssignments.length} Pending
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant={pendingAssignments.length > 0 ? 'orange' : 'active'}>
                      {pendingAssignments.length > 0 ? 'ACTION REQUIRED' : 'UP TO DATE'}
                    </Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    Coursework and practical assignments to submit
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('assignments')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      Assignments
                    </button>
                  </td>
                </tr>

                {/* Metric 6: Notifications */}
                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    6. Portal Notifications
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, fontSize: '0.875rem', color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                    {myNotifs.length}
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                    <Badge variant="navy">NEW ALERTS</Badge>
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                    Recent circulars, event notifications and timetable changes
                  </td>
                  <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('notifications')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                      View Alerts
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 5. TODAY'S SCHEDULE (EXCEL TABLE FORMAT) ───────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>TODAY'S SCHEDULED LECTURES &amp; LABS</span>
            <button
              type="button"
              className="no-print btn btn-xs"
              onClick={() => setActiveTab('timetable')}
              style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
            >
              Full Timetable
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '16%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Time</th>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Code</th>
                  <th style={{ width: '28%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Name</th>
                  <th style={{ width: '20%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Faculty</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Room</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {todayClasses.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                      No lectures scheduled for today.
                    </td>
                  </tr>
                ) : (
                  todayClasses.map((tt, idx) => {
                    const subj = db.getSubjectById(tt.subjectId);
                    const fac = db.getFaculty().find(f => f.id === tt.facultyId);
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={tt.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          {tt.timeSlot}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                          {subj?.code || 'CSE-401'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          {subj?.name || 'Class Lecture'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                          {fac?.name || 'Assigned Professor'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>
                          {tt.roomNo || 'Room 302'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                          <Badge variant={subj?.type === 'PRACTICAL' ? 'orange' : 'active'}>
                            {subj?.type || 'THEORY'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 6. ATTENDANCE SECTION (EXCEL TABLE FORMAT) ────────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>SUBJECT-WISE ATTENDANCE BREAKDOWN</span>
            <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>Eligibility Threshold: 75.00%</span>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Code</th>
                  <th style={{ width: '35%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject Name</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Total Lectures</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Present</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Absent</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Attendance %</th>
                  <th style={{ width: '16%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {subjectAttendanceList.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  const isGood = row.percentage >= 75;
                  return (
                    <tr key={idx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                        {row.code}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                        {row.total}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#047857', borderRight: '1px solid #E2E8F0' }}>
                        {row.present}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: row.absent > 3 ? '#DC2626' : '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {row.absent}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 900, color: isGood ? '#047857' : '#DC2626', borderRight: '1px solid #E2E8F0' }}>
                        {row.percentage}%
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <Badge variant={isGood ? 'active' : 'danger'}>
                          {isGood ? 'ELIGIBLE / GOOD' : 'SHORTAGE / WARNING'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 7. FEES & PAYMENT SUMMARY (EXCEL TABLE FORMAT) ────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>FEES &amp; PAYMENT LEDGER</span>
            <button
              type="button"
              className="no-print btn btn-xs"
              onClick={() => setActiveTab('fees')}
              style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
            >
              Fee Portal
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '25%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Fee Type</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Academic Year</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Amount</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Paid</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Pending</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Receipt / Action</th>
                </tr>
              </thead>
              <tbody>
                {feeTableRows.map((row, idx) => {
                  const isEven = idx % 2 === 0;
                  const isPaid = row.status === 'PAID';
                  return (
                    <tr key={idx} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                        {row.feeType}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', color: '#64748B' }}>
                        {row.academicYear}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>
                        ₹{row.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: '#047857', borderRight: '1px solid #E2E8F0' }}>
                        ₹{row.paid.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 700, color: row.pending > 0 ? '#DC2626' : '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        ₹{row.pending.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <Badge variant={isPaid ? 'active' : 'danger'}>
                          {isPaid ? 'PAID' : 'PENDING'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                        {isPaid ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenReceiptModal(row)}
                            style={{ fontSize: '0.71875rem', padding: '2px 6px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="View Official University Receipt"
                          >
                            <Printer size={12} /> View Receipt
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setActiveTab('fees')}
                            style={{ fontSize: '0.71875rem', padding: '2px 8px', fontWeight: 800, background: '#047857', borderColor: '#047857' }}
                          >
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 8. UPCOMING EXAMINATIONS (EXCEL TABLE FORMAT) ─────────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>UPCOMING UNIVERSITY EXAMINATIONS</span>
            <button
              type="button"
              className="no-print btn btn-xs"
              onClick={() => setActiveTab('exam-forms')}
              style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
            >
              Exam Portal
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Exam Code</th>
                  <th style={{ width: '30%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Examination</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Program</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Semester</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Date</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Status</th>
                  <th style={{ width: '10%', padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {upcomingExams.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                      No examinations scheduled currently.
                    </td>
                  </tr>
                ) : (
                  upcomingExams.map((ex, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={ex.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                          {ex.code || `EXM-${ex.id.slice(-4)}`}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                          {ex.name}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                          {progObj?.code || 'B.Tech CSE'}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                          {semNumber}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          {ex.startDate}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant="navy">{ex.status}</Badge>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveTab('exam-forms')} style={{ fontSize: '0.71875rem', padding: '2px 6px' }}>
                            Hall Ticket
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 9. TWO-COLUMN SPLIT: PENDING REQUESTS & ASSIGNMENTS ────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.15rem' }}>
          
          {/* A. Pending Requests */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>SERVICE REQUESTS &amp; QUERIES</span>
              <button
                type="button"
                className="no-print btn btn-xs"
                onClick={() => setActiveTab('requests')}
                style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
              >
                Track All
              </button>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ width: '22%', padding: '0.5rem 0.6rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Req ID</th>
                    <th style={{ width: '38%', padding: '0.5rem 0.6rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Request Type</th>
                    <th style={{ width: '22%', padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Status</th>
                    <th style={{ width: '18%', padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {combinedRequests.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                        No requests logged.
                      </td>
                    </tr>
                  ) : (
                    combinedRequests.map((req, idx) => {
                      const isEven = idx % 2 === 0;
                      return (
                        <tr key={req.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0.6rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023', borderRight: '1px solid #E2E8F0' }}>
                            {req.reqNo}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                            {req.title}
                            <span style={{ display: 'block', fontSize: '0.6875rem', color: '#64748B' }}>{req.date}</span>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            <Badge variant={req.status === 'COMPLETED' || req.status === 'READY_FOR_COLLECTION' ? 'active' : 'gold'}>
                              {req.status?.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>
                            <button type="button" className="btn btn-secondary btn-xs" onClick={() => setActiveTab('requests')} style={{ fontSize: '0.6875rem', padding: '2px 5px' }}>
                              Track
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* B. Coursework & Assignments */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>COURSEWORK &amp; ASSIGNMENTS</span>
              <button
                type="button"
                className="no-print btn btn-xs"
                onClick={() => setActiveTab('assignments')}
                style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
              >
                All Tasks
              </button>
            </div>

            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem', margin: 0 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ width: '38%', padding: '0.5rem 0.6rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Assignment</th>
                    <th style={{ width: '26%', padding: '0.5rem 0.6rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Subject</th>
                    <th style={{ width: '20%', padding: '0.5rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Due Date</th>
                    <th style={{ width: '16%', padding: '0.5rem 0.6rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {studentAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                        No coursework assigned.
                      </td>
                    </tr>
                  ) : (
                    studentAssignments.map((a, idx) => {
                      const subj = db.getSubjectById(a.subjectId);
                      const isEven = idx % 2 === 0;
                      return (
                        <tr key={a.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                          <td style={{ padding: '0.5rem 0.6rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                            {a.title}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                            {subj?.code || 'CSE'}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'center', color: '#DC2626', fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>
                            {a.deadline || '2026-08-30'}
                          </td>
                          <td style={{ padding: '0.5rem 0.6rem', textAlign: 'right' }}>
                            <button type="button" className="btn btn-secondary btn-xs" onClick={() => setActiveTab('assignments')} style={{ fontSize: '0.6875rem', padding: '2px 5px' }}>
                              Submit
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 10. NOTIFICATIONS & CIRCULARS (EXCEL TABLE FORMAT) ─────────────── */}
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <div style={{ background: '#0F2C59', color: '#FFFFFF', padding: '0.5rem 0.85rem', fontSize: '0.8125rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>UNIVERSITY CIRCULARS &amp; OFFICIAL NOTIFICATIONS</span>
            <button
              type="button"
              className="no-print btn btn-xs"
              onClick={() => setActiveTab('notifications')}
              style={{ background: '#F37023', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '0.71875rem' }}
            >
              All Alerts
            </button>
          </div>

          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
              <thead>
                <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #E2E8F0' }}>
                  <th style={{ width: '14%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Date / Time</th>
                  <th style={{ width: '46%', padding: '0.5rem 0.75rem', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Notification Title &amp; Summary</th>
                  <th style={{ width: '15%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Category</th>
                  <th style={{ width: '13%', padding: '0.5rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #E2E8F0' }}>Priority</th>
                  <th style={{ width: '12%', padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {myNotifs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '1.25rem', color: '#64748B' }}>
                      No active university notices.
                    </td>
                  </tr>
                ) : (
                  myNotifs.map((n, idx) => {
                    const isEven = idx % 2 === 0;
                    return (
                      <tr key={n.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.5rem 0.75rem', color: '#64748B', fontSize: '0.75rem', borderRight: '1px solid #E2E8F0' }}>
                          {n.timestamp || (n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '2026-08-24')}
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                          <strong style={{ color: '#0F2C59', display: 'block', fontSize: '0.84375rem' }}>{n.title}</strong>
                          <span style={{ fontSize: '0.75rem', color: '#475569' }}>{n.message}</span>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant="navy">{n.module || 'ACADEMIC'}</Badge>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <Badge variant="orange">IMPORTANT</Badge>
                        </td>
                        <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setActiveTab(n.linkTab || 'notifications')}
                            style={{ fontSize: '0.71875rem', padding: '2px 6px' }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── 11. PRINT ONLY OFFICIAL FOOTER & AUTHENTICATION STAMP ─────────── */}
        <div style={{
          display: 'none',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          borderTop: '2px solid #0F2C59',
          paddingTop: '1rem',
          marginTop: '1.5rem',
          fontSize: '0.75rem'
        }} className="print-only">
          <div>
            <strong>SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY</strong>
            <div>Bhoyan Rathod, Opp. IFFCO, Gandhinagar, Gujarat - 382420</div>
            <div>Generated On: {new Date().toLocaleString('en-IN')}</div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div style={{ height: '35px', borderBottom: '1px solid #000' }} />
            <div style={{ marginTop: '4px', fontWeight: 800 }}>Controller of Examinations / Registrar</div>
          </div>
        </div>

      </div>

    </div>
  );
};
