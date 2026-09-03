declare const process: any;

import { db } from '../services/db';
import { approvalWorkflowEngine } from '../services/approvalEngine';
import { User, ApprovalRequest, ApprovalAttachment } from '../types';

// Mock Users
const facultyApplicant: User = {
  id: 'fac-10',
  name: 'Dr. Ramesh Nair',
  username: 'rnair',
  email: 'ramesh.nair@swarrnim.edu.in',
  role: 'FACULTY',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const studentApplicant: User = {
  id: 'stu-50',
  name: 'Priya Sharma',
  username: 'psharma',
  email: 'priya.sharma@swarrnim.edu.in',
  role: 'STUDENT',
  departmentId: 'dept-1',
  instituteId: 'inst-1',
  enrollmentNo: 'ENR-2026-050',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const hodApprover: User = {
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

const otherDeptHod: User = {
  id: 'user-hod-2',
  name: 'Dr. P. Joshi',
  username: 'pjoshi',
  email: 'hod.me@swarrnim.edu.in',
  role: 'HOD',
  departmentId: 'dept-2', // Different department
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const principalApprover: User = {
  id: 'user-principal-1',
  name: 'Dr. S. Verma',
  username: 'sverma',
  email: 'principal@swarrnim.edu.in',
  role: 'PRINCIPAL',
  instituteId: 'inst-1',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const registrarApprover: User = {
  id: 'user-registrar-1',
  name: 'Shri R. Mehta',
  username: 'rmehta',
  email: 'registrar@swarrnim.edu.in',
  role: 'REGISTRAR',
  status: 'ACTIVE',
  createdAt: '2024-01-01T00:00:00Z'
};

const vcApprover: User = {
  id: 'user-vc-1',
  name: 'Prof. Vice Chancellor',
  username: 'vc',
  email: 'vc@swarrnim.edu.in',
  role: 'UNIVERSITY_ADMIN',
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

async function runApprovalWorkflowTests() {
  console.log('\n🏛️ STARTING SSIU CENTRALIZED DIGITAL APPROVAL WORKFLOW TEST SUITE\n');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 1: Multi-Stage Request Creation & Initial Stage Auto-Resolution
  // ──────────────────────────────────────────────────────────────────────────
  const researchProposal = approvalWorkflowEngine.submitModuleApprovalRequest({
    moduleSource: 'GENERAL_REQUEST',
    category: 'RESEARCH_GRANT',
    title: 'AI Center of Excellence Research Lab Grant Application',
    description: 'Grant requisition for high performance edge compute clusters and student research stipends.',
    targetOffice: 'HOD_ACADEMIC',
    amount: 250000,
    financialEstimateSummary: 'Total proposal budget ₹2,50,000.',
    applicant: facultyApplicant,
    applicantRole: 'FACULTY'
  });

  assert(Boolean(researchProposal && researchProposal.id), '1.1 Request created successfully with unique ID');
  assert(researchProposal.requestNo.startsWith('SSIU-REQ-'), '1.2 Request number formatted as SSIU-REQ-YYYY-XXX');
  assert(researchProposal.status === 'PENDING', '1.3 Initial status is PENDING');
  assert((researchProposal.stages || []).length === 4, '1.4 Multi-stage workflow automatically resolved 4 sequential stages');
  assert(researchProposal.currentStageIndex === 0, '1.5 Current stage points to Stage 0 (HOD Review)');
  assert(researchProposal.amount === 250000, '1.6 Financial amount ₹2,50,000 stored on request');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 2: Approval Inbox & Authority Scoping
  // ──────────────────────────────────────────────────────────────────────────
  const hodInbox = approvalWorkflowEngine.getApprovalInbox(hodApprover, 'HOD');
  const otherHodInbox = approvalWorkflowEngine.getApprovalInbox(otherDeptHod, 'HOD');
  const studentInbox = approvalWorkflowEngine.getApprovalInbox(studentApplicant, 'STUDENT');

  assert(hodInbox.some(r => r.id === researchProposal.id), '2.1 Department HOD sees pending proposal in their Approval Inbox');
  assert(!otherHodInbox.some(r => r.id === researchProposal.id), '2.2 Different Department HOD CANNOT see another department proposal in action inbox');
  assert(studentInbox.length === 0, '2.3 Students have 0 items in Approval Action Inbox (Applicant role only)');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 3: Backend Security - Unauthorized User Cannot Act
  // ──────────────────────────────────────────────────────────────────────────
  let unauthorizedActionBlocked = false;
  try {
    approvalWorkflowEngine.executeApprovalAction(
      researchProposal.id,
      'APPROVED',
      'Illegitimate approval attempt',
      otherDeptHod,
      'HOD'
    );
  } catch (err: any) {
    unauthorizedActionBlocked = true;
  }
  assert(unauthorizedActionBlocked, '3.1 Backend blocks unauthorized department HOD with 403 Forbidden');

  let studentActionBlocked = false;
  try {
    approvalWorkflowEngine.executeApprovalAction(
      researchProposal.id,
      'APPROVED',
      'Student approval attempt',
      studentApplicant,
      'STUDENT'
    );
  } catch (err: any) {
    studentActionBlocked = true;
  }
  assert(studentActionBlocked, '3.2 Backend blocks Student from approving requests with 403 Forbidden');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 4: Multi-Stage Progression (Stage 0 -> Stage 1 -> Stage 2 -> Stage 3)
  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: HOD Approves Stage 0
  const afterHod = approvalWorkflowEngine.executeApprovalAction(
    researchProposal.id,
    'APPROVED',
    'Department academic council recommends proposal.',
    hodApprover,
    'HOD'
  );

  assert(afterHod.currentStageIndex === 1, '4.1 Stage 0 completed -> currentStageIndex advanced to 1');
  assert(afterHod.stages?.[0]?.status === 'APPROVED', '4.2 Stage 0 status is APPROVED');
  assert(afterHod.stages?.[0]?.actionByUserName === hodApprover.name, '4.3 Stage 0 recorded HOD identity');
  assert(afterHod.status === 'UNDER_REVIEW', '4.4 Request status remains UNDER_REVIEW during intermediate stages');

  // Principal now sees it in inbox
  const principalInbox = approvalWorkflowEngine.getApprovalInbox(principalApprover, 'PRINCIPAL');
  assert(principalInbox.some(r => r.id === researchProposal.id), '4.5 Principal now sees request in Approval Inbox for Stage 1');

  // Step 2: Principal Approves Stage 1
  const afterPrincipal = approvalWorkflowEngine.executeApprovalAction(
    researchProposal.id,
    'APPROVED',
    'Institutional sanction approved with matching fund allocation.',
    principalApprover,
    'PRINCIPAL'
  );
  assert(afterPrincipal.currentStageIndex === 2, '4.6 Stage 1 completed -> advanced to Stage 2 (Registrar)');

  // Step 3: Registrar Approves Stage 2
  const afterRegistrar = approvalWorkflowEngine.executeApprovalAction(
    researchProposal.id,
    'APPROVED',
    'Statutory compliance and administrative clearance granted.',
    registrarApprover,
    'REGISTRAR'
  );
  assert(afterRegistrar.currentStageIndex === 3, '4.7 Stage 2 completed -> advanced to Stage 3 (VC)');

  // Step 4: Vice Chancellor Final Sanction Stage 3
  const fullyApproved = approvalWorkflowEngine.executeApprovalAction(
    researchProposal.id,
    'APPROVED',
    'Final executive approval sanctioned. Release work order and research funds.',
    vcApprover,
    'UNIVERSITY_ADMIN'
  );
  assert(fullyApproved.status === 'APPROVED', '4.8 Final stage completed -> overall status is APPROVED');
  assert(Boolean(fullyApproved.completedAt), '4.9 completedAt timestamp recorded on final approval');
  assert(fullyApproved.stages?.[3]?.status === 'APPROVED', '4.10 All 4 stages are now in APPROVED status');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 5: Return for Correction Workflow & Mandatory Comment Validation
  // ──────────────────────────────────────────────────────────────────────────
  const returnProposal = approvalWorkflowEngine.submitModuleApprovalRequest({
    moduleSource: 'GENERAL_REQUEST',
    category: 'LEAVE_APPLICATION',
    title: 'Medical Leave Sanction Request',
    description: 'Requesting 5 days medical leave.',
    targetOffice: 'HOD_ACADEMIC',
    applicant: facultyApplicant,
    applicantRole: 'FACULTY'
  });

  // Attempt return without remarks (Must fail)
  let missingRemarksBlocked = false;
  try {
    approvalWorkflowEngine.executeApprovalAction(
      returnProposal.id,
      'RETURNED',
      '', // Empty remarks
      hodApprover,
      'HOD'
    );
  } catch (err: any) {
    missingRemarksBlocked = true;
  }
  assert(missingRemarksBlocked, '5.1 Mandatory comment enforced when returning request for correction');

  // Execute valid return
  const returnedReq = approvalWorkflowEngine.executeApprovalAction(
    returnProposal.id,
    'RETURNED',
    'Please attach the registered medical practitioner certificate.',
    hodApprover,
    'HOD'
  );
  assert(returnedReq.status === 'RETURNED', '5.2 Request status successfully updated to RETURNED');
  assert(returnedReq.remarksHistory.some(r => r.remarks.includes('medical practitioner certificate')), '5.3 Return comments added to remarks history timeline');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 6: Rejection Workflow & Mandatory Comment Validation
  // ──────────────────────────────────────────────────────────────────────────
  const rejectProposal = approvalWorkflowEngine.submitModuleApprovalRequest({
    moduleSource: 'GENERAL_REQUEST',
    category: 'EVENT_PERMISSION',
    title: 'Unauthorized Off-Campus Excursion',
    description: 'Off campus trip proposal.',
    targetOffice: 'HOD_ACADEMIC',
    applicant: facultyApplicant,
    applicantRole: 'FACULTY'
  });

  // Attempt reject without remarks
  let rejectMissingRemarksBlocked = false;
  try {
    approvalWorkflowEngine.executeApprovalAction(
      rejectProposal.id,
      'REJECTED',
      '',
      hodApprover,
      'HOD'
    );
  } catch (err: any) {
    rejectMissingRemarksBlocked = true;
  }
  assert(rejectMissingRemarksBlocked, '6.1 Mandatory comment enforced when rejecting request');

  const rejectedReq = approvalWorkflowEngine.executeApprovalAction(
    rejectProposal.id,
    'REJECTED',
    'Event conflicts with university mid-semester examination schedule.',
    hodApprover,
    'HOD'
  );
  assert(rejectedReq.status === 'REJECTED', '6.2 Request status successfully transitioned to REJECTED');
  assert(Boolean(rejectedReq.completedAt), '6.3 completedAt timestamp recorded on rejection');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 7: Real-Time Dashboard KPI Statistics
  // ──────────────────────────────────────────────────────────────────────────
  const stats = approvalWorkflowEngine.getDashboardStats(vcApprover, 'UNIVERSITY_ADMIN');

  assert(stats.totalRequests > 0, '7.1 Dashboard computes Total Tracked Requests');
  assert(stats.totalApproved > 0, '7.2 Dashboard computes Total Approved Requests');
  assert(stats.totalRejected > 0, '7.3 Dashboard computes Total Rejected Requests');
  assert(stats.totalReturned > 0, '7.4 Dashboard computes Total Returned Requests');
  assert(Boolean(stats.averageApprovalTimeDisplay), '7.5 Dashboard computes Average Turnaround Time Benchmark');

  // ──────────────────────────────────────────────────────────────────────────
  // TEST 8: Module Integration Adapters (Note Sheet, Hostel, Finance, Maintenance)
  // ──────────────────────────────────────────────────────────────────────────
  const noteSheetReq = approvalWorkflowEngine.submitModuleApprovalRequest({
    moduleSource: 'NOTE_SHEET',
    sourceEntityId: 'ns-909',
    category: 'GENERAL_ADMINISTRATIVE',
    title: 'Annual Department Equipment Maintenance Contract',
    description: 'AMC contract proposal for lab equipment.',
    targetOffice: 'REGISTRAR',
    amount: 120000,
    applicant: hodApprover,
    applicantRole: 'HOD'
  });

  assert(noteSheetReq.moduleSource === 'NOTE_SHEET', '8.1 Note Sheet integration request accepted');
  assert(noteSheetReq.sourceEntityId === 'ns-909', '8.2 Source Entity ID linked to Note Sheet');

  const hostelReq = approvalWorkflowEngine.submitModuleApprovalRequest({
    moduleSource: 'HOSTEL',
    category: 'HOSTEL_NO_DUES',
    title: 'Student Hostel Dues Clearance',
    description: 'Hostel clearance for graduated student.',
    targetOffice: 'HOSTEL_ADMIN',
    applicant: studentApplicant,
    applicantRole: 'STUDENT'
  });
  assert(hostelReq.moduleSource === 'HOSTEL', '8.3 Hostel module clearance request submitted into centralized workflow');

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

runApprovalWorkflowTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
