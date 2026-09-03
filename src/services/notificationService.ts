import { db } from './db';
import { 
  ERPNotification, 
  NotificationType, 
  NotificationScopeType, 
  NotificationRecipientRecord,
  User, 
  UserRole,
  Student,
  Faculty
} from '../types';

export interface CreateTargetedNotificationParams {
  type?: NotificationType;
  title: string;
  message: string;
  module: string;
  referenceId?: string;
  referenceType?: string;
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'NORMAL' | 'LOW';
  scopeType?: NotificationScopeType;
  // Specific targets
  targetUserId?: string;
  targetUserIds?: string[];
  targetRole?: UserRole | 'ALL';
  targetInstituteId?: string;
  targetDepartmentId?: string;
  targetProgramId?: string;
  targetSemesterId?: string;
  targetDivisionId?: string;
  targetAcademicYearId?: string;
  linkTab?: string;
  actionUrl?: string;
  actionLabel?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdBy?: string;
  examId?: string;
  examName?: string;
  examNotificationType?: any;
}

class NotificationService {
  /**
   * Central entry point to create and deliver targeted notifications
   */
  public createNotification(params: CreateTargetedNotificationParams): ERPNotification {
    const scopeType: NotificationScopeType = params.scopeType || 'TARGETED';
    const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    // 1. Resolve exact target recipient user IDs
    const resolvedUserIds = this.resolveRecipients({
      ...params,
      scopeType
    });

    // 2. Duplicate prevention: Check for duplicate notification within last 3 minutes
    const stateNotifs = db.getState().notifications || [];
    if (params.referenceId && resolvedUserIds.length > 0) {
      const duplicate = stateNotifs.find(n => 
        n.referenceId === params.referenceId &&
        n.title === params.title &&
        (n.targetUserId === params.targetUserId || (n.recipients && n.recipients.some(r => resolvedUserIds.includes(r.userId)))) &&
        (new Date().getTime() - new Date(n.createdAt).getTime()) < 3 * 60 * 1000
      );
      if (duplicate) {
        // Already recently sent; avoid spamming
        return duplicate;
      }
    }

    // 3. Build Notification Recipients records
    const recipients: NotificationRecipientRecord[] = resolvedUserIds.map(uId => {
      const uObj = db.getUsers().find(u => u.id === uId);
      return {
        id: `recip-${Date.now()}-${uId}`,
        notificationId: notifId,
        userId: uId,
        userRole: uObj?.role,
        deliveredAt: now,
        isRead: false
      };
    });

    const newNotification: ERPNotification = {
      id: notifId,
      type: params.type || (params.targetRole === 'ALL' ? 'INFORMATION' : 'STATUS_UPDATE'),
      title: params.title,
      message: params.message,
      module: params.module,
      timestamp: 'Just now',
      createdAt: now,
      isReadByUsers: [],
      recipients,
      scopeType,
      referenceId: params.referenceId,
      referenceType: params.referenceType,
      targetRole: params.targetRole,
      targetInstituteId: params.targetInstituteId,
      targetDepartmentId: params.targetDepartmentId,
      targetProgramId: params.targetProgramId,
      targetSemesterId: params.targetSemesterId,
      targetDivisionId: params.targetDivisionId,
      targetAcademicYearId: params.targetAcademicYearId,
      targetUserId: params.targetUserId || (resolvedUserIds.length === 1 ? resolvedUserIds[0] : undefined),
      targetUserIds: resolvedUserIds,
      linkTab: params.linkTab,
      actionUrl: params.actionUrl,
      actionLabel: params.actionLabel,
      priority: params.priority || 'NORMAL',
      attachmentName: params.attachmentName,
      attachmentUrl: params.attachmentUrl,
      createdBy: params.createdBy,
      examId: params.examId,
      examName: params.examName,
      examNotificationType: params.examNotificationType
    };

    if (!db.getState().notifications) {
      db.getState().notifications = [];
    }
    db.getState().notifications.unshift(newNotification);
    db.saveState();

    return newNotification;
  }

  /**
   * Resolve exact target user IDs based on scope and role criteria
   */
  private resolveRecipients(params: CreateTargetedNotificationParams): string[] {
    const allUsers = db.getUsers();
    const recipientSet = new Set<string>();

    // 1. Direct explicit user IDs
    if (params.targetUserId) {
      recipientSet.add(params.targetUserId);
    }
    if (params.targetUserIds && params.targetUserIds.length > 0) {
      params.targetUserIds.forEach(id => {
        if (id) recipientSet.add(id);
      });
    }

    // If explicit users were given and scope is TARGETED with no additional role broadcast, return immediately
    if (recipientSet.size > 0 && (!params.targetRole || params.targetRole !== 'ALL') && params.scopeType === 'TARGETED') {
      return Array.from(recipientSet);
    }

    // 2. Global University-Wide Broadcast (explicitly configured)
    if (params.scopeType === 'UNIVERSITY_WIDE') {
      allUsers.forEach(u => {
        if (!params.targetRole || params.targetRole === 'ALL' || u.role === params.targetRole) {
          recipientSet.add(u.id);
        }
      });
      return Array.from(recipientSet);
    }

    // 3. Institute-Wide Broadcast (explicitly configured)
    if (params.scopeType === 'INSTITUTE_WIDE' && params.targetInstituteId) {
      allUsers.forEach(u => {
        const student = u.role === 'STUDENT' ? db.getStudents().find(s => s.id === u.id || s.email === u.email) : null;
        const instId = u.instituteId || student?.instituteId;
        if (instId === params.targetInstituteId) {
          if (!params.targetRole || params.targetRole === 'ALL' || u.role === params.targetRole) {
            recipientSet.add(u.id);
          }
        }
      });
      return Array.from(recipientSet);
    }

    // 4. Department-Wide Broadcast (explicitly configured)
    if (params.scopeType === 'DEPARTMENT_WIDE' && params.targetDepartmentId) {
      allUsers.forEach(u => {
        const student = u.role === 'STUDENT' ? db.getStudents().find(s => s.id === u.id || s.email === u.email) : null;
        const deptId = u.departmentId || student?.departmentId;
        const instId = u.instituteId || student?.instituteId;
        if (deptId === params.targetDepartmentId) {
          if (!params.targetInstituteId || instId === params.targetInstituteId) {
            if (!params.targetRole || params.targetRole === 'ALL' || u.role === params.targetRole) {
              recipientSet.add(u.id);
            }
          }
        }
      });
      return Array.from(recipientSet);
    }

    // 5. Targeted Role + Organization Filter (Strict matching)
    if (params.targetRole && params.targetRole !== 'ALL') {
      allUsers.forEach(u => {
        if (u.role !== params.targetRole) return;

        const student = u.role === 'STUDENT' ? db.getStudents().find(s => s.id === u.id || s.email === u.email) : null;
        const userInst = u.instituteId || student?.instituteId;
        const userDept = u.departmentId || student?.departmentId;

        // Verify institute filter
        if (params.targetInstituteId && userInst && userInst !== params.targetInstituteId) {
          return;
        }

        // Verify department filter
        if (params.targetDepartmentId && userDept && userDept !== params.targetDepartmentId) {
          return;
        }

        // Verify academic program / semester filter for students
        if (student) {
          if (params.targetProgramId && student.programId !== params.targetProgramId) return;
          if (params.targetSemesterId && student.semesterId !== params.targetSemesterId) return;
          if (params.targetDivisionId && student.divisionId !== params.targetDivisionId) return;
          if (params.targetAcademicYearId && student.academicYearId !== params.targetAcademicYearId) return;
        }

        recipientSet.add(u.id);
      });
    }

    return Array.from(recipientSet);
  }

  /**
   * Retrieve ONLY notifications targeted to the authenticated user
   */
  public getNotificationsForUser(user: User | null, role?: UserRole | null): ERPNotification[] {
    if (!user) return [];
    const userId = user.id;
    const userRole = role || user.role;

    const student = userRole === 'STUDENT' 
      ? db.getStudents().find(s => s.id === userId || s.email === user.email || s.enrollmentNo === user.enrollmentNo) 
      : null;
    const userInstId = user.instituteId || student?.instituteId;
    const userDeptId = user.departmentId || student?.departmentId;
    const userProgId = student?.programId;
    const userSemId = student?.semesterId;
    const userDivId = student?.divisionId;
    const userAYId = student?.academicYearId;

    const allNotifs = db.getState().notifications || [];

    return allNotifs.filter(n => {
      // 1. Direct Recipient check
      if (n.recipients && n.recipients.length > 0) {
        return n.recipients.some(r => r.userId === userId);
      }

      // 2. Direct Target User Match
      if (n.targetUserId) {
        return n.targetUserId === userId;
      }
      if (n.targetUserIds && n.targetUserIds.length > 0) {
        return n.targetUserIds.includes(userId);
      }

      // 3. If it's a TARGETED notification with NO matching user ID, do NOT show to random users
      if (n.scopeType === 'TARGETED' && !n.targetRole && !n.targetInstituteId && !n.targetDepartmentId) {
        return false;
      }

      // 4. University-Wide Broadcast (explicitly marked)
      if (n.scopeType === 'UNIVERSITY_WIDE') {
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 5. Institute-Wide Broadcast
      if (n.scopeType === 'INSTITUTE_WIDE') {
        if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) {
          return false;
        }
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 6. Department-Wide Broadcast
      if (n.scopeType === 'DEPARTMENT_WIDE') {
        if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) return false;
        if (n.targetDepartmentId && userDeptId && n.targetDepartmentId !== userDeptId) return false;
        if (!n.targetRole || n.targetRole === 'ALL' || n.targetRole === userRole) {
          return true;
        }
        return false;
      }

      // 7. Role + Organization Strict Match
      if (n.targetRole && n.targetRole !== 'ALL') {
        if (n.targetRole !== userRole) {
          // Check super admin equivalence
          if ((n.targetRole === 'SUPER_ADMIN' || n.targetRole === 'UNIVERSITY_ADMIN') && 
              (userRole === 'SUPER_ADMIN' || userRole === 'UNIVERSITY_ADMIN')) {
            // Match
          } else {
            return false;
          }
        }

        // Validate Institute constraint
        if (n.targetInstituteId && userInstId && n.targetInstituteId !== userInstId) {
          return false;
        }

        // Validate Department constraint
        if (n.targetDepartmentId && userDeptId && n.targetDepartmentId !== userDeptId) {
          return false;
        }

        // Validate Student specific constraints
        if (student) {
          if (n.targetProgramId && userProgId && n.targetProgramId !== userProgId) return false;
          if (n.targetSemesterId && userSemId && n.targetSemesterId !== userSemId) return false;
          if (n.targetDivisionId && userDivId && n.targetDivisionId !== userDivId) return false;
          if (n.targetAcademicYearId && userAYId && n.targetAcademicYearId !== userAYId) return false;
        }

        // If targetRole matched and organizational constraints matched:
        return true;
      }

      return false;
    });
  }

  /**
   * Mark notification as read for the authenticated user only
   */
  public markAsRead(notificationId: string, userId: string): void {
    const list = db.getState().notifications || [];
    const notif = list.find(n => n.id === notificationId);
    if (!notif) return;

    if (!notif.isReadByUsers) notif.isReadByUsers = [];
    if (!notif.isReadByUsers.includes(userId)) {
      notif.isReadByUsers.push(userId);
    }

    if (notif.recipients) {
      const recip = notif.recipients.find(r => r.userId === userId);
      if (recip) {
        recip.isRead = true;
        recip.readAt = new Date().toISOString();
      }
    }

    db.saveState();
  }

  /**
   * Mark all notifications as read for the authenticated user only
   */
  public markAllAsRead(user: User | null, role?: UserRole | null): void {
    if (!user) return;
    const userNotifs = this.getNotificationsForUser(user, role);
    const now = new Date().toISOString();

    userNotifs.forEach(n => {
      if (!n.isReadByUsers) n.isReadByUsers = [];
      if (!n.isReadByUsers.includes(user.id)) {
        n.isReadByUsers.push(user.id);
      }
      if (n.recipients) {
        const recip = n.recipients.find(r => r.userId === user.id);
        if (recip) {
          recip.isRead = true;
          recip.readAt = now;
        }
      }
    });

    db.saveState();
  }

  /**
   * Get unread count for the authenticated user only
   */
  public getUnreadCount(user: User | null, role?: UserRole | null): number {
    if (!user) return 0;
    const userNotifs = this.getNotificationsForUser(user, role);
    return userNotifs.filter(n => !(n.isReadByUsers || []).includes(user.id)).length;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // DOMAIN-SPECIFIC WORKFLOW NOTIFICATION HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * 1. HOSTEL VISIT PERMISSION NOTIFICATIONS
   */
  public notifyHostelVisitorPass(params: {
    visitorName: string;
    passNumber: string;
    studentId?: string;
    studentName: string;
    hostelBlock: string;
    roomNo: string;
    action: 'REGISTERED' | 'APPROVED' | 'REJECTED' | 'ENTRY' | 'EXIT';
    remarks?: string;
    wardenUserId?: string;
    instituteId?: string;
  }) {
    const warden = db.getUsers().find(u => u.role === 'HOSTEL_ADMIN' && (!params.instituteId || u.instituteId === params.instituteId));

    if (params.action === 'REGISTERED') {
      // 1. Notify Student: Status update
      if (params.studentId) {
        this.createNotification({
          type: 'STATUS_UPDATE',
          title: `Visitor Pass Issued: ${params.passNumber}`,
          message: `Visitor ${params.visitorName} has been registered to visit your room (${params.hostelBlock} - ${params.roomNo}).`,
          module: 'HOSTEL',
          targetUserId: params.studentId,
          referenceId: params.passNumber,
          referenceType: 'HOSTEL_VISITOR',
          linkTab: 'student-hostel'
        });
      }

      // 2. Notify Hostel Warden: Action / Monitoring
      if (warden || params.wardenUserId) {
        this.createNotification({
          type: 'INFORMATION',
          title: `Hostel Visitor Registered: ${params.passNumber}`,
          message: `Visitor ${params.visitorName} visiting student ${params.studentName} (${params.hostelBlock} - Room ${params.roomNo}).`,
          module: 'HOSTEL',
          targetUserId: params.wardenUserId || warden?.id,
          targetRole: 'HOSTEL_ADMIN',
          targetInstituteId: params.instituteId,
          referenceId: params.passNumber,
          referenceType: 'HOSTEL_VISITOR',
          linkTab: 'hostel-admin'
        });
      }
    } else if (params.action === 'APPROVED') {
      if (params.studentId) {
        this.createNotification({
          type: 'SUCCESS',
          title: `Visitor Pass Approved: ${params.passNumber}`,
          message: `Visit for ${params.visitorName} has been approved by Hostel Warden.`,
          module: 'HOSTEL',
          targetUserId: params.studentId,
          referenceId: params.passNumber,
          referenceType: 'HOSTEL_VISITOR',
          linkTab: 'student-hostel'
        });
      }
    } else if (params.action === 'REJECTED') {
      if (params.studentId) {
        this.createNotification({
          type: 'REJECTION',
          title: `Visitor Pass Rejected: ${params.passNumber}`,
          message: `Visit for ${params.visitorName} was rejected. Reason: ${params.remarks || 'Security Guidelines'}`,
          module: 'HOSTEL',
          targetUserId: params.studentId,
          referenceId: params.passNumber,
          referenceType: 'HOSTEL_VISITOR',
          linkTab: 'student-hostel'
        });
      }
    }
  }

  /**
   * 2. HOSTEL MAINTENANCE NOTIFICATIONS
   */
  public notifyHostelMaintenance(params: {
    requestNo: string;
    studentId: string;
    studentName: string;
    category: string;
    roomNumber: string;
    hostelName: string;
    action: 'CREATED' | 'ASSIGNED' | 'RESOLVED' | 'REOPENED' | 'CLOSED';
    assignedStaffId?: string;
    assignedStaffName?: string;
    remarks?: string;
    instituteId?: string;
  }) {
    const warden = db.getUsers().find(u => u.role === 'HOSTEL_ADMIN' && (!params.instituteId || u.instituteId === params.instituteId));

    if (params.action === 'CREATED') {
      // 1. Notify Student: Request Submitted
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Maintenance Request Submitted: ${params.requestNo}`,
        message: `Your ${params.category} maintenance request for Room ${params.roomNumber} has been logged.`,
        module: 'HOSTEL',
        targetUserId: params.studentId,
        referenceId: params.requestNo,
        referenceType: 'HOSTEL_MAINTENANCE',
        linkTab: 'student-hostel'
      });

      // 2. Notify Warden: Action Required
      if (warden) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `New Maintenance Request: ${params.requestNo}`,
          message: `${params.category} reported in ${params.hostelName} Room ${params.roomNumber} by ${params.studentName}. Awaiting staff assignment.`,
          module: 'HOSTEL',
          targetUserId: warden.id,
          referenceId: params.requestNo,
          referenceType: 'HOSTEL_MAINTENANCE',
          linkTab: 'hostel-admin',
          priority: 'HIGH'
        });
      }
    } else if (params.action === 'ASSIGNED') {
      // 1. Notify Assigned Maintenance Staff: ACTION REQUIRED
      if (params.assignedStaffId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Assigned Maintenance Task: ${params.requestNo}`,
          message: `You have been assigned ${params.category} maintenance task for ${params.hostelName} Room ${params.roomNumber}. Remarks: ${params.remarks || 'Immediate action'}`,
          module: 'HOSTEL',
          targetUserId: params.assignedStaffId,
          referenceId: params.requestNo,
          referenceType: 'HOSTEL_MAINTENANCE',
          linkTab: 'maintenance'
        });
      }

      // 2. Notify Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Maintenance Assigned: ${params.requestNo}`,
        message: `Your maintenance request has been assigned to technician ${params.assignedStaffName || 'Maintenance Staff'}.`,
        module: 'HOSTEL',
        targetUserId: params.studentId,
        referenceId: params.requestNo,
        referenceType: 'HOSTEL_MAINTENANCE',
        linkTab: 'student-hostel'
      });

      // 3. Notify Warden: STATUS UPDATE
      if (warden) {
        this.createNotification({
          type: 'STATUS_UPDATE',
          title: `Maintenance Request Assigned: ${params.requestNo}`,
          message: `Ticket ${params.requestNo} assigned to ${params.assignedStaffName}.`,
          module: 'HOSTEL',
          targetUserId: warden.id,
          referenceId: params.requestNo,
          referenceType: 'HOSTEL_MAINTENANCE',
          linkTab: 'hostel-admin'
        });
      }
    } else if (params.action === 'RESOLVED') {
      // Notify Student: ACTION REQUIRED / SUCCESS (to verify & confirm)
      this.createNotification({
        type: 'SUCCESS',
        title: `Maintenance Resolved: ${params.requestNo}`,
        message: `Your maintenance ticket for Room ${params.roomNumber} has been resolved by technician. Please verify and confirm resolution.`,
        module: 'HOSTEL',
        targetUserId: params.studentId,
        referenceId: params.requestNo,
        referenceType: 'HOSTEL_MAINTENANCE',
        linkTab: 'student-hostel'
      });

      // Notify Warden: STATUS UPDATE
      if (warden) {
        this.createNotification({
          type: 'STATUS_UPDATE',
          title: `Maintenance Resolved: ${params.requestNo}`,
          message: `Ticket ${params.requestNo} (${params.category}) marked resolved. Awaiting student verification.`,
          module: 'HOSTEL',
          targetUserId: warden.id,
          referenceId: params.requestNo,
          referenceType: 'HOSTEL_MAINTENANCE',
          linkTab: 'hostel-admin'
        });
      }
    }
  }

  /**
   * 3. EXAM NOTIFICATIONS (FORM, HALL TICKET, RESULT)
   */
  public notifyExamLifecycle(params: {
    examName: string;
    studentId?: string;
    studentName?: string;
    action: 'FORM_OPEN' | 'FORM_SUBMITTED' | 'FORM_APPROVED' | 'FORM_REJECTED' | 'HALL_TICKET' | 'RESULT_DECLARED';
    instituteId?: string;
    departmentId?: string;
    programId?: string;
    semesterId?: string;
    remarks?: string;
    examControllerUserId?: string;
  }) {
    if (params.action === 'FORM_OPEN') {
      // Targeted ONLY to eligible students of this institute/dept/program/sem
      this.createNotification({
        type: 'DEADLINE',
        title: `Exam Form Open: ${params.examName}`,
        message: `Regular / Remedial examination form for ${params.examName} is now open. Submit before deadline.`,
        module: 'EXAM',
        targetRole: 'STUDENT',
        targetInstituteId: params.instituteId,
        targetDepartmentId: params.departmentId,
        targetProgramId: params.programId,
        targetSemesterId: params.semesterId,
        linkTab: 'exam-forms',
        priority: 'HIGH'
      });
    } else if (params.action === 'FORM_SUBMITTED') {
      if (params.studentId) {
        this.createNotification({
          type: 'STATUS_UPDATE',
          title: `Exam Form Submitted: ${params.examName}`,
          message: `Your exam form for ${params.examName} has been submitted for scrutiny.`,
          module: 'EXAM',
          targetUserId: params.studentId,
          linkTab: 'exam-forms'
        });
      }
    } else if (params.action === 'FORM_APPROVED') {
      if (params.studentId) {
        this.createNotification({
          type: 'SUCCESS',
          title: `Exam Form Approved: ${params.examName}`,
          message: `Your examination form for ${params.examName} has been verified and approved.`,
          module: 'EXAM',
          targetUserId: params.studentId,
          linkTab: 'exam-forms'
        });
      }
    } else if (params.action === 'FORM_REJECTED') {
      if (params.studentId) {
        this.createNotification({
          type: 'REJECTION',
          title: `Exam Form Rejected: ${params.examName}`,
          message: `Your examination form for ${params.examName} was rejected: ${params.remarks || 'Document Discrepancy'}. Re-submission required.`,
          module: 'EXAM',
          targetUserId: params.studentId,
          linkTab: 'exam-forms',
          priority: 'HIGH'
        });
      }
    } else if (params.action === 'HALL_TICKET') {
      if (params.studentId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Hall Ticket Issued: ${params.examName}`,
          message: `Your examination hall ticket for ${params.examName} has been published. Download and print for entry.`,
          module: 'EXAM',
          targetUserId: params.studentId,
          linkTab: 'exam-hallticket',
          priority: 'HIGH'
        });
      }
    } else if (params.action === 'RESULT_DECLARED') {
      if (params.studentId) {
        this.createNotification({
          type: 'INFORMATION',
          title: `Exam Result Declared: ${params.examName}`,
          message: `Official grade sheet for ${params.examName} has been published. Check your grades online.`,
          module: 'EXAM',
          targetUserId: params.studentId,
          linkTab: 'exam-results'
        });
      }
    }
  }

  /**
   * 4. FEE NOTIFICATIONS
   */
  public notifyFeeLifecycle(params: {
    studentId: string;
    studentName: string;
    amount: number;
    receiptNo?: string;
    action: 'DUE_REMINDER' | 'PAYMENT_RECEIVED' | 'REFUND_PROCESSED';
    feeHead?: string;
  }) {
    if (params.action === 'DUE_REMINDER') {
      this.createNotification({
        type: 'DEADLINE',
        title: `Tuition Fee Due Reminder: ₹${params.amount.toLocaleString('en-IN')}`,
        message: `Semester fee installment of ₹${params.amount.toLocaleString('en-IN')} is due. Pay online to avoid late fee penalty.`,
        module: 'FEES',
        targetUserId: params.studentId,
        linkTab: 'fees',
        priority: 'HIGH'
      });
    } else if (params.action === 'PAYMENT_RECEIVED') {
      this.createNotification({
        type: 'SUCCESS',
        title: `Fee Payment Received: ₹${params.amount.toLocaleString('en-IN')}`,
        message: `Payment of ₹${params.amount.toLocaleString('en-IN')} processed successfully. Receipt No: ${params.receiptNo || 'REC-2026'}.`,
        module: 'FEES',
        targetUserId: params.studentId,
        linkTab: 'fees'
      });
    } else if (params.action === 'REFUND_PROCESSED') {
      this.createNotification({
        type: 'SUCCESS',
        title: `Fee Refund Processed: ₹${params.amount.toLocaleString('en-IN')}`,
        message: `Fee refund of ₹${params.amount.toLocaleString('en-IN')} has been approved and credited.`,
        module: 'FEES',
        targetUserId: params.studentId,
        linkTab: 'fees'
      });
    }
  }

  /**
   * 5. ATTENDANCE NOTIFICATIONS & CONDONATION WORKFLOW
   */
  public notifyAttendanceLifecycle(params: {
    studentId: string;
    studentName: string;
    subjectName: string;
    percentage: number;
    action: 'SHORTAGE_ALERT' | 'APPLICATION_SUBMITTED' | 'FORWARDED_TO_MENTOR' | 'FORWARDED_TO_HOD' | 'FORWARDED_TO_HOI' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED';
    subjectFacultyId?: string;
    mentorId?: string;
    hodUserId?: string;
    hoiUserId?: string;
    remarks?: string;
    applicationNo?: string;
  }) {
    if (params.action === 'SHORTAGE_ALERT') {
      // 1. Notify Student
      this.createNotification({
        type: 'ACTION_REQUIRED',
        title: `Low Attendance Warning: ${params.subjectName} (${params.percentage}%)`,
        message: `Your attendance in ${params.subjectName} is below the mandatory 75% threshold (${params.percentage}%). Submit medical / official leave justification.`,
        module: 'ATTENDANCE',
        targetUserId: params.studentId,
        linkTab: 'attendance',
        priority: 'HIGH'
      });

      // 2. Notify Subject Faculty
      if (params.subjectFacultyId) {
        this.createNotification({
          type: 'INFORMATION',
          title: `Student Attendance Shortage: ${params.studentName}`,
          message: `Student ${params.studentName} has ${params.percentage}% attendance in ${params.subjectName}.`,
          module: 'ATTENDANCE',
          targetUserId: params.subjectFacultyId,
          linkTab: 'attendance'
        });
      }
    } else if (params.action === 'APPLICATION_SUBMITTED') {
      // Subject Faculty: ACTION REQUIRED
      if (params.subjectFacultyId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `New Attendance Condonation: ${params.applicationNo || 'APP'}`,
          message: `Student ${params.studentName} submitted attendance condonation application for ${params.subjectName} (${params.percentage}%). Awaiting your review.`,
          module: 'APPROVAL',
          targetUserId: params.subjectFacultyId,
          linkTab: 'attendance'
        });
      }
      // Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Attendance Application Submitted: ${params.applicationNo || 'APP'}`,
        message: `Your application for ${params.subjectName} has been submitted to Subject Faculty.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    } else if (params.action === 'FORWARDED_TO_MENTOR') {
      // Mentor: ACTION REQUIRED
      if (params.mentorId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Attendance Approval with Mentor: ${params.applicationNo || 'APP'}`,
          message: `Subject Faculty recommended attendance application for ${params.studentName} (${params.subjectName}). Awaiting your Mentor recommendation.`,
          module: 'APPROVAL',
          targetUserId: params.mentorId,
          linkTab: 'requests'
        });
      }
      // Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Attendance Application Update: ${params.applicationNo || 'APP'}`,
        message: `Application endorsed by Subject Faculty and forwarded to your Mentor.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    } else if (params.action === 'FORWARDED_TO_HOD') {
      // HOD: ACTION REQUIRED
      if (params.hodUserId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Attendance Condonation with HOD: ${params.applicationNo || 'APP'}`,
          message: `Mentor endorsed attendance application for ${params.studentName} (${params.subjectName}). Awaiting HOD endorsement.`,
          module: 'APPROVAL',
          targetUserId: params.hodUserId,
          linkTab: 'attendance'
        });
      }
      // Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Attendance Application Update: ${params.applicationNo || 'APP'}`,
        message: `Application endorsed by Mentor and forwarded to Head of Department.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    } else if (params.action === 'FORWARDED_TO_HOI') {
      // HOI: ACTION REQUIRED
      if (params.hoiUserId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Final Attendance Approval (HOI): ${params.applicationNo || 'APP'}`,
          message: `HOD endorsed attendance condonation for ${params.studentName} (${params.subjectName}). Awaiting Principal / HOI sanction.`,
          module: 'APPROVAL',
          targetUserId: params.hoiUserId,
          linkTab: 'attendance'
        });
      }
      // Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Attendance Application with Principal: ${params.applicationNo || 'APP'}`,
        message: `Application forwarded to Principal / HOI for final sanction.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    } else if (params.action === 'APPROVED') {
      this.createNotification({
        type: 'SUCCESS',
        title: `Attendance Application Approved: ${params.applicationNo || 'APP'}`,
        message: `Your attendance condonation application for ${params.subjectName} has been sanctioned. Exam eligibility confirmed.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    } else if (params.action === 'REJECTED') {
      this.createNotification({
        type: 'REJECTION',
        title: `Attendance Application Rejected: ${params.applicationNo || 'APP'}`,
        message: `Your attendance application for ${params.subjectName} was not approved. Remarks: ${params.remarks || 'Inadequate medical evidence'}.`,
        module: 'APPROVAL',
        targetUserId: params.studentId,
        linkTab: 'attendance'
      });
    }
  }

  /**
   * 6. NOTESHEET WORKFLOW NOTIFICATIONS
   */
  public notifyNotesheetWorkflow(params: {
    noteSheetNumber: string;
    subject: string;
    creatorUserId: string;
    currentApproverUserId?: string;
    previousApproverUserId?: string;
    action: 'SUBMITTED' | 'FORWARDED' | 'APPROVED' | 'REJECTED' | 'RETURNED';
    remarks?: string;
    instituteId?: string;
    departmentId?: string;
  }) {
    if (params.action === 'SUBMITTED' || params.action === 'FORWARDED') {
      // 1. Current Approver: ACTION REQUIRED
      if (params.currentApproverUserId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Note Sheet Action Required: ${params.noteSheetNumber}`,
          message: `Note Sheet "${params.subject}" requires your concurrence / endorsement.`,
          module: 'NOTESHEET',
          targetUserId: params.currentApproverUserId,
          referenceId: params.noteSheetNumber,
          referenceType: 'NOTESHEET',
          linkTab: 'notesheet',
          priority: 'HIGH'
        });
      }

      // 2. Creator: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Note Sheet ${params.action === 'SUBMITTED' ? 'Submitted' : 'Forwarded'}: ${params.noteSheetNumber}`,
        message: `Note Sheet "${params.subject}" is currently under review at the next authority level.`,
        module: 'NOTESHEET',
        targetUserId: params.creatorUserId,
        referenceId: params.noteSheetNumber,
        referenceType: 'NOTESHEET',
        linkTab: 'notesheet'
      });

      // 3. Previous Approver: STATUS UPDATE
      if (params.previousApproverUserId && params.previousApproverUserId !== params.creatorUserId) {
        this.createNotification({
          type: 'STATUS_UPDATE',
          title: `Note Sheet Forwarded: ${params.noteSheetNumber}`,
          message: `Note Sheet "${params.subject}" has moved to the next workflow stage.`,
          module: 'NOTESHEET',
          targetUserId: params.previousApproverUserId,
          referenceId: params.noteSheetNumber,
          referenceType: 'NOTESHEET',
          linkTab: 'notesheet'
        });
      }
    } else if (params.action === 'APPROVED') {
      this.createNotification({
        type: 'SUCCESS',
        title: `Note Sheet Approved: ${params.noteSheetNumber}`,
        message: `Note Sheet "${params.subject}" has received final concurrence and approval.`,
        module: 'NOTESHEET',
        targetUserId: params.creatorUserId,
        referenceId: params.noteSheetNumber,
        referenceType: 'NOTESHEET',
        linkTab: 'notesheet'
      });
    } else if (params.action === 'REJECTED' || params.action === 'RETURNED') {
      this.createNotification({
        type: params.action === 'REJECTED' ? 'REJECTION' : 'ACTION_REQUIRED',
        title: `Note Sheet ${params.action === 'REJECTED' ? 'Rejected' : 'Returned'}: ${params.noteSheetNumber}`,
        message: `Note Sheet "${params.subject}" was ${params.action.toLowerCase()}. Remarks: ${params.remarks || 'Clarification needed.'}`,
        module: 'NOTESHEET',
        targetUserId: params.creatorUserId,
        referenceId: params.noteSheetNumber,
        referenceType: 'NOTESHEET',
        linkTab: 'notesheet'
      });
    }
  }

  /**
   * 6.1 NOTESHEET AUTO-REMINDER (3+ DAYS PENDING)
   */
  public notifyNotesheetPendingReminder(params: {
    noteSheetNumber: string;
    subject: string;
    currentOfficerUserId: string;
    currentOfficerName?: string;
    pendingDays: number;
    pendingSinceDate?: string;
    instituteId?: string;
    departmentId?: string;
  }) {
    this.createNotification({
      type: 'ACTION_REQUIRED',
      title: `⚡ Action Required: Notesheet Pending ${params.pendingDays} Days (${params.noteSheetNumber})`,
      message: `Notesheet "${params.subject}" has been awaiting your action for ${params.pendingDays} days (since ${params.pendingSinceDate || 'past 3+ days'}). Please review and endorse at the earliest.`,
      module: 'NOTESHEET',
      targetUserId: params.currentOfficerUserId,
      referenceId: params.noteSheetNumber,
      referenceType: 'NOTESHEET',
      linkTab: 'notesheet',
      priority: 'URGENT'
    });
  }

  /**
   * 7. STUDENT DOCUMENT VERIFICATION
   */
  public notifyDocumentVerification(params: {
    studentId: string;
    studentName: string;
    documentName: string;
    mentorId?: string;
    action: 'UPLOADED' | 'VERIFIED' | 'REJECTED';
    remarks?: string;
  }) {
    if (params.action === 'UPLOADED') {
      // 1. Notify Student: STATUS UPDATE
      this.createNotification({
        type: 'STATUS_UPDATE',
        title: `Document Uploaded: ${params.documentName}`,
        message: `Your document "${params.documentName}" was submitted for mentor verification.`,
        module: 'DOCUMENT',
        targetUserId: params.studentId,
        linkTab: 'student-docs'
      });

      // 2. Notify Mentor: ACTION REQUIRED
      if (params.mentorId) {
        this.createNotification({
          type: 'ACTION_REQUIRED',
          title: `Document Verification Required: ${params.documentName}`,
          message: `Student ${params.studentName} uploaded "${params.documentName}". Please verify authenticity.`,
          module: 'DOCUMENT',
          targetUserId: params.mentorId,
          linkTab: 'student-docs'
        });
      }
    } else if (params.action === 'VERIFIED') {
      this.createNotification({
        type: 'SUCCESS',
        title: `Document Verified & Locked: ${params.documentName}`,
        message: `Your document "${params.documentName}" has been authenticated and locked by your mentor.`,
        module: 'DOCUMENT',
        targetUserId: params.studentId,
        linkTab: 'student-docs'
      });
    } else if (params.action === 'REJECTED') {
      this.createNotification({
        type: 'REJECTION',
        title: `Document Rejected: ${params.documentName}`,
        message: `Your document "${params.documentName}" was rejected: ${params.remarks || 'Illegible upload'}. Please re-upload.`,
        module: 'DOCUMENT',
        targetUserId: params.studentId,
        linkTab: 'student-docs',
        priority: 'HIGH'
      });
    }
  }

  /**
   * Resolve exact navigation target tab and deep-link parameters for any notification
   */
  public resolveNotificationTarget(
    notif: ERPNotification,
    user?: User | null,
    role?: UserRole | null
  ): { tab: string; params: Record<string, any> } {
    if (!notif) return { tab: 'dashboard', params: {} };

    const rawModule = (notif.module || '').toUpperCase();
    const rawRefType = (notif.referenceType || '').toUpperCase();
    const rawType = (notif.type || '').toUpperCase();
    const refId = notif.recordId || notif.referenceId;
    const linkTab = notif.linkTab;

    // 1. NOTESHEET MODULE
    if (
      rawModule === 'NOTESHEET' ||
      rawRefType === 'NOTESHEET' ||
      (linkTab && (linkTab.includes('notesheet') || linkTab === 'note-sheets'))
    ) {
      const isReg = role === 'REGISTRAR' || role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN';
      const defaultTab = isReg ? 'reg-notesheet-pending' : 'notesheet-pending';
      const resolvedTab = (linkTab && linkTab !== 'notesheet' && linkTab !== 'note-sheets') ? linkTab : defaultTab;
      
      const isApprovalAction = rawType === 'APPROVAL_REQUIRED' || rawType === 'ACTION_REQUIRED';
      const actionType = notif.actionType || (isApprovalAction ? 'APPROVE' : 'VIEW');

      return {
        tab: resolvedTab,
        params: {
          recordId: refId,
          notesheetId: refId,
          initialTab: isApprovalAction ? 'PENDING_WITH_ME' : 'REGISTER',
          actionType,
          ...notif.targetParams
        }
      };
    }

    // 2. APPROVAL / DIGITAL REQUESTS
    if (
      rawModule === 'REQUEST' ||
      rawModule === 'APPROVAL' ||
      rawRefType === 'REQUEST' ||
      linkTab === 'requests' ||
      linkTab?.startsWith('reg-requests') ||
      linkTab?.startsWith('reg-approvals')
    ) {
      return {
        tab: linkTab || 'requests',
        params: {
          recordId: refId,
          requestId: refId,
          initialCategory: notif.referenceType || 'ALL',
          initialQueue: 'PENDING_MY_ACTION',
          actionType: notif.actionType || 'REVIEW',
          ...notif.targetParams
        }
      };
    }

    // 3. HOSTEL MODULE
    if (
      rawModule === 'HOSTEL' ||
      rawRefType === 'HOSTEL' ||
      linkTab === 'hostel-admin' ||
      linkTab === 'hostel-requests'
    ) {
      return {
        tab: 'hostel-admin',
        params: {
          recordId: refId,
          subFilter: 'MAINTENANCE',
          actionType: notif.actionType || 'APPROVE',
          ...notif.targetParams
        }
      };
    }

    // 4. EXAMINATION MODULE
    if (
      rawModule === 'EXAM' ||
      rawModule === 'EXAMINATION' ||
      rawRefType === 'EXAM' ||
      linkTab?.startsWith('exam') ||
      linkTab === 'hall-tickets' ||
      linkTab === 'reassessment'
    ) {
      return {
        tab: linkTab || 'exam-dashboard',
        params: {
          recordId: refId,
          examId: notif.examId,
          actionType: notif.actionType || 'REVIEW',
          ...notif.targetParams
        }
      };
    }

    // 5. FEES & FINANCE MODULE
    if (
      rawModule === 'FEES' ||
      rawModule === 'FINANCE' ||
      rawRefType === 'FEES' ||
      linkTab === 'fees' ||
      linkTab === 'accounts-admin'
    ) {
      const targetTab = role === 'ACCOUNTS_ADMIN' ? 'accounts-admin' : 'fees';
      return {
        tab: targetTab,
        params: {
          recordId: refId,
          subFilter: 'PENDING_FEES',
          actionType: notif.actionType || 'RECONCILE',
          ...notif.targetParams
        }
      };
    }

    // 6. INWARD / OUTWARD REGISTER
    if (
      rawModule === 'INWARD_OUTWARD' ||
      rawRefType === 'INWARD_OUTWARD' ||
      linkTab === 'inward-outward'
    ) {
      return {
        tab: 'inward-outward',
        params: {
          recordId: refId,
          ...notif.targetParams
        }
      };
    }

    // 7. EDP DUTIES
    if (
      rawModule === 'EDP_DUTY' ||
      rawRefType === 'EDP_DUTY' ||
      linkTab === 'edp-duties' ||
      linkTab === 'exam-edp-duty'
    ) {
      const targetTab = role === 'EXAM_CELL' ? 'exam-edp-duty' : 'edp-duties';
      return {
        tab: targetTab,
        params: {
          recordId: refId,
          ...notif.targetParams
        }
      };
    }

    // 8. WORK DIARY
    if (
      rawModule === 'WORK_DIARY' ||
      rawRefType === 'WORK_DIARY' ||
      linkTab === 'work-diary'
    ) {
      return {
        tab: 'work-diary',
        params: {
          recordId: refId,
          ...notif.targetParams
        }
      };
    }

    // 9. DOCUMENT MASTER / VERIFICATION
    if (
      rawModule === 'DOCUMENT' ||
      rawRefType === 'DOCUMENT' ||
      linkTab === 'document-master' ||
      linkTab === 'student-docs'
    ) {
      return {
        tab: 'document-master',
        params: {
          recordId: refId,
          ...notif.targetParams
        }
      };
    }

    // 10. DEFAULT / EXPLICIT LINK TAB
    return {
      tab: linkTab || 'dashboard',
      params: {
        recordId: refId,
        ...notif.targetParams
      }
    };
  }
}

export const notificationService = new NotificationService();
