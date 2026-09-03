import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  departmentScopeService, 
  DepartmentGlobalFilters 
} from '../../services/departmentScopeService';
import { HODTabType } from '../../pages/campus/HODWorkspacePage';
import { 
  Building2, Users, UserCheck, BookOpen, Clock, Award, 
  CheckSquare, AlertCircle, AlertTriangle, FileText, CheckCircle2, 
  Search, Mail, Phone, Eye, ShieldCheck, FolderCheck, Lock, 
  XCircle, Download, Check, FileSpreadsheet, Plus, RefreshCw,
  BarChart3, MessageSquare, Calendar, ChevronRight, Filter, 
  RotateCcw, ArrowRight, Activity, TrendingUp, Layers, HelpCircle
} from 'lucide-react';
import { Badge } from '../common/Badge';

export interface DepartmentCommandCenterProps {
  onNavigateTab: (tab: HODTabType) => void;
  onRefresh?: () => void;
}

export const DepartmentCommandCenter: React.FC<DepartmentCommandCenterProps> = ({
  onNavigateTab,
  onRefresh
}) => {
  const { user, role } = useAuth();

  // ─── Global Scope Filters ──────────────────────────────────────────────────
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2025-2026');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('ALL');
  const [selectedDivisionFilter, setSelectedDivisionFilter] = useState('ALL');

  const filters: DepartmentGlobalFilters = useMemo(() => ({
    academicYear: selectedAcademicYear,
    programId: selectedProgramFilter,
    semesterId: selectedSemesterFilter,
    divisionId: selectedDivisionFilter
  }), [selectedAcademicYear, selectedProgramFilter, selectedSemesterFilter, selectedDivisionFilter]);

  // ─── Department Identity & Derived Data ────────────────────────────────────
  const scope = useMemo(() => {
    return departmentScopeService.resolveScopeIdentity(user, role || undefined);
  }, [user, role]);

  const kpis = useMemo(() => {
    return departmentScopeService.getDepartmentDashboardKPIs(user, role || undefined, filters);
  }, [user, role, filters]);

  const attentionItems = useMemo(() => {
    return departmentScopeService.getDepartmentAttentionItems(user, role || undefined, filters);
  }, [user, role, filters]);

  const healthSummary = useMemo(() => {
    return departmentScopeService.getDepartmentHealthSummary(user, role || undefined, filters);
  }, [user, role, filters]);

  const programBreakdown = useMemo(() => {
    return departmentScopeService.getProgramBreakdown(user, role || undefined, filters);
  }, [user, role, filters]);

  const semesterBreakdown = useMemo(() => {
    return departmentScopeService.getSemesterBreakdown(user, role || undefined, filters);
  }, [user, role, filters]);

  const sectionBreakdown = useMemo(() => {
    return departmentScopeService.getSectionBreakdown(user, role || undefined, filters);
  }, [user, role, filters]);

  const facultyWorkload = useMemo(() => {
    return departmentScopeService.getFacultyWorkloadOverview(user, role || undefined);
  }, [user, role]);

  const mentorMappings = useMemo(() => {
    return departmentScopeService.getMentorshipOverview(user, role || undefined);
  }, [user, role]);

  const activityTimeline = useMemo(() => {
    return departmentScopeService.getDepartmentActivityTimeline(user, role || undefined, 6);
  }, [user, role]);

  // ─── Filter Reset Handler ──────────────────────────────────────────────────
  const handleResetFilters = () => {
    setSelectedAcademicYear('2025-2026');
    setSelectedProgramFilter('ALL');
    setSelectedSemesterFilter('ALL');
    setSelectedDivisionFilter('ALL');
  };

  // ─── Export Handler ────────────────────────────────────────────────────────
  const handleExportComprehensiveReport = () => {
    departmentScopeService.exportDepartmentComprehensiveReport(user, role || undefined, filters);
  };

  // Helper time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* ═══ 1. COMMAND CENTER MASTER HEADER ═══ */}
      <div 
        className="card" 
        style={{ 
          padding: '1.5rem 1.75rem', 
          background: 'linear-gradient(135deg, #0B192C 0%, #1E3A8A 65%, #1E293B 100%)', 
          color: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(11, 25, 44, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: 800, 
                letterSpacing: '0.6px', 
                color: 'var(--brand-gold, #F59E0B)', 
                textTransform: 'uppercase',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                Department Command Center
              </span>
              <span style={{ fontSize: '0.75rem', color: '#93C5FD', fontWeight: 700 }}>
                • Strictly Scoped to {scope.departmentCode}
              </span>
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.35rem', marginBottom: '0.2rem' }}>
              {greeting}, {scope.hodName}
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>
              Head of Department • <strong>{scope.departmentName}</strong> • {scope.instituteName}
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.6rem', fontSize: '0.8125rem', color: '#94A3B8', flexWrap: 'wrap' }}>
              <span>Dept Code: <strong style={{ color: '#FFFFFF' }}>{scope.departmentCode}</strong></span>
              <span>Academic Year: <strong style={{ color: '#FFFFFF' }}>{scope.academicYear}</strong></span>
              <span>Current Sem: <strong style={{ color: '#FFFFFF' }}>Sem {scope.currentSemesterNumber}</strong></span>
              <span>Programs: <strong style={{ color: '#FFFFFF' }}>{scope.programs.length} Branches</strong></span>
              <span>Total Sections: <strong style={{ color: '#FFFFFF' }}>{sectionBreakdown.length}</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleExportComprehensiveReport}
              className="btn btn-secondary btn-sm" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.12)', 
                color: '#FFFFFF', 
                border: '1px solid rgba(255, 255, 255, 0.25)',
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem',
                fontSize: '0.78125rem',
                fontWeight: 700
              }}
            >
              <FileSpreadsheet size={15} color="#34D399" /> Export Department Report (.xlsx)
            </button>

            {onRefresh && (
              <button 
                type="button" 
                onClick={onRefresh}
                className="btn btn-secondary btn-sm" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.12)', 
                  color: '#FFFFFF', 
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.4rem 0.6rem'
                }}
                title="Sync Department Data"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ═══ 2. GLOBAL FILTER BAR ═══ */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={15} color="var(--brand-navy)" />
            <strong style={{ fontSize: '0.8125rem', color: 'var(--brand-navy)' }}>DEPARTMENT SCOPE FILTERS:</strong>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            
            {/* Academic Year */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>AY:</span>
              <select
                value={selectedAcademicYear}
                onChange={e => setSelectedAcademicYear(e.target.value)}
                className="form-control"
                style={{ height: '32px', fontSize: '0.78125rem', width: '120px' }}
              >
                <option value="2025-2026">2025-2026</option>
                <option value="2024-2025">2024-2025</option>
              </select>
            </div>

            {/* Program / Branch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Program:</span>
              <select
                value={selectedProgramFilter}
                onChange={e => setSelectedProgramFilter(e.target.value)}
                className="form-control"
                style={{ height: '32px', fontSize: '0.78125rem', minWidth: '150px' }}
              >
                <option value="ALL">All Department Programs</option>
                {scope.programs.map(p => (
                  <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Sem:</span>
              <select
                value={selectedSemesterFilter}
                onChange={e => setSelectedSemesterFilter(e.target.value)}
                className="form-control"
                style={{ height: '32px', fontSize: '0.78125rem', width: '110px' }}
              >
                <option value="ALL">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                  <option key={s} value={String(s)}>Sem {s}</option>
                ))}
              </select>
            </div>

            {/* Section / Division */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Section:</span>
              <select
                value={selectedDivisionFilter}
                onChange={e => setSelectedDivisionFilter(e.target.value)}
                className="form-control"
                style={{ height: '32px', fontSize: '0.78125rem', width: '110px' }}
              >
                <option value="ALL">All Sections</option>
                <option value="Div A">Div A</option>
                <option value="Div B">Div B</option>
                <option value="Div C">Div C</option>
              </select>
            </div>

            {/* Reset Button */}
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-outline btn-sm"
              style={{ height: '32px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
              title="Reset Filters to Default"
            >
              <RotateCcw size={12} /> Reset
            </button>

          </div>
        </div>
      </div>

      {/* ═══ 3. TOP 8 DEPARTMENT LIVE KPI CARDS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        
        {/* 1. Total Students */}
        <div 
          onClick={() => onNavigateTab('STUDENTS')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: '4px solid var(--brand-navy, #0B192C)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Students</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy)', marginTop: '2px' }}>
                {kpis.totalStudents}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#F1F5F9', borderRadius: '8px', color: 'var(--brand-navy)' }}>
              <Users size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.totalPrograms} Degree Programs • {kpis.activeStudents} Active
          </div>
        </div>

        {/* 2. Total Faculty */}
        <div 
          onClick={() => onNavigateTab('FACULTY')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: '4px solid #10B981',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Department Faculty</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                {kpis.totalFaculty}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#ECFDF5', borderRadius: '8px', color: '#10B981' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.teachingFaculty} Active • {kpis.facultyWithWorkload} with Workload
          </div>
        </div>

        {/* 3. Active Courses / Subjects */}
        <div 
          onClick={() => onNavigateTab('SUBJECTS')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: '4px solid #0EA5E9',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Courses</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0EA5E9', marginTop: '2px' }}>
                {kpis.activeCourses}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#F0F9FF', borderRadius: '8px', color: '#0EA5E9' }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.theoryCoursesCount} Theory • {kpis.labCoursesCount} Practical Labs
          </div>
        </div>

        {/* 4. Attendance Shortage */}
        <div 
          onClick={() => onNavigateTab('ATTENDANCE_SHORTAGE')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: `4px solid ${kpis.attendanceShortageCount > 0 ? '#EF4444' : '#10B981'}`,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Attendance Shortage</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: kpis.attendanceShortageCount > 0 ? '#EF4444' : '#10B981', marginTop: '2px' }}>
                {kpis.attendanceShortageCount}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: kpis.attendanceShortageCount > 0 ? '#FEF2F2' : '#ECFDF5', borderRadius: '8px', color: kpis.attendanceShortageCount > 0 ? '#EF4444' : '#10B981' }}>
              <AlertTriangle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.averageAttendancePercentage}% Dept Avg • {kpis.criticalAttendanceCount} Critical (&lt;60%)
          </div>
        </div>

        {/* 5. Academic At-Risk */}
        <div 
          onClick={() => onNavigateTab('AT_RISK')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: `4px solid ${kpis.academicAtRiskCount > 0 ? '#F59E0B' : '#10B981'}`,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Academic At-Risk</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: kpis.academicAtRiskCount > 0 ? '#D97706' : '#10B981', marginTop: '2px' }}>
                {kpis.academicAtRiskCount}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#FFFBEB', borderRadius: '8px', color: '#D97706' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            Attendance shortage or missing document records
          </div>
        </div>

        {/* 6. Pending Approvals */}
        <div 
          onClick={() => onNavigateTab('ATTENDANCE_APPROVALS')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: `4px solid ${kpis.pendingApprovalsCount > 0 ? '#8B5CF6' : '#10B981'}`,
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Pending Approvals</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>
                {kpis.pendingApprovalsCount}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#F5F3FF', borderRadius: '8px', color: '#8B5CF6' }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.pendingAttendanceCondonations} Leaves • {kpis.pendingDataChanges} Data Changes
          </div>
        </div>

        {/* 7. Pending Requests */}
        <div 
          onClick={() => onNavigateTab('REQUESTS')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: '4px solid #6366F1',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Student Requests</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#6366F1', marginTop: '2px' }}>
                {kpis.pendingStudentRequests}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: '#EEF2FF', borderRadius: '8px', color: '#6366F1' }}>
              <MessageSquare size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            Administrative services &amp; certificates queue
          </div>
        </div>

        {/* 8. Exam Eligibility */}
        <div 
          onClick={() => onNavigateTab('EXAM_ELIGIBILITY')}
          className="card" 
          style={{ 
            padding: '1.15rem 1.25rem', 
            cursor: 'pointer', 
            borderLeft: '4px solid var(--brand-orange, #F37023)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Exam Eligibility</span>
              <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-orange)', marginTop: '2px' }}>
                {kpis.examEligibleCount} / {kpis.totalStudents}
              </div>
            </div>
            <div style={{ padding: '0.6rem', background: 'rgba(243, 112, 35, 0.1)', borderRadius: '8px', color: 'var(--brand-orange)' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
            {kpis.examReadinessPercentage}% Clear • {kpis.examShortageCount} Ineligible
          </div>
        </div>

      </div>

      {/* ═══ 4. PRIORITY ACTION CENTER & DEPARTMENT HEALTH SUMMARY ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.25rem' }}>
        
        {/* Priority Action Center */}
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={18} color="#D97706" /> What Needs My Attention?
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '2px 8px', borderRadius: '12px' }}>
              {attentionItems.length} Action Items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {attentionItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#10B981' }}>
                <CheckCircle2 size={36} style={{ margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontWeight: 800, margin: 0 }}>All Operations Normal</h4>
                <p style={{ fontSize: '0.8125rem', margin: '4px 0 0 0', color: '#64748B' }}>
                  No high-priority attendance shortages or unreviewed approvals in your department.
                </p>
              </div>
            ) : (
              attentionItems.map(item => (
                <div 
                  key={item.id}
                  style={{ 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    background: item.priority === 'HIGH' ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${item.priority === 'HIGH' ? '#FECACA' : '#FDE68A'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ 
                        fontSize: '0.6875rem', 
                        fontWeight: 800, 
                        padding: '1px 6px', 
                        borderRadius: '3px',
                        background: item.priority === 'HIGH' ? '#DC2626' : '#D97706',
                        color: '#FFFFFF'
                      }}>
                        {item.priority}
                      </span>
                      <strong style={{ fontSize: '0.84rem', color: 'var(--brand-navy)' }}>{item.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.78125rem', color: '#475569', margin: '3px 0 0 0' }}>
                      {item.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateTab(item.targetTab as HODTabType)}
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                  >
                    {item.actionLabel} →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Health Summary */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Activity size={18} color="#10B981" /> Department Health Summary
            </h3>
            <Badge variant="active">Live Diagnostic</Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Attendance Health</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: healthSummary.attendanceStatus === 'EXCELLENT' || healthSummary.attendanceStatus === 'GOOD' ? '#15803D' : '#DC2626', marginTop: '2px' }}>
                {healthSummary.attendanceStatus}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Faculty Workload</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#2563EB', marginTop: '2px' }}>
                {healthSummary.workloadStatus}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Academic Risk</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: healthSummary.academicRiskStatus === 'SAFE' ? '#15803D' : '#D97706', marginTop: '2px' }}>
                {healthSummary.academicRiskStatus}
              </div>
            </div>

            <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Document Compliance</span>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#15803D', marginTop: '2px' }}>
                {healthSummary.documentCompliancePercentage}% Compliant
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.85rem', padding: '0.75rem 1rem', background: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1E40AF' }}>Examination Readiness</span>
              <div style={{ fontSize: '0.8rem', color: '#3B82F6' }}>{kpis.examEligibleCount} of {kpis.totalStudents} students cleared</div>
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E40AF' }}>
              {kpis.examReadinessPercentage}%
            </span>
          </div>
        </div>

      </div>

      {/* ═══ 5. PROGRAM / BRANCH-WISE OVERVIEW (EXCEL-STYLE GRID) ═══ */}
      <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{ padding: '0.85rem 1.25rem', background: '#0B192C', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} color="var(--brand-orange)" /> Department Program &amp; Branch Overview
          </h3>
          <span style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>{programBreakdown.length} Degree Programs</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ background: '#F1F5F9', color: '#334155', borderBottom: '1px solid #CBD5E1' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800 }}>PROGRAM / BRANCH</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>STUDENTS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>FACULTY</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>SECTIONS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>COURSES</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>ATTENDANCE %</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>AT RISK</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>REQUESTS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>EXAM ELIGIBLE</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'center', fontWeight: 800 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {programBreakdown.map((prog, idx) => (
                <tr 
                  key={prog.programId}
                  style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF', borderBottom: '1px solid #E2E8F0' }}
                >
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{prog.programName}</div>
                    <code style={{ fontSize: '0.725rem', color: 'var(--brand-orange)' }}>{prog.programCode}</code>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>{prog.studentCount}</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{prog.facultyCount}</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{prog.sectionCount}</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{prog.courseCount}</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                    <span style={{ 
                      padding: '2px 7px', 
                      borderRadius: '4px', 
                      fontWeight: 800, 
                      fontSize: '0.75rem',
                      background: prog.averageAttendance >= 75 ? '#DCFCE7' : '#FEE2E2',
                      color: prog.averageAttendance >= 75 ? '#15803D' : '#B91C1C'
                    }}>
                      {prog.averageAttendance}%
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                    {prog.atRiskCount > 0 ? (
                      <span style={{ padding: '2px 7px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '0.75rem' }}>
                        {prog.atRiskCount} At Risk
                      </span>
                    ) : (
                      <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.75rem' }}>0</span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{prog.pendingRequestsCount}</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700, color: '#15803D' }}>
                    {prog.examEligibleCount} / {prog.studentCount}
                  </td>
                  <td style={{ padding: '0.65rem 0.75rem', textAlign: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => onNavigateTab('STUDENTS')}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem', fontWeight: 700 }}
                    >
                      View Students
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 6. SEMESTER & SECTION OVERVIEWS ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.25rem' }}>
        
        {/* Semester-Wise Overview */}
        <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#1E293B', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BookOpen size={15} color="#38BDF8" /> Semester Performance &amp; Load
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>Active Semesters</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem' }}>
              <thead style={{ background: '#F8FAFC', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 800 }}>SEMESTER</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>STUDENTS</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>COURSES</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>AVG ATT %</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>SHORTAGE</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>ELIGIBLE</th>
                </tr>
              </thead>
              <tbody>
                {semesterBreakdown.map((sem, idx) => (
                  <tr key={sem.semesterNumber} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.55rem 0.6rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                      Semester {sem.semesterNumber}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 700 }}>{sem.studentCount}</td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>{sem.courseCount}</td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 800, color: sem.averageAttendance >= 75 ? '#15803D' : '#B91C1C' }}>
                      {sem.averageAttendance}%
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', color: sem.shortageCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {sem.shortageCount}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', color: '#15803D', fontWeight: 700 }}>
                      {sem.examEligibleCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section / Division Status */}
        <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#1E293B', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={15} color="#A78BFA" /> Section / Division Status
            </h3>
            <span style={{ fontSize: '0.725rem', color: '#94A3B8' }}>{sectionBreakdown.length} Divisions</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78125rem' }}>
              <thead style={{ background: '#F8FAFC', color: '#475569', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 800 }}>SECTION</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>STUDENTS</th>
                  <th style={{ padding: '0.5rem 0.6rem', textAlign: 'left', fontWeight: 800 }}>MENTOR</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>ATT %</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>SHORTAGE</th>
                  <th style={{ padding: '0.5rem 0.4rem', textAlign: 'center', fontWeight: 800 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {sectionBreakdown.map((sec, idx) => (
                  <tr key={sec.sectionId} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF', borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.55rem 0.6rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                      {sec.sectionName}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 700 }}>{sec.studentCount}</td>
                    <td style={{ padding: '0.55rem 0.6rem', fontSize: '0.75rem', color: '#475569' }}>
                      {sec.mentorName}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', fontWeight: 800, color: sec.averageAttendance >= 75 ? '#15803D' : '#B91C1C' }}>
                      {sec.averageAttendance}%
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center', color: sec.shortageCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {sec.shortageCount}
                    </td>
                    <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                      <span style={{ 
                        fontSize: '0.6875rem', 
                        fontWeight: 800, 
                        padding: '1px 6px', 
                        borderRadius: '3px',
                        background: sec.status === 'NORMAL' ? '#DCFCE7' : '#FEF3C7',
                        color: sec.status === 'NORMAL' ? '#15803D' : '#B45309'
                      }}>
                        {sec.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ═══ 7. FACULTY & WORKLOAD OVERVIEW ═══ */}
      <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
        <div style={{ padding: '0.85rem 1.25rem', background: '#0B192C', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserCheck size={16} color="#34D399" /> Department Faculty &amp; Teaching Workload Register
          </h3>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={() => onNavigateTab('FACULTY')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
            >
              Directory
            </button>
            <button 
              type="button" 
              onClick={() => onNavigateTab('FACULTY_WORKLOAD')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
            >
              Workload
            </button>
            <button 
              type="button" 
              onClick={() => onNavigateTab('FACULTY_ALLOCATION')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
            >
              Allocation
            </button>
            <button 
              type="button" 
              onClick={() => onNavigateTab('FACULTY_PERFORMANCE')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.725rem', background: 'rgba(255,255,255,0.15)', color: '#FFFFFF' }}
            >
              Performance
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '900px', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <thead style={{ background: '#F1F5F9', color: '#334155', borderBottom: '1px solid #CBD5E1' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800 }}>FACULTY NAME &amp; EMP ID</th>
                <th style={{ padding: '0.65rem 0.6rem', textAlign: 'left', fontWeight: 800 }}>DESIGNATION</th>
                <th style={{ padding: '0.65rem 0.75rem', textAlign: 'left', fontWeight: 800 }}>ASSIGNED COURSES</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>TH HRS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>LAB HRS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>TOTAL LOAD</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>WORKLOAD STATUS</th>
                <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800 }}>MENTEES</th>
              </tr>
            </thead>
            <tbody>
              {facultyWorkload.map((fac, idx) => (
                <tr key={fac.facultyId} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFF', borderBottom: '1px solid #E2E8F0' }}>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{fac.facultyName}</div>
                    <code style={{ fontSize: '0.725rem', color: '#64748B' }}>{fac.employeeId}</code>
                  </td>
                  <td style={{ padding: '0.65rem 0.6rem', color: '#475569', fontWeight: 600 }}>{fac.designation}</td>
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {fac.assignedSubjects.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {fac.assignedSubjects.map(s => (
                          <span key={s.id} style={{ fontSize: '0.725rem', padding: '1px 6px', borderRadius: '3px', background: '#F1F5F9', color: '#334155', fontWeight: 700 }}>
                            {s.code} ({s.hours}h)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Unallocated</span>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{fac.theoryHours}h</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{fac.labHours}h</td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {fac.totalWeeklyHours} Hrs / Wk
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 800, 
                      padding: '2px 7px', 
                      borderRadius: '4px',
                      background: fac.workloadStatus === 'NORMAL' ? '#DCFCE7' : fac.workloadStatus === 'UNDERLOADED' ? '#FEF3C7' : '#FEE2E2',
                      color: fac.workloadStatus === 'NORMAL' ? '#15803D' : fac.workloadStatus === 'UNDERLOADED' ? '#B45309' : '#B91C1C'
                    }}>
                      {fac.workloadStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700 }}>
                    {fac.assignedMenteesCount} Mentees
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 8. MENTOR MAPPING & RECENT ACTIVITY ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        
        {/* Mentor & Student Mapping */}
        <div className="card" style={{ padding: 0, borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#1E293B', color: '#FFFFFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Users size={15} color="#FBBF24" /> Faculty Mentor Roster
            </h3>
            <button 
              type="button" 
              onClick={() => onNavigateTab('MENTORS')} 
              className="btn btn-secondary btn-sm" 
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
            >
              Assign Mentors
            </button>
          </div>

          <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {mentorMappings.map(mentor => (
              <div 
                key={mentor.mentorId}
                style={{ 
                  padding: '0.65rem 0.85rem', 
                  borderRadius: '6px', 
                  background: '#F8FAFC', 
                  border: '1px solid #E2E8F0',
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.825rem' }}>
                    {mentor.mentorName}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                    {mentor.assignedProgram} • {mentor.assignedSection}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {mentor.totalMentees} Mentees
                  </span>
                  <div style={{ fontSize: '0.7rem', color: mentor.averageMenteeAttendance >= 75 ? '#15803D' : '#DC2626', fontWeight: 700 }}>
                    Avg: {mentor.averageMenteeAttendance}% Att
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Department Activity Timeline */}
        <div className="card" style={{ padding: '1rem', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={15} color="#6366F1" /> Recent Department Activity
            </h3>
            <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Real-time Audit Log</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {activityTimeline.map(ev => (
              <div 
                key={ev.id}
                style={{ 
                  display: 'flex', 
                  gap: '0.65rem', 
                  fontSize: '0.78125rem',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: '0.5rem'
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--brand-orange)', marginTop: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--brand-navy)' }}>{ev.title}</strong>
                    <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ margin: '2px 0 0 0', color: '#64748B', fontSize: '0.75rem', lineHeight: 1.4 }}>
                    {ev.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
