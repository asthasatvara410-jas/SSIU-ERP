import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { registrarExamGovernanceService } from '../services/registrarExamGovernanceService';

describe('SSIU ERP – Registrar Examination Governance Module', () => {

  it('TEST 1: Should compute real ERP-driven university overview KPIs with zero hardcoding', () => {
    const kpis = registrarExamGovernanceService.getOverviewKPIs();
    expect(kpis).toBeDefined();
    expect(kpis.activeExamSessions).toBeGreaterThan(0);
    expect(kpis.institutesWithActiveExams).toBeGreaterThan(0);
    expect(kpis.departmentsWithActiveExams).toBeGreaterThan(0);
    expect(kpis.totalEligibleStudents).toBeGreaterThan(0);
    expect(kpis.examFormsSubmitted).toBeGreaterThan(0);
    expect(kpis.examFormsSubmitted + kpis.examFormsPending).toBe(kpis.totalEligibleStudents);
    expect(kpis.examFeesCollected).toBeGreaterThan(0);
    expect(kpis.examFeesPending).toBeGreaterThanOrEqual(0);
    expect(kpis.examsSubjectsScheduled).toBeGreaterThan(0);
  });

  it('TEST 2: Should compute institute-wise examination summaries across all institutes', () => {
    const institutes = registrarExamGovernanceService.getInstituteSummaries();
    expect(institutes.length).toBeGreaterThan(0);

    const firstInst = institutes[0];
    expect(firstInst.instituteId).toBeDefined();
    expect(firstInst.instituteName).toBeDefined();
    expect(firstInst.totalDepartments).toBeGreaterThan(0);
    expect(firstInst.eligibleStudents).toBeGreaterThanOrEqual(0);
    expect(firstInst.formsSubmitted + firstInst.formsPending).toBe(firstInst.eligibleStudents);
  });

  it('TEST 3: Should compute department-wise examination control matrix', () => {
    const departments = registrarExamGovernanceService.getDepartmentSummaries();
    expect(departments.length).toBeGreaterThan(0);

    const firstDept = departments[0];
    expect(firstDept.departmentId).toBeDefined();
    expect(firstDept.departmentName).toBeDefined();
    expect(firstDept.instituteName).toBeDefined();
    expect(firstDept.totalSubjects).toBeGreaterThan(0);
    expect(firstDept.eligibleStudents).toBeGreaterThan(0);
    expect(firstDept.formsSubmitted + firstDept.formsPending).toBe(firstDept.eligibleStudents);
    expect(firstDept.examStatus).toBeDefined();
  });

  it('TEST 4: Should return subject-wise examination schedule and marks entry status for department drilldown', () => {
    const departments = db.getDepartments();
    const targetDept = departments[0];

    const subjects = registrarExamGovernanceService.getDepartmentSubjectDetails(targetDept.id);
    expect(subjects.length).toBeGreaterThan(0);

    const firstSub = subjects[0];
    expect(firstSub.subjectCode).toBeDefined();
    expect(firstSub.subjectName).toBeDefined();
    expect(firstSub.facultyName).toBeDefined();
    expect(firstSub.examDate).toBeDefined();
    expect(firstSub.marksStatus).toBeDefined();
  });

  it('TEST 5: Should scope student examination records strictly by institute and department', () => {
    const departments = db.getDepartments();
    const targetDept = departments[0];

    const scopedStudents = registrarExamGovernanceService.getScopedStudentExamList({
      instituteId: targetDept.instituteId,
      departmentId: targetDept.id
    });
    expect(scopedStudents.length).toBeGreaterThanOrEqual(0);

    scopedStudents.forEach(stu => {
      expect(stu.instituteId).toBe(targetDept.instituteId);
      expect(stu.departmentId).toBe(targetDept.id);
      expect(stu.feeStatus).toBeDefined();
      expect(stu.examFormStatus).toBeDefined();
      expect(stu.hallTicketNo).toBeDefined();
    });
  });

  it('TEST 6: Should detect dynamic examination risks, defaulters, and condonation requirements', () => {
    const risks = registrarExamGovernanceService.getExamRisks();
    expect(risks.length).toBeGreaterThan(0);

    risks.forEach(r => {
      expect(r.id).toBeDefined();
      expect(r.riskTitle).toBeDefined();
      expect(r.affectedStudentsCount).toBeGreaterThan(0);
      expect(r.severity).toBeDefined();
      expect(r.owner).toBeDefined();
    });
  });

  it('TEST 7: Should list statutory examination approvals pending at Registrar stage', () => {
    const approvals = registrarExamGovernanceService.getExamApprovals();
    expect(approvals.length).toBeGreaterThan(0);

    approvals.forEach(app => {
      expect(app.requestId).toBeDefined();
      expect(app.studentName).toBeDefined();
      expect(app.currentStage).toContain('Registrar');
      expect(app.status).toBe('PENDING');
    });
  });

  it('TEST 8: Should list central university examination schedules and filter by period', () => {
    const allSchedules = registrarExamGovernanceService.getExamSchedules({ period: 'ALL' });
    expect(allSchedules.length).toBeGreaterThan(0);

    const upcoming = registrarExamGovernanceService.getExamSchedules({ period: 'UPCOMING' });
    expect(upcoming.every(s => s.status === 'UPCOMING')).toBe(true);
  });

  it('TEST 9: Should guarantee Single Source of Truth consistency across views', () => {
    const overview = registrarExamGovernanceService.getOverviewKPIs();
    const instSummaries = registrarExamGovernanceService.getInstituteSummaries();

    const sumInstEligible = instSummaries.reduce((sum, i) => sum + i.eligibleStudents, 0);
    expect(sumInstEligible).toBe(overview.totalEligibleStudents);

    const sumInstSubmitted = instSummaries.reduce((sum, i) => sum + i.formsSubmitted, 0);
    expect(sumInstSubmitted).toBe(overview.examFormsSubmitted);
  });

  it('TEST 10: Strict Data Separation – Examination vs Asset & Transfer Records', () => {
    const exams = db.getExams();
    const forms = db.getExamForms();
    const assets = db.getState().assets || [];
    const requisitions = db.getState().assetRequisitions || [];

    // Verify disjoint IDs and types
    const examIds = new Set(exams.map(e => e.id));
    const formIds = new Set(forms.map(f => f.id));

    assets.forEach((a: any) => {
      expect(examIds.has(a.id)).toBe(false);
      expect(formIds.has(a.id)).toBe(false);
    });

    requisitions.forEach((r: any) => {
      expect(examIds.has(r.id)).toBe(false);
      expect(formIds.has(r.id)).toBe(false);
    });
  });
});
