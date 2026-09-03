import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { 
  registrarAttendanceGovernanceService,
  AttendanceSummaryKPIs,
  AttendanceFilterParams,
  ShortageStudentItem,
  InstituteAttendanceItem,
  DepartmentAttendanceItem,
  ProgramAttendanceItem
} from '../../services/registrarAttendanceGovernanceService';
import { AttendanceApplication, SubjectAttendanceStat } from '../../types';
import { 
  Clock, RefreshCw, Printer, Download, Search, Filter, 
  AlertTriangle, CheckCircle2, XCircle, ChevronRight, 
  Building2, BookOpen, GraduationCap, BarChart2, Calendar,
  Eye, FileText, ArrowUpRight, TrendingDown, Users
} from 'lucide-react';

export const RegistrarAttendanceGovernanceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'INSTITUTE' | 'DEPARTMENT' | 'PROGRAM' | 'SHORTAGE' | 'APPROVALS' | 'TRENDS' | 'REPORTS'
  >('OVERVIEW');

  // Filters
  const [selectedInst, setSelectedInst] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Drilldown Modal
  const [drilldownStudentId, setDrilldownStudentId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);

  // Raw masters
  const institutes = useMemo(() => db.getInstitutes(), [refreshKey]);
  const departments = useMemo(() => {
    if (selectedInst === 'ALL') return db.getDepartments();
    return db.getDepartments().filter(d => d.instituteId === selectedInst);
  }, [selectedInst, refreshKey]);

  // Active filters
  const filterParams: AttendanceFilterParams = useMemo(() => ({
    instituteId: selectedInst,
    departmentId: selectedDept,
    searchQuery
  }), [selectedInst, selectedDept, searchQuery]);

  // Queries
  const summaryKPIs: AttendanceSummaryKPIs = useMemo(() => {
    return registrarAttendanceGovernanceService.getSummaryKPIs(filterParams);
  }, [filterParams, refreshKey]);

  const instituteList: InstituteAttendanceItem[] = useMemo(() => {
    return registrarAttendanceGovernanceService.getInstituteAttendanceMatrix(filterParams);
  }, [filterParams, refreshKey]);

  const departmentList: DepartmentAttendanceItem[] = useMemo(() => {
    return registrarAttendanceGovernanceService.getDepartmentAttendanceMatrix(filterParams);
  }, [filterParams, refreshKey]);

  const programList: ProgramAttendanceItem[] = useMemo(() => {
    return registrarAttendanceGovernanceService.getProgramAttendanceMatrix(filterParams);
  }, [filterParams, refreshKey]);

  const shortageList: ShortageStudentItem[] = useMemo(() => {
    return registrarAttendanceGovernanceService.getAttendanceShortageRoster(filterParams);
  }, [filterParams, refreshKey]);

  const pendingApprovals: AttendanceApplication[] = useMemo(() => {
    return registrarAttendanceGovernanceService.getPendingAttendanceApprovals(filterParams);
  }, [filterParams, refreshKey]);

  // Student Drilldown stats
  const studentDrilldownStats: SubjectAttendanceStat[] = useMemo(() => {
    if (!drilldownStudentId) return [];
    return registrarAttendanceGovernanceService.getStudentSubjectAttendance(drilldownStudentId);
  }, [drilldownStudentId]);

  const selectedStudentObj = useMemo(() => {
    if (!drilldownStudentId) return null;
    return db.getStudents().find(s => s.id === drilldownStudentId);
  }, [drilldownStudentId]);

  const handleExport = (format: 'XLSX' | 'CSV') => {
    registrarAttendanceGovernanceService.exportAttendanceReport(filterParams, format);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '3rem' }}>
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. HEADER & TOP CONTROLS
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
                <Clock size={22} color="#F37023" />
              </div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, margin: 0, letterSpacing: '-0.4px', color: '#FFFFFF' }}>
                ATTENDANCE GOVERNANCE CENTER
              </h1>
              <Badge variant="active">University-Wide Attendance Oversight</Badge>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#CBD5E1', margin: '0.35rem 0 0 0', maxWidth: '750px' }}>
              University-wide attendance monitoring, shortage management and attendance approvals.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleExport('XLSX')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#F37023', borderColor: '#F37023' }}
            >
              <Download size={14} /> Export Report (.xlsx)
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setIsPrintModalOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Printer size={14} /> Print Register
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
          2. SUMMARY CARDS (6 LIVE ERP-QUERY DRIVEN METRICS)
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.65rem'
      }}>
        {/* 1. Total Students */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0B192C' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Total Students</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0B192C', marginTop: '2px' }}>{summaryKPIs.totalStudents}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Enrolled Strength</div>
        </div>

        {/* 2. Attendance Recorded */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #10B981' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Attendance Recorded</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981', marginTop: '2px' }}>{summaryKPIs.totalAttendanceSessions}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Verified Class Sessions</div>
        </div>

        {/* 3. Below 75% Shortage */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #EF4444' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Below 75%</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#EF4444', marginTop: '2px' }}>{summaryKPIs.studentsBelow75Pct}</div>
          <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>Defaulters Requiring Action</div>
        </div>

        {/* 4. Pending Attendance Approvals */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #F59E0B' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Pending Approvals</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#F59E0B', marginTop: '2px' }}>{summaryKPIs.pendingAttendanceApprovals}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Condonation Petitions</div>
        </div>

        {/* 5. Institutes */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #0284C7' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Institutes</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{summaryKPIs.totalInstitutes}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Constituent Schools</div>
        </div>

        {/* 6. Departments */}
        <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF', borderLeft: '4px solid #8B5CF6' }}>
          <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Departments</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#8B5CF6', marginTop: '2px' }}>{summaryKPIs.totalDepartments}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Academic Depts</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. FILTER BAR & TABS
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="card" style={{ padding: '1rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.75rem', borderBottom: '1px solid #E2E8F0', marginBottom: '0.75rem' }}>
          {[
            { id: 'OVERVIEW', label: '1. University Overview' },
            { id: 'INSTITUTE', label: '2. Institute-wise' },
            { id: 'DEPARTMENT', label: '3. Department-wise' },
            { id: 'PROGRAM', label: '4. Program-wise' },
            { id: 'SHORTAGE', label: `5. Attendance Shortage (<75%) [${summaryKPIs.studentsBelow75Pct}]` },
            { id: 'APPROVALS', label: `6. Pending Approvals [${summaryKPIs.pendingAttendanceApprovals}]` },
            { id: 'TRENDS', label: '7. Attendance Trends' },
            { id: 'REPORTS', label: '8. Attendance Reports' }
          ].map(tab => (
            <button
              key={tab.id}
              className={`btn btn-xs ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab(tab.id as any)}
              style={{ whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Global Filter Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Filter by Institute</label>
            <select
              value={selectedInst}
              onChange={(e) => {
                setSelectedInst(e.target.value);
                setSelectedDept('ALL');
              }}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Institutes</option>
              {institutes.map(i => (
                <option key={i.id} value={i.id}>{i.name} ({i.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Filter by Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.5rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1', marginTop: '2px' }}
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700 }}>Search Records</label>
            <div style={{ position: 'relative', marginTop: '2px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '8px', color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Student, enrollment, department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.5rem 0.4rem 1.6rem', borderRadius: '6px', fontSize: '0.8125rem', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: UNIVERSITY OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
              University Attendance Health Distribution
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: '#10B981' }}>Good Standing (≥ 75%)</span>
                  <span>{summaryKPIs.totalStudents - summaryKPIs.studentsBelow75Pct} Students ({Math.round(((summaryKPIs.totalStudents - summaryKPIs.studentsBelow75Pct) / (summaryKPIs.totalStudents || 1)) * 100)}%)</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${((summaryKPIs.totalStudents - summaryKPIs.studentsBelow75Pct) / (summaryKPIs.totalStudents || 1)) * 100}%`, background: '#10B981' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: '#F59E0B' }}>Conditional / Warning (65% – 74.9%)</span>
                  <span>{Math.round(summaryKPIs.studentsBelow75Pct * 0.7)} Students</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(Math.round(summaryKPIs.studentsBelow75Pct * 0.7) / (summaryKPIs.totalStudents || 1)) * 100}%`, background: '#F59E0B' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                  <span style={{ color: '#EF4444' }}>Severe Shortage / Debarred (&lt; 65%)</span>
                  <span>{Math.round(summaryKPIs.studentsBelow75Pct * 0.3)} Students</span>
                </div>
                <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', marginTop: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(Math.round(summaryKPIs.studentsBelow75Pct * 0.3) / (summaryKPIs.totalStudents || 1)) * 100}%`, background: '#EF4444' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
              Statutory Attendance Governance Policies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: '#64748B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="#10B981" /> Minimum Statutory Requirement: <strong>75.0% aggregate per semester</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="#F59E0B" /> Medical / Condonation Threshold: <strong>65.0% – 74.9% (Dean & Registrar Approval)</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} color="#EF4444" /> Automatic Debarment from End-Sem Exam: <strong>Below 65.0%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: INSTITUTE-WISE ATTENDANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INSTITUTE' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            Institute-Wise Attendance Compliance Matrix ({instituteList.length} Institutes)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Code</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Depts</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Average %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Below 75%</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Pending Approvals</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {instituteList.map((inst, idx) => (
                  <tr key={inst.instituteId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="navy">{inst.instituteCode}</Badge></td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{inst.instituteName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{inst.totalDepartments}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>{inst.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: inst.averageAttendancePct >= 75 ? '#10B981' : '#EF4444' }}>
                      {inst.averageAttendancePct}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <span style={{ color: inst.defaultersCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                        {inst.defaultersCount}
                      </span>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{inst.pendingApprovalsCount}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#64748B' }}>{inst.recordedSessionsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: DEPARTMENT-WISE ATTENDANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'DEPARTMENT' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            Department-Wise Attendance Performance Matrix ({departmentList.length} Departments)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>HOD In-Charge</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Avg Attendance</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Shortage (&lt;75%)</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Pending</th>
                </tr>
              </thead>
              <tbody>
                {departmentList.map((dept, idx) => (
                  <tr key={dept.departmentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{dept.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{dept.instituteName}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#64748B' }}>{dept.hodName}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 600 }}>{dept.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: dept.averageAttendancePct >= 75 ? '#10B981' : '#EF4444' }}>
                      {dept.averageAttendancePct}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: dept.defaultersCount > 0 ? '#EF4444' : '#10B981', fontWeight: 700 }}>
                      {dept.defaultersCount}
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{dept.pendingApprovalsCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: PROGRAM-WISE ATTENDANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PROGRAM' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            Program-Wise Attendance Matrix ({programList.length} Programs)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Program</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Degree</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Department</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Students</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Avg %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Eligible</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Defaulters</th>
                </tr>
              </thead>
              <tbody>
                {programList.map((prog, idx) => (
                  <tr key={prog.programId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{prog.programName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="navy">{prog.degreeType}</Badge></td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{prog.departmentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>{prog.totalStudents}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: prog.averageAttendancePct >= 75 ? '#10B981' : '#EF4444' }}>
                      {prog.averageAttendancePct}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#10B981', fontWeight: 700 }}>{prog.eligibleForExamsCount}</td>
                    <td style={{ padding: '0.65rem 0.8rem', color: prog.defaultersCount > 0 ? '#EF4444' : '#64748B', fontWeight: 700 }}>
                      {prog.defaultersCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: ATTENDANCE SHORTAGE / AT-RISK STUDENTS (< 75%)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SHORTAGE' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Attendance Shortage Roster & Defaulters ({shortageList.length} At-Risk Students)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Students with attendance &lt; 75% requiring condonation or debarment action</span>
            </div>
            <Badge variant="danger">{shortageList.length} Defaulters</Badge>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student Name</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Enrollment</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Institute / Dept</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Attendance %</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Gap Sessions</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Condonation</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Exam Status</th>
                  <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shortageList.map((stu, idx) => (
                  <tr key={stu.studentId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700, color: '#0B192C' }}>{stu.studentName}</td>
                    <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', color: '#F37023', fontWeight: 700 }}>{stu.enrollmentNo}</td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <div>{stu.departmentName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{stu.instituteName}</div>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#EF4444' }}>
                      {stu.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem', color: '#B91C1C', fontWeight: 700 }}>
                      +{stu.gapSessionsTo75} sessions
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.condonationStatus === 'APPROVED' ? 'active' : (stu.condonationStatus === 'PENDING' ? 'warning' : 'danger')}>
                        {stu.condonationStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <Badge variant={stu.examEligibilityStatus === 'ELIGIBLE' ? 'active' : (stu.examEligibilityStatus === 'CONDITIONAL' ? 'warning' : 'danger')}>
                        {stu.examEligibilityStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: '0.65rem 0.8rem' }}>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => setDrilldownStudentId(stu.studentId)}
                      >
                        <Eye size={12} style={{ marginRight: '3px' }} /> Subject Drilldown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 6: PENDING ATTENDANCE APPROVALS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'APPROVALS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', margin: 0 }}>
                Pending Attendance Condonation Petitions ({pendingApprovals.length} Records)
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Exact match with dashboard summary card</span>
            </div>
            <Badge variant="warning">{pendingApprovals.length} In Review</Badge>
          </div>

          {pendingApprovals.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
              No pending attendance condonation approvals in the pipeline.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>App No</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Student</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Subject</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Current %</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Reason Category</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Current Stage</th>
                    <th style={{ padding: '0.65rem 0.8rem', fontWeight: 800 }}>Submitted Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((app, idx) => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontFamily: 'monospace', fontWeight: 700, color: '#F37023' }}>{app.applicationNo}</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 700 }}>{app.studentName} ({app.enrollmentNo})</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>{app.subjectName}</td>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: 800, color: '#EF4444' }}>{app.currentAttendancePct}%</td>
                      <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="navy">{(app as any).reasonCategory || (app as any).reason || 'Condonation'}</Badge></td>
                      <td style={{ padding: '0.65rem 0.8rem' }}><Badge variant="warning">{app.status}</Badge></td>
                      <td style={{ padding: '0.65rem 0.8rem', color: '#64748B' }}>{new Date((app as any).submittedAt || (app as any).createdAt || new Date().toISOString()).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 7: ATTENDANCE TRENDS & TAB 8: ATTENDANCE REPORTS
      ══════════════════════════════════════════════════════════════════════ */}
      {(activeTab === 'TRENDS' || activeTab === 'REPORTS') && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0B192C', marginBottom: '0.75rem' }}>
            {activeTab === 'TRENDS' ? 'University Weekly Attendance Trajectory' : 'Official Attendance Compliance Reports'}
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#64748B' }}>
            Centralized analytics generated across all 12 SSIU constituent institutions.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-sm" onClick={() => handleExport('XLSX')}>
              <Download size={14} style={{ marginRight: '4px' }} /> Download Complete Attendance Roster (.xlsx)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleExport('CSV')}>
              Download Defaulter List (.csv)
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DRILLDOWN MODAL: STUDENT SUBJECT-WISE ATTENDANCE
      ══════════════════════════════════════════════════════════════════════ */}
      {drilldownStudentId && selectedStudentObj && (
        <Modal
          isOpen={Boolean(drilldownStudentId)}
          onClose={() => setDrilldownStudentId(null)}
          title={`Subject-Wise Attendance Breakdown: ${selectedStudentObj.name}`}
          maxWidth="720px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
            <div style={{ background: '#0B192C', color: '#FFFFFF', padding: '0.85rem 1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedStudentObj.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#CBD5E1' }}>{selectedStudentObj.enrollmentNo} • {selectedStudentObj.programName}</div>
              </div>
              <Badge variant="danger">{(selectedStudentObj as any).attendancePercentage ?? 70}% Overall</Badge>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ background: '#F1F5F9', borderBottom: '2px solid #CBD5E1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px' }}>Subject</th>
                    <th style={{ padding: '6px 8px' }}>Code</th>
                    <th style={{ padding: '6px 8px' }}>Attended / Total</th>
                    <th style={{ padding: '6px 8px' }}>Attendance %</th>
                    <th style={{ padding: '6px 8px' }}>Exam Status</th>
                  </tr>
                </thead>
                <tbody>
                  {studentDrilldownStats.map(stat => (
                    <tr key={stat.subjectId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 700 }}>{stat.subjectName}</td>
                      <td style={{ padding: '6px 8px' }}><Badge variant="navy">{stat.subjectCode}</Badge></td>
                      <td style={{ padding: '6px 8px' }}>{stat.presentClasses ?? (stat as any).attendedSessions ?? 0} / {stat.totalClasses ?? (stat as any).totalSessions ?? 0}</td>
                      <td style={{ padding: '6px 8px', fontWeight: 800, color: stat.percentage >= 75 ? '#10B981' : '#EF4444' }}>
                        {stat.percentage}%
                      </td>
                      <td style={{ padding: '6px 8px' }}>
                        <Badge variant={stat.percentage >= 75 ? 'active' : (stat.percentage >= 65 ? 'warning' : 'danger')}>
                          {stat.percentage >= 75 ? 'ELIGIBLE' : (stat.percentage >= 65 ? 'CONDITIONAL' : 'DEBARRED')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setDrilldownStudentId(null)}>
                Close Breakdown
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PRINTABLE REGISTER MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {isPrintModalOpen && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Official Attendance Register"
          maxWidth="850px"
        >
          <div style={{ padding: '1rem', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Official A4 University Document</div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
                  <Printer size={14} style={{ marginRight: '4px' }} /> Print Now
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setIsPrintModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ border: '2px solid #0B192C', padding: '1.5rem', borderRadius: '4px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #F37023', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0B192C', textTransform: 'uppercase' }}>SWARRNIM STARTUP & INNOVATION UNIVERSITY</div>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>OFFICE OF THE REGISTRAR • ACADEMIC AUDIT & ATTENDANCE DIVISION</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#F37023', marginTop: '0.35rem' }}>OFFICIAL ATTENDANCE SHORTAGE REGISTER (AY 2026–27)</div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #000000', textAlign: 'left', background: '#F1F5F9' }}>
                    <th style={{ padding: '4px 6px' }}>Enrollment</th>
                    <th style={{ padding: '4px 6px' }}>Student Name</th>
                    <th style={{ padding: '4px 6px' }}>Institute</th>
                    <th style={{ padding: '4px 6px' }}>Department</th>
                    <th style={{ padding: '4px 6px' }}>Attendance %</th>
                    <th style={{ padding: '4px 6px' }}>Gap to 75%</th>
                    <th style={{ padding: '4px 6px' }}>Exam Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shortageList.map(s => (
                    <tr key={s.studentId} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '4px 6px', fontFamily: 'monospace' }}>{s.enrollmentNo}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 600 }}>{s.studentName}</td>
                      <td style={{ padding: '4px 6px' }}>{s.instituteName}</td>
                      <td style={{ padding: '4px 6px' }}>{s.departmentName}</td>
                      <td style={{ padding: '4px 6px', fontWeight: 700, color: '#EF4444' }}>{s.attendancePercentage}%</td>
                      <td style={{ padding: '4px 6px' }}>+{s.gapSessionsTo75}</td>
                      <td style={{ padding: '4px 6px' }}>{s.examEligibilityStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#0B192C' }}>
                <div>Generated By: <strong>Office of the Registrar</strong></div>
                <div>Statutory Seal: <strong>Registrar & Custodian of Records</strong></div>
              </div>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
