import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../services/db';
import { attendanceApprovalService } from '../../services/attendanceApprovalService';
import {
  Exam, ExamForm, Student, Subject, ExamFormSubjectItem,
  Program, Department, Institute, AcademicYear, Semester, HallTicket
} from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  FileText, Search, CheckCircle, XCircle, Download, Eye,
  ShieldCheck, AlertCircle, Clock, BookOpen, UserCheck, AlertTriangle,
  IndianRupee, Check, ArrowRight, RefreshCw, Send, Save, CheckSquare,
  Printer, QrCode, Layers, RotateCcw, Ban, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExamFormsPage: React.FC = () => {
  const { user, role } = useAuth();
  const isStudent = role === 'STUDENT';
  const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'EXAM_CONTROLLER', 'CONTROLLER_OF_EXAMINATION', 'REGISTRAR'].includes(role || '');

  // Master lists
  const [exams, setExams] = useState<Exam[]>([]);
  const [availableExams, setAvailableExams] = useState<any[]>([]);
  const [studentForms, setStudentForms] = useState<ExamForm[]>([]);
  const [allForms, setAllForms] = useState<ExamForm[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [hallTickets, setHallTickets] = useState<HallTicket[]>([]);

  // Navigation Tabs
  const [studentActiveTab, setStudentActiveTab] = useState<'AVAILABLE' | 'MY_FORMS' | 'MY_HALL_TICKETS'>('AVAILABLE');
  const [staffActiveTab, setStaffActiveTab] = useState<'QUEUE' | 'HALL_TICKETS'>('QUEUE');

  // Search & Filter State (Staff)
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState('ALL');
  const [filterProgram, setFilterProgram] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('ALL');

  // Multi-Selection State for Bulk Actions
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);

  // Modals State
  const [selectedExamForForm, setSelectedExamForForm] = useState<any | null>(null);
  const [activeDraftForm, setActiveDraftForm] = useState<ExamForm | null>(null);
  const [viewingFormDetails, setViewingFormDetails] = useState<ExamForm | null>(null);
  const [viewingHallTicket, setViewingHallTicket] = useState<HallTicket | null>(null);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [formRemarks, setFormRemarks] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(false);
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState(false);

  // Reason Modal (Return / Reject)
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    type: 'RETURN' | 'REJECT';
    formId?: string;
    isBulk?: boolean;
  }>({ isOpen: false, type: 'RETURN' });
  const [reasonText, setReasonText] = useState('');

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setExams(db.getExams(undefined, user));
    setStudents(db.getStudents());
    setPrograms(db.getPrograms());
    setDepartments(db.getDepartments());
    setSemesters(db.getSemesters());

    if (isStudent) {
      const avail = db.getAvailableExamsForStudent(user);
      setAvailableExams(avail);
      const myForms = db.getStudentExamForms(user);
      setStudentForms(myForms);
      const myTickets = db.getHallTickets(user);
      setHallTickets(myTickets);
    } else {
      const forms = db.getExamForms();
      setAllForms(forms);
      const tickets = db.getHallTickets(user);
      setHallTickets(tickets);
    }
  };

  const showToastMessage = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Authenticated Student Profile Info
  const currentStudent = useMemo(() => {
    if (!isStudent) return null;
    return students.find(s => s.id === user?.id || s.enrollmentNo === user?.enrollmentNo || s.enrollmentNo === user?.username) || students[0];
  }, [students, user, isStudent]);

  // Open Student Form Filling Modal
  const handleOpenFormModal = (examItem: any, existingForm?: ExamForm) => {
    const examObj = db.getExamById(examItem.id) || examItem;
    setSelectedExamForForm(examObj);

    if (existingForm) {
      setActiveDraftForm(existingForm);
      setSelectedSubjectIds(existingForm.regularSubjects || existingForm.formSubjects?.map(s => s.subjectId) || []);
      setFormRemarks(existingForm.remarks || '');
      setDeclarationAccepted(!!existingForm.declarationAccepted);
    } else {
      setActiveDraftForm(null);
      const subIds = (examObj.subjects || []).map((s: any) => s.subjectId || s.id);
      setSelectedSubjectIds(subIds);
      setFormRemarks('');
      setDeclarationAccepted(false);
    }
  };

  // Live Fee Breakdown
  const formFeeSummary = useMemo(() => {
    if (!selectedExamForForm) return { examFee: 0, lateFee: 0, totalPayable: 0, isLate: false };

    const regularFeeObj = selectedExamForForm.fees?.find((f: any) => f.examType === 'Regular' || f.examType === selectedExamForForm.type);
    const baseFee = regularFeeObj ? regularFeeObj.amount : (selectedExamForForm.baseFee ?? 2500);
    const backlogFeeObj = selectedExamForForm.fees?.find((f: any) => f.examType === 'Backlog');
    const backlogFee = backlogFeeObj ? backlogFeeObj.amount : (selectedExamForForm.perSubjectFee ?? 500);

    let examFeeAmount = baseFee;
    if (selectedExamForForm.type === 'Backlog' || selectedExamForForm.type === 'Supplementary') {
      examFeeAmount = selectedSubjectIds.length * backlogFee;
    }

    const now = new Date();
    const isLate = !!(selectedExamForForm.formEndDate && now > new Date(selectedExamForForm.formEndDate));
    let lateFee = 0;
    const lateRule = selectedExamForForm.lateFeeRule;
    if (isLate && lateRule && lateRule.isActive) {
      if (lateRule.calculationType === 'FIXED') lateFee = lateRule.amount;
      else if (lateRule.calculationType === 'PER_DAY') {
        const diffDays = Math.max(1, Math.ceil((now.getTime() - new Date(selectedExamForForm.formEndDate).getTime()) / 86400000));
        lateFee = diffDays * lateRule.amount;
      } else if (lateRule.calculationType === 'PERCENTAGE') {
        lateFee = (examFeeAmount * lateRule.amount) / 100;
      }
      if (lateRule.maximumAmount) lateFee = Math.min(lateFee, lateRule.maximumAmount);
    }

    return {
      examFee: examFeeAmount,
      lateFee,
      totalPayable: examFeeAmount + lateFee,
      isLate
    };
  }, [selectedExamForForm, selectedSubjectIds]);

  // Handle Save Draft
  const handleSaveDraft = () => {
    if (!selectedExamForForm) return;
    try {
      if (activeDraftForm) {
        db.updateStudentExamForm(activeDraftForm.id, {
          subjectIds: selectedSubjectIds,
          remarks: formRemarks
        }, user);
        showToastMessage('success', `Draft exam form ${activeDraftForm.formNumber} updated successfully.`);
      } else {
        const created = db.createStudentExamForm({
          examId: selectedExamForForm.id,
          subjectIds: selectedSubjectIds,
          remarks: formRemarks
        }, user);
        showToastMessage('success', `Draft exam form ${created.formNumber} saved successfully.`);
      }
      setSelectedExamForForm(null);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Failed to save draft exam form.');
    }
  };

  // Handle Final Submit
  const handleFinalSubmit = () => {
    if (!declarationAccepted) {
      showToastMessage('error', 'You must accept the confirmation declaration before submitting.');
      return;
    }

    try {
      let targetFormId = activeDraftForm?.id;
      if (!targetFormId) {
        const created = db.createStudentExamForm({
          examId: selectedExamForForm.id,
          subjectIds: selectedSubjectIds,
          remarks: formRemarks
        }, user);
        targetFormId = created.id;
      }

      db.submitStudentExamForm(targetFormId, {
        declarationAccepted: true,
        remarks: formRemarks
      }, user);

      showToastMessage('success', 'Exam Form submitted successfully! Registration is now complete.');
      setShowSubmitConfirmModal(false);
      setSelectedExamForForm(null);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Submission failed.');
    }
  };

  // Handle Online Fee Payment
  const handlePayFee = (form: ExamForm) => {
    const fee = form.totalAmount ?? form.totalFee ?? 0;
    const confirm = window.confirm(`Proceed with online examination fee payment of ₹${fee.toLocaleString('en-IN')} for Application #${form.formNumber}?`);
    if (!confirm) return;

    try {
      db.payStudentExamForm(form.id, { gateway: 'ONLINE_PORTAL' }, user);
      showToastMessage('success', `Examination fee of ₹${fee.toLocaleString('en-IN')} paid successfully.`);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Payment processing failed.');
    }
  };

  // ─── EXAM CONTROLLER ACTIONS ───

  // Start Review
  const handleStartReview = (form: ExamForm) => {
    try {
      db.reviewExamForm(form.id, user);
      showToastMessage('success', `Exam form #${form.formNumber} is now UNDER REVIEW.`);
      loadData();
      if (viewingFormDetails && viewingFormDetails.id === form.id) {
        setViewingFormDetails({ ...viewingFormDetails, status: 'UNDER_REVIEW' });
      }
    } catch (err: any) {
      showToastMessage('error', err.message || 'Failed to start review.');
    }
  };

  // Verify Form
  const handleVerifyForm = (form: ExamForm) => {
    try {
      db.verifyExamForm(form.id, { verificationRemarks: 'Verified all papers and cleared fees' }, user);
      showToastMessage('success', `Exam form #${form.formNumber} VERIFIED successfully.`);
      loadData();
      if (viewingFormDetails && viewingFormDetails.id === form.id) {
        setViewingFormDetails({ ...viewingFormDetails, status: 'VERIFIED', verifiedBy: user?.name || 'Exam Controller' });
      }
    } catch (err: any) {
      showToastMessage('error', err.message || 'Verification failed.');
    }
  };

  // Open Return / Reject Reason Modal
  const openReasonModal = (type: 'RETURN' | 'REJECT', formId?: string, isBulk = false) => {
    setReasonModal({ isOpen: true, type, formId, isBulk });
    setReasonText('');
  };

  // Confirm Return / Reject
  const handleConfirmReason = () => {
    if (!reasonText.trim()) {
      showToastMessage('error', 'Please provide a non-empty reason.');
      return;
    }

    try {
      if (reasonModal.isBulk) {
        if (reasonModal.type === 'RETURN') {
          db.bulkReturnExamForms({ formIds: selectedFormIds, returnReason: reasonText.trim() }, user);
          showToastMessage('success', `Returned ${selectedFormIds.length} forms for student correction.`);
        } else {
          db.bulkRejectExamForms({ formIds: selectedFormIds, rejectionReason: reasonText.trim() }, user);
          showToastMessage('success', `Rejected ${selectedFormIds.length} exam forms.`);
        }
        setSelectedFormIds([]);
      } else if (reasonModal.formId) {
        if (reasonModal.type === 'RETURN') {
          db.returnExamForm(reasonModal.formId, { returnReason: reasonText.trim() }, user);
          showToastMessage('success', 'Exam form returned to student for correction.');
        } else {
          db.rejectExamForm(reasonModal.formId, { rejectionReason: reasonText.trim() }, user);
          showToastMessage('success', 'Exam form rejected.');
        }
      }
      setReasonModal({ isOpen: false, type: 'RETURN' });
      setReasonText('');
      setViewingFormDetails(null);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Action failed.');
    }
  };

  // Bulk Verify
  const handleBulkVerify = () => {
    if (selectedFormIds.length === 0) return;
    const confirm = window.confirm(`Verify all ${selectedFormIds.length} selected examination forms?`);
    if (!confirm) return;

    try {
      db.bulkVerifyExamForms({ formIds: selectedFormIds, verificationRemarks: 'Bulk verified by Controller' }, user);
      showToastMessage('success', `Successfully verified ${selectedFormIds.length} exam forms.`);
      setSelectedFormIds([]);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Bulk verification failed.');
    }
  };

  // Generate Hall Ticket
  const handleGenerateHallTicket = (form: ExamForm) => {
    try {
      const ticket = db.generateHallTicket(form.id, user);
      showToastMessage('success', `Hall Ticket ${ticket.hallTicketNo} generated successfully.`);
      loadData();
      setViewingHallTicket(ticket);
    } catch (err: any) {
      showToastMessage('error', err.message || 'Hall Ticket generation failed.');
    }
  };

  // Bulk Generate Hall Tickets
  const handleBulkGenerateHallTickets = () => {
    const verifiedForms = allForms.filter(f => f.status === 'VERIFIED');
    if (verifiedForms.length === 0) {
      showToastMessage('error', 'No verified examination forms available for Hall Ticket generation.');
      return;
    }

    try {
      let count = 0;
      for (const f of verifiedForms) {
        db.generateHallTicket(f.id, user);
        count++;
      }
      showToastMessage('success', `Generated ${count} Hall Tickets for verified students.`);
      loadData();
    } catch (err: any) {
      showToastMessage('error', err.message || 'Bulk Hall Ticket generation failed.');
    }
  };

  // Filtered Exam Forms for Exam Controller Queue
  const filteredForms = useMemo(() => {
    return allForms.filter(f => {
      if (filterExam !== 'ALL' && f.examId !== filterExam) return false;
      if (filterProgram !== 'ALL' && f.programId !== filterProgram) return false;
      if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
      if (filterPaymentStatus !== 'ALL' && f.paymentStatus !== filterPaymentStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchesNumber = (f.formNumber || '').toLowerCase().includes(q);
        const matchesStudent = (f.studentName || '').toLowerCase().includes(q);
        const matchesEnrollment = (f.enrollmentNo || '').toLowerCase().includes(q);
        if (!matchesNumber && !matchesStudent && !matchesEnrollment) return false;
      }
      return true;
    });
  }, [allForms, filterExam, filterProgram, filterStatus, filterPaymentStatus, searchQuery]);

  // Dashboard KPI Metrics
  const summaryMetrics = useMemo(() => {
    return {
      total: allForms.length,
      submitted: allForms.filter(f => f.status === 'SUBMITTED').length,
      underReview: allForms.filter(f => f.status === 'UNDER_REVIEW').length,
      verified: allForms.filter(f => f.status === 'VERIFIED').length,
      returned: allForms.filter(f => f.status === 'RETURNED').length,
      rejected: allForms.filter(f => f.status === 'REJECTED').length,
      paymentPending: allForms.filter(f => f.paymentStatus === 'PENDING').length,
    };
  }, [allForms]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Toast Alert */}
      {toast && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: toast.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: toast.type === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${toast.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-md)',
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9999
          }}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={24} style={{ color: 'var(--brand-orange)' }} />
            {isStudent ? 'Student Examination Portal & Hall Tickets' : 'Exam Controller — Form Verification & Hall Tickets'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
            {isStudent
              ? 'Phase 3: Submit exam registration forms, track verification lifecycle & download official Hall Tickets.'
              : 'Phase 3: Review student submissions, verify fee clearances, handle returns/rejections, and issue Hall Tickets.'}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={loadData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* ─── STUDENT VIEW ─── */}
      {isStudent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Student Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${studentActiveTab === 'AVAILABLE' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStudentActiveTab('AVAILABLE')}
              style={{ fontWeight: 700 }}
            >
              Available Examinations ({availableExams.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${studentActiveTab === 'MY_FORMS' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStudentActiveTab('MY_FORMS')}
              style={{ fontWeight: 700 }}
            >
              My Exam Forms ({studentForms.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${studentActiveTab === 'MY_HALL_TICKETS' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setStudentActiveTab('MY_HALL_TICKETS')}
              style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <QrCode size={14} /> My Hall Tickets ({hallTickets.length})
            </button>
          </div>

          {/* Tab 1: Available Examinations (Official Table / Grid) */}
          {studentActiveTab === 'AVAILABLE' && (
            <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0 }}>
                    Eligible Examination Sessions &amp; Form Windows
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                    Official examinations published by the Controller of Examinations for your Program, Department &amp; Semester.
                  </p>
                </div>
              </div>

              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table style={{ width: 'auto', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.84375rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Examination</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Academic Year</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Semester</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Exam Session</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Form Start</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Form End</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Fee</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Status</th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableExams.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                          <Clock size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
                          <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.9375rem' }}>No Active Examination Registration Windows</div>
                          <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: '#64748B' }}>
                            There are currently no published examinations open for form submission matching your program and semester.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      availableExams.map((item, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={item.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.15s ease' }}>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontWeight: 800, color: '#0F2C59', fontSize: '0.84375rem' }}>{item.name}</div>
                              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', marginTop: '2px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--brand-orange, #F26B21)', fontWeight: 700 }}>
                                  {item.examCode}
                                </span>
                                <Badge variant={item.type === 'Regular' ? 'navy' : 'orange'}>
                                  {item.type}
                                </Badge>
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 600, color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              {item.academicYearCode || '2026-27'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2C59', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              Semester {item.semesterNumber || 4}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 600, color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              {item.session || 'Summer 2026'}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.8125rem', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              {item.formStartDate}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.8125rem', color: '#334155', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div>{item.formEndDate}</div>
                              {item.isLate && (
                                <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 700 }}>Late Fee Active</div>
                              )}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 800, color: '#0F2C59', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              ₹{item.totalPayable.toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <Badge variant={item.statusBadgeVariant || 'active'}>
                                {item.displayStatus || 'Open'}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              {item.isSubmitted ? (
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      const f = studentForms.find(sf => sf.id === item.existingFormId || sf.examId === item.id);
                                      if (f) setViewingFormDetails(f);
                                    }}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.78125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                  >
                                    <Eye size={14} /> View Form
                                  </button>
                                </div>
                              ) : item.hasDraft ? (
                                <button
                                  type="button"
                                  className="btn btn-warning btn-sm"
                                  onClick={() => {
                                    const draft = studentForms.find(sf => sf.id === item.existingFormId || sf.examId === item.id);
                                    handleOpenFormModal(item, draft);
                                  }}
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.78125rem', fontWeight: 700 }}
                                >
                                  Continue Draft
                                </button>
                              ) : !item.isFillable ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  disabled
                                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', opacity: 0.6, cursor: 'not-allowed' }}
                                >
                                  {item.timePeriodStatus === 'FORM_NOT_STARTED' ? `Opens ${item.formStartDate}` : 'Closed'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleOpenFormModal(item)}
                                  style={{ padding: '0.3rem 0.75rem', fontSize: '0.78125rem', fontWeight: 800, background: 'var(--brand-orange, #F26B21)', borderColor: 'var(--brand-orange, #F26B21)', color: '#FFFFFF', borderRadius: '6px' }}
                                >
                                  Apply / Fill Exam Form
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
          )}

          {/* Tab 2: My Exam Forms */}
          {studentActiveTab === 'MY_FORMS' && (
            <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0 }}>
                  Submitted &amp; Drafted Exam Forms
                </h3>
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table style={{ width: 'auto', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.84375rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Form Number
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Examination
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Applied Date
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Total Fee
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Payment Status
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Form Status
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentForms.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                          <FileText size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
                          <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.9375rem' }}>No Examination Forms Found</div>
                          <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: '#64748B' }}>
                            You have not submitted or drafted any examination forms yet.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      studentForms.map((form, idx) => {
                        const examObj = exams.find(e => e.id === form.examId);
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={form.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.15s ease' }}>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <strong style={{ fontFamily: 'monospace', color: 'var(--brand-orange)', fontSize: '0.84375rem', letterSpacing: '0.5px' }}>
                                {form.formNumber || form.id}
                              </strong>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <strong style={{ color: '#0F2C59', fontSize: '0.84375rem', display: 'block' }}>
                                {examObj?.name || 'Examination Session'}
                              </strong>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px', fontWeight: 600 }}>
                                Semester {form.semesterNumber || 4}
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#334155', fontWeight: 600 }}>
                              {form.appliedDate || form.createdAt}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap', fontWeight: 700, color: '#0F2C59' }}>
                              ₹{(form.totalAmount ?? form.totalFee ?? 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <Badge variant={form.paymentStatus === 'PAID' || form.paymentStatus === 'COMPLETED' || form.paymentStatus === 'WAIVED' || form.paymentStatus === 'SUCCESS' ? 'active' : 'warning'}>
                                {form.paymentStatus}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <Badge variant={form.status === 'VERIFIED' ? 'active' : form.status === 'SUBMITTED' ? 'navy' : form.status === 'RETURNED' ? 'warning' : form.status === 'REJECTED' ? 'danger' : 'inactive'}>
                                {form.status}
                              </Badge>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {form.status === 'DRAFT' && (
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() => {
                                      if (examObj) handleOpenFormModal(examObj, form);
                                    }}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    Continue Draft
                                  </button>
                                )}
                                {form.status === 'RETURNED' && (
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    onClick={() => {
                                      if (examObj) handleOpenFormModal(examObj, form);
                                    }}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    Edit &amp; Resubmit
                                  </button>
                                )}
                                {form.paymentStatus === 'PENDING' && (form.totalAmount ?? form.totalFee ?? 0) > 0 && form.status !== 'DRAFT' && (
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm"
                                    onClick={() => handlePayFee(form)}
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem', background: '#059669', color: '#FFF', fontWeight: 700 }}
                                  >
                                    <IndianRupee size={12} /> Pay ₹{(form.totalAmount ?? form.totalFee ?? 0).toLocaleString('en-IN')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setViewingFormDetails(form)}
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.78125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                  <Eye size={14} /> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: My Hall Tickets */}
          {studentActiveTab === 'MY_HALL_TICKETS' && (
            <div className="card" style={{ padding: '1.25rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0 }}>
                  Official Hall Tickets
                </h3>
              </div>
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
                <table style={{ width: 'auto', borderCollapse: 'collapse', border: '1px solid #CBD5E1', fontSize: '0.84375rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Hall Ticket No
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Examination
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Issue Date
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Centre &amp; Seat
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', borderRight: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>
                        Status
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 800, color: '#0F2C59', textTransform: 'uppercase', fontSize: '0.6875rem', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem 1.5rem', color: '#64748B', background: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
                          <FileText size={32} style={{ margin: '0 auto 0.5rem auto', color: '#94A3B8' }} />
                          <div style={{ fontWeight: 700, color: '#0F2C59', fontSize: '0.9375rem' }}>No Hall Tickets Issued Yet</div>
                          <div style={{ fontSize: '0.8125rem', marginTop: '4px', color: '#64748B' }}>
                            Hall Tickets become available after your exam form is verified by the Examination Section.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      hallTickets.map((ticket, idx) => {
                        const isEven = idx % 2 === 0;
                        return (
                          <tr key={ticket.id} style={{ background: isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.15s ease' }}>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <strong style={{ fontFamily: 'monospace', color: 'var(--brand-orange)', fontSize: '0.84375rem', letterSpacing: '0.5px' }}>
                                {ticket.hallTicketNo}
                              </strong>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <strong style={{ color: '#0F2C59', fontSize: '0.84375rem', display: 'block' }}>
                                {ticket.examSessionName}
                              </strong>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap', color: '#334155', fontWeight: 600 }}>
                              {ticket.issueDate}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle' }}>
                              <div style={{ fontWeight: 600, color: '#1E293B' }}>
                                {ticket.centreName || 'SSIU Main Centre'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '1px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>Seat:</span>
                                <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>
                                  {ticket.seatNumber || 'Seat Allocated'}
                                </strong>
                              </div>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <Badge variant="active">{ticket.status}</Badge>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => setViewingHallTicket(ticket)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, padding: '0.3rem 0.65rem', fontSize: '0.78125rem', background: 'var(--brand-orange)', borderColor: 'var(--brand-orange)', color: '#FFFFFF', borderRadius: '6px' }}
                              >
                                <Printer size={14} /> View &amp; Print
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
          )}
        </div>
      ) : (
        /* ─── EXAM CONTROLLER / STAFF VIEW ─── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Dashboard Summary Cards */}
          <div className="grid-4" style={{ gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid var(--brand-navy)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Applications</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)' }}>{summaryMetrics.total}</div>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Submitted / Under Review</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1E40AF' }}>{summaryMetrics.submitted + summaryMetrics.underReview}</div>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Verified &amp; Cleared</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#047857' }}>{summaryMetrics.verified}</div>
            </div>
            <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Returned / Pending Fee</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#B45309' }}>{summaryMetrics.returned + summaryMetrics.paymentPending}</div>
            </div>
          </div>

          {/* Navigation Tabs (Staff) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${staffActiveTab === 'QUEUE' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStaffActiveTab('QUEUE')}
                style={{ fontWeight: 700 }}
              >
                Verification Queue ({filteredForms.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${staffActiveTab === 'HALL_TICKETS' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setStaffActiveTab('HALL_TICKETS')}
                style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <QrCode size={14} /> Hall Tickets Issued ({hallTickets.length})
              </button>
            </div>

            {staffActiveTab === 'HALL_TICKETS' && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleBulkGenerateHallTickets}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <Sparkles size={14} /> Bulk Generate Hall Tickets
              </button>
            )}
          </div>

          {staffActiveTab === 'QUEUE' ? (
            <>
              {/* Filter & Search Bar */}
              <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 2, minWidth: '220px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input"
                    placeholder="Search by Form #, Student Name, Enrollment..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '2.25rem', width: '100%' }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: '150px' }}>
                  <select className="select" value={filterExam} onChange={e => setFilterExam(e.target.value)} style={{ width: '100%' }}>
                    <option value="ALL">All Examinations</option>
                    {exams.map(e => (
                      <option key={e.id} value={e.id}>{e.code || e.examCode} - {e.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '140px' }}>
                  <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: '100%' }}>
                    <option value="ALL">All Form Status</option>
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="RETURNED">RETURNED</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '140px' }}>
                  <select className="select" value={filterPaymentStatus} onChange={e => setFilterPaymentStatus(e.target.value)} style={{ width: '100%' }}>
                    <option value="ALL">All Payment Status</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PAID">PAID / SUCCESS</option>
                    <option value="WAIVED">WAIVED</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Toolbar */}
              {selectedFormIds.length > 0 && (
                <div style={{ padding: '0.75rem 1.25rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#1E40AF', fontSize: '0.875rem' }}>
                    {selectedFormIds.length} examination form(s) selected
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={handleBulkVerify}
                      style={{ background: '#059669', color: '#FFF', fontWeight: 700 }}
                    >
                      <CheckCircle size={14} /> Bulk Verify
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => openReasonModal('RETURN', undefined, true)}
                      style={{ fontWeight: 700 }}
                    >
                      <RotateCcw size={14} /> Bulk Return
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => openReasonModal('REJECT', undefined, true)}
                      style={{ fontWeight: 700 }}
                    >
                      <Ban size={14} /> Bulk Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Verification Queue Table (Official 12-Column Table) */}
              <div className="card" style={{ padding: '1.25rem', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#FFFFFF', borderRadius: '8px' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                        <th style={{ width: '38px', padding: '0.625rem 0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                          <input
                            type="checkbox"
                            checked={filteredForms.length > 0 && selectedFormIds.length === filteredForms.length}
                            onChange={e => {
                              if (e.target.checked) setSelectedFormIds(filteredForms.map(f => f.id));
                              else setSelectedFormIds([]);
                            }}
                          />
                        </th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Application No.</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Student Name</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Enrollment No.</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Department</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Program</th>
                        <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Semester</th>
                        <th style={{ padding: '0.625rem 0.75rem', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Examination</th>
                        <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Fee Status</th>
                        <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Application Status</th>
                        <th style={{ padding: '0.625rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>Submission Date</th>
                        <th style={{ padding: '0.625rem 0.75rem', textAlign: 'right', fontWeight: 800 }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredForms.length === 0 ? (
                        <tr>
                          <td colSpan={12} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            No examination applications found matching the selected filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredForms.map((form, fIdx) => {
                          const examObj = exams.find(e => e.id === form.examId);
                          const studentObj = students.find(s => s.id === form.studentId || s.enrollmentNo === form.enrollmentNo);
                          const progObj = programs.find(p => p.id === (form.programId || studentObj?.programId || examObj?.programId));
                          const deptObj = departments.find(d => d.id === (studentObj?.departmentId || progObj?.departmentId || examObj?.departmentId));
                          const isSelected = selectedFormIds.includes(form.id);
                          const isEven = fIdx % 2 === 0;

                          return (
                            <tr key={form.id} style={{ background: isSelected ? '#EFF6FF' : isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                              <td style={{ textAlign: 'center', padding: '0.5rem', borderRight: '1px solid #E2E8F0' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={e => {
                                    if (e.target.checked) setSelectedFormIds([...selectedFormIds, form.id]);
                                    else setSelectedFormIds(selectedFormIds.filter(id => id !== form.id));
                                  }}
                                />
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                                <strong style={{ fontFamily: 'monospace', color: '#F37023', fontSize: '0.8125rem' }}>
                                  {form.formNumber || form.id}
                                </strong>
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2C59' }}>
                                {form.studentName || studentObj?.name || 'Student'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontFamily: 'monospace', fontWeight: 700, color: '#0F2C59' }}>
                                {form.enrollmentNo || studentObj?.enrollmentNo || 'N/A'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                                {deptObj?.name || 'Computer Engineering'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0', fontSize: '0.78125rem' }}>
                                {progObj?.name || 'B.Tech CSE'}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#0F2C59' }}>
                                Sem {form.semesterNumber || 4}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                                <div style={{ fontWeight: 600, color: '#0F2C59' }}>{examObj?.name || 'Exam Session'}</div>
                                <div style={{ fontSize: '0.71875rem', color: '#64748B', fontFamily: 'monospace' }}>{examObj?.examCode || examObj?.code}</div>
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                <Badge variant={form.paymentStatus === 'PAID' || form.paymentStatus === 'COMPLETED' || form.paymentStatus === 'WAIVED' || form.paymentStatus === 'SUCCESS' ? 'active' : 'warning'}>
                                  {form.paymentStatus || 'PENDING'}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                                <Badge variant={form.status === 'VERIFIED' ? 'active' : form.status === 'SUBMITTED' ? 'navy' : form.status === 'UNDER_REVIEW' ? 'warning' : form.status === 'RETURNED' ? 'warning' : form.status === 'REJECTED' ? 'danger' : 'inactive'}>
                                  {form.status === 'UNDER_REVIEW' ? 'UNDER VERIFICATION' : form.status}
                                </Badge>
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#64748B' }}>
                                {form.submittedAt || form.appliedDate || form.createdAt || 'N/A'}
                              </td>
                              <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    title="Review & Verify"
                                    onClick={() => setViewingFormDetails(form)}
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', fontWeight: 700 }}
                                  >
                                    <Eye size={14} /> Review
                                  </button>
                                  {form.status === 'VERIFIED' && (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      title="Generate Hall Ticket"
                                      onClick={() => handleGenerateHallTicket(form)}
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.71875rem', fontWeight: 800, background: '#F37023', borderColor: '#F37023' }}
                                    >
                                      <QrCode size={12} /> Ticket
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* Hall Tickets Management Tab */
            <div className="card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-surface-hover)' }}>
                      <th>Hall Ticket Number</th>
                      <th>Student</th>
                      <th>Enrollment No</th>
                      <th>Examination</th>
                      <th>Issue Date</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallTickets.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                          No Hall Tickets generated yet. Click "Bulk Generate Hall Tickets" to issue tickets for verified forms.
                        </td>
                      </tr>
                    ) : (
                      hallTickets.map(ticket => (
                        <tr key={ticket.id}>
                          <td>
                            <strong style={{ fontFamily: 'monospace', color: 'var(--brand-orange)' }}>
                              {ticket.hallTicketNo}
                            </strong>
                          </td>
                          <td><strong>{ticket.student?.name || ticket.studentId}</strong></td>
                          <td><span style={{ fontFamily: 'monospace' }}>{ticket.student?.enrollmentNo || 'EN2024CSE001'}</span></td>
                          <td>{ticket.examSessionName}</td>
                          <td>{ticket.issueDate}</td>
                          <td><Badge variant="active">{ticket.status}</Badge></td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setViewingHallTicket(ticket)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <Printer size={14} /> View Hall Ticket
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── EXAM CONTROLLER FORM REVIEW & VERIFICATION MODAL ─── */}
      {viewingFormDetails && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
                  Examination Form Review &amp; Verification
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  {viewingFormDetails.formNumber || viewingFormDetails.id}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setViewingFormDetails(null)} style={{ color: '#FFFFFF' }}>
                <XCircle size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
              
              {/* Status Header */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Badge variant={viewingFormDetails.status === 'VERIFIED' ? 'active' : viewingFormDetails.status === 'SUBMITTED' ? 'navy' : viewingFormDetails.status === 'RETURNED' ? 'warning' : 'danger'}>
                    Form Status: {viewingFormDetails.status}
                  </Badge>
                  <Badge variant={viewingFormDetails.paymentStatus === 'PAID' || viewingFormDetails.paymentStatus === 'COMPLETED' || viewingFormDetails.paymentStatus === 'WAIVED' || viewingFormDetails.paymentStatus === 'SUCCESS' ? 'active' : 'warning'}>
                    Fee Clearance: {viewingFormDetails.paymentStatus}
                  </Badge>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Submitted on: {viewingFormDetails.submittedAt || viewingFormDetails.appliedDate || viewingFormDetails.createdAt}
                </span>
              </div>

              {/* Return / Reject Reason Banner if present */}
              {viewingFormDetails.returnReason && (
                <div style={{ padding: '0.85rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 'var(--radius-md)', color: '#92400E' }}>
                  <strong>⚠️ Returned for Correction Reason:</strong> {viewingFormDetails.returnReason}
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Returned by: {viewingFormDetails.returnedBy} ({viewingFormDetails.returnedAt})</div>
                </div>
              )}
              {viewingFormDetails.rejectionReason && (
                <div style={{ padding: '0.85rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', color: '#991B1B' }}>
                  <strong>❌ Rejection Reason:</strong> {viewingFormDetails.rejectionReason}
                  <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Rejected by: {viewingFormDetails.rejectedBy} ({viewingFormDetails.rejectedAt})</div>
                </div>
              )}

              {/* Student & Exam Info */}
              <div className="grid-2 card" style={{ padding: '1rem', background: '#F8FAFC' }}>
                <div>
                  <div><strong>Student Name:</strong> {viewingFormDetails.studentName}</div>
                  <div><strong>Enrollment Number:</strong> {viewingFormDetails.enrollmentNo}</div>
                  <div><strong>Semester:</strong> Semester {viewingFormDetails.semesterNumber || 4}</div>
                </div>
                <div>
                  <div><strong>Total Payable Fee:</strong> ₹{(viewingFormDetails.totalAmount ?? viewingFormDetails.totalFee ?? 0).toLocaleString('en-IN')}</div>
                  <div><strong>Late Fee Component:</strong> ₹{(viewingFormDetails.lateFeeAmount ?? viewingFormDetails.lateFee ?? 0).toLocaleString('en-IN')}</div>
                  <div><strong>Payment Txn ID:</strong> {viewingFormDetails.paymentTransactionId || viewingFormDetails.transactionId || 'N/A'}</div>
                </div>
              </div>

              {/* Enrolled Papers */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Enrolled Subjects &amp; Papers ({viewingFormDetails.formSubjects?.length || viewingFormDetails.regularSubjects?.length || 0})
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-surface-hover)' }}>
                        <th>Subject Code</th>
                        <th>Subject Name</th>
                        <th>Credits</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewingFormDetails.formSubjects || []).map((sub, sIdx) => (
                        <tr key={sub.subjectId || sIdx}>
                          <td><strong>{sub.subjectCode || 'SUB'}</strong></td>
                          <td>{sub.subjectName || sub.subjectId}</td>
                          <td>{sub.credits || 3}</td>
                          <td><Badge variant="navy">{sub.status || 'ENROLLED'}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Verification Audit History */}
              {viewingFormDetails.verifiedAt && (
                <div style={{ padding: '0.75rem 1rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#065F46' }}>
                  ✓ <strong>Verified By:</strong> {viewingFormDetails.verifiedBy} on {viewingFormDetails.verifiedAt}
                  {viewingFormDetails.verificationRemarks && <div>Remarks: {viewingFormDetails.verificationRemarks}</div>}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingFormDetails(null)}
              >
                Close
              </button>

              {isController && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {viewingFormDetails.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStartReview(viewingFormDetails)}
                      style={{ fontWeight: 700 }}
                    >
                      Start Review
                    </button>
                  )}
                  {['SUBMITTED', 'UNDER_REVIEW'].includes(viewingFormDetails.status) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => openReasonModal('RETURN', viewingFormDetails.id)}
                        style={{ fontWeight: 700 }}
                      >
                        <RotateCcw size={14} /> Return for Correction
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => openReasonModal('REJECT', viewingFormDetails.id)}
                        style={{ fontWeight: 700 }}
                      >
                        <Ban size={14} /> Reject
                      </button>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => handleVerifyForm(viewingFormDetails)}
                        style={{ background: '#059669', color: '#FFF', fontWeight: 800 }}
                      >
                        <CheckCircle size={14} /> Verify &amp; Approve
                      </button>
                    </>
                  )}
                  {viewingFormDetails.status === 'VERIFIED' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleGenerateHallTicket(viewingFormDetails)}
                      style={{ fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <QrCode size={14} /> Generate Official Hall Ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── RETURN / REJECT REASON MODAL ─── */}
      {reasonModal.isOpen && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '90%', maxWidth: '480px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-navy)', margin: '0 0 0.5rem 0' }}>
              {reasonModal.type === 'RETURN' ? 'Return Examination Form for Student Correction' : 'Reject Examination Form'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Please enter a mandatory justification reason which will be visible to the student in their portal.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label className="label">Mandatory Reason <span style={{ color: 'red' }}>*</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder={reasonModal.type === 'RETURN' ? 'e.g. Backlog course code selected is incorrect for current semester...' : 'e.g. Statutory minimum attendance criteria not met...'}
                value={reasonText}
                onChange={e => setReasonText(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setReasonModal({ isOpen: false, type: 'RETURN' })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn btn-sm ${reasonModal.type === 'RETURN' ? 'btn-warning' : 'btn-danger'}`}
                onClick={handleConfirmReason}
                style={{ fontWeight: 800 }}
              >
                {reasonModal.type === 'RETURN' ? 'Confirm Return' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE OFFICIAL HALL TICKET MODAL ─── */}
      {viewingHallTicket && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '96%', maxWidth: '850px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', padding: 0 }}>
            
            {/* Modal Controls Header */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--brand-navy)', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={20} style={{ color: 'var(--brand-orange)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Official Hall Ticket / Admit Card — {viewingHallTicket.hallTicketNo}
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewingHallTicket(null)} style={{ color: '#FFFFFF' }}>
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div style={{ padding: '2rem', overflowY: 'auto', background: '#FFFFFF', color: '#0F172A', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* University Header & Logo */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--brand-navy)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
                    SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    BHUYAN RAJPUT ROAD, GANDHINAGAR - 382420, GUJARAT, INDIA
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-orange)', marginTop: '0.25rem' }}>
                    OFFICIAL EXAMINATION ADMIT CARD / HALL TICKET
                  </div>
                </div>

                {/* QR Code container */}
                <div style={{ textAlign: 'center', border: '1px solid #CBD5E1', padding: '0.5rem', borderRadius: 'var(--radius-md)', background: '#F8FAFC' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>OFFICIAL VERIFICATION</div>
                  <div style={{ width: '70px', height: '70px', background: '#0F172A', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '0.6rem', fontWeight: 700, textAlign: 'center', padding: '0.25rem' }}>
                    [QR CODE: {viewingHallTicket.verificationCode?.substring(0, 10)}]
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--brand-orange)', marginTop: '0.25rem' }}>
                    {viewingHallTicket.verificationCode?.substring(0, 12)}
                  </div>
                </div>
              </div>

              {/* Student and Examination Details Grid */}
              <div className="grid-2" style={{ gap: '1rem', background: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Student Name:</strong> {viewingHallTicket.student?.name || currentStudent?.name || user?.name}</div>
                  <div><strong>Enrollment Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{viewingHallTicket.student?.enrollmentNo || currentStudent?.enrollmentNo || 'EN2024CSE001'}</span></div>
                  <div><strong>Program:</strong> B.Tech Computer Engineering</div>
                  <div><strong>Department:</strong> Department of Computer Engineering</div>
                  <div><strong>Semester:</strong> Semester 4</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div><strong>Examination:</strong> {viewingHallTicket.examSessionName}</div>
                  <div><strong>Hall Ticket No:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-orange)' }}>{viewingHallTicket.hallTicketNo}</span></div>
                  <div><strong>Exam Centre:</strong> {viewingHallTicket.centreName || 'SSIU Main Examination Centre'}</div>
                  <div><strong>Allocated Room:</strong> {viewingHallTicket.roomNumber || 'ROOM-102 (Floor 1)'}</div>
                  <div><strong>Allocated Seat:</strong> <strong style={{ color: 'var(--brand-navy)' }}>{viewingHallTicket.seatNumber || 'S-42'}</strong></div>
                  <div><strong>Issue Date:</strong> {viewingHallTicket.issueDate}</div>
                </div>
              </div>

              {/* Scheduled Papers Table */}
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                  Authorized Examination Schedule &amp; Papers
                </h4>
                <table className="table" style={{ fontSize: '0.82rem', width: '100%', border: '1px solid #E2E8F0' }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9' }}>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Exam Date</th>
                      <th>Time Slot</th>
                      <th>Room &amp; Seat</th>
                      <th>Invigilator Sign</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>CE401</strong></td>
                      <td>Data Structures &amp; Algorithms</td>
                      <td>2026-11-02</td>
                      <td>10:00 AM - 01:00 PM</td>
                      <td>ROOM-102 (S-42)</td>
                      <td style={{ borderBottom: '1px dashed #94A3B8' }}></td>
                    </tr>
                    <tr>
                      <td><strong>CE402</strong></td>
                      <td>Database Management Systems</td>
                      <td>2026-11-05</td>
                      <td>10:00 AM - 01:00 PM</td>
                      <td>ROOM-102 (S-42)</td>
                      <td style={{ borderBottom: '1px dashed #94A3B8' }}></td>
                    </tr>
                    <tr>
                      <td><strong>CE403</strong></td>
                      <td>Operating Systems &amp; Virtualization</td>
                      <td>2026-11-09</td>
                      <td>10:00 AM - 01:00 PM</td>
                      <td>ROOM-102 (S-42)</td>
                      <td style={{ borderBottom: '1px dashed #94A3B8' }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Instructions & Signatures */}
              <div style={{ borderTop: '1px solid #CBD5E1', paddingTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>
                <strong>Important Candidate Instructions:</strong>
                <ol style={{ paddingLeft: '1.25rem', margin: '0.25rem 0' }}>
                  <li>Candidates must carry this official Admit Card along with their valid University Photo Identity Card.</li>
                  <li>Entry into the examination centre is strictly permitted up to 15 minutes before commencement.</li>
                  <li>Electronic gadgets, mobile phones, and programmable calculators are strictly prohibited.</li>
                </ol>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '1.5rem' }}>
                <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '180px', paddingTop: '0.25rem', fontSize: '0.75rem' }}>
                  Student Signature
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #000', width: '220px', paddingTop: '0.25rem', fontSize: '0.75rem' }}>
                  <strong>Controller of Examinations</strong>
                  <div>Swarrnim University</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setViewingHallTicket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STUDENT FILL EXAM FORM MODAL (OFFICIAL UNIVERSITY ADMINISTRATIVE DOCUMENT) ─── */}
      {selectedExamForForm && (
        <div className="modal-backdrop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050, position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '840px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #CBD5E1', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)', overflow: 'hidden', padding: 0 }}>
            
            {/* Header */}
            <div style={{ padding: '1.25rem 1.75rem', background: '#0F2C59', color: '#FFFFFF', borderTop: '4px solid #F37023', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <span style={{ fontSize: '0.71875rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#F37023', fontWeight: 800 }}>
                  {activeDraftForm ? 'Edit / Complete Draft Exam Application' : 'Student Examination Form Registration'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0 0', color: '#FFFFFF' }}>
                  {selectedExamForForm.name || 'End Semester Examination'} ({selectedExamForForm.code || selectedExamForForm.examCode})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamForForm(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#94A3B8'; }}
              >
                <XCircle size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: '#F8FAFC' }}>
              
              {/* SECTION 1: Student Profile & Academic Mapping */}
              <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', fontWeight: 800, fontSize: '0.8125rem', color: '#0F2C59', textTransform: 'uppercase' }}>
                  1. Candidate Academic Profile
                </div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Student Name:</span>
                    <div style={{ fontWeight: 800, color: '#0F2C59' }}>{currentStudent?.name || user?.name || 'Student Name'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Enrollment No:</span>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>{currentStudent?.enrollmentNo || user?.enrollmentNo || '—'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Program:</span>
                    <div style={{ fontWeight: 700 }}>{programs.find(p => p.id === (selectedExamForForm.programId || currentStudent?.programId))?.name || 'B.Tech CSE'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Department:</span>
                    <div style={{ fontWeight: 700 }}>{departments.find(d => d.id === (selectedExamForForm.departmentId || currentStudent?.departmentId))?.name || 'Computer Engineering'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Semester:</span>
                    <div style={{ fontWeight: 800, color: '#0F2C59' }}>Semester {selectedExamForForm.semesterNumber || (semesters.find(s => s.id === currentStudent?.semesterId)?.number) || (currentStudent as any)?.semesterNumber || 4}</div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Examination Details & Dates */}
              <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', fontWeight: 800, fontSize: '0.8125rem', color: '#0F2C59', textTransform: 'uppercase' }}>
                  2. Examination Details &amp; Important Dates
                </div>
                <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ color: '#64748B' }}>Examination:</span>
                    <div style={{ fontWeight: 700 }}>{selectedExamForForm.name}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Session:</span>
                    <div style={{ fontWeight: 700 }}>{selectedExamForForm.session || 'Summer 2026'} ({selectedExamForForm.academicYearCode || '2026-27'})</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Examination Code:</span>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F2C59' }}>{selectedExamForForm.examCode || selectedExamForForm.code}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Form Window:</span>
                    <div style={{ fontWeight: 700, color: '#047857' }}>{selectedExamForForm.formStartDate} to {selectedExamForForm.formEndDate}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Late Fee Deadline:</span>
                    <div style={{ fontWeight: 700, color: selectedExamForForm.lateFeeEndDate ? '#D97706' : '#64748B' }}>{selectedExamForForm.lateFeeEndDate || 'N/A'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748B' }}>Exam Conduct Dates:</span>
                    <div style={{ fontWeight: 700 }}>{selectedExamForForm.startDate} to {selectedExamForForm.endDate}</div>
                  </div>
                </div>
                {selectedExamForForm.instructions && (
                  <div style={{ padding: '0.5rem 1rem', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                    <strong>General Instructions:</strong> {selectedExamForForm.instructions}
                  </div>
                )}
              </div>

              {/* Fee Breakdown Alert */}
              <div style={{ padding: '0.875rem 1.25rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Total Examination Registration Fee:</div>
                  <strong style={{ fontSize: '1.25rem', color: '#0F2C59' }}>₹{formFeeSummary.totalPayable.toLocaleString('en-IN')}</strong>
                </div>
                {formFeeSummary.isLate && (
                  <Badge variant="warning">
                    ⚠️ Late Fee Applied (+₹{formFeeSummary.lateFee})
                  </Badge>
                )}
              </div>

              {/* SECTION 3: Subject Selection Table with Attendance 75% Rule */}
              <div style={{ background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1', overflow: 'hidden' }}>
                <div style={{ padding: '0.5rem 1rem', background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.8125rem', color: '#0F2C59', textTransform: 'uppercase' }}>
                    3. Configured Examination Course Papers &amp; Attendance Gate
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    Statutory Rule: Minimum 75% Attendance Required
                  </span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.8125rem', margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#0F2C59', color: '#FFFFFF' }}>
                        <th style={{ width: '40px', textAlign: 'center', padding: '0.5rem' }}>Select</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Subject Code</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>Subject Name</th>
                        <th style={{ padding: '0.5rem', textAlign: 'center' }}>Attendance %</th>
                        <th style={{ padding: '0.5rem 0.75rem' }}>75% Gate Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedExamForForm.subjects && selectedExamForForm.subjects.length > 0
                        ? selectedExamForForm.subjects
                        : db.getSubjects().slice(0, 4)
                      ).map((subj: any, sIdx: number) => {
                        const sId = subj.subjectId || subj.id;
                        const sCode = subj.subjectCode || subj.code;
                        const sName = subj.subjectName || subj.name;
                        
                        const elig = attendanceApprovalService.checkSubjectExamEligibility(currentStudent?.id || user?.id || 'stu-1', sId);
                        const isSelected = selectedSubjectIds.includes(sId);
                        const isEven = sIdx % 2 === 0;

                        return (
                          <tr key={sId} style={{ background: !elig.isEligible ? '#FEF2F2' : isEven ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ textAlign: 'center', padding: '0.4rem', borderRight: '1px solid #E2E8F0' }}>
                              <input
                                type="checkbox"
                                checked={isSelected && elig.isEligible}
                                disabled={!elig.isEligible}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedSubjectIds([...selectedSubjectIds, sId]);
                                  } else {
                                    setSelectedSubjectIds(selectedSubjectIds.filter(id => id !== sId));
                                  }
                                }}
                              />
                            </td>
                            <td style={{ padding: '0.4rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                              <strong style={{ fontFamily: 'monospace', color: '#0F2C59' }}>{sCode}</strong>
                            </td>
                            <td style={{ padding: '0.4rem 0.75rem', borderRight: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>
                              {sName}
                            </td>
                            <td style={{ padding: '0.4rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                              <strong style={{ color: elig.percentage >= 75 ? '#059669' : '#DC2626' }}>
                                {elig.percentage}%
                              </strong>
                            </td>
                            <td style={{ padding: '0.4rem 0.75rem' }}>
                              {elig.isEligible ? (
                                <Badge variant={elig.status === 'CONDONED_APPROVAL' ? 'navy' : 'active'}>
                                  {elig.status === 'CONDONED_APPROVAL' ? '✓ Eligible Through Approval' : '✓ 75% Cleared'}
                                </Badge>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <Badge variant="danger">Blocked (&lt; 75%)</Badge>
                                    <span style={{ fontSize: '0.71875rem', fontWeight: 600, color: '#DC2626' }}>
                                      Attendance not met ({elig.percentage}% &lt; {elig.requiredPercentage}%)
                                    </span>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks */}
              <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Candidate Remarks (Optional)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Applying for regular semester 4 examination session..."
                  value={formRemarks}
                  onChange={e => setFormRemarks(e.target.value)}
                  style={{ width: '100%', height: '36px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}
                />
              </div>

              {/* Declaration */}
              <div style={{ padding: '0.875rem', background: '#FEF3C7', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', color: '#92400E', fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={declarationAccepted}
                    onChange={e => setDeclarationAccepted(e.target.checked)}
                    style={{ marginTop: '0.15rem' }}
                  />
                  <span>
                    I hereby declare that all course papers selected above meet university attendance requirements or have official sanctions, and information submitted is authentic.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{ padding: '1rem 1.75rem', background: '#F8FAFC', borderTop: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedExamForForm(null)}
                style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem', fontWeight: 600, background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#64748B' }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleSaveDraft}
                  style={{ padding: '0.45rem 0.875rem', fontSize: '0.8125rem', fontWeight: 700, background: '#FFFFFF', border: '1px solid #0F2C59', color: '#0F2C59' }}
                >
                  <Save size={14} /> Save Draft
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={!declarationAccepted || selectedSubjectIds.length === 0}
                  onClick={handleFinalSubmit}
                  style={{ padding: '0.45rem 1.125rem', fontSize: '0.8125rem', fontWeight: 800, background: '#F37023', borderColor: '#F37023', color: '#FFFFFF' }}
                >
                  <Send size={14} /> Submit Examination Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

