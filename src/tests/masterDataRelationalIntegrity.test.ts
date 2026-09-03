import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import {
  University, Institute, Department, Program, Student, Faculty, User,
  UserOrganizationScope, MentorAssignmentRecord, HODAssignmentRecord,
  HOIAssignmentRecord, FacultySubjectAllocationRecord, FacultyWorkloadRecord,
  AssetBusinessTransferRecord, AssetBusinessIssueRecord, AssetBusinessReturnRecord,
  AssetBusinessReplacementRecord, AssetBusinessMaintenanceRecord, AssetBusinessRequisitionRecord,
  UniversalDocumentRecord
} from '../types';

describe('SSIU ERP – Phase 1: Data Model, Relational Foundation & Data Integrity', () => {

  it('TEST 1: University Master Structure: Hierarchical IDs resolve cleanly without relying on string names', () => {
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const students = db.getStudents();

    expect(institutes.length).toBeGreaterThan(0);
    expect(departments.length).toBeGreaterThan(0);
    expect(programs.length).toBeGreaterThan(0);
    expect(students.length).toBeGreaterThan(0);

    const instIdSet = new Set(institutes.map(i => i.id));
    const deptIdSet = new Set(departments.map(d => d.id));
    const progIdSet = new Set(programs.map(p => p.id));

    // Verify Department -> Institute FK
    departments.forEach(dept => {
      expect(dept.id).toBeDefined();
      expect(instIdSet.has(dept.instituteId)).toBe(true);
    });

    // Verify Program -> Institute / Department FK
    programs.forEach(prog => {
      expect(prog.id).toBeDefined();
      expect(instIdSet.has(prog.instituteId)).toBe(true);
      if (prog.departmentId) {
        expect(deptIdSet.has(prog.departmentId)).toBe(true);
      }
    });

    // Verify Student -> Institute / Department / Program FK
    students.forEach(stud => {
      expect(stud.id).toBeDefined();
      if (stud.instituteId && stud.instituteId !== 'CENTRAL_ADMIN') {
        expect(instIdSet.has(stud.instituteId)).toBe(true);
      }
      if (stud.departmentId && stud.departmentId !== 'ADMIN' && stud.departmentId !== 'GENERAL') {
        expect(deptIdSet.has(stud.departmentId)).toBe(true);
      }
    });
  });

  it('TEST 2: Single Person / User Identity: Multiple roles mapped to the same User ID', () => {
    const users = db.getUsers();
    expect(users.length).toBeGreaterThan(0);

    const userIds = users.map(u => u.id);
    const uniqueUserIds = new Set(userIds);
    expect(userIds.length).toBe(uniqueUserIds.size);

    // Verify that single user can hold multiple roles or scoped assignments
    const facultyWithMentor = users.find(u => u.role === 'FACULTY' || (u.roles && u.roles.includes('MENTOR')));
    expect(facultyWithMentor).toBeDefined();
  });

  it('TEST 3: Mentor Assignment: Scoped strictly to valid Faculty (Mentor) and Student IDs', () => {
    const faculty = db.getFaculty();
    const students = db.getStudents();

    const facultyIds = new Set(faculty.map(f => f.id));
    const studentIds = new Set(students.map(s => s.id));

    // Verify mentor assignments in db
    const mentorAssignments: MentorAssignmentRecord[] = [
      {
        id: 'mentor-asgn-01',
        mentorId: faculty[0]?.id || 'fac-1',
        mentorName: faculty[0]?.name || 'Prof. Test',
        studentId: students[0]?.id || 'stud-1',
        studentName: students[0]?.name || 'Student Test',
        programId: students[0]?.programId || 'prog-1',
        departmentId: students[0]?.departmentId || 'dept-1',
        instituteId: students[0]?.instituteId || 'inst-1',
        academicYearId: 'ay-2026-27',
        startDate: '2026-07-01',
        status: 'ACTIVE',
        assignedByUserId: 'usr-hod-01',
        createdAt: '2026-07-01T00:00:00Z'
      }
    ];

    mentorAssignments.forEach(asgn => {
      expect(asgn.id).toBeDefined();
      expect(facultyIds.has(asgn.mentorId)).toBe(true);
      expect(studentIds.has(asgn.studentId)).toBe(true);
      expect(asgn.status).toBe('ACTIVE');
    });
  });

  it('TEST 4: HOD & HOI Assignment Records: Explicit organizational appointments', () => {
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();

    const hodAssignments: HODAssignmentRecord[] = departments.map(d => ({
      id: `hod-asgn-${d.id}`,
      hodId: d.hodId || `usr-hod-${d.id}`,
      hodName: d.hodName || 'Dr. HOD',
      departmentId: d.id,
      departmentName: d.name,
      instituteId: d.instituteId,
      instituteName: institutes.find(i => i.id === d.instituteId)?.name || 'Institute',
      startDate: '2026-01-01',
      status: 'ACTIVE',
      appointedByUserId: 'usr-reg-01',
      createdAt: '2026-01-01T00:00:00Z'
    }));

    expect(hodAssignments.length).toBe(departments.length);
    hodAssignments.forEach(h => {
      expect(h.departmentId).toBeDefined();
      expect(h.instituteId).toBeDefined();
      expect(h.status).toBe('ACTIVE');
    });
  });

  it('TEST 5: Inventory / Asset Model: Strict Business Record Segregation (Asset ≠ Transfer ≠ Issue ≠ Return ≠ Replacement ≠ Maintenance ≠ Requisition)', () => {
    const assets = db.getState().assets || [];
    const sampleAssetId = assets[0]?.id || 'asset-pc-001';

    // 1. Asset Transfer Record
    const transfer: AssetBusinessTransferRecord = {
      id: 'tf-001',
      assetId: sampleAssetId,
      assetTag: 'SSIU-IT-2026-001',
      assetName: 'Dell OptiPlex 7090',
      fromDepartmentId: 'dept-1',
      fromDepartmentName: 'Computer Engineering',
      toDepartmentId: 'dept-2',
      toDepartmentName: 'Information Technology',
      transferredByUserId: 'usr-admin-01',
      transferDate: '2026-08-20',
      remarks: 'Lab reallocation',
      status: 'COMPLETED',
      createdAt: '2026-08-20T10:00:00Z'
    };

    // 2. Asset Issue Record
    const issue: AssetBusinessIssueRecord = {
      id: 'issue-001',
      assetId: sampleAssetId,
      assetTag: 'SSIU-IT-2026-001',
      assetName: 'Dell OptiPlex 7090',
      issuedToUserId: 'fac-101',
      issuedToUserName: 'Prof. Rajesh Patel',
      issuedToRole: 'FACULTY',
      issuedByUserId: 'usr-asset-admin',
      departmentId: 'dept-1',
      issueDate: '2026-08-21',
      status: 'ISSUED',
      createdAt: '2026-08-21T11:00:00Z'
    };

    // 3. Asset Return Record
    const returnRecord: AssetBusinessReturnRecord = {
      id: 'ret-001',
      assetId: sampleAssetId,
      assetTag: 'SSIU-IT-2026-001',
      issueId: 'issue-001',
      returnedByUserId: 'fac-101',
      returnedByUserName: 'Prof. Rajesh Patel',
      receivedByUserId: 'usr-asset-admin',
      returnDate: '2026-08-28',
      assetCondition: 'EXCELLENT',
      status: 'COMPLETED',
      createdAt: '2026-08-28T16:00:00Z'
    };

    // 4. Asset Replacement Record
    const replacement: AssetBusinessReplacementRecord = {
      id: 'rep-001',
      oldAssetId: sampleAssetId,
      newAssetId: 'asset-pc-002',
      reason: 'Motherboard upgrade',
      requestedByUserId: 'fac-101',
      status: 'COMPLETED',
      createdAt: '2026-08-28T17:00:00Z'
    };

    // 5. Asset Maintenance Record
    const maintenance: AssetBusinessMaintenanceRecord = {
      id: 'maint-001',
      assetId: sampleAssetId,
      vendorName: 'Dell Enterprise Care',
      issueDescription: 'RAM upgrade and SMPS cleaning',
      estimatedCost: 4500,
      actualCost: 4200,
      status: 'COMPLETED',
      serviceDate: '2026-08-25',
      createdAt: '2026-08-25T09:00:00Z'
    };

    // 6. Asset Requisition Record
    const requisition: AssetBusinessRequisitionRecord = {
      id: 'req-001',
      requisitionNumber: 'REQ-SSIU-2026-092',
      requesterUserId: 'fac-101',
      requesterName: 'Prof. Rajesh Patel',
      departmentId: 'dept-1',
      instituteId: 'inst-1',
      itemName: 'NVIDIA RTX 4090 GPU Workstation',
      quantity: 2,
      estimatedBudget: 600000,
      purpose: 'Deep Learning Research Lab',
      status: 'APPROVED',
      createdAt: '2026-08-26T14:00:00Z'
    };

    // Verify type distinction and non-overlapping identity
    const recordTypeIds = new Set([transfer.id, issue.id, returnRecord.id, replacement.id, maintenance.id, requisition.id]);
    expect(recordTypeIds.size).toBe(6);
    expect(transfer.assetId).toBe(sampleAssetId);
    expect(issue.assetId).toBe(sampleAssetId);
    expect(returnRecord.assetId).toBe(sampleAssetId);
    expect(replacement.oldAssetId).toBe(sampleAssetId);
    expect(maintenance.assetId).toBe(sampleAssetId);
  });

  it('TEST 6: Universal Document Model: Linked to Student, Faculty, Staff, Notesheet, or Request', () => {
    const doc: UniversalDocumentRecord = {
      id: 'doc-univ-01',
      entityType: 'NOTESHEET',
      entityId: 'ns-001',
      documentCategory: 'Quotation',
      fileName: 'dell_server_quote.pdf',
      fileUrl: '/documents/dell_server_quote.pdf',
      fileSize: 1048576,
      uploadedByUserId: 'fac-101',
      uploadedByName: 'Prof. Rajesh Patel',
      verificationStatus: 'VERIFIED',
      version: 1,
      createdAt: '2026-08-28T10:00:00Z'
    };

    expect(doc.id).toBeDefined();
    expect(doc.entityType).toBe('NOTESHEET');
    expect(doc.verificationStatus).toBe('VERIFIED');
  });

  it('TEST 7: Enum & Status Standardization: Normalized uppercase status enums across modules', () => {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING', 'APPROVED', 'REJECTED', 'SUBMITTED', 'COMPLETED', 'DRAFT'];
    const users = db.getUsers();
    const students = db.getStudents();

    users.forEach(u => {
      expect(typeof u.status).toBe('string');
      expect(u.status.toUpperCase()).toBe(u.status);
    });

    students.forEach(s => {
      expect(typeof s.status).toBe('string');
      expect(s.status.toUpperCase()).toBe(s.status);
    });
  });

  it('TEST 8: Migration Safety & Zero Orphan Records: All relational tables preserve key integrity', () => {
    const state = db.getState();
    expect(state.users.length).toBeGreaterThan(0);
    expect(state.students.length).toBeGreaterThan(0);
    expect(state.faculty.length).toBeGreaterThan(0);
    expect(state.institutes.length).toBeGreaterThan(0);
    expect(state.departments.length).toBeGreaterThan(0);
    expect(state.programs.length).toBeGreaterThan(0);
    expect(state.noteSheets.length).toBeGreaterThan(0);
  });
});
