import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { AdmissionApplication } from '../../types';
import { db } from '../../services/db';
import { studentOnboardingService } from '../../services/studentOnboardingService';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Users, MapPin, GraduationCap, FileText, 
  IndianRupee, CheckCircle2, XCircle, AlertCircle, Eye, 
  Check, Calendar, Phone, Mail, ShieldCheck, Clock, Download
} from 'lucide-react';

interface StudentApplicantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: AdmissionApplication | null;
  onRefresh: () => void;
  onOpenOnboard: (app: AdmissionApplication) => void;
  onOpenPayment?: (app: AdmissionApplication) => void;
}

export const StudentApplicantDetailModal: React.FC<StudentApplicantDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onRefresh,
  onOpenOnboard,
  onOpenPayment
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'PARENT' | 'ADDRESS' | 'ACADEMIC' | 'DOCUMENTS' | 'FEES' | 'READINESS'>('PERSONAL');
  const [rejectionModalDocId, setRejectionModalDocId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!application) return null;

  const institutes = db.getInstitutes();
  const departments = db.getDepartments();
  const programs = db.getPrograms();
  const academicYears = db.getAcademicYears();
  const batches = db.getBatches();
  const semesters = db.getSemesters();
  const divisions = db.getDivisions();

  const prog = programs.find(p => p.id === application.programId);
  const dept = departments.find(d => d.id === application.departmentId) || departments.find(d => d.id === prog?.departmentId);
  const inst = institutes.find(i => i.id === application.instituteId) || institutes.find(i => i.id === dept?.instituteId);
  const ay = academicYears.find(a => a.id === application.academicYearId);
  const batch = batches.find(b => b.id === application.batchId);
  const sem = semesters.find(s => s.id === application.semesterId);
  const div = divisions.find(d => d.id === application.divisionId);

  const readiness = studentOnboardingService.evaluateReadiness(application);

  const handleVerifyDoc = (docId: string) => {
    if (!user) return;
    try {
      studentOnboardingService.verifyDocument(application.id, docId, 'VERIFIED', user, 'Document verified by Student Administration');
      setFeedbackMsg({ type: 'success', text: 'Document marked as verified.' });
      onRefresh();
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message });
    }
  };

  const handleConfirmRejectDoc = () => {
    if (!user || !rejectionModalDocId) return;
    if (!rejectionReason.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Please enter a mandatory rejection reason.' });
      return;
    }
    try {
      studentOnboardingService.verifyDocument(application.id, rejectionModalDocId, 'REJECTED', user, rejectionReason);
      setFeedbackMsg({ type: 'success', text: 'Document rejected with reason.' });
      setRejectionModalDocId(null);
      setRejectionReason('');
      onRefresh();
    } catch (e: any) {
      setFeedbackMsg({ type: 'error', text: e.message });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Applicant Admission & Verification Dossier"
      subtitle={`Application No: ${application.applicationNumber || application.id} • ${application.applicantName}`}
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {feedbackMsg && (
          <div style={{
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: feedbackMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedbackMsg.type === 'success' ? '#065F46' : '#B91C1C',
            border: `1px solid ${feedbackMsg.type === 'success' ? '#10B981' : '#F87171'}`
          }}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedbackMsg.text}
          </div>
        )}

        {/* Top Summary Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img
              src={application.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
              alt={application.applicantName}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-orange, #F37023)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                  {application.applicantName}
                </h3>
                <Badge variant={application.status === 'CONVERTED' || application.status === 'ONBOARDED' ? 'active' : 'navy'}>
                  {application.status}
                </Badge>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>
                Applied on {application.submittedAt} • {prog?.name || 'Program'} ({dept?.name})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!application.isFeePaid && application.feePaymentStatus !== 'PAID' && onOpenPayment && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 800, background: '#047857', borderColor: '#047857', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => {
                  onClose();
                  onOpenPayment(application);
                }}
              >
                <IndianRupee size={14} /> Pay Initial Fee
              </button>
            )}

            {readiness.isReady && application.status !== 'CONVERTED' && application.status !== 'ONBOARDED' ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', background: '#0F2C59', borderColor: '#0F2C59', color: '#FFFFFF' }}
                onClick={() => {
                  onClose();
                  onOpenOnboard(application);
                }}
              >
                <CheckCircle2 size={14} /> Onboard Student Now
              </button>
            ) : (
              <Badge variant={readiness.isReady ? 'active' : 'orange'}>
                {readiness.isReady ? 'READY FOR ONBOARDING' : 'READINESS PENDING'}
              </Badge>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '1px solid var(--border-color, #E2E8F0)', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'PERSONAL', label: 'Personal Info', icon: User },
            { id: 'PARENT', label: 'Parent / Family', icon: Users },
            { id: 'ADDRESS', label: 'Address', icon: MapPin },
            { id: 'ACADEMIC', label: 'Academic Placement', icon: GraduationCap },
            { id: 'DOCUMENTS', label: `Documents (${application.documents?.length || 0})`, icon: FileText },
            { id: 'FEES', label: 'Fee Status', icon: IndianRupee },
            { id: 'READINESS', label: 'Readiness Checklist', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab(tab.id as any)}
                style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'PERSONAL' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FULL NAME</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.applicantName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DATE OF BIRTH</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.dateOfBirth}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>GENDER</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.gender}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>BLOOD GROUP</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.bloodGroup || 'O+'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>MOBILE NUMBER</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.phone}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>EMAIL ADDRESS</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.email}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>CATEGORY</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.category || 'General / Open'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>AADHAAR / GOVT ID</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.aadhaarNumber || 'Verified ID Proof Attached'}</div>
            </div>
          </div>
        )}

        {/* TAB 2: PARENT / GUARDIAN */}
        {activeTab === 'PARENT' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FATHER'S NAME</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.fatherName || application.guardianName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>FATHER'S CONTACT</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.fatherPhone || application.guardianPhone}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>MOTHER'S NAME</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.motherName || 'Not Specified'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>GUARDIAN / EMERGENCY CONTACT</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.guardianPhone || application.phone}</div>
            </div>
          </div>
        )}

        {/* TAB 3: ADDRESS */}
        {activeTab === 'ADDRESS' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>CURRENT / RESIDENTIAL ADDRESS</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-navy, #0B192C)' }}>{application.currentAddress || application.address}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>CITY / DISTRICT</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.city || 'Gandhinagar'}, {application.district || 'Gujarat'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>STATE &amp; PINCODE</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.state || 'Gujarat'} - {application.pincode || '382421'}</div>
            </div>
          </div>
        )}

        {/* TAB 4: ACADEMIC DETAILS */}
        {activeTab === 'ACADEMIC' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', padding: '0.5rem 0' }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>INSTITUTE</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{inst?.name || 'Swarrnim Institute of Technology'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>DEPARTMENT</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{dept?.name || 'Computer Science & Engineering'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PROGRAM / COURSE</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{prog?.name || 'B.Tech Program'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ACADEMIC SESSION</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{ay?.name || '2026-2027'}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>BATCH &amp; SEMESTER</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{batch?.name || 'Batch 2026'}, Semester {sem?.number || 1} ({div ? `Div ${div.name}` : 'Div A'})</div>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ADMISSION TYPE</span>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{application.admissionType || 'REGULAR / MERIT'}</div>
            </div>
          </div>
        )}

        {/* TAB 5: DOCUMENTS & VERIFICATION */}
        {activeTab === 'DOCUMENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(application.documents || []).length === 0 ? (
              <p style={{ color: 'var(--text-muted, #64748B)', fontSize: '0.8125rem' }}>No documents attached with this application.</p>
            ) : (
              application.documents.map(doc => (
                <div
                  key={doc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: doc.status === 'VERIFIED' ? '#ECFDF5' : doc.status === 'REJECTED' ? '#FEF2F2' : '#F8FAFC',
                    border: `1px solid ${doc.status === 'VERIFIED' ? '#A7F3D0' : doc.status === 'REJECTED' ? '#FCA5A5' : '#E2E8F0'}`,
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={18} color={doc.status === 'VERIFIED' ? '#059669' : doc.status === 'REJECTED' ? '#DC2626' : '#64748B'} />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{doc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted, #64748B)' }}>
                        Status: <strong>{doc.status}</strong> {doc.verifiedBy && `• Verified by ${doc.verifiedBy} on ${doc.verifiedAt}`}
                        {doc.rejectionReason && <span style={{ color: '#DC2626', display: 'block' }}>Reason: {doc.rejectionReason}</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {doc.fileUrl && (
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-xs" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Eye size={12} /> Preview
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary btn-xs"
                      onClick={() => handleVerifyDoc(doc.id)}
                      disabled={doc.status === 'VERIFIED'}
                    >
                      <Check size={12} /> Verify
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-xs"
                      onClick={() => {
                        setRejectionModalDocId(doc.id);
                        setRejectionReason('');
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
        )}

        {/* TAB 6: FEES */}
        {activeTab === 'FEES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>ADMISSION FEE SETTLEMENT</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: (application.isFeePaid || application.feePaymentStatus === 'PAID') ? '#059669' : '#D97706' }}>
                  {(application.isFeePaid || application.feePaymentStatus === 'PAID') ? 'PAID & CONFIRMED' : 'PAYMENT PENDING'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>AMOUNT SETTLED</span>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
                  ₹{(application.feeAmountPaid || (application.isFeePaid ? 25000 : 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted, #64748B)' }}>PAYMENT RECEIPT NUMBER</span>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>
                  <code>{application.feeReceiptNo || 'SSIU-REC-PENDING'}</code>
                </div>
              </div>
            </div>

            {!application.isFeePaid && application.feePaymentStatus !== 'PAID' && onOpenPayment && (
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '6px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#9A3412', display: 'block', fontSize: '0.875rem' }}>Initial Admission Fee Payment Required</strong>
                  <span style={{ fontSize: '0.75rem', color: '#C2410C' }}>Pay ₹{(application.feePending || 25000).toLocaleString('en-IN')} to confirm candidate seat and unlock final onboarding.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 800, background: '#047857', borderColor: '#047857', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={() => {
                    onClose();
                    onOpenPayment(application);
                  }}
                >
                  <IndianRupee size={14} /> Pay Fee Now
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: READINESS CHECKLIST */}
        {activeTab === 'READINESS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {readiness.conditions.map(cond => (
              <div
                key={cond.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: cond.passed ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${cond.passed ? '#A7F3D0' : '#FCA5A5'}`,
                  borderRadius: '6px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {cond.passed ? <CheckCircle2 size={18} color="#059669" /> : <XCircle size={18} color="#DC2626" />}
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: cond.passed ? '#065F46' : '#991B1B' }}>
                      {cond.label}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: cond.passed ? '#047857' : '#B91C1C' }}>
                      {cond.detail}
                    </div>
                  </div>
                </div>
                <Badge variant={cond.passed ? 'active' : 'danger'}>
                  {cond.passed ? 'PASSED' : 'BLOCKING'}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Prompt Modal Layer */}
        {rejectionModalDocId && (
          <div style={{
            padding: '1rem',
            background: '#FEF2F2',
            border: '2px solid #DC2626',
            borderRadius: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#991B1B', margin: 0 }}>
              Mandatory Document Rejection Reason
            </h4>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Document image is blurred or missing official board stamp..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-xs" onClick={() => setRejectionModalDocId(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger btn-xs" onClick={handleConfirmRejectDoc}>
                Confirm Rejection
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Dossier
          </button>
          {readiness.isReady && application.status !== 'CONVERTED' && application.status !== 'ONBOARDED' && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                onClose();
                onOpenOnboard(application);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}
            >
              <CheckCircle2 size={16} /> Proceed to Onboard Student
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
};
