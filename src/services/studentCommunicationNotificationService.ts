import { db } from './db';
import { UserAuthorizationContext } from '../types';

export type CommunicationType =
  | 'ANNOUNCEMENT'
  | 'ALERT'
  | 'REMINDER'
  | 'ACTION_REQUIRED'
  | 'APPROVAL_UPDATE'
  | 'STATUS_UPDATE'
  | 'SYSTEM_NOTIFICATION'
  | 'ACADEMIC_NOTIFICATION'
  | 'FINANCIAL_NOTIFICATION'
  | 'DOCUMENT_NOTIFICATION'
  | 'LIFECYCLE_NOTIFICATION';

export type CommunicationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type ActionPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';

export interface CommunicationTemplateRecord {
  id: string;
  name: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  subject: string;
  body: string;
  variables: string[];
  version: number;
}

export interface StudentActionItemRecord {
  id: string;
  student_id: string;
  source_module: string;
  source_entity: string;
  action_type: string;
  title: string;
  description: string;
  due_date: string;
  priority: ActionPriority;
  status: ActionItemStatus;
  created_at: string;
  completed_at?: string;
}

export interface StudentCommunicationRecord {
  id: string;
  student_id: string;
  template_id?: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  subject: string;
  content: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';
  read_status: 'UNREAD' | 'READ';
  read_at?: string;
  created_at: string;
  idempotency_key?: string;
}

export interface StudentAnnouncementRecord {
  id: string;
  title: string;
  content: string;
  target_program?: string;
  target_department?: string;
  priority: ActionPriority;
  start_date: string;
  end_date: string;
  status: 'ACTIVE' | 'EXPIRED';
  created_by: string;
  created_at: string;
}

export interface CommunicationDashboardMetrics {
  totalSentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  unreadNotifications: number;
  openActionItems: number;
  overdueActionItems: number;
  activeAnnouncements: number;
}

class StudentCommunicationNotificationService {
  private static instance: StudentCommunicationNotificationService;

  private templates: CommunicationTemplateRecord[] = [
    {
      id: 'tmpl-exam-001',
      name: 'End-Semester Exam Hall Ticket Published',
      type: 'ACADEMIC_NOTIFICATION',
      channel: 'IN_APP',
      subject: 'Hall Ticket Published: {{exam_name}}',
      body: 'Dear {{student_name}}, your hall ticket for {{exam_name}} (Semester {{semester}}) is now available for download.',
      variables: ['student_name', 'exam_name', 'semester'],
      version: 1
    },
    {
      id: 'tmpl-doc-001',
      name: 'Document Verification Rejection Action Required',
      type: 'ACTION_REQUIRED',
      channel: 'IN_APP',
      subject: 'Action Required: Re-upload {{document_name}}',
      body: 'Dear {{student_name}}, your {{document_name}} was rejected due to: {{reason}}. Please re-upload by {{due_date}}.',
      variables: ['student_name', 'document_name', 'reason', 'due_date'],
      version: 1
    }
  ];

  private actionItems: StudentActionItemRecord[] = [
    {
      id: 'act-001',
      student_id: 'STU-2026-000001',
      source_module: 'DOCUMENT',
      source_entity: 'DOC_MIGRATION_CERT',
      action_type: 'UPLOAD_DOCUMENT',
      title: 'Submit Physical Migration Certificate',
      description: 'Submit original Migration Certificate copy at Registrar desk',
      due_date: '2026-09-15',
      priority: 'HIGH',
      status: 'OPEN',
      created_at: '2026-08-01T10:00:00Z'
    }
  ];

  private communications: StudentCommunicationRecord[] = [
    {
      id: 'comm-001',
      student_id: 'STU-2026-000001',
      template_id: 'tmpl-exam-001',
      type: 'ACADEMIC_NOTIFICATION',
      channel: 'IN_APP',
      subject: 'Hall Ticket Published: Summer 2026 End-Sem Examination',
      content: 'Dear Aarav Patel, your hall ticket for Summer 2026 End-Sem Examination (Semester 1) is now available for download.',
      status: 'DELIVERED',
      read_status: 'UNREAD',
      created_at: '2026-08-10T10:00:00Z'
    }
  ];

  private announcements: StudentAnnouncementRecord[] = [
    {
      id: 'ann-001',
      title: 'Annual Technical Symposium - TechFest 2026',
      content: 'Registration is now open for all SIT Engineering & Computer Application students.',
      target_department: 'dept-cse',
      priority: 'NORMAL',
      start_date: '2026-08-01',
      end_date: '2026-09-30',
      status: 'ACTIVE',
      created_by: 'emp-reg-001',
      created_at: '2026-08-01T09:00:00Z'
    }
  ];

  private constructor() {}

  public static getInstance(): StudentCommunicationNotificationService {
    if (!StudentCommunicationNotificationService.instance) {
      StudentCommunicationNotificationService.instance = new StudentCommunicationNotificationService();
    }
    return StudentCommunicationNotificationService.instance;
  }

  // ─── TEMPLATE RENDERING & NOTIFICATION SEND ENGINE ───────────────────

  public renderTemplate(templateId: string, variables: Record<string, string>): { subject: string; body: string } {
    const tmpl = this.templates.find(t => t.id === templateId);
    if (!tmpl) throw new Error(`Communication template ${templateId} not found`);

    let subject = tmpl.subject;
    let body = tmpl.body;

    Object.entries(variables).forEach(([key, val]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(pattern, val);
      body = body.replace(pattern, val);
    });

    return { subject, body };
  }

  public sendNotification(params: {
    studentId: string;
    templateId?: string;
    type: CommunicationType;
    channel: CommunicationChannel;
    subject: string;
    content: string;
    idempotencyKey?: string;
  }): StudentCommunicationRecord {
    // Check duplicate notification using idempotency key
    if (params.idempotencyKey) {
      const existing = this.communications.find(c => c.idempotency_key === params.idempotencyKey);
      if (existing) return existing;
    }

    const commRecord: StudentCommunicationRecord = {
      id: `comm-${Date.now()}`,
      student_id: params.studentId,
      template_id: params.templateId,
      type: params.type,
      channel: params.channel,
      subject: params.subject,
      content: params.content,
      status: 'DELIVERED',
      read_status: 'UNREAD',
      created_at: new Date().toISOString(),
      idempotency_key: params.idempotencyKey
    };

    this.communications.push(commRecord);
    return commRecord;
  }

  public markAsRead(communicationId: string): StudentCommunicationRecord {
    const comm = this.communications.find(c => c.id === communicationId);
    if (!comm) throw new Error(`Communication record ${communicationId} not found`);

    comm.read_status = 'READ';
    comm.read_at = new Date().toISOString();
    return comm;
  }

  // ─── STUDENT ACTION ITEMS ENGINE ─────────────────────────────────────

  public createActionItem(params: {
    studentId: string;
    sourceModule: string;
    sourceEntity: string;
    actionType: string;
    title: string;
    description: string;
    dueDate: string;
    priority: ActionPriority;
  }): StudentActionItemRecord {
    const action: StudentActionItemRecord = {
      id: `act-${Date.now()}`,
      student_id: params.studentId,
      source_module: params.sourceModule,
      source_entity: params.sourceEntity,
      action_type: params.actionType,
      title: params.title,
      description: params.description,
      due_date: params.dueDate,
      priority: params.priority,
      status: 'OPEN',
      created_at: new Date().toISOString()
    };

    this.actionItems.push(action);
    return action;
  }

  public completeActionItem(actionId: string): StudentActionItemRecord {
    const item = this.actionItems.find(a => a.id === actionId);
    if (!item) throw new Error(`Action item ${actionId} not found`);

    item.status = 'COMPLETED';
    item.completed_at = new Date().toISOString();
    return item;
  }

  // ─── ANNOUNCEMENTS & SCOPE TARGETING ─────────────────────────────────

  public publishAnnouncement(params: {
    title: string;
    content: string;
    targetDepartment?: string;
    targetProgram?: string;
    priority: ActionPriority;
    startDate: string;
    endDate: string;
    createdBy: string;
  }): StudentAnnouncementRecord {
    const announcement: StudentAnnouncementRecord = {
      id: `ann-${Date.now()}`,
      title: params.title,
      content: params.content,
      target_department: params.targetDepartment,
      target_program: params.targetProgram,
      priority: params.priority,
      start_date: params.startDate,
      end_date: params.endDate,
      status: 'ACTIVE',
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.announcements.push(announcement);
    return announcement;
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getCommunicationDashboardMetrics(context?: UserAuthorizationContext): CommunicationDashboardMetrics {
    const totalSentMessages = this.communications.length;
    const deliveredMessages = this.communications.filter(c => c.status === 'DELIVERED').length;
    const failedMessages = this.communications.filter(c => c.status === 'FAILED').length;
    const unreadNotifications = this.communications.filter(c => c.read_status === 'UNREAD').length;

    const openActionItems = this.actionItems.filter(a => a.status === 'OPEN' || a.status === 'IN_PROGRESS').length;

    const now = new Date().getTime();
    const overdueActionItems = this.actionItems.filter(
      a => (a.status === 'OPEN' || a.status === 'IN_PROGRESS') && new Date(a.due_date).getTime() < now
    ).length;

    const activeAnnouncements = this.announcements.filter(a => a.status === 'ACTIVE').length;

    return {
      totalSentMessages,
      deliveredMessages,
      failedMessages,
      unreadNotifications,
      openActionItems,
      overdueActionItems,
      activeAnnouncements
    };
  }
}

export const studentCommunicationNotificationService = StudentCommunicationNotificationService.getInstance();
