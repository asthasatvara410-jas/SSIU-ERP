import { db } from '../db';
import { User, Student, Faculty, FixedAsset, AttendanceApplication, StudentRequest } from '../../types';
import { resolveUserOrganizationScope } from './organizationScope';

/**
 * Filter Students based on the caller's organizational and reporting scope.
 */
export function getScopedStudents(user: User | null | undefined): Student[] {
  const allStudents = db.getStudents();
  if (!user) return [];

  const scope = resolveUserOrganizationScope(user);
  if (scope.isGlobalScope) return allStudents;

  const role = (user.role || '').toUpperCase();

  if (role === 'MENTOR') {
    return allStudents.filter(s => s.mentorId === user.id || s.mentorName === user.name);
  }

  if (role === 'STUDENT' || role === 'PARENT') {
    return allStudents.filter(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo || s.email === user.email);
  }

  if (scope.allowedDepartmentIds.length > 0) {
    return allStudents.filter(s => s.departmentId && scope.allowedDepartmentIds.includes(s.departmentId));
  }

  if (scope.allowedInstituteIds.length > 0) {
    return allStudents.filter(s => s.instituteId && scope.allowedInstituteIds.includes(s.instituteId));
  }

  return allStudents;
}

/**
 * Filter Faculty based on the caller's organizational and reporting scope.
 */
export function getScopedFaculty(user: User | null | undefined): Faculty[] {
  const allFaculty = db.getFaculty();
  if (!user) return [];

  const scope = resolveUserOrganizationScope(user);
  if (scope.isGlobalScope) return allFaculty;

  if (scope.allowedDepartmentIds.length > 0) {
    return allFaculty.filter(f => f.departmentId && scope.allowedDepartmentIds.includes(f.departmentId));
  }

  if (scope.allowedInstituteIds.length > 0) {
    return allFaculty.filter(f => f.instituteId && scope.allowedInstituteIds.includes(f.instituteId));
  }

  return allFaculty;
}

/**
 * Filter Fixed Assets based on the caller's organizational and reporting scope.
 */
export function getScopedAssets(user: User | null | undefined): FixedAsset[] {
  const allAssets = db.getFixedAssets();
  if (!user) return [];

  const scope = resolveUserOrganizationScope(user);
  if (scope.isGlobalScope) return allAssets;

  const role = (user.role || '').toUpperCase();

  // Faculty / Staff sees assets assigned to themselves
  if (role === 'FACULTY' || (role as string) === 'STAFF' || role === 'MENTOR') {
    return allAssets.filter(a => a.assignedToUserId === user.id || a.assignedToName === user.name);
  }

  // HOD sees department assets
  if (role === 'HOD' && user.departmentId) {
    return allAssets.filter(a => a.departmentId === user.departmentId);
  }

  // Principal sees institute assets
  if (['PRINCIPAL', 'HOI', 'DEAN'].includes(role) && user.instituteId) {
    return allAssets.filter(a => a.instituteId === user.instituteId || !a.instituteId);
  }

  return allAssets;
}

/**
 * Filter Attendance Applications based on the caller's organizational and reporting scope.
 */
export function getScopedAttendanceApplications(user: User | null | undefined): AttendanceApplication[] {
  const allApps = db.getAttendanceApplications();
  if (!user) return [];

  const scope = resolveUserOrganizationScope(user);
  if (scope.isGlobalScope) return allApps;

  const role = (user.role || '').toUpperCase();

  if (role === 'STUDENT') {
    return allApps.filter(a => a.studentId === user.id || a.enrollmentNo === user.enrollmentNo);
  }

  if (role === 'FACULTY') {
    return allApps.filter(a => a.subjectFacultyId === user.id || a.subjectFacultyName === user.name || (a as any).facultyId === user.id);
  }

  if (role === 'MENTOR') {
    return allApps.filter(a => a.mentorFacultyId === user.id || a.mentorFacultyName === user.name);
  }

  if (role === 'HOD') {
    return allApps.filter(a => a.departmentId === user.departmentId);
  }

  if (['PRINCIPAL', 'HOI', 'DEAN'].includes(role)) {
    return allApps.filter(a => a.instituteId === user.instituteId || !a.instituteId);
  }

  return allApps;
}

/**
 * Filter Student Service Requests based on caller's scope.
 */
export function getScopedStudentRequests(user: User | null | undefined): StudentRequest[] {
  const allRequests = db.getState().studentRequests || [];
  if (!user) return [];

  const scope = resolveUserOrganizationScope(user);
  if (scope.isGlobalScope) return allRequests;

  const role = (user.role || '').toUpperCase();

  if (role === 'STUDENT') {
    return allRequests.filter(r => r.studentId === user.id || r.enrollmentNo === user.enrollmentNo);
  }

  if (role === 'HOD') {
    return allRequests.filter(r => r.departmentId === user.departmentId || !r.departmentId);
  }

  if (['PRINCIPAL', 'HOI', 'DEAN'].includes(role)) {
    return allRequests.filter(r => r.instituteId === user.instituteId || !r.instituteId);
  }

  return allRequests;
}
