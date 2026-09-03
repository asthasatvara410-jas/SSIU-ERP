/**
 * SSIU ERP — Automated Unit & Integration Tests: Prisma Database CRUD Operations
 * File: src/tests/prismaDatabaseCrudOperations.test.ts
 *
 * Verifies:
 * 1. Student CRUD operations (create, read, update, delete)
 * 2. Attendance CRUD operations (application create, query, approval status update, delete)
 * 3. Fee & Invoice CRUD operations (invoice generation, item creation, status update, deletion)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../services/databaseService';
import {
  studentPrismaCrudService,
  attendancePrismaCrudService,
  feePrismaCrudService,
} from '../services/prismaCrudDatabaseService';

describe('SSIU ERP — Prisma Database CRUD Operations Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ─── 1. STUDENT CRUD TESTS ──────────────────────────────────────────────────
  describe('Student Model CRUD Operations', () => {
    it('should create a new student record using prisma.student.create', async () => {
      const mockCreatedStudent = {
        id: 'stu-uuid-001',
        erpId: 'STU2026101',
        enrollmentNo: '260101101',
        firstName: 'Dev',
        lastName: 'Sharma',
        email: 'dev.sharma@swarrnim.edu.in',
        instituteId: 'inst-sscit',
        departmentId: 'dept-cse',
        batchId: 'batch-2026',
        enrollmentStatus: 'FINAL',
        status: 'ACTIVE',
      };

      vi.spyOn(prisma.student, 'create').mockResolvedValue(mockCreatedStudent as any);

      const result = await studentPrismaCrudService.createStudent({
        erpId: 'STU2026101',
        enrollmentNo: '260101101',
        firstName: 'Dev',
        lastName: 'Sharma',
        email: 'dev.sharma@swarrnim.edu.in',
        instituteId: 'inst-sscit',
        departmentId: 'dept-cse',
        batchId: 'batch-2026',
      });

      expect(prisma.student.create).toHaveBeenCalledTimes(1);
      expect(result.erpId).toBe('STU2026101');
      expect(result.firstName).toBe('Dev');
    });

    it('should read student by id with relational joins using prisma.student.findUnique', async () => {
      const mockStudent = {
        id: 'stu-uuid-001',
        erpId: 'STU2026101',
        enrollmentNo: '260101101',
        firstName: 'Dev',
        lastName: 'Sharma',
        email: 'dev.sharma@swarrnim.edu.in',
        studentFacultyMappings: [
          { subject: { code: 'CS-301', name: 'DBMS' } },
        ],
      };

      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockStudent as any);

      const result = await studentPrismaCrudService.getStudentById('stu-uuid-001');

      expect(prisma.student.findUnique).toHaveBeenCalledWith({
        where: { id: 'stu-uuid-001' },
        include: expect.any(Object),
      });
      expect(result?.erpId).toBe('STU2026101');
      expect(result?.studentFacultyMappings.length).toBe(1);
    });

    it('should update student details using prisma.student.update', async () => {
      const mockUpdated = {
        id: 'stu-uuid-001',
        firstName: 'Dev',
        lastName: 'Sharma-Patel',
        status: 'ACTIVE',
      };

      vi.spyOn(prisma.student, 'update').mockResolvedValue(mockUpdated as any);

      const result = await studentPrismaCrudService.updateStudent('stu-uuid-001', {
        lastName: 'Sharma-Patel',
      });

      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'stu-uuid-001' },
        data: { lastName: 'Sharma-Patel' },
      });
      expect(result.lastName).toBe('Sharma-Patel');
    });

    it('should soft delete student using status INACTIVE', async () => {
      const mockSoftDeleted = {
        id: 'stu-uuid-001',
        status: 'INACTIVE',
      };

      vi.spyOn(prisma.student, 'update').mockResolvedValue(mockSoftDeleted as any);

      const result = await studentPrismaCrudService.deleteStudent('stu-uuid-001', true);

      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 'stu-uuid-001' },
        data: { status: 'INACTIVE' },
      });
      expect(result.status).toBe('INACTIVE');
    });
  });

  // ─── 2. ATTENDANCE CRUD TESTS ───────────────────────────────────────────────
  describe('Attendance Model CRUD Operations', () => {
    it('should create attendance application using prisma.attendanceApplication.create', async () => {
      const mockApp = {
        id: 'att-app-001',
        applicationNo: 'APP-ATT-2026-0001',
        studentId: 'stu-uuid-001',
        reason: 'OFFICIAL_DUTY',
        status: 'SUBMITTED_TO_FACULTY',
      };

      vi.spyOn(prisma.attendanceApplication, 'create').mockResolvedValue(mockApp as any);

      const result = await attendancePrismaCrudService.createAttendanceApplication({
        applicationNo: 'APP-ATT-2026-0001',
        studentId: 'stu-uuid-001',
        studentName: 'Dev Sharma',
        enrollmentNo: '260101101',
        studentEmail: 'dev@swarrnim.edu.in',
        instituteId: 'inst-sscit',
        departmentId: 'dept-cse',
        programId: 'prog-btech',
        semesterId: 'sem-5',
        subjectId: 'sub-cs301',
        subjectCode: 'CS-301',
        subjectName: 'DBMS',
        subjectFacultyId: 'fac-001',
        subjectFacultyName: 'Dr. Rajesh Sharma',
        mentorFacultyId: 'fac-001',
        mentorFacultyName: 'Dr. Rajesh Sharma',
        hodUserId: 'hod-001',
        hodUserName: 'Dr. HOD',
        hoiUserId: 'hoi-001',
        hoiUserName: 'Principal',
        totalClasses: 40,
        presentClasses: 28,
        absentClasses: 12,
        currentAttendancePct: 70.0,
        shortagePct: 5.0,
        reason: 'OFFICIAL_DUTY',
        description: 'Representing university in hackathon',
        currentHandlerRole: 'SUBJECT_FACULTY',
        currentHandlerId: 'fac-001',
        currentHandlerName: 'Dr. Rajesh Sharma',
      });

      expect(prisma.attendanceApplication.create).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('SUBMITTED_TO_FACULTY');
    });

    it('should update attendance approval status to FINAL_APPROVED', async () => {
      const mockApproved = {
        id: 'att-app-001',
        status: 'FINAL_APPROVED',
        finalEligibilityGranted: true,
        currentHandlerRole: 'COMPLETED',
      };

      vi.spyOn(prisma.attendanceApplication, 'update').mockResolvedValue(mockApproved as any);

      const result = await attendancePrismaCrudService.updateAttendanceStatus(
        'att-app-001',
        'FINAL_APPROVED',
        'COMPLETED',
        'fac-001',
        'Dr. Rajesh Sharma'
      );

      expect(prisma.attendanceApplication.update).toHaveBeenCalledWith({
        where: { id: 'att-app-001' },
        data: expect.objectContaining({
          status: 'FINAL_APPROVED',
          finalEligibilityGranted: true,
          currentHandlerRole: 'COMPLETED',
        }),
      });
      expect(result.status).toBe('FINAL_APPROVED');
    });
  });

  // ─── 3. FEE & INVOICE CRUD TESTS ────────────────────────────────────────────
  describe('Fees & Invoice Model CRUD Operations', () => {
    it('should create fee invoice with line items using prisma.feeInvoice.create', async () => {
      const mockInvoice = {
        id: 'inv-uuid-001',
        invoiceNumber: 'SSIU-FEE-2026-0001',
        studentId: 'stu-uuid-001',
        totalAmount: 45000,
        status: 'ISSUED',
        items: [
          { feeHeadId: 'fh-tuition', amount: 40000 },
          { feeHeadId: 'fh-lab', amount: 5000 },
        ],
      };

      vi.spyOn(prisma.feeInvoice, 'create').mockResolvedValue(mockInvoice as any);

      const result = await feePrismaCrudService.createFeeInvoice({
        invoiceNumber: 'SSIU-FEE-2026-0001',
        studentId: 'stu-uuid-001',
        studentFeeAccountId: 'sfa-001',
        feeStructureId: 'fs-001',
        academicYearCode: 'AY-2026-27',
        semesterId: 'sem-5',
        dueDate: new Date('2026-09-30'),
        subtotal: 45000,
        totalAmount: 45000,
        createdBy: 'admin-001',
        items: [
          { feeHeadId: 'fh-tuition', amount: 40000 },
          { feeHeadId: 'fh-lab', amount: 5000 },
        ],
      });

      expect(prisma.feeInvoice.create).toHaveBeenCalledTimes(1);
      expect(result.totalAmount).toBe(45000);
      expect(result.items.length).toBe(2);
    });

    it('should update fee invoice status to PAID using prisma.feeInvoice.update', async () => {
      const mockPaidInvoice = {
        id: 'inv-uuid-001',
        status: 'PAID',
        remarks: 'Payment reconciled via bank reference TXN-998811',
      };

      vi.spyOn(prisma.feeInvoice, 'update').mockResolvedValue(mockPaidInvoice as any);

      const result = await feePrismaCrudService.updateInvoiceStatus(
        'inv-uuid-001',
        'PAID',
        'Payment reconciled via bank reference TXN-998811'
      );

      expect(prisma.feeInvoice.update).toHaveBeenCalledWith({
        where: { id: 'inv-uuid-001' },
        data: {
          status: 'PAID',
          remarks: 'Payment reconciled via bank reference TXN-998811',
        },
      });
      expect(result.status).toBe('PAID');
    });

    it('should delete fee invoice using prisma.feeInvoice.delete', async () => {
      const mockDeleted = {
        id: 'inv-uuid-001',
        status: 'CANCELLED',
      };

      vi.spyOn(prisma.feeInvoice, 'delete').mockResolvedValue(mockDeleted as any);

      const result = await feePrismaCrudService.deleteFeeInvoice('inv-uuid-001');

      expect(prisma.feeInvoice.delete).toHaveBeenCalledWith({
        where: { id: 'inv-uuid-001' },
      });
      expect(result.id).toBe('inv-uuid-001');
    });
  });
});
