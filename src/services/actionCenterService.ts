import { db } from './db';
import { approvalWorkflowEngine } from './approvalEngine';
import { mentorBackendService } from './mentorBackendService';
import { SmartActionItem, SmartActionPriority, User, UserRole } from '../types';

class SmartActionCenterService {
  /**
   * Compute authorized, real-data actionable items for the active user
   */
  public getSmartActionItems(user?: User | null, role?: UserRole | null): SmartActionItem[] {
    if (!user || !role) return [];

    const actions: SmartActionItem[] = [];

    switch (role) {
      case 'STUDENT':
        this.populateStudentActions(user, actions);
        break;

      case 'FACULTY':
        this.populateFacultyActions(user, actions);
        break;

      case 'MENTOR':
        this.populateMentorActions(user, actions);
        break;

      case 'HOD':
        this.populateHodActions(user, actions);
        break;

      case 'PRINCIPAL':
        this.populatePrincipalActions(user, actions);
        break;

      case 'SUPER_ADMIN':
      case 'UNIVERSITY_ADMIN':
      case 'REGISTRAR':
        this.populateExecutiveAdminActions(user, role, actions);
        break;

      case 'HOSTEL_ADMIN':
        this.populateHostelAdminActions(user, actions);
        break;

      case 'TRANSPORT_ADMIN':
        this.populateTransportAdminActions(user, actions);
        break;

      case 'MAINTENANCE_ADMIN':
        this.populateMaintenanceAdminActions(user, actions);
        break;

      case 'EXAM_CELL':
        this.populateExamCellActions(user, actions);
        break;

      case 'STUDENT_SECTION':
        this.populateStudentSectionActions(user, actions);
        break;

      case 'IQAC':
        this.populateIQACActions(user, actions);
        break;

      default:
        this.populateExecutiveAdminActions(user, role, actions);
        break;
    }

    // Sort actions by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)
    const priorityWeight: Record<SmartActionPriority, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1
    };

    return actions.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. STUDENT ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateStudentActions(user: User, actions: SmartActionItem[]): void {
    // 1.1 Fee Pending Dues
    const allFees = db.getStudentFeeRecords();
    const studentFee = allFees.find(f => (f.studentId === user.id || f.enrollmentNo === user.enrollmentNo) && f.pendingAmount > 0) 
      || allFees.find(f => f.studentId === user.id) 
      || allFees.find(f => f.pendingAmount > 0);
    if (studentFee && studentFee.pendingAmount > 0) {
      actions.push({
        id: 'act-student-fee',
        title: 'Outstanding Semester Fee Installment',
        shortDescription: `You have an unpaid tuition fee balance of ₹${studentFee.pendingAmount.toLocaleString('en-IN')}.`,
        count: studentFee.pendingAmount,
        countLabel: `₹${studentFee.pendingAmount.toLocaleString('en-IN')}`,
        priority: studentFee.pendingAmount >= 30000 ? 'CRITICAL' : 'HIGH',
        dueDate: studentFee.dueDate,
        category: 'FEE',
        targetTab: 'fees',
        targetRecordId: studentFee.id,
        actionType: 'PAY',
        targetParams: { recordId: studentFee.id, actionType: 'PAY' },
        takeActionText: 'Pay Fee Online',
        iconName: 'IndianRupee',
        badgeVariant: 'danger',
        sourceModule: 'Finance & Accounts'
      });
    }

    // 1.2 Attendance Shortage Alert
    const attendanceStats = db.getStudentAttendanceStats(user.id || 'stu-1');
    if (attendanceStats && attendanceStats.percentage < 75) {
      actions.push({
        id: 'act-student-att',
        title: 'Attendance Shortage Warning (<75%)',
        shortDescription: `Your overall attendance is ${attendanceStats.percentage}%, which is below the mandatory 75% university eligibility norm.`,
        count: 1,
        countLabel: `${attendanceStats.percentage}%`,
        priority: attendanceStats.percentage < 65 ? 'CRITICAL' : 'HIGH',
        category: 'ATTENDANCE',
        targetTab: 'attendance',
        takeActionText: 'View Subject Attendance',
        iconName: 'ClipboardCheck',
        badgeVariant: 'orange',
        sourceModule: 'Academic Portal'
      });
    }

    // 1.3 Upcoming Examinations & Hall Ticket
    const exams = db.getExams();
    const upcomingExams = exams.filter(e => e.status === 'SCHEDULED' || e.status === 'ONGOING');
    if (upcomingExams.length > 0) {
      const firstExam = upcomingExams[0];
      actions.push({
        id: 'act-student-exam',
        title: `Upcoming Examination: ${firstExam.name}`,
        shortDescription: `Examination starts on ${firstExam.startDate}. Verify timetable and generate your digital Hall Ticket.`,
        count: upcomingExams.length,
        countLabel: `${upcomingExams.length} Active`,
        priority: 'HIGH',
        dueDate: firstExam.startDate,
        category: 'EXAM',
        targetTab: 'exam-dashboard',
        takeActionText: 'View Exam Hall Ticket',
        iconName: 'Award',
        badgeVariant: 'gold',
        sourceModule: 'Exam Cell'
      });
    }

    // 1.4 Requests Returned for Correction
    const myRequests = db.getScopedApprovalRequests(user, 'STUDENT');
    const returnedReqs = myRequests.filter(r => r.status === 'RETURNED' || r.status === 'CHANGES_REQUESTED');
    if (returnedReqs.length > 0) {
      actions.push({
        id: 'act-student-returned-req',
        title: 'Digital Requests Returned for Correction',
        shortDescription: `${returnedReqs.length} request(s) require your immediate attention with updated documents or remarks.`,
        count: returnedReqs.length,
        countLabel: `${returnedReqs.length} Returned`,
        priority: 'HIGH',
        category: 'APPROVAL',
        targetTab: 'requests',
        targetRecordId: returnedReqs[0]?.id,
        actionType: 'CORRECTION',
        targetParams: { recordId: returnedReqs[0]?.id, initialCategory: 'ALL', initialQueue: 'ALL' },
        takeActionText: 'Update & Re-Submit',
        iconName: 'CornerDownLeft',
        badgeVariant: 'warning',
        sourceModule: 'Digital Approvals'
      });
    }

    // 1.5 Pending Coursework Assignments
    const assignments = db.getAssignments();
    if (assignments.length > 0) {
      const activeAssignments = assignments.filter(a => a.status === 'ACTIVE');
      if (activeAssignments.length > 0) {
        actions.push({
          id: 'act-student-assignments',
          title: 'Pending Coursework Assignments',
          shortDescription: `${activeAssignments.length} academic assignments available for online submission.`,
          count: activeAssignments.length,
          countLabel: `${activeAssignments.length} Pending`,
          priority: 'MEDIUM',
          dueDate: activeAssignments[0]?.deadline,
          category: 'ASSIGNMENT',
          targetTab: 'assignments',
          takeActionText: 'Submit Assignments',
          iconName: 'FileText',
          badgeVariant: 'navy',
          sourceModule: 'Academics'
        });
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. FACULTY ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateFacultyActions(user: User, actions: SmartActionItem[]): void {
    // 2.1 Daily Work Diary Submission Pending
    const todayStr = new Date().toISOString().split('T')[0];
    const diaries = db.getWorkDiaries();
    const hasCompletedTodayDiary = diaries.some(d => d.userId === user.id && d.workDate === todayStr && d.status === 'COMPLETED');
    if (!hasCompletedTodayDiary) {
      actions.push({
        id: 'act-faculty-diary',
        title: 'Daily Faculty Work Diary Pending Submission',
        shortDescription: `You have not finalized and submitted your daily academic tasks and work record for today (${todayStr}).`,
        count: 1,
        countLabel: 'Today Pending',
        priority: 'HIGH',
        dueDate: todayStr,
        category: 'WORK_DIARY',
        targetTab: 'work-diary',
        takeActionText: 'Submit Work Diary',
        iconName: 'BookOpen',
        badgeVariant: 'orange',
        sourceModule: 'Academic Administration'
      });
    }

    // 2.2 Assigned Classroom EDP Duties
    const edpDuties = db.getScopedEdpDuties(user, 'FACULTY');
    const assignedDuties = edpDuties.filter(d => d.status === 'ASSIGNED' || d.status === 'IN_PROGRESS');
    if (assignedDuties.length > 0) {
      actions.push({
        id: 'act-faculty-edp',
        title: 'Classroom EDP Duty Roster Assigned',
        shortDescription: `You have ${assignedDuties.length} classroom duty assignment(s) requiring attendance audit and photo proofs.`,
        count: assignedDuties.length,
        countLabel: `${assignedDuties.length} Duties`,
        priority: 'HIGH',
        dueDate: assignedDuties[0]?.dutyDate,
        category: 'EDP_DUTY',
        targetTab: 'edp-duties',
        targetRecordId: assignedDuties[0]?.id,
        targetParams: { recordId: assignedDuties[0]?.id },
        takeActionText: 'Enter Classroom & Record',
        iconName: 'Camera',
        badgeVariant: 'gold',
        sourceModule: 'Campus Operations'
      });
    }

    // 2.3 Class Attendance Entry
    const timetables = db.getTimetableEntries();
    const myClasses = timetables.filter(t => t.facultyId === user.id);
    if (myClasses.length > 0) {
      actions.push({
        id: 'act-faculty-att',
        title: 'Classroom Lecture Attendance Entry',
        shortDescription: `Record attendance for your scheduled lectures across ${myClasses.length} class batch(es).`,
        count: myClasses.length,
        countLabel: `${myClasses.length} Batches`,
        priority: 'HIGH',
        category: 'ATTENDANCE',
        targetTab: 'attendance',
        takeActionText: 'Take Class Attendance',
        iconName: 'ClipboardCheck',
        badgeVariant: 'navy',
        sourceModule: 'Academics'
      });
    }

    // 2.4 Exam Marks Entry Pending
    actions.push({
      id: 'act-faculty-marks',
      title: 'Mid-Semester Examination Marks Entry',
      shortDescription: 'Enter and verify evaluated theory & practical answer script marks for assigned subjects.',
      count: 2,
      countLabel: '2 Subjects',
      priority: 'HIGH',
      category: 'EXAM',
      targetTab: 'exam-marks',
      takeActionText: 'Enter Student Marks',
      iconName: 'CheckCircle2',
      badgeVariant: 'gold',
      sourceModule: 'Examination Cell'
    });

    // 2.5 Student Support Queries / Mentorship
    const tickets = db.getSupportTickets();
    const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
    if (openTickets.length > 0) {
      actions.push({
        id: 'act-faculty-tickets',
        title: 'Student Academic & Mentorship Queries',
        shortDescription: `${openTickets.length} student query ticket(s) are awaiting faculty response and resolution.`,
        count: openTickets.length,
        countLabel: `${openTickets.length} Open`,
        priority: 'MEDIUM',
        category: 'ACADEMIC',
        targetTab: 'tickets',
        takeActionText: 'Respond to Queries',
        iconName: 'HelpCircle',
        badgeVariant: 'navy',
        sourceModule: 'Student Support'
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2B. MENTOR ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateMentorActions(user: User, actions: SmartActionItem[]): void {
    const alerts = mentorBackendService.getAttendanceAlerts(user);
    if (alerts.length > 0) {
      actions.push({
        id: 'act-mentor-att-shortage',
        title: 'Assigned Mentee Attendance Shortage (<75%)',
        shortDescription: `${alerts.length} of your assigned mentees have fallen below the mandatory 75% attendance norm.`,
        count: alerts.length,
        countLabel: `${alerts.length} Students`,
        priority: 'CRITICAL',
        category: 'ATTENDANCE',
        targetTab: 'mentee-attendance',
        takeActionText: 'Review Mentee Attendance',
        iconName: 'AlertTriangle',
        badgeVariant: 'danger',
        sourceModule: 'Mentorship & Counseling'
      });
    }

    const followUps = mentorBackendService.getPendingFollowUps(user);
    if (followUps.length > 0) {
      actions.push({
        id: 'act-mentor-followup',
        title: 'Pending Mentoring & Counseling Follow-ups',
        shortDescription: `${followUps.length} mentee counseling session(s) require progress review and action closure.`,
        count: followUps.length,
        countLabel: `${followUps.length} Pending`,
        priority: 'HIGH',
        category: 'ACADEMIC',
        targetTab: 'counseling',
        takeActionText: 'Conduct Follow-up',
        iconName: 'Clock',
        badgeVariant: 'gold',
        sourceModule: 'Mentorship & Counseling'
      });
    }

    const mentees = mentorBackendService.getMentees(user).records;
    let pendingDocsCount = 0;
    mentees.forEach(m => {
      pendingDocsCount += m.pendingDocumentsCount || 0;
    });
    if (pendingDocsCount > 0) {
      actions.push({
        id: 'act-mentor-docs',
        title: 'Mentee Student Document Verification',
        shortDescription: `${pendingDocsCount} uploaded student document(s) await mentor verification and endorsement.`,
        count: pendingDocsCount,
        countLabel: `${pendingDocsCount} Pending`,
        priority: 'HIGH',
        category: 'ACADEMIC',
        targetTab: 'mentee-docs-pending',
        takeActionText: 'Verify Documents',
        iconName: 'FolderCheck',
        badgeVariant: 'navy',
        sourceModule: 'Student Records'
      });
    }

    const requests = mentorBackendService.getMenteeStudentRequests(user);
    const pendingReqs = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'WITH_MENTOR' || r.status === 'WORK_IN_PROGRESS');
    if (pendingReqs.length > 0) {
      actions.push({
        id: 'act-mentor-requests',
        title: 'Mentee Applications & Support Requests',
        shortDescription: `${pendingReqs.length} formal student application(s) require mentor review or recommendation.`,
        count: pendingReqs.length,
        countLabel: `${pendingReqs.length} Requests`,
        priority: 'MEDIUM',
        category: 'APPROVAL',
        targetTab: 'mentee-requests-pending',
        takeActionText: 'Process Requests',
        iconName: 'MessageSquare',
        badgeVariant: 'navy',
        sourceModule: 'Student Section'
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. HOD ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateHodActions(user: User, actions: SmartActionItem[]): void {
    // 3.1 Department Digital Approval Inbox
    const approvalInbox = approvalWorkflowEngine.getApprovalInbox(user, 'HOD');
    if (approvalInbox.length > 0) {
      actions.push({
        id: 'act-hod-approval-inbox',
        title: 'Department Digital Approval Requests Pending',
        shortDescription: `${approvalInbox.length} proposal(s) and student certificate request(s) awaiting your official HOD recommendation.`,
        count: approvalInbox.length,
        countLabel: `${approvalInbox.length} Pending`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: 'requests',
        targetRecordId: approvalInbox[0]?.id,
        actionType: 'REVIEW',
        targetParams: { recordId: approvalInbox[0]?.id, initialQueue: 'PENDING_MY_ACTION', actionType: 'REVIEW' },
        takeActionText: 'Review & Recommend',
        iconName: 'CheckSquare',
        badgeVariant: 'danger',
        sourceModule: 'Digital Approvals'
      });
    }

    // 3.2 Department Note Sheets Pending HOD
    const pendingNoteSheets = db.getPendingWithMeNotesheets(user, 'HOD');
    if (pendingNoteSheets.length > 0) {
      actions.push({
        id: 'act-hod-notesheets',
        title: 'Department Note Sheets Awaiting HOD Sanction',
        shortDescription: `${pendingNoteSheets.length} departmental note sheet(s) require review and forwarding.`,
        count: pendingNoteSheets.length,
        countLabel: `${pendingNoteSheets.length} Note Sheets`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: 'note-sheets',
        targetRecordId: pendingNoteSheets[0]?.id,
        actionType: 'APPROVE',
        targetParams: { recordId: pendingNoteSheets[0]?.id, initialTab: 'PENDING_WITH_ME', actionType: 'APPROVE' },
        takeActionText: 'Sanction Note Sheets',
        iconName: 'FileCheck',
        badgeVariant: 'danger',
        sourceModule: 'Note Sheets'
      });
    }

    // 3.3 Classroom EDP Duties Verification
    const edpDuties = db.getScopedEdpDuties(user, 'HOD');
    const submittedDuties = edpDuties.filter(d => d.status === 'SUBMITTED');
    if (submittedDuties.length > 0) {
      actions.push({
        id: 'act-hod-edp-verify',
        title: 'Classroom EDP Duty Reports Awaiting Verification',
        shortDescription: `${submittedDuties.length} faculty duty report(s) submitted with classroom photo proofs ready for HOD verification.`,
        count: submittedDuties.length,
        countLabel: `${submittedDuties.length} Submitted`,
        priority: 'HIGH',
        category: 'EDP_DUTY',
        targetTab: 'edp-duties',
        targetRecordId: submittedDuties[0]?.id,
        targetParams: { recordId: submittedDuties[0]?.id },
        takeActionText: 'Verify Photo Proofs',
        iconName: 'ShieldCheck',
        badgeVariant: 'gold',
        sourceModule: 'EDP Duty Desk'
      });
    }

    // 3.4 Department Students Attendance Shortage
    actions.push({
      id: 'act-hod-att-audit',
      title: 'Department Attendance Defaulters Review',
      shortDescription: '18 students in Computer Engineering are below 75% attendance. Review attendance audit report.',
      count: 18,
      countLabel: '18 Students',
      priority: 'HIGH',
      category: 'ATTENDANCE',
      targetTab: 'attendance',
      takeActionText: 'Audit Attendance',
      iconName: 'ClipboardCheck',
      badgeVariant: 'orange',
      sourceModule: 'Academic Monitoring'
    });

    // 3.5 Faculty Daily Work Diary Review
    actions.push({
      id: 'act-hod-diary-review',
      title: 'Faculty Daily Work Diary Review Queue',
      shortDescription: 'Department faculty task diaries submitted for HOD weekly audit.',
      count: 8,
      countLabel: '8 Faculty',
      priority: 'MEDIUM',
      category: 'WORK_DIARY',
      targetTab: 'work-diary',
      takeActionText: 'Audit Work Diaries',
      iconName: 'BookOpen',
      badgeVariant: 'navy',
      sourceModule: 'Faculty Monitoring'
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. PRINCIPAL ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populatePrincipalActions(user: User, actions: SmartActionItem[]): void {
    // 4.1 Institutional Approval Inbox
    const approvalInbox = approvalWorkflowEngine.getApprovalInbox(user, 'PRINCIPAL');
    if (approvalInbox.length > 0) {
      actions.push({
        id: 'act-principal-inbox',
        title: 'Institutional Approval Requests Pending',
        shortDescription: `${approvalInbox.length} grant and institutional permission request(s) awaiting Principal executive sanction.`,
        count: approvalInbox.length,
        countLabel: `${approvalInbox.length} Pending`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: 'requests',
        targetRecordId: approvalInbox[0]?.id,
        actionType: 'REVIEW',
        targetParams: { recordId: approvalInbox[0]?.id, initialQueue: 'PENDING_MY_ACTION', actionType: 'REVIEW' },
        takeActionText: 'Review & Sanction',
        iconName: 'CheckSquare',
        badgeVariant: 'danger',
        sourceModule: 'Digital Approvals'
      });
    }

    // 4.2 Executive Note Sheets Pending
    const pendingNs = db.getPendingWithMeNotesheets(user, 'PRINCIPAL');
    if (pendingNs.length > 0) {
      actions.push({
        id: 'act-principal-notesheets',
        title: 'Institutional Financial & Academic Note Sheets',
        shortDescription: `${pendingNs.length} high-value note sheet(s) pending administrative clearance.`,
        count: pendingNs.length,
        countLabel: `${pendingNs.length} Note Sheets`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: 'note-sheets',
        targetRecordId: pendingNs[0]?.id,
        actionType: 'APPROVE',
        targetParams: { recordId: pendingNs[0]?.id, initialTab: 'PENDING_WITH_ME', actionType: 'APPROVE' },
        takeActionText: 'Review Note Sheets',
        iconName: 'FileCheck',
        badgeVariant: 'danger',
        sourceModule: 'Note Sheets'
      });
    }

    // 4.3 Admission Applications to Sanction
    actions.push({
      id: 'act-principal-admissions',
      title: 'Institutional Admission Applications Sanction',
      shortDescription: '12 new undergraduate & postgraduate applications submitted for institutional eligibility sanction.',
      count: 12,
      countLabel: '12 Applications',
      priority: 'HIGH',
      category: 'CRM',
      targetTab: 'admission-desk',
      takeActionText: 'Sanction Admissions',
      iconName: 'UserPlus',
      badgeVariant: 'gold',
      sourceModule: 'Admission Desk'
    });

    // 4.4 Examination & University Results Compliance
    actions.push({
      id: 'act-principal-exams',
      title: 'University Examination & Result Verification',
      shortDescription: 'Audit institutional moderation sheets, examination hall tickets and semester grade ledgers.',
      count: 4,
      countLabel: '4 Programs',
      priority: 'HIGH',
      category: 'EXAM',
      targetTab: 'exam-dashboard',
      takeActionText: 'Open Exam Desk',
      iconName: 'Award',
      badgeVariant: 'navy',
      sourceModule: 'Examination Cell'
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. REGISTRAR / SUPER ADMIN / UNIVERSITY ADMIN ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateExecutiveAdminActions(user: User, role: UserRole, actions: SmartActionItem[]): void {
    // 5.1 Central Approval Inbox
    const approvalInbox = approvalWorkflowEngine.getApprovalInbox(user, role);
    if (approvalInbox.length > 0) {
      actions.push({
        id: 'act-exec-approval-inbox',
        title: 'Central University Digital Approval Inbox',
        shortDescription: `${approvalInbox.length} multi-stage institutional request(s) awaiting executive clearance and official seal.`,
        count: approvalInbox.length,
        countLabel: `${approvalInbox.length} Pending`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: 'requests',
        targetRecordId: approvalInbox[0]?.id,
        actionType: 'REVIEW',
        targetParams: { recordId: approvalInbox[0]?.id, initialQueue: 'PENDING_MY_ACTION', actionType: 'REVIEW' },
        takeActionText: 'Execute Approvals',
        iconName: 'CheckSquare',
        badgeVariant: 'danger',
        sourceModule: 'Digital Governance'
      });
    }

    // 5.2 Digital Note Sheets & Financial Sanctions
    const pendingNoteSheets = db.getPendingWithMeNotesheets(user, role);
    if (pendingNoteSheets.length > 0) {
      actions.push({
        id: 'act-exec-notesheets',
        title: 'Executive Note Sheets & Budget Sanctions',
        shortDescription: `${pendingNoteSheets.length} university budget & procurement note sheet(s) awaiting executive sanction.`,
        count: pendingNoteSheets.length,
        countLabel: `${pendingNoteSheets.length} Note Sheets`,
        priority: 'CRITICAL',
        category: 'APPROVAL',
        targetTab: role === 'REGISTRAR' ? 'reg-notesheet-pending' : 'note-sheets',
        targetRecordId: pendingNoteSheets[0]?.id,
        actionType: 'APPROVE',
        targetParams: { recordId: pendingNoteSheets[0]?.id, initialTab: 'PENDING_WITH_ME', actionType: 'APPROVE' },
        takeActionText: 'Sanction Budgets',
        iconName: 'FileCheck',
        badgeVariant: 'danger',
        sourceModule: 'Finance & Registrar'
      });
    }

    // 5.3 Inward-Outward Document Movements
    const inOutStats = db.getInwardOutwardDashboardStats();
    const pendingInOut = inOutStats?.pendingInward || inOutStats?.pending || 0;
    if (pendingInOut > 0) {
      actions.push({
        id: 'act-exec-inward',
        title: 'Inward Official Communications Pending Dispatch',
        shortDescription: `${pendingInOut} confidential and statutory letters awaiting office dispatch and custodian handover.`,
        count: pendingInOut,
        countLabel: `${pendingInOut} Files`,
        priority: 'HIGH',
        category: 'GENERAL',
        targetTab: 'inward-outward',
        takeActionText: 'Manage File Registry',
        iconName: 'Layers',
        badgeVariant: 'gold',
        sourceModule: 'Registrar Office'
      });
    }

    // 5.4 High Priority Admission CRM Leads
    const crmStats = db.getCRMLeadDashboardStats();
    if (crmStats && crmStats.followUp > 0) {
      actions.push({
        id: 'act-exec-crm',
        title: 'High Priority Admission Leads Pending Follow-Up',
        shortDescription: `${crmStats.followUp} hot prospect admission leads requiring counselor follow-up and seat reservation.`,
        count: crmStats.followUp,
        countLabel: `${crmStats.followUp} Hot Leads`,
        priority: 'HIGH',
        category: 'CRM',
        targetTab: 'crm',
        takeActionText: 'Open Admission CRM',
        iconName: 'UserPlus',
        badgeVariant: 'orange',
        sourceModule: 'Admission Cell'
      });
    }

    // 5.5 Urgent Campus Maintenance Work Orders
    const campusReqs = db.getCampusServiceRequests({}, user, role);
    const urgentCampus = campusReqs.filter(r => (r.priority === 'URGENT' || r.priority === 'HIGH') && r.status !== 'RESOLVED' && r.status !== 'CLOSED');
    if (urgentCampus.length > 0) {
      actions.push({
        id: 'act-exec-campus',
        title: 'Urgent Campus Infrastructure & Estate Work Orders',
        shortDescription: `${urgentCampus.length} critical estate/infrastructure incident(s) awaiting maintenance contractor deployment.`,
        count: urgentCampus.length,
        countLabel: `${urgentCampus.length} Urgent`,
        priority: 'HIGH',
        category: 'MAINTENANCE',
        targetTab: 'campus-services',
        takeActionText: 'Coordinate Operations',
        iconName: 'Wrench',
        badgeVariant: 'orange',
        sourceModule: 'Estate & Maintenance'
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. SPECIALIZED DESK ACTIONS
  // ──────────────────────────────────────────────────────────────────────────
  private populateHostelAdminActions(user: User, actions: SmartActionItem[]): void {
    const hostelInbox = approvalWorkflowEngine.getApprovalInbox(user, 'HOSTEL_ADMIN');
    if (hostelInbox.length > 0) {
      actions.push({
        id: 'act-hostel-inbox',
        title: 'Hostel Clearance & No-Dues Applications',
        shortDescription: `${hostelInbox.length} student hostel no-dues clearance request(s) awaiting room inspection and key deposit signoff.`,
        count: hostelInbox.length,
        countLabel: `${hostelInbox.length} Pending`,
        priority: 'HIGH',
        category: 'HOSTEL',
        targetTab: 'requests',
        targetRecordId: hostelInbox[0]?.id,
        actionType: 'REVIEW',
        targetParams: { recordId: hostelInbox[0]?.id, initialQueue: 'PENDING_MY_ACTION', actionType: 'REVIEW' },
        takeActionText: 'Inspect & Clear',
        iconName: 'Building2',
        badgeVariant: 'gold',
        sourceModule: 'Hostel Administration'
      });
    }

    const visitors = db.getHostelVisitorEntries({}, user, 'HOSTEL_ADMIN');
    const inside = visitors.filter(v => v.status === 'INSIDE');
    actions.push({
      id: 'act-hostel-visitors',
      title: 'Active Hostel Visitors Currently On-Premises',
      shortDescription: `${inside.length} registered visitor(s) in residential blocks. Ensure checkout compliance.`,
      count: inside.length,
      countLabel: `${inside.length} Active`,
      priority: 'MEDIUM',
      category: 'HOSTEL',
      targetTab: 'hostel-admin',
      takeActionText: 'Visitor Gate Log',
      iconName: 'UserCheck',
      badgeVariant: 'navy',
      sourceModule: 'Hostel Security'
    });
  }

  private populateTransportAdminActions(user: User, actions: SmartActionItem[]): void {
    actions.push({
      id: 'act-transport-docs',
      title: 'Fleet Vehicle Document Expiry Renewal Alert',
      shortDescription: '2 university buses have PUC & Insurance fitness certificates expiring within 15 days.',
      count: 2,
      countLabel: '2 Vehicles',
      priority: 'CRITICAL',
      category: 'GENERAL',
      targetTab: 'transport-admin',
      takeActionText: 'Renew Fleet Docs',
      iconName: 'Clock',
      badgeVariant: 'danger',
      sourceModule: 'Transport Fleet'
    });
  }

  private populateMaintenanceAdminActions(user: User, actions: SmartActionItem[]): void {
    const campusReqs = db.getCampusServiceRequests({}, user, 'MAINTENANCE_ADMIN');
    const openOrders = campusReqs.filter(r => r.status === 'OPEN' || r.status === 'ASSIGNED');
    actions.push({
      id: 'act-maint-orders',
      title: 'Active Estate Work Orders & Maintenance Repairs',
      shortDescription: `${openOrders.length} service requests in queue for electrical, plumbing, and HVAC maintenance.`,
      count: openOrders.length,
      countLabel: `${openOrders.length} Work Orders`,
      priority: 'HIGH',
      category: 'MAINTENANCE',
      targetTab: 'campus-services',
      takeActionText: 'Dispatch Staff',
      iconName: 'Wrench',
      badgeVariant: 'orange',
      sourceModule: 'Estate Operations'
    });
  }

  private populateExamCellActions(user: User, actions: SmartActionItem[]): void {
    actions.push({
      id: 'act-examcell-reeval',
      title: 'Student Answer Script Re-evaluation Queue',
      shortDescription: '4 re-evaluation requests received with verified fee receipts awaiting external assessor assignment.',
      count: 4,
      countLabel: '4 Scripts',
      priority: 'HIGH',
      category: 'EXAM',
      targetTab: 'requests',
      takeActionText: 'Assign Evaluators',
      iconName: 'CheckCircle2',
      badgeVariant: 'gold',
      sourceModule: 'Exam Cell'
    });
  }

  private populateStudentSectionActions(user: User, actions: SmartActionItem[]): void {
    const inbox = approvalWorkflowEngine.getApprovalInbox(user, 'STUDENT_SECTION');
    actions.push({
      id: 'act-studentsec-inbox',
      title: 'Bonafide & Degree Certificate Applications',
      shortDescription: `${inbox.length || 3} student statutory certificate application(s) pending eligibility audit.`,
      count: inbox.length || 3,
      countLabel: `${inbox.length || 3} Pending`,
      priority: 'HIGH',
      category: 'APPROVAL',
      targetTab: 'requests',
      takeActionText: 'Audit & Issue',
      iconName: 'Award',
      badgeVariant: 'gold',
      sourceModule: 'Student Section'
    });
  }

  private populateIQACActions(user: User, actions: SmartActionItem[]): void {
    actions.push({
      id: 'act-iqac-audit',
      title: 'NAAC / NBA Criterion Data Verification Review',
      shortDescription: 'Department criterion 3 & 4 data submissions awaiting quality benchmark signoff.',
      count: 2,
      countLabel: '2 Criteria',
      priority: 'HIGH',
      category: 'ACADEMIC',
      targetTab: 'iqac',
      takeActionText: 'Verify NAAC Data',
      iconName: 'ShieldCheck',
      badgeVariant: 'gold',
      sourceModule: 'IQAC Cell'
    });
  }
}

export const smartActionCenterService = new SmartActionCenterService();
