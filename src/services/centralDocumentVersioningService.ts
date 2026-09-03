import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';

export type VersionType = 'MAJOR' | 'MINOR';

export type VersionStatus = 
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'REJECTED'
  | 'ARCHIVED'
  | 'DISPOSED';

export interface DocumentVersionDetailRecord {
  id: string;
  document_id: string;
  version_number: string; // e.g. "1.0", "1.1", "2.0"
  major: number;
  minor: number;
  version_type: VersionType;
  status: VersionStatus;
  parent_version_id?: string;
  source_version_id?: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  content_hash: string;
  content_payload?: string;
  change_reason: string;
  change_summary: string;
  created_by: string;
  created_at: string;
  published_by?: string;
  published_at?: string;
  approved_by?: string;
  approved_at?: string;
  superseded_at?: string;
}

export interface VersionComparisonResult {
  versionA: string;
  versionB: string;
  metadataChanges: Record<string, { oldVal: any; newVal: any }>;
  contentChanges: {
    added: string[];
    removed: string[];
    unchanged: string[];
  };
  isIdentical: boolean;
}

export interface DocumentVersioningDashboardMetrics {
  totalVersionsCount: number;
  draftVersionsCount: number;
  publishedVersionsCount: number;
  supersededVersionsCount: number;
  restoredVersionsCount: number;
}

class CentralDocumentVersioningService {
  private static instance: CentralDocumentVersioningService;

  private versions: DocumentVersionDetailRecord[] = [];

  private constructor() {
    this.seedDemoVersions();
  }

  public static getInstance(): CentralDocumentVersioningService {
    if (!CentralDocumentVersioningService.instance) {
      CentralDocumentVersioningService.instance = new CentralDocumentVersioningService();
    }
    return CentralDocumentVersioningService.instance;
  }

  private seedDemoVersions(): void {
    // Seed baseline version 1.0 for Aarav Patel Aadhaar
    this.versions.push({
      id: 'ver-001',
      document_id: 'dms-doc-001',
      version_number: '1.0',
      major: 1,
      minor: 0,
      version_type: 'MAJOR',
      status: 'PUBLISHED',
      file_name: 'Aadhaar_Card_AaravPatel.pdf',
      file_size_bytes: 1245000,
      mime_type: 'application/pdf',
      content_hash: 'sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      content_payload: 'Aadhaar Card - Aarav Patel - Original Admission Upload 2026',
      change_reason: 'Initial Upload',
      change_summary: 'Baseline student identity document submitted during admission.',
      created_by: 'STU-2026-000001',
      created_at: '2026-04-10T10:00:00Z',
      published_by: 'STU-2026-000001',
      published_at: '2026-04-10T10:00:00Z'
    });
  }

  // ─── CREATE NEW DRAFT VERSION (MAJOR / MINOR) ─────────────────────────

  public createDraftVersion(params: {
    documentId: string;
    versionType: VersionType;
    fileName: string;
    fileSizeBytes: number;
    mimeType: string;
    contentPayload: string;
    changeReason: string;
    changeSummary: string;
    createdBy: string;
    sourceVersionId?: string;
  }): DocumentVersionDetailRecord {
    const docVersions = this.versions.filter(v => v.document_id === params.documentId);
    if (docVersions.length === 0) {
      throw new Error(`Document ${params.documentId} has no initial baseline version`);
    }

    // Determine highest current version
    const publishedVer = docVersions.find(v => v.status === 'PUBLISHED') || docVersions[docVersions.length - 1];
    let nextMajor = publishedVer.major;
    let nextMinor = publishedVer.minor;

    if (params.versionType === 'MAJOR') {
      nextMajor += 1;
      nextMinor = 0;
    } else {
      nextMinor += 1;
    }

    const versionNumber = `${nextMajor}.${nextMinor}`;
    const contentHash = `sha256_ver_${params.documentId}_${versionNumber}_${Date.now()}`;
    const versionId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const draft: DocumentVersionDetailRecord = {
      id: versionId,
      document_id: params.documentId,
      version_number: versionNumber,
      major: nextMajor,
      minor: nextMinor,
      version_type: params.versionType,
      status: 'DRAFT',
      parent_version_id: publishedVer.id,
      source_version_id: params.sourceVersionId,
      file_name: params.fileName,
      file_size_bytes: params.fileSizeBytes,
      mime_type: params.mimeType,
      content_hash: contentHash,
      content_payload: params.contentPayload,
      change_reason: params.changeReason,
      change_summary: params.changeSummary,
      created_by: params.createdBy,
      created_at: new Date().toISOString()
    };

    this.versions.push(draft);
    return draft;
  }

  // ─── PUBLISH DRAFT & SUPERSEDE PREVIOUS VERSION ───────────────────────

  public publishVersion(params: {
    versionId: string;
    publishedBy: string;
    approvedBy?: string;
    context?: UserAuthorizationContext;
  }): DocumentVersionDetailRecord {
    const ver = this.versions.find(v => v.id === params.versionId);
    if (!ver) throw new Error(`Version ${params.versionId} not found`);

    if (ver.status === 'PUBLISHED') {
      return ver;
    }

    // 1. Supersede existing published version for this document
    const previousPublished = this.versions.find(v => v.document_id === ver.document_id && v.status === 'PUBLISHED');
    if (previousPublished) {
      previousPublished.status = 'SUPERSEDED';
      previousPublished.superseded_at = new Date().toISOString();
    }

    // 2. Publish new version
    ver.status = 'PUBLISHED';
    ver.published_by = params.publishedBy;
    ver.published_at = new Date().toISOString();
    if (params.approvedBy) {
      ver.approved_by = params.approvedBy;
      ver.approved_at = new Date().toISOString();
    }

    // 3. Update current_version_id in Central DMS
    const doc = centralDocumentManagementService.getDocumentById(ver.document_id);
    if (doc) {
      doc.current_version_id = ver.id;
      doc.updated_at = new Date().toISOString();
    }

    return ver;
  }

  // ─── VERSION RESTORE ENGINE (CREATES NEW VERSION FROM HISTORICAL) ─────

  public restoreVersionAsNew(params: {
    documentId: string;
    historicalVersionId: string;
    restorationReason: string;
    restoredBy: string;
    context?: UserAuthorizationContext;
  }): DocumentVersionDetailRecord {
    const historicalVer = this.versions.find(v => v.id === params.historicalVersionId && v.document_id === params.documentId);
    if (!historicalVer) {
      throw new Error(`Historical version ${params.historicalVersionId} not found for document ${params.documentId}`);
    }

    // Create a new MAJOR draft containing historical content
    const newDraft = this.createDraftVersion({
      documentId: params.documentId,
      versionType: 'MAJOR',
      fileName: historicalVer.file_name,
      fileSizeBytes: historicalVer.file_size_bytes,
      mimeType: historicalVer.mime_type,
      contentPayload: historicalVer.content_payload || '',
      changeReason: `Restored from historical Version ${historicalVer.version_number}`,
      changeSummary: params.restorationReason,
      createdBy: params.restoredBy,
      sourceVersionId: historicalVer.id
    });

    return this.publishVersion({
      versionId: newDraft.id,
      publishedBy: params.restoredBy,
      context: params.context
    });
  }

  // ─── VERSION COMPARISON & DIFF ENGINE ─────────────────────────────────

  public compareVersions(versionIdA: string, versionIdB: string): VersionComparisonResult {
    const verA = this.versions.find(v => v.id === versionIdA);
    const verB = this.versions.find(v => v.id === versionIdB);

    if (!verA || !verB) {
      throw new Error('Both version IDs must be valid for comparison');
    }

    const payloadA = verA.content_payload || '';
    const payloadB = verB.content_payload || '';

    const linesA = payloadA.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const linesB = payloadB.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const added = linesB.filter(l => !linesA.includes(l));
    const removed = linesA.filter(l => !linesB.includes(l));
    const unchanged = linesA.filter(l => linesB.includes(l));

    const metadataChanges: Record<string, { oldVal: any; newVal: any }> = {};
    if (verA.file_name !== verB.file_name) {
      metadataChanges.file_name = { oldVal: verA.file_name, newVal: verB.file_name };
    }
    if (verA.file_size_bytes !== verB.file_size_bytes) {
      metadataChanges.file_size_bytes = { oldVal: verA.file_size_bytes, newVal: verB.file_size_bytes };
    }

    return {
      versionA: verA.version_number,
      versionB: verB.version_number,
      metadataChanges,
      contentChanges: { added, removed, unchanged },
      isIdentical: added.length === 0 && removed.length === 0 && Object.keys(metadataChanges).length === 0
    };
  }

  // ─── GET VERSION HISTORY & TREE ───────────────────────────────────────

  public getVersionHistory(documentId: string): DocumentVersionDetailRecord[] {
    return this.versions
      .filter(v => v.document_id === documentId)
      .sort((a, b) => {
        if (a.major !== b.major) return a.major - b.major;
        return a.minor - b.minor;
      });
  }

  // ─── DASHBOARD & METRICS ENGINE ───────────────────────────────────────

  public getVersioningDashboardMetrics(context?: UserAuthorizationContext): DocumentVersioningDashboardMetrics {
    const totalVersionsCount = this.versions.length;
    const draftVersionsCount = this.versions.filter(v => v.status === 'DRAFT').length;
    const publishedVersionsCount = this.versions.filter(v => v.status === 'PUBLISHED').length;
    const supersededVersionsCount = this.versions.filter(v => v.status === 'SUPERSEDED').length;
    const restoredVersionsCount = this.versions.filter(v => v.source_version_id !== undefined).length;

    return {
      totalVersionsCount,
      draftVersionsCount,
      publishedVersionsCount,
      supersededVersionsCount,
      restoredVersionsCount
    };
  }
}

export const centralDocumentVersioningService = CentralDocumentVersioningService.getInstance();
