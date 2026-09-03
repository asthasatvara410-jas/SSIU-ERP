import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService, FacultyWorkloadReportData } from '../../../services/departmentScopeService';
import { ReportsLayout, ReportTabKey } from './ReportsLayout';
import { Badge } from '../../common/Badge';
import { 
  Users, Clock, AlertTriangle, CheckCircle2, 
  BookOpen, Award, Layers, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FacultyReportsProps {
  onTabChange?: (tab: ReportTabKey) => void;
}

export const FacultyReports: React.FC<FacultyReportsProps> = ({ onTabChange }) => {
  const { user, role } = useAuth();

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedWorkloadStatus, setSelectedWorkloadStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch scoped data
  const reportData: FacultyWorkloadReportData = useMemo(() => {
    return departmentScopeService.getDepartmentFacultyReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  }, [user, role, selectedProgram, selectedSemester]);

  // Filter faculty
  const filteredFaculty = useMemo(() => {
    return reportData.faculty.filter(f => {
      if (selectedWorkloadStatus !== 'ALL') {
        if (selectedWorkloadStatus === 'OPTIMAL' && f.workloadStatus !== 'NORMAL') return false;
        if (selectedWorkloadStatus === 'UNDERLOAD' && f.workloadStatus !== 'UNDERLOAD') return false;
        if (selectedWorkloadStatus === 'HIGH_LOAD' && f.workloadStatus !== 'HIGH LOAD') return false;
        if (selectedWorkloadStatus === 'OVERLOAD' && f.workloadStatus !== 'OVERLOAD') return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          f.facultyName.toLowerCase().includes(q) ||
          f.employeeId.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q) ||
          f.programCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reportData.faculty, selectedWorkloadStatus, searchQuery]);

  const handleResetFilters = () => {
    setSelectedProgram('ALL');
    setSelectedSemester('ALL');
    setSelectedWorkloadStatus('ALL');
    setSearchQuery('');
  };

  // Export to Excel (.xlsx)
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Faculty Master & Teaching Workload
    const facultySheetData = filteredFaculty.map((f, idx) => ({
      '#': idx + 1,
      'Faculty Name': f.facultyName,
      'Employee ID': f.employeeId,
      'Designation': f.designation,
      'Department': f.departmentName,
      'Program / Branch': f.programCode,
      'Assigned Courses': f.assignedSubjects.map(s => `${s.code} (${s.hours}h)`).join(', ') || 'Unassigned',
      'Theory Hours / Week': f.theoryHours,
      'Lab Hours / Week': f.labHours,
      'Total Weekly Load (Hrs)': f.totalWeeklyHours,
      'Benchmark Target (Hrs)': f.targetWeeklyHours,
      'Hours Difference': f.hoursDifference > 0 ? `+${f.hoursDifference}h` : `${f.hoursDifference}h`,
      'Workload Status': f.workloadStatus,
      'Mentor Role': f.assignedMenteesCount > 0 ? `Yes (${f.assignedMenteesCount} Mentees)` : 'No',
      'Performance Band': (f as any).performanceBand || 'GOOD',
      'Official Email': f.email || `${f.employeeId.toLowerCase()}@ssiu.edu.in`
    }));
    const wsFaculty = XLSX.utils.json_to_sheet(facultySheetData);
    XLSX.utils.book_append_sheet(wb, wsFaculty, 'Faculty Workload Report');

    // Sheet 2: Course / Subject Allocations
    const subSheetData = reportData.subjectAllocations.map((sub, idx) => ({
      '#': idx + 1,
      'Subject Code': sub.subjectCode,
      'Subject Title': sub.subjectName,
      'Course Type': sub.courseType,
      'Program': sub.programCode,
      'Semester': `Sem ${sub.semesterNumber}`,
      'Credits': sub.credits,
      'Theory Hours': sub.theoryHours,
      'Lab Hours': sub.labHours,
      'Assigned Faculty': sub.assignedFacultyName,
      'Faculty Employee ID': sub.assignedFacultyEmployeeId,
      'Allocation Status': sub.allocationStatus,
      'Allocation %': `${sub.allocationPercentage}%`
    }));
    const wsSub = XLSX.utils.json_to_sheet(subSheetData);
    XLSX.utils.book_append_sheet(wb, wsSub, 'Curriculum Allocations');

    const fileName = `SSIU_Faculty_Workload_Allocation_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getWorkloadBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return <Badge variant="active">OPTIMAL (12–16h)</Badge>;
      case 'HIGH LOAD':
        return <Badge variant="warning">HIGH LOAD (17–20h)</Badge>;
      case 'OVERLOAD':
        return <Badge variant="danger">OVERLOAD (&gt;20h)</Badge>;
      case 'UNDERLOAD':
        return <Badge variant="purple">UNDERLOAD (&lt;12h)</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (band: string) => {
    switch (band) {
      case 'EXCELLENT':
        return <Badge variant="active">EXCELLENT</Badge>;
      case 'GOOD':
        return <Badge variant="navy">GOOD</Badge>;
      case 'NEEDS_IMPROVEMENT':
        return <Badge variant="warning">ATTENTION</Badge>;
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL</Badge>;
      default:
        return <Badge variant="navy">{band}</Badge>;
    }
  };

  return (
    <ReportsLayout
      currentTab="FACULTY"
      onTabChange={onTabChange}
      title="Faculty Workload, Allocation &amp; Capacity Reports"
      subtitle="Monitor faculty teaching hours, curriculum allocations, load balancing compliance, and mentor responsibilities."
      kpis={[
        {
          label: 'Total Faculty',
          value: reportData.kpis.totalFaculty,
          sublabel: 'Department instructors',
          color: 'var(--brand-navy, #0B192C)',
          textColor: 'var(--brand-navy)'
        },
        {
          label: 'Average Workload',
          value: `${reportData.kpis.averageWorkload} Hrs`,
          sublabel: 'Per faculty / week',
          color: '#0EA5E9',
          textColor: '#0284C7'
        },
        {
          label: 'Overloaded Faculty',
          value: reportData.kpis.overloadedCount,
          sublabel: '> 20 Teaching Hours/Wk',
          color: '#EF4444',
          textColor: '#DC2626',
          badgeText: reportData.kpis.overloadedCount > 0 ? 'ACTION REQ' : 'BALANCED',
          badgeVariant: reportData.kpis.overloadedCount > 0 ? 'danger' : 'active'
        },
        {
          label: 'Underloaded Faculty',
          value: reportData.kpis.underloadedCount,
          sublabel: '< 12 Teaching Hours/Wk',
          color: '#F59E0B',
          textColor: '#D97706',
          badgeText: reportData.kpis.underloadedCount > 0 ? 'CAPACITY AVAIL' : 'OPTIMAL',
          badgeVariant: reportData.kpis.underloadedCount > 0 ? 'warning' : 'active'
        }
      ]}
      selectedProgram={selectedProgram}
      onProgramChange={setSelectedProgram}
      selectedSemester={selectedSemester}
      onSemesterChange={setSelectedSemester}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onResetFilters={handleResetFilters}
      extraFilterSlot={
        <div style={{ width: '170px' }}>
          <select
            className="form-control"
            value={selectedWorkloadStatus}
            onChange={e => setSelectedWorkloadStatus(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Workload Statuses</option>
            <option value="OPTIMAL">Optimal (12–16h)</option>
            <option value="HIGH_LOAD">High Load (17–20h)</option>
            <option value="OVERLOAD">Overloaded (&gt;20h)</option>
            <option value="UNDERLOAD">Underloaded (&lt;12h)</option>
          </select>
        </div>
      }
      onExportXLSX={handleExportXLSX}
      pdfTitle="Official Department Faculty Workload & Allocation Report"
      pdfDataPreview={{
        summary: [
          { label: 'Total Faculty', value: reportData.kpis.totalFaculty },
          { label: 'Avg Weekly Load', value: `${reportData.kpis.averageWorkload} Hrs` },
          { label: 'Overloaded', value: reportData.kpis.overloadedCount },
          { label: 'Underloaded', value: reportData.kpis.underloadedCount }
        ],
        headers: ['#', 'Faculty Name', 'Employee ID', 'Designation', 'Program', 'Theory Hrs', 'Lab Hrs', 'Total Hrs', 'Workload Status', 'Mentees'],
        rows: filteredFaculty.map((f, idx) => [
          idx + 1,
          f.facultyName,
          f.employeeId,
          f.designation,
          f.programCode,
          f.theoryHours,
          f.labHours,
          f.totalWeeklyHours,
          f.workloadStatus,
          f.assignedMenteesCount
        ])
      }}
    >
      {/* ═══ 1. WORKLOAD DISTRIBUTION CARDS ═══ */}
      <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Clock size={16} color="var(--brand-orange)" /> Teaching Workload Capacity &amp; Distribution
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {reportData.workloadDistribution.map((band, idx) => (
            <div key={idx} style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderLeft: `4px solid ${band.color}`, borderRadius: '6px', border: '1px solid #E2E8F0', borderLeftWidth: '4px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>{band.bracket}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: band.color, marginTop: '2px' }}>
                {band.count} <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Faculty ({band.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ 2. MAIN FACULTY WORKLOAD TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Faculty Master Workload &amp; Assignment Register
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {filteredFaculty.length} of {reportData.faculty.length} faculty instructors
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', width: '45px' }}>#</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>FACULTY NAME</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>EMPLOYEE ID</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>DESIGNATION</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>ASSIGNED SUBJECTS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TH HRS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>LAB HRS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TOTAL HRS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>DIFF</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>WORKLOAD STATUS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>MENTOR LOAD</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>PERFORMANCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    No faculty records matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((f, idx) => (
                  <tr 
                    key={f.facultyId} 
                    style={{ 
                      borderBottom: '1px solid #E2E8F0', 
                      background: f.workloadStatus === 'OVERLOAD' ? '#FEF2F2' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' 
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                      {f.facultyName}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                      {f.employeeId}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', color: '#334155' }}>
                      {f.designation}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {f.assignedSubjects.length === 0 ? (
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Unassigned</span>
                        ) : (
                          f.assignedSubjects.map(s => (
                            <span 
                              key={s.id}
                              style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 700, 
                                background: '#EFF6FF', 
                                color: '#1D4ED8', 
                                padding: '1px 6px', 
                                borderRadius: '4px',
                                border: '1px solid #BFDBFE'
                              }}
                            >
                              {s.code} ({s.hours}h)
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: '#64748B' }}>
                      {f.theoryHours}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: '#64748B' }}>
                      {f.labHours}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: 'var(--brand-navy)', fontSize: '0.85rem' }}>
                      {f.totalWeeklyHours}h
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: f.hoursDifference > 0 ? '#DC2626' : f.hoursDifference < 0 ? '#0284C7' : '#059669' }}>
                      {f.hoursDifference > 0 ? `+${f.hoursDifference}h` : `${f.hoursDifference}h`}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getWorkloadBadge(f.workloadStatus)}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {f.assignedMenteesCount > 0 ? (
                        <Badge variant="navy">{f.assignedMenteesCount} Mentees</Badge>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>None</span>
                      )}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getPerformanceBadge((f as any).performanceBand || 'GOOD')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 3. CURRICULUM SUBJECT ALLOCATION TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Curriculum Subject Allocation &amp; Faculty Coverage Ledger
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Subject-to-faculty teaching assignment matrix and allocation status
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT CODE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT TITLE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TYPE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SEM</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>CREDITS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TH / LAB</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>ASSIGNED FACULTY</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ALLOCATION %</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjectAllocations.map((sub, idx) => (
                <tr key={sub.subjectId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                    {sub.subjectCode}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    {sub.subjectName}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    <Badge variant="navy">{sub.courseType}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    Sem {sub.semesterNumber}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700 }}>
                    {sub.credits}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: '#64748B' }}>
                    {sub.theoryHours}h / {sub.labHours}h
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: sub.assignedFacultyName !== 'Unassigned' ? 'var(--brand-navy)' : '#DC2626' }}>
                    {sub.assignedFacultyName}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: sub.allocationPercentage === 100 ? '#059669' : '#DC2626' }}>
                    {sub.allocationPercentage}%
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    {sub.allocationStatus === 'FULLY_ALLOCATED' ? (
                      <Badge variant="active">ALLOCATED</Badge>
                    ) : sub.allocationStatus === 'PARTIALLY_ALLOCATED' ? (
                      <Badge variant="warning">PARTIAL</Badge>
                    ) : (
                      <Badge variant="danger">UNALLOCATED</Badge>
                    )}
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
