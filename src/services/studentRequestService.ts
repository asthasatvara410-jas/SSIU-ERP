import { db } from './db';
import { mentorAssignmentService } from './mentorAssignmentService';
import { 
  StudentRequest, StudentRequestCategory, StudentRequestStatus, 
  HandlerDestinationType, AuthorizedDepartment, StudentRequestTimelineItem 
} from '../types/studentRequest';
import { User, UserRole } from '../types';

class CentralStudentRequestService {
  /**
   * Determine the assigned Mentor for an active student.
   * Leverages centralized MentorAssignment database store.
   */
  public getStudentMentor(studentIdOrEnrollment: string): { mentorId: string; mentorName: string; mentorEmail?: string } {
    const activeAssignment = mentorAssignmentService.getActiveMentorForStudent(studentIdOrEnrollment);
    if (activeAssignment && activeAssignment.status === 'ACTIVE') {
      return {
        mentorId: activeAssignment.mentorFacultyId,
        mentorName: activeAssignment.mentorName,
        mentorEmail: activeAssignment.mentorEmail
      };
    }

    const students = db.getStudents();
    const student = students.find(
      s => s.id === studentIdOrEnrollment || 
           s.enrollmentNo === studentIdOrEnrollment ||
           s.email === studentIdOrEnrollment
    );

    if (!student) {
      throw new Error('Student record not found in system.');
    }

    const faculties = db.getFaculty();
    let assignedFaculty = student.mentorId ? faculties.find(f => f.id === student.mentorId) : null;

    // Fallback: If mentorId not explicitly set on student, pick primary faculty from same department
    if (!assignedFaculty) {
      assignedFaculty = faculties.find(f => f.departmentId === student.departmentId) || faculties[0];
    }

    if (!assignedFaculty) {
      throw new Error('Your mentor is not assigned. Please contact the Student Section.');
    }

    return {
      mentorId: assignedFaculty.id,
      mentorName: assignedFaculty.name,
      mentorEmail: assignedFaculty.email
    };
  }

  /**
   * Determine HOD for student's department
   */
  public getDepartmentHod(departmentId: string): { hodId: string; hodName: string; hodEmail?: string } {
    const departments = db.getDepartments();
    const dept = departments.find(d => d.id === departmentId || d.code === departmentId);
    const faculties = db.getFaculty();

    let hodFaculty = dept?.hodId ? faculties.find(f => f.id === dept.hodId) : null;
    if (!hodFaculty) {
      hodFaculty = faculties.find(f => f.departmentId === departmentId && (f.designation === 'Professor' || f.designation === 'Associate Professor')) || faculties[0];
    }

    return {
      hodId: hodFaculty?.id || 'hod-dept',
      hodName: dept?.hodName || hodFaculty?.name || 'Department HOD',
      hodEmail: dept?.email || hodFaculty?.email || 'hod@ssiu.edu'
    };
  }

  /**
   * Determine HOI (Principal) for student's institute
   */
  public getInstituteHoi(instituteId: string): { hoiId: string; hoiName: string; hoiEmail?: string } {
    const institutes = db.getInstitutes();
    const inst = institutes.find(i => i.id === instituteId || i.code === instituteId);
    
    return {
      hoiId: inst?.principalId || 'hoi-inst',
      hoiName: inst?.principalName || 'Institute Principal / HOI',
      hoiEmail: inst?.email || 'principal@ssiu.edu'
    };
  }

  /**
   * Automatically resolve assigned faculty for a given subject & student division
   */
  public getSubjectFaculty(subjectId: string): { facultyId: string; facultyName: string; facultyEmail?: string } {
    const subjects = db.getSubjects();
    const subject = subjects.find(s => s.id === subjectId || s.code === subjectId);
    const faculties = db.getFaculty();

    const faculty = subject?.assignedFacultyId ? faculties.find(f => f.id === subject.assignedFacultyId) : faculties[0];

    return {
      facultyId: faculty?.id || 'fac-subj',
      facultyName: faculty?.name || 'Subject Faculty',
      facultyEmail: faculty?.email || 'faculty@ssiu.edu'
    };
  }

  /**
   * 1. CREATE STUDENT REQUEST
   * Every request is strictly routed FIRST to the student's assigned Mentor.
   */
  public createStudentRequest(
    params: {
      category: StudentRequestCategory;
      subjectId?: string;
      subject: string; // Title / Subject Line
      description: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      attachments?: any[];
      preferredContact?: string;
    },
    studentUser: User
  ): StudentRequest {
    if (!studentUser) {
      throw new Error('401 Unauthorized: User not authenticated.');
    }

    const students = db.getStudents();
    const student = students.find(
      s => s.id === studentUser.id || 
           s.enrollmentNo === studentUser.enrollmentNo || 
           s.enrollmentNo === studentUser.username ||
           s.email === studentUser.email
    );

    if (!student) {
      throw new Error('Student profile not found.');
    }

    const mentorInfo = this.getStudentMentor(student.id);

    // Generate Request Number: REQ/2026/000001
    const allRequests = this.getAllRequests();
    const seq = String(allRequests.length + 1).padStart(6, '0');
    const requestNo = `REQ/2026/${seq}`;
    const now = new Date().toISOString();

    let subjectCode: string | undefined;
    let subjectName: string | undefined;
    if (params.subjectId) {
      const subj = db.getSubjects().find(s => s.id === params.subjectId || s.code === params.subjectId);
      if (subj) {
        subjectCode = subj.code;
        subjectName = subj.name;
      }
    }

    const initialTimelineItem: StudentRequestTimelineItem = {
      id: `tl-${Date.now()}-1`,
      action: 'REQUEST_SUBMITTED',
      fromUserId: studentUser.id,
      fromUserName: studentUser.name,
      fromUserRole: 'STUDENT',
      toUserId: mentorInfo.mentorId,
      toUserName: mentorInfo.mentorName,
      toUserRole: 'FACULTY_MENTOR',
      timestamp: now,
      remarks: `Student submitted request. Automatically routed to assigned Mentor ${mentorInfo.mentorName}.`,
      isInternalOnly: false,
      status: 'SUBMITTED'
    };

    const newRequest: StudentRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      requestNo,
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      studentEmail: student.email,
      studentPhone: student.phone || studentUser.phone || '',
      departmentId: student.departmentId || '',
      departmentName: student.departmentId ? `Department of ${student.departmentId}` : 'Engineering',
      instituteId: student.instituteId,
      programId: student.programId,
      semesterId: student.semesterId,
      divisionId: student.divisionId,
      category: params.category,
      subjectId: params.subjectId,
      subjectCode,
      subjectName,
      subject: params.subject.trim(),
      description: params.description.trim(),
      priority: params.priority || 'MEDIUM',
      attachments: params.attachments || [],
      preferredContact: params.preferredContact,
      mentorId: mentorInfo.mentorId,
      mentorName: mentorInfo.mentorName,
      mentorEmail: mentorInfo.mentorEmail,
      currentHandler: 'MENTOR',
      currentHandlerId: mentorInfo.mentorId,
      currentHandlerName: mentorInfo.mentorName,
      currentHandlerRole: 'FACULTY_MENTOR',
      status: 'SUBMITTED',
      timeline: [initialTimelineItem],
      createdAt: now,
      updatedAt: now
    };

    this.saveRequest(newRequest);

    // Notify Mentor
    db.addNotification({
      title: `New Student Request: ${requestNo}`,
      message: `Student ${student.name} (${student.enrollmentNo}) submitted request: "${params.subject}". Awaiting your routing decision.`,
      module: 'REQUEST',
      timestamp: now,
      targetRole: 'FACULTY',
      targetUserId: mentorInfo.mentorId,
      linkTab: 'requests'
    });

    return newRequest;
  }

  /**
   * 2. MENTOR ROUTING DECISION
   */
  public routeByMentor(
    requestId: string,
    params: {
      decision: 'ROUTE_TO_SUBJECT_FACULTY' | 'ROUTE_TO_HOD' | 'ROUTE_TO_DEPARTMENT' | 'RESOLVE_DIRECTLY';
      subjectId?: string;
      targetDepartment?: AuthorizedDepartment;
      remarks: string;
    },
    mentorUser: User
  ): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();
    let newStatus: StudentRequestStatus = request.status;
    let nextHandler: HandlerDestinationType = 'MENTOR';
    let nextHandlerId: string | undefined;
    let nextHandlerName: string | undefined;
    let nextHandlerRole: string | undefined;

    if (params.decision === 'ROUTE_TO_SUBJECT_FACULTY') {
      const targetSubjId = params.subjectId || request.subjectId;
      if (!targetSubjId) {
        throw new Error('Please select a subject to route to the subject faculty.');
      }
      const fac = this.getSubjectFaculty(targetSubjId);
      newStatus = 'FORWARDED_TO_FACULTY';
      nextHandler = 'SUBJECT_FACULTY';
      nextHandlerId = fac.facultyId;
      nextHandlerName = fac.facultyName;
      nextHandlerRole = 'SUBJECT_FACULTY';
      request.assignedFacultyId = fac.facultyId;
      request.assignedFacultyName = fac.facultyName;
      request.subjectId = targetSubjId;
    } else if (params.decision === 'ROUTE_TO_HOD') {
      const hod = this.getDepartmentHod(request.departmentId);
      newStatus = 'FORWARDED_TO_HOD';
      nextHandler = 'HOD';
      nextHandlerId = hod.hodId;
      nextHandlerName = hod.hodName;
      nextHandlerRole = 'HOD';
      request.assignedHodId = hod.hodId;
      request.assignedHodName = hod.hodName;
    } else if (params.decision === 'ROUTE_TO_DEPARTMENT') {
      if (!params.targetDepartment) {
        throw new Error('Please select an authorized target department.');
      }
      newStatus = 'FORWARDED_TO_DEPARTMENT';
      nextHandler = 'DEPARTMENT';
      request.targetDepartment = params.targetDepartment;
      nextHandlerName = params.targetDepartment.replace(/_/g, ' ');
      nextHandlerRole = params.targetDepartment;
    } else if (params.decision === 'RESOLVE_DIRECTLY') {
      newStatus = 'COMPLETED';
      nextHandler = 'MENTOR';
      request.resolutionSummary = params.remarks;
      request.resolvedByRole = 'FACULTY_MENTOR';
      request.resolvedByName = mentorUser.name;
      request.resolvedAt = now;
      request.completedAt = now;
    }

    const timelineItem: StudentRequestTimelineItem = {
      id: `tl-${Date.now()}`,
      action: params.decision,
      fromUserId: mentorUser.id,
      fromUserName: mentorUser.name,
      fromUserRole: 'FACULTY_MENTOR',
      toUserId: nextHandlerId,
      toUserName: nextHandlerName,
      toUserRole: nextHandlerRole,
      timestamp: now,
      remarks: params.remarks,
      isInternalOnly: false,
      status: newStatus
    };

    request.status = newStatus;
    request.currentHandler = nextHandler;
    request.currentHandlerId = nextHandlerId;
    request.currentHandlerName = nextHandlerName;
    request.currentHandlerRole = nextHandlerRole;
    request.timeline.push(timelineItem);
    request.updatedAt = now;

    this.saveRequest(request);

    // Create Notification for recipient
    if (nextHandlerId) {
      db.addNotification({
        title: `Student Request Routed: ${request.requestNo}`,
        message: `Mentor ${mentorUser.name} routed student request "${request.subject}" to you. Remarks: ${params.remarks}`,
        module: 'REQUEST',
        timestamp: now,
        targetUserId: nextHandlerId,
        linkTab: 'requests'
      });
    }

    return request;
  }

  /**
   * 3. START WORK (Faculty / HOD / HOI / Department)
   */
  public startWork(requestId: string, user: User): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();
    request.status = 'WORK_IN_PROGRESS';
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'START_WORK',
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: user.role,
      timestamp: now,
      remarks: `${user.name} (${user.role}) commenced investigation / work on this request.`,
      isInternalOnly: false,
      status: 'WORK_IN_PROGRESS'
    });

    this.saveRequest(request);
    return request;
  }

  /**
   * 4. HOD FORWARD TO HOI
   */
  public hodForwardToHoi(requestId: string, remarks: string, hodUser: User): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();
    const hoi = this.getInstituteHoi(request.instituteId);

    request.status = 'FORWARDED_TO_HOI';
    request.currentHandler = 'HOI';
    request.currentHandlerId = hoi.hoiId;
    request.currentHandlerName = hoi.hoiName;
    request.currentHandlerRole = 'PRINCIPAL';
    request.assignedHoiId = hoi.hoiId;
    request.assignedHoiName = hoi.hoiName;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'HOD_FORWARD_TO_HOI',
      fromUserId: hodUser.id,
      fromUserName: hodUser.name,
      fromUserRole: 'HOD',
      toUserId: hoi.hoiId,
      toUserName: hoi.hoiName,
      toUserRole: 'PRINCIPAL',
      timestamp: now,
      remarks,
      isInternalOnly: false,
      status: 'FORWARDED_TO_HOI'
    });

    this.saveRequest(request);

    // 1. Notify HOI: ACTION_REQUIRED
    db.addNotification({
      type: 'ACTION_REQUIRED',
      title: `Escalated Student Request: ${request.requestNo}`,
      message: `HOD ${hodUser.name} escalated request "${request.subject}" to Principal / HOI. Remarks: ${remarks}`,
      module: 'REQUEST',
      targetUserId: hoi.hoiId,
      targetRole: 'PRINCIPAL',
      targetInstituteId: request.instituteId,
      referenceId: request.requestNo,
      referenceType: 'STUDENT_REQUEST',
      linkTab: 'requests',
      priority: 'HIGH'
    });

    // 2. Notify Student: STATUS_UPDATE
    db.addNotification({
      type: 'STATUS_UPDATE',
      title: `Request Escalated to Principal: ${request.requestNo}`,
      message: `Your request "${request.subject}" has been forwarded to Principal / HOI (${hoi.hoiName}) for review.`,
      module: 'REQUEST',
      targetUserId: request.studentId,
      referenceId: request.requestNo,
      referenceType: 'STUDENT_REQUEST',
      linkTab: 'requests'
    });

    return request;
  }

  /**
   * 5. WORK RESOLVED BY FACULTY / HOD / HOI / DEPARTMENT
   * CRITICAL REQUIREMENT: Request MUST return to the student's original Mentor!
   */
  public resolveWork(
    requestId: string,
    params: {
      resolutionSummary: string;
      remarks: string;
    },
    user: User
  ): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();

    // Map status based on who resolved it
    let resolvedStatus: StudentRequestStatus = 'RESOLVED';
    if (request.currentHandler === 'SUBJECT_FACULTY') resolvedStatus = 'RESOLVED_BY_FACULTY';
    else if (request.currentHandler === 'HOD') resolvedStatus = 'RESOLVED_BY_HOD';
    else if (request.currentHandler === 'HOI') resolvedStatus = 'RESOLVED_BY_HOI';
    else if (request.currentHandler === 'DEPARTMENT') resolvedStatus = 'RESOLVED_BY_DEPARTMENT';

    // Must return to student's original Mentor
    request.status = 'RETURNED_TO_MENTOR';
    request.currentHandler = 'MENTOR';
    request.currentHandlerId = request.mentorId;
    request.currentHandlerName = request.mentorName;
    request.currentHandlerRole = 'FACULTY_MENTOR';

    request.resolutionSummary = params.resolutionSummary;
    request.resolvedByRole = user.role;
    request.resolvedByName = user.name;
    request.resolvedAt = now;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'WORK_COMPLETED_RETURN_TO_MENTOR',
      fromUserId: user.id,
      fromUserName: user.name,
      fromUserRole: user.role,
      toUserId: request.mentorId,
      toUserName: request.mentorName,
      toUserRole: 'FACULTY_MENTOR',
      timestamp: now,
      remarks: `Work completed by ${user.name} (${user.role}). Resolution: "${params.resolutionSummary}". Request returned to Mentor for final review.`,
      isInternalOnly: false,
      status: 'RETURNED_TO_MENTOR'
    });

    this.saveRequest(request);

    // Notify Mentor
    db.addNotification({
      title: `Student Request Completed: ${request.requestNo}`,
      message: `${user.name} (${user.role}) has completed work on "${request.subject}". Please review and mark completed or request rework.`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.mentorId,
      linkTab: 'requests'
    });

    return request;
  }

  /**
   * 6. MENTOR FINAL REVIEW (MARK COMPLETED OR REQUEST REWORK)
   */
  public mentorReview(
    requestId: string,
    params: {
      action: 'MARK_COMPLETED' | 'REQUEST_REWORK';
      remarks: string;
    },
    mentorUser: User
  ): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();

    if (params.action === 'MARK_COMPLETED') {
      request.status = 'COMPLETED';
      request.completedAt = now;
      request.updatedAt = now;

      request.timeline.push({
        id: `tl-${Date.now()}`,
        action: 'MENTOR_MARKED_COMPLETED',
        fromUserId: mentorUser.id,
        fromUserName: mentorUser.name,
        fromUserRole: 'FACULTY_MENTOR',
        toUserId: request.studentId,
        toUserName: request.studentName,
        toUserRole: 'STUDENT',
        timestamp: now,
        remarks: params.remarks || 'Mentor reviewed the resolution and verified request completion.',
        isInternalOnly: false,
        status: 'COMPLETED'
      });

      this.saveRequest(request);

      // Notify Student
      db.addNotification({
        title: `Your Request is Resolved: ${request.requestNo}`,
        message: `Your request "${request.subject}" has been marked completed by your mentor ${mentorUser.name}. Please review and confirm resolution.`,
        module: 'REQUEST',
        timestamp: now,
        targetUserId: request.studentId,
        linkTab: 'requests'
      });
    } else if (params.action === 'REQUEST_REWORK') {
      request.status = 'RETURNED_FOR_REWORK';
      request.reworkRemarks = params.remarks;
      request.updatedAt = now;

      request.timeline.push({
        id: `tl-${Date.now()}`,
        action: 'MENTOR_REQUESTED_REWORK',
        fromUserId: mentorUser.id,
        fromUserName: mentorUser.name,
        fromUserRole: 'FACULTY_MENTOR',
        timestamp: now,
        remarks: `Mentor requested rework: "${params.remarks}".`,
        isInternalOnly: false,
        status: 'RETURNED_FOR_REWORK'
      });

      this.saveRequest(request);
    }

    return request;
  }

  /**
   * 7. STUDENT CONFIRM RESOLUTION
   */
  public studentConfirmResolution(requestId: string, studentUser: User): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    const now = new Date().toISOString();
    request.status = 'COMPLETED';
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'STUDENT_CONFIRMED_RESOLUTION',
      fromUserId: studentUser.id,
      fromUserName: studentUser.name,
      fromUserRole: 'STUDENT',
      timestamp: now,
      remarks: 'Student confirmed resolution and closed request.',
      isInternalOnly: false,
      status: 'COMPLETED'
    });

    this.saveRequest(request);
    return request;
  }

  /**
   * 8. STUDENT REOPEN REQUEST
   */
  public studentReopenRequest(requestId: string, reason: string, studentUser: User): StudentRequest {
    const request = this.getRequestById(requestId);
    if (!request) throw new Error('Request not found.');

    if (!reason.trim()) {
      throw new Error('Please provide a reason for reopening the request.');
    }

    const now = new Date().toISOString();
    request.status = 'REOPENED';
    request.currentHandler = 'MENTOR';
    request.currentHandlerId = request.mentorId;
    request.currentHandlerName = request.mentorName;
    request.currentHandlerRole = 'FACULTY_MENTOR';
    request.reopenReason = reason.trim();
    request.reopenCount = (request.reopenCount || 0) + 1;
    request.reopenedAt = now;
    request.updatedAt = now;

    request.timeline.push({
      id: `tl-${Date.now()}`,
      action: 'STUDENT_REOPENED_REQUEST',
      fromUserId: studentUser.id,
      fromUserName: studentUser.name,
      fromUserRole: 'STUDENT',
      toUserId: request.mentorId,
      toUserName: request.mentorName,
      toUserRole: 'FACULTY_MENTOR',
      timestamp: now,
      remarks: `Student reopened request. Reason: "${reason.trim()}". Returned to Mentor for reassessment.`,
      isInternalOnly: false,
      status: 'REOPENED'
    });

    this.saveRequest(request);

    // Notify Mentor
    db.addNotification({
      title: `Student Reopened Request: ${request.requestNo}`,
      message: `Student ${studentUser.name} reopened request "${request.subject}". Reason: ${reason.trim()}`,
      module: 'REQUEST',
      timestamp: now,
      targetUserId: request.mentorId,
      linkTab: 'requests'
    });

    return request;
  }

  /**
   * Role-based Request Scoping & Privacy Access Control
   */
  public getScopedRequests(user?: User | null, role?: UserRole | null): StudentRequest[] {
    const all = this.getAllRequests();
    if (!user || !role) return [];

    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
      return all;
    }

    if (role === 'STUDENT') {
      // Privacy Rule: Student only sees their own requests
      return all.filter(r => 
        r.studentId === user.id || 
        r.enrollmentNo === user.enrollmentNo ||
        r.studentEmail === user.email
      );
    }

    if (role === 'FACULTY') {
      // Faculty sees requests where they are the assigned Mentor OR assigned Subject Faculty
      return all.filter(r => 
        r.mentorId === user.id || 
        r.mentorEmail === user.email ||
        r.assignedFacultyId === user.id ||
        r.currentHandlerId === user.id
      );
    }

    if (role === 'HOD') {
      // HOD sees department student requests
      return all.filter(r => 
        r.departmentId === user.departmentId ||
        r.assignedHodId === user.id ||
        r.currentHandlerId === user.id
      );
    }

    if (role === 'PRINCIPAL') {
      // Principal sees institute requests and HOI escalations
      return all.filter(r => 
        r.instituteId === user.instituteId ||
        r.assignedHoiId === user.id ||
        r.currentHandlerRole === 'PRINCIPAL'
      );
    }

    // Specific Administrative Offices
    return all.filter(r => 
      r.targetDepartment === (role as any) ||
      r.currentHandlerRole === (role as any)
    );
  }

  /**
   * Data storage helpers
   */
  public getAllRequests(): StudentRequest[] {
    return db.getState()?.studentRequests || [];
  }

  public getRequestById(id: string): StudentRequest | undefined {
    return this.getAllRequests().find(r => r.id === id || r.requestNo === id);
  }

  private saveRequest(request: StudentRequest): void {
    const state = db.getState();
    if (!state.studentRequests) {
      state.studentRequests = [];
    }
    const idx = state.studentRequests.findIndex((r: StudentRequest) => r.id === request.id);
    if (idx >= 0) {
      state.studentRequests[idx] = request;
    } else {
      state.studentRequests.unshift(request);
    }
    (db as any).saveState?.();
  }
}

export const studentRequestService = new CentralStudentRequestService();
