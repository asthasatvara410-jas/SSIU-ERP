import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { ExcelDataTable, ExcelColumn } from '../common/ExcelDataTable';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { StaffProfileDossierModal } from '../profile/StaffProfileDossierModal';
import { Modal } from '../common/Modal';
import { 
  Building2, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Institute, Department, Student, Faculty } from '../../types';

export interface InstituteCompleteManagementViewProps {
  institute: Institute;
  onBack: () => void;
  onSelectDepartment: (dept: Department) => void;
}

export type InstTabType = 
  | 'OVERVIEW'
  | 'DEPARTMENTS'
  | 'PROGRAMS'
  | 'STUDENTS'
  | 'FACULTY'
  | 'ATTENDANCE'
  | 'EXAMINATION'
  | 'REQUESTS'
  | 'APPROVALS'
  | 'DOCUMENTS'
  | 'REPORTS'
  | 'RISKS';

export const InstituteCompleteManagementView: React.FC<InstituteCompleteManagementViewProps> = ({
  institute,
  onBack,
  onSelectDepartment
}) => {
  const [activeTab, setActiveTab] = useState<InstTabType>('OVERVIEW');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedFacultyForProfile, setSelectedFacultyForProfile] = useState<Faculty | null>(null);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // ──────────────────────────────────────────────────────────────────────────
  // STRICT INSTITUTE-SCOPED QUERIES
  // ──────────────────────────────────────────────────────────────────────────
  const instDepts = useMemo(() => db.getDepartments().filter(d => d.instituteId === institute.id), [institute, refreshKey]);
  const instPrograms = useMemo(() => db.getPrograms().filter(p => p.instituteId === institute.id), [institute, refreshKey]);
  const instStudents = useMemo(() => db.getStudents().filter(s => s.instituteId === institute.id), [institute, refreshKey]);
  const instFaculty = useMemo(() => db.getFaculty().filter(f => f.instituteId === institute.id), [institute, refreshKey]);
  const instAttendanceApps = useMemo(() => db.getAttendanceApplications().filter(a => a.instituteId === institute.id), [institute, refreshKey]);
  const instRequests = useMemo(() => (db.getState().studentRequests || []).filter(r => r.instituteId === institute.id), [institute, refreshKey]);
  const instDocs = useMemo(() => db.getStudentDocuments().filter(d => instStudents.some(s => s.id === d.studentId)), [instStudents, refreshKey]);
  const instApprovals = useMemo(() => db.getStatutoryApprovals().filter(a => a.instituteId === institute.id), [institute, refreshKey]);

  // At-Risk Students in Institute
  const instAtRiskStudents = useMemo(() => {
    return instStudents.filter(s => {
      const stats = db.getStudentAttendanceStats(s.id);
      const avg = stats ? stats.percentage : 85;
      const sem = s.academicHistory?.[s.academicHistory.length - 1];
      const hasBacklogs = ((sem as any)?.backlogs && (sem as any).backlogs > 0);
      const pendingDoc = instDocs.some(d => d.studentId === s.id && ((d as any).verificationStatus === 'REJECTED' || (d as any).status === 'REJECTED'));
      return avg < 75 || hasBacklogs || pendingDoc;
    });
  }, [instStudents, instDocs, refreshKey]);

  // Department Table Data
  const deptTableData = useMemo(() => {
    return instDepts.map(d => {
      const dStudents = instStudents.filter(s => s.departmentId === d.id);
      const dFaculty = instFaculty.filter(f => f.departmentId === d.id);
      const dProgs = instPrograms.filter(p => p.departmentId === d.id);
      const dRisks = instAtRiskStudents.filter(s => s.departmentId === d.id);
      const hod = dFaculty.find(f => f.designation?.toLowerCase().includes('hod') || f.email?.includes('hod')) || dFaculty[0];

      return {
        id: d.id,
        code: d.code,
        name: d.name,
        hodName: hod?.name || 'Prof. Appointed HOD',
        hodEmail: hod?.email || 'hod@swarrnim.edu.in',
        programsCount: dProgs.length,
        studentsCount: dStudents.length,
        facultyCount: dFaculty.length,
        fsr: `1:${Math.round(dStudents.length / Math.max(1, dFaculty.length))}`,
        atRiskCount: dRisks.length,
        status: d.status || 'ACTIVE',
        deptObj: d
      };
    });
  }, [instDepts, instStudents, instFaculty, instPrograms, instAtRiskStudents]);

  // Department Columns
  const deptColumns: ExcelColumn<any>[] = [
    {
      key: 'code',
      header: 'Dept Code',
      width: '120px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.code}</code>
    },
    {
      key: 'name',
      header: 'Department Name',
      width: '240px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>HOD: {item.hodName}</div>
        </div>
      )
    },
    {
      key: 'programsCount',
      header: 'Programs',
      width: '90px',
      align: 'center',
      render: item => <span>{item.programsCount}</span>
    },
    {
      key: 'studentsCount',
      header: 'Students',
      width: '100px',
      align: 'center',
      render: item => <strong style={{ color: '#0B192C' }}>{item.studentsCount}</strong>
    },
    {
      key: 'facultyCount',
      header: 'Faculty',
      width: '90px',
      align: 'center',
      render: item => <span>{item.facultyCount}</span>
    },
    {
      key: 'fsr',
      header: 'FSR',
      width: '85px',
      align: 'center',
      render: item => <span>{item.fsr}</span>
    },
    {
      key: 'atRiskCount',
      header: 'At Risk',
      width: '90px',
      align: 'center',
      render: item => (
        <Badge variant={item.atRiskCount > 0 ? 'danger' : 'active'}>{item.atRiskCount}</Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-primary btn-xs"
          onClick={() => onSelectDepartment(item.deptObj)}
        >
          Manage Dept →
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem',
        padding: '1.25rem 1.5rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} /> Back to University Overview
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                {institute.name}
              </h2>
              <Badge variant="navy">{institute.code}</Badge>
              <Badge variant="active">Constituent Institute</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
              Dean / Principal: <strong>{(institute as any).deanName || 'Dr. Principal / Director'}</strong> • Constituent Unit under SSIU
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={triggerRefresh} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={14} /> Refresh Institute Data
          </button>
        </div>
      </div>

      {/* 6 Institute KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0B192C' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Departments</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B192C' }}>{instDepts.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Constituent Divisions</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F37023' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Degree Programs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F37023' }}>{instPrograms.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Accredited Programs</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Total Students</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{instStudents.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Enrolled Headcount</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366F1' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Faculty Strength</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366F1' }}>{instFaculty.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Teaching Faculty</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>At-Risk Students</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>{instAtRiskStudents.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>Shortage / Backlogs</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pending Approvals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{instApprovals.filter(a => a.status === 'PENDING').length + instAttendanceApps.filter(a => a.status === 'WITH_HOI').length}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Dean Action Required</div>
        </div>
      </div>

      {/* 12 Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {([
          'OVERVIEW', 'DEPARTMENTS', 'PROGRAMS', 'STUDENTS', 'FACULTY',
          'ATTENDANCE', 'EXAMINATION', 'REQUESTS', 'APPROVALS',
          'DOCUMENTS', 'REPORTS', 'RISKS'
        ] as InstTabType[]).map(tab => (
          <button
            key={tab}
            className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENTS ─── */}

      {/* 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)', marginBottom: '0.5rem' }}>
              Constituent Institute Profile
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
              {institute.name} ({institute.code}) is a constituent higher education institution of Swarrnim Startup & Innovation University. It encompasses {instDepts.length} specialized academic departments delivering {instPrograms.length} accredited degree programs with a student strength of {instStudents.length} and {instFaculty.length} appointed faculty members.
            </p>
          </div>

          <ExcelDataTable
            data={deptTableData}
            columns={deptColumns}
            title={`Constituent Academic Departments (${instDepts.length})`}
            subtitle="Click 'Manage Dept →' to drill down into the 16-tab departmental dossier."
            storageKey="inst_dept_overview"
            searchPlaceholder="Search departments..."
            searchFields={['name', 'code', 'hodName']}
            exportFilename={`${institute.code}_Departments_Roster`}
            onRefresh={triggerRefresh}
          />
        </div>
      )}

      {/* 2. DEPARTMENTS */}
      {activeTab === 'DEPARTMENTS' && (
        <ExcelDataTable
          data={deptTableData}
          columns={deptColumns}
          title={`Institute Departments Directory (${instDepts.length})`}
          subtitle="Department roster with live student, faculty, and risk metrics."
          storageKey="inst_depts"
          searchPlaceholder="Search departments..."
          searchFields={['name', 'code', 'hodName']}
          exportFilename={`${institute.code}_Departments`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 3. PROGRAMS */}
      {activeTab === 'PROGRAMS' && (
        <ExcelDataTable
          data={instPrograms}
          columns={[
            { key: 'code', header: 'Program Code', width: '130px', render: item => <code>{item.code}</code> },
            { key: 'name', header: 'Degree Program', width: '250px', render: item => <strong>{item.name}</strong> },
            { key: 'degreeType', header: 'Degree Level', width: '110px', align: 'center', render: item => <Badge variant="navy">{item.degreeType || 'UG'}</Badge> },
            { key: 'durationYears', header: 'Duration', width: '100px', align: 'center', render: item => <span>{item.durationYears || 4} Years</span> },
            { key: 'totalCredits', header: 'Total Credits', width: '100px', align: 'center', render: item => <span>{(item as any).totalCredits || (item as any).credits || 160}</span> }
          ]}
          title={`Approved Degree Programs (${instPrograms.length})`}
          subtitle="Degree programs offered across departments in this institute."
          storageKey="inst_programs"
          searchPlaceholder="Search programs..."
          searchFields={['name', 'code']}
          exportFilename={`${institute.code}_Programs`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 4. STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <ExcelDataTable
          data={instStudents}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'name', header: 'Student Name', width: '210px', render: item => <strong>{item.name}</strong> },
            { key: 'departmentName', header: 'Department', width: '180px', render: item => <span>{instDepts.find(d => d.id === item.departmentId)?.name || item.departmentId}</span> },
            { key: 'semester', header: 'Semester', width: '90px', align: 'center', render: item => <span>Sem {(item as any).semester || (item as any).currentSemester || 4}</span> },
            { key: 'status', header: 'Status', width: '95px', align: 'center', render: item => <Badge variant="active">{item.status}</Badge> },
            { key: 'actions', header: 'Dossier', width: '130px', align: 'right', sortable: false, render: item => (
              <button className="btn btn-secondary btn-xs" onClick={() => setSelectedStudentForProfile(item)}>View Profile</button>
            )}
          ]}
          title={`Institute Enrolled Students (${instStudents.length})`}
          subtitle="All students enrolled in this institute."
          storageKey="inst_students"
          searchPlaceholder="Search student by name or enrollment ID..."
          searchFields={['name', 'enrollmentNo']}
          exportFilename={`${institute.code}_Students`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 5. FACULTY */}
      {activeTab === 'FACULTY' && (
        <ExcelDataTable
          data={instFaculty}
          columns={[
            { key: 'employeeId', header: 'Emp ID', width: '120px', render: item => <code>{item.employeeId || item.id}</code> },
            { key: 'name', header: 'Faculty Name', width: '210px', render: item => <strong>{item.name}</strong> },
            { key: 'designation', header: 'Designation', width: '180px', render: item => <span>{item.designation}</span> },
            { key: 'departmentId', header: 'Department', width: '160px', render: item => <span>{instDepts.find(d => d.id === item.departmentId)?.name || item.departmentId}</span> },
            { key: 'status', header: 'Status', width: '95px', align: 'center', render: item => <Badge variant="active">{item.status}</Badge> },
            { key: 'actions', header: 'Dossier', width: '130px', align: 'right', sortable: false, render: item => (
              <button className="btn btn-secondary btn-xs" onClick={() => setSelectedFacultyForProfile(item)}>View Staff Dossier</button>
            )}
          ]}
          title={`Institute Faculty Roster (${instFaculty.length})`}
          subtitle="All professors, lecturers, and academic staff appointed to this institute."
          storageKey="inst_faculty"
          searchPlaceholder="Search faculty..."
          searchFields={['name', 'employeeId']}
          exportFilename={`${institute.code}_Faculty`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 6. ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <ExcelDataTable
          data={instStudents}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'name', header: 'Student Name', width: '200px', render: item => <strong>{item.name}</strong> },
            { key: 'attendancePercentage', header: 'Attendance %', width: '120px', align: 'center', render: item => {
              const stats = db.getStudentAttendanceStats(item.id);
              const avg = stats ? stats.percentage : 85;
              return <span style={{ fontWeight: 800, color: avg < 75 ? '#EF4444' : '#10B981' }}>{avg}%</span>;
            }},
            { key: 'eligibility', header: 'Status', width: '120px', align: 'center', render: item => {
              const stats = db.getStudentAttendanceStats(item.id);
              const avg = stats ? stats.percentage : 85;
              return <Badge variant={avg >= 75 ? 'active' : 'danger'}>{avg >= 75 ? 'ELIGIBLE' : 'SHORTAGE'}</Badge>;
            }}
          ]}
          title={`Institute Attendance Tracking (${instStudents.length})`}
          subtitle="Real-time attendance percentages and 75% statutory compliance."
          storageKey="inst_attendance"
          searchPlaceholder="Search student attendance..."
          searchFields={['name', 'enrollmentNo']}
          exportFilename={`${institute.code}_Attendance`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 7. EXAMINATION */}
      {activeTab === 'EXAMINATION' && (
        <ExcelDataTable
          data={instStudents}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'name', header: 'Candidate Name', width: '200px', render: item => <strong>{item.name}</strong> },
            { key: 'examClearance', header: 'Clearance Status', width: '150px', align: 'center', render: item => {
              const stats = db.getStudentAttendanceStats(item.id);
              const avg = stats ? stats.percentage : 85;
              return <Badge variant={avg >= 75 ? 'active' : 'danger'}>{avg >= 75 ? 'CLEARED' : 'HELD'}</Badge>;
            }}
          ]}
          title={`Institute Examination Clearance Register (${instStudents.length})`}
          subtitle="Semester examination candidate clearance roll."
          storageKey="inst_exam"
          searchPlaceholder="Search exam candidate..."
          searchFields={['name', 'enrollmentNo']}
          exportFilename={`${institute.code}_Exam_Clearance`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 8. REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <ExcelDataTable
          data={instRequests}
          columns={[
            { key: 'id', header: 'Request ID', width: '130px', render: item => <code>{item.id}</code> },
            { key: 'studentName', header: 'Student', width: '180px', render: item => <strong>{item.studentName || 'Student'}</strong> },
            { key: 'title', header: 'Title', width: '180px', render: item => <span>{(item as any).title || (item as any).requestType || (item as any).reason || 'Academic Request'}</span> },
            { key: 'status', header: 'Status', width: '120px', align: 'center', render: item => <Badge variant="warning">{item.status || 'SUBMITTED'}</Badge> }
          ]}
          title={`Institute Student Service Requests (${instRequests.length})`}
          subtitle="Requests submitted across all departments in this institute."
          storageKey="inst_requests"
          searchPlaceholder="Search requests..."
          searchFields={['id', 'studentName']}
          exportFilename={`${institute.code}_Requests`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 9. APPROVALS */}
      {activeTab === 'APPROVALS' && (
        <ExcelDataTable
          data={instAttendanceApps}
          columns={[
            { key: 'applicationNo', header: 'Application No', width: '150px', render: item => <code>{item.applicationNo}</code> },
            { key: 'studentName', header: 'Student Name', width: '190px', render: item => <strong>{item.studentName}</strong> },
            { key: 'subjectName', header: 'Subject', width: '180px', render: item => <span>{item.subjectName}</span> },
            { key: 'status', header: 'Status', width: '140px', align: 'center', render: item => <Badge variant="warning">{item.status}</Badge> }
          ]}
          title={`Institute Condonation & Approvals (${instAttendanceApps.length})`}
          subtitle="Attendance condonation applications awaiting HOI review."
          storageKey="inst_approvals"
          searchPlaceholder="Search approvals..."
          searchFields={['applicationNo', 'studentName']}
          exportFilename={`${institute.code}_Approvals`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 10. DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <ExcelDataTable
          data={instDocs}
          columns={[
            { key: 'id', header: 'Document ID', width: '130px', render: item => <code>{item.id}</code> },
            { key: 'studentName', header: 'Student', width: '180px', render: item => <strong>{item.studentName || 'Student'}</strong> },
            { key: 'title', header: 'Document Title', width: '200px', render: item => <span>{item.title || 'Academic Record'}</span> },
            { key: 'verificationStatus', header: 'Status', width: '130px', align: 'center', render: item => (
              <Badge variant={(item as any).verificationStatus === 'VERIFIED' ? 'active' : 'warning'}>{(item as any).verificationStatus || 'PENDING'}</Badge>
            )}
          ]}
          title={`Institute Document Vault (${instDocs.length})`}
          subtitle="Student submitted identity and academic certificates."
          storageKey="inst_docs"
          searchPlaceholder="Search documents..."
          searchFields={['title', 'studentName']}
          exportFilename={`${institute.code}_Documents`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 11. REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Institute Statutory Compliance Reports</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.9rem' }}>Aggregate FSR Compliance Report</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0' }}>Overall Institute FSR: 1:{Math.round(instStudents.length / Math.max(1, instFaculty.length))}</div>
              <button className="btn btn-secondary btn-xs" style={{ marginTop: '0.5rem' }}>Export FSR Audit</button>
            </div>
          </div>
        </div>
      )}

      {/* 12. RISKS */}
      {activeTab === 'RISKS' && (
        <ExcelDataTable
          data={instAtRiskStudents}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'name', header: 'Student Name', width: '200px', render: item => <strong>{item.name}</strong> },
            { key: 'departmentName', header: 'Department', width: '180px', render: item => <span>{instDepts.find(d => d.id === item.departmentId)?.name || item.departmentId}</span> },
            { key: 'risk', header: 'Risk Category', width: '180px', render: () => <Badge variant="danger">Attendance Shortage (&lt;75%)</Badge> },
            { key: 'actions', header: 'Action', width: '120px', align: 'right', sortable: false, render: item => (
              <button className="btn btn-secondary btn-xs" onClick={() => setSelectedStudentForProfile(item)}>Open Dossier</button>
            )}
          ]}
          title={`Institute At-Risk Students (${instAtRiskStudents.length})`}
          subtitle="Students with critical attendance shortage or pending backlog hurdles."
          storageKey="inst_risks"
          searchPlaceholder="Search at-risk students..."
          searchFields={['name', 'enrollmentNo']}
          exportFilename={`${institute.code}_At_Risk`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* ─── MODALS ─── */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          student={selectedStudentForProfile}
          isOpen={true}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}

      {selectedFacultyForProfile && (
        <StaffProfileDossierModal
          isOpen={true}
          faculty={selectedFacultyForProfile}
          onClose={() => setSelectedFacultyForProfile(null)}
          onNavigateToDepartment={(deptId) => {
            setSelectedFacultyForProfile(null);
            const targetDept = instDepts.find(d => d.id === deptId);
            if (targetDept) {
              onSelectDepartment(targetDept);
            }
          }}
        />
      )}
    </div>
  );
};
