import React, { useState, useMemo, useEffect } from 'react';
import { Assignment, AssignmentSubmission, Subject } from '../../types';
import { db } from '../../services/db';
import { assignmentService, EnrichedStudentSubmissionRow } from '../../services/assignmentService';
import { fileStorage } from '../../services/fileStorage';
import { 
  X, Search, Download, Eye, FileSpreadsheet, Award, 
  Clock, CheckCircle2, AlertCircle, AlertTriangle, 
  FileText, Calendar, Filter, User, Layers, RefreshCw, Check
} from 'lucide-react';
import { Badge } from '../common/Badge';

interface AssignmentSubmissionDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSubmissionsUpdated?: () => void;
}

export const AssignmentSubmissionDetailsDrawer: React.FC<AssignmentSubmissionDetailsDrawerProps> = ({
  isOpen,
  onClose,
  assignment,
  onSubmissionsUpdated
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'PENDING' | 'LATE' | 'GRADED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Submission Viewer Modal State
  const [selectedStudentRow, setSelectedStudentRow] = useState<EnrichedStudentSubmissionRow | null>(null);
  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  
  // Faculty Quick Grading Form State
  const [isEditingGrade, setIsEditingGrade] = useState(false);
  const [gradeMarks, setGradeMarks] = useState<number>(0);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');

  // Close on Escape Key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isViewerModalOpen) {
          setIsViewerModalOpen(false);
        } else if (isOpen) {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isViewerModalOpen, onClose]);

  // Subject and Division details
  const subject: Subject | undefined = useMemo(() => {
    if (!assignment) return undefined;
    return db.getSubjectById(assignment.subjectId);
  }, [assignment]);

  const divisionName = useMemo(() => {
    if (!assignment?.divisionId) return 'Division A';
    const div = db.getDivisionById(assignment.divisionId);
    return div?.name || 'Division A';
  }, [assignment]);

  const semesterNumber = useMemo(() => {
    if (assignment?.semesterId) {
      const sem = db.getSemesterById(assignment.semesterId);
      return sem?.number || 4;
    }
    if (subject?.semesterId) {
      const sem = db.getSemesterById(subject.semesterId);
      return sem?.number || 4;
    }
    return 4;
  }, [assignment, subject]);

  // Dynamic assignment statistics
  const stats = useMemo(() => {
    if (!assignment) {
      return { totalEnrolled: 0, submittedCount: 0, pendingCount: 0, lateCount: 0, gradedCount: 0, submissionRate: '0%' };
    }
    return assignmentService.getAssignmentStats(assignment);
  }, [assignment, isOpen]);

  // Enriched Student Roster
  const studentRows = useMemo(() => {
    if (!assignment) return [];
    return assignmentService.getStudentSubmissionRoster(assignment, statusFilter, searchQuery);
  }, [assignment, statusFilter, searchQuery, isOpen]);

  if (!isOpen || !assignment) return null;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD -> DD-MM-YYYY
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  // Open Student Submission View Modal
  const handleOpenStudentSubmission = (row: EnrichedStudentSubmissionRow) => {
    setSelectedStudentRow(row);
    setGradeMarks(row.obtainedMarks !== undefined ? row.obtainedMarks : Math.min(row.totalMarks, Math.round(row.totalMarks * 0.9)));
    setGradeFeedback(row.feedback || 'Good work! Accurate solution.');
    setIsEditingGrade(false);
    setIsViewerModalOpen(true);
  };

  // Save Faculty Grade
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentRow?.submissionId) return;

    db.updateEntity<AssignmentSubmission>('assignmentSubmissions', selectedStudentRow.submissionId, {
      status: 'GRADED',
      obtainedMarks: Number(gradeMarks),
      feedback: gradeFeedback.trim() || 'Evaluated.'
    }, `Graded assignment for ${selectedStudentRow.studentName}`);

    // Update local state
    setSelectedStudentRow(prev => prev ? {
      ...prev,
      submissionStatus: 'GRADED',
      obtainedMarks: Number(gradeMarks),
      marksDisplay: `${gradeMarks} / ${prev.totalMarks}`,
      feedback: gradeFeedback
    } : null);

    setIsEditingGrade(false);
    if (onSubmissionsUpdated) onSubmissionsUpdated();
  };

  // Export Roster to Excel
  const handleExportExcel = () => {
    try {
      assignmentService.exportSubmissionsToExcel(assignment, subject, studentRows);
    } catch (err) {
      console.error('Failed to export submissions Excel:', err);
      alert('Failed to generate Excel report.');
    }
  };

  return (
    <>
      {/* ── BACKDROP OVERLAY ─────────────────────────────────────────────────── */}
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 1050,
          transition: 'opacity 0.2s ease-in-out'
        }}
        onClick={onClose}
      />

      {/* ── RIGHT-SIDE SLIDE-OVER DRAWER ────────────────────────────────────── */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '1100px',
          backgroundColor: '#FFFFFF',
          boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.2)',
          zIndex: 1060,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* ── DRAWER TOP BAR / HEADER ────────────────────────────────────────── */}
        <div style={{
          background: '#0F2C59',
          color: '#FFFFFF',
          padding: '1.25rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '3px solid #F37023'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FileSpreadsheet size={20} color="#FDBA74" />
              </div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, margin: 0, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
                Assignment Submission Details
              </h2>
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#E2E8F0', marginTop: '4px' }}>
              Real-time student submission tracking, evaluation status &amp; document access
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#059669',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.45rem 0.85rem',
                borderRadius: '4px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
              title="Download Excel Submission Roster"
            >
              <FileSpreadsheet size={15} /> Export Roster (.xlsx)
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#FFFFFF',
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
              title="Close Drawer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── DRAWER BODY (SCROLLABLE) ───────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#F8FAFC' }}>
          
          {/* ── TOP SECTION: ASSIGNMENT INFORMATION & SUMMARY CARDS ────────── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            padding: '1.25rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            {/* Assignment Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #E2E8F0'
            }}>
              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Assignment Title
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F2C59', marginTop: '2px' }}>
                  {assignment.title}
                </div>
                {assignment.description && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px', lineHeight: 1.3 }}>
                    {assignment.description}
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Subject / Course Code
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59', marginTop: '2px' }}>
                  {subject ? `${subject.name} (${subject.code})` : 'Database Management Systems (CSE-402)'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Unit {assignment.unitNo} • Max Marks: <strong>{assignment.totalMarks}</strong>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Semester &amp; Division
                </div>
                <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0F2C59', marginTop: '2px' }}>
                  Semester {semesterNumber} • Division {divisionName.replace('Division ', '')}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                  Deadline: <strong style={{ color: '#DC2626' }}>{formatDate(assignment.deadline)}</strong>
                </div>
              </div>
            </div>

            {/* Metric KPI Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.75rem',
              marginTop: '1rem'
            }}>
              {/* 1. Total Enrolled */}
              <div style={{
                background: '#F1F5F9',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                borderLeft: '4px solid #0F2C59',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Students</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#0F2C59' }}>{stats.totalEnrolled}</div>
                </div>
                <User size={20} color="#0F2C59" />
              </div>

              {/* 2. Submitted */}
              <div style={{
                background: '#F0FDF4',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                borderLeft: '4px solid #16A34A',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#15803D', textTransform: 'uppercase' }}>Submitted</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#16A34A' }}>{stats.submittedCount}</div>
                </div>
                <CheckCircle2 size={20} color="#16A34A" />
              </div>

              {/* 3. Pending */}
              <div style={{
                background: '#FFFBEB',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                borderLeft: '4px solid #F59E0B',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Pending</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#D97706' }}>{stats.pendingCount}</div>
                </div>
                <Clock size={20} color="#D97706" />
              </div>

              {/* 4. Late */}
              <div style={{
                background: '#FEF2F2',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                borderLeft: '4px solid #DC2626',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Late</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#DC2626' }}>{stats.lateCount}</div>
                </div>
                <AlertTriangle size={20} color="#DC2626" />
              </div>

              {/* 5. Graded */}
              <div style={{
                background: '#EFF6FF',
                borderRadius: '6px',
                padding: '0.75rem 1rem',
                borderLeft: '4px solid #2563EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#1E40AF', textTransform: 'uppercase' }}>Graded</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 900, color: '#2563EB' }}>{stats.gradedCount}</div>
                </div>
                <Award size={20} color="#2563EB" />
              </div>
            </div>
          </div>

          {/* ── TOOLBAR: STATUS FILTER PILLS & INSTANT SEARCH ────────────────── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            padding: '0.75rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === 'ALL' ? '1px solid #0F2C59' : '1px solid #CBD5E1',
                  background: statusFilter === 'ALL' ? '#0F2C59' : '#FFFFFF',
                  color: statusFilter === 'ALL' ? '#FFFFFF' : '#334155',
                  transition: 'all 0.15s ease'
                }}
              >
                All Students ({stats.totalEnrolled})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('SUBMITTED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === 'SUBMITTED' ? '1px solid #16A34A' : '1px solid #BBF7D0',
                  background: statusFilter === 'SUBMITTED' ? '#16A34A' : '#F0FDF4',
                  color: statusFilter === 'SUBMITTED' ? '#FFFFFF' : '#15803D',
                  transition: 'all 0.15s ease'
                }}
              >
                Submitted ({stats.submittedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === 'PENDING' ? '1px solid #D97706' : '1px solid #FDE68A',
                  background: statusFilter === 'PENDING' ? '#D97706' : '#FFFBEB',
                  color: statusFilter === 'PENDING' ? '#FFFFFF' : '#B45309',
                  transition: 'all 0.15s ease'
                }}
              >
                Pending ({stats.pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('LATE')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === 'LATE' ? '1px solid #DC2626' : '1px solid #FECACA',
                  background: statusFilter === 'LATE' ? '#DC2626' : '#FEF2F2',
                  color: statusFilter === 'LATE' ? '#FFFFFF' : '#991B1B',
                  transition: 'all 0.15s ease'
                }}
              >
                Late ({stats.lateCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('GRADED')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '0.78125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: statusFilter === 'GRADED' ? '1px solid #2563EB' : '1px solid #BFDBFE',
                  background: statusFilter === 'GRADED' ? '#2563EB' : '#EFF6FF',
                  color: statusFilter === 'GRADED' ? '#FFFFFF' : '#1E40AF',
                  transition: 'all 0.15s ease'
                }}
              >
                Graded ({stats.gradedCount})
              </button>
            </div>

            {/* Instant Search Box */}
            <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '360px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
              <input
                type="text"
                placeholder="Search by student name or enrollment number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  height: '32px',
                  paddingLeft: '32px',
                  paddingRight: '28px',
                  fontSize: '0.8125rem',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#0F2C59',
                  outline: 'none'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── EXCEL-STYLE STUDENT SUBMISSIONS ROSTER TABLE ─────────────────── */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            overflow: 'hidden'
          }}>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.8125rem',
                textAlign: 'left',
                background: '#FFFFFF',
                minWidth: '950px'
              }}>
                <thead>
                  <tr style={{
                    background: '#F1F5F9',
                    color: '#0F2C59',
                    borderBottom: '2px solid #CBD5E1'
                  }}>
                    <th style={{ padding: '10px 8px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '55px', borderRight: '1px solid #E2E8F0' }}>
                      Sr. No.
                    </th>
                    <th style={{ padding: '10px 10px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', width: '130px', borderRight: '1px solid #E2E8F0' }}>
                      Enrollment No.
                    </th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', minWidth: '180px', borderRight: '1px solid #E2E8F0' }}>
                      Student Name
                    </th>
                    <th style={{ padding: '10px 8px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '70px', borderRight: '1px solid #E2E8F0' }}>
                      Division
                    </th>
                    <th style={{ padding: '10px 10px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '115px', borderRight: '1px solid #E2E8F0' }}>
                      Status
                    </th>
                    <th style={{ padding: '10px 10px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '110px', borderRight: '1px solid #E2E8F0' }}>
                      Submitted Date
                    </th>
                    <th style={{ padding: '10px 10px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '105px', borderRight: '1px solid #E2E8F0' }}>
                      Submitted Time
                    </th>
                    <th style={{ padding: '10px 8px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '70px', borderRight: '1px solid #E2E8F0' }}>
                      Late
                    </th>
                    <th style={{ padding: '10px 10px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '95px', borderRight: '1px solid #E2E8F0' }}>
                      Marks
                    </th>
                    <th style={{ padding: '10px 12px', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '0.5px', textTransform: 'uppercase', textAlign: 'center', width: '90px' }}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {studentRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ padding: '3rem 1rem', textAlign: 'center', color: '#64748B' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={28} color="#94A3B8" />
                          <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#334155' }}>No students match the criteria</span>
                          <span style={{ fontSize: '0.8125rem' }}>Try clearing the search query or changing status filters.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    studentRows.map((row, idx) => {
                      const isEven = idx % 2 === 0;

                      // Status Badge Styling
                      let statusBadgeBg = '#FEF3C7';
                      let statusBadgeColor = '#B45309';
                      let statusBadgeBorder = '#FDE68A';

                      if (row.submissionStatus === 'GRADED') {
                        statusBadgeBg = '#DCFCE7';
                        statusBadgeColor = '#15803D';
                        statusBadgeBorder = '#BBF7D0';
                      } else if (row.submissionStatus === 'SUBMITTED') {
                        statusBadgeBg = '#E0F2FE';
                        statusBadgeColor = '#0369A1';
                        statusBadgeBorder = '#BAE6FD';
                      } else if (row.submissionStatus === 'LATE') {
                        statusBadgeBg = '#FEE2E2';
                        statusBadgeColor = '#B91C1C';
                        statusBadgeBorder = '#FECACA';
                      }

                      return (
                        <tr
                          key={row.studentId}
                          style={{
                            background: isEven ? '#FFFFFF' : '#F8FAFC',
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = isEven ? '#FFFFFF' : '#F8FAFC')}
                        >
                          {/* 1. Sr. No. */}
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                            {idx + 1}
                          </td>

                          {/* 2. Enrollment No. */}
                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                            {row.enrollmentNo}
                          </td>

                          {/* 3. Student Name */}
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0F2C59', borderRight: '1px solid #E2E8F0' }}>
                            <div>{row.studentName}</div>
                          </td>

                          {/* 4. Division */}
                          <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#475569', borderRight: '1px solid #E2E8F0' }}>
                            {row.divisionName}
                          </td>

                          {/* 5. Status */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '0.6875rem',
                              fontWeight: 800,
                              letterSpacing: '0.3px',
                              background: statusBadgeBg,
                              color: statusBadgeColor,
                              border: `1px solid ${statusBadgeBorder}`
                            }}>
                              {row.submissionStatus}
                            </span>
                          </td>

                          {/* 6. Submitted Date */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#334155', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                            {row.submittedDate ? formatDate(row.submittedDate) : '—'}
                          </td>

                          {/* 7. Submitted Time */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748B', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                            {row.submittedTime || '—'}
                          </td>

                          {/* 8. Late */}
                          <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                            {row.lateStatusDisplay === 'YES' ? (
                              <span style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.75rem' }}>YES</span>
                            ) : row.lateStatusDisplay === 'NO' ? (
                              <span style={{ fontWeight: 600, color: '#64748B', fontSize: '0.75rem' }}>NO</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            )}
                          </td>

                          {/* 9. Marks */}
                          <td style={{ padding: '8px 10px', textAlign: 'center', borderRight: '1px solid #E2E8F0', whiteSpace: 'nowrap' }}>
                            {row.obtainedMarks !== undefined ? (
                              <span style={{ fontWeight: 800, color: '#16A34A', fontSize: '0.8125rem' }}>
                                {row.obtainedMarks} / {row.totalMarks}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>—</span>
                            )}
                          </td>

                          {/* 10. Action */}
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                            {row.submissionStatus !== 'PENDING' ? (
                              <button
                                type="button"
                                onClick={() => handleOpenStudentSubmission(row)}
                                style={{
                                  padding: '3px 10px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  background: '#0F2C59',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}
                                title="View Submission & Grade"
                              >
                                <Eye size={12} /> View
                              </button>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Info */}
            <div style={{
              background: '#F8FAFC',
              borderTop: '1px solid #CBD5E1',
              padding: '0.65rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.78125rem',
              color: '#64748B'
            }}>
              <span>
                Showing <strong>{studentRows.length}</strong> of <strong>{stats.totalEnrolled}</strong> enrolled students
              </span>
              <span>
                Academic Year 2026-27 • Swarrnim Startup &amp; Innovation University
              </span>
            </div>
          </div>

        </div>

        {/* ── DRAWER FOOTER ─────────────────────────────────────────────────── */}
        <div style={{
          background: '#FFFFFF',
          borderTop: '1px solid #CBD5E1',
          padding: '0.85rem 1.75rem',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ fontWeight: 700 }}
          >
            Close Details
          </button>
        </div>
      </div>

      {/* ── MODAL: VIEW STUDENT SUBMISSION & GRADING ───────────────────────── */}
      {isViewerModalOpen && selectedStudentRow && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '1.75rem',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '8px',
            border: '1px solid #CBD5E1',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.25rem',
              borderBottom: '1px solid #E2E8F0',
              paddingBottom: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '6px', borderRadius: '6px' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                    Student Submission Details
                  </h3>
                  <div style={{ fontSize: '0.78125rem', color: '#64748B' }}>
                    {assignment.title}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsViewerModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Student Info Card */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.8125rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Student Name:</span>
                <strong style={{ color: '#0F2C59' }}>{selectedStudentRow.studentName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Enrollment No:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#F37023' }}>{selectedStudentRow.enrollmentNo}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Subject:</span>
                <span style={{ color: '#0F2C59', fontWeight: 600 }}>{subject ? `${subject.name} (${subject.code})` : 'Database Management Systems (CSE-402)'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Submitted Date &amp; Time:</span>
                <span style={{ color: '#0F2C59' }}>{formatDate(selectedStudentRow.submittedDate)} at {selectedStudentRow.submittedTime || '10:35 AM'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748B', fontWeight: 700 }}>Submission Status:</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Badge variant={selectedStudentRow.submissionStatus === 'GRADED' ? 'active' : selectedStudentRow.submissionStatus === 'LATE' ? 'danger' : 'navy'}>
                    {selectedStudentRow.submissionStatus}
                  </Badge>
                  {selectedStudentRow.isLate && (
                    <Badge variant="danger">LATE SUBMISSION</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Uploaded File Block */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '6px' }}>
                Uploaded Solution Document
              </div>
              {selectedStudentRow.fileUrl ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '6px',
                  padding: '0.75rem 1rem',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <FileText size={20} color="#F37023" />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0F2C59', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {selectedStudentRow.fileName || 'assignment_submission.pdf'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => fileStorage.viewFile(selectedStudentRow.fileUrl!)}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={13} /> View File
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => fileStorage.downloadFile(selectedStudentRow.fileUrl!, selectedStudentRow.fileName || 'submission.pdf')}
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Download size={13} /> Download
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', color: '#DC2626', fontSize: '0.8125rem' }}>
                  NOT SUBMITTED (No uploaded file attached)
                </div>
              )}
            </div>

            {/* Student Notes */}
            {selectedStudentRow.notes && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Student Remarks / Notes
                </div>
                <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', fontSize: '0.8125rem', color: '#334155' }}>
                  {selectedStudentRow.notes}
                </div>
              </div>
            )}

            {/* Marks & Faculty Evaluation Section */}
            <div style={{ marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
              {!isEditingGrade ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    background: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '6px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.71875rem', fontWeight: 800, color: '#15803D', textTransform: 'uppercase' }}>
                        Evaluation Score
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16A34A', marginTop: '2px' }}>
                        {selectedStudentRow.obtainedMarks !== undefined ? (
                          <>
                            {selectedStudentRow.obtainedMarks} <span style={{ fontSize: '0.9375rem', color: '#64748B' }}>/ {selectedStudentRow.totalMarks}</span>
                          </>
                        ) : (
                          <span style={{ fontSize: '1rem', color: '#D97706' }}>Pending Evaluation</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditingGrade(true)}
                      style={{ fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      {selectedStudentRow.obtainedMarks !== undefined ? 'Edit Grade / Feedback' : 'Grade Submission'}
                    </button>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.71875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Faculty Feedback / Remarks
                    </div>
                    <div style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.8125rem', color: '#0F2C59', fontStyle: 'italic' }}>
                      "{selectedStudentRow.feedback || 'Good work! Accurate solution.'}"
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveGrade} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>
                    Grade Submission for <span style={{ color: '#F37023' }}>{selectedStudentRow.studentName}</span>
                  </div>

                  <div className="grid-2">
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78125rem' }}>
                        Marks Obtained (Max: {selectedStudentRow.totalMarks}) *
                      </label>
                      <input
                        type="number"
                        className="form-input"
                        min={0}
                        max={selectedStudentRow.totalMarks}
                        value={gradeMarks}
                        onChange={(e) => setGradeMarks(Number(e.target.value))}
                        required
                        style={{ height: '34px', fontSize: '0.8125rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78125rem' }}>
                        Faculty Remarks / Feedback *
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Excellent ER diagram design."
                        value={gradeFeedback}
                        onChange={(e) => setGradeFeedback(e.target.value)}
                        required
                        style={{ height: '34px', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsEditingGrade(false)}
                      style={{ fontSize: '0.75rem' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={13} /> Save Grade
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsViewerModalOpen(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </>
  );
};
