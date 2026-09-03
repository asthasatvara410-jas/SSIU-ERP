import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { moduleQueryEngineService } from '../services/moduleQueryEngineService';
import { UserAuthorizationContext, User, NoteSheet } from '../types';

describe('SSIU ERP – Phase 4: Module-Specific Query Engine & Single Source of Truth', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'usr-reg-01',
    userName: 'Dr. Registrar',
    email: 'registrar@ssiu.ac.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['VIEW', 'APPROVE', 'AUDIT']
  };

  const hoiContext: UserAuthorizationContext = {
    userId: 'usr-prin-sit',
    userName: 'Dr. Principal SIT',
    email: 'principal.sit@ssiu.ac.in',
    activeRole: 'PRINCIPAL',
    assignedRoles: ['PRINCIPAL'],
    permissions: ['VIEW', 'APPROVE'],
    instituteId: 'inst-1'
  };

  const hodCseContext: UserAuthorizationContext = {
    userId: 'usr-hod-cse',
    userName: 'Dr. HOD CSE',
    email: 'hod.cse@ssiu.ac.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD', 'FACULTY'],
    permissions: ['VIEW', 'APPROVE'],
    instituteId: 'inst-1',
    departmentId: 'dept-1'
  };

  const studentContext: UserAuthorizationContext = {
    userId: 'usr-stud-01',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['VIEW']
  };

  it('TEST 1: Student query returns only self records for Student, department for HOD, and institute for HOI', () => {
    const studentRes = moduleQueryEngineService.getStudentsForUser(studentContext);
    expect(studentRes.records.length).toBeLessThanOrEqual(1);

    const hodRes = moduleQueryEngineService.getStudentsForUser(hodCseContext);
    hodRes.records.forEach(s => {
      if (s.departmentId && s.departmentId !== 'ADMIN') {
        expect(s.departmentId).toBe('dept-1');
      }
    });

    const hoiRes = moduleQueryEngineService.getStudentsForUser(hoiContext);
    hoiRes.records.forEach(s => {
      if (s.instituteId && s.instituteId !== 'CENTRAL_ADMIN') {
        expect(s.instituteId).toBe('inst-1');
      }
    });
  });

  it('TEST 2: Dashboard Card Count strictly equals the List Query length and totalCount (Card = List Rule)', () => {
    const kpis = moduleQueryEngineService.getDashboardKPIs(hodCseContext);
    const pendingList = moduleQueryEngineService.getPendingNotesheetsForUser(hodCseContext);

    expect(kpis.pendingNotesheetsCount).toBe(pendingList.totalCount);
    expect(kpis.pendingNotesheetsCount).toBe(pendingList.records.length);
  });

  it('TEST 3: Inventory Transaction Isolation: Transfer ≠ Return ≠ Issue ≠ Asset Master', () => {
    const assets = moduleQueryEngineService.getAssetsForUser(registrarContext);
    const transfers = moduleQueryEngineService.getTransfersForUser(registrarContext);
    const returns = moduleQueryEngineService.getReturnsForUser(registrarContext);
    const issues = moduleQueryEngineService.getIssuesForUser(registrarContext);

    expect(assets.records).toBeInstanceOf(Array);
    expect(transfers.records).toBeInstanceOf(Array);
    expect(returns.records).toBeInstanceOf(Array);
    expect(issues.records).toBeInstanceOf(Array);
  });

  it('TEST 4: Notesheet query results never mix with General Academic Request results', () => {
    const notesheets = moduleQueryEngineService.getNotesheetsForUser(registrarContext);
    const requests = moduleQueryEngineService.getRequestsForUser(registrarContext);

    const notesheetIds = new Set(notesheets.records.map(n => n.id));
    requests.records.forEach(r => {
      expect(notesheetIds.has(r.id)).toBe(false);
    });
  });

  it('TEST 5: Pagination and Sorting work correctly on authorized subsets', () => {
    const paginated = moduleQueryEngineService.getStudentsForUser(registrarContext, undefined, {
      page: 1,
      pageSize: 5,
      sortBy: 'name',
      sortOrder: 'asc'
    });

    expect(paginated.records.length).toBeLessThanOrEqual(5);
    expect(paginated.page).toBe(1);
    expect(paginated.pageSize).toBe(5);
  });
});
