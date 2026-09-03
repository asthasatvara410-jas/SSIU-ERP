import { describe, it, expect } from 'vitest';
import { dmsOcrVerificationService } from '../services/dmsOcrVerificationService';

describe('Document Management System & OCR Governance', () => {
  it('should retrieve archived documents and overview compliance metrics', () => {
    const docs = dmsOcrVerificationService.getDocuments();
    expect(docs).toBeDefined();
    expect(docs.length).toBeGreaterThan(0);

    const metrics = dmsOcrVerificationService.getOverviewMetrics();
    expect(metrics.totalArchivedDocuments).toBe(docs.length);
    expect(metrics.averageOcrConfidence).toBeGreaterThan(0);
    expect(metrics.averageOcrConfidence).toBeLessThanOrEqual(100);
  });

  it('should extract structured fields and validate against student master without anomalies for clean documents', () => {
    const cleanText = 'GUJARAT SECONDARY EDUCATION BOARD\nSCHOOL LEAVING CERTIFICATE\nName: AARAV PATEL\nFather: SURESH PATEL\nDOB: 2004-05-14\nBoard: GSEB';
    const result = dmsOcrVerificationService.extractAndValidateDocument(
      'LEAVING_CERTIFICATE',
      cleanText,
      'stud-001'
    );

    expect(result).toBeDefined();
    expect(result.extractedFields['candidateName']).toBe('AARAV PATEL');
    expect(result.extractedFields['dob']).toBe('2004-05-14');
    expect(result.extractedFields['board']).toBe('GSEB');
    expect(result.crossValidationMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('should flag anomalies when critical fields (e.g., DOB or name) diverge from master record', () => {
    const anomalousText = 'CENTRAL BOARD OF SECONDARY EDUCATION\nHIGHER SECONDARY CERTIFICATE\nName: UNKNOWN STRANGER\nDOB: 1999-01-01';
    const result = dmsOcrVerificationService.extractAndValidateDocument(
      'MARKSHEET_12TH',
      anomalousText,
      'stud-001'
    );

    expect(result).toBeDefined();
    expect(result.anomalyDetected).toBe(true);
    expect(result.anomalySummary).toBeDefined();
    expect(result.crossValidationMatches.some(m => !m.isMatch)).toBe(true);
  });

  it('should safely update document verification states and audit trails', () => {
    const docs = dmsOcrVerificationService.getDocuments();
    const targetDoc = docs[0];

    const updated = dmsOcrVerificationService.updateVerificationStatus(
      targetDoc.documentId,
      'VERIFIED',
      'Registrar Audit Desk'
    );

    expect(updated).toBeDefined();
    expect(updated?.verificationStatus).toBe('VERIFIED');
    expect(updated?.verifiedBy).toBe('Registrar Audit Desk');
    expect(updated?.verifiedAt).toBeDefined();
  });
});
