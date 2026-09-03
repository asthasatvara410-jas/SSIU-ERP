// ==============================================================================
// SWARRNIM UNIVERSITY ERP — CENTRAL STUDENT MASTER SERVICE (SINGLE SOURCE OF TRUTH)
// ==============================================================================

import { db } from './db';
import { 
  Student, StudentStatus, StudentOnboardingStatus, 
  User, UserRole, CoreRbacRole, StandardRolePermissions 
} from '../types';
import { auditLogService } from './auditLogService';

export interface StudentMasterFilterParams {
  instituteId?: string;
  departmentId?: string;
  programId?: string;
  academicYearId?: string;
  semesterId?: string;
  batchId?: string;
  divisionId?: string;
  studentStatus?: StudentStatus | string;
  onboardingStatus?: StudentOnboardingStatus | string;
  mentorId?: string;
  gender?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedStudentMasterResult {
  students: Student[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UpdateStudentStatusParams {
  studentId: string;
  newStatus: StudentStatus;
  reason?: string;
  actorUser: User;
}

export interface UpdateOnboardingStatusParams {
  studentId: string;
  newStatus: StudentOnboardingStatus;
  reason?: string;
  actorUser: User;
}

export class StudentMasterServiceEngine {
  private static instance: StudentMasterServiceEngine;

  private constructor() {}

  public static getInstance(): StudentMasterServiceEngine {
    if (!StudentMasterServiceEngine.instance) {
      StudentMasterServiceEngine.instance = new StudentMasterServiceEngine();
    }
    return StudentMasterServiceEngine.instance;
  }

  // ============================================================================
  // 1. STANDARD ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
  // ============================================================================

  /**
   * Returns standard 8-action permissions for any ERP role on Student Master
   */
  public getRolePermissions(role?: UserRole | CoreRbacRole | string | null): StandardRolePermissions {
    if (!role) {
      return { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: false, canPrint: false };
    }

    switch (role) {
      case 'SUPER_ADMIN':
      case 'PRESIDENT':
      case 'VICE_PRESIDENT':
      case 'PROVOST':
        return { canView: true, canCreate: true, canEdit: true, canDelete: true, canApprove: true, canVerify: true, canExport: true, canPrint: true };

      case 'STUDENT_ADMIN':
      case 'ADMISSION_OFFICER':
      case 'STUDENT_SECTION':
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canVerify: true, canExport: true, canPrint: true };

      case 'UNIVERSITY_ADMIN':
      case 'ADMIN_OFFICER':
      case 'REGISTRAR':
      case 'DEPUTY_REGISTRAR':
      case 'PRINCIPAL':
      case 'HOD':
        return { canView: true, canCreate: true, canEdit: true, canDelete: false, canApprove: true, canVerify: true, canExport: true, canPrint: true };

      case 'EXAM_CELL':
      case 'EXAM_OFFICER':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true, canVerify: true, canExport: true, canPrint: true };

      case 'ACCOUNTS_ADMIN':
      case 'FINANCE_OFFICER':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true, canVerify: true, canExport: true, canPrint: true };

      case 'FACULTY':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: true, canPrint: true };

      case 'MENTOR':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: true, canVerify: false, canExport: true, canPrint: true };

      case 'HR_ADMIN':
      case 'IQAC':
      case 'LIBRARY_ADMIN':
      case 'HOSTEL_ADMIN':
      case 'TRANSPORT_ADMIN':
      case 'MAINTENANCE_ADMIN':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: true, canPrint: false };

      case 'STUDENT':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: false, canPrint: true };

      case 'PARENT':
        return { canView: true, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: false, canPrint: false };

      default:
        return { canView: false, canCreate: false, canEdit: false, canDelete: false, canApprove: false, canVerify: false, canExport: false, canPrint: false };
    }
  }

  // ============================================================================
  // 2. STUDENT MASTER RETRIEVAL & QUERYING
  // ============================================================================

  /**
   * Retrieve all canonical student records from Student Master
   */
  public getAllStudents(): Student[] {
    return db.getStudents();
  }

  /**
   * Retrieve a single Student Master record by ID
   */
  public getStudentById(id: string): Student | undefined {
    return db.getStudents().find(s => s.id === id);
  }

  /**
   * Retrieve a single Student Master record by Enrollment Number
   */
  public getStudentByEnrollmentNo(enrollmentNo: string): Student | undefined {
    return db.getStudents().find(s => s.enrollmentNo === enrollmentNo);
  }

  /**
   * Query Student Master with rich filters and pagination
   */
  public queryStudents(params?: StudentMasterFilterParams): PaginatedStudentMasterResult {
    let students = db.getStudents();

    if (!params) {
      return {
        students,
        total: students.length,
        page: 1,
        pageSize: students.length,
        totalPages: 1
      };
    }

    if (params.instituteId) {
      students = students.filter(s => s.instituteId === params.instituteId);
    }

    if (params.departmentId) {
      students = students.filter(s => s.departmentId === params.departmentId);
    }

    if (params.programId) {
      students = students.filter(s => s.programId === params.programId);
    }

    if (params.academicYearId) {
      students = students.filter(s => s.academicYearId === params.academicYearId);
    }

    if (params.semesterId) {
      students = students.filter(s => s.semesterId === params.semesterId);
    }

    if (params.batchId) {
      students = students.filter(s => s.batchId === params.batchId);
    }

    if (params.divisionId) {
      students = students.filter(s => s.divisionId === params.divisionId);
    }

    if (params.studentStatus) {
      students = students.filter(s => s.studentStatus === params.studentStatus || s.status === params.studentStatus);
    }

    if (params.onboardingStatus) {
      students = students.filter(s => s.onboardingStatus === params.onboardingStatus);
    }

    if (params.mentorId) {
      students = students.filter(s => s.mentorId === params.mentorId);
    }

    if (params.gender) {
      students = students.filter(s => s.gender === params.gender);
    }

    if (params.category) {
      students = students.filter(s => s.category === params.category);
    }

    if (params.search) {
      const term = params.search.toLowerCase();
      students = students.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.enrollmentNo.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term) ||
        s.phone.includes(term) ||
        (s.admissionNumber && s.admissionNumber.toLowerCase().includes(term)) ||
        (s.applicationNumber && s.applicationNumber.toLowerCase().includes(term))
      );
    }

    const total = students.length;
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.max(1, params.pageSize || 50);
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedStudents = students.slice(startIndex, startIndex + pageSize);

    return {
      students: paginatedStudents,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  // ============================================================================
  // 3. STUDENT MASTER MUTATION WITH AUDIT LOGGING
  // ============================================================================

  /**
   * Create a new Student Master record with validation & audit trail
   */
  public createStudent(studentData: Partial<Student>, actorUser: User): Student {
    const perms = this.getRolePermissions(actorUser.role);
    if (!perms.canCreate) {
      throw new Error(`403 Forbidden: Role ${actorUser.role} is not authorized to create Student Master records.`);
    }

    // Required fields check
    if (!studentData.name && !studentData.fullName) {
      throw new Error('Validation Error: Student Full Name is required.');
    }
    if (!studentData.enrollmentNo) {
      throw new Error('Validation Error: Student Enrollment Number is required.');
    }
    if (!studentData.email) {
      throw new Error('Validation Error: Student Email is required.');
    }
    if (!studentData.programId) {
      throw new Error('Validation Error: Program ID is required.');
    }
    if (!studentData.instituteId) {
      throw new Error('Validation Error: Institute ID is required.');
    }

    // Check duplicate enrollment number
    const existing = db.getStudents().find(s => s.enrollmentNo === studentData.enrollmentNo);
    if (existing) {
      throw new Error(`Conflict: A student with Enrollment Number ${studentData.enrollmentNo} already exists.`);
    }

    const id = studentData.id || `stu-${Date.now()}`;
    const studentStatus: StudentStatus = (studentData.studentStatus as StudentStatus) || 'ACTIVE';
    const onboardingStatus: StudentOnboardingStatus = (studentData.onboardingStatus as StudentOnboardingStatus) || 'ONBOARDED';

    const newStudent: Student = {
      ...studentData,
      id,
      enrollmentNo: studentData.enrollmentNo,
      name: studentData.name || studentData.fullName || '',
      fullName: studentData.fullName || studentData.name || '',
      email: studentData.email,
      phone: studentData.phone || '',
      gender: studentData.gender || 'Male',
      instituteId: studentData.instituteId,
      programId: studentData.programId,
      semesterId: studentData.semesterId || 'sem-1',
      divisionId: studentData.divisionId || 'div-1',
      batchId: studentData.batchId || 'batch-2026',
      guardianName: studentData.guardianName || studentData.fatherName || 'Parent Guardian',
      guardianPhone: studentData.guardianPhone || studentData.fatherPhone || studentData.phone || '',
      studentStatus,
      onboardingStatus,
      status: studentStatus
    } as Student;

    db.updateState(state => {
      state.students = [newStudent, ...state.students];
    }, `Created Student Master record: ${newStudent.enrollmentNo}`);

    auditLogService.log({
      action: 'STUDENT_MASTER_CREATED',
      module: 'STUDENT_MASTER',
      recordId: id,
      details: `Created Student Master record ${newStudent.name} (${newStudent.enrollmentNo})`,
      user: actorUser,
      newValue: newStudent
    });

    return newStudent;
  }

  /**
   * Update an existing Student Master record with state diff audit
   */
  public updateStudent(studentId: string, updates: Partial<Student>, actorUser: User): Student {
    const perms = this.getRolePermissions(actorUser.role);
    if (!perms.canEdit) {
      throw new Error(`403 Forbidden: Role ${actorUser.role} is not authorized to edit Student Master records.`);
    }

    const existingStudent = this.getStudentById(studentId);
    if (!existingStudent) {
      throw new Error(`Not Found: Student Master record ${studentId} not found.`);
    }

    const previousSnapshot = { ...existingStudent };
    const updatedStudent: Student = {
      ...existingStudent,
      ...updates,
      id: studentId,
      enrollmentNo: updates.enrollmentNo || existingStudent.enrollmentNo,
      name: updates.name || updates.fullName || existingStudent.name
    };

    db.updateState(state => {
      const idx = state.students.findIndex(s => s.id === studentId);
      if (idx !== -1) {
        state.students[idx] = updatedStudent;
      }
    }, `Updated Student Master record: ${updatedStudent.enrollmentNo}`);

    auditLogService.log({
      action: 'STUDENT_MASTER_UPDATED',
      module: 'STUDENT_MASTER',
      recordId: studentId,
      details: `Updated Student Master record ${updatedStudent.name} (${updatedStudent.enrollmentNo})`,
      user: actorUser,
      previousValue: previousSnapshot,
      newValue: updatedStudent
    });

    return updatedStudent;
  }

  /**
   * Update Student Lifecycle Status (12 Supported Statuses)
   */
  public updateStudentStatus(params: UpdateStudentStatusParams): Student {
    const perms = this.getRolePermissions(params.actorUser.role);
    if (!perms.canApprove && !perms.canEdit) {
      throw new Error(`403 Forbidden: Role ${params.actorUser.role} cannot change Student Lifecycle Status.`);
    }

    const student = this.getStudentById(params.studentId);
    if (!student) {
      throw new Error(`Student record not found: ${params.studentId}`);
    }

    const previousStatus = student.studentStatus || student.status;
    student.studentStatus = params.newStatus;
    student.status = params.newStatus;

    db.updateState(state => {
      const idx = state.students.findIndex(s => s.id === params.studentId);
      if (idx !== -1) {
        state.students[idx] = { ...student };
      }
    }, `Updated Student Lifecycle Status to ${params.newStatus}`);

    auditLogService.log({
      action: 'STUDENT_STATUS_TRANSITIONED',
      module: 'STUDENT_MASTER',
      recordId: params.studentId,
      details: `Transitioned Student Status for ${student.name} from "${previousStatus}" to "${params.newStatus}". Reason: ${params.reason || 'Administrative status transition'}`,
      user: params.actorUser,
      previousValue: { studentStatus: previousStatus },
      newValue: { studentStatus: params.newStatus, reason: params.reason }
    });

    return student;
  }

  /**
   * Update Student Onboarding Status (10 Supported Statuses)
   */
  public updateOnboardingStatus(params: UpdateOnboardingStatusParams): Student {
    const perms = this.getRolePermissions(params.actorUser.role);
    if (!perms.canApprove && !perms.canVerify && !perms.canEdit) {
      throw new Error(`403 Forbidden: Role ${params.actorUser.role} cannot change Student Onboarding Status.`);
    }

    const student = this.getStudentById(params.studentId);
    if (!student) {
      throw new Error(`Student record not found: ${params.studentId}`);
    }

    const previousOnboarding = student.onboardingStatus;
    student.onboardingStatus = params.newStatus;

    db.updateState(state => {
      const idx = state.students.findIndex(s => s.id === params.studentId);
      if (idx !== -1) {
        state.students[idx] = { ...student };
      }
    }, `Updated Student Onboarding Status to ${params.newStatus}`);

    auditLogService.log({
      action: 'ONBOARDING_STATUS_TRANSITIONED',
      module: 'STUDENT_MASTER',
      recordId: params.studentId,
      details: `Transitioned Onboarding Status for ${student.name} from "${previousOnboarding}" to "${params.newStatus}". Reason: ${params.reason || 'Onboarding desk action'}`,
      user: params.actorUser,
      previousValue: { onboardingStatus: previousOnboarding },
      newValue: { onboardingStatus: params.newStatus, reason: params.reason }
    });

    return student;
  }

  /**
   * Verify complete Student Master entity integrity
   */
  public validateStudentMasterIntegrity(student: Student): { valid: boolean; missingFields: string[] } {
    const missing: string[] = [];

    if (!student.id) missing.push('id');
    if (!student.enrollmentNo) missing.push('enrollmentNo');
    if (!student.name && !student.fullName) missing.push('name');
    if (!student.email) missing.push('email');
    if (!student.phone) missing.push('phone');
    if (!student.gender) missing.push('gender');
    if (!student.instituteId) missing.push('instituteId');
    if (!student.programId) missing.push('programId');
    if (!student.batchId) missing.push('batchId');
    if (!student.semesterId) missing.push('semesterId');
    if (!student.divisionId) missing.push('divisionId');

    return {
      valid: missing.length === 0,
      missingFields: missing
    };
  }
}

export const studentMasterService = StudentMasterServiceEngine.getInstance();
