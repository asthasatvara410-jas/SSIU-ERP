import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService, StudentMasterReportData } from '../../../services/departmentScopeService';
import { ReportsLayout, ReportTabKey } from './ReportsLayout';
import { Badge } from '../../common/Badge';
import { 
  Users, UserCheck, AlertTriangle, Layers, 
  FileSpreadsheet, Mail, Phone, BookOpen, School
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentReportsProps {
  onTabChange?: (tab: ReportTabKey) => void;
}

export const StudentReports: React.FC<StudentReportsProps> = ({ onTabChange }) => {
  const { user, role } = useAuth();

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch scoped data
  const reportData: StudentMasterReportData = useMemo(() => {
    return departmentScopeService.getDepartmentStudentMasterReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  }, [user, role, selectedProgram, selectedSemester]);

  // Filter students
  const filteredStudents = useMemo(() => {
    return reportData.students.filter(s => {
      if (selectedStatus === 'ACTIVE' && s.academicStatus !== 'ACTIVE_REGULAR') return false;
      if (selectedStatus === 'AT_RISK' && s.academicStatus !== 'AT_RISK') return false;
      if (selectedStatus === 'PROBATION' && s.academicStatus !== 'ACADEMIC_PROBATION') return false;
      if (selectedStatus === 'ON_LEAVE' && s.academicStatus !== 'ON_LEAVE') return false;

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

    // Sheet 1: Student Master Roster
    const studentSheetData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Student Name': s.name,
      'Enrollment ID': s.enrollmentNo,
      'Program': s.programCode,
      'Semester': `Sem ${s.semesterNumber}`,
      'Section / Division': s.sectionName,
      'CGPA': s.cgpa,
      'Attendance %': `${s.attendancePercentage}%`,
      'Admission Batch': s.admissionBatch,
      'Gender': s.gender,
      'Assigned Faculty Mentor': s.mentorName,
      'Official Email': s.officialEmail,
      'Contact Phone': s.phone,
      'Academic Status': s.academicStatus
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentSheetData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Student Master Roster');

    // Sheet 2: Program Demographics
    const progSheetData = reportData.programBreakdown.map(p => ({
      'Program Code': p.programCode,
      'Program Name': p.programName,
      'Total Enrollment': p.totalStudents,
      'Active Regular': p.activeStudents,
      'At Risk / Shortage': p.atRiskStudents,
      'Male Students': p.maleCount,
      'Female Students': p.femaleCount,
      'Average Attendance %': `${p.avgAttendance}%`,
      'Average CGPA': p.avgCGPA
    }));
    const wsProg = XLSX.utils.json_to_sheet(progSheetData);
    XLSX.utils.book_append_sheet(wb, wsProg, 'Program Demographics');

    // Sheet 3: Section Breakdown
    const secSheetData = reportData.sectionBreakdown.map(sec => ({
      'Section Name': sec.sectionName,
      'Program': sec.programCode,
      'Semester': `Sem ${sec.semesterNumber}`,
      'Student Count': sec.studentCount,
      'Faculty Mentor': sec.mentorName,
      'Avg Attendance %': `${sec.avgAttendance}%`
    }));
    const wsSec = XLSX.utils.json_to_sheet(secSheetData);
    XLSX.utils.book_append_sheet(wb, wsSec, 'Section Summary');

    const fileName = `SSIU_Student_Master_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE_REGULAR':
        return <Badge variant="active">ACTIVE REGULAR</Badge>;
      case 'ACADEMIC_PROBATION':
        return <Badge variant="danger">PROBATION</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning">AT RISK</Badge>;
      case 'ON_LEAVE':
        return <Badge variant="navy">ON LEAVE</Badge>;
      default:
        return <Badge variant="navy">{status}</Badge>;
    }
  };

  return (
    <ReportsLayout
      currentTab="STUDENT"
      onTabChange={onTabChange}
      title="Student Master Roster &amp; Academic Status Reports"
      subtitle="Complete student enrollment directory, academic standing classification, mentor mapping, and demographic distributions."
      kpis={[
        {
          label: 'Total Students',
          value: reportData.kpis.totalStudents,
          sublabel: 'Department enrollment',
          color: 'var(--brand-navy, #0B192C)',
          textColor: 'var(--brand-navy)'
        },
        {
          label: 'Active Regular',
          value: reportData.kpis.activeStudents,
          sublabel: 'Good standing',
          color: '#10B981',
          textColor: '#059669'
        },
        {
          label: 'Active Programs',
          value: reportData.kpis.programsCount,
          sublabel: 'Undergraduate & PG',
          color: '#0EA5E9',
          textColor: '#0284C7'
        },
        {
          label: 'At-Risk / Probation',
          value: reportData.kpis.atRiskCount,
          sublabel: 'Requires academic support',
          color: '#EF4444',
          textColor: '#DC2626',
          badgeText: reportData.kpis.atRiskCount > 0 ? 'MONITOR' : 'OPTIMAL',
          badgeVariant: reportData.kpis.atRiskCount > 0 ? 'danger' : 'active'
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
        <div style={{ width: '160px' }}>
          <select
            className="form-control"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Student Statuses</option>
            <option value="ACTIVE">Active Regular</option>
            <option value="AT_RISK">At Risk</option>
            <option value="PROBATION">Academic Probation</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      }
      onExportXLSX={handleExportXLSX}
      pdfTitle="Official Department Student Master Roster Report"
      pdfDataPreview={{
        summary: [
          { label: 'Total Students', value: reportData.kpis.totalStudents },
          { label: 'Active Students', value: reportData.kpis.activeStudents },
          { label: 'At-Risk Students', value: reportData.kpis.atRiskCount },
          { label: 'Programs Offered', value: reportData.kpis.programsCount }
        ],
        headers: ['#', 'Student Name', 'Enrollment', 'Program', 'Sem', 'Sec', 'CGPA', 'Att %', 'Mentor', 'Status'],
        rows: filteredStudents.map((s, idx) => [
          idx + 1,
          s.name,
          s.enrollmentNo,
          s.programCode,
          `Sem ${s.semesterNumber}`,
          s.sectionName,
          s.cgpa,
          `${s.attendancePercentage}%`,
          s.mentorName,
          s.academicStatus
        ])
      }}
    >
      {/* ═══ 1. PROGRAM DEMOGRAPHICS & SECTION BREAKDOWN ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Program Breakdown */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <School size={16} color="var(--brand-orange)" /> Program-wise Enrollment &amp; Gender Ratio
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {reportData.programBreakdown.map((p, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: 'var(--brand-navy)', fontSize: '0.8rem' }}>[{p.programCode}] {p.programName}</span>
                  <Badge variant="navy">{p.totalStudents} Students</Badge>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '6px', fontSize: '0.72rem', color: '#64748B' }}>
                  <span>Active: <strong style={{ color: '#059669' }}>{p.activeStudents}</strong></span>
                  <span>At Risk: <strong style={{ color: '#DC2626' }}>{p.atRiskStudents}</strong></span>
                  <span>Male / Female: <strong>{p.maleCount}M / {p.femaleCount}F</strong></span>
                  <span>Avg Att: <strong>{p.avgAttendance}%</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Division Breakdown */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Layers size={16} color="#0EA5E9" /> Section / Division Operational Strength
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
            {reportData.sectionBreakdown.map((sec, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand-navy)' }}>{sec.sectionName} — Sem {sec.semesterNumber}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{sec.studentCount} <span style={{ fontSize: '0.7rem' }}>Students</span></div>
                <div style={{ fontSize: '0.68rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>Mentor: {sec.mentorName.split(' ')[1] || sec.mentorName}</div>
                <div style={{ fontSize: '0.65rem', color: sec.avgAttendance >= 75 ? '#059669' : '#DC2626', fontWeight: 700 }}>
                  Avg Att: {sec.avgAttendance}%
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ 2. MAIN STUDENT MASTER ROSTER TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Official Student Master Register
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {filteredStudents.length} of {reportData.students.length} student records
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', width: '45px' }}>#</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>STUDENT NAME</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>ENROLLMENT ID</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>PROGRAM</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SEM</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SEC</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>CGPA</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ATTENDANCE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>BATCH</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>FACULTY MENTOR</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ACADEMIC STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    No student records matched the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s, idx) => (
                  <tr 
                    key={s.studentId} 
                    style={{ 
                      borderBottom: '1px solid #E2E8F0', 
                      background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC' 
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
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: s.cgpa >= 8.5 ? '#059669' : s.cgpa < 5.5 ? '#DC2626' : 'var(--brand-navy)' }}>
                      {s.cgpa}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: s.attendancePercentage >= 75 ? '#059669' : '#DC2626' }}>
                      {s.attendancePercentage}%
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', color: '#64748B', fontSize: '0.75rem' }}>
                      {s.admissionBatch}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', color: '#475569' }}>
                      {s.mentorName}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getStatusBadge(s.academicStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </ReportsLayout>
  );
};
