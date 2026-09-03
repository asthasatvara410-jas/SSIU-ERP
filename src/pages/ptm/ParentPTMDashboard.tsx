import React, { useState } from 'react';
import { 
  Users, Calendar, Clock, Video, MapPin, CheckCircle2, 
  AlertCircle, MessageSquare, TrendingUp, BookOpen, Send, 
  HelpCircle, ChevronRight, UserCheck, Check, RotateCcw, XCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ptmService } from '../../services/ptmService';
import { db } from '../../services/db';
import { Student } from '../../types';
import { Badge } from '../../components/common/Badge';

export const ParentPTMDashboard: React.FC = () => {
  const { user, activeRole } = useAuth();

  // Load linked children for current logged in parent
  const linkedStudents = ptmService.getParentLinkedStudents(user?.id || 'user-parent-1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    linkedStudents[0]?.id || 'student-1'
  );

  const selectedStudent = linkedStudents.find(s => s.id === selectedStudentId) || linkedStudents[0];

  // Load schedules, records, and follow-ups for selected student
  const schedules = ptmService.getSchedules(user!, 'PARENT', { studentId: selectedStudent?.id });
  const { records: pastRecords, followUps } = selectedStudent 
    ? ptmService.getPTMHistoryForStudent(selectedStudent.id, user!, 'PARENT')
    : { records: [], followUps: [] };

  const upcomingSchedule = schedules.find(s => s.status === 'INVITED' || s.status === 'CONFIRMED' || s.status === 'SCHEDULED' || s.status === 'RESCHEDULED');

  // Academic entities
  const program = selectedStudent ? db.getProgramById(selectedStudent.programId) : undefined;
  const semester = selectedStudent ? db.getSemesterById(selectedStudent.semesterId) : undefined;
  const subjects = selectedStudent ? db.getSubjects().filter(s => s.semesterId === selectedStudent.semesterId) : [];
  const attendanceStats = selectedStudent ? db.getStudentAttendanceStats(selectedStudent.id) : { percentage: 85, attendedSessions: 85, totalSessions: 100 };

  // Reschedule Modal State
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [proposedDate, setProposedDate] = useState('2025-03-18');
  const [proposedTime, setProposedTime] = useState('11:00 AM');
  const [rescheduleReason, setRescheduleReason] = useState('Prior official engagement at the scheduled time slot.');

  // Decline Modal State
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  // Parent Feedback Form State
  const [feedbackText, setFeedbackText] = useState('');
  const [concernText, setConcernText] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleConfirmAttendance = (scheduleId: string) => {
    ptmService.recordParentResponse(scheduleId, 'CONFIRMED');
    alert('Thank you! Your attendance has been confirmed for the PTM session.');
  };

  const handleRequestRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcomingSchedule) return;
    ptmService.recordParentResponse(
      upcomingSchedule.id,
      'RESCHEDULE_REQUESTED',
      rescheduleReason,
      proposedDate,
      proposedTime
    );
    setIsRescheduleModalOpen(false);
    alert('Your reschedule request has been submitted to the faculty coordinator.');
  };

  const handleDeclineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upcomingSchedule) return;
    ptmService.recordParentResponse(
      upcomingSchedule.id,
      'DECLINED',
      declineReason
    );
    setIsDeclineModalOpen(false);
    alert('Your response has been recorded.');
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim() && !concernText.trim()) return;

    if (upcomingSchedule) {
      const rec = ptmService.getRecordByScheduleId(upcomingSchedule.id);
      if (rec) {
        ptmService.savePTMRecord({
          ...rec,
          parentFeedback: feedbackText,
          parentConcerns: concernText
        }, user!);
      }
    }

    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setFeedbackText('');
      setConcernText('');
    }, 2000);
  };

  if (!selectedStudent) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <AlertCircle size={40} color="#D97706" style={{ margin: '0 auto 1rem' }} />
        <h3>No Linked Student Record Found</h3>
        <p>Please contact the university student section to link your ward's enrollment.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
      
      {/* ═══ Header & Multi-Child Switcher ═══ */}
      <div className="card" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)', color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Users size={22} color="#F58220" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
                Parent Portal — PTM &amp; Academic Progress
              </h2>
            </div>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.84375rem', color: '#CBD5E1' }}>
              Welcome, <strong>{user?.name || 'Parent'}</strong>. Track consultations, confirm attendance, and review teacher remarks.
            </p>
          </div>

          {/* Multi-Child Selector */}
          {linkedStudents.length > 1 && (
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <span style={{ fontSize: '0.75rem', color: '#93C5FD', display: 'block', fontWeight: 700, marginBottom: '0.35rem' }}>
                MY CHILDREN ({linkedStudents.length} ENROLLED):
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {linkedStudents.map(st => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentId(st.id)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedStudentId === st.id ? '2px solid #F58220' : '1px solid rgba(255,255,255,0.3)',
                      background: selectedStudentId === st.id ? '#F58220' : 'rgba(255,255,255,0.08)',
                      color: '#fff'
                    }}
                  >
                    {st.name} ({st.enrollmentNo})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selected Child Info Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.15)', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Child Name:</span>{' '}
            <strong style={{ color: '#fff' }}>{selectedStudent.name}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Enrollment No:</span>{' '}
            <code style={{ color: '#FCD34D', fontWeight: 700 }}>{selectedStudent.enrollmentNo}</code>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Program:</span>{' '}
            <strong style={{ color: '#fff' }}>{program?.name || 'B.Tech CSE'} (Sem {semester?.number || 4})</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>Attendance Rate:</span>{' '}
            <span style={{ color: attendanceStats.percentage >= 75 ? '#86EFAC' : '#FCA5A5', fontWeight: 800 }}>
              {attendanceStats.percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* ═══ Upcoming PTM Invitation Card ═══ */}
      {upcomingSchedule ? (
        <div className="card" style={{ padding: '1.35rem 1.5rem', borderLeft: '5px solid #F58220', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FFF7ED', color: '#EA580C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  UPCOMING PARENT–TEACHER CONSULTATION
                </span>
                <h3 style={{ margin: '0.15rem 0 0 0', fontSize: '1.0625rem', fontWeight: 800, color: '#0F2C59' }}>
                  {upcomingSchedule.ptmEventTitle || 'Mid-Semester Progress Review PTM'}
                </h3>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Confirmation Status:</span>
              <Badge variant={upcomingSchedule.parentResponse === 'CONFIRMED' ? 'active' : upcomingSchedule.parentResponse === 'RESCHEDULE_REQUESTED' ? 'warning' : 'danger'}>
                {upcomingSchedule.parentResponse === 'CONFIRMED' ? 'CONFIRMED' : upcomingSchedule.parentResponse === 'RESCHEDULE_REQUESTED' ? 'RESCHEDULE REQUESTED' : 'PENDING RESPONSE'}
              </Badge>
            </div>
          </div>

          {/* Meeting Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#F8FAFC', padding: '1.15rem', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #E2E8F0' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={13} /> PTM Date &amp; Slot
              </span>
              <strong style={{ color: '#0F2C59', fontSize: '0.875rem', display: 'block', marginTop: '0.2rem' }}>
                {upcomingSchedule.date} • {upcomingSchedule.slotTime || `${upcomingSchedule.startTime} - ${upcomingSchedule.endTime}`}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <UserCheck size={13} /> Faculty Mentor
              </span>
              <strong style={{ color: '#0F2C59', fontSize: '0.875rem', display: 'block', marginTop: '0.2rem' }}>
                {upcomingSchedule.facultyName || 'Prof. Demo Faculty'}
              </strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={13} /> Venue / Mode
              </span>
              <strong style={{ color: '#0F2C59', fontSize: '0.875rem', display: 'block', marginTop: '0.2rem' }}>
                {upcomingSchedule.venue || 'Block B Room 402'} ({upcomingSchedule.mode})
              </strong>
            </div>

            {upcomingSchedule.meetingLink && (
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Video size={13} /> Virtual Meeting Link
                </span>
                <a 
                  href={upcomingSchedule.meetingLink} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ color: '#2563EB', fontWeight: 700, fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}
                >
                  Join Google Meet <ChevronRight size={13} />
                </a>
              </div>
            )}
          </div>

          {/* Action Buttons for Parent */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8125rem', color: '#64748B' }}>
              Please confirm your availability to enable the faculty to prepare your student's progress report.
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {upcomingSchedule.parentResponse !== 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleConfirmAttendance(upcomingSchedule.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#15803D', borderColor: '#15803D' }}
                >
                  <Check size={16} /> Confirm Attendance
                </button>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsRescheduleModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RotateCcw size={15} /> Request Reschedule
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsDeclineModalOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#DC2626' }}
              >
                <XCircle size={15} /> Decline
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: '#64748B' }}>
          <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
          <h4 style={{ margin: 0, color: '#0F2C59' }}>No Pending PTM Invitations</h4>
          <span style={{ fontSize: '0.8125rem' }}>Your next parent-teacher meeting schedule will be announced here.</span>
        </div>
      )}

      {/* ═══ 2-Column: Academic Standing & Latest Faculty Remarks ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        
        {/* Academic Performance & Attendance Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#0F2C59" />
              <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59' }}>
                Academic &amp; Attendance Standing
              </h4>
            </div>
            <Badge variant={attendanceStats.percentage >= 75 ? 'active' : 'danger'}>
              {attendanceStats.percentage >= 75 ? 'IN GOOD STANDING' : 'ATTENDANCE SHORTAGE'}
            </Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {subjects.slice(0, 4).map((sub, idx) => {
              const subMarks = 24 + (idx * 2) % 6;
              const subAtt = selectedStudent.id === 'student-3' ? 50 : 85 + (idx * 4) % 15;
              return (
                <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '6px', fontSize: '0.8125rem' }}>
                  <div>
                    <strong>{sub.code}</strong> — {sub.name}
                    <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Internal Marks: {subMarks}/30</div>
                  </div>
                  <Badge variant={subAtt >= 75 ? 'active' : 'danger'}>
                    {subAtt}% Attended
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Faculty Remarks & Previous Discussion */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
            <MessageSquare size={18} color="#0F2C59" />
            <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59' }}>
              Faculty Mentor Remarks &amp; Recommendations
            </h4>
          </div>

          {pastRecords.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '8px', fontSize: '0.84375rem', color: '#1E3A8A' }}>
                <strong style={{ display: 'block', marginBottom: '0.35rem', color: '#1E40AF' }}>
                  From: {pastRecords[0].facultyName} ({pastRecords[0].date})
                </strong>
                "{pastRecords[0].facultyRemarks}"
              </div>

              {pastRecords[0].areasForImprovement && (
                <div style={{ fontSize: '0.8125rem', color: '#334155' }}>
                  <strong style={{ color: '#D97706' }}>Focus Area:</strong> {pastRecords[0].areasForImprovement}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748B' }}>
                <span>Outcome:</span>
                <Badge variant={pastRecords[0].outcome === 'SATISFACTORY' ? 'active' : 'warning'}>
                  {pastRecords[0].outcome}
                </Badge>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              <p style={{ margin: 0 }}>Faculty remarks will appear here after your first consultation session.</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Parent Feedback & Inquiries Box ═══ */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
          <Send size={18} color="#0F2C59" />
          <h4 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59' }}>
            Submit Feedback or Inquiries to Faculty Mentor
          </h4>
        </div>

        <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Parent Feedback on Academic Support</label>
              <textarea
                className="form-input"
                rows={3}
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Share your feedback on the teaching methodology and classroom support..."
              />
            </div>

            <div>
              <label className="form-label" style={{ fontSize: '0.8125rem' }}>Specific Concerns or Requests</label>
              <textarea
                className="form-input"
                rows={3}
                value={concernText}
                onChange={e => setConcernText(e.target.value)}
                placeholder="Inquire about attendance, fee, exam schedule, hostel or placement..."
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {feedbackSuccess ? (
              <span style={{ color: '#15803D', fontWeight: 700, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CheckCircle2 size={16} /> Thank you! Your feedback has been forwarded to the faculty coordinator.
              </span>
            ) : <span />}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0F2C59' }}
            >
              <Send size={15} /> Submit Feedback
            </button>
          </div>
        </form>
      </div>

      {/* ═══ Reschedule Modal ═══ */}
      {isRescheduleModalOpen && (
        <div className="swarrnim-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsRescheduleModalOpen(false)}>
          <div className="swarrnim-modal-dialog" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="swarrnim-modal-header" style={{ background: '#0F2C59', color: '#fff' }}>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
                Request PTM Reschedule Slot
              </h4>
              <button 
                type="button" 
                className="swarrnim-modal-close-btn" 
                style={{ color: '#fff' }} 
                onClick={() => setIsRescheduleModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleRequestRescheduleSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>Proposed Preferred Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={proposedDate}
                    onChange={e => setProposedDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>Proposed Preferred Time *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={proposedTime}
                    onChange={e => setProposedTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>Reason for Rescheduling *</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={rescheduleReason}
                    onChange={e => setRescheduleReason(e.target.value)}
                    placeholder="Please specify reason..."
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsRescheduleModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#0F2C59' }}
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ Decline Modal ═══ */}
      {isDeclineModalOpen && (
        <div className="swarrnim-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIsDeclineModalOpen(false)}>
          <div className="swarrnim-modal-dialog" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="swarrnim-modal-header" style={{ background: '#DC2626', color: '#fff' }}>
              <h4 style={{ margin: 0, color: '#fff', fontSize: '1rem', fontWeight: 800 }}>
                Decline PTM Invitation
              </h4>
              <button 
                type="button" 
                className="swarrnim-modal-close-btn" 
                style={{ color: '#fff' }} 
                onClick={() => setIsDeclineModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleDeclineSubmit} style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <p style={{ fontSize: '0.84375rem', color: '#64748B', margin: 0 }}>
                  Please state your reason for being unable to attend this consultation session:
                </p>
                <textarea
                  className="form-input"
                  rows={3}
                  value={declineReason}
                  onChange={e => setDeclineReason(e.target.value)}
                  placeholder="Reason for declining..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsDeclineModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
