import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { examEligibilityService, ExamEligibilityRecord } from '../../services/examEligibilityService';
import { can } from '../../services/userAccountManagementService';
import { Badge } from '../common/Badge';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { Student } from '../../types';
import {
  Award, CheckCircle2, AlertTriangle, XCircle, Clock, Search,
  Filter, RotateCcw, Download, Eye, FileSpreadsheet, Send,
  ShieldCheck, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft,
  ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw,
  MessageSquare, UserCheck, AlertCircle, History, CheckCheck
} from 'lucide-react';

export interface MenteeExamEligibilityManagerProps {
  onNavigateToCondonations?: () => void;
}

export const MenteeExamEligibilityManager: React.FC<MenteeExamEligibilityManagerProps> = ({
  onNavigateToCondonations
}) => {
  const { user, role } = useAuth();

  // Central RBAC Permissions
  const canView = can(user, 'EXAM_ELIGIBILITY', 'VIEW') || (role === 'MENTOR' || role === 'FACULTY' || role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR' || role === 'EXAM_CELL');
  const canExport = can(user, 'EXAM_ELIGIBILITY', 'EXPORT') || (role === 'MENTOR' || role === 'FACULTY' || role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR');
  const canMentorEndorse = can(user, 'EXAM_ELIGIBILITY', 'APPROVE') || (role === 'MENTOR' || role === 'FACULTY' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR');
  const canHODApprove = can(user, 'EXAM_ELIGIBILITY', 'APPROVE') && (role === 'HOD' || role === 'SUPER_ADMIN' || role === 'ERP_COORDINATOR' || role === 'PRINCIPAL');

  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedProgFilter, setSelectedProgFilter] = useState('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-27');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('ALL');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('ALL');
  const [selectedAttendanceStatus, setSelectedAttendanceStatus] = useState('ALL');
  const [selectedEligibilityStatus, setSelectedEligibilityStatus] = useState('ALL');
  const [selectedFacultyEndorsement, setSelectedFacultyEndorsement] = useState('ALL');
  const [selectedMentorEndorsement, setSelectedMentorEndorsement] = useState('ALL');
  const [selectedHODApproval, setSelectedHODApproval] = useState('ALL');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<keyof ExamEligibilityRecord>('attendancePercentage');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Modal States
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);

  // 1. View Eligibility Detail Modal
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<ExamEligibilityRecord | null>(null);

  // 2. Submit Mentor Endorsement Modal
  const [endorseModalOpen, setEndorseModalOpen] = useState(false);
  const [selectedRecordForEndorse, setSelectedRecordForEndorse] = useState<ExamEligibilityRecord | null>(null);
  const [endorseStatus, setEndorseStatus] = useState<'RECOMMENDED' | 'NOT_RECOMMENDED'>('RECOMMENDED');
  const [endorseRemarks, setEndorseRemarks] = useState('');
  const [isSubmittingEndorsement, setIsSubmittingEndorsement] = useState(false);

  // 3. Submit HOD Approval Modal
  const [hodApprovalModalOpen, setHodApprovalModalOpen] = useState(false);
  const [selectedRecordForHOD, setSelectedRecordForHOD] = useState<ExamEligibilityRecord | null>(null);
  const [hodDecision, setHodDecision] = useState<'APPROVED' | 'REJECTED' | 'CORRECTION_REQUESTED'>('APPROVED');
  const [hodRemarks, setHodRemarks] = useState('');
  const [isSubmittingHOD, setIsSubmittingHOD] = useState(false);

  // 4. View Approval History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedRecordForHistory, setSelectedRecordForHistory] = useState<ExamEligibilityRecord | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Master Options
  const departments = useMemo(() => db.getDepartments(), []);
  const programs = useMemo(() => db.getPrograms(), []);

  // Fetch Exam Eligibility Ledger Scoped to Authenticated User
  const rawLedger = useMemo(() => {
    void refreshKey;
    if (!user) return [];
    try {
      return examEligibilityService.getExamEligibilityLedger(user, {
        searchQuery,
        departmentId: selectedDeptFilter,
        programId: selectedProgFilter,
        academicYear: selectedAcademicYear,
        semesterNumber: selectedSemesterFilter,
        divisionName: selectedDivisionFilter,
        attendanceStatus: selectedAttendanceStatus,
        eligibilityStatus: selectedEligibilityStatus,
        facultyEndorsementStatus: selectedFacultyEndorsement,
        mentorEndorsementStatus: selectedMentorEndorsement,
        hodApprovalStatus: selectedHODApproval
      });
    } catch (err: any) {
      console.error('Error fetching exam eligibility ledger:', err);
      return [];
    }
  }, [
    user, refreshKey, searchQuery, selectedDeptFilter, selectedProgFilter,
    selectedAcademicYear, selectedSemesterFilter, selectedDivisionFilter,
    selectedAttendanceStatus, selectedEligibilityStatus, selectedFacultyEndorsement,
    selectedMentorEndorsement, selectedHODApproval
  ]);

  // Dynamic KPI Stats Calculation from Real Data
  const kpiStats = useMemo(() => {
    const total = rawLedger.length;
    const eligible = rawLedger.filter(r => r.finalEligibility === 'ELIGIBLE').length;
    const pending = rawLedger.filter(r => r.finalEligibility === 'PENDING_APPROVAL').length;
    const condonation = rawLedger.filter(r => r.finalEligibility === 'CONDONATION_REQUIRED' || r.finalEligibility === 'CONDITIONAL').length;
    const notEligible = rawLedger.filter(r => r.finalEligibility === 'NOT_ELIGIBLE' || r.finalEligibility === 'REJECTED').length;

    return { total, eligible, pending, condonation, notEligible };
  }, [rawLedger]);

  // Sorted Records
  const sortedRecords = useMemo(() => {
    const data = [...rawLedger];
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
  }, [rawLedger, sortField, sortDirection]);

  // Paginated Records
  const totalRecords = sortedRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery, selectedDeptFilter, selectedProgFilter, selectedSemesterFilter,
    selectedDivisionFilter, selectedAttendanceStatus, selectedEligibilityStatus,
    selectedFacultyEndorsement, selectedMentorEndorsement, selectedHODApproval, pageSize
  ]);

  const handleSort = (field: keyof ExamEligibilityRecord) => {
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
    setSelectedAttendanceStatus('ALL');
    setSelectedEligibilityStatus('ALL');
    setSelectedFacultyEndorsement('ALL');
    setSelectedMentorEndorsement('ALL');
    setSelectedHODApproval('ALL');
    setSortField('attendancePercentage');
    setSortDirection('asc');
    setCurrentPage(1);
    showToast('info', 'Filters reset to default view.');
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export exam eligibility records.');
      return;
    }
    try {
      examEligibilityService.exportLedgerToExcel(sortedRecords);
      showToast('success', `Exported ${sortedRecords.length} exam eligibility records to Excel!`);
    } catch (err: any) {
      console.error('Failed to export Excel:', err);
      showToast('error', 'Failed to generate Excel export.');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!canExport) {
      showToast('error', 'You do not have permission to export exam eligibility records.');
      return;
    }
    try {
      examEligibilityService.exportLedgerToCSV(sortedRecords);
      showToast('success', `Exported CSV successfully!`);
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      showToast('error', 'Failed to generate CSV export.');
    }
  };

  // Open Endorsement Modal
  const handleOpenEndorsement = (record: ExamEligibilityRecord) => {
    setSelectedRecordForEndorse(record);
    setEndorseStatus(record.attendancePercentage >= 75 ? 'RECOMMENDED' : 'RECOMMENDED');
    setEndorseRemarks(record.mentorEndorsement.remarks || (record.attendancePercentage >= 75 ? 'Recommended for Semester End Examination.' : 'Attendance shortage noted; recommended for condonation.'));
    setEndorseModalOpen(true);
  };

  // Submit Mentor Endorsement
  const handleSubmitEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRecordForEndorse) return;

    try {
      setIsSubmittingEndorsement(true);
      examEligibilityService.submitMentorEndorsement(user, {
        studentId: selectedRecordForEndorse.studentId,
        status: endorseStatus,
        remarks: endorseRemarks
      });

      setRefreshKey(prev => prev + 1);
      setEndorseModalOpen(false);
      showToast('success', `Mentor endorsement for ${selectedRecordForEndorse.studentName} recorded successfully!`);
    } catch (err: any) {
      console.error('Error submitting mentor endorsement:', err);
      showToast('error', err.message || 'Failed to submit mentor endorsement.');
    } finally {
      setIsSubmittingEndorsement(false);
    }
  };

  // Open HOD Decision Modal
  const handleOpenHODDecision = (record: ExamEligibilityRecord) => {
    setSelectedRecordForHOD(record);
    setHodDecision(record.attendancePercentage >= 75 ? 'APPROVED' : 'APPROVED');
    setHodRemarks(record.hodApproval.remarks || (record.attendancePercentage >= 75 ? 'Admitted to Semester Examination.' : 'Approved on condonation basis.'));
    setHodApprovalModalOpen(true);
  };

  // Submit HOD Decision
  const handleSubmitHODDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRecordForHOD) return;

    try {
      setIsSubmittingHOD(true);
      examEligibilityService.submitHODApproval(user, {
        studentId: selectedRecordForHOD.studentId,
        status: hodDecision,
        remarks: hodRemarks
      });

      setRefreshKey(prev => prev + 1);
      setHodApprovalModalOpen(false);
      showToast('success', `HOD decision for ${selectedRecordForHOD.studentName} saved as ${hodDecision}!`);
    } catch (err: any) {
      console.error('Error submitting HOD decision:', err);
      showToast('error', err.message || 'Failed to submit HOD decision.');
    } finally {
      setIsSubmittingHOD(false);
    }
  };

  if (!canView) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '10px' }}>
        <ShieldCheck size={56} color="#EF4444" style={{ margin: '0 auto 1.25rem' }} />
        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
          Access Restricted: Exam Eligibility Register
        </h3>
        <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0.5rem auto 1.5rem', lineHeight: 1.6 }}>
          You do not have authorization to view this register. Please contact your Department HOD or Central ERP Coordinator to request permissions.
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

      {/* ─── 1. Header Banner & Action Strip ────────────────────────────── */}
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
              <Award size={24} color="#F37023" />
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.2px' }}>
                Centralized Exam Eligibility Register &amp; Endorsement Ledger
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: '0.825rem', color: '#94A3B8' }}>
              Statutory 4-Tier Examination Clearance: Attendance Check → Faculty Endorsement → Mentor Endorsement → HOD Approval
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setRefreshKey(prev => prev + 1);
                showToast('info', 'Refreshed latest exam eligibility data.');
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
              title="Refresh ledger records"
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
                <CheckCheck size={14} /> Condonation Approvals →
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

      {/* ─── 2. Top Summary Dynamic KPI Cards ────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="TOTAL ASSIGNED MENTEES"
          value={kpiStats.total}
          icon={UserCheck}
          colorScheme="navy"
          description={`Assigned to ${user?.name || 'Mentor'}`}
        />
        <StatCard
          title="EXAM ELIGIBLE"
          value={kpiStats.eligible}
          icon={CheckCircle2}
          colorScheme="green"
          description="Full clearance granted"
        />
        <StatCard
          title="PENDING APPROVAL"
          value={kpiStats.pending}
          icon={Clock}
          colorScheme="gold"
          description="In endorsement pipeline"
        />
        <StatCard
          title="CONDONATION REQUIRED"
          value={kpiStats.condonation}
          icon={AlertTriangle}
          colorScheme="orange"
          description="Attendance shortage under review"
        />
        <StatCard
          title="NOT ELIGIBLE / REJECTED"
          value={kpiStats.notEligible}
          icon={XCircle}
          colorScheme="orange"
          description="Debarred from exam"
        />
      </div>

      {/* ─── 3. Multi-Parameter Excel-Style Filter Bar ───────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.925rem' }}>
            <Filter size={18} color="var(--brand-orange)" />
            <span>Excel-Style Register Filters</span>
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
          
          {/* Search */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Search Student
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Name, Enrollment ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.8125rem' }}
              />
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          {/* Department */}
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

          {/* Program */}
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

          {/* Semester */}
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

          {/* Division */}
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
              <option value="GOOD_STANDING">Good Standing (≥ 75%)</option>
              <option value="SHORTAGE">Shortage (60% - 74%)</option>
              <option value="CRITICAL">Critical Shortage (&lt; 60%)</option>
            </select>
          </div>

          {/* Final Eligibility */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Final Eligibility
            </label>
            <select
              className="form-control"
              value={selectedEligibilityStatus}
              onChange={e => setSelectedEligibilityStatus(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All Eligibility</option>
              <option value="ELIGIBLE">Eligible (Cleared)</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="CONDONATION_REQUIRED">Condonation Required</option>
              <option value="CONDITIONAL">Conditional</option>
              <option value="NOT_ELIGIBLE">Not Eligible</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Mentor Endorsement */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              Mentor Endorsement
            </label>
            <select
              className="form-control"
              value={selectedMentorEndorsement}
              onChange={e => setSelectedMentorEndorsement(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All States</option>
              <option value="RECOMMENDED">Recommended</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_RECOMMENDED">Not Recommended</option>
            </select>
          </div>

          {/* HOD Approval */}
          <div>
            <label className="form-label" style={{ fontSize: '0.725rem', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
              HOD Approval
            </label>
            <select
              className="form-control"
              value={selectedHODApproval}
              onChange={e => setSelectedHODApproval(e.target.value)}
              style={{ height: '36px', fontSize: '0.8125rem' }}
            >
              <option value="ALL">All States</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="CORRECTION_REQUESTED">Correction Requested</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─── 4. Excel-Style Responsive Register Table ───────────────────── */}
      <div className="card" style={{ padding: '1.25rem', borderRadius: '8px', overflow: 'hidden' }}>
        
        {/* Strip Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '1rem' }}>
              Official Examination Admittance Ledger
            </span>
            <Badge variant="navy">{totalRecords} Students</Badge>
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
          <table style={{ width: '100%', minWidth: '1550px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#0B192C', color: '#FFFFFF' }}>
                <th style={{ width: '45px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  #
                </th>
                <th 
                  onClick={() => handleSort('studentName')}
                  style={{ width: '180px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>STUDENT NAME</span>
                    {sortField === 'studentName' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('enrollmentNo')}
                  style={{ width: '135px', padding: '0.75rem 0.75rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>ENROLLMENT ID</span>
                    {sortField === 'enrollmentNo' ? (sortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={13} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th style={{ width: '85px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  PROGRAM
                </th>
                <th style={{ width: '150px', padding: '0.75rem 0.6rem', textAlign: 'left', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  DEPARTMENT
                </th>
                <th style={{ width: '70px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  SEM
                </th>
                <th style={{ width: '70px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  DIV
                </th>
                <th style={{ width: '85px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  ACAD YEAR
                </th>
                <th 
                  onClick={() => handleSort('attendancePercentage')}
                  style={{ width: '100px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                    <span>ATTEND %</span>
                    {sortField === 'attendancePercentage' ? (sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                  </div>
                </th>
                <th style={{ width: '75px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  REQ %
                </th>
                <th style={{ width: '110px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  ATTEND STATUS
                </th>
                <th style={{ width: '125px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  FACULTY ENDORSE
                </th>
                <th style={{ width: '125px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  MENTOR ENDORSE
                </th>
                <th style={{ width: '135px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  HOD APPROVAL
                </th>
                <th style={{ width: '145px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  FINAL ELIGIBILITY
                </th>
                <th style={{ width: '95px', padding: '0.75rem 0.5rem', textAlign: 'center', fontWeight: 800, borderRight: '1px solid rgba(255,255,255,0.15)' }}>
                  LAST UPDATED
                </th>
                <th style={{ width: '170px', padding: '0.75rem 0.6rem', textAlign: 'center', fontWeight: 800 }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={17} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={36} color="#94A3B8" />
                      <strong style={{ fontSize: '1rem', color: 'var(--brand-navy)' }}>No exam eligibility records found</strong>
                      <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                        Try clearing search filters or ensure student mentees have been assigned by your HOD.
                      </p>
                      <button onClick={handleResetFilters} className="btn btn-sm btn-secondary" style={{ marginTop: '0.5rem' }}>
                        Reset Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((row, index) => {
                  const isEligible = row.finalEligibility === 'ELIGIBLE';
                  const isPending = row.finalEligibility === 'PENDING_APPROVAL';
                  const isCondonation = row.finalEligibility === 'CONDONATION_REQUIRED' || row.finalEligibility === 'CONDITIONAL';
                  const isRejected = row.finalEligibility === 'REJECTED' || row.finalEligibility === 'NOT_ELIGIBLE';

                  const rowBg = isRejected 
                    ? '#FEF2F2' 
                    : isCondonation 
                    ? '#FFFBEB' 
                    : isEligible 
                    ? '#F0FDF4' 
                    : index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';

                  return (
                    <tr 
                      key={row.id}
                      style={{ 
                        background: rowBg, 
                        borderBottom: '1px solid #E2E8F0',
                        fontWeight: isEligible ? 600 : 400
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
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                          {row.programCode}
                        </span>
                      </td>

                      {/* Department */}
                      <td style={{ padding: '0.65rem 0.6rem', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', color: '#475569' }}>
                        {row.departmentName.replace('Department of ', '')}
                      </td>

                      {/* Semester */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700 }}>
                        Sem {row.semesterNumber}
                      </td>

                      {/* Division */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', color: '#475569' }}>
                        {row.divisionName}
                      </td>

                      {/* Academic Year */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                        {row.academicYear}
                      </td>

                      {/* Attendance % */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{ 
                          fontSize: '0.925rem', 
                          fontWeight: 900, 
                          color: row.attendancePercentage >= 75 ? '#15803D' : (row.attendancePercentage >= 60 ? '#D97706' : '#DC2626') 
                        }}>
                          {row.attendancePercentage}%
                        </span>
                      </td>

                      {/* Required % */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0', fontWeight: 700, color: '#475569' }}>
                        {row.requiredPercentage}%
                      </td>

                      {/* Attendance Status */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: row.attendanceStatus === 'GOOD_STANDING' ? '#DCFCE7' : row.attendanceStatus === 'SHORTAGE' ? '#FEF3C7' : '#FEE2E2',
                          color: row.attendanceStatus === 'GOOD_STANDING' ? '#15803D' : row.attendanceStatus === 'SHORTAGE' ? '#B45309' : '#B91C1C'
                        }}>
                          {row.attendanceStatus === 'GOOD_STANDING' ? 'GOOD' : row.attendanceStatus === 'SHORTAGE' ? 'SHORTAGE' : 'CRITICAL'}
                        </span>
                      </td>

                      {/* Faculty Endorsement */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: row.facultyEndorsement.status === 'RECOMMENDED' ? '#DCFCE7' : row.facultyEndorsement.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                          color: row.facultyEndorsement.status === 'RECOMMENDED' ? '#15803D' : row.facultyEndorsement.status === 'PENDING' ? '#B45309' : '#B91C1C'
                        }}>
                          {row.facultyEndorsement.status}
                        </span>
                      </td>

                      {/* Mentor Endorsement */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: row.mentorEndorsement.status === 'RECOMMENDED' ? '#DCFCE7' : row.mentorEndorsement.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                          color: row.mentorEndorsement.status === 'RECOMMENDED' ? '#15803D' : row.mentorEndorsement.status === 'PENDING' ? '#B45309' : '#B91C1C'
                        }}>
                          {row.mentorEndorsement.status}
                        </span>
                      </td>

                      {/* HOD Approval */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.6875rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: row.hodApproval.status === 'APPROVED' ? '#DCFCE7' : row.hodApproval.status === 'PENDING' ? '#FEF3C7' : '#FEE2E2',
                          color: row.hodApproval.status === 'APPROVED' ? '#15803D' : row.hodApproval.status === 'PENDING' ? '#B45309' : '#B91C1C'
                        }}>
                          {row.hodApproval.status}
                        </span>
                      </td>

                      {/* Final Eligibility */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', borderRight: '1px solid #E2E8F0' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 900,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          background: isEligible ? '#DCFCE7' : isPending ? '#FEF3C7' : isCondonation ? '#FFFBEB' : '#FEE2E2',
                          color: isEligible ? '#15803D' : isPending ? '#B45309' : isCondonation ? '#D97706' : '#B91C1C',
                          border: `1px solid ${isEligible ? '#86EFAC' : isPending ? '#FDE68A' : isCondonation ? '#FCD34D' : '#FECACA'}`
                        }}>
                          {row.finalEligibility.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Last Updated */}
                      <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontFamily: 'monospace', fontSize: '0.75rem', color: '#64748B', borderRight: '1px solid #E2E8F0' }}>
                        {row.lastUpdated}
                      </td>

                      {/* Actions Column */}
                      <td style={{ padding: '0.65rem 0.6rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          
                          {/* 1. View Eligibility Detail */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecordForDetail(row);
                              setDetailModalOpen(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', fontWeight: 700 }}
                            title="View Full Eligibility 360 &amp; Endorsement Timeline"
                          >
                            <Eye size={12} style={{ marginRight: '2px' }} /> View
                          </button>

                          {/* 2. Submit Mentor Endorsement */}
                          {canMentorEndorse && (
                            <button
                              type="button"
                              onClick={() => handleOpenEndorsement(row)}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.7rem', padding: '0.25rem 0.45rem', fontWeight: 700 }}
                              title="Submit Mentor Endorsement"
                            >
                              <UserCheck size={12} style={{ marginRight: '2px' }} /> Endorse
                            </button>
                          )}

                          {/* 3. HOD Decision */}
                          {canHODApprove && (
                            <button
                              type="button"
                              onClick={() => handleOpenHODDecision(row)}
                              className="btn btn-primary btn-sm"
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.25rem 0.45rem', 
                                fontWeight: 700,
                                background: 'var(--brand-orange)',
                                borderColor: 'var(--brand-orange)'
                              }}
                              title="HOD Clearance Decision"
                            >
                              <ShieldCheck size={12} style={{ marginRight: '2px' }} /> HOD
                            </button>
                          )}

                          {/* 4. History */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRecordForHistory(row);
                              setHistoryModalOpen(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.35rem', color: '#64748B' }}
                            title="View Approval History"
                          >
                            <History size={12} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalRecords > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <div style={{ color: '#64748B' }}>
              Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of <strong>{totalRecords}</strong> students
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

      {/* ─── 5. MODAL: View Detailed Eligibility ────────────────────────── */}
      {detailModalOpen && selectedRecordForDetail && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => setDetailModalOpen(false)}
          title="Examination Admittance &amp; Endorsement Dossier"
          maxWidth="850px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Student Info Bar */}
            <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                  {selectedRecordForDetail.studentName}
                </h4>
                <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.2rem' }}>
                  Enrollment ID: <strong style={{ color: 'var(--brand-orange)' }}>{selectedRecordForDetail.enrollmentNo}</strong> • {selectedRecordForDetail.programCode} (Sem {selectedRecordForDetail.semesterNumber}, {selectedRecordForDetail.divisionName})
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', textAlign: 'center' }}>
                <div style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>ATTENDANCE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 900, color: selectedRecordForDetail.attendancePercentage >= 75 ? '#15803D' : '#DC2626' }}>
                    {selectedRecordForDetail.attendancePercentage}%
                  </div>
                </div>
                <div style={{ padding: '0.35rem 0.75rem', background: '#FFFFFF', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>FINAL STATUS</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 900, color: selectedRecordForDetail.finalEligibility === 'ELIGIBLE' ? '#15803D' : '#DC2626' }}>
                    {selectedRecordForDetail.finalEligibility.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Official Justification Alert */}
            <div style={{ 
              background: selectedRecordForDetail.finalEligibility === 'ELIGIBLE' ? '#F0FDF4' : '#FFFBEB', 
              border: `1px solid ${selectedRecordForDetail.finalEligibility === 'ELIGIBLE' ? '#BBF7D0' : '#FDE68A'}`,
              padding: '0.85rem 1rem', 
              borderRadius: '6px',
              fontSize: '0.8125rem'
            }}>
              <strong style={{ color: selectedRecordForDetail.finalEligibility === 'ELIGIBLE' ? '#166534' : '#92400E' }}>
                Admittance Rule Evaluation:
              </strong>
              <div style={{ marginTop: '0.2rem', color: selectedRecordForDetail.finalEligibility === 'ELIGIBLE' ? '#15803D' : '#B45309' }}>
                {selectedRecordForDetail.finalEligibilityReason}
              </div>
            </div>

            {/* 4-Tier Endorsement Timeline */}
            <div style={{ border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
              <h5 style={{ margin: '0 0 0.85rem', fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                Multi-Tier Clearance &amp; Endorsement Timeline
              </h5>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                
                {/* 1. Faculty */}
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>1. FACULTY ENDORSEMENT</span>
                    <Badge variant={selectedRecordForDetail.facultyEndorsement.status === 'RECOMMENDED' ? 'active' : 'warning'}>
                      {selectedRecordForDetail.facultyEndorsement.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.35rem' }}>
                    <strong>{selectedRecordForDetail.facultyEndorsement.facultyName || 'Course Faculty'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{selectedRecordForDetail.facultyEndorsement.remarks || 'No remarks logged'}"
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                    {selectedRecordForDetail.facultyEndorsement.timestamp || '—'}
                  </div>
                </div>

                {/* 2. Mentor */}
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>2. MENTOR ENDORSEMENT</span>
                    <Badge variant={selectedRecordForDetail.mentorEndorsement.status === 'RECOMMENDED' ? 'active' : 'warning'}>
                      {selectedRecordForDetail.mentorEndorsement.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.35rem' }}>
                    <strong>{selectedRecordForDetail.mentorEndorsement.mentorName || 'Assigned Mentor'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{selectedRecordForDetail.mentorEndorsement.remarks || 'No remarks logged'}"
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                    {selectedRecordForDetail.mentorEndorsement.timestamp || '—'}
                  </div>
                </div>

                {/* 3. HOD Approval */}
                <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>3. HOD / HOI APPROVAL</span>
                    <Badge variant={selectedRecordForDetail.hodApproval.status === 'APPROVED' ? 'active' : selectedRecordForDetail.hodApproval.status === 'PENDING' ? 'warning' : 'danger'}>
                      {selectedRecordForDetail.hodApproval.status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '0.35rem' }}>
                    <strong>{selectedRecordForDetail.hodApproval.approverName || 'Department HOD'}</strong>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem', fontStyle: 'italic' }}>
                    "{selectedRecordForDetail.hodApproval.remarks || 'Awaiting final sign-off'}"
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.35rem' }}>
                    {selectedRecordForDetail.hodApproval.timestamp || '—'}
                  </div>
                </div>

              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDetailModalOpen(false)}
              >
                Close Dossier
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── 6. MODAL: Submit Mentor Endorsement ─────────────────────────── */}
      {endorseModalOpen && selectedRecordForEndorse && (
        <Modal
          isOpen={endorseModalOpen}
          onClose={() => setEndorseModalOpen(false)}
          title="Submit Mentor Examination Endorsement"
          maxWidth="600px"
        >
          <form onSubmit={handleSubmitEndorsement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                Student: {selectedRecordForEndorse.studentName} ({selectedRecordForEndorse.enrollmentNo})
              </div>
              <div style={{ color: '#475569', marginTop: '0.2rem' }}>
                Attendance: <strong>{selectedRecordForEndorse.attendancePercentage}%</strong> (Required: {selectedRecordForEndorse.requiredPercentage}%) • Program: <strong>{selectedRecordForEndorse.programCode} Sem {selectedRecordForEndorse.semesterNumber}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Endorsement Recommendation *
              </label>
              <select
                className="form-control"
                value={endorseStatus}
                onChange={e => setEndorseStatus(e.target.value as any)}
                required
              >
                <option value="RECOMMENDED">RECOMMENDED (Admit to Semester Examination)</option>
                <option value="NOT_RECOMMENDED">NOT RECOMMENDED (Debar / Retain for Review)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                Mentor Observations &amp; Academic Remarks *
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={endorseRemarks}
                onChange={e => setEndorseRemarks(e.target.value)}
                placeholder="State your observations on mentee attendance, sincerity, and condonation rationale..."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setEndorseModalOpen(false)}
                disabled={isSubmittingEndorsement}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'var(--brand-orange, #F37023)', borderColor: 'var(--brand-orange, #F37023)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                disabled={isSubmittingEndorsement}
              >
                <Send size={14} /> {isSubmittingEndorsement ? 'Submitting...' : 'Confirm Endorsement'}
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ─── 7. MODAL: Submit HOD Decision ──────────────────────────────── */}
      {hodApprovalModalOpen && selectedRecordForHOD && (
        <Modal
          isOpen={hodApprovalModalOpen}
          onClose={() => setHodApprovalModalOpen(false)}
          title="HOD / Dean Examination Clearance Decision"
          maxWidth="600px"
        >
          <form onSubmit={handleSubmitHODDecision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '0.8125rem' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                Student: {selectedRecordForHOD.studentName} ({selectedRecordForHOD.enrollmentNo})
              </div>
              <div style={{ color: '#475569', marginTop: '0.2rem' }}>
                Attendance: <strong>{selectedRecordForHOD.attendancePercentage}%</strong> • Faculty: <strong>{selectedRecordForHOD.facultyEndorsement.status}</strong> • Mentor: <strong>{selectedRecordForHOD.mentorEndorsement.status}</strong>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                HOD Decision *
              </label>
              <select
                className="form-control"
                value={hodDecision}
                onChange={e => setHodDecision(e.target.value as any)}
                required
              >
                <option value="APPROVED">APPROVED (Grant Final Examination Clearance)</option>
                <option value="REJECTED">REJECTED (Debar from Examination)</option>
                <option value="CORRECTION_REQUESTED">CORRECTION REQUESTED (Send back to Mentor)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 700 }}>
                HOD Official Orders / Remarks *
              </label>
              <textarea
                className="form-control"
                rows={4}
                value={hodRemarks}
                onChange={e => setHodRemarks(e.target.value)}
                placeholder="State official examination admittance order or grounds for rejection..."
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setHodApprovalModalOpen(false)}
                disabled={isSubmittingHOD}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ background: 'var(--brand-navy)', borderColor: 'var(--brand-navy)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                disabled={isSubmittingHOD}
              >
                <ShieldCheck size={14} /> {isSubmittingHOD ? 'Saving...' : 'Save HOD Order'}
              </button>
            </div>

          </form>
        </Modal>
      )}

      {/* ─── 8. MODAL: Approval & Audit History ──────────────────────────── */}
      {historyModalOpen && selectedRecordForHistory && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Exam Eligibility Audit &amp; Approval History"
          maxWidth="750px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>
                {selectedRecordForHistory.studentName} ({selectedRecordForHistory.enrollmentNo})
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                Complete statutory timeline of endorsements, status transitions, and administrative decisions
              </div>
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #CBD5E1', borderRadius: '6px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0B192C', color: '#FFFFFF' }}>
                  <tr>
                    <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', width: '45px' }}>#</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '120px' }}>TIMESTAMP</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '140px' }}>OFFICER</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', width: '120px' }}>ACTION</th>
                    <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left' }}>REMARKS / NOTES</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRecordForHistory.history.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                        No audit history logs recorded.
                      </td>
                    </tr>
                  ) : (
                    selectedRecordForHistory.history.map((h, idx) => (
                      <tr key={h.id || idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                        <td style={{ padding: '0.55rem 0.5rem', textAlign: 'center', color: '#64748B' }}>{idx + 1}</td>
                        <td style={{ padding: '0.55rem 0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>{h.timestamp}</td>
                        <td style={{ padding: '0.55rem 0.75rem' }}>
                          <div style={{ fontWeight: 700, color: 'var(--brand-navy)' }}>{h.performedByName}</div>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{h.performedByRole}</span>
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                            {h.action.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '0.55rem 0.75rem', color: '#475569', fontSize: '0.75rem' }}>
                          {h.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setHistoryModalOpen(false)}
              >
                Close History
              </button>
            </div>

          </div>
        </Modal>
      )}

      {/* ─── 9. MODAL: Student Profile 360 ──────────────────────────────── */}
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
