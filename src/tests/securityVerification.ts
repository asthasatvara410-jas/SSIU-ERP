declare const process: any;

import { db } from '../services/db';
import { 
  canUserAccessCampusService, 
  canUserAccessApprovalCategory, 
  getPermittedCampusServices, 
  getPermittedApprovalCategories 
} from '../services/securityService';
import { User } from '../types';

// Mock Users
const studentA: User = {
  id: 'stu-1',
  name: 'ABC Student 1',
  username: 'student1',
  email: 'abc.student1@ssiu-demo.ac.in',
  role: 'STUDENT',
  enrollmentNo: 'STUDENT-001',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const studentB: User = {
  id: 'stu-2',
  name: 'ABC Student 2',
  username: 'student2',
  email: 'abc.student2@ssiu-demo.ac.in',
  role: 'STUDENT',
  enrollmentNo: 'STUDENT-002',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const hostelAdminUser: User = {
  id: 'user-hostel-admin',
  name: 'Demo Hostel Warden',
  username: 'hosteladmin',
  email: 'hostel@ssiu-demo.ac.in',
  role: 'HOSTEL_ADMIN',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const transportAdminUser: User = {
  id: 'user-transport-admin',
  name: 'Demo Transport Head',
  username: 'transportadmin',
  email: 'transport@ssiu-demo.ac.in',
  role: 'TRANSPORT_ADMIN',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const superAdminUser: User = {
  id: 'user-admin',
  name: 'Executive Super Admin',
  username: 'admin',
  email: 'admin@ssiu-demo.ac.in',
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

async function runSecurityTests() {
  console.log('\n🔒 STARTING SSIU ERP REQUEST SECURITY & AUTHORIZATION TEST SUITE\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Student A creates Approval Request and Campus Service Request
  // ──────────────────────────────────────────────────────────────────────────
  const reqAApproval = db.addApprovalRequest({
    category: 'BONAFIDE_CERTIFICATE',
    title: 'Student A Bonafide for Bank Loan',
    description: 'Required urgently for bank education loan',
    priority: 'HIGH',
    targetOffice: 'STUDENT_SECTION',
    currentOffice: 'STUDENT_SECTION',
    status: 'PENDING',
    attachments: []
  }, 'Initial application', studentA, 'STUDENT');

  const reqACampus = db.createCampusServiceRequest({
    service: 'Hostel',
    subject: 'Room 101 Fan Regulator Repair',
    description: 'Fan regulator stuck at high speed',
    location: 'Hostel Block A, Room 101',
    priority: 'MEDIUM'
  }, studentA, 'STUDENT');

  assert(Boolean(reqAApproval && reqAApproval.id), '1.1 Student A successfully creates Approval Request');
  assert(Boolean(reqACampus && reqACampus.id), '1.2 Student A successfully creates Campus Service Request');
  assert(reqAApproval.applicantId === studentA.id, '1.3 Approval request applicant ID matches Student A session');
  assert(reqACampus.requestedById === studentA.id, '1.4 Campus request requestedBy ID matches Student A session');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2 & 3: Student B logs in - Student B MUST NOT see Student A's requests in List queries
  // ──────────────────────────────────────────────────────────────────────────
  const studentBApprovalList = db.getScopedApprovalRequests(studentB, 'STUDENT');
  const studentBCampusList = db.getCampusServiceRequests(undefined, studentB, 'STUDENT');

  const studentBSeesReqAApproval = studentBApprovalList.some(r => r.id === reqAApproval.id);
  const studentBSeesReqACampus = studentBCampusList.some(r => r.id === reqACampus.id);

  assert(!studentBSeesReqAApproval, '3.1 Student B list query CANNOT see Student A Approval Request (Data Isolation Enforced)');
  assert(!studentBSeesReqACampus, '3.2 Student B list query CANNOT see Student A Campus Service Request (Data Isolation Enforced)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4 & 5: Student B attempts to directly query Student A's Request by ID
  // ──────────────────────────────────────────────────────────────────────────
  const auditLogsBefore = db.getAuditLogs().length;

  const directApprovalAttempt = db.getApprovalRequestById(reqAApproval.id, studentB, 'STUDENT');
  const directCampusAttempt = db.getCampusServiceRequestById(reqACampus.id, studentB, 'STUDENT');

  assert(directApprovalAttempt === null, '5.1 Direct ID query on Student A Approval Request by Student B is REJECTED (Returns null/403)');
  assert(directCampusAttempt === null, '5.2 Direct ID query on Student A Campus Service Request by Student B is REJECTED (Returns null/403)');

  const latestAuditLogs = db.getAuditLogs();
  const unauthorizedLogFound = latestAuditLogs.some(
    log => log.action === 'UNAUTHORIZED_ACCESS_ATTEMPT' && log.userName === studentB.name
  );
  assert(unauthorizedLogFound, '5.3 Backend logs UNAUTHORIZED_ACCESS_ATTEMPT in central audit trail');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Service & Category Visibility & Validation
  // ──────────────────────────────────────────────────────────────────────────
  const studentPermittedServices = getPermittedCampusServices('STUDENT');
  const studentPermittedCategories = getPermittedApprovalCategories('STUDENT');

  assert(studentPermittedServices.includes('Hostel'), '6.1 Student permitted to request Hostel service');
  assert(studentPermittedServices.includes('Transport'), '6.2 Student permitted to request Transport service');
  assert(studentPermittedServices.includes('IT Support'), '6.3 Student permitted to request IT Support service');
  assert(!studentPermittedServices.includes('Security' as any), '6.4 Student is NOT permitted to request internal Security service');

  assert(studentPermittedCategories.includes('BONAFIDE_CERTIFICATE'), '6.5 Student permitted category BONAFIDE_CERTIFICATE');
  assert(studentPermittedCategories.includes('RE_EVALUATION'), '6.6 Student permitted category RE_EVALUATION');
  assert(!studentPermittedCategories.includes('RESEARCH_GRANT' as any), '6.7 Student is NOT permitted internal category RESEARCH_GRANT');
  assert(!studentPermittedCategories.includes('LEAVE_APPLICATION' as any), '6.8 Student is NOT permitted internal category LEAVE_APPLICATION');

  // Backend validation: Student attempting to forge creation of unauthorized category
  let unauthorizedCreateCaught = false;
  try {
    db.addApprovalRequest({
      category: 'RESEARCH_GRANT' as any,
      title: 'Forged Research Grant Request',
      description: 'Tampered attempt',
      priority: 'HIGH',
      targetOffice: 'IQAC',
      currentOffice: 'IQAC',
      status: 'PENDING',
      attachments: []
    }, 'tamper', studentA, 'STUDENT');
  } catch (err: any) {
    unauthorizedCreateCaught = true;
  }
  assert(unauthorizedCreateCaught, '6.9 Backend rejects unauthorized category creation with 403 Forbidden exception');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Authority Isolation (Hostel Admin vs Transport Admin)
  // ──────────────────────────────────────────────────────────────────────────
  const reqTransport = db.createCampusServiceRequest({
    service: 'Transport',
    subject: 'Route 12 Bus Schedule Delay',
    description: 'Need morning timing adjustment',
    location: 'Bus Stop Circle 4',
    priority: 'HIGH'
  }, superAdminUser, 'SUPER_ADMIN');

  const hostelAdminCampusList = db.getCampusServiceRequests(undefined, hostelAdminUser, 'HOSTEL_ADMIN');
  const hostelSeesTransport = hostelAdminCampusList.some(r => r.id === reqTransport.id);
  assert(!hostelSeesTransport, '7.1 Hostel Authority CANNOT see Transport restricted requests');

  const transportAdminCampusList = db.getCampusServiceRequests(undefined, transportAdminUser, 'TRANSPORT_ADMIN');
  const transportSeesTransport = transportAdminCampusList.some(r => r.id === reqTransport.id);
  assert(transportSeesTransport, '7.2 Transport Authority sees Transport requests');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Super Admin & University Admin retain authorized access
  // ──────────────────────────────────────────────────────────────────────────
  const adminApprovalList = db.getScopedApprovalRequests(superAdminUser, 'SUPER_ADMIN');
  const adminCampusList = db.getCampusServiceRequests(undefined, superAdminUser, 'SUPER_ADMIN');

  assert(adminApprovalList.some(r => r.id === reqAApproval.id), '8.1 Super Admin retains full authorized visibility of approval requests');
  assert(adminCampusList.some(r => r.id === reqACampus.id), '8.2 Super Admin retains full authorized visibility of campus service requests');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST SUMMARY
  // ──────────────────────────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log('========================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
