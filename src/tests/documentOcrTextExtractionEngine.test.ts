import { describe, it, expect } from 'vitest';
import { centralDocumentOcrService } from '../services/centralDocumentOcrService';
import { centralDocumentSearchService } from '../services/centralDocumentSearchService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.16: Central Document OCR, Multi-Language Text Extraction & Human Review Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_ADMIN', 'VIEW_ALL_DOCUMENTS', 'OCR_ADMIN', 'REVIEW_OCR', 'ALL_ORGANIZATIONS_VIEW']
  };

  const studentDiya: UserAuthorizationContext = {
    userId: 'STU-2026-000002',
    userName: 'Diya Shah',
    email: 'diya.shah@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['VIEW_OWN_DOCUMENTS']
  };

  it('TEST 1: Automated OCR Processing & Date Normalization: Processes high-confidence text and normalizes dates', () => {
    const job = centralDocumentOcrService.processDocumentOcr({
      documentId: 'dms-doc-001',
      versionId: 'ver-001',
      rawText: 'SWARRNIM STARTUP & INNOVATION UNIVERSITY\nMarksheet: Aarav Patel\nPassing Date: 25/05/2026\nResult: DISTINCTION',
      language: 'en',
      confidenceScore: 95.0,
      simulatedFields: [
        { name: 'student_name', rawValue: 'Aarav Patel', confidence: 96.0 },
        { name: 'passing_date', rawValue: '25/05/2026', confidence: 94.0 }
      ],
      requestedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(job.id).toBeDefined();
    expect(job.status).toBe('COMPLETED');
    expect(job.average_confidence).toBe(95.0);

    const result = centralDocumentOcrService.getOcrResultForDocument({
      documentId: 'dms-doc-001',
      versionId: 'ver-001',
      user: registrarContext
    });

    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    const dateField = result.fields.find(f => f.field_name === 'passing_date');
    expect(dateField?.normalized_value).toBe('2026-05-25');
  });

  it('TEST 2: Low-Confidence Routing: Automatically queues low-confidence OCR results for human review', () => {
    const lowConfJob = centralDocumentOcrService.processDocumentOcr({
      documentId: 'dms-doc-001',
      versionId: 'ver-002',
      rawText: 'Scanned blurry income certificate\nAmount: Rs. ?45000\nIssuer: Talu?a Office',
      confidenceScore: 62.5, // Below 75% threshold
      simulatedFields: [
        { name: 'income_amount', rawValue: '?45000', confidence: 60.0 }
      ],
      requestedBy: 'emp-reg-001',
      context: registrarContext
    });

    expect(lowConfJob.status).toBe('REVIEW_REQUIRED');
    expect(lowConfJob.average_confidence).toBe(62.5);
  });

  it('TEST 3: Human Review & Field Correction Workflow: Allows reviewer to correct OCR fields without mutating source', () => {
    const result = centralDocumentOcrService.getOcrResultForDocument({
      documentId: 'dms-doc-001',
      versionId: 'ver-002',
      user: registrarContext
    });

    const incomeField = result.fields.find(f => f.field_name === 'income_amount');
    expect(incomeField).toBeDefined();

    // Correct the OCR field
    const corrected = centralDocumentOcrService.correctExtractedField({
      fieldId: incomeField!.id,
      correctedValue: '245000',
      correctedBy: 'emp-reg-001',
      reason: 'Manual inspection of physical seal shows Rs. 2,45,000'
    });

    expect(corrected.status).toBe('CORRECTED');
    expect(corrected.normalized_value).toBe('245000');
    expect(corrected.correction_reason).toContain('Rs. 2,45,000');
  });

  it('TEST 4: Security & Access Control: Prohibits unauthorized users from accessing OCR extracted text', () => {
    // Diya is not the owner of doc-001 and has no permission -> Access Control blocks OCR retrieval
    expect(() => {
      centralDocumentOcrService.getOcrResultForDocument({
        documentId: 'dms-doc-001',
        user: studentDiya
      });
    }).toThrow(/Unauthorized OCR Access/);
  });

  it('TEST 5: Search Index Integration & OCR Dashboard Metrics: Synchronizes search index and computes telemetry', () => {
    // 1. Search index can locate text extracted by OCR
    const searchResults = centralDocumentSearchService.searchDocuments(
      { query: 'DISTINCTION' },
      registrarContext
    );
    expect(searchResults.items.length).toBeGreaterThanOrEqual(1);

    // 2. OCR Dashboard Metrics
    const metrics = centralDocumentOcrService.getOcrDashboardMetrics(registrarContext);
    expect(metrics.totalJobsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.completedJobsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageConfidence).toBeGreaterThan(0);
    expect(metrics.correctedFieldsCount).toBeGreaterThanOrEqual(1);
  });
});
