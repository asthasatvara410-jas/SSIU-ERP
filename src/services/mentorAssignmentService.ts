import { db } from './db';
import { 
  MentorAssignment, MentorAssignmentHistory, MentorBulkUploadRow, 
  MentorEligibilityFilter, MentorDashboardStats 
} from '../types/mentorAssignment';
import { User, UserRole, Student, Faculty, Department, Institute, Program, AcademicYear } from '../types';
import * as XLSX from 'xlsx';

export class CentralMentorAssignmentService {
  /**
   * Check if acting user has RBAC authorization over a specific student
   */
  public isUserAuthorizedForStudent(user: User | null | undefined, student: Student): boolean {
    if (!user) return false;
    const role = user.role;

    if (role === 'SUPER_ADMIN' || role === 'UNIVERSITY_ADMIN') {
      return true;
    }

    if (role === 'PRINCIPAL' || role === 'REGISTRAR') {
      // HOI (Principal) can manage all departments under their authorized Institute
      return Boolean(user.instituteId && student.instituteId === user.instituteId);
    }

    if (role === 'HOD') {
      // HOD can manage students belonging to their authorized Department
      return Boolean(user.departmentId && student.departmentId === user.departmentId);
    }

    return false;
  }

  /**
   * Retrieve active mentor assignment for a student
   */
  public getActiveMentorForStudent(studentIdOrEnrollment: string): MentorAssignment | null {
    const assignments = db.getMentorAssignments();
    const students = db.getStudents();
    const student = students.find(
      s => s.id === studentIdOrEnrollment || 
           s.enrollmentNo === studentIdOrEnrollment ||
           s.email === studentIdOrEnrollment
    );

    if (!student) return null;

    const active = assignments.find(
      a => (a.studentId === student.id || a.studentEnrollmentNo === student.enrollmentNo) && 
           a.status === 'ACTIVE'
    );

    return active || null;
  }

  /**
   * Get eligible faculty members who can be selected as mentors
   */
  public getEligibleMentors(params: { instituteId?: string; departmentId?: string; studentId?: string }): Faculty[] {
    const faculties = db.getFaculty();
    let targetInstId = params.instituteId;
    let targetDeptId = params.departmentId;

    if (params.studentId) {
      const student = db.getStudents().find(s => s.id === params.studentId || s.enrollmentNo === params.studentId);
      if (student) {
        targetInstId = student.instituteId;
        targetDeptId = student.departmentId;
      }
    }

    return faculties.filter(f => {
      // 1. Must be active faculty
      if (f.status !== 'ACTIVE') return false;

      // 2. Department match if specified
      if (targetDeptId && f.departmentId !== targetDeptId) {
        return false;
      }

      // 3. Institute match if specified
      if (targetInstId && f.instituteId !== targetInstId) {
        return false;
      }

      // 4. Must not be excluded from mentorship
      if ((f as any).isMentor === false) {
        return false;
      }

      return true;
    });
  }

  /**
   * Query all mentor assignments respecting RBAC boundaries
   */
  public getAssignments(filters?: {
    instituteId?: string;
    departmentId?: string;
    programId?: string;
    semesterId?: string;
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
    mentorFacultyId?: string;
    searchQuery?: string;
  }, user?: User | null): { assignments: MentorAssignment[]; students: Student[] } {
    let assignments = db.getMentorAssignments();
    let students = db.getStudents();

    // 1. Enforce RBAC Scoping
    if (user) {
      if (user.role === 'PRINCIPAL') {
        if (user.instituteId) {
          students = students.filter(s => s.instituteId === user.instituteId);
          assignments = assignments.filter(a => a.instituteId === user.instituteId);
        }
      } else if (user.role === 'HOD') {
        if (user.departmentId) {
          students = students.filter(s => s.departmentId === user.departmentId);
          assignments = assignments.filter(a => a.departmentId === user.departmentId);
        }
      } else if (user.role === 'FACULTY') {
        // Faculty / Mentor sees only assigned mentees
        const myFaculty = db.getFaculty().find(f => f.id === user.id || f.email === user.email);
        const myFacId = myFaculty?.id || user.id;
        assignments = assignments.filter(a => a.mentorFacultyId === myFacId && a.status === 'ACTIVE');
        const myStudentIds = new Set(assignments.map(a => a.studentId));
        students = students.filter(s => myStudentIds.has(s.id));
      } else if (user.role === 'STUDENT') {
        students = students.filter(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo);
        assignments = assignments.filter(a => a.studentId === user.id || a.studentEnrollmentNo === user.enrollmentNo);
      }
    }

    // 2. Apply Custom Filters
    if (filters?.instituteId && filters.instituteId !== 'ALL') {
      students = students.filter(s => s.instituteId === filters.instituteId);
      assignments = assignments.filter(a => a.instituteId === filters.instituteId);
    }
    if (filters?.departmentId && filters.departmentId !== 'ALL') {
      students = students.filter(s => s.departmentId === filters.departmentId);
      assignments = assignments.filter(a => a.departmentId === filters.departmentId);
    }
    if (filters?.programId && filters.programId !== 'ALL') {
      students = students.filter(s => s.programId === filters.programId);
      assignments = assignments.filter(a => a.programId === filters.programId);
    }
    if (filters?.mentorFacultyId && filters.mentorFacultyId !== 'ALL') {
      assignments = assignments.filter(a => a.mentorFacultyId === filters.mentorFacultyId);
    }
    if (filters?.status && filters.status !== 'ALL') {
      assignments = assignments.filter(a => a.status === filters.status);
    }

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      students = students.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.enrollmentNo.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    return { assignments, students };
  }

  /**
   * ASSIGN OR CHANGE MENTOR
   */
  public assignMentor(params: {
    studentId: string;
    mentorFacultyId: string;
    effectiveFrom?: string;
    changeReason?: string;
    isChange?: boolean;
  }, actingUser: User): { assignment: MentorAssignment; history?: MentorAssignmentHistory } {
    const student = db.getStudents().find(s => s.id === params.studentId || s.enrollmentNo === params.studentId);
    if (!student) {
      throw new Error(`Student record not found in system.`);
    }

    // 1. RBAC Scope Validation
    if (!this.isUserAuthorizedForStudent(actingUser, student)) {
      throw new Error(`Unauthorized: ${actingUser.role} cannot assign mentor to students outside their authorized scope.`);
    }

    // 2. Mentor Eligibility Validation
    const eligibleMentors = this.getEligibleMentors({ studentId: student.id });
    const targetFaculty = eligibleMentors.find(f => f.id === params.mentorFacultyId || f.employeeId === params.mentorFacultyId);

    if (!targetFaculty) {
      throw new Error(`Selected faculty member is not eligible to mentor this student (must be active and belong to same department/institute).`);
    }

    // 3. Overwrite & Existing Mentor Check
    const currentActive = this.getActiveMentorForStudent(student.id);

    if (currentActive && currentActive.status === 'ACTIVE') {
      if (currentActive.mentorFacultyId === targetFaculty.id) {
        throw new Error(`Faculty ${targetFaculty.name} is already the active mentor for this student.`);
      }

      if (!params.isChange) {
        throw new Error(`Mentor already assigned. You must use "Change Mentor" and provide a mandatory reason.`);
      }

      if (!params.changeReason || !params.changeReason.trim()) {
        throw new Error(`A mandatory change reason is required when reassigning an existing mentor.`);
      }

      // Deactivate previous assignment
      const now = new Date().toISOString();
      const updatedPrevious: MentorAssignment = {
        ...currentActive,
        status: 'INACTIVE',
        effectiveTo: now,
        updatedAt: now
      };
      db.saveMentorAssignment(updatedPrevious, actingUser);

      // Create MentorAssignmentHistory record
      const historyItem: MentorAssignmentHistory = {
        id: `mah-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        assignmentId: currentActive.id,
        studentId: student.id,
        studentEnrollmentNo: student.enrollmentNo,
        studentName: student.name,
        previousMentorId: currentActive.mentorFacultyId,
        previousMentorName: currentActive.mentorName,
        newMentorId: targetFaculty.id,
        newMentorName: targetFaculty.name,
        changedByUserId: actingUser.id,
        changedByName: actingUser.name || 'Academic Administrator',
        changedByRole: actingUser.role,
        changeReason: params.changeReason.trim(),
        effectiveFrom: currentActive.effectiveFrom || currentActive.assignedDate,
        effectiveTo: now,
        createdAt: now
      };
      db.saveMentorAssignmentHistory(historyItem);
    }

    // 4. Create New Active Assignment
    const dept = db.getDepartmentById(student.departmentId);
    const inst = db.getInstituteById(student.instituteId);
    const prog = db.getProgramById(student.programId);
    const ay = db.getAcademicYears().find(a => a.id === student.academicYearId);
    const sem = db.getSemesters().find(s => s.id === student.semesterId);
    const div = db.getDivisions().find(d => d.id === student.divisionId);

    const now = new Date().toISOString();
    const newAssignment: MentorAssignment = {
      id: `ma-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentId: student.id,
      studentEnrollmentNo: student.enrollmentNo,
      studentName: student.name,
      mentorFacultyId: targetFaculty.id,
      mentorEmployeeId: targetFaculty.employeeId || 'FAC001',
      mentorName: targetFaculty.name,
      mentorEmail: targetFaculty.email,
      mentorPhone: targetFaculty.phone,
      mentorDepartmentId: targetFaculty.departmentId,
      mentorDepartmentName: dept?.name,
      assignedByUserId: actingUser.id,
      assignedByName: actingUser.name || `${actingUser.role} Administrator`,
      assignedByRole: actingUser.role,
      instituteId: student.instituteId || 'inst-1',
      instituteCode: inst?.code || 'SSCIT',
      instituteName: inst?.name,
      departmentId: student.departmentId || 'dept-1',
      departmentCode: dept?.code || 'CSE',
      departmentName: dept?.name,
      programId: student.programId || 'prog-1',
      programCode: prog?.code || 'BTECH-CSE',
      programName: prog?.name,
      academicYearId: student.academicYearId || 'ay-2024',
      academicYear: ay?.name || '2024-2025',
      semesterId: student.semesterId,
      semester: sem?.number || 4,
      section: div?.name || 'Division A',
      assignedDate: now,
      effectiveFrom: params.effectiveFrom || now,
      status: 'ACTIVE',
      changeReason: params.changeReason?.trim(),
      createdAt: now,
      updatedAt: now
    };

    db.saveMentorAssignment(newAssignment, actingUser);
    return { assignment: newAssignment };
  }

  /**
   * Remove active mentor assignment
   */
  public removeMentor(assignmentId: string, reason: string, actingUser: User): void {
    const assignments = db.getMentorAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      throw new Error(`Mentor assignment record not found.`);
    }

    const student = db.getStudents().find(s => s.id === assignment.studentId);
    if (student && !this.isUserAuthorizedForStudent(actingUser, student)) {
      throw new Error(`Unauthorized: You cannot remove mentor for students outside your scope.`);
    }

    const now = new Date().toISOString();
    const updated: MentorAssignment = {
      ...assignment,
      status: 'INACTIVE',
      effectiveTo: now,
      changeReason: reason || 'Mentor assignment removed by academic administrator.',
      updatedAt: now
    };
    db.saveMentorAssignment(updated, actingUser);

    // Save history
    const historyItem: MentorAssignmentHistory = {
      id: `mah-${Date.now()}`,
      assignmentId: assignment.id,
      studentId: assignment.studentId,
      studentEnrollmentNo: assignment.studentEnrollmentNo,
      studentName: assignment.studentName,
      previousMentorId: assignment.mentorFacultyId,
      previousMentorName: assignment.mentorName,
      newMentorId: '',
      newMentorName: 'None (Unassigned)',
      changedByUserId: actingUser.id,
      changedByName: actingUser.name || 'Academic Administrator',
      changedByRole: actingUser.role,
      changeReason: reason || 'Mentor removed',
      effectiveFrom: assignment.effectiveFrom,
      effectiveTo: now,
      createdAt: now
    };
    db.saveMentorAssignmentHistory(historyItem);
  }

  /**
   * Query mentor assignment history for a student
   */
  public getAssignmentHistory(studentIdOrEnrollment: string): MentorAssignmentHistory[] {
    const history = db.getMentorAssignmentHistory();
    const student = db.getStudents().find(
      s => s.id === studentIdOrEnrollment || s.enrollmentNo === studentIdOrEnrollment
    );

    if (!student) return [];

    return history.filter(
      h => h.studentId === student.id || h.studentEnrollmentNo === student.enrollmentNo
    );
  }

  /**
   * Generate official .XLSX template for bulk mentor assignments
   */
  public exportMentorTemplateXlsx(): Uint8Array {
    const sampleData = [
      {
        'Student Enrollment Number': 'STUDENT-001',
        'Department Code': 'CSE',
        'Program Code': 'BTECH-CSE',
        'Semester': '4',
        'Section': 'Division A',
        'Mentor Employee ID': 'FAC001'
      },
      {
        'Student Enrollment Number': 'STUDENT-002',
        'Department Code': 'CSE',
        'Program Code': 'BTECH-CSE',
        'Semester': '4',
        'Section': 'Division A',
        'Mentor Employee ID': 'FAC002'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    worksheet['!cols'] = [
      { wch: 28 }, // Student Enrollment Number
      { wch: 18 }, // Department Code
      { wch: 18 }, // Program Code
      { wch: 12 }, // Semester
      { wch: 16 }, // Section
      { wch: 22 }  // Mentor Employee ID
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mentor_Assignments');
    const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    return new Uint8Array(out);
  }

  /**
   * Process & Validate Bulk XLSX Upload
   */
  public parseAndValidateBulkXlsx(data: ArrayBuffer | Uint8Array, actingUser: User): {
    totalRows: number;
    validRows: MentorBulkUploadRow[];
    invalidRows: MentorBulkUploadRow[];
    errorsSummary: string[];
  } {
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    const students = db.getStudents();
    const faculties = db.getFaculty();
    const departments = db.getDepartments();

    const validRows: MentorBulkUploadRow[] = [];
    const invalidRows: MentorBulkUploadRow[] = [];
    const errorsSummary: string[] = [];

    rawRows.forEach((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      const studentEnrollment = String(row['Student Enrollment Number'] || row['studentEnrollmentNo'] || '').trim();
      const deptCode = String(row['Department Code'] || row['departmentCode'] || '').trim();
      const progCode = String(row['Program Code'] || row['programCode'] || '').trim();
      const semester = row['Semester'] || row['semester'] || '';
      const section = String(row['Section'] || row['section'] || '').trim();
      const mentorEmpId = String(row['Mentor Employee ID'] || row['mentorEmployeeId'] || '').trim();

      const rowErrors: string[] = [];

      if (!studentEnrollment) rowErrors.push('Missing Student Enrollment Number');
      if (!mentorEmpId) rowErrors.push('Missing Mentor Employee ID');

      const student = students.find(s => s.enrollmentNo.toUpperCase() === studentEnrollment.toUpperCase());
      if (!student) {
        rowErrors.push(`Student with enrollment "${studentEnrollment}" not found.`);
      }

      const mentor = faculties.find(f => 
        (f.employeeId && f.employeeId.toUpperCase() === mentorEmpId.toUpperCase()) ||
        f.id.toUpperCase() === mentorEmpId.toUpperCase()
      );

      if (!mentor) {
        rowErrors.push(`Faculty with Employee ID "${mentorEmpId}" not found.`);
      }

      if (student && !this.isUserAuthorizedForStudent(actingUser, student)) {
        rowErrors.push(`Unauthorized: You do not have permission to assign mentors to student ${studentEnrollment}.`);
      }

      if (student && mentor) {
        if (mentor.status !== 'ACTIVE') {
          rowErrors.push(`Faculty ${mentor.name} is INACTIVE.`);
        }
        if (mentor.departmentId !== student.departmentId) {
          rowErrors.push(`Faculty ${mentor.name} belongs to department ${mentor.departmentId}, which does not match student's department ${student.departmentId}.`);
        }
      }

      const item: MentorBulkUploadRow = {
        studentEnrollmentNo: studentEnrollment,
        departmentCode: deptCode || (student ? db.getDepartmentById(student.departmentId)?.code || '' : ''),
        programCode: progCode,
        semester,
        section,
        mentorEmployeeId: mentorEmpId,
        studentName: student?.name,
        mentorName: mentor?.name,
        studentId: student?.id,
        mentorFacultyId: mentor?.id,
        instituteId: student?.instituteId,
        departmentId: student?.departmentId,
        programId: student?.programId,
        academicYearId: student?.academicYearId,
        isValid: rowErrors.length === 0,
        errors: rowErrors
      };

      if (rowErrors.length === 0) {
        validRows.push(item);
      } else {
        invalidRows.push(item);
        errorsSummary.push(`Row ${rowNum} (${studentEnrollment}): ${rowErrors.join(', ')}`);
      }
    });

    return {
      totalRows: rawRows.length,
      validRows,
      invalidRows,
      errorsSummary
    };
  }

  /**
   * Commit verified bulk upload rows to database
   */
  public commitBulkUpload(validRows: MentorBulkUploadRow[], actingUser: User): number {
    let count = 0;
    validRows.forEach(row => {
      if (row.studentId && row.mentorFacultyId) {
        const currentActive = this.getActiveMentorForStudent(row.studentId);
        if (currentActive && currentActive.mentorFacultyId === row.mentorFacultyId && currentActive.status === 'ACTIVE') {
          count++;
          return;
        }
        this.assignMentor({
          studentId: row.studentId,
          mentorFacultyId: row.mentorFacultyId,
          isChange: Boolean(currentActive && currentActive.status === 'ACTIVE'),
          changeReason: 'Bulk XLSX Import by Academic Administrator'
        }, actingUser);
        count++;
      }
    });
    return count;
  }
}

export const mentorAssignmentService = new CentralMentorAssignmentService();
