import { describe, it, expect } from 'vitest';
import { examinationResultsService } from '../services/examinationResultsService';
import { db } from '../../../services/db';

describe('Examination & Results Engine', () => {
  it('should evaluate exam eligibility for valid students with full compliance', () => {
    const students = db.getStudents() || [];
    expect(students.length).toBeGreaterThan(0);

    const result = examinationResultsService.evaluateExamEligibility(students[0].id, 'exam-test', 75);
    expect(result).toBeDefined();
    expect(result.studentId).toBe(students[0].id);
    expect(result.isEnrollmentValid).toBe(true);
    expect(['ELIGIBLE', 'NOT_ELIGIBLE', 'PROVISIONAL_HOLD']).toContain(result.status);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('should debar students when attendance threshold is not met', () => {
    const students = db.getStudents() || [];
    const targetStudentId = students[0]?.id || '1';
    // Evaluating with 100% threshold will debar anyone with less than 100% attendance (mock has 82.5%)
    const result = examinationResultsService.evaluateExamEligibility(targetStudentId, 'exam-test', 100);
    expect(result).toBeDefined();
    expect(result.hasAttendanceShortage).toBe(true);
    expect(result.status).toBe('NOT_ELIGIBLE');
    expect(result.reasons.some(r => r.includes('Attendance compliance failed'))).toBe(true);
  });

  it('should return NOT_ELIGIBLE for unknown or unverified student identifiers', () => {
    const result = examinationResultsService.evaluateExamEligibility('stud-nonexistent-999');
    expect(result).toBeDefined();
    expect(result.isEnrollmentValid).toBe(false);
    expect(result.status).toBe('NOT_ELIGIBLE');
  });

  it('should deterministically calculate letter grades and grade points according to UGC 10-point scale', () => {
    const gradeO = examinationResultsService.calculateGrade(95);
    expect(gradeO.grade).toBe('O');
    expect(gradeO.gradePoint).toBe(10);
    expect(gradeO.isPassing).toBe(true);

    const gradeA = examinationResultsService.calculateGrade(74);
    expect(gradeA.grade).toBe('A');
    expect(gradeA.gradePoint).toBe(8);

    const gradeFail = examinationResultsService.calculateGrade(32);
    expect(gradeFail.grade).toBe('F');
    expect(gradeFail.gradePoint).toBe(0);
    expect(gradeFail.isPassing).toBe(false);
  });

  it('should calculate semester SGPA, CGPA, and earned credits deterministically', () => {
    const summary = examinationResultsService.calculateSemesterResult('stud-001', 4);
    expect(summary).toBeDefined();
    expect(summary.totalCreditsOffered).toBeGreaterThan(0);
    expect(summary.totalCreditsEarned).toBeLessThanOrEqual(summary.totalCreditsOffered);
    expect(summary.sgpa).toBeGreaterThanOrEqual(0);
    expect(summary.sgpa).toBeLessThanOrEqual(10);
    expect(summary.cgpa).toBeGreaterThanOrEqual(0);
    expect(summary.cgpa).toBeLessThanOrEqual(10);
    expect(summary.courseMarks.length).toBeGreaterThan(0);
  });

  it('should generate structured marksheet and degree certificate payloads with tamper-evident metadata', () => {
    const marksheet = examinationResultsService.generateMarksheetPayload('stud-001', 4);
    expect(marksheet).toBeDefined();
    expect(marksheet.marksheetId).toContain('MS-SSIU');
    expect(marksheet.securityHash).toBeDefined();
    expect(marksheet.qrVerificationUrl).toContain('verify.ssiu.edu.in');

    const degree = examinationResultsService.generateDegreeCertificatePayload('stud-001');
    expect(degree).toBeDefined();
    expect(degree.certificateId).toContain('DEG-SSIU');
    expect(degree.disclaimer).toBeDefined();
    expect(degree.verificationDigest).toBeDefined();
  });
});
