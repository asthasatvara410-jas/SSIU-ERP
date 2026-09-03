import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { departmentScopeService } from '../services/departmentScopeService';
import { User } from '../types';

describe('HOD Reports Module Separation & Data Integrity Suite', () => {
  const hodCSE: User = {
    id: 'user-hod-ce',
    name: 'Dr. Rajesh Patel',
    email: 'rajesh.patel@ssiu.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1' // Computer Engineering
  };

  const hodMech: User = {
    id: 'user-hod-me',
    name: 'Dr. Ramesh Joshi',
    email: 'ramesh.joshi@ssiu.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-2' // Mechanical Engineering
  };

  beforeEach(() => {
    // Fresh state for each test run
  });

  describe('1. Academic Reports (/hod-reports-academic)', () => {
    it('should generate academic performance data with correct KPIs and student standings', () => {
      const report = departmentScopeService.getDepartmentAcademicReport(hodCSE, 'HOD');

      expect(report.kpis).toBeDefined();
      expect(report.kpis.totalStudents).toBeGreaterThan(0);
      expect(report.kpis.averageCGPA).toBeGreaterThan(0);
      expect(report.kpis.averageCGPA).toBeLessThanOrEqual(10);
      expect(report.kpis.passPercentage).toBeGreaterThanOrEqual(0);
      expect(report.kpis.passPercentage).toBeLessThanOrEqual(100);

      // Verify students have academic metrics (SGPA, CGPA, Backlogs, Standing, Result Status)
      expect(report.students.length).toBe(report.kpis.totalStudents);
      const sample = report.students[0];
      expect(sample.studentId).toBeDefined();
      expect(sample.name).toBeDefined();
      expect(sample.enrollmentNo).toBeDefined();
      expect(sample.sgpa).toBeGreaterThan(0);
      expect(sample.cgpa).toBeGreaterThan(0);
      expect(['DISTINCTION', 'FIRST_CLASS', 'HIGHER_SECOND', 'PASS_CLASS', 'AT_RISK']).toContain(sample.academicStanding);
      expect(['PASSED', 'PROMOTED_WITH_BACKLOG', 'DETAINED']).toContain(sample.resultStatus);
      expect(['ELIGIBLE', 'PROVISIONAL', 'DETAINED']).toContain(sample.examEligibility);

      // Verify subject performance
      expect(report.subjectPerformance.length).toBeGreaterThan(0);
      expect(report.subjectPerformance[0].code).toBeDefined();
      expect(report.subjectPerformance[0].passPercentage).toBeGreaterThanOrEqual(0);

      // Verify grade distribution bands
      expect(report.gradeDistribution.length).toBe(5);
      const totalBandCount = report.gradeDistribution.reduce((sum, b) => sum + b.count, 0);
      expect(totalBandCount).toBe(report.kpis.totalStudents);
    });
  });

  describe('2. Attendance Reports (/hod-reports-attendance)', () => {
    it('should generate attendance monitoring data with shortage counts and monthly trends', () => {
      const report = departmentScopeService.getDepartmentAttendanceReport(hodCSE, 'HOD');

      expect(report.kpis).toBeDefined();
      expect(report.kpis.averageAttendance).toBeGreaterThan(0);
      expect(report.kpis.averageAttendance).toBeLessThanOrEqual(100);
      expect(report.kpis.below75Count).toBeGreaterThanOrEqual(0);
      expect(report.kpis.criticalShortageCount).toBeGreaterThanOrEqual(0);
      expect(report.kpis.totalRecordsCount).toBeGreaterThan(0);

      // Verify student attendance details
      expect(report.students.length).toBeGreaterThan(0);
      const sample = report.students[0];
      expect(sample.totalClasses).toBeGreaterThan(0);
      expect(sample.attendedClasses).toBeGreaterThanOrEqual(0);
      expect(sample.percentage).toBeGreaterThanOrEqual(0);
      expect(['SAFE', 'CONDONEABLE_SHORTAGE', 'CRITICAL_DEBARRED']).toContain(sample.shortageStatus);

      // Verify attendance brackets
      expect(report.attendanceBrackets.length).toBe(4);
      expect(report.monthlyTrend.length).toBe(4);
    });
  });

  describe('3. Student Reports (/hod-reports-student)', () => {
    it('should generate student master roster with demographics and program breakdown', () => {
      const report = departmentScopeService.getDepartmentStudentMasterReport(hodCSE, 'HOD');

      expect(report.kpis).toBeDefined();
      expect(report.kpis.totalStudents).toBeGreaterThan(0);
      expect(report.kpis.activeStudents).toBeGreaterThanOrEqual(0);
      expect(report.kpis.programsCount).toBeGreaterThan(0);

      // Verify student roster fields
      expect(report.students.length).toBe(report.kpis.totalStudents);
      const sample = report.students[0];
      expect(sample.name).toBeDefined();
      expect(sample.enrollmentNo).toBeDefined();
      expect(sample.programCode).toBeDefined();
      expect(sample.admissionBatch).toBeDefined();
      expect(sample.mentorName).toBeDefined();
      expect(['ACTIVE_REGULAR', 'ACADEMIC_PROBATION', 'AT_RISK', 'ON_LEAVE']).toContain(sample.academicStatus);

      // Verify program & section breakdowns
      expect(report.programBreakdown.length).toBeGreaterThan(0);
      expect(report.sectionBreakdown.length).toBeGreaterThan(0);
    });
  });

  describe('4. Faculty Reports (/hod-reports-faculty)', () => {
    it('should generate faculty workload and curriculum allocation data', () => {
      const report = departmentScopeService.getDepartmentFacultyReport(hodCSE, 'HOD');

      expect(report.kpis).toBeDefined();
      expect(report.kpis.totalFaculty).toBeGreaterThan(0);
      expect(report.kpis.averageWorkload).toBeGreaterThan(0);
      expect(report.kpis.totalWeeklyTeachingHours).toBeGreaterThan(0);

      // Verify faculty members
      expect(report.faculty.length).toBe(report.kpis.totalFaculty);
      const sample = report.faculty[0];
      expect(sample.facultyName).toBeDefined();
      expect(sample.employeeId).toBeDefined();
      expect(sample.totalWeeklyHours).toBe(sample.theoryHours + sample.labHours);
      expect(['UNDERLOAD', 'NORMAL', 'HIGH LOAD', 'OVERLOAD']).toContain(sample.workloadStatus);

      // Verify subject allocations
      expect(report.subjectAllocations.length).toBeGreaterThan(0);
      expect(report.workloadDistribution.length).toBe(4);
    });
  });

  describe('5. Department Reports (/hod-reports-department)', () => {
    it('should generate executive institutional KPIs and NAAC/NBA accreditation indicators', () => {
      const report = departmentScopeService.getDepartmentInstitutionalReport(hodCSE, 'HOD');

      expect(report.kpis).toBeDefined();
      expect(report.kpis.totalStudents).toBeGreaterThan(0);
      expect(report.kpis.totalFaculty).toBeGreaterThan(0);
      expect(report.kpis.facultyStudentRatio).toMatch(/^1:\d+$/);
      expect(report.kpis.examReadinessPercentage).toBeGreaterThan(0);

      // Verify accreditation metrics
      expect(report.accreditationMetrics.length).toBe(5);
      report.accreditationMetrics.forEach(m => {
        expect(m.category).toBeDefined();
        expect(m.indicator).toBeDefined();
        expect(m.benchmark).toBeDefined();
        expect(m.currentAchievement).toBeDefined();
        expect(['EXCEEDS', 'COMPLIANT', 'ATTENTION']).toContain(m.complianceStatus);
      });

      // Verify program & semester summaries
      expect(report.programSummaries.length).toBeGreaterThan(0);
      expect(report.semesterSummaries.length).toBeGreaterThan(0);
    });
  });

  describe('6. Department Data Isolation & Security Scoping', () => {
    it('should strictly isolate CSE and Mechanical department report data', () => {
      const cseReport = departmentScopeService.getDepartmentStudentMasterReport(hodCSE, 'HOD');
      const mechReport = departmentScopeService.getDepartmentStudentMasterReport(hodMech, 'HOD');

      // CSE student IDs should not be in Mechanical department report
      const cseStudentIds = new Set(cseReport.students.map(s => s.studentId));
      mechReport.students.forEach(mechStudent => {
        expect(cseStudentIds.has(mechStudent.studentId)).toBe(false);
      });
    });
  });
});
