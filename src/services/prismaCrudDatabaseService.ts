/**
 * SSIU ERP — Central Prisma Database CRUD Engine
 * File: src/services/prismaCrudDatabaseService.ts
 *
 * Provides complete Create, Read, Update, Delete (CRUD) operations for:
 * 1. Students (Student Master, Enrollments, ABC ID, Profiles)
 * 2. Attendance (Attendance Applications, Eligibility, Mappings)
 * 3. Fees (Fee Heads, Fee Structures, Student Accounts, Invoices, Payments)
 *
 * Interacts directly with PostgreSQL via PrismaClient from src/services/databaseService.ts.
 */

import { prisma } from './databaseService';

// ─────────────────────────────────────────────────────────────────────────────
// 1. STUDENT CRUD SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateStudentDTO {
  erpId: string;
  enrollmentNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  instituteId: string;
  departmentId: string;
  batchId: string;
  currentDivisionId?: string;
  abcId?: string;
  temporaryEnrollmentNumber?: string;
  finalEnrollmentNumber?: string;
  enrollmentStatus?: string;
}

export interface UpdateStudentDTO {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  gender?: string;
  status?: string;
  abcId?: string;
  abcIdStatus?: string;
  currentDivisionId?: string;
  enrollmentStatus?: string;
}

export class StudentPrismaCrudService {
  private static instance: StudentPrismaCrudService;
  private constructor() {}

  public static getInstance(): StudentPrismaCrudService {
    if (!StudentPrismaCrudService.instance) {
      StudentPrismaCrudService.instance = new StudentPrismaCrudService();
    }
    return StudentPrismaCrudService.instance;
  }

  /** CREATE: Insert a new student record into database */
  public async createStudent(dto: CreateStudentDTO) {
    return await prisma.student.create({
      data: {
        erpId: dto.erpId,
        enrollmentNo: dto.enrollmentNo,
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        gender: dto.gender,
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        batchId: dto.batchId,
        currentDivisionId: dto.currentDivisionId,
        abcId: dto.abcId,
        temporaryEnrollmentNumber: dto.temporaryEnrollmentNumber,
        finalEnrollmentNumber: dto.finalEnrollmentNumber,
        enrollmentStatus: dto.enrollmentStatus || 'TEMPORARY',
        status: 'ACTIVE',
      },
      include: {
        institute: true,
        department: true,
        batch: true,
      },
    });
  }

  /** READ: Get student by UUID */
  public async getStudentById(id: string) {
    return await prisma.student.findUnique({
      where: { id },
      include: {
        institute: true,
        department: true,
        batch: true,
        studentFacultyMappings: {
          include: {
            subject: true,
            faculty: true,
          },
        },
      },
    });
  }

  /** READ: Get student by ERP ID or Enrollment No */
  public async getStudentByEnrollment(enrollmentNo: string) {
    return await prisma.student.findUnique({
      where: { enrollmentNo },
      include: {
        institute: true,
        department: true,
        batch: true,
      },
    });
  }

  /** READ: List students with pagination and filters */
  public async listStudents(filters: {
    instituteId?: string;
    departmentId?: string;
    batchId?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 25;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (filters.instituteId) where.instituteId = filters.instituteId;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.batchId) where.batchId = filters.batchId;
    if (filters.status) where.status = filters.status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.student.count({ where }),
    ]);

    return {
      data: students,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /** UPDATE: Update student attributes */
  public async updateStudent(id: string, dto: UpdateStudentDTO) {
    return await prisma.student.update({
      where: { id },
      data: dto,
    });
  }

  /** DELETE: Soft delete or hard delete student */
  public async deleteStudent(id: string, softDelete = true) {
    if (softDelete) {
      return await prisma.student.update({
        where: { id },
        data: { status: 'INACTIVE' },
      });
    }
    return await prisma.student.delete({
      where: { id },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. ATTENDANCE CRUD SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateAttendanceApplicationDTO {
  applicationNo: string;
  studentId: string;
  studentName: string;
  enrollmentNo: string;
  studentEmail: string;
  studentPhone?: string;
  instituteId: string;
  departmentId: string;
  programId: string;
  semesterId: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  subjectFacultyId: string;
  subjectFacultyName: string;
  mentorFacultyId: string;
  mentorFacultyName: string;
  hodUserId: string;
  hodUserName: string;
  hoiUserId: string;
  hoiUserName: string;
  totalClasses: number;
  presentClasses: number;
  absentClasses: number;
  currentAttendancePct: number;
  requiredAttendancePct?: number;
  shortagePct: number;
  reason: string; // 'MEDICAL' | 'UNIVERSITY_ACTIVITY' | 'OFFICIAL_DUTY'
  description: string;
  currentHandlerRole: string;
  currentHandlerId: string;
  currentHandlerName: string;
}

export class AttendancePrismaCrudService {
  private static instance: AttendancePrismaCrudService;
  private constructor() {}

  public static getInstance(): AttendancePrismaCrudService {
    if (!AttendancePrismaCrudService.instance) {
      AttendancePrismaCrudService.instance = new AttendancePrismaCrudService();
    }
    return AttendancePrismaCrudService.instance;
  }

  /** CREATE: Submit a new student attendance condonation / OD application */
  public async createAttendanceApplication(dto: CreateAttendanceApplicationDTO) {
    return await prisma.attendanceApplication.create({
      data: {
        applicationNo: dto.applicationNo,
        studentId: dto.studentId,
        studentName: dto.studentName,
        enrollmentNo: dto.enrollmentNo,
        studentEmail: dto.studentEmail,
        studentPhone: dto.studentPhone,
        instituteId: dto.instituteId,
        departmentId: dto.departmentId,
        programId: dto.programId,
        semesterId: dto.semesterId,
        subjectId: dto.subjectId,
        subjectCode: dto.subjectCode,
        subjectName: dto.subjectName,
        subjectFacultyId: dto.subjectFacultyId,
        subjectFacultyName: dto.subjectFacultyName,
        mentorFacultyId: dto.mentorFacultyId,
        mentorFacultyName: dto.mentorFacultyName,
        hodUserId: dto.hodUserId,
        hodUserName: dto.hodUserName,
        hoiUserId: dto.hoiUserId,
        hoiUserName: dto.hoiUserName,
        totalClasses: dto.totalClasses,
        presentClasses: dto.presentClasses,
        absentClasses: dto.absentClasses,
        currentAttendancePct: dto.currentAttendancePct,
        requiredAttendancePct: dto.requiredAttendancePct || 75.0,
        shortagePct: dto.shortagePct,
        reason: dto.reason,
        description: dto.description,
        currentHandlerRole: dto.currentHandlerRole,
        currentHandlerId: dto.currentHandlerId,
        currentHandlerName: dto.currentHandlerName,
        status: 'SUBMITTED_TO_FACULTY',
        finalEligibilityGranted: false,
      },
    });
  }

  /** READ: Get attendance application by ID */
  public async getAttendanceApplicationById(id: string) {
    return await prisma.attendanceApplication.findUnique({
      where: { id },
    });
  }

  /** READ: Get student attendance application history */
  public async getStudentAttendanceApplications(studentId: string) {
    return await prisma.attendanceApplication.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** UPDATE: Approve or reject attendance application */
  public async updateAttendanceStatus(
    id: string,
    status: 'FINAL_APPROVED' | 'FACULTY_APPROVED' | 'HOI_APPROVED' | 'FACULTY_REJECTED' | 'HOI_REJECTED',
    handlerRole: string,
    handlerUserId: string,
    handlerName: string
  ) {
    const isFinal = status === 'FINAL_APPROVED';
    return await prisma.attendanceApplication.update({
      where: { id },
      data: {
        status,
        finalEligibilityGranted: isFinal,
        currentHandlerRole: isFinal ? 'COMPLETED' : handlerRole,
        currentHandlerId: handlerUserId,
        currentHandlerName: handlerName,
      },
    });
  }

  /** DELETE: Cancel / delete attendance application */
  public async deleteAttendanceApplication(id: string) {
    return await prisma.attendanceApplication.delete({
      where: { id },
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. FEES & INVOICE CRUD SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateFeeInvoiceDTO {
  invoiceNumber: string;
  studentId: string;
  studentFeeAccountId: string;
  feeStructureId: string;
  academicYearId?: string;
  academicYearCode: string;
  semesterId: string;
  dueDate: Date;
  subtotal: number;
  totalAmount: number;
  createdBy: string;
  items?: Array<{
    feeHeadId: string;
    amount: number;
    description?: string;
  }>;
}

export class FeePrismaCrudService {
  private static instance: FeePrismaCrudService;
  private constructor() {}

  public static getInstance(): FeePrismaCrudService {
    if (!FeePrismaCrudService.instance) {
      FeePrismaCrudService.instance = new FeePrismaCrudService();
    }
    return FeePrismaCrudService.instance;
  }

  /** CREATE: Generate a fee invoice with line items */
  public async createFeeInvoice(dto: CreateFeeInvoiceDTO) {
    return await prisma.feeInvoice.create({
      data: {
        invoiceNumber: dto.invoiceNumber,
        studentId: dto.studentId,
        studentFeeAccountId: dto.studentFeeAccountId,
        feeStructureId: dto.feeStructureId,
        academicYearId: dto.academicYearId,
        academicYearCode: dto.academicYearCode,
        semesterId: dto.semesterId,
        dueDate: dto.dueDate,
        subtotal: dto.subtotal,
        totalAmount: dto.totalAmount,
        status: 'ISSUED',
        createdBy: dto.createdBy,
        items: dto.items && dto.items.length > 0 ? {
          create: dto.items.map(item => ({
            feeHeadId: item.feeHeadId,
            amount: item.amount,
            description: item.description,
          })),
        } : undefined,
      },
      include: {
        items: true,
      },
    });
  }

  /** READ: Get fee invoice by ID */
  public async getFeeInvoiceById(id: string) {
    return await prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        items: true,
        student: true,
        feeStructure: true,
      },
    });
  }

  /** READ: Get invoices for a student */
  public async getStudentInvoices(studentId: string) {
    return await prisma.feeInvoice.findMany({
      where: { studentId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** UPDATE: Update invoice status (e.g. PAID, CANCELLED) */
  public async updateInvoiceStatus(id: string, status: string, remarks?: string) {
    return await prisma.feeInvoice.update({
      where: { id },
      data: {
        status,
        remarks,
      },
    });
  }

  /** DELETE: Delete fee invoice */
  public async deleteFeeInvoice(id: string) {
    return await prisma.feeInvoice.delete({
      where: { id },
    });
  }
}

// Export singleton instances
export const studentPrismaCrudService = StudentPrismaCrudService.getInstance();
export const attendancePrismaCrudService = AttendancePrismaCrudService.getInstance();
export const feePrismaCrudService = FeePrismaCrudService.getInstance();
