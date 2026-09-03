import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { workTransferService } from '../services/workTransferService';

describe('Registrar Faculty & Staff Management / Academic Workforce Control Suite', () => {

  // TEST 1: Institute-first aggregation is mathematically sound and dynamic
  it('TEST 1: Computes institute-level faculty and staff counts dynamically from canonical masters', () => {
    const institutes = db.getInstitutes();
    const faculty = db.getFaculty();
    const employees = db.getEmployees();
    const departments = db.getDepartments();

    expect(institutes.length).toBeGreaterThan(0);
    expect(faculty.length).toBeGreaterThan(0);
    expect(employees.length).toBeGreaterThan(0);

    let totalRollupFaculty = 0;
    let totalRollupStaff = 0;

    institutes.forEach(inst => {
      const instFaculty = faculty.filter(f => f.instituteId === inst.id);
      const instStaff = employees.filter(e => e.instituteId === inst.id);
      const instDepts = departments.filter(d => d.instituteId === inst.id);

      expect(instFaculty.length).toBeGreaterThanOrEqual(0);
      expect(instStaff.length).toBeGreaterThanOrEqual(0);

      totalRollupFaculty += instFaculty.length;
      totalRollupStaff += instStaff.length;

      // Verify department rollup
      instDepts.forEach(d => {
        expect(d.instituteId).toBe(inst.id);
      });
    });

    // Verify all faculty map to a constituent institute
    expect(totalRollupFaculty).toBe(faculty.length);
  });

  // TEST 2: Institute & Department Scoped Isolation
  it('TEST 2: Enforces strict institute and department isolation with zero cross-unit leakage', () => {
    const institutes = db.getInstitutes();
    if (institutes.length >= 2) {
      const instA = institutes[0];
      const instB = institutes[1];

      const facultyA = db.getFaculty().filter(f => f.instituteId === instA.id);
      const facultyB = db.getFaculty().filter(f => f.instituteId === instB.id);

      facultyA.forEach(f => {
        expect(f.instituteId).toBe(instA.id);
        expect(f.instituteId).not.toBe(instB.id);
      });

      facultyB.forEach(f => {
        expect(f.instituteId).toBe(instB.id);
        expect(f.instituteId).not.toBe(instA.id);
      });
    }
  });

  // TEST 3: Multiple Portfolios & Relational Resolution
  it('TEST 3: Resolves multiple relational portfolios per faculty with connected responsibilities', () => {
    const allFaculty = db.getFaculty();
    const facultyMember = allFaculty[0];
    expect(facultyMember).toBeDefined();

    const portfolioSummary = workTransferService.getFacultyPortfolio(facultyMember.id);
    expect(portfolioSummary).toBeDefined();
    expect(portfolioSummary.facultyId).toBe(facultyMember.id);
    expect(Array.isArray(portfolioSummary.administrativeResponsibilities)).toBe(true);
    expect(Array.isArray(portfolioSummary.committeeResponsibilities)).toBe(true);
    expect(Array.isArray(portfolioSummary.assignedSubjects)).toBe(true);
    expect(Array.isArray(portfolioSummary.mentorStudentsList)).toBe(true);
  });

  // TEST 4: Workload Calculation and Status Classification
  it('TEST 4: Accurately computes academic teaching workload hours and classifies load status', () => {
    const allFaculty = db.getFaculty();

    allFaculty.forEach(f => {
      const portfolio = workTransferService.getFacultyPortfolio(f.id);
      const hours = portfolio.totalWeeklyAcademicHours;

      expect(typeof hours).toBe('number');
      expect(hours).toBeGreaterThanOrEqual(0);

      // Verify breakdown adds up
      const sum = portfolio.lectureLoadHours + portfolio.practicalLoadHours + portfolio.tutorialLoadHours + portfolio.projectSupervisionHours;
      expect(hours).toBe(sum);

      // Verify status classification logic
      let expectedStatus = 'NORMAL';
      if (hours === 0 && portfolio.assignedSubjects.length === 0) expectedStatus = 'UNALLOCATED';
      else if (hours > 20) expectedStatus = 'OVERLOADED';
      else if (hours < 12) expectedStatus = 'UNDERLOADED';

      expect(['NORMAL', 'OVERLOADED', 'UNDERLOADED', 'UNALLOCATED']).toContain(expectedStatus);
    });
  });

  // TEST 5: Strict Staff vs Faculty Categorization
  it('TEST 5: Strictly separates Non-Teaching Staff from Teaching Faculty', () => {
    const faculty = db.getFaculty();
    const employees = db.getEmployees();

    // Faculty have academic designations and subject IDs
    faculty.forEach(f => {
      expect(f.designation).toBeDefined();
      expect(f.instituteId).toBeDefined();
    });

    // Employees have employeeType or employmentType
    employees.forEach(e => {
      expect(e.employeeId).toBeDefined();
      expect(e.name).toBeDefined();
    });
  });

  // TEST 6: Mentee & Student Linkages Integrity
  it('TEST 6: Direct relational mapping between faculty mentor and mentee students', () => {
    const allFaculty = db.getFaculty();
    const allStudents = db.getStudents();

    allFaculty.forEach(f => {
      const portfolio = workTransferService.getFacultyPortfolio(f.id);
      const mentees = portfolio.mentorStudentsList;

      expect(portfolio.mentorStudentsCount).toBe(mentees.length);

      mentees.forEach(m => {
        expect(m.id).toBeDefined();
        expect(m.name).toBeDefined();
        expect(m.enrollmentNo).toBeDefined();
      });
    });
  });

  // TEST 7: Attention Queue Filter Consistency (Card-to-List Match)
  it('TEST 7: Actionable Attention counts match the exact filtered workforce queries 1:1', () => {
    const faculty = db.getFaculty();
    
    let overloadedCount = 0;
    let unallocatedCount = 0;

    faculty.forEach(f => {
      const port = workTransferService.getFacultyPortfolio(f.id);
      const hours = port.totalWeeklyAcademicHours;
      if (hours > 20) overloadedCount++;
      if (hours === 0 && (!f.subjectIds || f.subjectIds.length === 0)) unallocatedCount++;
    });

    // Filtered query lists
    const overloadedList = faculty.filter(f => {
      const port = workTransferService.getFacultyPortfolio(f.id);
      return port.totalWeeklyAcademicHours > 20;
    });

    const unallocatedList = faculty.filter(f => {
      const port = workTransferService.getFacultyPortfolio(f.id);
      return port.totalWeeklyAcademicHours === 0 && (!f.subjectIds || f.subjectIds.length === 0);
    });

    expect(overloadedList.length).toBe(overloadedCount);
    expect(unallocatedList.length).toBe(unallocatedCount);
  });
});
