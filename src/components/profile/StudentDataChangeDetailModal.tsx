import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { useAuth } from '../../context/AuthContext';
import { StudentDataChangeRequest, DataChangeStatus } from '../../types';
import { studentDataChangeRequestService } from '../../services/studentDataChangeRequestService';
import { 
  FileText, CheckCircle, XCircle, CornerDownLeft, Clock, 
  User, ShieldCheck, Download, AlertCircle, ArrowRight, CheckCircle2, History 
} from 'lucide-react';

interface StudentDataChangeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: StudentDataChangeRequest | null;
  onActionComplete?: () => void;
}

export const StudentDataChangeDetailModal: React.FC<StudentDataChangeDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onActionComplete,
}) => {
  const { user, role } = useAuth();

  const [reviewAction, setReviewAction] = useState<'APPROVE' | 'REJECT' | 'SEND_BACK'>('APPROVE');
  const [remarks, setRemarks] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!request) return null;

  const isStudent = role === 'STUDENT';
  const isMentor = role === 'FACULTY' || (role as string) === 'MENTOR';
  const isHOD = role === 'HOD';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL' || role === 'REGISTRAR';

  // Can Mentor take review action?
  const canMentorReview = (isMentor || isAdmin) && (request.status === 'MENTOR_PENDING' || request.status === 'SUBMITTED' || request.status === 'SENT_BACK');

  // Can HOD take final review action?
  const canHODReview = (isHOD || isAdmin) && (request.status === 'HOD_PENDING' || request.status === 'MENTOR_APPROVED');

  // Can student cancel own request?
  const canStudentCancel = isStudent && (request.status === 'MENTOR_PENDING' || request.status === 'SENT_BACK');

  const handleMentorReviewSubmit = (action: 'APPROVE' | 'REJECT' | 'SEND_BACK') => {
    if (!user) return;
    setError('');
    setSuccessMsg('');

    if ((action === 'REJECT' || action === 'SEND_BACK') && !remarks.trim()) {
      setError('Please provide mandatory remarks explaining the rejection or correction required.');
      return;
    }

    setIsProcessing(true);
    try {
      studentDataChangeRequestService.mentorReview({
        requestId: request.id,
        action,
        remarks: remarks.trim(),
        reviewerUser: user,
      });

      setSuccessMsg(
        action === 'APPROVE'
          ? 'Request successfully approved and forwarded for HOD Final Approval!'
          : `Request has been marked as ${action === 'REJECT' ? 'Rejected' : 'Returned to Student'}.`
      );

      setTimeout(() => {
        setIsProcessing(false);
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Action failed.');
    }
  };

  const handleHODReviewSubmit = (action: 'APPROVE' | 'REJECT' | 'SEND_BACK') => {
    if (!user) return;
    setError('');
    setSuccessMsg('');

    if ((action === 'REJECT' || action === 'SEND_BACK') && !remarks.trim()) {
      setError('Please provide mandatory remarks explaining the decision.');
      return;
    }

    setIsProcessing(true);
    try {
      studentDataChangeRequestService.hodReview({
        requestId: request.id,
        action,
        remarks: remarks.trim(),
        reviewerUser: user,
      });

      setSuccessMsg(
        action === 'APPROVE'
          ? 'Final Approval granted! Student master data has been updated in the database.'
          : `Request has been marked as ${action === 'REJECT' ? 'Rejected' : 'Returned for Rework'}.`
      );

      setTimeout(() => {
        setIsProcessing(false);
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Action failed.');
    }
  };

  const handleStudentCancel = () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to cancel this change request?')) return;

    setIsProcessing(true);
    try {
      studentDataChangeRequestService.cancelRequest(request.id, user);
      setSuccessMsg('Change request has been cancelled.');
      setTimeout(() => {
        setIsProcessing(false);
        if (onActionComplete) onActionComplete();
        onClose();
      }, 1000);
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Failed to cancel request.');
    }
  };

  const getStatusBadge = (status: DataChangeStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="active">APPROVED &amp; APPLIED</Badge>;
      case 'MENTOR_PENDING':
      case 'SUBMITTED':
        return <Badge variant="orange">MENTOR REVIEW PENDING</Badge>;
      case 'HOD_PENDING':
      case 'MENTOR_APPROVED':
        return <Badge variant="gold">HOD FINAL APPROVAL PENDING</Badge>;
      case 'REJECTED_BY_MENTOR':
        return <Badge variant="danger">REJECTED BY MENTOR</Badge>;
      case 'REJECTED_BY_HOD':
        return <Badge variant="danger">REJECTED BY HOD</Badge>;
      case 'SENT_BACK':
        return <Badge variant="orange">RETURNED FOR CORRECTION</Badge>;
      case 'CANCELLED':
        return <Badge variant="inactive">CANCELLED</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Data Change Request: ${request.requestNo}`}
      subtitle={`Field: ${request.fieldLabel} (${request.fieldCategory})`}
      maxWidth="850px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Status Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          background: 'var(--bg-surface-hover, #F8FAFC)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', fontWeight: 700 }}>
              REQUEST TRACKING ID
            </div>
            <code style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>
              {request.requestNo}
            </code>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)', fontWeight: 700, marginBottom: '2px' }}>
              CURRENT STATUS
            </div>
            {getStatusBadge(request.status)}
          </div>
        </div>

        {/* Student & Department Card */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', fontWeight: 800 }}>STUDENT NAME</span>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{request.studentName}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Enrollment: <code>{request.enrollmentNo}</code></div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', fontWeight: 800 }}>DEPARTMENT &amp; PROGRAM</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{request.departmentName || 'Computer Engineering'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>{request.programName || 'B.Tech CSE'} • {request.semesterName || 'Sem 4'}</div>
          </div>

          <div style={{ padding: '0.75rem 1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', fontWeight: 800 }}>ASSIGNED MENTOR</span>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{request.mentorName || 'Faculty Mentor'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted, #64748B)' }}>Submitted: {new Date(request.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* ─── SIDE-BY-SIDE OLD VALUE VS REQUESTED VALUE DIFF ─── */}
        <div style={{
          padding: '1.25rem',
          background: 'linear-gradient(135deg, rgba(11,25,44,0.02) 0%, rgba(243,112,35,0.03) 100%)',
          borderRadius: '8px',
          border: '1px solid var(--border-color, #E2E8F0)'
        }}>
          <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={16} color="var(--brand-orange, #F37023)" />
            Proposed Change for: {request.fieldLabel}
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
            {/* Old Value */}
            <div style={{ padding: '0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase' }}>
                Current Registered Value (Old)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: '#475569', marginTop: '4px', wordBreak: 'break-word' }}>
                {request.oldValue || '— None / Empty —'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(243,112,35,0.1)', borderRadius: '50%' }}>
                <ArrowRight size={20} color="var(--brand-orange, #F37023)" />
              </div>
            </div>

            {/* Requested New Value */}
            <div style={{ padding: '0.85rem', background: '#ECFDF5', borderRadius: '6px', border: '2px solid #10B981' }}>
              <span style={{ fontSize: '0.6875rem', color: '#047857', fontWeight: 800, textTransform: 'uppercase' }}>
                Requested Value (New)
              </span>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#065F46', marginTop: '4px', wordBreak: 'break-word' }}>
                {request.newValue}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div style={{ marginTop: '0.85rem', padding: '0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', fontWeight: 800, textTransform: 'uppercase' }}>
              Student Justification / Reason for Change:
            </span>
            <p style={{ margin: '3px 0 0 0', fontSize: '0.8125rem', color: 'var(--brand-navy, #0B192C)', lineHeight: 1.4, fontWeight: 500 }}>
              {request.reason}
            </p>
          </div>

          {/* Supporting Document */}
          {request.attachmentName && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} color="var(--brand-navy, #0B192C)" />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{request.attachmentName}</div>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)' }}>{request.attachmentSize || '1.2 MB'} • Verified PDF Proof</span>
                </div>
              </div>
              <a
                href={request.attachmentUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={(e) => {
                  if (!request.attachmentUrl || request.attachmentUrl.startsWith('http')) {
                    // Let default link open or trigger view
                  }
                }}
              >
                <Download size={13} /> View Proof Document
              </a>
            </div>
          )}
        </div>

        {/* ─── END-TO-END APPROVAL CHAIN WORKFLOW PROGRESS ─── */}
        <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color, #E2E8F0)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Multi-Tier Verification &amp; Approval Chain
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', position: 'relative' }}>
            {/* Step 1: Student Submission */}
            <div style={{ padding: '0.6rem', borderRadius: '6px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#047857', fontWeight: 800, fontSize: '0.75rem' }}>
                <CheckCircle2 size={14} /> 1. SUBMITTED
              </div>
              <div style={{ fontSize: '0.6875rem', color: '#065F46', marginTop: '2px' }}>By Student</div>
              <div style={{ fontSize: '0.65rem', color: '#047857' }}>{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>

            {/* Step 2: Mentor Review */}
            <div style={{
              padding: '0.6rem',
              borderRadius: '6px',
              background: request.status === 'MENTOR_PENDING' || request.status === 'SUBMITTED' ? '#FFFBEB' :
                          request.status === 'REJECTED_BY_MENTOR' ? '#FEF2F2' :
                          '#ECFDF5',
              border: request.status === 'MENTOR_PENDING' || request.status === 'SUBMITTED' ? '1px solid #FDE68A' :
                      request.status === 'REJECTED_BY_MENTOR' ? '1px solid #FCA5A5' :
                      '1px solid #A7F3D0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: request.status === 'MENTOR_PENDING' ? '#B45309' : request.status === 'REJECTED_BY_MENTOR' ? '#DC2626' : '#047857',
                fontWeight: 800,
                fontSize: '0.75rem'
              }}>
                {request.status === 'MENTOR_PENDING' ? <Clock size={14} /> : request.status === 'REJECTED_BY_MENTOR' ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                2. MENTOR
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                {request.mentorRemarks ? request.mentorRemarks.slice(0, 28) + '...' : 'Review'}
              </div>
            </div>

            {/* Step 3: HOD Final Approval */}
            <div style={{
              padding: '0.6rem',
              borderRadius: '6px',
              background: request.status === 'HOD_PENDING' || request.status === 'MENTOR_APPROVED' ? '#FFFBEB' :
                          request.status === 'REJECTED_BY_HOD' ? '#FEF2F2' :
                          request.status === 'APPROVED' ? '#ECFDF5' :
                          '#F8FAFC',
              border: request.status === 'HOD_PENDING' || request.status === 'MENTOR_APPROVED' ? '1px solid #FDE68A' :
                      request.status === 'REJECTED_BY_HOD' ? '1px solid #FCA5A5' :
                      request.status === 'APPROVED' ? '1px solid #A7F3D0' :
                      '1px solid #E2E8F0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: request.status === 'HOD_PENDING' ? '#B45309' : request.status === 'REJECTED_BY_HOD' ? '#DC2626' : request.status === 'APPROVED' ? '#047857' : '#94A3B8',
                fontWeight: 800,
                fontSize: '0.75rem'
              }}>
                {request.status === 'HOD_PENDING' ? <Clock size={14} /> : request.status === 'REJECTED_BY_HOD' ? <XCircle size={14} /> : request.status === 'APPROVED' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                3. HOD
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                {request.hodRemarks ? request.hodRemarks.slice(0, 28) + '...' : 'Final Approval'}
              </div>
            </div>

            {/* Step 4: Master Record Updated */}
            <div style={{
              padding: '0.6rem',
              borderRadius: '6px',
              background: request.status === 'APPROVED' ? '#ECFDF5' : '#F8FAFC',
              border: request.status === 'APPROVED' ? '1px solid #A7F3D0' : '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: request.status === 'APPROVED' ? '#047857' : '#94A3B8', fontWeight: 800, fontSize: '0.75rem' }}>
                <ShieldCheck size={14} /> 4. MASTER UPDATE
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                {request.status === 'APPROVED' ? 'Applied Atomically' : 'Locked'}
              </div>
            </div>
          </div>
        </div>

        {/* ─── AUDIT TRAIL ─── */}
        {request.auditLogs && request.auditLogs.length > 0 && (
          <div style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={14} color="var(--brand-orange, #F37023)" /> Audit Trail ({request.auditLogs.length} Events)
            </h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '140px', overflowY: 'auto' }}>
              {request.auditLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.725rem', padding: '0.35rem 0.5rem', background: '#F8FAFC', borderRadius: '4px' }}>
                  <div>
                    <strong>{log.action}</strong> by <span>{log.performedByName}</span> ({log.performedByRole})
                    {log.remarks && <span style={{ color: 'var(--text-muted, #64748B)', marginLeft: '6px' }}>— "{log.remarks}"</span>}
                  </div>
                  <span style={{ color: '#94A3B8', fontWeight: 600 }}>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', background: '#FEE2E2', color: '#991B1B', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 600 }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', background: '#D1FAE5', color: '#065F46', borderRadius: '6px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="#059669" /> {successMsg}
          </div>
        )}

        {/* ─── ACTION PANEL FOR MENTOR ─── */}
        {canMentorReview && (
          <div style={{ padding: '1rem', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
              Mentor Review Action
            </h4>
            <div style={{ marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#78350F', display: 'block', marginBottom: '0.25rem' }}>
                Review Remarks (Mandatory when rejecting or returning):
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks for HOD recommendation or student feedback..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8125rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMentorReviewSubmit('SEND_BACK')}
                disabled={isProcessing}
                style={{ background: '#FFFFFF', color: '#D97706', borderColor: '#F59E0B' }}
              >
                <CornerDownLeft size={14} /> Send Back for Correction
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleMentorReviewSubmit('REJECT')}
                disabled={isProcessing}
                style={{ background: '#FFFFFF', color: '#DC2626', borderColor: '#EF4444' }}
              >
                <XCircle size={14} /> Reject Request
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleMentorReviewSubmit('APPROVE')}
                disabled={isProcessing}
                style={{ background: '#047857', borderColor: '#047857' }}
              >
                <CheckCircle size={14} /> Approve &amp; Forward to HOD
              </button>
            </div>
          </div>
        )}

        {/* ─── ACTION PANEL FOR HOD ─── */}
        {canHODReview && (
          <div style={{ padding: '1rem', background: '#ECFDF5', borderRadius: '8px', border: '2px solid #10B981' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> HOD Final Approval (Master Data Mutation Authority)
            </h4>
            <p style={{ fontSize: '0.75rem', color: '#047857', margin: '0 0 0.6rem 0' }}>
              Clicking <strong>"Final Approve &amp; Apply Master Update"</strong> will atomically overwrite the official student record in the university master database.
            </p>
            <div style={{ marginBottom: '0.6rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#065F46', display: 'block', marginBottom: '0.25rem' }}>
                HOD Decision Remarks:
              </label>
              <textarea
                className="form-control"
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter official approval notes or rejection rationale..."
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.8125rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleHODReviewSubmit('SEND_BACK')}
                disabled={isProcessing}
                style={{ background: '#FFFFFF', color: '#D97706', borderColor: '#F59E0B' }}
              >
                <CornerDownLeft size={14} /> Send Back
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => handleHODReviewSubmit('REJECT')}
                disabled={isProcessing}
                style={{ background: '#FFFFFF', color: '#DC2626', borderColor: '#EF4444' }}
              >
                <XCircle size={14} /> Reject Request
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => handleHODReviewSubmit('APPROVE')}
                disabled={isProcessing}
                style={{ background: '#059669', borderColor: '#059669', fontWeight: 800 }}
              >
                <CheckCircle size={15} /> Final Approve &amp; Apply Master Update
              </button>
            </div>
          </div>
        )}

        {/* Modal Close / Cancel Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '1rem' }}>
          <div>
            {canStudentCancel && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleStudentCancel}
                disabled={isProcessing}
                style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
              >
                Cancel This Request
              </button>
            )}
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
};
