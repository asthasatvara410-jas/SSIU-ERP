import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { departmentScopeService } from '../services/departmentScopeService';
import { User, Faculty, Subject } from '../types';
import * as XLSX from 'xlsx';

describe('HOD Department Faculty & Workload Excel Register Test Suite', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const hodCE: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD CE)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod_ce',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const hodME: User = {
    id: 'hod-2',
    name: 'Dr. Ramesh Joshi (HOD ME)',
    email: 'hod.me@ssiu.edu.in',
    username: 'hod_me',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  const superAdmin: User = {
    id: 'admin-1',
    name: 'Super Administrator',
    email: 'admin@ssiu.edu.in',
    username: 'superadmin',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-1',
    status: 'ACTIVE',
    accountStatus: 'ACTIVE'
  };

  it('1. Department Scope Isolation: CE HOD sees only CE faculty with 0 ME cross-contamination', () => {
    // Add an ME faculty member to test cross-department isolation
    db.getState().faculty.push({
      id: 'fac-me-1',
      employeeId: 'FACULTY-ME-01',
      name: 'Prof. Vikram Singh (ME)',
      email: 'vikram.singh@ssiu.edu.in',
      phone: '+91 98250 99999',
      designation: 'Assistant Professor',
      instituteId: 'inst-1',
      departmentId: 'dept-2',
      status: 'ACTIVE'
    });

    const facultyCE = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    expect(facultyCE.length).toBeGreaterThan(0);
    expect(facultyCE.every(f => f.departmentId === 'dept-1')).toBe(true);

    const facultyME = departmentScopeService.getFacultyWorkloadOverview(hodME, 'HOD');
    expect(facultyME.length).toBe(1);
    expect(facultyME.every(f => f.departmentId === 'dept-2')).toBe(true);

    // Cross-check that no CE faculty ID is present in ME
    const ceIds = new Set(facultyCE.map(f => f.facultyId));
    facultyME.forEach(f => {
      expect(ceIds.has(f.facultyId)).toBe(false);
    });
  });

  it('2. Excel Row Model Completeness: All 13 column data points present per faculty', () => {
    const facultyRoster = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    expect(facultyRoster.length).toBeGreaterThan(0);

    facultyRoster.forEach(f => {
      expect(typeof f.facultyId).toBe('string');
      expect(typeof f.facultyName).toBe('string');
      expect(typeof f.employeeId).toBe('string');
      expect(typeof f.designation).toBe('string');
      expect(typeof f.departmentName).toBe('string');
      expect(typeof f.programCode).toBe('string');
      expect(Array.isArray(f.assignedSubjects)).toBe(true);
      expect(typeof f.theoryHours).toBe('number');
      expect(typeof f.labHours).toBe('number');
      expect(typeof f.totalWeeklyHours).toBe('number');
      expect(['UNDERLOAD', 'NORMAL', 'HIGH LOAD', 'OVERLOAD', 'UNDERLOADED', 'OVERLOADED'].includes(f.workloadStatus)).toBe(true);
      expect(typeof f.isMentor).toBe('boolean');
      expect(typeof f.status).toBe('string');
    });
  });

  it('3. Accurate Workload Calculation: Total Hours = Theory Hours + Lab Hours', () => {
    const facultyRoster = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');

    facultyRoster.forEach(f => {
      expect(f.totalWeeklyHours).toBe(f.theoryHours + f.labHours);
    });
  });

  it('4. Workload Status Derivation According to University Rules', () => {
    const facultyRoster = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');

    facultyRoster.forEach(f => {
      if (f.totalWeeklyHours > 20) {
        expect(f.workloadStatus).toBe('OVERLOAD');
      } else if (f.totalWeeklyHours > 16) {
        expect(f.workloadStatus).toBe('HIGH LOAD');
      } else if (f.totalWeeklyHours < 8) {
        expect(f.workloadStatus).toBe('UNDERLOAD');
      } else {
        expect(f.workloadStatus).toBe('NORMAL');
      }
    });
  });

  it('5. Dynamic Summary KPI Cards: Total Faculty, Total Hours, Average Workload, Overloaded', () => {
    const facultyRoster = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');

    const totalFaculty = facultyRoster.length;
    const totalWeeklyHours = facultyRoster.reduce((sum, f) => sum + f.totalWeeklyHours, 0);
    const averageWorkload = totalFaculty > 0 ? Math.round((totalWeeklyHours / totalFaculty) * 10) / 10 : 0;
    const overloadedCount = facultyRoster.filter(f => f.workloadStatus === 'OVERLOAD' || f.workloadStatus === 'HIGH LOAD').length;

    expect(totalFaculty).toBeGreaterThan(0);
    expect(totalWeeklyHours).toBeGreaterThan(0);
    expect(averageWorkload).toBeGreaterThan(0);
    expect(overloadedCount).toBeGreaterThanOrEqual(0);
  });

  it('6. Course Subject Allocation Workflow: Updates hours and status immediately in database', () => {
    const facultyList = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    const targetFaculty = facultyList[0];
    const initialHours = targetFaculty.totalWeeklyHours;

    const subjects = departmentScopeService.getScopedSubjects(hodCE, 'HOD');
    expect(subjects.length).toBeGreaterThan(0);
    const targetSubject = subjects[0];

    // Allocate subject to target faculty with 4 theory and 2 lab hours
    db.updateEntity<Subject>('subjects', targetSubject.id, {
      assignedFacultyId: targetFaculty.facultyId,
      theoryHoursPerWeek: 4,
      labHoursPerWeek: 2
    }, 'Test Subject Allocation');

    // Recalculate faculty workload
    const updatedFacultyList = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    const updatedFaculty = updatedFacultyList.find(f => f.facultyId === targetFaculty.facultyId);
    expect(updatedFaculty).toBeDefined();
    expect(updatedFaculty!.assignedSubjects.some(s => s.id === targetSubject.id)).toBe(true);
    expect(updatedFaculty!.totalWeeklyHours).toBe(updatedFaculty!.theoryHours + updatedFaculty!.labHours);
  });

  it('7. Faculty Profile Update (Designation & Status)', () => {
    const facultyList = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    const targetFaculty = facultyList[0];

    db.updateEntity<Faculty>('faculty', targetFaculty.facultyId, {
      designation: 'Professor'
    }, 'Test Designation Update');
    const facObj = db.getFaculty().find(f => f.id === targetFaculty.facultyId);
    if (facObj) {
      (facObj as any).isMentor = true;
    }

    const updatedFacultyList = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');
    const updatedFaculty = updatedFacultyList.find(f => f.facultyId === targetFaculty.facultyId);
    expect(updatedFaculty?.designation).toBe('Professor');
    expect(updatedFaculty?.isMentor).toBe(true);
  });

  it('8. Excel (.xlsx) Export Generation Structure', () => {
    const facultyRoster = departmentScopeService.getFacultyWorkloadOverview(hodCE, 'HOD');

    const exportRows = facultyRoster.map(f => ({
      'Faculty Name': f.facultyName,
      'Employee ID': f.employeeId,
      'Designation': f.designation,
      'Department': f.departmentName,
      'Program': f.programName,
      'Branch': f.programCode,
      'Assigned Subjects': f.assignedSubjects.map(s => s.code).join(', ') || 'None',
      'Theory Hours / Week': f.theoryHours,
      'Lab Hours / Week': f.labHours,
      'Total Hours / Week': f.totalWeeklyHours,
      'Workload Status': f.workloadStatus,
      'Mentor Assigned': f.isMentor ? `Yes (${f.assignedMenteesCount} Mentees)` : 'No',
      'Contact Email': f.email || '',
      'Status': f.status
    }));

    expect(exportRows.length).toBe(facultyRoster.length);
    expect(Object.keys(exportRows[0])).toContain('Faculty Name');
    expect(Object.keys(exportRows[0])).toContain('Employee ID');
    expect(Object.keys(exportRows[0])).toContain('Total Hours / Week');
    expect(Object.keys(exportRows[0])).toContain('Workload Status');

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workload');
    expect(wb.SheetNames.includes('Workload')).toBe(true);
  });
});
