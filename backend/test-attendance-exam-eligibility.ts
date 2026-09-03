import { db } from '../src/services/db';
import { attendanceApprovalService } from '../src/services/attendanceApprovalService';
import { User, AttendanceApplication } from '../src/types';

// Setup Mock Users corresponding to seedData entities
const mockStudentUser: User = {
  id: 'stu-1',
  name: 'ABC Student 1',
  email: 'abc.student1@ssiu-demo.ac.in',
  role: 'STUDENT',
  enrollmentNo: 'STUDENT-001',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
};

const mockSubjectFacultyUser: User = {
  id: 'fac-3',
  name: 'Demo Faculty 3',
  email: 'demo.faculty3@ssiu-demo.ac.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
};

const mockMentorUser: User = {
  id: 'fac-1',
  name: 'Demo Faculty 1',
  email: 'demo.faculty1@ssiu-demo.ac.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
};

const mockHodUser: User = {
  id: 'usr-hod-1',
  name: 'Demo HOD',
  email: 'demo.hod@ssiu-demo.ac.in',
  role: 'HOD',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
};

const mockHoiUser: User = {
  id: 'usr-principal-1',
  name: 'Demo Principal',
  email: 'demo.principal@ssiu-demo.ac.in',
  role: 'PRINCIPAL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: new Date().toISOString()
};

console.log('═══════════════════════════════════════════════════════════════════════');
console.log('🧪 RUNNING TEST SUITE: SUBJECT-WISE ATTENDANCE & 75% EXAM ELIGIBILITY');
console.log('═══════════════════════════════════════════════════════════════════════\n');

let passedTests = 0;
let failedTests = 0;

function runTest(testNumber: number, title: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ [TEST ${testNumber}/13 PASSED]: ${title}`);
    passedTests++;
  } catch (error: any) {
    console.error(`❌ [TEST ${testNumber}/13 FAILED]: ${title}`);
    console.error(`   Error: ${error.message}\n`);
    failedTests++;
  }
}

// Reset any existing test applications for stu-1 in memory
db.getState().attendanceApplications = [];

let activeTestApp: AttendanceApplication;

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Calculate Subject-wise Attendance from Sessions
// ─────────────────────────────────────────────────────────────────────────────
runTest(1, 'Calculate accurate subject-wise attendance percentages from sessions', () => {
  const stats = attendanceApprovalService.calculateStudentSubjectAttendance('stu-1');
  
  const dbms = stats.find(s => s.subjectId === 'sub-dbms');
  const cn = stats.find(s => s.subjectId === 'sub-cn');

  if (!dbms) throw new Error('DBMS stats not found');
  if (!cn) throw new Error('Computer Networks stats not found');

  // DBMS: 32/40 = 80.0%
  if (dbms.totalClasses !== 40 || dbms.presentClasses !== 32 || dbms.percentage !== 80.0) {
    throw new Error(`DBMS attendance mismatch: expected 80.0%, got ${dbms.percentage}% (${dbms.presentClasses}/${dbms.totalClasses})`);
  }

  // CN: 29/42 = 69.0%
  if (cn.totalClasses !== 42 || cn.presentClasses !== 29 || cn.percentage !== 69.0) {
    throw new Error(`CN attendance mismatch: expected 69.0%, got ${cn.percentage}% (${cn.presentClasses}/${cn.totalClasses})`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: 75% Mandatory Attendance Rule Validation
// ─────────────────────────────────────────────────────────────────────────────
runTest(2, 'Evaluate 75% mandatory threshold (Eligible vs Attendance Shortage)', () => {
  const stats = attendanceApprovalService.calculateStudentSubjectAttendance('stu-1');
  
  const dbms = stats.find(s => s.subjectId === 'sub-dbms')!;
  const cn = stats.find(s => s.subjectId === 'sub-cn')!;

  if (dbms.percentage < 75 || !dbms.isEligible) {
    throw new Error(`DBMS (80%) should be eligible, got ${dbms.status}`);
  }

  if (cn.percentage >= 75 || cn.isEligible || cn.shortagePercentage !== 6.0) {
    throw new Error(`CN (69%) should have shortage of 6.0% and be ineligible, got ${cn.shortagePercentage}%`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Subject-wise Exam Eligibility Verification
// ─────────────────────────────────────────────────────────────────────────────
runTest(3, 'Verify subject-level exam eligibility checking function', () => {
  const dbmsElig = attendanceApprovalService.checkSubjectExamEligibility('stu-1', 'sub-dbms');
  const cnElig = attendanceApprovalService.checkSubjectExamEligibility('stu-1', 'sub-cn');

  if (!dbmsElig.isEligible) {
    throw new Error('Student should be eligible for DBMS exam (> 75%)');
  }

  if (cnElig.isEligible) {
    throw new Error('Student should NOT be eligible for CN exam without approval (69% < 75%)');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Student Attendance Application Submission for Shortage Subject
// ─────────────────────────────────────────────────────────────────────────────
runTest(4, 'Allow student to submit attendance condonation application for < 75% subject', () => {
  activeTestApp = attendanceApprovalService.createAttendanceApplication({
    subjectId: 'sub-cn',
    reason: 'MEDICAL',
    description: 'Diagnosed with viral fever during week 4, hospitalized for 5 days.',
    supportingDocumentName: 'Hospital_Discharge_Summary.pdf',
    supportingDocumentUrl: 'https://ssiu.edu/docs/discharge_summary.pdf'
  }, mockStudentUser);

  if (!activeTestApp.id || !activeTestApp.applicationNo) throw new Error('Application ID/No missing');
  if (activeTestApp.status !== 'SUBMITTED_TO_FACULTY') throw new Error(`Initial status should be SUBMITTED_TO_FACULTY, got ${activeTestApp.status}`);
  if (activeTestApp.currentHandlerRole !== 'SUBJECT_FACULTY') throw new Error(`Current handler role should be SUBJECT_FACULTY, got ${activeTestApp.currentHandlerRole}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Reject Application Submission for Subject with >= 75% Attendance
// ─────────────────────────────────────────────────────────────────────────────
runTest(5, 'Block student from submitting condonation application if attendance >= 75%', () => {
  let threw = false;
  try {
    attendanceApprovalService.createAttendanceApplication({
      subjectId: 'sub-dbms', // 80%
      reason: 'MEDICAL',
      description: 'Attempting invalid application for 80% subject'
    }, mockStudentUser);
  } catch (err: any) {
    threw = true;
    if (!err.message.includes('75%')) {
      throw new Error(`Expected error to mention 75% attendance rule, got: ${err.message}`);
    }
  }

  if (!threw) {
    throw new Error('System allowed attendance application for subject with >= 75% attendance!');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Stage 1 Sequential Approval: Subject Faculty Review
// ─────────────────────────────────────────────────────────────────────────────
runTest(6, 'Stage 1: Subject Faculty reviews & forwards to Mentor (FACULTY_APPROVED)', () => {
  const reviewingFaculty = {
    ...mockSubjectFacultyUser,
    id: activeTestApp.subjectFacultyId
  };

  const reviewed = attendanceApprovalService.facultyReview(activeTestApp.id, {
    decision: 'APPROVE',
    remarks: 'Verified student submitted genuine medical fitness certificate. Recommended for condonation.'
  }, reviewingFaculty);

  if (reviewed.status !== 'FACULTY_APPROVED') {
    throw new Error(`Expected status FACULTY_APPROVED, got ${reviewed.status}`);
  }
  if (reviewed.currentHandlerRole !== 'FACULTY_MENTOR' && (reviewed.currentHandlerRole as any) !== 'MENTOR') {
    throw new Error(`Expected next handler FACULTY_MENTOR / MENTOR, got ${reviewed.currentHandlerRole}`);
  }
  activeTestApp = reviewed;
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Stage 2 Sequential Approval: Mentor Review
// ─────────────────────────────────────────────────────────────────────────────
runTest(7, 'Stage 2: Mentor reviews & forwards to HOD (MENTOR_APPROVED)', () => {
  const reviewingMentor = {
    ...mockMentorUser,
    id: activeTestApp.mentorFacultyId
  };

  const reviewed = attendanceApprovalService.mentorReview(activeTestApp.id, {
    decision: 'APPROVE',
    remarks: 'Student has maintained good academic standing overall. Concur with Subject Faculty.'
  }, reviewingMentor);

  if (reviewed.status !== 'MENTOR_APPROVED') {
    throw new Error(`Expected status MENTOR_APPROVED, got ${reviewed.status}`);
  }
  if (reviewed.currentHandlerRole !== 'HOD') {
    throw new Error(`Expected next handler HOD, got ${reviewed.currentHandlerRole}`);
  }
  activeTestApp = reviewed;
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Stage 3 Sequential Approval: HOD Review
// ─────────────────────────────────────────────────────────────────────────────
runTest(8, 'Stage 3: HOD reviews & forwards to HOI / Principal (HOD_APPROVED)', () => {
  const reviewingHod = {
    ...mockHodUser,
    id: activeTestApp.hodUserId
  };

  const reviewed = attendanceApprovalService.hodReview(activeTestApp.id, {
    decision: 'APPROVE',
    remarks: 'Department Academic Committee has verified documents. Forwarded for Principal condonation.'
  }, reviewingHod);

  if (reviewed.status !== 'HOD_APPROVED') {
    throw new Error(`Expected status HOD_APPROVED, got ${reviewed.status}`);
  }
  if (reviewed.currentHandlerRole !== 'PRINCIPAL') {
    throw new Error(`Expected next handler PRINCIPAL, got ${reviewed.currentHandlerRole}`);
  }
  activeTestApp = reviewed;
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: Stage 4 Final Institutional Decision: HOI / Principal Approval
// ─────────────────────────────────────────────────────────────────────────────
runTest(9, 'Stage 4: HOI / Principal grants Final Approval (FINAL_APPROVED & EXAM_ELIGIBLE)', () => {
  const reviewingHoi = {
    ...mockHoiUser,
    id: activeTestApp.hoiUserId
  };

  const reviewed = attendanceApprovalService.hoiReview(activeTestApp.id, {
    decision: 'APPROVE',
    remarks: 'Attendance condonation granted under Ordinance 14.2 for national representation / genuine medical cause.'
  }, reviewingHoi);

  if (reviewed.status !== 'FINAL_APPROVED') {
    throw new Error(`Expected status FINAL_APPROVED, got ${reviewed.status}`);
  }
  activeTestApp = reviewed;

  // Check exam eligibility now
  const elig = attendanceApprovalService.checkSubjectExamEligibility('stu-1', 'sub-cn');
  if (!elig.isEligible || elig.status !== 'CONDONED_APPROVAL') {
    throw new Error(`Student should now be eligible for CN exam via CONDONED_APPROVAL, got isEligible=${elig.isEligible}, status=${elig.status}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Approval Preserves Actual Attendance Percentage
// ─────────────────────────────────────────────────────────────────────────────
runTest(10, 'Verify approval condones exam clearance without mutating actual attendance %', () => {
  const stats = attendanceApprovalService.calculateStudentSubjectAttendance('stu-1');
  const cn = stats.find(s => s.subjectId === 'sub-cn')!;

  // The actual percentage must STILL be 69.0%
  if (cn.percentage !== 69.0) {
    throw new Error(`Actual attendance was illegally modified! Expected 69.0%, got ${cn.percentage}%`);
  }
  if (cn.status !== 'CONDONED_APPROVAL') {
    throw new Error(`Expected status CONDONED_APPROVAL, got ${cn.status}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Rejection Handling in Approval Workflow
// ─────────────────────────────────────────────────────────────────────────────
runTest(11, 'Verify rejection at any stage marks application REJECTED and blocks clearance', () => {
  // Clear the previous application to test fresh rejection flow
  db.getState().attendanceApplications = [];

  const app = attendanceApprovalService.createAttendanceApplication({
    subjectId: 'sub-cn',
    reason: 'OTHER',
    description: 'Family vacation absence'
  }, mockStudentUser);

  const rejected = attendanceApprovalService.facultyReview(app.id, {
    decision: 'REJECT',
    remarks: 'Vacation absence cannot be condoned per academic regulations.'
  }, { ...mockSubjectFacultyUser, id: app.subjectFacultyId });

  if (rejected.status !== 'FACULTY_REJECTED') {
    throw new Error(`Expected status FACULTY_REJECTED, got ${rejected.status}`);
  }

  const elig = attendanceApprovalService.checkSubjectExamEligibility('stu-1', 'sub-cn');
  if (elig.isEligible) {
    throw new Error('Student should NOT be eligible after faculty rejection');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12: Scope Filtering for Role-based Dashboards
// ─────────────────────────────────────────────────────────────────────────────
runTest(12, 'Verify scoped application queries for Student, Faculty, Mentor, HOD, HOI', () => {
  const studentScoped = attendanceApprovalService.getScopedApplications(mockStudentUser, 'STUDENT');
  const facultyScoped = attendanceApprovalService.getScopedApplications(mockSubjectFacultyUser, 'FACULTY');
  const hodScoped = attendanceApprovalService.getScopedApplications(mockHodUser, 'HOD');
  const hoiScoped = attendanceApprovalService.getScopedApplications(mockHoiUser, 'PRINCIPAL');

  if (!Array.isArray(studentScoped)) throw new Error('Student scoped query failed');
  if (!Array.isArray(facultyScoped)) throw new Error('Faculty scoped query failed');
  if (!Array.isArray(hodScoped)) throw new Error('HOD scoped query failed');
  if (!Array.isArray(hoiScoped)) throw new Error('HOI scoped query failed');
});

// ─────────────────────────────────────────────────────────────────────────────
// TEST 13: Exam Eligibility Matrix & XLSX Report Generation
// ─────────────────────────────────────────────────────────────────────────────
runTest(13, 'Verify institutional Exam Eligibility Matrix & XLSX report export', () => {
  const matrix = attendanceApprovalService.getExamEligibilityMatrix(mockHoiUser, 'PRINCIPAL');
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('Exam eligibility matrix should contain student records');
  }

  const studentRow = matrix.find(r => r.student.id === 'stu-1');
  if (!studentRow) throw new Error('Student stu-1 not in matrix');

  const xlsxBuffer = attendanceApprovalService.exportAttendanceReportXlsx(matrix);

  if (!(xlsxBuffer instanceof Uint8Array) || xlsxBuffer.length === 0) {
    throw new Error('Invalid XLSX report generation output');
  }
});

console.log('\n═══════════════════════════════════════════════════════════════════════');
console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL 13)`);
console.log('═══════════════════════════════════════════════════════════════════════\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
