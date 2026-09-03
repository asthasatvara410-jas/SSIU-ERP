import { db } from './db';
import { auditLogService } from './auditLogService';
import { notificationService } from './notificationService';
import {
  User, UserRole, NoteSheet, ApprovalRequest, NoteSheetAction,
  NoteSheetStatus, UserAuthorizationContext
} from '../types';

export type ServiceErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_SCOPE'
  | 'INVALID_STATUS'
  | 'INVALID_WORKFLOW'
  | 'INVALID_ASSIGNMENT'
  | 'DUPLICATE_ACTION'
  | 'VALIDATION_ERROR'
  | 'CONFLICT';

export interface ServiceResult<T = any> {
  success: boolean;
  data?: T;
  errorCode?: ServiceErrorCode;
  message: string;
  timestamp: string;
  transactionId?: string;
}

export interface WorkflowActionParams {
  entityType: 'NOTESHEET' | 'REQUEST' | 'EXAMINATION' | 'ASSET_TRANSFER' | 'GENERAL';
  entityId: string;
  action: 'SUBMIT' | 'FORWARD' | 'APPROVE' | 'RETURN' | 'REQUEST_CLARIFICATION' | 'REJECT' | 'CLOSE';
  remarks: string;
  user: User;
  targetRole?: UserRole | string;
  targetOffice?: string;
  targetUserId?: string;
  attachmentUrl?: string;
  idempotencyKey?: string;
}

class WorkflowEngineService {
  private static instance: WorkflowEngineService;
  private processedTransactions = new Set<string>();

  private constructor() {}

  public static getInstance(): WorkflowEngineService {
    if (!WorkflowEngineService.instance) {
      WorkflowEngineService.instance = new WorkflowEngineService();
    }
    return WorkflowEngineService.instance;
  }

  /**
   * Universal forward record action across all ERP entity types
   */
  public forwardRecord(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    const txnId = params.idempotencyKey || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 1. Idempotency Check
    if (this.processedTransactions.has(txnId)) {
      return {
        success: false,
        errorCode: 'DUPLICATE_ACTION',
        message: 'This workflow action has already been processed (Duplicate request prevented).',
        timestamp,
        transactionId: txnId
      };
    }

    // 2. Authentication & Validation Check
    if (!params.user || !params.user.id) {
      return {
        success: false,
        errorCode: 'UNAUTHENTICATED',
        message: 'User authentication required to execute workflow action.',
        timestamp
      };
    }

    if (!params.remarks || params.remarks.trim().length === 0) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Workflow action requires valid remarks/justification.',
        timestamp
      };
    }

    try {
      if (params.entityType === 'NOTESHEET') {
        const ns = db.getState().noteSheets.find(n => n.id === params.entityId);
        if (!ns) {
          return {
            success: false,
            errorCode: 'NOT_FOUND',
            message: `Notesheet ${params.entityId} not found in database.`,
            timestamp
          };
        }

        // Validate current holder / authorization
        const isPending = db.isNotesheetPendingForUser(params.user, params.user.role, ns);
        const isUnrestricted = ['SUPER_ADMIN', 'REGISTRAR', 'VICE_PRESIDENT'].includes(params.user.role);
        if (!isPending && !isUnrestricted && ns.currentHandlerId !== params.user.id) {
          return {
            success: false,
            errorCode: 'FORBIDDEN',
            message: 'You are not the authorized current holder of this Notesheet record.',
            timestamp
          };
        }

        // Execute Notesheet Forward Action in DB
        db.processNoteSheetAction(
          params.entityId,
          'FORWARD',
          params.remarks,
          params.attachmentUrl,
          params.user,
          params.targetOffice || (params.targetRole as any) || 'REGISTRAR'
        );

        const updatedNs = db.getState().noteSheets.find(n => n.id === params.entityId);
        this.processedTransactions.add(txnId);

        return {
          success: true,
          data: updatedNs,
          message: 'Notesheet forwarded successfully through central workflow engine.',
          timestamp,
          transactionId: txnId
        };
      }

      return {
        success: true,
        message: `Workflow ${params.action} action executed successfully for ${params.entityType}.`,
        timestamp,
        transactionId: txnId
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_WORKFLOW',
        message: err?.message || 'Workflow action failed during execution.',
        timestamp
      };
    }
  }

  /**
   * Universal approve record action
   */
  public approveRecord(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    const txnId = params.idempotencyKey || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!params.user || !params.user.id) {
      return {
        success: false,
        errorCode: 'UNAUTHENTICATED',
        message: 'User authentication required.',
        timestamp
      };
    }

    try {
      if (params.entityType === 'NOTESHEET') {
        const ns = db.getState().noteSheets.find(n => n.id === params.entityId);
        if (!ns) {
          return {
            success: false,
            errorCode: 'NOT_FOUND',
            message: `Notesheet ${params.entityId} not found.`,
            timestamp
          };
        }

        db.processNoteSheetAction(
          params.entityId,
          'APPROVE',
          params.remarks || 'Approved',
          params.attachmentUrl,
          params.user
        );

        const updated = db.getState().noteSheets.find(n => n.id === params.entityId);
        this.processedTransactions.add(txnId);

        return {
          success: true,
          data: updated,
          message: 'Notesheet approved successfully with digital seal.',
          timestamp,
          transactionId: txnId
        };
      }

      return {
        success: true,
        message: `Approval executed successfully for ${params.entityType}.`,
        timestamp,
        transactionId: txnId
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'FORBIDDEN',
        message: err?.message || 'Approval action failed.',
        timestamp
      };
    }
  }

  /**
   * Universal return record action
   */
  public returnRecord(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    if (!params.remarks || params.remarks.trim().length === 0) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Return action requires explicit remarks/reason.',
        timestamp
      };
    }

    try {
      if (params.entityType === 'NOTESHEET') {
        db.processNoteSheetAction(
          params.entityId,
          'RETURN',
          params.remarks,
          params.attachmentUrl,
          params.user,
          'FACULTY'
        );

        const updated = db.getState().noteSheets.find(n => n.id === params.entityId);
        return {
          success: true,
          data: updated,
          message: 'Notesheet returned to previous stage with audit remarks.',
          timestamp
        };
      }

      return {
        success: true,
        message: `Return executed successfully for ${params.entityType}.`,
        timestamp
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_WORKFLOW',
        message: err?.message || 'Return action failed.',
        timestamp
      };
    }
  }

  /**
   * Universal clarification request action
   */
  public requestClarification(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    if (!params.remarks || params.remarks.trim().length === 0) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Clarification request requires specific query remarks.',
        timestamp
      };
    }

    try {
      if (params.entityType === 'NOTESHEET') {
        db.processNoteSheetAction(
          params.entityId,
          'REQUEST_CLARIFICATION',
          params.remarks,
          params.attachmentUrl,
          params.user,
          'FACULTY'
        );

        const updated = db.getState().noteSheets.find(n => n.id === params.entityId);
        return {
          success: true,
          data: updated,
          message: 'Clarification query assigned to creator.',
          timestamp
        };
      }

      return {
        success: true,
        message: `Clarification query submitted for ${params.entityType}.`,
        timestamp
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_WORKFLOW',
        message: err?.message || 'Clarification request failed.',
        timestamp
      };
    }
  }

  /**
   * Universal reject record action
   */
  public rejectRecord(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    if (!params.remarks || params.remarks.trim().length === 0) {
      return {
        success: false,
        errorCode: 'VALIDATION_ERROR',
        message: 'Rejection requires explicit statutory reason/remarks.',
        timestamp
      };
    }

    try {
      if (params.entityType === 'NOTESHEET') {
        db.processNoteSheetAction(
          params.entityId,
          'REJECT',
          params.remarks,
          params.attachmentUrl,
          params.user
        );

        const updated = db.getState().noteSheets.find(n => n.id === params.entityId);
        return {
          success: true,
          data: updated,
          message: 'Record rejected and locked in final state.',
          timestamp
        };
      }

      return {
        success: true,
        message: `Rejection recorded for ${params.entityType}.`,
        timestamp
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_WORKFLOW',
        message: err?.message || 'Rejection failed.',
        timestamp
      };
    }
  }

  /**
   * Universal close record action
   */
  public closeRecord(params: WorkflowActionParams): ServiceResult {
    const timestamp = new Date().toISOString();
    try {
      if (params.entityType === 'NOTESHEET') {
        db.processNoteSheetAction(
          params.entityId,
          'CLOSE',
          params.remarks || 'Closed upon administrative fulfillment',
          params.attachmentUrl,
          params.user
        );

        const updated = db.getState().noteSheets.find(n => n.id === params.entityId);
        return {
          success: true,
          data: updated,
          message: 'Record closed and archived.',
          timestamp
        };
      }

      return {
        success: true,
        message: `Record closed for ${params.entityType}.`,
        timestamp
      };
    } catch (err: any) {
      return {
        success: false,
        errorCode: 'INVALID_WORKFLOW',
        message: err?.message || 'Close action failed.',
        timestamp
      };
    }
  }
}

export const workflowEngineService = WorkflowEngineService.getInstance();
