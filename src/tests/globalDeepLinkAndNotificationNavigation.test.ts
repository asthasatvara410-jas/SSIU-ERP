declare const process: any;

import { db } from '../services/db';
import { notificationService } from '../services/notificationService';
import { smartActionCenterService } from '../services/actionCenterService';
import { User, ERPNotification, NoteSheet } from '../types';

function assert(condition: boolean, testName: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

export async function runGlobalDeepLinkAndNotificationTests(): Promise<void> {
  console.log('\n========================================================================');
  console.log('TEST SUITE: GLOBAL NOTIFICATION + DASHBOARD ACTION DEEP-LINK SYSTEM');
  console.log('========================================================================\n');

  db.resetToDefaultSeed();

  const allUsers = db.getUsers();

  const facultyA: User = {
    id: 'usr-fac-1',
    name: 'Prof. Faculty One',
    email: 'fac1@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const hodA: User = {
    id: 'usr-hod-1',
    name: 'Dr. HOD One',
    email: 'hod1@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const principal: User = {
    id: 'usr-hoi-1',
    name: 'Dr. Principal SIT',
    email: 'principal@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const registrar: User = {
    id: 'usr-reg-1',
    name: 'Dr. Registrar SSIU',
    email: 'registrar@swarrnim.edu.in',
    role: 'REGISTRAR',
    instituteId: 'inst-1',
    departmentId: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const student: User = {
    id: 'usr-stu-1',
    name: 'Aarav Patel',
    email: 'student@swarrnim.edu.in',
    role: 'STUDENT',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    enrollmentNo: '20240101001',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  // ─── 1. NOTIFICATION DEEP LINK TARGET RESOLUTION ───────────────────────────
  console.log('--- 1. Notification Deep-Link Target Resolution ---');

  // 1.1 Notesheet Notification
  const nsNotif: ERPNotification = {
    id: 'notif-ns-test',
    module: 'NOTESHEET',
    type: 'APPROVAL_REQUIRED',
    title: 'Notesheet NS-SIT-0826-001 Pending Approval',
    message: 'Notesheet NS-SIT-0826-001 requires your approval.',
    referenceId: 'ns-rec-12345',
    createdAt: new Date().toISOString(),
    isReadByUsers: []
  };
  const nsTarget = notificationService.resolveNotificationTarget(nsNotif, hodA, 'HOD');
  assert(nsTarget.tab === 'notesheet-pending' || nsTarget.tab.includes('notesheet'), '1.1a Notesheet target tab resolved');
  assert(nsTarget.params.recordId === 'ns-rec-12345', '1.1b Notesheet exact recordId preserved');
  assert(nsTarget.params.actionType === 'APPROVE', '1.1c Notesheet actionType APPROVE set');
  assert(nsTarget.params.initialTab === 'PENDING_WITH_ME', '1.1d Notesheet initialTab set to PENDING_WITH_ME');

  // 1.2 Digital Request Notification
  const reqNotif: ERPNotification = {
    id: 'notif-req-test',
    module: 'APPROVAL',
    type: 'ACTION_REQUIRED',
    title: 'Bonafide Certificate Request',
    message: 'Student Aarav Patel submitted a certificate request.',
    referenceId: 'req-bonafide-999',
    createdAt: new Date().toISOString(),
    isReadByUsers: []
  };
  const reqTarget = notificationService.resolveNotificationTarget(reqNotif, hodA, 'HOD');
  assert(reqTarget.tab === 'requests', '1.2a Request target tab is requests');
  assert(reqTarget.params.recordId === 'req-bonafide-999', '1.2b Request exact recordId preserved');
  assert(reqTarget.params.initialQueue === 'PENDING_MY_ACTION', '1.2c Request queue is PENDING_MY_ACTION');

  // 1.3 Hostel Notification
  const hostelNotif: ERPNotification = {
    id: 'notif-hostel-test',
    module: 'HOSTEL',
    type: 'ACTION_REQUIRED',
    title: 'Hostel Maintenance Request',
    message: 'Electrical repair needed in Room B-204.',
    referenceId: 'hostel-maint-555',
    createdAt: new Date().toISOString(),
    isReadByUsers: []
  };
  const hostelTarget = notificationService.resolveNotificationTarget(hostelNotif, registrar, 'HOSTEL_ADMIN');
  assert(hostelTarget.tab === 'hostel-admin', '1.3a Hostel target tab is hostel-admin');
  assert(hostelTarget.params.recordId === 'hostel-maint-555', '1.3b Hostel exact recordId preserved');
  assert(hostelTarget.params.subFilter === 'MAINTENANCE', '1.3c Hostel subFilter is MAINTENANCE');

  // 1.4 Fees & Accounts Notification
  const feeNotif: ERPNotification = {
    id: 'notif-fee-test',
    module: 'FEES',
    type: 'ACTION_REQUIRED',
    title: 'Fee Payment Dues',
    message: 'Semester 3 fee installment pending.',
    referenceId: 'fee-rec-777',
    createdAt: new Date().toISOString(),
    isReadByUsers: []
  };
  const feeTarget = notificationService.resolveNotificationTarget(feeNotif, student, 'STUDENT');
  assert(feeTarget.tab === 'fees', '1.4a Student fee target tab is fees');
  assert(feeTarget.params.recordId === 'fee-rec-777', '1.4b Fee recordId preserved');

  // ─── 2. SMART ACTION CENTER DEEP-LINK METADATA ─────────────────────────────
  console.log('\n--- 2. Smart Action Center ("What Needs My Attention?") Metadata ---');

  // Create a pending notesheet for HOD
  const newNs = db.createNoteSheet({
    subject: 'AI Lab Server Procurement',
    proposal: 'Procurement of High-performance server',
    purposeJustification: 'Needed for research',
    instituteId: 'inst-1',
    departmentId: 'dept-1',
    financialRequirement: true,
    estimatedCost: 200000,
    requestedAmount: 200000
  }, facultyA, false);

  const hodActions = smartActionCenterService.getSmartActionItems(hodA, 'HOD');
  const hodNsAction = hodActions.find(a => a.id === 'act-hod-notesheets');
  assert(Boolean(hodNsAction), '2.1 HOD has Notesheets Action Item');
  assert(Boolean(hodNsAction?.targetRecordId), '2.2 HOD Notesheet Action Item has targetRecordId');
  assert(hodNsAction?.targetParams?.actionType === 'APPROVE', '2.3 HOD Notesheet Action Item has actionType APPROVE');
  assert(hodNsAction?.targetParams?.initialTab === 'PENDING_WITH_ME', '2.4 HOD Notesheet Action Item has initialTab PENDING_WITH_ME');

  // Student Actions
  const studentActions = smartActionCenterService.getSmartActionItems(student, 'STUDENT');
  const studentFeeAction = studentActions.find(a => a.id === 'act-student-fee');
  if (studentFeeAction) {
    assert(Boolean(studentFeeAction.targetRecordId), '2.5 Student Fee Action has targetRecordId');
    assert(studentFeeAction.targetParams?.actionType === 'PAY', '2.6 Student Fee Action has actionType PAY');
  }

  // ─── 3. NOTIFICATION MARK READ ON CLICK ────────────────────────────────────
  console.log('\n--- 3. Notification Read State & Unread Badge ---');

  const createdNotif = notificationService.createNotification({
    type: 'ACTION_REQUIRED',
    title: 'Deep Link Test Notification',
    message: 'Click to open record NS-001',
    module: 'NOTESHEET',
    referenceId: newNs.id,
    targetUserId: hodA.id
  });

  const unreadBefore = db.getUnreadNotificationCount(hodA, 'HOD');
  assert(unreadBefore > 0, '3.1 Unread count is > 0 before click');

  // Click action simulation
  db.markNotificationAsRead(createdNotif.id, hodA.id);
  const unreadAfter = db.getUnreadNotificationCount(hodA, 'HOD');
  assert(unreadAfter === unreadBefore - 1, '3.2 Unread count decremented by exactly 1 on click');

  const notifInDb = db.getNotifications(hodA, 'HOD').find(n => n.id === createdNotif.id);
  assert(Boolean(notifInDb?.isReadByUsers?.includes(hodA.id)), '3.3 Notification is marked as read in database');

  // ─── 4. SECURITY & AUTHORIZATION ON DEEP-LINK OPEN ─────────────────────────
  console.log('\n--- 4. Deep-Link Access Control & Authorization Guard ---');

  // Authorized HOD access
  assert(db.isUserAuthorizedForNotesheet(hodA, 'HOD', newNs), '4.1 HOD is authorized to open target notesheet NS-001');

  // Unauthorized unrelated faculty access
  const unrelatedFaculty: User = {
    id: 'usr-unrelated',
    name: 'Prof. Unrelated',
    email: 'unrelated@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-2',
    departmentId: 'dept-pharmacy',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  const isUnrelatedAuth = db.isUserAuthorizedForNotesheet(unrelatedFaculty, 'FACULTY', newNs);
  assert(!isUnrelatedAuth, '4.2 Unrelated faculty is DENIED access to notesheet NS-001');

  const unauthAuthorizedList = db.getAuthorizedNotesheetsForUser(unrelatedFaculty, 'FACULTY');
  assert(!unauthAuthorizedList.some(n => n.id === newNs.id), '4.3 Target notesheet is NOT in unauthorized user dataset');

  console.log('\n========================================================================');
  console.log('ALL GLOBAL DEEP-LINK & NOTIFICATION TESTS PASSED SUCCESSFULLY');
  console.log('========================================================================\n');
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('globalDeepLinkAndNotificationNavigation.test')) {
  runGlobalDeepLinkAndNotificationTests().catch(err => {
    console.error('Test Suite Exception:', err);
    process.exit(1);
  });
}
