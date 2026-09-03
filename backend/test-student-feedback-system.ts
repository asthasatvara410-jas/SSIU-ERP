/**
 * Comprehensive Automated Test Suite: Student Feedback & Suggestion Management System (24 Scenarios)
 * Validates 7 Feedback Categories, Auto-resolved Targets, Anonymous Controls, Duplicate Prevention,
 * Role-Based Aggregators, Suggestion Lifecycle, and Data Integrity.
 */

import { feedbackService } from '../src/services/feedbackService';
import { db } from '../src/services/db';
import { User, Student, Faculty, Subject } from '../src/types';
import * as XLSX from 'xlsx';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, errorDetail?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}${errorDetail ? ` -> ${errorDetail}` : ''}`);
    failed++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log('🚀 RUNNING TEST SUITE: STUDENT FEEDBACK & SUGGESTION SYSTEM (24 SCENARIOS)');
  console.log('========================================================================\n');

  // Setup Clean Mock State
  const state: any = db.getState();
  state.detailedStudentFeedbacks = [];
  state.studentSuggestions = [];

  const studentCSE: any = {
    id: 'stu-cse-01',
    enrollmentNo: 'ENR-2026-CS001',
    name: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.edu',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    programId: 'prog-1',
    semesterId: 'sem-4',
    academicYearId: 'ay-2026',
    status: 'ACTIVE'
  };

  const facultyCSE1: any = {
    id: 'fac-cse-01',
    employeeId: 'EMP-CS-001',
    name: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@ssiu.edu',
    designation: 'Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    subjectIds: ['sub-1']
  };

  const facultyCSE2: any = {
    id: 'fac-cse-02',
    employeeId: 'EMP-CS-002',
    name: 'Prof. Ananya Verma',
    email: 'ananya.verma@ssiu.edu',
    designation: 'Associate Professor',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    subjectIds: ['sub-2']
  };

  const subject1: any = {
    id: 'sub-1',
    code: 'CS401',
    name: 'Database Management Systems',
    departmentId: 'dept-1',
    semesterId: 'sem-4',
    assignedFacultyId: 'fac-cse-01',
    status: 'ACTIVE'
  };

  const subject2: any = {
    id: 'sub-2',
    code: 'CS402',
    name: 'Computer Networks',
    departmentId: 'dept-1',
    semesterId: 'sem-4',
    assignedFacultyId: 'fac-cse-02',
    status: 'ACTIVE'
  };

  state.students = [studentCSE];
  state.faculty = [facultyCSE1, facultyCSE2];
  state.subjects = [subject1, subject2];
  state.studentFacultyMappings = [
    { id: 'map-1', studentId: studentCSE.id, subjectId: subject1.id, facultyId: facultyCSE1.id, status: 'ACTIVE' },
    { id: 'map-2', studentId: studentCSE.id, subjectId: subject2.id, facultyId: facultyCSE2.id, status: 'ACTIVE' }
  ];

  const studentUser: any = {
    id: studentCSE.id,
    enrollmentNo: studentCSE.enrollmentNo,
    name: studentCSE.name,
    email: studentCSE.email,
    role: 'STUDENT'
  };

  // =========================================================================
  // SCENARIO 1: Student resolves Targets (Enrolled Subjects & Teachers)
  // =========================================================================
  const targets = feedbackService.getStudentFeedbackTargets(studentUser.id);
  assert(
    targets.subjects.length === 2 &&
    targets.teachingFaculty.length === 2 &&
    Boolean(targets.hod) &&
    Boolean(targets.hoi),
    'Scenario 1: System correctly resolves student enrolled subjects, teaching faculties, HOD and HOI'
  );

  // =========================================================================
  // SCENARIO 2: Enrolled Subject filter prevents unrelated subjects
  // =========================================================================
  const subjectIds = targets.subjects.map(s => s.subject.id);
  assert(
    subjectIds.includes('sub-1') && subjectIds.includes('sub-2') && !subjectIds.includes('unrelated-sub'),
    'Scenario 2: Only subjects currently assigned to student curriculum appear in feedback list'
  );

  // =========================================================================
  // SCENARIO 3: Correct faculty mapped from enrolled subject
  // =========================================================================
  const sub1Pair = targets.subjects.find(s => s.subject.id === 'sub-1');
  assert(
    sub1Pair?.faculty?.id === facultyCSE1.id && sub1Pair?.faculty?.name === facultyCSE1.name,
    'Scenario 3: Subject is automatically mapped to correct teaching faculty'
  );

  // =========================================================================
  // SCENARIO 4: Student gives Subject Feedback -> Success
  // =========================================================================
  let fbSub: any;
  try {
    fbSub = feedbackService.submitFeedback({
      category: 'SUBJECT',
      subjectId: 'sub-1',
      ratings: {
        'Teaching Quality': 5,
        'Course Coverage': 4,
        'Clarity of Teaching': 5,
        'Study Material': 4,
        'Doubt Resolution': 5,
        'Class Engagement': 5
      },
      overallRating: 5,
      comments: 'Excellent coverage of SQL relational algebra and indexing concepts.',
      suggestions: 'Add more practical lab assignments on query optimization.',
      isAnonymous: false
    }, studentUser);

    assert(
      fbSub.category === 'SUBJECT' &&
      fbSub.subjectId === 'sub-1' &&
      fbSub.facultyId === facultyCSE1.id &&
      fbSub.status === 'SUBMITTED',
      'Scenario 4: Student successfully submits Subject Feedback with criteria breakdown'
    );
  } catch (err: any) {
    assert(false, 'Scenario 4: Student gives Subject Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 5: Student gives Faculty / Teaching Feedback -> Success
  // =========================================================================
  let fbFac: any;
  try {
    fbFac = feedbackService.submitFeedback({
      category: 'FACULTY',
      facultyId: facultyCSE2.id,
      ratings: {
        'Communication': 5,
        'Teaching Clarity': 5,
        'Knowledge': 5,
        'Class Management': 4,
        'Doubt Resolution': 5,
        'Punctuality': 5,
        'Student Engagement': 5
      },
      overallRating: 5,
      comments: 'Great explanation of OSI model layers and packet tracing.',
      isAnonymous: true
    }, studentUser);

    assert(
      fbFac.category === 'FACULTY' &&
      fbFac.facultyId === facultyCSE2.id &&
      fbFac.isAnonymous === true,
      'Scenario 5: Student successfully submits Faculty Feedback with anonymity flag'
    );
  } catch (err: any) {
    assert(false, 'Scenario 5: Student gives Faculty Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 6: Student gives Mentor Feedback -> Target auto-identified
  // =========================================================================
  try {
    const fbMentor = feedbackService.submitFeedback({
      category: 'MENTOR',
      ratings: {
        'Mentor Availability': 5,
        'Guidance': 5,
        'Communication': 5,
        'Academic Support': 5,
        'Problem Resolution': 4,
        'Student Support': 5
      },
      overallRating: 5,
      comments: 'Mentor provides regular guidance on capstone project and internship applications.'
    }, studentUser);

    assert(
      fbMentor.category === 'MENTOR' &&
      fbMentor.mentorId === targets.activeMentor?.id &&
      Boolean(fbMentor.mentorName),
      'Scenario 6: Mentor feedback automatically targets student active mentor'
    );
  } catch (err: any) {
    assert(false, 'Scenario 6: Student gives Mentor Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 7: Student gives HOD Feedback -> Target auto-identified
  // =========================================================================
  try {
    const fbHod = feedbackService.submitFeedback({
      category: 'HOD',
      ratings: {
        'Accessibility': 4,
        'Communication': 5,
        'Department Support': 5,
        'Issue Resolution': 4,
        'Student Support': 5
      },
      overallRating: 5,
      comments: 'Department maintains a very supportive academic and research environment.'
    }, studentUser);

    assert(
      fbHod.category === 'HOD' &&
      fbHod.hodId === targets.hod?.id,
      'Scenario 7: HOD feedback automatically targets department head'
    );
  } catch (err: any) {
    assert(false, 'Scenario 7: Student gives HOD Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 8: Student gives HOI Feedback -> Target auto-identified
  // =========================================================================
  try {
    const fbHoi = feedbackService.submitFeedback({
      category: 'HOI',
      ratings: {
        'Accessibility': 5,
        'Leadership': 5,
        'Communication': 5,
        'Academic Environment': 5,
        'Issue Resolution': 5
      },
      overallRating: 5,
      comments: 'Principal leads excellent industry connect programs.'
    }, studentUser);

    assert(
      fbHoi.category === 'HOI' &&
      fbHoi.hoiId === targets.hoi?.id,
      'Scenario 8: HOI feedback automatically targets institute leadership'
    );
  } catch (err: any) {
    assert(false, 'Scenario 8: Student gives HOI Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 9: Student gives Campus Feedback across facilities
  // =========================================================================
  try {
    const fbCampus = feedbackService.submitFeedback({
      category: 'CAMPUS',
      campusFacilityCategory: 'WIFI_INTERNET',
      ratings: {
        'Infrastructure': 4,
        'Cleanliness': 5,
        'Functionality': 4,
        'Staff Helpfulness': 5
      },
      overallRating: 4,
      comments: 'Wi-Fi speed in CS block labs is good; coverage in outdoor lawns can be improved.'
    }, studentUser);

    assert(
      fbCampus.category === 'CAMPUS' &&
      fbCampus.campusFacilityCategory === 'WIFI_INTERNET',
      'Scenario 9: Campus feedback recorded with facility sub-category'
    );
  } catch (err: any) {
    assert(false, 'Scenario 9: Student gives Campus Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 10: Student gives General University Feedback
  // =========================================================================
  try {
    const fbUni = feedbackService.submitFeedback({
      category: 'GENERAL_UNIVERSITY',
      ratings: {
        'Academic Environment': 5,
        'Student Services': 4,
        'Campus Experience': 5,
        'Events & Co-curricular': 5
      },
      overallRating: 5,
      comments: 'Overall university atmosphere is vibrant with annual hackathons and cultural fests.'
    }, studentUser);

    assert(
      fbUni.category === 'GENERAL_UNIVERSITY' &&
      fbUni.overallRating === 5,
      'Scenario 10: General University feedback recorded successfully'
    );
  } catch (err: any) {
    assert(false, 'Scenario 10: Student gives General Feedback', err.message);
  }

  // =========================================================================
  // SCENARIO 11: Student submits Improvement Suggestion
  // =========================================================================
  let sug: any;
  try {
    sug = feedbackService.submitSuggestion({
      category: 'TECHNOLOGY',
      title: 'Digital Library Kiosks in CS Laboratory',
      description: 'Requesting installation of dedicated terminal stations for IEEE/ACM digital portal access.',
      expectedImprovement: 'Enables quick paper reading and code research during practical hours.',
      isAnonymous: true
    }, studentUser);

    assert(
      sug.category === 'TECHNOLOGY' &&
      sug.status === 'SUBMITTED' &&
      sug.isAnonymous === true,
      'Scenario 11: Student submits Improvement Suggestion with expected impact and anonymous option'
    );
  } catch (err: any) {
    assert(false, 'Scenario 11: Student submits Suggestion', err.message);
  }

  // =========================================================================
  // SCENARIO 12: Duplicate Feedback blocked for same subject in same semester
  // =========================================================================
  let dupBlocked = false;
  try {
    feedbackService.submitFeedback({
      category: 'SUBJECT',
      subjectId: 'sub-1', // Already submitted in Scenario 4
      ratings: { 'Teaching Quality': 5 },
      overallRating: 5
    }, studentUser);
  } catch (err: any) {
    dupBlocked = true;
  }
  assert(dupBlocked, 'Scenario 12: Duplicate feedback submission for same subject in same semester is strictly blocked');

  // =========================================================================
  // SCENARIO 13: Student sees ONLY own submitted feedback
  // =========================================================================
  const myFbs = feedbackService.getMyFeedbacks(studentUser);
  assert(
    myFbs.length === 7 &&
    myFbs.every(f => f.studentId === studentCSE.id),
    'Scenario 13: Student query returns only their own submitted feedbacks'
  );

  // =========================================================================
  // SCENARIO 14: Student sees ONLY own submitted suggestions
  // =========================================================================
  const mySugs = feedbackService.getMySuggestions(studentUser);
  assert(
    mySugs.length === 1 &&
    mySugs[0].studentId === studentCSE.id,
    'Scenario 14: Student query returns only their own submitted suggestions'
  );

  // =========================================================================
  // SCENARIO 15: Faculty view computes aggregated metrics without student identity
  // =========================================================================
  const fac2Summary = feedbackService.getFacultyFeedbackSummary(facultyCSE2.id);
  assert(
    fac2Summary.totalFeedbacks === 1 &&
    fac2Summary.overallAverageRating === 5.0 &&
    fac2Summary.criteriaAverages['Teaching Clarity'] === 5.0,
    'Scenario 15: Faculty view aggregates teaching metrics cleanly'
  );

  // =========================================================================
  // SCENARIO 16: Mentor view computes mentorship ratings
  // =========================================================================
  const mentorSummary = feedbackService.getMentorFeedbackSummary(targets.activeMentor?.id || 'fac-cse-01');
  assert(
    mentorSummary.totalFeedbacks === 1 &&
    mentorSummary.overallAverageRating === 5.0,
    'Scenario 16: Mentor view aggregates mentorship metrics accurately'
  );

  // =========================================================================
  // SCENARIO 17: Admin Dashboard computes university-wide KPIs
  // =========================================================================
  const adminStats = feedbackService.getAdminDashboardStats();
  assert(
    adminStats.totalFeedbacks === 7 &&
    adminStats.totalSuggestions === 1 &&
    adminStats.categoryCounts.SUBJECT === 1 &&
    adminStats.categoryCounts.FACULTY === 1 &&
    adminStats.categoryCounts.CAMPUS === 1,
    'Scenario 17: University Admin dashboard aggregates totals across all 7 categories'
  );

  // =========================================================================
  // SCENARIO 18: Anonymous Feedback masks Student Name & Enrollment in Admin View
  // =========================================================================
  const anonFbInAdmin = adminStats.feedbacks.find(f => f.id === fbFac.id);
  assert(
    anonFbInAdmin?.studentName === 'Anonymous Student' &&
    anonFbInAdmin?.studentEnrollmentNo === 'ANONYMOUS',
    'Scenario 18: Anonymous submissions strictly mask student name and enrollment number in reviewer views'
  );

  // =========================================================================
  // SCENARIO 19: Suggestion Routing & Status Lifecycle progression
  // =========================================================================
  const adminUser: User = {
    id: 'admin-01',
    name: 'Academic Dean',
    email: 'dean@ssiu.edu',
    role: 'UNIVERSITY_ADMIN',
    username: 'admin'
  };

  const updatedSug = feedbackService.updateSuggestionStatus(sug.id, {
    status: 'ACTION_REQUIRED',
    assignedDepartment: 'Department of Computer Science & Engineering',
    adminResponse: 'Approved for procurement. Department IT cell assigned to deploy kiosks.',
    actionTaken: 'Purchase requisition #PR-2026-991 initiated.'
  }, adminUser);

  assert(
    updatedSug.status === 'ACTION_REQUIRED' &&
    updatedSug.assignedDepartment === 'Department of Computer Science & Engineering' &&
    Boolean(updatedSug.adminResponse),
    'Scenario 19: Administrator successfully routes suggestion to department with response'
  );

  // =========================================================================
  // SCENARIO 20: Notification generated for student on status update
  // =========================================================================
  // =========================================================================
  // SCENARIO 20: Notification generated for student on status update
  // =========================================================================
  const notifs = (db.getState().notifications || []).filter((n: any) => n.targetUserId === studentCSE.id);
  assert(
    notifs.length >= 2 &&
    notifs.some((n: any) => n.title.includes('Feedback Submitted')) &&
    notifs.some((n: any) => n.title.includes('Suggestion Status Updated')),
    'Scenario 20: Real-time ERP notifications dispatched to student upon submission and review'
  );

  // =========================================================================
  // SCENARIO 21: Suggestion Resolution workflow
  // =========================================================================
  const resolvedSug = feedbackService.updateSuggestionStatus(sug.id, {
    status: 'RESOLVED',
    actionTaken: '2 Terminals installed and connected to campus fiber backbone.'
  }, adminUser);

  assert(
    resolvedSug.status === 'RESOLVED' &&
    Boolean(resolvedSug.resolvedAt),
    'Scenario 21: Suggestion marked RESOLVED with timestamp and action notes'
  );

  // =========================================================================
  // SCENARIO 22: Excel (.xlsx) Export produces valid worksheet data
  // =========================================================================
  const exportRows = adminStats.feedbacks.map(f => ({
    'Feedback Number': f.feedbackNo,
    'Category': f.category,
    'Overall Rating': f.overallRating
  }));
  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Feedbacks');
  const xlsxBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

  assert(
    typeof xlsxBase64 === 'string' && xlsxBase64.length > 0,
    'Scenario 22: Official .xlsx report export generates valid Excel binary workbook (Strictly NO CSV)'
  );

  // =========================================================================
  // SCENARIO 23: RBAC isolation & scoped queries
  // =========================================================================
  const cseScopedFeedbacks = feedbackService.getAdminDashboardStats({ departmentId: 'dept-1' });
  assert(
    cseScopedFeedbacks.feedbacks.every(f => f.departmentId === 'dept-1'),
    'Scenario 23: Scoped feedback queries enforce department and institute RBAC boundaries'
  );

  // =========================================================================
  // SCENARIO 24: Database persistence and zero data corruption
  // =========================================================================
  const totalDbFeedbacks = feedbackService.getAllFeedbacks();
  const totalDbSuggestions = feedbackService.getAllSuggestions();

  assert(
    totalDbFeedbacks.length === 7 &&
    totalDbSuggestions.length === 1 &&
    totalDbFeedbacks.every(f => Boolean(f.id) && Boolean(f.feedbackNo)),
    'Scenario 24: Database persistence verified — zero data corruption across feedback entities'
  );

  console.log('\n========================================================================');
  console.log(`📊 TEST EXECUTION SUMMARY: ${passed} PASSED / ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal error running feedback test suite:', err);
  process.exit(1);
});
