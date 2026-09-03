import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService, AttendanceReportData } from '../../../services/departmentScopeService';
import { ReportsLayout, ReportTabKey } from './ReportsLayout';
import { Badge } from '../../common/Badge';
import { 
  Clock, AlertOctagon, CheckCircle2, AlertTriangle, 
  Calendar, FileSpreadsheet, BarChart2, ShieldAlert
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AttendanceReportsProps {
  onTabChange?: (tab: ReportTabKey) => void;
}

export const AttendanceReports: React.FC<AttendanceReportsProps> = ({ onTabChange }) => {
  const { user, role } = useAuth();

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch scoped data
  const reportData: AttendanceReportData = useMemo(() => {
    return departmentScopeService.getDepartmentAttendanceReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  }, [user, role, selectedProgram, selectedSemester]);

  // Filter students based on status and search
  const filteredStudents = useMemo(() => {
    return reportData.students.filter(s => {
      if (selectedStatus === 'ABOVE_85' && s.percentage < 85) return false;
      if (selectedStatus === 'BETWEEN_75_85' && (s.percentage < 75 || s.percentage >= 85)) return false;
      if (selectedStatus === 'SHORTAGE_65_75' && (s.percentage < 65 || s.percentage >= 75)) return false;
      if (selectedStatus === 'CRITICAL_BELOW_65' && s.percentage >= 65) return false;
      if (selectedStatus === 'ALL_SHORTAGE' && s.percentage >= 75) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.enrollmentNo.toLowerCase().includes(q) ||
          s.programCode.toLowerCase().includes(q) ||
          s.sectionName.toLowerCase().includes(q) ||
          s.mentorName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reportData.students, selectedStatus, searchQuery]);

  const handleResetFilters = () => {
    setSelectedProgram('ALL');
    setSelectedSemester('ALL');
    setSelectedStatus('ALL');
    setSearchQuery('');
  };

  // Export to Excel (.xlsx)
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Student Attendance & Shortage Audit
    const studentSheetData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Student Name': s.name,
      'Enrollment ID': s.enrollmentNo,
      'Program': s.programCode,
      'Semester': `Sem ${s.semesterNumber}`,
      'Section': s.sectionName,
      'Total Conducted': s.totalClasses,
      'Classes Attended': s.attendedClasses,
      'Attendance %': `${s.percentage}%`,
      'Shortage Category': s.shortageStatus,
      'Faculty Mentor': s.mentorName,
      'Contact Phone': s.phone
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentSheetData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Attendance Audit');

    // Sheet 2: Subject Attendance Overview
    const subjectSheetData = reportData.subjectAttendance.map((sub, idx) => ({
      '#': idx + 1,
      'Subject Code': sub.code,
      'Subject Title': sub.name,
      'Faculty Instructor': sub.facultyName,
      'Classes Held': sub.classesConducted,
      'Enrolled Students': sub.studentCount,
      'Average Attendance %': `${sub.averageAttendance}%`,
      'Shortage Cases': sub.shortageCount,
      'Attendance Health': sub.status
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(subjectSheetData);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'Subject-wise Attendance');

    // Sheet 3: Monthly Trend
    const trendSheetData = reportData.monthlyTrend.map(t => ({
      'Month': t.month,
      'Average Attendance %': `${t.averageAttendance}%`,
      'Total Sessions Held': t.totalClasses
    }));
    const wsTrend = XLSX.utils.json_to_sheet(trendSheetData);
    XLSX.utils.book_append_sheet(wb, wsTrend, 'Monthly Trend');

    const fileName = `SSIU_Attendance_Shortage_Audit_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getShortageBadge = (status: string, pct: number) => {
    if (pct >= 85) return <Badge variant="active">EXEMPLARY ({pct}%)</Badge>;
    if (pct >= 75) return <Badge variant="navy">REGULAR ({pct}%)</Badge>;
    if (pct >= 65) return <Badge variant="warning">CONDONEABLE ({pct}%)</Badge>;
    return <Badge variant="danger">DEBARRED ({pct}%)</Badge>;
  };

  return (
    <ReportsLayout
      currentTab="ATTENDANCE"
      onTabChange={onTabChange}
      title="Attendance Monitoring &amp; Shortage Audit Reports"
      subtitle="Track student attendance compliance, identify below-75% shortage cases, and inspect subject-level attendance logs."
      kpis={[
        {
          label: 'Average Attendance',
          value: `${reportData.kpis.averageAttendance}%`,
          sublabel: 'Department aggregate',
          color: reportData.kpis.averageAttendance >= 75 ? '#10B981' : '#F59E0B',
          textColor: reportData.kpis.averageAttendance >= 75 ? '#059669' : '#D97706'
        },
        {
          label: 'Students Below 75%',
          value: reportData.kpis.below75Count,
          sublabel: `${reportData.kpis.shortagePercentage}% of department`,
          color: '#F97316',
          textColor: '#EA580C',
          badgeText: reportData.kpis.below75Count > 0 ? 'SHORTAGE ALERT' : 'NONE',
          badgeVariant: reportData.kpis.below75Count > 0 ? 'warning' : 'active'
        },
        {
          label: 'Critical Shortage (<65%)',
          value: reportData.kpis.criticalShortageCount,
          sublabel: 'Exam debarment risk',
          color: '#EF4444',
          textColor: '#DC2626',
          badgeText: reportData.kpis.criticalShortageCount > 0 ? 'ACTION REQ' : 'CLEARED',
          badgeVariant: reportData.kpis.criticalShortageCount > 0 ? 'danger' : 'active'
        },
        {
          label: 'Total Sessions Recorded',
          value: reportData.kpis.totalRecordsCount,
          sublabel: 'Cumulative class periods',
          color: 'var(--brand-navy, #0B192C)',
          textColor: 'var(--brand-navy)'
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
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Attendance Brackets</option>
            <option value="ABOVE_85">Exemplary (≥ 85%)</option>
            <option value="BETWEEN_75_85">Regular (75%–84%)</option>
            <option value="ALL_SHORTAGE">All Shortage (&lt; 75%)</option>
            <option value="SHORTAGE_65_75">Condoneable (65%–74%)</option>
            <option value="CRITICAL_BELOW_65">Critical Debarred (&lt; 65%)</option>
          </select>
        </div>
      }
      onExportXLSX={handleExportXLSX}
      pdfTitle="Official Department Attendance & Shortage Audit Report"
      pdfDataPreview={{
        summary: [
          { label: 'Avg Attendance', value: `${reportData.kpis.averageAttendance}%` },
          { label: 'Shortage Cases (<75%)', value: reportData.kpis.below75Count },
          { label: 'Critical Debarred (<65%)', value: reportData.kpis.criticalShortageCount },
          { label: 'Total Sessions', value: reportData.kpis.totalRecordsCount }
        ],
        headers: ['#', 'Student Name', 'Enrollment', 'Program', 'Sem', 'Total Classes', 'Attended', 'Attendance %', 'Mentor'],
        rows: filteredStudents.map((s, idx) => [
          idx + 1,
          s.name,
          s.enrollmentNo,
          s.programCode,
          `Sem ${s.semesterNumber}`,
          s.totalClasses,
          s.attendedClasses,
          `${s.percentage}%`,
          s.mentorName
        ])
      }}
    >
      {/* ═══ 1. ATTENDANCE BRACKETS & MONTHLY TREND ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Bracket Breakdown */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Clock size={16} color="var(--brand-orange)" /> Attendance Compliance Brackets
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {reportData.attendanceBrackets.map((bracket, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '3px' }}>
                  <span style={{ color: '#334155' }}>{bracket.bracket}</span>
                  <span style={{ color: bracket.color }}>{bracket.count} Students ({bracket.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${bracket.percentage}%`, height: '100%', background: bracket.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Attendance Tracker */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} color="#0EA5E9" /> Monthly Attendance Trajectory
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            {reportData.monthlyTrend.map((m, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{m.month}</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: m.averageAttendance >= 75 ? '#059669' : '#D97706', marginTop: '2px' }}>
                  {m.averageAttendance}%
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: '2px' }}>
                  {m.totalClasses} Sessions
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ 2. STUDENT ATTENDANCE & SHORTAGE LEDGER ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Student-Wise Attendance &amp; Shortage Audit Register
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {filteredStudents.length} of {reportData.students.length} student records
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', width: '45px' }}>#</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>STUDENT NAME</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>ENROLLMENT ID</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>PROGRAM</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SEM</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SEC</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TOTAL</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ATTENDED</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', width: '140px' }}>ATTENDANCE %</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>STATUS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>FACULTY MENTOR</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    No student attendance records matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr 
                    key={s.studentId} 
                    style={{ 
                      borderBottom: '1px solid #E2E8F0', 
                      background: s.percentage < 65 ? '#FEF2F2' : s.percentage < 75 ? '#FFFBEB' : idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' 
                    }}
                  >
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: '#64748B' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: 'var(--brand-navy)' }}>
                      {s.name}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                      {s.enrollmentNo}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', color: '#334155' }}>
                      {s.programCode}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                      Sem {s.semesterNumber}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                      {s.sectionName}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: '#64748B' }}>
                      {s.totalClasses}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: 'var(--brand-navy)' }}>
                      {s.attendedClasses}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ flex: 1, height: '6px', background: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              width: `${s.percentage}%`, 
                              height: '100%', 
                              background: s.percentage >= 75 ? '#10B981' : s.percentage >= 65 ? '#F59E0B' : '#EF4444' 
                            }} 
                          />
                        </div>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 800, 
                          color: s.percentage >= 75 ? '#059669' : s.percentage >= 65 ? '#D97706' : '#DC2626',
                          minWidth: '38px',
                          textAlign: 'right'
                        }}>
                          {s.percentage}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getShortageBadge(s.shortageStatus, s.percentage)}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', color: '#475569' }}>
                      {s.mentorName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 3. SUBJECT-WISE ATTENDANCE SUMMARY TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Subject / Course Attendance Log Overview
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Course-level session counts and average attendance percentages
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT CODE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT TITLE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>FACULTY INSTRUCTOR</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SESSIONS HELD</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>STUDENTS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>AVG ATTENDANCE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SHORTAGE CASES</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>HEALTH</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjectAttendance.map((sub, idx) => (
                <tr key={sub.subjectId} style={{ borderBottom: '1px solid #E2E8F0', background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 800, color: 'var(--brand-navy)', fontFamily: 'monospace' }}>
                    {sub.code}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: 700, color: '#1E293B' }}>
                    {sub.name}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', color: '#475569' }}>
                    {sub.facultyName}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {sub.classesConducted}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {sub.studentCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: sub.averageAttendance >= 80 ? '#059669' : sub.averageAttendance < 70 ? '#DC2626' : '#D97706' }}>
                    {sub.averageAttendance}%
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: sub.shortageCount > 0 ? '#EA580C' : '#10B981' }}>
                    {sub.shortageCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    {sub.status === 'HEALTHY' ? (
                      <Badge variant="active">HEALTHY</Badge>
                    ) : sub.status === 'MODERATE' ? (
                      <Badge variant="warning">MODERATE</Badge>
                    ) : (
                      <Badge variant="danger">POOR</Badge>
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
