import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { StaffProfileDossierModal } from '../profile/StaffProfileDossierModal';
import { 
  registrarAcademicReportsService, 
  ExecutiveAcademicKPIs,
  InstituteAcademicPerformance,
  DepartmentAcademicPerformance,
  ProgramAcademicPerformance,
  StudentAcademicReportItem,
  FacultyAcademicReportItem,
  AcademicRiskItem,
  ReportFilterOptions
} from '../../services/registrarAcademicReportsService';
import { 
  BarChart3, Building2, Layers, GraduationCap, Users, 
  AlertTriangle, CheckCircle2, Clock, FileText, Download, 
  Printer, RefreshCw, Search, Filter, Sliders, ChevronRight, 
  PieChart, BookOpen, ShieldCheck, Activity, Award, UserCheck, 
  ExternalLink, Sparkles, AlertCircle
} from 'lucide-react';
import { Student, Faculty } from '../../types';

export const RegistrarAcademicReportsView: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'INSTITUTES' | 'DEPARTMENTS' | 'PROGRAMS' | 
    'STUDENTS' | 'FACULTY' | 'ATTENDANCE' | 'EXAMINATIONS' | 
    'REQUESTS' | 'RISKS'
  >('OVERVIEW');

  // Filters
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [selectedProgId, setSelectedProgId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [showReportBuilderModal, setShowReportBuilderModal] = useState<boolean>(false);
  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedFacultyForDossier, setSelectedFacultyForDossier] = useState<Faculty | null>(null);

  // Report Builder state
  const [builderReportType, setBuilderReportType] = useState<string>('UNIVERSITY_SUMMARY');
  const [builderFormat, setBuilderFormat] = useState<'XLSX' | 'CSV' | 'PRINT'>('XLSX');

  // Master lists
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => {
    const all = db.getDepartments();
    if (selectedInstId && selectedInstId !== 'ALL') {
      return all.filter(d => d.instituteId === selectedInstId);
    }
    return all;
  }, [selectedInstId, refreshKey]);

  const programs = useMemo(() => {
    const all = db.getPrograms();
    if (selectedDeptId && selectedDeptId !== 'ALL') {
      return all.filter(p => p.departmentId === selectedDeptId);
    }
    return all;
  }, [selectedDeptId, refreshKey]);

  // Filter criteria
  const filterOptions: ReportFilterOptions = useMemo(() => ({
    instituteId: selectedInstId,
    departmentId: selectedDeptId,
    programId: selectedProgId,
    searchQuery
  }), [selectedInstId, selectedDeptId, selectedProgId, searchQuery]);

  // Real-time Queries
  const executiveKPIs = useMemo(() => {
    return registrarAcademicReportsService.getExecutiveKPIs(filterOptions);
  }, [filterOptions, refreshKey]);

  const instituteList = useMemo(() => {
    return registrarAcademicReportsService.getInstitutePerformanceList(filterOptions);
  }, [filterOptions, refreshKey]);

  const departmentList = useMemo(() => {
    return registrarAcademicReportsService.getDepartmentPerformanceList(filterOptions);
  }, [filterOptions, refreshKey]);

  const programList = useMemo(() => {
    return registrarAcademicReportsService.getProgramPerformanceList(filterOptions);
  }, [filterOptions, refreshKey]);

  const studentRoster = useMemo(() => {
    return registrarAcademicReportsService.getStudentAcademicRoster(filterOptions);
  }, [filterOptions, refreshKey]);

  const facultyRoster = useMemo(() => {
    return registrarAcademicReportsService.getFacultyAcademicRoster(filterOptions);
  }, [filterOptions, refreshKey]);

  const academicRisks = useMemo(() => {
    return registrarAcademicReportsService.getAcademicRisks(filterOptions);
  }, [filterOptions, refreshKey]);

  const handleExport = (type: 'INSTITUTES' | 'DEPARTMENTS' | 'STUDENTS' | 'FACULTY' | 'RISKS', format: 'XLSX' | 'CSV') => {
    registrarAcademicReportsService.exportReport(type, filterOptions, format);
  };

  const handleOpenStudentProfile = (studentId: string) => {
    const student = db.getStudents().find(s => s.id === studentId);
    if (student) {
      setSelectedStudentForProfile(student);
    }
  };

  const handleOpenFacultyDossier = (facultyId: string) => {
    const fac = db.getFaculty().find(f => f.id === facultyId);
    if (fac) {
      setSelectedFacultyForDossier(fac);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & TOP ACTIONS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(135deg, #0B192C 0%, #1E3E62 100%)',
        borderRadius: '12px',
        padding: '1.5rem',
        color: '#FFFFFF',
        boxShadow: '0 4px 16px rgba(11,25,44,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.4rem', background: 'rgba(243,112,35,0.2)', borderRadius: '8px', border: '1px solid #F37023' }}>
                <BarChart3 size={22} color="#F37023" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
                Academic Reports & Analytics
              </h1>
              <Badge variant="active">AY 2026–27</Badge>
              <Badge variant="navy">Scope: University-Wide</Badge>
              <Badge variant="purple">Role: Registrar</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
              University-wide academic performance, compliance, examination, workload, and governance intelligence reporting across all 12 constituent institutions.
            </p>
          </div>

          {/* Top-Right Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowReportBuilderModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Sliders size={14} color="#F37023" /> Generate Report
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('INSTITUTES', 'XLSX')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Download size={14} color="#10B981" /> Export XLSX
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPrintReportModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Report
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Refresh ERP Data
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. EXECUTIVE SUMMARY CARDS (12 LIVE ERP-QUERY DRIVEN METRICS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.65rem'
      }}>
        {/* 1. Total Institutes */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0B192C' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Institutes</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{executiveKPIs.totalInstitutes}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Constituent Schools</div>
        </div>

        {/* 2. Total Departments */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #1E3E62' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Departments</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E3E62', marginTop: '2px' }}>{executiveKPIs.totalDepartments}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Academic Depts</div>
        </div>

        {/* 3. Total Programs */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0284C7' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Programs</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{executiveKPIs.totalPrograms}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>UG / PG / Ph.D</div>
        </div>

        {/* 4. Total Students */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Students</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{executiveKPIs.totalStudents}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Active Enrollment</div>
        </div>

        {/* 5. Total Faculty */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Faculty</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>{executiveKPIs.totalFaculty}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Teaching Roster</div>
        </div>

        {/* 6. Attendance Shortage */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Att. Shortage</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>{executiveKPIs.attendanceShortageCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 700 }}>Students &lt; 75%</div>
        </div>

        {/* 7. Pending Academic Requests */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Requests</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>{executiveKPIs.pendingAcademicRequests}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 700 }}>In Review</div>
        </div>

        {/* 8. Pending Approvals */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F37023' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Approvals</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F37023', marginTop: '2px' }}>{executiveKPIs.pendingApprovals}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Registrar Stage</div>
        </div>

        {/* 9. Exam Candidates */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #3B82F6' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Exam Candidates</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#3B82F6', marginTop: '2px' }}>{executiveKPIs.examinationCandidates}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Summer 2026</div>
        </div>

        {/* 10. Result Pending */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #6366F1' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Result Pending</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#6366F1', marginTop: '2px' }}>{executiveKPIs.resultsPending}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Depts in Moderation</div>
        </div>

        {/* 11. Academic Risks */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #DC2626' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Academic Risks</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{executiveKPIs.academicRisksCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#DC2626', fontWeight: 700 }}>Early Warning</div>
        </div>

        {/* 12. Compliance Issues */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #EC4899' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Compliance</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EC4899', marginTop: '2px' }}>{executiveKPIs.complianceIssuesCount}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Audit Action Items</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. GLOBAL FILTER BAR
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Institute Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Institute</label>
            <select
              value={selectedInstId}
              onChange={(e) => {
                setSelectedInstId(e.target.value);
                setSelectedDeptId('ALL');
                setSelectedProgId('ALL');
              }}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All 12 Institutes (University-Wide)</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedProgId('ALL');
              }}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Program Filter */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Program</label>
            <select
              value={selectedProgId}
              onChange={(e) => setSelectedProgId(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Programs</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Search Records</label>
            <div style={{ position: 'relative', marginTop: '2px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Student, Faculty, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.6rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. 10 INTERACTIVE REPORTING TABS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '2px', borderBottom: '2px solid #E2E8F0' }}>
        {[
          { id: 'OVERVIEW', label: 'University Overview', icon: Building2 },
          { id: 'INSTITUTES', label: 'Institute Performance', icon: Layers },
          { id: 'DEPARTMENTS', label: 'Department Performance', icon: BookOpen },
          { id: 'PROGRAMS', label: 'Programs Analytics', icon: GraduationCap },
          { id: 'STUDENTS', label: 'Student Academic Roster', icon: Users },
          { id: 'FACULTY', label: 'Faculty Academic Roster', icon: UserCheck },
          { id: 'ATTENDANCE', label: 'Attendance Intelligence', icon: Clock },
          { id: 'EXAMINATIONS', label: 'Examination & Results', icon: Award },
          { id: 'REQUESTS', label: 'Academic Petitions & Approvals', icon: FileText },
          { id: 'RISKS', label: 'Academic Risks & Compliance', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 0.9rem',
                borderRadius: '6px 6px 0 0',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 800 : 600,
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                background: isActive ? '#0B192C' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : '#64748B',
                borderBottom: isActive ? '3px solid #F37023' : '1px solid transparent'
              }}
            >
              <Icon size={14} color={isActive ? '#F37023' : '#64748B'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          5. TAB CONTENTS
      ══════════════════════════════════════════════════════════════════════ */}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: UNIVERSITY OVERVIEW */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            
            {/* Academic Standing Distribution */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <PieChart size={16} color="#F37023" /> Student Academic Standing Distribution
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#10B981' }}>Good Academic Standing</span>
                    <span>88.4% ({Math.floor(executiveKPIs.totalStudents * 0.884)} Students)</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '88.4%', height: '100%', background: '#10B981' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#F59E0B' }}>Academic Probation / Backlogs</span>
                    <span>5.8% ({Math.floor(executiveKPIs.totalStudents * 0.058)} Students)</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '5.8%', height: '100%', background: '#F59E0B' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#EF4444' }}>Attendance Shortage (&lt; 75%)</span>
                    <span>5.8% ({executiveKPIs.attendanceShortageCount} Students)</span>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '5.8%', height: '100%', background: '#EF4444' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Teaching & Faculty Workload Balance */}
            <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Activity size={16} color="#0284C7" /> Teaching Workload & Faculty Allocation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '1rem', textAlign: 'center' }}>
                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Balanced Workload</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>
                    {Math.floor(executiveKPIs.totalFaculty * 0.82)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>14–18 Hours/Wk</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Overloaded</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>
                    {Math.floor(executiveKPIs.totalFaculty * 0.11)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>&gt; 18 Hours/Wk</div>
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Underloaded</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>
                    {Math.floor(executiveKPIs.totalFaculty * 0.07)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B' }}>&lt; 14 Hours/Wk</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Institute Summary Grid */}
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Constituent Institutions Academic Scorecard
              </h3>
              <button className="btn btn-secondary btn-xs" onClick={() => setActiveTab('INSTITUTES')}>
                View Full Matrix →
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {instituteList.slice(0, 4).map(inst => (
                <div 
                  key={inst.instituteId}
                  onClick={() => {
                    setSelectedInstId(inst.instituteId);
                    setActiveTab('INSTITUTES');
                  }}
                  style={{
                    padding: '0.85rem',
                    background: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.875rem', color: '#0B192C' }}>{inst.instituteName}</strong>
                    <Badge variant="navy">{inst.instituteCode}</Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginTop: '0.5rem', fontSize: '0.75rem', textAlign: 'center' }}>
                    <div>Students: <strong>{inst.totalStudents}</strong></div>
                    <div>SFR: <strong>{inst.studentFacultyRatio}</strong></div>
                    <div>Attendance: <strong style={{ color: '#10B981' }}>{inst.attendancePct}%</strong></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: INSTITUTE PERFORMANCE MATRIX */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'INSTITUTES' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Institute Performance & Governance Matrix ({instituteList.length} Institutes)
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => handleExport('INSTITUTES', 'XLSX')}>
              <Download size={13} style={{ marginRight: '3px' }} /> Export Institute Matrix
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Code</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Depts</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Faculty</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>SFR</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Att. %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Shortage</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Candidates</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Pending Reqs</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Risks</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Compliance</th>
                </tr>
              </thead>
              <tbody>
                {instituteList.map((inst, idx) => (
                  <tr key={inst.instituteId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#F37023' }}>{inst.instituteCode}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>{inst.instituteName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{inst.totalDepartments}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{inst.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{inst.totalFaculty}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace' }}>{inst.studentFacultyRatio}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: inst.attendancePct >= 80 ? '#10B981' : '#EF4444' }}>
                      {inst.attendancePct}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#EF4444', fontWeight: 700 }}>{inst.attendanceShortageCount}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{inst.examCandidates}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: inst.pendingRequests > 0 ? '#F59E0B' : '#10B981', fontWeight: 700 }}>
                      {inst.pendingRequests}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={inst.academicRisks > 5 ? 'danger' : 'warning'}>{inst.academicRisks} Risks</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={inst.complianceStatus === 'COMPLIANT' ? 'active' : 'warning'}>
                        {inst.complianceStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DEPARTMENT PERFORMANCE MATRIX */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'DEPARTMENTS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Department Academic Performance ({departmentList.length} Departments)
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => handleExport('DEPARTMENTS', 'XLSX')}>
              <Download size={13} style={{ marginRight: '3px' }} /> Export Department Matrix
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Code</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>HOD</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Faculty</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Avg Workload</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Att. %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Shortage</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Result Status</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.map((dept, idx) => (
                  <tr key={dept.departmentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#F37023' }}>{dept.departmentCode}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>{dept.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{dept.instituteName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{dept.hodName}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{dept.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{dept.totalFaculty}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace' }}>{dept.averageWorkloadHours} hrs/wk</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: dept.attendancePct >= 80 ? '#10B981' : '#EF4444' }}>
                      {dept.attendancePct}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#EF4444', fontWeight: 700 }}>{dept.attendanceShortageCount}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="navy">{dept.examStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={dept.resultStatus === 'PUBLISHED' ? 'active' : 'warning'}>
                        {dept.resultStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: PROGRAMS ANALYTICS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'PROGRAMS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Academic Program Analytics ({programList.length} Programs)
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Code</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Degree Type</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Duration</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Att. %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Pass %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Backlog %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>At-Risk</th>
                </tr>
              </thead>
              <tbody>
                {programList.map((prog, idx) => (
                  <tr key={prog.programId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#F37023' }}>{prog.programCode}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>{prog.programName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="navy">{prog.programType}</Badge></td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{prog.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{prog.durationYears} Years</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{prog.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{prog.attendancePct}%</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>{prog.passPct}%</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#EF4444' }}>{prog.backlogPct}%</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="warning">{prog.atRiskStudentsCount}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: STUDENT ACADEMIC ROSTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Student Academic Governance Roster ({studentRoster.length} Students)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Scoped strictly by active Institute, Department & Program filters</span>
            </div>
            <button className="btn btn-secondary btn-xs" onClick={() => handleExport('STUDENTS', 'XLSX')}>
              <Download size={13} style={{ marginRight: '3px' }} /> Export Student Roster
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Enrollment No</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Att. %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Standing</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fee Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Form</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentRoster.map((stu, idx) => (
                  <tr key={stu.studentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>
                      {stu.enrollmentNo}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>
                      {stu.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{stu.departmentName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{stu.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{stu.programName} (Sem {stu.semesterNumber})</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: stu.attendancePercentage >= 75 ? '#10B981' : '#EF4444' }}>
                      {stu.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.academicStanding === 'GOOD_STANDING' ? 'active' : (stu.academicStanding === 'ATTENDANCE_SHORTAGE' ? 'danger' : 'warning')}>
                        {stu.academicStanding}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.feeStatus === 'PAID' ? 'active' : 'danger'}>{stu.feeStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="navy">{stu.examFormStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleOpenStudentProfile(stu.studentId)}
                      >
                        Profile Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: FACULTY ACADEMIC ROSTER */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'FACULTY' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              University Faculty Academic Roster ({facultyRoster.length} Faculty Members)
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => handleExport('FACULTY', 'XLSX')}>
              <Download size={13} style={{ marginRight: '3px' }} /> Export Faculty Roster
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Emp ID</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Faculty Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Designation</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Assigned Subjects</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Weekly Hours</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Workload Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Mentees</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyRoster.map((fac, idx) => (
                  <tr key={fac.facultyId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>
                      {fac.employeeId}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>
                      {fac.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{fac.designation}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{fac.departmentName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{fac.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{fac.assignedSubjectsCount} Subjects</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace' }}>{fac.weeklyWorkloadHours} hrs/wk</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={fac.workloadStatus === 'BALANCED' ? 'active' : (fac.workloadStatus === 'OVERLOADED' ? 'danger' : 'warning')}>
                        {fac.workloadStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{fac.menteesCount} Students</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => handleOpenFacultyDossier(fac.facultyId)}
                      >
                        Staff Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: ATTENDANCE INTELLIGENCE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                University Attendance Compliance & Defaulter Tracking
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Strict tracking under UGC & Statutory 75% Examination Eligibility Rule.
              </p>
            </div>
            <Badge variant="danger">{executiveKPIs.attendanceShortageCount} Defaulters Identified</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Enrollment No</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Attendance %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Shortage Gap</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Action Required</th>
                </tr>
              </thead>
              <tbody>
                {studentRoster.filter(s => s.attendancePercentage < 75).map((stu, idx) => (
                  <tr key={stu.studentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#EF4444' }}>{stu.enrollmentNo}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>{stu.name}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{stu.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#EF4444' }}>{stu.attendancePercentage}%</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#EF4444', fontWeight: 700 }}>
                      -{75 - stu.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="danger">HALL TICKET WITHHELD</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Submit Condonation Petition to Registrar</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: EXAMINATIONS & RESULTS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'EXAMINATIONS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '1rem' }}>
            University Examination & Results Overview
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Active Exam Sessions</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>2 Sessions</div>
              <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px' }}>Summer 2026 Regular & Remedial</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Exam Forms Clearance Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>92.8%</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Verified & Cleared</div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>Average University Pass Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>91.2%</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>Previous Semester Aggregate</div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: ACADEMIC PETITIONS & APPROVALS */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REQUESTS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Academic Petitions & Statutory Approval Bottlenecks
            </h3>
            <Badge variant="warning">{executiveKPIs.pendingApprovals} Pending Approvals</Badge>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            All request metrics are dynamically queried from the single source of truth (`studentRequestService` and `approvalEngine`).
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 10: ACADEMIC RISKS & COMPLIANCE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeTab === 'RISKS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
              Academic Risk & Early Warning Log ({academicRisks.length} Active Risks)
            </h3>
            <button className="btn btn-secondary btn-xs" onClick={() => handleExport('RISKS', 'XLSX')}>
              <Download size={13} style={{ marginRight: '3px' }} /> Export Risk Matrix
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {academicRisks.map(risk => (
              <div 
                key={risk.id}
                style={{
                  padding: '0.85rem 1rem',
                  background: '#F8FAFC',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${risk.severity === 'CRITICAL' || risk.severity === 'HIGH' ? '#EF4444' : '#F59E0B'}`,
                  borderTop: '1px solid #E2E8F0',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={16} color={risk.severity === 'CRITICAL' || risk.severity === 'HIGH' ? '#EF4444' : '#F59E0B'} />
                    <strong style={{ fontSize: '0.875rem', color: '#0B192C' }}>{risk.riskTitle}</strong>
                  </div>
                  <Badge variant={risk.severity === 'CRITICAL' ? 'danger' : 'warning'}>{risk.severity}</Badge>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.35rem' }}>
                  Institute: <strong>{risk.instituteName}</strong> • Department: <strong>{risk.departmentName}</strong> • Affected: <strong>{risk.affectedCount} Students</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.25rem', background: '#FFFFFF', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                  <strong>Directive / Action Required:</strong> {risk.actionRequired}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          6. MODAL: REPORT BUILDER
      ══════════════════════════════════════════════════════════════════════ */}
      {showReportBuilderModal && (
        <Modal
          isOpen={showReportBuilderModal}
          onClose={() => setShowReportBuilderModal(false)}
          title="Custom Academic Report Builder"
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Select Report Type</label>
              <select
                value={builderReportType}
                onChange={(e) => setBuilderReportType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '0.35rem' }}
              >
                <option value="UNIVERSITY_SUMMARY">University Academic Summary Report</option>
                <option value="INSTITUTE_PERFORMANCE">Institute Performance & SFR Report</option>
                <option value="DEPARTMENT_PERFORMANCE">Department Workload & Performance Report</option>
                <option value="STUDENT_ROSTER">Student Academic Standing Roster</option>
                <option value="FACULTY_ROSTER">Faculty Teaching Workload Roster</option>
                <option value="ATTENDANCE_DEFAULTER">Attendance Defaulter Report (&lt; 75%)</option>
                <option value="EXAMINATION_CLEARANCE">Examination & Results Clearance Report</option>
                <option value="ACADEMIC_RISK">Academic Risk & Early Warning Report</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0B192C' }}>Output Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                {(['XLSX', 'CSV', 'PRINT'] as const).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setBuilderFormat(fmt)}
                    style={{
                      padding: '0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: builderFormat === fmt ? '#0B192C' : '#FFFFFF',
                      color: builderFormat === fmt ? '#FFFFFF' : '#0B192C',
                      border: '1px solid #0B192C'
                    }}
                  >
                    {fmt === 'XLSX' ? 'Excel Spreadsheet (.xlsx)' : (fmt === 'CSV' ? 'CSV Data (.csv)' : 'Printable PDF Report')}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowReportBuilderModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setShowReportBuilderModal(false);
                  if (builderFormat === 'PRINT') {
                    setShowPrintReportModal(true);
                  } else {
                    handleExport('INSTITUTES', builderFormat);
                  }
                }}
              >
                Generate & Download →
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. MODAL: OFFICIAL PRINTABLE ACADEMIC REPORT
      ══════════════════════════════════════════════════════════════════════ */}
      {showPrintReportModal && (
        <Modal
          isOpen={showPrintReportModal}
          onClose={() => setShowPrintReportModal(false)}
          title="Official Academic Governance Report"
          maxWidth="900px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Official A4 University Academic Audit Report</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Now
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintReportModal(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ border: '2px solid #0B192C', padding: '1.5rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B192C', textTransform: 'uppercase' }}>SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>OFFICE OF THE REGISTRAR • ACADEMIC AUDIT & GOVERNANCE DIVISION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F37023', marginTop: '0.35rem' }}>COMPREHENSIVE ACADEMIC STATUS & PERFORMANCE REPORT (AY 2026–27)</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', background: '#F8FAFC', padding: '0.6rem', borderRadius: '4px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                <div>Total Students: <strong>{executiveKPIs.totalStudents}</strong></div>
                <div>Total Faculty: <strong>{executiveKPIs.totalFaculty}</strong></div>
                <div>Avg Attendance: <strong style={{ color: '#10B981' }}>{executiveKPIs.averageAttendancePct}%</strong></div>
                <div>Att. Shortage: <strong style={{ color: '#EF4444' }}>{executiveKPIs.attendanceShortageCount}</strong></div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left', background: '#F1F5F9' }}>
                    <th style={{ padding: '4px 6px' }}>Code</th>
                    <th style={{ padding: '4px 6px' }}>Institute Name</th>
                    <th style={{ padding: '4px 6px' }}>Depts</th>
                    <th style={{ padding: '4px 6px' }}>Students</th>
                    <th style={{ padding: '4px 6px' }}>Faculty</th>
                    <th style={{ padding: '4px 6px' }}>SFR</th>
                    <th style={{ padding: '4px 6px' }}>Att. %</th>
                  </tr>
                </thead>
                <tbody>
                  {instituteList.map(inst => (
                    <tr key={inst.instituteId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{inst.instituteCode}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>{inst.instituteName}</td>
                      <td style={{ padding: '4px 6px' }}>{inst.totalDepartments}</td>
                      <td style={{ padding: '4px 6px' }}>{inst.totalStudents}</td>
                      <td style={{ padding: '4px 6px' }}>{inst.totalFaculty}</td>
                      <td style={{ padding: '4px 6px' }}>{inst.studentFacultyRatio}</td>
                      <td style={{ padding: '4px 6px' }}>{inst.attendancePct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#0B192C' }}>
                <div>Generated By: <strong>Office of the Registrar</strong></div>
                <div>Statutory Seal: <strong>Registrar & Custodian of Academic Records</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          8. STUDENT PROFILE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          isOpen={Boolean(selectedStudentForProfile)}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          9. STAFF PROFILE DOSSIER MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedFacultyForDossier && (
        <StaffProfileDossierModal
          faculty={selectedFacultyForDossier}
          isOpen={Boolean(selectedFacultyForDossier)}
          onClose={() => setSelectedFacultyForDossier(null)}
        />
      )}

    </div>
  );
};
