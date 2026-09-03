declare const process: any;

import { db } from '../services/db';
import { smartActionCenterService } from '../services/actionCenterService';
import { User, SmartActionItem } from '../types';

// Mock Users
const studentUser: User = {
  id: 'stu-2',
  name: 'Demo Student Two',
  username: 'student2',
  email: 'student2@ssiu-demo.ac.in',
  role: 'STUDENT',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  enrollmentNo: '230101002',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const facultyUser: User = {
  id: 'fac-1',
  name: 'Dr. Rajesh Patel',
  username: 'rpatel',
  email: 'rajesh.patel@swarrnim.edu.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const hodUser: User = {
  id: 'user-hod-1',
  name: 'Dr. K. Sharma',
  username: 'ksharma',
  email: 'hod.ce@swarrnim.edu.in',
  role: 'HOD',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const principalUser: User = {
  id: 'user-principal-1',
  name: 'Dr. S. Verma',
  username: 'sverma',
  email: 'principal@swarrnim.edu.in',
  role: 'PRINCIPAL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const registrarUser: User = {
  id: 'user-registrar-1',
  name: 'Shri R. Mehta',
  username: 'rmehta',
  email: 'registrar@swarrnim.edu.in',
  role: 'REGISTRAR',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const adminUser: User = {
  id: 'user-admin',
  name: 'Super Admin',
  username: 'admin',
  email: 'admin@swarrnim.edu.in',
  role: 'SUPER_ADMIN',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    testsFailed++;
  }
}

async function runSmartActionCenterTests() {
  console.log('\n🎯 STARTING SSIU SMART ACTION CENTER ("WHAT NEEDS MY ATTENTION?") TEST SUITE\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Student Action Center
  // ──────────────────────────────────────────────────────────────────────────
  const studentActions = smartActionCenterService.getSmartActionItems(studentUser, 'STUDENT');

  assert(studentActions.length > 0, '1.1 Student receives personalized actionable items');
  
  const feeAction = studentActions.find(a => a.category === 'FEE');
  assert(Boolean(feeAction), '1.2 Student has Pending Fee Dues action card');
  assert(feeAction?.targetTab === 'fees', '1.3 Fee action card navigates directly to fees tab');
  assert(feeAction?.takeActionText === 'Pay Fee Online', '1.4 Fee action button labeled "Pay Fee Online"');

  const examAction = studentActions.find(a => a.category === 'EXAM');
  assert(Boolean(examAction), '1.5 Student has Upcoming Examination action card');
  assert(examAction?.targetTab === 'exam-dashboard', '1.6 Exam action navigates directly to exam-dashboard tab');

  const assignmentAction = studentActions.find(a => a.category === 'ASSIGNMENT');
  assert(Boolean(assignmentAction), '1.7 Student has Pending Coursework Assignment card');
  assert(assignmentAction?.targetTab === 'assignments', '1.8 Assignment card navigates directly to assignments tab');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Faculty Action Center
  // ──────────────────────────────────────────────────────────────────────────
  const facultyActions = smartActionCenterService.getSmartActionItems(facultyUser, 'FACULTY');

  assert(facultyActions.length > 0, '2.1 Faculty receives personalized actionable items');

  const diaryAction = facultyActions.find(a => a.category === 'WORK_DIARY');
  assert(Boolean(diaryAction), '2.2 Faculty has Daily Work Diary Pending card');
  assert(diaryAction?.targetTab === 'work-diary', '2.3 Work diary card navigates directly to work-diary tab');

  const edpAction = facultyActions.find(a => a.category === 'EDP_DUTY');
  assert(Boolean(edpAction), '2.4 Faculty has Classroom EDP Duties Assigned card');
  assert(edpAction?.targetTab === 'edp-duties', '2.5 EDP duty card navigates directly to edp-duties tab');

  const attAction = facultyActions.find(a => a.category === 'ATTENDANCE');
  assert(Boolean(attAction), '2.6 Faculty has Classroom Attendance Entry card');
  assert(attAction?.targetTab === 'attendance', '2.7 Attendance card navigates directly to attendance tab');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: HOD Action Center
  // ──────────────────────────────────────────────────────────────────────────
  const hodActions = smartActionCenterService.getSmartActionItems(hodUser, 'HOD');

  assert(hodActions.length > 0, '3.1 HOD receives department actionable items');

  const hodApprovalAction = hodActions.find(a => a.id === 'act-hod-approval-inbox');
  assert(Boolean(hodApprovalAction), '3.2 HOD has Department Digital Approval Inbox card');
  assert(hodApprovalAction?.priority === 'CRITICAL', '3.3 Department Approval Inbox is marked CRITICAL priority');
  assert(hodApprovalAction?.targetTab === 'requests', '3.4 Approval card navigates directly to requests desk');

  const hodEdpVerifyAction = hodActions.find(a => a.id === 'act-hod-edp-verify');
  assert(Boolean(hodEdpVerifyAction), '3.5 HOD has Classroom EDP Duties Verification card');
  assert(hodEdpVerifyAction?.targetTab === 'edp-duties', '3.6 Verification card navigates directly to edp-duties tab');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Principal Action Center
  // ──────────────────────────────────────────────────────────────────────────
  const principalActions = smartActionCenterService.getSmartActionItems(principalUser, 'PRINCIPAL');

  assert(principalActions.length > 0, '4.1 Principal receives institutional actionable items');

  const principalInbox = principalActions.find(a => a.id === 'act-principal-inbox');
  assert(Boolean(principalInbox), '4.2 Principal has Institutional Approval Inbox card');
  assert(principalInbox?.priority === 'CRITICAL', '4.3 Principal Approval Inbox is marked CRITICAL priority');

  const principalAdmissions = principalActions.find(a => a.id === 'act-principal-admissions');
  assert(Boolean(principalAdmissions), '4.4 Principal has Admissions Sanction card');
  assert(principalAdmissions?.targetTab === 'admission-desk', '4.5 Admissions card navigates directly to admission-desk');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Executive Admin & Registrar Action Center
  // ──────────────────────────────────────────────────────────────────────────
  const registrarActions = smartActionCenterService.getSmartActionItems(registrarUser, 'REGISTRAR');
  const adminActions = smartActionCenterService.getSmartActionItems(adminUser, 'SUPER_ADMIN');

  assert(registrarActions.length > 0, '5.1 Registrar receives university-wide actionable items');
  assert(adminActions.length > 0, '5.2 Super Admin receives executive actionable items');

  const execInbox = registrarActions.find(a => a.id === 'act-exec-approval-inbox');
  assert(Boolean(execInbox), '5.3 Registrar has Central University Approval Inbox card');
  assert(execInbox?.priority === 'CRITICAL', '5.4 Central Approval Inbox marked CRITICAL priority');

  const inwardAction = adminActions.find(a => a.id === 'act-exec-inward');
  assert(Boolean(inwardAction), '5.5 Admin has Inward/Outward Document Actions card');
  assert(inwardAction?.targetTab === 'inward-outward', '5.6 Inward card navigates to inward-outward tab');

  const crmAction = adminActions.find(a => a.id === 'act-exec-crm');
  assert(Boolean(crmAction), '5.7 Admin has High Priority Admission Leads card');
  assert(crmAction?.targetTab === 'crm', '5.8 CRM action card navigates to crm tab');

  const campusMaintAction = adminActions.find(a => a.id === 'act-exec-campus');
  assert(Boolean(campusMaintAction), '5.9 Admin has Campus Maintenance Work Orders card');
  assert(campusMaintAction?.targetTab === 'campus-services', '5.10 Maintenance card navigates to campus-services tab');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Strict Priority Ordering
  // ──────────────────────────────────────────────────────────────────────────
  const priorityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  };

  let isSorted = true;
  for (let i = 0; i < adminActions.length - 1; i++) {
    if (priorityWeight[adminActions[i].priority] < priorityWeight[adminActions[i + 1].priority]) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, '6.1 Action cards strictly sorted by priority (CRITICAL -> HIGH -> MEDIUM -> LOW)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================\n');
}

import { describe, it, expect } from 'vitest';

describe('SSIU Smart Action Center ("What Needs My Attention?")', () => {
  it('executes all 37 action center assertions cleanly without error', async () => {
    await runSmartActionCenterTests();
    expect(testsFailed).toBe(0);
    expect(testsPassed).toBeGreaterThanOrEqual(30);
  });
});
