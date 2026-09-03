import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { mentorBackendService } from '../../services/mentorBackendService';
import { can } from '../../services/userAccountManagementService';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { Student } from '../../types';
import { 
  Users, AlertTriangle, CheckCircle2, TrendingDown,
  Search, Filter, RotateCcw, Download, Eye, FileSpreadsheet,
  Calendar, Clock, ShieldAlert, ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MessageSquare,
  BookOpen, AlertCircle, RefreshCw, Printer, CheckCheck, Send, XCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface MenteeAttendanceRow {
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  universityId: string;
  departmentName: string;
  programCode: string;
  programName: string;
  semesterNumber: number;
  divisionName: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  totalSessions: number;
  presentSessions: number;
  absentSessions: number;
  attendancePercentage: number;
  requiredPercentage: number;
  eligibilityStatus: 'ELIGIBLE' | 'SHORTAGE' | 'CONDITIONAL' | 'NOT_ELIGIBLE';
  riskStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
  lastUpdatedDate: string;
  mentorName: string;
  mentorId: string;
}

export interface MenteeAttendanceManagerProps {
  onNavigateToCondonations?: () => void;
}

export const MenteeAttendanceManager: React.FC<MenteeAttendanceManagerProps> = ({
  onNavigateToCondonations
}) => {
  const { user, role } = useAuth();

  // Permission Checks via Central RBAC
  const canView = can(user, 'ATTENDANCE', 'VIEW') || (role === 'MENTOR' || role === 'FACULTY' || role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR');
  const canExport = can(user, 'ATTENDANCE', 'EXPORT') || (role === 'MENTOR' || role === 'FACULTY' || role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR');
  const canRaiseConcern = can(user, 'ATTENDANCE', 'CREATE') || (role === 'MENTOR' || role === 'FACULTY' || role === 'HOD' || role === 'SUPER_ADMIN');

  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [selectedProgFilter, setSelectedProgFilter] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('2026-27');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState<string>('ALL');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState<string>('ALL');
  const [selectedEligibilityFilter, setSelectedEligibilityFilter] = useState<string>('ALL');
  const [selectedRiskLevelFilter, setSelectedRiskLevelFilter] = useState<string>('ALL');

  // Sorting & Pagination States
  const [sortField, setSortField] = useState<keyof MenteeAttendanceRow>('attendancePercentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals States
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  
  // 1. Session-wise Attendance Modal
  const [sessionDetailModalOpen, setSessionDetailModalOpen] = useState(false);
  const [selectedRowForSessions, setSelectedRowForSessions] = useState<MenteeAttendanceRow | null>(null);
  const [detailedSessionData, setDetailedSessionData] = useState<any | null>(null);

  // 2. All Subjects Progress Modal
  const [subjectProgressModalOpen, setSubjectProgressModalOpen] = useState(false);
  const [selectedStudentForSubjectProgress, setSelectedStudentForSubjectProgress] = useState<Student | null>(null);
  const [menteeAllSubjectsData, setMenteeAllSubjectsData] = useState<any | null>(null);

  // 3. Raise Concern Modal
  const [concernModalOpen, setConcernModalOpen] = useState(false);
  const [selectedRowForConcern, setSelectedRowForConcern] = useState<MenteeAttendanceRow | null>(null);
  const [concernCategory, setConcernCategory] = useState<'ATTENDANCE_SHORTAGE' | 'CHRONIC_ABSENTEEISM' | 'MEDICAL_LEAVE' | 'UNAUTHORIZED_LEAVE' | 'DISCIPLINARY' | 'EXAM_CONDONATION'>('ATTENDANCE_SHORTAGE');
  const [concernRemarks, setConcernRemarks] = useState('');
  const [actionRequested, setActionRequested] = useState<'SCHEDULE_COUNSELING' | 'NOTIFY_PARENTS' | 'ESCALATE_TO_HOD' | 'ISSUE_WARNING_LETTER'>('SCHEDULE_COUNSELING');
  const [notifyHOD, setNotifyHOD] = useState(true);
  const [isSubmittingConcern, setIsSubmittingConcern] = useState(false);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Master Data Options
  const departments = useMemo(() => db.getDepartments(), []);
  const programs = useMemo(() => db.getPrograms(), []);
  const semesters = useMemo(() => db.getSemesters(), []);
  const divisions = useMemo(() => db.getDivisions(), []);
  const subjects = useMemo(() => db.getSubjects(), []);

  // Fetch Attendance Rows Scoped to Authenticated Mentor
  const rawAttendanceRows = useMemo(() => {
    void refreshKey;
    if (!user) return [];

    try {
      return mentorBackendService.getMenteeAttendanceTable(user, {
        searchQuery,
        departmentId: selectedDeptFilter,
        programId: selectedProgFilter,
        academicYear: selectedAcademicYear,
        semesterId: selectedSemesterFilter,
        divisionId: selectedDivisionFilter,
        subjectId: selectedSubjectFilter,
        attendanceStatus: selectedAttendanceStatus,
        eligibilityStatus: selectedEligibilityFilter,
        riskLevel: selectedRiskLevelFilter
      });
    } catch (err: any) {
      console.error('Error fetching mentee attendance table:', err);
      return [];
    }
  }, [
    user, refreshKey, searchQuery, selectedDeptFilter, selectedProgFilter,
    selectedAcademicYear, selectedSemesterFilter, selectedDivisionFilter,
    selectedSubjectFilter, selectedAttendanceStatus, selectedEligibilityFilter,
    selectedRiskLevelFilter
  ]);

  // Overall KPIs Calculation from Real Assigned Mentees
  const kpiStats = useMemo(() => {
    if (!user) return { totalMentees: 0, shortageCount: 0, criticalCount: 0, avgAttendancePct: 0 };
    
    // Get cumulative mentee rows only (subjectId === 'ALL')
    const cumulativeRows = rawAttendanceRows.filter(r => r.subjectId === 'ALL');
    const totalMentees = cumulativeRows.length;
    const shortageCount = cumulativeRows.filter(r => r.attendancePercentage < r.requiredPercentage).length;
    const criticalCount = cumulativeRows.filter(r => r.attendancePercentage < 60).length;
    const sumPct = cumulativeRows.reduce((acc, curr) => acc + curr.attendancePercentage, 0);
    const avgAttendancePct = totalMentees > 0 ? Math.round(sumPct / totalMentees) : 0;

    return {
      totalMentees,
      shortageCount,
      criticalCount,
      avgAttendancePct
    };
  }, [user, rawAttendanceRows]);

  // Sorted Rows
  const sortedRows = useMemo(() => {
    const data = [...rawAttendanceRows];
    data.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toString().toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (typeof valA === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });
    return data;
  }, [rawAttendanceRows, sortField, sortDirection]);

  // Paginated Rows
  const totalRecords = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDeptFilter, selectedProgFilter, selectedSemesterFilter, selectedDivisionFilter, selectedSubjectFilter, selectedAttendanceStatus, selectedEligibilityFilter, selectedRiskLevelFilter, pageSize]);

  const handleSort = (field: keyof MenteeAttendanceRow) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedDeptFilter('ALL');
    setSelectedProgFilter('ALL');
    setSelectedAcademicYear('2026-27');
    setSelectedSemesterFilter('ALL');
    setSelectedDivisionFilter('ALL');
    setSelectedSubjectFilter('ALL');
    setSelectedAttendanceStatus('ALL');
    setSelectedEligibilityFilter('ALL');
    setSelectedRiskLevelFilter('ALL');
    setSortField('attendancePercentage');
    setSortDirection('asc');
    setCurrentPage(1);
    showToast('info', 'Filters reset to default view.');
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export attendance data.');
      return;
    }

    try {
      const exportData = sortedRows.map((r, idx) => ({
        'Sr No.': idx + 1,
        'Student Name': r.studentName,
        'Enrollment No.': r.enrollmentNo || r.universityId,
        'Department': r.departmentName,
        'Program': r.programCode,
        'Semester': `Semester ${r.semesterNumber}`,
        'Division': r.divisionName,
        'Subject Name': r.subjectName,
        'Subject Code': r.subjectCode,
        'Total Sessions': r.totalSessions,
        'Present': r.presentSessions,
        'Absent': r.absentSessions,
        'Attendance %': `${r.attendancePercentage}%`,
        'Required %': `${r.requiredPercentage}%`,
        'Eligibility Status': r.eligibilityStatus,
        'Risk Status': r.riskStatus,
        'Last Updated': r.lastUpdatedDate,
        'Assigned Mentor': r.mentorName
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Mentee Attendance');

      // Set column widths
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 24 }, { wch: 18 }, { wch: 26 }, { wch: 14 },
        { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 14 },
        { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 12 }, { wch: 16 },
        { wch: 12 }, { wch: 14 }, { wch: 20 }
      ];

      const fileName = `Mentee_Attendance_Report_${user?.name?.replace(/\s+/g, '_') || 'Mentor'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showToast('success', `Exported ${exportData.length} records to Excel successfully!`);
    } catch (err: any) {
      console.error('Failed to export Excel:', err);
      showToast('error', 'Failed to generate Excel export.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export attendance data.');
      return;
    }

    try {
      const headers = [
        'Sr No.', 'Student Name', 'Enrollment ID', 'Department', 'Program', 
        'Semester', 'Division', 'Subject', 'Total Sessions', 'Present', 
        'Absent', 'Attendance %', 'Required %', 'Eligibility', 'Risk Status', 'Last Updated'
      ];

      const csvRows = sortedRows.map((r, idx) => [
        idx + 1,
        `"${r.studentName.replace(/"/g, '""')}"`,
        `"${r.enrollmentNo}"`,
        `"${r.departmentName.replace(/"/g, '""')}"`,
        `"${r.programCode}"`,
        `"Sem ${r.semesterNumber}"`,
        `"${r.divisionName}"`,
        `"${r.subjectName.replace(/"/g, '""')}"`,
        r.totalSessions,
        r.presentSessions,
        r.absentSessions,
        `"${r.attendancePercentage}%"`,
        `"${r.requiredPercentage}%"`,
        `"${r.eligibilityStatus}"`,
        `"${r.riskStatus}"`,
        `"${r.lastUpdatedDate}"`
      ]);

      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Mentee_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('success', `Exported CSV successfully!`);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      showToast('error', 'Failed to generate CSV export.');
    }
  };

  // Open Session-wise Attendance Log Modal
  const handleOpenSessionDetails = (row: MenteeAttendanceRow) => {
    if (!user) return;
    try {
      setSelectedRowForSessions(row);
      const details = mentorBackendService.getMenteeAttendanceSessionDetails(
        user,
        row.studentId,
        row.subjectId === 'ALL' ? undefined : row.subjectId
      );
      setDetailedSessionData(details);
      setSessionDetailModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load session details:', err);
      showToast('error', err.message || 'Failed to load session attendance logs.');
    }
  };

  // Open All Subjects Progress Modal
  const handleOpenSubjectProgress = (row: MenteeAttendanceRow) => {
    if (!user) return;
    try {
      const student = db.getStudents().find(s => s.id === row.studentId);
      if (!student) return;
      setSelectedStudentForSubjectProgress(student);
      const breakdown = mentorBackendService.getMenteeAttendance(user, row.studentId);
      setMenteeAllSubjectsData(breakdown);
      setSubjectProgressModalOpen(true);
    } catch (err: any) {
      console.error('Failed to load subject attendance:', err);
      showToast('error', err.message || 'Failed to load subject attendance progress.');
    }
  };

  // Open Raise Attendance Concern Modal
  const handleOpenConcernModal = (row: MenteeAttendanceRow) => {
    setSelectedRowForConcern(row);
    setConcernCategory('ATTENDANCE_SHORTAGE');
    setConcernRemarks(`Student ${row.studentName} has current attendance of ${row.attendancePercentage}%, which is below the mandatory university threshold of ${row.requiredPercentage}%.`);
    setActionRequested('SCHEDULE_COUNSELING');
    setNotifyHOD(true);
    setConcernModalOpen(true);
  };

  // Submit Raise Concern
  const handleSubmitConcern = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRowForConcern) return;

    setIsSubmittingConcern(true);
    try {
      mentorBackendService.raiseAttendanceConcern(user, {
        studentId: selectedRowForConcern.studentId,
        subjectId: selectedRowForConcern.subjectId === 'ALL' ? undefined : selectedRowForConcern.subjectId,
        concernCategory,
        remarks: concernRemarks,
        actionRequested,
        notifyHOD,
        notifyParents: true
      });

      setRefreshKey(prev => prev + 1);
      setConcernModalOpen(false);
      showToast('success', `Attendance concern for ${selectedRowForConcern.studentName} successfully logged and dispatched!`);
    } catch (err: any) {
      console.error('Error submitting attendance concern:', err);
      showToast('error', err.message || 'Failed to log attendance concern.');
    } finally {
      setIsSubmittingConcern(false);
    }
  };

  if (!canView) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
        <ShieldAlert size={56} color="#EF4444" style={{ margin: '0 auto 1.25rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Access Restricted: Mentee Attendance
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0.5rem auto 1.5rem', lineHeight: 1.6 }}>
          You do not have permission to view this module. Please contact your Department HOD or Central ERP Coordinator to request attendance monitoring permissions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 99999,
            backgroundColor: toastMessage.type === 'success' ? '#10B981' : toastMessage.type === 'error' ? '#EF4444' : '#3B82F6',
            color: '#FFFFFF',
            padding: '0.85rem 1.25rem',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 700,
            fontSize: '0.875rem'
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toastMessage.text}
        </div>
      )}

      {/* ─── 1. Header Banner & Actions ─────────────────────────────────── */}
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
              <BookOpen size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Mentee Attendance Management &amp; Subject Monitoring
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              Real-time attendance computation, statutory condonation eligibility tracking &amp; subject lecture breakdown for assigned mentees
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                showToast('info', 'Refreshed latest attendance data from database.');
              }}
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
              title="Refresh attendance records"
            >
              <RefreshCw size={14} /> Refresh
            </button>

            {onNavigateToCondonations && (
              <button
                type="button"
                onClick={onNavigateToCondonations}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.95rem',
                  fontWeight: 700,
                  background: '#FFFFFF',
                  color: 'var(--brand-navy, #0B192C)'
                }}
              >
                <CheckCheck size={14} /> Condonation Queue →
              </button>
            )}

            {canExport && (
              <>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="btn btn-primary"
                  style={{
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 1rem',
                    fontWeight: 800,
                    background: 'var(--brand-orange, #F37023)',
                    borderColor: 'var(--brand-orange, #F37023)'
                  }}
                >
                  <FileSpreadsheet size={14} /> Export Excel
                </button>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="btn btn-outline"
                  style={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    fontWeight: 700,
                    background: 'rgba(255,255,255,0.08)'
                  }}
                >
                  <Download size={14} /> CSV
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. Top Summary KPI Cards (Real Dynamic Metrics) ─────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="TOTAL ASSIGNED MENTEES"
          value={kpiStats.totalMentees}
          icon={Users}
          colorScheme="navy"
          description={`Assigned to ${user?.name || 'Mentor'}`}
        />
        <StatCard
          title="OVERALL ATTENDANCE"
          value={`${kpiStats.avgAttendancePct}%`}
          icon={CheckCircle2}
          colorScheme={kpiStats.avgAttendancePct >= 75 ? 'green' : 'orange'}
          description="Average across all mentees"
        />
        <StatCard
          title="ATTENDANCE SHORTAGE"
          value={kpiStats.shortageCount}
          icon={AlertTriangle}
          colorScheme={kpiStats.shortageCount > 0 ? 'gold' : 'green'}
          description="Below 75% required threshold"
        />
        <StatCard
          title="CRITICAL SHORTAGE"
          value={kpiStats.criticalCount}
          icon={TrendingDown}
          colorScheme={kpiStats.criticalCount > 0 ? 'orange' : 'green'}
          description="Below 60% (Exam Debarred Risk)"
        />
      </div>

      {/* ─── 3. Excel-Style Filter Bar ───────────────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.925rem' }}>
            <Filter size={18} color="var(--brand-orange)" />
            <span>Excel-Style Data Filters</span>
          </div>

          <button 
            type="button" 
            onClick={handleResetFilters}
            className="btn btn-outline btn-sm"
            style={{ fontSize: '0.775rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          
          {/* Search Student */}
          <div style={{ position: 'relative' }}>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Search Student / Subject
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Name, Enrollment, Subject..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8125rem' }}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Department
            </label>
            <select
              className="form-control"
              value={selectedDeptFilter}
              onChange={e => setSelectedDeptFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Program
            </label>
            <select
              className="form-control"
              value={selectedProgFilter}
              onChange={e => setSelectedProgFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.code}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Semester
            </label>
            <select
              className="form-control"
              value={selectedSemesterFilter}
              onChange={e => setSelectedSemesterFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Division
            </label>
            <select
              className="form-control"
              value={selectedDivisionFilter}
              onChange={e => setSelectedDivisionFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Divisions</option>
              {['Div A', 'Div B', 'Div C', 'Div D'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Subject View
            </label>
            <select
              className="form-control"
              value={selectedSubjectFilter}
              onChange={e => setSelectedSubjectFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Subjects (Cumulative + Rows)</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>

          {/* Attendance Status */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Attendance Status
            </label>
            <select
              className="form-control"
              value={selectedAttendanceStatus}
              onChange={e => setSelectedAttendanceStatus(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="GOOD">Good Standing (≥ 75%)</option>
              <option value="SHORTAGE">Shortage (&lt; 75%)</option>
              <option value="CRITICAL">Critical (&lt; 60%)</option>
            </select>
          </div>

          {/* Eligibility Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Exam Eligibility
            </label>
            <select
              className="form-control"
              value={selectedEligibilityFilter}
              onChange={e => setSelectedEligibilityFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Eligibility</option>
              <option value="ELIGIBLE">Eligible</option>
              <option value="CONDITIONAL">Conditional / Under Review</option>
              <option value="NOT_ELIGIBLE">Not Eligible / Debarred</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Risk Level
            </label>
            <select
              className="form-control"
              value={selectedRiskLevelFilter}
              onChange={e => setSelectedRiskLevelFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Risk Levels</option>
              <option value="NORMAL">Normal (≥ 85%)</option>
              <option value="WARNING">Warning (75% - 84%)</option>
              <option value="CRITICAL">Critical (&lt; 75%)</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─── 4. Excel-Style Responsive Data Table ────────────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Table Controls Top Strip */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem' }}>
              Mentee Attendance Ledger
            </span>
            <Badge variant="navy">{totalRecords} Records</Badge>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>Show</span>
            <select
              className="form-control"
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ width: '80px', height: '32px', fontSize: '0.8125rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>per page</span>
          </div>
        </div>

        {/* The Excel Table */}
        <div style={{ 
          overflowX: 'auto', 
          border: '1px solid #CBD5E1', 
          borderRadius: '6px',
          maxHeight: '650px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', minWidth: '1350px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
                <th style={{ width: '45px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  #
                </th>
                <th 
                  onClick={() => handleSort('studentName')}
                  style={{ width: '190px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>STUDENT NAME</span>
                    {sortField === 'studentName' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('enrollmentNo')}
                  style={{ width: '140px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>ENROLLMENT ID</span>
                    {sortField === 'enrollmentNo' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th style={{ width: '90px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  PROGRAM
                </th>
                <th style={{ width: '75px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  SEM
                </th>
                <th style={{ width: '75px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  DIV
                </th>
                <th style={{ minWidth: '180px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  SUBJECT
                </th>
                <th 
                  onClick={() => handleSort('totalSessions')}
                  style={{ width: '80px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>TOTAL</span>
                    {sortField === 'totalSessions' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
                  </div>
                </th>
                <th style={{ width: '75px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  PRESENT
                </th>
                <th style={{ width: '75px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  ABSENT
                </th>
                <th 
                  onClick={() => handleSort('attendancePercentage')}
                  style={{ width: '105px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>ATTEND %</span>
                    {sortField === 'attendancePercentage' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th style={{ width: '80px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  REQ %
                </th>
                <th style={{ width: '120px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  ELIGIBILITY
                </th>
                <th style={{ width: '95px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  RISK
                </th>
                <th style={{ width: '100px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  LAST UPDATED
                </th>
                <th style={{ width: '190px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={16} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={36} color="#94A3B8" />
                      <strong style={{ fontSize: '1rem', color: 'var(--brand-navy)' }}>No mentee attendance records found</strong>
                      <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                        Try clearing search or filters, or verify that your Department HOD has assigned mentees to you.
                      </p>
                      <button onClick={handleResetFilters} className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}>
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const isCumulative = row.subjectId === 'ALL';
                  const isShortage = row.attendancePercentage < row.requiredPercentage;
                  const isCritical = row.attendancePercentage < 60;
                  const isGood = row.attendancePercentage >= 85;

                  const rowBg = isCritical 
                    ? '#FEF2F2' 
                    : isShortage 
                    ? '#FFFBEB' 
                    : isGood 
                    ? '#F0FDF4' 
                    : index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

                  return (
                    <tr 
                      key={`${row.studentId}-${row.subjectId}-${index}`}
                      style={{ 
                        background: rowBg, 
                        borderBottom: '1px solid #E2E8F0',
                        fontWeight: isCumulative ? 700 : 400
                      }}
                      className="table-row-hover"
                    >
                      {/* Sr */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>

                      {/* Student Name */}
                      <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                          {row.studentName}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {row.departmentName}
                        </div>
                      </td>

                      {/* Enrollment */}
                      <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <code style={{ fontSize: '0.775rem', color: 'var(--brand-orange)', fontWeight: 700 }}>
                          {row.enrollmentNo}
                        </code>
                      </td>

                      {/* Program */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                          {row.programCode}
                        </span>
                      </td>

                      {/* Semester */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>
                        Sem {row.semesterNumber}
                      </td>

                      {/* Division */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', color: '#475569' }}>
                        {row.divisionName}
                      </td>

                      {/* Subject */}
                      <td style={{ padding: '0.65rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        {isCumulative ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, color: '#1E40AF' }}>
                            <span style={{ fontSize: '0.75rem', background: '#DBEAFE', padding: '2px 8px', borderRadius: '4px' }}>
                              All Subjects (Cumulative)
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{row.subjectName}</span>
                            <code style={{ fontSize: '0.7rem', color: '#64748B', display: 'block' }}>{row.subjectCode}</code>
                          </div>
                        )}
                      </td>

                      {/* Total Sessions */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>
                        {row.totalSessions}
                      </td>

                      {/* Present */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', color: '#15803D', fontWeight: 800 }}>
                        {row.presentSessions}
                      </td>

                      {/* Absent */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', color: row.absentSessions > 0 ? '#DC2626' : '#64748B', fontWeight: 800 }}>
                        {row.absentSessions}
                      </td>

                      {/* Attendance % */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.925rem', 
                          fontWeight: 900, 
                          color: isCritical ? '#DC2626' : isShortage ? '#D97706' : '#15803D' 
                        }}>
                          {row.attendancePercentage}%
                        </span>
                      </td>

                      {/* Required % */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#475569' }}>
                        {row.requiredPercentage}%
                      </td>

                      {/* Eligibility Status */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: row.eligibilityStatus === 'ELIGIBLE' ? '#DCFCE7' : row.eligibilityStatus === 'CONDITIONAL' ? '#FEF3C7' : '#FEE2E2',
                          color: row.eligibilityStatus === 'ELIGIBLE' ? '#15803D' : row.eligibilityStatus === 'CONDITIONAL' ? '#B45309' : '#B91C1C',
                          border: `1px solid ${row.eligibilityStatus === 'ELIGIBLE' ? '#BBF7D0' : row.eligibilityStatus === 'CONDITIONAL' ? '#FDE68A' : '#FECACA'}`
                        }}>
                          {row.eligibilityStatus === 'ELIGIBLE' ? 'ELIGIBLE' : row.eligibilityStatus === 'CONDITIONAL' ? 'CONDITIONAL' : 'DEBARRED'}
                        </span>
                      </td>

                      {/* Risk Status */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: row.riskStatus === 'NORMAL' ? '#F0FDF4' : row.riskStatus === 'WARNING' ? '#FFFBEB' : '#FEF2F2',
                          color: row.riskStatus === 'NORMAL' ? '#15803D' : row.riskStatus === 'WARNING' ? '#D97706' : '#DC2626'
                        }}>
                          {row.riskStatus}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {row.lastUpdatedDate}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          
                          {/* 1. View Session Logs */}
                          <button
                            type="button"
                            onClick={() => handleOpenSessionDetails(row)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', fontWeight: 700 }}
                            title="View Session-wise Attendance Log"
                          >
                            <Eye size={12} style={{ marginRight: '2px' }} /> Sessions
                          </button>

                          {/* 2. View All Subjects Progress */}
                          <button
                            type="button"
                            onClick={() => handleOpenSubjectProgress(row)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', fontWeight: 700 }}
                            title="View All Subjects Breakdown"
                          >
                            <BookOpen size={12} style={{ marginRight: '2px' }} /> Subjects
                          </button>

                          {/* 3. Raise Concern */}
                          {canRaiseConcern && (
                            <button
                              type="button"
                              onClick={() => handleOpenConcernModal(row)}
                              className="btn btn-sm"
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.25rem 0.45rem', 
                                fontWeight: 700,
                                background: isShortage ? '#FEF2F2' : '#F1F5F9',
                                color: isShortage ? '#DC2626' : '#475569',
                                borderColor: isShortage ? '#FECACA' : '#CBD5E1'
                              }}
                              title="Raise Attendance Concern &amp; Notify HOD"
                            >
                              <MessageSquare size={12} style={{ marginRight: '2px' }} /> Concern
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Bar */}
        {totalRecords > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ color: '#64748B' }}>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> attendance records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              <span style={{ padding: '0 0.5rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.3rem 0.5rem' }}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ─── 5. MODAL: Session-Wise Attendance Log ──────────────────────── */}
      {sessionDetailModalOpen && detailedSessionData && (
        <Modal
          isOpen={sessionDetailModalOpen}
          onClose={() => setSessionDetailModalOpen(false)}
          title="Session-Wise Attendance Log &amp; Lecture Register"
          maxWidth="900px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Student Header Card */}
            <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  {detailedSessionData.student.name}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Enrollment No: <strong style={{ color: 'var(--brand-orange)' }}>{detailedSessionData.student.enrollmentNo}</strong> • Assigned Mentor: <strong>{detailedSessionData.mentorName}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ATTENDANCE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: detailedSessionData.summary.percentage >= 75 ? '#15803D' : '#DC2626' }}>
                    {detailedSessionData.summary.percentage}%
                  </div>
                </div>
                <div style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>PRESENT / TOTAL</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--brand-navy)' }}>
                    {detailedSessionData.summary.present} / {detailedSessionData.summary.total}
                  </div>
                </div>
                <div style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>STATUS</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 900, color: detailedSessionData.summary.eligibility === 'ELIGIBLE' ? '#15803D' : '#DC2626' }}>
                    {detailedSessionData.summary.eligibility}
                  </div>
                </div>
              </div>
            </div>

            {/* Sessions Table */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0B192C', color: '#FFFFFF', zIndex: 5 }}>
                  <tr>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '50px' }}>#</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '110px' }}>DATE</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>SUBJECT</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '160px' }}>FACULTY</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '80px' }}>LEC #</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', width: '110px' }}>STATUS</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '180px' }}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedSessionData.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                        No session-level attendance logs available for this selection.
                      </td>
                    </tr>
                  ) : (
                    detailedSessionData.sessions.map((s: any, idx: number) => {
                      const isPres = s.status === 'PRESENT';
                      const isAbs = s.status === 'ABSENT';
                      return (
                        <tr key={s.id || idx} style={{ borderBottom: '1px solid #E2E8F0', background: isAbs ? '#FEF2F2' : (idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC') }}>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                          <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{s.date}</td>
                          <td style={{ padding: '0.55rem 0.75rem' }}>
                            <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{s.subjectName}</div>
                            <code style={{ fontSize: '0.7rem', color: '#64748B' }}>{s.subjectCode}</code>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', color: '#334155' }}>{s.facultyName}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700 }}>
                            #{s.sessionNo}
                          </td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isPres ? '#DCFCE7' : '#FEE2E2',
                              color: isPres ? '#15803D' : '#DC2626'
                            }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ padding: '0.55rem 0.75rem', color: '#64748B', fontSize: '0.75rem' }}>
                            {s.remarks || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSessionDetailModalOpen(false)}
              >
                Close Register
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── 6. MODAL: All Subjects Breakdown for Mentee ────────────────── */}
      {subjectProgressModalOpen && menteeAllSubjectsData && (
        <Modal
          isOpen={subjectProgressModalOpen}
          onClose={() => setSubjectProgressModalOpen(false)}
          title="Subject-Wise Curriculum Attendance Breakdown"
          maxWidth="850px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Student Header Strip */}
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                {menteeAllSubjectsData.student.name}
              </h4>
              <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                Enrollment: <strong>{menteeAllSubjectsData.student.enrollmentNo}</strong> • Cumulative Attendance: <strong style={{ color: menteeAllSubjectsData.overallStats.percentage >= 75 ? '#15803D' : '#DC2626' }}>{menteeAllSubjectsData.overallStats.percentage}%</strong> ({menteeAllSubjectsData.overallStats.presentClasses}/{menteeAllSubjectsData.overallStats.totalClasses} lectures)
              </div>
            </div>

            {/* Subject Breakdown Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
              {menteeAllSubjectsData.subjectWise.map((sub: any) => {
                const isShort = sub.percentage < 75;
                return (
                  <div key={sub.subjectId} style={{ border: `1px solid ${isShort ? '#FECACA' : '#CBD5E1'}`, background: isShort ? '#FEF2F2' : '#FFFFFF', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <strong style={{ fontSize: '0.925rem', color: 'var(--brand-navy)' }}>{sub.subjectName}</strong>
                        <code style={{ fontSize: '0.75rem', color: '#64748B', display: 'block' }}>{sub.subjectCode}</code>
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: isShort ? '#DC2626' : '#15803D' }}>
                        {sub.percentage}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', margin: '0.75rem 0' }}>
                      <div 
                        style={{ 
                          width: `${Math.min(100, sub.percentage)}%`, 
                          height: '100%', 
                          background: isShort ? '#EF4444' : '#10B981',
                          borderRadius: '4px',
                          transition: 'width 0.3s ease'
                        }} 
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569' }}>
                      <span>Attended: <strong>{sub.present}</strong> / {sub.total}</span>
                      <span>Absent: <strong style={{ color: '#DC2626' }}>{sub.absent}</strong></span>
                      <span style={{ fontWeight: 700, color: isShort ? '#DC2626' : '#15803D' }}>
                        {isShort ? `Shortage (${75 - sub.percentage}%)` : 'Eligible'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setSubjectProgressModalOpen(false)}
              >
                Close Breakdown
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── 7. MODAL: Raise Attendance Concern ─────────────────────────── */}
      {concernModalOpen && selectedRowForConcern && (
        <Modal
          isOpen={concernModalOpen}
          onClose={() => setConcernModalOpen(false)}
          title="Raise Mentee Attendance Concern"
          maxWidth="600px"
        >
          <form onSubmit={handleSubmitConcern} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ background: '#FEF2F2', padding: '0.85rem', borderRadius: '6px', border: '1px solid #FECACA', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 800, color: '#991B1B' }}>
                Mentee: {selectedRowForConcern.studentName} ({selectedRowForConcern.enrollmentNo})
              </div>
              <div style={{ color: '#B91C1C', marginTop: '0.15rem' }}>
                Current Attendance: <strong>{selectedRowForConcern.attendancePercentage}%</strong> (Required: {selectedRowForConcern.requiredPercentage}%) • Subject: <strong>{selectedRowForConcern.subjectName}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Concern Category *
              </label>
              <select
                className="form-control"
                value={concernCategory}
                onChange={e => setConcernCategory(e.target.value as any)}
                required
              >
                <option value="ATTENDANCE_SHORTAGE">Attendance Shortage (&lt; 75%)</option>
                <option value="CHRONIC_ABSENTEEISM">Chronic Absenteeism / Consecutive Leaves</option>
                <option value="MEDICAL_LEAVE">Medical Leave Verification</option>
                <option value="UNAUTHORIZED_LEAVE">Unauthorized Absence</option>
                <option value="DISCIPLINARY">Disciplinary &amp; Punctuality Concern</option>
                <option value="EXAM_CONDONATION">Exam Condonation Recommendation</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Action Requested *
              </label>
              <select
                className="form-control"
                value={actionRequested}
                onChange={e => setActionRequested(e.target.value as any)}
                required
              >
                <option value="SCHEDULE_COUNSELING">Schedule 1-on-1 Mentor Counseling Session</option>
                <option value="NOTIFY_PARENTS">Dispatch Warning Notice to Parents (SMS / Email)</option>
                <option value="ESCALATE_TO_HOD">Escalate Directly to Department HOD</option>
                <option value="ISSUE_WARNING_LETTER">Issue Academic Warning Letter</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Mentor Observations &amp; Detailed Remarks *
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={concernRemarks}
                onChange={e => setConcernRemarks(e.target.value)}
                placeholder="State the reasons discussed with the mentee and recommended remedies..."
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                id="notifyHODCheckbox"
                checked={notifyHOD}
                onChange={e => setNotifyHOD(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="notifyHODCheckbox" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--brand-navy)', cursor: 'pointer', margin: 0 }}>
                Transmit official notification to Department HOD Dashboard
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setConcernModalOpen(false)}
                disabled={isSubmittingConcern}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                disabled={isSubmittingConcern}
              >
                <Send size={14} /> {isSubmittingConcern ? 'Logging Concern...' : 'Dispatch Concern'}
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ─── 8. MODAL: Student Profile 360 Modal ─────────────────────────── */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          isOpen={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}

    </div>
  );
};
