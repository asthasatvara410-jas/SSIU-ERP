export type ERPEventType =
  // TIMETABLE
  | 'FACULTY_ABSENCE_REPORTED'
  | 'FACULTY_SUBSTITUTION_REQUIRED'
  | 'TIMETABLE_CHANGED'
  // DOCUMENT
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFICATION_REQUIRED'
  | 'DOCUMENT_VERIFICATION_COMPLETED'
  // FEES
  | 'FEE_DUE'
  | 'FEE_OVERDUE'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_PLAN_REQUESTED'
  // GENERAL
  | 'STUDENT_CREATED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_REQUEST_CREATED'
  | string;

export interface ERPEvent<T = Record<string, any>> {
  eventId: string;
  eventType: ERPEventType;
  tenantId: string;
  institutionId: string;
  actorId?: string;
  sourceModule: string; // 'ACADEMICS' | 'DMS' | 'FINANCE' | 'STUDENT' | 'SCHEDULER' etc.
  entityType: string;   // 'FACULTY' | 'DOCUMENT' | 'FEE_INVOICE' | 'STUDENT' | 'TIMETABLE_ENTRY'
  entityId: string;
  payload: T;
  timestamp: Date;
  correlationId: string;
  idempotencyKey?: string;
  metadata?: Record<string, any>;
}

export type EventSubscriptionHandler = (event: ERPEvent) => Promise<void>;

export interface EventDispatchResult {
  eventId: string;
  eventType: ERPEventType;
  tenantId: string;
  triggersMatched: number;
  agentsInvoked: string[];
  dispatchedAt: Date;
  status: 'DISPATCHED' | 'NO_MATCHING_TRIGGER' | 'SKIPPED_INACTIVE' | 'FAILED';
  error?: string;
}
