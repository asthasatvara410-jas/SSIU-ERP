import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, Video, MapPin, CheckCircle, MessageSquare, 
  FileText, Users, Plus, ShieldCheck, 
  RefreshCw, Award, CalendarDays, AlertTriangle, Eye,
  X, Clock3, Send
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ptmService } from '../../services/ptmService';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { ExcelTableContainer, ExcelTable } from '../common/ExcelTable';
import { PTMSchedule, PTMMeetingMode } from '../../types/ptm';

type TabType = 'UPCOMING' | 'FEEDBACK' | 'TASKS' | 'REQUEST';

export const StudentPTMView: React.FC = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('UPCOMING');
  const [refreshKey, setRefreshKey] = useState(0);

  // Detail Modal State
  const [selectedSchedule, setSelectedSchedule] = useState<PTMSchedule | null>(null);
  const [rescheduleModalSchedule, setRescheduleModalSchedule] = useState<PTMSchedule | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('02:00 PM - 02:30 PM');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');

  // 1. Student Identity Resolution
  const currentStudent = useMemo(() => {
    const students = db.getStudents();
    if (!user) return students[0] || null;
    return students.find(s => 
      s.email?.toLowerCase() === user.email?.toLowerCase() || 
      s.enrollmentNo === user.username || 
      s.enrollmentNo === user.enrollmentNo || 
      s.id === user.id ||
      s.id === 'stu-1' ||
      s.id === 'student-1'
    ) || students[0] || null;
  }, [user, refreshKey]);

  // Form state for 1-on-1 Consultation Request
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>('fac-1');
  const [preferredDate, setPreferredDate] = useState<string>('2026-09-02');
  const [preferredTime, setPreferredTime] = useState<string>('11:00 AM - 11:30 AM');
  const [meetingMode, setMeetingMode] = useState<PTMMeetingMode>('PHYSICAL');
  const [consultationCategory, setConsultationCategory] = useState<string>('Academic Mentoring & Performance Review');
  const [agenda, setAgenda] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [submittedMemo, setSubmittedMemo] = useState<{ id: string; faculty: string; date: string; time: string; mode: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Faculty and Academic mapping
  const facultyList = useMemo(() => db.getFaculty(), []);
  const activeMentor = useMemo(() => {
    if (!currentStudent) return facultyList[0] || null;
    return facultyList.find(f => f.id === currentStudent.mentorId) || facultyList[0] || null;
  }, [currentStudent, facultyList]);

  // Preselect active mentor when loaded
  React.useEffect(() => {
    if (activeMentor && !selectedFacultyId) {
      setSelectedFacultyId(activeMentor.id);
    }
  }, [activeMentor, selectedFacultyId]);

  // Load PTM History
  const ptmData = useMemo(() => {
    const studentId = currentStudent?.id || 'stu-1';
    try {
      return ptmService.getPTMHistoryForStudent(studentId, user || ({ id: 'user-student-1', role: 'STUDENT', email: 'demo.student@university.edu' } as any), role || 'STUDENT');
    } catch {
      return { schedules: [], records: [], followUps: [] };
    }
  }, [currentStudent, user, role, refreshKey]);

  const { schedules, records, followUps } = ptmData;

  const upcomingSchedules = useMemo(() => {
    return schedules.filter(s => 
      s.status === 'INVITED' || 
      s.status === 'CONFIRMED' || 
      s.status === 'SCHEDULED' ||
      s.status === 'RESCHEDULED'
    );
  }, [schedules]);

  const pastSchedules = useMemo(() => {
    return schedules.filter(s => 
      s.status === 'ATTENDED' || 
      s.status === 'COMPLETED' || 
      s.status === 'MISSED' ||
      s.status === 'CANCELLED'
    );
  }, [schedules]);

  // Helper to format weekday
  const getDayName = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { weekday: 'long' });
    } catch {
      return 'Scheduled Day';
    }
  };

  // Handle Consultation Request Submit
  const handleRequestConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!agenda.trim() || !preferredDate.trim()) {
      return;
    }

    setIsSubmitting(true);
    const chosenFaculty = facultyList.find(f => f.id === selectedFacultyId) || activeMentor;
    const reqId = `CONS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    setTimeout(() => {
      try {
        ptmService.requestStudentConsultation({
          studentId: currentStudent?.id || 'stu-1',
          facultyId: selectedFacultyId || activeMentor?.id || 'fac-1',
          preferredDate,
          preferredTime,
          mode: meetingMode,
          agenda: agenda.trim(),
          meetingType: consultationCategory
        }, user || ({ id: 'user-student-1', name: 'Demo Student', email: 'demo.student@university.edu' } as any));

        setSubmittedMemo({
          id: reqId,
          faculty: chosenFaculty?.name || 'Demo Faculty 1',
          date: preferredDate,
          time: preferredTime,
          mode: meetingMode === 'PHYSICAL' ? 'In-Person (Room 302)' : 'Online (Google Meet)'
        });

        setAgenda('');
        setFormSubmitted(false);
        setIsSubmitting(false);
        setRefreshKey(k => k + 1);
        showToast('success', `Consultation request #${reqId} registered successfully!`);
      } catch (err: any) {
        setIsSubmitting(false);
        alert(err.message || 'Failed to submit consultation request.');
      }
    }, 600);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalSchedule) return;

    ptmService.recordParentResponse(
      rescheduleModalSchedule.id,
      'RESCHEDULE_REQUESTED',
      rescheduleReason || 'Parent requested time adjustment.',
      rescheduleDate,
      rescheduleTime
    );

    showToast('info', `Reschedule request submitted for ${rescheduleModalSchedule.ptmEventTitle || 'PTM Meeting'}.`);
    setRescheduleModalSchedule(null);
    setRefreshKey(k => k + 1);
  };

  // Follow-up status toggler for demo interaction
  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    ptmService.updateFollowUpAction(taskId, {
      status: nextStatus,
      completionDate: nextStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
      completionRemarks: nextStatus === 'COMPLETED' ? 'Marked complete by student on consultation portal.' : undefined
    });
    setRefreshKey(k => k + 1);
    showToast('success', `Task status updated to ${nextStatus.replace('_', ' ')}.`);
  };

  // Student details display
  const studentName = currentStudent?.name || user?.name || 'Demo Student';
  const enrollmentNo = currentStudent?.enrollmentNo || user?.username || '230101001';
  const programCode = 'BTECH-CSE';
  const semesterInfo = 'Sem 4 (Division A)';
  const mentorName = activeMentor?.name || 'Demo Faculty 1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999, padding: '0.85rem 1.25rem',
          background: toast.type === 'success' ? '#D1FAE5' : '#E0F2FE',
          border: `1px solid ${toast.type === 'success' ? '#6EE7B7' : '#BAE6FD'}`,
          borderRadius: '8px', color: toast.type === 'success' ? '#065F46' : '#0369A1',
          fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
          <CheckCircle size={16} /> {toast.message}
        </div>
      )}

      {/* ─── 1. Header & Student Identity Bar ───────────────────────────────── */}
      <div className="card" style={{ 
        padding: '1.35rem 1.75rem', 
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)', 
        color: '#FFFFFF',
        borderRadius: '10px',
        boxShadow: '0 4px 16px rgba(11,25,44,0.18)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Users size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Parent-Teacher Meeting (PTM) &amp; Consultation Desk
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              Official university portal for parent-faculty conferences, academic feedback notes, follow-up action items, and 1-on-1 faculty consultations.
            </p>
          </div>

          <button 
            type="button"
            onClick={() => { setRefreshKey(k => k + 1); showToast('info', 'PTM consultation data refreshed.'); }}
            className="btn btn-outline"
            style={{ 
              borderColor: 'rgba(255,255,255,0.3)', 
              color: '#FFFFFF', 
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.95rem',
              fontWeight: 700,
              background: 'rgba(255,255,255,0.08)'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* 4-Column Student Information Strip */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem', 
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.18)',
          fontSize: '0.8125rem'
        }}>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Student</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>{studentName}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Enrollment No</span>
            <strong style={{ color: '#F37023', fontFamily: 'monospace', fontSize: '0.95rem' }}>{enrollmentNo}</strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Program &amp; Class</span>
            <strong style={{ color: '#F8FAFC', fontSize: '0.95rem' }}>
              {programCode} • {semesterInfo}
            </strong>
          </div>
          <div>
            <span style={{ color: '#94A3B8', display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Assigned Mentor</span>
            <strong style={{ color: '#38BDF8', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.95rem' }}>
              <ShieldCheck size={16} /> {mentorName}
            </strong>
          </div>
        </div>
      </div>

      {/* ─── 2. PTM Navigation Tabs ─────────────────────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        borderBottom: '2px solid var(--border-color, #E2E8F0)', 
        paddingBottom: '0.1rem',
        overflowX: 'auto'
      }}>
        {[
          { key: 'UPCOMING', label: '1. Upcoming PTM Schedules', icon: Calendar, count: upcomingSchedules.length },
          { key: 'FEEDBACK', label: '2. Faculty Feedback & Remarks', icon: MessageSquare, count: records.length },
          { key: 'TASKS', label: '3. Academic Follow-up Tasks', icon: FileText, count: followUps.length },
          { key: 'REQUEST', label: '4. Request 1-on-1 Consultation', icon: Plus }
        ].map(tabItem => {
          const isActive = activeTab === tabItem.key;
          const TabIcon = tabItem.icon;

          return (
            <button
              key={tabItem.key}
              type="button"
              onClick={() => setActiveTab(tabItem.key as TabType)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid var(--brand-orange, #F37023)' : '3px solid transparent',
                color: isActive ? 'var(--brand-orange, #F37023)' : 'var(--text-muted, #64748B)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <TabIcon size={16} /> {tabItem.label}
              {tabItem.count !== undefined && tabItem.count > 0 && (
                <span style={{ 
                  background: isActive ? 'var(--brand-orange, #F37023)' : 'var(--brand-navy, #0B192C)', 
                  color: '#FFF', 
                  fontSize: '0.7rem', 
                  padding: '1px 7px', 
                  borderRadius: '10px', 
                  fontWeight: 800 
                }}>
                  {tabItem.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: UPCOMING PTM SCHEDULES ───────────────────────────────── */}
      {activeTab === 'UPCOMING' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-navy)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Schedules</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>{upcomingSchedules.length} Sessions</div>
            </div>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Next Conference</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', marginTop: '0.2rem' }}>
                {upcomingSchedules[0]?.date ? `${upcomingSchedules[0].date} (11:00 AM)` : '30 Aug 2026'}
              </div>
            </div>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Parent Attendance</span>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>Confirmed by Father</div>
            </div>
          </div>

          {/* Clean ERP Register Table View */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Confirmed PTM &amp; Mentoring Schedule Register
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Parent-faculty conferences scheduled for B.Tech CSE (Semester 4).
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('REQUEST')}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)' }}
              >
                <Plus size={14} /> Request New Slot
              </button>
            </div>

            <ExcelTableContainer minWidth="1050px">
              <ExcelTable>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ width: '130px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Meeting Date</th>
                    <th style={{ width: '100px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Day</th>
                    <th style={{ width: '150px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Time</th>
                    <th style={{ width: '180px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Faculty / Mentor</th>
                    <th style={{ width: '220px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Meeting Type</th>
                    <th style={{ width: '200px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Venue / Meeting Mode</th>
                    <th style={{ width: '120px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Status</th>
                    <th style={{ width: '150px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingSchedules.map((sch, idx) => {
                    const isOnline = sch.mode === 'ONLINE';

                    return (
                      <tr key={sch.id} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--brand-navy)', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <CalendarDays size={14} color="var(--brand-orange, #F37023)" />
                            {sch.date}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {getDayName(sch.date)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#1E40AF', fontSize: '0.825rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} /> {sch.slotTime || `${sch.startTime} - ${sch.endTime}`}
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                          {sch.facultyName}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {sch.ptmEventTitle || 'Academic Progress Review'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.8125rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isOnline ? <Video size={14} color="#10B981" /> : <MapPin size={14} color="var(--brand-orange, #F37023)" />}
                            <span style={{ fontWeight: 600, color: isOnline ? '#065F46' : 'var(--brand-navy)' }}>
                              {isOnline ? 'Online — Google Meet' : `In-Person — ${sch.venue || 'Room 302'}`}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <Badge variant={sch.status === 'SCHEDULED' || sch.status === 'CONFIRMED' ? 'active' : 'warning'}>
                            {sch.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedSchedule(sch)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem', fontWeight: 700 }}
                              title="View full meeting details"
                            >
                              <Eye size={13} /> Details
                            </button>
                            {isOnline && sch.meetingLink ? (
                              <a
                                href={sch.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.25rem 0.65rem', fontWeight: 700, background: '#059669', borderColor: '#059669' }}
                              >
                                <Video size={13} /> Join
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setRescheduleModalSchedule(sch)}
                                className="btn btn-outline btn-sm"
                                style={{ fontSize: '0.725rem', padding: '0.25rem 0.55rem' }}
                              >
                                Reschedule
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>

          {/* Cards Breakdown with Venue & Agenda */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
            {upcomingSchedules.map(sch => (
              <div key={sch.id} className="card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                      {sch.ptmEventTitle}
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Assigned Guide: <strong>{sch.facultyName}</strong>
                    </span>
                  </div>
                  <Badge variant={sch.mode === 'ONLINE' ? 'navy' : 'orange'}>
                    {sch.mode === 'ONLINE' ? 'Virtual (Google Meet)' : 'In-Person'}
                  </Badge>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Date &amp; Slot:</span>
                    <strong style={{ color: 'var(--brand-navy)' }}>{sch.date} ({getDayName(sch.date)}) • {sch.slotTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Venue / Link:</span>
                    <strong style={{ color: '#1E40AF' }}>{sch.venue || 'Room 302, Academic Block B'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parent Confirmation:</span>
                    <strong style={{ color: '#10B981' }}>Confirmed ({sch.parentName} - {sch.parentRelationship})</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedSchedule(sch)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontWeight: 600 }}
                  >
                    View Agenda &amp; Guidelines
                  </button>
                  {sch.mode === 'ONLINE' && sch.meetingLink && (
                    <a
                      href={sch.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
                    >
                      <Video size={13} /> Join Virtual Room
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─── TAB 2: FACULTY FEEDBACK & REMARKS ────────────────────────────── */}
      {activeTab === 'FEEDBACK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Faculty Mentoring Assessments &amp; Official Feedback Notes
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Formal progress remarks and academic advisory recorded by course instructors and mentors.
              </p>
            </div>
            <Badge variant="orange">{records.length} Feedback Records</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {records.map((rec, idx) => (
              <div key={rec.id || idx} className="card" style={{ padding: '1.75rem', borderLeft: '4px solid var(--brand-navy)' }}>
                
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #0B192C 0%, #1E40AF 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                      {rec.facultyName.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                        {rec.facultyName}
                      </h4>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                        Subject Area: <strong>{rec.subjectDiscussions?.[0]?.subjectName || 'Computer Science Engineering'}</strong> • Evaluation Date: <strong>{rec.date}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Badge variant="active">ATTENDANCE: {rec.subjectDiscussions?.[0]?.attendancePercentage || 90}%</Badge>
                    <Badge variant="orange">OUTCOME: {rec.outcome || 'SATISFACTORY'}</Badge>
                  </div>
                </div>

                {/* Academic Evaluation Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  
                  <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Academic Performance
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--brand-navy)', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                      {rec.academicPerformance}
                    </p>
                  </div>

                  <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '0.725rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                      Key Strengths &amp; Initiative
                    </span>
                    <p style={{ fontSize: '0.85rem', color: '#065F46', lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
                      ✓ {rec.strengths}
                    </p>
                  </div>
                </div>

                {/* Faculty Remarks & Improvement Area */}
                <div style={{ background: 'rgba(243, 112, 35, 0.05)', border: '1px solid rgba(243, 112, 35, 0.25)', borderRadius: '8px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9A3412', textTransform: 'uppercase', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Award size={14} color="#F37023" /> Faculty Advisor Remarks
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#7C2D12', lineHeight: 1.5, fontWeight: 500 }}>
                    &quot;{rec.facultyRemarks}&quot;
                  </div>
                  {rec.areasForImprovement && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9A3412' }}>
                      <strong>Areas for Improvement:</strong> {rec.areasForImprovement}
                    </div>
                  )}
                </div>

                {/* Subject Discussion Table */}
                {rec.subjectDiscussions && rec.subjectDiscussions.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.775rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      Evaluated Subjects Breakdown:
                    </div>
                    <div className="table-responsive">
                      <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
                        <thead>
                          <tr style={{ background: '#F1F5F9' }}>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Subject Code</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Subject Name</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Internal Marks</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Attendance</th>
                            <th style={{ padding: '0.5rem 0.75rem' }}>Faculty Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rec.subjectDiscussions.map((sub, sIdx) => (
                            <tr key={sIdx}>
                              <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontWeight: 700, color: '#1E40AF' }}>{sub.subjectCode}</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{sub.subjectName}</td>
                              <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{sub.internalMarks} / {sub.maxInternalMarks}</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: '#059669', fontWeight: 700 }}>{sub.attendancePercentage}%</td>
                              <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-secondary)' }}>{sub.remarks}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Follow-up Required Banner */}
                {rec.actionRequired && (
                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#B45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={14} color="#D97706" /> Follow-up action task assigned. Check Tab 3 for progress tracking.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('TASKS')}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      View Assigned Task →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 3: ACADEMIC FOLLOW-UP TASKS ──────────────────────────────── */}
      {activeTab === 'TASKS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-navy)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Tasks</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-navy)', marginTop: '0.2rem' }}>{followUps.length} Actions</div>
            </div>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid var(--brand-orange, #F37023)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Progress / Pending</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-orange, #F37023)', marginTop: '0.2rem' }}>
                {followUps.filter(f => f.status === 'PENDING' || f.status === 'IN_PROGRESS').length} Tasks
              </div>
            </div>
            <div className="card" style={{ padding: '1rem 1.25rem', borderLeft: '4px solid #10B981' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '0.2rem' }}>
                {followUps.filter(f => f.status === 'COMPLETED').length} Tasks
              </div>
            </div>
          </div>

          {/* Task Register Table */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                  Academic Follow-Up Task Register
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Action items assigned during PTM mentoring sessions for continuous academic improvement.
                </p>
              </div>
            </div>

            <ExcelTableContainer minWidth="900px">
              <ExcelTable>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                    <th style={{ width: '380px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Task Description</th>
                    <th style={{ width: '180px', padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, color: 'var(--brand-navy)' }}>Assigned By</th>
                    <th style={{ width: '130px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Due Date</th>
                    <th style={{ width: '110px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Priority</th>
                    <th style={{ width: '130px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Status</th>
                    <th style={{ width: '140px', padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {followUps.map((task, idx) => {
                    const isDone = task.status === 'COMPLETED';

                    return (
                      <tr key={task.id || idx} style={{ background: isDone ? '#F0FDF4' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                            <div style={{ marginTop: '0.1rem', color: isDone ? '#10B981' : 'var(--brand-orange, #F37023)' }}>
                              {isDone ? <CheckCircle size={16} /> : <Clock3 size={16} />}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--brand-navy)', fontSize: '0.875rem', textDecoration: isDone ? 'line-through' : 'none' }}>
                                {task.actionDescription}
                              </strong>
                              {task.completionRemarks && (
                                <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: '0.2rem' }}>
                                  Note: {task.completionRemarks}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.825rem' }}>
                          <strong style={{ color: 'var(--brand-navy)' }}>{task.assignedToName}</strong>
                          <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{task.assignedToRole}</div>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontSize: '0.8125rem', fontWeight: 700, color: isDone ? '#047857' : '#1E40AF' }}>
                          {task.dueDate}
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <span style={{
                            padding: '0.2rem 0.55rem', borderRadius: '4px', fontSize: '0.725rem', fontWeight: 800,
                            background: task.priority === 'HIGH' ? '#FEE2E2' : task.priority === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7',
                            color: task.priority === 'HIGH' ? '#991B1B' : task.priority === 'CRITICAL' ? '#991B1B' : '#92400E'
                          }}>
                            {task.priority}
                          </span>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <Badge variant={isDone ? 'active' : task.status === 'IN_PROGRESS' ? 'orange' : 'warning'}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleTaskStatus(task.id, task.status)}
                            className={`btn btn-sm ${isDone ? 'btn-secondary' : 'btn-primary'}`}
                            style={{
                              fontSize: '0.75rem', padding: '0.25rem 0.65rem',
                              background: isDone ? undefined : 'var(--brand-orange, #F37023)',
                              borderColor: isDone ? undefined : 'var(--brand-orange, #F37023)',
                              fontWeight: 700
                            }}
                          >
                            {isDone ? 'Reopen Task' : 'Mark Complete'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </ExcelTable>
            </ExcelTableContainer>
          </div>
        </div>
      )}

      {/* ─── TAB 4: REQUEST 1-ON-1 CONSULTATION ──────────────────────────── */}
      {activeTab === 'REQUEST' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '820px', margin: '0 auto', width: '100%' }}>
          
          {submittedMemo && (
            <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)', border: '1px solid #86EFAC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <CheckCircle size={24} color="#059669" />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#065F46' }}>
                      Consultation Request #{submittedMemo.id} Submitted Successfully
                    </h4>
                    <span style={{ fontSize: '0.78rem', color: '#047857' }}>
                      Your faculty mentor has been notified. Check your registered student email and portal notification.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmittedMemo(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#065F46' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ background: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #BBF7D0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Faculty Advisor</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{submittedMemo.faculty}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Requested Date &amp; Slot</span>
                  <strong style={{ color: 'var(--brand-navy)' }}>{submittedMemo.date} • {submittedMemo.time}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>Meeting Mode</span>
                  <strong style={{ color: '#059669' }}>{submittedMemo.mode}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={22} color="var(--brand-orange, #F37023)" /> Schedule 1-on-1 Faculty Mentoring Consultation
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Book an individual consultation slot with your assigned faculty mentor or subject guide for academic feedback, project guidance, or career roadmap discussions.
              </p>
            </div>

            <form onSubmit={handleRequestConsultation} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Faculty Selector (Auto-selects assigned mentor) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Select Faculty / Mentor <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={selectedFacultyId}
                    onChange={e => setSelectedFacultyId(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '6px', borderColor: '#CBD5E1' }}
                  >
                    <option value="fac-1">Demo Faculty 1 (Assigned Mentor — CSE)</option>
                    <option value="fac-2">Dr. Sarah Jenkins (Prof. — Database Systems)</option>
                    <option value="fac-3">Prof. Rajesh Patel (HOD — Computer Engineering)</option>
                  </select>
                  <span style={{ fontSize: '0.725rem', color: '#059669', display: 'block', marginTop: '0.25rem' }}>
                    ✓ Assigned Mentor ({activeMentor?.name || 'Demo Faculty 1'}) pre-selected
                  </span>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Consultation Purpose / Category <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={consultationCategory}
                    onChange={e => setConsultationCategory(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '6px', borderColor: '#CBD5E1' }}
                  >
                    <option value="Academic Mentoring & Performance Review">Academic Mentoring &amp; Performance Review</option>
                    <option value="Lab Project & Research Guidance">Lab Project &amp; Research Guidance</option>
                    <option value="Career Advisory & Internship Roadmap">Career Advisory &amp; Internship Roadmap</option>
                    <option value="Remedial Doubt-Clearing Session">Remedial Doubt-Clearing Session</option>
                    <option value="Attendance & Leave Clarification">Attendance &amp; Leave Clarification</option>
                  </select>
                </div>
              </div>

              {/* Date & Time Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Preferred Date <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={e => setPreferredDate(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.6rem 0.85rem', fontSize: '0.875rem', borderRadius: '6px', borderColor: '#CBD5E1' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Preferred Time Slot <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.875rem', borderRadius: '6px', borderColor: '#CBD5E1' }}
                  >
                    <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM (Morning Slot)</option>
                    <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM (Afternoon Slot)</option>
                    <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM (Evening Slot)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                    Meeting Mode <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    <button
                      type="button"
                      onClick={() => setMeetingMode('PHYSICAL')}
                      className={`btn btn-sm ${meetingMode === 'PHYSICAL' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.8rem', fontWeight: 700,
                        background: meetingMode === 'PHYSICAL' ? 'var(--brand-orange, #F37023)' : undefined,
                        borderColor: meetingMode === 'PHYSICAL' ? 'var(--brand-orange, #F37023)' : undefined
                      }}
                    >
                      In-Person (Room 302)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingMode('ONLINE')}
                      className={`btn btn-sm ${meetingMode === 'ONLINE' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{
                        flex: 1, padding: '0.6rem 0.5rem', fontSize: '0.8rem', fontWeight: 700,
                        background: meetingMode === 'ONLINE' ? '#059669' : undefined,
                        borderColor: meetingMode === 'ONLINE' ? '#059669' : undefined
                      }}
                    >
                      Online (Google Meet)
                    </button>
                  </div>
                </div>
              </div>

              {/* Discussion Topics & Agenda */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.825rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Discussion Topics &amp; Agenda Details <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <textarea
                  rows={3}
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  placeholder="Outline the specific topics you wish to discuss (e.g. Data Structures graph algorithms doubt clearing, mid-term test marks review, or mini-project guidance)..."
                  className="form-control"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem', borderRadius: '6px', borderColor: formSubmitted && !agenda.trim() ? '#EF4444' : '#CBD5E1', resize: 'vertical' }}
                  required
                />
                {formSubmitted && !agenda.trim() && (
                  <span style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem', display: 'block' }}>
                    Please enter discussion topics or agenda for your consultation.
                  </span>
                )}
              </div>

              {/* Submit Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)',
                    fontWeight: 700, padding: '0.65rem 1.75rem'
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="spin-animation" /> Submitting Request...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Consultation Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ─────────────────────────────────────────────────── */}
      {selectedSchedule && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  {selectedSchedule.ptmEventTitle || 'PTM Consultation Details'}
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Ref Schedule ID: <code style={{ color: '#1E40AF' }}>{selectedSchedule.id}</code>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', fontSize: '0.825rem', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Meeting Date &amp; Slot</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{selectedSchedule.date} ({getDayName(selectedSchedule.date)}) • {selectedSchedule.slotTime}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Faculty Guide</span>
                <strong style={{ color: 'var(--brand-navy)' }}>{selectedSchedule.facultyName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Venue / Mode</span>
                <strong style={{ color: '#1E40AF' }}>{selectedSchedule.venue || 'Room 302'} ({selectedSchedule.mode})</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem' }}>Parent Confirmation</span>
                <strong style={{ color: '#10B981' }}>Confirmed ({selectedSchedule.parentName})</strong>
              </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Guidelines:</strong> Please report at least 10 minutes before the allocated slot. Both physical and virtual attendees will be provided with academic summary printouts during the conference.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="btn btn-secondary"
                style={{ fontWeight: 600 }}
              >
                Close
              </button>
              {selectedSchedule.meetingLink && selectedSchedule.mode === 'ONLINE' && (
                <a
                  href={selectedSchedule.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', fontWeight: 700 }}
                >
                  <Video size={14} /> Join Meeting Room
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Reschedule Modal ──────────────────────────────────────────────── */}
      {rescheduleModalSchedule && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '1.75rem', background: '#FFFFFF', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Request Reschedule Slot
              </h4>
              <button
                type="button"
                onClick={() => setRescheduleModalSchedule(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Proposed Alternate Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate || '2026-09-06'}
                  onChange={e => setRescheduleDate(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Preferred Time Slot
                </label>
                <select
                  value={rescheduleTime}
                  onChange={e => setRescheduleTime(e.target.value)}
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
                >
                  <option value="11:00 AM - 11:30 AM">11:00 AM - 11:30 AM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="04:00 PM - 04:30 PM">04:00 PM - 04:30 PM</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                  Reason for Rescheduling
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReason}
                  onChange={e => setRescheduleReason(e.target.value)}
                  placeholder="Parent has conflict with travel schedule / exam preparation..."
                  className="form-control"
                  style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setRescheduleModalSchedule(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', fontWeight: 700 }}
                >
                  Submit Reschedule Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentPTMView;
