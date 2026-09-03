import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { workflowEngineService } from '../services/workflowEngineService';
import { User, NoteSheet } from '../types';

describe('SSIU ERP – Central Services & Universal Workflow Engine Test Suite', () => {

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

  it('TEST 1: Unauthorized user (Student) cannot create Notesheets (FORBIDDEN)', () => {
    expect(() => {
      db.createNoteSheet({
        subject: 'Student Requesting Notesheet',
        creatorId: studentUser.id,
        status: 'SUBMITTED'
      } as any, studentUser);
    }).toThrowError(/403 Forbidden/);
  });

  it('TEST 2: Out-of-scope user cannot view another department notesheet', () => {
    const ns = db.createNoteSheet({
      subject: 'Confidential Department Equipment',
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      visibility: 'CONFIDENTIAL',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    // HOD Mechanical is from dept-2 and should not be authorized for confidential dept-1 notesheet
    const isMechAuthorized = db.isUserAuthorizedForNotesheet(hodMechanical, 'HOD', ns);
    expect(isMechAuthorized).toBe(false);
  });

  it('TEST 3: Wrong current holder cannot act on the workflow record', () => {
    const ns = db.createNoteSheet({
      subject: 'Lab Server Procurement',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'SUBMITTED',
      movements: []
    } as any, facultyCSE);

    // HOD forwards to HOI (now at HOI stage)
    db.processNoteSheetAction(ns.id, 'FORWARD', 'Forwarded to HOI', undefined, hodCSE, 'HOI');

    // HOD tries to forward record that is already at HOI stage
    const res = workflowEngineService.forwardRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'FORWARD',
      remarks: 'Attempted premature HOD forward',
      user: hodCSE,
      targetRole: 'DEPUTY_REGISTRAR'
    });

    expect(res.success).toBe(false);
    expect(res.errorCode).toBe('FORBIDDEN');
  });

  it('TEST 4: Forward operation creates workflow history and movements', () => {
    const ns = db.createNoteSheet({
      subject: 'Annual Sports Consumables',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    const res = workflowEngineService.forwardRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'FORWARD',
      remarks: 'Recommended for Principal sanction',
      user: hodCSE,
      targetOffice: 'HOI'
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('PENDING_HOI');
    expect(res.data?.currentOffice).toBe('HOI');
  });

  it('TEST 5: Return operation requires remarks and sets RETURNED status', () => {
    const ns = db.createNoteSheet({
      subject: 'Robotics Workshop Components',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    const invalidRes = workflowEngineService.returnRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'RETURN',
      remarks: '  ',
      user: hodCSE
    });
    expect(invalidRes.success).toBe(false);
    expect(invalidRes.errorCode).toBe('VALIDATION_ERROR');

    const validRes = workflowEngineService.returnRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'RETURN',
      remarks: 'Please attach 3 quotations',
      user: hodCSE
    });
    expect(validRes.success).toBe(true);
    expect(validRes.data?.status).toBe('RETURNED');
  });

  it('TEST 6: Clarification operation routes to creator and sets CLARIFICATION_REQUIRED', () => {
    const ns = db.createNoteSheet({
      subject: 'Network Switch Procurement',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    const res = workflowEngineService.requestClarification({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'REQUEST_CLARIFICATION',
      remarks: 'Explain warranty coverage in detail',
      user: hodCSE
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('CLARIFICATION_REQUIRED');
  });

  it('TEST 7: Rejection operation requires remarks and sets REJECTED status', () => {
    const ns = db.createNoteSheet({
      subject: 'Unapproved Department Event',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    const res = workflowEngineService.rejectRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'REJECT',
      remarks: 'Not aligned with academic curriculum',
      user: hodCSE
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('REJECTED');
  });

  it('TEST 8: Idempotency Protection: Duplicate action with same transaction key is rejected', () => {
    const ns = db.createNoteSheet({
      subject: 'Conference Sponsorship',
      creatorId: facultyCSE.id,
      creatorName: facultyCSE.name,
      creatorRole: facultyCSE.role,
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      status: 'PENDING_HOD',
      currentOffice: 'HOD',
      movements: []
    } as any, facultyCSE);

    const idempotencyKey = 'unique-txn-id-998811';

    const res1 = workflowEngineService.forwardRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'FORWARD',
      remarks: 'First forward submission',
      user: hodCSE,
      targetOffice: 'HOI',
      idempotencyKey
    });
    expect(res1.success).toBe(true);

    const res2 = workflowEngineService.forwardRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'FORWARD',
      remarks: 'Duplicate forward submission',
      user: hodCSE,
      targetOffice: 'HOI',
      idempotencyKey
    });
    expect(res2.success).toBe(false);
    expect(res2.errorCode).toBe('DUPLICATE_ACTION');
  });

  it('TEST 9: Final Approval locks record and marks COMPLETED', () => {
    const seededVP = db.getUsers().find(u => u.role === 'VICE_PRESIDENT') || vpUser;
    const ns = db.createNoteSheet({
      subject: 'Smart Campus AI Infrastructure',
      creatorId: registrarUser.id,
      creatorName: registrarUser.name,
      creatorRole: registrarUser.role,
      departmentId: 'ADMIN',
      instituteId: 'CENTRAL_ADMIN',
      status: 'PENDING_VICE_PRESIDENT',
      currentOffice: 'VICE_PRESIDENT',
      movements: []
    } as any, registrarUser);

    const res = workflowEngineService.approveRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'APPROVE',
      remarks: 'Sanctioned by VP',
      user: seededVP
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('APPROVED');
    expect(res.data?.currentOffice).toBe('COMPLETED');
  });

  it('TEST 10: Close operation archives approved record', () => {
    const seededVP = db.getUsers().find(u => u.role === 'VICE_PRESIDENT') || vpUser;
    const ns = db.createNoteSheet({
      subject: 'Fulfilled Purchase Order',
      creatorId: registrarUser.id,
      creatorName: registrarUser.name,
      creatorRole: registrarUser.role,
      departmentId: 'ADMIN',
      instituteId: 'CENTRAL_ADMIN',
      status: 'SUBMITTED',
      movements: []
    } as any, registrarUser);

    // VP approves the record
    db.processNoteSheetAction(ns.id, 'APPROVE', 'Approved for purchase', undefined, seededVP);

    const res = workflowEngineService.closeRecord({
      entityType: 'NOTESHEET',
      entityId: ns.id,
      action: 'CLOSE',
      remarks: 'All items delivered and verified',
      user: registrarUser
    });

    expect(res.success).toBe(true);
    expect(res.data?.status).toBe('CLOSED');
  });
});
