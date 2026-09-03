import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { ExamForm, ExamFeeBreakdown, Exam, Student } from '../../types';
import { ExamFeePaymentModal, ExamFeePaymentData } from '../../components/exams/ExamFeePaymentModal';
import { ExamFeeReceiptDetails } from '../../components/exams/ExamFeeReceiptModal';
import { feeReceiptPdfService } from '../../services/feeReceiptPdfService';
import { fromExamFeeReceiptDetails } from '../../components/receipt/receiptTypes';
import {
  IndianRupee,
  CreditCard,
  CheckCircle2,
  FileText,
  RefreshCw,
  RotateCcw,
  Shield,
  Info,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  X,
  Clock,
  Check,
  Eye,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExamFeeRowItem {
  srNo: number;
  feeCode: string;
  feeType: string;
  categoryKey: 'REGULAR' | 'BACKLOG' | 'RE_EXAM' | 'SUPPLEMENTARY' | 'REASSESSMENT' | 'RECHECKING';
  description: string;
  baseFee: number;
  perSubjectFee: number;
  subjectCount: number;
  subjectFeeTotal: number;
  lateFee: number;
  otherCharges: number;
  totalAmount: number;
  dueDate: string;
  paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIALLY PAID' | 'NOT APPLICABLE';
  receiptNo?: string;
  transactionId?: string;
  paidDate?: string;
  paidTime?: string;
  paymentMode?: string;
  formId?: string;
}

export const StudentExamFeesPage: React.FC = () => {
  const { user, role } = useAuth();
  const exams = db.getExams();
  const allForms = db.getExamForms();
  const students = db.getStudents();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const semesters = db.getSemesters();
  const academicYears = db.getAcademicYears();

  // 1. Identify logged in Student
  const currentStudent = useMemo(() => {
    if (role === 'STUDENT') {
      return students.find(s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo || s.email === user?.email) || students[0];
    }
    return students[0];
  }, [students, user, role]);

  const studentProgram = programs.find(p => p.id === currentStudent?.programId);
  const studentDept = departments.find(d => d.id === currentStudent?.departmentId);
  const studentSemester = semesters.find(s => s.id === currentStudent?.semesterId);
  const studentInstitute = db.getInstitutes().find(i => i.id === currentStudent?.instituteId) || db.getInstitutes()[0];

  // 2. Exam Selector State
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = useMemo(() => exams.find(e => e.id === selectedExamId) || exams[0], [exams, selectedExamId]);

  // 3. Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcademicYear, setFilterAcademicYear] = useState('ALL');
  const [filterSemester, setFilterSemester] = useState('ALL');
  const [filterFeeType, setFilterFeeType] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');

  // 4. Modals and Notification Toast
  const [payingFeeItem, setPayingFeeItem] = useState<ExamFeePaymentData | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<ExamFeeReceiptDetails | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // 5. Retrieve Student's Exam Forms & Transactions
  const myForms = useMemo(() => {
    if (!currentStudent) return [];
    return db.getExamForms().filter(f => f.studentId === currentStudent.id || f.enrollmentNo === currentStudent.enrollmentNo);
  }, [currentStudent, refreshKey]);

  const currentForm = useMemo(() => {
    return myForms.find(f => f.examId === currentExam?.id);
  }, [myForms, currentExam]);

  // 6. Dynamic Fee Breakdown from Exam Controller configuration
  const feeRows: ExamFeeRowItem[] = useMemo(() => {
    if (!currentExam) return [];

    const today = new Date();
    const isLate = currentExam.formDeadline ? today > new Date(currentExam.formDeadline) : false;
    const dueDate = currentExam.formDeadline ? new Date(currentExam.formDeadline).toLocaleDateString('en-IN') : '15/09/2026';

    const categoriesConfig: {
      feeCode: string;
      feeType: string;
      categoryKey: 'REGULAR' | 'BACKLOG' | 'RE_EXAM' | 'SUPPLEMENTARY' | 'REASSESSMENT' | 'RECHECKING';
      description: string;
      subjectCount: number;
    }[] = [
      {
        feeCode: 'EXAM-REG',
        feeType: 'Regular Exam Fee',
        categoryKey: 'REGULAR',
        description: 'Standard semester examination fee for enrolled regular subjects',
        subjectCount: currentForm?.formSubjects?.length || currentForm?.regularSubjects?.length || 6
      },
      {
        feeCode: 'EXAM-ATKT',
        feeType: 'Backlog / ATKT Fee',
        categoryKey: 'BACKLOG',
        description: 'Fee for re-appearing in previously failed backlog subjects',
        subjectCount: currentForm?.backlogSubjects?.length || 1
      },
      {
        feeCode: 'EXAM-RE',
        feeType: 'Re-Exam Fee',
        categoryKey: 'RE_EXAM',
        description: 'Special re-examination fee as per academic council regulations',
        subjectCount: 1
      },
      {
        feeCode: 'EXAM-SUP',
        feeType: 'Supplementary Exam Fee',
        categoryKey: 'SUPPLEMENTARY',
        description: 'Supplementary / grade improvement examination fee',
        subjectCount: 1
      },
      {
        feeCode: 'EXAM-RA',
        feeType: 'Reassessment Fee',
        categoryKey: 'REASSESSMENT',
        description: 'Answer script paper reassessment / re-evaluation fee',
        subjectCount: 1
      },
      {
        feeCode: 'EXAM-RC',
        feeType: 'Rechecking Fee',
        categoryKey: 'RECHECKING',
        description: 'Answer script total marks verification & rechecking fee',
        subjectCount: 1
      }
    ];

    return categoriesConfig.map((cat, idx) => {
      // Dynamic calculation from Exam Controller configuration in db
      const breakdown = db.getExamFeeBreakdown(
        currentExam.id,
        currentStudent?.id || '',
        cat.categoryKey,
        cat.subjectCount
      );

      // Check if student has already paid this specific fee
      const isRegularPaid = cat.categoryKey === 'REGULAR' && currentForm && (currentForm.paymentStatus === 'PAID' || currentForm.paymentStatus === 'COMPLETED');
      const isFormPaid = isRegularPaid;

      const paymentStatus: ExamFeeRowItem['paymentStatus'] = isFormPaid ? 'PAID' : isLate ? 'OVERDUE' : 'PENDING';

      return {
        srNo: idx + 1,
        feeCode: cat.feeCode,
        feeType: cat.feeType,
        categoryKey: cat.categoryKey,
        description: cat.description,
        baseFee: breakdown.baseFee,
        perSubjectFee: breakdown.perSubjectFee,
        subjectCount: cat.subjectCount,
        subjectFeeTotal: breakdown.subjectFeeTotal,
        lateFee: breakdown.lateFee,
        otherCharges: cat.categoryKey === 'REGULAR' ? 50 : 0,
        totalAmount: breakdown.totalPayable + (cat.categoryKey === 'REGULAR' ? 50 : 0),
        dueDate,
        paymentStatus,
        receiptNo: isFormPaid ? (currentForm?.receiptNo || `EXAM-FEE/2026/000${currentForm?.id?.slice(-3) || '1'}`) : undefined,
        transactionId: isFormPaid ? currentForm?.transactionId : undefined,
        paidDate: isFormPaid ? (currentForm?.paidAt || '2026-08-20') : undefined,
        paidTime: isFormPaid ? '14:30:00' : undefined,
        paymentMode: isFormPaid ? (currentForm?.paymentMode || 'Online UPI') : undefined,
        formId: currentForm?.id
      };
    });
  }, [currentExam, currentForm, currentStudent, refreshKey]);

  // 7. Filtered Fee Table Items
  const filteredFeeRows = useMemo(() => {
    return feeRows.filter(row => {
      if (filterFeeType !== 'ALL' && row.categoryKey !== filterFeeType) return false;
      if (filterPaymentStatus !== 'ALL' && row.paymentStatus !== filterPaymentStatus) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = row.feeCode.toLowerCase().includes(q);
        const matchType = row.feeType.toLowerCase().includes(q);
        const matchDesc = row.description.toLowerCase().includes(q);
        if (!matchCode && !matchType && !matchDesc) return false;
      }
      return true;
    });
  }, [feeRows, filterFeeType, filterPaymentStatus, searchTerm]);

  // 8. Payment History Records
  const paymentHistoryRecords = useMemo(() => {
    const records: ExamFeeReceiptDetails[] = [];

    myForms.forEach((form, idx) => {
      if (form.paymentStatus === 'PAID' || form.paymentStatus === 'COMPLETED' || form.paidAt) {
        const examObj = exams.find(e => e.id === form.examId) || currentExam;
        const paidTotal = form.totalFee || 350;
        const base = form.baseFee || 300;
        const subjTotal = form.subjectFee || 0;
        const late = form.lateFee || 0;
        const other = Math.max(0, paidTotal - (base + subjTotal + late));

        records.push({
          receiptNo: form.receiptNo || `EXAM-FEE/2026/${String(idx + 1).padStart(4, '0')}`,
          transactionId: form.transactionId || `TXN-EXAM-2026-${String(idx + 1).padStart(4, '0')}`,
          paymentDate: form.paidAt || '2026-08-20',
          paymentTime: '14:30:00',
          paymentMode: form.paymentMode || 'Online UPI',
          paymentStatus: 'PAID',
          studentName: currentStudent?.name || form.studentName || 'Student',
          enrollmentNo: currentStudent?.enrollmentNo || form.enrollmentNo || '-',
          instituteName: 'Swarrnim Institute of Technology',
          departmentName: studentDept?.name || 'Computer Science & Engineering',
          programName: studentProgram?.name || 'B.Tech Computer Science & Engineering',
          semesterName: studentSemester ? `Semester ${studentSemester.number}` : 'Semester 4',
          academicYear: currentExam?.academicYear || '2026-2027',
          examCode: examObj?.code || 'EXAM-2026-SUMMER',
          examName: examObj?.name || 'Summer Regular Examination 2026',
          examType: examObj?.type || 'REGULAR',
          examSession: 'Morning (10:30 AM - 01:30 PM)',
          feeCode: 'EXAM-REG',
          feeType: 'Regular Examination Fee',
          baseFee: base,
          perSubjectFee: 50,
          subjectCount: form.formSubjects?.length || form.regularSubjects?.length || 6,
          subjectFeeTotal: subjTotal,
          lateFee: late,
          otherCharges: other,
          totalPaid: paidTotal
        });
      }
    });

    return records;
  }, [myForms, exams, currentExam, currentStudent, studentDept, studentProgram, studentSemester, refreshKey]);

  // Helper Badge Color Resolver
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
      case 'COMPLETED':
      case 'SUCCESS':
        return <Badge variant="active">PAID</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      case 'PENDING':
      case 'INITIATED':
        return <Badge variant="orange">PENDING</Badge>;
      case 'PARTIALLY PAID':
        return <Badge variant="gold">PARTIALLY PAID</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  // Action: Open Payment Modal
  const handleInitiatePayment = (row: ExamFeeRowItem) => {
    setPayingFeeItem({
      feeCode: row.feeCode,
      feeType: row.feeType,
      description: row.description,
      baseFee: row.baseFee,
      perSubjectFee: row.perSubjectFee,
      subjectCount: row.subjectCount,
      lateFee: row.lateFee,
      otherCharges: row.otherCharges,
      totalAmount: row.totalAmount,
      dueDate: row.dueDate,
      examId: currentExam.id,
      examName: currentExam.name,
      examType: currentExam.type || 'REGULAR',
      academicYear: currentExam.academicYear || '2026-2027',
      semesterName: studentSemester ? `Semester ${studentSemester.number}` : 'Semester 4',
      formId: row.formId
    });
  };

  // Callback from ExamFeePaymentModal after successful simulated payment
  const handlePaymentSuccess = (result: {
    receiptNo: string;
    transactionId: string;
    paidAmount: number;
    paymentMode?: string;
    paidDate?: string;
    paidTime?: string;
    feeData: ExamFeePaymentData;
  }) => {
    // 1. Mark form as PAID in DB
    if (result.feeData.formId) {
      db.updateEntity<ExamForm>('examForms', result.feeData.formId, {
        paymentStatus: 'PAID',
        receiptNumber: result.receiptNo,
        transactionId: result.transactionId,
        paymentMode: result.paymentMode || 'Online UPI',
        paidAt: result.paidDate || new Date().toISOString().split('T')[0],
        totalFee: result.paidAmount,
        status: 'VERIFICATION_PENDING',
        isVerified: true
      }, `Paid exam fee for form ${result.feeData.formId}`);
    }

    // 2. Add ERP Notification
    db.addNotification({
      title: 'Exam Fee Paid Successfully',
      message: `Payment of ₹${result.paidAmount.toLocaleString('en-IN')} for ${result.feeData.examName} (${result.feeData.feeType}) confirmed. Receipt: ${result.receiptNo}`,
      module: 'EXAM' as any,
      priority: 'HIGH' as any,
      linkTab: 'exam-fees-student'
    });

    // 3. Open PDF Receipt directly in New Tab using common service
    const receiptDetails: ExamFeeReceiptDetails = {
      receiptNo: result.receiptNo,
      transactionId: result.transactionId,
      paymentDate: result.paidDate || new Date().toISOString().split('T')[0],
      paymentTime: result.paidTime || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }),
      paymentMode: result.paymentMode || 'Online UPI',
      paymentStatus: 'PAID & VERIFIED',
      studentName: currentStudent?.fullNameAsPerMarksheet || currentStudent?.name || 'Student',
      enrollmentNo: currentStudent?.enrollmentNo || '-',
      instituteName: studentInstitute?.name || 'Swarrnim Institute of Technology',
      departmentName: studentDept?.name || 'Computer Science & Engineering',
      programName: studentProgram?.name || 'B.Tech Computer Science & Engineering',
      semesterName: studentSemester ? `Semester ${studentSemester.number}` : 'Semester 4',
      academicYear: result.feeData.academicYear,
      examCode: currentExam.code || 'EXAM-2026-SUMMER',
      examName: result.feeData.examName,
      examType: result.feeData.examType,
      examSession: 'Morning Session (10:30 AM - 01:30 PM)',
      feeCode: result.feeData.feeCode,
      feeType: result.feeData.feeType,
      baseFee: result.feeData.baseFee,
      perSubjectFee: result.feeData.perSubjectFee,
      subjectCount: result.feeData.subjectCount,
      subjectFeeTotal: result.feeData.perSubjectFee * result.feeData.subjectCount,
      lateFee: result.feeData.lateFee,
      otherCharges: result.feeData.otherCharges,
      totalPaid: result.paidAmount
    };

    setPayingFeeItem(null);
    setRefreshKey(prev => prev + 1);
    feeReceiptPdfService.openInNewTab(fromExamFeeReceiptDetails(receiptDetails));
    showToast('success', `Payment of ₹${result.paidAmount.toLocaleString('en-IN')} confirmed! Receipt PDF opened in new tab.`);
  };

    // Action: Open Receipt PDF directly in New Tab for Paid Item
    const handleViewReceipt = (row: ExamFeeRowItem) => {
      const details: ExamFeeReceiptDetails = {
        receiptNo: row.receiptNo || 'EXAM-FEE/2026/0001',
        transactionId: row.transactionId || 'TXN-EXAM-2026-0001',
        paymentDate: row.paidDate || '2026-08-20',
        paymentTime: row.paidTime || '14:30:00',
        paymentMode: row.paymentMode || 'Online UPI',
        paymentStatus: 'PAID & VERIFIED',
        studentName: currentStudent?.fullNameAsPerMarksheet || currentStudent?.name || 'Student',
        enrollmentNo: currentStudent?.enrollmentNo || '-',
        instituteName: studentInstitute?.name || 'Swarrnim Institute of Technology',
        departmentName: studentDept?.name || 'Computer Science & Engineering',
        programName: studentProgram?.name || 'B.Tech Computer Science & Engineering',
        semesterName: studentSemester ? `Semester ${studentSemester.number}` : 'Semester 4',
        academicYear: currentExam?.academicYear || '2026-2027',
        examCode: currentExam?.code || 'EXAM-2026-SUMMER',
        examName: currentExam?.name || 'Summer Regular Examination 2026',
        examType: currentExam?.type || 'REGULAR',
        examSession: 'Morning Session (10:30 AM - 01:30 PM)',
        feeCode: row.feeCode,
        feeType: row.feeType,
        baseFee: row.baseFee,
        perSubjectFee: row.perSubjectFee,
        subjectCount: row.subjectCount,
        subjectFeeTotal: row.subjectFeeTotal,
        lateFee: row.lateFee,
        otherCharges: row.otherCharges,
        totalPaid: row.totalAmount
      };
      feeReceiptPdfService.openInNewTab(fromExamFeeReceiptDetails(details));
    };

  // Export to Excel handler (.xlsx)
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const dataToExport = filteredFeeRows.map(r => ({
      'Sr. No.': r.srNo,
      'Fee Code': r.feeCode,
      'Fee Type': r.feeType,
      'Description': r.description,
      'Base Fee (Rs)': r.baseFee,
      'Per Subject Fee (Rs)': r.perSubjectFee,
      'Subjects': r.subjectCount,
      'Late Fee (Rs)': r.lateFee,
      'Other Charges (Rs)': r.otherCharges,
      'Total Amount (Rs)': r.totalAmount,
      'Due Date': r.dueDate,
      'Payment Status': r.paymentStatus,
      'Transaction ID': r.transactionId || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, 'Examination Fees');
    XLSX.writeFile(wb, `SSIU_Exam_Fee_Register_${currentStudent?.enrollmentNo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Examination fee register exported to Excel successfully.');
  };

  // Print Register Handler
  const handlePrintRegister = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          backgroundColor: toast.type === 'success' ? '#047857' : '#DC2626',
          color: '#FFFFFF', padding: '0.75rem 1.25rem', borderRadius: '4px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontWeight: 700, fontSize: '0.875rem'
        }}>
          {toast.message}
        </div>
      )}

      {/* ── 1. PAGE HEADER & COMPACT SUMMARY ROW ───────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        padding: '1.25rem 1.5rem',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0F2C59', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <IndianRupee size={24} color="#F37023" />
              Examination Fees
            </h2>
            <p style={{ fontSize: '0.84375rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
              All examination-related fees — amounts are university-authoritative.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0F2C59', whiteSpace: 'nowrap' }}>
              Select Exam:
            </label>
            <select
              className="form-control"
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              style={{ fontSize: '0.8125rem', fontWeight: 700, minWidth: '240px', height: '34px' }}
            >
              {exams.map(e => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.academicYear || '2026-2027'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compact Bordered Summary Information Row */}
        <div style={{
          border: '1px solid #E2E8F0',
          background: '#F8FAFC',
          borderRadius: '4px',
          padding: '0.65rem 1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.8125rem'
        }}>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>SELECTED EXAMINATION</span>
            <strong style={{ color: '#0F2C59' }}>{currentExam.name}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>ACADEMIC YEAR</span>
            <strong style={{ color: '#334155' }}>{currentExam.academicYear || '2026-2027'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>SEMESTER</span>
            <strong style={{ color: '#334155' }}>{studentSemester ? `Semester ${studentSemester.number}` : 'Semester 4'}</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>EXAM TYPE</span>
            <span style={{ fontWeight: 800, color: '#F37023' }}>{currentExam.type || 'REGULAR'}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>FORM LAST DATE</span>
            <strong style={{ color: '#047857' }}>
              {currentExam.formDeadline ? new Date(currentExam.formDeadline).toLocaleDateString('en-IN') : '15/09/2026'}
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', display: 'block' }}>LATE FEE DEADLINE</span>
            <strong style={{ color: '#DC2626' }}>
              {currentExam.lateFeeDeadline ? new Date(currentExam.lateFeeDeadline).toLocaleDateString('en-IN') : '22/09/2026'}
            </strong>
          </div>
        </div>
      </div>

      {/* ── 2. SEARCH & FILTER TOOLBAR WITH EXPORT ──────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Search & Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 320px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={15} color="#64748B" style={{ position: 'absolute', left: '10px', top: '9px' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Search Fee Type / Fee Code (e.g. EXAM-REG)..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px', fontSize: '0.8125rem', height: '32px' }}
            />
          </div>

          <select
            className="form-control"
            value={filterFeeType}
            onChange={e => setFilterFeeType(e.target.value)}
            style={{ fontSize: '0.78125rem', height: '32px', width: 'auto', padding: '0 0.5rem' }}
          >
            <option value="ALL">All Fee Types</option>
            <option value="REGULAR">Regular Exam Fee</option>
            <option value="BACKLOG">Backlog / ATKT Fee</option>
            <option value="RE_EXAM">Re-Exam Fee</option>
            <option value="SUPPLEMENTARY">Supplementary Fee</option>
            <option value="REASSESSMENT">Reassessment Fee</option>
            <option value="RECHECKING">Rechecking Fee</option>
          </select>

          <select
            className="form-control"
            value={filterPaymentStatus}
            onChange={e => setFilterPaymentStatus(e.target.value)}
            style={{ fontSize: '0.78125rem', height: '32px', width: 'auto', padding: '0 0.5rem' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {(searchTerm || filterFeeType !== 'ALL' || filterPaymentStatus !== 'ALL') && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setSearchTerm(''); setFilterFeeType('ALL'); setFilterPaymentStatus('ALL'); }}
              style={{ fontSize: '0.71875rem', height: '32px', padding: '0 8px' }}
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>

        {/* Export & Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrintRegister}
            style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
          >
            <Printer size={14} /> Print
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportExcel}
            style={{ fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', height: '32px' }}
          >
            <FileSpreadsheet size={14} color="#047857" /> Export Excel
          </button>
        </div>
      </div>

      {/* ── 3. EXCEL-STYLE EXAMINATION FEE SCHEDULE TABLE ───────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.55rem 0.85rem',
          fontSize: '0.8125rem',
          fontWeight: 800,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>EXAMINATION FEE SCHEDULE &amp; STUDENT PAYMENT REGISTER</span>
          <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>
            Authoritative University Exam Controller Matrix
          </span>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto', maxHeight: '520px' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0F2C59', color: '#FFFFFF', borderBottom: '2px solid #CBD5E1' }}>
                <th style={{ width: '4%', padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Sr. No.</th>
                <th style={{ width: '8%', padding: '0.55rem 0.6rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Fee Code</th>
                <th style={{ width: '14%', padding: '0.55rem 0.6rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Fee Type</th>
                <th style={{ width: '22%', padding: '0.55rem 0.6rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Description</th>
                <th style={{ width: '7%', padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Base Fee</th>
                <th style={{ width: '7%', padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Per Subj Fee</th>
                <th style={{ width: '5%', padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Subjects</th>
                <th style={{ width: '6%', padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Late Fee</th>
                <th style={{ width: '6%', padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Other Charges</th>
                <th style={{ width: '8%', padding: '0.55rem 0.6rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Total Amount</th>
                <th style={{ width: '7%', padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Due Date</th>
                <th style={{ width: '7%', padding: '0.55rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Status</th>
                <th style={{ width: '9%', padding: '0.55rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFeeRows.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '1.75rem', color: '#64748B' }}>
                    No fee records match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredFeeRows.map((r, idx) => {
                  const isEven = idx % 2 === 0;
                  const isPaid = r.paymentStatus === 'PAID';

                  return (
                    <tr
                      key={r.feeCode}
                      style={{
                        background: isEven ? '#FFFFFF' : '#F8FAFC',
                        borderBottom: '1px solid #CBD5E1',
                        borderTop: '1px solid #CBD5E1'
                      }}
                    >
                      {/* 1. Sr. No. */}
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#64748B', borderRight: '1px solid #CBD5E1' }}>
                        {r.srNo}
                      </td>

                      {/* 2. Fee Code */}
                      <td style={{ padding: '0.45rem 0.6rem', fontFamily: 'monospace', fontWeight: 800, color: '#F37023', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        {r.feeCode}
                      </td>

                      {/* 3. Fee Type */}
                      <td style={{ padding: '0.45rem 0.6rem', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #CBD5E1' }}>
                        {r.feeType}
                      </td>

                      {/* 4. Description */}
                      <td style={{ padding: '0.45rem 0.6rem', color: '#475569', borderRight: '1px solid #CBD5E1', fontSize: '0.78125rem' }}>
                        {r.description}
                      </td>

                      {/* 5. Base Fee */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#334155', borderRight: '1px solid #CBD5E1' }}>
                        ₹{r.baseFee.toLocaleString('en-IN')}
                      </td>

                      {/* 6. Per Subject Fee */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: '#334155', borderRight: '1px solid #CBD5E1' }}>
                        ₹{r.perSubjectFee.toLocaleString('en-IN')}
                      </td>

                      {/* 7. No. of Subjects */}
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', borderRight: '1px solid #CBD5E1' }}>
                        {r.subjectCount}
                      </td>

                      {/* 8. Late Fee */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: r.lateFee > 0 ? '#DC2626' : '#64748B', borderRight: '1px solid #CBD5E1' }}>
                        {r.lateFee > 0 ? `+₹${r.lateFee.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* 9. Other Charges */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', color: r.otherCharges > 0 ? '#0F2C59' : '#64748B', borderRight: '1px solid #CBD5E1' }}>
                        {r.otherCharges > 0 ? `+₹${r.otherCharges.toLocaleString('en-IN')}` : '₹0'}
                      </td>

                      {/* 10. Total Amount */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'right', fontWeight: 900, fontFamily: 'monospace', color: '#0F2C59', fontSize: '0.875rem', borderRight: '1px solid #CBD5E1' }}>
                        ₹{r.totalAmount.toLocaleString('en-IN')}
                      </td>

                      {/* 11. Due Date */}
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', color: '#475569', fontWeight: 600, borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        {r.dueDate}
                      </td>

                      {/* 12. Status */}
                      <td style={{ padding: '0.45rem 0.5rem', textAlign: 'center', borderRight: '1px solid #CBD5E1' }}>
                        {getStatusBadge(r.paymentStatus)}
                      </td>

                      {/* 13. Action */}
                      <td style={{ padding: '0.45rem 0.6rem', textAlign: 'center' }}>
                        {isPaid ? (
                          <button
                            type="button"
                            className="btn btn-secondary btn-xs"
                            onClick={() => handleViewReceipt(r)}
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 800,
                              color: '#047857',
                              borderColor: '#A7F3D0',
                              background: '#ECFDF5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 7px'
                            }}
                            title="View Official Payment Receipt"
                          >
                            <Eye size={12} /> View Receipt
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-xs"
                            onClick={() => handleInitiatePayment(r)}
                            style={{
                              fontSize: '0.71875rem',
                              fontWeight: 800,
                              background: '#0F2C59',
                              borderColor: '#0F2C59',
                              color: '#FFFFFF',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px'
                            }}
                          >
                            <CreditCard size={12} /> PAY NOW
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. PAYMENT HISTORY SECTION ──────────────────────────────────────── */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '0.55rem 0.85rem',
          fontSize: '0.8125rem',
          fontWeight: 800,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>PAYMENT HISTORY &amp; ISSUED RECEIPT LOGS</span>
          <span style={{ fontSize: '0.71875rem', color: '#CBD5E1' }}>
            Official University Accounting Transactions ({paymentHistoryRecords.length})
          </span>
        </div>

        <div className="table-responsive" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', margin: 0 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#0F2C59', borderBottom: '1px solid #CBD5E1' }}>
                <th style={{ width: '14%', padding: '0.5rem 0.65rem', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Receipt No.</th>
                <th style={{ width: '20%', padding: '0.5rem 0.65rem', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Exam Name</th>
                <th style={{ width: '15%', padding: '0.5rem 0.65rem', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Fee Type</th>
                <th style={{ width: '10%', padding: '0.5rem 0.65rem', textAlign: 'right', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Amount Paid</th>
                <th style={{ width: '10%', padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Payment Date</th>
                <th style={{ width: '11%', padding: '0.5rem 0.65rem', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Payment Mode</th>
                <th style={{ width: '12%', padding: '0.5rem 0.65rem', fontWeight: 800, borderRight: '1px solid #CBD5E1' }}>Transaction ID</th>
                <th style={{ width: '8%', padding: '0.5rem 0.65rem', textAlign: 'center', fontWeight: 800 }}>Receipt Action</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistoryRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '1.5rem', color: '#64748B' }}>
                    No paid examination receipts on record yet. Complete examination fee payment above to generate official receipts.
                  </td>
                </tr>
              ) : (
                paymentHistoryRecords.map((hist, idx) => (
                  <tr key={hist.receiptNo || idx} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #CBD5E1' }}>
                    <td style={{ padding: '0.45rem 0.65rem', fontFamily: 'monospace', fontWeight: 800, color: '#F37023', borderRight: '1px solid #CBD5E1' }}>
                      {hist.receiptNo}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #CBD5E1' }}>
                      {hist.examName}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', color: '#334155', borderRight: '1px solid #CBD5E1' }}>
                      {hist.feeType}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', textAlign: 'right', fontWeight: 800, fontFamily: 'monospace', color: '#047857', borderRight: '1px solid #CBD5E1' }}>
                      ₹{hist.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', textAlign: 'center', color: '#64748B', borderRight: '1px solid #CBD5E1' }}>
                      {hist.paymentDate}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', color: '#475569', borderRight: '1px solid #CBD5E1' }}>
                      {hist.paymentMode}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B', borderRight: '1px solid #CBD5E1' }}>
                      {hist.transactionId}
                    </td>
                    <td style={{ padding: '0.45rem 0.65rem', textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => feeReceiptPdfService.openInNewTab(fromExamFeeReceiptDetails(hist))}
                        style={{
                          fontSize: '0.71875rem',
                          fontWeight: 700,
                          padding: '2px 7px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Eye size={12} /> Receipt PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL 1: EXAM FEE PAYMENT MODAL ─────────────────────────────────── */}
      {payingFeeItem && (
        <ExamFeePaymentModal
          isOpen={Boolean(payingFeeItem)}
          onClose={() => setPayingFeeItem(null)}
          feeData={payingFeeItem}
          student={currentStudent}
          onSuccess={handlePaymentSuccess}
        />
      )}

    </div>
  );
};
