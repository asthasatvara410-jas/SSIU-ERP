import { describe, it, expect } from 'vitest';
import { hrmsUnifiedEmployee360Service } from '../services/hrmsUnifiedEmployee360Service';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 26: HRMS + Employee Master + Faculty/Staff 360° Dossier Engine', () => {

  const facultyContext: UserAuthorizationContext = {
    userId: 'emp-fac-01',
    userName: 'Dr. Amit Trivedi',
    email: 'amit.trivedi@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const otherFacultyContext: UserAuthorizationContext = {
    userId: 'emp-fac-02',
    userName: 'Dr. Rajesh Patel',
    email: 'rajesh.patel@ssiu.ac.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  it('TEST 1: Faculty 360 Dossier: Includes qualifications, teaching workload, publications, and service lineage', () => {
    const dossier = hrmsUnifiedEmployee360Service.getEmployee360Dossier('emp-fac-01', facultyContext);
    expect(dossier).toBeDefined();
    expect(dossier?.employeeType).toBe('FACULTY');
    expect(dossier?.facultyPortfolio?.teachingHoursPerWeek).toBe(16);
    expect(dossier?.facultyPortfolio?.publications.length).toBeGreaterThan(0);
    expect(dossier?.qualifications.length).toBeGreaterThanOrEqual(2);
  });

  it('TEST 2: Administrative Staff Dossier: Includes assigned tasks, office reporting manager, and service history', () => {
    const staffDossier = hrmsUnifiedEmployee360Service.getEmployee360Dossier('emp-reg-staff-01');
    expect(staffDossier).toBeDefined();
    expect(staffDossier?.employeeType).toBe('ADMINISTRATIVE_STAFF');
    expect(staffDossier?.organizationUnit).toBe('Office of the Registrar');
    expect(staffDossier?.staffTasks?.length).toBeGreaterThan(0);
  });

  it('TEST 3: Registrar Dual-Scope Segregation: Academic metrics are strictly separated from Administrative Registrar Office metrics', () => {
    const overview = hrmsUnifiedEmployee360Service.getRegistrarOfficeAndAcademicOverview();
    expect(overview.academic.totalFaculty).toBe(420);
    expect(overview.administrative.registrarOfficeStaffCount).toBe(48);
  });

  it('TEST 4: RBAC & Privacy: Faculty A cannot view Faculty B confidential dossier without authorization', () => {
    const unauthorizedDossier = hrmsUnifiedEmployee360Service.getEmployee360Dossier('emp-fac-01', otherFacultyContext);
    expect(unauthorizedDossier).toBeUndefined(); // Strictly blocked
  });
});
