import { describe, it, expect } from 'vitest';
import { studentDossierDocumentService } from '../services/studentDossierDocumentService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.3: Student Dossier, Document Management & Verification Engine', () => {

  it('TEST 1: Document Upload & Versioning: Uploads document and creates incremental version replacing previous', () => {
    // Upload initial Migration Certificate (v1)
    const docV1 = studentDossierDocumentService.uploadDocument({
      studentId: 'STU-2026-000001',
      documentTypeCode: 'DOC_MIGRATION_CERT',
      documentName: 'Migration_Certificate_v1.pdf',
      category: 'TRANSFER',
      fileUrl: 'https://docs.swarrnim.edu.in/students/STU-2026-000001/migration_v1.pdf',
      uploadedBy: 'STU-2026-000001'
    });

    expect(docV1.id).toBeDefined();
    expect(docV1.version).toBe(1);
    expect(docV1.status).toBe('SUBMITTED');

    // Upload revised Migration Certificate (v2)
    const docV2 = studentDossierDocumentService.uploadDocument({
      studentId: 'STU-2026-000001',
      documentTypeCode: 'DOC_MIGRATION_CERT',
      documentName: 'Migration_Certificate_v2_Signed.pdf',
      category: 'TRANSFER',
      fileUrl: 'https://docs.swarrnim.edu.in/students/STU-2026-000001/migration_v2.pdf',
      uploadedBy: 'STU-2026-000001'
    });

    expect(docV2.version).toBe(2);
    expect(docV1.status).toBe('REPLACED');
  });

  it('TEST 2: Document Verification & Rejection: Requires mandatory reason for rejection and updates status to VERIFIED', () => {
    // Upload a test Income Certificate
    const incDoc = studentDossierDocumentService.uploadDocument({
      studentId: 'STU-2026-000002',
      documentTypeCode: 'DOC_INCOME_CERT',
      documentName: 'Income_Certificate_2026.pdf',
      category: 'FINANCIAL',
      fileUrl: 'https://docs.swarrnim.edu.in/students/STU-2026-000002/income.pdf',
      uploadedBy: 'STU-2026-000002'
    });

    // 1. Rejection without reason must fail
    expect(() => {
      studentDossierDocumentService.rejectDocument({
        documentId: incDoc.id,
        rejectionReason: '',
        rejectedBy: 'emp-reg-001'
      });
    }).toThrow(/Mandatory rejection reason required/);

    // 2. Reject with valid reason
    const rejected = studentDossierDocumentService.rejectDocument({
      documentId: incDoc.id,
      rejectionReason: 'Blurred copy; seal of Taluka Revenue Officer not legible',
      rejectedBy: 'emp-reg-001'
    });

    expect(rejected.status).toBe('REJECTED');
    expect(rejected.rejection_reason).toContain('Blurred copy');

    // 3. Verify a valid document
    const verifiedDoc = studentDossierDocumentService.verifyDocument({
      documentId: 'doc-001',
      verifiedBy: 'emp-reg-001'
    });

    expect(verifiedDoc.status).toBe('VERIFIED');
    expect(verifiedDoc.verified_by).toBe('emp-reg-001');
    expect(verifiedDoc.verified_at).toBeDefined();
  });

  it('TEST 3: Document Requirement Waiver: Waives requirement with mandatory justification', () => {
    // Waiver without reason must fail
    expect(() => {
      studentDossierDocumentService.waiveDocument({
        studentId: 'STU-2026-000003',
        documentTypeCode: 'DOC_MIGRATION_CERT',
        waiverReason: '',
        waivedBy: 'emp-reg-001'
      });
    }).toThrow(/Mandatory justification required to waive/);

    // Valid waiver
    const waived = studentDossierDocumentService.waiveDocument({
      studentId: 'STU-2026-000003',
      documentTypeCode: 'DOC_MIGRATION_CERT',
      waiverReason: 'Student admitted under internal university lateral progression scheme',
      waivedBy: 'emp-reg-001'
    });

    expect(waived.status).toBe('WAIVED');
    expect(waived.waived_by).toBe('emp-reg-001');
    expect(waived.waiver_reason).toContain('internal university lateral progression');
  });

  it('TEST 4: Dynamic Expiry & Validity Evaluation: Correctly evaluates EXPIRED, EXPIRING_SOON, and VALID states', () => {
    // Expired document
    const expiredDoc = {
      expiry_date: '2025-01-01'
    } as any;
    expect(studentDossierDocumentService.evaluateDocumentValidity(expiredDoc)).toBe('EXPIRED');

    // Expiring soon (within 30 days)
    const future10Days = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const expiringSoonDoc = {
      expiry_date: future10Days
    } as any;
    expect(studentDossierDocumentService.evaluateDocumentValidity(expiringSoonDoc)).toBe('EXPIRING_SOON');

    // Valid document (6 months ahead)
    const future180Days = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const validDoc = {
      expiry_date: future180Days
    } as any;
    expect(studentDossierDocumentService.evaluateDocumentValidity(validDoc)).toBe('VALID');

    // No expiry
    const noExpDoc = {} as any;
    expect(studentDossierDocumentService.evaluateDocumentValidity(noExpDoc)).toBe('NO_EXPIRY');
  });

  it('TEST 5: Dossier Completeness Score: Calculates percentage based on mandatory verified documents', () => {
    // Aarav Patel has 3 verified out of 4 required (Aadhaar, 10th, 12th) -> 75%
    const summaryInitial = studentDossierDocumentService.calculateDossierSummary('STU-2026-000001', 'prog-bca');
    expect(summaryInitial.total_required).toBe(4);
    expect(summaryInitial.verified_count).toBe(3);
    expect(summaryInitial.completeness_percentage).toBe(75);

    // Verify 4th document (Migration Certificate)
    const migrationDocs = (studentDossierDocumentService as any).documents.filter(
      (d: any) => d.student_id === 'STU-2026-000001' && d.document_type_code === 'DOC_MIGRATION_CERT' && d.version === 2
    );
    if (migrationDocs.length > 0) {
      studentDossierDocumentService.verifyDocument({
        documentId: migrationDocs[0].id,
        verifiedBy: 'emp-reg-001'
      });
    }

    // Now 4 out of 4 verified -> 100%
    const summaryFinal = studentDossierDocumentService.calculateDossierSummary('STU-2026-000001', 'prog-bca');
    expect(summaryFinal.verified_count).toBe(4);
    expect(summaryFinal.completeness_percentage).toBe(100);
  });

  it('TEST 6: Dossier Dashboard Metrics: Computes authoritative document, verified, and completeness counters', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['STUDENT_DOSSIER_VIEW', 'DOCUMENT_VIEW', 'DOCUMENT_VERIFY']
    };

    const metrics = studentDossierDocumentService.getDossierDashboardMetrics(registrarContext);
    expect(metrics.totalDocumentsInDossier).toBeGreaterThanOrEqual(4);
    expect(metrics.verifiedDocuments).toBeGreaterThanOrEqual(4);
    expect(metrics.completeDossiersCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageDossierCompleteness).toBe(100);
  });
});
