import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralDocumentComplianceService } from './centralDocumentComplianceService';

export type ArchiveStorageTier = 'HOT' | 'WARM' | 'COLD';
export type ArchiveRequestStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
export type ArchiveIntegrityStatus = 'HEALTHY' | 'INTEGRITY_FAILURE' | 'UNAVAILABLE';
export type RestoreRequestStatus = 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

export interface DocumentArchiveRecord {
  id: string;
  archive_reference: string;
  document_id: string;
  version_id?: string;
  title: string;
  document_type_id: string;
  entity_type: string;
  entity_id: string;
  organization_id: string;
  department_id: string;
  academic_year: string;
  storage_tier: ArchiveStorageTier;
  original_file_name: string;
  file_size_bytes: number;
  integrity_hash: string;
  integrity_status: ArchiveIntegrityStatus;
  archive_reason: string;
  archived_by: string;
  archived_at: string;
  retention_end_at?: string;
  is_on_hold: boolean;
  status: 'ARCHIVED' | 'RESTORED' | 'DISPOSED';
}

export interface DocumentArchiveRequestRecord {
  id: string;
  request_number: string;
  document_id: string;
  version_id?: string;
  storage_tier: ArchiveStorageTier;
  reason: string;
  status: ArchiveRequestStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  executed_at?: string;
}

export interface DocumentRestoreRequestRecord {
  id: string;
  request_number: string;
  archive_id: string;
  document_id: string;
  reason: string;
  status: RestoreRequestStatus;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  restored_at?: string;
}

export interface ArchivePolicyRecord {
  id: string;
  policy_code: string;
  name: string;
  document_type_id: string;
  inactivity_years_threshold: number;
  default_storage_tier: ArchiveStorageTier;
  approval_required: boolean;
  status: 'ACTIVE' | 'RETIRED';
}

export interface ArchiveDashboardMetrics {
  totalArchivedCount: number;
  archivedThisPeriodCount: number;
  archiveEligibleCount: number;
  pendingArchiveRequestsCount: number;
  pendingRestoreRequestsCount: number;
  integrityFailuresCount: number;
  coldStorageSizeBytes: number;
  storageByTier: Record<ArchiveStorageTier, number>;
}

class CentralDocumentArchiveService {
  private static instance: CentralDocumentArchiveService;

  private archives: DocumentArchiveRecord[] = [];
  private archiveRequests: DocumentArchiveRequestRecord[] = [];
  private restoreRequests: DocumentRestoreRequestRecord[] = [];
  private policies: ArchivePolicyRecord[] = [];
  private arcCounter = 100;
  private reqCounter = 100;
  private rstCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralDocumentArchiveService {
    if (!CentralDocumentArchiveService.instance) {
      CentralDocumentArchiveService.instance = new CentralDocumentArchiveService();
    }
    return CentralDocumentArchiveService.instance;
  }

  private seedDemoData(): void {
    this.policies.push({
      id: 'apol-001',
      policy_code: 'ARC_STUDENT_ACADEMIC_3Y',
      name: 'Graduated Student Academic Record 3-Year Inactive Archival',
      document_type_id: 'DOC_DEGREE_CERT',
      inactivity_years_threshold: 3,
      default_storage_tier: 'COLD',
      approval_required: true,
      status: 'ACTIVE'
    });

    // Seed 1 active archived record
    this.archives.push({
      id: 'arc-seed-001',
      archive_reference: 'ARC/2026/000001',
      document_id: 'dms-doc-arch-001',
      title: 'Batch 2022 Degree Certificate - Rahul Sharma',
      document_type_id: 'DOC_DEGREE_CERT',
      entity_type: 'STUDENT',
      entity_id: 'STU-2022-00912',
      organization_id: 'inst-sit',
      department_id: 'dept-cse',
      academic_year: '2021-2022',
      storage_tier: 'COLD',
      original_file_name: 'degree_rahul_sharma.pdf',
      file_size_bytes: 1048576,
      integrity_hash: 'sha256_arc_998124019aeb',
      integrity_status: 'HEALTHY',
      archive_reason: 'Graduated student record reaching 3-year inactivity threshold',
      archived_by: 'emp-reg-001',
      archived_at: '2026-01-15T10:00:00Z',
      retention_end_at: '2033-01-15T10:00:00Z',
      is_on_hold: false,
      status: 'ARCHIVED'
    });
  }

  // ─── ELIGIBILITY & SIMULATION ─────────────────────────────────────────

  public checkArchiveEligibility(documentId: string): { isEligible: boolean; reason: string; applicablePolicy?: ArchivePolicyRecord } {
    // Check if already disposed
    const retentionSchedules = centralDocumentComplianceService.getActiveHolds();
    const isHeld = retentionSchedules.some(h => h.document_id === documentId && h.status === 'ACTIVE');

    const policy = this.policies.find(p => p.status === 'ACTIVE');

    return {
      isEligible: true,
      reason: isHeld ? 'Document is under legal hold; archival allowed, disposal protected' : 'Eligible for long-term cold archival',
      applicablePolicy: policy
    };
  }

  public simulateArchivePolicy(params: {
    documentTypeId: string;
    inactivityYears: number;
  }): { isEligible: boolean; recommendedTier: ArchiveStorageTier; approvalRequired: boolean } {
    const matched = this.policies.find(p => p.document_type_id === params.documentTypeId && p.status === 'ACTIVE');
    if (!matched) {
      return {
        isEligible: false,
        recommendedTier: 'WARM',
        approvalRequired: true
      };
    }

    const isEligible = params.inactivityYears >= matched.inactivity_years_threshold;
    return {
      isEligible,
      recommendedTier: matched.default_storage_tier,
      approvalRequired: matched.approval_required
    };
  }

  // ─── ARCHIVE REQUEST & EXECUTION ──────────────────────────────────────

  public createArchiveRequest(params: {
    documentId: string;
    versionId?: string;
    storageTier?: ArchiveStorageTier;
    reason: string;
    requestedBy: string;
    context?: UserAuthorizationContext;
  }): DocumentArchiveRequestRecord {
    this.reqCounter += 1;
    const requestNumber = `ARQ/2026/${String(this.reqCounter).padStart(6, '0')}`;

    const request: DocumentArchiveRequestRecord = {
      id: `arq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_number: requestNumber,
      document_id: params.documentId,
      version_id: params.versionId,
      storage_tier: params.storageTier || 'COLD',
      reason: params.reason,
      status: 'SUBMITTED',
      requested_by: params.requestedBy,
      requested_at: new Date().toISOString()
    };

    this.archiveRequests.push(request);
    return request;
  }

  public approveArchiveRequest(requestId: string, approvedBy: string): DocumentArchiveRequestRecord {
    const req = this.archiveRequests.find(r => r.id === requestId);
    if (!req) throw new Error(`Archive request ${requestId} not found`);

    req.status = 'APPROVED';
    req.approved_by = approvedBy;
    req.approved_at = new Date().toISOString();

    return req;
  }

  public executeArchive(params: {
    requestId?: string;
    documentId: string;
    versionId?: string;
    storageTier?: ArchiveStorageTier;
    reason: string;
    executedBy: string;
    context?: UserAuthorizationContext;
  }): DocumentArchiveRecord {
    // Check if already archived to avoid duplicate
    const existing = this.archives.find(a => a.document_id === params.documentId && a.status === 'ARCHIVED');
    if (existing) return existing;

    this.arcCounter += 1;
    const archiveRef = `ARC/2026/${String(this.arcCounter).padStart(6, '0')}`;
    const hash = `sha256_arc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const archiveRecord: DocumentArchiveRecord = {
      id: `arc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      archive_reference: archiveRef,
      document_id: params.documentId,
      version_id: params.versionId,
      title: `Archived Document Record (${params.documentId})`,
      document_type_id: 'DOC_DEGREE_CERT',
      entity_type: 'STUDENT',
      entity_id: 'STU-2026-000001',
      organization_id: 'inst-sit',
      department_id: 'dept-cse',
      academic_year: '2025-2026',
      storage_tier: params.storageTier || 'COLD',
      original_file_name: `${params.documentId}_archive.pdf`,
      file_size_bytes: 2097152,
      integrity_hash: hash,
      integrity_status: 'HEALTHY',
      archive_reason: params.reason,
      archived_by: params.executedBy,
      archived_at: new Date().toISOString(),
      retention_end_at: '2033-08-29T00:00:00Z',
      is_on_hold: false,
      status: 'ARCHIVED'
    };

    this.archives.push(archiveRecord);

    if (params.requestId) {
      const req = this.archiveRequests.find(r => r.id === params.requestId);
      if (req) {
        req.status = 'COMPLETED';
        req.executed_at = new Date().toISOString();
      }
    }

    return archiveRecord;
  }

  // ─── INTEGRITY VERIFICATION ──────────────────────────────────────────

  public verifyArchiveIntegrity(archiveId: string, simulatedCorrupt: boolean = false): { status: ArchiveIntegrityStatus; verifiedAt: string } {
    const arc = this.archives.find(a => a.id === archiveId || a.archive_reference === archiveId);
    if (!arc) throw new Error(`Archive record ${archiveId} not found`);

    if (simulatedCorrupt) {
      arc.integrity_status = 'INTEGRITY_FAILURE';
      return { status: 'INTEGRITY_FAILURE', verifiedAt: new Date().toISOString() };
    }

    arc.integrity_status = 'HEALTHY';
    return { status: 'HEALTHY', verifiedAt: new Date().toISOString() };
  }

  // ─── RESTORE WORKFLOW & CONFLICT HANDLING ─────────────────────────────

  public createRestoreRequest(params: {
    archiveId: string;
    reason: string;
    requestedBy: string;
  }): DocumentRestoreRequestRecord {
    const arc = this.archives.find(a => a.id === params.archiveId || a.archive_reference === params.archiveId);
    if (!arc) throw new Error(`Archive record ${params.archiveId} not found`);

    if (arc.status === 'DISPOSED') {
      throw new Error(`Cannot restore disposed record ${params.archiveId}`);
    }

    this.rstCounter += 1;
    const requestNumber = `RST/2026/${String(this.rstCounter).padStart(6, '0')}`;

    const request: DocumentRestoreRequestRecord = {
      id: `rst-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      request_number: requestNumber,
      archive_id: arc.id,
      document_id: arc.document_id,
      reason: params.reason,
      status: 'SUBMITTED',
      requested_by: params.requestedBy,
      requested_at: new Date().toISOString()
    };

    this.restoreRequests.push(request);
    return request;
  }

  public approveRestoreRequest(restoreId: string, approvedBy: string): DocumentRestoreRequestRecord {
    const rst = this.restoreRequests.find(r => r.id === restoreId);
    if (!rst) throw new Error(`Restore request ${restoreId} not found`);

    rst.status = 'APPROVED';
    rst.approved_by = approvedBy;
    rst.approved_at = new Date().toISOString();

    return rst;
  }

  public executeRestore(restoreId: string): DocumentArchiveRecord {
    const rst = this.restoreRequests.find(r => r.id === restoreId);
    if (!rst) throw new Error(`Restore request ${restoreId} not found`);

    const arc = this.archives.find(a => a.id === rst.archive_id);
    if (!arc) throw new Error(`Archive record for restore ${restoreId} not found`);

    arc.status = 'RESTORED';
    rst.status = 'COMPLETED';
    rst.restored_at = new Date().toISOString();

    return arc;
  }

  // ─── SEARCH & FILTERS ────────────────────────────────────────────────

  public searchArchivedDocuments(params: {
    query?: string;
    organizationId?: string;
    departmentId?: string;
    storageTier?: ArchiveStorageTier;
    status?: 'ARCHIVED' | 'RESTORED' | 'DISPOSED';
    page?: number;
    pageSize?: number;
    context?: UserAuthorizationContext;
  }): { items: DocumentArchiveRecord[]; total: number; page: number; totalPages: number } {
    let filtered = [...this.archives];

    // Institute Scope Enforcement
    if (params.context?.instituteId && params.context.instituteId !== 'ALL') {
      filtered = filtered.filter(a => a.organization_id === params.context?.instituteId);
    }

    if (params.organizationId) {
      filtered = filtered.filter(a => a.organization_id === params.organizationId);
    }
    if (params.departmentId) {
      filtered = filtered.filter(a => a.department_id === params.departmentId);
    }
    if (params.storageTier) {
      filtered = filtered.filter(a => a.storage_tier === params.storageTier);
    }
    if (params.status) {
      filtered = filtered.filter(a => a.status === params.status);
    }
    if (params.query) {
      const q = params.query.toLowerCase();
      filtered = filtered.filter(a =>
        a.archive_reference.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        a.document_id.toLowerCase().includes(q) ||
        a.entity_id.toLowerCase().includes(q)
      );
    }

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const total = filtered.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const items = filtered.slice((page - 1) * pageSize, page * pageSize);

    return { items, total, page, totalPages };
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getArchiveDashboardMetrics(context?: UserAuthorizationContext): ArchiveDashboardMetrics {
    const totalArchivedCount = this.archives.filter(a => a.status === 'ARCHIVED').length;
    const archivedThisPeriodCount = this.archives.length;
    const archiveEligibleCount = 12; // eligible records awaiting batch run
    const pendingArchiveRequestsCount = this.archiveRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const pendingRestoreRequestsCount = this.restoreRequests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const integrityFailuresCount = this.archives.filter(a => a.integrity_status === 'INTEGRITY_FAILURE').length;

    const coldStorageSizeBytes = this.archives
      .filter(a => a.storage_tier === 'COLD')
      .reduce((acc, curr) => acc + curr.file_size_bytes, 0);

    const storageByTier: Record<ArchiveStorageTier, number> = {
      HOT: this.archives.filter(a => a.storage_tier === 'HOT').reduce((acc, curr) => acc + curr.file_size_bytes, 0),
      WARM: this.archives.filter(a => a.storage_tier === 'WARM').reduce((acc, curr) => acc + curr.file_size_bytes, 0),
      COLD: coldStorageSizeBytes
    };

    return {
      totalArchivedCount,
      archivedThisPeriodCount,
      archiveEligibleCount,
      pendingArchiveRequestsCount,
      pendingRestoreRequestsCount,
      integrityFailuresCount,
      coldStorageSizeBytes,
      storageByTier
    };
  }
}

export const centralDocumentArchiveService = CentralDocumentArchiveService.getInstance();
