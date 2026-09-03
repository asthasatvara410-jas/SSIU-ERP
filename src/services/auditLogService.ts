// ==============================================================================
// SWARRNIM UNIVERSITY ERP — REUSABLE AUDIT LOGGING & COMPLIANCE SERVICE
// ==============================================================================

import { db } from './db';
import { AuditLog, UserRole, User } from '../types';

export interface LogAuditParams {
  action: string;
  module: string;
  recordId?: string;
  entity?: string;
  details: string;
  user?: User | { id?: string; name: string; role: UserRole } | null;
  role?: UserRole;
  previousValue?: any;
  newValue?: any;
  status?: 'SUCCESS' | 'FAILED' | 'BLOCKED' | 'WARNING';
  severity?: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
  ipAddress?: string;
}

export interface AuditQueryFilters {
  module?: string;
  recordId?: string;
  action?: string;
  userId?: string;
  role?: UserRole | string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditResult {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class AuditLogServiceEngine {
  private static instance: AuditLogServiceEngine;

  private constructor() {}

  public static getInstance(): AuditLogServiceEngine {
    if (!AuditLogServiceEngine.instance) {
      AuditLogServiceEngine.instance = new AuditLogServiceEngine();
    }
    return AuditLogServiceEngine.instance;
  }

  /**
   * Log an audit action with complete state transition and user provenance
   */
  public log(params: LogAuditParams): AuditLog {
    const userName = params.user?.name || 'System / Auto-Service';
    const userRole = params.role || (params.user as any)?.role || 'SUPER_ADMIN';
    const userId = params.user?.id;
    const entity = params.entity || params.module;

    const prevValStr = params.previousValue !== undefined
      ? (typeof params.previousValue === 'object' ? JSON.stringify(params.previousValue) : String(params.previousValue))
      : undefined;

    const newValStr = params.newValue !== undefined
      ? (typeof params.newValue === 'object' ? JSON.stringify(params.newValue) : String(params.newValue))
      : undefined;

    return db.logAudit(
      params.action,
      entity,
      params.details,
      userName,
      userRole,
      {
        userId,
        module: params.module,
        recordId: params.recordId,
        previousValue: prevValStr,
        newValue: newValStr,
        status: params.status || 'SUCCESS',
        severity: params.severity || 'INFO',
        ipAddress: params.ipAddress || '192.168.1.104'
      }
    );
  }

  /**
   * Query audit logs with rich filters and pagination
   */
  public query(filters?: AuditQueryFilters): PaginatedAuditResult {
    let logs = db.getAuditLogs();

    if (!filters) {
      return {
        logs,
        total: logs.length,
        page: 1,
        pageSize: logs.length,
        totalPages: 1
      };
    }

    if (filters.module) {
      const mod = filters.module.toLowerCase();
      logs = logs.filter(l => (l.module && l.module.toLowerCase() === mod) || (l.entity && l.entity.toLowerCase() === mod));
    }

    if (filters.recordId) {
      logs = logs.filter(l => l.recordId === filters.recordId);
    }

    if (filters.action) {
      const act = filters.action.toLowerCase();
      logs = logs.filter(l => l.action.toLowerCase().includes(act));
    }

    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }

    if (filters.role) {
      logs = logs.filter(l => l.userRole === filters.role);
    }

    if (filters.dateFrom) {
      const fromTime = new Date(filters.dateFrom).getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() >= fromTime);
    }

    if (filters.dateTo) {
      const toTime = new Date(filters.dateTo).getTime();
      logs = logs.filter(l => new Date(l.timestamp).getTime() <= toTime);
    }

    if (filters.search) {
      const term = filters.search.toLowerCase();
      logs = logs.filter(l =>
        l.action.toLowerCase().includes(term) ||
        l.details.toLowerCase().includes(term) ||
        l.userName.toLowerCase().includes(term) ||
        (l.recordId && l.recordId.toLowerCase().includes(term))
      );
    }

    const total = logs.length;
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.max(1, filters.pageSize || 50);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedLogs = logs.slice(startIndex, startIndex + pageSize);

    return {
      logs: paginatedLogs,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Retrieve audit history for a specific record (e.g. Student Master ID, Fee Record ID)
   */
  public getRecordHistory(recordId: string): AuditLog[] {
    return db.getAuditLogs().filter(l => l.recordId === recordId);
  }
}

export const auditLogService = AuditLogServiceEngine.getInstance();
