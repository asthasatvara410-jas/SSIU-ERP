import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { studentRequestService } from '../../services/studentRequestService';
import { StudentRequest, AuthorizedDepartment } from '../../types/studentRequest';
import { Badge } from '../common/Badge';
import { 
  UserCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, CornerDownLeft, 
  RotateCcw, Send, FileText, Building2, User, HelpCircle, ShieldCheck, Sparkles, BookOpen 
} from 'lucide-react';

interface StudentRequestDetailModalProps {
  request: StudentRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const StudentRequestDetailModal: React.FC<StudentRequestDetailModalProps> = ({
  request,
  isOpen,
  onClose,
  onRefresh
}) => {
  const { user, role } = useAuth();

  // Mentor routing form states
  const [routingDecision, setRoutingDecision] = useState<'ROUTE_TO_SUBJECT_FACULTY' | 'ROUTE_TO_HOD' | 'ROUTE_TO_DEPARTMENT' | 'RESOLVE_DIRECTLY'>('ROUTE_TO_SUBJECT_FACULTY');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<AuthorizedDepartment>('ACCOUNTS_ADMIN');
  const [routingRemarks, setRoutingRemarks] = useState('');

  // Department / Faculty resolution states
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  // Mentor final review remarks
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Student reopen reason
  const [isReopenMode, setIsReopenMode] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // HOD forward to HOI remarks
  const [isHoiEscalateMode, setIsHoiEscalateMode] = useState(false);
  const [hoiRemarks, setHoiRemarks] = useState('');

  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen || !request || !user) return null;

  const isStudent = role === 'STUDENT';
  const isMentor = request.mentorId === user.id || request.mentorEmail === user.email || (role === 'FACULTY' && request.currentHandler === 'MENTOR');
  const isSubjectFaculty = (role === 'FACULTY' && request.currentHandler === 'SUBJECT_FACULTY');
  const isHod = (role === 'HOD' && request.currentHandler === 'HOD');
  const isHoi = (role === 'PRINCIPAL' && request.currentHandler === 'HOI');
  const isDeptHandler = (
    (role === 'ACCOUNTS_ADMIN' && request.targetDepartment === 'ACCOUNTS_ADMIN') ||
    (role === 'HOSTEL_ADMIN' && request.targetDepartment === 'HOSTEL_ADMIN') ||
    (role === 'TRANSPORT_ADMIN' && request.targetDepartment === 'TRANSPORT_ADMIN') ||
    (role === 'STUDENT_SECTION' && request.targetDepartment === 'STUDENT_SECTION') ||
    (role === 'LIBRARY_ADMIN' && request.targetDepartment === 'LIBRARY_ADMIN') ||
    (role === 'MAINTENANCE_ADMIN' && request.targetDepartment === 'MAINTENANCE_ADMIN') ||
    (role === 'EXAM_CELL' && request.targetDepartment === 'EXAM_CELL')
  );

  const availableSubjects = db.getSubjects();

  // 1. Mentor Route Action
  const handleMentorRoute = (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.routeByMentor(request.id, {
        decision: routingDecision,
        subjectId: selectedSubjectId || request.subjectId,
        targetDepartment: selectedDepartment,
        remarks: routingRemarks.trim() || `Routed by Mentor ${user.name}`
      }, user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Routing failed.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Start Work Action
  const handleStartWork = () => {
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.startWork(request.id, user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Resolve & Return to Mentor
  const handleResolveWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionSummary.trim()) {
      setActionError('Please provide a resolution summary.');
      return;
    }
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.resolveWork(request.id, {
        resolutionSummary: resolutionSummary.trim(),
        remarks: resolutionRemarks.trim() || resolutionSummary.trim()
      }, user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Resolution failed.');
    } finally {
      setLoading(false);
    }
  };

  // 4. HOD Forward to HOI
  const handleHodForwardHoi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hoiRemarks.trim()) {
      setActionError('Please enter escalation remarks for HOI.');
      return;
    }
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.hodForwardToHoi(request.id, hoiRemarks.trim(), user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'HOI Forwarding failed.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Mentor Final Review (Complete / Rework)
  const handleMentorReviewAction = (action: 'MARK_COMPLETED' | 'REQUEST_REWORK') => {
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.mentorReview(request.id, {
        action,
        remarks: reviewRemarks.trim()
      }, user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Review failed.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Student Confirm
  const handleStudentConfirm = () => {
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.studentConfirmResolution(request.id, user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Student Reopen
  const handleStudentReopen = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) {
      setActionError('Please provide a reason for reopening this request.');
      return;
    }
    setActionError(null);
    setLoading(true);
    try {
      studentRequestService.studentReopenRequest(request.id, reopenReason.trim(), user);
      onRefresh();
      onClose();
    } catch (err: any) {
      setActionError(err.message || 'Reopen failed.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string): 'success' | 'gold' | 'active' | 'danger' | 'navy' => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'RESOLVED':
      case 'RETURNED_TO_MENTOR': return 'gold';
      case 'WORK_IN_PROGRESS': return 'active';
      case 'REOPENED':
      case 'RETURNED_FOR_REWORK': return 'danger';
      default: return 'navy';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Student Request: ${request.requestNo}`} maxWidth="840px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Top Header Card */}
        <div style={{
          backgroundColor: 'var(--bg-main)',
          borderRadius: '8px',
          padding: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.375rem' }}>
              <span style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                {request.subject}
              </span>
              <Badge variant={getStatusBadgeVariant(request.status)}>
                {request.status.replace(/_/g, ' ')}
              </Badge>
              <Badge variant={request.priority === 'URGENT' ? 'danger' : request.priority === 'HIGH' ? 'warning' : 'navy'}>
                {request.priority}
              </Badge>
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Category: <strong>{request.category.replace(/_/g, ' ')}</strong> • Submitted on {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Current Desk / Handler:</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
              {request.currentHandlerName || request.currentHandler}
            </span>
          </div>
        </div>

        {actionError && (
          <div style={{
            backgroundColor: 'rgba(211, 47, 47, 0.1)',
            border: '1px solid var(--brand-red)',
            color: 'var(--brand-red)',
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Student & Assigned Mentor Info */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          backgroundColor: 'rgba(240, 244, 248, 0.6)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>STUDENT DETAILS</span>
            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 700, fontSize: '0.9rem' }}>{request.studentName}</p>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Enrollment: {request.enrollmentNo} • {request.departmentName}
            </p>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>ASSIGNED ORIGIN MENTOR</span>
            <p style={{ margin: '0.25rem 0 0 0', fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-green)' }}>
              {request.mentorName} (Faculty Mentor)
            </p>
            <p style={{ margin: '0.1rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {request.mentorEmail || 'mentor@ssiu.edu'}
            </p>
          </div>
        </div>

        {/* Request Description & Attachments */}
        <div style={{
          backgroundColor: '#FFF',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.375rem' }}>
            STUDENT DESCRIPTION
          </span>
          <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text-main)', whiteSpace: 'pre-wrap' }}>
            {request.description}
          </p>

          {request.subjectName && (
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: 'var(--brand-navy)', fontWeight: 600 }}>
              <BookOpen size={16} />
              <span>Enrolled Subject: {request.subjectCode} - {request.subjectName}</span>
            </div>
          )}

          {request.attachments && request.attachments.length > 0 && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {request.attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', backgroundColor: 'var(--bg-main)', padding: '0.375rem 0.625rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                  <FileText size={14} />
                  <span>{att.fileName} ({att.fileSize})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resolution Summary if Available */}
        {request.resolutionSummary && (
          <div style={{
            backgroundColor: 'rgba(46, 125, 50, 0.08)',
            border: '1px solid var(--brand-green)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--brand-green)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-green)' }}>
                Resolution Summary by {request.resolvedByName} ({request.resolvedByRole})
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-main)' }}>
              {request.resolutionSummary}
            </p>
          </div>
        )}

        {/* Reopen Info if Available */}
        {request.reopenReason && (
          <div style={{
            backgroundColor: 'rgba(211, 47, 47, 0.08)',
            border: '1px solid var(--brand-red)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
              <RotateCcw size={18} style={{ color: 'var(--brand-red)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--brand-red)' }}>
                Reopened by Student (Reason)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--brand-red)' }}>
              {request.reopenReason}
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* WORKFLOW DECISION PANELS                                                 */}
        {/* ========================================================================= */}

        {/* PANEL A: MENTOR ROUTING DECISION (When status is SUBMITTED, REOPENED, or WITH_MENTOR) */}
        {isMentor && (request.status === 'SUBMITTED' || request.status === 'REOPENED' || request.status === 'WITH_MENTOR') && (
          <div style={{
            backgroundColor: '#FFF',
            border: '2px solid var(--brand-gold)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--brand-navy)', fontWeight: 800, fontSize: '1rem' }}>
              Mentor Action: Controlled Routing Decision
            </h4>
            <form onSubmit={handleMentorRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Select Routing Pathway:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', backgroundColor: routingDecision === 'ROUTE_TO_SUBJECT_FACULTY' ? 'rgba(217, 119, 6, 0.1)' : '#FFF' }}>
                    <input
                      type="radio"
                      name="routingDecision"
                      value="ROUTE_TO_SUBJECT_FACULTY"
                      checked={routingDecision === 'ROUTE_TO_SUBJECT_FACULTY'}
                      onChange={() => setRoutingDecision('ROUTE_TO_SUBJECT_FACULTY')}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>A. Subject Faculty</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', backgroundColor: routingDecision === 'ROUTE_TO_HOD' ? 'rgba(217, 119, 6, 0.1)' : '#FFF' }}>
                    <input
                      type="radio"
                      name="routingDecision"
                      value="ROUTE_TO_HOD"
                      checked={routingDecision === 'ROUTE_TO_HOD'}
                      onChange={() => setRoutingDecision('ROUTE_TO_HOD')}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>B. Department HOD</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', backgroundColor: routingDecision === 'ROUTE_TO_DEPARTMENT' ? 'rgba(217, 119, 6, 0.1)' : '#FFF' }}>
                    <input
                      type="radio"
                      name="routingDecision"
                      value="ROUTE_TO_DEPARTMENT"
                      checked={routingDecision === 'ROUTE_TO_DEPARTMENT'}
                      onChange={() => setRoutingDecision('ROUTE_TO_DEPARTMENT')}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>C. Other Department</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', backgroundColor: routingDecision === 'RESOLVE_DIRECTLY' ? 'rgba(217, 119, 6, 0.1)' : '#FFF' }}>
                    <input
                      type="radio"
                      name="routingDecision"
                      value="RESOLVE_DIRECTLY"
                      checked={routingDecision === 'RESOLVE_DIRECTLY'}
                      onChange={() => setRoutingDecision('RESOLVE_DIRECTLY')}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>D. Mentor Direct Resolve</span>
                  </label>
                </div>
              </div>

              {routingDecision === 'ROUTE_TO_SUBJECT_FACULTY' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Select Relevant Subject:
                  </label>
                  <select
                    value={selectedSubjectId || request.subjectId || ''}
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">-- Choose Subject --</option>
                    {availableSubjects.map(s => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {routingDecision === 'ROUTE_TO_DEPARTMENT' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>
                    Select Approved Administrative Office:
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={e => setSelectedDepartment(e.target.value as AuthorizedDepartment)}
                    className="input-field"
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="ACCOUNTS_ADMIN">Accounts & Finance Office</option>
                    <option value="HOSTEL_ADMIN">Hostel Administration & Warden</option>
                    <option value="TRANSPORT_ADMIN">Transport Office</option>
                    <option value="STUDENT_SECTION">Student Section & Certificates</option>
                    <option value="MAINTENANCE_ADMIN">Campus Maintenance & Estate</option>
                    <option value="LIBRARY_ADMIN">Library Administration</option>
                    <option value="EXAM_CELL">Examination Cell</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  Mentor Guidance & Remarks <span style={{ color: 'var(--brand-red)' }}>*</span>
                </label>
                <textarea
                  value={routingRemarks}
                  onChange={e => setRoutingRemarks(e.target.value)}
                  rows={2}
                  placeholder="Enter specific instructions or notes for the assigned handler..."
                  className="input-field"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Send size={15} /> Execute Routing Decision
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PANEL B: MENTOR REVIEW OF COMPLETED WORK (When status is RETURNED_TO_MENTOR) */}
        {isMentor && request.status === 'RETURNED_TO_MENTOR' && (
          <div style={{
            backgroundColor: '#FFF',
            border: '2px solid var(--brand-green)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--brand-navy)', fontWeight: 800, fontSize: '1rem' }}>
              Mentor Final Review: Resolution Completed by Department
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              The assigned handler has completed work and returned the request to your desk. Inspect the resolution and either mark it completed or request rework.
            </p>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Review Notes / Closing Comments:
              </label>
              <textarea
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                rows={2}
                placeholder="Enter remarks for the student or rework instructions..."
                className="input-field"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => handleMentorReviewAction('REQUEST_REWORK')}
                className="btn btn-secondary"
                disabled={loading}
                style={{ color: 'var(--brand-orange)', borderColor: 'var(--brand-orange)' }}
              >
                <CornerDownLeft size={16} /> Request Rework from Department
              </button>
              <button
                type="button"
                onClick={() => handleMentorReviewAction('MARK_COMPLETED')}
                className="btn btn-primary"
                disabled={loading}
                style={{ backgroundColor: 'var(--brand-green)', borderColor: 'var(--brand-green)' }}
              >
                <CheckCircle2 size={16} /> Mark Completed &amp; Notify Student
              </button>
            </div>
          </div>
        )}

        {/* PANEL C: FACULTY / HOD / HOI / DEPT WORK & RESOLUTION */}
        {(isSubjectFaculty || isHod || isHoi || isDeptHandler) && 
         (request.status === 'FORWARDED_TO_FACULTY' || request.status === 'WITH_FACULTY' ||
          request.status === 'FORWARDED_TO_HOD' || request.status === 'WITH_HOD' ||
          request.status === 'FORWARDED_TO_HOI' || request.status === 'WITH_HOI' ||
          request.status === 'FORWARDED_TO_DEPARTMENT' || request.status === 'WITH_DEPARTMENT' ||
          request.status === 'WORK_IN_PROGRESS' || request.status === 'RETURNED_FOR_REWORK') && (
          <div style={{
            backgroundColor: '#FFF',
            border: '2px solid var(--brand-navy)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--brand-navy)', fontWeight: 800, fontSize: '1rem' }}>
              Department / Faculty Action Desk ({user.role})
            </h4>

            {request.status !== 'WORK_IN_PROGRESS' && (
              <div style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={handleStartWork}
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ marginRight: '0.5rem' }}
                >
                  <Clock size={16} /> Accept &amp; Start Work
                </button>

                {isHod && (
                  <button
                    type="button"
                    onClick={() => setIsHoiEscalateMode(!isHoiEscalateMode)}
                    className="btn btn-secondary"
                    style={{ color: 'var(--brand-navy)' }}
                  >
                    <ArrowRight size={16} /> Escalate to HOI (Principal)
                  </button>
                )}
              </div>
            )}

            {isHoiEscalateMode && (
              <form onSubmit={handleHodForwardHoi} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--bg-main)', borderRadius: '6px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Escalation Remarks for Principal / HOI:</label>
                <textarea
                  value={hoiRemarks}
                  onChange={e => setHoiRemarks(e.target.value)}
                  rows={2}
                  className="input-field"
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                  Forward to Principal
                </button>
              </form>
            )}

            <form onSubmit={handleResolveWork} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  Resolution Summary (Will be returned to Mentor {request.mentorName}) <span style={{ color: 'var(--brand-red)' }}>*</span>
                </label>
                <textarea
                  value={resolutionSummary}
                  onChange={e => setResolutionSummary(e.target.value)}
                  rows={3}
                  placeholder="Explain the work performed, outcome, or corrective action taken..."
                  className="input-field"
                  style={{ width: '100%' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ backgroundColor: 'var(--brand-green)' }}>
                  <CornerDownLeft size={16} /> Complete &amp; Return to Student's Mentor
                </button>
              </div>
            </form>
          </div>
        )}

        {/* PANEL D: STUDENT FINAL ACTIONS (CONFIRM / REOPEN) */}
        {isStudent && request.status === 'COMPLETED' && (
          <div style={{
            backgroundColor: '#FFF',
            border: '2px solid var(--brand-green)',
            borderRadius: '8px',
            padding: '1.25rem'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--brand-green)', fontWeight: 800, fontSize: '1rem' }}>
              Resolution Completed: Please Confirm or Reopen
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Your mentor {request.mentorName} has marked this request completed. Please confirm if your problem has been resolved.
            </p>

            {!isReopenMode ? (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleStudentConfirm}
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ backgroundColor: 'var(--brand-green)' }}
                >
                  <CheckCircle2 size={16} /> Confirm Resolution (Satisfied)
                </button>
                <button
                  type="button"
                  onClick={() => setIsReopenMode(true)}
                  className="btn btn-secondary"
                  disabled={loading}
                  style={{ color: 'var(--brand-red)', borderColor: 'var(--brand-red)' }}
                >
                  <RotateCcw size={16} /> Problem Not Resolved (Reopen Request)
                </button>
              </div>
            ) : (
              <form onSubmit={handleStudentReopen} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-red)' }}>
                  Why is the problem not resolved? <span style={{ color: 'var(--brand-red)' }}>*</span>
                </label>
                <textarea
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                  rows={2}
                  placeholder="Explain why the resolution was insufficient. Request will be returned to your Mentor."
                  className="input-field"
                  required
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsReopenMode(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ backgroundColor: 'var(--brand-red)' }}>
                    Reopen Request &amp; Send to Mentor
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Complete Visual Audit Timeline */}
        <div>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem' }}>
            Complete Request Audit Timeline ({request.timeline.length} Steps)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '280px', overflowY: 'auto' }}>
            {request.timeline.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--brand-navy)'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-navy)' }}>
                      {item.action.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    From: <strong>{item.fromUserName}</strong> ({item.fromUserRole}) {item.toUserName && <> &rarr; To: <strong>{item.toUserName}</strong> ({item.toUserRole})</>}
                  </p>
                  {item.remarks && (
                    <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)', fontStyle: 'italic' }}>
                      "{item.remarks}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>

      </div>
    </Modal>
  );
};
