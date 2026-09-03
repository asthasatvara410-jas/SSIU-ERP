import React, { useState, useEffect } from 'react';
import { 
  X, User, BookOpen, Calendar, AlertTriangle, CheckCircle, 
  Clock, ShieldAlert, Sparkles, MessageSquare, Plus, Trash2, 
  FileText, TrendingUp, CheckCircle2, Award, ExternalLink,
  Printer, Download, FileSpreadsheet
} from 'lucide-react';
import { Student } from '../../types';
import { PTMRecord, PTMSchedule, PTMFollowUpAction, PTMRating, PTMOutcome, PTMAttendanceStatus } from '../../types/ptm';
import { ptmService } from '../../services/ptmService';
import { db } from '../../services/db';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

interface StudentPTMDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  schedule?: PTMSchedule;
  onRecordSaved?: () => void;
}

export const StudentPTMDossierModal: React.FC<StudentPTMDossierModalProps> = ({
  isOpen,
  onClose,
  student,
  schedule,
  onRecordSaved
}) => {
  const { user, activeRole } = useAuth();

  const handlePrintDossier = () => {
    window.print();
  };

  const handleExportDossierExcel = () => {
    if (schedule && user) {
      ptmService.exportPTMReportToExcel({
        filteredSchedules: [schedule],
        studentId: student.id
      }, user, activeRole || 'FACULTY');
    } else if (user) {
      ptmService.exportPTMReportToExcel({
        studentId: student.id
      }, user, activeRole || 'FACULTY');
    }
  };

  // Navigation tab inside modal
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FORM' | 'HISTORY'>('OVERVIEW');

  // Load student related entities
  const program = db.getProgramById(student.programId);
  const semester = db.getSemesterById(student.semesterId);
  const department = db.getDepartments().find(d => d.id === student.departmentId);
  const institute = db.getInstitutes().find(i => i.id === student.instituteId);
  const subjects = db.getSubjects().filter(s => s.semesterId === student.semesterId);
  const parentProfile = ptmService.getParents().find(p => p.linkedStudentIds.includes(student.id));

  // Compute student stats
  const attendanceStats = db.getStudentAttendanceStats(student.id);
  const hasAttendanceShortage = attendanceStats.percentage < 75;
  const isCriticalShortage = attendanceStats.percentage < 60;

  // Load existing record for this schedule or create default
  const existingRecord = schedule ? ptmService.getRecordByScheduleId(schedule.id) : undefined;
  const { records: pastRecords, followUps: pastFollowUps } = ptmService.getPTMHistoryForStudent(
    student.id, 
    user!, 
    activeRole || 'FACULTY'
  );

  // Form State
  const [attendanceStatus, setAttendanceStatus] = useState<PTMAttendanceStatus>(
    existingRecord?.attendanceStatus || schedule?.attendanceStatus || 'PRESENT'
  );
  const [academicPerformance, setAcademicPerformance] = useState(
    existingRecord?.academicPerformance || `Student demonstrates active interest in theory concepts. Current internal aggregate is at ${attendanceStats.percentage >= 75 ? 'a strong' : 'an average'} level.`
  );
  const [strengths, setStrengths] = useState(
    existingRecord?.strengths || 'Regular lab attendance, good analytical mindset, respectful behaviour in classrooms.'
  );
  const [areasForImprovement, setAreasForImprovement] = useState(
    existingRecord?.areasForImprovement || (hasAttendanceShortage ? 'Attendance needs urgent improvement to reach 75%. Needs more time management in weekly coding assignments.' : 'Encouraged to take up technical seminar presentations and national competitions.')
  );
  const [attendanceConcern, setAttendanceConcern] = useState<boolean>(
    existingRecord?.attendanceConcern ?? hasAttendanceShortage
  );
  const [attendanceConcernDetails, setAttendanceConcernDetails] = useState(
    existingRecord?.attendanceConcernDetails || (hasAttendanceShortage ? `Attendance is at ${attendanceStats.percentage}% which is below the statutory 75% threshold.` : '')
  );
  const [assignmentConcern, setAssignmentConcern] = useState<boolean>(
    existingRecord?.assignmentConcern ?? false
  );
  const [assignmentConcernDetails, setAssignmentConcernDetails] = useState(
    existingRecord?.assignmentConcernDetails || ''
  );
  const [examConcern, setExamConcern] = useState<boolean>(
    existingRecord?.examConcern ?? false
  );
  const [examConcernDetails, setExamConcernDetails] = useState(
    existingRecord?.examConcernDetails || ''
  );

  // Ratings
  const [behaviourRating, setBehaviourRating] = useState<PTMRating>(
    existingRecord?.behaviourRating || 'GOOD'
  );
  const [disciplineRating, setDisciplineRating] = useState<PTMRating>(
    existingRecord?.disciplineRating || 'GOOD'
  );
  const [communicationRating, setCommunicationRating] = useState<PTMRating>(
    existingRecord?.communicationRating || 'GOOD'
  );
  const [participationRating, setParticipationRating] = useState<PTMRating>(
    existingRecord?.participationRating || 'GOOD'
  );
  const [overallDevelopment, setOverallDevelopment] = useState(
    existingRecord?.overallDevelopment || 'Demonstrating positive holistic development with scope for leadership in student clubs.'
  );

  // Remarks & Feedback
  const [facultyRemarks, setFacultyRemarks] = useState(
    existingRecord?.facultyRemarks || 'Discussed progress thoroughly with parents. Student is advised to follow the recommended study schedule.'
  );
  const [visibleToStudent, setVisibleToStudent] = useState<boolean>(
    existingRecord?.visibleToStudent ?? true
  );
  const [parentFeedback, setParentFeedback] = useState(
    existingRecord?.parentFeedback || 'Parent appreciated the regular updates and agreed to track homework and morning attendance.'
  );
  const [parentConcerns, setParentConcerns] = useState(
    existingRecord?.parentConcerns || 'Parent requested guidance on upcoming semester internship opportunities.'
  );

  // Outcome & Actions
  const [outcome, setOutcome] = useState<PTMOutcome>(
    existingRecord?.outcome || (hasAttendanceShortage ? 'ATTENDANCE_CONCERN' : 'SATISFACTORY')
  );
  const [actionRequired, setActionRequired] = useState<boolean>(
    existingRecord?.actionRequired ?? (hasAttendanceShortage ? true : false)
  );
  const [finalRemarks, setFinalRemarks] = useState(
    existingRecord?.finalRemarks || 'Meeting concluded successfully. Next progress review scheduled in 4 weeks.'
  );

  // Dynamic Follow-Up Action Items
  const [newActionDescription, setNewActionDescription] = useState('');
  const [newActionAssignedTo, setNewActionAssignedTo] = useState('Faculty Mentor');
  const [newActionPriority, setNewActionPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newActionDueDate, setNewActionDueDate] = useState('2025-04-15');
  const [actionItems, setActionItems] = useState<{
    id?: string;
    description: string;
    assignedTo: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    dueDate: string;
  }[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddActionItem = () => {
    if (!newActionDescription.trim()) return;
    setActionItems([
      ...actionItems,
      {
        description: newActionDescription.trim(),
        assignedTo: newActionAssignedTo,
        priority: newActionPriority,
        dueDate: newActionDueDate
      }
    ]);
    setNewActionDescription('');
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      const savedRecord = ptmService.savePTMRecord({
        id: existingRecord?.id,
        ptmScheduleId: schedule?.id || `ptm-sch-manual-${student.id}`,
        ptmEventId: schedule?.ptmEventId || 'ptm-event-1',
        studentId: student.id,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        parentId: parentProfile?.id || `parent-${student.id}`,
        parentName: parentProfile?.name || student.guardianName || 'Parent / Guardian',
        facultyId: user.id,
        facultyName: user.name,
        date: schedule?.date || new Date().toISOString().split('T')[0],
        attendanceStatus,
        academicPerformance,
        strengths,
        areasForImprovement,
        attendanceConcern,
        attendanceConcernDetails,
        assignmentConcern,
        assignmentConcernDetails,
        examConcern,
        examConcernDetails,
        behaviourRating,
        disciplineRating,
        communicationRating,
        participationRating,
        overallDevelopment,
        facultyRemarks,
        visibleToStudent,
        parentFeedback,
        parentConcerns,
        actionRequired,
        outcome,
        finalRemarks
      }, user);

      // Create any pending action items
      actionItems.forEach(item => {
        ptmService.createFollowUpAction({
          ptmRecordId: savedRecord.id,
          ptmScheduleId: schedule?.id || savedRecord.ptmScheduleId,
          studentId: student.id,
          studentName: student.name,
          enrollmentNo: student.enrollmentNo,
          actionDescription: item.description,
          assignedToId: user.id,
          assignedToName: item.assignedTo,
          assignedToRole: 'Mentor / Faculty',
          priority: item.priority,
          dueDate: item.dueDate,
          status: 'PENDING'
        });
      });

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        if (onRecordSaved) onRecordSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving PTM record:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="swarrnim-modal-overlay" style={{ zIndex: 1100 }} onClick={onClose}>
      <div 
        className="swarrnim-modal-dialog" 
        style={{ maxWidth: '980px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="swarrnim-modal-header" style={{ padding: '1rem 1.5rem', background: '#0F2C59', color: '#fff', borderBottom: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F58220'
            }}>
              <BookOpen size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                Student PTM Dossier &amp; Discussion Record
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span style={{ color: '#E2E8F0', fontSize: '0.8125rem', fontWeight: 600 }}>{student.name}</span>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>•</span>
                <code style={{ color: '#FCD34D', fontSize: '0.75rem', fontWeight: 700 }}>{student.enrollmentNo}</code>
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>•</span>
                <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>{program?.code || 'B.Tech'} (Sem {semester?.number || 4})</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={handlePrintDossier}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Print official student PTM dossier report"
            >
              <Printer size={14} /> Print Dossier
            </button>

            <button
              type="button"
              onClick={handleExportDossierExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Export dossier data to Excel report"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>

            <button 
              type="button" 
              className="swarrnim-modal-close-btn" 
              style={{ color: '#fff', background: 'rgba(255, 255, 255, 0.1)' }} 
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Sub-navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #E2E8F0',
          background: '#F8FAFC',
          padding: '0 1.5rem',
          gap: '0.5rem'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 700,
              fontSize: '0.84375rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'OVERVIEW' ? '3px solid #F58220' : '3px solid transparent',
              color: activeTab === 'OVERVIEW' ? '#0F2C59' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <User size={15} />
            Student 360° Dossier
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FORM')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 700,
              fontSize: '0.84375rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'FORM' ? '3px solid #F58220' : '3px solid transparent',
              color: activeTab === 'FORM' ? '#0F2C59' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={15} />
            PTM Record &amp; Discussion Form
            {existingRecord && (
              <span style={{ fontSize: '0.6875rem', background: '#DCFCE7', color: '#15803D', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                Recorded
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            style={{
              padding: '0.75rem 1rem',
              fontWeight: 700,
              fontSize: '0.84375rem',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'HISTORY' ? '3px solid #F58220' : '3px solid transparent',
              color: activeTab === 'HISTORY' ? '#0F2C59' : '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Clock size={15} />
            Past PTM History ({pastRecords.length})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="swarrnim-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, background: '#F8FAFC' }}>
          
          {/* TAB 1: 360° STUDENT DOSSIER */}
          {activeTab === 'OVERVIEW' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Top Alert if shortage */}
              {hasAttendanceShortage && (
                <div style={{
                  background: isCriticalShortage ? '#FEE2E2' : '#FEF3C7',
                  border: `1px solid ${isCriticalShortage ? '#FCA5A5' : '#FCD34D'}`,
                  borderRadius: '8px',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <AlertTriangle size={20} color={isCriticalShortage ? '#B91C1C' : '#B45309'} />
                  <div>
                    <strong style={{ color: isCriticalShortage ? '#B91C1C' : '#B45309', fontSize: '0.875rem' }}>
                      {isCriticalShortage ? 'Critical Attendance Warning (<60%)' : 'Attendance Shortage Warning (60%–74%)'}
                    </strong>
                    <div style={{ fontSize: '0.8125rem', color: isCriticalShortage ? '#7F1D1D' : '#78350F', marginTop: '0.15rem' }}>
                      Current attendance is at <strong>{attendanceStats.percentage}%</strong>. The parent must be formally notified during today's PTM.
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Column Info: Student + Parent Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                
                {/* A. Student Info */}
                <div style={{ background: '#fff', borderRadius: '8px', padding: '1.15rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                    <User size={16} color="#0F2C59" />
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>A. Student Information</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Full Name</span>
                      <strong style={{ color: '#1E293B' }}>{student.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Enrollment No.</span>
                      <code style={{ color: '#D97706', fontWeight: 700 }}>{student.enrollmentNo}</code>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Program &amp; Sem</span>
                      <strong style={{ color: '#1E293B' }}>{program?.code || 'B.Tech'} (Sem {semester?.number || 4})</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Division / Batch</span>
                      <strong style={{ color: '#1E293B' }}>{student.divisionId || 'Div A'} / {student.batchId || '2023'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Institute</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{institute?.code || 'SSCIT'}</span>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Department</span>
                      <span style={{ color: '#334155', fontWeight: 600 }}>{department?.code || 'CE'}</span>
                    </div>
                  </div>
                </div>

                {/* B. Parent Info */}
                <div style={{ background: '#fff', borderRadius: '8px', padding: '1.15rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                    <MessageSquare size={16} color="#0F2C59" />
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>B. Parent / Guardian Details</h4>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.8125rem' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Parent Name</span>
                      <strong style={{ color: '#1E293B' }}>{parentProfile?.name || student.guardianName || 'Rajesh Sharma'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Relationship</span>
                      <strong style={{ color: '#1E293B' }}>{parentProfile?.relationship || 'Father'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Contact Number</span>
                      <strong style={{ color: '#1E293B' }}>{parentProfile?.phone || student.guardianPhone || '+91 98765 43210'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Email Address</span>
                      <span style={{ color: '#334155', fontSize: '0.75rem' }}>{parentProfile?.email || `${student.enrollmentNo.toLowerCase()}.parent@university.edu`}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Residential Address</span>
                      <span style={{ color: '#334155', fontSize: '0.75rem' }}>{parentProfile?.address || student.address || 'Gandhinagar, Gujarat'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* C. Academic Performance & Attendance Overview */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1.15rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={16} color="#0F2C59" />
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>C. Current Academic &amp; Attendance Standing</h4>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Overall Attendance:</span>
                    <Badge variant={attendanceStats.percentage >= 75 ? 'active' : attendanceStats.percentage >= 60 ? 'warning' : 'danger'}>
                      {attendanceStats.percentage}% ({attendanceStats.presentClasses}/{attendanceStats.totalClasses} Sessions)
                    </Badge>
                  </div>
                </div>

                <div className="table-responsive" style={{ margin: 0 }}>
                  <table className="table" style={{ fontSize: '0.8125rem' }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC' }}>
                        <th>Subject Code &amp; Name</th>
                        <th>Type</th>
                        <th>Internal Marks</th>
                        <th>Attendance %</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.slice(0, 4).map((sub, idx) => {
                        const marks = 22 + (idx * 2) % 8;
                        const subAtt = student.id === 'student-3' ? 50 : 85 + (idx * 5) % 15;
                        return (
                          <tr key={sub.id}>
                            <td>
                              <strong>{sub.code}</strong> — {sub.name}
                            </td>
                            <td>
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{sub.type || 'Theory + Lab'}</span>
                            </td>
                            <td>
                              <strong style={{ color: '#0F2C59' }}>{marks}</strong> / 30
                            </td>
                            <td>
                              <Badge variant={subAtt >= 75 ? 'active' : subAtt >= 60 ? 'warning' : 'danger'}>
                                {subAtt}%
                              </Badge>
                            </td>
                            <td>
                              <span style={{ color: subAtt >= 75 ? '#15803D' : '#B91C1C', fontWeight: 600, fontSize: '0.75rem' }}>
                                {subAtt >= 75 ? 'Eligible' : 'Debarment Risk'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button to switch to Form */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('FORM')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <FileText size={16} />
                  Proceed to PTM Discussion Form
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PTM RECORD & DISCUSSION FORM */}
          {activeTab === 'FORM' && (
            <form onSubmit={handleSaveRecord} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Meeting Meta Card */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1rem 1.25rem', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Parent Attendance Status</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                    {(['PRESENT', 'ABSENT', 'RESCHEDULED', 'DECLINED'] as PTMAttendanceStatus[]).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setAttendanceStatus(st)}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: attendanceStatus === st ? '2px solid #0F2C59' : '1px solid #CBD5E1',
                          background: attendanceStatus === st ? '#0F2C59' : '#fff',
                          color: attendanceStatus === st ? '#fff' : '#334155'
                        }}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>PTM Outcome Classification</div>
                  <select
                    className="form-input"
                    value={outcome}
                    onChange={e => setOutcome(e.target.value as PTMOutcome)}
                    style={{ marginTop: '0.35rem', fontWeight: 700, fontSize: '0.8125rem' }}
                  >
                    <option value="SATISFACTORY">🟢 Satisfactory Progress</option>
                    <option value="IMPROVEMENT_REQUIRED">🟡 General Improvement Required</option>
                    <option value="ACADEMIC_CONCERN">🔴 Academic Risk Concern</option>
                    <option value="ATTENDANCE_CONCERN">🔴 Attendance Shortage Concern</option>
                    <option value="BEHAVIOUR_CONCERN">🔴 Behaviour / Discipline Concern</option>
                    <option value="PARENT_FOLLOWUP_REQUIRED">🟡 Parent Follow-up Required</option>
                  </select>
                </div>
              </div>

              {/* 1. Academic Discussion */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  1. Academic Performance &amp; Evaluation Notes
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Academic Discussion Summary *</label>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={academicPerformance}
                      onChange={e => setAcademicPerformance(e.target.value)}
                      placeholder="Detail the discussion regarding test marks, subject comprehension and overall academic standing..."
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8125rem' }}>Key Strengths</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={strengths}
                        onChange={e => setStrengths(e.target.value)}
                        placeholder="Student strengths observed in classroom and laboratory..."
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8125rem' }}>Areas for Improvement</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={areasForImprovement}
                        onChange={e => setAreasForImprovement(e.target.value)}
                        placeholder="Specific improvement recommendations..."
                      />
                    </div>
                  </div>

                  {/* Flag toggles */}
                  <div style={{ display: 'flex', gap: '1.5rem', background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '6px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input 
                        type="checkbox" 
                        checked={attendanceConcern} 
                        onChange={e => setAttendanceConcern(e.target.checked)} 
                      />
                      Attendance Concern Flagged
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input 
                        type="checkbox" 
                        checked={assignmentConcern} 
                        onChange={e => setAssignmentConcern(e.target.checked)} 
                      />
                      Assignment Pending Flagged
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input 
                        type="checkbox" 
                        checked={examConcern} 
                        onChange={e => setExamConcern(e.target.checked)} 
                      />
                      Exam Preparation Concern
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Student Development & Behaviour Ratings */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  2. Student Development &amp; Behaviour Ratings
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>General Behaviour</label>
                    <select 
                      className="form-input" 
                      value={behaviourRating} 
                      onChange={e => setBehaviourRating(e.target.value as PTMRating)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="EXCELLENT">🌟 Excellent</option>
                      <option value="GOOD">👍 Good</option>
                      <option value="SATISFACTORY">👌 Satisfactory</option>
                      <option value="NEEDS_IMPROVEMENT">⚠️ Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Discipline &amp; Punctuality</label>
                    <select 
                      className="form-input" 
                      value={disciplineRating} 
                      onChange={e => setDisciplineRating(e.target.value as PTMRating)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="EXCELLENT">🌟 Excellent</option>
                      <option value="GOOD">👍 Good</option>
                      <option value="SATISFACTORY">👌 Satisfactory</option>
                      <option value="NEEDS_IMPROVEMENT">⚠️ Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Communication &amp; Interaction</label>
                    <select 
                      className="form-input" 
                      value={communicationRating} 
                      onChange={e => setCommunicationRating(e.target.value as PTMRating)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="EXCELLENT">🌟 Excellent</option>
                      <option value="GOOD">👍 Good</option>
                      <option value="SATISFACTORY">👌 Satisfactory</option>
                      <option value="NEEDS_IMPROVEMENT">⚠️ Needs Improvement</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Classroom Participation</label>
                    <select 
                      className="form-input" 
                      value={participationRating} 
                      onChange={e => setParticipationRating(e.target.value as PTMRating)}
                      style={{ fontSize: '0.8125rem' }}
                    >
                      <option value="EXCELLENT">🌟 Excellent</option>
                      <option value="GOOD">👍 Good</option>
                      <option value="SATISFACTORY">👌 Satisfactory</option>
                      <option value="NEEDS_IMPROVEMENT">⚠️ Needs Improvement</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.8125rem' }}>Overall Holistic Development Remarks</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={overallDevelopment}
                    onChange={e => setOverallDevelopment(e.target.value)}
                    placeholder="Holistic observations regarding student's campus involvement and peer collaboration..."
                  />
                </div>
              </div>

              {/* 3. Remarks & Feedback (with Student Privacy Toggle) */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  3. Faculty Remarks &amp; Parent Feedback
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8125rem', margin: 0 }}>Faculty / Mentor Remarks *</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#0F2C59', cursor: 'pointer', fontWeight: 700 }}>
                        <input 
                          type="checkbox" 
                          checked={visibleToStudent} 
                          onChange={e => setVisibleToStudent(e.target.checked)} 
                        />
                        Visible to Student in Student Portal
                      </label>
                    </div>
                    <textarea
                      className="form-input"
                      rows={3}
                      value={facultyRemarks}
                      onChange={e => setFacultyRemarks(e.target.value)}
                      placeholder="Comprehensive remarks from faculty mentor..."
                      required
                    />
                    {!visibleToStudent && (
                      <span style={{ fontSize: '0.725rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                        🔒 Remarks marked private — only visible to Faculty, HOD and Parent.
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8125rem' }}>Parent Feedback</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={parentFeedback}
                        onChange={e => setParentFeedback(e.target.value)}
                        placeholder="Feedback expressed by the parent..."
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.8125rem' }}>Parent Concerns / Inquiries</label>
                      <textarea
                        className="form-input"
                        rows={2}
                        value={parentConcerns}
                        onChange={e => setParentConcerns(e.target.value)}
                        placeholder="Any queries regarding fee, transport, hostel or placement..."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Action Items & Follow-up Assignment */}
              <div style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 800, color: '#0F2C59' }}>
                    4. Assigned Action Items &amp; Follow-up Tasks
                  </h4>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#D97706', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={actionRequired} 
                      onChange={e => setActionRequired(e.target.checked)} 
                    />
                    Follow-up Action Required
                  </label>
                </div>

                {/* New Action Item Input */}
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px dashed #CBD5E1', marginBottom: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Action Description</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newActionDescription}
                        onChange={e => setNewActionDescription(e.target.value)}
                        placeholder="e.g. Schedule weekly remedial doubt session"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Assigned To</label>
                      <input
                        type="text"
                        className="form-input"
                        value={newActionAssignedTo}
                        onChange={e => setNewActionAssignedTo(e.target.value)}
                        placeholder="Faculty Mentor"
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Priority</label>
                      <select
                        className="form-input"
                        value={newActionPriority}
                        onChange={e => setNewActionPriority(e.target.value as any)}
                        style={{ fontSize: '0.8125rem' }}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Due Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={newActionDueDate}
                        onChange={e => setNewActionDueDate(e.target.value)}
                        style={{ fontSize: '0.8125rem' }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddActionItem}
                      style={{ padding: '0.5rem 0.75rem', height: '36px', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                {/* Action Items List */}
                {actionItems.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {actionItems.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F1F5F9', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.8125rem' }}>
                        <div>
                          <strong>{item.description}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Assigned to: {item.assignedTo} • Due: {item.dueDate}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Badge variant={item.priority === 'CRITICAL' ? 'danger' : item.priority === 'HIGH' ? 'warning' : 'active'}>
                            {item.priority}
                          </Badge>
                          <button
                            type="button"
                            onClick={() => handleRemoveActionItem(idx)}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.2rem' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Controls */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', background: '#fff', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {saveSuccess && (
                    <span style={{ color: '#15803D', fontWeight: 700, fontSize: '0.84375rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={16} /> Record Saved Successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.5rem', background: '#0F2C59' }}
                  >
                    <CheckCircle size={16} />
                    {isSaving ? 'Saving...' : 'Save & Finalize PTM Record'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: PAST PTM HISTORY */}
          {activeTab === 'HISTORY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pastRecords.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '3rem', textAlign: 'center', color: '#64748B', border: '1px solid #E2E8F0' }}>
                  <Clock size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p style={{ margin: 0, fontWeight: 700 }}>No past PTM records found for this student.</p>
                  <span style={{ fontSize: '0.8125rem' }}>Complete the current PTM form to initiate their permanent academic history.</span>
                </div>
              ) : (
                pastRecords.map((rec, index) => (
                  <div key={rec.id} style={{ background: '#fff', borderRadius: '8px', padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.6rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#EFF6FF', color: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem' }}>
                          #{index + 1}
                        </div>
                        <div>
                          <strong style={{ color: '#0F2C59', fontSize: '0.875rem' }}>PTM Session on {rec.date}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Conducted by: {rec.facultyName}</div>
                        </div>
                      </div>
                      <Badge variant={rec.outcome === 'SATISFACTORY' ? 'active' : rec.outcome === 'IMPROVEMENT_REQUIRED' ? 'warning' : 'danger'}>
                        {rec.outcome}
                      </Badge>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem', fontSize: '0.8125rem' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Academic Discussion</span>
                        <div style={{ color: '#1E293B' }}>{rec.academicPerformance}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Faculty Remarks</span>
                        <div style={{ color: '#1E293B', fontStyle: 'italic' }}>"{rec.facultyRemarks}"</div>
                      </div>
                      {rec.parentFeedback && (
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem' }}>Parent Feedback</span>
                          <div style={{ color: '#1E293B' }}>{rec.parentFeedback}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
