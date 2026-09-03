import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Badge } from '../../components/common/Badge';
import { ExcelTableContainer, ExcelTable, ExcelTh, ExcelTd } from '../../components/common/ExcelTable';
import {
  Shield, CheckCircle, CreditCard,
  ChevronRight, ArrowRight, Info,
  RefreshCw, Download, Printer, Check, Smartphone,
  Landmark, FileCheck, Award, ArrowLeft, RotateCcw
} from 'lucide-react';

export type ReassessmentMode = 'REASSESSMENT' | 'RECHECKING';

export type WorkflowStep = 
  | 'SELECT' 
  | 'APPLY' 
  | 'FEE' 
  | 'PAYMENT' 
  | 'SUBMITTED' 
  | 'PROCESSING' 
  | 'RESULT';

interface DemoEligibleSubject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  semesterNumber: number;
  examName: string;
  marksObtained: number;
  maximumMarks: number;
  grade: string;
  isPass: boolean;
  resultStatus: 'PASS' | 'FAIL' | 'ATKT';
  eligibility: 'ELIGIBLE';
}

const DEMO_SEEDED_SUBJECTS: DemoEligibleSubject[] = [
  {
    subjectId: 'sub-cse201',
    subjectCode: 'CSE201',
    subjectName: 'Data Structures',
    semesterNumber: 2,
    examName: 'End Semester Examination',
    marksObtained: 42,
    maximumMarks: 100,
    grade: 'C',
    isPass: true,
    resultStatus: 'PASS',
    eligibility: 'ELIGIBLE'
  },
  {
    subjectId: 'sub-cse204',
    subjectCode: 'CSE204',
    subjectName: 'Database Management System',
    semesterNumber: 2,
    examName: 'End Semester Examination',
    marksObtained: 38,
    maximumMarks: 100,
    grade: 'C',
    isPass: true,
    resultStatus: 'PASS',
    eligibility: 'ELIGIBLE'
  },
  {
    subjectId: 'sub-cse301',
    subjectCode: 'CSE301',
    subjectName: 'Computer Networks',
    semesterNumber: 3,
    examName: 'End Semester Examination',
    marksObtained: 35,
    maximumMarks: 100,
    grade: 'D',
    isPass: true,
    resultStatus: 'PASS',
    eligibility: 'ELIGIBLE'
  },
  {
    subjectId: 'sub-cse305',
    subjectCode: 'CSE305',
    subjectName: 'Operating Systems',
    semesterNumber: 3,
    examName: 'End Semester Examination',
    marksObtained: 31,
    maximumMarks: 100,
    grade: 'D',
    isPass: true,
    resultStatus: 'PASS',
    eligibility: 'ELIGIBLE'
  }
];

interface ReassessmentRecheckingPageProps {
  setActiveTab?: (tab: string) => void;
}

export const ReassessmentRecheckingPage: React.FC<ReassessmentRecheckingPageProps> = ({ setActiveTab }) => {
  const { user, role } = useAuth();
  const students = db.getStudents();
  const exams = db.getExams();
  const subjects = db.getSubjects();

  const isStudent = role === 'STUDENT';
  const currentStudent = useMemo(() =>
    isStudent ? students.find(s => s.id === user?.id || s.email === user?.email) : null,
    [students, user, isStudent]
  );

  // Mode: Reassessment (₹200) vs Rechecking (₹150)
  const [activeMode, setActiveMode] = useState<ReassessmentMode>('REASSESSMENT');
  
  // 7-Step Workflow Navigation
  const [step, setStep] = useState<WorkflowStep>('SELECT');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(false);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CARD' | 'NET_BANKING'>('UPI');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Application Record state
  const [applicationNo, setApplicationNo] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [applicationDate, setApplicationDate] = useState<string>('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  // Fee Rates
  const feePerSubject = activeMode === 'REASSESSMENT' ? 200 : 150;

  // Resolved Eligible Subjects: Real marks in production mode, seeded demo marks fallback in demo mode
  const eligibleSubjectList: DemoEligibleSubject[] = useMemo(() => {
    if (!currentStudent) return DEMO_SEEDED_SUBJECTS;
    const realMarks = db.getStudentMarks().filter(m => m.studentId === currentStudent.id);
    
    // Check if real evaluated marks exist
    const evaluatedMarks = realMarks.filter(m => m.totalMarks !== undefined);

    if (evaluatedMarks.length > 0) {
      return evaluatedMarks.map(m => {
        const sub = subjects.find(s => s.id === m.subjectId);
        const exam = exams.find(e => e.id === m.examId);
        const maxMarks = m.maxMarks ?? ((m.maxInternalMarks || 0) + (m.maxExternalMarks || 0) || 100);
        return {
          subjectId: m.subjectId || sub?.id || 'sub-cse201',
          subjectCode: sub?.code || m.subjectCode || 'CSE201',
          subjectName: sub?.name || m.subjectName || 'Data Structures',
          semesterNumber: sub?.semesterId === 'sem-cse-2' ? 2 : 3,
          examName: exam?.name || 'End Semester Examination',
          marksObtained: m.totalMarks ?? 42,
          maximumMarks: maxMarks,
          grade: m.grade || (m.isPass ? 'PASS' : 'FAIL'),
          isPass: m.isPass ?? true,
          resultStatus: (m.isPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
          eligibility: 'ELIGIBLE' as const
        };
      });
    }

    return DEMO_SEEDED_SUBJECTS;
  }, [currentStudent, exams, subjects]);

  const selectedSubjects = useMemo(() =>
    eligibleSubjectList.filter(s => selectedSubjectIds.includes(s.subjectId)),
    [eligibleSubjectList, selectedSubjectIds]
  );

  // Financials
  const subtotalFee = selectedSubjects.length * feePerSubject;
  const otherCharges = 0;
  const totalPayable = subtotalFee + otherCharges;

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSubjectIds.length === eligibleSubjectList.length) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(eligibleSubjectList.map(s => s.subjectId));
    }
  };

  const handleContinueToApply = () => {
    if (selectedSubjectIds.length === 0) {
      showToast('error', 'Please select at least one eligible subject to continue.');
      return;
    }
    setStep('APPLY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToFee = () => {
    if (!declarationAgreed) {
      showToast('error', 'Please accept the declaration to proceed to fee calculation.');
      return;
    }
    setStep('FEE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = () => {
    if (selectedSubjectIds.length === 0) {
      showToast('error', 'No subjects selected for payment.');
      setStep('SELECT');
      return;
    }
    setStep('PAYMENT');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    const prefix = activeMode === 'REASSESSMENT' ? 'RA' : 'RC';
    const newAppNo = `${prefix}-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newTxnId = `TXN-DEMO-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    setTimeout(() => {
      setApplicationNo(newAppNo);
      setTransactionId(newTxnId);
      setApplicationDate(dateStr);
      setIsProcessing(false);
      setStep('SUBMITTED');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('success', `Payment verified! Application No: ${newAppNo}`);
    }, 1200);
  };

  const handleDownloadSlip = () => {
    showToast('success', `Downloading Acknowledgement Slip (${applicationNo || 'RA-2026-000124'})...`);
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const resetFlow = () => {
    setStep('SELECT');
    setSelectedSubjectIds([]);
    setDeclarationAgreed(false);
    setApplicationNo('');
    setTransactionId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Steps definition for 7-step progress bar
  const WORKFLOW_STEPS: { key: WorkflowStep; number: number; label: string }[] = [
    { key: 'SELECT', number: 1, label: 'Select Subject' },
    { key: 'APPLY', number: 2, label: 'Apply' },
    { key: 'FEE', number: 3, label: 'Fee Calculation' },
    { key: 'PAYMENT', number: 4, label: 'Payment' },
    { key: 'SUBMITTED', number: 5, label: 'Application Submitted' },
    { key: 'PROCESSING', number: 6, label: 'Exam Section Processing' },
    { key: 'RESULT', number: 7, label: 'Result / Status Updated' }
  ];

  const currentStepIndex = WORKFLOW_STEPS.findIndex(s => s.key === step);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, padding: '0.85rem 1.25rem',
          background: toast.type === 'success' ? '#D1FAE5' : '#FEE2E2',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#FECACA'}`,
          borderRadius: '8px', color: toast.type === 'success' ? '#065F46' : '#991B1B',
          fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          {toast.message}
        </div>
      )}

      {/* ─── 1. TOP HEADER & MODE SELECTOR ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Badge variant="orange">Examination Portal 2026</Badge>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Official Verification Desk</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Shield size={28} color="var(--brand-orange, #F37023)" /> Reassessment / Rechecking
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Apply for reassessment (re-evaluation) or rechecking (script verification) of your marks.
          </p>
        </div>

        {/* Mode Toggle Buttons */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          background: 'var(--bg-surface-hover, #F1F5F9)',
          padding: '0.35rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          <button
            type="button"
            onClick={() => { setActiveMode('REASSESSMENT'); resetFlow(); }}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeMode === 'REASSESSMENT' ? 'var(--brand-orange, #F37023)' : 'transparent',
              color: activeMode === 'REASSESSMENT' ? '#FFFFFF' : 'var(--text-main, #334155)',
              boxShadow: activeMode === 'REASSESSMENT' ? '0 2px 8px rgba(243,112,35,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            📋 Reassessment (₹200/subject)
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('RECHECKING'); resetFlow(); }}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.85rem',
              background: activeMode === 'RECHECKING' ? 'var(--brand-orange, #F37023)' : 'transparent',
              color: activeMode === 'RECHECKING' ? '#FFFFFF' : 'var(--text-main, #334155)',
              boxShadow: activeMode === 'RECHECKING' ? '0 2px 8px rgba(243,112,35,0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            🔍 Rechecking (₹150/subject)
          </button>
        </div>
      </div>

      {/* Information Banner Explaining Selected Mode */}
      <div style={{
        background: activeMode === 'REASSESSMENT' ? 'rgba(243, 112, 35, 0.06)' : 'rgba(30, 64, 175, 0.06)',
        border: `1px solid ${activeMode === 'REASSESSMENT' ? 'rgba(243, 112, 35, 0.25)' : 'rgba(30, 64, 175, 0.25)'}`,
        borderRadius: '8px',
        padding: '0.9rem 1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem'
      }}>
        <Info size={19} color={activeMode === 'REASSESSMENT' ? 'var(--brand-orange, #F37023)' : '#1E40AF'} style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <div style={{ fontSize: '0.85rem', color: activeMode === 'REASSESSMENT' ? '#9A3412' : '#1E3A8A', lineHeight: 1.5 }}>
          {activeMode === 'REASSESSMENT' ? (
            <>
              <strong>Reassessment (Re-Evaluation):</strong> Your answer script will be re-evaluated by a different examiner. Marks may increase, remain the same, or decrease based on evaluation.
            </>
          ) : (
            <>
              <strong>Rechecking (Script Verification):</strong> Your answer script will be verified for totaling, unchecked answers, and mark-entry errors. No academic re-evaluation will be performed.
            </>
          )}
        </div>
      </div>

      {/* ─── 4. 7-STEP WORKFLOW INDICATOR ──────────────────────────────── */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '760px' }}>
          {WORKFLOW_STEPS.map((s, i) => {
            const isCurrent = step === s.key;
            const isCompleted = currentStepIndex > i;

            return (
              <React.Fragment key={s.key}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  background: isCurrent 
                    ? 'var(--brand-orange, #F37023)' 
                    : (isCompleted ? '#10B981' : 'var(--bg-surface-hover, #F8FAFC)'),
                  color: (isCurrent || isCompleted) ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap',
                  border: `1px solid ${(isCurrent || isCompleted) ? 'transparent' : 'var(--border-color, #E2E8F0)'}`,
                  boxShadow: isCurrent ? '0 2px 8px rgba(243,112,35,0.25)' : 'none'
                }}>
                  {isCompleted ? (
                    <Check size={13} strokeWidth={3} />
                  ) : (
                    <span style={{ 
                      width: '16px', height: '16px', borderRadius: '50%', 
                      background: isCurrent ? '#FFFFFF' : 'rgba(0,0,0,0.08)',
                      color: isCurrent ? 'var(--brand-orange, #F37023)' : 'var(--text-muted)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.68rem', fontWeight: 800
                    }}>
                      {s.number}
                    </span>
                  )}
                  <span>{s.label}</span>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.4, flexShrink: 0 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── STEP 1: SELECT SUBJECTS (EXCEL DATA TABLE) ────────────────── */}
      {step === 'SELECT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-navy)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Eligible Subjects</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>{eligibleSubjectList.length}</div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Subjects</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', marginTop: '0.2rem' }}>{selectedSubjectIds.length}</div>
            </div>

            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Selected Fee ({activeMode === 'REASSESSMENT' ? '₹200/sub' : '₹150/sub'})</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>₹{subtotalFee.toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Eligible Evaluated Papers for {activeMode === 'REASSESSMENT' ? 'Reassessment' : 'Rechecking'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Select the papers for which you wish to apply for {activeMode.toLowerCase()} verification.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSelectAll}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}
              >
                <Check size={14} />
                {selectedSubjectIds.length === eligibleSubjectList.length ? 'Deselect All' : 'Select All Eligible Subjects'}
              </button>
            </div>

            <ExcelTableContainer minWidth="1050px">
              <ExcelTable>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ width: '60px', minWidth: '60px', padding: '0.75rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                      <input
                        type="checkbox"
                        checked={selectedSubjectIds.length === eligibleSubjectList.length && eligibleSubjectList.length > 0}
                        onChange={handleSelectAll}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--brand-orange, #F37023)' }}
                        title="Select All"
                      />
                    </th>
                    <th style={{ width: '120px', minWidth: '120px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Subject Code</th>
                    <th style={{ width: '260px', minWidth: '260px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Subject Name</th>
                    <th style={{ width: '110px', minWidth: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Semester</th>
                    <th style={{ width: '200px', minWidth: '200px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Exam</th>
                    <th style={{ width: '120px', minWidth: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Marks Obtained</th>
                    <th style={{ width: '110px', minWidth: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Maximum Marks</th>
                    <th style={{ width: '90px', minWidth: '90px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Result</th>
                    <th style={{ width: '100px', minWidth: '100px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>Eligibility</th>
                    <th style={{ width: '110px', minWidth: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleSubjectList.map((sub, idx) => {
                    const isSelected = selectedSubjectIds.includes(sub.subjectId);

                    return (
                      <tr
                        key={sub.subjectId}
                        onClick={() => toggleSubject(sub.subjectId)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(243, 112, 35, 0.06)' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC',
                          borderBottom: '1px solid #E2E8F0'
                        }}
                      >
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }} onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(sub.subjectId)}
                            style={{ width: '17px', height: '17px', cursor: 'pointer', accentColor: 'var(--brand-orange, #F37023)' }}
                          />
                        </td>

                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF', borderRight: '1px solid #E2E8F0' }}>
                          {sub.subjectCode}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                          {sub.subjectName}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.8125rem', borderRight: '1px solid #E2E8F0' }}>
                          Semester {sub.semesterNumber}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)', borderRight: '1px solid #E2E8F0' }}>
                          {sub.examName}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: 'var(--brand-navy)', borderRight: '1px solid #E2E8F0' }}>
                          {sub.marksObtained}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', borderRight: '1px solid #E2E8F0' }}>
                          {sub.maximumMarks}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            {sub.resultStatus}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                          <span style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                            Eligible
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => toggleSubject(sub.subjectId)}
                            className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                            style={{
                              fontSize: '0.75rem', padding: '0.25rem 0.65rem',
                              background: isSelected ? 'var(--brand-orange, #F37023)' : undefined,
                              borderColor: isSelected ? 'var(--brand-orange, #F37023)' : undefined
                            }}
                          >
                            {isSelected ? 'Selected' : 'Apply'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1.25rem' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--brand-navy)', fontWeight: 600 }}>
                Selected: <strong style={{ color: 'var(--brand-orange, #F37023)' }}>{selectedSubjectIds.length} Subject{selectedSubjectIds.length !== 1 ? 's' : ''}</strong> • Fee: <strong style={{ color: '#10B981' }}>₹{subtotalFee.toLocaleString('en-IN')}</strong>
              </div>

              <button
                type="button"
                onClick={handleContinueToApply}
                disabled={selectedSubjectIds.length === 0}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                  fontWeight: 700, padding: '0.65rem 1.5rem',
                  opacity: selectedSubjectIds.length === 0 ? 0.5 : 1,
                  cursor: selectedSubjectIds.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Continue to Application <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: APPLICATION FORM (APPLY) ──────────────────────────── */}
      {step === 'APPLY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck size={22} color="var(--brand-orange, #F37023)" /> Official University Application Form
            </h3>

            {/* Student & Program Overview */}
            <div style={{ padding: '1.25rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Student Name</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{user?.name || currentStudent?.name || 'ABC Student 1'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enrollment Number</span>
                  <strong style={{ color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{currentStudent?.enrollmentNo || user?.username || 'STUDENT-001'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Program / Department</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>B.Tech Computer Engineering</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Semester</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>Semester 3</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Application Type</span>
                  <Badge variant={activeMode === 'REASSESSMENT' ? 'orange' : 'navy'}>
                    {activeMode === 'REASSESSMENT' ? 'Reassessment (Re-Evaluation)' : 'Rechecking (Verification)'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Selected Subjects Breakdown */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
                Selected Subject(s) for {activeMode === 'REASSESSMENT' ? 'Reassessment' : 'Rechecking'} ({selectedSubjects.length}):
              </div>

              <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                {selectedSubjects.map((sub, idx) => (
                  <div key={sub.subjectId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderBottom: idx < selectedSubjects.length - 1 ? '1px solid #E2E8F0' : 'none', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#1E40AF', fontFamily: 'monospace' }}>{sub.subjectCode}</strong>: <span style={{ fontWeight: 600, color: 'var(--brand-navy)' }}>{sub.subjectName}</span> (Sem {sub.semesterNumber})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Marks: <strong>{sub.marksObtained}/{sub.maximumMarks}</strong></span>
                      <span style={{ fontWeight: 700, color: 'var(--brand-orange, #F37023)' }}>₹{feePerSubject}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div style={{ padding: '1rem', borderRadius: '6px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', fontSize: '0.85rem', color: '#92400E', lineHeight: 1.45 }}>
                <input
                  type="checkbox"
                  checked={declarationAgreed}
                  onChange={e => setDeclarationAgreed(e.target.checked)}
                  style={{ width: '17px', height: '17px', marginTop: '0.15rem', accentColor: 'var(--brand-orange, #F37023)', cursor: 'pointer' }}
                />
                <span>
                  <strong>Declaration:</strong> I understand that the reassessment/rechecking process will be carried out according to university examination regulations.
                </span>
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setStep('SELECT')}
                className="btn btn-secondary"
                style={{ fontWeight: 600 }}
              >
                ← Back to Select Subjects
              </button>

              <button
                type="button"
                onClick={handleProceedToFee}
                disabled={!declarationAgreed}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                  fontWeight: 700, padding: '0.65rem 1.5rem',
                  opacity: !declarationAgreed ? 0.5 : 1,
                  cursor: !declarationAgreed ? 'not-allowed' : 'pointer'
                }}
              >
                Proceed to Fee Calculation <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: FEE CALCULATION (FEE) ─────────────────────────────── */}
      {step === 'FEE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem' }}>
              Fee Calculation &amp; Review ({selectedSubjects.length} Subject{selectedSubjects.length !== 1 ? 's' : ''})
            </h3>

            {/* Excel-Style Fee Table */}
            <ExcelTableContainer minWidth="650px">
              <ExcelTable>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ width: '130px', minWidth: '130px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Subject Code</th>
                    <th style={{ width: '280px', minWidth: '280px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Subject Name</th>
                    <th style={{ width: '140px', minWidth: '140px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Application Type</th>
                    <th style={{ width: '100px', minWidth: '100px', padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)' }}>Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubjects.map(sub => (
                    <tr key={sub.subjectId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 800, color: '#1E40AF' }}>
                        {sub.subjectCode}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                        {sub.subjectName}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                        <Badge variant={activeMode === 'REASSESSMENT' ? 'orange' : 'navy'}>
                          {activeMode === 'REASSESSMENT' ? 'Reassessment' : 'Rechecking'}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 800, color: 'var(--brand-navy)' }}>
                        ₹{feePerSubject}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>

            {/* Fee Summary Box */}
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', maxWidth: '420px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Application Fee:</span>
                <strong style={{ color: 'var(--brand-navy)' }}>₹{subtotalFee.toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Other Charges:</span>
                <strong style={{ color: '#10B981' }}>₹0</strong>
              </div>
              <div style={{ height: '1px', backgroundColor: '#CBD5E1', marginBottom: '0.75rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 900 }}>
                <span style={{ color: 'var(--brand-navy)' }}>Total Payable:</span>
                <span style={{ color: 'var(--brand-orange, #F37023)' }}>₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.75rem', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              <button
                type="button"
                onClick={() => setStep('APPLY')}
                className="btn btn-secondary"
                style={{ fontWeight: 600 }}
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleProceedToPayment}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                  fontWeight: 700, padding: '0.65rem 1.5rem'
                }}
              >
                Proceed to Payment (₹{totalPayable.toLocaleString('en-IN')}) <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 4: PAYMENT ───────────────────────────────────────────── */}
      {step === 'PAYMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={22} color="var(--brand-orange, #F37023)" /> University Examination Fee Payment
            </h3>

            {/* Candidate & Order Details */}
            <div style={{ padding: '1rem 1.25rem', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Student Name</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{user?.name || currentStudent?.name || 'ABC Student 1'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enrollment Number</span>
                  <strong style={{ color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{currentStudent?.enrollmentNo || user?.username || 'STUDENT-001'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Service Requested</span>
                  <strong style={{ color: 'var(--brand-orange, #F37023)' }}>
                    {activeMode === 'REASSESSMENT' ? 'Reassessment (Re-Evaluation)' : 'Rechecking (Script Verification)'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Selected Papers</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{selectedSubjects.length} Subject(s)</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #E2E8F0', marginTop: '0.85rem', paddingTop: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Total Payable Amount:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-navy)' }}>₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Select Payment Mode
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
                {[
                  { id: 'UPI', label: 'UPI / QR Code', desc: 'GPay, PhonePe, Paytm', icon: Smartphone },
                  { id: 'CARD', label: 'Debit / Credit Card', desc: 'Visa, MasterCard, RuPay', icon: CreditCard },
                  { id: 'NET_BANKING', label: 'Net Banking', desc: 'SBI, HDFC, ICICI, Axis', icon: Landmark }
                ].map(mode => {
                  const isSelected = paymentMode === mode.id;
                  const ModeIcon = mode.icon;

                  return (
                    <div
                      key={mode.id}
                      onClick={() => setPaymentMode(mode.id as any)}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--brand-orange, #F37023)' : '#E2E8F0'}`,
                        backgroundColor: isSelected ? 'rgba(243, 112, 35, 0.05)' : '#FFFFFF',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <ModeIcon size={18} color={isSelected ? 'var(--brand-orange, #F37023)' : 'var(--brand-navy)'} />
                        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: isSelected ? 'var(--brand-navy)' : 'var(--text-main)' }}>
                          {mode.label}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{mode.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Demo Notice */}
            <div style={{ padding: '0.85rem 1rem', borderRadius: '6px', backgroundColor: '#FEF3C7', border: '1px solid #FCD34D', fontSize: '0.8125rem', color: '#92400E', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Info size={16} /> DEMO MODE: Real payment gateway is bypassed. Click &quot;Simulate Successful Payment&quot; to complete the application.
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <button
                type="button"
                onClick={() => setStep('FEE')}
                disabled={isProcessing}
                className="btn btn-secondary"
              >
                ← Back to Fee
              </button>

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                  fontWeight: 700, padding: '0.75rem 1.75rem', fontSize: '0.925rem'
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" /> Verifying Payment Gateway...
                  </>
                ) : (
                  <>
                    <CheckCircle size={17} /> Simulate Successful Payment (₹{totalPayable.toLocaleString('en-IN')})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 5: APPLICATION SUBMITTED (SUBMITTED) ─────────────────── */}
      {step === 'SUBMITTED' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          
          {/* Success Banner */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', border: '1px solid #A7F3D0' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#10B981', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
              <Check size={32} strokeWidth={3} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#065F46', margin: 0 }}>
              ✓ Application Submitted Successfully
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.35rem' }}>
              Your {activeMode === 'REASSESSMENT' ? 'reassessment' : 'rechecking'} application has been registered with the Office of the Controller of Examinations.
            </p>
          </div>

          {/* Acknowledgement Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Application Acknowledgement Memo
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Swarrnim Startup &amp; Innovation University • Exam Cell</span>
              </div>
              <span style={{ background: '#DCFCE7', color: '#15803D', padding: '0.3rem 0.75rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800 }}>
                PAYMENT SUCCESSFUL
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Application Number</span>
                <code style={{ fontWeight: 800, color: '#1E40AF', fontSize: '0.9rem' }}>{applicationNo || 'RA-2026-000124'}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Transaction ID</span>
                <code style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.85rem' }}>{transactionId || 'TXN-DEMO-782341'}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Student Name</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{user?.name || currentStudent?.name || 'ABC Student 1'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Enrollment Number</span>
                <strong style={{ color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{currentStudent?.enrollmentNo || user?.username || 'STUDENT-001'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Application Type</span>
                <strong style={{ color: 'var(--brand-orange, #F37023)' }}>
                  {activeMode === 'REASSESSMENT' ? 'Reassessment' : 'Rechecking'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Application Date</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{applicationDate || '26 Aug 2026, 03:20 PM'}</strong>
              </div>
            </div>

            {/* Selected Subjects List */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy)', marginBottom: '0.5rem' }}>
                Applied Subject Papers ({selectedSubjects.length}):
              </div>
              <div style={{ border: '1px solid #E2E8F0', borderRadius: '6px', overflow: 'hidden' }}>
                {selectedSubjects.map((sub, idx) => (
                  <div key={sub.subjectId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', borderBottom: idx < selectedSubjects.length - 1 ? '1px solid #E2E8F0' : 'none', backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', fontSize: '0.825rem' }}>
                    <div>
                      <strong style={{ color: 'var(--brand-navy)', fontFamily: 'monospace' }}>{sub.subjectCode}</strong>: {sub.subjectName} (Sem {sub.semesterNumber})
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Marks: {sub.marksObtained}/{sub.maximumMarks}</span>
                      <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>₹{feePerSubject}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#F8FAFC', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-navy)' }}>Total Amount Paid:</span>
              <strong style={{ fontSize: '1.25rem', color: '#10B981' }}>₹{totalPayable.toLocaleString('en-IN')}</strong>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700 }}
                >
                  <Download size={14} /> Download Acknowledgement
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                >
                  <Printer size={14} /> Print Application
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep('PROCESSING'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--brand-navy)', borderColor: 'var(--brand-navy)', fontWeight: 700 }}
                >
                  Track Exam Processing <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setActiveTab) {
                      setActiveTab('examination');
                    } else {
                      resetFlow();
                    }
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  Back to Examination
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 6: EXAM SECTION PROCESSING ───────────────────────────── */}
      {step === 'PROCESSING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Application Tracking &amp; Exam Section Processing
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Application Ref: <strong>{applicationNo || 'RA-2026-000124'}</strong> • Candidate: {user?.name || currentStudent?.name || 'ABC Student 1'}
                </p>
              </div>
              <Badge variant="warning">IN PROGRESS</Badge>
            </div>

            {/* Tracking Stages Timeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              {[
                { stage: 'Application Submitted', date: applicationDate || '26 Aug 2026', status: 'Completed', statusVariant: 'active', remarks: 'Form submitted via student examination portal.' },
                { stage: 'Payment Verified', date: applicationDate || '26 Aug 2026', status: 'Completed', statusVariant: 'active', remarks: `Verified under Transaction ID: ${transactionId || 'TXN-DEMO-782341'}.` },
                { stage: 'Exam Section Processing', date: '26 Aug 2026', status: 'Pending', statusVariant: 'orange', remarks: 'Answer script requested from university confidential repository.' },
                { stage: 'Examiner Assigned', date: 'Scheduled', status: 'Scheduled', statusVariant: 'navy', remarks: activeMode === 'REASSESSMENT' ? 'Independent secondary evaluator assigned.' : 'Chief script verifier assigned.' },
                { stage: 'Evaluation / Script Verification', date: 'Pending', status: 'Pending', statusVariant: 'navy', remarks: 'Academic verification of marks and totaling check.' },
                { stage: 'Result Updated', date: 'Pending', status: 'Pending', statusVariant: 'navy', remarks: 'Revised memo declaration by Controller of Examinations.' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '0.85rem 1rem', borderRadius: '8px', backgroundColor: item.status === 'Completed' ? '#F0FDF4' : item.status === 'Pending' && idx === 2 ? '#FFF7ED' : '#F8FAFC', border: `1px solid ${item.status === 'Completed' ? '#86EFAC' : item.status === 'Pending' && idx === 2 ? '#FDBA74' : '#E2E8F0'}` }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    backgroundColor: item.status === 'Completed' ? '#10B981' : (idx === 2 ? 'var(--brand-orange, #F37023)' : '#CBD5E1'),
                    color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem'
                  }}>
                    {item.status === 'Completed' ? <Check size={16} strokeWidth={3} /> : (idx === 2 ? <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FFFFFF' }} /> : idx + 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <strong style={{ fontSize: '0.875rem', color: 'var(--brand-navy)' }}>{item.stage}</strong>
                      <Badge variant={item.statusVariant as any}>{item.status}</Badge>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Date: {item.date} • {item.remarks}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fast-Forward Demo Action */}
            <div style={{ padding: '1rem', borderRadius: '6px', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ fontSize: '0.8125rem', color: '#1E40AF' }}>
                <Info size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
                <strong>Demo Action:</strong> Simulate examiner marks update and official declaration to view final result outcome.
              </div>

              <button
                type="button"
                onClick={() => { setStep('RESULT'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="btn btn-primary btn-sm"
                style={{ background: '#1E40AF', borderColor: '#1E40AF', fontWeight: 700 }}
              >
                Simulate Office Evaluation &amp; Complete <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 7: RESULT / STATUS UPDATED (RESULT) ──────────────────── */}
      {step === 'RESULT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px', margin: '0 auto', width: '100%' }}>
          
          {/* Result Banner */}
          <div className="card" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', border: '1px solid #93C5FD' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#1E40AF', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', boxShadow: '0 4px 14px rgba(30,64,175,0.3)' }}>
              <Award size={32} />
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E3A8A', margin: 0 }}>
              {activeMode === 'REASSESSMENT' ? 'Reassessment Evaluation Completed' : 'Script Verification Completed'}
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1E40AF', marginTop: '0.35rem' }}>
              The Examination Cell has published the official verified marks memo for Application <strong>{applicationNo || 'RA-2026-000124'}</strong>.
            </p>
          </div>

          {/* Revised Marks Ledger Card */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Revised Evaluation Outcome Memo
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Status: <strong style={{ color: '#10B981' }}>COMPLETED</strong> • Academic Year 2026</span>
              </div>
              <Badge variant="active">COMPLETED</Badge>
            </div>

            {/* Results Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {(selectedSubjects.length > 0 ? selectedSubjects : DEMO_SEEDED_SUBJECTS.slice(0, 1)).map(sub => {
                const isReassessment = activeMode === 'REASSESSMENT';
                const originalMarks = sub.marksObtained;
                const revisedMarks = isReassessment ? originalMarks + 4 : originalMarks;
                const marksDiff = revisedMarks - originalMarks;

                return (
                  <div key={sub.subjectId} style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--brand-navy)' }}>{sub.subjectCode} — {sub.subjectName}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Semester {sub.semesterNumber} • {sub.examName}</span>
                      </div>
                      <Badge variant={isReassessment ? 'orange' : 'navy'}>{activeMode}</Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', padding: '0.85rem', backgroundColor: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Original Marks</span>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{originalMarks} / {sub.maximumMarks}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>{isReassessment ? 'Reassessment Result' : 'Rechecking Result'}</span>
                        <strong style={{ fontSize: '1.05rem', color: '#10B981' }}>{revisedMarks} / {sub.maximumMarks}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Marks Difference</span>
                        <strong style={{ fontSize: '1.05rem', color: marksDiff > 0 ? '#10B981' : 'var(--text-main)' }}>
                          {marksDiff > 0 ? `+${marksDiff} (Marks Increased)` : '0 (No Discrepancy)'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Final Result</span>
                        <Badge variant="active">PASS (Grade B+)</Badge>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <strong>Examiner Remarks:</strong> {isReassessment ? 'Answer script re-evaluated by external examiner panel. Marks increased by 4 marks based on detailed answer key.' : 'Answer script verified. No totaling or mark-entry discrepancy found.'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleDownloadSlip}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700 }}
                >
                  <Download size={14} /> Download Revised Marks Certificate
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}
                >
                  <Printer size={14} /> Print Result Memo
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 600 }}
                >
                  Apply for Another Subject
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (setActiveTab) {
                      setActiveTab('examination');
                    } else {
                      resetFlow();
                    }
                  }}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--brand-navy)', borderColor: 'var(--brand-navy)', fontWeight: 700 }}
                >
                  <RotateCcw size={14} /> Back to Examination
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReassessmentRecheckingPage;
