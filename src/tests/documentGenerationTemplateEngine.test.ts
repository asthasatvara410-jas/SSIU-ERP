import { describe, it, expect } from 'vitest';
import { centralDocumentGenerationService } from '../services/centralDocumentGenerationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.6: Central Document Generation, Template & Verification Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_GENERATE', 'DOCUMENT_REVOKE', 'TEMPLATE_MANAGE']
  };

  it('TEST 1: Template Validation & Missing Field Protection: Blocks generation when required merge fields are missing', () => {
    expect(() => {
      centralDocumentGenerationService.generateOfficialDocument({
        templateCode: 'BONAFIDE_CERTIFICATE',
        sourceModule: 'STUDENT_DOSSIER',
        sourceEntityType: 'STUDENT',
        sourceEntityId: 'STU-2026-000001',
        ownerType: 'STUDENT',
        ownerId: 'STU-2026-000001',
        mergeData: {
          student: { name: 'Aarav Patel' }
          // Missing: student.enrollment_no, program.name, academic_year
        },
        generatedBy: 'emp-reg-001'
      });
    }).toThrow(/Generation Blocked: Missing required merge fields/);
  });

  it('TEST 2: Atomic Numbering & Collision Prevention: Generates unique sequential document numbers', () => {
    const num1 = centralDocumentGenerationService.generateAtomicDocumentNumber('BON', 2026);
    const num2 = centralDocumentGenerationService.generateAtomicDocumentNumber('BON', 2026);

    expect(num1).toBeDefined();
    expect(num2).toBeDefined();
    expect(num1).not.toBe(num2);
    expect(num1).toContain('SSIU/BON/2026/');
  });

  it('TEST 3: End-to-End Document Generation & Central DMS Sync: Successfully creates official document and registers in search', () => {
    const genDoc = centralDocumentGenerationService.generateOfficialDocument({
      templateCode: 'BONAFIDE_CERTIFICATE',
      sourceModule: 'STUDENT_DOSSIER',
      sourceEntityType: 'STUDENT',
      sourceEntityId: 'STU-2026-000001',
      ownerType: 'STUDENT',
      ownerId: 'STU-2026-000001',
      mergeData: {
        student: {
          name: 'Aarav Patel',
          enrollment_no: 'SU26CSE0001'
        },
        program: {
          name: 'Bachelor of Technology (Computer Science & Engineering)'
        },
        academic_year: '2026-2027'
      },
      generatedBy: 'emp-reg-001'
    });

    expect(genDoc.document_id).toBeDefined();
    expect(genDoc.document_number).toBeDefined();
    expect(genDoc.issue_status).toBe('ISSUED');
    expect(genDoc.rendered_content).toContain('Aarav Patel');
    expect(genDoc.rendered_content).toContain('SU26CSE0001');
    expect(genDoc.qr_verification_url).toContain('https://dms.swarrnim.edu.in/verify/doc?token=');
  });

  it('TEST 4: Public QR Verification: Validates authentic documents and rejects unverified tokens', () => {
    // 1. Generate document to obtain valid token
    const genDoc = centralDocumentGenerationService.generateOfficialDocument({
      templateCode: 'FACULTY_APPOINTMENT_LETTER',
      sourceModule: 'HR',
      sourceEntityType: 'EMPLOYEE',
      sourceEntityId: 'EMP-FAC-002',
      ownerType: 'FACULTY',
      ownerId: 'EMP-FAC-002',
      mergeData: {
        employee: {
          name: 'Dr. Meera Joshi',
          designation: 'Associate Professor'
        },
        department: {
          name: 'Computer Engineering'
        },
        joining_date: '2026-07-01'
      },
      generatedBy: 'emp-reg-001'
    });

    // 2. Public verification with valid token
    const verifyValid = centralDocumentGenerationService.verifyPublicDocument(genDoc.verification_token);
    expect(verifyValid.isValid).toBe(true);
    expect(verifyValid.status).toBe('ISSUED');
    expect(verifyValid.disclaimer).toContain('AUTHENTIC');

    // 3. Public verification with fake token
    const verifyFake = centralDocumentGenerationService.verifyPublicDocument('fake_token_12345');
    expect(verifyFake.isValid).toBe(false);
    expect(verifyFake.disclaimer).toContain('does not match any officially issued');
  });

  it('TEST 5: Document Revocation Governance: Revokes document with mandatory reason and updates verification', () => {
    // 1. Generate document
    const genDoc = centralDocumentGenerationService.generateOfficialDocument({
      templateCode: 'BONAFIDE_CERTIFICATE',
      sourceModule: 'STUDENT_DOSSIER',
      sourceEntityType: 'STUDENT',
      sourceEntityId: 'STU-2026-000003',
      ownerType: 'STUDENT',
      ownerId: 'STU-2026-000003',
      mergeData: {
        student: {
          name: 'Rohan Shah',
          enrollment_no: 'SU26CSE0003'
        },
        program: {
          name: 'BCA'
        },
        academic_year: '2026-2027'
      },
      generatedBy: 'emp-reg-001'
    });

    // 2. Revoke document
    const revoked = centralDocumentGenerationService.revokeOfficialDocument({
      documentNumber: genDoc.document_number,
      revokedBy: 'emp-reg-001',
      reason: 'Student withdrew admission from BCA program'
    });

    expect(revoked.is_revoked).toBe(true);
    expect(revoked.issue_status).toBe('REVOKED');

    // 3. Public verification now shows REVOKED
    const publicVerify = centralDocumentGenerationService.verifyPublicDocument(genDoc.verification_token);
    expect(publicVerify.isValid).toBe(false);
    expect(publicVerify.disclaimer).toContain('DOCUMENT REVOKED');
  });

  it('TEST 6: Generation Dashboard Metrics: Computes authoritative document generation counters', () => {
    const metrics = centralDocumentGenerationService.getGenerationDashboardMetrics(registrarContext);

    expect(metrics.totalGeneratedCount).toBeGreaterThanOrEqual(3);
    expect(metrics.issuedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.revokedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.activeTemplatesCount).toBeGreaterThanOrEqual(2);
  });
});
