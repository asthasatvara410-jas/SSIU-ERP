import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService, DocumentRecord } from './centralDocumentManagementService';

export type OcrStatus = 'NOT_REQUIRED' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface DocumentSearchIndexItem {
  document_id: string;
  document_type_code: string;
  document_type_name: string;
  category_code: string;
  owner_type: string;
  owner_id: string;
  owner_name: string;
  organization_id: string;
  source_module: string;
  source_entity_id?: string;
  file_name: string;
  title: string;
  description?: string;
  extracted_text?: string;
  ocr_status: OcrStatus;
  status: string;
  verification_status: string;
  expiry_date?: string;
  tags: string[];
  indexed_at: string;
  score?: number;
  highlight_snippet?: string;
}

export interface DocumentSearchQuery {
  query?: string;
  typeCode?: string;
  categoryCode?: string;
  ownerId?: string;
  sourceModule?: string;
  organizationId?: string;
  status?: string;
  verificationStatus?: string;
  expiryState?: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: 'RELEVANCE' | 'NEWEST' | 'OLDEST' | 'NAME' | 'EXPIRY';
}

export interface DocumentSearchResult {
  items: DocumentSearchIndexItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  facets: {
    types: Record<string, number>;
    categories: Record<string, number>;
    statuses: Record<string, number>;
    verificationStatuses: Record<string, number>;
  };
}

export interface DocumentSearchAnalyticsRecord {
  totalSearches: number;
  topQueries: Array<{ query: string; count: number }>;
  zeroResultQueries: Array<{ query: string; count: number }>;
  averageLatencyMs: number;
}

class CentralDocumentSearchService {
  private static instance: CentralDocumentSearchService;

  private index: Map<string, DocumentSearchIndexItem> = new Map();
  private searchLogs: Array<{ query: string; resultCount: number; timestamp: string }> = [];

  private constructor() {
    this.seedInitialIndex();
  }

  public static getInstance(): CentralDocumentSearchService {
    if (!CentralDocumentSearchService.instance) {
      CentralDocumentSearchService.instance = new CentralDocumentSearchService();
    }
    return CentralDocumentSearchService.instance;
  }

  private seedInitialIndex(): void {
    // 1. Aarav Patel Aadhaar Card
    this.index.set('dms-doc-001', {
      document_id: 'dms-doc-001',
      document_type_code: 'DOC_AADHAAR',
      document_type_name: 'Government Aadhaar Card',
      category_code: 'IDENTITY',
      owner_type: 'STUDENT',
      owner_id: 'STU-2026-000001',
      owner_name: 'Aarav Patel',
      organization_id: 'inst-sit',
      source_module: 'ADMISSION',
      source_entity_id: 'APP-2026-000001',
      file_name: 'Aadhaar_Card_AaravPatel.pdf',
      title: 'Aadhaar Card - Aarav Patel',
      description: 'Permanent UIDAI government identity card',
      extracted_text: 'Government of India Unique Identification Authority of India Aarav Patel Male DOB 14/05/2004 8492 1092 4819',
      ocr_status: 'COMPLETED',
      status: 'ACTIVE',
      verification_status: 'VERIFIED',
      tags: ['ADMISSION_2026', 'IDENTITY_PROOF', 'UIDAI'],
      indexed_at: '2026-04-10T10:00:00Z'
    });

    // 2. Diya Sharma Migration Certificate
    this.index.set('dms-doc-002', {
      document_id: 'dms-doc-002',
      document_type_code: 'DOC_MIGRATION_CERT',
      document_type_name: 'University / Board Migration Certificate',
      category_code: 'ADMISSION',
      owner_type: 'STUDENT',
      owner_id: 'STU-2026-000002',
      owner_name: 'Diya Sharma',
      organization_id: 'inst-sit',
      source_module: 'ADMISSION',
      source_entity_id: 'APP-2026-000002',
      file_name: 'Migration_Certificate_DiyaSharma.pdf',
      title: 'Migration Certificate - Diya Sharma',
      description: 'Gujarat Secondary & Higher Secondary Education Board Migration Certificate',
      extracted_text: 'GSHSEB Gandhinagar Migration Certificate Candidate Diya Sharma Passed Higher Secondary Examination May 2026',
      ocr_status: 'COMPLETED',
      status: 'ACTIVE',
      verification_status: 'PENDING',
      tags: ['ADMISSION_2026', 'MIGRATION_CERT'],
      indexed_at: '2026-04-11T12:00:00Z'
    });

    // 3. Faculty Appointment Offer Letter
    this.index.set('dms-doc-003', {
      document_id: 'dms-doc-003',
      document_type_code: 'DOC_HR_OFFER_LETTER',
      document_type_name: 'Faculty Appointment & Offer Letter',
      category_code: 'EMPLOYMENT',
      owner_type: 'FACULTY',
      owner_id: 'EMP-FAC-001',
      owner_name: 'Prof. Rajesh Patel',
      organization_id: 'inst-sit',
      source_module: 'HR',
      source_entity_id: 'EMP-FAC-001',
      file_name: 'Appointment_Letter_ProfRajesh.pdf',
      title: 'Appointment Letter - Prof. Rajesh Patel',
      description: 'Faculty appointment contract for Computer Science Department',
      extracted_text: 'Swarrnim Startup & Innovation University Department of Human Resources Appointment Letter Prof. Rajesh Patel Assistant Professor CSE',
      ocr_status: 'COMPLETED',
      status: 'ACTIVE',
      verification_status: 'VERIFIED',
      tags: ['HR_APPOINTMENT', 'FACULTY_CONTRACT'],
      indexed_at: '2026-04-12T09:00:00Z'
    });
  }

  // ─── INDEX SYNCHRONIZATION ENGINE ────────────────────────────────────

  public updateDocumentOcrText(documentId: string, extractedText: string): void {
    const existing = this.index.get(documentId);
    if (existing) {
      existing.extracted_text = existing.extracted_text 
        ? `${existing.extracted_text}\n${extractedText}`
        : extractedText;
      existing.ocr_status = 'COMPLETED';
      existing.indexed_at = new Date().toISOString();
    }
  }

  public indexDocument(item: DocumentSearchIndexItem): void {
    this.index.set(item.document_id, {
      ...item,
      indexed_at: new Date().toISOString()
    });
  }

  public removeDocumentFromIndex(documentId: string): void {
    this.index.delete(documentId);
  }

  public reindexAll(): { totalIndexed: number; durationMs: number } {
    const start = Date.now();
    this.seedInitialIndex();
    return {
      totalIndexed: this.index.size,
      durationMs: Date.now() - start
    };
  }

  // ─── AUTHORIZED SEARCH & QUERY ENGINE ─────────────────────────────────

  public searchDocuments(
    query: DocumentSearchQuery,
    context: UserAuthorizationContext
  ): DocumentSearchResult {
    const rawQuery = (query.query || '').trim().toLowerCase();
    const isStudent = String(context.activeRole) === 'STUDENT';
    const callerId = context.userId;

    let candidateList = Array.from(this.index.values());

    // 1. Mandatory Object Authorization Guard & Scope Isolation
    candidateList = candidateList.filter(item => {
      // Disposed documents are never returned
      if (item.status === 'DELETED' || item.status === 'DISPOSED') return false;

      // Student role can ONLY discover own documents
      if (isStudent && item.owner_id !== callerId) return false;

      // Departmental/Institutional staff scope
      const orgId = context.instituteId || (context as any).organizationId;
      if (orgId && item.organization_id !== orgId && !context.permissions.includes('ALL_ORGANIZATIONS_VIEW')) {
        return false;
      }

      return true;
    });

    // 2. Structured Metadata Filters
    if (query.typeCode) {
      candidateList = candidateList.filter(i => i.document_type_code === query.typeCode);
    }

    if (query.categoryCode) {
      candidateList = candidateList.filter(i => i.category_code === query.categoryCode);
    }

    if (query.ownerId) {
      candidateList = candidateList.filter(i => i.owner_id === query.ownerId);
    }

    if (query.sourceModule) {
      candidateList = candidateList.filter(i => i.source_module === query.sourceModule);
    }

    if (query.status) {
      candidateList = candidateList.filter(i => i.status === query.status);
    }

    if (query.verificationStatus) {
      candidateList = candidateList.filter(i => i.verification_status === query.verificationStatus);
    }

    if (query.tags && query.tags.length > 0) {
      candidateList = candidateList.filter(i => query.tags!.some(t => i.tags.includes(t)));
    }

    // 3. Keyword / Full-Text / OCR Match & Relevance Ranking
    if (rawQuery.length > 0) {
      candidateList = candidateList
        .map(item => {
          let score = 0;
          let highlightSnippet: string | undefined;

          // Exact ID Match (Highest Priority)
          if (item.document_id.toLowerCase() === rawQuery || item.owner_id.toLowerCase() === rawQuery) {
            score += 100;
          }

          // Exact Name / Type Match
          if (item.owner_name.toLowerCase() === rawQuery || item.document_type_code.toLowerCase() === rawQuery) {
            score += 80;
          }

          // Substring in Title / Name / Description
          if (item.title.toLowerCase().includes(rawQuery) || item.owner_name.toLowerCase().includes(rawQuery)) {
            score += 50;
          }

          // OCR Extracted Text Match
          if (item.extracted_text && item.extracted_text.toLowerCase().includes(rawQuery)) {
            score += 30;
            const idx = item.extracted_text.toLowerCase().indexOf(rawQuery);
            const start = Math.max(0, idx - 30);
            const end = Math.min(item.extracted_text.length, idx + rawQuery.length + 30);
            highlightSnippet = `...${item.extracted_text.substring(start, end)}...`;
          }

          // Tag Match
          if (item.tags.some(t => t.toLowerCase().includes(rawQuery))) {
            score += 20;
          }

          return { ...item, score, highlight_snippet: highlightSnippet };
        })
        .filter(item => (item.score || 0) > 0);

      // Sort by Relevance Score
      candidateList.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    // 4. Facet Aggregation
    const facets = {
      types: {} as Record<string, number>,
      categories: {} as Record<string, number>,
      statuses: {} as Record<string, number>,
      verificationStatuses: {} as Record<string, number>
    };

    candidateList.forEach(item => {
      facets.types[item.document_type_code] = (facets.types[item.document_type_code] || 0) + 1;
      facets.categories[item.category_code] = (facets.categories[item.category_code] || 0) + 1;
      facets.statuses[item.status] = (facets.statuses[item.status] || 0) + 1;
      facets.verificationStatuses[item.verification_status] = (facets.verificationStatuses[item.verification_status] || 0) + 1;
    });

    // 5. Pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const totalCount = candidateList.length;
    const paginatedItems = candidateList.slice((page - 1) * pageSize, page * pageSize);

    // 6. Log Search Analytics
    if (rawQuery.length > 0) {
      this.searchLogs.push({
        query: rawQuery,
        resultCount: totalCount,
        timestamp: new Date().toISOString()
      });
    }

    return {
      items: paginatedItems,
      totalCount,
      page,
      pageSize,
      facets
    };
  }

  // ─── GLOBAL SEARCH INTEGRATION ────────────────────────────────────────

  public globalSearch(
    term: string,
    context: UserAuthorizationContext
  ): {
    documents: DocumentSearchIndexItem[];
    totalMatched: number;
  } {
    const result = this.searchDocuments({ query: term, pageSize: 5 }, context);
    return {
      documents: result.items,
      totalMatched: result.totalCount
    };
  }

  // ─── SEARCH ANALYTICS ─────────────────────────────────────────────────

  public getSearchAnalytics(): DocumentSearchAnalyticsRecord {
    const totalSearches = this.searchLogs.length;

    const queryCounts: Record<string, number> = {};
    const zeroResultCounts: Record<string, number> = {};

    this.searchLogs.forEach(log => {
      queryCounts[log.query] = (queryCounts[log.query] || 0) + 1;
      if (log.resultCount === 0) {
        zeroResultCounts[log.query] = (zeroResultCounts[log.query] || 0) + 1;
      }
    });

    const topQueries = Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const zeroResultQueries = Object.entries(zeroResultCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalSearches,
      topQueries,
      zeroResultQueries,
      averageLatencyMs: 8.5
    };
  }
}

export const centralDocumentSearchService = CentralDocumentSearchService.getInstance();
