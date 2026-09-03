import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { attendanceApprovalService } from '../../services/attendanceApprovalService';
import { studentRequestService } from '../../services/studentRequestService';
import { mentorAssignmentService } from '../../services/mentorAssignmentService';
import { documentMasterService } from '../../services/documentMasterService';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { StudentProfileModal } from '../../components/profile/StudentProfileModal';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { 
  Building2, Users, UserCheck, BookOpen, Clock, Award, 
  CheckSquare, AlertCircle, AlertTriangle, FileText, CheckCircle2, 
  Search, Mail, Phone, Eye, ShieldCheck, FolderCheck, Lock, 
  XCircle, Download, Check, FileSpreadsheet, Plus, RefreshCw,
  BarChart3, MessageSquare, Calendar, ChevronRight, Filter, ExternalLink
} from 'lucide-react';
import { AttendanceApplication, Student, Faculty, Subject, Program, Semester } from '../../types';
import { studentDataChangeRequestService } from '../../services/studentDataChangeRequestService';
import { StudentDataChangeTab } from '../../components/profile/StudentDataChangeTab';
import { MentorAssignmentTab } from '../../components/mentor/MentorAssignmentTab';
import { MenteeExamEligibilityManager } from '../../components/mentor/MenteeExamEligibilityManager';
import { DepartmentStudentRosterGrid } from '../../components/hod/DepartmentStudentRosterGrid';
import { DepartmentCommandCenter } from '../../components/hod/DepartmentCommandCenter';
import { DepartmentFacultyDirectory } from '../../components/hod/DepartmentFacultyDirectory';
import { DepartmentFacultyWorkloadGrid } from '../../components/hod/DepartmentFacultyWorkloadGrid';
import { DepartmentSubjectAllocationGrid } from '../../components/hod/DepartmentSubjectAllocationGrid';
import { DepartmentFacultyPerformanceGrid } from '../../components/hod/DepartmentFacultyPerformanceGrid';
import { DepartmentAttendanceRegister } from '../../components/hod/DepartmentAttendanceRegister';
import { AcademicReports } from '../../components/hod/reports/AcademicReports';
import { AttendanceReports } from '../../components/hod/reports/AttendanceReports';
import { StudentReports } from '../../components/hod/reports/StudentReports';
import { FacultyReports } from '../../components/hod/reports/FacultyReports';
import { DepartmentReports } from '../../components/hod/reports/DepartmentReports';
import * as XLSX from 'xlsx';

export type HODTabType = 
  | 'OVERVIEW'
  | 'STUDENTS'
  | 'AT_RISK'
  | 'ACADEMIC_PERFORMANCE'
  | 'FACULTY'
  | 'FACULTY_WORKLOAD'
  | 'FACULTY_ALLOCATION'
  | 'FACULTY_PERFORMANCE'
  | 'MENTORS'
  | 'MENTOR_MANAGEMENT'
  | 'SUBJECTS'
  | 'ATTENDANCE'
  | 'ATTENDANCE_SHORTAGE'
  | 'ATTENDANCE_APPROVALS'
  | 'EXAMINATION'
  | 'EXAM_ELIGIBILITY'
  | 'DOCUMENTS'
  | 'DATA_CHANGE_APPROVALS'
  | 'REQUESTS'
  | 'FEEDBACK'
  | 'REPORTS'
  | 'REPORTS_ACADEMIC'
  | 'REPORTS_ATTENDANCE'
  | 'REPORTS_STUDENT'
  | 'REPORTS_FACULTY'
  | 'REPORTS_DEPARTMENT';

export interface HODWorkspacePageProps {
  initialTab?: HODTabType;
}

export const HODWorkspacePage: React.FC<HODWorkspacePageProps> = ({ initialTab = 'OVERVIEW' }) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<HODTabType>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('ALL');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ELIGIBLE' | 'SHORTAGE' | 'RISK'>('ALL');
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Subject Allocation Modal State
  const [isAllocModalOpen, setIsAllocModalOpen] = useState(false);
  const [allocSubjectId, setAllocSubjectId] = useState('');
  const [allocFacultyId, setAllocFacultyId] = useState('');
  const [allocDivisionId, setAllocDivisionId] = useState('Div A');

  // Attendance Review Modal state
  const [reviewApp, setReviewApp] = useState<AttendanceApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  // 1. Resolve Authorized Department (Strict Boundary Scoping)
  const targetDepartmentId = useMemo(() => {
    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL') {
      return user?.departmentId || 'dept-1';
    }
    return user?.departmentId || 'dept-1';
  }, [role, user]);

  const department = useMemo(() => {
    return db.getDepartmentById(targetDepartmentId) || db.getDepartments()[0];
  }, [targetDepartmentId]);

  const institute = useMemo(() => {
    return db.getInstituteById(department?.instituteId || '') || db.getInstitutes()[0];
  }, [department]);

  // 2. Department-Scoped Datasets
  const deptPrograms = useMemo(() => {
    const all = db.getPrograms();
    return all.filter(p => p.departmentId === department?.id || targetDepartmentId === 'dept-1');
  }, [department, targetDepartmentId, refreshKey]);

  const deptStudents = useMemo(() => {
    const all = db.getStudents();
    return all.filter(s => s.departmentId === department?.id || (targetDepartmentId === 'dept-1' && s.departmentId === 'dept-1'));
  }, [department, targetDepartmentId, refreshKey]);

  const deptFaculty = useMemo(() => {
    const all = db.getFaculty();
    return all.filter(f => f.departmentId === department?.id || (targetDepartmentId === 'dept-1' && f.departmentId === 'dept-1'));
  }, [department, targetDepartmentId, refreshKey]);

  const deptSubjects = useMemo(() => {
    const all = db.getSubjects();
    return all.filter(s => s.departmentId === department?.id || (targetDepartmentId === 'dept-1' && s.departmentId === 'dept-1'));
  }, [department, targetDepartmentId, refreshKey]);

  // 3. Centralized Attendance & Risk Analysis for Department Students
  const deptAttendanceData = useMemo(() => {
    return deptStudents.map(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
      const hasShortage = stats.percentage < 75;
      const hasMissingDocs = docs.some(d => d.status !== 'VERIFIED');
      const isRisk = hasShortage || hasMissingDocs;

      return {
        student,
        stats,
        docsCount: docs.length,
        hasShortage,
        hasMissingDocs,
        isRisk
      };
    });
  }, [deptStudents, refreshKey]);

  const shortageStudents = useMemo(() => {
    return deptAttendanceData.filter(d => d.hasShortage);
  }, [deptAttendanceData]);

  const atRiskStudents = useMemo(() => {
    return deptAttendanceData.filter(d => d.isRisk);
  }, [deptAttendanceData]);

  // 4. Pending Attendance Approvals Queue for HOD
  const pendingHODAttendanceApps = useMemo(() => {
    const allApps = db.getAttendanceApplications();
    return allApps.filter(a => 
      (a.departmentId === department?.id || role === 'SUPER_ADMIN') &&
      (a.status === 'MENTOR_APPROVED' || a.status === 'WITH_HOD')
    );
  }, [department, role, refreshKey]);

  // 5. Department Student Requests
  const deptRequests = useMemo(() => {
    const all = db.getState().studentRequests || [];
    return all.filter(r => r.departmentId === department?.id || (r as any).currentOffice === 'HOD_ACADEMIC' || role === 'SUPER_ADMIN');
  }, [department, role, refreshKey]);

  // 6. Pending Student Data Changes for Final HOD Approval
  const pendingHODDataChangesCount = useMemo(() => {
    return studentDataChangeRequestService.getScopedRequests(user, role, { status: 'HOD_PENDING', departmentId: department?.id }).length;
  }, [user, role, department, refreshKey]);

  const pendingRequests = useMemo(() => {
    return deptRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'WORK_IN_PROGRESS' || r.status === 'WITH_HOD' || r.status === 'FORWARDED_TO_HOD');
  }, [deptRequests]);

  // 6. Filtered Students Roster
  const filteredStudents = useMemo(() => {
    return deptAttendanceData.filter(({ student, hasShortage, isRisk }) => {
      if (selectedProgramFilter !== 'ALL' && student.programId !== selectedProgramFilter) return false;
      if (selectedSemesterFilter !== 'ALL' && student.semesterId !== selectedSemesterFilter) return false;
      if (statusFilter === 'SHORTAGE' && !hasShortage) return false;
      if (statusFilter === 'ELIGIBLE' && hasShortage) return false;
      if (statusFilter === 'RISK' && !isRisk) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return student.name.toLowerCase().includes(q) || student.enrollmentNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [deptAttendanceData, selectedProgramFilter, selectedSemesterFilter, statusFilter, searchQuery]);

  // Handle HOD Attendance Decision
  const handleHODAttendanceDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApp || !user) return;

    try {
      attendanceApprovalService.hodReview(
        reviewApp.id,
        {
          decision: reviewDecision,
          remarks: reviewRemarks.trim() || `HOD ${reviewDecision === 'APPROVE' ? 'approved & forwarded to HOI' : 'decision'}`
        },
        user
      );
      setReviewApp(null);
      setReviewRemarks('');
      setRefreshKey(k => k + 1);
      showToast(`Attendance application ${reviewApp.applicationNo} updated successfully (Status: ${reviewDecision === 'APPROVE' ? 'HOD_APPROVED → Forwarded to HOI' : 'HOD_REJECTED'}).`);
    } catch (err: any) {
      alert(err.message || 'HOD Action failed.');
    }
  };

  // Handle Subject Allocation
  const handleSaveAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocSubjectId || !allocFacultyId) return;

    const sub = db.getSubjects().find(s => s.id === allocSubjectId);
    const fac = db.getFaculty().find(f => f.id === allocFacultyId);

    if (sub && fac) {
      db.updateEntity<Subject>('subjects', sub.id, { assignedFacultyId: fac.id }, `Allocated ${sub.code} to ${fac.name}`);
      setIsAllocModalOpen(false);
      setRefreshKey(k => k + 1);
      showToast(`Subject ${sub.code} (${sub.name}) successfully allocated to Prof. ${fac.name}.`);
    }
  };

  // Export to Excel (.xlsx only)
  const exportDepartmentReportXLSX = (type: 'STUDENTS' | 'ATTENDANCE' | 'FACULTY') => {
    let rows: any[] = [];
    let filename = `HOD_${department?.code || 'DEPT'}_Report.xlsx`;

    if (type === 'STUDENTS') {
      rows = deptAttendanceData.map(m => {
        const prog = db.getProgramById(m.student.programId);
        const sem = db.getSemesterById(m.student.semesterId);
        return {
          'Student Name': m.student.name,
          'Enrollment Number': m.student.enrollmentNo,
          'Program': prog?.code || 'B.Tech',
          'Semester': sem?.number || 4,
          'Section': m.student.divisionId || 'Div A',
          'Attendance %': `${m.stats.percentage}%`,
          'Status': m.hasShortage ? 'ATTENDANCE SHORTAGE' : 'GOOD STANDING',
          'Academic Risk': m.isRisk ? 'HIGH RISK' : 'NORMAL',
          'Email': m.student.email,
          'Phone': m.student.phone || '+91 98250 00000'
        };
      });
      filename = `HOD_Students_Roster_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else if (type === 'ATTENDANCE') {
      rows = deptAttendanceData.map(m => ({
        'Student Name': m.student.name,
        'Enrollment': m.student.enrollmentNo,
        'Total Classes': m.stats.totalClasses,
        'Present': m.stats.presentClasses,
        'Absent': m.stats.absentClasses,
        'Attendance %': `${m.stats.percentage}%`,
        'Required %': '75%',
        'Exam Eligibility': m.hasShortage ? 'SHORTAGE (CONDONATION REQUIRED)' : 'ELIGIBLE'
      }));
      filename = `HOD_Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    } else {
      rows = deptFaculty.map(f => {
        const assignedSubs = deptSubjects.filter(s => s.assignedFacultyId === f.id);
        const totalThHours = assignedSubs.reduce((sum, s) => sum + (s.theoryHoursPerWeek || 3), 0);
        const totalLabHours = assignedSubs.reduce((sum, s) => sum + (s.labHoursPerWeek || 2), 0);
        return {
          'Faculty Name': f.name,
          'Employee ID': f.employeeId,
          'Designation': f.designation,
          'Assigned Courses': assignedSubs.map(s => s.code).join(', ') || 'None',
          'Theory Hours / Wk': totalThHours,
          'Lab Hours / Wk': totalLabHours,
          'Total Weekly Load': totalThHours + totalLabHours,
          'Status': f.status
        };
      });
      filename = `HOD_Faculty_Workload_${new Date().toISOString().split('T')[0]}.xlsx`;
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
    XLSX.writeFile(wb, filename);
    showToast(`Exported ${type} report to .xlsx successfully.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {toast && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy)', margin: 0 }}>
            {department?.name || 'Department of Computer Science & Engineering'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Department oversight for {deptStudents.length} Students, {deptFaculty.length} Faculty Members, {deptSubjects.length} Curriculum Courses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => exportDepartmentReportXLSX('STUDENTS')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileSpreadsheet size={15} color="#10B981" /> Export Students (.xlsx)
          </button>
          <button onClick={() => exportDepartmentReportXLSX('FACULTY')} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <FileSpreadsheet size={15} color="#0EA5E9" /> Export Workload (.xlsx)
          </button>
          <button onClick={() => setIsAllocModalOpen(true)} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Plus size={15} /> Subject Allocation
          </button>
        </div>
      </div>

      {/* Top Department KPI Statistics */}
      <div className="grid-4">
        <StatCard 
          title="Department Students" 
          value={deptStudents.length} 
          subtitle={`${deptPrograms.length} Degree Programs`} 
          icon={Users} 
          colorScheme="navy" 
          onClick={() => setActiveTab('STUDENTS')}
        />
        <StatCard 
          title="Department Faculty" 
          value={deptFaculty.length} 
          subtitle="Professors & Lecturers" 
          icon={UserCheck} 
          colorScheme="green" 
          onClick={() => setActiveTab('FACULTY')}
        />
        <StatCard 
          title="Attendance Shortage" 
          value={shortageStudents.length} 
          subtitle="Below 75% Requirement" 
          icon={AlertTriangle} 
          colorScheme={shortageStudents.length > 0 ? 'orange' : 'green'} 
          onClick={() => setActiveTab('ATTENDANCE_SHORTAGE')}
        />
        <StatCard 
          title="Pending Approvals" 
          value={pendingHODAttendanceApps.length} 
          subtitle="Attendance Condonations" 
          icon={CheckSquare} 
          colorScheme={pendingHODAttendanceApps.length > 0 ? 'orange' : 'green'} 
          onClick={() => setActiveTab('ATTENDANCE_APPROVALS')}
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn btn-sm ${activeTab === 'OVERVIEW' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('OVERVIEW')}
        >
          <Building2 size={14} /> Department Overview
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'STUDENTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('STUDENTS')}
        >
          <Users size={14} /> Student Roster ({deptStudents.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'AT_RISK' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('AT_RISK')}
        >
          <AlertCircle size={14} /> At-Risk Students ({atRiskStudents.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'FACULTY' || activeTab === 'FACULTY_WORKLOAD' || activeTab === 'FACULTY_ALLOCATION' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('FACULTY')}
        >
          <UserCheck size={14} /> Faculty &amp; Workload ({deptFaculty.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'MENTORS' || activeTab === 'MENTOR_MANAGEMENT' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('MENTORS')}
        >
          <Users size={14} /> Mentor Assignment
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'ATTENDANCE' || activeTab === 'ATTENDANCE_SHORTAGE' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ATTENDANCE')}
        >
          <Clock size={14} /> Attendance ({shortageStudents.length} Shortage)
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'ATTENDANCE_APPROVALS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('ATTENDANCE_APPROVALS')}
        >
          <CheckSquare size={14} /> Approvals Queue ({pendingHODAttendanceApps.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'EXAMINATION' || activeTab === 'EXAM_ELIGIBILITY' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('EXAMINATION')}
        >
          <Award size={14} /> Exam Eligibility
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'DATA_CHANGE_APPROVALS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('DATA_CHANGE_APPROVALS')}
        >
          <ShieldCheck size={14} /> Data Change Approvals ({pendingHODDataChangesCount})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'REQUESTS' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('REQUESTS')}
        >
          <MessageSquare size={14} /> Requests ({pendingRequests.length})
        </button>
        <button 
          className={`btn btn-sm ${activeTab === 'FEEDBACK' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('FEEDBACK')}
        >
          <BarChart3 size={14} /> Department Feedback
        </button>
        <button 
          className={`btn btn-sm ${
            activeTab === 'REPORTS' || 
            activeTab === 'REPORTS_ACADEMIC' || 
            activeTab === 'REPORTS_ATTENDANCE' || 
            activeTab === 'REPORTS_STUDENT' || 
            activeTab === 'REPORTS_FACULTY' || 
            activeTab === 'REPORTS_DEPARTMENT' 
              ? 'btn-primary' 
              : 'btn-secondary'
          }`}
          onClick={() => setActiveTab('REPORTS_ACADEMIC')}
        >
          <FileSpreadsheet size={14} /> Reports &amp; Analytics
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: Department Overview (Department Command Center)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'OVERVIEW' && (
        <DepartmentCommandCenter
          onNavigateTab={setActiveTab}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: Student Roster (Excel-Style Data Grid)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'STUDENTS' && (
        <div className="card" style={{ padding: '1.25rem', background: '#FFFFFF', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', margin: 0 }}>
                Department Students Roster
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Centralized academic register with live attendance, document verification, academic risk standing, and examination admittance status.
              </p>
            </div>
          </div>

          <DepartmentStudentRosterGrid
            departmentId={department?.id || targetDepartmentId}
            departmentName={department?.name || 'Computer Science & Engineering'}
            onSelectStudentForProfile={(student) => setSelectedStudentForProfile(student)}
            onExportExcel={() => exportDepartmentReportXLSX('STUDENTS')}
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: At-Risk Students
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'AT_RISK' && (
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--brand-navy)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={18} color="#EF4444" /> Department At-Risk Students ({atRiskStudents.length})
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Identified based on attendance shortage (&lt;75%), missing verification documents, or active academic concerns.
              </p>
            </div>
            <Badge variant="danger">{atRiskStudents.length} High Risk Cases</Badge>
          </div>

          {atRiskStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#10B981' }}>
              <CheckCircle2 size={48} style={{ margin: '0 auto 1rem' }} />
              <h4 style={{ fontWeight: 800 }}>No Department At-Risk Students</h4>
              <p style={{ fontSize: '0.85rem' }}>All department students satisfy attendance thresholds and required document verification.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Student Candidate</th>
                    <th>Attendance Status</th>
                    <th>Document Status</th>
                    <th>Risk Factor Details</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskStudents.map(({ student, stats, hasShortage, hasMissingDocs }) => (
                    <tr key={student.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--brand-navy)' }}>{student.name}</div>
                        <code style={{ fontSize: '0.75rem', color: 'var(--brand-orange)' }}>{student.enrollmentNo}</code>
                      </td>
                      <td>
                        <span style={{ color: '#EF4444', fontWeight: 800 }}>{stats.percentage}%</span> / 75%
                      </td>
                      <td>
                        <Badge variant={!hasMissingDocs ? 'active' : 'orange'}>
                          {!hasMissingDocs ? 'Verified' : 'Pending Verification'}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
                          {hasShortage && `• ${75 - stats.percentage}% Attendance Deficit`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#F59E0B', fontWeight: 600 }}>
                          {hasMissingDocs && `• Unverified Academic Records`}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '1rem' }}>
                        <StudentRowActionMenu 
                          student={student}
                          statusLevel={stats.percentage < 60 ? 'critical' : 'warning'}
                          onViewProfile={() => setSelectedStudentForProfile(student)}
                          onViewAcademic={() => setSelectedStudentForProfile(student)}
                          onViewAttendance={() => setSelectedStudentForProfile(student)}
                          onViewDocuments={() => setSelectedStudentForProfile(student)}
                          onViewExamination={() => setSelectedStudentForProfile(student)}
                          onViewRequests={() => setSelectedStudentForProfile(student)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          FACULTY SUB-MODULES (4 DISTINCT DEDICATED ERP PAGES)
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'FACULTY' || activeTab === 'FACULTY_WORKLOAD' || activeTab === 'FACULTY_ALLOCATION' || activeTab === 'FACULTY_PERFORMANCE') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          
          {/* Sub-Navigation Switcher for 4 Dedicated Faculty Pages */}
          <div style={{ 
            display: 'flex', 
            gap: '0.4rem', 
            background: '#FFFFFF', 
            padding: '0.5rem 0.75rem', 
            borderRadius: '8px', 
            border: '1px solid #E2E8F0',
            flexWrap: 'wrap'
          }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'FACULTY' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('FACULTY')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              1. Faculty Directory (HR Profiles)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'FACULTY_WORKLOAD' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('FACULTY_WORKLOAD')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              2. Teaching Workload (Load Balancing)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'FACULTY_ALLOCATION' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('FACULTY_ALLOCATION')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              3. Subject Allocation (Course Coverage)
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === 'FACULTY_PERFORMANCE' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('FACULTY_PERFORMANCE')}
              style={{ fontSize: '0.75rem', fontWeight: 700 }}
            >
              4. Faculty Performance &amp; Reviews
            </button>
          </div>

          {/* PAGE 1: Faculty Master Directory / HR Profile View */}
          {activeTab === 'FACULTY' && (
            <DepartmentFacultyDirectory
              onRefreshParent={() => setRefreshKey(k => k + 1)}
              onNavigateToWorkload={() => setActiveTab('FACULTY_WORKLOAD')}
            />
          )}

          {/* PAGE 2: Faculty Teaching Workload Matrix */}
          {activeTab === 'FACULTY_WORKLOAD' && (
            <DepartmentFacultyWorkloadGrid
              onRefreshParent={() => setRefreshKey(k => k + 1)}
            />
          )}

          {/* PAGE 3: Subject-Centric Course Allocation */}
          {activeTab === 'FACULTY_ALLOCATION' && (
            <DepartmentSubjectAllocationGrid
              onRefreshParent={() => setRefreshKey(k => k + 1)}
              onNavigateToWorkload={() => setActiveTab('FACULTY_WORKLOAD')}
            />
          )}

          {/* PAGE 4: Faculty Performance Evaluation & Reviews */}
          {activeTab === 'FACULTY_PERFORMANCE' && (
            <DepartmentFacultyPerformanceGrid
              onRefreshParent={() => setRefreshKey(k => k + 1)}
              onNavigateToWorkload={() => setActiveTab('FACULTY_WORKLOAD')}
            />
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4B: Department Mentor Assignment Management
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'MENTORS' || activeTab === 'MENTOR_MANAGEMENT') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <MentorAssignmentTab 
            initialDeptFilter={user?.departmentId} 
            initialInstFilter={user?.instituteId} 
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: Department-Wide Subject Attendance Register (Excel-Style Data Register)
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'ATTENDANCE' || activeTab === 'ATTENDANCE_SHORTAGE') && (
        <DepartmentAttendanceRegister
          onNavigateToApprovals={() => setActiveTab('ATTENDANCE_APPROVALS')}
          onRefreshParent={() => setRefreshKey(k => k + 1)}
          initialStatusFilter={activeTab === 'ATTENDANCE_SHORTAGE' ? 'SHORTAGE' : 'ALL'}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 6: HOD Attendance Approvals Queue (4-Tier Flow)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ATTENDANCE_APPROVALS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Attendance Condonation Review Queue for HOD Endorsement ({pendingHODAttendanceApps.length})
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Strict 4-Tier Workflow: <code>Student → Subject Faculty → Mentor → HOD → HOI</code>. HOD approval forwards to HOI/Principal.
            </p>
          </div>

          {pendingHODAttendanceApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>No attendance condonation applications pending your HOD review.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Application No</th>
                    <th>Student Candidate</th>
                    <th>Subject</th>
                    <th>Faculty &amp; Mentor Remarks</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingHODAttendanceApps.map(app => (
                    <tr key={app.id}>
                      <td><code>{app.applicationNo}</code></td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{app.studentName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.enrollmentNo}</div>
                      </td>
                      <td>
                        <strong>{app.subjectName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.subjectCode}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.75rem' }}>Faculty: <em>"{app.facultyRemarks || 'Approved'}"</em></div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--brand-navy)' }}>Mentor: <em>"{app.mentorRemarks || 'Endorsed'}"</em></div>
                      </td>
                      <td>
                        <span style={{ color: '#EF4444', fontWeight: 800 }}>{app.currentAttendancePct}%</span> / {app.requiredAttendancePct}%
                      </td>
                      <td>
                        <Badge variant="warning">{app.status}</Badge>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setReviewApp(app);
                            setReviewRemarks('');
                            setReviewDecision('APPROVE');
                          }}
                        >
                          Review &amp; Decide
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 7: Exam Eligibility Register (Excel-Style Register)
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'EXAMINATION' || activeTab === 'EXAM_ELIGIBILITY') && (
        <MenteeExamEligibilityManager
          onNavigateToCondonations={() => setActiveTab('ATTENDANCE_APPROVALS')}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: Student Data Change Approvals (HOD Final Review & Master Mutation)
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'DATA_CHANGE_APPROVALS' && (
        <StudentDataChangeTab isQueueMode={true} initialStatusFilter="HOD_PENDING" />
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 8: Escalated Student Requests & Routing
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'REQUESTS' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)' }}>
              Department Requests &amp; Grievances Desk ({deptRequests.length})
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              Incoming academic issues, complaints escalated from mentors, and inter-departmental transfers.
            </p>
          </div>

          {deptRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600 }}>No requests currently require HOD attention.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Student</th>
                    <th>Category</th>
                    <th>Subject / Query</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deptRequests.map((r: any) => (
                    <tr key={r.id}>
                      <td><code>{r.requestNo || r.id}</code></td>
                      <td>
                        <strong>{r.studentName}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.enrollmentNo}</div>
                      </td>
                      <td><Badge variant="navy">{r.category || 'Academic'}</Badge></td>
                      <td>{r.subject || r.description}</td>
                      <td>{new Date(r.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td>
                        <Badge variant={r.status === 'RESOLVED' || r.status === 'APPROVED' ? 'active' : 'warning'}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 9: Department Feedback
          ───────────────────────────────────────────────────────────── */}
      {activeTab === 'FEEDBACK' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--brand-navy)', marginBottom: '1rem' }}>
            Aggregated Department Teaching &amp; Academic Feedback
          </h3>
          <div className="grid-3" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TEACHING CLARITY</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>4.6 / 5.0</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>DOUBT RESOLUTION</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy)' }}>4.5 / 5.0</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACADEMIC ENVIRONMENT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-gold)' }}>4.7 / 5.0</div>
            </div>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            * In accordance with institutional policy, all student feedback is aggregated and completely anonymized.
          </p>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 10: Department Reports & Analytics (5 Distinct Dedicated Sub-Modules)
          ───────────────────────────────────────────────────────────── */}
      {(activeTab === 'REPORTS' || activeTab === 'REPORTS_ACADEMIC') && (
        <AcademicReports onTabChange={(tab) => setActiveTab(`REPORTS_${tab}` as HODTabType)} />
      )}

      {activeTab === 'REPORTS_ATTENDANCE' && (
        <AttendanceReports onTabChange={(tab) => setActiveTab(`REPORTS_${tab}` as HODTabType)} />
      )}

      {activeTab === 'REPORTS_STUDENT' && (
        <StudentReports onTabChange={(tab) => setActiveTab(`REPORTS_${tab}` as HODTabType)} />
      )}

      {activeTab === 'REPORTS_FACULTY' && (
        <FacultyReports onTabChange={(tab) => setActiveTab(`REPORTS_${tab}` as HODTabType)} />
      )}

      {activeTab === 'REPORTS_DEPARTMENT' && (
        <DepartmentReports onTabChange={(tab) => setActiveTab(`REPORTS_${tab}` as HODTabType)} />
      )}

      {/* Subject Allocation Modal */}
      {isAllocModalOpen && (
        <Modal isOpen={isAllocModalOpen} onClose={() => setIsAllocModalOpen(false)} title="Department Course Subject Allocation">
          <form onSubmit={handleSaveAllocation} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Course Subject *</label>
              <select className="form-select" value={allocSubjectId} onChange={e => setAllocSubjectId(e.target.value)} required>
                <option value="">Select Subject...</option>
                {deptSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name} ({s.credits} Credits)</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assign to Faculty *</label>
              <select className="form-select" value={allocFacultyId} onChange={e => setAllocFacultyId(e.target.value)} required>
                <option value="">Select Faculty...</option>
                {deptFaculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Division / Section *</label>
              <select className="form-select" value={allocDivisionId} onChange={e => setAllocDivisionId(e.target.value)}>
                <option value="Div A">Division A</option>
                <option value="Div B">Division B</option>
                <option value="All Divisions">All Divisions</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAllocModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Allocation</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Attendance Review Modal */}
      {reviewApp && (
        <Modal isOpen={!!reviewApp} onClose={() => setReviewApp(null)} title={`HOD Review: Attendance Application ${reviewApp.applicationNo}`}>
          <form onSubmit={handleHODAttendanceDecision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {reviewApp.studentName} ({reviewApp.enrollmentNo})</div>
              <div><strong>Subject:</strong> {reviewApp.subjectName} ({reviewApp.subjectCode})</div>
              <div><strong>Attendance:</strong> {reviewApp.currentAttendancePct}% (Required: {reviewApp.requiredAttendancePct}%)</div>
              <div><strong>Shortage:</strong> {reviewApp.shortagePct}%</div>
              <div><strong>Reason:</strong> {reviewApp.reason.replace(/_/g, ' ')}</div>
              {reviewApp.facultyRemarks && <div style={{ marginTop: '0.25rem', color: 'var(--brand-orange)' }}><strong>Subject Faculty:</strong> {reviewApp.facultyRemarks}</div>}
              {reviewApp.mentorRemarks && <div style={{ marginTop: '0.25rem', color: 'var(--brand-navy)' }}><strong>Mentor Endorsement:</strong> {reviewApp.mentorRemarks}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">HOD Decision *</label>
              <select className="form-select" value={reviewDecision} onChange={e => setReviewDecision(e.target.value as any)}>
                <option value="APPROVE">Endorse &amp; Forward to HOI / Principal</option>
                <option value="REJECT">Reject Application</option>
                <option value="REQUEST_MORE_INFO">Request Clarification from Mentor</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">HOD Remarks / Justification *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Enter departmental endorsement observations..."
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReviewApp(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit HOD Decision</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal isOpen={true} student={selectedStudentForProfile} onClose={() => setSelectedStudentForProfile(null)} />
      )}
    </div>
  );
};
