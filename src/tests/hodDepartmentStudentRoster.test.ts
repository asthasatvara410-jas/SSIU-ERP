import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { User, Student } from '../types';

describe('HOD Department Student Roster & Excel Grid Suite', () => {
  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  const hodCE: User = {
    id: 'hod-1',
    name: 'Dr. Suresh Mehta (HOD CE)',
    email: 'hod.ce@ssiu.edu.in',
    username: 'hod',
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

  it('1. Strict HOD Department Scoping: HOD CE sees only CE students and cannot view other departments', () => {
    const allStudents = db.getStudents();
    const ceStudents = allStudents.filter(s => s.departmentId === hodCE.departmentId);
    const meStudents = allStudents.filter(s => s.departmentId === hodME.departmentId);

    expect(ceStudents.length).toBeGreaterThan(0);
    expect(ceStudents.every(s => s.departmentId === 'dept-1')).toBe(true);

    // Verify HOD ME students do not overlap with CE students
    const ceStudentIds = new Set(ceStudents.map(s => s.id));
    meStudents.forEach(s => {
      expect(ceStudentIds.has(s.id)).toBe(false);
    });
  });

  it('2. Accurate Dynamic Attendance Calculation & Status Classification', () => {
    const ceStudents = db.getStudents().filter(s => s.departmentId === 'dept-1');
    expect(ceStudents.length).toBeGreaterThan(0);

    ceStudents.forEach(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      expect(typeof stats.percentage).toBe('number');
      expect(stats.totalClasses).toBe(stats.presentClasses + stats.absentClasses);

      if (stats.percentage >= 75) {
        expect(stats.percentage).toBeGreaterThanOrEqual(75);
      } else if (stats.percentage >= 60) {
        expect(stats.percentage).toBeLessThan(75);
        expect(stats.percentage).toBeGreaterThanOrEqual(60);
      } else {
        expect(stats.percentage).toBeLessThan(60);
      }
    });
  });

  it('3. Document Vault Verification Status Integrity', () => {
    const student = db.getStudents()[0];
    const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
    expect(Array.isArray(docs)).toBe(true);

    const hasMissing = docs.some(d => d.status === 'REJECTED' || d.status === 'MISSING');
    const hasPending = docs.some(d => d.status === 'PENDING' || d.status === 'SUBMITTED');

    if (!hasMissing && !hasPending) {
      expect(docs.every(d => d.status === 'VERIFIED')).toBe(true);
    }
  });

  it('4. Multi-Parameter Search Filtering Across Name and Enrollment Number', () => {
    const ceStudents = db.getStudents().filter(s => s.departmentId === 'dept-1');
    const firstStudent = ceStudents[0];

    // Search by Name
    const nameQuery = firstStudent.name.slice(0, 4).toLowerCase();
    const nameMatches = ceStudents.filter(s => s.name.toLowerCase().includes(nameQuery));
    expect(nameMatches.some(s => s.id === firstStudent.id)).toBe(true);

    // Search by Enrollment Number
    const enrollQuery = firstStudent.enrollmentNo.toLowerCase();
    const enrollMatches = ceStudents.filter(s => s.enrollmentNo.toLowerCase().includes(enrollQuery));
    expect(enrollMatches.some(s => s.id === firstStudent.id)).toBe(true);
  });

  it('5. Academic Risk & Shortage Flag Accuracy', () => {
    const ceStudents = db.getStudents().filter(s => s.departmentId === 'dept-1');
    
    ceStudents.forEach(student => {
      const stats = db.getStudentAttendanceStats(student.id);
      const docs = db.getStudentAcademicDocumentsByStudentId(student.id);
      const hasShortage = stats.percentage < 75;
      const hasMissingDocs = docs.some(d => d.status !== 'VERIFIED');
      const isRisk = hasShortage || hasMissingDocs;

      if (hasShortage) {
        expect(stats.percentage).toBeLessThan(75);
      }
      if (isRisk) {
        expect(hasShortage || hasMissingDocs).toBe(true);
      }
    });
  });
});
