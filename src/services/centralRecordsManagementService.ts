import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralDocumentDispositionService } from './centralDocumentDispositionService';

export type OfficialRecordType = 
  | 'ACADEMIC_RECORD'
  | 'STUDENT_RECORD'
  | 'ADMISSION_RECORD'
  | 'ATTENDANCE_RECORD'
  | 'EXAMINATION_RECORD'
  | 'FINANCIAL_RECORD'
  | 'HR_RECORD'
  | 'CONTRACT_RECORD'
  | 'COMPLIANCE_RECORD'
  | 'LEGAL_RECORD'
  | 'RESEARCH_RECORD'
  | 'GOVERNANCE_RECORD'
  | 'OTHER';

export type RecordLifecycleStatus = 
  | 'NOT_DECLARED'
  | 'PENDING_REVIEW'
  | 'DECLARED'
  | 'FROZEN'
  | 'ARCHIVED'
  | 'DISPOSITION_ELIGIBLE'
  | 'DISPOSED';

export interface OfficialRecordItem {
  id: string;
  record_number: string;
  title: string;
  record_type: OfficialRecordType;
  record_category: string;
  source_reference: string;
  document_reference?: string;
  owner_id: string;
  organization_id: string;
  department_id: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  privacy_tag: 'PERSONAL_DATA' | 'SENSITIVE_PERSONAL_DATA' | 'NO_PERSONAL_DATA';
  status: RecordLifecycleStatus;
  is_authoritative_copy: boolean;
  retention_schedule_code: string;
  retention_expiry_date: string;
  has_active_legal_hold: boolean;
  is_frozen: boolean;
  declared_at?: string;
  declared_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RecordCorrectionEvent {
  id: string;
  record_id: string;
  correction_type: 'METADATA_CORRECTION' | 'AMENDMENT' | 'CLASSIFICATION_CORRECTION';
  reason: string;
  corrected_by: string;
  corrected_at: string;
}

export interface RecordFreezeRecord {
  id: string;
  freeze_number: string;
  record_id: string;
  reason: string;
  freeze_type: 'LEGAL_HOLD' | 'INVESTIGATION_FREEZE' | 'AUDIT_FREEZE';
  issued_by: string;
  issued_at: string;
  status: 'ACTIVE' | 'RELEASED';
  released_at?: string;
  released_by?: string;
}

export interface RecordsGovernanceDashboardMetrics {
  totalRecordsCount: number;
  declaredRecordsCount: number;
  authoritativeRecordsCount: number;
  frozenRecordsCount: number;
  legalHoldRecordsCount: number;
  dispositionEligibleCount: number;
  disposedRecordsCount: number;
  recordsComplianceScorePercent: number;
  recordsPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralRecordsManagementService {
  private static instance: CentralRecordsManagementService;

  private records: OfficialRecordItem[] = [];
  private corrections: RecordCorrectionEvent[] = [];
  private freezes: RecordFreezeRecord[] = [];

  private recCounter = 100;
  private frzCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralRecordsManagementService {
    if (!CentralRecordsManagementService.instance) {
      CentralRecordsManagementService.instance = new CentralRecordsManagementService();
    }
    return CentralRecordsManagementService.instance;
  }

  private seedDemoData(): void {
    const recId = 'rec-seed-001';
    this.records.push({
      id: recId,
      record_number: 'REC-2026-000001',
      title: 'Permanent Student Convocation Register & Degree Ledger 2026',
      record_type: 'ACADEMIC_RECORD',
      record_category: 'Academic/Graduation',
      source_reference: 'Central Examination Degree Conferral Vault',
      document_reference: 'DOC-2026-000001',
      owner_id: 'emp-reg-001',
      organization_id: 'inst-sit',
      department_id: 'dept-exam',
      classification: 'RESTRICTED',
      privacy_tag: 'SENSITIVE_PERSONAL_DATA',
      status: 'DECLARED',
      is_authoritative_copy: true,
      retention_schedule_code: 'RS-ACADEMIC-PERMANENT',
      retention_expiry_date: '2099-12-31T23:59:59Z',
      has_active_legal_hold: false,
      is_frozen: false,
      declared_at: '2026-01-01T10:00:00Z',
      declared_by: 'emp-reg-001',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });
  }

  // ─── OFFICIAL RECORD DECLARATION & REGISTRATION ───────────────────────

  public declareOfficialRecord(params: {
    title: string;
    recordType: OfficialRecordType;
    recordCategory: string;
    sourceReference: string;
    documentReference?: string;
    ownerId: string;
    organizationId: string;
    departmentId: string;
    classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    privacyTag?: 'PERSONAL_DATA' | 'SENSITIVE_PERSONAL_DATA' | 'NO_PERSONAL_DATA';
    isAuthoritativeCopy: boolean;
    retentionScheduleCode: string;
    retentionDurationYears: number;
    declaredBy: string;
    context?: UserAuthorizationContext;
  }): OfficialRecordItem {
    this.recCounter += 1;
    const recNumber = `REC-2026-${String(this.recCounter).padStart(6, '0')}`;

    const expiryDate = new Date(Date.now() + params.retentionDurationYears * 365 * 24 * 3600 * 1000).toISOString();

    const record: OfficialRecordItem = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      record_number: recNumber,
      title: params.title,
      record_type: params.recordType,
      record_category: params.recordCategory,
      source_reference: params.sourceReference,
      document_reference: params.documentReference,
      owner_id: params.ownerId,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      classification: params.classification,
      privacy_tag: params.privacyTag || 'NO_PERSONAL_DATA',
      status: 'DECLARED',
      is_authoritative_copy: params.isAuthoritativeCopy,
      retention_schedule_code: params.retentionScheduleCode,
      retention_expiry_date: expiryDate,
      has_active_legal_hold: false,
      is_frozen: false,
      declared_at: new Date().toISOString(),
      declared_by: params.declaredBy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.records.push(record);
    return record;
  }

  // ─── IMMUTABILITY & CONTROLLED AMENDMENT ─────────────────────────────

  public amendOfficialRecord(params: {
    recordId: string;
    amendmentReason: string;
    correctedBy: string;
    correctionType: 'METADATA_CORRECTION' | 'AMENDMENT' | 'CLASSIFICATION_CORRECTION';
  }): RecordCorrectionEvent {
    const rec = this.records.find(r => r.id === params.recordId || r.record_number === params.recordId);
    if (!rec) throw new Error(`Record ${params.recordId} not found`);

    if (rec.is_frozen) {
      throw new Error(`Record Amendment Blocked: Record ${rec.record_number} is frozen and cannot be amended`);
    }

    const event: RecordCorrectionEvent = {
      id: `cor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      record_id: rec.id,
      correction_type: params.correctionType,
      reason: params.amendmentReason,
      corrected_by: params.correctedBy,
      corrected_at: new Date().toISOString()
    };

    this.corrections.push(event);
    rec.updated_at = new Date().toISOString();

    return event;
  }

  // ─── LEGAL HOLD & RECORD FREEZE ──────────────────────────────────────

  public applyRecordFreeze(params: {
    recordId: string;
    reason: string;
    freezeType: 'LEGAL_HOLD' | 'INVESTIGATION_FREEZE' | 'AUDIT_FREEZE';
    issuedBy: string;
  }): RecordFreezeRecord {
    const rec = this.records.find(r => r.id === params.recordId || r.record_number === params.recordId);
    if (!rec) throw new Error(`Record ${params.recordId} not found`);

    this.frzCounter += 1;
    const frzNumber = `FRZ-2026-${String(this.frzCounter).padStart(6, '0')}`;

    const freeze: RecordFreezeRecord = {
      id: `frz-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      freeze_number: frzNumber,
      record_id: rec.id,
      reason: params.reason,
      freeze_type: params.freezeType,
      issued_by: params.issuedBy,
      issued_at: new Date().toISOString(),
      status: 'ACTIVE'
    };

    this.freezes.push(freeze);
    rec.is_frozen = true;
    rec.status = 'FROZEN';
    if (params.freezeType === 'LEGAL_HOLD') {
      rec.has_active_legal_hold = true;
    }
    rec.updated_at = new Date().toISOString();

    return freeze;
  }

  public releaseRecordFreeze(freezeId: string, releasedBy: string): RecordFreezeRecord {
    const frz = this.freezes.find(f => f.id === freezeId || f.freeze_number === freezeId);
    if (!frz) throw new Error(`Record Freeze ${freezeId} not found`);

    frz.status = 'RELEASED';
    frz.released_at = new Date().toISOString();
    frz.released_by = releasedBy;

    const rec = this.records.find(r => r.id === frz.record_id);
    if (rec) {
      rec.is_frozen = false;
      rec.has_active_legal_hold = false;
      rec.status = 'DECLARED';
      rec.updated_at = new Date().toISOString();
    }

    return frz;
  }

  // ─── DISPOSITION ELIGIBILITY & SAFE PRE-EXECUTION GATES ──────────────

  public evaluateDispositionEligibility(recordId: string): { eligible: boolean; blockReasons: string[] } {
    const rec = this.records.find(r => r.id === recordId || r.record_number === recordId);
    if (!rec) throw new Error(`Record ${recordId} not found`);

    const blockReasons: string[] = [];
    const now = new Date().getTime();
    const expiryTime = new Date(rec.retention_expiry_date).getTime();

    if (now < expiryTime) {
      blockReasons.push(`Retention Active: Statutory retention period active until ${rec.retention_expiry_date}`);
    }

    if (rec.has_active_legal_hold) {
      blockReasons.push(`Legal Hold Active: Record is under formal legal hold`);
    }

    if (rec.is_frozen) {
      blockReasons.push(`Record Freeze Active: Record is under operational/audit freeze`);
    }

    return {
      eligible: blockReasons.length === 0,
      blockReasons
    };
  }

  public executeBatchDisposition(recordIds: string[], executorId: string): {
    successfulDisposals: string[];
    blockedDisposals: { recordId: string; reason: string }[];
  } {
    const successfulDisposals: string[] = [];
    const blockedDisposals: { recordId: string; reason: string }[] = [];

    for (const rid of recordIds) {
      const rec = this.records.find(r => r.id === rid || r.record_number === rid);
      if (!rec) {
        blockedDisposals.push({ recordId: rid, reason: 'Record not found' });
        continue;
      }

      // Pre-execution immediate safety check
      const evalResult = this.evaluateDispositionEligibility(rec.id);
      if (!evalResult.eligible) {
        blockedDisposals.push({ recordId: rec.record_number, reason: evalResult.blockReasons.join('; ') });
        continue;
      }

      rec.status = 'DISPOSED';
      rec.updated_at = new Date().toISOString();
      successfulDisposals.push(rec.record_number);
    }

    return { successfulDisposals, blockedDisposals };
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getRecordsGovernanceDashboardMetrics(context?: UserAuthorizationContext): RecordsGovernanceDashboardMetrics {
    const totalRecordsCount = this.records.length;
    const declaredRecordsCount = this.records.filter(r => r.status === 'DECLARED').length;
    const authoritativeRecordsCount = this.records.filter(r => r.is_authoritative_copy).length;
    const frozenRecordsCount = this.records.filter(r => r.is_frozen).length;
    const legalHoldRecordsCount = this.records.filter(r => r.has_active_legal_hold).length;
    const disposedRecordsCount = this.records.filter(r => r.status === 'DISPOSED').length;

    return {
      totalRecordsCount,
      declaredRecordsCount,
      authoritativeRecordsCount,
      frozenRecordsCount,
      legalHoldRecordsCount,
      dispositionEligibleCount: 0,
      disposedRecordsCount,
      recordsComplianceScorePercent: 98,
      recordsPosture: 'HEALTHY'
    };
  }
}

export const centralRecordsManagementService = CentralRecordsManagementService.getInstance();
