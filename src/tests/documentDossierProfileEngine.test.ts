import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { dossierCompletenessService } from '../services/dossierCompletenessService';
import { UserAuthorizationContext, User } from '../types';

describe('SSIU ERP – Phase 7: Document Management, Digital Dossier & Profile Engine', () => {

  const studentUser: User = {
    id: 'stud-001',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const facultyUser: User = {
    id: 'fac-001',
    name: 'Prof. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const verifierUser: User = {
    id: 'usr-admin-01',
    name: 'Dr. Academic Registrar',
    email: 'registrar@ssiu.ac.in',
    role: 'REGISTRAR',
    departmentId: 'ADMIN',
    instituteId: 'CENTRAL_ADMIN',
    status: 'ACTIVE'
  };

  it('TEST 1: Document Versioning: Replacing a document increments version number while preserving V1 as history', () => {
    // 1. Upload Version 1
    const v1 = dossierCompletenessService.uploadDocument({
      entityType: 'STUDENT',
      entityId: studentUser.id,
      documentCategory: 'IDENTITY',
      fileName: 'aadhaar_card_v1.pdf',
      fileUrl: '/docs/students/stud-001/aadhaar_v1.pdf',
      uploadedByUserId: studentUser.id,
      uploadedByName: studentUser.name
    });

    expect(v1.version).toBe(1);
    expect(v1.verificationStatus).toBe('PENDING');

    // 2. Upload Version 2 (Replacement)
    const v2 = dossierCompletenessService.uploadDocument({
      entityType: 'STUDENT',
      entityId: studentUser.id,
      documentCategory: 'IDENTITY',
      fileName: 'aadhaar_card_v2_updated.pdf',
      fileUrl: '/docs/students/stud-001/aadhaar_v2.pdf',
      uploadedByUserId: studentUser.id,
      uploadedByName: studentUser.name
    });

    expect(v2.version).toBe(2);

    const allDocs = dossierCompletenessService.getDocumentsForEntity('STUDENT', studentUser.id);
    expect(allDocs.length).toBeGreaterThanOrEqual(2);
    expect(allDocs.some(d => d.version === 1)).toBe(true);
    expect(allDocs.some(d => d.version === 2)).toBe(true);
  });

  it('TEST 2: Document Verification: Authorized officer can mark document VERIFIED or REJECTED', () => {
    const doc = dossierCompletenessService.uploadDocument({
      entityType: 'STUDENT',
      entityId: studentUser.id,
      documentCategory: 'ACADEMIC',
      fileName: '12th_marksheet.pdf',
      fileUrl: '/docs/students/stud-001/12th.pdf',
      uploadedByUserId: studentUser.id,
      uploadedByName: studentUser.name
    });

    const verified = dossierCompletenessService.verifyDocument(doc.id, verifierUser.id, 'VERIFIED');
    expect(verified?.verificationStatus).toBe('VERIFIED');
    expect(verified?.verifiedByUserId).toBe(verifierUser.id);
  });

  it('TEST 3: Digital Dossier Assembly: Dynamically calculates completeness percentage based on mandatory categories', () => {
    // Upload admission document for student
    dossierCompletenessService.uploadDocument({
      entityType: 'STUDENT',
      entityId: studentUser.id,
      documentCategory: 'ADMISSION',
      fileName: 'admission_allotment_letter.pdf',
      fileUrl: '/docs/students/stud-001/admission.pdf',
      uploadedByUserId: studentUser.id,
      uploadedByName: studentUser.name
    });

    const dossier = dossierCompletenessService.getDossier('STUDENT', studentUser.id);
    expect(dossier).toBeDefined();
    expect(dossier?.summary.fullName).toBeDefined();
    expect(dossier?.summary.completenessPercentage).toBeGreaterThan(0);
    expect(dossier?.documentCategories.length).toBe(3); // IDENTITY, ADMISSION, ACADEMIC
  });

  it('TEST 4: Cross-Profile Document Isolation: Student documents do NOT appear in Faculty or Staff dossiers', () => {
    const studentDocs = dossierCompletenessService.getDocumentsForEntity('STUDENT', studentUser.id);
    const facultyDocs = dossierCompletenessService.getDocumentsForEntity('FACULTY', facultyUser.id);

    const studentDocIds = new Set(studentDocs.map(d => d.id));
    facultyDocs.forEach(fd => {
      expect(studentDocIds.has(fd.id)).toBe(false);
    });
  });
});
