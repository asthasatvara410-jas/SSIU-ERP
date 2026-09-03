import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { 
  registrarExamGovernanceService,
  InstituteExamSummary,
  DepartmentExamSummary,
  SubjectExamDetail,
  StudentExamRecord,
  ExamRiskItem,
  ExamApprovalItem,
  ExamScheduleItem
} from '../../services/registrarExamGovernanceService';
import { 
  Building2, GraduationCap, Users, Calendar, Clock, AlertTriangle, 
  CheckCircle2, XCircle, FileText, Download, Printer, Search, 
  Filter, RefreshCw, ChevronRight, Eye, ShieldAlert, Award, 
  Layers, ArrowLeft, Send, Landmark, IndianRupee, FileSpreadsheet,
  Check, Info, CheckSquare, Sparkles, BookOpen, AlertCircle
} from 'lucide-react';
import { Institute, Department, Student } from '../../types';

export type ExamGovernanceTabType = 
  | 'INSTITUTE_MATRIX'
  | 'DEPARTMENT_CONTROL'
  | 'SUBJECT_PORTFOLIO'
  | 'STUDENT_LIST'
  | 'FORM_MANAGEMENT'
  | 'FEE_OVERVIEW'
  | 'EXAM_SCHEDULE'
  | 'RISKS_ANOMALIES'
  | 'APPROVALS'
  | 'RESULTS_MONITORING'
  | 'REPORTS';

interface RegistrarExamGovernanceViewProps {
  initialTab?: ExamGovernanceTabType;
}

export const RegistrarExamGovernanceView: React.FC<RegistrarExamGovernanceViewProps> = ({
  initialTab = 'INSTITUTE_MATRIX'
}) => {
  const [activeTab, setActiveTab] = useState<ExamGovernanceTabType>(initialTab);
  const [academicYear, setAcademicYear] = useState('2025-26');
  const [examSession, setExamSession] = useState('SUMMER_2026');
  const [selectedInstId, setSelectedInstId] = useState<string>('ALL');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [schedulePeriodFilter, setSchedulePeriodFilter] = useState<'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Drill-down states
  const [selectedDepartmentForDetail, setSelectedDepartmentForDetail] = useState<DepartmentExamSummary | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedStudentExamRecord, setSelectedStudentExamRecord] = useState<StudentExamRecord | null>(null);

  // Master lists
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => {
    const all = db.getDepartments();
    if (selectedInstId && selectedInstId !== 'ALL') {
      return all.filter(d => d.instituteId === selectedInstId);
    }
    return all;
  }, [selectedInstId, refreshKey]);

  // Derived KPIs
  const kpis = useMemo(() => {
    return registrarExamGovernanceService.getOverviewKPIs({
      instituteId: selectedInstId,
      departmentId: selectedDeptId,
      academicYear
    });
  }, [selectedInstId, selectedDeptId, academicYear, refreshKey]);

  // Data sets
  const instituteSummaries = useMemo(() => {
    return registrarExamGovernanceService.getInstituteSummaries();
  }, [refreshKey]);

  const departmentSummaries = useMemo(() => {
    return registrarExamGovernanceService.getDepartmentSummaries(selectedInstId);
  }, [selectedInstId, refreshKey]);

  const studentExamList = useMemo(() => {
    return registrarExamGovernanceService.getScopedStudentExamList({
      instituteId: selectedInstId,
      departmentId: selectedDeptId,
      searchQuery
    });
  }, [selectedInstId, selectedDeptId, searchQuery, refreshKey]);

  const examRisks = useMemo(() => {
    return registrarExamGovernanceService.getExamRisks({
      instituteId: selectedInstId,
      departmentId: selectedDeptId
    });
  }, [selectedInstId, selectedDeptId, refreshKey]);

  const examApprovals = useMemo(() => {
    return registrarExamGovernanceService.getExamApprovals();
  }, [refreshKey]);

  const examSchedules = useMemo(() => {
    return registrarExamGovernanceService.getExamSchedules({
      period: schedulePeriodFilter,
      instituteId: selectedInstId
    });
  }, [schedulePeriodFilter, selectedInstId, refreshKey]);

  // Subject details for selected department drilldown
  const departmentSubjects = useMemo(() => {
    if (!selectedDepartmentForDetail) return [];
    return registrarExamGovernanceService.getDepartmentSubjectDetails(selectedDepartmentForDetail.departmentId);
  }, [selectedDepartmentForDetail]);

  const handleExport = (reportType: string) => {
    registrarExamGovernanceService.exportReport(reportType, {
      instituteId: selectedInstId,
      departmentId: selectedDeptId
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2.5rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & GLOBAL CONTROLS
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
                <Landmark size={22} color="#F37023" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
                University Examination Governance Center
              </h1>
              <Badge variant="active">AY {academicYear}</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
              Centralized academic & statutory examination oversight for the Office of the Registrar across all 12 constituent schools.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleExport('UNIVERSITY_SUMMARY')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <FileSpreadsheet size={14} color="#10B981" /> Export Overview (XLSX)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Audit
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRefreshKey(k => k + 1)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          marginTop: '1.25rem',
          paddingTop: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.12)'
        }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Academic Session</label>
            <select
              value={examSession}
              onChange={(e) => setExamSession(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#0F2744', color: '#FFFFFF', border: '1px solid #334E68', marginTop: '3px' }}
            >
              <option value="SUMMER_2026">Summer 2026 End-Semester</option>
              <option value="WINTER_2025">Winter 2025 End-Semester</option>
              <option value="REMEDIAL_2026">Remedial & Backlog 2026</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Filter Institute</label>
            <select
              value={selectedInstId}
              onChange={(e) => {
                setSelectedInstId(e.target.value);
                setSelectedDeptId('ALL');
              }}
              style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#0F2744', color: '#FFFFFF', border: '1px solid #334E68', marginTop: '3px' }}
            >
              <option value="ALL">All 12 Institutes</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Filter Department</label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#0F2744', color: '#FFFFFF', border: '1px solid #334E68', marginTop: '3px' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Search Query</label>
            <div style={{ position: 'relative', marginTop: '3px' }}>
              <Search size={14} style={{ position: 'absolute', left: '8px', top: '9px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search Student, Subject, Code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.6rem 0.45rem 1.8rem', borderRadius: '6px', fontSize: '0.8125rem', background: '#0F2744', color: '#FFFFFF', border: '1px solid #334E68' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          2. TOP 12 SUMMARY KPI CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: '0.75rem'
      }}>
        {/* Active Sessions */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #0B192C' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Active Sessions</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{kpis.activeExamSessions} Sessions</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Summer 2026 Term</div>
        </div>

        {/* Participating Institutes */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #1E3E62' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Institutes with Exams</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#1E3E62', marginTop: '2px' }}>{kpis.institutesWithActiveExams} / 12</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Constituent Schools</div>
        </div>

        {/* Eligible Students */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #F37023' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Eligible Students</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F37023', marginTop: '2px' }}>{kpis.totalEligibleStudents}</div>
          <div style={{ fontSize: '0.725rem', color: '#10B981', fontWeight: 700 }}>Meeting UGC 75% Rule</div>
        </div>

        {/* Forms Submitted */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Forms Submitted</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{kpis.examFormsSubmitted}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Verified in System</div>
        </div>

        {/* Forms Pending */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Forms Pending</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>{kpis.examFormsPending}</div>
          <div style={{ fontSize: '0.725rem', color: '#EF4444' }}>Needs Clearance</div>
        </div>

        {/* Exam Fees Collected */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #059669' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Fees Collected</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>₹{(kpis.examFeesCollected / 100000).toFixed(2)} L</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Settled Accounts</div>
        </div>

        {/* Exam Fees Pending */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Fees Pending</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>₹{(kpis.examFeesPending / 100000).toFixed(2)} L</div>
          <div style={{ fontSize: '0.725rem', color: '#F59E0B' }}>Pending Verification</div>
        </div>

        {/* Students with Issues */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #DC2626' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Students with Issues</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{kpis.studentsWithExamIssues}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Attendance / Fees</div>
        </div>

        {/* Pending Approvals */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Approvals</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>{kpis.pendingApprovalsCount}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Condonations & Forms</div>
        </div>

        {/* Subjects Scheduled */}
        <div className="card" style={{ padding: '0.85rem 1rem', background: '#FFFFFF', borderLeft: '4px solid #0284C7' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Subjects Scheduled</span>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{kpis.examsSubjectsScheduled}</div>
          <div style={{ fontSize: '0.725rem', color: '#64748B' }}>Central Timetable</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. TAB NAVIGATION (11 ORGANIZED MODULES)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        background: '#FFFFFF',
        borderBottom: '2px solid #E2E8F0',
        padding: '0 0.5rem',
        gap: '0.25rem',
        borderRadius: '8px 8px 0 0',
        scrollbarWidth: 'thin'
      }}>
        {[
          { id: 'INSTITUTE_MATRIX', label: '1. Institute-wise View', icon: <Building2 size={15} /> },
          { id: 'DEPARTMENT_CONTROL', label: '2. Department Control', icon: <Layers size={15} />, badge: departmentSummaries.length },
          { id: 'STUDENT_LIST', label: '3. Student Examination Roster', icon: <Users size={15} />, badge: studentExamList.length },
          { id: 'FORM_MANAGEMENT', label: '4. Exam Forms', icon: <FileText size={15} />, badge: kpis.examFormsPending, badgeColor: '#EF4444' },
          { id: 'FEE_OVERVIEW', label: '5. Exam Fees', icon: <IndianRupee size={15} /> },
          { id: 'EXAM_SCHEDULE', label: '6. Timetable & Centers', icon: <Calendar size={15} />, badge: examSchedules.length },
          { id: 'RISKS_ANOMALIES', label: '7. Risks & Defaulters', icon: <AlertTriangle size={15} />, badge: examRisks.length, badgeColor: '#EF4444' },
          { id: 'APPROVALS', label: '8. Registrar Approvals', icon: <CheckSquare size={15} />, badge: examApprovals.length, badgeColor: '#F59E0B' },
          { id: 'RESULTS_MONITORING', label: '9. Results & Marks Control', icon: <Award size={15} /> },
          { id: 'REPORTS', label: '10. Reports & Exports', icon: <FileSpreadsheet size={15} /> }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ExamGovernanceTabType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.75rem 0.9rem',
                fontSize: '0.8125rem',
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#F37023' : '#64748B',
                background: 'transparent',
                border: 'none',
                borderBottom: isActive ? '3px solid #F37023' : '3px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span style={{
                  fontSize: '0.6875rem',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '10px',
                  background: tab.badgeColor || '#0B192C',
                  color: '#FFFFFF',
                  fontWeight: 700
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. TAB CONTENT AREA
      ══════════════════════════════════════════════════════════════════════ */}
      
      {/* ─── TAB 1: INSTITUTE-WISE EXAMINATION VIEW ─── */}
      {activeTab === 'INSTITUTE_MATRIX' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Institute-wise Examination Summary & Governance Matrix
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                High-level examination performance, form submissions, and fee compliance across all 12 institutions.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => handleExport('INSTITUTE_WISE')}
            >
              <Download size={13} style={{ marginRight: '4px' }} /> Export Table
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Depts</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Eligible</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Forms Submitted</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Forms Pending</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fee Collected</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fee Pending</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {instituteSummaries.map((inst, idx) => (
                  <tr key={inst.instituteId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <strong style={{ color: '#0B192C' }}>{inst.instituteName}</strong> <code style={{ color: '#F37023' }}>({inst.instituteCode})</code>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{inst.totalDepartments}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#0B192C' }}>{inst.eligibleStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>{inst.formsSubmitted}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: inst.formsPending > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {inst.formsPending}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#059669', fontWeight: 700 }}>
                      ₹{(inst.feesCollected / 1000).toFixed(0)}k
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: inst.feesPending > 0 ? '#F59E0B' : '#64748B', fontWeight: 700 }}>
                      ₹{(inst.feesPending / 1000).toFixed(0)}k
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="active">{inst.examStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setSelectedInstId(inst.instituteId);
                          setActiveTab('DEPARTMENT_CONTROL');
                        }}
                      >
                        View Departments →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2: DEPARTMENT-WISE EXAMINATION CONTROL (PRIMARY REQUIREMENT) ─── */}
      {activeTab === 'DEPARTMENT_CONTROL' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Department-wise Examination Control & Status
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Department-level examination readiness, submitted forms, fee collections, and anomaly status.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary btn-xs"
                onClick={() => handleExport('DEPARTMENT_WISE')}
              >
                <Download size={13} style={{ marginRight: '4px' }} /> Export Department Matrix
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program & Sem</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subjects</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Eligible</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Forms Submitted</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Forms Pending</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fees Collected</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fees Pending</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Result Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Issues</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {departmentSummaries.map((dept, idx) => (
                  <tr key={dept.departmentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ fontWeight: 800, color: '#0B192C' }}>{dept.departmentName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{dept.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="navy">{dept.programName} (Sem {dept.semesterNumber})</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{dept.totalSubjects} Subjects</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>{dept.eligibleStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>{dept.formsSubmitted}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: dept.formsPending > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {dept.formsPending}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#059669', fontWeight: 700 }}>
                      ₹{(dept.feesCollected / 1000).toFixed(0)}k
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: dept.feesPending > 0 ? '#F59E0B' : '#64748B', fontWeight: 700 }}>
                      ₹{(dept.feesPending / 1000).toFixed(0)}k
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="active">{dept.examStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant="warning">{dept.resultStatus}</Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      {dept.issuesCount > 0 ? (
                        <Badge variant="danger">{dept.issuesCount} Issues</Badge>
                      ) : (
                        <Badge variant="active">CLEARED</Badge>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => setSelectedDepartmentForDetail(dept)}
                      >
                        Drill Down →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: STUDENT EXAMINATION ROSTER (SCOPED) ─── */}
      {activeTab === 'STUDENT_LIST' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Scoped Student Examination Ledger
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Showing students filtered by Institute: <strong>{selectedInstId}</strong> | Department: <strong>{selectedDeptId}</strong>
              </p>
            </div>
            <button
              className="btn btn-secondary btn-xs"
              onClick={() => handleExport('STUDENT_LIST')}
            >
              <Download size={13} style={{ marginRight: '4px' }} /> Export Student Roster
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Enrollment No</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program & Sem</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Form Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Fee Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Eligibility</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Attendance %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Hall Ticket</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Issues</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {studentExamList.map((stu, idx) => (
                  <tr key={stu.studentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}><code style={{ color: '#F37023', fontWeight: 700 }}>{stu.enrollmentNo}</code></td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{stu.name}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{stu.programName} (Sem {stu.semesterNumber})</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.examFormStatus === 'APPROVED' ? 'active' : (stu.examFormStatus === 'PENDING' ? 'warning' : 'danger')}>
                        {stu.examFormStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.feeStatus === 'PAID' ? 'active' : 'danger'}>
                        {stu.feeStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.eligibility === 'ELIGIBLE' ? 'active' : 'warning'}>
                        {stu.eligibility}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: stu.attendancePercentage >= 75 ? '#10B981' : '#EF4444' }}>
                      {stu.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      {stu.admitCardIssued ? (
                        <code style={{ color: '#059669', fontWeight: 700 }}>{stu.hallTicketNo}</code>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Not Generated</span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      {stu.issues.length > 0 ? (
                        <span style={{ color: '#DC2626', fontSize: '0.75rem', fontWeight: 600 }}>{stu.issues.join(', ')}</span>
                      ) : (
                        <span style={{ color: '#10B981', fontSize: '0.75rem', fontWeight: 600 }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => {
                            const rawStudent = db.getStudentById(stu.studentId);
                            if (rawStudent) setSelectedStudentForModal(rawStudent);
                          }}
                        >
                          Profile
                        </button>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => setSelectedStudentExamRecord(stu)}
                        >
                          Admit Card
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: EXAM SCHEDULE & CENTRES ─── */}
      {activeTab === 'EXAM_SCHEDULE' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Central University Examination Timetables & Examination Centers
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Real-time room allocations, examination timings, and student center distribution.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {(['ALL', 'TODAY', 'UPCOMING', 'COMPLETED'] as const).map(p => (
                <button
                  key={p}
                  className={`btn btn-xs ${schedulePeriodFilter === p ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSchedulePeriodFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Date & Timing</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subject</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program & Sem</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Centre & Room</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {examSchedules.map(sch => (
                  <tr key={sch.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <strong style={{ color: '#0B192C' }}>{sch.examDate}</strong>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{sch.startTime} - {sch.endTime}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <strong style={{ color: '#0B192C' }}>{sch.subjectName}</strong> <code style={{ color: '#F37023' }}>{sch.subjectCode}</code>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{sch.departmentName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{sch.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{sch.programName} (Sem {sch.semesterNumber})</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>{sch.studentsCount} Students</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{sch.examCenter}</div>
                      <div style={{ fontSize: '0.725rem', color: '#059669', fontWeight: 700 }}>{sch.roomNo}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={sch.status === 'TODAY' ? 'warning' : 'active'}>{sch.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: RISKS & ANOMALIES ─── */}
      {activeTab === 'RISKS_ANOMALIES' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Real-Time Examination Risks & Operational Anomaly Log
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Auto-detected bottlenecks requiring Registrar and Principal intervention.
              </p>
            </div>
            <Badge variant="danger">{examRisks.length} Critical / High Risks</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {examRisks.map(risk => (
              <div 
                key={risk.id}
                style={{
                  padding: '1rem 1.25rem',
                  background: '#F8FAFC',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${risk.severity === 'CRITICAL' ? '#EF4444' : (risk.severity === 'HIGH' ? '#F59E0B' : '#38BDF8')}`,
                  borderTop: '1px solid #E2E8F0',
                  borderRight: '1px solid #E2E8F0',
                  borderBottom: '1px solid #E2E8F0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Badge variant={risk.severity === 'CRITICAL' ? 'danger' : 'warning'}>{risk.severity}</Badge>
                      <strong style={{ fontSize: '0.95rem', color: '#0B192C' }}>{risk.riskTitle}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.35rem' }}>
                      Institute: <strong>{risk.instituteName}</strong> • Department: <strong>{risk.departmentName}</strong> • Affected: <strong style={{ color: '#EF4444' }}>{risk.affectedStudentsCount} Students</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#0B192C', marginTop: '0.35rem', background: '#FFFFFF', padding: '0.5rem 0.75rem', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
                      <strong>Suggested Action:</strong> {risk.suggestedAction}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Responsible Owner:</div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0B192C' }}>{risk.owner}</div>
                    <button
                      className="btn btn-primary btn-xs"
                      style={{ marginTop: '0.5rem' }}
                      onClick={() => alert(`Issuing formal administrative directive to: ${risk.owner}`)}
                    >
                      Issue Directive →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 6: REGISTRAR APPROVALS ─── */}
      {activeTab === 'APPROVALS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Pending Statutory Examination Approvals (Office of the Registrar)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
                Escalated condonation petitions, late registration permissions, and special exam venue allocations.
              </p>
            </div>
            <Badge variant="purple">{examApprovals.length} Pending at Registrar Desk</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Request ID</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student & Enrollment</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute & Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Petition Category</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Submitted Date</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Endorsements & Remarks</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {examApprovals.map(app => (
                  <tr key={app.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}><code style={{ color: '#F37023', fontWeight: 700 }}>{app.requestId}</code></td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <strong style={{ color: '#0B192C' }}>{app.studentName}</strong>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{app.enrollmentNo}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{app.departmentName}</div>
                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>{app.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{app.requestType}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{app.submittedDate}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontSize: '0.75rem', color: '#334155', maxWidth: '280px' }}>
                      {app.remarks}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => alert(`Approved Request: ${app.requestId}`)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-secondary btn-xs"
                          onClick={() => alert(`Rejected Request: ${app.requestId}`)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 7: REPORTS & EXPORTS ─── */}
      {(activeTab === 'REPORTS' || activeTab === 'FEE_OVERVIEW' || activeTab === 'FORM_MANAGEMENT' || activeTab === 'RESULTS_MONITORING') && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            Official University Examination Audit & Statutory Reports
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: '#0B192C' }}>University Examination Master Summary</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.3rem 0 0.75rem 0' }}>Comprehensive counts of students, sessions, centers, fees, and results.</div>
              <button className="btn btn-primary btn-xs" onClick={() => handleExport('UNIVERSITY_SUMMARY')}>
                <Download size={12} style={{ marginRight: '4px' }} /> Download Excel (XLSX)
              </button>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: '#0B192C' }}>Institute & School Status Report</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.3rem 0 0.75rem 0' }}>12-institute comparative matrix with fee compliance and form statuses.</div>
              <button className="btn btn-primary btn-xs" onClick={() => handleExport('INSTITUTE_WISE')}>
                <Download size={12} style={{ marginRight: '4px' }} /> Download Excel (XLSX)
              </button>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: '#0B192C' }}>Department-wise Examination Control Sheet</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.3rem 0 0.75rem 0' }}>Department and semester-level breakdown of student eligibility and forms.</div>
              <button className="btn btn-primary btn-xs" onClick={() => handleExport('DEPARTMENT_WISE')}>
                <Download size={12} style={{ marginRight: '4px' }} /> Download Excel (XLSX)
              </button>
            </div>

            <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, color: '#0B192C' }}>Student Examination & Hall Ticket Roster</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.3rem 0 0.75rem 0' }}>Individual student enrollment, fee clearance, and admit card numbers.</div>
              <button className="btn btn-primary btn-xs" onClick={() => handleExport('STUDENT_LIST')}>
                <Download size={12} style={{ marginRight: '4px' }} /> Download Excel (XLSX)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          5. DEPARTMENT DRILLDOWN DRAWER / MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedDepartmentForDetail && (
        <Modal
          isOpen={Boolean(selectedDepartmentForDetail)}
          onClose={() => setSelectedDepartmentForDetail(null)}
          title={`Department Examination Drilldown: ${selectedDepartmentForDetail.departmentName}`}
          maxWidth="1100px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            
            {/* Header Details */}
            <div style={{ background: '#0B192C', color: '#FFFFFF', padding: '1rem 1.25rem', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>{selectedDepartmentForDetail.departmentName}</div>
              <div style={{ fontSize: '0.8125rem', color: '#CBD5E1', marginTop: '0.2rem' }}>
                Institute: <strong>{selectedDepartmentForDetail.instituteName}</strong> | Program: <strong>{selectedDepartmentForDetail.programName}</strong> | Semester: <strong>{selectedDepartmentForDetail.semesterNumber}</strong>
              </div>
            </div>

            {/* Department Level KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
              <div className="card" style={{ padding: '0.75rem', background: '#F8FAFC', borderLeft: '4px solid #F37023' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B' }}>Eligible Students</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B192C' }}>{selectedDepartmentForDetail.eligibleStudents}</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', background: '#F8FAFC', borderLeft: '4px solid #10B981' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B' }}>Forms Submitted</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>{selectedDepartmentForDetail.formsSubmitted}</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', background: '#F8FAFC', borderLeft: '4px solid #EF4444' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B' }}>Forms Pending</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#EF4444' }}>{selectedDepartmentForDetail.formsPending}</div>
              </div>
              <div className="card" style={{ padding: '0.75rem', background: '#F8FAFC', borderLeft: '4px solid #059669' }}>
                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B' }}>Fees Collected</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#059669' }}>₹{(selectedDepartmentForDetail.feesCollected / 1000).toFixed(0)}k</div>
              </div>
            </div>

            {/* Subject-Wise Table */}
            <div style={{ marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.5rem' }}>
                Subject-Wise Examination & Marks Submission Schedule
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Code</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Subject Name</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Faculty / Examiner</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Exam Date & Time</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Submitted</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Marks Entry</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentSubjects.map(sub => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '0.6rem 0.75rem' }}><code style={{ color: '#F37023' }}>{sub.subjectCode}</code></td>
                      <td style={{ padding: '0.6rem 0.75rem', fontWeight: 700, color: '#0B192C' }}>{sub.subjectName}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{sub.facultyName}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>{sub.examDate} ({sub.examTime})</td>
                      <td style={{ padding: '0.6rem 0.75rem', color: '#10B981', fontWeight: 700 }}>{sub.formsSubmitted} / {sub.eligibleStudents}</td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <Badge variant={sub.marksStatus === 'COMPLETED' ? 'active' : 'warning'}>{sub.marksStatus}</Badge>
                      </td>
                      <td style={{ padding: '0.6rem 0.75rem' }}>
                        <Badge variant="navy">{sub.attendanceEligibilityStatus}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setSelectedDepartmentForDetail(null)}
              >
                Close
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedInstId(selectedDepartmentForDetail.instituteId);
                  setSelectedDeptId(selectedDepartmentForDetail.departmentId);
                  setSelectedDepartmentForDetail(null);
                  setActiveTab('STUDENT_LIST');
                }}
              >
                View Department Students ({selectedDepartmentForDetail.eligibleStudents}) →
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          6. STUDENT HALL TICKET / ADMIT CARD PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedStudentExamRecord && (
        <Modal
          isOpen={Boolean(selectedStudentExamRecord)}
          onClose={() => setSelectedStudentExamRecord(null)}
          title={`Admit Card / Hall Ticket: ${selectedStudentExamRecord.name}`}
          maxWidth="720px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ border: '2px solid #0B192C', padding: '1.5rem', borderRadius: '6px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0B192C' }}>SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>EXAMINATION SECTION • CONTROLLER OF EXAMINATIONS</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F37023', marginTop: '0.35rem' }}>EXAMINATION HALL TICKET / ADMIT CARD</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.8125rem' }}>
                  <div>Student Name: <strong>{selectedStudentExamRecord.name}</strong></div>
                  <div>Enrollment No: <strong style={{ fontFamily: 'monospace' }}>{selectedStudentExamRecord.enrollmentNo}</strong></div>
                  <div>Program: <strong>{selectedStudentExamRecord.programName}</strong> (Semester {selectedStudentExamRecord.semesterNumber})</div>
                  <div>Institute: <strong>{selectedStudentExamRecord.instituteName}</strong></div>
                  <div>Hall Ticket No: <strong style={{ color: '#059669', fontFamily: 'monospace' }}>{selectedStudentExamRecord.hallTicketNo}</strong></div>
                </div>
                <div style={{ border: '1px solid #CBD5E1', height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontSize: '0.75rem', color: '#64748B' }}>
                  Photo Affixed
                </div>
              </div>

              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  Verified: Fee Paid (₹{selectedStudentExamRecord.feeAmount}) • Attendance ({selectedStudentExamRecord.attendancePercentage}%)
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => window.print()}
                >
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Hall Ticket
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          7. STUDENT PROFILE MODAL INTEGRATION
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedStudentForModal && (
        <StudentProfileModal
          isOpen={Boolean(selectedStudentForModal)}
          onClose={() => setSelectedStudentForModal(null)}
          student={selectedStudentForModal}
          initialTab="EXAMINATION"
        />
      )}

    </div>
  );
};
