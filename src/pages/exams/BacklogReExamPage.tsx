import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { BacklogSubjectEntry } from '../../types';
import {
  RotateCcw, CheckCircle, XCircle, CreditCard,
  ChevronRight, Info, ShieldAlert,
  ArrowRight, ArrowLeft, Trash2, Check, Download,
  Printer, Lock, Building2, UserCheck, AlertCircle,
  QrCode, Landmark
} from 'lucide-react';

const EXAM_TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  BACKLOG: { label: 'Backlog', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' },
  ATKT:    { label: 'ATKT', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
  RE_EXAM: { label: 'Re-Exam', color: '#7C3AED', bg: '#EDE9FE', border: '#DDD6FE' }
};

const PROCESSING_FEE = 50;

interface BacklogReExamPageProps {
  setActiveTab?: (tab: string) => void;
}

export const BacklogReExamPage: React.FC<BacklogReExamPageProps> = ({ setActiveTab }) => {
  const { user, role } = useAuth();
  const students = db.getStudents();
  const exams = db.getExams();

  const isStudent = role === 'STUDENT';
  const isController = ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'EXAM_CELL', 'REGISTRAR', 'PRINCIPAL', 'HOD', 'DEPUTY_REGISTRAR'].includes(role || '');

  const currentStudent = useMemo(() => {
    if (!isStudent) return null;
    const found = students.find(s => s.id === user?.id || s.email === user?.email || s.enrollmentNo === (user as any)?.enrollmentNo);
    if (found) return found;
    // Fallback for demo student
    return students[0] || {
      id: 'stu-1',
      name: user?.name || 'ABC Student 1',
      enrollmentNo: (user as any)?.enrollmentNo || 'STUDENT-001',
      email: user?.email || 'abc.student1@ssiu-demo.ac.in',
      programId: 'prog-1',
      semesterId: 'sem-cse-4',
      batchId: 'batch-2023',
      divisionId: 'div-a',
      rollNo: '01',
      status: 'ACTIVE' as const
    };
  }, [students, user, isStudent]);

  // Backlog exams list
  const backlogExams = useMemo(() => {
    return exams.filter(e =>
      e.type === 'Backlog' || e.type === 'BACKLOG' ||
      e.type === 'Re-Examination' || e.type === 'RE_EXAM' ||
      e.type === 'Supplementary' || e.type === 'ATKT'
    );
  }, [exams]);

  // Eligible backlog subjects for this student
  const backlogSubjects = useMemo(() => {
    const studentId = currentStudent?.id || 'stu-1';
    return db.getStudentEligibleBacklogSubjects(studentId);
  }, [currentStudent]);

  const eligibleSubjects = useMemo(() => backlogSubjects.filter(s => s.eligibility === 'ELIGIBLE'), [backlogSubjects]);
  const ineligibleSubjects = useMemo(() => backlogSubjects.filter(s => s.eligibility !== 'ELIGIBLE'), [backlogSubjects]);

  // Application State
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(backlogExams[0]?.id || 'exam-backlog-1');
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [upiId, setUpiId] = useState('student@okicici');
  const [selectedBank, setSelectedBank] = useState('SBI');
  const [step, setStep] = useState<'SELECT' | 'REVIEW' | 'PAYMENT' | 'DONE'>('SELECT');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Submitted Receipt Details
  const [applicationNumber, setApplicationNumber] = useState('');
  const [txnId, setTxnId] = useState('');
  const [submittedDate, setSubmittedDate] = useState('');
  const [submittedSubjects, setSubmittedSubjects] = useState<BacklogSubjectEntry[]>([]);
  const [submittedAmount, setSubmittedAmount] = useState({ examFee: 0, processingFee: 0, total: 0 });

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Selected subjects objects
  const selectedSubjectsList = useMemo(() => {
    return eligibleSubjects.filter(s => selectedSubjectIds.includes(s.subjectId));
  }, [eligibleSubjects, selectedSubjectIds]);

  // Calculations
  const examFeeTotal = useMemo(() => {
    return selectedSubjectsList.reduce((sum, s) => sum + (s.fee || 750), 0);
  }, [selectedSubjectsList]);

  const totalPayable = useMemo(() => {
    return selectedSubjectsList.length > 0 ? examFeeTotal + PROCESSING_FEE : 0;
  }, [selectedSubjectsList, examFeeTotal]);

  // Toggle single subject selection
  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  // Select all / Deselect all
  const isAllSelected = eligibleSubjects.length > 0 && selectedSubjectIds.length === eligibleSubjects.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(eligibleSubjects.map(s => s.subjectId));
    }
  };

  // Remove subject from Review table
  const handleRemoveSubject = (subjectId: string) => {
    const updated = selectedSubjectIds.filter(id => id !== subjectId);
    setSelectedSubjectIds(updated);
    if (updated.length === 0) {
      showToast('info', 'All subjects removed. Returning to selection step.');
      setStep('SELECT');
    }
  };

  // Step 1 -> Step 2 Validation & Navigation
  const handleContinueToReview = () => {
    if (selectedSubjectIds.length === 0) {
      showToast('error', 'Validation Error: Please select at least one eligible subject to proceed.');
      return;
    }
    setStep('REVIEW');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 Navigation
  const handleProceedToPayment = () => {
    if (selectedSubjectIds.length === 0) {
      showToast('error', 'Cannot proceed with 0 subjects selected.');
      setStep('SELECT');
      return;
    }
    setStep('PAYMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 3 -> Step 4 Payment Simulation
  const handleSimulatePayment = () => {
    if (selectedSubjectsList.length === 0) {
      showToast('error', 'No subjects selected for payment.');
      setStep('SELECT');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('Initiating secure encrypted university gateway handshake...');

    const generatedTxnId = `TXN-SSIU-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const generatedAppNo = `APP/BL/2026/${String(Math.floor(100000 + Math.random() * 900000))}`;
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    setTimeout(() => {
      setProcessingStage('Verifying university fee ledger & authorization...');
    }, 400);

    setTimeout(() => {
      setProcessingStage('Generating university examination application record...');
    }, 800);

    setTimeout(() => {
      // Save application into DB
      db.submitBacklogExamForm({
        studentId: currentStudent?.id || 'stu-1',
        studentName: currentStudent?.name || user?.name || 'ABC Student 1',
        enrollmentNo: currentStudent?.enrollmentNo || 'STUDENT-001',
        examId: selectedExamId,
        subjectEntries: selectedSubjectsList,
        examFee: examFeeTotal,
        processingFee: PROCESSING_FEE,
        totalAmount: totalPayable,
        transactionId: generatedTxnId,
        paymentMode: paymentMode === 'UPI' ? 'UPI_ONLINE' : paymentMode === 'CARD' ? 'DEBIT_CREDIT_CARD' : 'NET_BANKING',
        applicationNumber: generatedAppNo
      });

      setApplicationNumber(generatedAppNo);
      setTxnId(generatedTxnId);
      setSubmittedDate(formattedDate);
      setSubmittedSubjects([...selectedSubjectsList]);
      setSubmittedAmount({
        examFee: examFeeTotal,
        processingFee: PROCESSING_FEE,
        total: totalPayable
      });

      setIsProcessing(false);
      setStep('DONE');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('success', `Backlog application ${generatedAppNo} submitted successfully!`);
    }, 1300);
  };

  // Reset workflow
  const handleResetWorkflow = () => {
    setSelectedSubjectIds([]);
    setStep('SELECT');
    setTxnId('');
    setApplicationNumber('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper badges
  const getResultBadge = (result: string) => {
    const up = result.toUpperCase();
    if (up === 'FAIL' || up === 'FAILED' || up === 'F') {
      return (
        <span style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FECACA', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
          FAIL
        </span>
      );
    }
    if (up === 'ABSENT') {
      return (
        <span style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: '1px solid #FDE68A', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
          ABSENT
        </span>
      );
    }
    if (up === 'ATKT') {
      return (
        <span style={{ backgroundColor: '#EDE9FE', color: '#7C3AED', border: '1px solid #DDD6FE', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
          ATKT
        </span>
      );
    }
    return <Badge variant="navy">{result}</Badge>;
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Controller / Admin View
  // ──────────────────────────────────────────────────────────────────────────
  if (isController) {
    const allExamForms = db.getExamForms();
    const backlogForms = allExamForms.filter(f =>
      (f.backlogSubjects && f.backlogSubjects.length > 0) ||
      (f.formNumber && f.formNumber.startsWith('APP/BL/')) ||
      (f.remarks && f.remarks.toLowerCase().includes('backlog'))
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <RotateCcw size={28} color="var(--brand-orange)" /> Backlog / Re-Exam Management Center
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              Controller of Examinations portal — Monitor, verify, and manage student backlog and remedial exam applications.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ background: 'rgba(243,112,35,0.1)', color: 'var(--brand-orange)', border: '1px solid rgba(243,112,35,0.3)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building2 size={15} /> University Exam Cell
            </span>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Total Backlog Applications</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{backlogForms.length || 3}</p>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Eligible Students</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#10B981' }}>{students.length}</p>
          </div>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1.25rem', boxShadow: 'var(--shadow-sm)' }}>
            <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active Backlog Exam Session</p>
            <p style={{ margin: '0.35rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--brand-orange)' }}>Summer 2026 Remedial</p>
          </div>
        </div>

        {/* Backlog Applications Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Submitted Backlog Applications
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Showing {backlogForms.length} application(s)
            </span>
          </div>

          {backlogForms.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Info size={36} style={{ display: 'block', margin: '0 auto 0.75rem', color: 'var(--brand-navy-light)' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No backlog applications submitted yet.</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem' }}>Switch to Student role to demonstrate the student application submission workflow.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>App Number</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Student</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Enrollment No</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Subjects</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Payment Status</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {backlogForms.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                        {f.formNumber}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{f.studentName}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{f.enrollmentNo}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#E0F2FE', color: '#0369A1', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {f.formSubjects?.length || f.backlogSubjects?.length || 1} Subject(s)
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--brand-navy)' }}>
                        ₹{(f.totalAmount || f.totalFee || 800).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                          ✓ PAID
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700 }}>
                          Pending Verification
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Student View: Complete 4-Step ERP Workflow
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 9999,
          padding: '0.9rem 1.4rem',
          background: toast.type === 'success' ? '#ECFDF5' : toast.type === 'error' ? '#FEF2F2' : '#EFF6FF',
          border: `1px solid ${toast.type === 'success' ? '#10B981' : toast.type === 'error' ? '#EF4444' : '#3B82F6'}`,
          borderRadius: 'var(--radius-md)',
          color: toast.type === 'success' ? '#065F46' : toast.type === 'error' ? '#991B1B' : '#1E40AF',
          fontWeight: 700,
          fontSize: '0.875rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toast.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : toast.type === 'error' ? <AlertCircle size={18} color="#EF4444" /> : <Info size={18} color="#3B82F6" />}
          {toast.message}
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-medium) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 10px rgba(15,44,89,0.2)'
            }}>
              <RotateCcw size={22} color="var(--brand-gold)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0, letterSpacing: '-0.02em' }}>
                Backlog / Re-Exam Application
              </h2>
              <p style={{ fontSize: '0.84375rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                Office of the Controller of Examinations — University Remedial & Backlog Application Portal
              </p>
            </div>
          </div>
        </div>

        {/* Student Context Badge */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'var(--brand-navy-subtle)',
            color: 'var(--brand-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.8125rem'
          }}>
            <UserCheck size={16} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.84375rem', color: 'var(--brand-navy)' }}>
              {currentStudent?.name || 'ABC Student 1'}
            </p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {currentStudent?.enrollmentNo || 'STUDENT-001'} • B.Tech CSE (Sem 4)
            </p>
          </div>
        </div>
      </div>

      {/* 4-Step Indicator Bar */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.85rem 1.25rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          {[
            { key: 'SELECT', number: 1, label: '1. Select Subjects' },
            { key: 'REVIEW', number: 2, label: '2. Review & Fee' },
            { key: 'PAYMENT', number: 3, label: '3. Payment' },
            { key: 'DONE', number: 4, label: '4. Submitted' }
          ].map((s, idx, arr) => {
            const stepOrder = ['SELECT', 'REVIEW', 'PAYMENT', 'DONE'];
            const currentIdx = stepOrder.indexOf(step);
            const thisIdx = idx;
            const isCurrent = step === s.key;
            const isCompleted = thisIdx < currentIdx;

            return (
              <React.Fragment key={s.key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.45rem 1.1rem',
                  borderRadius: 'var(--radius-full)',
                  background: isCurrent
                    ? 'var(--brand-orange)'
                    : isCompleted
                    ? '#10B981'
                    : '#F1F5F9',
                  color: isCurrent || isCompleted ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  boxShadow: isCurrent ? '0 4px 12px rgba(243,112,35,0.3)' : 'none',
                  border: isCurrent
                    ? '1px solid var(--brand-orange)'
                    : isCompleted
                    ? '1px solid #059669'
                    : '1px solid #E2E8F0',
                  transition: 'all var(--transition-normal)'
                }}>
                  {isCompleted ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: '#FFFFFF', color: '#10B981', fontSize: '0.75rem', fontWeight: 900 }}>
                      ✓
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: isCurrent ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.06)',
                      color: isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                      fontSize: '0.75rem'
                    }}>
                      {s.number}
                    </span>
                  )}
                  <span>{s.label.split('. ')[1]}</span>
                </div>
                {idx < arr.length - 1 && (
                  <div style={{ flex: '1', minWidth: '16px', height: '2px', background: thisIdx < currentIdx ? '#10B981' : '#E2E8F0', margin: '0 0.25rem' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* STEP 1: SELECT SUBJECTS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 'SELECT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Metric Stats Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-sm)',
              borderLeft: '4px solid var(--brand-navy)'
            }}>
              <p style={{ margin: 0, fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Eligible Subjects
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                {eligibleSubjects.length}
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-sm)',
              borderLeft: '4px solid var(--brand-orange)'
            }}>
              <p style={{ margin: 0, fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Selected Subjects
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-orange)' }}>
                {selectedSubjectIds.length} <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>/ {eligibleSubjects.length}</span>
              </p>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              boxShadow: 'var(--shadow-sm)',
              borderLeft: '4px solid #10B981'
            }}>
              <p style={{ margin: 0, fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Total Examination Fee
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1.65rem', fontWeight: 900, color: '#10B981' }}>
                ₹{examFeeTotal.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Main ERP Table Card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}>
            {/* Table Header Action Bar */}
            <div style={{
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Eligible Backlog & Re-Exam Subjects
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                  Check the subjects you wish to appear for in the upcoming examination session.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="btn btn-secondary btn-sm"
                style={{
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderColor: isAllSelected ? 'var(--brand-orange)' : '#CBD5E1',
                  color: isAllSelected ? 'var(--brand-orange)' : 'var(--text-main)',
                  background: isAllSelected ? 'var(--brand-orange-light)' : '#FFFFFF'
                }}
              >
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  border: `2px solid ${isAllSelected ? 'var(--brand-orange)' : '#94A3B8'}`,
                  background: isAllSelected ? 'var(--brand-orange)' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {isAllSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </div>
                {isAllSelected ? 'Deselect All Subjects' : 'Select All Eligible Subjects'}
              </button>
            </div>

            {/* ERP / Excel-Style Data Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ width: '56px', padding: '0.85rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleToggleSelectAll}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-orange)' }}
                        title="Select All"
                      />
                    </th>
                    <th style={{ width: '120px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Subject Code
                    </th>
                    <th style={{ minWidth: '240px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Subject Name
                    </th>
                    <th style={{ width: '110px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Semester
                    </th>
                    <th style={{ width: '120px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Exam Type
                    </th>
                    <th style={{ width: '110px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                      Exam Fee
                    </th>
                    <th style={{ width: '110px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                      Eligibility
                    </th>
                    <th style={{ width: '140px', padding: '0.85rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleSubjects.map((sub, idx) => {
                    const isSelected = selectedSubjectIds.includes(sub.subjectId);
                    const meta = EXAM_TYPE_META[sub.examType] || EXAM_TYPE_META.BACKLOG;

                    return (
                      <tr
                        key={sub.subjectId}
                        onClick={() => toggleSubject(sub.subjectId)}
                        style={{
                          background: isSelected ? 'rgba(243,112,35,0.06)' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)'
                        }}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(sub.subjectId)}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: 'var(--brand-orange)' }}
                          />
                        </td>

                        {/* Subject Code */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', fontFamily: 'monospace', fontSize: '0.875rem', borderRight: '1px solid #E2E8F0' }}>
                          {sub.subjectCode}
                        </td>

                        {/* Subject Name */}
                        <td style={{ padding: '0.9rem 1rem', borderRight: '1px solid #E2E8F0' }}>
                          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
                            {sub.subjectName}
                          </p>
                          <p style={{ margin: '0.15rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Attempt #{sub.attemptNumber} {sub.marksObtained !== undefined ? `• Previous Score: ${sub.marksObtained}/${sub.maximumMarks || 100}` : ''}
                          </p>
                        </td>

                        {/* Semester */}
                        <td style={{ padding: '0.9rem 1rem', fontWeight: 600, color: 'var(--text-muted)', borderRight: '1px solid #E2E8F0' }}>
                          Semester {sub.semesterNumber || 2}
                        </td>

                        {/* Exam Type */}
                        <td style={{ padding: '0.9rem 1rem', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'inline-block'
                          }}>
                            {meta.label}
                          </span>
                        </td>

                        {/* Exam Fee */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                          ₹{(sub.fee || 750).toLocaleString()}
                        </td>

                        {/* Eligibility */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{
                            background: '#ECFDF5',
                            color: '#059669',
                            border: '1px solid #A7F3D0',
                            padding: '0.25rem 0.65rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}>
                            <Check size={12} strokeWidth={3} /> Eligible
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.9rem 1rem', textAlign: 'center' }}>
                          {getResultBadge(sub.result)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ineligible Subjects Section if Any */}
            {ineligibleSubjects.length > 0 && (
              <div style={{ padding: '1rem 1.5rem', background: '#FFF5F5', borderTop: '1px solid #FED7D7' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#C53030', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <XCircle size={15} /> Ineligible Subjects ({ineligibleSubjects.length})
                </p>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {ineligibleSubjects.map(sub => (
                    <div key={sub.subjectId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#742A2A' }}>
                      <span><strong>{sub.subjectCode}</strong>: {sub.subjectName}</span>
                      <span>{sub.eligibilityReason || 'Maximum attempts reached'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Table Footer Bottom Action Bar */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                  Selected: <strong style={{ color: 'var(--brand-navy)' }}>{selectedSubjectIds.length}</strong> of {eligibleSubjects.length} subject(s) • Total Exam Fee: <strong style={{ color: 'var(--brand-orange)', fontSize: '1.05rem' }}>₹{examFeeTotal.toLocaleString()}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleContinueToReview}
                  disabled={selectedSubjectIds.length === 0}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    opacity: selectedSubjectIds.length === 0 ? 0.45 : 1,
                    cursor: selectedSubjectIds.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Continue to Review & Fee <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* STEP 2: REVIEW & FEE */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 'REVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Review Selected Subjects & Examination Fee
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Review your subject selection carefully. You can remove a subject or return to make modifications.
              </p>
            </div>

            {/* Selected Subjects Review Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ width: '130px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Subject Code
                    </th>
                    <th style={{ minWidth: '260px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Subject Name
                    </th>
                    <th style={{ width: '120px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Semester
                    </th>
                    <th style={{ width: '130px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                      Exam Type
                    </th>
                    <th style={{ width: '140px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'right', borderRight: '1px solid #E2E8F0' }}>
                      Examination Fee
                    </th>
                    <th style={{ width: '90px', padding: '0.85rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'center' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjectsList.map((sub, idx) => {
                    const meta = EXAM_TYPE_META[sub.examType] || EXAM_TYPE_META.BACKLOG;
                    return (
                      <tr key={sub.subjectId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 800, color: 'var(--brand-navy)', fontFamily: 'monospace', borderRight: '1px solid #E2E8F0' }}>
                          {sub.subjectCode}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', fontWeight: 700, color: 'var(--text-main)', borderRight: '1px solid #E2E8F0' }}>
                          {sub.subjectName}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', color: 'var(--text-muted)', fontWeight: 600, borderRight: '1px solid #E2E8F0' }}>
                          Semester {sub.semesterNumber || 2}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            padding: '0.2rem 0.6rem',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: 800
                          }}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                          ₹{(sub.fee || 750).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.9rem 1.25rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(sub.subjectId)}
                            style={{
                              background: '#FEE2E2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.35rem 0.65rem',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: 700
                            }}
                            title="Remove subject"
                          >
                            <Trash2 size={13} /> Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Fee Summary Section */}
            <div style={{ padding: '1.5rem', background: '#FAFAFA', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{
                width: '100%',
                maxWidth: '420px',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
                  Fee Summary
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Examination Fee ({selectedSubjectsList.length} subject{selectedSubjectsList.length !== 1 ? 's' : ''})</span>
                    <strong style={{ color: 'var(--text-main)' }}>₹{examFeeTotal.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Application / Processing Fee</span>
                    <strong style={{ color: 'var(--text-main)' }}>₹{PROCESSING_FEE}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                    <span>Other Charges</span>
                    <strong style={{ color: 'var(--text-main)' }}>₹0</strong>
                  </div>
                  <div style={{ borderTop: '2px dashed #CBD5E1', margin: '0.35rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                    <span>Total Payable</span>
                    <span style={{ color: 'var(--brand-orange)' }}>₹{totalPayable.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <ArrowLeft size={16} /> Back to Select Subjects
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.65rem 1.5rem' }}
              >
                Proceed to Payment <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* STEP 3: PAYMENT */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 'PAYMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Payment Card Container */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden'
          }}>
            {/* Payment Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-navy-medium) 100%)',
              color: '#FFFFFF',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} color="var(--brand-gold)" /> SSIU Centralized Examination Fee Gateway
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)' }}>
                  Secure University Examination Ledger • 256-bit SSL Protected
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.7)' }}>
                  Total Amount Due
                </span>
                <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-gold)' }}>
                  ₹{totalPayable.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ padding: '1.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* Left Column: Student & Order Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.85rem', fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Student & Examination Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.84375rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{currentStudent?.name || 'ABC Student 1'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Enrollment No:</span>
                      <strong style={{ fontFamily: 'monospace' }}>{currentStudent?.enrollmentNo || 'STUDENT-001'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Program:</span>
                      <strong>B.Tech Computer Engineering</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Exam Session:</span>
                      <strong>Summer 2026 Backlog</strong>
                    </div>
                  </div>
                </div>

                {/* Selected Subjects Pill Box */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Selected Subjects ({selectedSubjectsList.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedSubjectsList.map(s => (
                      <div key={s.subjectId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', border: '1px solid #E2E8F0', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8125rem' }}>
                        <div>
                          <strong style={{ color: 'var(--brand-navy)' }}>{s.subjectCode}</strong>: {s.subjectName}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>₹{(s.fee || 750).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEMO MODE Notice Banner */}
                <div style={{
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  border: '1px solid #FDE68A',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}>
                  <span style={{ fontSize: '1.25rem' }}>⚡</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, color: '#92400E', fontSize: '0.84375rem' }}>
                      DEMO MODE SIMULATION ACTIVE
                    </p>
                    <p style={{ margin: '0.25rem 0 0', color: '#B45309', fontSize: '0.78125rem', lineHeight: 1.4 }}>
                      Real bank transactions are bypassed for ERP evaluation. Clicking simulate will authorize the fee payment and generate authentic university receipt records.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Payment Method Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  Select Payment Method
                </h4>

                {/* Payment Mode Selector Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                  {[
                    { key: 'UPI', label: 'UPI / QR', icon: <QrCode size={18} /> },
                    { key: 'CARD', label: 'Card', icon: <CreditCard size={18} /> },
                    { key: 'NETBANKING', label: 'Net Banking', icon: <Landmark size={18} /> }
                  ].map(m => {
                    const isSelected = paymentMode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPaymentMode(m.key as any)}
                        style={{
                          background: isSelected ? 'var(--brand-orange-light)' : '#FFFFFF',
                          border: `2px solid ${isSelected ? 'var(--brand-orange)' : '#CBD5E1'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.85rem 0.5rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.4rem',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '0.8125rem',
                          color: isSelected ? 'var(--brand-orange)' : 'var(--text-main)',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        {m.icon}
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Method Specific UI */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
                  {paymentMode === 'UPI' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                          width: '90px',
                          height: '90px',
                          background: '#FFFFFF',
                          border: '2px solid #CBD5E1',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <QrCode size={64} color="var(--brand-navy)" />
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem', color: 'var(--brand-navy)' }}>
                            Scan QR Code with any UPI App
                          </p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Google Pay, PhonePe, Paytm, BHIM
                          </p>
                          <span style={{ display: 'inline-block', marginTop: '0.4rem', background: '#DCFCE7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            Merchant VPA: ssiu-exam@icici
                          </span>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                          Or enter Student UPI ID:
                        </label>
                        <input
                          type="text"
                          value={upiId}
                          onChange={e => setUpiId(e.target.value)}
                          className="form-control"
                          style={{ fontFamily: 'monospace', fontWeight: 600 }}
                          placeholder="username@bank"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMode === 'CARD' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                          Card Number
                        </label>
                        <input
                          type="text"
                          readOnly
                          value="4111 •••• •••• 9842 (Demo Student Visa)"
                          className="form-control"
                          style={{ fontFamily: 'monospace', fontWeight: 600, background: '#FFFFFF' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            Expiry
                          </label>
                          <input type="text" readOnly value="08/29" className="form-control" style={{ background: '#FFFFFF', textAlign: 'center' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                            CVV
                          </label>
                          <input type="text" readOnly value="•••" className="form-control" style={{ background: '#FFFFFF', textAlign: 'center' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMode === 'NETBANKING' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78125rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                        Select Your Bank
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Bank of Baroda', 'Punjab National Bank'].map(bank => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            style={{
                              padding: '0.5rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              border: `1px solid ${selectedBank === bank ? 'var(--brand-orange)' : '#CBD5E1'}`,
                              background: selectedBank === bank ? 'var(--brand-orange-light)' : '#FFFFFF',
                              color: selectedBank === bank ? 'var(--brand-orange)' : 'var(--text-main)',
                              fontWeight: 700,
                              fontSize: '0.78125rem',
                              textAlign: 'left',
                              cursor: 'pointer'
                            }}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Simulation Button */}
                <button
                  type="button"
                  onClick={handleSimulatePayment}
                  disabled={isProcessing}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.625rem',
                    padding: '0.85rem 1.5rem',
                    fontWeight: 900,
                    fontSize: '1rem',
                    boxShadow: '0 4px 14px rgba(243,112,35,0.4)',
                    cursor: isProcessing ? 'wait' : 'pointer'
                  }}
                >
                  <CreditCard size={20} />
                  {isProcessing ? 'Processing Payment...' : `Simulate Successful Payment (₹${totalPayable.toLocaleString()})`}
                </button>

                {/* Interactive Processing State Animation */}
                {isProcessing && (
                  <div style={{
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    textAlign: 'center',
                    animation: 'fadeIn 0.2s'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      border: '3px solid #3B82F6',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                      margin: '0 auto 0.5rem',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <p style={{ margin: 0, fontWeight: 700, color: '#1E40AF', fontSize: '0.84375rem' }}>
                      {processingStage}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation */}
            <div style={{
              padding: '1rem 1.5rem',
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <button
                type="button"
                onClick={() => setStep('REVIEW')}
                disabled={isProcessing}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
              >
                <ArrowLeft size={16} /> Back to Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* STEP 4: SUBMITTED (SUCCESS PAGE & ACKNOWLEDGMENT SLIP) */}
      {/* ────────────────────────────────────────────────────────────────── */}
      {step === 'DONE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Green Success Confirmation Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            border: '2px solid #10B981',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(16,185,129,0.15)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#10B981',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 4px 14px rgba(16,185,129,0.4)'
            }}>
              <Check size={36} strokeWidth={3} />
            </div>

            <h3 style={{ margin: 0, color: '#065F46', fontWeight: 900, fontSize: '1.5rem' }}>
              Backlog / Re-Exam Application Submitted Successfully
            </h3>
            <p style={{ margin: '0.5rem 0 0', color: '#047857', fontSize: '0.9375rem', fontWeight: 600 }}>
              Your examination application has been registered with the University Exam Cell.
            </p>
          </div>

          {/* Official University Acknowledgment Receipt Card */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: '2rem',
            position: 'relative'
          }}>
            {/* University Receipt Header */}
            <div style={{
              borderBottom: '2px solid var(--brand-navy)',
              paddingBottom: '1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--brand-navy)', letterSpacing: '0.5px' }}>
                  SWARRNIM STARTUP & INNOVATION UNIVERSITY
                </h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.84375rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                  OFFICE OF THE CONTROLLER OF EXAMINATIONS • EXAMINATION APPLICATION ACKNOWLEDGEMENT
                </p>
              </div>

              <div style={{
                background: '#DCFCE7',
                border: '1px solid #86EFAC',
                color: '#15803D',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 900,
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <CheckCircle size={15} /> PAYMENT STATUS: PAID
              </div>
            </div>

            {/* Application Meta Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Application Number
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 900, color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                  {applicationNumber || 'APP/BL/2026/004821'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Transaction ID
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '1rem', fontWeight: 900, color: 'var(--brand-orange)', fontFamily: 'monospace' }}>
                  {txnId || 'TXN-SSIU-2026-984210'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Student Name
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {currentStudent?.name || 'ABC Student 1'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Enrollment Number
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'monospace' }}>
                  {currentStudent?.enrollmentNo || 'STUDENT-001'}
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Program
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  B.Tech Computer Engineering
                </p>
              </div>

              <div>
                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Application Date
                </p>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {submittedDate || '26 Aug 2026, 03:20 PM'}
                </p>
              </div>
            </div>

            {/* Enrolled Subjects Table */}
            <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', width: '60px' }}>Sr.</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Subject Code</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Subject Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Semester</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Exam Type</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', textAlign: 'right' }}>Fee Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {(submittedSubjects.length > 0 ? submittedSubjects : selectedSubjectsList).map((sub, idx) => (
                    <tr key={sub.subjectId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>{idx + 1}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{sub.subjectCode}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>{sub.subjectName}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>Semester {sub.semesterNumber || 2}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {sub.examType}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)' }}>
                        ₹{(sub.fee || 750).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Paid Strip */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Exam Fee: ₹{submittedAmount.examFee || examFeeTotal} • Processing Fee: ₹{submittedAmount.processingFee || PROCESSING_FEE}
                </p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78125rem', color: '#166534', fontWeight: 700 }}>
                  ✓ Verification Code: {applicationNumber || 'APP/BL/2026/004821'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Amount Paid
                </span>
                <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                  ₹{(submittedAmount.total || totalPayable).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Important Advisory */}
            <div style={{
              background: '#F0F9FF',
              border: '1px solid #BAE6FD',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.78125rem',
              color: '#0369A1',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem'
            }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Notice from Controller of Examinations:</strong> Keep this acknowledgment slip for university records. Your Hall Ticket will be issued in the Examination &gt; Hall Ticket portal 7 days prior to examination commencement.
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              marginTop: '2rem',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-outline"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.65rem 1.25rem' }}
              >
                <Printer size={16} /> Print
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.65rem 1.25rem' }}
              >
                <Download size={16} /> Download Acknowledgement
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setActiveTab) {
                    setActiveTab('examination');
                  } else {
                    handleResetWorkflow();
                  }
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.65rem 1.4rem' }}
              >
                <RotateCcw size={16} /> Back to Examination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
