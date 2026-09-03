import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { 
  getScopedStudents, 
  getScopedFaculty, 
  getScopedAttendanceApplications,
  resolveUserOrganizationScope
} from '../services/access';
import { Student, Faculty, Department, AttendanceApplication, User } from '../types';

describe('Role-Specific Dashboard Data Contract & Consistency Suite', () => {
  let principalUser: User;
  let hodUser: User;
  let mentorUser: User;
  let studentUser: User;

  let instituteId = 'inst-sit';
  let dept1Id = 'dept-cse-01';
  let dept2Id = 'dept-mech-02';

  beforeEach(() => {
    const st = db.getState() as any;

    // Reset and seed structured canonical records
    st.institutes = [
      { id: instituteId, name: 'Swarrnim School of Computing & IT', code: 'SSCIT' }
    ];

    st.departments = [
      { id: dept1Id, instituteId: instituteId, name: 'Computer Engineering', code: 'CSE', hodFacultyId: 'fac-hod-1' },
      { id: dept2Id, instituteId: instituteId, name: 'Mechanical Engineering', code: 'MECH', hodFacultyId: 'fac-hod-2' }
    ];

    st.faculty = [
      { id: 'fac-hod-1', userId: 'usr-hod-1', name: 'Dr. Rajesh Sharma', instituteId: instituteId, departmentId: dept1Id, designation: 'Professor & HOD', status: 'ACTIVE' },
      { id: 'fac-mentor-1', userId: 'usr-mentor-1', name: 'Prof. Amit Patel', instituteId: instituteId, departmentId: dept1Id, designation: 'Assistant Professor', status: 'ACTIVE' },
      { id: 'fac-hod-2', userId: 'usr-hod-2', name: 'Dr. Vikram Shah', instituteId: instituteId, departmentId: dept2Id, designation: 'Professor & HOD', status: 'ACTIVE' }
    ];

    st.students = [
      {
        id: 'stud-01',
        name: 'Aarav Sharma',
        enrollmentNo: '2301010001',
        instituteId: instituteId,
        departmentId: dept1Id,
        mentorId: 'usr-mentor-1',
        mentorName: 'Prof. Amit Patel',
        status: 'ACTIVE'
      },
      {
        id: 'stud-02',
        name: 'Bhavna Patel',
        enrollmentNo: '2301010002',
        instituteId: instituteId,
        departmentId: dept1Id,
        mentorId: 'usr-mentor-1',
        mentorName: 'Prof. Amit Patel',
        status: 'ACTIVE'
      },
      {
        id: 'stud-03',
        name: 'Chetan Mehta',
        enrollmentNo: '2301010003',
        instituteId: instituteId,
        departmentId: dept2Id,
        mentorId: 'usr-hod-2',
        mentorName: 'Dr. Vikram Shah',
        status: 'ACTIVE'
      }
    ];

    st.attendanceApplications = [
      {
        id: 'att-app-01',
        studentId: 'stud-01',
        studentName: 'Aarav Sharma',
        instituteId: instituteId,
        departmentId: dept1Id,
        status: 'PENDING_HOD'
      },
      {
        id: 'att-app-02',
        studentId: 'stud-02',
        studentName: 'Bhavna Patel',
        instituteId: instituteId,
        departmentId: dept1Id,
        status: 'PENDING_HOI'
      }
    ];

    // Personas
    principalUser = {
      id: 'usr-prin-1',
      name: 'Dr. Suresh Verma',
      email: 'principal.sit@swarrnim.edu.in',
      role: 'PRINCIPAL',
      instituteId: instituteId,
      status: 'ACTIVE'
    };

    hodUser = {
      id: 'usr-hod-1',
      name: 'Dr. Rajesh Sharma',
      email: 'hod.ce@swarrnim.edu.in',
      role: 'HOD',
      instituteId: instituteId,
      departmentId: dept1Id,
      status: 'ACTIVE'
    };

    mentorUser = {
      id: 'usr-mentor-1',
      name: 'Prof. Amit Patel',
      email: 'amit.patel@swarrnim.edu.in',
      role: 'MENTOR',
      instituteId: instituteId,
      departmentId: dept1Id,
      status: 'ACTIVE'
    };

    studentUser = {
      id: 'stud-01',
      name: 'Aarav Sharma',
      email: 'aarav.sharma@swarrnim.edu.in',
      enrollmentNo: '2301010001',
      role: 'STUDENT',
      instituteId: instituteId,
      departmentId: dept1Id,
      status: 'ACTIVE'
    };

    db.saveState();
  });

  describe('1. Dynamic KPI Resolution vs Drill-Down List Contract', () => {
    it('Principal dashboard KPIs exactly equal underlying institute-scoped queries', () => {
      const scope = resolveUserOrganizationScope(principalUser);
      expect(scope.isGlobalScope).toBe(false);
      expect(scope.instituteId).toBe(instituteId);
      expect(scope.allowedInstituteIds).toContain(instituteId);

      const scopedStudents = getScopedStudents(principalUser);
      const scopedFaculty = getScopedFaculty(principalUser);
      const scopedApps = getScopedAttendanceApplications(principalUser);

      // KPI derivation:
      const totalStudentsKPI = scopedStudents.length;
      const totalFacultyKPI = scopedFaculty.length;
      const pendingApprovalsKPI = scopedApps.filter(a => a.status === 'PENDING_HOI').length;

      expect(totalStudentsKPI).toBe(3);
      expect(totalFacultyKPI).toBe(3);
      expect(pendingApprovalsKPI).toBe(1);

      // Drill-down list match:
      expect(scopedStudents.map(s => s.id)).toEqual(['stud-01', 'stud-02', 'stud-03']);
      expect(scopedApps.filter(a => a.status === 'PENDING_HOI')[0].id).toBe('att-app-02');
    });

    it('HOD dashboard KPIs are strictly department-scoped with zero cross-department data', () => {
      const scope = resolveUserOrganizationScope(hodUser);
      expect(scope.isGlobalScope).toBe(false);
      expect(scope.departmentId).toBe(dept1Id);
      expect(scope.allowedDepartmentIds).toContain(dept1Id);

      const deptStudents = getScopedStudents(hodUser);
      const deptFaculty = getScopedFaculty(hodUser);
      const deptApps = getScopedAttendanceApplications(hodUser);

      // HOD sees only CSE students (stud-01, stud-02), NOT MECH student (stud-03)
      expect(deptStudents.length).toBe(2);
      expect(deptStudents.map(s => s.id)).toEqual(['stud-01', 'stud-02']);
      expect(deptStudents.some(s => s.id === 'stud-03')).toBe(false);

      // HOD sees only CSE faculty (fac-hod-1, fac-mentor-1), NOT MECH faculty (fac-hod-2)
      expect(deptFaculty.length).toBe(2);
      expect(deptFaculty.some(f => f.id === 'fac-hod-2')).toBe(false);
    });

    it('Mentor dashboard KPIs reflect ONLY assigned mentees', () => {
      const mentees = getScopedStudents(mentorUser);
      expect(mentees.length).toBe(2);
      expect(mentees.map(s => s.id)).toEqual(['stud-01', 'stud-02']);
      expect(mentees.some(s => s.id === 'stud-03')).toBe(false);
    });

    it('Student dashboard scope is strictly SELF with zero peer leakage', () => {
      const ownStudents = getScopedStudents(studentUser);
      expect(ownStudents.length).toBe(1);
      expect(ownStudents[0].id).toBe(studentUser.id);
    });
  });

  describe('2. Live Relationship Reactions (No Hard-Coded Numbers)', () => {
    it('adding a student dynamically increments Principal and HOD KPIs without code changes', () => {
      const initialHODStudents = getScopedStudents(hodUser).length;
      expect(initialHODStudents).toBe(2);

      // Add a new student to CSE
      const newStudent: Student = {
        id: 'stud-new-04',
        name: 'Divya Joshi',
        enrollmentNo: '2301010004',
        instituteId: instituteId,
        departmentId: dept1Id,
        mentorId: mentorUser.id,
        status: 'ACTIVE'
      } as any;

      const st = db.getState() as any;
      st.students.push(newStudent);
      db.saveState();

      // Recalculate KPIs from service
      const updatedHODStudents = getScopedStudents(hodUser).length;
      const updatedPrincipalStudents = getScopedStudents(principalUser).length;

      expect(updatedHODStudents).toBe(3);
      expect(updatedPrincipalStudents).toBe(4);
    });

    it('reassigning a student to another department updates both departmental scopes dynamically', () => {
      const st = db.getState() as any;
      const s1 = st.students.find((s: Student) => s.id === 'stud-01');
      // Move stud-01 from CSE (dept1Id) to MECH (dept2Id)
      s1.departmentId = dept2Id;
      db.saveState();

      // CSE HOD now only sees 1 student
      const cseStudents = getScopedStudents(hodUser);
      expect(cseStudents.length).toBe(1);
      expect(cseStudents[0].id).toBe('stud-02');

      // MECH HOD user
      const mechHODUser: User = {
        id: 'usr-hod-2',
        name: 'Dr. Vikram Shah',
        role: 'HOD',
        instituteId: instituteId,
        departmentId: dept2Id,
        status: 'ACTIVE'
      };

      const mechStudents = getScopedStudents(mechHODUser);
      expect(mechStudents.length).toBe(2);
      expect(mechStudents.map(s => s.id)).toEqual(['stud-01', 'stud-03']);
    });
  });
});
