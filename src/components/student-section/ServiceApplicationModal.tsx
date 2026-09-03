import React, { useState, useMemo } from 'react';
import { StudentSectionService, StudentSectionDeliveryMode } from '../../types/studentSection';
import { Student, User } from '../../types';
import { db } from '../../services/db';
import { studentSectionService } from '../../services/studentSectionService';
import { studentSectionFeeMasterService } from '../../services/studentSectionFeeMasterService';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useModalScrollLock } from '../../utils/modalScrollLock';
import swarrnimLogo from '../../assets/swarrnim-university-logo.png';
import { 
  FileText, Award, CheckCircle2, Clock, Upload, Trash2, Eye, 
  Send, AlertCircle, ArrowRight, ShieldCheck, Check, Sparkles,
  Info, Building2, User as UserIcon, Phone, Mail, MapPin, Calendar, X
} from 'lucide-react';

interface ServiceApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: StudentSectionService;
  user: User;
  onProceedToPayment: (requestId: string) => void;
  onSuccessToast: (text: string) => void;
}

export const ServiceApplicationModal: React.FC<ServiceApplicationModalProps> = ({
  isOpen,
  onClose,
  service,
  user,
  onProceedToPayment,
  onSuccessToast
}) => {
  // Retrieve comprehensive student profile from Student Master (Single Source of Truth)
  const student: Student = useMemo(() => {
    const students = db.getStudents();
    return students.find(s => s.id === user.id || s.email === user.email || s.enrollmentNo === user.enrollmentNo) || students[0];
  }, [user]);

  // Academic Master lookups
  const institute = useMemo(() => db.getInstitutes().find(i => i.id === student?.instituteId), [student]);
  const department = useMemo(() => db.getDepartments().find(d => d.id === student?.departmentId), [student]);
  const program = useMemo(() => db.getPrograms().find(p => p.id === student?.programId), [student]);
  const semester = useMemo(() => db.getSemesters().find(s => s.id === student?.semesterId), [student]);
  const division = useMemo(() => db.getDivisions().find(d => d.id === student?.divisionId), [student]);
  const batch = useMemo(() => db.getBatches().find(b => b.id === student?.batchId), [student]);

  // Form State: Core & Common
  const [purpose, setPurpose] = useState('');
  const [copies, setCopies] = useState(1);
  const [isUrgent, setIsUrgent] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<StudentSectionDeliveryMode>('PHYSICAL');
  const [deliveryAddress, setDeliveryAddress] = useState(student?.address || student?.currentAddressLine1 || '');
  const [remarks, setRemarks] = useState('');
  const [declarationAccepted, setDeclarationAccepted] = useState(true);

  // Form State: Graduation / Academic Status (Pass-out / Non-pass-out selection)
  const [passoutStatus, setPassoutStatus] = useState<'NON_PASSOUT' | 'PASSOUT'>('NON_PASSOUT');
  const [passingMonthYear, setPassingMonthYear] = useState('May 2026');
  const [finalCgpa, setFinalCgpa] = useState('8.42');
  const [lastExamSeatNo, setLastExamSeatNo] = useState(student?.enrollmentNo || '26SSIU042');

  // Form State: Service Specific Fields (Comprehensive University Form Data)
  const [serviceData, setServiceData] = useState<Record<string, any>>({
    validFrom: new Date().toISOString().split('T')[0],
    validTo: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    
    // Transcript fields
    semesterRange: 'All Completed Semesters (Sem 1 to 4)',
    transcriptAgency: 'World Education Services (WES) Canada',
    wesRefNumber: '',
    
    // Migration fields
    migrationTargetUniversity: '',
    migrationTargetState: 'Gujarat',
    migrationReason: 'Higher Studies in State/Central University',
    
    // Degree / Provisional fields
    convocationType: 'In-Absentia Postal Dispatch',
    passingYear: '2026',
    degreeClass: 'First Class with Distinction',
    
    // No Backlog & Trial Certificate
    clearedSemestersDetails: 'Sem 1 to Sem 4 cleared in First Attempt with zero active backlogs',
    trialAttemptsDetails: 'All semester examinations passed in 1st trial attempt',
    
    // Document Verification & Attestation fields
    docTypeToVerify: 'Grade Sheet / Mark Sheet',
    docVerificationCopies: 1,
    verificationOrgName: '',
    verificationRecipientDesignation: 'HR Officer / Visa Processing Officer / Evaluation Authority',
    
    // Duplicate Marksheet fields
    marksheetSemester: 'Semester 3',
    marksheetExamType: 'Regular',
    marksheetExamMonthYear: 'Winter (Dec 2025)',
    marksheetSrNo: '',
    duplicateMarksheetReason: 'Original Marksheet Lost / Misplaced during transit',
    
    // Rank & Language Certificate
    studentRank: 'Top 5% in Department',
    mediumOfInstruction: 'English Language (Official Medium of Instruction & Examination)',
    cgpaConversionFormula: 'Percentage (%) = CGPA × 10 (SSIU Official Scheme)',
    
    // LOR & Transfer
    lorProfessorName: 'Dr. R. K. Sharma (Professor & HOD)',
    lorTargetUniversity: 'International Graduate Admissions',
    leavingReason: 'Completed Degree Program',
    leavingTargetInstitute: '',
    
    // Duplicate ID Card
    idCardLossReason: 'Lost during transit on campus bus route',
    idCardPoliceDiaryNo: '',
    
    // General / Other
    otherCertificateDetails: ''
  });

  const handleFieldChange = (key: string, value: any) => {
    setServiceData(prev => ({ ...prev, [key]: value }));
  };

  // Form State: Uploaded Supporting Documents
  const [uploadedDocs, setUploadedDocs] = useState<Array<{
    name: string;
    url: string;
    fileSize: string;
    uploadedAt: string;
    required: boolean;
  }>>(() => {
    return (service.requiredDocuments || []).map((docName, idx) => ({
      name: docName,
      url: `idb://mock-docs/${service.code.toLowerCase()}_req_${idx + 1}.pdf`,
      fileSize: '1.2 MB',
      uploadedAt: new Date().toLocaleDateString('en-IN'),
      required: true
    }));
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Centralized Dynamic Service Fee Master Calculation (Data-Driven)
  const feeCalculation = useMemo(() => {
    return studentSectionFeeMasterService.calculateServiceFee({
      serviceCode: service.code,
      serviceName: service.name,
      passoutStatus,
      docTypeToVerify: serviceData.docTypeToVerify,
      copies,
      isUrgent,
      deliveryMode
    });
  }, [service, passoutStatus, serviceData.docTypeToVerify, copies, isUrgent, deliveryMode]);

  const totalFee = feeCalculation.totalFee;

  // SLA Calculation
  const slaDays = isUrgent ? (service.urgentProcessingDays || 1) : (service.processingDays || 2);

  // File Upload Simulator
  const handleFileUpload = (docIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller file.');
      return;
    }

    const sizeKb = (file.size / 1024).toFixed(1);
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${sizeKb} KB`;

    setUploadedDocs(prev => {
      const copy = [...prev];
      copy[docIndex] = {
        name: copy[docIndex]?.name || file.name,
        url: URL.createObjectURL(file),
        fileSize: sizeStr,
        uploadedAt: new Date().toLocaleDateString('en-IN'),
        required: copy[docIndex]?.required ?? true
      };
      return copy;
    });
  };

  const handleRemoveDoc = (docIndex: number) => {
    setUploadedDocs(prev => prev.filter((_, idx) => idx !== docIndex));
  };

  // Submit Handler (Proceed to Payment or Save Draft)
  const handleSubmit = (isDraft = false) => {
    if (!isDraft && !purpose.trim()) {
      setFormError('Please provide a specific purpose / reason for this service application.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const newReq = studentSectionService.createRequest({
        serviceId: service.id,
        purpose: purpose.trim() || 'General Official Student Request',
        copies,
        isUrgent,
        deliveryMode,
        deliveryAddress: deliveryMode !== 'DIGITAL' ? deliveryAddress.trim() : undefined,
        serviceSpecificData: {
          ...serviceData,
          passoutStatus,
          passingMonthYear: passoutStatus === 'PASSOUT' ? passingMonthYear : undefined,
          finalCgpa: passoutStatus === 'PASSOUT' ? finalCgpa : undefined,
          lastExamSeatNo: passoutStatus === 'PASSOUT' ? lastExamSeatNo : undefined,
          declarationAccepted,
          remarks: remarks.trim()
        },
        attachments: uploadedDocs,
        isDraft
      }, user);

      setIsSubmitting(false);
      onClose();

      if (isDraft) {
        onSuccessToast(`Application saved as draft (Ref: ${newReq.requestNo}).`);
      } else if (newReq.calculatedFee > 0) {
        onProceedToPayment(newReq.id);
      } else {
        onSuccessToast(`Application ${newReq.requestNo} submitted successfully! (Free of Charge).`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Failed to submit application.');
    }
  };

  useModalScrollLock(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="student-section-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="student-section-modal-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Apply: ${service.name}`}
      >
        {/* ── 1. FIXED/PINNED OFFICIAL UNIVERSITY HEADER ────────────────────── */}
        <div className="student-section-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <div style={{ background: '#FFFFFF', padding: '5px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
              <img src={swarrnimLogo} alt="Swarrnim Logo" style={{ height: '32px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                SWARRNIM STARTUP &amp; INNOVATION UNIVERSITY
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 900, color: '#FFFFFF', margin: '2px 0 0 0' }}>
                Student Section • {service.name}
              </h2>
              <div style={{ fontSize: '0.71875rem', color: '#CBD5E1', marginTop: '2px' }}>
                Service Code: <strong style={{ fontFamily: 'monospace' }}>{service.code}</strong> • Category: <strong>{service.category}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{
                background: '#F37023',
                color: '#FFFFFF',
                fontSize: '0.6875rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                NEW APPLICATION
              </span>
              <span style={{ fontSize: '0.6875rem', color: '#E2E8F0' }}>
                Academic Year: <strong>2026-27</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s',
                marginLeft: '0.25rem'
              }}
              title="Close application modal"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── 2. INTERNALLY SCROLLABLE FORM BODY ────────────────────────────── */}
        <div className="student-section-modal-body">

        {formError && (
          <div style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#991B1B',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            <span>{formError}</span>
          </div>
        )}

        {/* ── SECTION 1: STUDENT INFORMATION (AUTO-FILLED & READ-ONLY) ──────── */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          padding: '1.1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserIcon size={16} color="var(--brand-navy, #0F2C59)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Section 1: Student Information
              </h3>
            </div>
            <span style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#047857', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Auto-filled from Student Profile (Read Only)
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
            fontSize: '0.78125rem'
          }}>
            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Student Full Name:</span>
              <strong style={{ color: '#0F2C59', fontSize: '0.8125rem' }}>{student?.fullName || student?.name || user.name}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Enrollment Number:</span>
              <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{student?.enrollmentNo || user.enrollmentNo || '230101001'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Admission Number:</span>
              <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{student?.admissionNumber || 'ADM-2026-0089'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Application Number:</span>
              <strong style={{ color: '#0F2C59', fontFamily: 'monospace' }}>{student?.applicationNumber || 'APP/2026/0042'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Institute:</span>
              <strong style={{ color: '#0F2C59' }}>{institute?.name || 'Swarrnim Institute of Technology'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Department / Branch:</span>
              <strong style={{ color: '#0F2C59' }}>{department?.name || 'Computer Science & Engineering'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Program / Course:</span>
              <strong style={{ color: '#0F2C59' }}>{program?.name || 'B.Tech Computer Science & Engineering'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Semester &amp; Division:</span>
              <strong style={{ color: '#0F2C59' }}>{semester ? `Semester ${semester.number}` : 'Semester 4'} • {division?.name || 'Division A'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Batch / Year of Admission:</span>
              <strong style={{ color: '#0F2C59' }}>{batch?.name || '2024-2028'} • 2024</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Date of Birth &amp; Gender:</span>
              <strong style={{ color: '#0F2C59' }}>{student?.dateOfBirth || '15 Apr 2005'} • {student?.gender || 'Male'}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Mobile &amp; Email:</span>
              <strong style={{ color: '#0F2C59' }}>{student?.phone || '+91 98765 43210'} • {student?.email || user.email}</strong>
            </div>

            <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Parent / Guardian:</span>
              <strong style={{ color: '#0F2C59' }}>{student?.guardianName || student?.fatherName || 'Shri Rameshwar Patel'}</strong>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: ACADEMIC STATUS & SERVICE-SPECIFIC REQUIRED INFORMATION ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          padding: '1.1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.875rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            <FileText size={16} color="var(--brand-orange, #F37023)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Section 2: Academic Status &amp; Service Information
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Academic Standing / Pass-out Status (As per Official Paper Form) */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '0.75rem 0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78125rem', color: '#0F2C59', margin: 0 }}>
                Academic / Student Enrollment Status <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="passoutStatus"
                    value="NON_PASSOUT"
                    checked={passoutStatus === 'NON_PASSOUT'}
                    onChange={() => setPassoutStatus('NON_PASSOUT')}
                  />
                  <span>Currently Enrolled Regular Student (Non-Passout)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <input
                    type="radio"
                    name="passoutStatus"
                    value="PASSOUT"
                    checked={passoutStatus === 'PASSOUT'}
                    onChange={() => setPassoutStatus('PASSOUT')}
                  />
                  <span>Pass-out / Graduated Alumnus</span>
                </label>
              </div>

              {passoutStatus === 'PASSOUT' && (
                <div className="grid-3" style={{ gap: '0.625rem', marginTop: '0.375rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Month &amp; Year of Passing</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. May 2025"
                      value={passingMonthYear}
                      onChange={e => setPassingMonthYear(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Final CGPA / Percentage</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 8.45 CGPA (84.5%)"
                      value={finalCgpa}
                      onChange={e => setFinalCgpa(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Last Exam Seat No. / Roll No.</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 230101042"
                      value={lastExamSeatNo}
                      onChange={e => setLastExamSeatNo(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Primary Purpose Field (Always required) */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8125rem' }}>
                Purpose of Service Application <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  service.code === 'TRANSCRIPT' ? 'e.g. Higher Education Applications in USA/Canada and WES Credential Evaluation' :
                  service.code === 'MIGRATION' ? 'e.g. Admission to Post-Graduate program in Gujarat Technological University' :
                  service.code === 'PROVISIONAL_DEGREE' || service.code === 'DEGREE' ? 'e.g. Official Employment Verification and University Convocation Dispatch' :
                  service.code === 'NO_BACKLOG' ? 'e.g. Clearance Certificate for Embassy Visa Filing & Foreign University Admission' :
                  service.code === 'TRIAL_CERTIFICATE' ? 'e.g. Official Testimony of Examination Attempts for Medical / Council Registration' :
                  service.code === 'PASSING_CERTIFICATE' ? 'e.g. Proof of Degree Completion for Government Job Document Verification' :
                  service.code === 'DOC_VERIFICATION' || service.code === 'AUTH_CERTIFICATE' ? 'e.g. Background Screening by Employer / International Attestation' :
                  service.code === 'MARKSHEET_COPY' ? 'e.g. Original grade card misplaced during relocation' :
                  service.code === 'RANK_CERTIFICATE' ? 'e.g. Application for National Merit Scholarship / University Fellowship' :
                  service.code === 'LANGUAGE_OF_STUDY' ? 'e.g. Proof of English Medium of Instruction for Visa & IELTS Waiver' :
                  service.code === 'CGPA_CONVERSION_SCHEME' ? 'e.g. Percentage Conversion Certificate for Public Sector PSU Recruitment' :
                  service.code === 'LOR' ? 'e.g. Recommendation Letter for Master of Science program admission' :
                  service.code === 'TRANSFER_CERTIFICATE' ? 'e.g. Lateral College Transfer / Program Relocation' :
                  service.code === 'DUPLICATE_ID' ? 'e.g. Smart ID card misplaced during transit' :
                  'e.g. For Passport Application / State Bus Pass / Bank Education Loan / Official Records'
                }
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                required
              />
            </div>

            {/* ── DYNAMIC SUB-FORMS FOR ALL OFFICIAL SERVICES ── */}

            {/* 1. TRANSCRIPT */}
            {service.code === 'TRANSCRIPT' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Official Transcript Specifications</div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Required Semester Range</label>
                    <select
                      className="form-select"
                      value={serviceData.semesterRange}
                      onChange={e => handleFieldChange('semesterRange', e.target.value)}
                    >
                      <option value="All Completed Semesters (Sem 1 to 4)">All Completed Semesters (Sem 1 to 4)</option>
                      <option value="First Year Only (Sem 1 & Sem 2)">First Year Only (Sem 1 &amp; Sem 2)</option>
                      <option value="Second Year Only (Sem 3 & Sem 4)">Second Year Only (Sem 3 &amp; Sem 4)</option>
                      <option value="Complete 4-Year B.Tech Program (Sem 1 to Sem 8)">Complete 4-Year Program (Sem 1 to 8)</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Evaluation Agency / University</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. WES Canada / ICAS / University of Toronto"
                      value={serviceData.transcriptAgency}
                      onChange={e => handleFieldChange('transcriptAgency', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Agency Reference Number / WES Ref No. (If applicable)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. WES Ref # 6789012"
                    value={serviceData.wesRefNumber}
                    onChange={e => handleFieldChange('wesRefNumber', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 2. MIGRATION CERTIFICATE */}
            {service.code === 'MIGRATION' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Migration Destination Details</div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Destination University / Board Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Gujarat University / Mumbai University"
                      value={serviceData.migrationTargetUniversity}
                      onChange={e => handleFieldChange('migrationTargetUniversity', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Destination State / Country</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Gujarat / Maharashtra / International"
                      value={serviceData.migrationTargetState}
                      onChange={e => handleFieldChange('migrationTargetState', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. DUPLICATE GRADE SHEET / MARK SHEET */}
            {service.code === 'MARKSHEET_COPY' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Duplicate Grade Sheet Specifications (Page 2 Reference)</div>
                <div className="grid-3" style={{ gap: '0.625rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Semester / Year</label>
                    <select
                      className="form-select"
                      value={serviceData.marksheetSemester}
                      onChange={e => handleFieldChange('marksheetSemester', e.target.value)}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Exam Category</label>
                    <select
                      className="form-select"
                      value={serviceData.marksheetExamType}
                      onChange={e => handleFieldChange('marksheetExamType', e.target.value)}
                    >
                      <option value="Regular">Regular Examination</option>
                      <option value="Remedial / ATKT">Remedial / ATKT Examination</option>
                      <option value="Special Examination">Special Examination</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Month &amp; Year of Exam</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Winter (Dec 2025)"
                      value={serviceData.marksheetExamMonthYear}
                      onChange={e => handleFieldChange('marksheetExamMonthYear', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Sr. No. of Original Marksheet (If Known)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MS-2025-00451"
                      value={serviceData.marksheetSrNo}
                      onChange={e => handleFieldChange('marksheetSrNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Reason for Duplicate Marksheet</label>
                    <select
                      className="form-select"
                      value={serviceData.duplicateMarksheetReason}
                      onChange={e => handleFieldChange('duplicateMarksheetReason', e.target.value)}
                    >
                      <option value="Original Marksheet Lost / Misplaced during transit">Lost / Misplaced during transit</option>
                      <option value="Original Marksheet Damaged / Mutilated">Damaged / Mutilated (Physical surrender)</option>
                      <option value="Original Marksheet Destroyed in Fire / Natural Mishap">Destroyed in Fire / Natural Mishap</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 4. DOCUMENT VERIFICATION & ATTESTATION */}
            {(service.code === 'DOC_VERIFICATION' || service.code === 'AUTH_CERTIFICATE') && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Verification &amp; Attestation Options (Page 1 Reference)</div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Document Type for Verification / Attestation</label>
                    <select
                      className="form-select"
                      value={serviceData.docTypeToVerify}
                      onChange={e => handleFieldChange('docTypeToVerify', e.target.value)}
                    >
                      <option value="Grade Sheet / Mark Sheet">Grade Sheet / Mark Sheet</option>
                      <option value="Provisional Degree Certificate">Provisional Certificate</option>
                      <option value="Degree Certificate">Degree Certificate</option>
                      <option value="Detailed Teaching Scheme / Syllabus">Detailed Teaching Scheme / Syllabus</option>
                      <option value="Consolidated Transcript">Consolidated Transcript</option>
                      <option value="Other Official University Document">Other Official Document</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Requesting Organization / Embassy / Agency</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. High Commission of Canada / TCS Onboarding Desk"
                      value={serviceData.verificationOrgName}
                      onChange={e => handleFieldChange('verificationOrgName', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. NO BACKLOG CERTIFICATE */}
            {service.code === 'NO_BACKLOG' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Backlog Clearance Record</div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Cleared Semester Details</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceData.clearedSemestersDetails}
                    onChange={e => handleFieldChange('clearedSemestersDetails', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 6. TRIAL / ATTEMPT CERTIFICATE */}
            {service.code === 'TRIAL_CERTIFICATE' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Examination Attempt History</div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Examination Attempts Summary</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceData.trialAttemptsDetails}
                    onChange={e => handleFieldChange('trialAttemptsDetails', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 7. DEGREE & PROVISIONAL DEGREE */}
            {(service.code === 'DEGREE' || service.code === 'PROVISIONAL_DEGREE') && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Degree Award &amp; Convocation Mode</div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Convocation Mode</label>
                    <select
                      className="form-select"
                      value={serviceData.convocationType}
                      onChange={e => handleFieldChange('convocationType', e.target.value)}
                    >
                      <option value="In-Absentia Postal Dispatch">In-Absentia Postal Dispatch</option>
                      <option value="In-Person Annual Convocation Ceremony">In-Person Annual Convocation Ceremony</option>
                      <option value="Direct Counter Handover with Original ID Verification">Direct Counter Handover</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Graduation / Passing Year</label>
                    <input
                      type="text"
                      className="form-input"
                      value={serviceData.passingYear}
                      onChange={e => handleFieldChange('passingYear', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 8. RANK CERTIFICATE */}
            {service.code === 'RANK_CERTIFICATE' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Rank &amp; Merit Particulars</div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Claimed Class / Department Rank Position</label>
                  <input
                    type="text"
                    className="form-input"
                    value={serviceData.studentRank}
                    onChange={e => handleFieldChange('studentRank', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 9. LANGUAGE OF STUDY */}
            {service.code === 'LANGUAGE_OF_STUDY' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Medium of Instruction Testimony</div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Official Medium of Instruction</label>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={serviceData.mediumOfInstruction}
                  />
                </div>
              </div>
            )}

            {/* 10. CGPA CONVERSION SCHEME */}
            {service.code === 'CGPA_CONVERSION_SCHEME' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>SSIU Percentage Conversion Formula</div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Grading Scheme Conversion Formula</label>
                  <input
                    type="text"
                    className="form-input"
                    readOnly
                    value={serviceData.cgpaConversionFormula}
                  />
                </div>
              </div>
            )}

            {/* 11. LETTER OF RECOMMENDATION (LOR) */}
            {service.code === 'LOR' && (
              <div style={{ background: '#F8FAFC', padding: '0.875rem', borderRadius: '6px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8125rem', color: '#0F2C59' }}>Recommendation Details</div>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Recommending Professor / HOD</label>
                    <input
                      type="text"
                      className="form-input"
                      value={serviceData.lorProfessorName}
                      onChange={e => handleFieldChange('lorProfessorName', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Target University / Program</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Master of Science, TU Munich"
                      value={serviceData.lorTargetUniversity}
                      onChange={e => handleFieldChange('lorTargetUniversity', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 12. BONAFIDE CERTIFICATE (Generic Certificate validity period) */}
            {service.code === 'BONAFIDE' && (
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Valid Academic Period From</label>
                  <input
                    type="date"
                    className="form-input"
                    value={serviceData.validFrom}
                    onChange={e => handleFieldChange('validFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Valid Academic Period To</label>
                  <input
                    type="date"
                    className="form-input"
                    value={serviceData.validTo}
                    onChange={e => handleFieldChange('validTo', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 13. DUPLICATE ID CARD */}
            {service.code === 'DUPLICATE_ID' && (
              <div className="grid-2" style={{ gap: '0.75rem' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Reason for Duplicate Card</label>
                  <select
                    className="form-select"
                    value={serviceData.idCardLossReason}
                    onChange={e => handleFieldChange('idCardLossReason', e.target.value)}
                  >
                    <option value="Lost on Campus / Transit">Lost on Campus / Transit</option>
                    <option value="Smart RFID Chip Damaged / Broken">Smart RFID Chip Damaged / Broken</option>
                    <option value="Identity Details Worn Out">Identity Details Worn Out</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Lost Diary / Complaint Ref (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SSIU/SEC/2026/LOST-041"
                    value={serviceData.idCardPoliceDiaryNo}
                    onChange={e => handleFieldChange('idCardPoliceDiaryNo', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Mode & Copies Row */}
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Delivery Mode</label>
                <input
                  type="text"
                  className="form-input read-only-field"
                  value="Physical Hardcopy (Collect from Student Section)"
                  readOnly
                  disabled
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#334155',
                    cursor: 'not-allowed',
                    fontWeight: 600
                  }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Number of Copies (Official Paper Form Page 1)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  className="form-input"
                  value={copies}
                  onChange={e => setCopies(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.75rem' }}>Additional Remarks / Notes for Registrar (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Any special instructions or reference numbers..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />
            </div>

          </div>
        </div>

        {/* ── SECTION 3: SUPPORTING DOCUMENTS (OFFICIAL REQUIREMENT) ────────── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          padding: '1.1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Upload size={16} color="var(--brand-orange, #F37023)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Section 3: Supporting Documents &amp; Identity Proof
              </h3>
            </div>
            <span style={{ fontSize: '0.71875rem', color: '#64748B' }}>
              Accepted Formats: PDF, JPG, PNG (Max 5MB per file)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {uploadedDocs.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.625rem 0.875rem',
                  background: '#F8FAFC',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  fontSize: '0.8125rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} color="#0F2C59" />
                  <div>
                    <strong style={{ color: '#0F2C59' }}>{doc.name}</strong>
                    <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>
                      Size: {doc.fileSize} • Uploaded: {doc.uploadedAt}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: doc.required ? '#FEF2F2' : '#F1F5F9',
                    color: doc.required ? '#DC2626' : '#64748B'
                  }}>
                    {doc.required ? 'MANDATORY' : 'OPTIONAL'}
                  </span>

                  <label
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0F2C59',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Upload size={12} /> Replace
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style={{ display: 'none' }}
                      onChange={e => handleFileUpload(idx, e)}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(idx)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#DC2626',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title="Remove attachment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 4: APPLICANT DECLARATION & OFFICE VERIFICATION PREVIEW ── */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          border: '1px solid #CBD5E1',
          padding: '1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.625rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.375rem' }}>
            <ShieldCheck size={16} color="var(--brand-navy, #0F2C59)" />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0, textTransform: 'uppercase' }}>
              Section 4: Applicant Declaration (Page 2 Reference)
            </h3>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', cursor: 'pointer', fontSize: '0.78125rem', color: '#334155', lineHeight: 1.4 }}>
            <input
              type="checkbox"
              checked={declarationAccepted}
              onChange={e => setDeclarationAccepted(e.target.checked)}
              style={{ marginTop: '3px' }}
            />
            <span>
              <strong>Applicant Undertaking:</strong> I hereby declare that all information given above is true, complete, and correct to the best of my knowledge and belief. I agree to abide by the university rules and understand that any false statement will render my application liable for cancellation and disciplinary action.
            </span>
          </label>

          {/* Official Verification Audit Trail Info */}
          <div style={{
            marginTop: '0.75rem',
            padding: '0.5rem 0.75rem',
            background: '#F8FAFC',
            borderRadius: '6px',
            border: '1px dashed #CBD5E1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.71875rem',
            color: '#64748B'
          }}>
            <div>
              <strong>Office Workflow:</strong> Application Receiver • Fee Receipt Ledger • Verification Officer • Registrar Clearance
            </div>
            <span style={{ color: '#047857', fontWeight: 700 }}>
              ✔ Official Digital Verification Enabled
            </span>
          </div>
        </div>

        {/* ── SECTION 5: OFFICIAL FEE MASTER CALCULATION & SLA SUMMARY ────────── */}
        <div style={{
          background: '#EEF4FB',
          borderRadius: '8px',
          border: '1px solid #BFDBFE',
          padding: '1.1rem 1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #DBEAFE', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#1E40AF" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0F2C59)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Section 5: Dynamic Fee Master Calculation &amp; SLA
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1E40AF' }}>
              Standard SLA: {service.processingDays} Working Days
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem', marginBottom: '0.875rem' }}>
            <div>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Service:</span>
              <strong style={{ color: '#0F2C59' }}>{service.name}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Applicant Status:</span>
              <strong style={{ color: '#0F2C59' }}>{passoutStatus === 'PASSOUT' ? 'Pass-out / Alumnus' : 'Enrolled Regular Student'}</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Official Copies:</span>
              <strong style={{ color: '#0F2C59' }}>{copies} Copy ({feeCalculation.additionalCopiesCount > 0 ? `1 Base + ${feeCalculation.additionalCopiesCount} Extra` : 'Primary'})</strong>
            </div>

            <div>
              <span style={{ color: '#64748B', fontSize: '0.6875rem', display: 'block' }}>Delivery Mode:</span>
              <strong style={{ color: '#0F2C59' }}>Physical Hardcopy (Collect from Student Section)</strong>
            </div>
          </div>

          {/* Dynamic Itemized Breakdown Table from Fee Master */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            overflow: 'hidden',
            marginBottom: '0.75rem'
          }}>
            <div style={{
              background: '#F1F5F9',
              padding: '5px 10px',
              fontSize: '0.71875rem',
              fontWeight: 800,
              color: '#334155',
              display: 'flex',
              justifyContent: 'space-between',
              borderBottom: '1px solid #CBD5E1'
            }}>
              <span>OFFICIAL FEE HEAD &amp; PARTICULAR</span>
              <span>RATE / QTY • AMOUNT</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {feeCalculation.breakdownItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    fontSize: '0.78125rem',
                    borderBottom: idx < feeCalculation.breakdownItems.length - 1 ? '1px solid #F1F5F9' : 'none'
                  }}
                >
                  <span style={{ color: '#1E293B', fontWeight: 600 }}>{item.head}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0F2C59' }}>
                    {item.qty} • ₹{item.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              background: '#F8FAFC',
              padding: '6px 10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid #CBD5E1',
              fontSize: '0.875rem',
              fontWeight: 800
            }}>
              <span style={{ color: '#0F2C59' }}>TOTAL APPLICABLE SERVICE FEE:</span>
              <span style={{ color: totalFee === 0 ? '#16A34A' : '#0F2C59', fontSize: '1rem' }}>
                {totalFee === 0 ? 'FREE OF CHARGE' : `₹${totalFee.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {service.urgentFee > 0 && (
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              background: '#FFFFFF',
              padding: '0.625rem 0.875rem',
              borderRadius: '6px',
              border: '1px solid #FDE68A'
            }}>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={e => setIsUrgent(e.target.checked)}
              />
              <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#92400E' }}>
                ⚡ Fast-Track Urgent Expedited Processing (+₹{service.urgentFee} for {service.urgentProcessingDays}-day fast clearance)
              </span>
            </label>
          )}
        </div>

        </div>

        {/* ── 3. FIXED/PINNED ACTION FOOTER ─────────────────────────────────── */}
        <div className="student-section-modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '0.625rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
            >
              Save Draft
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              style={{
                background: 'var(--brand-orange, #F37023)',
                borderColor: 'var(--brand-orange, #F37023)',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isSubmitting ? 'Creating Application...' : totalFee > 0 ? (
                <>Proceed to Payment (₹{totalFee}) <ArrowRight size={15} /></>
              ) : (
                <><Send size={15} /> Submit Application (FREE)</>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
