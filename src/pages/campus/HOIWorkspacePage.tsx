import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/db';
import { attendanceApprovalService } from '../../services/attendanceApprovalService';
import { studentRequestService } from '../../services/studentRequestService';
import { feedbackService } from '../../services/feedbackService';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { StudentProfileModal, StudentProfileTabType } from '../../components/profile/StudentProfileModal';
import { StudentRowActionMenu } from '../../components/common/StudentRowActionMenu';
import { ExcelDataTable, ExcelColumn } from '../../components/common/ExcelDataTable';
import { 
  Building2, Users, UserCheck, Clock, Award, 
  CheckSquare, CheckCircle2, RefreshCw,
  BarChart3, MessageSquare, UserPlus
} from 'lucide-react';
import { AttendanceApplication, Student, Faculty, Subject, Program, Department, Semester } from '../../types';
import * as XLSX from 'xlsx';

export type HOITabType = 
  | 'OVERVIEW'
  | 'DEPARTMENTS'
  | 'HODS'
  | 'STUDENTS'
  | 'AT_RISK'
  | 'FACULTY'
  | 'FACULTY_WORKLOAD'
  | 'ATTENDANCE'
  | 'ATTENDANCE_SHORTAGE'
  | 'ATTENDANCE_APPROVALS'
  | 'EXAMINATION'
  | 'EXAM_ELIGIBILITY'
  | 'REQUESTS'
  | 'FEEDBACK'
  | 'REPORTS';

export interface HOIWorkspacePageProps {
  initialTab?: HOITabType;
}

export const HOIWorkspacePage: React.FC<HOIWorkspacePageProps> = ({ initialTab = 'OVERVIEW' }) => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<HOITabType>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [selectedStudentInitialTab, setSelectedStudentInitialTab] = useState<StudentProfileTabType>('OVERVIEW');
  const [approvalsFilterMode, setApprovalsFilterMode] = useState<'ALL' | 'PENDING_MY_ACTION' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED'>('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  const [isHODModalOpen, setIsHODModalOpen] = useState(false);
  const [hodAssignDeptId, setHodAssignDeptId] = useState('');
  const [hodAssignFacultyId, setHodAssignFacultyId] = useState('');
  const [hodAssignRemarks, setHodAssignRemarks] = useState('');

  const [reviewApp, setReviewApp] = useState<AttendanceApplication | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO'>('APPROVE');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const [selectedFeedbackForView, setSelectedFeedbackForView] = useState<any | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefreshData = () => {
    setRefreshKey(k => k + 1);
    showToast('Dataset refreshed from ERP source of truth.');
  };

  const targetInstituteId = useMemo(() => {
    return user?.instituteId || 'inst-1';
  }, [user]);

  const institute = useMemo(() => {
    return db.getInstituteById(targetInstituteId) || db.getInstitutes()[0];
  }, [targetInstituteId, refreshKey]);

  const instDepartments = useMemo(() => {
    const all = db.getDepartments();
    return all.filter(d => d.instituteId === institute?.id || targetInstituteId === 'inst-1');
  }, [institute, targetInstituteId, refreshKey]);

  const instPrograms = useMemo(() => {
    const all = db.getPrograms();
    return all.filter(p => p.instituteId === institute?.id || instDepartments.some(d => d.id === p.departmentId));
  }, [institute, instDepartments, refreshKey]);

  const instStudents = useMemo(() => {
    const all = db.getStudents();
    return all.filter(s => s.instituteId === institute?.id || instDepartments.some(d => d.id === s.departmentId));
  }, [institute, instDepartments, refreshKey]);

  const instFaculty = useMemo(() => {
    const all = db.getFaculty();
    return all.filter(f => f.instituteId === institute?.id || instDepartments.some(d => d.id === f.departmentId));
  }, [institute, instDepartments, refreshKey]);

  const instSubjects = useMemo(() => {
    const all = db.getSubjects();
    return all.filter(s => instDepartments.some(d => d.id === s.departmentId));
  }, [instDepartments, refreshKey]);

  const instAttendanceData = useMemo(() => {
    return instStudents.map(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
      const hasShortage = stats.percentage < 75;
      const hasMissingDocs = docs.some(d => d.status !== 'VERIFIED');
      const isRisk = hasShortage || hasMissingDocs;

      const dept = instDepartments.find(d => d.id === student.departmentId);
      const prog = instPrograms.find(p => p.id === student.programId);
      const sem = db.getSemesterById(student.semesterId);

      const shortageAmount = Math.max(0, 75 - stats.percentage);

      let riskReason = 'Normal';
      let riskLevel: 'NORMAL' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'NORMAL';

      if (hasShortage && hasMissingDocs) {
        riskReason = `Critical (${shortageAmount}% Shortage + Unverified Docs)`;
        riskLevel = 'CRITICAL';
      } else if (hasShortage) {
        riskReason = `${shortageAmount}% Attendance Shortage (<75%)`;
        riskLevel = stats.percentage < 60 ? 'HIGH' : 'MODERATE';
      } else if (hasMissingDocs) {
        riskReason = 'Pending Academic Document Verification';
        riskLevel = 'MODERATE';
      }

      return {
        id: student.id,
        student,
        stats,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        departmentId: student.departmentId,
        departmentName: dept?.name || 'Computer Engineering',
        departmentCode: dept?.code || 'CE',
        programId: student.programId,
        programName: prog?.name || 'B.Tech CSE',
        programCode: prog?.code || 'B.Tech',
        semesterId: student.semesterId,
        semesterNumber: sem?.number || 4,
        sectionName: student.divisionId || 'Div A',
        attendancePercentage: stats.percentage,
        totalClasses: stats.totalClasses || 48,
        presentClasses: stats.presentClasses || Math.round(48 * (stats.percentage / 100)),
        absentClasses: (stats.totalClasses || 48) - (stats.presentClasses || Math.round(48 * (stats.percentage / 100))),
        shortagePercentage: shortageAmount,
        academicStanding: stats.percentage >= 75 ? 'GOOD STANDING' : stats.percentage >= 60 ? 'ATTENDANCE RISK' : 'CRITICAL RISK',
        examEligibility: stats.percentage >= 75 ? 'ELIGIBLE' : stats.percentage >= 60 ? 'PROVISIONAL' : 'SHORTAGE',
        docStatus: !hasMissingDocs ? 'VERIFIED' : 'PENDING VERIFICATION',
        riskStatus: isRisk ? 'AT RISK' : 'NORMAL',
        riskReason,
        riskLevel,
        assignedAuthority: 'Department Mentor / HOD',
        hasShortage,
        hasMissingDocs,
        isRisk,
        lastUpdated: (student as any).updatedAt || (student as any).createdAt || new Date().toISOString()
      };
    });
  }, [instStudents, instDepartments, instPrograms, refreshKey]);

  const atRiskStudents = useMemo(() => {
    return instAttendanceData.filter(d => d.isRisk);
  }, [instAttendanceData]);

  const pendingHOIAttendanceApps = useMemo(() => {
    const allApps = db.getAttendanceApplications();
    return allApps.filter(a => 
      (a.instituteId === institute?.id || role === 'SUPER_ADMIN') &&
      (a.status === 'HOD_APPROVED' || a.status === 'WITH_HOI')
    );
  }, [institute, role, refreshKey]);

  const allInstituteAttendanceApps = useMemo(() => {
    const allApps = db.getAttendanceApplications();
    return allApps.filter(a => a.instituteId === institute?.id || role === 'SUPER_ADMIN');
  }, [institute, role, refreshKey]);

  const filteredApprovalsData = useMemo(() => {
    if (approvalsFilterMode === 'PENDING_MY_ACTION') {
      return pendingHOIAttendanceApps;
    }
    if (approvalsFilterMode === 'IN_PROGRESS') {
      return allInstituteAttendanceApps.filter(a =>
        a.status === 'SUBMITTED_TO_FACULTY' ||
        a.status === 'FACULTY_APPROVED' ||
        a.status === 'WITH_MENTOR' ||
        a.status === 'MENTOR_APPROVED' ||
        a.status === 'WITH_HOD'
      );
    }
    if (approvalsFilterMode === 'APPROVED') {
      return allInstituteAttendanceApps.filter(a => a.status === 'FINAL_APPROVED' || a.status === 'HOI_APPROVED');
    }
    if (approvalsFilterMode === 'REJECTED') {
      return allInstituteAttendanceApps.filter(a => 
        a.status === 'FACULTY_REJECTED' || 
        a.status === 'MENTOR_REJECTED' || 
        a.status === 'HOD_REJECTED' || 
        a.status === 'HOI_REJECTED'
      );
    }
    return allInstituteAttendanceApps;
  }, [approvalsFilterMode, pendingHOIAttendanceApps, allInstituteAttendanceApps]);

  const instRequests = useMemo(() => {
    const all = db.getState().studentRequests || [];
    return all.filter(r => r.instituteId === institute?.id || (r as any).currentOffice === 'HOI' || (r as any).currentOffice === 'PRINCIPAL' || role === 'SUPER_ADMIN');
  }, [institute, role, refreshKey]);

  const instFeedbacks = useMemo(() => {
    const all = feedbackService.getAllFeedbacks().filter(f => !institute?.id || f.instituteId === institute.id || role === 'SUPER_ADMIN');
    return all.map((f: any) => ({
      id: f.id,
      feedbackNo: f.feedbackNo,
      submittedBy: f.isAnonymous ? 'Anonymous Candidate' : f.studentName,
      role: 'STUDENT',
      departmentName: f.departmentName || 'Computer Engineering',
      category: f.category,
      overallRating: f.overallRating,
      priority: f.overallRating < 3.0 ? 'HIGH' : f.overallRating < 4.0 ? 'MEDIUM' : 'LOW',
      status: f.status || 'REVIEWED',
      assignedTo: 'Dean / Principal Office',
      createdAt: f.createdAt,
      comments: f.comments || f.positiveFeedback || 'Constructive academic review submitted.',
      updatedAt: f.updatedAt || f.createdAt
    }));
  }, [institute, role, refreshKey]);

  const deptComparisonData = useMemo(() => {
    return instDepartments.map(dept => {
      const dStudents = instStudents.filter(s => s.departmentId === dept.id);
      const dFaculty = instFaculty.filter(f => f.departmentId === dept.id);
      const dShortages = dStudents.filter(s => {
        const stats = db.getStudentAttendanceStats(s.id);
        return stats.percentage < 75;
      }).length;
      const dPendingApps = pendingHOIAttendanceApps.filter(a => a.departmentId === dept.id).length;
      const dPrograms = instPrograms.filter(p => p.departmentId === dept.id);

      const hodFac = dFaculty.find(f => f.name === dept.hodName) || dFaculty[0];

      const avgAtt = dStudents.length > 0
        ? Math.round(dStudents.reduce((sum, s) => sum + db.getStudentAttendanceStats(s.id).percentage, 0) / dStudents.length)
        : 85;

      return {
        id: dept.id,
        dept,
        name: dept.name,
        code: dept.code,
        hodName: dept.hodName || 'Assigned HOD',
        hodEmployeeId: hodFac?.employeeId || `EMP-HOD-${dept.code}`,
        programsCount: dPrograms.length,
        studentsCount: dStudents.length,
        facultyCount: dFaculty.length,
        shortagesCount: dShortages,
        pendingAppsCount: dPendingApps,
        avgAttendance: avgAtt,
        status: dept.status || 'ACTIVE',
        reportingAuthority: `Principal / Dean, ${institute?.name || 'SSCIT'}`
      };
    });
  }, [instDepartments, instStudents, instFaculty, instPrograms, pendingHOIAttendanceApps, institute, refreshKey]);

  const facultyWorkloadData = useMemo(() => {
    return instFaculty.map(f => {
      const dept = instDepartments.find(d => d.id === f.departmentId);
      const assignedSubs = instSubjects.filter(s => s.assignedFacultyId === f.id || (f.subjectIds && f.subjectIds.includes(s.id)));
      const thHours = assignedSubs.reduce((sum, s) => sum + (s.theoryHoursPerWeek || 3), 0) || 12;
      const labHours = assignedSubs.reduce((sum, s) => sum + (s.labHoursPerWeek || 2), 0) || 6;
      const totalLoad = thHours + labHours;

      let workloadStatus: 'OPTIMAL' | 'NORMAL' | 'HIGH LOAD' | 'UNDERLOAD' = 'NORMAL';
      if (totalLoad > 20) workloadStatus = 'HIGH LOAD';
      else if (totalLoad >= 16) workloadStatus = 'OPTIMAL';
      else if (totalLoad < 12) workloadStatus = 'UNDERLOAD';

      return {
        id: f.id,
        faculty: f,
        name: f.name,
        employeeId: f.employeeId,
        departmentName: dept?.name || 'Computer Engineering',
        departmentCode: dept?.code || 'CE',
        designation: f.designation,
        employmentStatus: 'Permanent Full-Time',
        assignedCoursesList: assignedSubs.map(s => s.code).join(', ') || 'CE401, CE402',
        assignedCoursesCount: assignedSubs.length || 2,
        theoryHours: thHours,
        labHours: labHours,
        totalWorkload: totalLoad,
        workloadStatus,
        reportingAuthority: dept?.hodName ? `${dept.hodName} (HOD)` : 'Head of Department',
        status: f.status || 'ACTIVE',
        email: f.email,
        phone: f.phone || '+91 98250 10000'
      };
    });
  }, [instFaculty, instDepartments, instSubjects, refreshKey]);

  const reportsCatalogData = useMemo(() => {
    return [
      {
        id: 'rep-dept-matrix',
        reportName: 'Institute Department Health & Performance Matrix',
        reportType: 'ACADEMIC_GOVERNANCE',
        departmentScope: 'All Constituent Departments',
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      },
      {
        id: 'rep-students-roster',
        reportName: 'Universal Students Enrolment & Compliance Roster',
        reportType: 'STUDENT_ADMINISTRATION',
        departmentScope: `${institute?.code || 'SSCIT'} Global Scope`,
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      },
      {
        id: 'rep-attendance-shortage',
        reportName: 'Bi-Weekly Attendance Shortage & Condonation Audit',
        reportType: 'ATTENDANCE_COMPLIANCE',
        departmentScope: 'Institute Shortages (<75%)',
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      },
      {
        id: 'rep-faculty-workload',
        reportName: 'Faculty Teaching Load & Course Allocation Register',
        reportType: 'HR_WORKLOAD',
        departmentScope: 'Permanent & Adjunct Professors',
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      },
      {
        id: 'rep-exam-eligibility',
        reportName: 'Semester Theory & Practical Exam Eligibility Roster',
        reportType: 'EXAMINATION_CELL',
        departmentScope: 'Candidates Cleared for Hall Tickets',
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      },
      {
        id: 'rep-feedback-quality',
        reportName: 'Institutional Student Feedback & NAAC Quality Index',
        reportType: 'IQAC_ACCREDITATION',
        departmentScope: 'All Academic Courses',
        academicYear: 'AY 2025-2026',
        generatedBy: user?.name || 'Principal Office',
        generatedDate: new Date().toLocaleDateString(),
        status: 'READY'
      }
    ];
  }, [institute, user, refreshKey]);

  const handleHOIAttendanceDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewApp || !user) return;

    try {
      attendanceApprovalService.hoiReview(
        reviewApp.id,
        {
          decision: reviewDecision,
          remarks: reviewRemarks.trim() || `HOI ${reviewDecision === 'APPROVE' ? 'approved & granted exam eligibility' : 'decision'}`
        },
        user
      );
      setReviewApp(null);
      setReviewRemarks('');
      setRefreshKey(k => k + 1);
      showToast(`Attendance application ${reviewApp.applicationNo} updated successfully (Status: ${reviewDecision === 'APPROVE' ? 'FINAL_APPROVED → Exam Eligible' : 'HOI_REJECTED'}).`);
    } catch (err: any) {
      alert(err.message || 'HOI Action failed.');
    }
  };

  const handleSaveHODAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hodAssignDeptId || !hodAssignFacultyId) return;

    const dept = db.getDepartments().find(d => d.id === hodAssignDeptId);
    const fac = db.getFaculty().find(f => f.id === hodAssignFacultyId);

    if (dept && fac) {
      db.updateEntity<Department>('departments', dept.id, { hodId: fac.id, hodName: fac.name }, `Appointed ${fac.name} as HOD of ${dept.name}`);
      setIsHODModalOpen(false);
      setRefreshKey(k => k + 1);
      showToast(`Prof. ${fac.name} appointed as Head of Department for ${dept.name}.`);
    }
  };

  // ═════════════════════════════════════════════════════════════════════════
  // EXCEL COLUMNS DEFINITIONS WITH RICH CUSTOM RENDERERS
  // ═════════════════════════════════════════════════════════════════════════

  // 1. Department Overview Columns
  const departmentColumns: ExcelColumn<any>[] = [
    {
      key: 'name',
      header: 'Department Name',
      width: '240px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.name}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Code: <code>{item.code}</code></div>
        </div>
      )
    },
    {
      key: 'code',
      header: 'Dept Code',
      width: '95px',
      align: 'center',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.code}</code>
    },
    {
      key: 'hodName',
      header: 'Head of Department (HOD)',
      width: '200px',
      render: item => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--brand-navy, #0B192C)' }}>{item.hodName}</div>
          <div style={{ fontSize: '0.7rem', color: '#64748B' }}>{item.hodEmployeeId}</div>
        </div>
      )
    },
    {
      key: 'programsCount',
      header: 'Programs',
      width: '90px',
      align: 'center',
      render: item => <Badge variant="navy">{item.programsCount} Programs</Badge>
    },
    {
      key: 'studentsCount',
      header: 'Students',
      width: '100px',
      align: 'center',
      render: item => <strong>{item.studentsCount}</strong>
    },
    {
      key: 'facultyCount',
      header: 'Faculty',
      width: '95px',
      align: 'center',
      render: item => <strong>{item.facultyCount}</strong>
    },
    {
      key: 'avgAttendance',
      header: 'Avg Attendance %',
      width: '130px',
      align: 'center',
      render: item => (
        <span style={{ fontWeight: 800, color: item.avgAttendance >= 75 ? '#10B981' : '#EF4444' }}>
          {item.avgAttendance}%
        </span>
      )
    },
    {
      key: 'shortagesCount',
      header: 'Shortages (<75%)',
      width: '130px',
      align: 'center',
      render: item => (
        <Badge variant={item.shortagesCount === 0 ? 'active' : 'danger'}>
          {item.shortagesCount} Students
        </Badge>
      )
    },
    {
      key: 'pendingAppsCount',
      header: 'Pending Approvals',
      width: '135px',
      align: 'center',
      render: item => (
        <Badge variant={item.pendingAppsCount === 0 ? 'active' : 'warning'}>
          {item.pendingAppsCount} Pending
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '180px',
      align: 'right',
      sortable: false,
      render: item => (
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => {
              setHodAssignDeptId(item.id);
              setIsHODModalOpen(true);
            }}
          >
            Reassign
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs"
            onClick={() => {
              setActiveTab('STUDENTS');
            }}
          >
            Inspect →
          </button>
        </div>
      )
    }
  ];

  // 2. Student Roster Columns
  const studentRosterColumns: ExcelColumn<any>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      width: '210px',
      render: item => (
        <div
          onClick={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('OVERVIEW');
          }}
          style={{ cursor: 'pointer' }}
          title="Click to open Student 360° Profile"
        >
          <div style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.student.email}</div>
        </div>
      )
    },
    {
      key: 'enrollmentNo',
      header: 'Enrollment ID',
      width: '135px',
      render: item => (
        <code
          onClick={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('OVERVIEW');
          }}
          style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)', cursor: 'pointer' }}
          title="Click to open Student 360° Profile"
        >
          {item.enrollmentNo}
        </code>
      )
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '180px',
      render: item => <span>{item.departmentName} ({item.departmentCode})</span>
    },
    {
      key: 'programCode',
      header: 'Program',
      width: '110px',
      render: item => <span>{item.programCode}</span>
    },
    {
      key: 'semesterNumber',
      header: 'Semester',
      width: '85px',
      align: 'center',
      render: item => <strong>Sem {item.semesterNumber}</strong>
    },
    {
      key: 'sectionName',
      header: 'Section',
      width: '85px',
      align: 'center',
      render: item => <span>{item.sectionName}</span>
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      width: '115px',
      align: 'center',
      render: item => (
        <span
          onClick={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('ATTENDANCE');
          }}
          style={{ cursor: 'pointer' }}
          title="View Attendance Details"
        >
          <Badge variant={item.attendancePercentage >= 75 ? 'active' : item.attendancePercentage >= 60 ? 'warning' : 'danger'}>
            {item.attendancePercentage}%
          </Badge>
        </span>
      )
    },
    {
      key: 'academicStanding',
      header: 'Academic Standing',
      width: '145px',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : item.attendancePercentage >= 60 ? 'warning' : 'danger'}>
          {item.academicStanding}
        </Badge>
      )
    },
    {
      key: 'examEligibility',
      header: 'Exam Eligibility',
      width: '130px',
      align: 'center',
      render: item => (
        <span
          onClick={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('EXAMINATION');
          }}
          style={{ cursor: 'pointer' }}
          title="View Examination & Hall Ticket Status"
        >
          <Badge variant={item.attendancePercentage >= 75 ? 'active' : item.attendancePercentage >= 60 ? 'warning' : 'danger'}>
            {item.examEligibility}
          </Badge>
        </span>
      )
    },
    {
      key: 'docStatus',
      header: 'Document Status',
      width: '140px',
      align: 'center',
      render: item => (
        <span
          onClick={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('DOCUMENTS');
          }}
          style={{ cursor: 'pointer' }}
          title="Click to view Student Documents Vault"
        >
          <Badge variant={item.docStatus === 'VERIFIED' ? 'active' : 'orange'}>
            {item.docStatus}
          </Badge>
        </span>
      )
    },
    {
      key: 'riskStatus',
      header: 'Risk Status',
      width: '110px',
      align: 'center',
      render: item => (
        <Badge variant={item.riskStatus === 'NORMAL' ? 'active' : 'danger'}>
          {item.riskStatus}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      sortable: false,
      render: item => (
        <StudentRowActionMenu
          student={item.student}
          statusLevel={item.attendancePercentage < 60 ? 'critical' : item.attendancePercentage < 75 ? 'warning' : 'good'}
          onViewProfile={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('OVERVIEW');
          }}
          onViewAcademic={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('ADMISSION_ACADEMIC');
          }}
          onViewAttendance={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('ATTENDANCE');
          }}
          onViewDocuments={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('DOCUMENTS');
          }}
          onViewExamination={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('EXAMINATION');
          }}
          onViewRequests={() => {
            setSelectedStudentForProfile(item.student);
            setSelectedStudentInitialTab('REQUESTS');
          }}
        />
      )
    }
  ];

  // 3. At-Risk Students Columns
  const atRiskColumns: ExcelColumn<any>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      width: '200px',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</div>
          <code style={{ fontSize: '0.72rem', color: 'var(--brand-orange, #F37023)' }}>{item.enrollmentNo}</code>
        </div>
      )
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '170px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'programCode',
      header: 'Program',
      width: '100px',
      render: item => <span>{item.programCode}</span>
    },
    {
      key: 'semesterNumber',
      header: 'Semester',
      width: '85px',
      align: 'center',
      render: item => <strong>Sem {item.semesterNumber}</strong>
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      width: '110px',
      align: 'center',
      render: item => <span style={{ color: '#EF4444', fontWeight: 800 }}>{item.attendancePercentage}%</span>
    },
    {
      key: 'requiredPercentage',
      header: 'Required %',
      width: '95px',
      align: 'center',
      render: () => <strong>75%</strong>
    },
    {
      key: 'docStatus',
      header: 'Document Status',
      width: '135px',
      align: 'center',
      render: item => (
        <Badge variant={item.docStatus === 'VERIFIED' ? 'active' : 'orange'}>
          {item.docStatus}
        </Badge>
      )
    },
    {
      key: 'riskReason',
      header: 'Risk Reason',
      width: '240px',
      render: item => <span style={{ color: '#DC2626', fontWeight: 600, fontSize: '0.75rem' }}>{item.riskReason}</span>
    },
    {
      key: 'riskLevel',
      header: 'Risk Level',
      width: '110px',
      align: 'center',
      render: item => (
        <Badge variant={item.riskLevel === 'CRITICAL' ? 'danger' : item.riskLevel === 'HIGH' ? 'orange' : 'warning'}>
          {item.riskLevel}
        </Badge>
      )
    },
    {
      key: 'assignedAuthority',
      header: 'Assigned Authority',
      width: '170px',
      render: item => <span>{item.assignedAuthority}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      sortable: false,
      render: item => (
        <StudentRowActionMenu
          student={item.student}
          statusLevel={item.attendancePercentage < 60 ? 'critical' : 'warning'}
          onViewProfile={() => setSelectedStudentForProfile(item.student)}
          onViewAcademic={() => setSelectedStudentForProfile(item.student)}
          onViewAttendance={() => setSelectedStudentForProfile(item.student)}
          onViewDocuments={() => setSelectedStudentForProfile(item.student)}
          onViewExamination={() => setSelectedStudentForProfile(item.student)}
          onViewRequests={() => setSelectedStudentForProfile(item.student)}
        />
      )
    }
  ];

  // 4. Faculty & Workload Columns
  const facultyWorkloadColumns: ExcelColumn<any>[] = [
    {
      key: 'name',
      header: 'Faculty Name',
      width: '200px',
      render: item => (
        <div>
          <div style={{ fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>{item.name}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.email}</div>
        </div>
      )
    },
    {
      key: 'employeeId',
      header: 'Employee ID',
      width: '125px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.employeeId}</code>
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '180px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'designation',
      header: 'Designation',
      width: '170px',
      render: item => <span>{item.designation}</span>
    },
    {
      key: 'employmentStatus',
      header: 'Employment Status',
      width: '145px',
      render: item => <Badge variant="active">{item.employmentStatus}</Badge>
    },
    {
      key: 'assignedCoursesList',
      header: 'Assigned Courses',
      width: '160px',
      render: item => (
        <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
          {item.assignedCoursesList.split(', ').map((code: string, i: number) => (
            <Badge key={i} variant="navy">{code}</Badge>
          ))}
        </div>
      )
    },
    {
      key: 'theoryHours',
      header: 'Theory Hrs',
      width: '95px',
      align: 'center',
      render: item => <strong>{item.theoryHours}h</strong>
    },
    {
      key: 'labHours',
      header: 'Lab Hrs',
      width: '85px',
      align: 'center',
      render: item => <strong>{item.labHours}h</strong>
    },
    {
      key: 'totalWorkload',
      header: 'Total Load (Hrs/Wk)',
      width: '140px',
      align: 'center',
      render: item => (
        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--brand-navy, #0B192C)' }}>
          {item.totalWorkload}h / wk
        </span>
      )
    },
    {
      key: 'workloadStatus',
      header: 'Workload Status',
      width: '130px',
      align: 'center',
      render: item => (
        <Badge variant={item.workloadStatus === 'OPTIMAL' ? 'active' : item.workloadStatus === 'NORMAL' ? 'navy' : item.workloadStatus === 'HIGH LOAD' ? 'orange' : 'warning'}>
          {item.workloadStatus}
        </Badge>
      )
    },
    {
      key: 'reportingAuthority',
      header: 'Reporting Authority',
      width: '180px',
      render: item => <span>{item.reportingAuthority}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => showToast(`Opening dossier for ${item.name}`)}
        >
          View Record
        </button>
      )
    }
  ];

  // 5. Attendance & Shortages Columns
  const attendanceShortageColumns: ExcelColumn<any>[] = [
    {
      key: 'studentName',
      header: 'Student Name',
      width: '200px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.enrollmentNo}</div>
        </div>
      )
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '175px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'programSemester',
      header: 'Program / Sem',
      width: '130px',
      render: item => <span>{item.programCode} • Sem {item.semesterNumber}</span>
    },
    {
      key: 'totalClasses',
      header: 'Total Classes',
      width: '105px',
      align: 'center',
      render: item => <span>{item.totalClasses}</span>
    },
    {
      key: 'presentClasses',
      header: 'Present',
      width: '80px',
      align: 'center',
      render: item => <strong style={{ color: '#10B981' }}>{item.presentClasses}</strong>
    },
    {
      key: 'absentClasses',
      header: 'Absent',
      width: '80px',
      align: 'center',
      render: item => <strong style={{ color: '#EF4444' }}>{item.absentClasses}</strong>
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      width: '115px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : item.attendancePercentage >= 60 ? 'warning' : 'danger'}>
          {item.attendancePercentage}%
        </Badge>
      )
    },
    {
      key: 'shortagePercentage',
      header: 'Shortage %',
      width: '105px',
      align: 'center',
      render: item => (
        item.shortagePercentage > 0 ? (
          <span style={{ color: '#EF4444', fontWeight: 800 }}>-{item.shortagePercentage}%</span>
        ) : (
          <span style={{ color: '#10B981' }}>0%</span>
        )
      )
    },
    {
      key: 'examEligibility',
      header: 'Exam Clearance',
      width: '145px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'danger'}>
          {item.examEligibility}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
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

  // 6. Final Approvals Columns
  const finalApprovalsColumns: ExcelColumn<any>[] = [
    {
      key: 'applicationNo',
      header: 'Request ID',
      width: '145px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.applicationNo}</code>
    },
    {
      key: 'studentName',
      header: 'Student / Faculty',
      width: '190px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.enrollmentNo}</div>
        </div>
      )
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '170px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'subjectName',
      header: 'Request Type / Subject',
      width: '200px',
      render: item => (
        <div>
          <div style={{ fontWeight: 700 }}>{item.subjectName}</div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.subjectCode}</div>
        </div>
      )
    },
    {
      key: 'currentAttendancePct',
      header: 'Attendance %',
      width: '110px',
      align: 'center',
      render: item => <span style={{ color: '#EF4444', fontWeight: 800 }}>{item.currentAttendancePct}%</span>
    },
    {
      key: 'endorsements',
      header: 'Approval Chain (4-Tier)',
      width: '240px',
      render: item => {
        const isFacultyDone = ['FACULTY_APPROVED', 'WITH_MENTOR', 'MENTOR_APPROVED', 'WITH_HOD', 'HOD_APPROVED', 'WITH_HOI', 'FINAL_APPROVED', 'HOI_APPROVED'].includes(item.status);
        const isMentorDone = ['MENTOR_APPROVED', 'WITH_HOD', 'HOD_APPROVED', 'WITH_HOI', 'FINAL_APPROVED', 'HOI_APPROVED'].includes(item.status);
        const isHODDone = ['HOD_APPROVED', 'WITH_HOI', 'FINAL_APPROVED', 'HOI_APPROVED'].includes(item.status);
        const isHOIDone = ['FINAL_APPROVED', 'HOI_APPROVED'].includes(item.status);

        return (
          <div style={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
            <div>
              <span style={{ color: isFacultyDone ? '#10B981' : item.status === 'SUBMITTED_TO_FACULTY' ? '#F59E0B' : '#94A3B8', fontWeight: 700 }}>
                1. Faculty: {isFacultyDone ? '✓ Approved' : item.status === 'SUBMITTED_TO_FACULTY' ? '⏳ Under Review' : '○ Pending'}
              </span>
            </div>
            <div>
              <span style={{ color: isMentorDone ? '#10B981' : item.status === 'WITH_MENTOR' ? '#F59E0B' : '#94A3B8', fontWeight: 700 }}>
                2. Mentor: {isMentorDone ? '✓ Endorsed' : item.status === 'WITH_MENTOR' ? '⏳ Under Review' : '○ Not Reached'}
              </span>
            </div>
            <div>
              <span style={{ color: isHODDone ? '#10B981' : item.status === 'WITH_HOD' ? '#F59E0B' : '#94A3B8', fontWeight: 700 }}>
                3. HOD: {isHODDone ? '✓ Recommended' : item.status === 'WITH_HOD' ? '⏳ Under Review' : '○ Not Reached'}
              </span>
            </div>
            <div>
              <span style={{ color: isHOIDone ? '#10B981' : (item.status === 'HOD_APPROVED' || item.status === 'WITH_HOI') ? '#D97706' : '#94A3B8', fontWeight: 800 }}>
                4. HOI / Principal: {isHOIDone ? '✓ Approved' : (item.status === 'HOD_APPROVED' || item.status === 'WITH_HOI') ? '⚡ Action Required' : '○ Not Reached'}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Workflow Stage / Status',
      width: '185px',
      align: 'center',
      render: item => {
        const isActionableForHOI = item.status === 'HOD_APPROVED' || item.status === 'WITH_HOI' || item.status === 'SUBMITTED_TO_PRINCIPAL';
        const isApproved = item.status === 'FINAL_APPROVED' || item.status === 'HOI_APPROVED';
        const isRejected = item.status.includes('REJECT');

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <Badge variant={isApproved ? 'active' : isRejected ? 'danger' : isActionableForHOI ? 'gold' : 'warning'}>
              {item.status}
            </Badge>
            <span style={{ fontSize: '0.68rem', color: isActionableForHOI ? '#D97706' : '#64748B', fontWeight: isActionableForHOI ? 800 : 500 }}>
              {isActionableForHOI ? '⚡ Awaiting HOI Decision' : isApproved ? 'Exam Hall Ticket Cleared' : isRejected ? 'Application Rejected' : `Current: ${item.currentHandlerRole || 'Tier Review'}`}
            </span>
          </div>
        );
      }
    },
    {
      key: 'submittedDate',
      header: 'Submitted Date',
      width: '120px',
      render: item => <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: 'Action / Review',
      width: '160px',
      align: 'right',
      sortable: false,
      render: item => {
        const isActionableForHOI = item.status === 'HOD_APPROVED' || item.status === 'WITH_HOI' || item.status === 'SUBMITTED_TO_PRINCIPAL';
        return (
          <button
            type="button"
            className={`btn ${isActionableForHOI ? 'btn-primary' : 'btn-secondary'} btn-xs`}
            onClick={() => {
              setReviewApp(item);
              setReviewRemarks('');
              setReviewDecision('APPROVE');
            }}
          >
            {isActionableForHOI ? 'Review & Decision' : 'Inspect Workflow'}
          </button>
        );
      }
    }
  ];

  // 7. Exam Eligibility Columns
  const examEligibilityColumns: ExcelColumn<any>[] = [
    {
      key: 'studentName',
      header: 'Student Candidate',
      width: '200px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.studentName}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.enrollmentNo}</div>
        </div>
      )
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '170px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'semesterNumber',
      header: 'Semester',
      width: '85px',
      align: 'center',
      render: item => <strong>Sem {item.semesterNumber}</strong>
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance %',
      width: '115px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'danger'}>
          {item.attendancePercentage}%
        </Badge>
      )
    },
    {
      key: 'facultyEndorsement',
      header: 'Faculty Endorsement',
      width: '150px',
      align: 'center',
      render: () => <Badge variant="active">CLEARED</Badge>
    },
    {
      key: 'mentorStatus',
      header: 'Mentor Status',
      width: '130px',
      align: 'center',
      render: item => <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'gold'}>{item.attendancePercentage >= 75 ? 'CLEARED' : 'CONDONED'}</Badge>
    },
    {
      key: 'hodEndorsement',
      header: 'HOD Endorsement',
      width: '145px',
      align: 'center',
      render: item => <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'navy'}>{item.attendancePercentage >= 75 ? 'APPROVED' : 'RECOMMENDED'}</Badge>
    },
    {
      key: 'hoiStatus',
      header: 'Final HOI Status',
      width: '145px',
      align: 'center',
      render: item => <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'navy'}>{item.attendancePercentage >= 75 ? 'FINAL APPROVED' : 'PENDING'}</Badge>
    },
    {
      key: 'examEligibility',
      header: 'Exam Eligibility',
      width: '135px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'danger'}>
          {item.attendancePercentage >= 75 ? 'EXAM ELIGIBLE' : 'PROVISIONAL'}
        </Badge>
      )
    },
    {
      key: 'hallTicketClearance',
      header: 'Hall Ticket Clearance',
      width: '155px',
      align: 'center',
      render: item => (
        <Badge variant={item.attendancePercentage >= 75 ? 'active' : 'orange'}>
          {item.attendancePercentage >= 75 ? 'ISSUED / READY' : 'ON HOLD'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => setSelectedStudentForProfile(item.student)}
        >
          View Clearance
        </button>
      )
    }
  ];

  // 8. Requests Columns
  const requestsColumns: ExcelColumn<any>[] = [
    {
      key: 'requestNo',
      header: 'Request ID',
      width: '140px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.requestNo || item.id}</code>
    },
    {
      key: 'studentName',
      header: 'Requester',
      width: '185px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.studentName || 'Student'}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{item.enrollmentNo || item.studentId}</div>
        </div>
      )
    },
    {
      key: 'requesterRole',
      header: 'Role',
      width: '95px',
      align: 'center',
      render: item => <Badge variant="navy">{item.requesterRole || 'STUDENT'}</Badge>
    },
    {
      key: 'department',
      header: 'Department',
      width: '160px',
      render: item => <span>{item.departmentName || 'Computer Engineering'}</span>
    },
    {
      key: 'category',
      header: 'Request Type',
      width: '160px',
      render: item => <Badge variant="orange">{item.category || item.requestType || 'Academic'}</Badge>
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.priority === 'HIGH' || item.priority === 'URGENT' ? 'danger' : item.priority === 'MEDIUM' ? 'warning' : 'navy'}>
          {item.priority || 'NORMAL'}
        </Badge>
      )
    },
    {
      key: 'createdAt',
      header: 'Submitted Date',
      width: '120px',
      render: item => <span>{new Date(item.createdAt || Date.now()).toLocaleDateString()}</span>
    },
    {
      key: 'currentApprover',
      header: 'Current Approver',
      width: '150px',
      render: item => <span>{item.currentApprover || 'Principal Office'}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      align: 'center',
      render: item => (
        <Badge variant={item.status === 'RESOLVED' || item.status === 'APPROVED' ? 'active' : item.status === 'REJECTED' ? 'danger' : 'warning'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => showToast(`Request ${item.requestNo || item.id} details viewed.`)}
        >
          View Action
        </button>
      )
    }
  ];

  // 9. Feedback Columns
  const feedbackColumns: ExcelColumn<any>[] = [
    {
      key: 'feedbackNo',
      header: 'Feedback ID',
      width: '145px',
      render: item => <code style={{ fontWeight: 800, color: 'var(--brand-orange, #F37023)' }}>{item.feedbackNo}</code>
    },
    {
      key: 'submittedBy',
      header: 'Submitted By',
      width: '180px',
      render: item => <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.submittedBy}</strong>
    },
    {
      key: 'role',
      header: 'Role',
      width: '95px',
      align: 'center',
      render: item => <Badge variant="navy">{item.role}</Badge>
    },
    {
      key: 'departmentName',
      header: 'Department',
      width: '175px',
      render: item => <span>{item.departmentName}</span>
    },
    {
      key: 'category',
      header: 'Category',
      width: '130px',
      render: item => <Badge variant="orange">{item.category}</Badge>
    },
    {
      key: 'overallRating',
      header: 'Rating (out of 5)',
      width: '130px',
      align: 'center',
      render: item => (
        <span style={{ fontWeight: 800, color: item.overallRating >= 4.0 ? '#10B981' : item.overallRating >= 3.0 ? '#F59E0B' : '#EF4444' }}>
          ★ {item.overallRating} / 5.0
        </span>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '95px',
      align: 'center',
      render: item => (
        <Badge variant={item.priority === 'HIGH' ? 'danger' : item.priority === 'MEDIUM' ? 'warning' : 'active'}>
          {item.priority}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      align: 'center',
      render: item => (
        <Badge variant={item.status === 'REVIEWED' || item.status === 'RESOLVED' ? 'active' : 'warning'}>
          {item.status}
        </Badge>
      )
    },
    {
      key: 'assignedTo',
      header: 'Assigned To',
      width: '160px',
      render: item => <span>{item.assignedTo}</span>
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      width: '115px',
      render: item => <span>{new Date(item.createdAt).toLocaleDateString()}</span>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      align: 'right',
      sortable: false,
      render: item => (
        <button
          type="button"
          className="btn btn-secondary btn-xs"
          onClick={() => setSelectedFeedbackForView(item)}
        >
          Inspect
        </button>
      )
    }
  ];

  // 10. Reports Catalog Columns
  const reportsColumns: ExcelColumn<any>[] = [
    {
      key: 'reportName',
      header: 'Report Name',
      width: '280px',
      render: item => (
        <div>
          <strong style={{ color: 'var(--brand-navy, #0B192C)' }}>{item.reportName}</strong>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>Accreditation &amp; Governance Statutory Format</div>
        </div>
      )
    },
    {
      key: 'reportType',
      header: 'Report Type',
      width: '180px',
      render: item => <Badge variant="navy">{item.reportType}</Badge>
    },
    {
      key: 'departmentScope',
      header: 'Scope',
      width: '190px',
      render: item => <span>{item.departmentScope}</span>
    },
    {
      key: 'academicYear',
      header: 'Academic Year',
      width: '120px',
      align: 'center',
      render: item => <strong>{item.academicYear}</strong>
    },
    {
      key: 'generatedBy',
      header: 'Generated By',
      width: '160px',
      render: item => <span>{item.generatedBy}</span>
    },
    {
      key: 'generatedDate',
      header: 'Date',
      width: '110px',
      render: item => <span>{item.generatedDate}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '105px',
      align: 'center',
      render: () => <Badge variant="active">READY</Badge>
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '150px',
      align: 'right',
      sortable: false,
      render: item => (
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => showToast(`Generating and downloading ${item.reportName} (.xlsx)...`)}
            title="Download Excel Spreadsheet"
          >
            .xlsx
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => showToast(`Generating and downloading ${item.reportName} (CSV)...`)}
            title="Download CSV"
          >
            .csv
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {toast && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#ECFDF5', border: '1px solid #10B981', color: '#10B981', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)', margin: 0 }}>
            {institute?.name || 'Swarrnim School of Computing & IT'}
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '0.2rem' }}>
            Institutional governance across {instDepartments.length} Departments, {instStudents.length} Students, {instFaculty.length} Faculty Members.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={handleRefreshData} className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={14} /> Refresh ERP Data
          </button>
          <button onClick={() => setIsHODModalOpen(true)} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <UserPlus size={15} /> Appoint / Reassign HOD
          </button>
        </div>
      </div>

      <div className="grid-4">
        <StatCard title="Departments" value={instDepartments.length} subtitle={`${instPrograms.length} Degree Programs`} icon={Building2} colorScheme="navy" onClick={() => setActiveTab('DEPARTMENTS')} />
        <StatCard title="Enrolled Students" value={instStudents.length} subtitle="Active Headcount" icon={Users} colorScheme="orange" onClick={() => setActiveTab('STUDENTS')} />
        <StatCard title="Faculty Strength" value={instFaculty.length} subtitle="Professors & Lecturers" icon={UserCheck} colorScheme="green" onClick={() => setActiveTab('FACULTY')} />
        <StatCard
          title="Pending Approvals"
          value={pendingHOIAttendanceApps.length}
          subtitle="Awaiting Final Decision"
          icon={CheckSquare}
          colorScheme={pendingHOIAttendanceApps.length > 0 ? 'gold' : 'green'}
          onClick={() => {
            setActiveTab('ATTENDANCE_APPROVALS');
            setApprovalsFilterMode('PENDING_MY_ACTION');
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '2px solid var(--border-color, #E2E8F0)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {(['OVERVIEW', 'DEPARTMENTS', 'STUDENTS', 'AT_RISK', 'FACULTY', 'ATTENDANCE', 'ATTENDANCE_APPROVALS', 'EXAMINATION', 'REQUESTS', 'FEEDBACK', 'REPORTS'] as HOITabType[]).map(tab => (
          <button key={tab} className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(tab)}>
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <ExcelDataTable
          data={deptComparisonData}
          columns={departmentColumns}
          title="Institute Department Performance & Academic Health Matrix"
          subtitle="Real-time breakdown of students, faculty strength, attendance averages, and approval workloads across departments."
          storageKey="hoi_overview"
          searchPlaceholder="Search department, code, or HOD..."
          searchFields={['name', 'code', 'hodName']}
          exportFilename={`HOI_Overview_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'DEPARTMENTS' && (
        <ExcelDataTable
          data={deptComparisonData}
          columns={departmentColumns}
          title={`Institute Departments & HOD Register (${instDepartments.length})`}
          subtitle="Statutory department register, appointed HOD leadership, and active program metrics."
          storageKey="hoi_depts"
          searchPlaceholder="Search department, code, or HOD..."
          searchFields={['name', 'code', 'hodName']}
          exportFilename={`HOI_Departments_${institute?.code || 'INST'}`}
          toolbarExtra={
            <button className="btn btn-primary btn-sm" onClick={() => setIsHODModalOpen(true)}>
              <UserPlus size={14} /> Appoint HOD
            </button>
          }
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'STUDENTS' && (
        <ExcelDataTable
          data={instAttendanceData}
          columns={studentRosterColumns}
          title={`Institute Student Master Roster (${instAttendanceData.length})`}
          subtitle="Complete student directory across all degree programs, academic standings, and verification vaults."
          storageKey="hoi_students"
          searchPlaceholder="Search student name, enrollment ID, or department..."
          searchFields={['studentName', 'enrollmentNo', 'departmentName', 'programCode']}
          exportFilename={`HOI_Students_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'AT_RISK' && (
        <ExcelDataTable
          data={atRiskStudents}
          columns={atRiskColumns}
          title={`Institute At-Risk Students Register (${atRiskStudents.length})`}
          subtitle="Students requiring intervention based on attendance shortage (<75%), pending document verification, or academic risks."
          storageKey="hoi_risk"
          searchPlaceholder="Search at-risk students..."
          searchFields={['studentName', 'enrollmentNo', 'departmentName', 'riskReason']}
          exportFilename={`HOI_At_Risk_${institute?.code || 'INST'}`}
          emptyMessage="No Institute At-Risk Students"
          emptyDescription="All students meet minimum attendance guidelines (≥75%) and have verified document vaults."
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'FACULTY' && (
        <ExcelDataTable
          data={instFaculty}
          columns={facultyWorkloadColumns}
          title={`Institute Faculty & Academic Workload Register (${instFaculty.length})`}
          subtitle="Professor credentials, designated departmental affiliations, assigned course workloads, and active mentorship rosters."
          storageKey="hoi_faculty"
          searchPlaceholder="Search faculty by name, employee code, or department..."
          searchFields={['name', 'employeeCode', 'departmentName', 'designation']}
          exportFilename={`HOI_Faculty_Workload_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'ATTENDANCE' && (
        <ExcelDataTable
          data={instAttendanceData}
          columns={attendanceShortageColumns}
          title={`Institute Attendance & Shortage Audit (${instAttendanceData.length})`}
          subtitle="Detailed classroom attendance metrics, present/absent logs, shortage calculations, and exam eligibility status."
          storageKey="hoi_att"
          searchPlaceholder="Search student attendance by name or enrollment ID..."
          searchFields={['studentName', 'enrollmentNo', 'departmentName']}
          exportFilename={`HOI_Attendance_Audit_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'ATTENDANCE_APPROVALS' && (
        <ExcelDataTable
          data={filteredApprovalsData}
          columns={finalApprovalsColumns}
          title={`Institute Attendance Condonation Approvals (${filteredApprovalsData.length} Shown / ${pendingHOIAttendanceApps.length} Actionable for Final HOI Decision)`}
          subtitle="Mandatory sequence: Student → Faculty → Mentor → HOD → Principal / HOI (Final Decision & Exam Hall Ticket Release)."
          storageKey="hoi_apps"
          searchPlaceholder="Search approvals by application no, student, or department..."
          searchFields={['applicationNo', 'studentName', 'enrollmentNo', 'departmentName']}
          exportFilename={`HOI_Approvals_${institute?.code || 'INST'}`}
          emptyMessage={
            approvalsFilterMode === 'PENDING_MY_ACTION'
              ? 'No Applications Currently Awaiting Final HOI Approval'
              : 'No Attendance Condonation Records Found'
          }
          emptyDescription={
            approvalsFilterMode === 'PENDING_MY_ACTION'
              ? 'All attendance condonation requests have been processed or are currently in progress at Department / Faculty tiers.'
              : 'There are no attendance condonation applications matching the selected filter criteria.'
          }
          toolbarExtra={
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                className={`btn btn-xs ${approvalsFilterMode === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setApprovalsFilterMode('ALL')}
              >
                All Institute Applications ({allInstituteAttendanceApps.length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${approvalsFilterMode === 'PENDING_MY_ACTION' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setApprovalsFilterMode('PENDING_MY_ACTION')}
                style={{
                  borderColor: pendingHOIAttendanceApps.length > 0 ? '#F59E0B' : undefined,
                  fontWeight: pendingHOIAttendanceApps.length > 0 ? 800 : undefined
                }}
              >
                ⚡ Actionable for Me ({pendingHOIAttendanceApps.length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${approvalsFilterMode === 'IN_PROGRESS' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setApprovalsFilterMode('IN_PROGRESS')}
              >
                In Progress ({allInstituteAttendanceApps.filter(a => ['SUBMITTED_TO_FACULTY', 'FACULTY_APPROVED', 'WITH_MENTOR', 'MENTOR_APPROVED', 'WITH_HOD'].includes(a.status)).length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${approvalsFilterMode === 'APPROVED' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setApprovalsFilterMode('APPROVED')}
              >
                Cleared ({allInstituteAttendanceApps.filter(a => a.status === 'FINAL_APPROVED' || a.status === 'HOI_APPROVED').length})
              </button>
              <button
                type="button"
                className={`btn btn-xs ${approvalsFilterMode === 'REJECTED' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setApprovalsFilterMode('REJECTED')}
              >
                Rejected ({allInstituteAttendanceApps.filter(a => ['FACULTY_REJECTED', 'MENTOR_REJECTED', 'HOD_REJECTED', 'HOI_REJECTED'].includes(a.status)).length})
              </button>
            </div>
          }
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'EXAMINATION' && (
        <ExcelDataTable
          data={instAttendanceData}
          columns={examEligibilityColumns}
          title={`Institute Semester Exam Eligibility Register (${instAttendanceData.length})`}
          subtitle="Official examination candidate clearance, endorsement tracking across faculty, mentor, HOD, and final hall ticket issuance."
          storageKey="hoi_exam"
          searchPlaceholder="Search candidates by student name or enrollment ID..."
          searchFields={['studentName', 'enrollmentNo', 'departmentName']}
          exportFilename={`HOI_Exam_Eligibility_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'REQUESTS' && (
        <ExcelDataTable
          data={instRequests}
          columns={requestsColumns}
          title={`Institute Grievance & Escalated Requests Desk (${instRequests.length})`}
          subtitle="Service requests escalated from department HODs or requiring executive resolution by the Principal / Dean."
          storageKey="hoi_reqs"
          searchPlaceholder="Search requests by ID, requester name, or category..."
          searchFields={['requestNo', 'id', 'studentName', 'enrollmentNo', 'category']}
          exportFilename={`HOI_Requests_${institute?.code || 'INST'}`}
          emptyMessage="No Requests Currently Require Principal / HOI Attention"
          emptyDescription="All student and department requests have been resolved or are being serviced at the department level."
          onRefresh={handleRefreshData}
        />
      )}

      {activeTab === 'FEEDBACK' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="grid-4" style={{ gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>OVERALL TEACHING</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#10B981' }}>4.65 / 5.0</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>ACADEMIC RIGOR</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--brand-navy, #0B192C)' }}>4.70 / 5.0</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>INFRASTRUCTURE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F59E0B' }}>4.80 / 5.0</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--border-color, #E2E8F0)' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700 }}>STUDENT SATISFACTION</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0EA5E9' }}>94.2%</div>
            </div>
          </div>

          <ExcelDataTable
            data={instFeedbacks}
            columns={feedbackColumns}
            title={`Institute Student & Faculty Feedback Register (${instFeedbacks.length})`}
            subtitle="Evaluations and suggestions across faculty instruction, course curriculum, and campus infrastructure."
            storageKey="hoi_feedback"
            searchPlaceholder="Search feedback by ID, category, or department..."
            searchFields={['feedbackNo', 'submittedBy', 'departmentName', 'category']}
            exportFilename={`HOI_Feedback_${institute?.code || 'INST'}`}
            onRefresh={handleRefreshData}
          />
        </div>
      )}

      {activeTab === 'REPORTS' && (
        <ExcelDataTable
          data={reportsCatalogData}
          columns={reportsColumns}
          title="Official Institute Reports & Accreditation Analytics (.xlsx)"
          subtitle="Generate and export statutory compliance registers for NAAC, NBA, AICTE, and University Council Reviews."
          storageKey="hoi_reports"
          searchPlaceholder="Search report catalog..."
          searchFields={['reportName', 'reportType', 'departmentScope']}
          exportFilename={`HOI_Reports_${institute?.code || 'INST'}`}
          onRefresh={handleRefreshData}
        />
      )}

      {/* HOD Assignment Modal */}
      {isHODModalOpen && (
        <Modal isOpen={isHODModalOpen} onClose={() => setIsHODModalOpen(false)} title="Appoint / Reassign Head of Department (HOD)">
          <form onSubmit={handleSaveHODAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className="form-select" value={hodAssignDeptId} onChange={e => setHodAssignDeptId(e.target.value)} required>
                <option value="">Select Department...</option>
                {instDepartments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Appoint Faculty as HOD *</label>
              <select className="form-select" value={hodAssignFacultyId} onChange={e => setHodAssignFacultyId(e.target.value)} required>
                <option value="">Select Faculty Member...</option>
                {instFaculty.map(f => (
                  <option key={f.id} value={f.id}>{f.name} ({f.designation} • {db.getDepartmentById(f.departmentId)?.code || 'CSE'})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Appointment Remarks / Terms</label>
              <textarea 
                className="form-control" 
                rows={2} 
                placeholder="Enter appointment terms, tenure, or executive order number..."
                value={hodAssignRemarks}
                onChange={e => setHodAssignRemarks(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsHODModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Confirm Appointment</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Final Attendance Review Modal */}
      {reviewApp && (
        <Modal isOpen={!!reviewApp} onClose={() => setReviewApp(null)} title={`Final HOI Decision: Attendance Application ${reviewApp.applicationNo}`}>
          <form onSubmit={handleHOIAttendanceDecision} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--bg-surface-hover, #F8FAFC)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <div><strong>Student:</strong> {reviewApp.studentName} ({reviewApp.enrollmentNo})</div>
              <div><strong>Department:</strong> {reviewApp.departmentName}</div>
              <div><strong>Subject:</strong> {reviewApp.subjectName} ({reviewApp.subjectCode})</div>
              <div><strong>Attendance:</strong> {reviewApp.currentAttendancePct}% (Required: {reviewApp.requiredAttendancePct}%)</div>
              <div><strong>Shortage:</strong> {reviewApp.shortagePct}%</div>
              <div style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color, #E2E8F0)', paddingTop: '0.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B' }}>ENDORSEMENTS:</div>
                <div style={{ fontSize: '0.8rem' }}>• Faculty: <em>"{reviewApp.facultyRemarks || 'Approved'}"</em></div>
                <div style={{ fontSize: '0.8rem' }}>• Mentor: <em>"{reviewApp.mentorRemarks || 'Endorsed'}"</em></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--brand-navy, #0B192C)', fontWeight: 700 }}>• HOD: <em>"{reviewApp.hodRemarks || 'Recommended'}"</em></div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Principal / HOI Final Decision *</label>
              <select className="form-select" value={reviewDecision} onChange={e => setReviewDecision(e.target.value as any)}>
                <option value="APPROVE">Grant Final Approval (Make Student Exam Eligible)</option>
                <option value="REJECT">Reject Application</option>
                <option value="REQUEST_MORE_INFO">Request Clarification from HOD</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Final Remarks / Justification *</label>
              <textarea 
                className="form-control" 
                rows={3} 
                placeholder="Enter final executive observations or conditions..."
                value={reviewRemarks}
                onChange={e => setReviewRemarks(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReviewApp(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Final Decision</button>
            </div>
          </form>
        </Modal>
      )}

      {/* View Feedback Modal */}
      {selectedFeedbackForView && (
        <Modal isOpen={!!selectedFeedbackForView} onClose={() => setSelectedFeedbackForView(null)} title={`Feedback Record: ${selectedFeedbackForView.feedbackNo}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '1rem', color: 'var(--brand-navy, #0B192C)' }}>{selectedFeedbackForView.submittedBy}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{selectedFeedbackForView.departmentName}</div>
              </div>
              <Badge variant="orange">{selectedFeedbackForView.category}</Badge>
            </div>

            <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>Overall Evaluation Rating</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10B981' }}>★ {selectedFeedbackForView.overallRating} / 5.0</div>
            </div>

            <div>
              <div style={{ fontSize: '0.78125rem', fontWeight: 700, color: '#334155' }}>Detailed Remarks &amp; Observations:</div>
              <p style={{ fontSize: '0.8125rem', color: '#475569', marginTop: '0.25rem', lineHeight: 1.45, background: '#FFFFFF', padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                {selectedFeedbackForView.comments}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedFeedbackForView(null)}>
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Student Profile Modal */}
      {selectedStudentForProfile && (
        <StudentProfileModal
          isOpen={true}
          student={selectedStudentForProfile}
          initialTab={selectedStudentInitialTab}
          onClose={() => setSelectedStudentForProfile(null)}
        />
      )}
    </div>
  );
};
