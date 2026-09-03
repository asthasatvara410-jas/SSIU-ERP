import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { documentMasterService } from '../services/documentMasterService';
import { studentProfileAccessService } from '../services/studentProfileAccessService';
import { can } from '../services/access';
import { Student, User, StudentAcademicDocumentItem, DocumentMasterItem } from '../types';

describe('Student 360° Profile & Document Governance Suite', () => {
  let studentA: Student;
  let studentB: Student;
  let mentorUser: User;
  let facultyUser: User;
  let hodUser: User;
  let principalUser: User;
  let studentAUser: User;
  let studentBUser: User;

  let docA1: StudentAcademicDocumentItem;
  let docB1: StudentAcademicDocumentItem;

  beforeEach(() => {
    const st = db.getState() as any;

    // Seed Student A
    studentA = {
      id: 'stud-gov-01',
      name: 'Aarav Sharma',
      enrollmentNo: '2301010091',
      email: 'aarav.sharma@swarrnim.edu.in',
      phone: '+91 98765 11111',
      instituteId: 'inst-sit',
      departmentId: 'dept-1',
      programId: 'prog-btech-cse',
      semesterId: 'sem-4',
      currentSemester: 4,
      divisionId: 'div-a',
      studentType: 'DOMESTIC',
      mentorId: 'fac-mentor-1',
      mentorName: 'Prof. Amit Patel',
      status: 'ACTIVE',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    } as any;

    // Seed Student B
    studentB = {
      id: 'stud-gov-02',
      name: 'Bhavna Patel',
      enrollmentNo: '2301010092',
      email: 'bhavna.patel@swarrnim.edu.in',
      phone: '+91 98765 22222',
      instituteId: 'inst-sit',
      departmentId: 'dept-1',
      programId: 'prog-btech-cse',
      semesterId: 'sem-4',
      currentSemester: 4,
      divisionId: 'div-b',
      studentType: 'DOMESTIC',
      mentorId: 'fac-mentor-2',
      mentorName: 'Prof. Rahul Joshi',
      status: 'ACTIVE',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    } as any;

    st.students = [studentA, studentB, ...(st.students || []).filter((s: Student) => s.id !== studentA.id && s.id !== studentB.id)];

    // Seed distinct student documents using real document master ID (doc-id-001)
    docA1 = {
      id: 'doc-stud-a1',
      studentId: studentA.id,
      enrollmentNo: studentA.enrollmentNo,
      documentMasterId: 'doc-id-001',
      documentCode: 'DOC-ID-001',
      documentTitle: 'Aadhaar Card',
      category: 'IDENTITY',
      fileUrl: '/uploads/documents/aarav_aadhaar.pdf',
      fileName: 'aarav_aadhaar.pdf',
      fileSizeKb: 450,
      fileType: 'application/pdf',
      status: 'VERIFIED',
      uploadedAt: '2026-08-10T10:00:00Z',
      uploadedByName: studentA.name,
      uploadedByRole: 'STUDENT',
      verifiedAt: '2026-08-11T12:00:00Z',
      verifiedByName: 'Prof. Amit Patel',
      isLocked: true
    };

    docB1 = {
      id: 'doc-stud-b1',
      studentId: studentB.id,
      enrollmentNo: studentB.enrollmentNo,
      documentMasterId: 'doc-id-001',
      documentCode: 'DOC-ID-001',
      documentTitle: 'Aadhaar Card',
      category: 'IDENTITY',
      fileUrl: '/uploads/documents/bhavna_aadhaar.pdf',
      fileName: 'bhavna_aadhaar.pdf',
      fileSizeKb: 380,
      fileType: 'application/pdf',
      status: 'PENDING_VERIFICATION',
      uploadedAt: '2026-08-12T14:00:00Z',
      uploadedByName: studentB.name,
      uploadedByRole: 'STUDENT',
      isLocked: false
    };

    st.studentAcademicDocuments = [docA1, docB1];

    // Personas
    studentAUser = {
      id: studentA.id,
      name: studentA.name,
      email: studentA.email,
      enrollmentNo: studentA.enrollmentNo,
      role: 'STUDENT',
      status: 'ACTIVE'
    };

    studentBUser = {
      id: studentB.id,
      name: studentB.name,
      email: studentB.email,
      enrollmentNo: studentB.enrollmentNo,
      role: 'STUDENT',
      status: 'ACTIVE'
    };

    mentorUser = {
      id: 'fac-mentor-1',
      name: 'Prof. Amit Patel',
      email: 'amit.patel@swarrnim.edu.in',
      role: 'MENTOR',
      departmentId: 'dept-1',
      instituteId: 'inst-sit',
      status: 'ACTIVE'
    };

    facultyUser = {
      id: 'fac-1',
      name: 'Prof. Neha Shah',
      email: 'neha.shah@swarrnim.edu.in',
      role: 'FACULTY',
      departmentId: 'dept-1',
      instituteId: 'inst-sit',
      status: 'ACTIVE'
    };

    hodUser = {
      id: 'usr-hod-1',
      name: 'Dr. Rajesh Sharma',
      email: 'hod.ce@swarrnim.edu.in',
      role: 'HOD',
      departmentId: 'dept-1',
      instituteId: 'inst-sit',
      status: 'ACTIVE'
    };

    principalUser = {
      id: 'usr-prin-1',
      name: 'Dr. Suresh Verma',
      email: 'principal.sit@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: 'inst-sit',
      status: 'ACTIVE'
    };

    db.saveState();
  });

  describe('1. Document Isolation & Anti-Cross Contamination', () => {
    it('returns ONLY Student A documents when querying Student A', () => {
      const docsA = documentMasterService.getApplicableDocumentsForStudent(studentA);
      const uploadedDocsA = docsA.filter(d => d.uploadedDoc !== undefined);

      expect(uploadedDocsA.length).toBe(1);
      expect(uploadedDocsA[0].uploadedDoc?.studentId).toBe(studentA.id);
      expect(uploadedDocsA[0].uploadedDoc?.fileName).toBe('aarav_aadhaar.pdf');
      expect(uploadedDocsA[0].uploadedDoc?.id).toBe('doc-stud-a1');
    });

    it('returns ONLY Student B documents when querying Student B', () => {
      const docsB = documentMasterService.getApplicableDocumentsForStudent(studentB);
      const uploadedDocsB = docsB.filter(d => d.uploadedDoc !== undefined);

      expect(uploadedDocsB.length).toBe(1);
      expect(uploadedDocsB[0].uploadedDoc?.studentId).toBe(studentB.id);
      expect(uploadedDocsB[0].uploadedDoc?.fileName).toBe('bhavna_aadhaar.pdf');
      expect(uploadedDocsB[0].uploadedDoc?.id).toBe('doc-stud-b1');
    });

    it('guarantees zero leakage: Student A documents never appear in Student B query', () => {
      const docsB = documentMasterService.getApplicableDocumentsForStudent(studentB);
      const hasStudentADoc = docsB.some(d => d.uploadedDoc?.studentId === studentA.id);
      expect(hasStudentADoc).toBe(false);
    });
  });

  describe('2. Document Master vs Student Document Separation', () => {
    it('Document Master catalog is distinct from student document instances', () => {
      const masterDocs = documentMasterService.getAllMasterDocuments();
      expect(masterDocs.length).toBeGreaterThan(0);
      // Master docs must NOT contain studentIds
      expect(masterDocs[0]).toHaveProperty('code');
      expect(masterDocs[0]).toHaveProperty('category');
      expect(masterDocs[0]).not.toHaveProperty('studentId');
      expect(masterDocs[0]).not.toHaveProperty('fileUrl');
    });

    it('dynamically computes missing required documents without creating fake student records', () => {
      const applicableDocs = documentMasterService.getApplicableDocumentsForStudent(studentA);
      const missingRequired = applicableDocs.filter(d => (d.masterDoc.required === 'REQUIRED' || d.masterDoc.requirementType === 'MANDATORY') && d.uploadedDoc === undefined);

      // Should be flagged as NOT_UPLOADED without fake DB entries
      expect(missingRequired.length).toBeGreaterThan(0);
      expect(missingRequired[0].status).toBe('NOT_UPLOADED');
      expect(missingRequired[0].uploadedDoc).toBeUndefined();
    });
  });

  describe('3. Document Verification RBAC & Action Gates', () => {
    it('denies verification permissions to Student role', () => {
      expect(can(studentAUser, 'VERIFY_STUDENT_DOCUMENT')).toBe(false);
      expect(can(studentBUser, 'VERIFY_STUDENT_DOCUMENT')).toBe(false);
    });

    it('grants verification permissions to HOD and Principal', () => {
      expect(can(hodUser, 'VERIFY_STUDENT_DOCUMENT')).toBe(true);
      expect(can(principalUser, 'VERIFY_STUDENT_DOCUMENT')).toBe(true);
    });

    it('verifies a pending document and locks it against tampering', () => {
      const verifiedDoc = documentMasterService.verifyDocument({
        documentId: docB1.id,
        verifierUserId: principalUser.id,
        verifierName: principalUser.name,
        verifierRole: 'PRINCIPAL',
        remarks: 'Physical Aadhaar card inspected and verified'
      });

      expect(verifiedDoc.status).toBe('VERIFIED');
      expect(verifiedDoc.isLocked).toBe(true);
      expect(verifiedDoc.verifiedByName).toBe(principalUser.name);
    });

    it('rejects a document with mandatory rejection reason', () => {
      const rejectedDoc = documentMasterService.rejectDocument({
        documentId: docB1.id,
        rejectorUserId: principalUser.id,
        rejectorName: principalUser.name,
        rejectorRole: 'PRINCIPAL',
        rejectionReason: 'Blurred photocopy, UIDAI number not legible'
      });

      expect(rejectedDoc.status).toBe('REJECTED');
      expect(rejectedDoc.rejectionReason).toBe('Blurred photocopy, UIDAI number not legible');
      expect(rejectedDoc.isLocked).toBe(false);
    });
  });

  describe('4. Scoped Access Authorization & Anti-IDOR Protections', () => {
    it('allows Student to access only their own profile', () => {
      expect(studentProfileAccessService.isUserAuthorizedForStudent(studentAUser, 'STUDENT', studentA)).toBe(true);
      expect(studentProfileAccessService.isUserAuthorizedForStudent(studentAUser, 'STUDENT', studentB)).toBe(false);
    });

    it('allows Mentor to access assigned mentees only', () => {
      expect(studentProfileAccessService.isUserAuthorizedForStudent(mentorUser, 'MENTOR', studentA)).toBe(true);
      expect(studentProfileAccessService.isUserAuthorizedForStudent(mentorUser, 'MENTOR', studentB)).toBe(false);
    });

    it('allows HOD and Principal to access institutional/departmental students', () => {
      expect(studentProfileAccessService.isUserAuthorizedForStudent(hodUser, 'HOD', studentA)).toBe(true);
      expect(studentProfileAccessService.isUserAuthorizedForStudent(principalUser, 'PRINCIPAL', studentA)).toBe(true);
    });
  });
});
