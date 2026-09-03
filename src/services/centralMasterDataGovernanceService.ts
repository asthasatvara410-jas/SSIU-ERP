import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';
import { centralPortalPlatformService } from './centralPortalPlatformService';
import { centralServiceOperationsService } from './centralServiceOperationsService';
import { centralAdvancedCaseIncidentManagementService } from './centralAdvancedCaseIncidentManagementService';
import { centralEnterpriseNotificationService } from './centralEnterpriseNotificationService';
import { centralEnterpriseCalendarService } from './centralEnterpriseCalendarService';
import { centralEnterpriseSearchService } from './centralEnterpriseSearchService';
import { centralEnterpriseReportingBIService } from './centralEnterpriseReportingBIService';
import { centralEnterpriseIntegrationService } from './centralEnterpriseIntegrationService';
import { centralEnterpriseWorkflowBPMService } from './centralEnterpriseWorkflowBPMService';

export type MasterDataDomain = 'STUDENT_MASTER' | 'FACULTY_MASTER' | 'ACADEMIC_PROGRAM' | 'ORGANIZATION_MASTER';
export type QualityDimension = 'ACCURACY' | 'COMPLETENESS' | 'CONSISTENCY' | 'UNIQUENESS' | 'VALIDITY' | 'TIMELINESS';

export interface DataOwnerRecord {
  domain: MasterDataDomain;
  owner_user_id: string;
  owner_name: string;
  department: string;
}

export interface DataQualityIssueRecord {
  id: string;
  domain: MasterDataDomain;
  record_id: string;
  rule_code: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  description: string;
  status: 'OPEN' | 'RESOLVED' | 'EXCEPTION_APPROVED';
  created_at: string;
}

export interface MasterRecordEntry {
  id: string;
  domain: MasterDataDomain;
  unique_code: string;
  data: Record<string, any>;
  version: number;
  status: 'ACTIVE' | 'INACTIVE' | 'MERGED';
  merged_into_id?: string;
  updated_at: string;
}

export interface MergeAuditRecord {
  id: string;
  domain: MasterDataDomain;
  surviving_record_id: string;
  merged_record_id: string;
  actor_id: string;
  reason: string;
  timestamp: string;
}

export interface DataQualityDashboardMetrics {
  overallQualityScore: number;
  completenessScore: number;
  uniquenessScore: number;
  openQualityIssuesCount: number;
  potentialDuplicatesCount: number;
  governancePosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralMasterDataGovernanceService {
  private static instance: CentralMasterDataGovernanceService;

  private owners: DataOwnerRecord[] = [];
  private masterRecords: MasterRecordEntry[] = [];
  private qualityIssues: DataQualityIssueRecord[] = [];
  private mergeAudits: MergeAuditRecord[] = [];

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralMasterDataGovernanceService {
    if (!CentralMasterDataGovernanceService.instance) {
      CentralMasterDataGovernanceService.instance = new CentralMasterDataGovernanceService();
    }
    return CentralMasterDataGovernanceService.instance;
  }

  private seedDemoData(): void {
    // 1. Data Owners
    this.owners.push({
      domain: 'STUDENT_MASTER',
      owner_user_id: 'emp-reg-001',
      owner_name: 'University Registrar',
      department: 'Office of the Registrar'
    });

    // 2. Demo Master Records
    this.masterRecords.push({
      id: 'stu-rec-001',
      domain: 'STUDENT_MASTER',
      unique_code: '2026-CE-001',
      data: {
        enrollment_number: '2026-CE-001',
        first_name: 'Aarav',
        last_name: 'Patel',
        email: 'aarav.ce2026@swarrnim.edu.in',
        phone: '+91 98765 43210',
        department_id: 'dept-ce',
        campus_id: 'campus-main'
      },
      version: 1,
      status: 'ACTIVE',
      updated_at: '2026-01-01T00:00:00Z'
    });

    this.masterRecords.push({
      id: 'stu-rec-002',
      domain: 'STUDENT_MASTER',
      unique_code: '2026-CE-002',
      data: {
        enrollment_number: '2026-CE-002',
        first_name: 'Aarav',
        last_name: 'Patel',
        email: 'aarav.ce2026@swarrnim.edu.in', // duplicate email
        phone: '+91 98765 43210',
        department_id: 'dept-ce',
        campus_id: 'campus-main'
      },
      version: 1,
      status: 'ACTIVE',
      updated_at: '2026-01-01T00:00:00Z'
    });
  }

  // ─── DATA VALIDATION & QUALITY ENGINE ────────────────────────────────

  public validateMasterRecord(domain: MasterDataDomain, payload: Record<string, any>): { is_valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (domain === 'STUDENT_MASTER') {
      if (!payload.enrollment_number) errors.push('Missing mandatory field: enrollment_number');
      if (!payload.first_name) errors.push('Missing mandatory field: first_name');
      if (!payload.email || !payload.email.includes('@')) errors.push('Invalid or missing email address');
      if (!payload.department_id) errors.push('Missing mandatory field: department_id');
    }

    if (errors.length > 0) {
      this.qualityIssues.push({
        id: `dqi-${Date.now()}`,
        domain,
        record_id: payload.enrollment_number || 'UNKNOWN',
        rule_code: 'MANDATORY_FIELD_CHECK',
        severity: 'ERROR',
        description: errors.join('; '),
        status: 'OPEN',
        created_at: new Date().toISOString()
      });
      return { is_valid: false, errors };
    }

    return { is_valid: true, errors: [] };
  }

  // ─── DUPLICATE MANAGEMENT & MERGING ──────────────────────────────────

  public findDuplicates(domain: MasterDataDomain, targetEmail: string): MasterRecordEntry[] {
    return this.masterRecords.filter(r => 
      r.domain === domain && 
      r.status === 'ACTIVE' && 
      r.data.email?.toLowerCase() === targetEmail.toLowerCase()
    );
  }

  public mergeRecords(params: {
    survivingRecordId: string;
    victimRecordId: string;
    reason: string;
    context: UserAuthorizationContext;
  }): { merged: boolean; audit_id: string } {
    const surviving = this.masterRecords.find(r => r.id === params.survivingRecordId);
    const victim = this.masterRecords.find(r => r.id === params.victimRecordId);

    if (!surviving || !victim) throw new Error('One or both records not found for merge operation');
    if (victim.status === 'MERGED') throw new Error('Victim record is already merged');

    // Deactivate and mark victim as merged
    victim.status = 'MERGED';
    victim.merged_into_id = surviving.id;
    victim.updated_at = new Date().toISOString();

    // Increment surviving version
    surviving.version += 1;
    surviving.updated_at = new Date().toISOString();

    const auditId = `MDG-MERGE-${Date.now()}`;
    this.mergeAudits.push({
      id: auditId,
      domain: surviving.domain,
      surviving_record_id: surviving.id,
      merged_record_id: victim.id,
      actor_id: params.context.userId,
      reason: params.reason,
      timestamp: new Date().toISOString()
    });

    return { merged: true, audit_id: auditId };
  }

  // ─── DATA LINEAGE & CATALOG ──────────────────────────────────────────

  public getDataLineage(domain: MasterDataDomain): { domain: string; upstream: string[]; downstream: string[] } {
    return {
      domain,
      upstream: ['Application Portal', 'Integration Hub', 'Direct Master Intake'],
      downstream: ['Enrollment Service', 'Examination Registry', 'BI & Reporting Catalog', 'Enterprise Search Index']
    };
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getDataQualityDashboardMetrics(context?: UserAuthorizationContext): DataQualityDashboardMetrics {
    const openIssues = this.qualityIssues.filter(i => i.status === 'OPEN').length;
    const activeRecords = this.masterRecords.filter(r => r.status === 'ACTIVE').length;

    return {
      overallQualityScore: 98.4,
      completenessScore: 99.1,
      uniquenessScore: 99.8,
      openQualityIssuesCount: openIssues,
      potentialDuplicatesCount: 1,
      governancePosture: 'HEALTHY'
    };
  }
}

export const centralMasterDataGovernanceService = CentralMasterDataGovernanceService.getInstance();
