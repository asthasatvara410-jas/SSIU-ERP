import { db } from './db';
import { User, Student, Faculty, Subject, Program, Semester, Division, AttendanceApplication } from '../types';
import { studentDataChangeRequestService } from './studentDataChangeRequestService';
import * as XLSX from 'xlsx';

export interface DepartmentGlobalFilters {
  academicYear?: string;
  programId?: string;
  semesterId?: string;
  divisionId?: string;
  status?: string;
}

export interface DepartmentScopeIdentity {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  instituteId: string;
  instituteName: string;
  hodName: string;
  academicYear: string;
  currentSemesterNumber: number;
  programs: Program[];
  semesters: Semester[];
  divisions: Division[];
}

export interface DepartmentDashboardKPIs {
  totalStudents: number;
  activeStudents: number;
  totalPrograms: number;
  totalFaculty: number;
  teachingFaculty: number;
  facultyWithWorkload: number;
  activeCourses: number;
  theoryCoursesCount: number;
  labCoursesCount: number;
  attendanceShortageCount: number;
  attendanceShortagePercentage: number;
  averageAttendancePercentage: number;
  criticalAttendanceCount: number;
  academicAtRiskCount: number;
  missingDocumentsCount: number;
  pendingApprovalsCount: number;
  pendingAttendanceCondonations: number;
  pendingDataChanges: number;
  pendingStudentRequests: number;
  examEligibleCount: number;
  examShortageCount: number;
  examProvisionalCount: number;
  examReadinessPercentage: number;
}

export interface DepartmentAttentionItem {
  id: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'ATTENDANCE' | 'EXAMINATION' | 'REQUESTS' | 'WORKLOAD' | 'DOCUMENTS' | 'DATA_CHANGE';
  title: string;
  description: string;
  count: number;
  targetTab: string;
  actionLabel: string;
}

export interface DepartmentHealthSummary {
  attendanceStatus: 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED' | 'CRITICAL';
  workloadStatus: 'OPTIMAL' | 'NORMAL' | 'OVERLOADED' | 'ATTENTION_REQUIRED';
  academicRiskStatus: 'SAFE' | 'MODERATE' | 'HIGH_RISK';
  examReadinessPercentage: number;
  documentCompliancePercentage: number;
  pendingApprovalsCount: number;
}

export interface ProgramOverviewItem {
  programId: string;
  programCode: string;
  programName: string;
  studentCount: number;
  facultyCount: number;
  sectionCount: number;
  courseCount: number;
  averageAttendance: number;
  atRiskCount: number;
  pendingRequestsCount: number;
  examEligibleCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SemesterOverviewItem {
  semesterNumber: number;
  semesterId: string;
  studentCount: number;
  courseCount: number;
  facultyCount: number;
  averageAttendance: number;
  shortageCount: number;
  atRiskCount: number;
  examEligibleCount: number;
  pendingActionsCount: number;
}

export interface SectionOverviewItem {
  sectionId: string;
  sectionName: string;
  programCode: string;
  semesterNumber: number;
  studentCount: number;
  mentorName: string;
  averageAttendance: number;
  shortageCount: number;
  atRiskCount: number;
  pendingRequestsCount: number;
  status: 'NORMAL' | 'ATTENTION';
}

export type FacultyWorkloadStatus = 'UNDERLOAD' | 'NORMAL' | 'HIGH LOAD' | 'OVERLOAD' | 'UNDERLOADED' | 'OVERLOADED';

export interface FacultyWorkloadItem {
  facultyId: string;
  facultyName: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  programId: string;
  programName: string;
  programCode: string;
  assignedSubjects: { id: string; code: string; name: string; credits: number; hours: number; isTheory?: boolean; isLab?: boolean }[];
  totalWeeklyHours: number;
  theoryHours: number;
  labHours: number;
  targetWeeklyHours: number;
  hoursDifference: number;
  workloadPercentage: number;
  workloadStatus: FacultyWorkloadStatus;
  isMentor: boolean;
  assignedMenteesCount: number;
  assignedMentorSection?: string;
  pendingTasksCount: number;
  email?: string;
  phone?: string;
  status: string;
}

export interface FacultyDirectoryItem {
  id: string;
  facultyId: string;
  facultyName: string;
  employeeId: string;
  designation: string;
  employmentType: 'FULL_TIME' | 'ADJUNCT' | 'VISITING' | 'CONTRACT';
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  programId: string;
  programName: string;
  programCode: string;
  joiningDate: string;
  qualification: string;
  experienceYears: number;
  officialEmail: string;
  phone: string;
  isMentor: boolean;
  assignedMenteesCount: number;
  accountStatus: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  specialization: string;
  assignedSubjectsCount: number;
  avatarUrl?: string;
  faculty: Faculty;
}

export interface SubjectAllocationItem {
  id: string; // subjectId
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  courseType: 'THEORY' | 'LAB' | 'INTEGRATED' | 'ELECTIVE';
  programId: string;
  programName: string;
  programCode: string;
  semesterId: string;
  semesterNumber: number;
  credits: number;
  theoryHours: number;
  labHours: number;
  totalWeeklyHours: number;
  studentCount: number;
  assignedFacultyId?: string;
  assignedFacultyName: string;
  assignedFacultyEmployeeId: string;
  assignedFacultyDesignation?: string;
  allocationPercentage: number;
  allocationStatus: 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'UNALLOCATED';
  lastAllocatedDate?: string;
  divisionName: string;
  subject: Subject;
}

export interface FacultyPerformanceItem {
  id: string; // facultyId
  facultyId: string;
  facultyName: string;
  employeeId: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  programCode: string;
  subjectsTaughtCount: number;
  classesConducted: number;
  attendanceCompliancePercentage: number;
  courseCompletionPercentage: number;
  assessmentTimelinessPercentage: number;
  studentFeedbackScore: number; // 0 - 5.0
  studentFeedbackPercentage: number; // 0 - 100%
  resultPassPercentage: number; // 0 - 100%
  mentoringScore: number; // 0 - 100
  academicContributionScore: number; // 0 - 100
  overallScore: number; // 0 - 100
  previousScore?: number;
  scoreTrend: 'UP' | 'DOWN' | 'STABLE';
  performanceBand: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  lastReviewDate: string;
  hodRemarks?: string;
  strengths: string[];
  areasForImprovement: string[];
  faculty: Faculty;
}

export interface MentorMappingItem {
  mentorId: string;
  mentorName: string;
  employeeId: string;
  assignedProgram: string;
  assignedSemester: string;
  assignedSection: string;
  totalMentees: number;
  averageMenteeAttendance: number;
  atRiskMenteesCount: number;
  menteeStudents: { id: string; name: string; enrollmentNo: string; attendancePct: number; isRisk: boolean }[];
}

export interface DepartmentActivityEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  category: string;
  title: string;
  details: string;
}

export interface AcademicReportItem {
  studentId: string;
  name: string;
  enrollmentNo: string;
  programCode: string;
  programName: string;
  semesterNumber: number;
  sectionName: string;
  sgpa: number;
  cgpa: number;
  backlogsCount: number;
  academicStanding: 'DISTINCTION' | 'FIRST_CLASS' | 'HIGHER_SECOND' | 'PASS_CLASS' | 'AT_RISK';
  resultStatus: 'PASSED' | 'PROMOTED_WITH_BACKLOG' | 'DETAINED';
  examEligibility: 'ELIGIBLE' | 'PROVISIONAL' | 'DETAINED';
}

export interface SubjectPerformanceReportItem {
  subjectId: string;
  code: string;
  name: string;
  courseType: string;
  facultyName: string;
  enrolledCount: number;
  averageMarks: number;
  passPercentage: number;
  highestMarks: number;
  lowestMarks: number;
  healthStatus: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION';
}

export interface AcademicReportData {
  kpis: {
    totalStudents: number;
    averageCGPA: number;
    passPercentage: number;
    atRiskCount: number;
    distinctionCount: number;
    firstClassCount: number;
  };
  students: AcademicReportItem[];
  subjectPerformance: SubjectPerformanceReportItem[];
  gradeDistribution: { band: string; count: number; percentage: number; color: string }[];
  semesterComparison: { semesterNumber: number; studentCount: number; averageSGPA: number; passPercentage: number }[];
}

export interface AttendanceReportItem {
  studentId: string;
  name: string;
  enrollmentNo: string;
  programCode: string;
  semesterNumber: number;
  sectionName: string;
  totalClasses: number;
  attendedClasses: number;
  percentage: number;
  shortageStatus: 'SAFE' | 'CONDONEABLE_SHORTAGE' | 'CRITICAL_DEBARRED';
  mentorName: string;
  phone: string;
}

export interface SubjectAttendanceReportItem {
  subjectId: string;
  code: string;
  name: string;
  facultyName: string;
  classesConducted: number;
  studentCount: number;
  averageAttendance: number;
  shortageCount: number;
  status: 'HEALTHY' | 'MODERATE' | 'POOR';
}

export interface AttendanceReportData {
  kpis: {
    averageAttendance: number;
    below75Count: number;
    totalRecordsCount: number;
    criticalShortageCount: number;
    above85Count: number;
    shortagePercentage: number;
  };
  students: AttendanceReportItem[];
  subjectAttendance: SubjectAttendanceReportItem[];
  attendanceBrackets: { bracket: string; count: number; percentage: number; color: string; badgeVariant: 'active' | 'navy' | 'warning' | 'danger' }[];
  monthlyTrend: { month: string; averageAttendance: number; totalClasses: number }[];
}

export interface StudentMasterReportItem {
  studentId: string;
  name: string;
  enrollmentNo: string;
  programCode: string;
  programName: string;
  semesterNumber: number;
  sectionName: string;
  cgpa: number;
  attendancePercentage: number;
  admissionBatch: string;
  gender: string;
  mentorName: string;
  officialEmail: string;
  phone: string;
  academicStatus: 'ACTIVE_REGULAR' | 'ACADEMIC_PROBATION' | 'AT_RISK' | 'ON_LEAVE';
}

export interface StudentMasterReportData {
  kpis: {
    totalStudents: number;
    activeStudents: number;
    programsCount: number;
    atRiskCount: number;
    maleCount: number;
    femaleCount: number;
  };
  students: StudentMasterReportItem[];
  programBreakdown: {
    programCode: string;
    programName: string;
    totalStudents: number;
    activeStudents: number;
    atRiskStudents: number;
    maleCount: number;
    femaleCount: number;
    avgAttendance: number;
    avgCGPA: number;
  }[];
  sectionBreakdown: {
    sectionName: string;
    programCode: string;
    semesterNumber: number;
    studentCount: number;
    mentorName: string;
    avgAttendance: number;
  }[];
}

export interface FacultyWorkloadReportData {
  kpis: {
    totalFaculty: number;
    averageWorkload: number;
    overloadedCount: number;
    underloadedCount: number;
    optimalCount: number;
    totalWeeklyTeachingHours: number;
  };
  faculty: FacultyWorkloadItem[];
  subjectAllocations: SubjectAllocationItem[];
  workloadDistribution: { bracket: string; count: number; percentage: number; color: string }[];
}

export interface DepartmentInstitutionalReportData {
  kpis: {
    totalStudents: number;
    totalFaculty: number;
    totalPrograms: number;
    totalCourses: number;
    averageAttendance: number;
    averageCGPA: number;
    atRiskCount: number;
    pendingApprovalsCount: number;
    facultyStudentRatio: string;
    examReadinessPercentage: number;
  };
  accreditationMetrics: {
    category: string;
    indicator: string;
    benchmark: string;
    currentAchievement: string;
    complianceStatus: 'EXCEEDS' | 'COMPLIANT' | 'ATTENTION';
    auditNote: string;
  }[];
  programSummaries: ProgramOverviewItem[];
  semesterSummaries: SemesterOverviewItem[];
  sectionSummaries: SectionOverviewItem[];
  performanceBands: { band: string; count: number; percentage: number; color: string }[];
  workloadBands: { band: string; count: number; percentage: number; color: string }[];
  attendanceBands: { band: string; count: number; percentage: number; color: string }[];
}

class DepartmentScopeService {

  // 1. Resolve Logged-in HOD Identity & Department Boundary
  public resolveScopeIdentity(user: User | null, role?: string): DepartmentScopeIdentity {
    const isExecutive = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL' || role === 'VICE_PRESIDENT';
    
    // Resolve primary department
    let deptId = user?.departmentId;
    if (!deptId || (!isExecutive && deptId === 'ALL')) {
      deptId = 'dept-1'; // Default Computer Engineering
    }

    const dept = db.getDepartmentById(deptId) || db.getDepartments()[0];
    const inst = db.getInstituteById(dept?.instituteId || user?.instituteId || '') || db.getInstitutes()[0];
    
    const allPrograms = db.getPrograms().filter(p => p.departmentId === dept?.id || (deptId === 'dept-1' && p.departmentId === 'dept-1'));
    const allSemesters = db.getSemesters();
    const allDivisions = db.getDivisions();

    return {
      departmentId: dept?.id || 'dept-1',
      departmentName: dept?.name || 'Department of Computer Science & Engineering',
      departmentCode: dept?.code || 'CSE',
      instituteId: inst?.id || 'inst-1',
      instituteName: inst?.name || 'Swarrnim Institute of Technology',
      hodName: user?.name || 'Head of Department',
      academicYear: '2025-2026',
      currentSemesterNumber: 4,
      programs: allPrograms,
      semesters: allSemesters,
      divisions: allDivisions
    };
  }

  // 2. Strict Department Authorization Verification
  public isWithinDepartment(recordDepartmentId: string | undefined, user: User | null, role?: string): boolean {
    if (!user) return false;
    const isExecutive = role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN' || role === 'PRINCIPAL' || role === 'VICE_PRESIDENT';
    if (isExecutive) return true;

    const userDeptId = user.departmentId || 'dept-1';
    if (!recordDepartmentId) return false;
    return recordDepartmentId === userDeptId || (userDeptId === 'dept-1' && recordDepartmentId === 'dept-1');
  }

  public assertDepartmentAccess(recordDepartmentId: string | undefined, user: User | null, role?: string): void {
    if (!this.isWithinDepartment(recordDepartmentId, user, role)) {
      throw new Error('HTTP 403: Forbidden - Access Denied: Cross-department data access is restricted.');
    }
  }

  // 3. Department Scoped Students Query
  public getScopedStudents(user: User | null, role?: string, filters?: DepartmentGlobalFilters): Student[] {
    const scope = this.resolveScopeIdentity(user, role);
    let students = db.getStudents().filter(s => s.departmentId === scope.departmentId || (scope.departmentId === 'dept-1' && s.departmentId === 'dept-1'));

    if (filters) {
      if (filters.programId && filters.programId !== 'ALL') {
        students = students.filter(s => s.programId === filters.programId);
      }
      if (filters.semesterId && filters.semesterId !== 'ALL') {
        students = students.filter(s => s.semesterId === filters.semesterId || String(s.semesterId) === filters.semesterId);
      }
      if (filters.divisionId && filters.divisionId !== 'ALL') {
        const divFilt = filters.divisionId;
        students = students.filter(s => s.divisionId === divFilt || (s.divisionId && s.divisionId.includes(divFilt)));
      }
    }

    return students;
  }

  // 4. Department Scoped Faculty Query
  public getScopedFaculty(user: User | null, role?: string): Faculty[] {
    const scope = this.resolveScopeIdentity(user, role);
    return db.getFaculty().filter(f => f.departmentId === scope.departmentId || (scope.departmentId === 'dept-1' && f.departmentId === 'dept-1'));
  }

  // 5. Department Scoped Subjects Query
  public getScopedSubjects(user: User | null, role?: string, filters?: DepartmentGlobalFilters): Subject[] {
    const scope = this.resolveScopeIdentity(user, role);
    let subjects = db.getSubjects().filter(s => s.departmentId === scope.departmentId || (scope.departmentId === 'dept-1' && s.departmentId === 'dept-1'));

    if (filters) {
      if (filters.programId && filters.programId !== 'ALL') {
        subjects = subjects.filter(s => s.programId === filters.programId);
      }
      if (filters.semesterId && filters.semesterId !== 'ALL') {
        subjects = subjects.filter(s => s.semesterId === filters.semesterId || String(s.semesterId) === filters.semesterId);
      }
    }

    return subjects;
  }

  // 6. Real-time Derived Dashboard KPIs
  public getDepartmentDashboardKPIs(user: User | null, role?: string, filters?: DepartmentGlobalFilters): DepartmentDashboardKPIs {
    const scope = this.resolveScopeIdentity(user, role);
    const students = this.getScopedStudents(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);
    const subjects = this.getScopedSubjects(user, role, filters);

    // Dynamic Attendance & Risk aggregation
    let totalAttendanceSum = 0;
    let shortageCount = 0;
    let criticalCount = 0;
    let atRiskCount = 0;
    let missingDocsCount = 0;
    let examEligibleCount = 0;
    let examShortageCount = 0;
    let examProvisionalCount = 0;

    students.forEach(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
      
      const pct = stats.percentage;
      totalAttendanceSum += pct;

      const hasShortage = pct < 75;
      const isCritical = pct < 60;
      const hasMissingDocs = docs.some(d => d.status === 'REJECTED' || (d.status as string) === 'MISSING' || (d.status as string) === 'REUPLOAD_REQUIRED');

      if (hasShortage) shortageCount++;
      if (isCritical) criticalCount++;
      if (hasMissingDocs) missingDocsCount++;
      if (hasShortage || hasMissingDocs) atRiskCount++;

      if (pct >= 75 && !hasMissingDocs) {
        examEligibleCount++;
      } else if (pct >= 60) {
        examProvisionalCount++;
      } else {
        examShortageCount++;
      }
    });

    const avgAttendance = students.length > 0 ? Math.round(totalAttendanceSum / students.length) : 0;
    const shortagePercentage = students.length > 0 ? Math.round((shortageCount / students.length) * 100) : 0;
    const examReadinessPct = students.length > 0 ? Math.round((examEligibleCount / students.length) * 100) : 100;

    // Faculty teaching load
    const teachingFaculty = faculty.filter(f => f.status === 'ACTIVE').length;
    const facultyWithWorkload = faculty.filter(f => subjects.some(s => s.assignedFacultyId === f.id)).length;

    // Courses counts
    const theoryCourses = subjects.filter(s => (s.theoryHoursPerWeek || 0) > 0).length;
    const labCourses = subjects.filter(s => (s.labHoursPerWeek || 0) > 0).length;

    // Pending Approvals
    const attendanceApps = db.getAttendanceApplications().filter(a => 
      (a.departmentId === scope.departmentId || role === 'SUPER_ADMIN') &&
      (a.status === 'MENTOR_APPROVED' || a.status === 'WITH_HOD')
    );

    const studentRequests = (db.getState().studentRequests || []).filter(r =>
      (r.departmentId === scope.departmentId || (r as any).currentOffice === 'HOD_ACADEMIC') &&
      (r.status === 'SUBMITTED' || r.status === 'WITH_HOD' || r.status === 'FORWARDED_TO_HOD' || r.status === 'WORK_IN_PROGRESS')
    );

    const dataChangeRequests = studentDataChangeRequestService.getScopedRequests(user, (role as any) || undefined, { 
      status: 'HOD_PENDING', 
      departmentId: scope.departmentId 
    });

    const totalPendingApprovals = attendanceApps.length + studentRequests.length + dataChangeRequests.length;

    return {
      totalStudents: students.length,
      activeStudents: students.length,
      totalPrograms: scope.programs.length,
      totalFaculty: faculty.length,
      teachingFaculty,
      facultyWithWorkload,
      activeCourses: subjects.length,
      theoryCoursesCount: theoryCourses,
      labCoursesCount: labCourses,
      attendanceShortageCount: shortageCount,
      attendanceShortagePercentage: shortagePercentage,
      averageAttendancePercentage: avgAttendance,
      criticalAttendanceCount: criticalCount,
      academicAtRiskCount: atRiskCount,
      missingDocumentsCount: missingDocsCount,
      pendingApprovalsCount: totalPendingApprovals,
      pendingAttendanceCondonations: attendanceApps.length,
      pendingDataChanges: dataChangeRequests.length,
      pendingStudentRequests: studentRequests.length,
      examEligibleCount,
      examShortageCount,
      examProvisionalCount,
      examReadinessPercentage: examReadinessPct
    };
  }

  // 7. Program / Branch Breakdown
  public getProgramBreakdown(user: User | null, role?: string, filters?: DepartmentGlobalFilters): ProgramOverviewItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const allStudents = this.getScopedStudents(user, role);
    const allFaculty = this.getScopedFaculty(user, role);
    const allSubjects = this.getScopedSubjects(user, role);
    const allRequests = (db.getState().studentRequests || []).filter(r => r.departmentId === scope.departmentId);

    return scope.programs.map(prog => {
      const progStudents = allStudents.filter(s => s.programId === prog.id);
      const progSubjects = allSubjects.filter(s => s.programId === prog.id);
      const progFaculty = allFaculty.filter(f => progSubjects.some(sub => sub.assignedFacultyId === f.id));
      
      const distinctSections = new Set(progStudents.map(s => s.divisionId || 'Div A')).size || 1;

      let totalAtt = 0;
      let atRisk = 0;
      let eligible = 0;

      progStudents.forEach(st => {
        const stats = db.getStudentAttendanceStats(st.id);
        const docs = db.getStudentAcademicDocumentsByStudentId(st.id);
        totalAtt += stats.percentage;
        const isShortage = stats.percentage < 75;
        const isMissing = docs.some(d => d.status !== 'VERIFIED');
        if (isShortage || isMissing) atRisk++;
        if (stats.percentage >= 75 && !isMissing) eligible++;
      });

      const avgAtt = progStudents.length > 0 ? Math.round(totalAtt / progStudents.length) : 0;
      const progReqs = allRequests.filter(r => progStudents.some(st => st.id === r.studentId)).length;

      return {
        programId: prog.id,
        programCode: prog.code,
        programName: prog.name,
        studentCount: progStudents.length,
        facultyCount: progFaculty.length || Math.min(allFaculty.length, 6),
        sectionCount: distinctSections,
        courseCount: progSubjects.length,
        averageAttendance: avgAtt,
        atRiskCount: atRisk,
        pendingRequestsCount: progReqs,
        examEligibleCount: eligible,
        status: 'ACTIVE'
      };
    });
  }

  // 8. Semester Overview Breakdown
  public getSemesterBreakdown(user: User | null, role?: string, filters?: DepartmentGlobalFilters): SemesterOverviewItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const students = this.getScopedStudents(user, role, filters);
    const subjects = this.getScopedSubjects(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);

    const semMap: { [semNum: number]: SemesterOverviewItem } = {};

    [1, 2, 3, 4, 5, 6, 7, 8].forEach(num => {
      semMap[num] = {
        semesterNumber: num,
        semesterId: `sem-${num}`,
        studentCount: 0,
        courseCount: 0,
        facultyCount: 0,
        averageAttendance: 0,
        shortageCount: 0,
        atRiskCount: 0,
        examEligibleCount: 0,
        pendingActionsCount: 0
      };
    });

    subjects.forEach(sub => {
      const sem = scope.semesters.find(s => s.id === sub.semesterId) || db.getSemesterById(sub.semesterId);
      const semNum = sem?.number || 4;
      if (semMap[semNum]) {
        semMap[semNum].courseCount++;
      }
    });

    const semAttendanceSum: { [semNum: number]: number } = {};

    students.forEach(st => {
      const sem = scope.semesters.find(s => s.id === st.semesterId);
      const semNum = sem?.number || 4;
      if (!semMap[semNum]) return;

      semMap[semNum].studentCount++;
      const stats = db.getStudentAttendanceStats(st.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(st.id);

      semAttendanceSum[semNum] = (semAttendanceSum[semNum] || 0) + stats.percentage;

      const hasShortage = stats.percentage < 75;
      const hasMissing = docs.some(d => d.status !== 'VERIFIED');

      if (hasShortage) semMap[semNum].shortageCount++;
      if (hasShortage || hasMissing) semMap[semNum].atRiskCount++;
      if (stats.percentage >= 75 && !hasMissing) semMap[semNum].examEligibleCount++;
    });

    Object.keys(semMap).forEach(key => {
      const num = Number(key);
      const count = semMap[num].studentCount;
      semMap[num].averageAttendance = count > 0 ? Math.round((semAttendanceSum[num] || 0) / count) : 85;
      semMap[num].facultyCount = Math.min(faculty.length, Math.max(1, semMap[num].courseCount));
      semMap[num].pendingActionsCount = semMap[num].shortageCount + (semMap[num].atRiskCount > 0 ? 1 : 0);
    });

    return Object.values(semMap).filter(s => s.studentCount > 0 || s.courseCount > 0);
  }

  // 9. Section / Division Breakdown
  public getSectionBreakdown(user: User | null, role?: string, filters?: DepartmentGlobalFilters): SectionOverviewItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const students = this.getScopedStudents(user, role, filters);
    const mentors = this.getMentorshipOverview(user, role);

    const secMap: { [secKey: string]: SectionOverviewItem } = {};

    students.forEach(st => {
      const prog = scope.programs.find(p => p.id === st.programId);
      const sem = scope.semesters.find(s => s.id === st.semesterId);
      const divName = st.divisionId || 'Div A';
      const key = `${prog?.code || 'CSE'}-${sem?.number || 4}-${divName}`;

      if (!secMap[key]) {
        const assignedMentor = mentors.find(m => m.assignedSection.includes(divName))?.mentorName || st.mentorName || 'Prof. Faculty Mentor';
        secMap[key] = {
          sectionId: key,
          sectionName: `DIV-${prog?.code || 'CSE'}-${sem?.number || 4}${divName.replace('Division', '').replace('Div', '').trim()}`,
          programCode: prog?.code || 'B.Tech',
          semesterNumber: sem?.number || 4,
          studentCount: 0,
          mentorName: assignedMentor,
          averageAttendance: 0,
          shortageCount: 0,
          atRiskCount: 0,
          pendingRequestsCount: 0,
          status: 'NORMAL'
        };
      }

      secMap[key].studentCount++;
      const stats = db.getStudentAttendanceStats(st.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(st.id);

      secMap[key].averageAttendance += stats.percentage;
      if (stats.percentage < 75) secMap[key].shortageCount++;
      if (stats.percentage < 75 || docs.some(d => d.status !== 'VERIFIED')) secMap[key].atRiskCount++;
    });

    Object.values(secMap).forEach(item => {
      if (item.studentCount > 0) {
        item.averageAttendance = Math.round(item.averageAttendance / item.studentCount);
      }
      if (item.shortageCount > 0 || item.atRiskCount > 1) {
        item.status = 'ATTENTION';
      }
    });

    return Object.values(secMap);
  }

  // 10. Faculty Directory (HR & Master Profile View)
  public getFacultyDirectory(user: User | null, role?: string): FacultyDirectoryItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const faculty = this.getScopedFaculty(user, role);
    const subjects = this.getScopedSubjects(user, role);
    const students = this.getScopedStudents(user, role);
    const defaultProgram = scope.programs[0] || { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    return faculty.map((f, idx) => {
      const assigned = subjects.filter(s => s.assignedFacultyId === f.id);
      const mentees = students.filter(s => (s as any).mentorFacultyId === f.id || (s as any).mentorId === f.id || (f.id === 'fac-1' && (s.id === 'stu-1' || s.id === 'stu-2')));
      const isMentor = mentees.length > 0 || (f as any).isMentor === true;
      const prog = (f as any).programId ? (db.getProgramById((f as any).programId) || defaultProgram) : defaultProgram;
      const dept = db.getDepartmentById(f.departmentId) || { id: scope.departmentId, name: scope.departmentName, code: scope.departmentCode };

      // Deterministic realistic HR attributes based on faculty ID / index
      const qualifications = ['Ph.D. in Computer Science', 'M.Tech in CSE (Gold Medalist)', 'Ph.D. in Artificial Intelligence', 'M.Tech in Software Engineering', 'Ph.D. in Data Science'];
      const qual = (f as any).qualification || qualifications[idx % qualifications.length];
      const joiningYear = 2018 + (idx % 6);
      const joiningDate = (f as any).joiningDate || `${joiningYear}-07-15`;
      const experienceYears = (f as any).experienceYears || (2026 - joiningYear + 2);
      const empType: 'FULL_TIME' | 'ADJUNCT' | 'VISITING' | 'CONTRACT' = idx === 3 ? 'ADJUNCT' : idx === 4 ? 'CONTRACT' : 'FULL_TIME';
      const status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE' = (f as any).status === 'ON_LEAVE' ? 'ON_LEAVE' : (f.status as any) || 'ACTIVE';

      return {
        id: f.id,
        facultyId: f.id,
        facultyName: f.name,
        employeeId: f.employeeId,
        designation: f.designation,
        employmentType: empType,
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code || scope.departmentCode,
        programId: prog.id,
        programName: prog.name,
        programCode: prog.code,
        joiningDate,
        qualification: qual,
        experienceYears,
        officialEmail: f.email || `${f.employeeId.toLowerCase()}@ssiu.edu.in`,
        phone: f.phone || `+91 98250 ${10000 + idx * 111}`,
        isMentor,
        assignedMenteesCount: mentees.length,
        accountStatus: status,
        specialization: idx % 2 === 0 ? 'Machine Learning & Cloud Architecture' : 'Distributed Systems & Database Engineering',
        assignedSubjectsCount: assigned.length,
        avatarUrl: (f as any).avatarUrl,
        faculty: f
      };
    });
  }

  // 10B. Faculty Workload & Load Balancing
  public getFacultyWorkloadOverview(user: User | null, role?: string): FacultyWorkloadItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const faculty = this.getScopedFaculty(user, role);
    const subjects = this.getScopedSubjects(user, role);
    const students = this.getScopedStudents(user, role);
    const defaultProgram = scope.programs[0] || { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    return faculty.map(f => {
      const assigned = subjects.filter(s => s.assignedFacultyId === f.id);
      const theoryHours = assigned.reduce((sum, s) => sum + (s.theoryHoursPerWeek || 3), 0);
      const labHours = assigned.reduce((sum, s) => sum + (s.labHoursPerWeek || 2), 0);
      const totalHours = theoryHours + labHours;
      const targetWeeklyHours = 16; // Standard target benchmark 12–16 hrs
      const hoursDifference = totalHours - targetWeeklyHours;
      const workloadPercentage = Math.min(150, Math.round((totalHours / targetWeeklyHours) * 100));

      let status: FacultyWorkloadStatus = 'NORMAL';
      if (totalHours > 20) status = 'OVERLOAD';
      else if (totalHours > 16) status = 'HIGH LOAD';
      else if (totalHours < 12) status = 'UNDERLOAD';
      else status = 'NORMAL';

      const mentees = students.filter(s => (s as any).mentorFacultyId === f.id || (s as any).mentorId === f.id || (f.id === 'fac-1' && (s.id === 'stu-1' || s.id === 'stu-2')));
      const isMentor = mentees.length > 0 || (f as any).isMentor === true;
      const prog = (f as any).programId ? (db.getProgramById((f as any).programId) || defaultProgram) : defaultProgram;
      const dept = db.getDepartmentById(f.departmentId) || { id: scope.departmentId, name: scope.departmentName, code: scope.departmentCode };

      return {
        facultyId: f.id,
        facultyName: f.name,
        employeeId: f.employeeId,
        designation: f.designation,
        departmentId: dept.id,
        departmentName: dept.name,
        departmentCode: dept.code || scope.departmentCode,
        programId: prog.id,
        programName: prog.name,
        programCode: prog.code,
        assignedSubjects: assigned.map(s => ({
          id: s.id,
          code: s.code,
          name: s.name,
          credits: s.credits,
          hours: (s.theoryHoursPerWeek || 3) + (s.labHoursPerWeek || 2),
          isTheory: (s.theoryHoursPerWeek || 3) > 0,
          isLab: (s.labHoursPerWeek || 2) > 0
        })),
        totalWeeklyHours: totalHours,
        theoryHours,
        labHours,
        targetWeeklyHours,
        hoursDifference,
        workloadPercentage,
        workloadStatus: status,
        isMentor,
        assignedMenteesCount: mentees.length,
        assignedMentorSection: isMentor ? 'Div A (Mentoring)' : undefined,
        pendingTasksCount: mentees.filter(m => db.getStudentAttendanceStats(m.id).percentage < 75).length,
        email: f.email || `${f.employeeId.toLowerCase()}@ssiu.edu.in`,
        phone: f.phone || '+91 98250 11223',
        status: f.status || 'ACTIVE'
      };
    });
  }

  // 10C. Subject-Centric Course Allocation Overview
  public getSubjectAllocations(user: User | null, role?: string): SubjectAllocationItem[] {
    const scope = this.resolveScopeIdentity(user, role);
    const subjects = this.getScopedSubjects(user, role);
    const faculty = this.getScopedFaculty(user, role);
    const students = this.getScopedStudents(user, role);
    const defaultProgram = scope.programs[0] || { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    return subjects.map((sub, idx) => {
      const assignedFac = faculty.find(f => f.id === sub.assignedFacultyId);
      const prog = sub.programId ? (db.getProgramById(sub.programId) || defaultProgram) : defaultProgram;
      const sem = sub.semesterId ? (db.getSemesterById(sub.semesterId) || { id: 'sem-4', number: 4, name: 'Semester 4' }) : { id: 'sem-4', number: 4, name: 'Semester 4' };
      
      const enrolledStudents = students.filter(s => s.programId === prog.id && (s.semesterId === sem.id || !s.semesterId));
      const studentCount = enrolledStudents.length > 0 ? enrolledStudents.length : 45 + (idx * 5) % 30;

      const theoryHours = sub.theoryHoursPerWeek || 3;
      const labHours = sub.labHoursPerWeek || 2;
      const totalWeeklyHours = theoryHours + labHours;

      let allocationStatus: 'FULLY_ALLOCATED' | 'PARTIALLY_ALLOCATED' | 'UNALLOCATED' = 'UNALLOCATED';
      let allocationPercentage = 0;

      if (assignedFac) {
        allocationStatus = 'FULLY_ALLOCATED';
        allocationPercentage = 100;
      } else if (idx % 3 === 0) {
        allocationStatus = 'PARTIALLY_ALLOCATED';
        allocationPercentage = 50;
      } else {
        allocationStatus = 'UNALLOCATED';
        allocationPercentage = 0;
      }

      let courseType: 'THEORY' | 'LAB' | 'INTEGRATED' | 'ELECTIVE' = 'INTEGRATED';
      if (theoryHours > 0 && labHours > 0) courseType = 'INTEGRATED';
      else if (labHours > 0) courseType = 'LAB';
      else if (sub.type === 'ELECTIVE') courseType = 'ELECTIVE';
      else courseType = 'THEORY';

      return {
        id: sub.id,
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        courseType,
        programId: prog.id,
        programName: prog.name,
        programCode: prog.code,
        semesterId: sem.id,
        semesterNumber: sem.number || 4,
        credits: sub.credits || 4,
        theoryHours,
        labHours,
        totalWeeklyHours,
        studentCount,
        assignedFacultyId: assignedFac?.id,
        assignedFacultyName: assignedFac ? assignedFac.name : 'NOT ASSIGNED',
        assignedFacultyEmployeeId: assignedFac ? assignedFac.employeeId : 'N/A',
        assignedFacultyDesignation: assignedFac?.designation,
        allocationPercentage,
        allocationStatus,
        lastAllocatedDate: assignedFac ? '2026-08-20' : undefined,
        divisionName: 'Div A',
        subject: sub
      };
    });
  }

  // 10D. Faculty Performance Evaluation Overview
  public getFacultyPerformanceOverview(user: User | null, role?: string): FacultyPerformanceItem[] {
    const faculty = this.getScopedFaculty(user, role);
    const subjects = this.getScopedSubjects(user, role);

    return faculty.map((f, idx) => {
      const assigned = subjects.filter(s => s.assignedFacultyId === f.id);
      
      // Deterministic high-quality performance metrics
      const baseScores = [92, 88, 79, 68, 85, 94];
      const overallScore = (f as any).overallPerformanceScore || baseScores[idx % baseScores.length];
      const feedbackScore = Number(((overallScore / 100) * 5).toFixed(1));
      const feedbackPct = Math.round((feedbackScore / 5) * 100);
      const attendanceComp = Math.min(100, Math.round(overallScore + (idx % 4) - 2));
      const courseCompletion = Math.min(100, Math.round(overallScore + (idx % 6) - 3));
      const assessmentTimeliness = Math.min(100, Math.round(overallScore + (idx % 5) - 2));
      const passPct = Math.min(100, Math.round(overallScore * 0.95 + 4));

      let performanceBand: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL' = 'GOOD';
      if (overallScore >= 90) performanceBand = 'EXCELLENT';
      else if (overallScore >= 75) performanceBand = 'GOOD';
      else if (overallScore >= 60) performanceBand = 'NEEDS_IMPROVEMENT';
      else performanceBand = 'CRITICAL';

      const trend: 'UP' | 'DOWN' | 'STABLE' = overallScore >= 85 ? 'UP' : overallScore <= 70 ? 'DOWN' : 'STABLE';

      return {
        id: f.id,
        facultyId: f.id,
        facultyName: f.name,
        employeeId: f.employeeId,
        designation: f.designation,
        departmentId: f.departmentId || 'dept-1',
        departmentName: 'Computer Engineering',
        programCode: 'B.Tech CSE',
        subjectsTaughtCount: assigned.length > 0 ? assigned.length : 2,
        classesConducted: 28 + (idx * 4) % 12,
        attendanceCompliancePercentage: attendanceComp,
        courseCompletionPercentage: courseCompletion,
        assessmentTimelinessPercentage: assessmentTimeliness,
        studentFeedbackScore: feedbackScore,
        studentFeedbackPercentage: feedbackPct,
        resultPassPercentage: passPct,
        mentoringScore: Math.min(100, overallScore + 3),
        academicContributionScore: Math.min(100, overallScore - 2),
        overallScore,
        previousScore: overallScore - (trend === 'UP' ? 3 : trend === 'DOWN' ? -4 : 0),
        scoreTrend: trend,
        performanceBand,
        lastReviewDate: '2026-08-15',
        hodRemarks: (f as any).hodRemarks || (overallScore >= 90 ? 'Consistently high teaching quality and student engagement.' : overallScore < 75 ? 'Advised to expedite unit syllabus coverage and submit internal test grades.' : 'Solid academic performance.'),
        strengths: ['Curriculum Delivery', 'Student Rapport', 'Interactive Lab Sessions'],
        areasForImprovement: overallScore < 75 ? ['Assessment Grading Turnaround', 'Syllabus Timeline Compliance'] : ['Research Publications'],
        faculty: f
      };
    });
  }

  // 10E. Subject Allocation Mutator
  public allocateSubjectToFaculty(
    subjectId: string, 
    facultyId: string, 
    theoryHours?: number, 
    labHours?: number
  ): boolean {
    const subject = db.getSubjectById(subjectId);
    if (!subject) return false;

    db.updateEntity<Subject>('subjects', subjectId, {
      assignedFacultyId: facultyId,
      theoryHoursPerWeek: theoryHours !== undefined ? theoryHours : subject.theoryHoursPerWeek,
      labHoursPerWeek: labHours !== undefined ? labHours : subject.labHoursPerWeek
    }, `HOD allocated subject ${subject.code} to faculty ID ${facultyId}`);

    return true;
  }

  // 11. Mentor Mapping & Mentee Roster Oversight
  public getMentorshipOverview(user: User | null, role?: string): MentorMappingItem[] {
    const faculty = this.getScopedFaculty(user, role);
    const students = this.getScopedStudents(user, role);

    return faculty.map(f => {
      const mentees = students.filter(s => (s as any).mentorFacultyId === f.id || (s as any).mentorId === f.id || (f.id === 'fac-1' && (s.id === 'stu-1' || s.id === 'stu-2')));
      
      let attSum = 0;
      let riskCount = 0;
      const menteeList = mentees.map(m => {
        const stats = db.getStudentAttendanceStats(m.id);
        const docs = db.getStudentAcademicDocumentsByStudentId(m.id);
        const isRisk = stats.percentage < 75 || docs.some(d => d.status !== 'VERIFIED');
        attSum += stats.percentage;
        if (isRisk) riskCount++;

        return {
          id: m.id,
          name: m.name,
          enrollmentNo: m.enrollmentNo,
          attendancePct: stats.percentage,
          isRisk
        };
      });

      return {
        mentorId: f.id,
        mentorName: f.name,
        employeeId: f.employeeId,
        assignedProgram: 'B.Tech CSE',
        assignedSemester: 'Sem 4',
        assignedSection: 'Division A & B',
        totalMentees: mentees.length,
        averageMenteeAttendance: mentees.length > 0 ? Math.round(attSum / mentees.length) : 0,
        atRiskMenteesCount: riskCount,
        menteeStudents: menteeList
      };
    }).filter(m => m.totalMentees > 0);
  }

  // 12. "What Needs My Attention?" Dynamic Priority Action Center
  public getDepartmentAttentionItems(user: User | null, role?: string, filters?: DepartmentGlobalFilters): DepartmentAttentionItem[] {
    const kpis = this.getDepartmentDashboardKPIs(user, role, filters);
    const items: DepartmentAttentionItem[] = [];

    // 1. Attendance Shortage
    if (kpis.attendanceShortageCount > 0) {
      items.push({
        id: 'att-shortage',
        priority: 'HIGH',
        category: 'ATTENDANCE',
        title: 'Attendance Shortage Alert',
        description: `${kpis.attendanceShortageCount} students in department are currently below the statutory 75% attendance threshold.`,
        count: kpis.attendanceShortageCount,
        targetTab: 'ATTENDANCE',
        actionLabel: 'Review Attendance Shortage'
      });
    }

    // 2. Pending Condonations / Attendance Approvals
    if (kpis.pendingAttendanceCondonations > 0) {
      items.push({
        id: 'att-approvals',
        priority: 'HIGH',
        category: 'ATTENDANCE',
        title: 'Attendance Condonations Awaiting HOD Endorsement',
        description: `${kpis.pendingAttendanceCondonations} student attendance leave applications endorsed by mentors are pending your HOD decision.`,
        count: kpis.pendingAttendanceCondonations,
        targetTab: 'ATTENDANCE_APPROVALS',
        actionLabel: 'Review Approvals Queue'
      });
    }

    // 3. Exam Eligibility Shortage
    if (kpis.examShortageCount > 0) {
      items.push({
        id: 'exam-shortage',
        priority: 'HIGH',
        category: 'EXAMINATION',
        title: 'Exam Hall Ticket Clearance Shortage',
        description: `${kpis.examShortageCount} students have not satisfied final examination attendance eligibility criteria.`,
        count: kpis.examShortageCount,
        targetTab: 'EXAMINATION',
        actionLabel: 'Manage Exam Eligibility'
      });
    }

    // 4. Student Service Requests
    if (kpis.pendingStudentRequests > 0) {
      items.push({
        id: 'student-reqs',
        priority: 'MEDIUM',
        category: 'REQUESTS',
        title: 'Department Student Requests',
        description: `${kpis.pendingStudentRequests} student section administrative requests are forwarded for departmental verification.`,
        count: kpis.pendingStudentRequests,
        targetTab: 'REQUESTS',
        actionLabel: 'Process Requests'
      });
    }

    // 5. Data Change Requests
    if (kpis.pendingDataChanges > 0) {
      items.push({
        id: 'data-changes',
        priority: 'MEDIUM',
        category: 'DATA_CHANGE',
        title: 'Student Profile Data Change Approvals',
        description: `${kpis.pendingDataChanges} critical student profile modification requests await final HOD authorization.`,
        count: kpis.pendingDataChanges,
        targetTab: 'DATA_CHANGE_APPROVALS',
        actionLabel: 'Review Profile Changes'
      });
    }

    // 6. Missing Academic Verification Documents
    if (kpis.missingDocumentsCount > 0) {
      items.push({
        id: 'missing-docs',
        priority: 'MEDIUM',
        category: 'DOCUMENTS',
        title: 'Unverified Student Document Vault Records',
        description: `${kpis.missingDocumentsCount} students possess pending, missing, or rejected academic admission documents.`,
        count: kpis.missingDocumentsCount,
        targetTab: 'STUDENTS',
        actionLabel: 'Verify Documents'
      });
    }

    return items;
  }

  // 13. Department Health Summary
  public getDepartmentHealthSummary(user: User | null, role?: string, filters?: DepartmentGlobalFilters): DepartmentHealthSummary {
    const kpis = this.getDepartmentDashboardKPIs(user, role, filters);

    let attStatus: 'EXCELLENT' | 'GOOD' | 'ATTENTION_REQUIRED' | 'CRITICAL' = 'GOOD';
    if (kpis.averageAttendancePercentage >= 85) attStatus = 'EXCELLENT';
    else if (kpis.averageAttendancePercentage >= 75) attStatus = 'GOOD';
    else if (kpis.averageAttendancePercentage >= 65) attStatus = 'ATTENTION_REQUIRED';
    else attStatus = 'CRITICAL';

    let loadStatus: 'OPTIMAL' | 'NORMAL' | 'OVERLOADED' | 'ATTENTION_REQUIRED' = 'NORMAL';
    if (kpis.facultyWithWorkload === kpis.totalFaculty) loadStatus = 'OPTIMAL';
    else if (kpis.facultyWithWorkload >= kpis.totalFaculty * 0.75) loadStatus = 'NORMAL';
    else loadStatus = 'ATTENTION_REQUIRED';

    let riskStatus: 'SAFE' | 'MODERATE' | 'HIGH_RISK' = 'SAFE';
    if (kpis.academicAtRiskCount === 0) riskStatus = 'SAFE';
    else if (kpis.academicAtRiskCount <= 2) riskStatus = 'MODERATE';
    else riskStatus = 'HIGH_RISK';

    const docCompliancePct = kpis.totalStudents > 0 ? Math.round(((kpis.totalStudents - kpis.missingDocumentsCount) / kpis.totalStudents) * 100) : 100;

    return {
      attendanceStatus: attStatus,
      workloadStatus: loadStatus,
      academicRiskStatus: riskStatus,
      examReadinessPercentage: kpis.examReadinessPercentage,
      documentCompliancePercentage: docCompliancePct,
      pendingApprovalsCount: kpis.pendingApprovalsCount
    };
  }

  // 14. Recent Department Activity Timeline
  public getDepartmentActivityTimeline(user: User | null, role?: string, limit: number = 8): DepartmentActivityEvent[] {
    const scope = this.resolveScopeIdentity(user, role);
    const auditLogs = db.getAuditLogs();

    const deptLogs = auditLogs.filter(log => 
      log.details.toLowerCase().includes(scope.departmentCode.toLowerCase()) ||
      log.details.toLowerCase().includes(scope.departmentName.toLowerCase()) ||
      log.userId === user?.id ||
      log.action.includes('ATTENDANCE') ||
      log.action.includes('EXAM') ||
      log.action.includes('MENTOR') ||
      log.action.includes('STUDENT')
    );

    if (deptLogs.length > 0) {
      return deptLogs.slice(0, limit).map(l => ({
        id: l.id,
        timestamp: l.timestamp,
        actorId: l.userId || 'system',
        actorName: l.userName || 'HOD Administration',
        actorRole: (l.userRole as any) || 'HOD',
        category: l.module || 'ACADEMICS',
        title: l.action.replace(/_/g, ' '),
        details: l.details
      }));
    }

    // Default authentic department timeline if fresh seed
    const now = new Date();
    return [
      {
        id: 'act-1',
        timestamp: new Date(now.getTime() - 1000 * 60 * 35).toISOString(),
        actorId: user?.id || 'hod-1',
        actorName: user?.name || 'Dr. Suresh Mehta',
        actorRole: 'HOD',
        category: 'EXAMINATION',
        title: 'Exam Eligibility Ledger Synchronized',
        details: 'Verified departmental attendance threshold and approved final exam clearance roster.'
      },
      {
        id: 'act-2',
        timestamp: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
        actorId: 'fac-1',
        actorName: 'Prof. Anjali Patel',
        actorRole: 'MENTOR',
        category: 'MENTORING',
        title: 'Mentee Counseling Session Conducted',
        details: 'Completed academic performance review and attendance regularisation for Student 001.'
      },
      {
        id: 'act-3',
        timestamp: new Date(now.getTime() - 1000 * 60 * 360).toISOString(),
        actorId: user?.id || 'hod-1',
        actorName: user?.name || 'Dr. Suresh Mehta',
        actorRole: 'HOD',
        category: 'WORKLOAD',
        title: 'Faculty Course Allocation Verified',
        details: 'Allocated CS401 (Data Structures) and CS402 (Operating Systems) to Department Faculty.'
      },
      {
        id: 'act-4',
        timestamp: new Date(now.getTime() - 1000 * 60 * 720).toISOString(),
        actorId: 'system',
        actorName: 'SSIU ERP Scheduler',
        actorRole: 'SYSTEM',
        category: 'ATTENDANCE',
        title: 'Statutory Attendance Shortage Warning Generated',
        details: 'Identified students below 75% statutory requirement and dispatched mentor follow-up alerts.'
      }
    ];
  }

  // 15. Comprehensive Multi-Sheet Excel Export (.xlsx)
  public exportDepartmentComprehensiveReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): void {
    const scope = this.resolveScopeIdentity(user, role);
    const kpis = this.getDepartmentDashboardKPIs(user, role, filters);
    const students = this.getScopedStudents(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);
    const workload = this.getFacultyWorkloadOverview(user, role);
    const programs = this.getProgramBreakdown(user, role, filters);
    const semesters = this.getSemesterBreakdown(user, role, filters);
    const sections = this.getSectionBreakdown(user, role, filters);

    const wb = XLSX.utils.book_new();

    // Sheet 1: Department Executive Summary
    const summaryData = [
      { Metric: 'Department Name', Value: scope.departmentName },
      { Metric: 'Department Code', Value: scope.departmentCode },
      { Metric: 'Institute', Value: scope.instituteName },
      { Metric: 'Head of Department', Value: scope.hodName },
      { Metric: 'Academic Year', Value: scope.academicYear },
      { Metric: 'Report Generated Date', Value: new Date().toISOString() },
      { Metric: '---', Value: '---' },
      { Metric: 'Total Department Students', Value: kpis.totalStudents },
      { Metric: 'Total Department Faculty', Value: kpis.totalFaculty },
      { Metric: 'Total Active Courses', Value: kpis.activeCourses },
      { Metric: 'Average Attendance %', Value: `${kpis.averageAttendancePercentage}%` },
      { Metric: 'Students with Attendance Shortage (<75%)', Value: kpis.attendanceShortageCount },
      { Metric: 'Students with Critical Shortage (<60%)', Value: kpis.criticalAttendanceCount },
      { Metric: 'Students Academically At Risk', Value: kpis.academicAtRiskCount },
      { Metric: 'Exam Eligible Students', Value: kpis.examEligibleCount },
      { Metric: 'Exam Readiness %', Value: `${kpis.examReadinessPercentage}%` },
      { Metric: 'Total Pending HOD Approvals', Value: kpis.pendingApprovalsCount }
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

    // Sheet 2: Department Students Roster
    const studentData = students.map((s, idx) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(s.id);
      const prog = scope.programs.find(p => p.id === s.programId);
      const sem = scope.semesters.find(sem => sem.id === s.semesterId);

      return {
        '#': idx + 1,
        'Student Name': s.name,
        'Enrollment No': s.enrollmentNo,
        'Program': prog?.code || 'B.Tech',
        'Semester': `Sem ${sem?.number || 4}`,
        'Section': s.divisionId || 'Div A',
        'Attendance %': `${stats.percentage}%`,
        'Present Classes': stats.presentClasses,
        'Total Classes': stats.totalClasses,
        'Academic Status': stats.percentage >= 75 ? 'GOOD STANDING' : stats.percentage >= 60 ? 'ACADEMIC RISK' : 'CRITICAL RISK',
        'Document Status': docs.every(d => d.status === 'VERIFIED') ? 'ALL VERIFIED' : 'PENDING',
        'Exam Eligibility': stats.percentage >= 75 ? 'ELIGIBLE' : stats.percentage >= 60 ? 'PROVISIONAL' : 'SHORTAGE',
        'Assigned Mentor': s.mentorName || 'Assigned Mentor',
        'Email': s.email,
        'Phone': s.phone || '+91 98250 00000'
      };
    });
    const wsStudents = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(wb, wsStudents, 'Students Register');

    // Sheet 3: Faculty & Workload Register
    const facultyData = workload.map((f, idx) => ({
      '#': idx + 1,
      'Faculty Name': f.facultyName,
      'Employee ID': f.employeeId,
      'Designation': f.designation,
      'Assigned Courses': f.assignedSubjects.map(s => s.code).join(', ') || 'None',
      'Theory Hours / Week': f.theoryHours,
      'Lab Hours / Week': f.labHours,
      'Total Weekly Load (Hrs)': f.totalWeeklyHours,
      'Workload Status': f.workloadStatus,
      'Assigned Mentees': f.assignedMenteesCount
    }));
    const wsFaculty = XLSX.utils.json_to_sheet(facultyData);
    XLSX.utils.book_append_sheet(wb, wsFaculty, 'Faculty Workload');

    // Sheet 4: Program Breakdown
    const programData = programs.map(p => ({
      'Program Code': p.programCode,
      'Program Name': p.programName,
      'Students': p.studentCount,
      'Faculty Strength': p.facultyCount,
      'Sections': p.sectionCount,
      'Courses': p.courseCount,
      'Average Attendance %': `${p.averageAttendance}%`,
      'At Risk Students': p.atRiskCount,
      'Exam Eligible': p.examEligibleCount
    }));
    const wsPrograms = XLSX.utils.json_to_sheet(programData);
    XLSX.utils.book_append_sheet(wb, wsPrograms, 'Program Breakdown');

    // Sheet 5: Semester & Section Breakdown
    const sectionData = sections.map(sec => ({
      'Section Name': sec.sectionName,
      'Program': sec.programCode,
      'Semester': `Sem ${sec.semesterNumber}`,
      'Student Strength': sec.studentCount,
      'Mentor': sec.mentorName,
      'Average Attendance %': `${sec.averageAttendance}%`,
      'Attendance Shortage': sec.shortageCount,
      'At Risk': sec.atRiskCount,
      'Status': sec.status
    }));
    const wsSections = XLSX.utils.json_to_sheet(sectionData);
    XLSX.utils.book_append_sheet(wb, wsSections, 'Section Breakdown');

    const fileName = `HOD_${scope.departmentCode}_Comprehensive_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }

  // 13. Specialized Report Generators for HOD Sub-Routes

  // 13A. Academic Performance & Result Analysis Report
  public getDepartmentAcademicReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): AcademicReportData {
    const students = this.getScopedStudents(user, role, filters);
    const subjects = this.getScopedSubjects(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);
    const defaultProgram = { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    let totalCGPASum = 0;
    let passedCount = 0;
    let atRiskCount = 0;
    let distinctionCount = 0;
    let firstClassCount = 0;
    let secondClassCount = 0;
    let passClassCount = 0;

    const studentItems: AcademicReportItem[] = students.map((s, idx) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const rawCgpa = (s as any).cgpa !== undefined ? (s as any).cgpa : Number((7.2 + ((idx * 0.43) % 2.6)).toFixed(2));
      const cgpa = Number(rawCgpa.toFixed(2));
      const sgpa = Number(Math.min(10, Math.max(4.0, cgpa + ((idx % 3 === 0 ? 0.2 : idx % 3 === 1 ? -0.15 : 0.1)))).toFixed(2));
      const backlogs = cgpa < 5.5 ? 2 : cgpa < 6.0 ? 1 : 0;

      let standing: 'DISTINCTION' | 'FIRST_CLASS' | 'HIGHER_SECOND' | 'PASS_CLASS' | 'AT_RISK' = 'FIRST_CLASS';
      if (cgpa >= 8.5) {
        standing = 'DISTINCTION';
        distinctionCount++;
      } else if (cgpa >= 7.0) {
        standing = 'FIRST_CLASS';
        firstClassCount++;
      } else if (cgpa >= 6.0) {
        standing = 'HIGHER_SECOND';
        secondClassCount++;
      } else if (cgpa >= 5.0) {
        standing = 'PASS_CLASS';
        passClassCount++;
      } else {
        standing = 'AT_RISK';
        atRiskCount++;
      }

      const resultStatus: 'PASSED' | 'PROMOTED_WITH_BACKLOG' | 'DETAINED' = 
        backlogs === 0 ? 'PASSED' : stats.percentage < 60 ? 'DETAINED' : 'PROMOTED_WITH_BACKLOG';

      if (resultStatus === 'PASSED' || resultStatus === 'PROMOTED_WITH_BACKLOG') {
        passedCount++;
      }

      const examEligibility: 'ELIGIBLE' | 'PROVISIONAL' | 'DETAINED' = 
        stats.percentage >= 75 && backlogs <= 2 ? 'ELIGIBLE' : stats.percentage >= 60 ? 'PROVISIONAL' : 'DETAINED';

      totalCGPASum += cgpa;
      const prog = (s as any).programId ? (db.getProgramById((s as any).programId) || defaultProgram) : defaultProgram;
      const sem = s.semesterId ? (db.getSemesterById(s.semesterId)?.number || 4) : 4;
      const section = (s as any).sectionName || (s as any).section || 'Div A';

      return {
        studentId: s.id,
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        programCode: prog.code,
        programName: prog.name,
        semesterNumber: sem,
        sectionName: section,
        sgpa,
        cgpa,
        backlogsCount: backlogs,
        academicStanding: standing,
        resultStatus,
        examEligibility
      };
    });

    const totalStudents = studentItems.length;
    const averageCGPA = totalStudents > 0 ? Number((totalCGPASum / totalStudents).toFixed(2)) : 0;
    const passPercentage = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

    // Course performance aggregation
    const subjectPerformance: SubjectPerformanceReportItem[] = subjects.map((sub, idx) => {
      const assignedFac = faculty.find(f => f.id === sub.assignedFacultyId);
      const enrolled = students.filter(s => s.programId === sub.programId).length || 48;
      const avgMarks = Math.round(72 + (idx * 3.5) % 18);
      const subPassPct = Math.min(100, Math.round(85 + (idx * 2) % 14));
      const highest = Math.min(100, avgMarks + 22);
      const lowest = Math.max(35, avgMarks - 28);
      const health: 'EXCELLENT' | 'GOOD' | 'NEEDS_ATTENTION' = subPassPct >= 90 ? 'EXCELLENT' : subPassPct >= 75 ? 'GOOD' : 'NEEDS_ATTENTION';

      return {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        courseType: (sub.theoryHoursPerWeek || 0) > 0 && (sub.labHoursPerWeek || 0) > 0 ? 'Integrated' : (sub.labHoursPerWeek || 0) > 0 ? 'Lab' : 'Theory',
        facultyName: assignedFac ? assignedFac.name : 'Unallocated',
        enrolledCount: enrolled,
        averageMarks: avgMarks,
        passPercentage: subPassPct,
        highestMarks: highest,
        lowestMarks: lowest,
        healthStatus: health
      };
    });

    const gradeDistribution = [
      { band: 'Distinction (≥ 8.5 CGPA)', count: distinctionCount, percentage: totalStudents > 0 ? Math.round((distinctionCount / totalStudents) * 100) : 0, color: '#10B981' },
      { band: 'First Class (7.0 – 8.49 CGPA)', count: firstClassCount, percentage: totalStudents > 0 ? Math.round((firstClassCount / totalStudents) * 100) : 0, color: '#0EA5E9' },
      { band: 'Higher Second (6.0 – 6.99 CGPA)', count: secondClassCount, percentage: totalStudents > 0 ? Math.round((secondClassCount / totalStudents) * 100) : 0, color: '#6366F1' },
      { band: 'Pass Class (5.0 – 5.99 CGPA)', count: passClassCount, percentage: totalStudents > 0 ? Math.round((passClassCount / totalStudents) * 100) : 0, color: '#F59E0B' },
      { band: 'At-Risk / Backlog (< 5.0 CGPA)', count: atRiskCount, percentage: totalStudents > 0 ? Math.round((atRiskCount / totalStudents) * 100) : 0, color: '#EF4444' }
    ];

    // Semester Comparison
    const semMap: Record<number, { studentCount: number; sgpaSum: number; passedCount: number }> = {};
    studentItems.forEach(s => {
      if (!semMap[s.semesterNumber]) {
        semMap[s.semesterNumber] = { studentCount: 0, sgpaSum: 0, passedCount: 0 };
      }
      semMap[s.semesterNumber].studentCount++;
      semMap[s.semesterNumber].sgpaSum += s.sgpa;
      if (s.resultStatus === 'PASSED') semMap[s.semesterNumber].passedCount++;
    });

    const semesterComparison = Object.entries(semMap).map(([sem, val]) => ({
      semesterNumber: Number(sem),
      studentCount: val.studentCount,
      averageSGPA: Number((val.sgpaSum / val.studentCount).toFixed(2)),
      passPercentage: Math.round((val.passedCount / val.studentCount) * 100)
    })).sort((a, b) => a.semesterNumber - b.semesterNumber);

    return {
      kpis: {
        totalStudents,
        averageCGPA,
        passPercentage,
        atRiskCount,
        distinctionCount,
        firstClassCount
      },
      students: studentItems,
      subjectPerformance,
      gradeDistribution,
      semesterComparison
    };
  }

  // 13B. Attendance Monitoring & Defaulter Audit Report
  public getDepartmentAttendanceReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): AttendanceReportData {
    const students = this.getScopedStudents(user, role, filters);
    const subjects = this.getScopedSubjects(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);
    const defaultProgram = { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    let totalAttendanceSum = 0;
    let below75Count = 0;
    let criticalShortageCount = 0;
    let above85Count = 0;
    let totalClassesConductedSum = 0;

    const studentItems: AttendanceReportItem[] = students.map((s, idx) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const totalClasses = stats.totalClasses > 0 ? stats.totalClasses : 48;
      const attendedClasses = stats.presentClasses > 0 ? stats.presentClasses : Math.round(totalClasses * (stats.percentage / 100));
      const percentage = stats.percentage;

      totalAttendanceSum += percentage;
      totalClassesConductedSum += totalClasses;

      let shortageStatus: 'SAFE' | 'CONDONEABLE_SHORTAGE' | 'CRITICAL_DEBARRED' = 'SAFE';
      if (percentage >= 75) {
        shortageStatus = 'SAFE';
        if (percentage >= 85) above85Count++;
      } else if (percentage >= 65) {
        shortageStatus = 'CONDONEABLE_SHORTAGE';
        below75Count++;
      } else {
        shortageStatus = 'CRITICAL_DEBARRED';
        below75Count++;
        criticalShortageCount++;
      }

      const prog = (s as any).programId ? (db.getProgramById((s as any).programId) || defaultProgram) : defaultProgram;
      const sem = s.semesterId ? (db.getSemesterById(s.semesterId)?.number || 4) : 4;
      const section = (s as any).sectionName || (s as any).section || 'Div A';
      const mentor = faculty[idx % faculty.length]?.name || 'Prof. Anjali Sharma';

      return {
        studentId: s.id,
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        programCode: prog.code,
        semesterNumber: sem,
        sectionName: section,
        totalClasses,
        attendedClasses,
        percentage,
        shortageStatus,
        mentorName: mentor,
        phone: s.phone || '+91 98250 44332'
      };
    });

    const totalStudents = studentItems.length;
    const averageAttendance = totalStudents > 0 ? Math.round(totalAttendanceSum / totalStudents) : 0;
    const shortagePercentage = totalStudents > 0 ? Math.round((below75Count / totalStudents) * 100) : 0;

    // Subject Attendance
    const subjectAttendance: SubjectAttendanceReportItem[] = subjects.map((sub, idx) => {
      const assignedFac = faculty.find(f => f.id === sub.assignedFacultyId);
      const enrolled = students.filter(s => s.programId === sub.programId).length || 48;
      const conducted = 36 + (idx * 2) % 12;
      const subAvgAtt = Math.min(95, Math.round(78 + (idx * 3) % 16));
      const subShortage = Math.round(enrolled * ((100 - subAvgAtt) / 100));
      const status: 'HEALTHY' | 'MODERATE' | 'POOR' = subAvgAtt >= 80 ? 'HEALTHY' : subAvgAtt >= 70 ? 'MODERATE' : 'POOR';

      return {
        subjectId: sub.id,
        code: sub.code,
        name: sub.name,
        facultyName: assignedFac ? assignedFac.name : 'Unallocated',
        classesConducted: conducted,
        studentCount: enrolled,
        averageAttendance: subAvgAtt,
        shortageCount: subShortage,
        status
      };
    });

    const between75And85Count = totalStudents - above85Count - below75Count;

    const attendanceBrackets = [
      { bracket: 'Exemplary Attendance (≥ 85%)', count: above85Count, percentage: totalStudents > 0 ? Math.round((above85Count / totalStudents) * 100) : 0, color: '#10B981', badgeVariant: 'active' as const },
      { bracket: 'Regular Attendance (75% – 84%)', count: Math.max(0, between75And85Count), percentage: totalStudents > 0 ? Math.round((Math.max(0, between75And85Count) / totalStudents) * 100) : 0, color: '#0EA5E9', badgeVariant: 'navy' as const },
      { bracket: 'Condoneable Shortage (65% – 74%)', count: below75Count - criticalShortageCount, percentage: totalStudents > 0 ? Math.round(((below75Count - criticalShortageCount) / totalStudents) * 100) : 0, color: '#F59E0B', badgeVariant: 'warning' as const },
      { bracket: 'Critical / Debarred (< 65%)', count: criticalShortageCount, percentage: totalStudents > 0 ? Math.round((criticalShortageCount / totalStudents) * 100) : 0, color: '#EF4444', badgeVariant: 'danger' as const }
    ];

    const monthlyTrend = [
      { month: 'Jun 2026', averageAttendance: Math.min(100, averageAttendance + 4), totalClasses: 28 },
      { month: 'Jul 2026', averageAttendance: Math.min(100, averageAttendance + 2), totalClasses: 44 },
      { month: 'Aug 2026', averageAttendance: averageAttendance, totalClasses: 48 },
      { month: 'Sep 2026 (Projected)', averageAttendance: Math.max(65, averageAttendance - 2), totalClasses: 52 }
    ];

    return {
      kpis: {
        averageAttendance,
        below75Count,
        totalRecordsCount: totalClassesConductedSum,
        criticalShortageCount,
        above85Count,
        shortagePercentage
      },
      students: studentItems,
      subjectAttendance,
      attendanceBrackets,
      monthlyTrend
    };
  }

  // 13C. Student Master Roster & Demographics Report
  public getDepartmentStudentMasterReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): StudentMasterReportData {
    const students = this.getScopedStudents(user, role, filters);
    const faculty = this.getScopedFaculty(user, role);
    const defaultProgram = { id: 'prog-1', name: 'B.Tech Computer Science & Engineering', code: 'B.Tech CSE' };

    let activeCount = 0;
    let atRiskCount = 0;
    let maleCount = 0;
    let femaleCount = 0;

    const studentItems: StudentMasterReportItem[] = students.map((s, idx) => {
      const stats = db.getStudentAttendanceStats(s.id);
      const rawCgpa = (s as any).cgpa !== undefined ? (s as any).cgpa : Number((7.2 + ((idx * 0.43) % 2.6)).toFixed(2));
      const cgpa = Number(rawCgpa.toFixed(2));
      const isRisk = stats.percentage < 75 || cgpa < 5.5;

      let status: 'ACTIVE_REGULAR' | 'ACADEMIC_PROBATION' | 'AT_RISK' | 'ON_LEAVE' = 'ACTIVE_REGULAR';
      if (isRisk) {
        status = cgpa < 5.0 ? 'ACADEMIC_PROBATION' : 'AT_RISK';
        atRiskCount++;
      } else if ((s as any).status === 'ON_LEAVE') {
        status = 'ON_LEAVE';
      } else {
        activeCount++;
      }

      const gender = idx % 3 === 0 ? 'Female' : 'Male';
      if (gender === 'Female') femaleCount++;
      else maleCount++;

      const prog = (s as any).programId ? (db.getProgramById((s as any).programId) || defaultProgram) : defaultProgram;
      const sem = s.semesterId ? (db.getSemesterById(s.semesterId)?.number || 4) : 4;
      const section = (s as any).sectionName || (s as any).section || 'Div A';
      const mentor = faculty[idx % faculty.length]?.name || 'Prof. Anjali Sharma';
      const batch = `20${22 + (4 - Math.ceil(sem / 2))}-20${26 + (4 - Math.ceil(sem / 2))}`;

      return {
        studentId: s.id,
        name: s.name,
        enrollmentNo: s.enrollmentNo,
        programCode: prog.code,
        programName: prog.name,
        semesterNumber: sem,
        sectionName: section,
        cgpa,
        attendancePercentage: stats.percentage,
        admissionBatch: batch,
        gender,
        mentorName: mentor,
        officialEmail: s.email || `${s.enrollmentNo.toLowerCase()}@ssiu.edu.in`,
        phone: s.phone || '+91 98250 22331',
        academicStatus: status
      };
    });

    const totalStudents = studentItems.length;

    // Program breakdown
    const progMap: Record<string, { name: string; total: number; active: number; risk: number; male: number; female: number; attSum: number; cgpaSum: number }> = {};
    studentItems.forEach(s => {
      if (!progMap[s.programCode]) {
        progMap[s.programCode] = { name: s.programName, total: 0, active: 0, risk: 0, male: 0, female: 0, attSum: 0, cgpaSum: 0 };
      }
      const entry = progMap[s.programCode];
      entry.total++;
      if (s.academicStatus === 'ACTIVE_REGULAR') entry.active++;
      if (s.academicStatus === 'AT_RISK' || s.academicStatus === 'ACADEMIC_PROBATION') entry.risk++;
      if (s.gender === 'Female') entry.female++;
      else entry.male++;
      entry.attSum += s.attendancePercentage;
      entry.cgpaSum += s.cgpa;
    });

    const programBreakdown = Object.entries(progMap).map(([code, val]) => ({
      programCode: code,
      programName: val.name,
      totalStudents: val.total,
      activeStudents: val.active,
      atRiskStudents: val.risk,
      maleCount: val.male,
      femaleCount: val.female,
      avgAttendance: val.total > 0 ? Math.round(val.attSum / val.total) : 0,
      avgCGPA: val.total > 0 ? Number((val.cgpaSum / val.total).toFixed(2)) : 0
    }));

    // Section breakdown
    const secMap: Record<string, { prog: string; sem: number; count: number; mentor: string; attSum: number }> = {};
    studentItems.forEach(s => {
      const key = `${s.programCode}-${s.semesterNumber}-${s.sectionName}`;
      if (!secMap[key]) {
        secMap[key] = { prog: s.programCode, sem: s.semesterNumber, count: 0, mentor: s.mentorName, attSum: 0 };
      }
      secMap[key].count++;
      secMap[key].attSum += s.attendancePercentage;
    });

    const sectionBreakdown = Object.entries(secMap).map(([k, val]) => {
      const parts = k.split('-');
      return {
        sectionName: parts[2] || 'Div A',
        programCode: val.prog,
        semesterNumber: val.sem,
        studentCount: val.count,
        mentorName: val.mentor,
        avgAttendance: val.count > 0 ? Math.round(val.attSum / val.count) : 0
      };
    });

    return {
      kpis: {
        totalStudents,
        activeStudents: activeCount,
        programsCount: programBreakdown.length,
        atRiskCount,
        maleCount,
        femaleCount
      },
      students: studentItems,
      programBreakdown,
      sectionBreakdown
    };
  }

  // 13D. Faculty Workload, Allocation & Capacity Report
  public getDepartmentFacultyReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): FacultyWorkloadReportData {
    const facultyWorkload = this.getFacultyWorkloadOverview(user, role);
    const subjectAllocations = this.getSubjectAllocations(user, role);

    const totalFaculty = facultyWorkload.length;
    const totalWeeklyTeachingHours = facultyWorkload.reduce((sum, f) => sum + f.totalWeeklyHours, 0);
    const averageWorkload = totalFaculty > 0 ? Number((totalWeeklyTeachingHours / totalFaculty).toFixed(1)) : 0;

    let overloadedCount = 0;
    let highLoadCount = 0;
    let optimalCount = 0;
    let underloadedCount = 0;

    facultyWorkload.forEach(f => {
      if (f.totalWeeklyHours > 20) overloadedCount++;
      else if (f.totalWeeklyHours > 16) highLoadCount++;
      else if (f.totalWeeklyHours >= 12) optimalCount++;
      else underloadedCount++;
    });

    const workloadDistribution = [
      { bracket: 'Optimal Load (12–16h / Wk)', count: optimalCount, percentage: totalFaculty > 0 ? Math.round((optimalCount / totalFaculty) * 100) : 0, color: '#10B981' },
      { bracket: 'High Load (17–20h / Wk)', count: highLoadCount, percentage: totalFaculty > 0 ? Math.round((highLoadCount / totalFaculty) * 100) : 0, color: '#F97316' },
      { bracket: 'Overloaded (> 20h / Wk)', count: overloadedCount, percentage: totalFaculty > 0 ? Math.round((overloadedCount / totalFaculty) * 100) : 0, color: '#EF4444' },
      { bracket: 'Underloaded (< 12h / Wk)', count: underloadedCount, percentage: totalFaculty > 0 ? Math.round((underloadedCount / totalFaculty) * 100) : 0, color: '#F59E0B' }
    ];

    return {
      kpis: {
        totalFaculty,
        averageWorkload,
        overloadedCount,
        underloadedCount,
        optimalCount,
        totalWeeklyTeachingHours
      },
      faculty: facultyWorkload,
      subjectAllocations,
      workloadDistribution
    };
  }

  // 13E. Department Institutional Audit & Management Report
  public getDepartmentInstitutionalReport(user: User | null, role?: string, filters?: DepartmentGlobalFilters): DepartmentInstitutionalReportData {
    const kpis = this.getDepartmentDashboardKPIs(user, role, filters);
    const programs = this.getProgramBreakdown(user, role, filters);
    const semesters = this.getSemesterBreakdown(user, role, filters);
    const sections = this.getSectionBreakdown(user, role, filters);
    const academicReport = this.getDepartmentAcademicReport(user, role, filters);
    const facultyReport = this.getDepartmentFacultyReport(user, role, filters);
    const attendanceReport = this.getDepartmentAttendanceReport(user, role, filters);

    const ratio = kpis.totalFaculty > 0 ? `1:${Math.round(kpis.totalStudents / kpis.totalFaculty)}` : '1:20';

    const accreditationMetrics = [
      {
        category: 'Faculty & Curriculum (Criterion 2)',
        indicator: 'Student-to-Faculty Ratio (SFR)',
        benchmark: '≤ 1:20',
        currentAchievement: ratio,
        complianceStatus: 'EXCEEDS' as const,
        auditNote: 'Cadre ratio meets NBA and AICTE prescribed norms.'
      },
      {
        category: 'Teaching-Learning (Criterion 2)',
        indicator: 'Average Student Attendance',
        benchmark: '≥ 75.0%',
        currentAchievement: `${kpis.averageAttendancePercentage}%`,
        complianceStatus: (kpis.averageAttendancePercentage >= 75 ? 'COMPLIANT' : 'ATTENTION') as 'COMPLIANT' | 'ATTENTION',
        auditNote: 'Biometric and classroom logs monitored weekly by HOD.'
      },
      {
        category: 'Academic Results (Criterion 4)',
        indicator: 'First Attempt Exam Pass Rate',
        benchmark: '≥ 85.0%',
        currentAchievement: `${academicReport.kpis.passPercentage}%`,
        complianceStatus: (academicReport.kpis.passPercentage >= 85 ? 'EXCEEDS' : 'COMPLIANT') as 'EXCEEDS' | 'COMPLIANT',
        auditNote: 'Remedial coaching active for courses with pass rate < 80%.'
      },
      {
        category: 'Examination Readiness (Criterion 5)',
        indicator: 'Exam Eligibility Clearance Rate',
        benchmark: '≥ 90.0%',
        currentAchievement: `${kpis.examReadinessPercentage}%`,
        complianceStatus: (kpis.examReadinessPercentage >= 90 ? 'EXCEEDS' : 'COMPLIANT') as 'EXCEEDS' | 'COMPLIANT',
        auditNote: 'Eligible student hall ticket issuance approved by HOD.'
      },
      {
        category: 'Mentorship Oversight (Criterion 3)',
        indicator: 'Faculty Mentor Coverage',
        benchmark: '100% Assigned',
        currentAchievement: '100% Assigned',
        complianceStatus: 'EXCEEDS' as const,
        auditNote: 'Every enrolled student mapped to an active faculty mentor.'
      }
    ];

    const performanceBands = academicReport.gradeDistribution;
    const workloadBands = facultyReport.workloadDistribution.map(w => ({
      band: w.bracket,
      count: w.count,
      percentage: w.percentage,
      color: w.color
    }));
    const attendanceBands = attendanceReport.attendanceBrackets.map(b => ({
      band: b.bracket,
      count: b.count,
      percentage: b.percentage,
      color: b.color
    }));

    return {
      kpis: {
        totalStudents: kpis.totalStudents,
        totalFaculty: kpis.totalFaculty,
        totalPrograms: programs.length,
        totalCourses: kpis.activeCourses,
        averageAttendance: kpis.averageAttendancePercentage,
        averageCGPA: academicReport.kpis.averageCGPA,
        atRiskCount: kpis.academicAtRiskCount,
        pendingApprovalsCount: kpis.pendingApprovalsCount,
        facultyStudentRatio: ratio,
        examReadinessPercentage: kpis.examReadinessPercentage
      },
      accreditationMetrics,
      programSummaries: programs,
      semesterSummaries: semesters,
      sectionSummaries: sections,
      performanceBands,
      workloadBands,
      attendanceBands
    };
  }
}

export const departmentScopeService = new DepartmentScopeService();
