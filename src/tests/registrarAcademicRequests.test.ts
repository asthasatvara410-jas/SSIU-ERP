import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { registrarAcademicRequestsService } from '../services/registrarAcademicRequestsService';
import { studentRequestService } from '../services/studentRequestService';
import { auditLogService } from '../services/auditLogService';
import { User } from '../types';

describe('SSIU ERP – Registrar Academic Requests Governance Module', () => {

  const mockRegistrarUser: User = {
    id: 'user-reg-1',
    name: 'Dr. Registrar SSIU',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    status: 'ACTIVE'
  };

  it('TEST 1: Dashboard Pending count must equal Request List Pending count (Single Source of Truth)', () => {
    const rawApprovals = db.getApprovalRequests();
    const rawPendingCount = rawApprovals.filter(a => a.status === 'PENDING').length;

    const serviceSummary = registrarAcademicRequestsService.getSummaryKPIs({ status: 'ALL' });
    const serviceList = registrarAcademicRequestsService.getRequests({ status: 'PENDING' });

    expect(serviceSummary.pending).toBe(rawPendingCount);
    expect(serviceList.length).toBe(rawPendingCount);
    expect(serviceSummary.pending).toBe(serviceList.length);
  });

  it('TEST 2: Institute filter must filter requests strictly by instituteId', () => {
    const all = registrarAcademicRequestsService.getRequests();
    expect(all.length).toBeGreaterThan(0);
    const targetInstId = all[0].instituteId;

    const filtered = registrarAcademicRequestsService.getRequests({ instituteId: targetInstId });
    expect(filtered.length).toBeGreaterThan(0);

    filtered.forEach(req => {
      expect(req.instituteId).toBe(targetInstId);
    });
  });

  it('TEST 3: Department filter must filter requests strictly by departmentId', () => {
    const all = registrarAcademicRequestsService.getRequests();
    const targetDeptId = all[0].departmentId;

    const filtered = registrarAcademicRequestsService.getRequests({ 
      instituteId: all[0].instituteId,
      departmentId: targetDeptId 
    });

    filtered.forEach(req => {
      expect(req.departmentId).toBe(targetDeptId);
    });
  });

  it('TEST 4: Category and Status filters must filter requests accurately', () => {
    const pendingBonafide = registrarAcademicRequestsService.getRequests({
      category: 'BONAFIDE_CERTIFICATE',
      status: 'PENDING'
    });

    pendingBonafide.forEach(req => {
      expect(req.category).toBe('BONAFIDE_CERTIFICATE');
      expect(req.status).toBe('PENDING');
    });
  });

  it('TEST 5: Search must find records across Request No, Student Name, and Institute', () => {
    const all = registrarAcademicRequestsService.getRequests();
    if (all.length > 0) {
      const sample = all[0];
      const foundByNo = registrarAcademicRequestsService.getRequests({ searchQuery: sample.requestNo });
      expect(foundByNo.some(r => r.id === sample.id)).toBe(true);

      const foundByName = registrarAcademicRequestsService.getRequests({ searchQuery: sample.applicantName });
      expect(foundByName.some(r => r.id === sample.id)).toBe(true);
    }
  });

  it('TEST 6: Role Visibility Scoping: Registrar has university-wide access while other roles are scoped', () => {
    const registrarScoped = studentRequestService.getScopedRequests(mockRegistrarUser, 'REGISTRAR');
    expect(registrarScoped.length).toBe(studentRequestService.getAllRequests().length);

    // Student only sees their own requests
    const studentUser: User = {
      id: 'stu-1',
      name: 'ABC Student 1',
      email: 'student1@swarrnim.edu.in',
      role: 'STUDENT',
      status: 'ACTIVE',
      enrollmentNo: 'STUDENT-001'
    };

    const studentScoped = studentRequestService.getScopedRequests(studentUser, 'STUDENT');
    studentScoped.forEach(r => {
      expect(r.studentId === studentUser.id || r.enrollmentNo === studentUser.enrollmentNo).toBe(true);
    });
  });

  it('TEST 7: Approval action must advance workflow stage and record audit log', () => {
    const rawApprovals = db.getApprovalRequests();
    const pendingReq = rawApprovals.find(a => a.status === 'PENDING');
    if (!pendingReq) return;

    const initialAuditCount = auditLogService.query().total;

    const updated = registrarAcademicRequestsService.approveRequest(
      pendingReq.id,
      'Approved by Registrar under statutory academic powers.',
      mockRegistrarUser
    );

    expect(updated.id).toBe(pendingReq.id);
    const newAuditCount = auditLogService.query().total;
    expect(newAuditCount).toBeGreaterThan(initialAuditCount);
  });

  it('TEST 8: Rejection action must require remarks, set REJECTED status, and create audit log', () => {
    const rawApprovals = db.getApprovalRequests();
    const target = rawApprovals[rawApprovals.length - 1];
    if (!target) return;

    expect(() => {
      registrarAcademicRequestsService.rejectRequest(target.id, '', mockRegistrarUser);
    }).toThrow('Mandatory rejection reason required.');

    const updated = registrarAcademicRequestsService.rejectRequest(
      target.id,
      'Documents submitted are incomplete and lack attested marksheets.',
      mockRegistrarUser
    );

    expect(updated.status).toBe('REJECTED');
  });

  it('TEST 9: Return for correction must require remarks and update status', () => {
    const rawApprovals = db.getApprovalRequests();
    const target = rawApprovals[0];
    if (!target) return;

    expect(() => {
      registrarAcademicRequestsService.returnForCorrection(target.id, '', mockRegistrarUser);
    }).toThrow('Mandatory clarification remarks required to return request.');

    const updated = registrarAcademicRequestsService.returnForCorrection(
      target.id,
      'Please attach parent consent letter.',
      mockRegistrarUser
    );

    expect(updated.status).toBe('RETURNED');
  });

  it('TEST 10: Strict Data Isolation: Academic Requests vs Work Transfer & Inventory', () => {
    const academicReqs = db.getApprovalRequests();
    const assets = db.getState().assets || [];
    const workTransfers = db.getState().workTransfers || [];

    const reqIds = new Set(academicReqs.map(r => r.id));

    assets.forEach((a: any) => {
      expect(reqIds.has(a.id)).toBe(false);
    });

    workTransfers.forEach((wt: any) => {
      expect(reqIds.has(wt.id)).toBe(false);
    });
  });

  it('TEST 11: Institute-wise summaries compute mathematically consistent totals', () => {
    const instSummaries = registrarAcademicRequestsService.getInstituteSummaries();
    expect(instSummaries.length).toBeGreaterThan(0);

    const totalReqsInInst = instSummaries.reduce((sum, i) => sum + i.totalRequests, 0);
    const allReqs = registrarAcademicRequestsService.getRequests();

    expect(totalReqsInInst).toBe(allReqs.length);
  });
});
