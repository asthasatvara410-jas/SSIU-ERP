import { describe, it, expect } from 'vitest';
import { centralDocumentSearchService } from '../services/centralDocumentSearchService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.4: Central Document Search & Indexing Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_SEARCH', 'ALL_ORGANIZATIONS_VIEW']
  };

  const studentAContext: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['DOCUMENT_VIEW']
  };

  const studentBContext: UserAuthorizationContext = {
    userId: 'STU-2026-000002',
    userName: 'Diya Sharma',
    email: 'diya.sharma@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['DOCUMENT_VIEW']
  };

  it('TEST 1: Metadata & OCR Search: Discovers documents via exact ID, owner name, and OCR text', () => {
    // 1. Search by exact student ID
    const resId = centralDocumentSearchService.searchDocuments(
      { query: 'STU-2026-000001' },
      registrarContext
    );
    expect(resId.totalCount).toBe(1);
    expect(resId.items[0].owner_name).toBe('Aarav Patel');

    // 2. Search by OCR extracted text keyword ("Identification Authority")
    const resOcr = centralDocumentSearchService.searchDocuments(
      { query: 'Identification Authority' },
      registrarContext
    );
    expect(resOcr.totalCount).toBe(1);
    expect(resOcr.items[0].highlight_snippet).toBeDefined();
    expect(resOcr.items[0].highlight_snippet).toContain('Unique Identification Authority');
  });

  it('TEST 2: Multi-Filter Search & Faceted Aggregation: Combines multiple filters and returns facets', () => {
    const res = centralDocumentSearchService.searchDocuments(
      {
        categoryCode: 'IDENTITY',
        verificationStatus: 'VERIFIED',
        typeCode: 'DOC_AADHAAR'
      },
      registrarContext
    );

    expect(res.totalCount).toBe(1);
    expect(res.items[0].document_id).toBe('dms-doc-001');
    expect(res.facets.categories['IDENTITY']).toBe(1);
    expect(res.facets.types['DOC_AADHAAR']).toBe(1);
  });

  it('TEST 3: Security-First Search & IDOR Isolation: Student discovers only own documents', () => {
    // 1. Student A searching for their own document succeeds
    const resA = centralDocumentSearchService.searchDocuments(
      { query: 'Aarav Patel' },
      studentAContext
    );
    expect(resA.totalCount).toBe(1);
    expect(resA.items[0].owner_id).toBe('STU-2026-000001');

    // 2. Student A searching for Student B's name/ID yields 0 results (IDOR prevention)
    const resBAttempt = centralDocumentSearchService.searchDocuments(
      { query: 'Diya Sharma' },
      studentAContext
    );
    expect(resBAttempt.totalCount).toBe(0);

    // 3. Student B searching for Student B's document succeeds
    const resB = centralDocumentSearchService.searchDocuments(
      { query: 'Migration' },
      studentBContext
    );
    expect(resB.totalCount).toBe(1);
    expect(resB.items[0].owner_id).toBe('STU-2026-000002');
  });

  it('TEST 4: Global Search Integration: Unifies document search into global university search bar', () => {
    const globalRes = centralDocumentSearchService.globalSearch('Rajesh Patel', registrarContext);
    expect(globalRes.totalMatched).toBe(1);
    expect(globalRes.documents[0].document_type_code).toBe('DOC_HR_OFFER_LETTER');
    expect(globalRes.documents[0].owner_type).toBe('FACULTY');
  });

  it('TEST 5: Search Analytics & Query Telemetry: Tracks total searches and top query counts', () => {
    const analytics = centralDocumentSearchService.getSearchAnalytics();
    expect(analytics.totalSearches).toBeGreaterThanOrEqual(4);
    expect(analytics.averageLatencyMs).toBeLessThan(50);
  });
});
