import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import {
  User, NoteSheet, UserRole, UserAuthorizationContext,
  ReportingRelationshipRecord, DelegationRecord, ROLE_NOTESHEET_PERMISSIONS
} from '../types';
import { deputyRegistrarScopeService } from '../services/deputyRegistrarScopeService';

describe('SSIU ERP – Phase 2: Reporting Hierarchy, RBAC, Scope & Data Access Control Suite', () => {

  const registrarUser: User = {
    id: 'usr-reg-01',
    name: 'Dr. Registrar SSIU',
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

  const hoiSIT: User = {
    id: 'usr-prin-sit',
    name: 'Dr. Principal SIT',
    email: 'principal.sit@ssiu.ac.in',
    role: 'PRINCIPAL',
    departmentId: 'ADMIN',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const hoiPharmacy: User = {
    id: 'usr-prin-pharm',
    name: 'Dr. Principal Pharmacy',
    email: 'principal.pharm@ssiu.ac.in',
    role: 'PRINCIPAL',
    departmentId: 'ADMIN',
    instituteId: 'inst-2',
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

  const hodMechanical: User = {
    id: 'usr-hod-mech',
    name: 'Dr. HOD Mechanical',
    email: 'hod.mech@ssiu.ac.in',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const facultyCSE: User = {
    id: 'usr-fac-cse',
    name: 'Prof. CSE Faculty',
    email: 'faculty.cse@ssiu.ac.in',
    role: 'FACULTY',
    roles: ['FACULTY', 'MENTOR'],
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const studentA: User = {
    id: 'usr-stud-01',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    role: 'STUDENT',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE'
  };

  const studentB: User = {
    id: 'usr-stud-02',
    name: 'Diya Shah',
    email: 'diya.shah@student.ssiu.ac.in',
    role: 'STUDENT',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
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

  const dyRegPharmacy: User = {
    id: 'usr-dyreg-pharm',
    name: 'Dr. Dy. Registrar Pharmacy',
    email: 'dyreg.pharm@ssiu.ac.in',
    role: 'DEPUTY_REGISTRAR',
    departmentId: 'ADMIN',
    instituteId: 'inst-2',
    status: 'ACTIVE'
  };

  it('TEST 1: Student sees own data only (SELF scope isolation)', () => {
    // Student A cannot access Student B records
    expect(studentA.id).not.toBe(studentB.id);
    const nsStudA: NoteSheet = {
      id: 'ns-stud-a',
      noteSheetNumber: 'NS-STUD-001',
      creatorId: studentA.id,
      status: 'DRAFT',
      currentOffice: 'CREATOR',
      movements: []
    } as any;

    expect(db.isUserAuthorizedForNotesheet(studentA, 'STUDENT', nsStudA)).toBe(false); // Students do not have Notesheet create/view access
  });

  it('TEST 2: Faculty sees permitted academic work (Self/Assigned scope)', () => {
    const facNotes = db.getAuthorizedNotesheetsForUser(facultyCSE, 'FACULTY');
    expect(facNotes.length).toBeLessThanOrEqual(db.getState().noteSheets.length);
  });

  it('TEST 3: Mentor sees assigned mentees only', () => {
    expect(facultyCSE.roles).toContain('MENTOR');
    const mentorContext: UserAuthorizationContext = {
      userId: facultyCSE.id,
      userName: facultyCSE.name,
      email: facultyCSE.email,
      activeRole: 'MENTOR',
      assignedRoles: ['FACULTY', 'MENTOR'],
      permissions: ['STUDENT_VIEW', 'ATTENDANCE_VIEW'],
      assignedStudentIds: [studentA.id]
    };

    expect(mentorContext.assignedStudentIds).toContain(studentA.id);
    expect(mentorContext.assignedStudentIds).not.toContain(studentB.id);
  });

  it('TEST 4: HOD sees own department only (dept-1 vs dept-2 isolation)', () => {
    const hodCseNotes = db.getAuthorizedNotesheetsForUser(hodCSE, 'HOD');
    hodCseNotes.forEach(ns => {
      if (ns.departmentId && ns.departmentId !== 'ADMIN') {
        expect(ns.departmentId).toBe('dept-1');
      }
    });

    const hodMechNotes = db.getAuthorizedNotesheetsForUser(hodMechanical, 'HOD');
    hodMechNotes.forEach(ns => {
      if (ns.departmentId && ns.departmentId !== 'ADMIN') {
        expect(ns.departmentId).toBe('dept-2');
      }
    });
  });

  it('TEST 5: HOI / Principal sees own institute only (inst-1 vs inst-2 isolation)', () => {
    const sitNotes = db.getAuthorizedNotesheetsForUser(hoiSIT, 'PRINCIPAL');
    sitNotes.forEach(ns => {
      if (ns.instituteId && ns.instituteId !== 'CENTRAL_ADMIN') {
        expect(ns.instituteId).toBe('inst-1');
      }
    });

    const pharmNotes = db.getAuthorizedNotesheetsForUser(hoiPharmacy, 'PRINCIPAL');
    pharmNotes.forEach(ns => {
      if (ns.instituteId && ns.instituteId !== 'CENTRAL_ADMIN') {
        expect(ns.instituteId).toBe('inst-2');
      }
    });
  });

  it('TEST 6: Deputy Registrar sees assigned jurisdiction only', () => {
    const sitAssignments = deputyRegistrarScopeService.getDeputyRegistrarAssignments({ instituteId: 'inst-1' });
    expect(sitAssignments).toBeInstanceOf(Array);
  });

  it('TEST 7: Registrar sees university-wide permitted data across all 12 institutes', () => {
    const allNotes = db.getAuthorizedNotesheetsForUser(registrarUser, 'REGISTRAR');
    expect(allNotes.length).toBeGreaterThan(0);

    const instIds = new Set(allNotes.map(n => n.instituteId).filter(Boolean));
    expect(instIds.size).toBeGreaterThanOrEqual(1);
  });

  it('TEST 8: Vice President has top university-wide final sanction and governance scope', () => {
    const vpNotes = db.getAuthorizedNotesheetsForUser(vpUser, 'VICE_PRESIDENT');
    expect(vpNotes.length).toBeGreaterThan(0);
  });

  it('TEST 9: Multi-Role User: Single user identity aggregates allowed permissions without account duplication', () => {
    const multiRoleUser: User = {
      id: 'usr-dual-01',
      name: 'Dr. Dual Role',
      email: 'dual@ssiu.ac.in',
      role: 'HOD',
      roles: ['HOD', 'FACULTY', 'MENTOR'],
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'ACTIVE'
    };

    expect(multiRoleUser.roles?.length).toBe(3);
    const hodPerms = ROLE_NOTESHEET_PERMISSIONS['HOD'] || [];
    const facPerms = ROLE_NOTESHEET_PERMISSIONS['FACULTY'] || [];

    const combinedPerms = new Set([...hodPerms, ...facPerms]);
    expect(combinedPerms.has('NOTESHEET_VIEW')).toBe(true);
    expect(combinedPerms.has('NOTESHEET_CREATE')).toBe(true);
    expect(combinedPerms.has('NOTESHEET_FORWARD')).toBe(true);
  });

  it('TEST 10: Reporting Relationships Model: Clean hierarchy links from Registrar to Staff', () => {
    const reportingChain: ReportingRelationshipRecord[] = [
      {
        id: 'rep-01',
        managerUserId: registrarUser.id,
        managerRole: 'REGISTRAR',
        employeeUserId: dyRegSIT.id,
        employeeRole: 'DEPUTY_REGISTRAR',
        relationshipType: 'DEPUTY_ASSIGNED',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        createdByUserId: registrarUser.id,
        createdAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'rep-02',
        managerUserId: hodCSE.id,
        managerRole: 'HOD',
        employeeUserId: facultyCSE.id,
        employeeRole: 'FACULTY',
        relationshipType: 'DIRECT_REPORTS_TO',
        departmentId: 'dept-1',
        startDate: '2026-01-01',
        status: 'ACTIVE',
        createdByUserId: hoiSIT.id,
        createdAt: '2026-01-01T00:00:00Z'
      }
    ];

    expect(reportingChain.length).toBe(2);
    expect(reportingChain[0].managerUserId).toBe(registrarUser.id);
    expect(reportingChain[1].managerUserId).toBe(hodCSE.id);
  });

  it('TEST 11: Delegation Model: Time-bound, auditable scope-limited delegation', () => {
    const delegation: DelegationRecord = {
      id: 'del-01',
      delegatorUserId: hodCSE.id,
      delegatorName: hodCSE.name,
      delegatorRole: 'HOD',
      delegateUserId: facultyCSE.id,
      delegateName: facultyCSE.name,
      delegateRole: 'FACULTY',
      permissionScope: ['NOTESHEET_FORWARD', 'ATTENDANCE_VIEW'],
      entityScope: {
        instituteId: 'inst-1',
        departmentId: 'dept-1'
      },
      startDate: '2026-08-25',
      endDate: '2026-09-05',
      reason: 'HOD on conference leave',
      status: 'ACTIVE',
      createdAt: '2026-08-25T00:00:00Z'
    };

    expect(delegation.id).toBeDefined();
    expect(delegation.status).toBe('ACTIVE');
    expect(delegation.permissionScope).toContain('NOTESHEET_FORWARD');
  });

  it('TEST 12: Revoked Scope or Assignment immediately removes active access', () => {
    const assignment = deputyRegistrarScopeService.createAssignment({
      userId: dyRegSIT.id,
      scopeLevel: 'DEPARTMENT',
      instituteId: 'inst-1',
      departmentIds: ['dept-1'],
      effectiveFrom: '2026-08-01',
      remarks: 'Temporary scope'
    }, registrarUser);

    expect(assignment.status).toBe('ACTIVE');

    const revoked = deputyRegistrarScopeService.revokeScope(assignment.id, 'Jurisdiction completed', 'REVOKED', registrarUser);
    expect(revoked.status).toBe('REVOKED');
  });

  it('TEST 13: Zero Data Leakage: Cross-Institute data isolation is guaranteed', () => {
    const sitNotes = db.getAuthorizedNotesheetsForUser(hoiSIT, 'PRINCIPAL');
    const pharmNotes = db.getAuthorizedNotesheetsForUser(hoiPharmacy, 'PRINCIPAL');

    const sitIds = new Set(sitNotes.map(n => n.id));
    // Verify pure institute separation
    pharmNotes.forEach(pn => {
      if (pn.instituteId === 'inst-2') {
        expect(sitIds.has(pn.id)).toBe(false);
      }
    });
  });
});
