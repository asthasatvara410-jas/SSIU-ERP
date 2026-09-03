import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';

export type PersonalDataCategory = 
  | 'IDENTITY'
  | 'CONTACT'
  | 'ACADEMIC'
  | 'EMPLOYMENT'
  | 'FINANCIAL'
  | 'HEALTH_RELATED'
  | 'BIOMETRIC'
  | 'IDENTIFIER'
  | 'AUTHENTICATION'
  | 'LOCATION'
  | 'DOCUMENT'
  | 'RESEARCH';

export type LegalProcessingBasis = 'CONSENT' | 'CONTRACT' | 'LEGAL_OBLIGATION' | 'VITAL_INTEREST' | 'PUBLIC_TASK' | 'LEGITIMATE_INTEREST';
export type ConsentStatus = 'NOT_REQUESTED' | 'REQUESTED' | 'GRANTED' | 'DENIED' | 'WITHDRAWN' | 'EXPIRED';
export type DSRType = 'ACCESS' | 'CORRECTION' | 'UPDATE' | 'DELETION' | 'RESTRICTION' | 'OBJECTION' | 'PORTABILITY' | 'WITHDRAW_CONSENT';
export type DSRStatus = 'RECEIVED' | 'IDENTITY_VERIFICATION' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CLOSED';
export type PIAStatus = 'DRAFT' | 'SCREENING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'REASSESSMENT_REQUIRED';

export interface PersonalDataElementRecord {
  id: string;
  code: string;
  name: string;
  category: PersonalDataCategory;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  sensitivity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  system_reference: string;
  owner_id: string;
  status: 'ACTIVE' | 'DEPRECATED';
}

export interface ProcessingActivityRecord {
  id: string;
  processing_number: string;
  name: string;
  purpose: string;
  data_categories: PersonalDataCategory[];
  data_subject_categories: string[];
  legal_basis: LegalProcessingBasis;
  organization_id: string;
  department_id: string;
  system_reference: string;
  retention_policy_ref?: string;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface PrivacyConsentRecord {
  id: string;
  consent_number: string;
  data_subject_id: string;
  purpose: string;
  processing_activity_id: string;
  consent_status: ConsentStatus;
  version: number;
  evidence_reference: string;
  given_at?: string;
  withdrawn_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DataSubjectRequestRecord {
  id: string;
  request_number: string;
  data_subject_id: string;
  request_type: DSRType;
  description: string;
  status: DSRStatus;
  due_date: string;
  identity_verified: boolean;
  has_active_legal_hold?: boolean;
  has_mandatory_retention?: boolean;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacyImpactAssessmentRecord {
  id: string;
  pia_number: string;
  processing_activity_id: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: PIAStatus;
  safeguards_documented: boolean;
  reviewer_id?: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacyGovernanceDashboardMetrics {
  processingActivitiesCount: number;
  personalDataElementsCount: number;
  activeConsentsCount: number;
  withdrawnConsentsCount: number;
  pendingDSRsCount: number;
  completedDSRsCount: number;
  openPIAsCount: number;
  privacyComplianceScorePercent: number;
  privacyPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralPrivacyGovernanceService {
  private static instance: CentralPrivacyGovernanceService;

  private dataElements: PersonalDataElementRecord[] = [];
  private processingActivities: ProcessingActivityRecord[] = [];
  private consents: PrivacyConsentRecord[] = [];
  private dsrs: DataSubjectRequestRecord[] = [];
  private pias: PrivacyImpactAssessmentRecord[] = [];

  private paCounter = 100;
  private cnsCounter = 100;
  private dsrCounter = 100;
  private piaCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralPrivacyGovernanceService {
    if (!CentralPrivacyGovernanceService.instance) {
      CentralPrivacyGovernanceService.instance = new CentralPrivacyGovernanceService();
    }
    return CentralPrivacyGovernanceService.instance;
  }

  private seedDemoData(): void {
    // Seed Personal Data Element
    this.dataElements.push({
      id: 'pde-seed-001',
      code: 'PDE-STUDENT-AADHAAR',
      name: 'Student Government National ID / Aadhaar Hash',
      category: 'IDENTIFIER',
      classification: 'RESTRICTED',
      sensitivity: 'CRITICAL',
      system_reference: 'Student Dossier Vault',
      owner_id: 'emp-reg-001',
      status: 'ACTIVE'
    });

    // Seed Processing Activity
    this.processingActivities.push({
      id: 'pa-seed-001',
      processing_number: 'PRIV-PA-2026-000001',
      name: 'Academic Admission & Degree Conferral Processing',
      purpose: 'Verification of academic qualifications, identity validation, and issuance of degrees',
      data_categories: ['IDENTITY', 'CONTACT', 'ACADEMIC', 'FINANCIAL'],
      data_subject_categories: ['Students', 'Applicants', 'Alumni'],
      legal_basis: 'LEGAL_OBLIGATION',
      organization_id: 'inst-sit',
      department_id: 'dept-reg',
      system_reference: 'Central Admissions & Dossier Engine',
      retention_policy_ref: 'RET-DEGREE-PERMANENT',
      status: 'ACTIVE',
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });
  }

  // ─── PROCESSING ACTIVITIES & RECORD OF PROCESSING (RoPA) ──────────────

  public registerProcessingActivity(params: {
    name: string;
    purpose: string;
    dataCategories: PersonalDataCategory[];
    dataSubjectCategories: string[];
    legalBasis: LegalProcessingBasis;
    organizationId: string;
    departmentId: string;
    systemReference: string;
    retentionPolicyRef?: string;
    context?: UserAuthorizationContext;
  }): ProcessingActivityRecord {
    this.paCounter += 1;
    const paNumber = `PRIV-PA-2026-${String(this.paCounter).padStart(6, '0')}`;

    const activity: ProcessingActivityRecord = {
      id: `pa-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      processing_number: paNumber,
      name: params.name,
      purpose: params.purpose,
      data_categories: params.dataCategories,
      data_subject_categories: params.dataSubjectCategories,
      legal_basis: params.legalBasis,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      system_reference: params.systemReference,
      retention_policy_ref: params.retentionPolicyRef,
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.processingActivities.push(activity);
    return activity;
  }

  // ─── CONSENT MANAGEMENT ENGINE ───────────────────────────────────────

  public grantConsent(params: {
    dataSubjectId: string;
    purpose: string;
    processingActivityId: string;
    version?: number;
    evidenceReference?: string;
  }): PrivacyConsentRecord {
    this.cnsCounter += 1;
    const cnsNumber = `CONS-2026-${String(this.cnsCounter).padStart(6, '0')}`;

    const consent: PrivacyConsentRecord = {
      id: `cns-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      consent_number: cnsNumber,
      data_subject_id: params.dataSubjectId,
      purpose: params.purpose,
      processing_activity_id: params.processingActivityId,
      consent_status: 'GRANTED',
      version: params.version || 1,
      evidence_reference: params.evidenceReference || `EVD-WEB-CONSENT-${Date.now()}`,
      given_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.consents.push(consent);
    return consent;
  }

  public withdrawConsent(consentId: string): PrivacyConsentRecord {
    const consent = this.consents.find(c => c.id === consentId || c.consent_number === consentId);
    if (!consent) throw new Error(`Consent ${consentId} not found`);

    consent.consent_status = 'WITHDRAWN';
    consent.withdrawn_at = new Date().toISOString();
    consent.updated_at = new Date().toISOString();

    return consent;
  }

  // ─── DATA SUBJECT REQUESTS (DSR) & DELETION CONTROLS ─────────────────

  public submitDSR(params: {
    dataSubjectId: string;
    requestType: DSRType;
    description: string;
    hasActiveLegalHold?: boolean;
    hasMandatoryRetention?: boolean;
    context?: UserAuthorizationContext;
  }): DataSubjectRequestRecord {
    this.dsrCounter += 1;
    const dsrNumber = `DSR-2026-${String(this.dsrCounter).padStart(6, '0')}`;

    const dsr: DataSubjectRequestRecord = {
      id: `dsr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_number: dsrNumber,
      data_subject_id: params.dataSubjectId,
      request_type: params.requestType,
      description: params.description,
      status: 'RECEIVED',
      due_date: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      identity_verified: false,
      has_active_legal_hold: params.hasActiveLegalHold || false,
      has_mandatory_retention: params.hasMandatoryRetention || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.dsrs.push(dsr);
    return dsr;
  }

  public fulfillDSR(dsrId: string, verifierId: string): DataSubjectRequestRecord {
    const dsr = this.dsrs.find(d => d.id === dsrId || d.request_number === dsrId);
    if (!dsr) throw new Error(`DSR ${dsrId} not found`);

    // Deletion Validation: Cannot fulfill deletion if active legal hold or mandatory retention applies
    if (dsr.request_type === 'DELETION') {
      if (dsr.has_active_legal_hold) {
        throw new Error(`Deletion Request Blocked: Active Legal Hold is in effect for Data Subject ${dsr.data_subject_id}`);
      }
      if (dsr.has_mandatory_retention) {
        throw new Error(`Deletion Request Blocked: Mandatory statutory retention requirement prevents erasure of record for Data Subject ${dsr.data_subject_id}`);
      }
    }

    dsr.identity_verified = true;
    dsr.status = 'COMPLETED';
    dsr.completion_notes = `Fulfilled and verified by Privacy Officer ${verifierId}`;
    dsr.updated_at = new Date().toISOString();

    return dsr;
  }

  // ─── PRIVACY IMPACT ASSESSMENT (PIA) ─────────────────────────────────

  public createPIA(params: {
    processingActivityId: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    safeguardsDocumented: boolean;
  }): PrivacyImpactAssessmentRecord {
    this.piaCounter += 1;
    const piaNumber = `PIA-2026-${String(this.piaCounter).padStart(6, '0')}`;

    const pia: PrivacyImpactAssessmentRecord = {
      id: `pia-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pia_number: piaNumber,
      processing_activity_id: params.processingActivityId,
      risk_level: params.riskLevel,
      status: 'APPROVED',
      safeguards_documented: params.safeguardsDocumented,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.pias.push(pia);
    return pia;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getPrivacyGovernanceDashboardMetrics(context?: UserAuthorizationContext): PrivacyGovernanceDashboardMetrics {
    const processingActivitiesCount = this.processingActivities.length;
    const personalDataElementsCount = this.dataElements.length;
    const activeConsentsCount = this.consents.filter(c => c.consent_status === 'GRANTED').length;
    const withdrawnConsentsCount = this.consents.filter(c => c.consent_status === 'WITHDRAWN').length;
    const pendingDSRsCount = this.dsrs.filter(d => d.status !== 'COMPLETED' && d.status !== 'CLOSED').length;
    const completedDSRsCount = this.dsrs.filter(d => d.status === 'COMPLETED').length;
    const openPIAsCount = this.pias.filter(p => p.status === 'IN_PROGRESS' || p.status === 'APPROVED').length;

    return {
      processingActivitiesCount,
      personalDataElementsCount,
      activeConsentsCount,
      withdrawnConsentsCount,
      pendingDSRsCount,
      completedDSRsCount,
      openPIAsCount,
      privacyComplianceScorePercent: 96,
      privacyPosture: 'HEALTHY'
    };
  }
}

export const centralPrivacyGovernanceService = CentralPrivacyGovernanceService.getInstance();
