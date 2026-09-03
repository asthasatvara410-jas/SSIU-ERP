// ==============================================================================
// SWARRNIM UNIVERSITY ERP — STUDENT PTM CONSULTATION MODULE TEST SUITE
// Automated verification for /?tab=student-ptm route & service functionality
// ==============================================================================

import { db } from '../src/services/db';
import { ptmService } from '../src/services/ptmService';
import { User, Student } from '../src/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

async function runStudentPTMTests() {
  console.log('======================================================================');
  console.log('  SSIU ERP — STUDENT PTM CONSULTATION WORKFLOW TEST SUITE');
  console.log('======================================================================\n');

  const students = db.getStudents();
  const student = students[0];
  const users = db.getUsers();
  const studentUser = users.find(u => u.role === 'STUDENT' || u.username === student.enrollmentNo) || {
    id: `user-${student.id}`,
    name: student.name,
    email: student.email,
    username: student.enrollmentNo,
    role: 'STUDENT' as const,
    status: 'ACTIVE' as const,
    createdAt: new Date().toISOString()
  };

  const faculty = db.getFaculty()[0];

  // 1. Verify Student Master exists
  assert(Boolean(student), `Resolved active student master: ${student.name} (${student.enrollmentNo})`);

  // 2. Verify ptmService returns PTM history for student user without error
  const history = ptmService.getPTMHistoryForStudent(student.id, studentUser, 'STUDENT');
  assert(Array.isArray(history.schedules), 'getPTMHistoryForStudent returns schedules array');
  assert(Array.isArray(history.records), 'getPTMHistoryForStudent returns records array');
  assert(Array.isArray(history.followUps), 'getPTMHistoryForStudent returns followUps array');

  // 3. Verify student consultation request creation
  const uniqueKey = Date.now();
  const consultation = ptmService.requestStudentConsultation({
    studentId: student.id,
    facultyId: faculty.id,
    preferredDate: '2026-09-10',
    preferredTime: '11:00 AM - 11:30 AM',
    mode: 'PHYSICAL',
    agenda: 'Mid-semester performance review and project mentoring guidance',
    meetingType: 'Academic Mentoring & Performance Review'
  }, studentUser);

  assert(Boolean(consultation.id), `Consultation schedule created with ID: ${consultation.id}`);
  assert(consultation.studentId === student.id, 'Consultation mapped to correct student ID');
  assert(consultation.facultyId === faculty.id, 'Consultation mapped to selected faculty ID');
  assert(consultation.status === 'SCHEDULED', 'Consultation status is SCHEDULED');

  // 4. Verify the newly requested consultation appears in student history
  const refreshedHistory = ptmService.getPTMHistoryForStudent(student.id, studentUser, 'STUDENT');
  const foundReq = refreshedHistory.schedules.find(s => s.id === consultation.id);
  assert(Boolean(foundReq), 'Requested consultation appears in refreshed student history');

  // 5. Verify demo fallback resolution
  const fallbackUser: User = {
    id: 'user-demo-student-unlinked',
    name: 'Demo Student Unlinked',
    email: 'unlinked@example.com',
    username: '999999999',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };
  const fallbackHistory = ptmService.getPTMHistoryForStudent(student.id, fallbackUser, 'STUDENT');
  assert(Array.isArray(fallbackHistory.schedules), 'Fallback student user gracefully accesses PTM schedules without throwing');

  console.log('\n======================================================================');
  console.log(`  STUDENT PTM VERIFICATION COMPLETE: ${passedTests} / ${totalTests} Passed (${failedTests} Failed)`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runStudentPTMTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
