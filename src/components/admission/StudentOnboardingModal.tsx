import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  AdmissionApplication, 
  AdmissionDocument, 
  Program, 
  Department, 
  Institute, 
  AcademicYear, 
  Batch, 
  Semester, 
  Division, 
  Faculty 
} from '../../types';
import { db } from '../../services/db';
import { studentOnboardingService, OnboardStudentResult } from '../../services/studentOnboardingService';
import { useAuth } from '../../context/AuthContext';
import { 
  UserPlus, CheckCircle2, XCircle, AlertCircle, 
  FileText, ShieldCheck, IndianRupee, GraduationCap, 
  Building2, Users, Eye, Check, AlertTriangle, ArrowRight,
  Download, Printer, Sparkles, RefreshCw, Lock, Mail, Phone, Calendar, Copy
} from 'lucide-react';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  onSuccess: (result: OnboardStudentResult) => void;
}

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess
}) => {
  const { user } = useAuth();

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const batches = db.getBatches();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();
  const facultyList = db.getFaculty();
  const feeStructures = db.getFeeStructures();

  // Academic Mapping Form States
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedProgId, setSelectedProgId] = useState<string>('');
  const [selectedAyId, setSelectedAyId] = useState<string>('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedSemId, setSelectedSemId] = useState<string>('');
  const [selectedDivId, setSelectedDivId] = useState<string>('');
  const [selectedMentorId, setSelectedMentorId] = useState<string>('');
  const [selectedFeeStructId, setSelectedFeeStructId] = useState<string>('');
  const [customEnrollmentNo, setCustomEnrollmentNo] = useState<string>('');

  // Document Verification State
  const [documentStates, setDocumentStates] = useState<Record<string, { status: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'N/A'; remarks?: string }>>({});
  
  // Fee Verification State
  const [isFeeConfirmed, setIsFeeConfirmed] = useState<boolean>(false);
  const [feeAmount, setFeeAmount] = useState<number>(45000);
  const [feeReceiptNo, setFeeReceiptNo] = useState<string>('');

  // Processing & Error States
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<OnboardStudentResult | null>(null);

  // Initialize from application when opened
  React.useEffect(() => {
    if (application) {
      const prog = programs.find(p => p.id === application.programId) || programs[0];
      const dept = departments.find(d => d.id === application.departmentId) || departments.find(d => d.id === prog?.departmentId) || departments[0];
      const inst = institutes.find(i => i.id === application.instituteId) || institutes.find(i => i.id === dept?.instituteId) || institutes[0];
      const ay = academicYears.find(a => a.id === application.academicYearId) || academicYears.find(a => a.isCurrent) || academicYears[0];
      const batch = batches.find(b => b.programId === prog?.id) || batches[0];
      const sem = semesters.find(s => s.programId === prog?.id) || semesters[0];
      const div = divisions.find(d => d.semesterId === sem?.id) || divisions[0];
      const feeStruct = feeStructures.find(f => f.programId === prog?.id) || feeStructures[0];

      setSelectedInstId(inst?.id || 'inst-1');
      setSelectedDeptId(dept?.id || 'dept-cse');
      setSelectedProgId(prog?.id || 'prog-1');
      setSelectedAyId(ay?.id || 'ay-2026');
      setSelectedBatchId(batch?.id || 'batch-2026');
      setSelectedSemId(sem?.id || 'sem-1');
      setSelectedDivId(div?.id || 'div-1');
      setSelectedFeeStructId(feeStruct?.id || 'fs-btech-sem1');
      setSelectedMentorId(application.mentorId || '');
      
      const yearPrefix = '26';
      const nextSeq = (db.getStudents().length + 1).toString().padStart(4, '0');
      setCustomEnrollmentNo(`${yearPrefix}0101${nextSeq}`);

      setIsFeeConfirmed(Boolean(application.isFeePaid));
      setFeeAmount(Number(application.feeAmountPaid) || 45000);
      setFeeReceiptNo(application.feeReceiptNo || `SSIU-REC-2026-${nextSeq}`);

      // Map doc states
      const docMap: Record<string, { status: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'N/A'; remarks?: string }> = {};
      (application.documents || []).forEach(doc => {
        docMap[doc.id] = { status: doc.status || 'PENDING', remarks: doc.remarks };
      });
      setDocumentStates(docMap);

      setErrorMessage(null);
      setSuccessResult(null);
    }
  }, [application, isOpen]);

  if (!application) return null;

  // Filtered Programs by Department
  const departmentPrograms = useMemo(() => {
    if (!selectedDeptId || selectedDeptId === 'ALL') return programs;
    return programs.filter(p => p.departmentId === selectedDeptId);
  }, [programs, selectedDeptId]);

  // Filtered Department Faculty for Mentor Assignment
  const departmentFaculty = useMemo(() => {
    if (!selectedDeptId || selectedDeptId === 'ALL') return facultyList;
    return facultyList.filter(f => f.departmentId === selectedDeptId);
  }, [facultyList, selectedDeptId]);

  // Document verification count
  const allDocs = application.documents || [];
  const verifiedCount = Object.values(documentStates).filter(d => d.status === 'VERIFIED').length;
  const isAllDocsVerified = allDocs.length > 0 && verifiedCount === allDocs.length;

  const handleDocumentStatusChange = (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    setDocumentStates(prev => ({
      ...prev,
      [docId]: { ...prev[docId], status }
    }));
    if (user) {
      studentOnboardingService.verifyDocument(application.id, docId, status, user);
    }
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isAllDocsVerified) {
      setErrorMessage('Please verify all required admission documents before finalizing onboarding.');
      return;
    }

    if (!isFeeConfirmed) {
      setErrorMessage('Please confirm admission fee payment verification.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = studentOnboardingService.onboardStudent({
        applicationId: application.id,
        customEnrollmentNo,
        instituteId: selectedInstId,
        departmentId: selectedDeptId,
        programId: selectedProgId,
        academicYearId: selectedAyId,
        batchId: selectedBatchId,
        semesterId: selectedSemId,
        divisionId: selectedDivId,
        mentorId: selectedMentorId,
        feeStructureId: selectedFeeStructId,
        initialFeePaid: feeAmount,
        feeReceiptNo
      }, user);

      if (result.success) {
        setSuccessResult(result);
        onSuccess(result);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Onboarding failed due to an unexpected error.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Student Admission Onboarding Desk"
      subtitle={`Application No: ${application.applicationNumber || application.id} • ${application.applicantName}`}
      maxWidth="880px"
    >
      {successResult ? (
        /* STANDARDIZED ONBOARDING COMPLETED CONFIRMATION SCREEN */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <div style={{ padding: '1.5rem', background: '#ECFDF5', border: '2px solid #10B981', borderRadius: '8px', textAlign: 'center' }}>
            <CheckCircle2 size={48} color="#059669" style={{ margin: '0 auto 0.5rem auto' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#065F46', margin: 0, letterSpacing: '0.5px' }}>
              ONBOARDING COMPLETED
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.35rem' }}>
              Student Master Record created, automatically mapped to department, and student login account activated.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-surface-hover, #F8FAFC)',
            borderRadius: '8px',
            border: '1px solid var(--border-color, #E2E8F0)'
          }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>STUDENT</span>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                {successResult.student?.name}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>TEMPORARY ENROLLMENT</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-orange, #F37023)', fontFamily: 'monospace' }}>
                {successResult.temporaryEnrollmentNumber || successResult.enrollmentNo}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>STUDENT ACCESS CODE</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', fontFamily: 'monospace', letterSpacing: '2px' }}>
                {successResult.studentAccessCode || successResult.tempPassword}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>LOGIN STATUS</span>
              <div>
                <Badge variant="active">ACTIVE</Badge>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FINAL ENROLLMENT</span>
              <div>
                <Badge variant="orange">PENDING</Badge>
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ASSIGNED DEPARTMENT</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
                {departments.find(d => d.id === selectedDeptId)?.name || 'Computer Engineering'}
              </div>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px', fontSize: '0.8125rem', color: '#1E40AF' }}>
            <strong>Department Sync:</strong> This student is now automatically available in the department dashboard, student directory, and mentorship lists without requiring duplicate manual entry.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const creds = `Student: ${successResult.student?.name}\nTemporary Enrollment: ${successResult.temporaryEnrollmentNumber || successResult.enrollmentNo}\nStudent Access Code: ${successResult.studentAccessCode || successResult.tempPassword}\nLogin Status: ACTIVE\nFinal Enrollment: PENDING`;
                  navigator.clipboard.writeText(creds);
                  alert('Student Credentials copied to clipboard!');
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
              >
                <Copy size={14} /> Copy Credentials
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.print()}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
              >
                <Printer size={14} /> Print / Download Credentials
              </button>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800 }}
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* ONBOARDING WORKFLOW FORM */
        <form onSubmit={handleOnboardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 1. Onboarding Tracker Progress */}
          <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-surface-hover, #F8FAFC)', borderRadius: '6px', border: '1px solid var(--border-color, #E2E8F0)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                Onboarding Readiness Tracker: Step 7 of 11 (Academic Mapping &amp; Account Generation)
              </span>
              <Badge variant={isAllDocsVerified && isFeeConfirmed ? 'active' : 'orange'}>
                {isAllDocsVerified && isFeeConfirmed ? 'READY FOR ONBOARDING' : 'VERIFICATION IN PROGRESS'}
              </Badge>
            </div>
            <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${isAllDocsVerified && isFeeConfirmed ? 90 : 65}%`, height: '100%', background: isAllDocsVerified && isFeeConfirmed ? '#10B981' : 'var(--brand-orange, #F37023)', transition: 'width 0.3s ease' }} />
            </div>
          </div>

          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #F87171', color: '#B91C1C', borderRadius: '6px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} /> {errorMessage}
            </div>
          )}

          {/* 2. Candidate Overview Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '0.75rem',
            padding: '0.85rem 1rem',
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid var(--border-color, #E2E8F0)'
          }}>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>APPLICANT NAME</span>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{application.applicantName}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Gender: {application.gender} • DOB: {application.dateOfBirth}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>CONTACT INFO</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.phone}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>{application.email}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PARENT / GUARDIAN</span>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.guardianName}</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Mobile: {application.guardianPhone}</span>
            </div>
          </div>

          {/* 3. Document Verification Checklist */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={16} color="var(--brand-orange, #F37023)" /> Mandatory Document Verification ({verifiedCount}/{allDocs.length})
              </h4>
              <Badge variant={isAllDocsVerified ? 'active' : 'orange'}>
                {isAllDocsVerified ? 'ALL VERIFIED' : 'PENDING ACTION'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {allDocs.length === 0 ? (
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted, #64748B)' }}>No uploaded documents found for this applicant.</p>
              ) : (
                allDocs.map(doc => {
                  const state = documentStates[doc.id] || { status: 'PENDING' };
                  return (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.6rem 0.85rem',
                        background: state.status === 'VERIFIED' ? '#ECFDF5' : state.status === 'REJECTED' ? '#FEF2F2' : '#F8FAFC',
                        border: `1px solid ${state.status === 'VERIFIED' ? '#A7F3D0' : state.status === 'REJECTED' ? '#FCA5A5' : '#E2E8F0'}`,
                        borderRadius: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color={state.status === 'VERIFIED' ? '#059669' : '#64748B'} />
                        <div>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{doc.name}</span>
                          {doc.fileUrl && (
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', color: 'var(--brand-orange, #F37023)', marginLeft: '0.5rem' }}>
                              <Eye size={10} /> View Document
                            </a>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          className={`btn btn-sm ${state.status === 'VERIFIED' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => handleDocumentStatusChange(doc.id, 'VERIFIED')}
                        >
                          <Check size={12} /> Verify
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${state.status === 'REJECTED' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                          onClick={() => handleDocumentStatusChange(doc.id, 'REJECTED')}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 4. Admission Fee Payment Verification */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IndianRupee size={16} color="var(--brand-orange, #F37023)" /> Admission Confirmation Fee Verification
              </h4>
              <Badge variant={isFeeConfirmed ? 'active' : 'orange'}>
                {isFeeConfirmed ? 'FEE CONFIRMED' : 'PENDING PAYMENT'}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Fee Amount (INR)</label>
                <input
                  type="number"
                  className="form-control"
                  value={feeAmount}
                  onChange={e => setFeeAmount(Number(e.target.value))}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Payment Receipt Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={feeReceiptNo}
                  onChange={e => setFeeReceiptNo(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
                <input
                  type="checkbox"
                  id="feeConfirmCheck"
                  checked={isFeeConfirmed}
                  onChange={e => setIsFeeConfirmed(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="feeConfirmCheck" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)', cursor: 'pointer', margin: 0 }}>
                  Confirm Fee Settlement
                </label>
              </div>
            </div>
          </div>

          {/* 5. Academic Mapping & Mentor Assignment */}
          <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <GraduationCap size={16} color="var(--brand-orange, #F37023)" /> Academic Hierarchy Mapping &amp; Mentorship
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {/* Program */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Program Enrolled</label>
                <select
                  className="form-control"
                  value={selectedProgId}
                  onChange={e => {
                    setSelectedProgId(e.target.value);
                    const p = programs.find(x => x.id === e.target.value);
                    if (p?.departmentId) setSelectedDeptId(p.departmentId);
                  }}
                  style={{ fontSize: '0.8125rem' }}
                  required
                >
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Department</label>
                <select
                  className="form-control"
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Academic Year */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Academic Session</label>
                <select
                  className="form-control"
                  value={selectedAyId}
                  onChange={e => setSelectedAyId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.name}</option>
                  ))}
                </select>
              </div>

              {/* Batch */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Batch</label>
                <select
                  className="form-control"
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Semester</label>
                <select
                  className="form-control"
                  value={selectedSemId}
                  onChange={e => setSelectedSemId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {semesters.map(s => (
                    <option key={s.id} value={s.id}>Semester {s.number}</option>
                  ))}
                </select>
              </div>

              {/* Division */}
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Division / Section</label>
                <select
                  className="form-control"
                  value={selectedDivId}
                  onChange={e => setSelectedDivId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  {divisions.map(div => (
                    <option key={div.id} value={div.id}>{div.name}</option>
                  ))}
                </select>
              </div>

              {/* Faculty Mentor Assignment */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Assigned Faculty Mentor</label>
                <select
                  className="form-control"
                  value={selectedMentorId}
                  onChange={e => setSelectedMentorId(e.target.value)}
                  style={{ fontSize: '0.8125rem' }}
                >
                  <option value="">-- Select Faculty Mentor --</option>
                  {departmentFaculty.map(fac => (
                    <option key={fac.id} value={fac.id}>{fac.name} ({fac.designation || 'Faculty'}, {fac.email})</option>
                  ))}
                </select>
              </div>

              {/* Enrollment Number Preview / Custom */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700 }}>Assigned Enrollment Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={customEnrollmentNo}
                  onChange={e => setCustomEnrollmentNo(e.target.value)}
                  style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', fontFamily: 'monospace' }}
                  required
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                  This will serve as the student's unique username for ERP login.
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isProcessing}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isProcessing}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
            >
              {isProcessing ? <RefreshCw size={16} className="spin" /> : <UserPlus size={16} />}
              {isProcessing ? 'Processing Onboarding...' : 'Confirm & Complete Student Onboarding'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
