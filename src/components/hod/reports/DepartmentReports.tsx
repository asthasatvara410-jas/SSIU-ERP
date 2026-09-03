import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService, DepartmentInstitutionalReportData } from '../../../services/departmentScopeService';
import { ReportsLayout, ReportTabKey } from './ReportsLayout';
import { Badge } from '../../common/Badge';
import { 
  Building2, Award, Users, BookOpen, GraduationCap, 
  CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet, 
  BarChart2, PieChart, Layers, Clock, ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DepartmentReportsProps {
  onTabChange?: (tab: ReportTabKey) => void;
}

export const DepartmentReports: React.FC<DepartmentReportsProps> = ({ onTabChange }) => {
  const { user, role } = useAuth();

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch scoped data
  const reportData: DepartmentInstitutionalReportData = useMemo(() => {
    return departmentScopeService.getDepartmentInstitutionalReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  }, [user, role, selectedProgram, selectedSemester]);

  const handleResetFilters = () => {
    setSelectedProgram('ALL');
    setSelectedSemester('ALL');
    setSearchQuery('');
  };

  // Export to Excel (.xlsx)
  const handleExportXLSX = () => {
    departmentScopeService.exportDepartmentComprehensiveReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  };

  return (
    <ReportsLayout
      currentTab="DEPARTMENT"
      onTabChange={onTabChange}
      title="Department Executive &amp; Institutional Accreditation Reports"
      subtitle="Institutional performance summary, NAAC/NBA accreditation indicators, faculty-to-student ratios, and holistic departmental metrics."
      kpis={[
        {
          label: 'Total Students',
          value: reportData.kpis.totalStudents,
          sublabel: `SFR: ${reportData.kpis.facultyStudentRatio}`,
          color: 'var(--brand-navy, #0B192C)',
          textColor: 'var(--brand-navy)'
        },
        {
          label: 'Faculty Strength',
          value: reportData.kpis.totalFaculty,
          sublabel: 'Teaching instructors',
          color: '#0EA5E9',
          textColor: '#0284C7'
        },
        {
          label: 'Academic Programs',
          value: reportData.kpis.totalPrograms,
          sublabel: `${reportData.kpis.totalCourses} Active Courses`,
          color: '#6366F1',
          textColor: '#4F46E5'
        },
        {
          label: 'Average Attendance',
          value: `${reportData.kpis.averageAttendance}%`,
          sublabel: 'Across all divisions',
          color: reportData.kpis.averageAttendance >= 75 ? '#10B981' : '#F59E0B',
          textColor: reportData.kpis.averageAttendance >= 75 ? '#059669' : '#D97706'
        },
        {
          label: 'Average CGPA',
          value: `${reportData.kpis.averageCGPA} / 10`,
          sublabel: 'Department cumulative',
          color: '#10B981',
          textColor: '#059669'
        },
        {
          label: 'At-Risk Cases',
          value: reportData.kpis.atRiskCount,
          sublabel: 'Under mentorship tracking',
          color: reportData.kpis.atRiskCount > 0 ? '#EF4444' : '#10B981',
          textColor: reportData.kpis.atRiskCount > 0 ? '#DC2626' : '#059669',
          badgeText: reportData.kpis.atRiskCount > 0 ? 'ATTENTION' : 'OPTIMAL',
          badgeVariant: reportData.kpis.atRiskCount > 0 ? 'danger' : 'active'
        },
        {
          label: 'Pending Approvals',
          value: reportData.kpis.pendingApprovalsCount,
          sublabel: 'In HOD Queue',
          color: '#F97316',
          textColor: '#EA580C',
          badgeText: reportData.kpis.pendingApprovalsCount > 0 ? 'PENDING' : 'CLEAR',
          badgeVariant: reportData.kpis.pendingApprovalsCount > 0 ? 'warning' : 'active'
        },
        {
          label: 'Exam Readiness',
          value: `${reportData.kpis.examReadinessPercentage}%`,
          sublabel: 'Hall ticket clearance',
          color: '#10B981',
          textColor: '#059669'
        }
      ]}
      selectedProgram={selectedProgram}
      onProgramChange={setSelectedProgram}
      selectedSemester={selectedSemester}
      onSemesterChange={setSelectedSemester}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onResetFilters={handleResetFilters}
      onExportXLSX={handleExportXLSX}
      pdfTitle="Executive Department Institutional & Accreditation Audit Report"
      pdfDataPreview={{
        summary: [
          { label: 'Total Students', value: reportData.kpis.totalStudents },
          { label: 'Faculty Strength', value: reportData.kpis.totalFaculty },
          { label: 'SFR Ratio', value: reportData.kpis.facultyStudentRatio },
          { label: 'Avg Attendance', value: `${reportData.kpis.averageAttendance}%` },
          { label: 'Avg CGPA', value: `${reportData.kpis.averageCGPA} / 10` },
          { label: 'Exam Readiness', value: `${reportData.kpis.examReadinessPercentage}%` }
        ],
        headers: ['Metric Category', 'Quality Indicator', 'Benchmark', 'Current Achievement', 'Status', 'Audit Note'],
        rows: reportData.accreditationMetrics.map(m => [
          m.category,
          m.indicator,
          m.benchmark,
          m.currentAchievement,
          m.complianceStatus,
          m.auditNote
        ])
      }}
    >
      {/* ═══ 1. INSTITUTIONAL ACCREDITATION & QUALITY METRICS ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="#10B981" /> Institutional Quality &amp; Accreditation Metrics (NAAC / NBA Benchmarks)
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Compliance assessment against statutory academic and administrative standards
            </span>
          </div>
          <Badge variant="active">ACCREDITATION AUDIT READY</Badge>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>METRIC CRITERION</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>KEY PERFORMANCE INDICATOR</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>STATUTORY BENCHMARK</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>DEPARTMENT ACHIEVEMENT</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>COMPLIANCE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>AUDIT OBSERVATION</th>
              </tr>
            </thead>
            <tbody>
              {reportData.accreditationMetrics.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {m.category}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    {m.indicator}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>
                    {m.benchmark}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 900, color: '#0284C7', fontSize: '0.85rem' }}>
                    {m.currentAchievement}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                    {m.complianceStatus === 'EXCEEDS' ? (
                      <Badge variant="active">EXCEEDS</Badge>
                    ) : m.complianceStatus === 'COMPLIANT' ? (
                      <Badge variant="navy">COMPLIANT</Badge>
                    ) : (
                      <Badge variant="warning">ATTENTION</Badge>
                    )}
                  </td>
                  <td style={{ padding: '0.65rem 0.85rem', color: '#64748B', fontSize: '0.75rem' }}>
                    {m.auditNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 2. MULTI-DIMENSIONAL DISTRIBUTION MATRICES ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Academic Performance Distribution */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={15} color="var(--brand-orange)" /> Academic Standing Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {reportData.performanceBands.map((band, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
                  <span>{band.band}</span>
                  <span style={{ color: band.color }}>{band.count} ({band.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${band.percentage}%`, height: '100%', background: band.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Teaching Workload Distribution */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={15} color="#0EA5E9" /> Faculty Workload Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {reportData.workloadBands.map((band, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
                  <span>{band.band}</span>
                  <span style={{ color: band.color }}>{band.count} ({band.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${band.percentage}%`, height: '100%', background: band.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance Compliance Distribution */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Users size={15} color="#10B981" /> Attendance Compliance Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {reportData.attendanceBands.map((band, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 700, marginBottom: '2px' }}>
                  <span>{band.band}</span>
                  <span style={{ color: band.color }}>{band.count} ({band.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${band.percentage}%`, height: '100%', background: band.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ 3. PROGRAM BREAKDOWN SUMMARY TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Program &amp; Academic Branch Operations Overview
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Enrollment strength, faculty deployment, and exam clearance across degree programs
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>PROGRAM CODE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>PROGRAM NAME</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ENROLLMENT</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>FACULTY</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SECTIONS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>COURSES</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>AVG ATTENDANCE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>AT RISK</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>EXAM READY</th>
              </tr>
            </thead>
            <tbody>
              {reportData.programSummaries.map((p, idx) => (
                <tr key={p.programId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
                    {p.programCode}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    {p.programName}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                    {p.studentCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>
                    {p.facultyCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    {p.sectionCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    {p.courseCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: p.averageAttendance >= 75 ? '#059669' : '#DC2626' }}>
                    {p.averageAttendance}%
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: p.atRiskCount > 0 ? '#DC2626' : '#10B981' }}>
                    {p.atRiskCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: '#059669' }}>
                    {p.examEligibleCount} ({Math.round((p.examEligibleCount / (p.studentCount || 1)) * 100)}%)
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </ReportsLayout>
  );
};
