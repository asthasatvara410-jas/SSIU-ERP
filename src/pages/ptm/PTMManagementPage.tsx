import React, { useState, useMemo } from 'react';
import { 
  Users, Calendar, Clock, CheckCircle2, AlertTriangle, AlertCircle, 
  FileText, MessageSquare, Plus, Search, Filter, Download, 
  ChevronRight, ArrowUpDown, UserCheck, ShieldAlert, Check, 
  RotateCcw, Edit3, Eye, Video, MapPin, Sparkles, TrendingUp, 
  BarChart3, RefreshCw, Printer, Columns, ChevronLeft, ArrowUp, ArrowDown,
  Layers, CheckSquare, XSquare, Star, ExternalLink, BookmarkCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ptmService } from '../../services/ptmService';
import { db } from '../../services/db';
import { Student, UserRole, Faculty } from '../../types';
import { 
  PTMEvent, 
  PTMSchedule, 
  PTMRecord, 
  PTMFollowUpAction, 
  PTMAttendanceStatus,
  PTMScheduleStatus,
  PTMParentResponse,
  PTMRating,
  PTMOutcome
} from '../../types/ptm';
import { Badge } from '../../components/common/Badge';
import { StudentPTMDossierModal } from '../../components/ptm/StudentPTMDossierModal';
import { CreatePTMEventModal } from '../../components/ptm/CreatePTMEventModal';

export type PTMTab = 
  | 'dashboard' 
  | 'ptm-schedule' 
  | 'ptm-my' 
  | 'ptm-records' 
  | 'ptm-feedback' 
  | 'ptm-followups' 
  | 'ptm-reports';

interface PTMManagementPageProps {
  initialTab?: PTMTab;
}

export const PTMManagementPage: React.FC<PTMManagementPageProps> = ({ initialTab = 'dashboard' }) => {
  const { user, activeRole } = useAuth();
  const role: UserRole = activeRole || user?.role || 'FACULTY';

  const [activeTab, setActiveTab] = useState<PTMTab>(initialTab);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Master Data Lookups
  const allStudents = useMemo(() => db.getStudents(), []);
  const allFaculty = useMemo(() => db.getFaculty(), []);
  const allDepartments = useMemo(() => db.getDepartments(), []);
  const allPrograms = useMemo(() => db.getPrograms(), []);
  const allSemesters = useMemo(() => db.getSemesters(), []);
  const allDivisions = useMemo(() => db.getDivisions(), []);
  const allInstitutes = useMemo(() => db.getInstitutes(), []);

  // Data fetching from PTM Central Service
  const kpis = useMemo(() => ptmService.getComprehensiveDashboardKPIs(user!, role), [user, role, refreshTrigger]);
  const deptParticipation = useMemo(() => ptmService.getDepartmentParticipationStats(user!, role), [user, role, refreshTrigger]);
  const events = useMemo(() => ptmService.getEvents(user!, role), [user, role, refreshTrigger]);
  const schedules = useMemo(() => ptmService.getSchedules(user!, role), [user, role, refreshTrigger]);
  const records = useMemo(() => ptmService.getRecords(user!, role), [user, role, refreshTrigger]);
  const followUps = useMemo(() => ptmService.getFollowUpActions(user!, role), [user, role, refreshTrigger]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<{ student: Student; schedule?: PTMSchedule } | null>(null);
  const [selectedFeedbackModal, setSelectedFeedbackModal] = useState<any | null>(null);
  const [selectedFollowUpModal, setSelectedFollowUpModal] = useState<PTMFollowUpAction | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<PTMEvent | null>(null);

  // Global & Tab Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('ALL');
  const [selectedInstitute, setSelectedInstitute] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedDivision, setSelectedDivision] = useState('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');

  // Pagination States
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Sorting States
  const [sortField, setSortField] = useState<string>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // Helper maps for relational lookups
  const studentMap = useMemo(() => new Map(allStudents.map(s => [s.id, s])), [allStudents]);
  const facultyMap = useMemo(() => new Map(allFaculty.map(f => [f.id, f])), [allFaculty]);
  const recordMap = useMemo(() => new Map(records.map(r => [r.ptmScheduleId, r])), [records]);

  // Quick attendance marking
  const handleQuickAttendance = (scheduleId: string, attStatus: PTMAttendanceStatus) => {
    ptmService.markAttendance(scheduleId, attStatus, user?.name || 'Faculty Mentor');
    setRefreshTrigger(prev => prev + 1);
  };

  // Follow-up status transition
  const handleToggleFollowUpStatus = (actionId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    ptmService.updateFollowUpAction(actionId, {
      status: nextStatus as any,
      completionDate: nextStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : undefined,
      completionRemarks: nextStatus === 'COMPLETED' ? 'Marked complete by faculty mentor.' : undefined
    });
    setRefreshTrigger(prev => prev + 1);
  };

  // Export to Excel with active filter scope
  const handleExportExcel = () => {
    const activeDeptObj = selectedDepartment !== 'ALL' ? allDepartments.find(d => d.name === selectedDepartment || d.id === selectedDepartment) : undefined;
    ptmService.exportPTMReportToExcel({
      eventId: selectedEventFilter !== 'ALL' ? selectedEventFilter : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      departmentName: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
      departmentId: activeDeptObj?.id,
      search: searchQuery,
      filteredSchedules: schedules
    }, user!, role);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleOpenDossier = (studentId: string, schedule?: PTMSchedule) => {
    const student = studentMap.get(studentId) || db.getStudentById(studentId);
    if (student) {
      setSelectedStudentForDossier({ student, schedule });
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 2: PTM Events Filtered & Sorted Dataset
  // ══════════════════════════════════════════════════════════════════════════
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (selectedAcademicYear !== 'ALL' && e.academicYearName !== selectedAcademicYear) return false;
      if (selectedInstitute !== 'ALL' && e.instituteId !== selectedInstitute && e.instituteName !== selectedInstitute) return false;
      if (selectedDepartment !== 'ALL' && e.departmentId !== selectedDepartment && e.departmentName !== selectedDepartment) return false;
      if (selectedProgram !== 'ALL' && e.programId !== selectedProgram && e.programName !== selectedProgram) return false;
      if (selectedSemester !== 'ALL' && String(e.semesterNumber) !== selectedSemester && e.semesterId !== selectedSemester) return false;
      if (selectedDivision !== 'ALL' && e.divisionName !== selectedDivision && e.divisionId !== selectedDivision) return false;
      if (selectedFaculty !== 'ALL' && !e.assignedFacultyIds.includes(selectedFaculty) && !e.assignedFacultyNames?.includes(selectedFaculty)) return false;
      if (selectedStatus !== 'ALL' && e.status !== selectedStatus) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          e.id.toLowerCase().includes(q) ||
          e.title.toLowerCase().includes(q) ||
          e.departmentName.toLowerCase().includes(q) ||
          e.programName.toLowerCase().includes(q) ||
          (e.assignedFacultyNames && e.assignedFacultyNames.some(f => f.toLowerCase().includes(q))) ||
          e.venue.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [events, selectedAcademicYear, selectedInstitute, selectedDepartment, selectedProgram, selectedSemester, selectedDivision, selectedFaculty, selectedStatus, searchQuery]);

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 3: My PTMs Schedules Filtered & Sorted Dataset
  // ══════════════════════════════════════════════════════════════════════════
  const filteredSchedules = useMemo(() => {
    return schedules.filter(s => {
      if (selectedEventFilter !== 'ALL' && s.ptmEventId !== selectedEventFilter) return false;
      if (selectedStatus !== 'ALL' && s.status !== selectedStatus) return false;
      if (selectedDepartment !== 'ALL' && s.departmentName !== selectedDepartment && s.departmentId !== selectedDepartment) return false;
      if (selectedProgram !== 'ALL' && s.programName !== selectedProgram && s.programId !== selectedProgram) return false;
      if (selectedSemester !== 'ALL' && String(s.semesterNumber) !== selectedSemester && s.semesterId !== selectedSemester) return false;
      if (selectedDivision !== 'ALL' && s.divisionName !== selectedDivision && s.divisionId !== selectedDivision) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          s.studentName.toLowerCase().includes(q) ||
          s.enrollmentNo.toLowerCase().includes(q) ||
          s.parentName.toLowerCase().includes(q) ||
          s.facultyName.toLowerCase().includes(q) ||
          s.programName.toLowerCase().includes(q) ||
          s.departmentName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [schedules, selectedEventFilter, selectedStatus, selectedDepartment, selectedProgram, selectedSemester, selectedDivision, searchQuery]);

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 4: PTM Records Filtered & Sorted Dataset
  // ══════════════════════════════════════════════════════════════════════════
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedStatus !== 'ALL' && r.outcome !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          r.studentName.toLowerCase().includes(q) ||
          r.enrollmentNo.toLowerCase().includes(q) ||
          r.facultyName.toLowerCase().includes(q) ||
          r.parentName.toLowerCase().includes(q) ||
          r.academicPerformance.toLowerCase().includes(q) ||
          (r.facultyRemarks && r.facultyRemarks.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [records, selectedStatus, searchQuery]);

  // ══════════════════════════════════════════════════════════════════════════
  // TAB 6: Follow-up Actions Filtered & Sorted Dataset
  // ══════════════════════════════════════════════════════════════════════════
  const filteredFollowUps = useMemo(() => {
    return followUps.filter(f => {
      if (selectedStatus !== 'ALL' && f.status !== selectedStatus) return false;
      if (selectedPriority !== 'ALL' && f.priority !== selectedPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match = 
          f.studentName.toLowerCase().includes(q) ||
          f.enrollmentNo.toLowerCase().includes(q) ||
          f.actionDescription.toLowerCase().includes(q) ||
          f.assignedToName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [followUps, selectedStatus, selectedPriority, searchQuery]);

  // Format date helper (DD-MM-YYYY)
  const formatDateDMY = (dateStr?: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* ═══ Header Section ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#fff', padding: '1.25rem 1.5rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#EFF6FF', color: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Parent–Teacher Meeting (PTM) Management
              </h2>
              <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                Official Academic Consultation Register, Student 360° Dossiers &amp; Follow-up Action Tracker
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'].includes(role) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0F2C59' }}
            >
              <Plus size={16} /> Schedule PTM Event
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportExcel}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Download full PTM report in Excel format"
          >
            <Download size={15} /> Export Excel
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrintReport}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Print official administrative report"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      {/* ═══ Navigation Tabs Bar ═══ */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #CBD5E1',
        background: '#fff',
        borderRadius: '8px 8px 0 0',
        padding: '0 1rem',
        overflowX: 'auto',
        gap: '0.5rem'
      }}>
        {[
          { id: 'dashboard', label: 'Overview Dashboard', icon: BarChart3, count: null },
          { id: 'ptm-schedule', label: 'PTM Schedule Register', icon: Calendar, count: events.length },
          { id: 'ptm-my', label: 'My PTMs / Mentoring Grid', icon: Users, count: schedules.length },
          { id: 'ptm-records', label: 'PTM Records & Dossiers', icon: FileText, count: records.length },
          { id: 'ptm-feedback', label: 'Parent Feedback Register', icon: MessageSquare, count: records.filter(r => r.parentFeedback).length },
          { id: 'ptm-followups', label: 'Follow-up Actions', icon: CheckSquare, count: followUps.filter(f => f.status !== 'COMPLETED').length },
          { id: 'ptm-reports', label: 'Analytical Reports', icon: TrendingUp, count: null }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as PTMTab);
                setCurrentPage(1);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 1.15rem',
                fontSize: '0.84375rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#001F3F' : '#64748B',
                border: 'none',
                background: 'transparent',
                borderBottom: isActive ? '3px solid #F37023' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} color={isActive ? '#F37023' : '#64748B'} />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span style={{
                  padding: '0.1rem 0.45rem',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: isActive ? '#EFF6FF' : '#F1F5F9',
                  color: isActive ? '#1E3A8A' : '#64748B'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ TAB 1: OVERVIEW DASHBOARD ═══ */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Top 10 Dynamic KPI Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: '1rem'
          }}>
            {[
              { label: 'Total PTM Events', value: kpis.totalEvents, icon: Calendar, bg: '#EFF6FF', text: '#1E3A8A' },
              { label: 'Scheduled / Upcoming', value: kpis.scheduledCount, icon: Clock, bg: '#F0FDF4', text: '#166534' },
              { label: 'Parent Confirmed', value: kpis.confirmedCount, icon: UserCheck, bg: '#ECFDF5', text: '#065F46' },
              { label: 'Pending Response', value: kpis.pendingCount, icon: AlertCircle, bg: '#FFFBEB', text: '#92400E' },
              { label: 'Completed / Attended', value: kpis.completedCount, icon: CheckCircle2, bg: '#F8FAFC', text: '#001F3F' },
              { label: 'Cancelled / Declined', value: kpis.cancelledCount, icon: XSquare, bg: '#FEF2F2', text: '#991B1B' },
              { label: 'Students Covered', value: kpis.studentsCovered, icon: Users, bg: '#F5F3FF', text: '#5B21B6' },
              { label: 'Feedback Pending', value: kpis.feedbackPendingCount, icon: MessageSquare, bg: '#FFF7ED', text: '#9A3412' },
              { label: 'Follow-ups Pending', value: kpis.followUpsPendingCount, icon: CheckSquare, bg: '#EFF6FF', text: '#1E40AF' },
              { label: 'Overdue Actions', value: kpis.overdueActionsCount, icon: ShieldAlert, bg: '#FEF2F2', text: '#B91C1C' }
            ].map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div 
                  key={idx} 
                  className="card"
                  style={{
                    padding: '1.15rem 1.25rem',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>{kpi.label}</span>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: kpi.bg, color: kpi.text, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={15} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.6rem', fontSize: '1.65rem', fontWeight: 800, color: '#0F2C59' }}>
                    {kpi.value}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Departmental Participation & Response Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.25rem' }}>
            
            {/* Department Participation Card */}
            <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0F2C59' }}>
                  Department-wise Attendance Performance
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Real Central Sync</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {deptParticipation.map((dp, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, color: '#334155' }}>{dp.department}</span>
                      <span style={{ color: '#0F2C59', fontWeight: 700 }}>{dp.attended}/{dp.total} ({dp.percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${dp.percentage}%`, 
                          height: '100%', 
                          background: dp.percentage >= 75 ? '#10B981' : dp.percentage >= 50 ? '#F59E0B' : '#EF4444',
                          borderRadius: '4px' 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions & Recent Schedule Preview */}
            <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 700, color: '#0F2C59' }}>
                  Upcoming Consultation Slots
                </h3>
                <button 
                  type="button" 
                  onClick={() => setActiveTab('ptm-my')} 
                  style={{ fontSize: '0.75rem', color: '#1E3A8A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  View All &rarr;
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {schedules.slice(0, 4).map((sch, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      padding: '0.75rem', 
                      background: '#F8FAFC', 
                      borderRadius: '6px',
                      border: '1px solid #E2E8F0'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.84375rem', color: '#0F2C59' }}>
                        {sch.studentName} <span style={{ color: '#64748B', fontWeight: 500, fontSize: '0.75rem' }}>({sch.enrollmentNo})</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.15rem' }}>
                        Parent: {sch.parentName} • {sch.date} ({sch.slotTime || sch.startTime})
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleOpenDossier(sch.studentId, sch)}
                      style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }}
                    >
                      Dossier
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ═══ TAB 2: PTM SCHEDULE REGISTER ═══ */}
      {activeTab === 'ptm-schedule' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Multi-field Cascading Filter Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              
              {/* Search */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Search</label>
                <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    placeholder="Event ID, Title, Faculty..."
                    className="form-control"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ fontSize: '0.8125rem', paddingLeft: '2rem' }}
                  />
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {/* Academic Year */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Academic Year</label>
                <select 
                  className="form-control" 
                  value={selectedAcademicYear} 
                  onChange={e => setSelectedAcademicYear(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="2026-27">2026-27</option>
                  <option value="2025-26">2025-26</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Department</label>
                <select 
                  className="form-control" 
                  value={selectedDepartment} 
                  onChange={e => setSelectedDepartment(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Departments</option>
                  {allDepartments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Program */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Program</label>
                <select 
                  className="form-control" 
                  value={selectedProgram} 
                  onChange={e => setSelectedProgram(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Programs</option>
                  {allPrograms.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Semester</label>
                <select 
                  className="form-control" 
                  value={selectedSemester} 
                  onChange={e => setSelectedSemester(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Semesters</option>
                  <option value="1">Sem 1</option>
                  <option value="2">Sem 2</option>
                  <option value="3">Sem 3</option>
                  <option value="4">Sem 4</option>
                  <option value="5">Sem 5</option>
                  <option value="6">Sem 6</option>
                  <option value="7">Sem 7</option>
                  <option value="8">Sem 8</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Status</label>
                <select 
                  className="form-control" 
                  value={selectedStatus} 
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

            </div>
          </div>

          {/* 21-Column Official PTM Event Register Table */}
          <div className="card" style={{ padding: 0, borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '1800px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#fff' }}>
                  <tr>
                    {[
                      { key: 'sr', label: 'Sr. No.', width: '70px', align: 'center' },
                      { key: 'id', label: 'PTM Event ID', width: '130px', align: 'left' },
                      { key: 'academicYear', label: 'Academic Year', width: '120px', align: 'center' },
                      { key: 'institute', label: 'Institute', width: '160px', align: 'left' },
                      { key: 'department', label: 'Department', width: '160px', align: 'left' },
                      { key: 'program', label: 'Program', width: '170px', align: 'left' },
                      { key: 'semester', label: 'Semester', width: '90px', align: 'center' },
                      { key: 'division', label: 'Division', width: '90px', align: 'center' },
                      { key: 'date', label: 'PTM Date', width: '110px', align: 'center' },
                      { key: 'startTime', label: 'Start Time', width: '90px', align: 'center' },
                      { key: 'endTime', label: 'End Time', width: '90px', align: 'center' },
                      { key: 'venue', label: 'Venue / Mode', width: '160px', align: 'left' },
                      { key: 'faculty', label: 'Faculty / Mentor', width: '170px', align: 'left' },
                      { key: 'total', label: 'Total Students', width: '100px', align: 'center' },
                      { key: 'scheduled', label: 'Scheduled', width: '90px', align: 'center' },
                      { key: 'confirmed', label: 'Confirmed', width: '90px', align: 'center' },
                      { key: 'pending', label: 'Pending', width: '90px', align: 'center' },
                      { key: 'completed', label: 'Completed', width: '90px', align: 'center' },
                      { key: 'cancelled', label: 'Cancelled', width: '90px', align: 'center' },
                      { key: 'status', label: 'Status', width: '110px', align: 'center' },
                      { key: 'actions', label: 'Actions', width: '120px', align: 'center' }
                    ].map(col => (
                      <th 
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : 'flex-start', gap: '0.3rem' }}>
                          <span>{col.label}</span>
                          <ArrowUpDown size={11} style={{ opacity: 0.6 }} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={21} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                        <Calendar size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                        <div>No PTM events found matching the active filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((evt, idx) => {
                      const evtSchedules = schedules.filter(s => s.ptmEventId === evt.id);
                      const totalStd = evtSchedules.length || 15;
                      const confirmed = evtSchedules.filter(s => s.parentResponse === 'CONFIRMED').length;
                      const pending = evtSchedules.filter(s => s.parentResponse === 'PENDING').length;
                      const completed = evtSchedules.filter(s => s.status === 'COMPLETED' || s.attendanceStatus === 'PRESENT').length;
                      const cancelled = evtSchedules.filter(s => s.status === 'CANCELLED').length;
                      const scheduled = totalStd - completed - cancelled;

                      return (
                        <tr 
                          key={evt.id}
                          style={{
                            background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'background 0.1s ease'
                          }}
                        >
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}><code>{evt.id}</code></td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{evt.academicYearName || '2026-27'}</td>
                          <td style={{ padding: '0.65rem' }}>{evt.instituteName}</td>
                          <td style={{ padding: '0.65rem' }}>{evt.departmentName}</td>
                          <td style={{ padding: '0.65rem' }}>{evt.programName}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem {evt.semesterNumber}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{evt.divisionName || 'Div A'}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600 }}>{formatDateDMY(evt.date)}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{evt.startTime}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{evt.endTime}</td>
                          <td style={{ padding: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              {evt.mode === 'ONLINE' ? <Video size={13} color="#2563EB" /> : <MapPin size={13} color="#059669" />}
                              <span style={{ fontSize: '0.75rem' }}>{evt.venue}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem' }}>{evt.assignedFacultyNames?.join(', ') || 'Dr. Rajesh Sharma'}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700 }}>{totalStd}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: '#1E40AF', fontWeight: 600 }}>{scheduled}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: '#059669', fontWeight: 600 }}>{confirmed}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: '#D97706', fontWeight: 600 }}>{pending}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: '#001F3F', fontWeight: 700 }}>{completed}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', color: '#DC2626', fontWeight: 600 }}>{cancelled}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <Badge 
                              variant={evt.status === 'COMPLETED' ? 'success' : evt.status === 'CANCELLED' ? 'danger' : 'navy'}
                            >
                              {evt.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setSelectedEventFilter(evt.id);
                                setActiveTab('ptm-my');
                              }}
                              style={{ padding: '0.25rem 0.55rem', fontSize: '0.71875rem' }}
                            >
                              Schedules &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══ TAB 3: MY PTMs / FACULTY-MENTOR OPERATIONAL GRID ═══ */}
      {activeTab === 'ptm-my' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Filter Bar */}
          <div className="card" style={{ padding: '1rem 1.25rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Search Student / Parent</label>
                <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    placeholder="Name, Enrollment, Phone..."
                    className="form-control"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ fontSize: '0.8125rem', paddingLeft: '2rem' }}
                  />
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PTM Event</label>
                <select 
                  className="form-control" 
                  value={selectedEventFilter} 
                  onChange={e => setSelectedEventFilter(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All PTM Events</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title} ({formatDateDMY(e.date)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>PTM Status</label>
                <select 
                  className="form-control" 
                  value={selectedStatus} 
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ATTENDED">Attended / Present</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="MISSED">Missed / Absent</option>
                  <option value="RESCHEDULED">Rescheduled</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Department</label>
                <select 
                  className="form-control" 
                  value={selectedDepartment} 
                  onChange={e => setSelectedDepartment(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Departments</option>
                  {allDepartments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* 17-Column Official Operational Table */}
          <div className="card" style={{ padding: 0, borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '1700px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#fff' }}>
                  <tr>
                    {[
                      { key: 'sr', label: 'Sr. No.', width: '70px', align: 'center' },
                      { key: 'studentName', label: 'Student Name', width: '180px', align: 'left' },
                      { key: 'enrollmentNo', label: 'Enrollment No.', width: '130px', align: 'center' },
                      { key: 'program', label: 'Program', width: '140px', align: 'left' },
                      { key: 'semester', label: 'Semester', width: '90px', align: 'center' },
                      { key: 'division', label: 'Division', width: '80px', align: 'center' },
                      { key: 'department', label: 'Department', width: '160px', align: 'left' },
                      { key: 'institute', label: 'Institute', width: '160px', align: 'left' },
                      { key: 'parentName', label: 'Parent Name', width: '160px', align: 'left' },
                      { key: 'parentContact', label: 'Parent Contact', width: '130px', align: 'center' },
                      { key: 'date', label: 'PTM Date', width: '110px', align: 'center' },
                      { key: 'slotTime', label: 'Time Slot', width: '150px', align: 'center' },
                      { key: 'attendance', label: 'Attendance %', width: '110px', align: 'center' },
                      { key: 'parentResponse', label: 'Parent Response', width: '130px', align: 'center' },
                      { key: 'ptmStatus', label: 'PTM Status', width: '120px', align: 'center' },
                      { key: 'followUp', label: 'Follow-up Required', width: '140px', align: 'center' },
                      { key: 'action', label: 'Action', width: '140px', align: 'center' }
                    ].map(col => (
                      <th 
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: col.align === 'center' ? 'center' : 'flex-start', gap: '0.3rem' }}>
                          <span>{col.label}</span>
                          <ArrowUpDown size={11} style={{ opacity: 0.6 }} />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredSchedules.length === 0 ? (
                    <tr>
                      <td colSpan={17} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                        <Users size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                        <div>No student PTM schedules found.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredSchedules.map((sch, idx) => {
                      const student = studentMap.get(sch.studentId);
                      const attStats = student ? db.getStudentAttendanceStats(student.id) : { percentage: 85 };
                      const rec = recordMap.get(sch.id);
                      const hasFollowUp = rec?.actionRequired || sch.status === 'ATTENDED';

                      return (
                        <tr 
                          key={sch.id}
                          style={{
                            background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0',
                            transition: 'background 0.1s ease'
                          }}
                        >
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>{sch.studentName}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}><code>{sch.enrollmentNo}</code></td>
                          <td style={{ padding: '0.65rem' }}>{sch.programName || 'B.Tech CSE'}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem {sch.semesterNumber || 4}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{sch.divisionName || 'A'}</td>
                          <td style={{ padding: '0.65rem' }}>{sch.departmentName}</td>
                          <td style={{ padding: '0.65rem' }}>{sch.instituteName}</td>
                          <td style={{ padding: '0.65rem' }}>{sch.parentName}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{sch.parentPhone || '-'}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600 }}>{formatDateDMY(sch.date)}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>{sch.slotTime || `${sch.startTime} - ${sch.endTime}`}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: attStats.percentage >= 75 ? '#DCFCE7' : attStats.percentage >= 60 ? '#FEF3C7' : '#FEE2E2',
                              color: attStats.percentage >= 75 ? '#166534' : attStats.percentage >= 60 ? '#92400E' : '#991B1B'
                            }}>
                              {attStats.percentage}%
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <Badge 
                              variant={sch.parentResponse === 'CONFIRMED' ? 'success' : sch.parentResponse === 'DECLINED' ? 'danger' : 'warning'}
                            >
                              {sch.parentResponse}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <Badge 
                              variant={sch.status === 'COMPLETED' || sch.status === 'ATTENDED' ? 'success' : sch.status === 'CANCELLED' ? 'danger' : 'navy'}
                            >
                              {sch.status}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: hasFollowUp ? '#DC2626' : '#059669'
                            }}>
                              {hasFollowUp ? 'YES' : 'NO'}
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleOpenDossier(sch.studentId, sch)}
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: '#0F2C59' }}
                            >
                              Open Record
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══ TAB 4: PTM RECORDS & DOSSIERS ═══ */}
      {activeTab === 'ptm-records' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="card" style={{ padding: '1rem 1.25rem', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Search Record Notes</label>
                <div style={{ position: 'relative', marginTop: '0.2rem' }}>
                  <input
                    type="text"
                    placeholder="Discussion, Remarks, Student..."
                    className="form-control"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ fontSize: '0.8125rem', paddingLeft: '2rem' }}
                  />
                  <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Meeting Outcome</label>
                <select 
                  className="form-control" 
                  value={selectedStatus} 
                  onChange={e => setSelectedStatus(e.target.value)}
                  style={{ fontSize: '0.8125rem', marginTop: '0.2rem' }}
                >
                  <option value="ALL">All Outcomes</option>
                  <option value="EXCELLENT">Excellent</option>
                  <option value="SATISFACTORY">Satisfactory</option>
                  <option value="ACADEMIC_CONCERN">Academic Concern</option>
                  <option value="ATTENDANCE_CONCERN">Attendance Concern</option>
                </select>
              </div>
            </div>
          </div>

          {/* 19-Column Official PTM Records Table */}
          <div className="card" style={{ padding: 0, borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '1900px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#fff' }}>
                  <tr>
                    {[
                      { key: 'sr', label: 'Sr. No.', width: '70px', align: 'center' },
                      { key: 'studentName', label: 'Student Name', width: '170px', align: 'left' },
                      { key: 'enrollmentNo', label: 'Enrollment No.', width: '130px', align: 'center' },
                      { key: 'program', label: 'Program', width: '140px', align: 'left' },
                      { key: 'semester', label: 'Semester', width: '90px', align: 'center' },
                      { key: 'department', label: 'Department', width: '160px', align: 'left' },
                      { key: 'institute', label: 'Institute', width: '160px', align: 'left' },
                      { key: 'parentName', label: 'Parent Name', width: '160px', align: 'left' },
                      { key: 'date', label: 'PTM Date', width: '110px', align: 'center' },
                      { key: 'faculty', label: 'Faculty / Mentor', width: '160px', align: 'left' },
                      { key: 'discussion', label: 'Academic Discussion Summary', width: '320px', align: 'left' },
                      { key: 'attendanceSummary', label: 'Attendance Summary', width: '160px', align: 'left' },
                      { key: 'performance', label: 'Academic Performance', width: '160px', align: 'left' },
                      { key: 'behaviour', label: 'Behaviour / Discipline', width: '150px', align: 'center' },
                      { key: 'parentConcern', label: 'Parent Concern', width: '180px', align: 'left' },
                      { key: 'facultyRecommendation', label: 'Faculty Recommendation', width: '220px', align: 'left' },
                      { key: 'outcome', label: 'Outcome', width: '140px', align: 'center' },
                      { key: 'followUp', label: 'Follow-up Required', width: '130px', align: 'center' },
                      { key: 'action', label: 'Action', width: '140px', align: 'center' }
                    ].map(col => (
                      <th 
                        key={col.key}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={19} style={{ padding: '3rem', textAlign: 'center', color: '#64748B' }}>
                        <FileText size={36} color="#CBD5E1" style={{ margin: '0 auto 0.5rem' }} />
                        <div>No PTM discussion records found.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec, idx) => {
                      const student = studentMap.get(rec.studentId);
                      return (
                        <tr 
                          key={rec.id}
                          style={{
                            background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                            borderBottom: '1px solid #E2E8F0'
                          }}
                        >
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>{rec.studentName}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}><code>{rec.enrollmentNo}</code></td>
                          <td style={{ padding: '0.65rem' }}>B.Tech CSE</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem 4</td>
                          <td style={{ padding: '0.65rem' }}>Computer Engineering</td>
                          <td style={{ padding: '0.65rem' }}>Swarrnim SSCIT</td>
                          <td style={{ padding: '0.65rem' }}>{rec.parentName}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600 }}>{formatDateDMY(rec.date)}</td>
                          <td style={{ padding: '0.65rem' }}>{rec.facultyName}</td>
                          <td style={{ padding: '0.65rem', lineHeight: '1.4' }}>{rec.academicPerformance}</td>
                          <td style={{ padding: '0.65rem' }}>{rec.attendanceConcern ? 'Shortage (<75%)' : 'Regular (>85%)'}</td>
                          <td style={{ padding: '0.65rem' }}>{rec.strengths}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <Badge variant={rec.behaviourRating === 'EXCELLENT' ? 'success' : 'navy'}>
                              {rec.behaviourRating || 'EXCELLENT'}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem' }}>{rec.parentConcerns || 'None reported.'}</td>
                          <td style={{ padding: '0.65rem' }}>{rec.facultyRemarks}</td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <Badge variant={rec.outcome === 'SATISFACTORY' ? 'success' : 'warning'}>
                              {rec.outcome}
                            </Badge>
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: rec.actionRequired ? '#DC2626' : '#059669' }}>
                            {rec.actionRequired ? 'YES' : 'NO'}
                          </td>
                          <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => handleOpenDossier(rec.studentId)}
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', background: '#0F2C59' }}
                            >
                              View Full Dossier
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══ TAB 5: PARENT FEEDBACK REGISTER ═══ */}
      {activeTab === 'ptm-feedback' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="card" style={{ padding: 0, borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '1600px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#fff' }}>
                  <tr>
                    {[
                      { label: 'Sr. No.', width: '70px', align: 'center' },
                      { label: 'PTM ID', width: '130px', align: 'left' },
                      { label: 'Student Name', width: '170px', align: 'left' },
                      { label: 'Enrollment No.', width: '130px', align: 'center' },
                      { label: 'Parent Name', width: '160px', align: 'left' },
                      { label: 'PTM Date', width: '110px', align: 'center' },
                      { label: 'Faculty / Mentor', width: '160px', align: 'left' },
                      { label: 'Parent Attendance', width: '130px', align: 'center' },
                      { label: 'Feedback Status', width: '130px', align: 'center' },
                      { label: 'Overall Satisfaction', width: '150px', align: 'center' },
                      { label: 'Academic Concern', width: '220px', align: 'left' },
                      { label: 'Parent Suggestion', width: '220px', align: 'left' },
                      { label: 'Parent Remark', width: '220px', align: 'left' },
                      { label: 'Submitted Date', width: '120px', align: 'center' },
                      { label: 'Action', width: '120px', align: 'center' }
                    ].map((col, i) => (
                      <th 
                        key={i}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {records.map((rec, idx) => (
                    <tr 
                      key={rec.id}
                      style={{
                        background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}><code>{rec.ptmScheduleId || 'ptm-sch-1'}</code></td>
                      <td style={{ padding: '0.65rem', fontWeight: 700, color: '#0F2C59' }}>{rec.studentName}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}><code>{rec.enrollmentNo}</code></td>
                      <td style={{ padding: '0.65rem' }}>{rec.parentName}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600 }}>{formatDateDMY(rec.date)}</td>
                      <td style={{ padding: '0.65rem' }}>{rec.facultyName}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <Badge variant="success">PRESENT</Badge>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <Badge variant="navy">SUBMITTED</Badge>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', color: '#F59E0B' }}>
                          {[...Array(rec.parentSatisfactionScore || 5)].map((_, si) => (
                            <Star key={si} size={13} fill="#F59E0B" />
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem' }}>{rec.parentConcerns || 'None reported.'}</td>
                      <td style={{ padding: '0.65rem' }}>{rec.areasForImprovement || 'More coding practice sessions.'}</td>
                      <td style={{ padding: '0.65rem' }}>{rec.parentFeedback || 'Appreciated faculty support.'}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>{formatDateDMY(rec.date)}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleOpenDossier(rec.studentId)}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.71875rem' }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══ TAB 6: FOLLOW-UP ACTIONS REGISTER ═══ */}
      {activeTab === 'ptm-followups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* 17-Column Official Follow-up Action Register */}
          <div className="card" style={{ padding: 0, borderRadius: '8px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#fff' }}>
            <div style={{ overflowX: 'auto', maxHeight: '680px' }}>
              <table style={{ width: '100%', minWidth: '1750px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#001F3F', color: '#fff' }}>
                  <tr>
                    {[
                      { label: 'Sr. No.', width: '70px', align: 'center' },
                      { label: 'Action ID', width: '130px', align: 'left' },
                      { label: 'Action Description', width: '300px', align: 'left' },
                      { label: 'Student Name', width: '170px', align: 'left' },
                      { label: 'Enrollment No.', width: '130px', align: 'center' },
                      { label: 'Program', width: '140px', align: 'left' },
                      { label: 'Semester', width: '90px', align: 'center' },
                      { label: 'Department', width: '160px', align: 'left' },
                      { label: 'Assigned To', width: '160px', align: 'left' },
                      { label: 'Role', width: '140px', align: 'left' },
                      { label: 'Priority', width: '110px', align: 'center' },
                      { label: 'Created Date', width: '110px', align: 'center' },
                      { label: 'Due Date', width: '110px', align: 'center' },
                      { label: 'Status', width: '130px', align: 'center' },
                      { label: 'Completion Date', width: '120px', align: 'center' },
                      { label: 'Remarks', width: '220px', align: 'left' },
                      { label: 'Action', width: '150px', align: 'center' }
                    ].map((col, i) => (
                      <th 
                        key={i}
                        style={{
                          padding: '0.75rem 0.6rem',
                          textAlign: col.align as any,
                          width: col.width,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          letterSpacing: '0.02em',
                          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {filteredFollowUps.map((act, idx) => (
                    <tr 
                      key={act.id}
                      style={{
                        background: idx % 2 === 1 ? '#F8FAFC' : '#FFFFFF',
                        borderBottom: '1px solid #E2E8F0'
                      }}
                    >
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 600, color: '#64748B' }}>{idx + 1}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}><code>{act.id}</code></td>
                      <td style={{ padding: '0.65rem', fontWeight: 600, color: '#0F2C59' }}>{act.actionDescription}</td>
                      <td style={{ padding: '0.65rem', fontWeight: 700 }}>{act.studentName}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}><code>{act.enrollmentNo}</code></td>
                      <td style={{ padding: '0.65rem' }}>B.Tech CSE</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>Sem 4</td>
                      <td style={{ padding: '0.65rem' }}>Computer Engineering</td>
                      <td style={{ padding: '0.65rem' }}>{act.assignedToName}</td>
                      <td style={{ padding: '0.65rem' }}>{act.assignedToRole || 'Mentor'}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '12px',
                          fontSize: '0.71875rem',
                          fontWeight: 700,
                          background: act.priority === 'HIGH' ? '#FEE2E2' : act.priority === 'MEDIUM' ? '#FEF3C7' : '#F1F5F9',
                          color: act.priority === 'HIGH' ? '#991B1B' : act.priority === 'MEDIUM' ? '#92400E' : '#475569'
                        }}>
                          {act.priority}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>{formatDateDMY(act.createdAt?.split('T')[0])}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 700, color: act.status === 'OVERDUE' ? '#DC2626' : '#0F2C59' }}>
                        {formatDateDMY(act.dueDate)}
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <Badge 
                          variant={act.status === 'COMPLETED' ? 'success' : act.status === 'OVERDUE' ? 'danger' : act.status === 'IN_PROGRESS' ? 'navy' : 'warning'}
                        >
                          {act.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>{formatDateDMY(act.completionDate)}</td>
                      <td style={{ padding: '0.65rem' }}>{act.completionRemarks || '-'}</td>
                      <td style={{ padding: '0.65rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => handleToggleFollowUpStatus(act.id, act.status)}
                          style={{ padding: '0.25rem 0.55rem', fontSize: '0.71875rem' }}
                        >
                          {act.status === 'COMPLETED' ? 'Re-open' : 'Mark Done'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ═══ TAB 7: REPORTS ═══ */}
      {activeTab === 'ptm-reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <FileText size={48} color="#0F2C59" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F2C59', fontSize: '1.25rem', fontWeight: 800 }}>
              Official Swarrnim PTM Administrative &amp; Analytical Reports
            </h3>
            <p style={{ maxWidth: '650px', margin: '0 auto 1.5rem', color: '#64748B', fontSize: '0.84375rem', lineHeight: '1.5' }}>
              Download the comprehensive 4-Sheet University Excel Master Report containing Executive PTM Consultation Register, Department &amp; Program Analytical Summaries, Detailed Student Discussion Dossiers, and Follow-up Action Items.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleExportExcel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0F2C59', padding: '0.75rem 1.75rem', fontSize: '0.875rem' }}
              >
                <Download size={17} /> Download Official 4-Sheet Master Excel (.xlsx)
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrintReport}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', fontSize: '0.875rem' }}
              >
                <Printer size={17} /> Print Administrative Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Modals ═══ */}
      {selectedStudentForDossier && (
        <StudentPTMDossierModal
          isOpen={true}
          onClose={() => setSelectedStudentForDossier(null)}
          student={selectedStudentForDossier.student}
          schedule={selectedStudentForDossier.schedule}
          onRecordSaved={() => setRefreshTrigger(prev => prev + 1)}
        />
      )}

      {isCreateModalOpen && (
        <CreatePTMEventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onEventCreated={() => {
            setRefreshTrigger(prev => prev + 1);
            setIsCreateModalOpen(false);
          }}
        />
      )}

    </div>
  );
};
