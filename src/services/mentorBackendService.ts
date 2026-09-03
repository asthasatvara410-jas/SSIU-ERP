import { db } from './db';
import { mentorAssignmentService } from './mentorAssignmentService';
import { studentProfileAccessService, StudentProfileData } from './studentProfileAccessService';
import { 
  MentorAssignment, MentoringSessionRecord, CreateMentoringSessionDTO, 
  UpdateMentoringSessionDTO, MenteeSummaryItem, MentorDashboardStats 
} from '../types/mentorAssignment';
import { User, UserRole, Student, StudentDocument, AttendanceSession, StudentResult, StudentMarks, StudentRequest } from '../types';

export class MentorBackendService {
  private static instance: MentorBackendService;

  private constructor() {}

  public static getInstance(): MentorBackendService {
    if (!MentorBackendService.instance) {
      MentorBackendService.instance = new MentorBackendService();
    }
    return MentorBackendService.instance;
  }

  // ============================================================================
  // 1. MENTOR AUTHENTICATION & IDENTITY VALIDATION
  // ============================================================================

  /**
   * Validate that the user is authenticated and has mentor/faculty authority
   */
  public validateMentorUser(user: User | null | undefined, role?: UserRole): {
    mentorId: string;
    mentorUser: User;
    instituteId?: string;
    departmentId?: string;
  } {
    if (!user) {
      throw new Error('401 Unauthorized: User authentication required.');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new Error('403 Forbidden: User account is inactive.');
    }

    const effectiveRole = role || user.role;
    const allowedRoles: UserRole[] = [
      'MENTOR', 'FACULTY', 'HOD', 'PRINCIPAL', 
      'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 
      'PRESIDENT', 'PROVOST', 'REGISTRAR', 'DEPUTY_REGISTRAR'
    ];
    if (!allowedRoles.includes(effectiveRole)) {
      throw new Error(`403 Forbidden: Role ${effectiveRole} is not authorized for Mentor operations.`);
    }

    return {
      mentorId: user.id,
      mentorUser: user,
      instituteId: user.instituteId,
      departmentId: user.departmentId
    };
  }

  // ============================================================================
  // 2. MENTOR-STUDENT ASSIGNMENT & SCOPE VERIFICATION
  // ============================================================================

  /**
   * Check if a student is actively assigned to the given mentor
   */
  public isStudentAssignedToMentor(mentorId: string, studentId: string, mentorUser?: User): boolean {
    if (!mentorId || !studentId) return false;

    // Super Admin & Executive Leadership override for administrative support
    if (mentorUser && ['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PRESIDENT', 'PROVOST', 'REGISTRAR', 'DEPUTY_REGISTRAR'].includes(mentorUser.role)) {
      return true;
    }

    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) return false;

    // Check active assignment in centralized mentorAssignments store
    const assignments = db.getMentorAssignments();
    const activeAssignment = assignments.find(
      a => (a.studentId === student.id || a.studentEnrollmentNo === student.enrollmentNo) &&
           a.mentorFacultyId === mentorId &&
           a.status === 'ACTIVE'
    );

    const isAssigned = Boolean(activeAssignment) || student.mentorId === mentorId;
    if (!isAssigned) return false;

    // Scope check: institute and department boundary validation
    if (mentorUser) {
      if (mentorUser.instituteId && student.instituteId && mentorUser.instituteId !== student.instituteId) {
        return false;
      }
      if (mentorUser.departmentId && student.departmentId && mentorUser.departmentId !== student.departmentId) {
        return false;
      }
    }

    return true;
  }

  /**
   * Assert authorization guard: throws 403 Forbidden if not authorized
   */
  public assertMentorAuthorizedForStudent(user: User, studentId: string): Student {
    this.validateMentorUser(user);
    const student = db.getStudents().find(s => s.id === studentId || s.enrollmentNo === studentId);
    if (!student) {
      throw new Error('404 Not Found: Student record does not exist.');
    }

    if (!this.isStudentAssignedToMentor(user.id, student.id, user)) {
      this.logMentorAudit(user, 'UNAUTHORIZED_MENTEE_ACCESS_BLOCKED', student.id, `Blocked unauthorized access attempt by user ${user.name}`);
      throw new Error('403 Forbidden: Access Denied. You are not the authorized mentor for this student.');
    }

    return student;
  }

  // ============================================================================
  // 3. MY MENTEES API (GET /mentor/mentees)
  // ============================================================================

  /**
   * Retrieve ONLY actively assigned mentees for the authenticated mentor with real metrics
   */
  public getMentees(
    user: User,
    params?: {
      searchQuery?: string;
      programId?: string;
      departmentId?: string;
      semesterId?: string;
      status?: string;
      page?: number;
      pageSize?: number;
    }
  ): {
    records: MenteeSummaryItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    this.validateMentorUser(user);

    // Fetch assignments for this specific mentor
    const allAssignments = db.getMentorAssignments();
    const allStudents = db.getStudents();
    const allDocs = db.getStudentAcademicDocuments();
    const allRequests = db.getState().studentRequests || [];
    const allSessions = db.getMentoringSessions();
    const minThreshold = db.getAttendanceEligibilityConfig().minimumAttendancePct || 75;

    // 1. Filter assignments active and assigned to this mentor
    let mentorAssignments = allAssignments.filter(
      a => a.mentorFacultyId === user.id && a.status === 'ACTIVE'
    );

    // Fallback if student.mentorId matches user.id
    const assignedStudentIds = new Set(mentorAssignments.map(a => a.studentId));
    allStudents.forEach(s => {
      if (s.mentorId === user.id && !assignedStudentIds.has(s.id)) {
        assignedStudentIds.add(s.id);
      }
    });

    let assignedStudents = allStudents.filter(s => assignedStudentIds.has(s.id));

    // 2. Enforce Institute and Department Scope
    if (user.instituteId) {
      assignedStudents = assignedStudents.filter(s => s.instituteId === user.instituteId);
    }
    if (user.departmentId) {
      assignedStudents = assignedStudents.filter(s => s.departmentId === user.departmentId);
    }

    // 3. Apply Query Filters
    if (params?.programId && params.programId !== 'ALL') {
      assignedStudents = assignedStudents.filter(s => s.programId === params.programId);
    }
    if (params?.departmentId && params.departmentId !== 'ALL') {
      assignedStudents = assignedStudents.filter(s => s.departmentId === params.departmentId);
    }
    if (params?.semesterId && params.semesterId !== 'ALL') {
      assignedStudents = assignedStudents.filter(s => s.semesterId === params.semesterId);
    }
    if (params?.searchQuery) {
      const q = params.searchQuery.toLowerCase().trim();
      assignedStudents = assignedStudents.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.enrollmentNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    // 4. Calculate Detailed Mentee Summaries
    const summaryItems: MenteeSummaryItem[] = assignedStudents.map(student => {
      const attStats = db.getStudentAttendanceStats(student.id);
      const studentDocs = allDocs.filter(d => d.studentId === student.id);
      const studentReqs = allRequests.filter(r => r.studentId === student.id && (r.status === 'SUBMITTED' || r.status === 'WORK_IN_PROGRESS' || r.status === 'WITH_MENTOR'));
      const studentSessions = allSessions.filter(s => s.studentId === student.id && s.mentorId === user.id);
      const pendingFollowUps = studentSessions.filter(s => s.followUpRequired && s.followUpStatus !== 'COMPLETED').length;
      const pendingDocs = studentDocs.filter(d => d.status === 'PENDING_VERIFICATION' || !d.isLocked).length;

      // Determine latest mentoring session date
      const sortedSessions = [...studentSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastMentoringDate = sortedSessions.length > 0 ? sortedSessions[0].date : undefined;

      // Academic performance check
      const studentResults = (db.getStudentResults() || []).filter(r => r.studentId === student.id);
      const hasBacklogs = studentResults.some(r => r.status === 'FAIL' || r.status === 'WITHHELD' || r.status === 'ATKT' || (r.backlogsCount && r.backlogsCount > 0));
      const latestResult = studentResults[studentResults.length - 1];

      const hasAttendanceShortage = attStats.percentage < minThreshold;
      let academicStatus: 'GOOD' | 'AVERAGE' | 'AT_RISK' = 'GOOD';
      if (hasBacklogs || (latestResult && latestResult.sgpa < 5.0)) {
        academicStatus = 'AT_RISK';
      } else if (latestResult && latestResult.sgpa < 6.5) {
        academicStatus = 'AVERAGE';
      }

      const isRisk = hasAttendanceShortage || academicStatus === 'AT_RISK' || pendingDocs > 0;

      const dept = db.getDepartmentById(student.departmentId);
      const prog = db.getProgramById(student.programId);
      const sem = db.getSemesterById(student.semesterId);

      return {
        studentId: student.id,
        studentName: student.name,
        enrollmentNo: student.enrollmentNo,
        photo: student.photo,
        email: student.email,
        phone: student.phone,
        instituteId: student.instituteId,
        departmentId: student.departmentId || '',
        departmentName: dept?.name || 'Computer Engineering',
        programId: student.programId,
        programName: prog?.name || 'B.Tech Computer Engineering',
        semesterNumber: sem?.number || 4,
        divisionName: student.divisionId || 'Div A',
        academicStatus,
        attendancePercentage: attStats.percentage,
        totalAttendanceSessions: attStats.totalClasses,
        presentAttendanceSessions: attStats.presentClasses,
        hasAttendanceShortage,
        lastMentoringDate,
        totalMentoringSessions: studentSessions.length,
        pendingFollowUpsCount: pendingFollowUps,
        pendingRequestsCount: studentReqs.length,
        pendingDocumentsCount: pendingDocs,
        isRisk,
        status: student.status
      };
    });

    // 5. Apply Status Filter
    let filtered = summaryItems;
    if (params?.status === 'SHORTAGE') {
      filtered = summaryItems.filter(m => m.hasAttendanceShortage);
    } else if (params?.status === 'RISK') {
      filtered = summaryItems.filter(m => m.isRisk);
    } else if (params?.status === 'ELIGIBLE') {
      filtered = summaryItems.filter(m => !m.hasAttendanceShortage);
    }

    // 6. Pagination
    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(1, params?.pageSize || 50);
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedRecords = filtered.slice(startIndex, startIndex + pageSize);

    return {
      records: paginatedRecords,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  }

  // ============================================================================
  // 4. MENTOR DASHBOARD METRICS API
  // ============================================================================

  /**
   * Real database calculated metrics for Mentor Dashboard cards
   */
  public getMentorDashboardStats(user: User): MentorDashboardStats {
    this.validateMentorUser(user);

    const menteesResponse = this.getMentees(user, { pageSize: 10000 });
    const mentees = menteesResponse.records;

    const totalMentees = mentees.length;
    const attendanceAlertsCount = mentees.filter(m => m.hasAttendanceShortage).length;
    const academicRiskCount = mentees.filter(m => m.isRisk).length;

    const allSessions = db.getMentoringSessions();
    const mySessions = allSessions.filter(s => s.mentorId === user.id);
    const mentoringSessionsCount = mySessions.length;
    const pendingFollowUpsCount = mySessions.filter(s => s.followUpRequired && s.followUpStatus !== 'COMPLETED').length;

    const allRequests = db.getState().studentRequests || [];
    const menteeStudentIds = new Set(mentees.map(m => m.studentId));
    const pendingRequests = allRequests.filter(
      r => (menteeStudentIds.has(r.studentId) || r.mentorId === user.id || r.currentHandlerId === user.id) &&
           (r.status === 'SUBMITTED' || r.status === 'WORK_IN_PROGRESS' || r.status === 'WITH_MENTOR')
    );

    const notesheets = db.getNoteSheets().filter(
      n => n.creatorId === user.id || n.currentAssigneeUserId === user.id
    );

    const unreadNotifications = db.getNotifications(user, user.role).filter(
      n => !n.isReadByUsers?.includes(user.id)
    );

    return {
      totalMentees,
      attendanceAlertsCount,
      academicRiskCount,
      pendingFollowUpsCount,
      mentoringSessionsCount,
      pendingRequestsCount: pendingRequests.length,
      totalPendingRequests: pendingRequests.length,
      totalSubjectQueries: pendingRequests.filter(r => r.category === 'ACADEMIC' || r.category === 'SUBJECT_RELATED' || r.category === 'EXAMINATION').length,
      totalComplaints: pendingRequests.filter(r => r.category === 'COMPLAINT' || r.category === 'OTHER').length,
      totalCompletedRequests: allRequests.filter(r => menteeStudentIds.has(r.studentId) && (r.status === 'RESOLVED' || r.status === 'COMPLETED')).length,
      scopedNotesheetsCount: notesheets.length,
      unreadNotificationsCount: unreadNotifications.length
    };
  }

  // ============================================================================
  // 5. STUDENT PROFILE ACCESS GATEWAY & SECURITY
  // ============================================================================

  /**
   * Return authorized student profile data for an assigned mentee
   */
  public getMenteeProfile(user: User, studentId: string): StudentProfileData {
    this.assertMentorAuthorizedForStudent(user, studentId);
    return studentProfileAccessService.getStudentProfile(user, user.role || 'MENTOR', studentId);
  }

  // ============================================================================
  // 6. ATTENDANCE VIEW & ATTENDANCE ALERTS
  // ============================================================================

  /**
   * Return attendance breakdown for an assigned mentee
   */
  public getMenteeAttendance(user: User, studentId: string): {
    student: Student;
    overallStats: {
      totalClasses: number;
      presentClasses: number;
      absentClasses: number;
      percentage: number;
    };
    subjectWise: Array<{
      subjectId: string;
      subjectName: string;
      subjectCode: string;
      total: number;
      present: number;
      absent: number;
      percentage: number;
      hasShortage: boolean;
    }>;
    recentSessions: AttendanceSession[];
  } {
    const student = this.assertMentorAuthorizedForStudent(user, studentId);
    const overallStats = db.getStudentAttendanceStats(student.id);
    const minPct = db.getAttendanceEligibilityConfig().minimumAttendancePct || 75;

    const subjects = db.getSubjects().filter(s => s.departmentId === student.departmentId);
    const attendanceSessions = db.getAttendanceSessions().filter(s => 
      s.divisionId === student.divisionId &&
      s.records.some(r => r.studentId === student.id)
    );

    const subjectWise = subjects.map(sub => {
      const subSessions = attendanceSessions.filter(s => s.subjectId === sub.id);
      let total = 0;
      let present = 0;
      subSessions.forEach(s => {
        const rec = s.records.find(r => r.studentId === student.id);
        if (rec) {
          total++;
          if (rec.status === 'PRESENT') present++;
        }
      });
      const pct = total > 0 ? Math.round((present / total) * 100) : 100;
      return {
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        total,
        present,
        absent: total - present,
        percentage: pct,
        hasShortage: pct < minPct
      };
    }).filter(s => s.total > 0);

    const recentSessions = [...attendanceSessions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    return {
      student,
      overallStats,
      subjectWise,
      recentSessions
    };
  }

  /**
   * Return attendance alerts for all assigned mentees below threshold
   */
  public getAttendanceAlerts(user: User, threshold?: number): Array<{
    student: Student;
    currentAttendancePct: number;
    requiredAttendancePct: number;
    totalClasses: number;
    presentClasses: number;
    absentClasses: number;
    classesNeededForEligibility: number;
  }> {
    this.validateMentorUser(user);
    const minThreshold = threshold || db.getAttendanceEligibilityConfig().minimumAttendancePct || 75;
    const menteesResponse = this.getMentees(user, { pageSize: 10000 });
    const students = db.getStudents();

    const alerts: Array<any> = [];
    menteesResponse.records.forEach(m => {
      if (m.hasAttendanceShortage) {
        const student = students.find(s => s.id === m.studentId);
        if (student) {
          // Calculate how many consecutive classes needed to reach 75%
          // (P + X) / (T + X) >= 0.75 => P + X >= 0.75T + 0.75X => 0.25X >= 0.75T - P => X >= (3T - 4P)
          const T = m.totalAttendanceSessions;
          const P = m.presentAttendanceSessions;
          const needed = Math.max(0, Math.ceil((3 * T - 4 * P)));

          alerts.push({
            student,
            currentAttendancePct: m.attendancePercentage,
            requiredAttendancePct: minThreshold,
            totalClasses: T,
            presentClasses: P,
            absentClasses: m.totalAttendanceSessions - m.presentAttendanceSessions,
            classesNeededForEligibility: needed
          });
        }
      }
    });

    return alerts;
  }

  /**
   * Return comprehensive Excel-style attendance rows for all assigned mentees
   */
  public getMenteeAttendanceTable(
    user: User,
    filters?: {
      searchQuery?: string;
      departmentId?: string;
      programId?: string;
      academicYear?: string;
      semesterId?: string;
      divisionId?: string;
      subjectId?: string;
      attendanceStatus?: string;
      eligibilityStatus?: string;
      riskLevel?: string;
    }
  ): Array<{
    studentId: string;
    studentName: string;
    enrollmentNo: string;
    universityId: string;
    departmentName: string;
    programCode: string;
    programName: string;
    semesterNumber: number;
    divisionName: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    totalSessions: number;
    presentSessions: number;
    absentSessions: number;
    attendancePercentage: number;
    requiredPercentage: number;
    eligibilityStatus: 'ELIGIBLE' | 'SHORTAGE' | 'CONDITIONAL' | 'NOT_ELIGIBLE';
    riskStatus: 'NORMAL' | 'WARNING' | 'CRITICAL';
    lastUpdatedDate: string;
    mentorName: string;
    mentorId: string;
  }> {
    this.validateMentorUser(user);
    const minThreshold = db.getAttendanceEligibilityConfig().minimumAttendancePct || 75;
    const menteesResponse = this.getMentees(user, { pageSize: 10000 });
    const students = db.getStudents();
    const programs = db.getPrograms();
    const departments = db.getDepartments();
    const semesters = db.getSemesters();
    const divisions = db.getDivisions();
    const allSubjects = db.getSubjects();
    const allSessions = db.getAttendanceSessions();

    const rows: Array<any> = [];

    menteesResponse.records.forEach(m => {
      const student = students.find(s => s.id === m.studentId);
      if (!student) return;

      const prog = programs.find(p => p.id === student.programId);
      const dept = departments.find(d => d.id === student.departmentId);
      const sem = semesters.find(s => s.id === student.semesterId);
      const div = divisions.find(d => d.id === student.divisionId);

      const progCode = prog?.code || 'B.Tech';
      const progName = prog?.name || 'Computer Engineering';
      const deptName = dept?.name || 'Department of Computer Engineering';
      const semNum = sem?.number || 3;
      const divName = div?.name ? (div.name.startsWith('Division') ? div.name : `Division ${div.name}`) : (student.divisionId || 'Div A');

      // Student's specific attendance sessions
      const studentSessions = allSessions.filter(s => 
        s.records.some(r => r.studentId === student.id)
      );

      // Latest session date for last updated
      const sortedSessions = [...studentSessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastUpdatedDate = sortedSessions[0]?.date || '2026-08-26';

      // 1. Overall Cumulative Row (if subject filter is ALL or not specified)
      if (!filters?.subjectId || filters.subjectId === 'ALL') {
        const total = m.totalAttendanceSessions;
        const present = m.presentAttendanceSessions;
        const absent = Math.max(0, total - present);
        const pct = m.attendancePercentage;

        let eligibility: 'ELIGIBLE' | 'SHORTAGE' | 'CONDITIONAL' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
        if (pct >= minThreshold) {
          eligibility = 'ELIGIBLE';
        } else if (pct >= minThreshold - 10) {
          eligibility = 'CONDITIONAL';
        } else {
          eligibility = 'NOT_ELIGIBLE';
        }

        let risk: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
        if (pct >= minThreshold + 10) {
          risk = 'NORMAL';
        } else if (pct >= minThreshold) {
          risk = 'WARNING';
        } else {
          risk = 'CRITICAL';
        }

        rows.push({
          studentId: student.id,
          studentName: student.name,
          enrollmentNo: student.enrollmentNo,
          universityId: student.universityId || student.id,
          departmentName: deptName,
          programCode: progCode,
          programName: progName,
          semesterNumber: semNum,
          divisionName: divName,
          subjectId: 'ALL',
          subjectCode: 'ALL_SUBJECTS',
          subjectName: 'All Subjects (Cumulative)',
          totalSessions: total,
          presentSessions: present,
          absentSessions: absent,
          attendancePercentage: pct,
          requiredPercentage: minThreshold,
          eligibilityStatus: eligibility,
          riskStatus: risk,
          lastUpdatedDate,
          mentorName: user.name || 'Assigned Mentor',
          mentorId: user.id
        });
      }

      // 2. Subject-wise rows (if subject filter is specified OR requested)
      const deptSubjects = allSubjects.filter(s => s.departmentId === student.departmentId || s.departmentId === 'dept-1');
      deptSubjects.forEach(sub => {
        if (filters?.subjectId && filters.subjectId !== 'ALL' && filters.subjectId !== sub.id) {
          return;
        }

        const subSessions = studentSessions.filter(s => s.subjectId === sub.id);
        let subTotal = 0;
        let subPresent = 0;
        subSessions.forEach(s => {
          const rec = s.records.find(r => r.studentId === student.id);
          if (rec) {
            subTotal++;
            if (rec.status === 'PRESENT' || (rec.status as string) === 'LATE' || (rec.status as string) === 'ON_DUTY') {
              subPresent++;
            }
          }
        });

        // Skip if subject has 0 sessions and we're showing specific subject search
        if (subTotal === 0 && filters?.subjectId === 'ALL') return;

        const subPct = subTotal > 0 ? Math.round((subPresent / subTotal) * 100) : 100;
        const subAbsent = Math.max(0, subTotal - subPresent);

        let subEligibility: 'ELIGIBLE' | 'SHORTAGE' | 'CONDITIONAL' | 'NOT_ELIGIBLE' = 'ELIGIBLE';
        if (subPct >= minThreshold) {
          subEligibility = 'ELIGIBLE';
        } else if (subPct >= minThreshold - 10) {
          subEligibility = 'CONDITIONAL';
        } else {
          subEligibility = 'NOT_ELIGIBLE';
        }

        let subRisk: 'NORMAL' | 'WARNING' | 'CRITICAL' = 'NORMAL';
        if (subPct >= minThreshold + 10) {
          subRisk = 'NORMAL';
        } else if (subPct >= minThreshold) {
          subRisk = 'WARNING';
        } else {
          subRisk = 'CRITICAL';
        }

        rows.push({
          studentId: student.id,
          studentName: student.name,
          enrollmentNo: student.enrollmentNo,
          universityId: student.universityId || student.id,
          departmentName: deptName,
          programCode: progCode,
          programName: progName,
          semesterNumber: semNum,
          divisionName: divName,
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          totalSessions: subTotal,
          presentSessions: subPresent,
          absentSessions: subAbsent,
          attendancePercentage: subPct,
          requiredPercentage: minThreshold,
          eligibilityStatus: subEligibility,
          riskStatus: subRisk,
          lastUpdatedDate: subSessions[0]?.date || lastUpdatedDate,
          mentorName: user.name || 'Assigned Mentor',
          mentorId: user.id
        });
      });
    });

    // Apply Filters
    let filtered = rows;

    if (filters?.searchQuery) {
      const q = filters.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(r => 
        r.studentName.toLowerCase().includes(q) ||
        r.enrollmentNo.toLowerCase().includes(q) ||
        r.universityId.toLowerCase().includes(q) ||
        r.subjectName.toLowerCase().includes(q) ||
        r.subjectCode.toLowerCase().includes(q)
      );
    }

    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      filtered = filtered.filter(r => r.departmentName.toLowerCase().includes(filters.departmentId!.toLowerCase()));
    }

    if (filters?.programId && filters.programId !== 'ALL') {
      filtered = filtered.filter(r => r.programCode === filters.programId || r.programName.toLowerCase().includes(filters.programId!.toLowerCase()));
    }

    if (filters?.semesterId && filters.semesterId !== 'ALL') {
      filtered = filtered.filter(r => String(r.semesterNumber) === String(filters.semesterId));
    }

    if (filters?.divisionId && filters.divisionId !== 'ALL') {
      filtered = filtered.filter(r => r.divisionName.toLowerCase().includes(filters.divisionId!.toLowerCase()));
    }

    if (filters?.attendanceStatus && filters.attendanceStatus !== 'ALL') {
      if (filters.attendanceStatus === 'GOOD') {
        filtered = filtered.filter(r => r.attendancePercentage >= minThreshold);
      } else if (filters.attendanceStatus === 'SHORTAGE') {
        filtered = filtered.filter(r => r.attendancePercentage < minThreshold);
      } else if (filters.attendanceStatus === 'CRITICAL') {
        filtered = filtered.filter(r => r.attendancePercentage < 60);
      }
    }

    if (filters?.eligibilityStatus && filters.eligibilityStatus !== 'ALL') {
      filtered = filtered.filter(r => r.eligibilityStatus === filters.eligibilityStatus);
    }

    if (filters?.riskLevel && filters.riskLevel !== 'ALL') {
      filtered = filtered.filter(r => r.riskStatus === filters.riskLevel);
    }

    return filtered;
  }

  /**
   * Return detailed session-by-session attendance log for a specific mentee
   */
  public getMenteeAttendanceSessionDetails(
    user: User,
    studentId: string,
    subjectId?: string
  ): {
    student: Student;
    mentorName: string;
    summary: {
      total: number;
      present: number;
      absent: number;
      percentage: number;
      requiredPercentage: number;
      eligibility: string;
      risk: string;
    };
    sessions: Array<{
      id: string;
      date: string;
      subjectCode: string;
      subjectName: string;
      facultyName: string;
      sessionNo: number | string;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'ON_DUTY';
      remarks: string;
    }>;
  } {
    const student = this.assertMentorAuthorizedForStudent(user, studentId);
    const minThreshold = db.getAttendanceEligibilityConfig().minimumAttendancePct || 75;
    const allSessions = db.getAttendanceSessions();
    const allSubjects = db.getSubjects();
    const allFaculty = db.getFaculty();

    const studentSessions = allSessions.filter(s => {
      if (subjectId && subjectId !== 'ALL' && s.subjectId !== subjectId) return false;
      return s.records.some(r => r.studentId === student.id);
    });

    let total = 0;
    let present = 0;
    const sessionLogs: Array<any> = [];

    studentSessions.forEach(s => {
      const rec = s.records.find(r => r.studentId === student.id);
      if (!rec) return;

      total++;
      const isPresent = rec.status === 'PRESENT' || (rec.status as string) === 'LATE' || (rec.status as string) === 'ON_DUTY';
      if (isPresent) present++;

      const subj = allSubjects.find(sub => sub.id === s.subjectId);
      const fac = allFaculty.find(f => f.id === s.facultyId);

      sessionLogs.push({
        id: `${s.id}-${student.id}`,
        date: s.date,
        subjectCode: subj?.code || s.subjectId,
        subjectName: subj?.name || 'Subject',
        facultyName: fac?.name || s.facultyName || 'Course Faculty',
        sessionNo: (s as any).session || (s as any).sessionNumber || 1,
        status: rec.status || 'PRESENT',
        remarks: rec.remarks || (rec.status === 'PRESENT' ? 'Attended lecture' : ((rec.status as string) === 'LATE' ? 'Late arrival' : 'Absent from lecture'))
      });
    });

    sessionLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;
    const absent = Math.max(0, total - present);

    let eligibility = 'ELIGIBLE';
    if (percentage < minThreshold - 10) eligibility = 'NOT_ELIGIBLE';
    else if (percentage < minThreshold) eligibility = 'CONDITIONAL';

    let risk = 'NORMAL';
    if (percentage < minThreshold) risk = 'CRITICAL';
    else if (percentage < minThreshold + 10) risk = 'WARNING';

    return {
      student,
      mentorName: user.name || 'Assigned Mentor',
      summary: {
        total,
        present,
        absent,
        percentage,
        requiredPercentage: minThreshold,
        eligibility,
        risk
      },
      sessions: sessionLogs
    };
  }

  /**
   * Raise Attendance Concern workflow
   */
  public raiseAttendanceConcern(
    user: User,
    dto: {
      studentId: string;
      subjectId?: string;
      concernCategory: string;
      remarks: string;
      actionRequested: string;
      notifyHOD?: boolean;
      notifyParents?: boolean;
    }
  ): MentoringSessionRecord {
    const student = this.assertMentorAuthorizedForStudent(user, dto.studentId);
    const now = new Date().toISOString();

    return db.runInTransaction(() => {
      const newSession: MentoringSessionRecord = {
        id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        mentorId: user.id,
        mentorName: user.name || 'Mentor',
        studentId: student.id,
        studentName: student.name,
        studentEnrollmentNo: student.enrollmentNo,
        date: now.split('T')[0],
        timeSlot: '11:00 AM - 11:30 AM',
        topic: `Attendance Concern: ${dto.concernCategory.replace(/_/g, ' ')}`,
        category: 'ATTENDANCE',
        attendanceConcern: dto.remarks,
        discussion: dto.remarks,
        academicConcern: dto.subjectId ? `Subject: ${dto.subjectId}` : 'Overall Attendance Shortage',
        actionTaken: `Concern logged by Mentor ${user.name}. ${dto.notifyHOD ? 'Escalated to HOD.' : ''}`,
        remarks: dto.remarks,
        followUpRequired: true,
        followUpStatus: 'OPEN',
        status: 'COMPLETED',
        createdAt: now,
        updatedAt: now
      };

      db.addEntity<MentoringSessionRecord>('mentoringSessions', newSession, `Raised attendance concern for ${student.name}`);

      if (dto.notifyHOD) {
        db.addNotification({
          title: `Attendance Concern Escalation: ${student.name}`,
          message: `Mentor ${user.name} reported attendance concern: ${dto.remarks}`,
          module: 'ATTENDANCE',
          timestamp: 'Just now',
          targetRole: 'HOD',
          linkTab: 'hod-attendance-shortage'
        });
      }

      this.logMentorAudit(
        user,
        'RAISE_ATTENDANCE_CONCERN',
        student.id,
        `Raised attendance concern '${dto.concernCategory}' for student ${student.name} (${student.enrollmentNo})`
      );

      return newSession;
    });
  }

  // ============================================================================
  // 7. ACADEMIC PERFORMANCE
  // ============================================================================

  /**
   * Return academic and exam performance records for assigned mentee
   */
  public getMenteeAcademicPerformance(user: User, studentId: string): {
    student: Student;
    results: StudentResult[];
    marks: StudentMarks[];
    cgpa?: number;
    backlogs: string[];
    academicHistory: any[];
  } {
    const student = this.assertMentorAuthorizedForStudent(user, studentId);
    const results = (db.getStudentResults() || []).filter(r => r.studentId === student.id);
    const marks = (db.getStudentMarks() || []).filter(m => m.studentId === student.id);

    const backlogs: string[] = [];
    results.forEach(r => {
      if (r.status === 'FAIL' || r.status === 'WITHHELD' || r.status === 'ATKT') {
        backlogs.push(`Semester ${r.semesterNumber || 4} - ${r.status}`);
      }
    });

    const latestResult = results[results.length - 1];
    const cgpa = latestResult?.cgpa || (student.academicHistory?.[student.academicHistory.length - 1]?.cpi);

    return {
      student,
      results,
      marks,
      cgpa,
      backlogs,
      academicHistory: student.academicHistory || []
    };
  }

  // ============================================================================
  // 8. MENTORING SESSIONS CRUD (TRANSACTIONAL)
  // ============================================================================

  /**
   * Create a new mentoring session record for an assigned mentee
   */
  public createMentoringSession(user: User, dto: CreateMentoringSessionDTO): MentoringSessionRecord {
    const student = this.assertMentorAuthorizedForStudent(user, dto.studentId);
    const now = new Date().toISOString();

    return db.runInTransaction(() => {
      const newSession: MentoringSessionRecord = {
        id: `ms-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        studentId: student.id,
        studentName: student.name,
        studentEnrollmentNo: student.enrollmentNo,
        mentorId: user.id, // Strictly derived from authenticated user
        mentorName: user.name,
        mentorRole: user.role,
        mentorDepartmentId: user.departmentId,
        mentorInstituteId: user.instituteId,
        date: dto.date || now.split('T')[0],
        timeSlot: dto.timeSlot || '02:00 PM - 02:30 PM',
        topic: dto.topic || dto.discussion || 'Mentoring & Academic Review',
        discussion: dto.discussion || dto.topic || '',
        academicConcern: dto.academicConcern || '',
        attendanceConcern: dto.attendanceConcern || '',
        actionTaken: dto.actionTaken || 'Guidance provided and recorded.',
        remarks: dto.remarks || '',
        followUpRequired: Boolean(dto.followUpRequired),
        followUpDate: dto.followUpDate,
        followUpAction: dto.followUpAction,
        followUpStatus: dto.followUpRequired ? 'OPEN' : 'COMPLETED',
        status: dto.status || 'COMPLETED',
        createdAt: now,
        updatedAt: now
      };

      db.saveMentoringSession(newSession, user);

      // Create notification for follow-up if required
      if (newSession.followUpRequired && newSession.followUpDate) {
        db.addNotification({
          userId: user.id,
          targetUserId: user.id,
          targetRole: user.role,
          recipientUserId: user.id,
          recipientRole: user.role,
          title: 'Mentoring Follow-up Scheduled',
          message: `Follow-up scheduled on ${newSession.followUpDate} for ${student.name} (${student.enrollmentNo}).`,
          category: 'ACADEMIC',
          priority: 'MEDIUM',
          module: 'MENTOR',
          recordId: newSession.id,
          actionType: 'FOLLOW_UP',
          targetRoute: 'mentor-workspace'
        } as any);
      }

      this.logMentorAudit(user, 'MENTORING_SESSION_CREATED', newSession.id, `Mentoring session recorded for student ${student.name} (${student.enrollmentNo})`);

      return newSession;
    });
  }

  /**
   * Update an existing mentoring session
   */
  public updateMentoringSession(user: User, sessionId: string, updates: UpdateMentoringSessionDTO): MentoringSessionRecord {
    this.validateMentorUser(user);
    const session = db.getMentoringSessionById(sessionId);
    if (!session) {
      throw new Error('404 Not Found: Mentoring session record does not exist.');
    }

    if (session.mentorId !== user.id && !['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(user.role)) {
      this.logMentorAudit(user, 'UNAUTHORIZED_MENTOR_EDIT_BLOCKED', sessionId, 'Blocked attempt to modify another mentor\'s session record.');
      throw new Error('403 Forbidden: You cannot modify a mentoring record created by another mentor.');
    }

    return db.runInTransaction(() => {
      const updated: MentoringSessionRecord = {
        ...session,
        topic: updates.topic !== undefined ? updates.topic : session.topic,
        discussion: updates.discussion !== undefined ? updates.discussion : session.discussion,
        academicConcern: updates.academicConcern !== undefined ? updates.academicConcern : session.academicConcern,
        attendanceConcern: updates.attendanceConcern !== undefined ? updates.attendanceConcern : session.attendanceConcern,
        actionTaken: updates.actionTaken !== undefined ? updates.actionTaken : session.actionTaken,
        remarks: updates.remarks !== undefined ? updates.remarks : session.remarks,
        followUpRequired: updates.followUpRequired !== undefined ? updates.followUpRequired : session.followUpRequired,
        followUpDate: updates.followUpDate !== undefined ? updates.followUpDate : session.followUpDate,
        followUpAction: updates.followUpAction !== undefined ? updates.followUpAction : session.followUpAction,
        followUpStatus: updates.followUpStatus !== undefined ? updates.followUpStatus : session.followUpStatus,
        status: updates.status !== undefined ? updates.status : session.status,
        updatedAt: new Date().toISOString()
      };

      db.saveMentoringSession(updated, user);
      this.logMentorAudit(user, 'MENTORING_SESSION_UPDATED', session.id, `Updated mentoring record ${session.id}`);

      return updated;
    });
  }

  /**
   * Return chronological mentoring history for an assigned mentee
   */
  public getMentoringHistory(user: User, studentId: string): MentoringSessionRecord[] {
    this.assertMentorAuthorizedForStudent(user, studentId);
    const sessions = db.getMentoringSessions().filter(s => s.studentId === studentId);
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ============================================================================
  // 9. FOLLOW-UPS MANAGEMENT
  // ============================================================================

  /**
   * Retrieve all pending follow-ups for the authenticated mentor
   */
  public getPendingFollowUps(user: User): MentoringSessionRecord[] {
    this.validateMentorUser(user);
    const sessions = db.getMentoringSessions().filter(
      s => s.mentorId === user.id && s.followUpRequired && s.followUpStatus !== 'COMPLETED'
    );
    return sessions.sort((a, b) => new Date(a.followUpDate || a.date).getTime() - new Date(b.followUpDate || b.date).getTime());
  }

  /**
   * Update follow-up status (OPEN -> IN_PROGRESS -> COMPLETED)
   */
  public updateFollowUpStatus(
    user: User,
    sessionId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED',
    remarks?: string
  ): MentoringSessionRecord {
    return this.updateMentoringSession(user, sessionId, {
      followUpStatus: status,
      remarks: remarks || undefined
    });
  }

  // ============================================================================
  // 10. STUDENT REQUESTS INTEGRATION
  // ============================================================================

  /**
   * Get student requests scoped to this mentor's assigned mentees
   */
  public getMenteeStudentRequests(user: User): StudentRequest[] {
    this.validateMentorUser(user);
    const menteesResponse = this.getMentees(user, { pageSize: 10000 });
    const menteeIds = new Set(menteesResponse.records.map(m => m.studentId));

    const allRequests = db.getState().studentRequests || [];
    return allRequests.filter(r => 
      menteeIds.has(r.studentId) || r.mentorId === user.id || r.currentHandlerId === user.id
    );
  }

  // ============================================================================
  // 11. AUDIT LOGGING
  // ============================================================================

  private logMentorAudit(user: User, action: string, recordId: string, details: string): void {
    db.logAudit({
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      entity: 'MENTOR_MANAGEMENT',
      entityId: recordId,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export const mentorBackendService = MentorBackendService.getInstance();
