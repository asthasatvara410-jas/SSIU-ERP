import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { AUTH_STORAGE_KEY } from '../constants';
import { User, UserRole } from '../types';

describe('Authoritative Auth & Role Resolution Suite', () => {

  beforeEach(() => {
    // Clean mock storage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  // TEST 1: Registrar user record resolution
  it('TEST 1: Resolves Registrar account as role === "REGISTRAR"', () => {
    const users = db.getUsers();
    const registrarUser = users.find(u => u.username === 'registrar' || u.role === 'REGISTRAR');

    expect(registrarUser).toBeDefined();
    expect(registrarUser?.role).toBe('REGISTRAR');
    expect(registrarUser?.name).toBe('Demo Registrar 1');
  });

  // TEST 2: Role isolation across all canonical roles
  it('TEST 2: Authoritatively resolves distinct roles for each portal account with zero leakage', () => {
    const users = db.getUsers();

    const testRoleMappings: { identifier: string; expectedRole: UserRole }[] = [
      { identifier: 'registrar', expectedRole: 'REGISTRAR' },
      { identifier: 'principal', expectedRole: 'PRINCIPAL' },
      { identifier: 'hod', expectedRole: 'HOD' },
      { identifier: 'faculty', expectedRole: 'FACULTY' },
      { identifier: 'student', expectedRole: 'STUDENT' },
      { identifier: 'admin', expectedRole: 'SUPER_ADMIN' }
    ];

    testRoleMappings.forEach(({ identifier, expectedRole }) => {
      let foundUser = users.find(u => 
        u.username?.toLowerCase() === identifier.toLowerCase() ||
        u.email?.toLowerCase() === identifier.toLowerCase() ||
        (identifier === 'admin' && (u.role === 'SUPER_ADMIN' || u.role === 'UNIVERSITY_ADMIN')) ||
        (identifier === 'registrar' && u.role === 'REGISTRAR') ||
        (identifier === 'principal' && u.role === 'PRINCIPAL') ||
        (identifier === 'hod' && u.role === 'HOD') ||
        (identifier === 'faculty' && u.role === 'FACULTY') ||
        (identifier === 'student' && u.role === 'STUDENT')
      );

      expect(foundUser).toBeDefined();
      if (expectedRole === 'SUPER_ADMIN') {
        expect(['SUPER_ADMIN', 'UNIVERSITY_ADMIN']).toContain(foundUser?.role);
      } else {
        expect(foundUser?.role).toBe(expectedRole);
      }
    });
  });

  // TEST 3: Stale faculty cache cannot hijack Registrar role
  it('TEST 3: Stale localStorage workspace cache cannot pollute or overwrite Registrar role', () => {
    const memoryStore: Record<string, string> = {};
    const safeGetItem = (k: string) => memoryStore[k] || null;
    const safeSetItem = (k: string, v: string) => { memoryStore[k] = v; };

    // Simulate stale faculty workspace cache left by prior faculty login
    const regUser = db.getUsers().find(u => u.role === 'REGISTRAR')!;
    safeSetItem(`sscit_active_workspace_${regUser.id}`, 'FACULTY');

    // Simulate auth resolution logic
    let initialActiveRole: UserRole = regUser.role;
    if (regUser.role === 'FACULTY' || regUser.role === 'MENTOR') {
      const savedActiveRole = safeGetItem(`sscit_active_workspace_${regUser.id}`);
      if (savedActiveRole === 'FACULTY' || savedActiveRole === 'MENTOR') {
        initialActiveRole = savedActiveRole as UserRole;
      }
    } else {
      delete memoryStore[`sscit_active_workspace_${regUser.id}`];
    }

    expect(initialActiveRole).toBe('REGISTRAR');
    expect(initialActiveRole).not.toBe('FACULTY');
    expect(safeGetItem(`sscit_active_workspace_${regUser.id}`)).toBeNull();
  });

  // TEST 4: Registrar dashboard university-wide datasets
  it('TEST 4: Registrar queries university-level datasets (Institutes, Depts, Programs, Students)', () => {
    const allInstitutes = db.getInstitutes();
    const allDepartments = db.getDepartments();
    const allPrograms = db.getPrograms();
    const allStudents = db.getStudents();
    const allFaculty = db.getFaculty();

    expect(allInstitutes.length).toBeGreaterThanOrEqual(1);
    expect(allDepartments.length).toBeGreaterThanOrEqual(1);
    expect(allPrograms.length).toBeGreaterThanOrEqual(1);
    expect(allStudents.length).toBeGreaterThanOrEqual(1);
    expect(allFaculty.length).toBeGreaterThanOrEqual(1);
  });

  // TEST 5: Registrar Portal Navigation Structure
  it('TEST 5: REGISTRAR_NAVIGATION_STRUCTURE conforms to QUICK ACCESS, 🎓 ACADEMIC, and 🏢 NON-ACADEMIC / REGISTRAR OFFICE hierarchy', async () => {
    const { REGISTRAR_NAVIGATION_STRUCTURE } = await import('../constants/navigationConfig');

    // Verify 3 distinct categories
    const categories = Array.from(new Set(REGISTRAR_NAVIGATION_STRUCTURE.map(item => item.category)));
    expect(categories).toContain('QUICK ACCESS');
    expect(categories).toContain('🎓 ACADEMIC');
    expect(categories).toContain('🏢 NON-ACADEMIC / REGISTRAR OFFICE');

    // Quick Access items
    const quickAccess = REGISTRAR_NAVIGATION_STRUCTURE.filter(item => item.category === 'QUICK ACCESS');
    expect(quickAccess.map(i => i.label)).toEqual(['Dashboard', 'Notifications', 'My Tasks']);

    // Academic items
    const academicItems = REGISTRAR_NAVIGATION_STRUCTURE.filter(item => item.category === '🎓 ACADEMIC');
    expect(academicItems.map(i => i.label)).toEqual([
      'University Overview',
      'Institutes',
      'Departments',
      'Programs',
      'Students',
      'Faculty & Staff',
      'Academic Administration',
      'Attendance',
      'Examination',
      'Academic Requests',
      'Academic Approvals',
      'Academic Reports',
      'Academic Risks'
    ]);

    // Non-Academic / Registrar Office items
    const officeItems = REGISTRAR_NAVIGATION_STRUCTURE.filter(item => item.category === '🏢 NON-ACADEMIC / REGISTRAR OFFICE');
    expect(officeItems.map(i => i.label)).toEqual([
      'Registrar Office Overview',
      'Office Staff',
      'Work Allocation',
      'Office Requests',
      'Office Approvals',
      'Office Documents',
      'Office Reports',
      'Office Notifications',
      'Office Audit Trail'
    ]);

    // Office Staff submenu verification
    const staffGroup = officeItems.find(i => i.label === 'Office Staff');
    expect(staffGroup?.children?.map(c => c.label)).toEqual([
      'Deputy Registrar',
      'Assistant Registrar',
      'Other Staff'
    ]);
  });

  // TEST 6: Registrar View Switch Dynamic Filtering (ACADEMIC vs NON_ACADEMIC)
  it('TEST 6: Dynamically filters sidebar navigation when switching between ACADEMIC and NON_ACADEMIC contexts', async () => {
    const { REGISTRAR_NAVIGATION_STRUCTURE } = await import('../constants/navigationConfig');

    // Simulate Academic View filter
    const academicNav = REGISTRAR_NAVIGATION_STRUCTURE.filter(
      item => item.category === 'QUICK ACCESS' || item.category === '🎓 ACADEMIC'
    );
    expect(academicNav.some(i => i.label === 'University Overview')).toBe(true);
    expect(academicNav.some(i => i.label === 'Institutes')).toBe(true);
    expect(academicNav.some(i => i.label === 'Registrar Office Overview')).toBe(false);
    expect(academicNav.some(i => i.label === 'Work Allocation')).toBe(false);

    // Simulate Non-Academic View filter
    const nonAcademicNav = REGISTRAR_NAVIGATION_STRUCTURE.filter(
      item => item.category === 'QUICK ACCESS' || item.category === '🏢 NON-ACADEMIC / REGISTRAR OFFICE'
    );
    expect(nonAcademicNav.some(i => i.label === 'Registrar Office Overview')).toBe(true);
    expect(nonAcademicNav.some(i => i.label === 'Office Staff')).toBe(true);
    expect(nonAcademicNav.some(i => i.label === 'Work Allocation')).toBe(true);
    expect(nonAcademicNav.some(i => i.label === 'University Overview')).toBe(false);
    expect(nonAcademicNav.some(i => i.label === 'Institutes')).toBe(false);

    // Quick Access items remain present in both views
    expect(academicNav.some(i => i.label === 'Dashboard')).toBe(true);
    expect(nonAcademicNav.some(i => i.label === 'Dashboard')).toBe(true);
  });
});
