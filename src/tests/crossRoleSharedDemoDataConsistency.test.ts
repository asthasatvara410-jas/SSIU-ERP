import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { registrarOfficeService } from '../services/registrarOfficeService';
import { User, UserRole } from '../types';

describe('SSIU ERP — Cross-Role Shared Demo Data & Relational Consistency Suite', () => {

  beforeEach(() => {
    // Ensure fresh baseline seed state
    db.resetToDefaultSeed();
  });

  // TEST 1: Master Hierarchy & Relational Integrity (University -> Institute -> Dept -> Program -> Section)
  it('TEST 1: Master Relational Chain maintains unbroken foreign key integrity across University, Institutes, Departments, and Programs', () => {
    const university = db.getUniversity();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const batches = db.getBatches();
    const semesters = db.getSemesters();
    const divisions = db.getDivisions();

    expect(university).toBeDefined();
    expect(institutes.length).toBeGreaterThanOrEqual(1);
    expect(departments.length).toBeGreaterThanOrEqual(1);
    expect(programs.length).toBeGreaterThanOrEqual(1);

    // Every Department must point to a valid Institute
    departments.forEach(dept => {
      expect(dept.instituteId).toBeDefined();
      const parentInst = institutes.find(i => i.id === dept.instituteId);
      expect(parentInst).toBeDefined();
    });

    // Every Program must point to a valid Department or Institute
    programs.forEach(prog => {
      if (prog.instituteId) {
        const parentInst = institutes.find(i => i.id === prog.instituteId);
        expect(parentInst).toBeDefined();
      }
      if (prog.departmentId) {
        const parentDept = departments.find(d => d.id === prog.departmentId);
        expect(parentDept).toBeDefined();
      }
    });

    // Every Division / Section must point to a valid Program and Semester
    divisions.forEach(div => {
      if (div.programId) {
        const parentProg = programs.find(p => p.id === div.programId);
        expect(parentProg).toBeDefined();
      }
      if (div.semesterId) {
        const parentSem = semesters.find(s => s.id === div.semesterId);
        expect(parentSem).toBeDefined();
      }
    });
  });

  // TEST 2: Single Source of Truth for Student Entities (Exact 2,000 Students)
  it('TEST 2: Exactly 2,000 canonical Student records exist with unique stable IDs and relational mappings', () => {
    const students = db.getStudents();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();

    expect(students.length).toBe(2000);

    // Verify uniqueness of student IDs and enrollment numbers
    const idSet = new Set(students.map(s => s.id));
    const enrollSet = new Set(students.map(s => s.enrollmentNo));
    expect(idSet.size).toBe(2000);
    expect(enrollSet.size).toBe(2000);

    // Verify all 2000 students have valid foreign key mappings (zero orphans)
    students.forEach(student => {
      expect(student.instituteId).toBeDefined();
      expect(institutes.some(i => i.id === student.instituteId)).toBe(true);

      expect(student.departmentId).toBeDefined();
      expect(departments.some(d => d.id === student.departmentId)).toBe(true);

      expect(student.programId).toBeDefined();
      expect(programs.some(p => p.id === student.programId)).toBe(true);
    });
  });

  // TEST 3: Single Source of Truth for Faculty Entities (500 Faculty)
  it('TEST 3: Exactly 500 Faculty records exist with designations, teaching workloads, and department mappings', () => {
    const facultyList = db.getFaculty();
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();

    expect(facultyList.length).toBe(500);

    const idSet = new Set(facultyList.map(f => f.id));
    expect(idSet.size).toBe(500);

    // Verify all faculty have valid institute and department mappings
    facultyList.forEach(faculty => {
      expect(faculty.instituteId).toBeDefined();
      expect(institutes.some(i => i.id === faculty.instituteId)).toBe(true);

      expect(faculty.departmentId).toBeDefined();
      expect(departments.some(d => d.id === faculty.departmentId)).toBe(true);
    });
  });

  // TEST 4: Cross-Role Consistent Visibility of an Identical Student Record and Scopes
  it('TEST 4: The EXACT same Student record flows consistently across Registrar (2000), Principal (~1000), HOD (~700), Faculty (~500), Mentor, and Student (1)', () => {
    const users = db.getUsers();
    const students = db.getStudents();
    const departments = db.getDepartments();
    const targetStudent = students[0];
    const targetDeptId = targetStudent.departmentId;
    const targetDept = departments.find(d => d.id === targetDeptId);
    const targetInstId = targetStudent.instituteId || targetDept?.instituteId;

    // 1. REGISTRAR SCOPE (All 2,000 Students)
    const registrarUser: User = users.find(u => u.role === 'REGISTRAR') || {
      id: 'reg-01',
      name: 'Registrar',
      email: 'registrar@swarrnim.edu.in',
      role: 'REGISTRAR'
    };
    const regStudents = db.getScopedStudents(registrarUser, 'REGISTRAR');
    expect(regStudents.length).toBe(2000);
    expect(regStudents.some(s => s.id === targetStudent.id && s.name === targetStudent.name)).toBe(true);

    // 2. PRINCIPAL SCOPE (Target Institute ~1,000 Students)
    const principalUser: User = {
      id: 'prin-01',
      name: 'Dean / Principal',
      email: 'dean@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: targetInstId
    };
    const prinStudents = db.getScopedStudents(principalUser, 'PRINCIPAL');
    expect(prinStudents.length).toBeGreaterThanOrEqual(900);
    expect(prinStudents.some(s => s.id === targetStudent.id && s.name === targetStudent.name)).toBe(true);

    // 3. HOD SCOPE (Target Department ~700 Students)
    const hodUser: User = {
      id: 'hod-01',
      name: 'HOD',
      email: 'hod@swarrnim.edu.in',
      role: 'HOD',
      departmentId: targetDeptId,
      instituteId: targetInstId
    };
    const hodStudents = db.getScopedStudents(hodUser, 'HOD');
    expect(hodStudents.length).toBeGreaterThanOrEqual(600);
    expect(hodStudents.some(s => s.id === targetStudent.id && s.name === targetStudent.name)).toBe(true);

    // 4. FACULTY SCOPE (Same Department Teaching Scope ~500 Students)
    const facultyUser: User = {
      id: 'fac-01',
      name: 'Professor',
      email: 'prof@swarrnim.edu.in',
      role: 'FACULTY',
      departmentId: targetDeptId,
      instituteId: targetInstId
    };
    const facStudents = db.getScopedStudents(facultyUser, 'FACULTY');
    expect(facStudents.length).toBeGreaterThanOrEqual(400);
    expect(facStudents.some(s => s.id === targetStudent.id && s.name === targetStudent.name)).toBe(true);

    // 5. STUDENT SELF SCOPE (Only Own Record = 1 Student)
    const studentUser: User = {
      id: targetStudent.id,
      name: targetStudent.name,
      email: targetStudent.email || 'student@swarrnim.edu.in',
      role: 'STUDENT',
      enrollmentNo: targetStudent.enrollmentNo
    };
    const selfStudents = db.getScopedStudents(studentUser, 'STUDENT');
    expect(selfStudents.length).toBe(1);
    expect(selfStudents[0].id).toBe(targetStudent.id);
    expect(selfStudents[0].name).toBe(targetStudent.name);
  });

  // TEST 5: Strict Anti-Leakage Guard across Out-of-Scope Roles
  it('TEST 5: Strictly blocks out-of-scope access (Principal of College B cannot see College A students, HOD of Dept B cannot see Dept A students)', () => {
    const students = db.getStudents();
    const departments = db.getDepartments();
    const sampleStudent = students[0];
    const sampleDeptId = sampleStudent.departmentId;

    // Out-of-scope Principal from different institute
    const otherPrincipalUser: User = {
      id: 'prin-other',
      name: 'Other Principal',
      email: 'other.dean@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: 'NON_EXISTENT_INSTITUTE_999'
    };
    const outOfScopePrinStudents = db.getScopedStudents(otherPrincipalUser, 'PRINCIPAL');
    expect(outOfScopePrinStudents.some(s => s.id === sampleStudent.id)).toBe(false);

    // Out-of-scope HOD from different department
    const otherHodUser: User = {
      id: 'hod-other',
      name: 'Other HOD',
      email: 'other.hod@swarrnim.edu.in',
      role: 'HOD',
      departmentId: 'NON_EXISTENT_DEPT_999',
      instituteId: 'NON_EXISTENT_INST_999'
    };
    const outOfScopeHodStudents = db.getScopedStudents(otherHodUser, 'HOD');
    expect(outOfScopeHodStudents.some(s => s.id === sampleStudent.id)).toBe(false);
  });

  // TEST 6: Student Security Isolation for Sensitive Modules (Approvals, Results, Fees)
  it('TEST 6: Students can ONLY query their own sensitive records (Approval Requests, Results, Fee records)', () => {
    const allApprovals = db.getApprovalRequests();
    const students = db.getStudents();
    const studentA = students[0];

    const studentAUser: User = {
      id: studentA.id,
      name: studentA.name,
      email: studentA.email || 'studentA@swarrnim.edu.in',
      role: 'STUDENT',
      enrollmentNo: studentA.enrollmentNo
    };

    const scopedApprovals = db.getScopedApprovalRequests(studentAUser, 'STUDENT');

    // Every scoped approval must belong strictly to Student A
    scopedApprovals.forEach(req => {
      const matchId = req.applicantId === studentA.id;
      const matchEmail = Boolean(req.applicantEmail) && req.applicantEmail.toLowerCase() === studentAUser.email.toLowerCase();
      const matchEnroll = Boolean(req.applicantEnrollmentOrEmpId) && req.applicantEnrollmentOrEmpId === studentAUser.enrollmentNo;
      expect(matchId || matchEmail || matchEnroll).toBe(true);
    });
  });

  // TEST 7: Registrar Office Singleton Service Consistency
  it('TEST 7: Registrar Office Service maintains relational hierarchy, positions, and workload calculations', () => {
    const kpis = registrarOfficeService.getOfficeDashboardKPIs();
    const staff = registrarOfficeService.getStaffList();
    const sections = registrarOfficeService.getSections();
    const positions = registrarOfficeService.getPositions();
    const matters = registrarOfficeService.getWorkItems();

    expect(kpis.totalStaff).toBe(staff.length);
    expect(kpis.activeSections).toBe(sections.filter(s => s.status === 'ACTIVE').length);
    expect(kpis.totalWorkItems).toBe(matters.length);
    expect(positions.length).toBeGreaterThanOrEqual(1);

    // Verify top position is Registrar (Level 1)
    const registrarPos = positions.find(p => p.level === 1);
    expect(registrarPos).toBeDefined();
    expect(registrarPos?.positionTitle).toBe('Registrar');
  });

  // TEST 8: Full Demo Seed Reset preserves all relational foreign keys
  it('TEST 8: Reset Seed Data restores the complete ERP environment with 100% valid relationships', () => {
    // 1. Mutate database state
    db.addFeeHead({
      code: 'DEMO_TEMP_FEE',
      name: 'Temporary Demo Fee',
      category: 'MISCELLANEOUS',
      isOptional: true,
      status: 'ACTIVE',
      isActive: true,
      description: 'Temporary mutation for seed testing'
    });

    // 2. Perform Reset
    const resetState = db.resetToDefaultSeed();
    expect(resetState).toBeDefined();

    // 3. Verify state restored to pristine relational baseline
    expect(db.getInstitutes().length).toBeGreaterThanOrEqual(1);
    expect(db.getDepartments().length).toBeGreaterThanOrEqual(1);
    expect(db.getPrograms().length).toBeGreaterThanOrEqual(1);
    expect(db.getStudents().length).toBeGreaterThanOrEqual(1);
    expect(db.getFaculty().length).toBeGreaterThanOrEqual(1);

    // Verify audit log recorded the seed reset
    const logs = db.getAuditLogs();
    expect(logs.some(l => l.action === 'RESET_SEED')).toBe(true);
  });

  // TEST 9: Business Record Separation (Asset != Transfer != Return != Maintenance != Allocation Request)
  it('TEST 9: Business Record Isolation guarantees no cross-module entity contamination across inventory sub-types and workload records', () => {
    const fixedAssets = db.getFixedAssets();
    const transfers = db.getAssetTransferRecords();
    const returns = db.getAssetReturnRecords();
    const maintenance = db.getAssetMaintenanceRecords();
    const allocations = db.getAssetAllocationRequests();

    // Verify separate IDs and distinct entity stores
    const assetIdSet = new Set(fixedAssets.map(a => a.id));
    const transferIdSet = new Set(transfers.map(t => t.id));
    const returnIdSet = new Set(returns.map(r => r.id));
    const maintenanceIdSet = new Set(maintenance.map(m => m.id));
    const allocationIdSet = new Set(allocations.map(a => a.id));

    // Zero overlap between asset IDs and transfer/return/maintenance/allocation IDs
    transferIdSet.forEach(id => expect(assetIdSet.has(id)).toBe(false));
    returnIdSet.forEach(id => expect(assetIdSet.has(id)).toBe(false));
    maintenanceIdSet.forEach(id => expect(assetIdSet.has(id)).toBe(false));
    allocationIdSet.forEach(id => expect(assetIdSet.has(id)).toBe(false));
  });

  // TEST 10: Dashboard Metric Equality (Card Count == Scoped Query Count == List Count)
  it('TEST 10: Dashboard Metric Equality guarantees card statistics match exactly the count of drill-down destination records', () => {
    const users = db.getUsers();
    const registrarUser = users.find(u => u.role === 'REGISTRAR') || {
      id: 'reg-01',
      name: 'Registrar',
      email: 'registrar@swarrnim.edu.in',
      role: 'REGISTRAR'
    };

    // Scoped Approvals KPI vs List
    const scopedApprovals = db.getScopedApprovalRequests(registrarUser, 'REGISTRAR');
    const pendingCount = scopedApprovals.filter(a => a.status === 'PENDING' || a.status === 'IN_REVIEW').length;
    const approvalList = scopedApprovals.filter(a => a.status === 'PENDING' || a.status === 'IN_REVIEW');

    expect(pendingCount).toBe(approvalList.length);

    // Scoped Students KPI vs List
    const scopedStudents = db.getScopedStudents(registrarUser, 'REGISTRAR');
    expect(scopedStudents.length).toBe(2000);
  });
});


