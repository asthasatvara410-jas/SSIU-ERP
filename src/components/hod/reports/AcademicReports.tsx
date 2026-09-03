import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { departmentScopeService, AcademicReportData } from '../../../services/departmentScopeService';
import { ReportsLayout, ReportTabKey } from './ReportsLayout';
import { Badge } from '../../common/Badge';
import { 
  Award, GraduationCap, BookOpen, AlertTriangle, CheckCircle2, 
  TrendingUp, TrendingDown, FileText, ChevronRight, BarChart2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface AcademicReportsProps {
  onTabChange?: (tab: ReportTabKey) => void;
}

export const AcademicReports: React.FC<AcademicReportsProps> = ({ onTabChange }) => {
  const { user, role } = useAuth();

  // Filters
  const [selectedProgram, setSelectedProgram] = useState('ALL');
  const [selectedSemester, setSelectedSemester] = useState('ALL');
  const [selectedStanding, setSelectedStanding] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch scoped data
  const reportData: AcademicReportData = useMemo(() => {
    return departmentScopeService.getDepartmentAcademicReport(user, role || undefined, {
      programId: selectedProgram !== 'ALL' ? selectedProgram : undefined,
      semesterId: selectedSemester !== 'ALL' ? selectedSemester : undefined
    });
  }, [user, role, selectedProgram, selectedSemester]);

  // Filter students based on standing and search
  const filteredStudents = useMemo(() => {
    return reportData.students.filter(s => {
      if (selectedStanding !== 'ALL' && s.academicStanding !== selectedStanding) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.enrollmentNo.toLowerCase().includes(q) ||
          s.programCode.toLowerCase().includes(q) ||
          s.sectionName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reportData.students, selectedStanding, searchQuery]);

  const handleResetFilters = () => {
    setSelectedProgram('ALL');
    setSelectedSemester('ALL');
    setSelectedStanding('ALL');
    setSearchQuery('');
  };

  // Export to Excel (.xlsx)
  const handleExportXLSX = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Student Academic Standings
    const studentSheetData = filteredStudents.map((s, idx) => ({
      '#': idx + 1,
      'Student Name': s.name,
      'Enrollment ID': s.enrollmentNo,
      'Program': s.programCode,
      'Semester': `Sem ${s.semesterNumber}`,
      'Section': s.sectionName,
      'SGPA': s.sgpa,
      'CGPA': s.cgpa,
      'Active Backlogs': s.backlogsCount,
      'Academic Standing': s.academicStanding,
      'Result Status': s.resultStatus,
      'Exam Clearance': s.examEligibility
    }));
    const wsStudents = XLSX.utils.json_to_sheet(studentSheetData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Academic Standing');

    // Sheet 2: Subject Performance
    const subjectSheetData = reportData.subjectPerformance.map((sub, idx) => ({
      '#': idx + 1,
      'Subject Code': sub.code,
      'Subject Name': sub.name,
      'Course Type': sub.courseType,
      'Faculty In-charge': sub.facultyName,
      'Enrolled Students': sub.enrolledCount,
      'Average Marks / 100': sub.averageMarks,
      'Pass Rate %': `${sub.passPercentage}%`,
      'Highest Score': sub.highestMarks,
      'Lowest Score': sub.lowestMarks,
      'Subject Health': sub.healthStatus
    }));
    const wsSubjects = XLSX.utils.json_to_sheet(subjectSheetData);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'Course Performance');

    // Sheet 3: Semester Summary
    const semSheetData = reportData.semesterComparison.map(sem => ({
      'Semester': `Semester ${sem.semesterNumber}`,
      'Students': sem.studentCount,
      'Average SGPA': sem.averageSGPA,
      'Pass Percentage': `${sem.passPercentage}%`
    }));
    const wsSem = XLSX.utils.json_to_sheet(semSheetData);
    XLSX.utils.book_append_sheet(wb, wsSem, 'Semester Comparison');

    const fileName = `SSIU_Academic_Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStandingBadge = (standing: string) => {
    switch (standing) {
      case 'DISTINCTION':
        return <Badge variant="active">DISTINCTION</Badge>;
      case 'FIRST_CLASS':
        return <Badge variant="navy">FIRST CLASS</Badge>;
      case 'HIGHER_SECOND':
        return <Badge variant="purple">HIGHER SECOND</Badge>;
      case 'PASS_CLASS':
        return <Badge variant="warning">PASS CLASS</Badge>;
      case 'AT_RISK':
        return <Badge variant="danger">AT RISK</Badge>;
      default:
        return <Badge variant="navy">{standing}</Badge>;
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'PASSED':
        return <Badge variant="active">PASSED</Badge>;
      case 'PROMOTED_WITH_BACKLOG':
        return <Badge variant="warning">BACKLOG</Badge>;
      case 'DETAINED':
        return <Badge variant="danger">DETAINED</Badge>;
      default:
        return <Badge variant="navy">{result}</Badge>;
    }
  };

  return (
    <ReportsLayout
      currentTab="ACADEMIC"
      onTabChange={onTabChange}
      title="Academic Performance &amp; Result Reports"
      subtitle="Comprehensive analysis of student GPAs, examination pass rates, subject performance, and academic standings."
      kpis={[
        {
          label: 'Total Students',
          value: reportData.kpis.totalStudents,
          sublabel: 'Enrolled in department',
          color: 'var(--brand-navy, #0B192C)',
          textColor: 'var(--brand-navy)'
        },
        {
          label: 'Average CGPA',
          value: `${reportData.kpis.averageCGPA} / 10`,
          sublabel: 'Department cumulative index',
          color: '#0EA5E9',
          textColor: '#0284C7'
        },
        {
          label: 'Pass Percentage',
          value: `${reportData.kpis.passPercentage}%`,
          sublabel: 'First-attempt success rate',
          color: '#10B981',
          textColor: '#059669'
        },
        {
          label: 'At-Risk Students',
          value: reportData.kpis.atRiskCount,
          sublabel: 'CGPA < 5.5 or backlogs',
          color: '#EF4444',
          textColor: '#DC2626',
          badgeText: reportData.kpis.atRiskCount > 0 ? 'NEEDS REMEDIAL' : 'HEALTHY',
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
            value={selectedStanding}
            onChange={e => setSelectedStanding(e.target.value)}
            style={{ height: '34px', fontSize: '0.78125rem' }}
          >
            <option value="ALL">All Standings</option>
            <option value="DISTINCTION">Distinction (≥ 8.5)</option>
            <option value="FIRST_CLASS">First Class (7.0–8.49)</option>
            <option value="HIGHER_SECOND">Higher Second (6.0–6.99)</option>
            <option value="PASS_CLASS">Pass Class (5.0–5.99)</option>
            <option value="AT_RISK">At Risk (&lt; 5.0)</option>
          </select>
        </div>
      }
      onExportXLSX={handleExportXLSX}
      pdfTitle="Official Academic Performance & Examination Report"
      pdfDataPreview={{
        summary: [
          { label: 'Total Students', value: reportData.kpis.totalStudents },
          { label: 'Average CGPA', value: `${reportData.kpis.averageCGPA} / 10` },
          { label: 'Pass Rate', value: `${reportData.kpis.passPercentage}%` },
          { label: 'At Risk', value: reportData.kpis.atRiskCount }
        ],
        headers: ['#', 'Student Name', 'Enrollment', 'Program', 'Sem', 'SGPA', 'CGPA', 'Standing', 'Result'],
        rows: filteredStudents.map((s, idx) => [
          idx + 1,
          s.name,
          s.enrollmentNo,
          s.programCode,
          `Sem ${s.semesterNumber}`,
          s.sgpa,
          s.cgpa,
          s.academicStanding,
          s.resultStatus
        ])
      }}
    >
      {/* ═══ 1. VISUAL DISTRIBUTION CARDS & SEMESTER MATRIX ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        
        {/* Grade Distribution */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Award size={16} color="var(--brand-orange)" /> Academic Standing Distribution
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {reportData.gradeDistribution.map((band, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '3px' }}>
                  <span style={{ color: '#334155' }}>{band.band}</span>
                  <span style={{ color: band.color }}>{band.count} Students ({band.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '7px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${band.percentage}%`, height: '100%', background: band.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Semester-wise Comparison */}
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <BarChart2 size={16} color="#0EA5E9" /> Semester-wise Result &amp; SGPA Comparison
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem' }}>
            {reportData.semesterComparison.map((sem, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand-navy)' }}>Semester {sem.semesterNumber}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0284C7', marginTop: '2px' }}>{sem.averageSGPA} <span style={{ fontSize: '0.7rem' }}>SGPA</span></div>
                <div style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>{sem.passPercentage}% Passed</div>
                <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{sem.studentCount} Students</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ═══ 2. STUDENT ACADEMIC STANDING TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
              Student Academic Status &amp; Performance Ledger
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Showing {filteredStudents.length} of {reportData.students.length} students
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
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>SGPA</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>CGPA</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>BACKLOGS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>STANDING</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>RESULT</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>EXAM STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={12} style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>
                    No student academic records matched the selected filters.
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
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                      {s.sgpa}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: s.cgpa >= 8.5 ? '#059669' : s.cgpa < 5.5 ? '#DC2626' : 'var(--brand-navy)' }}>
                      {s.cgpa}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 700, color: s.backlogsCount > 0 ? '#DC2626' : '#10B981' }}>
                      {s.backlogsCount}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getStandingBadge(s.academicStanding)}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {getResultBadge(s.resultStatus)}
                    </td>
                    <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                      {s.examEligibility === 'ELIGIBLE' ? (
                        <Badge variant="active">CLEARED</Badge>
                      ) : s.examEligibility === 'PROVISIONAL' ? (
                        <Badge variant="warning">PROVISIONAL</Badge>
                      ) : (
                        <Badge variant="danger">DETAINED</Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ 3. COURSE / SUBJECT PERFORMANCE TABLE ═══ */}
      <div className="card" style={{ padding: '0', background: '#FFFFFF', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC' }}>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
            Curriculum Subject / Course Performance &amp; Pass Rate Analysis
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            Subject-level exam score distribution and pass percentages
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead style={{ background: '#0B192C', color: '#FFFFFF' }}>
              <tr>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT CODE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>SUBJECT TITLE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left' }}>FACULTY IN-CHARGE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>TYPE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>ENROLLED</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>AVG MARKS</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>PASS RATE</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>HIGH / LOW</th>
                <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>HEALTH</th>
              </tr>
            </thead>
            <tbody>
              {reportData.subjectPerformance.map((sub, idx) => (
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
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    <Badge variant="navy">{sub.courseType}</Badge>
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {sub.enrolledCount}
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 800, color: '#0284C7' }}>
                    {sub.averageMarks} / 100
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontWeight: 900, color: sub.passPercentage >= 90 ? '#059669' : sub.passPercentage < 75 ? '#DC2626' : '#D97706' }}>
                    {sub.passPercentage}%
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center', fontSize: '0.75rem', color: '#64748B' }}>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{sub.highestMarks}</span> / <span style={{ color: '#DC2626', fontWeight: 700 }}>{sub.lowestMarks}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                    {sub.healthStatus === 'EXCELLENT' ? (
                      <Badge variant="active">EXCELLENT</Badge>
                    ) : sub.healthStatus === 'GOOD' ? (
                      <Badge variant="navy">GOOD</Badge>
                    ) : (
                      <Badge variant="danger">ATTENTION</Badge>
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
