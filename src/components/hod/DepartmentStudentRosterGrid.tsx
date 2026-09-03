import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { Student, Program, Semester, Division } from '../../types';
import { Badge } from '../common/Badge';
import { StudentRowActionMenu } from '../common/StudentRowActionMenu';
import { 
  Search, Filter, RotateCcw, Download, Eye, FileSpreadsheet,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Check, X, AlertCircle, Edit3,
  UserCheck, ShieldCheck, CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';

export interface DepartmentStudentRosterGridProps {
  departmentId: string;
  departmentName: string;
  onSelectStudentForProfile: (student: Student) => void;
  onExportExcel?: (students: any[]) => void;
}

export interface StudentRowItem {
  student: Student;
  programCode: string;
  programName: string;
  semesterNumber: number;
  sectionName: string;
  attendancePercentage: number;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  attendanceStatus: 'SAFE' | 'SHORTAGE' | 'CRITICAL';
  academicStatus: 'GOOD_STANDING' | 'AT_RISK' | 'CRITICAL_RISK';
  documentStatus: 'ALL_VERIFIED' | 'PENDING' | 'MISSING';
  examEligibility: 'ELIGIBLE' | 'SHORTAGE' | 'PROVISIONAL' | 'CONDITIONAL';
  mentorName: string;
  hasShortage: boolean;
  hasMissingDocs: boolean;
  isRisk: boolean;
}

export const DepartmentStudentRosterGrid: React.FC<DepartmentStudentRosterGridProps> = ({
  departmentId,
  departmentName,
  onSelectStudentForProfile,
  onExportExcel
}) => {
  const { user, role } = useAuth();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'ALL' | 'SHORTAGE' | 'AT_RISK'>('ALL');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('ALL');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('ALL');
  const [selectedAttendanceFilter, setSelectedAttendanceFilter] = useState('ALL');
  const [selectedAcademicStatusFilter, setSelectedAcademicStatusFilter] = useState('ALL');
  const [selectedDocStatusFilter, setSelectedDocStatusFilter] = useState('ALL');
  const [selectedExamEligibilityFilter, setSelectedExamEligibilityFilter] = useState('ALL');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<keyof StudentRowItem | 'studentName' | 'enrollmentNo'>('studentName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Multi-Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Master Data
  const programs = useMemo(() => db.getPrograms().filter(p => p.departmentId === departmentId || departmentId === 'dept-1'), [departmentId]);
  const semesters = useMemo(() => db.getSemesters(), []);
  const divisions = useMemo(() => db.getDivisions(), []);

  // 1. Department-Scoped Student Records (Strict HOD Isolation)
  const allDeptStudents = useMemo(() => {
    const students = db.getStudents();
    return students.filter(s => s.departmentId === departmentId || (departmentId === 'dept-1' && s.departmentId === 'dept-1'));
  }, [departmentId]);

  // 2. Enrich student rows with authentic attendance, academic status, doc vault, and exam eligibility
  const enrichedStudentRows: StudentRowItem[] = useMemo(() => {
    return allDeptStudents.map(student => {
      const prog = programs.find(p => p.id === student.programId) || db.getProgramById(student.programId);
      const sem = semesters.find(s => s.id === student.semesterId) || db.getSemesterById(student.semesterId);
      const div = divisions.find(d => d.id === student.divisionId) || db.getDivisionById(student.divisionId || '');

      const stats = db.getStudentAttendanceStats(student.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(student.id);

      const hasShortage = stats.percentage < 75;
      const hasMissingDocs = docs.some(d => d.status !== 'VERIFIED');
      const isCriticalAttendance = stats.percentage < 60;
      const isRisk = hasShortage || hasMissingDocs;

      let attendStatus: 'SAFE' | 'SHORTAGE' | 'CRITICAL' = 'SAFE';
      if (isCriticalAttendance) attendStatus = 'CRITICAL';
      else if (hasShortage) attendStatus = 'SHORTAGE';

      let acadStatus: 'GOOD_STANDING' | 'AT_RISK' | 'CRITICAL_RISK' = 'GOOD_STANDING';
      if (isCriticalAttendance) acadStatus = 'CRITICAL_RISK';
      else if (hasShortage || hasMissingDocs) acadStatus = 'AT_RISK';

      let docStatus: 'ALL_VERIFIED' | 'PENDING' | 'MISSING' = 'ALL_VERIFIED';
      if (docs.some(d => d.status === 'REJECTED' || (d.status as string) === 'MISSING' || (d.status as string) === 'REUPLOAD_REQUIRED')) docStatus = 'MISSING';
      else if (docs.some(d => d.status === 'PENDING_VERIFICATION' || (d.status as string) === 'PENDING' || (d.status as string) === 'SUBMITTED')) docStatus = 'PENDING';

      let examStatus: 'ELIGIBLE' | 'SHORTAGE' | 'PROVISIONAL' | 'CONDITIONAL' = 'ELIGIBLE';
      if (stats.percentage >= 75 && docStatus === 'ALL_VERIFIED') examStatus = 'ELIGIBLE';
      else if (stats.percentage >= 60) examStatus = 'PROVISIONAL';
      else examStatus = 'SHORTAGE';

      const divLabel = div?.name ? (div.name.startsWith('Division') ? div.name : `DIV-${prog?.code || 'CSE'}-${sem?.number || 4}${div.name.replace('Division', '').trim()}`) : (student.divisionId || 'Div A');

      return {
        student,
        programCode: prog?.code || 'B.Tech',
        programName: prog?.name || 'Computer Science & Engineering',
        semesterNumber: sem?.number || 4,
        sectionName: divLabel,
        attendancePercentage: stats.percentage,
        totalClasses: stats.totalClasses,
        presentClasses: stats.presentClasses,
        absentClasses: stats.absentClasses,
        attendanceStatus: attendStatus,
        academicStatus: acadStatus,
        documentStatus: docStatus,
        examEligibility: examStatus,
        mentorName: student.mentorName || 'Assigned Mentor',
        hasShortage,
        hasMissingDocs,
        isRisk
      };
    });
  }, [allDeptStudents, programs, semesters, divisions]);

  // Counts for Sub-Tabs
  const totalCount = enrichedStudentRows.length;
  const shortageCount = useMemo(() => enrichedStudentRows.filter(r => r.hasShortage).length, [enrichedStudentRows]);
  const atRiskCount = useMemo(() => enrichedStudentRows.filter(r => r.isRisk).length, [enrichedStudentRows]);

  // 3. Filtered Records
  const filteredRows = useMemo(() => {
    return enrichedStudentRows.filter(row => {
      // Sub-tab filter
      if (activeSubTab === 'SHORTAGE' && !row.hasShortage) return false;
      if (activeSubTab === 'AT_RISK' && !row.isRisk) return false;

      // Program filter
      if (selectedProgramFilter !== 'ALL' && row.student.programId !== selectedProgramFilter && row.programCode !== selectedProgramFilter) return false;

      // Semester filter
      if (selectedSemesterFilter !== 'ALL' && String(row.semesterNumber) !== selectedSemesterFilter && row.student.semesterId !== selectedSemesterFilter) return false;

      // Section filter
      if (selectedSectionFilter !== 'ALL' && !row.sectionName.includes(selectedSectionFilter) && row.student.divisionId !== selectedSectionFilter) return false;

      // Attendance filter
      if (selectedAttendanceFilter === 'SAFE' && row.attendancePercentage < 75) return false;
      if (selectedAttendanceFilter === 'SHORTAGE' && (row.attendancePercentage >= 75 || row.attendancePercentage < 60)) return false;
      if (selectedAttendanceFilter === 'CRITICAL' && row.attendancePercentage >= 60) return false;

      // Academic Status filter
      if (selectedAcademicStatusFilter !== 'ALL' && row.academicStatus !== selectedAcademicStatusFilter) return false;

      // Document Status filter
      if (selectedDocStatusFilter !== 'ALL' && row.documentStatus !== selectedDocStatusFilter) return false;

      // Exam Eligibility filter
      if (selectedExamEligibilityFilter !== 'ALL' && row.examEligibility !== selectedExamEligibilityFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = row.student.name.toLowerCase().includes(q);
        const enrollMatch = row.student.enrollmentNo.toLowerCase().includes(q);
        const progMatch = row.programCode.toLowerCase().includes(q) || row.programName.toLowerCase().includes(q);
        const secMatch = row.sectionName.toLowerCase().includes(q);
        const mentorMatch = row.mentorName.toLowerCase().includes(q);
        if (!nameMatch && !enrollMatch && !progMatch && !secMatch && !mentorMatch) return false;
      }

      return true;
    });
  }, [
    enrichedStudentRows, activeSubTab, selectedProgramFilter, selectedSemesterFilter,
    selectedSectionFilter, selectedAttendanceFilter, selectedAcademicStatusFilter,
    selectedDocStatusFilter, selectedExamEligibilityFilter, searchQuery
  ]);

  // 4. Sorted Records
  const sortedRows = useMemo(() => {
    const data = [...filteredRows];
    data.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'studentName') {
        valA = a.student.name.toLowerCase();
        valB = b.student.name.toLowerCase();
      } else if (sortField === 'enrollmentNo') {
        valA = a.student.enrollmentNo.toLowerCase();
        valB = b.student.enrollmentNo.toLowerCase();
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

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
  }, [filteredRows, sortField, sortDirection]);

  // 5. Paginated Records
  const totalFilteredCount = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery, activeSubTab, selectedProgramFilter, selectedSemesterFilter,
    selectedSectionFilter, selectedAttendanceFilter, selectedAcademicStatusFilter,
    selectedDocStatusFilter, selectedExamEligibilityFilter, pageSize
  ]);

  const handleSort = (field: keyof StudentRowItem | 'studentName' | 'enrollmentNo') => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveSubTab('ALL');
    setSelectedProgramFilter('ALL');
    setSelectedSemesterFilter('ALL');
    setSelectedSectionFilter('ALL');
    setSelectedAttendanceFilter('ALL');
    setSelectedAcademicStatusFilter('ALL');
    setSelectedDocStatusFilter('ALL');
    setSelectedExamEligibilityFilter('ALL');
    setSortField('studentName');
    setSortDirection('asc');
    setCurrentPage(1);
  };

  // Checkbox Handlers
  const handleToggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const isAllVisibleSelected = paginatedRows.length > 0 && paginatedRows.every(r => selectedStudentIds.includes(r.student.id));

  const handleToggleSelectAllVisible = () => {
    const visibleIds = paginatedRows.map(r => r.student.id);
    if (isAllVisibleSelected) {
      setSelectedStudentIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedStudentIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Export to Excel (.xlsx)
  const handleExportDataGrid = () => {
    if (onExportExcel) {
      onExportExcel(sortedRows);
      return;
    }

    const exportRows = sortedRows.map((r, idx) => ({
      '#': idx + 1,
      'Student Name': r.student.name,
      'Enrollment Number': r.student.enrollmentNo,
      'Program': r.programCode,
      'Semester': `Sem ${r.semesterNumber}`,
      'Section': r.sectionName,
      'Attendance %': `${r.attendancePercentage}%`,
      'Total Classes': r.totalClasses,
      'Present Classes': r.presentClasses,
      'Absent Classes': r.absentClasses,
      'Academic Status': r.academicStatus.replace(/_/g, ' '),
      'Document Status': r.documentStatus.replace(/_/g, ' '),
      'Exam Eligibility': r.examEligibility.replace(/_/g, ' '),
      'Assigned Mentor': r.mentorName,
      'Email': r.student.email,
      'Phone': r.student.phone || '+91 98250 00000'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Department Students');
    XLSX.writeFile(wb, `HOD_${departmentName.replace(/\s+/g, '_')}_Students_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Status Badge Renderers
  const renderAttendanceBadge = (percentage: number) => {
    const isSafe = percentage >= 75;
    const isWarning = percentage >= 60 && percentage < 75;
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3px 8px',
        borderRadius: '4px',
        fontSize: '0.75rem',
        fontWeight: 800,
        background: isSafe ? '#DCFCE7' : isWarning ? '#FEF3C7' : '#FEE2E2',
        color: isSafe ? '#15803D' : isWarning ? '#B45309' : '#B91C1C',
        border: `1px solid ${isSafe ? '#86EFAC' : isWarning ? '#FDE68A' : '#FECACA'}`
      }}>
        {percentage}%
      </span>
    );
  };

  const renderAcademicStatusBadge = (status: 'GOOD_STANDING' | 'AT_RISK' | 'CRITICAL_RISK') => {
    switch (status) {
      case 'GOOD_STANDING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#DCFCE7',
            color: '#15803D',
            border: '1px solid #86EFAC'
          }}>
            GOOD STANDING
          </span>
        );
      case 'AT_RISK':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A'
          }}>
            AT RISK
          </span>
        );
      case 'CRITICAL_RISK':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEE2E2',
            color: '#B91C1C',
            border: '1px solid #FECACA'
          }}>
            CRITICAL RISK
          </span>
        );
    }
  };

  const renderDocumentStatusBadge = (status: 'ALL_VERIFIED' | 'PENDING' | 'MISSING') => {
    switch (status) {
      case 'ALL_VERIFIED':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#DCFCE7',
            color: '#15803D',
            border: '1px solid #86EFAC'
          }}>
            ALL VERIFIED
          </span>
        );
      case 'PENDING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A'
          }}>
            PENDING
          </span>
        );
      case 'MISSING':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEE2E2',
            color: '#B91C1C',
            border: '1px solid #FECACA'
          }}>
            MISSING
          </span>
        );
    }
  };

  const renderExamEligibilityBadge = (status: 'ELIGIBLE' | 'SHORTAGE' | 'PROVISIONAL' | 'CONDITIONAL') => {
    switch (status) {
      case 'ELIGIBLE':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#DCFCE7',
            color: '#15803D',
            border: '1px solid #86EFAC'
          }}>
            ELIGIBLE
          </span>
        );
      case 'PROVISIONAL':
      case 'CONDITIONAL':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEF3C7',
            color: '#B45309',
            border: '1px solid #FDE68A'
          }}>
            PROVISIONAL
          </span>
        );
      case 'SHORTAGE':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '0.6875rem',
            fontWeight: 800,
            background: '#FEE2E2',
            color: '#B91C1C',
            border: '1px solid #FECACA'
          }}>
            SHORTAGE
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
      
      {/* ─── 1. Top Sub-Tabs & Export Action Strip ────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        
        {/* Filter Sub-Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('ALL')}
            className="btn btn-sm"
            style={{
              fontSize: '0.775rem',
              fontWeight: 800,
              padding: '0.35rem 0.85rem',
              background: activeSubTab === 'ALL' ? 'var(--brand-orange, #F37023)' : '#F1F5F9',
              color: activeSubTab === 'ALL' ? '#FFFFFF' : '#334155',
              borderColor: activeSubTab === 'ALL' ? 'var(--brand-orange, #F37023)' : '#CBD5E1',
              borderRadius: '6px'
            }}
          >
            All Students ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('SHORTAGE')}
            className="btn btn-sm"
            style={{
              fontSize: '0.775rem',
              fontWeight: 800,
              padding: '0.35rem 0.85rem',
              background: activeSubTab === 'SHORTAGE' ? '#DC2626' : '#FEE2E2',
              color: activeSubTab === 'SHORTAGE' ? '#FFFFFF' : '#991B1B',
              borderColor: activeSubTab === 'SHORTAGE' ? '#DC2626' : '#FECACA',
              borderRadius: '6px'
            }}
          >
            Attendance Shortage ({shortageCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('AT_RISK')}
            className="btn btn-sm"
            style={{
              fontSize: '0.775rem',
              fontWeight: 800,
              padding: '0.35rem 0.85rem',
              background: activeSubTab === 'AT_RISK' ? '#D97706' : '#FEF3C7',
              color: activeSubTab === 'AT_RISK' ? '#FFFFFF' : '#92400E',
              borderColor: activeSubTab === 'AT_RISK' ? '#D97706' : '#FDE68A',
              borderRadius: '6px'
            }}
          >
            At Risk ({atRiskCount})
          </button>
        </div>

        {/* Export and Selection Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {selectedStudentIds.length > 0 && (
            <div style={{
              background: 'rgba(243, 112, 35, 0.1)',
              border: '1px solid #FDBA74',
              padding: '0.35rem 0.75rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--brand-navy)'
            }}>
              {selectedStudentIds.length} students selected
              <button
                type="button"
                onClick={handleClearSelection}
                style={{ background: 'none', border: 'none', color: '#DC2626', marginLeft: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.75rem' }}
              >
                ✕ Clear
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleExportDataGrid}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.775rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <FileSpreadsheet size={14} color="#10B981" /> Export Students (.xlsx)
          </button>
        </div>

      </div>

      {/* ─── 2. Multi-Parameter Excel-Style Filter Bar ───────────────────── */}
      <div className="card" style={{ padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem', alignItems: 'center' }}>
          
          {/* Search */}
          <div style={{ position: 'relative', minWidth: '180px', gridColumn: 'span 2' }}>
            <input
              type="text"
              placeholder="Search student name, enrollment number, section..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-control"
              style={{ height: '32px', fontSize: '0.78125rem', paddingLeft: '1.85rem' }}
            />
            <Search size={13} color="#94A3B8" style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Program */}
          <select
            value={selectedProgramFilter}
            onChange={e => setSelectedProgramFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Programs</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>{p.code}</option>
            ))}
          </select>

          {/* Semester */}
          <select
            value={selectedSemesterFilter}
            onChange={e => setSelectedSemesterFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={String(s)}>Sem {s}</option>
            ))}
          </select>

          {/* Section / Division */}
          <select
            value={selectedSectionFilter}
            onChange={e => setSelectedSectionFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Sections</option>
            <option value="Div A">Div A</option>
            <option value="Div B">Div B</option>
            <option value="Div C">Div C</option>
            <option value="Div D">Div D</option>
          </select>

          {/* Attendance */}
          <select
            value={selectedAttendanceFilter}
            onChange={e => setSelectedAttendanceFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Attendance</option>
            <option value="SAFE">Safe (≥ 75%)</option>
            <option value="SHORTAGE">Shortage (60% - 74%)</option>
            <option value="CRITICAL">Critical (&lt; 60%)</option>
          </select>

          {/* Academic Status */}
          <select
            value={selectedAcademicStatusFilter}
            onChange={e => setSelectedAcademicStatusFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">Academic Status</option>
            <option value="GOOD_STANDING">Good Standing</option>
            <option value="AT_RISK">At Risk</option>
            <option value="CRITICAL_RISK">Critical Risk</option>
          </select>

          {/* Document Status */}
          <select
            value={selectedDocStatusFilter}
            onChange={e => setSelectedDocStatusFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">Document Status</option>
            <option value="ALL_VERIFIED">All Verified</option>
            <option value="PENDING">Pending</option>
            <option value="MISSING">Missing</option>
          </select>

          {/* Exam Eligibility */}
          <select
            value={selectedExamEligibilityFilter}
            onChange={e => setSelectedExamEligibilityFilter(e.target.value)}
            className="form-control"
            style={{ height: '32px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">Exam Eligibility</option>
            <option value="ELIGIBLE">Eligible</option>
            <option value="PROVISIONAL">Provisional</option>
            <option value="SHORTAGE">Shortage</option>
          </select>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="btn btn-outline btn-sm"
            style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}
            title="Reset Filters to Default"
          >
            <RotateCcw size={12} /> Reset
          </button>

        </div>
      </div>

      {/* ─── 3. Main Student Excel-Style Data Table ──────────────────────── */}
      <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{ 
          overflowX: 'auto', 
          maxHeight: '620px',
          overflowY: 'auto'
        }}>
          <table style={{ width: '100%', minWidth: '1150px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                
                {/* 1. Select Checkbox */}
                <th style={{ width: '45px', padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  <input
                    type="checkbox"
                    checked={isAllVisibleSelected}
                    onChange={handleToggleSelectAllVisible}
                    title="Select All Visible Students"
                    style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                  />
                </th>

                {/* 2. Student Name & Enrollment No. */}
                <th 
                  onClick={() => handleSort('studentName')}
                  style={{ width: '220px', padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>STUDENT NAME &amp; ENROLLMENT NO.</span>
                    {sortField === 'studentName' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 3. Program */}
                <th 
                  onClick={() => handleSort('programCode')}
                  style={{ width: '110px', padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>PROGRAM</span>
                    {sortField === 'programCode' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 4. Semester */}
                <th 
                  onClick={() => handleSort('semesterNumber')}
                  style={{ width: '85px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>SEMESTER</span>
                    {sortField === 'semesterNumber' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 5. Section */}
                <th 
                  onClick={() => handleSort('sectionName')}
                  style={{ width: '130px', padding: '0.65rem 0.6rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>SECTION</span>
                    {sortField === 'sectionName' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 6. Attendance % */}
                <th 
                  onClick={() => handleSort('attendancePercentage')}
                  style={{ width: '110px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>ATTENDANCE %</span>
                    {sortField === 'attendancePercentage' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 7. Academic Status */}
                <th 
                  onClick={() => handleSort('academicStatus')}
                  style={{ width: '135px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>ACADEMIC STATUS</span>
                    {sortField === 'academicStatus' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 8. Document Status */}
                <th 
                  onClick={() => handleSort('documentStatus')}
                  style={{ width: '130px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>DOCUMENT STATUS</span>
                    {sortField === 'documentStatus' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 9. Exam Eligibility */}
                <th 
                  onClick={() => handleSort('examEligibility')}
                  style={{ width: '130px', padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>EXAM ELIGIBILITY</span>
                    {sortField === 'examEligibility' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>

                {/* 10. Actions Column (Sticky Right) */}
                <th style={{ width: '110px', padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>
                  ACTIONS
                </th>

              </tr>
            </thead>

            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertCircle size={32} color="#94A3B8" />
                      <strong style={{ fontSize: '0.925rem', color: 'var(--brand-navy)' }}>No students match your criteria</strong>
                      <p style={{ margin: 0, fontSize: '0.78125rem' }}>
                        Try clearing search terms or reset filters to view all {totalCount} department students.
                      </p>
                      <button onClick={handleResetFilters} className="btn btn-sm btn-secondary" style={{ marginTop: '0.4rem', fontSize: '0.75rem' }}>
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, index) => {
                  const isSelected = selectedStudentIds.includes(row.student.id);
                  const isShortage = row.hasShortage;
                  const isRisk = row.isRisk;

                  const rowBg = isSelected 
                    ? 'rgba(243, 112, 35, 0.08)' 
                    : isShortage 
                    ? '#FFFBEB' 
                    : index % 2 === 0 ? '#FFFFFF' : '#FAFCFF';

                  return (
                    <tr
                      key={row.student.id}
                      onClick={() => onSelectStudentForProfile(row.student)}
                      style={{
                        background: rowBg,
                        borderBottom: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease'
                      }}
                      className="table-row-hover"
                    >
                      {/* 1. Select Checkbox */}
                      <td 
                        style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectStudent(row.student.id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>

                      {/* 2. Student Name & Enrollment No. */}
                      <td style={{ padding: '0.6rem 0.75rem', borderRight: '1px solid #E2E8F0' }}>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.84rem' }}>
                          {row.student.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-orange, #F37023)', fontWeight: 700, fontFamily: 'monospace', marginTop: '1px' }}>
                          {row.student.enrollmentNo}
                        </div>
                      </td>

                      {/* 3. Program */}
                      <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                          {row.programCode}
                        </span>
                      </td>

                      {/* 4. Semester */}
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#334155' }}>
                        Sem {row.semesterNumber}
                      </td>

                      {/* 5. Section */}
                      <td style={{ padding: '0.6rem 0.6rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                          {row.sectionName}
                        </span>
                      </td>

                      {/* 6. Attendance % */}
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {renderAttendanceBadge(row.attendancePercentage)}
                      </td>

                      {/* 7. Academic Status */}
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {renderAcademicStatusBadge(row.academicStatus)}
                      </td>

                      {/* 8. Document Status */}
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {renderDocumentStatusBadge(row.documentStatus)}
                      </td>

                      {/* 9. Exam Eligibility */}
                      <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        {renderExamEligibilityBadge(row.examEligibility)}
                      </td>

                      {/* 10. Actions Column */}
                      <td 
                        style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => onSelectStudentForProfile(row.student)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Edit / View Student Profile"
                          >
                            <Edit3 size={11} /> Edit
                          </button>

                          <StudentRowActionMenu
                            student={row.student}
                            statusLevel={
                              (row.attendancePercentage < 60 || row.hasMissingDocs)
                                ? 'critical'
                                : row.attendancePercentage < 75
                                ? 'warning'
                                : 'good'
                            }
                            onViewProfile={() => onSelectStudentForProfile(row.student)}
                            onViewAcademic={() => onSelectStudentForProfile(row.student)}
                            onViewAttendance={() => onSelectStudentForProfile(row.student)}
                            onViewDocuments={() => onSelectStudentForProfile(row.student)}
                            onViewExamination={() => onSelectStudentForProfile(row.student)}
                            onViewRequests={() => onSelectStudentForProfile(row.student)}
                          />
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 4. Table Pagination & Summary Footer ────────────────────────── */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 1rem', 
          background: '#F8FAFC', 
          borderTop: '1px solid #CBD5E1', 
          fontSize: '0.8125rem',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ color: '#64748B' }}>
            Showing <strong>{totalFilteredCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}</strong>–<strong>{Math.min(currentPage * pageSize, totalFilteredCount)}</strong> of <strong>{totalFilteredCount}</strong> students
            {totalFilteredCount !== totalCount && (
              <span style={{ marginLeft: '4px', color: '#94A3B8' }}>(filtered from {totalCount} total)</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Rows per page:</span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="form-control"
                style={{ width: '70px', height: '28px', fontSize: '0.75rem', padding: '0 0.4rem' }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.4rem' }}
                title="First Page"
              >
                <ChevronsLeft size={13} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.4rem' }}
                title="Previous Page"
              >
                <ChevronLeft size={13} />
              </button>

              <span style={{ padding: '0 0.4rem', fontWeight: 700, color: 'var(--brand-navy)', fontSize: '0.75rem' }}>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.4rem' }}
                title="Next Page"
              >
                <ChevronRight size={13} />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-outline btn-sm"
                style={{ padding: '0.2rem 0.4rem' }}
                title="Last Page"
              >
                <ChevronsRight size={13} />
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
