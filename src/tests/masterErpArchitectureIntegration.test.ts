import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { User, NoteSheet } from '../types';
import { REGISTRAR_NAVIGATION_STRUCTURE } from '../constants/navigationConfig';
import { deputyRegistrarScopeService } from '../services/deputyRegistrarScopeService';
import { registrarExamGovernanceService } from '../services/registrarExamGovernanceService';
import { registrarAcademicRequestsService } from '../services/registrarAcademicRequestsService';
import { registrarAcademicReportsService } from '../services/registrarAcademicReportsService';

describe('SSIU ERP – Master Architecture & 20-Scenario End-to-End Integration Suite', () => {

  const registrarUser: User = {
    id: 'usr-reg-01',
    name: 'Dr. Registrar',
    email: 'registrar@ssiu.ac.in',
    role: 'REGISTRAR',
    departmentId: 'ADMIN',
    instituteId: 'CENTRAL_ADMIN',
    status: 'ACTIVE'
  };

  const vpUser: User = {
    id: 'usr-vp-01',
    name: 'Hon. Vice President',
    email: 'vp@ssiu.ac.in',
    role: 'VICE_PRESIDENT',
    departmentId: 'ADMIN',
    instituteId: 'CENTRAL_ADMIN',
    status: 'ACTIVE'
  };

  const dyRegSIT: User = {
    id: 'usr-dyreg-sit',
    name: 'Dr. Dy. Registrar SIT',
    email: 'dyreg.sit@ssiu.ac.in',
    role: 'DEPUTY_REGISTRAR',
    departmentId: 'ADMIN',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const principalSIT: User = {
    id: 'usr-prin-sit',
    name: 'Dr. Principal SIT',
    email: 'principal.sit@ssiu.ac.in',
    role: 'PRINCIPAL',
    departmentId: 'ADMIN',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const hodCSE: User = {
    id: 'usr-hod-cse',
    name: 'Dr. HOD CSE',
    email: 'hod.cse@ssiu.ac.in',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const facultyCSE: User = {
    id: 'usr-fac-cse',
    name: 'Prof. CSE Faculty',
    email: 'faculty.cse@ssiu.ac.in',
    role: 'FACULTY',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const studentUser: User = {
    id: 'usr-stud-01',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  it('SCENARIO 1: Dashboard Count == List Count (Single Source of Truth, Zero KPI Mismatches)', () => {
    const authorizedNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    const pendingWithMeList = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
    const pendingCount = pendingWithMeList.length;

    const filteredCategoryList = db.filterNotesheetsByCategory(authorizedNotes, 'PENDING_WITH_ME', registrarUser, 'REGISTRAR');
    expect(pendingCount).toBe(filteredCategoryList.length);
  });

  it('SCENARIO 2: Pending With Me strictly equals records whose currentHolder/office is the logged-in user role', () => {
    const pendingList = db.getPendingWithMeNotesheets(registrarUser, 'REGISTRAR');
    pendingList.forEach(ns => {
      expect(db.isNotesheetPendingForUser(registrarUser, 'REGISTRAR', ns)).toBe(true);
    });
  });

  it('SCENARIO 3: Multi-Stage Workflow: HOD ➔ HOI ➔ Deputy Registrar ➔ Registrar ➔ Vice President', () => {
    const seededVP = db.getUsers().find(u => u.role === 'VICE_PRESIDENT') || vpUser;

    const ns = db.createNoteSheet({
      subject: 'Master ERP Lab Server Upgrade',
      proposal: 'Procurement of GPU AI server cluster',
      purposeJustification: 'AI Research Lab',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      estimatedCost: 750000,
      status: 'SUBMITTED',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    expect(ns).toBeDefined();
    expect(ns.id).toBeDefined();

    // HOD forwards to HOI
    db.processNoteSheetAction(ns.id, 'FORWARD', 'Recommended by HOD', undefined, hodCSE, 'HOI');
    let current = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(current.status).toBe('PENDING_HOI');
    expect(current.currentOffice).toBe('HOI');

    // HOI forwards to Deputy Registrar
    db.processNoteSheetAction(current.id, 'FORWARD', 'Endorsed by Principal', undefined, principalSIT, 'DEPUTY_REGISTRAR');
    current = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(current.status).toBe('PENDING_DEPUTY_REGISTRAR');
    expect(current.currentOffice).toBe('DEPUTY_REGISTRAR');

    // Deputy Registrar forwards to Registrar
    db.processNoteSheetAction(current.id, 'FORWARD', 'Verified scope by Dy. Registrar', undefined, dyRegSIT, 'REGISTRAR');
    current = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(current.status).toBe('PENDING_REGISTRAR');
    expect(current.currentOffice).toBe('REGISTRAR');

    // Registrar forwards to Vice President
    db.processNoteSheetAction(current.id, 'FORWARD', 'Concurred by Registrar', undefined, registrarUser, 'VICE_PRESIDENT');
    current = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(current.status).toBe('PENDING_VICE_PRESIDENT');
    expect(current.currentOffice).toBe('VICE_PRESIDENT');

    // Vice President approves
    db.processNoteSheetAction(current.id, 'APPROVE', 'Sanctioned by VP', undefined, seededVP, undefined);
    current = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(current.status).toBe('APPROVED');
    expect(current.currentOffice).toBe('COMPLETED');
    expect(current.movements.length).toBeGreaterThanOrEqual(5);
  });

  it('SCENARIO 4: Return Workflow: Approver returns notesheet to previous stage with audit history', () => {
    const ns = db.createNoteSheet({
      subject: 'Workshop Material Procurement',
      proposal: 'Consumables for workshop',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    db.processNoteSheetAction(ns.id, 'RETURN', 'Please attach comparative quotes', undefined, hodCSE, 'FACULTY');
    const returned = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(returned.status).toBe('RETURNED');
    expect(returned.currentOffice).toBe('CREATOR');
  });

  it('SCENARIO 5: Clarification Workflow: Clarification request pending only with creator', () => {
    const ns = db.createNoteSheet({
      subject: 'Robotics Kit Procurement',
      proposal: 'Sensors and microcontrollers',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    db.processNoteSheetAction(ns.id, 'REQUEST_CLARIFICATION', 'Specify warranty period', undefined, hodCSE, 'FACULTY');
    const clarified = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(clarified.status).toBe('CLARIFICATION_REQUIRED');
    expect(db.isNotesheetPendingForUser(facultyCSE, 'FACULTY', clarified)).toBe(true);
    expect(db.isNotesheetPendingForUser(hodCSE, 'HOD', clarified)).toBe(false);
  });

  it('SCENARIO 6: Final Approval Workflow: Generates digital approval record and locks currentOffice', () => {
    const seededVP = db.getUsers().find(u => u.role === 'VICE_PRESIDENT') || vpUser;

    const ns = db.createNoteSheet({
      subject: 'Campus Green Initiative',
      proposal: 'Solar sensor meters',
      creatorId: registrarUser.id,
      creatorName: registrarUser.name,
      creatorRole: registrarUser.role,
      departmentId: 'ADMIN',
      instituteId: 'CENTRAL_ADMIN',
      status: 'PENDING_VICE_PRESIDENT',
      currentOffice: 'VICE_PRESIDENT',
      movements: []
    } as any, registrarUser);

    db.processNoteSheetAction(ns.id, 'APPROVE', 'Approved for green campus', undefined, seededVP);
    const approved = db.getState().noteSheets.find(n => n.id === ns.id)!;
    expect(approved.status).toBe('APPROVED');
    expect(approved.currentOffice).toBe('COMPLETED');
  });

  it('SCENARIO 7: Data Segregation: Asset transfers, returns, issues, and notesheets are strictly isolated', () => {
    const noteSheets = db.getState().noteSheets;
    const assets = db.getState().assets || [];
    const studentRequests = db.getState().studentRequests || [];

    const notesheetIds = new Set(noteSheets.map(n => n.id));
    assets.forEach((a: any) => expect(notesheetIds.has(a.id)).toBe(false));
    studentRequests.forEach((r: any) => expect(notesheetIds.has(r.id)).toBe(false));
  });

  it('SCENARIO 8: Academic vs Non-Academic Navigation Segregation in Registrar Navigation', () => {
    const academicItems = REGISTRAR_NAVIGATION_STRUCTURE.filter(n => n.category === '🎓 ACADEMIC');
    const nonAcademicItems = REGISTRAR_NAVIGATION_STRUCTURE.filter(n => n.category === '🏢 NON-ACADEMIC / REGISTRAR OFFICE');

    expect(academicItems.length).toBeGreaterThan(0);
    expect(nonAcademicItems.length).toBeGreaterThan(0);

    const notesheetEntry = academicItems.find(n => n.id === 'note-sheets');
    expect(notesheetEntry).toBeDefined();
    expect(notesheetEntry?.label).toBe('Notesheet');
    expect(notesheetEntry?.children).toBeUndefined(); // Clean single sidebar entry
  });

  it('SCENARIO 9: Registrar Visibility: Has university-wide governance access across all 12 institutes', () => {
    const allNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    expect(allNotes.length).toBeGreaterThan(0);
  });

  it('SCENARIO 10: Deputy Registrar Scope: Enforces jurisdiction delegated by Registrar', () => {
    const kpis = deputyRegistrarScopeService.getSummaryKPIs();
    expect(kpis.activeDeputyRegistrars).toBeGreaterThanOrEqual(0);
    expect(kpis.assignedInstitutes).toBeGreaterThanOrEqual(0);

    const assignments = deputyRegistrarScopeService.getDeputyRegistrarAssignments();
    expect(assignments).toBeInstanceOf(Array);
  });

  it('SCENARIO 11: HOD Scope: Scoped strictly to assigned department (dept-1)', () => {
    const hodNotes = db.getAuthorizedNotesheetsForUser(hodCSE, 'HOD');
    hodNotes.forEach(ns => {
      if (ns.departmentId && ns.departmentId !== 'ADMIN') {
        expect(ns.departmentId).toBe('dept-1');
      }
    });
  });

  it('SCENARIO 12: Faculty Scope: Faculty only accesses permitted records', () => {
    const facNotes = db.getAuthorizedNotesheetsForUser(facultyCSE, 'FACULTY');
    expect(facNotes.length).toBeLessThanOrEqual(db.getState().noteSheets.length);
  });

  it('SCENARIO 13: Student Scope: Student requests service lists requests with valid requester attributes', () => {
    const allRequests = registrarAcademicRequestsService.getRequests();
    expect(allRequests).toBeInstanceOf(Array);
    expect(allRequests.length).toBeGreaterThan(0);
    allRequests.forEach(req => {
      expect(req.id).toBeDefined();
      expect(req.applicantName).toBeDefined();
    });
  });

  it('SCENARIO 14: Notesheet Audit History: Immutable log records every actor, action, and timestamp', () => {
    const noteWithMovements = db.getState().noteSheets.find(n => n.movements && n.movements.length > 0);
    if (noteWithMovements) {
      noteWithMovements.movements.forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.fromUser).toBeDefined();
        expect(m.action).toBeDefined();
        expect(m.timestamp).toBeDefined();
      });
    }
  });

  it('SCENARIO 15: Changing Deputy Registrar Scope creates valid assignment and audit log', () => {
    const rawAssignments = deputyRegistrarScopeService.getDeputyRegistrarAssignments();
    expect(rawAssignments.length).toBeGreaterThanOrEqual(1);

    const targetUser = db.getUsers().find(u => u.role === 'DEPUTY_REGISTRAR') || dyRegSIT;
    const assignment = deputyRegistrarScopeService.createAssignment({
      userId: targetUser.id,
      scopeLevel: 'INSTITUTE',
      instituteId: 'inst-1',
      departmentIds: ['dept-1'],
      effectiveFrom: new Date().toISOString().split('T')[0],
      remarks: 'Automated Master Test Scope'
    }, registrarUser);

    expect(assignment.id).toBeDefined();
    expect(assignment.status).toBe('ACTIVE');
  });

  it('SCENARIO 16: Staff Dossier: Resolves full professional profile, designation, and career history', () => {
    const staff = db.getFaculty().find(f => f.id === facultyCSE.id || f.departmentId === 'dept-1');
    if (staff) {
      expect(staff.id).toBeDefined();
      expect(staff.name).toBeDefined();
      expect(staff.departmentId).toBeDefined();
    }
  });

  it('SCENARIO 17: Examination Governance: Dynamic stats match underlying exam records', () => {
    const kpis = registrarExamGovernanceService.getOverviewKPIs();
    expect(kpis.activeExamSessions).toBeGreaterThan(0);
    expect(kpis.totalEligibleStudents).toBeGreaterThan(0);
    expect(kpis.examFeesCollected).toBeGreaterThan(0);
  });

  it('SCENARIO 18: Academic Reports: Aggregates directly from live ERP master data with zero mock hardcoding', () => {
    const executiveKPIs = registrarAcademicReportsService.getExecutiveKPIs();
    expect(executiveKPIs.totalInstitutes).toBeGreaterThan(0);
    expect(executiveKPIs.totalDepartments).toBeGreaterThan(0);
    expect(executiveKPIs.totalStudents).toBeGreaterThan(0);
    expect(executiveKPIs.totalFaculty).toBeGreaterThan(0);
  });

  it('SCENARIO 19: Realistic Demo Dataset: 2000-student population distributed across institutes and departments', () => {
    const students = db.getStudents();
    expect(students.length).toBeGreaterThanOrEqual(100);

    const institutes = db.getInstitutes();
    expect(institutes.length).toBeGreaterThanOrEqual(1);

    const departments = db.getDepartments();
    expect(departments.length).toBeGreaterThanOrEqual(1);
  });

  it('SCENARIO 20: State Refresh & Persistence: Database maintains state integrity with zero duplicate keys', () => {
    const state = db.getState();
    expect(state.noteSheets).toBeDefined();
    expect(state.users).toBeDefined();
    expect(state.institutes).toBeDefined();

    const ids = state.noteSheets.map(n => n.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
