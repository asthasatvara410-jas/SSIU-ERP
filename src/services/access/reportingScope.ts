import { db } from '../db';
import { User, Faculty, Student, UserRole } from '../../types';

export interface ReportingNode {
  userId: string;
  name: string;
  role: UserRole | string;
  designation?: string;
  departmentName?: string;
  email?: string;
  phone?: string;
}

export interface ApprovalChainStep {
  stepNumber: number;
  roleName: string;
  handlerUserId?: string;
  handlerName?: string;
  isCurrent: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  actionDate?: string;
}

/**
 * Resolves the reporting authority (who the user reports to) based on canonical ERP relationships.
 */
export function getReportingAuthority(user: User | null | undefined): ReportingNode | null {
  if (!user) return null;

  const role = (user.role || '').toUpperCase();
  const allUsers = db.getUsers();
  const allFaculty = db.getFaculty();
  const allDepartments = db.getDepartments();
  const allInstitutes = db.getInstitutes();

  // 1. Student reports to their assigned Faculty Mentor
  if (role === 'STUDENT' || role === 'PARENT') {
    const student = db.getStudents().find(s => s.id === user.id || s.enrollmentNo === user.enrollmentNo);
    if (student?.mentorId) {
      const mentorFac = allFaculty.find(f => f.id === student.mentorId || f.name === student.mentorName);
      if (mentorFac) {
        return {
          userId: mentorFac.id,
          name: mentorFac.name,
          role: 'MENTOR',
          designation: mentorFac.designation || 'Faculty Mentor',
          departmentName: db.getDepartmentById(mentorFac.departmentId)?.name || 'Department',
          email: mentorFac.email
        };
      }
    }
    // Fallback: Head of Department
    const dept = student?.departmentId ? db.getDepartmentById(student.departmentId) : allDepartments[0];
    if (dept?.hodName) {
      return {
        userId: dept.hodId || 'hod-dept',
        name: dept.hodName,
        role: 'HOD',
        designation: `Head of Department (${dept.code})`,
        departmentName: dept.name
      };
    }
  }

  // 2. Faculty / Staff / Mentor reports to their Department HOD
  if (['FACULTY', 'MENTOR', 'STAFF', 'LAB_ASSISTANT'].includes(role)) {
    const dept = user.departmentId ? db.getDepartmentById(user.departmentId) : allDepartments[0];
    if (dept && dept.hodName) {
      const hodUser = allUsers.find(u => u.id === dept.hodId || u.name === dept.hodName || (u.role === 'HOD' && u.departmentId === dept.id));
      return {
        userId: hodUser?.id || dept.hodId || 'hod-1',
        name: dept.hodName,
        role: 'HOD',
        designation: `Head of Department, ${dept.name}`,
        departmentName: dept.name,
        email: hodUser?.email
      };
    }
  }

  // 3. HOD reports to Institute Principal / HOI
  if (role === 'HOD') {
    const inst = user.instituteId ? db.getInstituteById(user.instituteId) : allInstitutes[0];
    const principalUser = allUsers.find(u => ((u.role as string) === 'PRINCIPAL' || (u.role as string) === 'HOI') && (!user.instituteId || u.instituteId === user.instituteId));
    return {
      userId: principalUser?.id || 'hoi-1',
      name: principalUser?.name || inst?.principalName || 'Principal / Head of Institute',
      role: 'PRINCIPAL',
      designation: `Principal / Dean, ${inst?.name || 'SSCIT'}`,
      departmentName: inst?.name,
      email: principalUser?.email
    };
  }

  // 4. Principal / HOI / Dean reports to Vice-Chancellor / University Leadership
  if (['PRINCIPAL', 'HOI', 'DEAN', 'DIRECTOR'].includes(role)) {
    const univ = db.getUniversity();
    const vcUser = allUsers.find(u => (u.role as string) === 'VICE_CHANCELLOR' || (u.role as string) === 'REGISTRAR');
    return {
      userId: vcUser?.id || 'univ-vc',
      name: univ?.viceChancellorName || vcUser?.name || 'Dr. K. L. Shivaprasad',
      role: 'VICE_CHANCELLOR',
      designation: 'Vice-Chancellor, Swarrnim Startup & Innovation University',
      departmentName: 'Executive Directorate',
      email: vcUser?.email || 'vc@swarrnim.edu.in'
    };
  }

  // 5. Registrar / Deputy Registrar / Administrative Officers report to Chancellor / Vice-Chancellor
  if (['REGISTRAR', 'DEPUTY_REGISTRAR', 'CONTROLLER_OF_EXAMINATION', 'FINANCE_OFFICER'].includes(role)) {
    const univ = db.getUniversity();
    return {
      userId: 'univ-chancellor',
      name: univ?.chancellorName || 'Shri Risabh Jain',
      role: 'CHANCELLOR',
      designation: 'Honorable Chancellor',
      departmentName: 'Board of Governance',
      email: 'chancellor@swarrnim.edu.in'
    };
  }

  return null;
}

/**
 * Resolves all direct reports under the specified user.
 */
export function getDirectReports(user: User | null | undefined): ReportingNode[] {
  if (!user) return [];

  const role = (user.role || '').toUpperCase();
  const allUsers = db.getUsers();
  const allFaculty = db.getFaculty();
  const allDepartments = db.getDepartments();

  // 1. Principal / HOI -> Direct reports are all Department HODs & Institute Administrative Officers
  if (['PRINCIPAL', 'HOI', 'DEAN', 'DIRECTOR'].includes(role)) {
    const instDepts = allDepartments.filter(d => !user.instituteId || d.instituteId === user.instituteId);
    return instDepts.map(d => {
      const hodUser = allUsers.find(u => u.id === d.hodId || u.name === d.hodName);
      return {
        userId: hodUser?.id || d.hodId || `hod-${d.id}`,
        name: d.hodName || `HOD ${d.name}`,
        role: 'HOD',
        designation: `Head of Department (${d.code})`,
        departmentName: d.name,
        email: hodUser?.email
      };
    });
  }

  // 2. HOD -> Direct reports are all Faculty & Staff within their Department
  if (role === 'HOD') {
    const deptFaculty = allFaculty.filter(f => f.departmentId === user.departmentId && f.name !== user.name);
    return deptFaculty.map(f => {
      const facUser = allUsers.find(u => u.id === f.id || u.email === f.email);
      return {
        userId: f.id,
        name: f.name,
        role: 'FACULTY',
        designation: f.designation || 'Assistant Professor',
        departmentName: db.getDepartmentById(f.departmentId)?.name || 'Department',
        email: f.email,
        phone: f.phone
      };
    });
  }

  // 3. Mentor -> Direct reports are assigned Mentees / Students
  if (role === 'MENTOR' || (user as any).isMentor) {
    const mentees = db.getStudents().filter(s => s.mentorId === user.id || s.mentorName === user.name);
    return mentees.map(s => ({
      userId: s.id,
      name: s.name,
      role: 'STUDENT',
      designation: `Student (${s.enrollmentNo})`,
      departmentName: db.getDepartmentById(s.departmentId)?.name || 'Department',
      email: s.email,
      phone: s.phone
    }));
  }

  // 4. University Leadership -> Direct reports are Institute Principals & Deans
  if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_CHANCELLOR', 'REGISTRAR'].includes(role)) {
    const institutes = db.getInstitutes();
    return institutes.map(i => {
      const pUser = allUsers.find(u => ((u.role as string) === 'PRINCIPAL' || (u.role as string) === 'HOI') && u.instituteId === i.id);
      return {
        userId: pUser?.id || `principal-${i.id}`,
        name: pUser?.name || i.principalName || 'Principal',
        role: 'PRINCIPAL',
        designation: `Principal / HOI, ${i.name}`,
        departmentName: i.name,
        email: pUser?.email || i.email
      };
    });
  }

  return [];
}

/**
 * Dynamically generates a multi-tier approval chain based on workflow rules and reporting hierarchy.
 */
export function generateApprovalChain(
  workflowType: 'ATTENDANCE_CONDONATION' | 'STUDENT_REQUEST' | 'STAFF_LEAVE' | 'ASSET_TRANSFER' | 'ASSET_REQUISITION' | 'NOTESHEET',
  requesterUser: User
): ApprovalChainStep[] {
  const supervisor = getReportingAuthority(requesterUser);

  switch (workflowType) {
    case 'ATTENDANCE_CONDONATION':
      return [
        { stepNumber: 1, roleName: 'Course Faculty', isCurrent: false, status: 'APPROVED' },
        { stepNumber: 2, roleName: 'Faculty Mentor', isCurrent: false, status: 'APPROVED' },
        { stepNumber: 3, roleName: 'Head of Department (HOD)', isCurrent: false, status: 'APPROVED' },
        { stepNumber: 4, roleName: 'Principal / Head of Institute (HOI)', isCurrent: true, status: 'PENDING' }
      ];

    case 'ASSET_TRANSFER':
      return [
        { stepNumber: 1, roleName: 'Custodian Transfer Request', handlerName: requesterUser.name, isCurrent: false, status: 'APPROVED' },
        { stepNumber: 2, roleName: 'Head of Department Approval', handlerName: supervisor?.name, isCurrent: true, status: 'PENDING' },
        { stepNumber: 3, roleName: 'Store Inward & Custody Allocation', isCurrent: false, status: 'PENDING' }
      ];

    case 'ASSET_REQUISITION':
      return [
        { stepNumber: 1, roleName: 'Requisition Submission', handlerName: requesterUser.name, isCurrent: false, status: 'APPROVED' },
        { stepNumber: 2, roleName: 'Department HOD Endorsement', handlerName: supervisor?.name, isCurrent: true, status: 'PENDING' },
        { stepNumber: 3, roleName: 'Central Stores Fulfillment', isCurrent: false, status: 'PENDING' }
      ];

    case 'STAFF_LEAVE':
      return [
        { stepNumber: 1, roleName: 'Staff Submission', handlerName: requesterUser.name, isCurrent: false, status: 'APPROVED' },
        { stepNumber: 2, roleName: 'HOD Approval', handlerName: supervisor?.name, isCurrent: true, status: 'PENDING' },
        { stepNumber: 3, roleName: 'HR / Principal Sanction', isCurrent: false, status: 'PENDING' }
      ];

    default:
      return [
        { stepNumber: 1, roleName: 'Request Submission', handlerName: requesterUser.name, isCurrent: false, status: 'APPROVED' },
        { stepNumber: 2, roleName: 'Department Authority', handlerName: supervisor?.name, isCurrent: true, status: 'PENDING' }
      ];
  }
}
