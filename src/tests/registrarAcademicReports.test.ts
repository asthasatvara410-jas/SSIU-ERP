import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { registrarAcademicReportsService } from '../services/registrarAcademicReportsService';

describe('SSIU ERP – Registrar Academic Reports & Analytics Module', () => {

  it('TEST 1: Executive KPIs should derive dynamically from actual ERP relational entities with zero hardcoding', () => {
    const kpis = registrarAcademicReportsService.getExecutiveKPIs();
    const rawInstitutes = db.getInstitutes();
    const rawDepartments = db.getDepartments();
    const rawPrograms = db.getPrograms();
    const rawStudents = db.getStudents();
    const rawFaculty = db.getFaculty();

    expect(kpis).toBeDefined();
    expect(kpis.totalInstitutes).toBe(rawInstitutes.length);
    expect(kpis.totalDepartments).toBe(rawDepartments.length);
    expect(kpis.totalPrograms).toBe(rawPrograms.length);
    expect(kpis.totalStudents).toBe(rawStudents.length);
    expect(kpis.totalFaculty).toBe(rawFaculty.length);
    expect(kpis.attendanceShortageCount).toBeGreaterThanOrEqual(0);
    expect(kpis.pendingAcademicRequests).toBeGreaterThanOrEqual(0);
  });

  it('TEST 2: Institute Performance Matrix should list all constituent institutes with valid SFR and metrics', () => {
    const institutes = registrarAcademicReportsService.getInstitutePerformanceList();
    const rawInstitutes = db.getInstitutes();

    expect(institutes.length).toBe(rawInstitutes.length);

    const firstInst = institutes[0];
    expect(firstInst.instituteId).toBeDefined();
    expect(firstInst.instituteName).toBeDefined();
    expect(firstInst.studentFacultyRatio).toContain('1:');
    expect(firstInst.attendancePct).toBeGreaterThan(0);
    expect(firstInst.examCandidates).toBeGreaterThan(0);
  });

  it('TEST 3: Department Performance Matrix should scope strictly by institute and department', () => {
    const rawDepts = db.getDepartments();
    const targetDept = rawDepts[0];

    const scopedList = registrarAcademicReportsService.getDepartmentPerformanceList({
      instituteId: targetDept.instituteId,
      departmentId: targetDept.id
    });

    expect(scopedList.length).toBe(1);
    expect(scopedList[0].departmentId).toBe(targetDept.id);
    expect(scopedList[0].instituteId).toBe(targetDept.instituteId);
    expect(scopedList[0].hodName).toBeDefined();
  });

  it('TEST 4: Program Performance Matrix should compute degree types and subject allocations', () => {
    const programs = registrarAcademicReportsService.getProgramPerformanceList();
    expect(programs.length).toBeGreaterThan(0);

    const sample = programs[0];
    expect(sample.programId).toBeDefined();
    expect(sample.programName).toBeDefined();
    expect(sample.durationYears).toBeGreaterThan(0);
    expect(sample.totalSubjects).toBeGreaterThan(0);
  });

  it('TEST 5: Scoped Student Academic Roster should filter strictly by institute and department', () => {
    const rawDepts = db.getDepartments();
    const targetDept = rawDepts[0];

    const studentList = registrarAcademicReportsService.getStudentAcademicRoster({
      instituteId: targetDept.instituteId,
      departmentId: targetDept.id
    });

    expect(studentList.length).toBeGreaterThanOrEqual(0);
    studentList.forEach(stu => {
      expect(stu.instituteId).toBe(targetDept.instituteId);
      expect(stu.departmentId).toBe(targetDept.id);
      expect(stu.academicStanding).toBeDefined();
      expect(stu.attendancePercentage).toBeGreaterThanOrEqual(0);
    });
  });

  it('TEST 6: Faculty Academic Roster should evaluate weekly workload and status accurately', () => {
    const facultyList = registrarAcademicReportsService.getFacultyAcademicRoster();
    expect(facultyList.length).toBeGreaterThan(0);

    facultyList.forEach(fac => {
      expect(fac.facultyId).toBeDefined();
      expect(fac.employeeId).toBeDefined();
      expect(fac.weeklyWorkloadHours).toBeGreaterThan(0);
      expect(['BALANCED', 'OVERLOADED', 'UNDERLOADED']).toContain(fac.workloadStatus);
    });
  });

  it('TEST 7: Academic Risk Early Warning Log should detect actionable anomalies with severity levels', () => {
    const risks = registrarAcademicReportsService.getAcademicRisks();
    expect(risks.length).toBeGreaterThan(0);

    risks.forEach(r => {
      expect(r.id).toBeDefined();
      expect(r.riskTitle).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).toContain(r.severity);
      expect(r.responsibleOfficer).toBeDefined();
      expect(r.actionRequired).toBeDefined();
    });
  });

  it('TEST 8: Strict Data Isolation: Academic reports do not leak into asset or work transfer modules', () => {
    const students = db.getStudents();
    const assets = db.getState().assets || [];
    const requisitions = db.getState().assetRequisitions || [];
    const workTransfers = db.getState().workTransfers || [];

    const studentIds = new Set(students.map(s => s.id));

    assets.forEach((a: any) => {
      expect(studentIds.has(a.id)).toBe(false);
    });

    requisitions.forEach((r: any) => {
      expect(studentIds.has(r.id)).toBe(false);
    });

    workTransfers.forEach((wt: any) => {
      expect(studentIds.has(wt.id)).toBe(false);
    });
  });
});
