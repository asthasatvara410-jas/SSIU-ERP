import { describe, it, expect } from 'vitest';
import { db } from '../services/db';
import { academicStructureService } from '../services/academicStructureService';

describe('SSIU ERP – Phase 8: Master Data & Academic Structure Engine', () => {

  it('TEST 1: Authoritative Academic Hierarchy: University ➔ Institute ➔ Department ➔ Program ➔ Batch ➔ Semester ➔ Subject Offering', () => {
    const institutes = db.getInstitutes();
    const departments = db.getDepartments();
    const programs = db.getPrograms();
    const batches = academicStructureService.getBatches();
    const subjects = academicStructureService.getSubjects();
    const offerings = academicStructureService.getSubjectOfferings();

    expect(institutes.length).toBeGreaterThan(0);
    expect(departments.length).toBeGreaterThan(0);
    expect(programs.length).toBeGreaterThan(0);
    expect(batches.length).toBeGreaterThan(0);
    expect(subjects.length).toBeGreaterThan(0);
    expect(offerings.length).toBeGreaterThan(0);
  });

  it('TEST 2: Subject Master ≠ Subject Offering: The same subject can have distinct offerings across Academic Years', () => {
    const allOfferings = academicStructureService.getSubjectOfferings();
    const dbmsOfferings = allOfferings.filter(o => o.subjectId === 'sub-dbms');

    expect(dbmsOfferings.length).toBeGreaterThanOrEqual(2);
    expect(dbmsOfferings.some(o => o.academicYearId === 'ay-2026-27' && o.status === 'ACTIVE')).toBe(true);
    expect(dbmsOfferings.some(o => o.academicYearId === 'ay-2025-26' && o.status === 'ARCHIVED')).toBe(true);
  });

  it('TEST 3: Batch Cohort ≠ Academic Year Session: Batch tracks 4-year intake while Academic Year tracks current operational term', () => {
    const batch = academicStructureService.getBatches()[0];
    const currentYear = academicStructureService.getCurrentAcademicYear();

    expect(batch.startYear).toBe(2026);
    expect(batch.endYear).toBe(2030);
    expect(currentYear.name).toBe('2026–2027');
    expect(currentYear.isCurrent).toBe(true);
  });

  it('TEST 4: Faculty Workload is derived dynamically from verified Subject Allocations', () => {
    const workload = academicStructureService.getFacultyWorkload('fac-101', 'ay-2026-27');
    expect(workload).toBeDefined();
    expect(workload.hours).toBe(5);
    expect(workload.subjectId).toBe('sub-dbms');
  });


  it('TEST 5: Student Subject Enrollment: Enrolled subjects accurately resolve for academic operations', () => {
    const enrollments = academicStructureService.getStudentSubjectEnrollments('stud-001', 'ay-2026-27');
    expect(enrollments.length).toBe(2);
    expect(enrollments.some(e => e.subjectOfferingId === 'off-dbms-2026-sem3')).toBe(true);
    expect(enrollments.some(e => e.subjectOfferingId === 'off-os-2026-sem3')).toBe(true);
  });

  it('TEST 6: Academic Year Isolation: Querying historical term ay-2025-26 isolates archived offerings', () => {
    const offerings2025 = academicStructureService.getSubjectOfferings('ay-2025-26');
    const offerings2026 = academicStructureService.getSubjectOfferings('ay-2026-27');

    expect(offerings2025.every(o => o.academicYearId === 'ay-2025-26')).toBe(true);
    expect(offerings2026.every(o => o.academicYearId === 'ay-2026-27')).toBe(true);
  });
});
