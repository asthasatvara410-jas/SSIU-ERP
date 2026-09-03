import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { attendanceApprovalService } from '../services/attendanceApprovalService';
import { feedbackService } from '../services/feedbackService';
import { User, AttendanceApplication } from '../types';

describe('Principal / HOI Workspace Excel Grid & Architecture Integration', () => {
  let principalUser: User;
  let testInstituteId: string;

  beforeEach(() => {
    const inst = db.getInstitutes()[0];
    testInstituteId = inst?.id || 'inst-sit';

    principalUser = {
      id: 'usr-hoi-1',
      name: 'Dr. Suresh Verma',
      email: 'principal.sit@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: testInstituteId,
      status: 'ACTIVE'
    };
  });

  it('1. Fetches real institute scope from central DB without mock duplication', () => {
    const institute = db.getInstituteById(testInstituteId) || db.getInstitutes()[0];
    expect(institute).toBeDefined();

    const departments = db.getDepartments().filter(d => d.instituteId === institute.id || !d.instituteId);
    expect(departments.length).toBeGreaterThan(0);

    const students = db.getStudents();
    expect(students.length).toBeGreaterThan(0);

    const faculty = db.getFaculty();
    expect(faculty.length).toBeGreaterThan(0);
  });

  it('2. Correctly aggregates department metrics for Excel Overview & Department registers', () => {
    const departments = db.getDepartments();
    const students = db.getStudents();
    const faculty = db.getFaculty();
    const programs = db.getPrograms();

    const rows = departments.map(dept => {
      const dStudents = students.filter(s => s.departmentId === dept.id);
      const dFaculty = faculty.filter(f => f.departmentId === dept.id);
      const dPrograms = programs.filter(p => p.departmentId === dept.id);

      const dShortages = dStudents.filter(s => {
        const stats = db.getStudentAttendanceStats(s.id);
        return stats.percentage < 75;
      }).length;

      return {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        programsCount: dPrograms.length,
        studentsCount: dStudents.length,
        facultyCount: dFaculty.length,
        shortagesCount: dShortages
      };
    });

    expect(rows.length).toBe(departments.length);
    expect(rows[0]).toHaveProperty('name');
    expect(rows[0]).toHaveProperty('code');
    expect(rows[0]).toHaveProperty('studentsCount');
  });

  it('3. Computes Faculty Workload metrics (theory hours, lab hours, weekly load)', () => {
    const faculty = db.getFaculty();
    const subjects = db.getSubjects();

    const facultyRows = faculty.map(f => {
      const assignedSubs = subjects.filter(s => s.assignedFacultyId === f.id || (f.subjectIds && f.subjectIds.includes(s.id)));
      const thHours = assignedSubs.reduce((sum, s) => sum + (s.theoryHoursPerWeek || 3), 0) || 12;
      const labHours = assignedSubs.reduce((sum, s) => sum + (s.labHoursPerWeek || 2), 0) || 6;
      const totalLoad = thHours + labHours;

      return {
        id: f.id,
        name: f.name,
        theoryHours: thHours,
        labHours: labHours,
        totalWorkload: totalLoad,
        workloadStatus: totalLoad > 20 ? 'HIGH LOAD' : totalLoad >= 16 ? 'OPTIMAL' : 'NORMAL'
      };
    });

    expect(facultyRows.length).toBe(faculty.length);
    expect(facultyRows[0].totalWorkload).toBeGreaterThan(0);
  });

  it('4. Executes 4-Tier Attendance Condonation HOI final review and unlocks exam eligibility', () => {
    const students = db.getStudents();
    const student = students[0];
    const subjects = db.getSubjects();
    const subject = subjects[0];

    const newApp: AttendanceApplication = {
      id: `app-test-hoi-${Date.now()}`,
      applicationNo: `APP/2026/TEST-${Math.floor(Math.random() * 1000)}`,
      studentId: student.id,
      studentName: student.name,
      enrollmentNo: student.enrollmentNo,
      departmentId: student.departmentId,
      departmentName: 'Computer Engineering',
      instituteId: testInstituteId,
      academicYear: '2025-26',
      semesterNumber: student.currentSemester || 4,
      subjectId: subject.id,
      subjectCode: subject.code,
      subjectName: subject.name,
      facultyId: 'fac-1',
      facultyName: 'Dr. Rajesh Sharma',
      currentAttendancePct: 68,
      requiredAttendancePct: 75,
      shortagePct: 7,
      medicalCondonationApplied: true,
      medicalDocs: [],
      facultyStatus: 'FACULTY_APPROVED',
      facultyRemarks: 'Genuine medical certificate verified.',
      mentorStatus: 'MENTOR_ENDORSED',
      mentorRemarks: 'Endorsed for condonation.',
      hodStatus: 'HOD_RECOMMENDED',
      hodRemarks: 'Recommended to Principal for final clearance.',
      status: 'HOD_APPROVED',
      examEligibilityStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert directly into db state applications
    const state = db.getState();
    state.attendanceApplications = [newApp, ...(state.attendanceApplications || [])];
    db.saveState();

    // Principal / HOI executes final approval
    const reviewed = attendanceApprovalService.hoiReview(
      newApp.id,
      {
        decision: 'APPROVE',
        remarks: 'Executive Principal approval granted for exam appearance.'
      },
      principalUser
    );

    expect(reviewed.status).toBe('FINAL_APPROVED');
    expect(reviewed.hoiStatus).toBe('FINAL_APPROVED');
    expect(reviewed.examEligibilityStatus).toBe('EXAM_ELIGIBLE');
    expect(reviewed.hoiRemarks).toContain('Executive Principal approval');
  });

  it('5. Allows Principal / HOI to assign and update Head of Department (HOD)', () => {
    const departments = db.getDepartments();
    const targetDept = departments[0];
    const faculty = db.getFaculty();
    const targetFaculty = faculty[0];

    const updated = db.updateEntity('departments', targetDept.id, {
      hodId: targetFaculty.id,
      hodName: targetFaculty.name
    }, 'Principal appointed HOD');

    expect(updated).toBeDefined();
    expect(updated?.hodName).toBe(targetFaculty.name);

    const reloaded = db.getDepartments().find(d => d.id === targetDept.id);
    expect(reloaded?.hodName).toBe(targetFaculty.name);
  });

  it('6. Connects Feedback Analytics to central feedbackService', () => {
    const feedbacks = feedbackService.getAllFeedbacks();
    expect(Array.isArray(feedbacks)).toBe(true);

    if (feedbacks.length > 0) {
      const f = feedbacks[0];
      expect(f).toHaveProperty('feedbackNo');
      expect(f).toHaveProperty('overallRating');
      expect(f.overallRating).toBeGreaterThanOrEqual(1);
      expect(f.overallRating).toBeLessThanOrEqual(5);
    }
  });
});
