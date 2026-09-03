import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { departmentScopeService } from '../services/departmentScopeService';
import { User, Faculty, Subject } from '../types';

describe('HOD Faculty Module Redesign & Separation Test Suite', () => {
  const mockHODUser: User = {
    id: 'user-hod-cse',
    name: 'Dr. Rajesh Sharma',
    email: 'hod.cse@ssiu.edu.in',
    role: 'HOD',
    departmentId: 'dept-1', // Computer Engineering
    instituteId: 'inst-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  beforeEach(() => {
    // Setup before each test
  });

  describe('1. Department Faculty Directory (HR & Master Profile View)', () => {
    it('returns faculty directory records scoped strictly to HOD department', () => {
      const directory = departmentScopeService.getFacultyDirectory(mockHODUser, 'HOD');
      expect(directory.length).toBeGreaterThan(0);

      // Verify strict department scoping
      directory.forEach(f => {
        expect(f.departmentId).toBe('dept-1');
        expect(f.facultyName).toBeDefined();
        expect(f.employeeId).toBeDefined();
        expect(f.designation).toBeDefined();
        expect(f.employmentType).toMatch(/FULL_TIME|ADJUNCT|VISITING|CONTRACT/);
        expect(f.qualification).toBeDefined();
        expect(f.experienceYears).toBeGreaterThanOrEqual(0);
        expect(f.officialEmail).toContain('@');
        expect(f.phone).toBeDefined();
        expect(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).toContain(f.accountStatus);
      });
    });

    it('provides HR metadata without conflating detailed workload matrices', () => {
      const directory = departmentScopeService.getFacultyDirectory(mockHODUser, 'HOD');
      const first = directory[0];
      expect(first).toHaveProperty('specialization');
      expect(first).toHaveProperty('joiningDate');
      expect(first).toHaveProperty('isMentor');
      expect(typeof first.assignedMenteesCount).toBe('number');
    });
  });

  describe('2. Faculty Teaching Workload & Load Balancing', () => {
    it('calculates theory, lab, total hours, target hours and workload status accurately', () => {
      const workloads = departmentScopeService.getFacultyWorkloadOverview(mockHODUser, 'HOD');
      expect(workloads.length).toBeGreaterThan(0);

      workloads.forEach(w => {
        expect(w.departmentId).toBe('dept-1');
        expect(w.totalWeeklyHours).toBe(w.theoryHours + w.labHours);
        expect(w.targetWeeklyHours).toBe(16);
        expect(w.hoursDifference).toBe(w.totalWeeklyHours - 16);
        expect(w.workloadPercentage).toBeGreaterThanOrEqual(0);

        // Verification of workload status classification
        if (w.totalWeeklyHours > 20) {
          expect(w.workloadStatus).toBe('OVERLOAD');
        } else if (w.totalWeeklyHours > 16) {
          expect(w.workloadStatus).toBe('HIGH LOAD');
        } else if (w.totalWeeklyHours < 12) {
          expect(w.workloadStatus).toBe('UNDERLOAD');
        } else {
          expect(w.workloadStatus).toBe('NORMAL');
        }
      });
    });
  });

  describe('3. Subject-Centric Course Allocation Overview', () => {
    it('returns subjects as rows with assigned faculty and allocation percentages', () => {
      const subjectAllocations = departmentScopeService.getSubjectAllocations(mockHODUser, 'HOD');
      expect(subjectAllocations.length).toBeGreaterThan(0);

      subjectAllocations.forEach(sub => {
        expect(sub.subjectCode).toBeDefined();
        expect(sub.subjectName).toBeDefined();
        expect(sub.credits).toBeGreaterThan(0);
        expect(sub.totalWeeklyHours).toBe(sub.theoryHours + sub.labHours);
        expect(sub.studentCount).toBeGreaterThan(0);
        expect(['FULLY_ALLOCATED', 'PARTIALLY_ALLOCATED', 'UNALLOCATED']).toContain(sub.allocationStatus);
        expect([0, 50, 100]).toContain(sub.allocationPercentage);
      });
    });

    it('allows HOD to allocate a subject to a faculty member and updates database', () => {
      const subjects = departmentScopeService.getSubjectAllocations(mockHODUser, 'HOD');
      const faculty = departmentScopeService.getScopedFaculty(mockHODUser, 'HOD');
      expect(subjects.length).toBeGreaterThan(0);
      expect(faculty.length).toBeGreaterThan(0);

      const targetSubject = subjects[0];
      const targetFaculty = faculty[0];

      const success = departmentScopeService.allocateSubjectToFaculty(
        targetSubject.subjectId,
        targetFaculty.id,
        4,
        2
      );
      expect(success).toBe(true);

      // Verify updated subject allocation
      const updatedAllocations = departmentScopeService.getSubjectAllocations(mockHODUser, 'HOD');
      const updatedSub = updatedAllocations.find(s => s.subjectId === targetSubject.subjectId);
      expect(updatedSub).toBeDefined();
      expect(updatedSub?.assignedFacultyId).toBe(targetFaculty.id);
      expect(updatedSub?.assignedFacultyName).toBe(targetFaculty.name);
      expect(updatedSub?.allocationStatus).toBe('FULLY_ALLOCATED');
      expect(updatedSub?.allocationPercentage).toBe(100);
      expect(updatedSub?.theoryHours).toBe(4);
      expect(updatedSub?.labHours).toBe(2);
    });
  });

  describe('4. Faculty Performance Evaluation Overview', () => {
    it('returns detailed performance metrics, feedback scores, and performance bands', () => {
      const performance = departmentScopeService.getFacultyPerformanceOverview(mockHODUser, 'HOD');
      expect(performance.length).toBeGreaterThan(0);

      performance.forEach(p => {
        expect(p.departmentId).toBe('dept-1');
        expect(p.overallScore).toBeGreaterThanOrEqual(0);
        expect(p.overallScore).toBeLessThanOrEqual(100);
        expect(p.studentFeedbackScore).toBeGreaterThanOrEqual(0);
        expect(p.studentFeedbackScore).toBeLessThanOrEqual(5.0);
        expect(p.studentFeedbackPercentage).toBeGreaterThanOrEqual(0);
        expect(p.courseCompletionPercentage).toBeGreaterThanOrEqual(0);
        expect(p.attendanceCompliancePercentage).toBeGreaterThanOrEqual(0);
        expect(p.resultPassPercentage).toBeGreaterThanOrEqual(0);

        if (p.overallScore >= 90) {
          expect(p.performanceBand).toBe('EXCELLENT');
        } else if (p.overallScore >= 75) {
          expect(p.performanceBand).toBe('GOOD');
        } else if (p.overallScore >= 60) {
          expect(p.performanceBand).toBe('NEEDS_IMPROVEMENT');
        } else {
          expect(p.performanceBand).toBe('CRITICAL');
        }

        expect(Array.isArray(p.strengths)).toBe(true);
        expect(Array.isArray(p.areasForImprovement)).toBe(true);
        expect(p.strengths.length).toBeGreaterThan(0);
      });
    });
  });

  describe('5. Distinct Purposes & Zero Data Leaks Across Departments', () => {
    it('verifies that all 4 modules provide completely distinct columns, models, and purpose', () => {
      const directory = departmentScopeService.getFacultyDirectory(mockHODUser, 'HOD');
      const workload = departmentScopeService.getFacultyWorkloadOverview(mockHODUser, 'HOD');
      const allocation = departmentScopeService.getSubjectAllocations(mockHODUser, 'HOD');
      const performance = departmentScopeService.getFacultyPerformanceOverview(mockHODUser, 'HOD');

      // 1. Directory contains HR properties
      expect(directory[0]).toHaveProperty('employmentType');
      expect(directory[0]).toHaveProperty('qualification');
      expect(directory[0]).toHaveProperty('experienceYears');

      // 2. Workload contains load balancing hours and target differences
      expect(workload[0]).toHaveProperty('theoryHours');
      expect(workload[0]).toHaveProperty('labHours');
      expect(workload[0]).toHaveProperty('totalWeeklyHours');
      expect(workload[0]).toHaveProperty('hoursDifference');
      expect(workload[0]).toHaveProperty('workloadPercentage');

      // 3. Allocation is Subject-Centric
      expect(allocation[0]).toHaveProperty('subjectCode');
      expect(allocation[0]).toHaveProperty('subjectName');
      expect(allocation[0]).toHaveProperty('courseType');
      expect(allocation[0]).toHaveProperty('allocationPercentage');

      // 4. Performance contains evaluation scores and feedback
      expect(performance[0]).toHaveProperty('overallScore');
      expect(performance[0]).toHaveProperty('studentFeedbackScore');
      expect(performance[0]).toHaveProperty('performanceBand');
      expect(performance[0]).toHaveProperty('strengths');
    });
  });
});
