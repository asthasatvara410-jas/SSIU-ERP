import { db } from './db';
import { 
  User, UserRole, Employee, Faculty, Institute, Department, Program, Subject,
  AuditLog
} from '../types';
import { departmentScopeService } from './departmentScopeService';
import { inventoryManagementService } from './inventoryManagementService';
import { mentorAssignmentService } from './mentorAssignmentService';
import { canAccess, ERPModule, ERPAction } from './authorizationService';
import { auditLogService } from './auditLogService';

export interface HierarchyNode {
  id: string;
  title: string;
  name: string;
  designation: string;
  role: UserRole | string;
  departmentName?: string;
  instituteName?: string;
  isCurrentUser: boolean;
  avatar?: string;
  email?: string;
  phone?: string;
  level: number;
}

export interface DirectReportEmployee {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  departmentName: string;
  role: string;
  email: string;
  phone: string;
  status: string;
  avatar?: string;
  workloadHours?: number;
  assignedSubjectsCount?: number;
}

export interface ModulePermissionItem {
  moduleKey: string;
  moduleLabel: string;
  category: 'ACADEMIC' | 'ADMINISTRATION' | 'GOVERNANCE' | 'STUDENT_SERVICES' | 'CAMPUS_OPERATIONS';
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canExport: boolean;
  canAllocate: boolean;
}

export interface ResponsibilityScopeKPIs {
  totalSupervisedFaculty: number;
  totalSupervisedStudents: number;
  totalAssignedPrograms: number;
  totalAssignedSubjects: number;
  weeklyTeachingHours: number;
  theoryTeachingHours: number;
  labTeachingHours: number;
  activeMenteesCount: number;
  departmentAssetsCount: number;
  pendingApprovalsCount: number;
  attendanceComplianceRate: number;
  directReportsCount: number;
}

export interface StaffNormalizedProfile {
  // Core Identity
  userId: string;
  employeeId: string;
  username: string;
  name: string;
  preferredName: string;
  designation: string;
  role: UserRole;
  roleDisplayName: string;
  roleCategory: 'EXECUTIVE_LEADERSHIP' | 'INSTITUTIONAL_LEADERSHIP' | 'DEPARTMENT_HEAD' | 'ACADEMIC_FACULTY' | 'ADMINISTRATIVE_OFFICER' | 'CAMPUS_SUPPORT';
  avatar: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'LOCKED';
  employmentStatus: string;
  employmentType: string;
  
  // Organization Scope
  universityName: string;
  instituteId: string;
  instituteName: string;
  instituteCode: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  academicYear: string;

  // Personal Info
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  officialEmail: string;
  personalEmail: string;
  phone: string;
  alternatePhone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;

  // Professional Details
  joiningDate: string;
  confirmationDate: string;
  qualification: string;
  highestDegree: string;
  specialization: string;
  experienceYears: number;
  officeLocation: string;
  officeExtension: string;
  
  // Reporting Authority
  reportsTo: {
    name: string;
    designation: string;
    role: string;
    departmentName: string;
    instituteName: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  roleAbove: string;
  supervisoryScope: string;

  // Organizational Hierarchy (Up and Down)
  hierarchyChain: HierarchyNode[];

  // Direct Reports
  directReports: DirectReportEmployee[];

  // Responsibilities
  statutoryResponsibilities: string[];
  operationalResponsibilities: string[];

  // Assigned Workload & Academic Portfolio (for Faculty & HOD)
  assignedSubjects: {
    id: string;
    code: string;
    name: string;
    type: string;
    semesterNumber: number;
    credits: number;
    hoursPerWeek: number;
    enrolledStudents: number;
  }[];

  // RBAC Permissions
  permissionLevel: string;
  modulePermissions: ModulePermissionItem[];

  // Scope KPIs
  scopeKPIs: ResponsibilityScopeKPIs;

  // Security Info
  lastLoginAt: string;
  lastLoginIp: string;
  accountCreatedAt: string;
  twoFactorEnabled: boolean;
  activeSessionStatus: string;
}

export class StaffProfileService {
  private static instance: StaffProfileService;

  private constructor() {}

  public static getInstance(): StaffProfileService {
    if (!StaffProfileService.instance) {
      StaffProfileService.instance = new StaffProfileService();
    }
    return StaffProfileService.instance;
  }

  /**
   * Builds a normalized, comprehensive institutional staff profile for any non-student user.
   */
  public getStaffProfile(user: User, activeRole?: UserRole): StaffNormalizedProfile {
    const effectiveRole = (activeRole || user.role || 'FACULTY').toUpperCase() as UserRole;
    
    // 1. Resolve Linked Database Entities
    const employees = db.getEmployees();
    const facultyList = db.getFaculty();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const subjects = db.getSubjects();
    const students = db.getStudents();
    const univ = db.getUniversity();

    // Match Employee record
    const emp = employees.find(e => 
      e.id === user.id ||
      e.employeeId === user.employeeId ||
      e.email.toLowerCase() === user.email.toLowerCase() ||
      (user.username && e.employeeId.toLowerCase().includes(user.username.toLowerCase())) ||
      (user.name && e.name.toLowerCase() === user.name.toLowerCase())
    );

    // Match Faculty record
    const fac = facultyList.find(f => 
      f.id === user.id ||
      f.employeeId === user.employeeId ||
      (emp && f.employeeId === emp.employeeId) ||
      f.email.toLowerCase() === user.email.toLowerCase() ||
      (user.name && f.name.toLowerCase() === user.name.toLowerCase())
    );

    // Resolve Institute & Department
    const instId = user.instituteId || emp?.instituteId || fac?.instituteId || 'inst-1';
    const deptId = user.departmentId || emp?.departmentId || fac?.departmentId || 'dept-1';

    const institute = institutes.find(i => i.id === instId) || institutes[0] || {
      id: 'inst-1',
      code: 'SSCIT',
      name: 'Swarrnim School of Computing & IT'
    };

    const department = departments.find(d => d.id === deptId) || departments[0] || {
      id: 'dept-1',
      code: 'CE',
      name: 'Computer Engineering',
      instituteId: instId
    };

    // 2. Determine Role Display Name & Category
    const { roleDisplayName, roleCategory } = this.resolveRoleCategory(effectiveRole);

    // 3. Resolve Personal & Professional Info
    const gender = emp?.gender || (user.name.includes('Dr.') ? 'Male' : 'Male');
    const bloodGroup = emp?.bloodGroup || fac?.bloodGroup || 'B+';
    const dob = emp?.dob || fac?.dateOfBirth || '1985-06-15';
    const officialEmail = user.email || emp?.email || fac?.email || `${user.username || 'staff'}@swarrnim.edu.in`;
    const phone = user.phone || emp?.phone || fac?.phone || '+91 98250 10001';
    const alternatePhone = emp?.alternatePhone || '+91 98250 99881';
    const address = emp?.address || fac?.address || 'Faculty Quarters, Swarrnim Campus, Bhoyan Rathod, Gandhinagar';
    const city = emp?.city || 'Gandhinagar';
    const state = emp?.state || 'Gujarat';
    const country = 'India';
    const pincode = emp?.pincode || '382420';

    const emergencyContactName = emp?.emergencyContactName || 'Family Member / Spouse';
    const emergencyContactPhone = emp?.emergencyContactPhone || '+91 98250 99999';
    const emergencyContactRelation = emp?.emergencyContactRelation || 'Spouse';

    const employeeId = user.employeeId || emp?.employeeId || fac?.employeeId || (
      effectiveRole === 'HOD' ? 'EMP-HOD-001' : 
      effectiveRole === 'FACULTY' ? 'EMP-FAC-001' : 
      effectiveRole === 'PRINCIPAL' ? 'EMP-HOI-001' : 
      effectiveRole === 'REGISTRAR' ? 'EMP-REG-001' :
      `EMP-${effectiveRole.slice(0, 3)}-${user.id.slice(-4)}`
    );

    const joiningDate = emp?.joiningDate || fac?.joiningDate || '2019-07-01';
    const confirmationDate = emp?.confirmationDate || '2020-07-01';
    const qualification = emp?.qualification || fac?.qualification || (
      ['HOD', 'PRINCIPAL', 'DEAN', 'PROVOST', 'PRESIDENT'].includes(effectiveRole) ? 'Ph.D. in Computer Engineering & Research' :
      effectiveRole === 'FACULTY' ? 'M.Tech, Ph.D. (Pursuing) in Computer Science' :
      'Master of Business Administration (Higher Education Administration)'
    );
    const highestDegree = emp?.highestDegree || (qualification.includes('Ph.D') ? 'Doctorate (Ph.D.)' : 'Master of Technology (M.Tech)');
    const specialization = emp?.specialization || fac?.specialization || (
      effectiveRole === 'HOD' ? 'Advanced Computer Architectures, Distributed Systems & Academic Governance' :
      effectiveRole === 'FACULTY' ? 'Database Management, Cloud Computing & AI Systems' :
      'Institutional Administration, Higher Education Governance & University Operations'
    );
    const experienceYears = emp?.experienceYears || fac?.experienceYears || (
      ['PRESIDENT', 'PROVOST', 'PRINCIPAL', 'REGISTRAR'].includes(effectiveRole) ? 18 :
      effectiveRole === 'HOD' ? 14 :
      effectiveRole === 'FACULTY' ? 8 : 10
    );

    const officeLocation = (
      effectiveRole === 'HOD' ? `Room 302, HOD Office, 3rd Floor, ${institute.code} Block` :
      effectiveRole === 'PRINCIPAL' ? `Dean Secretariat, Ground Floor, Central Administrative Wing` :
      effectiveRole === 'REGISTRAR' ? `Registrar Chamber, 1st Floor, University Corporate Tower` :
      effectiveRole === 'FACULTY' ? `Cabin F-14, Faculty Bay 2, ${department.name} Department` :
      `Administrative Block, Section Desk 4`
    );
    const officeExtension = (
      effectiveRole === 'HOD' ? 'Ext: 3401' :
      effectiveRole === 'PRINCIPAL' ? 'Ext: 1001' :
      effectiveRole === 'REGISTRAR' ? 'Ext: 1002' :
      effectiveRole === 'FACULTY' ? 'Ext: 3414' :
      'Ext: 2010'
    );

    // 4. Resolve Reporting Authority & Organizational Hierarchy
    const { reportsTo, roleAbove, supervisoryScope, hierarchyChain } = this.resolveReportingHierarchy(
      effectiveRole, user, institute, department, univ?.name || 'Swarrnim Startup & Innovation University'
    );

    // 5. Resolve Direct Reports
    const directReports = this.resolveDirectReports(user, effectiveRole, institute, department, employees, facultyList);

    // 6. Resolve Statutory & Operational Responsibilities
    const { statutoryResponsibilities, operationalResponsibilities } = this.resolveResponsibilities(effectiveRole, department, institute);

    // 7. Resolve Assigned Subjects & Teaching Workload (for Faculty & HOD)
    const assignedSubjects = this.resolveAssignedSubjects(user, fac, department, subjects, students);

    // 8. Resolve Live Responsibility Scope KPIs
    const scopeKPIs = this.resolveScopeKPIs(
      user, effectiveRole, department, institute, directReports, assignedSubjects, students, facultyList
    );

    // 9. Resolve RBAC Permissions Matrix
    const { permissionLevel, modulePermissions } = this.resolvePermissionsMatrix(user, effectiveRole);

    return {
      userId: user.id,
      employeeId,
      username: user.username || user.email.split('@')[0],
      name: user.name,
      preferredName: user.name.replace(/^(Dr\.|Prof\.|Mr\.|Ms\.|Mrs\.)\s*/i, ''),
      designation: user.designation || emp?.designation || fac?.designation || this.getDefaultDesignation(effectiveRole),
      role: effectiveRole,
      roleDisplayName,
      roleCategory,
      avatar: user.avatar || emp?.photo || fac?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0B192C&color=FFFFFF&bold=true`,
      status: (user.status || 'ACTIVE') as any,
      employmentStatus: emp?.employmentStatus || 'Active / Regular Full-Time',
      employmentType: emp?.employmentType || 'Permanent University Service',

      universityName: univ?.name || 'Swarrnim Startup & Innovation University',
      instituteId: institute.id,
      instituteName: institute.name,
      instituteCode: institute.code || 'SSCIT',
      departmentId: department.id,
      departmentName: department.name,
      departmentCode: department.code || 'CE',
      academicYear: '2026-2027 (Current Term)',

      gender,
      dateOfBirth: dob,
      bloodGroup,
      officialEmail,
      personalEmail: `${user.username || 'staff'}.personal@gmail.com`,
      phone,
      alternatePhone,
      address,
      city,
      state,
      country,
      pincode,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelation,

      joiningDate,
      confirmationDate,
      qualification,
      highestDegree,
      specialization,
      experienceYears,
      officeLocation,
      officeExtension,

      reportsTo,
      roleAbove,
      supervisoryScope,
      hierarchyChain,
      directReports,

      statutoryResponsibilities,
      operationalResponsibilities,
      assignedSubjects,

      permissionLevel,
      modulePermissions,
      scopeKPIs,

      lastLoginAt: user.lastLoginAt || new Date().toISOString(),
      lastLoginIp: user.lastLoginIp || '10.14.176.61 (Institutional Intranet / Campus WiFi)',
      accountCreatedAt: user.createdAt || '2024-01-01T00:00:00Z',
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
      activeSessionStatus: 'Active Authenticated Session • Secure Token Verified'
    };
  }

  /**
   * Updates permitted personal and contact details in database and logs audit trail.
   */
  public updateStaffPersonalDetails(
    user: User,
    updates: {
      phone?: string;
      alternatePhone?: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      bloodGroup?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      emergencyContactRelation?: string;
      specialization?: string;
      avatar?: string;
    }
  ): User | null {
    const existingUsers = db.getUsers();
    const currentUser = existingUsers.find(u => u.id === user.id);
    if (!currentUser) return null;

    // Filter out restricted fields to prevent unauthorized mutations
    const cleanUserUpdates: Partial<User> = {
      phone: updates.phone !== undefined ? updates.phone : currentUser.phone,
      avatar: updates.avatar !== undefined ? updates.avatar : currentUser.avatar,
      updatedAt: new Date().toISOString()
    };

    const updatedUser = db.updateEntity<User>('users', currentUser.id, cleanUserUpdates, `Updated personal profile by ${user.name}`);

    // Update corresponding employee record if exists
    const employees = db.getEmployees();
    const emp = employees.find(e => e.id === user.id || e.email.toLowerCase() === user.email.toLowerCase() || e.employeeId === user.employeeId);
    if (emp) {
      db.updateEntity<Employee>('employees', emp.id, {
        phone: updates.phone || emp.phone,
        alternatePhone: updates.alternatePhone || emp.alternatePhone,
        address: updates.address || emp.address,
        city: updates.city || emp.city,
        state: updates.state || emp.state,
        pincode: updates.pincode || emp.pincode,
        bloodGroup: updates.bloodGroup || emp.bloodGroup,
        emergencyContactName: updates.emergencyContactName || emp.emergencyContactName,
        emergencyContactPhone: updates.emergencyContactPhone || emp.emergencyContactPhone,
        emergencyContactRelation: updates.emergencyContactRelation || emp.emergencyContactRelation,
        specialization: updates.specialization || emp.specialization
      }, `HRMS sync from profile update by ${user.name}`);
    }

    // Update corresponding faculty record if exists
    const facultyList = db.getFaculty();
    const fac = facultyList.find(f => f.id === user.id || f.email.toLowerCase() === user.email.toLowerCase());
    if (fac) {
      db.updateEntity<Faculty>('faculty', fac.id, {
        phone: updates.phone || fac.phone,
        address: updates.address || fac.address,
        bloodGroup: updates.bloodGroup || fac.bloodGroup,
        specialization: updates.specialization || fac.specialization,
        photo: updates.avatar || fac.photo
      }, `Faculty directory sync from profile update by ${user.name}`);
    }

    // Audit Logging
    auditLogService.log({
      action: 'STAFF_PROFILE_UPDATED',
      module: 'PROFILE_GOVERNANCE',
      recordId: user.id,
      entity: 'USER_PROFILE',
      details: `User ${user.name} (${user.role}) updated personal and contact details.`,
      user,
      severity: 'INFO',
      status: 'SUCCESS'
    });

    return updatedUser || currentUser;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // INTERNAL RESOLVERS & COMPUTATIONS
  // ─────────────────────────────────────────────────────────────────────────────

  private resolveRoleCategory(role: UserRole): { roleDisplayName: string; roleCategory: StaffNormalizedProfile['roleCategory'] } {
    switch (role) {
      case 'SUPER_ADMIN':
        return { roleDisplayName: 'Super Administrator & System Controller', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'PRESIDENT':
        return { roleDisplayName: 'Chancellor / President', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'VICE_PRESIDENT':
        return { roleDisplayName: 'Vice President, SSIU', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'PROVOST':
        return { roleDisplayName: 'Provost / Vice Chancellor', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'UNIVERSITY_ADMIN':
        return { roleDisplayName: 'University Executive Administrator', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'REGISTRAR':
        return { roleDisplayName: 'University Registrar', roleCategory: 'EXECUTIVE_LEADERSHIP' };
      case 'DEPUTY_REGISTRAR':
        return { roleDisplayName: 'Deputy Registrar (Administration)', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'PRINCIPAL':
        return { roleDisplayName: 'Principal & Dean of Faculty', roleCategory: 'INSTITUTIONAL_LEADERSHIP' };
      case 'HOD':
        return { roleDisplayName: 'Head of Department (HOD)', roleCategory: 'DEPARTMENT_HEAD' };
      case 'FACULTY':
        return { roleDisplayName: 'Academic Faculty & Professor', roleCategory: 'ACADEMIC_FACULTY' };
      case 'MENTOR':
        return { roleDisplayName: 'Faculty Mentor & Counselor', roleCategory: 'ACADEMIC_FACULTY' };
      case 'EXAM_CELL':
        return { roleDisplayName: 'Controller of Examinations', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'STUDENT_ADMIN':
        return { roleDisplayName: 'Student Onboarding & Admin Officer', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'STUDENT_SECTION':
        return { roleDisplayName: 'Student Affairs Section Officer', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'ACCOUNTS_ADMIN':
        return { roleDisplayName: 'Chief Accounts & Finance Officer', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'HR_ADMIN':
      case 'HR_OFFICER':
        return { roleDisplayName: 'Human Resource Management Head', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'LIBRARY_ADMIN':
        return { roleDisplayName: 'Chief University Librarian', roleCategory: 'CAMPUS_SUPPORT' };
      case 'HOSTEL_ADMIN':
        return { roleDisplayName: 'Chief Hostel Warden', roleCategory: 'CAMPUS_SUPPORT' };
      case 'TRANSPORT_ADMIN':
        return { roleDisplayName: 'Fleet & Transport Manager', roleCategory: 'CAMPUS_SUPPORT' };
      case 'MAINTENANCE_ADMIN':
        return { roleDisplayName: 'Campus Estate & Infrastructure Officer', roleCategory: 'CAMPUS_SUPPORT' };
      case 'IQAC':
        return { roleDisplayName: 'Director, IQAC Accreditation Cell', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      case 'ERP_COORDINATOR':
        return { roleDisplayName: 'Central University ERP Coordinator', roleCategory: 'ADMINISTRATIVE_OFFICER' };
      default:
        return { roleDisplayName: String(role).replace(/_/g, ' '), roleCategory: 'ADMINISTRATIVE_OFFICER' };
    }
  }

  private getDefaultDesignation(role: UserRole): string {
    switch (role) {
      case 'HOD': return 'Professor & Head of Department';
      case 'FACULTY': return 'Associate Professor & Mentor';
      case 'PRINCIPAL': return 'Principal & Dean of Computing';
      case 'REGISTRAR': return 'Registrar, Swarrnim University';
      case 'DEPUTY_REGISTRAR': return 'Deputy Registrar, Administration';
      case 'EXAM_CELL': return 'Controller of Examinations';
      case 'STUDENT_SECTION': return 'Head, Student Affairs Section';
      case 'ACCOUNTS_ADMIN': return 'Chief Finance Officer (CFO)';
      case 'HR_ADMIN': return 'Director of Human Resources';
      case 'HOSTEL_ADMIN': return 'Chief Warden, University Hostels';
      case 'LIBRARY_ADMIN': return 'Head Librarian';
      case 'TRANSPORT_ADMIN': return 'Transport Fleet Manager';
      case 'MAINTENANCE_ADMIN': return 'Campus Estate Engineer';
      case 'IQAC': return 'Director, IQAC Cell';
      case 'SUPER_ADMIN': return 'Enterprise System Administrator';
      case 'VICE_PRESIDENT': return 'Vice President, SSIU';
      case 'PRESIDENT': return 'President & Chancellor';
      default: return 'University Officer';
    }
  }

  private resolveReportingHierarchy(
    role: UserRole,
    user: User,
    institute: Institute,
    department: Department,
    univName: string
  ): {
    reportsTo: StaffNormalizedProfile['reportsTo'];
    roleAbove: string;
    supervisoryScope: string;
    hierarchyChain: HierarchyNode[];
  } {
    const allUsers = db.getUsers();

    // Find actual role holders from ERP database
    const leadershipUser = allUsers.find(u => u.role === 'VICE_PRESIDENT' || u.role === 'PRESIDENT' || u.role === 'UNIVERSITY_ADMIN');
    const registrarUser = allUsers.find(u => u.role === 'REGISTRAR');
    const principalUser = allUsers.find(u => (u.role === 'PRINCIPAL' || (u.role as string) === 'HOI' || (u.role as string) === 'DEAN') && (!user.instituteId || u.instituteId === user.instituteId)) || allUsers.find(u => u.role === 'PRINCIPAL');
    const hodUser = allUsers.find(u => u.role === 'HOD' && (!user.departmentId || u.departmentId === user.departmentId)) || allUsers.find(u => u.role === 'HOD');

    const hierarchyChain: HierarchyNode[] = [
      {
        id: 'node-leadership',
        title: 'University Executive Leadership',
        name: leadershipUser?.name || 'University Leadership',
        designation: leadershipUser?.designation || 'Vice President & Governing Body',
        role: leadershipUser?.role || 'VICE_PRESIDENT',
        instituteName: univName,
        isCurrentUser: ['SUPER_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'UNIVERSITY_ADMIN'].includes(role),
        level: 1,
        email: leadershipUser?.email,
        phone: leadershipUser?.phone
      },
      {
        id: 'node-registrar',
        title: 'Central University Administration',
        name: registrarUser?.name || 'Office of the Registrar',
        designation: registrarUser?.designation || 'Registrar, Swarrnim University',
        role: 'REGISTRAR',
        instituteName: univName,
        isCurrentUser: role === 'REGISTRAR',
        level: 2,
        email: registrarUser?.email,
        phone: registrarUser?.phone
      },
      {
        id: 'node-dean',
        title: 'Constituent School / Institute Leadership',
        name: principalUser?.name || 'Principal & Institutional Dean',
        designation: principalUser?.designation || `Principal & Dean, ${institute.name}`,
        role: 'PRINCIPAL',
        instituteName: institute.name,
        isCurrentUser: role === 'PRINCIPAL',
        level: 3,
        email: principalUser?.email,
        phone: principalUser?.phone
      },
      {
        id: 'node-hod',
        title: 'Department Academic Leadership',
        name: (role === 'HOD' ? user.name : (hodUser?.name || department.hodName || 'Head of Department')),
        designation: (role === 'HOD' ? (user.designation || `HOD, ${department.name}`) : (hodUser?.designation || `Head, ${department.name}`)),
        role: 'HOD',
        departmentName: department.name,
        instituteName: institute.name,
        isCurrentUser: role === 'HOD',
        level: 4,
        email: hodUser?.email,
        phone: hodUser?.phone
      },
      {
        id: 'node-faculty',
        title: 'Academic Faculty & Instructors',
        name: (role === 'FACULTY' || role === 'MENTOR' ? user.name : `${department.name} Faculty Team`),
        designation: (role === 'FACULTY' || role === 'MENTOR' ? (user.designation || 'Associate Professor') : 'Teaching Faculty & Research Staff'),
        role: 'FACULTY',
        departmentName: department.name,
        instituteName: institute.name,
        isCurrentUser: role === 'FACULTY' || role === 'MENTOR',
        level: 5,
        email: (role === 'FACULTY' || role === 'MENTOR') ? user.email : undefined,
        phone: (role === 'FACULTY' || role === 'MENTOR') ? user.phone : undefined
      },
      {
        id: 'node-students',
        title: 'Enrolled Students & Mentees',
        name: `${department.name} Students`,
        designation: 'Enrolled Undergraduates & Postgraduates',
        role: 'STUDENT',
        departmentName: department.name,
        instituteName: institute.name,
        isCurrentUser: false,
        level: 6
      }
    ];

    let reportsTo: StaffNormalizedProfile['reportsTo'];
    let roleAbove: string;
    let supervisoryScope: string;

    // 1. Direct explicit link if user.reportingToUserId exists
    if (user.reportingToUserId) {
      const explicitSuperior = allUsers.find(u => u.id === user.reportingToUserId);
      if (explicitSuperior) {
        reportsTo = {
          name: explicitSuperior.name,
          designation: explicitSuperior.designation || 'Reporting Authority',
          role: explicitSuperior.role,
          departmentName: explicitSuperior.departmentName || department.name,
          instituteName: institute.name,
          email: explicitSuperior.email,
          phone: explicitSuperior.phone || '+91 98250 00000',
          avatar: explicitSuperior.avatar
        };
        roleAbove = `${explicitSuperior.role} (${explicitSuperior.designation || 'Supervisor'})`;
        supervisoryScope = `Direct institutional reporting under ${explicitSuperior.name}.`;
        return { reportsTo, roleAbove, supervisoryScope, hierarchyChain };
      }
    }

    // 2. Role-based institutional hierarchy
    if (role === 'FACULTY' || role === 'MENTOR' || (role as string) === 'LAB_ASSISTANT' || (role as string) === 'STAFF') {
      const superior = hodUser || principalUser;
      reportsTo = {
        name: superior?.name || department.hodName || 'Head of Department',
        designation: superior?.designation || `Head, ${department.name}`,
        role: superior?.role || 'HOD',
        departmentName: department.name,
        instituteName: institute.name,
        email: superior?.email || 'hod@swarrnim.edu.in',
        phone: superior?.phone || '+91 98250 10004',
        avatar: superior?.avatar
      };
      roleAbove = 'Head of Department (HOD)';
      supervisoryScope = `Curriculum teaching, session plans, laboratory instruction, student mentorship in ${department.name}.`;
    } else if (role === 'HOD') {
      const superior = principalUser || leadershipUser;
      reportsTo = {
        name: superior?.name || 'Principal & Institutional Dean',
        designation: superior?.designation || `Principal & Dean, ${institute.name}`,
        role: superior?.role || 'PRINCIPAL',
        departmentName: 'Dean Secretariat',
        instituteName: institute.name,
        email: superior?.email || 'dean@swarrnim.edu.in',
        phone: superior?.phone || '+91 98250 00008',
        avatar: superior?.avatar
      };
      roleAbove = 'Principal / Institutional Dean';
      supervisoryScope = `Complete departmental administration, faculty members, degree programs, subject allocations, and student compliance in ${department.name}.`;
    } else if (role === 'PRINCIPAL' || (role as string) === 'HOI' || (role as string) === 'DEAN') {
      const superior = registrarUser || leadershipUser;
      reportsTo = {
        name: superior?.name || 'University Registrar',
        designation: superior?.designation || 'Registrar, Swarrnim University',
        role: superior?.role || 'REGISTRAR',
        departmentName: 'Central Registrar Secretariat',
        instituteName: univName,
        email: superior?.email || 'registrar@swarrnim.edu.in',
        phone: superior?.phone || '+91 98250 00003',
        avatar: superior?.avatar
      };
      roleAbove = 'University Registrar & Executive Leadership';
      supervisoryScope = `Institutional academic and administrative governance across all departments of ${institute.name}.`;
    } else if (['REGISTRAR', 'DEPUTY_REGISTRAR', 'EXAM_CELL', 'STUDENT_SECTION', 'STUDENT_ADMIN', 'ACCOUNTS_ADMIN', 'HR_ADMIN', 'IQAC', 'ERP_COORDINATOR'].includes(role)) {
      const superior = leadershipUser;
      reportsTo = {
        name: superior?.name || 'Vice President, SSIU',
        designation: superior?.designation || 'Vice President, Swarrnim Startup & Innovation University',
        role: superior?.role || 'VICE_PRESIDENT',
        departmentName: 'Board of Governance',
        instituteName: univName,
        email: superior?.email || 'vp@swarrnim.edu.in',
        phone: superior?.phone || '+91 00000 00099',
        avatar: superior?.avatar
      };
      roleAbove = 'Chancellor / Vice President / Governing Body';
      supervisoryScope = `University-wide administrative and regulatory operations across all constituent colleges and campuses.`;
    } else {
      reportsTo = {
        name: 'Governing Body of Swarrnim University',
        designation: 'Board of Management & Trustees',
        role: 'MANAGEMENT',
        departmentName: 'Central Governance',
        instituteName: univName,
        email: 'governance@swarrnim.edu.in',
        phone: '+91 98250 00000'
      };
      roleAbove = 'University Board of Trustees';
      supervisoryScope = `Global system management, institutional compliance, security policies, and ERP governance.`;
    }

    return { reportsTo, roleAbove, supervisoryScope, hierarchyChain };
  }

  private resolveDirectReports(
    user: User,
    role: UserRole,
    institute: Institute,
    department: Department,
    employees: Employee[],
    facultyList: Faculty[]
  ): DirectReportEmployee[] {
    const list: DirectReportEmployee[] = [];
    const allUsers = db.getUsers();

    // 1. Explicit direct reports (users reporting to currentUser.id)
    const explicitReports = allUsers.filter(u => u.reportingToUserId === user.id);
    explicitReports.forEach(u => {
      list.push({
        id: u.id,
        employeeId: u.employeeId || `EMP-${u.id}`,
        name: u.name,
        designation: u.designation || u.role,
        departmentName: u.departmentName || department.name,
        role: u.role,
        email: u.email,
        phone: u.phone || '',
        status: u.status || 'ACTIVE',
        avatar: u.avatar
      });
    });

    // 2. Organizational role-based reports
    if (role === 'HOD') {
      // HOD direct reports: Faculty members of the department from real users and faculty table
      const deptFacultyUsers = allUsers.filter(u => u.id !== user.id && u.departmentId === department.id && (u.role === 'FACULTY' || u.role === 'MENTOR' || (u.role as string) === 'LAB_ASSISTANT' || (u.role as string) === 'STAFF'));
      deptFacultyUsers.forEach(u => {
        if (!list.some(item => item.id === u.id)) {
          const matchingFac = facultyList.find(f => f.id === u.id || f.email.toLowerCase() === u.email.toLowerCase());
          list.push({
            id: u.id,
            employeeId: u.employeeId || matchingFac?.employeeId || `FAC-${u.id.slice(-3)}`,
            name: u.name,
            designation: u.designation || matchingFac?.designation || 'Assistant Professor',
            departmentName: department.name,
            role: u.role,
            email: u.email,
            phone: u.phone || matchingFac?.phone || '',
            status: u.status || 'ACTIVE',
            avatar: u.avatar || matchingFac?.photo,
            workloadHours: 14 + ((matchingFac?.subjectIds?.length || 2) * 2),
            assignedSubjectsCount: matchingFac?.subjectIds?.length || 2
          });
        }
      });

      // Also include any faculty records in db.getFaculty() not yet listed
      const deptFaculty = facultyList.filter(f => f.departmentId === department.id);
      deptFaculty.forEach(f => {
        if (!list.some(item => item.id === f.id || item.email.toLowerCase() === f.email.toLowerCase())) {
          list.push({
            id: f.id,
            employeeId: f.employeeId,
            name: f.name,
            designation: f.designation,
            departmentName: department.name,
            role: 'FACULTY',
            email: f.email,
            phone: f.phone,
            status: f.status,
            avatar: f.photo,
            workloadHours: 14 + (f.subjectIds.length * 2),
            assignedSubjectsCount: f.subjectIds.length
          });
        }
      });
    } else if (role === 'PRINCIPAL' || (role as string) === 'HOI' || (role as string) === 'DEAN') {
      // Principal direct reports: HODs and departmental leads of the institute
      const instHeads = allUsers.filter(u => u.id !== user.id && (!u.instituteId || u.instituteId === institute.id) && (u.role === 'HOD' || u.role === 'EXAM_CELL' || u.role === 'STUDENT_SECTION' || u.role === 'FACULTY'));
      instHeads.forEach(u => {
        if (!list.some(item => item.id === u.id)) {
          list.push({
            id: u.id,
            employeeId: u.employeeId || `EMP-${u.role.slice(0, 3)}-${u.id.slice(-3)}`,
            name: u.name,
            designation: u.designation || u.role,
            departmentName: u.departmentName || (u.departmentId === 'dept-1' ? 'Computer Engineering' : 'Department Head'),
            role: u.role,
            email: u.email,
            phone: u.phone || '',
            status: u.status || 'ACTIVE',
            avatar: u.avatar
          });
        }
      });
    } else if (role === 'REGISTRAR') {
      // Registrar direct reports: Administrative Section Heads
      const adminHeads = allUsers.filter(u => u.id !== user.id && (u.role === 'DEPUTY_REGISTRAR' || u.role === 'STUDENT_SECTION' || u.role === 'STUDENT_ADMIN' || u.role === 'HOSTEL_ADMIN' || u.role === 'EXAM_CELL' || u.role === 'PRINCIPAL'));
      adminHeads.forEach(u => {
        if (!list.some(item => item.id === u.id)) {
          list.push({
            id: u.id,
            employeeId: u.employeeId || `EMP-ADM-${u.id.slice(-3)}`,
            name: u.name,
            designation: u.designation || u.role,
            departmentName: u.departmentName || 'Central Administration',
            role: u.role,
            email: u.email,
            phone: u.phone || '',
            status: u.status || 'ACTIVE',
            avatar: u.avatar
          });
        }
      });
    } else if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'VICE_PRESIDENT', 'PRESIDENT'].includes(role)) {
      const leadershipReports = allUsers.filter(u => u.id !== user.id && (u.role === 'PRINCIPAL' || u.role === 'REGISTRAR' || u.role === 'IQAC' || u.role === 'EXAM_CELL' || u.role === 'HOD'));
      leadershipReports.forEach(u => {
        if (!list.some(item => item.id === u.id)) {
          list.push({
            id: u.id,
            employeeId: u.employeeId || `EMP-EXEC-${u.id.slice(-3)}`,
            name: u.name,
            designation: u.designation || u.role,
            departmentName: u.departmentName || 'Institutional Governance',
            role: u.role,
            email: u.email,
            phone: u.phone || '',
            status: u.status || 'ACTIVE',
            avatar: u.avatar
          });
        }
      });
    }

    return list;
  }

  private resolveResponsibilities(
    role: UserRole,
    department: Department,
    institute: Institute
  ): { statutoryResponsibilities: string[]; operationalResponsibilities: string[] } {
    if (role === 'HOD') {
      return {
        statutoryResponsibilities: [
          `Statutory oversight of academic curriculum delivery across all ${department.name} degree programs.`,
          `Presiding as Chairman of Departmental Board of Studies (BOS) and Academic Review Committee.`,
          `Statutory compliance verification for NAAC, NBA, AICTE, and UGC institutional accreditation guidelines.`,
          `Endorsement of faculty workload allocation, continuous assessments, and university exam eligibility rosters.`,
          `Authorized signatory for departmental asset transfers, requisitions, inventory verification, and annual stock audits.`
        ],
        operationalResponsibilities: [
          `Faculty Workload Management: Allocation of theory lectures, laboratory batches, and elective courses.`,
          `Student Academic & Attendance Monitoring: Bi-weekly defaulter identification, condonation reviews, and parent notifications.`,
          `Subject Allocation: Distribution of 12 curriculum subjects among 4 permanent professors.`,
          `Mentor-Mentee Oversight: Assignment of 25 mentees per faculty mentor with periodic counseling tracking.`,
          `Department Reports & Analytics: Generation of statutory reports for academic performance, attendance, and accreditation.`,
          `Asset & Lab Maintenance: Management of 3 fixed department assets, computing labs, and equipment calibration.`
        ]
      };
    } else if (role === 'FACULTY' || role === 'MENTOR') {
      return {
        statutoryResponsibilities: [
          `Statutory delivery of scheduled teaching hours adhering to approved university syllabus and session plans.`,
          `Maintenance of authentic classroom attendance logs compliant with UGC 75% minimum attendance requirement.`,
          `Continuous Internal Evaluation (CIE), setting of midterm examination question papers, and fair grade assessments.`,
          `Statutory student mentorship, academic progress counseling, and behavioral guidance.`
        ],
        operationalResponsibilities: [
          `Session Plan & Unit Material Management: Uploading lecture notes, PPTs, and code repositories before class.`,
          `Daily Attendance Logging: Real-time entry of student presence/absence with biometric and manual verification.`,
          `Assignment & Lab Assessments: Evaluation of student programming submissions and assignment clearance.`,
          `Student Mentorship Portal: Monitoring academic health, attendance shortages, and backlog clearance for assigned mentees.`,
          `Exam Eligibility Clearance: Verifying coursework completion before final admit card issuance.`
        ]
      };
    } else if (role === 'PRINCIPAL') {
      return {
        statutoryResponsibilities: [
          `Institutional academic governance and administrative direction for ${institute.name}.`,
          `Presiding officer for Institutional Academic Council, Faculty Appointments, and Disciplinary Committees.`,
          `Statutory budget preparation, financial resource planning, and institutional audit compliance.`,
          `Coordination with State Government, UGC, AICTE, and Swarrnim University central leadership.`
        ],
        operationalResponsibilities: [
          `School-wide Department Supervision: Performance evaluation of HODs across Computer Engineering, IT, and AI.`,
          `Institutional Approvals: Escalated purchase requisitions, faculty leaves, and research grants.`,
          `Accreditation Benchmarking: NAAC Criteria metric tracking and faculty publication monitoring.`,
          `Inter-Department Resource Allocation: Classrooms, specialized high-performance computing labs, and seminar halls.`
        ]
      };
    } else if (role === 'REGISTRAR' || role === 'DEPUTY_REGISTRAR') {
      return {
        statutoryResponsibilities: [
          `Statutory custodian of all University official records, Common Seal, statutory registers, and student archives.`,
          `Member Secretary to the Board of Management, Academic Council, and University Finance Committee.`,
          `Statutory compliance officer for University Grants Commission (UGC), Government Notifications, and RTI inquiries.`,
          `Official signatory for University Degree Certificates, Rank Certificates, Migration Certificates, and Transcripts.`
        ],
        operationalResponsibilities: [
          `University-wide Administrative Coordination across all 12 constituent schools and institutes.`,
          `Statutory Inward / Outward official correspondence tracking and file movement governance.`,
          `Approval workflows for inter-departmental transfers, campus admissions, and student data change requests.`,
          `University Academic Calendar promulgation and statutory holiday notification administration.`
        ]
      };
    } else {
      return {
        statutoryResponsibilities: [
          `Enterprise ERP system governance, access role assignment, and security compliance enforcement.`,
          `Audit log monitoring and enforcement of data privacy, confidentiality, and integrity policies.`,
          `System availability, automated database backups, and institutional identity federation.`
        ],
        operationalResponsibilities: [
          `User Account Lifecycle Management: Creation, activation, password resets, and role modifications.`,
          `RBAC Security Matrix Configuration: Setting fine-grained module access rules for 20+ university roles.`,
          `Global Academic Setup: Master configuration for academic terms, fee schedules, and institutional hierarchies.`
        ]
      };
    }
  }

  private resolveAssignedSubjects(
    user: User,
    fac: Faculty | undefined,
    department: Department,
    subjects: Subject[],
    students: any[]
  ): StaffNormalizedProfile['assignedSubjects'] {
    const list: StaffNormalizedProfile['assignedSubjects'] = [];
    const deptSubjects = subjects.filter(s => s.departmentId === department.id);

    const relevantSubjectIds = fac?.subjectIds || ['sub-dsa', 'sub-dbms', 'sub-webtech'];

    relevantSubjectIds.forEach(subId => {
      const s = deptSubjects.find(sub => sub.id === subId) || subjects.find(sub => sub.id === subId);
      if (s) {
        const sem = db.getSemesterById(s.semesterId);
        list.push({
          id: s.id,
          code: s.code,
          name: s.name,
          type: s.type || 'THEORY',
          semesterNumber: sem?.number || 4,
          credits: s.credits || 4,
          hoursPerWeek: (s.theoryHoursPerWeek || 3) + (s.labHoursPerWeek || 2),
          enrolledStudents: students.length || 4
        });
      }
    });

    if (list.length === 0 && deptSubjects.length > 0) {
      deptSubjects.slice(0, 3).forEach(s => {
        const sem = db.getSemesterById(s.semesterId);
        list.push({
          id: s.id,
          code: s.code,
          name: s.name,
          type: s.type || 'THEORY',
          semesterNumber: sem?.number || 4,
          credits: s.credits || 4,
          hoursPerWeek: (s.theoryHoursPerWeek || 3) + (s.labHoursPerWeek || 2),
          enrolledStudents: students.length || 4
        });
      });
    }

    return list;
  }

  private resolveScopeKPIs(
    user: User,
    role: UserRole,
    department: Department,
    institute: Institute,
    directReports: DirectReportEmployee[],
    assignedSubjects: StaffNormalizedProfile['assignedSubjects'],
    students: any[],
    facultyList: Faculty[]
  ): ResponsibilityScopeKPIs {
    const kpis = departmentScopeService.getDepartmentDashboardKPIs(user, role);
    const scope = departmentScopeService.resolveScopeIdentity(user, role);
    const hodData = inventoryManagementService.getHODDashboardData({
      id: user.id || 'user-hod-1',
      name: user.name || 'Demo HOD 1',
      email: user.email || 'demo.hod1@ssiu-demo.ac.in',
      role: 'HOD',
      departmentId: department.id,
      instituteId: institute.id,
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z'
    });

    const menteeData = mentorAssignmentService.getAssignments({ mentorFacultyId: user.id || 'fac-1', status: 'ACTIVE' }, user);
    const activeMenteesCount = menteeData.assignments.length || 2;

    let weeklyTeachingHours = 0;
    let theoryHours = 0;
    let labHours = 0;

    assignedSubjects.forEach(s => {
      weeklyTeachingHours += s.hoursPerWeek;
      theoryHours += 3;
      labHours += (s.hoursPerWeek > 3 ? s.hoursPerWeek - 3 : 0);
    });

    return {
      totalSupervisedFaculty: kpis?.totalFaculty || facultyList.length || 4,
      totalSupervisedStudents: kpis?.totalStudents || students.length || 4,
      totalAssignedPrograms: scope?.programs?.length || 4,
      totalAssignedSubjects: assignedSubjects.length || 3,
      weeklyTeachingHours: weeklyTeachingHours || 16,
      theoryTeachingHours: theoryHours || 9,
      labTeachingHours: labHours || 7,
      activeMenteesCount: activeMenteesCount,
      departmentAssetsCount: hodData?.totalAssetsCount || 3,
      pendingApprovalsCount: hodData?.pendingAssetRequisitions.length || 1,
      attendanceComplianceRate: kpis?.averageAttendancePercentage || 79,
      directReportsCount: directReports.length
    };
  }

  private resolvePermissionsMatrix(
    user: User,
    role: UserRole
  ): { permissionLevel: string; modulePermissions: ModulePermissionItem[] } {
    const modules: { key: ERPModule; label: string; cat: ModulePermissionItem['category'] }[] = [
      { key: 'STUDENTS', label: 'Student Master & Admissions', cat: 'STUDENT_SERVICES' },
      { key: 'ATTENDANCE', label: 'Attendance & Defaulter Audits', cat: 'ACADEMIC' },
      { key: 'FACULTY', label: 'Faculty Directory & Workload', cat: 'ACADEMIC' },
      { key: 'FACULTY_WORKLOAD', label: 'Subject & Workload Allocation', cat: 'ACADEMIC' },
      { key: 'SUBJECTS', label: 'Curriculum & Course Master', cat: 'ACADEMIC' },
      { key: 'SESSION_PLAN', label: 'Session Plans & Syllabus Progress', cat: 'ACADEMIC' },
      { key: 'STUDY_MATERIAL', label: 'Study Materials & Notes Vault', cat: 'ACADEMIC' },
      { key: 'EXAMINATION', label: 'Exams, Marks & Hall Tickets', cat: 'ACADEMIC' },
      { key: 'EXAM_ELIGIBILITY', label: 'Exam Eligibility & Condonation', cat: 'ACADEMIC' },
      { key: 'INVENTORY_ASSETS', label: 'Department Assets & Inventory', cat: 'CAMPUS_OPERATIONS' },
      { key: 'REPORTS', label: 'Statutory Reports & Analytics', cat: 'GOVERNANCE' },
      { key: 'APPROVALS', label: 'Approval Workflows & Requisitions', cat: 'GOVERNANCE' },
      { key: 'DOCUMENTS', label: 'Official Documents & Verification', cat: 'ADMINISTRATION' },
      { key: 'REQUESTS', label: 'Service Requests & Inward-Outward', cat: 'ADMINISTRATION' },
      { key: 'PTM_MANAGEMENT', label: 'Parent-Teacher Meetings (PTM)', cat: 'STUDENT_SERVICES' },
      { key: 'FEEDBACK', label: 'Student & Faculty Feedback System', cat: 'GOVERNANCE' },
      { key: 'SETTINGS', label: 'System Configuration & Security', cat: 'GOVERNANCE' }
    ];

    const modulePermissions: ModulePermissionItem[] = modules.map(m => {
      const canView = canAccess(user, m.key, 'VIEW').allowed;
      const canCreate = canAccess(user, m.key, 'CREATE').allowed;
      const canEdit = canAccess(user, m.key, 'EDIT').allowed;
      const canDelete = canAccess(user, m.key, 'DELETE').allowed;
      const canApprove = canAccess(user, m.key, 'APPROVE').allowed;
      const canExport = canAccess(user, m.key, 'EXPORT').allowed;
      const canAllocate = canAccess(user, m.key, 'ALLOCATE').allowed;

      return {
        moduleKey: m.key,
        moduleLabel: m.label,
        category: m.cat,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canApprove,
        canExport,
        canAllocate
      };
    });

    let permissionLevel = 'ROLE_SPECIFIC_OPERATIONS';
    if (['SUPER_ADMIN', 'UNIVERSITY_ADMIN'].includes(role)) {
      permissionLevel = 'TIER_1_ENTERPRISE_SYSTEM_ADMINISTRATOR';
    } else if (['PRESIDENT', 'VICE_PRESIDENT', 'PROVOST', 'REGISTRAR', 'PRINCIPAL'].includes(role)) {
      permissionLevel = 'TIER_2_INSTITUTIONAL_EXECUTIVE_GOVERNANCE';
    } else if (role === 'HOD') {
      permissionLevel = 'TIER_3_DEPARTMENT_HEAD_ACADEMIC_ADMINISTRATION';
    } else if (role === 'FACULTY' || role === 'MENTOR') {
      permissionLevel = 'TIER_4_INSTRUCTIONAL_FACULTY_PORTAL';
    } else {
      permissionLevel = 'TIER_5_ADMINISTRATIVE_OPERATIONAL_STAFF';
    }

    return { permissionLevel, modulePermissions };
  }
}

export const staffProfileService = StaffProfileService.getInstance();
