import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AdmissionApplication, User, Student } from '../../types';
import { db } from '../../services/db';
import { studentOnboardingService, OnboardStudentResult } from '../../services/studentOnboardingService';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { useAuth } from '../../context/AuthContext';
import { 
  UserCheck, FileCheck, IndianRupee, UserPlus, 
  ShieldCheck, CheckCircle2, XCircle, AlertCircle, 
  ArrowRight, ArrowLeft, Download, Eye, Check, Lock,
  GraduationCap, Calendar, Phone, Mail, Building2,
  Sparkles, KeyRound, AlertTriangle, RefreshCw, Layers
} from 'lucide-react';

interface StudentOnboardingStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  onSuccess: (result: OnboardStudentResult) => void;
}

export type StepperStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const StudentOnboardingStepperModal: React.FC<StudentOnboardingStepperModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<StepperStep>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form & Workflow States
  const [admissionRemarks, setAdmissionRemarks] = useState('');
  const [docRejectionModalDocId, setDocRejectionModalDocId] = useState<string | null>(null);
  const [docRejectionReason, setDocRejectionReason] = useState('');
  
  // Academic Placement & Student Master State
  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const batches = db.getBatches();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();
  const facultyList = db.getUsers().filter(u => u.role === 'FACULTY' || u.role === 'MENTOR' || u.role === 'HOD');

  const initialProg = programs.find(p => p.id === application?.programId) || programs[0];
  const initialDept = departments.find(d => d.id === application?.departmentId) || departments.find(d => d.id === initialProg?.departmentId) || departments[0];
  const initialInst = institutes.find(i => i.id === application?.instituteId) || institutes.find(i => i.id === initialDept?.instituteId) || institutes[0];

  const [selectedInstituteId, setSelectedInstituteId] = useState(initialInst?.id || 'inst-1');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(initialDept?.id || 'dept-cse');
  const [selectedProgramId, setSelectedProgramId] = useState(initialProg?.id || 'prog-1');
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('ay-2026');
  const [selectedBatchId, setSelectedBatchId] = useState('batch-2026');
  const [selectedSemesterId, setSelectedSemesterId] = useState('sem-1');
  const [selectedDivisionId, setSelectedDivisionId] = useState('div-1');
  
  // Student ID & Temporary Enrollment Number
  const defaultEnrollmentNo = useMemo(() => {
    return studentOnboardingService.generateTemporaryEnrollmentNumber('2026');
  }, [application]);

  const nextSeq = useMemo(() => {
    return (db.getStudents().length + 1).toString().padStart(4, '0');
  }, []);

  const defaultStudentId = useMemo(() => {
    return `STU2026-${nextSeq}`;
  }, [nextSeq]);

  const [enrollmentNumber, setEnrollmentNumber] = useState(defaultEnrollmentNo);
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [mentorRemarks, setMentorRemarks] = useState('');
  const [accountStatus, setAccountStatus] = useState<'PENDING_ACTIVATION' | 'ACTIVE'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!application) return null;

  // Step 1 Check
  const isAdmissionApproved = ['APPROVED', 'ADMISSION_CONFIRMED', 'DOCUMENTS_VERIFIED', 'READY_FOR_ONBOARDING', 'CONVERTED', 'ONBOARDED'].includes(application.status);
  
  // Step 2 Check
  const docs = application.documents || [];
  const unverifiedDocs = docs.filter(d => d.status !== 'VERIFIED');
  const areDocsVerified = docs.length > 0 && unverifiedDocs.length === 0;

  // Step 3 Check
  const isFeeVerified = Boolean(application.isFeePaid);

  // Filtered mentors for department
  const filteredMentors = facultyList.filter(f => !selectedDepartmentId || f.departmentId === selectedDepartmentId || !f.departmentId);

  // Stepper Definition
  const steps = [
    { num: 1, label: 'Admission', status: isAdmissionApproved ? 'COMPLETED' : 'IN_PROGRESS' },
    { num: 2, label: 'Documents', status: areDocsVerified ? 'COMPLETED' : isAdmissionApproved ? 'PENDING' : 'LOCKED' },
    { num: 3, label: 'Fee Verification', status: isFeeVerified ? 'COMPLETED' : areDocsVerified ? 'PENDING' : 'LOCKED' },
    { num: 4, label: 'Student Master', status: currentStep >= 4 ? 'IN_PROGRESS' : 'PENDING' },
    { num: 5, label: 'Enrollment Number', status: currentStep >= 5 ? 'IN_PROGRESS' : 'PENDING' },
    { num: 6, label: 'Mentor Assignment', status: selectedMentorId ? 'COMPLETED' : currentStep >= 6 ? 'IN_PROGRESS' : 'PENDING' },
    { num: 7, label: 'ERP Account', status: currentStep >= 7 ? 'COMPLETED' : 'PENDING' },
    { num: 8, label: 'Final Onboarding', status: application.status === 'CONVERTED' ? 'COMPLETED' : 'PENDING' }
  ];

  const handleApproveAdmission = () => {
    if (!user) return;
    application.status = 'APPROVED';
    db.updateEntity('admissionApplications', application.id, application, `Admission approved by ${user.name}`);
    db.logAudit('ADMISSION_APPROVED', 'AdmissionApplication', `Application ${application.applicationNumber} approved by ${user.name}. Remarks: ${admissionRemarks}`, user.name, user.role, { recordId: application.id });
    setFeedback({ type: 'success', text: 'Admission application approved successfully.' });
  };

  const handleHoldAdmission = () => {
    if (!user) return;
    studentOnboardingService.holdApplication(application.id, admissionRemarks || 'Application put on hold by Onboarding Officer', user);
    setFeedback({ type: 'success', text: 'Application put on hold.' });
  };

  const handleRejectAdmission = () => {
    if (!user) return;
    if (!admissionRemarks.trim()) {
      setFeedback({ type: 'error', text: 'Mandatory rejection reason required in remarks.' });
      return;
    }
    studentOnboardingService.rejectApplication(application.id, admissionRemarks, user);
    setFeedback({ type: 'error', text: 'Application rejected.' });
  };

  const handleVerifyDoc = (docId: string) => {
    if (!user) return;
    studentOnboardingService.verifyDocument(application.id, docId, 'VERIFIED', user, 'Verified during onboarding session');
    setFeedback({ type: 'success', text: 'Document verified.' });
  };

  const handleConfirmRejectDoc = () => {
    if (!user || !docRejectionModalDocId) return;
    if (!docRejectionReason.trim()) {
      setFeedback({ type: 'error', text: 'Please enter mandatory rejection reason.' });
      return;
    }
    studentOnboardingService.verifyDocument(application.id, docRejectionModalDocId, 'REJECTED', user, docRejectionReason);
    setDocRejectionModalDocId(null);
    setDocRejectionReason('');
    setFeedback({ type: 'error', text: 'Document rejected with reason.' });
  };

  const handleFinalOnboard = () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const result = studentOnboardingService.onboardStudent({
        applicationId: application.id,
        customEnrollmentNo: enrollmentNumber,
        customStudentId: studentId,
        instituteId: selectedInstituteId,
        departmentId: selectedDepartmentId,
        programId: selectedProgramId,
        academicYearId: selectedAcademicYearId,
        batchId: selectedBatchId,
        semesterId: selectedSemesterId,
        divisionId: selectedDivisionId,
        mentorId: selectedMentorId || undefined,
        initialFeePaid: application.feeAmountPaid || (application.isFeePaid ? 45000 : 0),
        feeReceiptNo: application.feeReceiptNo || `SSIU-REC-2026-${nextSeq}`,
        remarks: mentorRemarks || 'Onboarding completed via Onboarding Officer Stepper'
      }, user);

      setIsSubmitting(false);
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setFeedback({ type: 'error', text: result.message });
      }
    } catch (e: any) {
      setIsSubmitting(false);
      setFeedback({ type: 'error', text: e.message || 'Onboarding failed.' });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Onboarding & Master Creation Workspace"
      subtitle={`${application.applicantName} • Application No: ${application.applicationNumber || application.id} • ${initialProg?.name || 'Program'}`}
      maxWidth="940px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Feedback Alert */}
        {feedback && (
          <div style={{
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#065F46' : '#B91C1C',
            border: `1px solid ${feedback.type === 'success' ? '#10B981' : '#F87171'}`
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.text}
          </div>
        )}

        {/* 8-Step Visual Stepper Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '0.35rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          padding: '0.75rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          {steps.map(step => {
            const isCurrent = currentStep === step.num;
            const isDone = step.status === 'COMPLETED' || currentStep > step.num;
            return (
              <button
                key={step.num}
                type="button"
                onClick={() => setCurrentStep(step.num as StepperStep)}
                style={{
                  border: 'none',
                  background: isCurrent ? 'var(--brand-navy, #0B192C)' : isDone ? '#ECFDF5' : '#FFFFFF',
                  color: isCurrent ? '#FFFFFF' : isDone ? '#047857' : 'var(--text-muted, #64748B)',
                  borderRadius: '6px',
                  padding: '0.4rem 0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: isCurrent ? 800 : 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  boxShadow: isCurrent ? '0 2px 4px rgba(11,25,44,0.15)' : 'none',
                  borderBottom: isCurrent ? '3px solid var(--brand-orange, #F37023)' : isDone ? '2px solid #10B981' : '1px solid #E2E8F0',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                  <span>{step.num}.</span>
                  {isDone && <Check size={11} color="#059669" strokeWidth={3} />}
                </div>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                  {step.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* STEP 1: ADMISSION VERIFICATION */}
        {currentStep === 1 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserCheck size={18} color="var(--brand-orange, #F37023)" /> Step 1: Admission Verification &amp; Eligibility
              </h4>
              <Badge variant={isAdmissionApproved ? 'active' : 'orange'}>
                {application.status}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>APPLICATION NUMBER</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.applicationNumber || application.id}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ADMISSION DATE</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.submittedAt || '2026-06-01'}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ACADEMIC YEAR</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>2026–2027</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ADMISSION TYPE</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.admissionType || 'REGULAR / MERIT QUOTA'}</div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'block', marginBottom: '4px' }}>
                Officer Verification Remarks
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Verified ACPC merit allotment and eligibility criteria..."
                value={admissionRemarks}
                onChange={e => setAdmissionRemarks(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleApproveAdmission}>
                  <Check size={14} /> Approve Admission
                </button>
                <button type="button" className="btn btn-secondary btn-sm" onClick={handleHoldAdmission}>
                  Hold Application
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleRejectAdmission}>
                  <XCircle size={14} /> Reject
                </button>
              </div>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(2)}>
                Next: Document Verification <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: DOCUMENT VERIFICATION */}
        {currentStep === 2 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileCheck size={18} color="var(--brand-orange, #F37023)" /> Step 2: Uploaded Documents Verification
              </h4>
              <Badge variant={areDocsVerified ? 'active' : 'orange'}>
                {docs.filter(d => d.status === 'VERIFIED').length} of {docs.length} Verified
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {docs.length === 0 ? (
                <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.8125rem' }}>No documents attached with this application.</p>
              ) : (
                docs.map(doc => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.65rem 0.85rem',
                      background: doc.status === 'VERIFIED' ? '#ECFDF5' : doc.status === 'REJECTED' ? '#FEF2F2' : '#F8FAFC',
                      border: `1px solid ${doc.status === 'VERIFIED' ? '#A7F3D0' : doc.status === 'REJECTED' ? '#FCA5A5' : '#E2E8F0'}`,
                      borderRadius: '6px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        Status: <strong>{doc.status}</strong> {doc.verifiedBy && `• Verified by ${doc.verifiedBy}`}
                        {doc.rejectionReason && <span style={{ color: '#DC2626', display: 'block' }}>Reason: {doc.rejectionReason}</span>}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Eye size={12} /> Preview
                        </a>
                      )}
                      <button type="button" className="btn btn-primary btn-xs" onClick={() => handleVerifyDoc(doc.id)} disabled={doc.status === 'VERIFIED'}>
                        <Check size={12} /> Verify
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-xs"
                        onClick={() => {
                          setDocRejectionModalDocId(doc.id);
                          setDocRejectionReason('');
                        }}
                        disabled={doc.status === 'REJECTED'}
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Doc Rejection Dialog */}
            {docRejectionModalDocId && (
              <div style={{ padding: '0.85rem', background: '#FEF2F2', border: '1px solid #F87171', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B' }}>Mandatory Rejection Reason:</span>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="e.g. Document copy is illegible or missing seal..."
                  value={docRejectionReason}
                  onChange={e => setDocRejectionReason(e.target.value)}
                  style={{ fontSize: '0.75rem' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                  <button type="button" className="btn btn-secondary btn-xs" onClick={() => setDocRejectionModalDocId(null)}>Cancel</button>
                  <button type="button" className="btn btn-danger btn-xs" onClick={handleConfirmRejectDoc}>Confirm Rejection</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(1)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(3)} disabled={!areDocsVerified}>
                Next: Fee Verification <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FEE VERIFICATION */}
        {currentStep === 3 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IndianRupee size={18} color="var(--brand-orange, #F37023)" /> Step 3: Admission Fee Settlement Verification
              </h4>
              <Badge variant={isFeeVerified ? 'active' : 'gold'}>
                {isFeeVerified ? 'FEE PAID & CONFIRMED' : 'FEE PENDING'}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TOTAL PROGRAM FEE</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>₹60,000 / Sem</div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PAID / CONFIRMATION AMOUNT</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#059669' }}>
                  ₹{(application.feeAmountPaid || (application.isFeePaid ? 45000 : 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PENDING TUITION BALANCE</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#D97706' }}>
                  ₹{Math.max(0, 60000 - (application.feeAmountPaid || (application.isFeePaid ? 45000 : 0))).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>RECEIPT NUMBER</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
                  <code>{application.feeReceiptNo || `SSIU-REC-2026-${nextSeq}`}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(2)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(4)} disabled={!isFeeVerified}>
                Next: Student Master Creation <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: STUDENT MASTER CREATION */}
        {currentStep === 4 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <GraduationCap size={18} color="var(--brand-orange, #F37023)" /> Step 4: Student Master Details Confirmation
              </h4>
              <Badge variant="navy">Pre-Filled From Admission</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>INSTITUTE</label>
                <select className="form-control" value={selectedInstituteId} onChange={e => setSelectedInstituteId(e.target.value)} style={{ fontSize: '0.8125rem' }}>
                  {institutes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DEPARTMENT</label>
                <select className="form-control" value={selectedDepartmentId} onChange={e => setSelectedDepartmentId(e.target.value)} style={{ fontSize: '0.8125rem' }}>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PROGRAM / COURSE</label>
                <select className="form-control" value={selectedProgramId} onChange={e => setSelectedProgramId(e.target.value)} style={{ fontSize: '0.8125rem' }}>
                  {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>SEMESTER &amp; DIVISION</label>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <select className="form-control" value={selectedSemesterId} onChange={e => setSelectedSemesterId(e.target.value)} style={{ fontSize: '0.8125rem', flex: 1 }}>
                    {semesters.map(s => <option key={s.id} value={s.id}>Semester {s.number}</option>)}
                  </select>
                  <select className="form-control" value={selectedDivisionId} onChange={e => setSelectedDivisionId(e.target.value)} style={{ fontSize: '0.8125rem', flex: 1 }}>
                    {divisions.map(d => <option key={d.id} value={d.id}>Div {d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(3)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(5)}>
                Next: Enrollment Number <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: ENROLLMENT / STUDENT ID */}
        {currentStep === 5 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={18} color="var(--brand-orange, #F37023)" /> Step 5: Enrollment Number Generation
              </h4>
              <Badge variant="navy">Auto-Generated Unique Sequence</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
<div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'block', marginBottom: '4px' }}>
                  Official University Enrollment Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={enrollmentNumber}
                  onChange={e => setEnrollmentNumber(e.target.value)}
                  style={{ fontSize: '0.875rem', fontWeight: 800, color: '#047857' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>Permanent university registration and ERP login username</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(4)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(6)}>
                Next: Mentor Assignment <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: MENTOR ASSIGNMENT */}
        {currentStep === 6 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <UserPlus size={18} color="var(--brand-orange, #F37023)" /> Step 6: Faculty Mentor Allocation
              </h4>
              <Badge variant="navy">Department Scope Matched</Badge>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'block', marginBottom: '4px' }}>
                Select Faculty Mentor
              </label>
              <select
                className="form-control"
                value={selectedMentorId}
                onChange={e => setSelectedMentorId(e.target.value)}
                style={{ fontSize: '0.875rem', fontWeight: 700 }}
              >
                <option value="">-- Assign Later / Unassigned --</option>
                {filteredMentors.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.designation || 'Faculty'} • CSE Department • Current Mentees: 12/25)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'block', marginBottom: '4px' }}>
                Mentorship Allocation Remarks
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Allocated initial academic & personal guidance mentor..."
                value={mentorRemarks}
                onChange={e => setMentorRemarks(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(5)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(7)}>
                Next: ERP Account Setup <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: ERP ACCOUNT SETUP */}
        {currentStep === 7 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <KeyRound size={18} color="var(--brand-orange, #F37023)" /> Step 7: Student ERP Account &amp; Credential Activation
              </h4>
              <Badge variant="active">Student Role</Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ERP LOGIN USERNAME</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                  <code>{enrollmentNumber}</code>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>INITIAL PASSWORD</span>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>
                  <code>Student@123</code> (Forced change on 1st login)
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>REGISTERED EMAIL</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.email}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(6)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCurrentStep(8)}>
                Next: Final Review &amp; Onboard <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 8: FINAL SUMMARY CHECKLIST */}
        {currentStep === 8 && (
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={18} color="#059669" /> Step 8: Final Onboarding Confirmation Checklist
              </h4>
              <Badge variant="active">All Prerequisites Verified</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Admission Approved &amp; Verified
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Mandatory Documents Verified &amp; Ready for Vault Migration
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Admission Confirmation Fee Payment Confirmed
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Academic Placement: {initialProg?.name}, Semester 1
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#047857', fontWeight: 700 }}>
                <CheckCircle2 size={16} /> Enrollment Number Assigned: <code>{enrollmentNumber}</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCurrentStep(7)}>
                <ArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalOnboard}
                disabled={isSubmitting}
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--brand-orange, #F37023)', border: 'none' }}
              >
                <Sparkles size={16} /> {isSubmitting ? 'Onboarding...' : 'COMPLETE STUDENT ONBOARDING'}
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
