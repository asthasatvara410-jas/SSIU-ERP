import { db } from './db';
import { User, UserRole, UserAuthorizationContext } from '../types';

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'OVERDUE';
export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface ERPTaskRecord {
  id: string;
  title: string;
  description: string;
  module: 'NOTESHEET' | 'REQUEST' | 'EXAMINATION' | 'ATTENDANCE' | 'INVENTORY' | 'DOCUMENT' | 'GENERAL';
  entityType: string;
  entityId: string;
  assignedToUserId: string;
  assignedToRole?: string;
  assignedByUserId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  actionRoute?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  instituteId?: string;
  departmentId?: string;
  eventId?: string;
}

class TaskService {
  private static instance: TaskService;
  private tasks: ERPTaskRecord[] = [];

  private constructor() {}

  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Create or update task idempotently
   */
  public createTask(params: {
    title: string;
    description: string;
    module: ERPTaskRecord['module'];
    entityType: string;
    entityId: string;
    assignedToUserId: string;
    assignedToRole?: string;
    assignedByUserId: string;
    priority?: TaskPriority;
    dueDate?: string;
    actionRoute?: string;
    instituteId?: string;
    departmentId?: string;
    eventId?: string;
  }): ERPTaskRecord {
    // Check for existing active task for the same entity and step (Idempotency)
    const existing = this.tasks.find(
      t => t.entityId === params.entityId &&
           t.assignedToUserId === params.assignedToUserId &&
           (t.status === 'OPEN' || t.status === 'IN_PROGRESS')
    );

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const due = params.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

    const task: ERPTaskRecord = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: params.title,
      description: params.description,
      module: params.module,
      entityType: params.entityType,
      entityId: params.entityId,
      assignedToUserId: params.assignedToUserId,
      assignedToRole: params.assignedToRole,
      assignedByUserId: params.assignedByUserId,
      priority: params.priority || 'NORMAL',
      status: 'OPEN',
      dueDate: due,
      actionRoute: params.actionRoute,
      createdAt: now,
      updatedAt: now,
      instituteId: params.instituteId,
      departmentId: params.departmentId,
      eventId: params.eventId
    };

    this.tasks.unshift(task);
    return task;
  }

  /**
   * Complete task associated with an entity action
   */
  public completeTaskForEntity(entityId: string, assignedToUserId?: string): boolean {
    let completed = false;
    this.tasks.forEach(t => {
      if (t.entityId === entityId && (t.status === 'OPEN' || t.status === 'IN_PROGRESS')) {
        if (!assignedToUserId || t.assignedToUserId === assignedToUserId) {
          t.status = 'COMPLETED';
          t.completedAt = new Date().toISOString();
          t.updatedAt = new Date().toISOString();
          completed = true;
        }
      }
    });
    return completed;
  }

  /**
   * Get tasks scoped to authenticated user context
   */
  public getTasksForUser(
    context: UserAuthorizationContext,
    filters?: { status?: TaskStatus; priority?: TaskPriority }
  ): { records: ERPTaskRecord[]; totalCount: number } {
    const role = String(context.activeRole);
    const now = new Date().toISOString();

    let scoped = this.tasks.map(t => {
      // Dynamic Overdue Evaluation
      if ((t.status === 'OPEN' || t.status === 'IN_PROGRESS') && t.dueDate < now) {
        return { ...t, status: 'OVERDUE' as TaskStatus };
      }
      return t;
    }).filter(t => {
      if (role === 'STUDENT') return t.assignedToUserId === context.userId;
      if (role === 'FACULTY' || role === 'MENTOR') return t.assignedToUserId === context.userId;
      if (role === 'HOD') {
        return t.assignedToUserId === context.userId || (!context.departmentId || t.departmentId === context.departmentId);
      }
      if (role === 'PRINCIPAL') {
        return t.assignedToUserId === context.userId || (!context.instituteId || t.instituteId === context.instituteId);
      }
      return true; // Central governance
    });

    if (filters?.status) {
      scoped = scoped.filter(t => t.status === filters.status);
    }
    if (filters?.priority) {
      scoped = scoped.filter(t => t.priority === filters.priority);
    }

    return {
      records: scoped,
      totalCount: scoped.length
    };
  }

  public getPendingTasksCount(context: UserAuthorizationContext): number {
    const res = this.getTasksForUser(context);
    return res.records.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'OVERDUE').length;
  }
}

export const taskService = TaskService.getInstance();
