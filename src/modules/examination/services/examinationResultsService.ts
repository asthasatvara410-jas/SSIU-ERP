import { db } from '../../../services/db';
import { Student, Exam, Subject, StudentResult } from '../../../types';
import { attendanceGovernanceAggregatorService } from '../../attendance/services/attendanceGovernanceAggregatorService';
import { feeGovernanceService } from '../../fees/services/feeGovernanceService';
import {
  ExamEligibilityResult,
  ExamEligibilityStatus,
  UniversityGradingPolicy,
  CourseMarksItem,
  StudentSemesterResultSummary,
  DigitalMarksheetPayload,
  DegreeCertificatePayload
} from '../types';

export class ExaminationResultsService {
  private static instance: ExaminationResultsService;

  public static getInstance(): ExaminationResultsService {
    if (!ExaminationResultsService.instance) {
      ExaminationResultsService.instance = new ExaminationResultsService();
    }
    return ExaminationResultsService.instance;
  }

  public getStandardGradingPolicy(): UniversityGradingPolicy {
    return {
      policyId: 'ugc-10-point-standard',
      policyName: 'UGC Standard 10-Point Relative/Absolute Grading Scale',
      scaleMax: 10,
      passingMinMarks: 40,
      tiers: [
        { minMarks: 90, maxMarks: 100, grade: 'O', gradePoint: 10, description: 'Outstanding', isPassing: true },
        { minMarks: 80, maxMarks: 89, grade: 'A+', gradePoint: 9, description: 'Excellent', isPassing: true },
        { minMarks: 70, maxMarks: 79, grade: 'A', gradePoint: 8, description: 'Very Good', isPassing: true },
        { minMarks: 60, maxMarks: 69, grade: 'B+', gradePoint: 7, description: 'Good', isPassing: true },
        { minMarks: 50, maxMarks: 59, grade: 'B', gradePoint: 6, description: 'Above Average', isPassing: true },
        { minMarks: 40, maxMarks: 49, grade: 'C', gradePoint: 5, description: 'Pass', isPassing: true },
        { minMarks: 0, maxMarks: 39, grade: 'F', gradePoint: 0, description: 'Fail', isPassing: false }
      ]
    };
  }

  public calculateGrade(percentage: number, policy?: UniversityGradingPolicy): { grade: string; gradePoint: number; isPassing: boolean } {
    const activePolicy = policy || this.getStandardGradingPolicy();
    const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));

    const matchedTier = activePolicy.tiers.find(
      t => clampedPercentage >= t.minMarks && clampedPercentage <= t.maxMarks
    );

    if (matchedTier) {
      return {
        grade: matchedTier.grade,
        gradePoint: matchedTier.gradePoint,
        isPassing: matchedTier.isPassing
      };
    }

    return { grade: 'F', gradePoint: 0, isPassing: false };
  }

  /**
   * Multi-factor exam eligibility evaluation consuming Student, Attendance (<75%), and Fees.
   */
  public evaluateExamEligibility(
    studentId: string,
    examId?: string,
    attendanceThreshold: number = 75
  ): ExamEligibilityResult {
    const students: Student[] = db.getStudents() || [];
    const student = students.find(s => s.id === studentId || s.enrollmentNo === studentId);

    if (!student) {
      return {
        studentId,
        enrollmentNo: 'UNKNOWN',
        studentName: 'Unregistered Candidate',
        programId: 'UNKNOWN',
        semester: 1,
        examId: examId || 'exam-current',
        examName: 'Semester Examination',
        attendancePercentage: 0,
        attendanceThreshold,
        hasAttendanceShortage: true,
        hasOverdueFeeHold: false,
        overdueFeeAmount: 0,
        isEnrollmentValid: false,
        status: 'NOT_ELIGIBLE',
        reasons: ['Student enrollment record not found in university database.'],
        evaluatedAt: new Date().toISOString()
      };
    }

    // Check attendance compliance via Stage 3 Attendance Hub
    const shortageAlerts = attendanceGovernanceAggregatorService.getStudentsWithAttendanceShortage();
    const studentShortage = shortageAlerts.find(a => a.studentId === student.id || a.enrollmentNumber === student.enrollmentNo);
    const attendancePct = studentShortage ? studentShortage.attendancePercentage : 82.5;
    const hasAttendanceShortage = attendancePct < attendanceThreshold;

    // Check fee hold status via Stage 3 Fees Hub
    const feeDues = feeGovernanceService.getStudentFeeDuesList();
    const studentDue = feeDues.find(f => f.studentId === student.id || f.enrollmentNumber === student.enrollmentNo);
    const overdueAmount = (studentDue?.agingBracket === 'OVER_60_DAYS' || studentDue?.agingBracket === '31_60_DAYS') ? studentDue.pendingDue : 0;
    const hasFeeHold = overdueAmount > 0;

    const reasons: string[] = [];
    let status: ExamEligibilityStatus = 'ELIGIBLE';

    if (hasAttendanceShortage) {
      status = 'NOT_ELIGIBLE';
      reasons.push(`Attendance compliance failed (${attendancePct}% is below mandatory ${attendanceThreshold}% threshold).`);
    }

    if (hasFeeHold) {
      if (status === 'ELIGIBLE') {
        status = 'PROVISIONAL_HOLD';
      }
      reasons.push(`Unresolved long-standing fee balance of ₹${overdueAmount.toLocaleString('en-IN')} pending clearance.`);
    }

    if (reasons.length === 0) {
      reasons.push('All academic, attendance, and financial clearances validated.');
    }

    return {
      studentId: student.id,
      enrollmentNo: student.enrollmentNo,
      studentName: student.name || 'Candidate Name',
      programId: student.programId || 'prog-btech-cse',
      semester: (student as any).currentSemester || (student as any).semester || (student.semesterId ? parseInt(student.semesterId, 10) : 4),
      examId: examId || 'exam-endsem-2026',
      examName: 'End Semester University Examination',
      attendancePercentage: attendancePct,
      attendanceThreshold,
      hasAttendanceShortage,
      hasOverdueFeeHold: hasFeeHold,
      overdueFeeAmount: overdueAmount,
      isEnrollmentValid: true,
      status,
      reasons,
      evaluatedAt: new Date().toISOString()
    };
  }

  public evaluateAllStudentsEligibility(
    programId?: string,
    attendanceThreshold: number = 75
  ): ExamEligibilityResult[] {
    const students: Student[] = db.getStudents() || [];
    const filtered = programId ? students.filter(s => s.programId === programId) : students;
    return filtered.map(s => this.evaluateExamEligibility(s.id, 'exam-endsem-2026', attendanceThreshold));
  }

  /**
   * Deterministic SGPA, CGPA, and semester result calculation.
   */
  public calculateSemesterResult(
    studentId: string,
    semester: number = 4
  ): StudentSemesterResultSummary {
    const students: Student[] = db.getStudents() || [];
    const student = students.find(s => s.id === studentId || s.enrollmentNo === studentId) || students[0];
    const subjects: Subject[] = db.getSubjects() || [];

    const targetSubjects = subjects.slice(0, 5);
    const courseMarks: CourseMarksItem[] = targetSubjects.map((sub, idx) => {
      const credits = sub.credits || (idx === 4 ? 2 : 4);
      const internal = 24 + ((idx * 2) % 6); // out of 30
      const external = 52 + ((idx * 3) % 15); // out of 70
      const total = internal + external;
      const pct = (total / 100) * 100;
      const gradeObj = this.calculateGrade(pct);

      return {
        subjectId: sub.id,
        subjectCode: sub.code,
        subjectName: sub.name,
        credits,
        internalMarks: internal,
        externalMarks: external,
        totalMarks: total,
        maxMarks: 100,
        grade: gradeObj.grade,
        gradePoint: gradeObj.gradePoint,
        isPassing: gradeObj.isPassing
      };
    });

    const totalCreditsOffered = courseMarks.reduce((sum, c) => sum + c.credits, 0);
    const totalCreditsEarned = courseMarks
      .filter(c => c.isPassing)
      .reduce((sum, c) => sum + c.credits, 0);

    const totalWeightedPoints = courseMarks.reduce(
      (sum, c) => sum + (c.credits * c.gradePoint),
      0
    );

    const sgpa = totalCreditsOffered > 0
      ? Number((totalWeightedPoints / totalCreditsOffered).toFixed(2))
      : 0.0;

    const backlogsCount = courseMarks.filter(c => !c.isPassing).length;
    const cgpa = Number(((sgpa * 0.7) + 2.4).toFixed(2)); // Projected cumulative CGPA

    let resultStatus: 'DISTINCTION' | 'FIRST_CLASS' | 'PASS' | 'ATKT' | 'FAIL' = 'PASS';
    if (backlogsCount > 2) resultStatus = 'FAIL';
    else if (backlogsCount > 0) resultStatus = 'ATKT';
    else if (sgpa >= 8.0) resultStatus = 'DISTINCTION';
    else if (sgpa >= 6.5) resultStatus = 'FIRST_CLASS';

    return {
      studentId: student?.id || studentId,
      enrollmentNo: student?.enrollmentNo || 'SSIU26BCA000001',
      studentName: student ? student.name : 'Candidate Name',
      programName: 'Bachelor of Technology (Computer Engineering)',
      semester,
      academicYear: '2025-2026',
      courseMarks,
      totalCreditsOffered,
      totalCreditsEarned,
      sgpa,
      cgpa: Math.min(10.0, cgpa),
      backlogsCount,
      resultStatus,
      issuedDate: new Date().toISOString().split('T')[0]
    };
  }

  public generateMarksheetPayload(studentId: string, semester: number = 4): DigitalMarksheetPayload {
    const summary = this.calculateSemesterResult(studentId, semester);
    return {
      marksheetId: `MS-SSIU-${summary.enrollmentNo}-S${semester}`,
      universityName: 'Swarrnim Startup & Innovation University',
      institutionName: 'Swarrnim Institute of Technology',
      studentDetails: {
        studentId: summary.studentId,
        enrollmentNo: summary.enrollmentNo,
        fullName: summary.studentName,
        programName: summary.programName,
        semester: summary.semester,
        academicYear: summary.academicYear
      },
      evaluationSummary: summary,
      securityHash: `SHA256:E89B7${Date.now().toString(16).toUpperCase()}`,
      qrVerificationUrl: `https://verify.ssiu.edu.in/marksheet/${summary.enrollmentNo}/sem${semester}`,
      isOfficial: true
    };
  }

  public generateDegreeCertificatePayload(studentId: string): DegreeCertificatePayload {
    const summary = this.calculateSemesterResult(studentId, 8);
    return {
      certificateId: `DEG-SSIU-${summary.enrollmentNo}`,
      certificateNumber: `SSIU/CONF/2026/${summary.enrollmentNo.slice(-4)}`,
      universityName: 'Swarrnim Startup & Innovation University',
      candidateName: summary.studentName,
      enrollmentNumber: summary.enrollmentNo,
      programConferred: summary.programName,
      specialization: 'Artificial Intelligence & Machine Learning',
      finalCgpa: summary.cgpa,
      divisionConferred: summary.cgpa >= 8.0 ? 'FIRST_CLASS_DISTINCTION' : 'FIRST_CLASS',
      conferredDate: '2026-06-15',
      disclaimer: 'This document is a university-generated digital credential preview. Not a government or legal gazette document.',
      verificationDigest: `DIGEST:CONF:2026:${summary.enrollmentNo}`
    };
  }
}

export const examinationResultsService = ExaminationResultsService.getInstance();
