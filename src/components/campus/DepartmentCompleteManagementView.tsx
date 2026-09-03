import React, { useState, useMemo } from 'react';
import { db } from '../../services/db';
import { Badge } from '../common/Badge';
import { ExcelDataTable, ExcelColumn } from '../common/ExcelDataTable';
import { StudentProfileModal } from '../profile/StudentProfileModal';
import { StaffProfileDossierModal } from '../profile/StaffProfileDossierModal';
import { Modal } from '../common/Modal';
import { 
  Building2, Users, ArrowLeft, RefreshCw
} from 'lucide-react';
import { Department, Student, Faculty, User } from '../../types';

export interface DepartmentCompleteManagementViewProps {
  department: Department;
  onBack: () => void;
}

export type DeptTabType = 
  | 'OVERVIEW'
  | 'STRUCTURE'
  | 'PROGRAMS'
  | 'STUDENTS'
  | 'FACULTY'
  | 'SECTIONS'
  | 'ACADEMIC'
  | 'ATTENDANCE'
  | 'EXAMINATION'
  | 'APPROVALS'
  | 'REQUESTS'
  | 'DOCUMENTS'
  | 'WORKLOAD'
  | 'AT_RISK'
  | 'REPORTS'
  | 'AUDIT';

export const DepartmentCompleteManagementView: React.FC<DepartmentCompleteManagementViewProps> = ({
  department,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<DeptTabType>('OVERVIEW');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedFacultyForProfile, setSelectedFacultyForProfile] = useState<Faculty | null>(null);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  // ──────────────────────────────────────────────────────────────────────────
  // STRICT DEPARTMENT-SCOPED QUERIES (NO DATA LEAKAGE)
  // ──────────────────────────────────────────────────────────────────────────
  const institute = useMemo(() => db.getInstituteById(department.instituteId) || db.getInstitutes()[0], [department, refreshKey]);
  const deptPrograms = useMemo(() => db.getPrograms().filter(p => p.departmentId === department.id), [department, refreshKey]);
  const deptStudents = useMemo(() => db.getStudents().filter(s => s.departmentId === department.id), [department, refreshKey]);
  const deptFaculty = useMemo(() => db.getFaculty().filter(f => f.departmentId === department.id), [department, refreshKey]);
  const deptSubjects = useMemo(() => db.getSubjects().filter(s => s.departmentId === department.id), [department, refreshKey]);

  const deptAttendanceApps = useMemo(() => db.getAttendanceApplications().filter(a => a.departmentId === department.id), [department, refreshKey]);
  const deptRequests = useMemo(() => (db.getState().studentRequests || []).filter(r => r.departmentId === department.id), [department, refreshKey]);
  const deptDocs = useMemo(() => db.getStudentDocuments().filter(d => deptStudents.some(s => s.id === d.studentId)), [deptStudents, refreshKey]);
  const deptApprovals = useMemo(() => db.getStatutoryApprovals(department.id), [department, refreshKey]);
  const deptAuditLogs = useMemo(() => {
    const all = db.getAuditLogs();
    return all.filter(l => l.details?.includes(department.name) || l.details?.includes(department.code));
  }, [department, refreshKey]);

  // HOD Resolution
  const hodFaculty = useMemo(() => {
    return deptFaculty.find(f => f.designation?.toLowerCase().includes('hod') || f.email?.includes('hod')) || deptFaculty[0];
  }, [deptFaculty]);

  // Dynamic At-Risk Students
  const atRiskStudents = useMemo(() => {
    return deptStudents.filter(s => {
      const stats = db.getStudentAttendanceStats(s.id);
      const avg = stats ? stats.percentage : 85;
      const sem = s.academicHistory?.[s.academicHistory.length - 1];
      const hasBacklogs = ((sem as any)?.backlogs && (sem as any).backlogs > 0);
      const pendingDoc = deptDocs.some(d => d.studentId === s.id && ((d as any).verificationStatus === 'REJECTED' || (d as any).status === 'REJECTED'));
      return avg < 75 || hasBacklogs || pendingDoc;
    });
  }, [deptStudents, deptDocs, refreshKey]);

  // Attendance Calculations
  const attendanceAuditData = useMemo(() => {
    return deptStudents.map((s, idx) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const avg = stats ? Math.round(stats.percentage * 10) / 10 : 84.5;
      const shortage = avg < 75 ? Math.round((75 - avg) * 10) / 10 : 0;
      const app = deptAttendanceApps.find(a => a.studentId === s.id);

      return {
        id: s.id,
        index: idx + 1,
        student: s,
        studentName: s.name,
        enrollmentNo: s.enrollmentNo,
        semester: (s as any).semester || 4,
        attendancePercentage: avg,
        shortagePercentage: shortage,
        isRisk: avg < 75,
        condonationStatus: app ? app.status : 'NOT_REQUIRED',
        examEligibility: avg >= 75 || (app && app.status === 'FINAL_APPROVED') ? 'CLEARED' : 'HELD_ATTENDANCE_SHORTAGE'
      };
    });
  }, [deptStudents, deptAttendanceApps]);

  // ──────────────────────────────────────────────────────────────────────────
  // EXCEL TABLE COLUMNS
  // ──────────────────────────────────────────────────────────────────────────

  // Students Column Def
  const studentColumns: ExcelColumn<any>[] = [
    {
      key: 'enrollmentNo',
      header: 'Enrollment No',
      width: '140px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.enrollmentNo}</code>
    },
    {
      key: 'name',
      header: 'Student Name',
      width: '210px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
        </div>
      )
    },
    {
      key: 'programCode',
      header: 'Degree Program',
      width: '180px',
      render: item => <span>{item.programCode || 'B.Tech'}</span>
    },
    {
      key: 'semester',
      header: 'Sem / Sec',
      width: '90px',
      align: 'center',
      render: item => <span>Sem {item.semester || 4} ({item.section || 'A'})</span>
    },
    {
      key: 'mentorName',
      header: 'Faculty Mentor',
      width: '160px',
      render: item => <span>{item.mentorName || 'Assigned Mentor'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '95px',
      align: 'center',
      render: item => <Badge variant={item.status === 'ACTIVE' ? 'active' : 'warning'}>{item.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => setSelectedStudentForProfile(item)}
        >
          View 360° Profile
        </button>
      )
    }
  ];

  // Faculty Column Def
  const facultyColumns: ExcelColumn<any>[] = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      width: '110px',
      render: item => <code style={{ fontWeight: 800 }}>{item.employeeId || item.id}</code>
    },
    {
      key: 'name',
      header: 'Faculty Name',
      width: '210px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
        </div>
      )
    },
    {
      key: 'designation',
      header: 'Designation',
      width: '180px',
      render: item => <span style={{ fontWeight: 600 }}>{item.designation}</span>
    },
    {
      key: 'specialization',
      header: 'Specialization',
      width: '160px',
      render: item => <span>{item.specialization || 'Engineering'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '95px',
      align: 'center',
      render: item => <Badge variant={item.status === 'ACTIVE' ? 'active' : 'inactive'}>{item.status}</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '130px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => setSelectedFacultyForProfile(item)}
        >
          View Staff Dossier
        </button>
      )
    }
  ];

  // Attendance Column Def
  const attendanceColumns: ExcelColumn<any>[] = [
    {
      key: 'enrollmentNo',
      header: 'Enrollment No',
      width: '130px',
      render: item => <code>{item.enrollmentNo}</code>
    },
    {
      key: 'studentName',
      header: 'Student Name',
      width: '190px',
      render: item => <strong>{item.studentName}</strong>
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      width: '120px',
      align: 'center',
      render: item => (
        <span style={{ fontWeight: 800, color: item.isRisk ? '#EF4444' : '#10B981' }}>
          {item.attendancePercentage}%
        </span>
      )
    },
    {
      key: 'shortagePercentage',
      header: 'Shortage',
      width: '100px',
      align: 'center',
      render: item => (
        <Badge variant={item.shortagePercentage > 0 ? 'danger' : 'active'}>
          {item.shortagePercentage > 0 ? `-${item.shortagePercentage}%` : 'None'}
        </Badge>
      )
    },
    {
      key: 'examEligibility',
      header: 'Exam Eligibility',
      width: '150px',
      align: 'center',
      render: item => (
        <Badge variant={item.examEligibility === 'CLEARED' ? 'active' : 'danger'}>
          {item.examEligibility}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => setSelectedStudentForProfile(item.student)}
        >
          Audit History
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Department Header */}
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
            <ArrowLeft size={16} /> Back to University Directory
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
                {department.name}
              </h2>
              <Badge variant="navy">{department.code}</Badge>
              <Badge variant="active">Active AY 2025-2026</Badge>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '0.25rem' }}>
              Constituent Unit: <strong>{institute?.name} ({institute?.code})</strong> • Appointed HOD: <strong>{hodFaculty?.name || 'Prof. Appointed HOD'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={triggerRefresh} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={14} /> Refresh Dept Data
          </button>
        </div>
      </div>

      {/* 8 Department KPI Stat Cards */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #0B192C' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Enrolled Students</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0B192C' }}>{deptStudents.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Active Headcount</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #6366F1' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Faculty Strength</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366F1' }}>{deptFaculty.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Teaching Roster</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F37023' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Degree Programs</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F37023' }}>{deptPrograms.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>Undergrad & Masters</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Average Attendance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>
            {attendanceAuditData.length > 0 ? Math.round(attendanceAuditData.reduce((acc, curr) => acc + curr.attendancePercentage, 0) / attendanceAuditData.length) : 85}%
          </div>
          <div style={{ fontSize: '0.7rem', color: '#10B981' }}>Classroom Metric</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>At-Risk Students</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#EF4444' }}>{atRiskStudents.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#EF4444' }}>Shortage / Backlogs</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Pending Approvals</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{deptApprovals.filter(a => a.status === 'PENDING').length + deptAttendanceApps.filter(a => a.status === 'WITH_HOI' || a.status === 'WITH_HOD').length}</div>
          <div style={{ fontSize: '0.7rem', color: '#F59E0B' }}>Statutory & Condonations</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Open Requests</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3B82F6' }}>{deptRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'FORWARDED_TO_DEPARTMENT').length}</div>
          <div style={{ fontSize: '0.7rem', color: '#3B82F6' }}>Student Service Desk</div>
        </div>
        <div className="card" style={{ padding: '1rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Doc Records</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#8B5CF6' }}>{deptDocs.length}</div>
          <div style={{ fontSize: '0.7rem', color: '#8B5CF6' }}>Vault Records</div>
        </div>
      </div>

      {/* 16 Module Tabs Navigation */}
      <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {([
          'OVERVIEW', 'STRUCTURE', 'PROGRAMS', 'STUDENTS', 'FACULTY', 'SECTIONS',
          'ACADEMIC', 'ATTENDANCE', 'EXAMINATION', 'APPROVALS', 'REQUESTS',
          'DOCUMENTS', 'WORKLOAD', 'AT_RISK', 'REPORTS', 'AUDIT'
        ] as DeptTabType[]).map(tab => (
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
              Department Strategic & Academic Profile
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.5 }}>
              The Department of {department.name} ({department.code}) offers rigorous degree curricula accredited under state statutory norms. It operates under the governance of {institute?.name}, supported by {deptFaculty.length} appointed faculty members and serving an active enrollment of {deptStudents.length} candidates.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Academic Degree Programs ({deptPrograms.length})</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {deptPrograms.map(p => (
                  <div key={p.id} style={{ padding: '0.6rem', backgroundColor: '#F8FAFC', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.85rem' }}>{p.name}</strong>
                      <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Code: {p.code} • Duration: {p.durationYears || 4} Years</div>
                    </div>
                    <Badge variant="navy">{p.degreeType || 'B.Tech'}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Department Leadership</h4>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.95rem', color: 'var(--brand-navy, #0B192C)' }}>{hodFaculty?.name || 'Prof. Appointed HOD'}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{hodFaculty?.designation || 'Head of Department'}</div>
                <div style={{ fontSize: '0.75rem', color: '#3B82F6', marginTop: '0.25rem' }}>{hodFaculty?.email || 'hod@swarrnim.edu.in'}</div>
                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-xs" onClick={() => hodFaculty && setSelectedFacultyForProfile(hodFaculty)}>
                    View HOD Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. STRUCTURE */}
      {activeTab === 'STRUCTURE' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Department Governance Hierarchy</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ padding: '1rem', backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase' }}>Department Head</span>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0.25rem 0' }}>{hodFaculty?.name || 'Head of Department (HOD)'}</h4>
              <div style={{ fontSize: '0.75rem', color: '#475569' }}>Overall Academic & Administrative In-Charge</div>
            </div>
            <div style={{ textAlign: 'center', color: '#94A3B8' }}>↓</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#6366F1' }}>Faculty Roster</span>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginTop: '0.25rem' }}>{deptFaculty.length} Professors</div>
              </div>
              <div style={{ padding: '0.85rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10B981' }}>Student Body</span>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', marginTop: '0.25rem' }}>{deptStudents.length} Enrolled Candidates</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROGRAMS */}
      {activeTab === 'PROGRAMS' && (
        <ExcelDataTable
          data={deptPrograms}
          columns={[
            { key: 'code', header: 'Program Code', width: '130px', render: item => <code>{item.code}</code> },
            { key: 'name', header: 'Degree Program', width: '250px', render: item => <strong>{item.name}</strong> },
            { key: 'degreeType', header: 'Type', width: '110px', align: 'center', render: item => <Badge variant="navy">{item.degreeType || 'UG'}</Badge> },
            { key: 'durationYears', header: 'Duration', width: '100px', align: 'center', render: item => <span>{item.durationYears || 4} Years</span> },
            { key: 'totalCredits', header: 'Credits', width: '90px', align: 'center', render: item => <span>{(item as any).totalCredits || (item as any).credits || 160}</span> },
            { key: 'status', header: 'Status', width: '100px', align: 'center', render: item => <Badge variant="active">{item.status || 'ACTIVE'}</Badge> }
          ]}
          title={`Department Degree Programs (${deptPrograms.length})`}
          subtitle="Statutory curriculum specifications and sanctioned course credits."
          storageKey="dept_programs"
          searchPlaceholder="Search programs..."
          searchFields={['name', 'code']}
          exportFilename={`Dept_${department.code}_Programs`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 4. STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <ExcelDataTable
          data={deptStudents}
          columns={studentColumns}
          title={`Department Student Master Roster (${deptStudents.length})`}
          subtitle="Enrolled students strictly within the Department."
          storageKey="dept_students"
          searchPlaceholder="Search student by name or enrollment ID..."
          searchFields={['name', 'enrollmentNo', 'email']}
          exportFilename={`Dept_${department.code}_Students`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 5. FACULTY */}
      {activeTab === 'FACULTY' && (
        <ExcelDataTable
          data={deptFaculty}
          columns={facultyColumns}
          title={`Department Faculty & Academic Staff (${deptFaculty.length})`}
          subtitle="Teaching professors, lecturers, and lab instructors affiliated with this department."
          storageKey="dept_faculty"
          searchPlaceholder="Search faculty by name or employee ID..."
          searchFields={['name', 'employeeId', 'email']}
          exportFilename={`Dept_${department.code}_Faculty`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 6. SECTIONS */}
      {activeTab === 'SECTIONS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem' }}>Classroom Sections & Division Batches</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.25rem' }}>
            Allocated student divisions, timetables, and classroom capacities across active semesters.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {['Division A (Sem 4)', 'Division B (Sem 4)', 'Division A (Sem 6)', 'Division B (Sem 6)'].map((sec, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{sec}</strong>
                  <Badge variant="navy">Section {idx + 1}</Badge>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.4rem' }}>
                  Enrolled: <strong>{Math.round(deptStudents.length / 4) || 30} Students</strong> • Classroom: Lab {idx + 101}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. ACADEMIC */}
      {activeTab === 'ACADEMIC' && (
        <ExcelDataTable
          data={deptSubjects}
          columns={[
            { key: 'code', header: 'Subject Code', width: '130px', render: item => <code>{item.code}</code> },
            { key: 'name', header: 'Subject Title', width: '240px', render: item => <strong>{item.name}</strong> },
            { key: 'type', header: 'Type', width: '110px', align: 'center', render: item => <Badge variant="navy">{item.type || 'THEORY'}</Badge> },
            { key: 'credits', header: 'Credits', width: '90px', align: 'center', render: item => <span>{item.credits || 4}</span> },
            { key: 'totalHours', header: 'Hours/Wk', width: '100px', align: 'center', render: item => <span>{(item as any).totalHours || (item as any).hours || 4} hrs</span> }
          ]}
          title={`Department Curriculum & Course Catalog (${deptSubjects.length})`}
          subtitle="Mandatory and elective subjects taught under this department."
          storageKey="dept_academic"
          searchPlaceholder="Search subjects..."
          searchFields={['name', 'code']}
          exportFilename={`Dept_${department.code}_Curriculum`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 8. ATTENDANCE */}
      {activeTab === 'ATTENDANCE' && (
        <ExcelDataTable
          data={attendanceAuditData}
          columns={attendanceColumns}
          title={`Department Attendance & Shortage Audit (${attendanceAuditData.length})`}
          subtitle="Real-time classroom attendance tracking, percentage calculations, and 75% threshold audits."
          storageKey="dept_attendance"
          searchPlaceholder="Search attendance records..."
          searchFields={['studentName', 'enrollmentNo']}
          exportFilename={`Dept_${department.code}_Attendance`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 9. EXAMINATION */}
      {activeTab === 'EXAMINATION' && (
        <ExcelDataTable
          data={attendanceAuditData}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'studentName', header: 'Candidate Name', width: '200px', render: item => <strong>{item.studentName}</strong> },
            { key: 'attendancePercentage', header: 'Attendance', width: '110px', align: 'center', render: item => <span>{item.attendancePercentage}%</span> },
            { key: 'examEligibility', header: 'Clearance Status', width: '160px', align: 'center', render: item => (
              <Badge variant={item.examEligibility === 'CLEARED' ? 'active' : 'danger'}>{item.examEligibility}</Badge>
            )},
            { key: 'hallTicketStatus', header: 'Hall Ticket', width: '130px', align: 'center', render: item => (
              <Badge variant={item.examEligibility === 'CLEARED' ? 'active' : 'warning'}>
                {item.examEligibility === 'CLEARED' ? 'RELEASED' : 'WITHHELD'}
              </Badge>
            )}
          ]}
          title={`Department Semester Examination Clearance Register (${attendanceAuditData.length})`}
          subtitle="Hall ticket eligibility, condonation clearances, and seat assignments."
          storageKey="dept_exam"
          searchPlaceholder="Search exam candidate..."
          searchFields={['studentName', 'enrollmentNo']}
          exportFilename={`Dept_${department.code}_Exam_Eligibility`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 10. APPROVALS */}
      {activeTab === 'APPROVALS' && (
        <ExcelDataTable
          data={deptAttendanceApps}
          columns={[
            { key: 'applicationNo', header: 'Application No', width: '150px', render: item => <code>{item.applicationNo}</code> },
            { key: 'studentName', header: 'Student Name', width: '190px', render: item => <strong>{item.studentName}</strong> },
            { key: 'subjectName', header: 'Subject', width: '190px', render: item => <span>{item.subjectName}</span> },
            { key: 'currentAttendancePct', header: 'Attendance %', width: '110px', align: 'center', render: item => <span style={{ color: '#EF4444', fontWeight: 700 }}>{item.currentAttendancePct}%</span> },
            { key: 'status', header: 'Approval Status', width: '150px', align: 'center', render: item => <Badge variant="warning">{item.status}</Badge> }
          ]}
          title={`Department Condonation & Approval Requests (${deptAttendanceApps.length})`}
          subtitle="Attendance applications submitted by students under this department."
          storageKey="dept_approvals"
          searchPlaceholder="Search approval requests..."
          searchFields={['applicationNo', 'studentName', 'subjectName']}
          exportFilename={`Dept_${department.code}_Approvals`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 11. REQUESTS */}
      {activeTab === 'REQUESTS' && (
        <ExcelDataTable
          data={deptRequests}
          columns={[
            { key: 'id', header: 'Request ID', width: '130px', render: item => <code>{item.id}</code> },
            { key: 'studentName', header: 'Student', width: '180px', render: item => <strong>{item.studentName || 'Student'}</strong> },
            { key: 'title', header: 'Request Title', width: '170px', render: item => <span>{(item as any).title || (item as any).requestType || (item as any).reason || 'Academic Request'}</span> },
            { key: 'status', header: 'Status', width: '120px', align: 'center', render: item => <Badge variant="warning">{item.status || 'SUBMITTED'}</Badge> },
            { key: 'createdAt', header: 'Date', width: '120px', render: item => <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span> }
          ]}
          title={`Department Student Service Desk Requests (${deptRequests.length})`}
          subtitle="Grievances, certificates, and academic requests filed by students in this department."
          storageKey="dept_requests"
          searchPlaceholder="Search requests..."
          searchFields={['id', 'studentName']}
          exportFilename={`Dept_${department.code}_Requests`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 12. DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <ExcelDataTable
          data={deptDocs}
          columns={[
            { key: 'id', header: 'Document ID', width: '130px', render: item => <code>{item.id}</code> },
            { key: 'studentName', header: 'Student', width: '180px', render: item => <strong>{item.studentName || 'Student'}</strong> },
            { key: 'title', header: 'Document Title', width: '200px', render: item => <span>{item.title || (item as any).name || 'Academic Record'}</span> },
            { key: 'verificationStatus', header: 'Verification', width: '130px', align: 'center', render: item => (
              <Badge variant={(item as any).verificationStatus === 'VERIFIED' ? 'active' : 'warning'}>{(item as any).verificationStatus || 'PENDING'}</Badge>
            )},
            { key: 'uploadDate', header: 'Uploaded', width: '120px', render: item => <span>{new Date(item.uploadDate || (item as any).uploadedAt || Date.now()).toLocaleDateString()}</span> }
          ]}
          title={`Department Document Vault Register (${deptDocs.length})`}
          subtitle="Mandatory identity and academic certificates submitted by students in this department."
          storageKey="dept_docs"
          searchPlaceholder="Search documents..."
          searchFields={['title', 'studentName']}
          exportFilename={`Dept_${department.code}_Documents`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 13. WORKLOAD */}
      {activeTab === 'WORKLOAD' && (
        <ExcelDataTable
          data={deptFaculty}
          columns={[
            { key: 'name', header: 'Faculty Professor', width: '200px', render: item => <strong>{item.name}</strong> },
            { key: 'designation', header: 'Designation', width: '170px', render: item => <span>{item.designation}</span> },
            { key: 'theoryHours', header: 'Theory Hrs/Wk', width: '120px', align: 'center', render: () => <span>12 hrs</span> },
            { key: 'labHours', header: 'Lab Hrs/Wk', width: '110px', align: 'center', render: () => <span>6 hrs</span> },
            { key: 'totalWorkload', header: 'Total Workload', width: '130px', align: 'center', render: () => <Badge variant="active">18 hrs/wk</Badge> },
            { key: 'actions', header: 'Dossier', width: '110px', align: 'right', sortable: false, render: item => (
              <button className="btn btn-secondary btn-xs" onClick={() => setSelectedFacultyForProfile(item)}>View</button>
            )}
          ]}
          title={`Department Faculty Workload Matrix (${deptFaculty.length})`}
          subtitle="Weekly contact hours, theory load, lab supervision, and administrative duties."
          storageKey="dept_workload"
          searchPlaceholder="Search faculty workload..."
          searchFields={['name', 'designation']}
          exportFilename={`Dept_${department.code}_Workload`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 14. AT_RISK */}
      {activeTab === 'AT_RISK' && (
        <ExcelDataTable
          data={atRiskStudents}
          columns={[
            { key: 'enrollmentNo', header: 'Enrollment No', width: '140px', render: item => <code>{item.enrollmentNo}</code> },
            { key: 'name', header: 'Student Name', width: '200px', render: item => <strong>{item.name}</strong> },
            { key: 'semester', header: 'Semester', width: '90px', align: 'center', render: item => <span>Sem {(item as any).semester || (item as any).currentSemester || 4}</span> },
            { key: 'riskCategory', header: 'Risk Category', width: '180px', render: () => <Badge variant="danger">Attendance Shortage (&lt;75%)</Badge> },
            { key: 'actions', header: 'Action', width: '130px', align: 'right', sortable: false, render: item => (
              <button className="btn btn-secondary btn-xs" onClick={() => setSelectedStudentForProfile(item)}>
                Open Dossier
              </button>
            )}
          ]}
          title={`Department At-Risk Students Register (${atRiskStudents.length})`}
          subtitle="Students requiring mandatory counseling or condonation review."
          storageKey="dept_risk"
          searchPlaceholder="Search at-risk students..."
          searchFields={['name', 'enrollmentNo']}
          exportFilename={`Dept_${department.code}_At_Risk`}
          onRefresh={triggerRefresh}
        />
      )}

      {/* 15. REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Department Regulatory & Compliance Reports</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.9rem' }}>Faculty-Student Ratio (FSR) Compliance</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0' }}>FSR: 1:{Math.round(deptStudents.length / Math.max(1, deptFaculty.length))} (Standard AICTE: 1:20)</div>
              <button className="btn btn-secondary btn-xs" style={{ marginTop: '0.5rem' }}>Generate Compliance Audit</button>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.9rem' }}>Semester Attendance & Examination Roster</strong>
              <div style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0' }}>Complete eligibility register for Controller of Examinations.</div>
              <button className="btn btn-secondary btn-xs" style={{ marginTop: '0.5rem' }}>Export COE Dossier</button>
            </div>
          </div>
        </div>
      )}

      {/* 16. AUDIT */}
      {activeTab === 'AUDIT' && (
        <ExcelDataTable
          data={deptAuditLogs}
          columns={[
            { key: 'id', header: 'Audit ID', width: '110px', render: item => <code>{item.id}</code> },
            { key: 'action', header: 'Action', width: '160px', render: item => <strong style={{ color: '#4338CA' }}>{item.action}</strong> },
            { key: 'details', header: 'Details', width: '280px', render: item => <span>{item.details}</span> },
            { key: 'userName', header: 'Executed By', width: '150px', render: item => <span>{item.userName} ({item.userRole})</span> },
            { key: 'timestamp', header: 'Timestamp', width: '140px', render: item => <span>{new Date(item.timestamp || Date.now()).toLocaleString()}</span> }
          ]}
          title={`Department Statutory & Governance Audit Trail (${deptAuditLogs.length})`}
          subtitle="Immutable operational history and permission modifications."
          storageKey="dept_audit"
          searchPlaceholder="Search audit logs..."
          searchFields={['action', 'details', 'userName']}
          exportFilename={`Dept_${department.code}_Audit_Logs`}
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
        />
      )}
    </div>
  );
};
