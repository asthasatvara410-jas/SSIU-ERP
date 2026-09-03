import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { dashboardKpiService } from '../services/dashboardKpiService';
import { moduleQueryEngineService } from '../services/moduleQueryEngineService';
import { UserAuthorizationContext, User, NoteSheet } from '../types';

describe('SSIU ERP – Phase 5: Dashboard & KPI Engine Consistency & Verification', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'usr-reg-01',
    userName: 'Dr. Registrar SSIU',
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

  const facultyUser: User = {
    id: 'usr-fac-cse',
    name: 'Prof. CSE Faculty',
    email: 'faculty.cse@ssiu.ac.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const hodUser: User = {
    id: 'usr-hod-cse',
    name: 'Dr. HOD CSE',
    email: 'hod.cse@ssiu.ac.in',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  it('TEST 1: Dashboard KPI for Pending Notesheets strictly matches the List Query count before and after action', () => {
    // 1. Initial Dashboard State
    const initialDash = dashboardKpiService.getDashboardForUser(hodCseContext);
    const initialPendingKpi = initialDash.kpis.find(k => k.kpiId === 'kpi-pending-notesheets');
    const initialList = moduleQueryEngineService.getPendingNotesheetsForUser(hodCseContext);

    expect(initialPendingKpi?.value).toBe(initialList.totalCount);
    expect(initialPendingKpi?.value).toBe(initialList.records.length);

    // 2. Create and submit a new Notesheet to HOD
    const newNs = db.createNoteSheet({
      subject: 'AI GPU Infrastructure Proposal',
      creatorId: facultyUser.id,
      creatorName: facultyUser.name,
      creatorRole: facultyUser.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'SUBMITTED',
      movements: []
    } as any, facultyUser);

    // 3. Post-Creation Dashboard State
    const postCreateDash = dashboardKpiService.getDashboardForUser(hodCseContext);
    const postCreatePendingKpi = postCreateDash.kpis.find(k => k.kpiId === 'kpi-pending-notesheets');
    const postCreateList = moduleQueryEngineService.getPendingNotesheetsForUser(hodCseContext);

    expect(postCreatePendingKpi?.value).toBe(postCreateList.totalCount);
    expect(postCreatePendingKpi?.value).toBe(Number(initialPendingKpi?.value || 0) + 1);

    // 4. Action Notesheet (HOD Forwards to HOI)
    db.processNoteSheetAction(newNs.id, 'FORWARD', 'Recommended to Principal', undefined, hodUser, 'HOI');

    // 5. Post-Action Dashboard State
    const postActionDash = dashboardKpiService.getDashboardForUser(hodCseContext);
    const postActionPendingKpi = postActionDash.kpis.find(k => k.kpiId === 'kpi-pending-notesheets');
    const postActionList = moduleQueryEngineService.getPendingNotesheetsForUser(hodCseContext);

    expect(postActionPendingKpi?.value).toBe(postActionList.totalCount);
    expect(postActionPendingKpi?.value).toBe(initialPendingKpi?.value);
  });

  it('TEST 2: Attention Items engine returns actionable pending items for the user', () => {
    const dash = dashboardKpiService.getDashboardForUser(hodCseContext);
    expect(dash.attentionItems).toBeInstanceOf(Array);
    dash.attentionItems.forEach(item => {
      expect(item.id).toBeDefined();
      expect(item.actionRoute).toBeDefined();
      expect(item.severity).toBeDefined();
    });
  });

  it('TEST 3: Scope labels and KPI structures dynamically adapt to user role', () => {
    const regDash = dashboardKpiService.getDashboardForUser(registrarContext);
    expect(regDash.scopeLabel).toBe('MY UNIVERSITY');
    expect(regDash.kpis.some(k => k.kpiId === 'kpi-reg-institutes')).toBe(true);

    const hoiDash = dashboardKpiService.getDashboardForUser(hoiContext);
    expect(hoiDash.scopeLabel).toBe('MY INSTITUTE');
    expect(hoiDash.kpis.some(k => k.kpiId === 'kpi-hoi-departments')).toBe(true);

    const hodDash = dashboardKpiService.getDashboardForUser(hodCseContext);
    expect(hodDash.scopeLabel).toBe('MY DEPARTMENT');
    expect(hodDash.kpis.some(k => k.kpiId === 'kpi-hod-students')).toBe(true);
  });
});
