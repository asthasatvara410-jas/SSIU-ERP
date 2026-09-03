import { describe, it, expect, beforeEach } from 'vitest';
import { staffProfileService } from '../services/staffProfileService';
import { db } from '../services/db';
import { User, UserRole } from '../types';

describe('Non-Student Universal Profile Governance System', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const mockHODUser: User = {
    id: 'user-hod-1',
    name: 'Dr. Aarav Mehta',
    username: 'hod',
    email: 'demo.hod1@ssiu-demo.ac.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    designation: 'Professor & Head of Department',
    phone: '+91 98250 10004',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockFacultyUser: User = {
    id: 'user-faculty-1',
    name: 'Dr. Rajesh Sharma',
    username: 'faculty',
    email: 'demo.faculty1@ssiu-demo.ac.in',
    role: 'FACULTY',
    employeeId: 'FACULTY-001',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    designation: 'Associate Professor & Student Mentor',
    phone: '+91 98250 20001',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockPrincipalUser: User = {
    id: 'user-principal-1',
    name: 'Dr. K. N. Shah',
    username: 'principal',
    email: 'demo.principal1@ssiu-demo.ac.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    designation: 'Principal & Dean, SIT',
    phone: '+91 98250 00008',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z'
  };

  const mockRegistrarUser: User = {
    id: 'user-registrar',
    name: 'Dr. Sanjay Patel',
    username: 'registrar',
    email: 'demo.registrar1@ssiu-demo.ac.in',
    role: 'REGISTRAR',
    designation: 'University Registrar',
    phone: '+91 98250 00003',
    status: 'ACTIVE',
    createdAt: '2024-01-01T00:00:00Z'
  };

  it('1. Generates complete, normalized profile for HOD with hierarchy and direct reports', () => {
    const profile = staffProfileService.getStaffProfile(mockHODUser, 'HOD');

    expect(profile.userId).toBe('user-hod-1');
    expect(profile.name).toBe('Dr. Aarav Mehta');
    expect(profile.role).toBe('HOD');
    expect(profile.roleDisplayName).toBe('Head of Department (HOD)');
    expect(profile.departmentName).toContain('Computer Engineering');
    expect(profile.instituteName).toContain('Computing');

    // Reporting Line
    expect(profile.roleAbove).toContain('Principal');
    expect(profile.reportsTo.role).toBe('PRINCIPAL');

    // Hierarchy
    expect(profile.hierarchyChain.length).toBeGreaterThanOrEqual(5);
    const currentUserNode = profile.hierarchyChain.find(n => n.isCurrentUser);
    expect(currentUserNode).toBeDefined();
    expect(currentUserNode?.role).toBe('HOD');

    // Direct reports (Faculty members)
    expect(profile.directReports.length).toBeGreaterThanOrEqual(4);
    expect(profile.directReports.some(r => r.role === 'FACULTY')).toBe(true);

    // Statutory and Operational Responsibilities
    expect(profile.statutoryResponsibilities.length).toBeGreaterThan(0);
    expect(profile.operationalResponsibilities.length).toBeGreaterThan(0);
    expect(profile.statutoryResponsibilities.some(r => r.includes('curriculum delivery'))).toBe(true);

    // Scope KPIs (Live derived counts)
    expect(profile.scopeKPIs.totalSupervisedFaculty).toBeGreaterThanOrEqual(4);
    expect(profile.scopeKPIs.totalSupervisedStudents).toBeGreaterThanOrEqual(4);
    expect(profile.scopeKPIs.departmentAssetsCount).toBe(3);
  });

  it('2. Generates complete, normalized profile for Faculty with teaching workload and subjects', () => {
    const profile = staffProfileService.getStaffProfile(mockFacultyUser, 'FACULTY');

    expect(profile.userId).toBe('user-faculty-1');
    expect(profile.name).toBe('Dr. Rajesh Sharma');
    expect(profile.role).toBe('FACULTY');
    expect(profile.roleDisplayName).toBe('Academic Faculty & Professor');

    // Reporting Line
    expect(profile.roleAbove).toContain('Head of Department');
    expect(profile.reportsTo.role).toBe('HOD');

    // Assigned Subjects & Workload
    expect(profile.assignedSubjects.length).toBeGreaterThan(0);
    expect(profile.scopeKPIs.weeklyTeachingHours).toBeGreaterThanOrEqual(12);
    expect(profile.scopeKPIs.activeMenteesCount).toBeGreaterThanOrEqual(0);
  });

  it('3. Generates complete profile for Principal / Dean with HOD direct reports', () => {
    const profile = staffProfileService.getStaffProfile(mockPrincipalUser, 'PRINCIPAL');

    expect(profile.role).toBe('PRINCIPAL');
    expect(profile.roleDisplayName).toBe('Principal & Dean of Faculty');
    expect(profile.roleAbove).toContain('Registrar');
    expect(profile.reportsTo.role).toBe('REGISTRAR');

    // Direct Reports should be HODs
    expect(profile.directReports.length).toBeGreaterThan(0);
    expect(profile.directReports.some(r => r.role === 'HOD')).toBe(true);
  });

  it('4. Generates complete profile for Registrar with administrative direct reports', () => {
    const profile = staffProfileService.getStaffProfile(mockRegistrarUser, 'REGISTRAR');

    expect(profile.role).toBe('REGISTRAR');
    expect(profile.roleDisplayName).toBe('University Registrar');
    expect(profile.roleAbove).toContain('Chancellor');

    // Direct Reports should include Deans and Section Heads
    expect(profile.directReports.length).toBeGreaterThan(0);
    expect(profile.directReports.some(r => r.role === 'PRINCIPAL' || r.role === 'EXAM_CELL')).toBe(true);
  });

  it('5. Successfully updates permitted personal and contact details with audit logging', () => {
    const updates = {
      phone: '+91 99999 11111',
      alternatePhone: '+91 99999 22222',
      address: 'New Staff Flat D-204, Swarrnim Green Enclave',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380054',
      bloodGroup: 'O+',
      emergencyContactName: 'Dr. Sunita Mehta',
      emergencyContactPhone: '+91 99999 33333',
      emergencyContactRelation: 'Spouse',
      specialization: 'Quantum Computing & Distributed Cloud Networks'
    };

    const updatedUser = staffProfileService.updateStaffPersonalDetails(mockHODUser, updates);
    expect(updatedUser).toBeDefined();
    expect(updatedUser?.phone).toBe('+91 99999 11111');

    // Verify updated profile reflects new details
    const refetchedProfile = staffProfileService.getStaffProfile(updatedUser!, 'HOD');
    expect(refetchedProfile.phone).toBe('+91 99999 11111');
    expect(refetchedProfile.address).toBe('New Staff Flat D-204, Swarrnim Green Enclave');
    expect(refetchedProfile.city).toBe('Ahmedabad');
    expect(refetchedProfile.bloodGroup).toBe('O+');
    expect(refetchedProfile.specialization).toBe('Quantum Computing & Distributed Cloud Networks');

    // Verify audit log recorded
    const auditLogs = db.getAuditLogs();
    const profileLog = auditLogs.find(l => l.action === 'STAFF_PROFILE_UPDATED' && l.recordId === mockHODUser.id);
    expect(profileLog).toBeDefined();
    expect(profileLog?.status).toBe('SUCCESS');
  });

  it('6. Generates accurate RBAC permissions matrix derived from authorizationService', () => {
    const hodProfile = staffProfileService.getStaffProfile(mockHODUser, 'HOD');
    expect(hodProfile.permissionLevel).toBe('TIER_3_DEPARTMENT_HEAD_ACADEMIC_ADMINISTRATION');
    expect(hodProfile.modulePermissions.length).toBeGreaterThan(10);

    const studentPerm = hodProfile.modulePermissions.find(p => p.moduleKey === 'STUDENTS');
    expect(studentPerm?.canView).toBe(true);
    expect(studentPerm?.canEdit).toBe(true);

    const facultyProfile = staffProfileService.getStaffProfile(mockFacultyUser, 'FACULTY');
    expect(facultyProfile.permissionLevel).toBe('TIER_4_INSTRUCTIONAL_FACULTY_PORTAL');
  });

  it('7. Supports all diverse university operational roles without failure', () => {
    const roles: UserRole[] = [
      'SUPER_ADMIN', 'UNIVERSITY_ADMIN', 'PRESIDENT', 'VICE_PRESIDENT', 'PROVOST',
      'REGISTRAR', 'DEPUTY_REGISTRAR', 'PRINCIPAL', 'HOD', 'FACULTY', 'MENTOR',
      'EXAM_CELL', 'STUDENT_ADMIN', 'STUDENT_SECTION', 'ACCOUNTS_ADMIN', 'HR_ADMIN',
      'LIBRARY_ADMIN', 'HOSTEL_ADMIN', 'TRANSPORT_ADMIN', 'MAINTENANCE_ADMIN', 'IQAC', 'ERP_COORDINATOR'
    ];

    roles.forEach(role => {
      const genericUser: User = {
        id: `user-${role.toLowerCase()}`,
        name: `Officer of ${role}`,
        email: `${role.toLowerCase()}@swarrnim.edu.in`,
        role: role,
        status: 'ACTIVE',
        createdAt: '2024-01-01T00:00:00Z'
      };

      const p = staffProfileService.getStaffProfile(genericUser, role);
      expect(p.userId).toBe(genericUser.id);
      expect(p.role).toBe(role);
      expect(p.roleDisplayName.length).toBeGreaterThan(0);
      expect(p.hierarchyChain.length).toBeGreaterThan(0);
      expect(p.statutoryResponsibilities.length).toBeGreaterThan(0);
      expect(p.modulePermissions.length).toBeGreaterThan(0);
      expect(p.scopeKPIs).toBeDefined();
    });
  });

  it('8. Data consistency: Profile statistics match Department Dashboard and Inventory Services', () => {
    const hodUser = db.getUsers().find(u => u.role === 'HOD') || mockHODUser;
    const profile = staffProfileService.getStaffProfile(hodUser, 'HOD');

    // Compare with departmentScopeService
    const kpis = db.getStudents().filter(s => s.departmentId === (hodUser.departmentId || 'dept-1'));
    const faculty = db.getFaculty().filter(f => f.departmentId === (hodUser.departmentId || 'dept-1'));
    
    expect(profile.scopeKPIs.totalSupervisedStudents).toBe(kpis.length);
    expect(profile.scopeKPIs.totalSupervisedFaculty).toBe(faculty.length);
    expect(profile.scopeKPIs.departmentAssetsCount).toBe(3);
  });

  it('9. Demo User Switching: Immediately yields correct distinct profile without stale cache', () => {
    const allUsers = db.getUsers();
    const hod = allUsers.find(u => u.role === 'HOD')!;
    const faculty = allUsers.find(u => u.role === 'FACULTY')!;
    const registrar = allUsers.find(u => u.role === 'REGISTRAR')!;

    const p1 = staffProfileService.getStaffProfile(hod, 'HOD');
    const p2 = staffProfileService.getStaffProfile(faculty, 'FACULTY');
    const p3 = staffProfileService.getStaffProfile(registrar, 'REGISTRAR');

    expect(p1.userId).toBe(hod.id);
    expect(p1.name).toBe(hod.name);
    expect(p1.role).toBe('HOD');

    expect(p2.userId).toBe(faculty.id);
    expect(p2.name).toBe(faculty.name);
    expect(p2.role).toBe('FACULTY');
    expect(p2.userId).not.toBe(p1.userId);

    expect(p3.userId).toBe(registrar.id);
    expect(p3.name).toBe(registrar.name);
    expect(p3.role).toBe('REGISTRAR');
    expect(p3.userId).not.toBe(p2.userId);
  });

  it('10. Resolves explicit reportingToUserId when configured on user record', () => {
    const userWithExplicitBoss: User = {
      id: 'user-custom-reporter',
      name: 'Prof. Custom Reporter',
      email: 'custom@swarrnim.edu.in',
      role: 'FACULTY',
      reportingToUserId: 'user-principal-1',
      status: 'ACTIVE',
      createdAt: '2024-01-01T00:00:00Z'
    };

    const profile = staffProfileService.getStaffProfile(userWithExplicitBoss, 'FACULTY');
    expect(profile.reportsTo.name).toContain('Principal');
    expect(profile.reportsTo.role).toBe('PRINCIPAL');
  });
});
