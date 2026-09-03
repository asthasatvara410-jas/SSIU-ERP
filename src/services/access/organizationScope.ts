import { db } from '../db';
import { User, Institute, Department, Program, Semester, Division } from '../../types';

export interface UserOrganizationScope {
  isGlobalScope: boolean;
  universityId: string;
  instituteId?: string;
  institute?: Institute;
  departmentId?: string;
  department?: Department;
  programId?: string;
  program?: Program;
  semesterId?: string;
  semesterNumber?: number;
  divisionId?: string;
  divisionName?: string;
  allowedInstituteIds: string[];
  allowedDepartmentIds: string[];
  allowedProgramIds: string[];
}

/**
 * Resolves the institutional hierarchy and access boundaries for any ERP user.
 * Prevents page-level hardcoding and URL-derived guesswork.
 */
export function resolveUserOrganizationScope(user: User | null | undefined): UserOrganizationScope {
  const university = db.getUniversity();
  const universityId = university?.id || 'univ-ssiu';

  if (!user) {
    return {
      isGlobalScope: false,
      universityId,
      allowedInstituteIds: [],
      allowedDepartmentIds: [],
      allowedProgramIds: []
    };
  }

  const role = (user.role || '').toUpperCase();
  const allInstitutes = db.getInstitutes();
  const allDepartments = db.getDepartments();
  const allPrograms = db.getPrograms();

  // Tier 1: University Level Authorities (Global Scope)
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'CHANCELLOR', 'VICE_CHANCELLOR', 'REGISTRAR', 'DEPUTY_REGISTRAR', 'ERP_COORDINATOR', 'IQAC', 'EXAM_CELL'].includes(role)) {
    return {
      isGlobalScope: true,
      universityId,
      instituteId: user.instituteId,
      institute: user.instituteId ? db.getInstituteById(user.instituteId) : allInstitutes[0],
      departmentId: user.departmentId,
      department: user.departmentId ? db.getDepartmentById(user.departmentId) : undefined,
      allowedInstituteIds: allInstitutes.map(i => i.id),
      allowedDepartmentIds: allDepartments.map(d => d.id),
      allowedProgramIds: allPrograms.map(p => p.id)
    };
  }

  // Tier 2: Institute Level Authorities (Principal / HOI / Dean / Director)
  if (['PRINCIPAL', 'HOI', 'DEAN', 'DIRECTOR'].includes(role)) {
    const instId = user.instituteId || allInstitutes[0]?.id || 'inst-sit';
    const inst = db.getInstituteById(instId) || allInstitutes[0];
    const instDepts = allDepartments.filter(d => d.instituteId === instId || !d.instituteId);
    const instDeptIds = instDepts.map(d => d.id);
    const instPrograms = allPrograms.filter(p => (p.departmentId && instDeptIds.includes(p.departmentId)) || p.instituteId === instId);

    return {
      isGlobalScope: false,
      universityId,
      instituteId: instId,
      institute: inst,
      allowedInstituteIds: [instId],
      allowedDepartmentIds: instDeptIds,
      allowedProgramIds: instPrograms.map(p => p.id)
    };
  }

  // Tier 3: Department Level Authorities (Head of Department / HOD)
  if (role === 'HOD') {
    const deptId = user.departmentId || allDepartments[0]?.id || 'dept-1';
    const dept = db.getDepartmentById(deptId) || allDepartments[0];
    const instId = dept?.instituteId || user.instituteId || allInstitutes[0]?.id;
    const inst = db.getInstituteById(instId || '') || allInstitutes[0];
    const deptPrograms = allPrograms.filter(p => p.departmentId === deptId);

    return {
      isGlobalScope: false,
      universityId,
      instituteId: instId,
      institute: inst,
      departmentId: deptId,
      department: dept,
      allowedInstituteIds: instId ? [instId] : [],
      allowedDepartmentIds: [deptId],
      allowedProgramIds: deptPrograms.map(p => p.id)
    };
  }

  // Tier 4: Faculty / Mentor / Staff
  if (['FACULTY', 'MENTOR', 'STAFF', 'LAB_ASSISTANT'].includes(role)) {
    const deptId = user.departmentId || allDepartments[0]?.id;
    const dept = deptId ? db.getDepartmentById(deptId) : undefined;
    const instId = dept?.instituteId || user.instituteId || allInstitutes[0]?.id;
    const inst = instId ? db.getInstituteById(instId) : allInstitutes[0];
    const deptPrograms = deptId ? allPrograms.filter(p => p.departmentId === deptId) : [];

    return {
      isGlobalScope: false,
      universityId,
      instituteId: instId,
      institute: inst,
      departmentId: deptId,
      department: dept,
      allowedInstituteIds: instId ? [instId] : [],
      allowedDepartmentIds: deptId ? [deptId] : [],
      allowedProgramIds: deptPrograms.map(p => p.id)
    };
  }

  // Tier 5: Student / Parent (Personal Scope)
  const student = db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo || s.email === user.email);
  const deptId = student?.departmentId || user.departmentId;
  const dept = deptId ? db.getDepartmentById(deptId) : undefined;
  const instId = student?.instituteId || user.instituteId || dept?.instituteId;
  const inst = instId ? db.getInstituteById(instId) : undefined;

  return {
    isGlobalScope: false,
    universityId,
    instituteId: instId,
    institute: inst,
    departmentId: deptId,
    department: dept,
    programId: student?.programId,
    semesterId: student?.semesterId,
    semesterNumber: (student as any)?.currentSemester || (student as any)?.semesterNumber || (student?.semesterId ? Number(student.semesterId) : 1),
    divisionId: student?.divisionId,
    allowedInstituteIds: instId ? [instId] : [],
    allowedDepartmentIds: deptId ? [deptId] : [],
    allowedProgramIds: student?.programId ? [student.programId] : []
  };
}
