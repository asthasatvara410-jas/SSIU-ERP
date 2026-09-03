declare const process: any;

import { db } from '../services/db';
import { securityAuditService } from '../services/securityAuditService';
import { reportEngine } from '../services/reportService';
import { User, AuditLog, SecurityAlert } from '../types';

// Mock Users
const adminUser: User = {
  id: 'user-superadmin',
  name: 'Super Admin',
  username: 'admin',
  email: 'admin@swarrnim.edu.in',
  role: 'SUPER_ADMIN',
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

const studentUser: User = {
  id: 'stu-1',
  name: 'Demo Student One',
  username: 'student1',
  email: 'student1@ssiu-demo.ac.in',
  role: 'STUDENT',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  enrollmentNo: '230101001',
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

async function runSecurityAuditCenterTests() {
  console.log('\n🔒 STARTING SSIU PHASE 4: SECURITY & AUDIT CENTER TEST SUITE\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Login & Session Activity Tracking
  // ──────────────────────────────────────────────────────────────────────────
  const initialLogsCount = db.getAuditLogs().length;

  // 1.1 Track Successful Login
  securityAuditService.trackLoginSuccess(facultyUser, '192.168.1.155', 'Mozilla/5.0 Chrome/128.0');
  const logsAfterLogin = db.getAuditLogs();
  assert(logsAfterLogin.length === initialLogsCount + 1, '1.1 Successful login recorded in central audit ledger');
  
  const loginLog = logsAfterLogin[0];
  assert(loginLog.action === 'LOGIN_SUCCESS', '1.2 Action event recorded as LOGIN_SUCCESS');
  assert(loginLog.userName === facultyUser.name, '1.3 User identity accurately recorded');
  assert(loginLog.ipAddress === '192.168.1.155', '1.4 Client IP address accurately captured');
  assert(loginLog.status === 'SUCCESS', '1.5 Audit status is SUCCESS');

  // 1.2 Track Single Failed Login
  securityAuditService.trackLoginFailure('unknown_user@ssiu.edu.in', 'Account not found', '192.168.1.200');
  const logsAfterFail = db.getAuditLogs();
  const failLog = logsAfterFail[0];
  assert(failLog.action === 'LOGIN_FAILED', '1.6 Failed login attempt recorded with LOGIN_FAILED');
  assert(failLog.status === 'FAILED', '1.7 Status is FAILED');

  // 1.3 Track Multiple Consecutive Failed Logins -> Trigger Security Alert
  const bruteForceTarget = 'target_finance_admin';
  securityAuditService.trackLoginFailure(bruteForceTarget, 'Invalid password', '10.0.0.99');
  securityAuditService.trackLoginFailure(bruteForceTarget, 'Invalid password', '10.0.0.99');
  securityAuditService.trackLoginFailure(bruteForceTarget, 'Invalid password', '10.0.0.99');

  const alerts = securityAuditService.getSecurityAlerts(adminUser, 'SUPER_ADMIN');
  const bruteForceAlert = alerts.find(a => a.affectedUser === bruteForceTarget);
  assert(Boolean(bruteForceAlert), '1.8 Multiple failed logins heuristic triggered Security Alert');
  assert(bruteForceAlert?.severity === 'HIGH', '1.9 Security alert severity is HIGH');
  assert(bruteForceAlert?.triggerCount! >= 3, '1.10 Trigger count reflects threshold violations');

  // 1.4 Track Logout
  securityAuditService.trackLogout(facultyUser, '192.168.1.155');
  const logoutLog = db.getAuditLogs()[0];
  assert(logoutLog.action === 'LOGOUT', '1.11 User logout event recorded in audit trail');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: User Activity Tracking (CRUD & Governance Operations)
  // ──────────────────────────────────────────────────────────────────────────
  // 2.1 CREATE Entity
  const createLog = securityAuditService.logSecurityEvent(
    'CREATE',
    'STUDENT',
    'Student Enrollment Record',
    'Enrolled new undergraduate student candidate (230101099).',
    adminUser,
    'SUPER_ADMIN',
    { recordId: 'stu-99', status: 'SUCCESS', severity: 'INFO' }
  );
  assert(createLog.action === 'CREATE', '2.1 CREATE action recorded with target entity and record ID');
  assert(createLog.recordId === 'stu-99', '2.2 Target Record ID linked');

  // 2.2 UPDATE Entity
  const updateLog = securityAuditService.logSecurityEvent(
    'UPDATE',
    'FEES',
    'Student Fee Structure',
    'Updated tuition fee discount concession by 15%.',
    adminUser,
    'SUPER_ADMIN',
    { recordId: 'fee-struct-01', status: 'SUCCESS', severity: 'INFO' }
  );
  assert(updateLog.action === 'UPDATE', '2.3 UPDATE action recorded');

  // 2.3 APPROVAL & REJECTION
  const approveLog = securityAuditService.logSecurityEvent(
    'APPROVE',
    'APPROVAL_WORKFLOW',
    'Research Grant Proposal',
    'Sanctioned Stage 2 executive approval for AI research lab grant.',
    registrarUser,
    'REGISTRAR',
    { recordId: 'SSIU-REQ-2026-001', status: 'SUCCESS', severity: 'INFO' }
  );
  assert(approveLog.action === 'APPROVE', '2.4 APPROVE action recorded with workflow details');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Security Violations & Unauthorized Access Defense
  // ──────────────────────────────────────────────────────────────────────────
  securityAuditService.trackSecurityViolation(
    studentUser,
    'STUDENT',
    'UNAUTHORIZED_ACCESS_ATTEMPT',
    'Student attempted to query restricted faculty research proposals without authorization.',
    'APPROVAL_WORKFLOW',
    'req-restricted-99'
  );

  const violationLogs = db.getAuditLogs();
  const violationLog = violationLogs[0];
  assert(violationLog.action === 'UNAUTHORIZED_ACCESS_ATTEMPT', '3.1 Unauthorized access attempt recorded');
  assert(violationLog.status === 'BLOCKED', '3.2 Status marked as BLOCKED');
  assert(violationLog.severity === 'CRITICAL', '3.3 Severity marked as CRITICAL');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Backend RBAC Guard on Security & Audit Center
  // ──────────────────────────────────────────────────────────────────────────
  // 4.1 Authorized Super Admin queries logs
  const adminLogs = securityAuditService.getSecurityLogs({ role: 'ALL' }, adminUser, 'SUPER_ADMIN');
  assert(adminLogs.length > 0, '4.1 Super Admin authorized to read Security & Audit logs');

  // 4.2 Authorized Registrar queries logs
  const registrarLogs = securityAuditService.getSecurityLogs({ role: 'ALL' }, registrarUser, 'REGISTRAR');
  assert(registrarLogs.length > 0, '4.2 Registrar authorized to read Security & Audit logs');

  // 4.3 Unauthorized Student queries logs -> 403 Forbidden Thrown
  let studentBlocked = false;
  try {
    securityAuditService.getSecurityLogs({}, studentUser, 'STUDENT');
  } catch (err: any) {
    if (err.message.includes('403 Forbidden')) {
      studentBlocked = true;
    }
  }
  assert(studentBlocked, '4.3 Student blocked from reading audit logs with 403 Forbidden exception');

  // 4.4 Unauthorized Faculty queries logs -> 403 Forbidden Thrown
  let facultyBlocked = false;
  try {
    securityAuditService.getSecurityLogs({}, facultyUser, 'FACULTY');
  } catch (err: any) {
    if (err.message.includes('403 Forbidden')) {
      facultyBlocked = true;
    }
  }
  assert(facultyBlocked, '4.4 Faculty blocked from reading audit logs with 403 Forbidden exception');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Security Dashboard KPI Telemetry
  // ──────────────────────────────────────────────────────────────────────────
  const stats = securityAuditService.getSecurityDashboardStats(adminUser, 'SUPER_ADMIN');
  assert(stats.totalLoginsToday >= 1, '5.1 Total Logins computed for today');
  assert(stats.failedLoginsToday >= 1, '5.2 Failed Logins count computed');
  assert(stats.activeSessions > 0, '5.3 Active Sessions telemetry reported');
  assert(stats.criticalEvents >= 1, '5.4 Critical security events counter computed');
  assert(stats.recentAdminActions >= 1, '5.5 Recent privileged admin actions counter computed');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Security Alert Resolution Workflow
  // ──────────────────────────────────────────────────────────────────────────
  const activeAlert = alerts.find(a => a.status === 'ACTIVE');
  assert(Boolean(activeAlert), '6.1 Found active security alert');
  
  if (activeAlert) {
    const resolved = securityAuditService.resolveSecurityAlert(
      activeAlert.id,
      'IP was verified and temporary block applied. Account password reset.',
      adminUser,
      'SUPER_ADMIN'
    );
    assert(resolved, '6.2 Security alert resolved successfully');
    assert(activeAlert.status === 'RESOLVED', '6.3 Alert status updated to RESOLVED');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Governance Report & Export Compatibility
  // ──────────────────────────────────────────────────────────────────────────
  const reportDossier = reportEngine.generateDashboardReport(
    'SECURITY_AUDIT',
    {},
    'SUPER_ADMIN',
    adminUser
  );

  assert(reportDossier.reportTitle.includes('Security, Authentication & Audit'), '7.1 Security Audit Report generated');
  assert(reportDossier.summaryMetrics?.length! >= 4, '7.2 Report includes summary metric badges');
  assert(Boolean(reportDossier.distributionCharts && reportDossier.distributionCharts.length >= 1), '7.3 Report includes Security Distribution chart');
  assert(reportDossier.rows.length > 0, '7.4 Report includes tabular audit rows');

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

runSecurityAuditCenterTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
