import { db } from './db';
import { auditLogService } from './auditLogService';
import { notificationService } from './notificationService';
import { taskService } from './taskService';
import { User, UserRole, UserAuthorizationContext } from '../types';

export type BusinessEventType =
  | 'RECORD_CREATED'
  | 'RECORD_SUBMITTED'
  | 'RECORD_FORWARDED'
  | 'RECORD_APPROVED'
  | 'RECORD_RETURNED'
  | 'RECORD_REJECTED'
  | 'CLARIFICATION_REQUESTED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'USER_ASSIGNED'
  | 'ASSET_TRANSFERRED'
  | 'ASSET_ISSUED'
  | 'ASSET_RETURNED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFIED';

export interface BusinessEventPayload {
  eventId: string;
  eventType: BusinessEventType;
  module: 'NOTESHEET' | 'REQUEST' | 'EXAMINATION' | 'ATTENDANCE' | 'INVENTORY' | 'DOCUMENT' | 'USER_ADMIN';
  entityType: string;
  entityId: string;
  actorUserId: string;
  actorName: string;
  actorRole: UserRole | string;
  targetUserId?: string;
  targetRole?: UserRole | string;
  instituteId?: string;
  departmentId?: string;
  oldStatus?: string;
  newStatus?: string;
  summary: string;
  remarks?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface ActivityRecord {
  id: string;
  eventId: string;
  actorName: string;
  actorRole: string;
  actionSummary: string;
  module: string;
  entityType: string;
  entityId: string;
  instituteId?: string;
  departmentId?: string;
  timestamp: string;
}

class ERPEventBusService {
  private static instance: ERPEventBusService;
  private processedEvents = new Set<string>();
  private activities: ActivityRecord[] = [];

  private constructor() {}

  public static getInstance(): ERPEventBusService {
    if (!ERPEventBusService.instance) {
      ERPEventBusService.instance = new ERPEventBusService();
    }
    return ERPEventBusService.instance;
  }

  /**
   * Publish a business event to trigger Audit, Activity, Notification, and Task engines
   */
  public publishEvent(event: BusinessEventPayload): boolean {
    // 1. Idempotency Check
    if (this.processedEvents.has(event.eventId)) {
      return false; // Event already processed safely
    }

    this.processedEvents.add(event.eventId);

    // 2. Append to Human-Readable Activity Stream
    this.activities.unshift({
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      eventId: event.eventId,
      actorName: event.actorName,
      actorRole: String(event.actorRole),
      actionSummary: event.summary,
      module: event.module,
      entityType: event.entityType,
      entityId: event.entityId,
      instituteId: event.instituteId,
      departmentId: event.departmentId,
      timestamp: event.timestamp
    });

    // 3. Dispatch Notification to Target Recipient if applicable
    if (event.targetUserId) {
      notificationService.createNotification({
        title: `${event.module}: Action Update`,
        message: event.summary,
        module: event.module,
        referenceId: event.entityId,
        referenceType: event.entityType,
        priority: 'NORMAL',
        targetUserId: event.targetUserId,
        actionUrl: `/${event.module.toLowerCase()}/${event.entityId}`
      });
    }

    // 4. Create Task for Target Assignee if action required
    if (
      event.targetUserId &&
      (event.eventType === 'RECORD_FORWARDED' ||
       event.eventType === 'RECORD_SUBMITTED' ||
       event.eventType === 'CLARIFICATION_REQUESTED')
    ) {
      taskService.createTask({
        title: `Review ${event.entityType}: ${event.entityId}`,
        description: event.summary,
        module: event.module as any,
        entityType: event.entityType,
        entityId: event.entityId,
        assignedToUserId: event.targetUserId,
        assignedToRole: String(event.targetRole || ''),
        assignedByUserId: event.actorUserId,
        instituteId: event.instituteId,
        departmentId: event.departmentId,
        eventId: event.eventId
      });
    }

    // 5. Complete task if event represents completion
    if (event.eventType === 'RECORD_APPROVED' || event.eventType === 'RECORD_REJECTED') {
      taskService.completeTaskForEntity(event.entityId, event.actorUserId);
    }

    return true;
  }

  /**
   * Retrieve scope-aware human-readable recent activity
   */
  public getRecentActivityForUser(
    context: UserAuthorizationContext,
    limit: number = 20
  ): ActivityRecord[] {
    const role = String(context.activeRole);

    const scoped = this.activities.filter(act => {
      if (role === 'STUDENT' || role === 'FACULTY') {
        return !act.departmentId || act.departmentId === context.departmentId;
      }
      if (role === 'HOD') {
        return !context.departmentId || act.departmentId === context.departmentId;
      }
      if (role === 'PRINCIPAL') {
        return !context.instituteId || act.instituteId === context.instituteId;
      }
      return true; // University-wide for Registrar / VP
    });

    return scoped.slice(0, limit);
  }
}

export const erpEventBusService = ERPEventBusService.getInstance();
