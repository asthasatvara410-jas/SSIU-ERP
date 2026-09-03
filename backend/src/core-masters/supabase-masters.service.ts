import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUserSession } from '../auth/supabase-session.types';

@Injectable()
export class SupabaseMastersService {
  private readonly logger = new Logger(SupabaseMastersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ACADEMIC STRUCTURE
  // ──────────────────────────────────────────────────────────────────────────

  async getUniversities() {
    return this.prisma.$queryRaw`SELECT * FROM universities WHERE deleted_at IS NULL ORDER BY name ASC;`;
  }

  async getInstitutes(universityId?: string) {
    if (universityId) {
      return this.prisma.$queryRaw`SELECT * FROM institutes WHERE university_id = ${universityId}::uuid AND deleted_at IS NULL ORDER BY name ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM institutes WHERE deleted_at IS NULL ORDER BY name ASC;`;
  }

  async getDepartments(instituteId?: string) {
    if (instituteId) {
      return this.prisma.$queryRaw`SELECT * FROM departments WHERE institute_id = ${instituteId}::uuid AND deleted_at IS NULL ORDER BY name ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM departments WHERE deleted_at IS NULL ORDER BY name ASC;`;
  }

  async getAcademicYears() {
    return this.prisma.$queryRaw`SELECT * FROM academic_years WHERE deleted_at IS NULL ORDER BY start_year DESC;`;
  }

  async getPrograms(departmentId?: string) {
    if (departmentId) {
      return this.prisma.$queryRaw`SELECT * FROM programs WHERE department_id = ${departmentId}::uuid AND deleted_at IS NULL ORDER BY name ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM programs WHERE deleted_at IS NULL ORDER BY name ASC;`;
  }

  async getBatches(programId?: string) {
    if (programId) {
      return this.prisma.$queryRaw`SELECT * FROM batches WHERE program_id = ${programId}::uuid AND deleted_at IS NULL ORDER BY start_year DESC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM batches WHERE deleted_at IS NULL ORDER BY start_year DESC;`;
  }

  async getSemesters(programId?: string) {
    if (programId) {
      return this.prisma.$queryRaw`SELECT * FROM semesters WHERE program_id = ${programId}::uuid AND deleted_at IS NULL ORDER BY semester_number ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM semesters WHERE deleted_at IS NULL ORDER BY semester_number ASC;`;
  }

  async getDivisions(semesterId?: string) {
    if (semesterId) {
      return this.prisma.$queryRaw`SELECT * FROM divisions WHERE semester_id = ${semesterId}::uuid AND deleted_at IS NULL ORDER BY code ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM divisions WHERE deleted_at IS NULL ORDER BY code ASC;`;
  }

  async getSubjects(programId?: string, semesterId?: string) {
    if (programId && semesterId) {
      return this.prisma.$queryRaw`SELECT * FROM subjects WHERE program_id = ${programId}::uuid AND semester_id = ${semesterId}::uuid AND deleted_at IS NULL ORDER BY code ASC;`;
    }
    if (programId) {
      return this.prisma.$queryRaw`SELECT * FROM subjects WHERE program_id = ${programId}::uuid AND deleted_at IS NULL ORDER BY code ASC;`;
    }
    return this.prisma.$queryRaw`SELECT * FROM subjects WHERE deleted_at IS NULL ORDER BY code ASC;`;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. STUDENT MASTER (Scoped Access)
  // ──────────────────────────────────────────────────────────────────────────

  async getStudents(user: AuthenticatedUserSession, query: { departmentId?: string; programId?: string; batchId?: string }) {
    // 1. Super Admin: full access
    if (user.isSuperAdmin) {
      if (query.departmentId) {
        return this.prisma.$queryRaw`SELECT * FROM students WHERE department_id = ${query.departmentId}::uuid AND deleted_at IS NULL ORDER BY first_name ASC;`;
      }
      return this.prisma.$queryRaw`SELECT * FROM students WHERE deleted_at IS NULL ORDER BY first_name ASC LIMIT 100;`;
    }

    // 2. HOD: Restricted to HOD's department
    if (user.roles.includes('HOD')) {
      const deptId = user.departmentId;
      if (!deptId) throw new ForbiddenException('HOD has no assigned department.');
      return this.prisma.$queryRaw`SELECT * FROM students WHERE department_id = ${deptId}::uuid AND deleted_at IS NULL ORDER BY first_name ASC;`;
    }

    // 3. Faculty / Mentor: Accessible students (taught or mentored)
    if (user.roles.includes('FACULTY') || user.roles.includes('MENTOR')) {
      const facId = user.facultyId;
      if (!facId) throw new ForbiddenException('Faculty identity not resolved.');
      return this.prisma.$queryRaw`
        SELECT DISTINCT s.* FROM students s
        LEFT JOIN student_academic_enrollments sae ON sae.student_id = s.id
        LEFT JOIN faculty_subject_allocations fsa ON fsa.division_id = sae.division_id
        LEFT JOIN mentor_allocations ma ON ma.student_id = s.id
        WHERE (fsa.faculty_id = ${facId}::uuid OR ma.faculty_id = ${facId}::uuid)
          AND s.deleted_at IS NULL;
      `;
    }

    // 4. Student: Only own profile
    if (user.roles.includes('STUDENT')) {
      const stuId = user.studentId;
      if (!stuId) throw new ForbiddenException('Student identity not resolved.');
      return this.prisma.$queryRaw`SELECT * FROM students WHERE id = ${stuId}::uuid AND deleted_at IS NULL;`;
    }

    // 5. Parent: Only linked wards
    if (user.roles.includes('PARENT')) {
      const parentId = user.parentId;
      if (!parentId) throw new ForbiddenException('Parent identity not resolved.');
      return this.prisma.$queryRaw`
        SELECT s.* FROM students s
        JOIN student_parent_mappings spm ON spm.student_id = s.id
        WHERE spm.parent_id = ${parentId}::uuid AND spm.can_access_portal = TRUE AND s.deleted_at IS NULL;
      `;
    }

    throw new ForbiddenException('Access denied to student master.');
  }

  async getStudentById(id: string, user: AuthenticatedUserSession) {
    // Check permission
    if (!user.isSuperAdmin) {
      if (user.roles.includes('STUDENT') && user.studentId !== id) {
        throw new ForbiddenException('Access denied: You can only access your own student profile.');
      }
      if (user.roles.includes('PARENT') && !user.linkedWardStudentIds?.includes(id)) {
        throw new ForbiddenException('Access denied: You can only access linked ward profiles.');
      }
    }

    const students: any[] = await this.prisma.$queryRaw`SELECT * FROM students WHERE id = ${id}::uuid AND deleted_at IS NULL LIMIT 1;`;
    if (!students || students.length === 0) {
      throw new NotFoundException('Student record not found.');
    }
    return students[0];
  }

  async updateStudentContact(id: string, user: AuthenticatedUserSession, data: { contactNumber?: string; personalEmail?: string; currentAddress?: string }) {
    if (!user.isSuperAdmin && user.studentId !== id) {
      throw new ForbiddenException('Access denied: You can only update your own contact information.');
    }

    await this.prisma.$executeRaw`
      UPDATE students 
      SET 
        contact_number = COALESCE(${data.contactNumber}, contact_number),
        personal_email = COALESCE(${data.personalEmail}, personal_email),
        current_address = COALESCE(${data.currentAddress}, current_address),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid;
    `;

    return { success: true, message: 'Contact information updated successfully.' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. FACULTY MASTER
  // ──────────────────────────────────────────────────────────────────────────

  async getFacultyList(user: AuthenticatedUserSession, query: { departmentId?: string }) {
    if (user.isSuperAdmin) {
      if (query.departmentId) {
        return this.prisma.$queryRaw`SELECT * FROM faculty WHERE department_id = ${query.departmentId}::uuid AND deleted_at IS NULL ORDER BY first_name ASC;`;
      }
      return this.prisma.$queryRaw`SELECT * FROM faculty WHERE deleted_at IS NULL ORDER BY first_name ASC;`;
    }

    if (user.roles.includes('HOD')) {
      const deptId = user.departmentId;
      return this.prisma.$queryRaw`SELECT * FROM faculty WHERE department_id = ${deptId}::uuid AND deleted_at IS NULL ORDER BY first_name ASC;`;
    }

    // Default for faculty/students/parents: active faculty list
    return this.prisma.$queryRaw`
      SELECT id, institute_id, department_id, employee_code, first_name, last_name, designation, highest_qualification, institutional_email, employment_status 
      FROM faculty WHERE deleted_at IS NULL AND employment_status = 'ACTIVE' ORDER BY first_name ASC;
    `;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. ACADEMIC MAPPINGS (Allocations & Enrollments)
  // ──────────────────────────────────────────────────────────────────────────

  async getFacultyAllocations(user: AuthenticatedUserSession, academicYearId?: string) {
    if (user.isSuperAdmin) {
      if (academicYearId) {
        return this.prisma.$queryRaw`SELECT * FROM faculty_subject_allocations WHERE academic_year_id = ${academicYearId}::uuid AND deleted_at IS NULL;`;
      }
      return this.prisma.$queryRaw`SELECT * FROM faculty_subject_allocations WHERE deleted_at IS NULL;`;
    }

    if (user.roles.includes('FACULTY')) {
      const facId = user.facultyId;
      return this.prisma.$queryRaw`SELECT * FROM faculty_subject_allocations WHERE faculty_id = ${facId}::uuid AND deleted_at IS NULL AND status = 'ACTIVE';`;
    }

    if (user.roles.includes('HOD')) {
      const deptId = user.departmentId;
      return this.prisma.$queryRaw`
        SELECT fsa.* FROM faculty_subject_allocations fsa
        JOIN subjects s ON s.id = fsa.subject_id
        JOIN programs p ON p.id = s.program_id
        WHERE p.department_id = ${deptId}::uuid AND fsa.deleted_at IS NULL;
      `;
    }

    throw new ForbiddenException('Access denied to faculty allocations.');
  }

  async getStudentEnrollments(user: AuthenticatedUserSession, studentId?: string) {
    const targetStudentId = studentId || user.studentId;

    if (!user.isSuperAdmin) {
      if (user.roles.includes('STUDENT') && user.studentId !== targetStudentId) {
        throw new ForbiddenException('Access denied: Can only view own enrollment.');
      }
      if (user.roles.includes('PARENT') && !user.linkedWardStudentIds?.includes(targetStudentId || '')) {
        throw new ForbiddenException('Access denied: Can only view linked ward enrollment.');
      }
    }

    return this.prisma.$queryRaw`
      SELECT sae.*, ay.name as academic_year_name, sem.name as semester_name, div.name as division_name 
      FROM student_academic_enrollments sae
      JOIN academic_years ay ON ay.id = sae.academic_year_id
      JOIN semesters sem ON sem.id = sae.semester_id
      JOIN divisions div ON div.id = sae.division_id
      WHERE sae.student_id = ${targetStudentId}::uuid AND sae.deleted_at IS NULL;
    `;
  }
}
