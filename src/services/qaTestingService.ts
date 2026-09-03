import { db } from './db';
import { ManualTestRecord, ManualTestStatus, ManualTestType, ManualTestPriority, User } from '../types';

export const INITIAL_MANUAL_TEST_RECORDS: ManualTestRecord[] = [
  // ─── 1. Notesheet Module Tests ───
  {
    id: 'tc-001',
    testId: 'TC-NS-001',
    module: 'Notesheet',
    feature: 'Fixed Organogram Approval Workflow',
    testScenario: 'Verify Notesheet routes through mandatory 5-stage hierarchy (HOD -> HOI -> Dy Registrar -> Registrar -> Vice President) for financial proposals > ₹1,00,000.',
    testType: 'Workflow',
    expectedResult: 'Notesheet is sequentially assigned to each designated office without skipping stages. Final approval accords NS-APR-XXXX ID.',
    actualResult: 'Workflow completed successfully through all 5 offices with digital signature verification.',
    status: 'Pass',
    priority: 'CRITICAL',
    testedBy: 'QA Lead / Admin',
    testDate: '2026-08-20',
    remarks: 'Verified with ₹1,50,000 TechFest notesheet (ns-101).',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-20T14:30:00Z',
    history: [
      { id: 'h-1', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'QA Lead', changedDate: '2026-08-20', remarks: 'Executed manual verification on organogram engine.' }
    ]
  },
  {
    id: 'tc-002',
    testId: 'TC-NS-002',
    module: 'Notesheet',
    feature: 'Itemized Expense Calculation',
    testScenario: 'Verify subtotal, additional charges, and discount correctly calculate Total Estimated Amount and Amount in Words.',
    testType: 'Validation',
    expectedResult: 'Total amount is exact sum of items with INR formatting and Indian numbering system words conversion.',
    actualResult: 'Calculations match exact item rates and quantity multiplication.',
    status: 'Pass',
    priority: 'HIGH',
    testedBy: 'Senior QA Engineer',
    testDate: '2026-08-21',
    remarks: 'Number to words conversion verified up to ₹50,00,000.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-21T11:15:00Z',
    history: [
      { id: 'h-2', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'Senior QA Engineer', changedDate: '2026-08-21', remarks: 'Verified amount formatting logic.' }
    ]
  },
  {
    id: 'tc-003',
    testId: 'TC-NS-003',
    module: 'Notesheet',
    feature: 'Official PDF Watermarking & Security',
    testScenario: 'Generate Notesheet PDF and verify university header, QR code verification link, signature blocks, and confidentiality watermark.',
    testType: 'UI',
    expectedResult: 'Clean, formatted PDF renders with Swarrnim header, approval movement table, and verifiable public URL QR.',
    actualResult: 'PDF layout verified across A4 portrait with accurate margins.',
    status: 'Pass',
    priority: 'HIGH',
    testedBy: 'QA Engineer',
    testDate: '2026-08-22',
    remarks: 'Tested on both Chrome and Safari render engines.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-22T16:00:00Z',
    history: [
      { id: 'h-3', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'QA Engineer', changedDate: '2026-08-22', remarks: 'Verified PDF generator.' }
    ]
  },
  {
    id: 'tc-004',
    testId: 'TC-NS-004',
    module: 'Notesheet',
    feature: 'Student Role Direct Access Restriction (RBAC)',
    testScenario: 'Verify Student login role is blocked from viewing or downloading administrative notesheets.',
    testType: 'RBAC',
    expectedResult: 'System throws 403 Forbidden with security alert log and blocks notesheet PDF download.',
    actualResult: 'Security layer rejected access and logged UNAUTHORIZED_NOTESHEET_PDF_ACCESS_BLOCKED.',
    status: 'Pass',
    priority: 'CRITICAL',
    testedBy: 'Security Auditor',
    testDate: '2026-08-23',
    remarks: 'RBAC audit verified for all student accounts.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-23T10:00:00Z',
    history: [
      { id: 'h-4', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'Security Auditor', changedDate: '2026-08-23', remarks: 'Enforced 403 Forbidden check.' }
    ]
  },

  // ─── 2. Student Master & Admissions Tests ───
  {
    id: 'tc-005',
    testId: 'TC-STU-001',
    module: 'Student Master',
    feature: 'Single Student Master Onboarding',
    testScenario: 'Verify new student admission automatically generates enrollment number, identity card, and fee account without duplicate records.',
    testType: 'Functional',
    expectedResult: 'Single student master record created with status ACTIVE and linked department.',
    actualResult: 'Student record linked with user auth account seamlessly.',
    status: 'Pass',
    priority: 'CRITICAL',
    testedBy: 'QA Engineer',
    testDate: '2026-08-23',
    remarks: 'One Student = One Master Record rule fully adhered.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-23T12:00:00Z',
    history: [
      { id: 'h-5', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'QA Engineer', changedDate: '2026-08-23', remarks: 'Verified student onboarding.' }
    ]
  },

  // ─── 3. University HRMS Module Tests ───
  {
    id: 'tc-006',
    testId: 'TC-HR-001',
    module: 'HRMS',
    feature: 'Employee Onboarding & Login Provisioning',
    testScenario: 'Onboard Faculty / Non-Teaching staff and verify auto-generated employee ID (EMP-2026-XXXXX) and user credentials (Employee@123).',
    testType: 'Workflow',
    expectedResult: 'Employee master record created, user login account active, and default leave balances initialized.',
    actualResult: 'Created master record with active login and leave balances (CL 12, SL 10, EL 15).',
    status: 'Pass',
    priority: 'CRITICAL',
    testedBy: 'HR QA Lead',
    testDate: '2026-08-24',
    remarks: 'Tested on both Faculty and Technical staff categories.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-24T09:00:00Z',
    history: [
      { id: 'h-6', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'HR QA Lead', changedDate: '2026-08-24', remarks: 'Verified automated credentials.' }
    ]
  },
  {
    id: 'tc-007',
    testId: 'TC-HR-002',
    module: 'HRMS',
    feature: 'Biometric Attendance & Late Tracking',
    testScenario: 'Record check-in at 09:45 AM and verify auto-classification as LATE with exact 30 late minutes computed.',
    testType: 'Functional',
    expectedResult: 'Status marked LATE with lateMinutes: 30 (past 09:15 buffer window).',
    actualResult: 'Roster accurately updated and late minutes recorded.',
    status: 'Pass',
    priority: 'HIGH',
    testedBy: 'QA Lead',
    testDate: '2026-08-24',
    remarks: 'Verified attendance correction workflow as well.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-24T09:15:00Z',
    history: [
      { id: 'h-7', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'QA Lead', changedDate: '2026-08-24', remarks: 'Late detection verified.' }
    ]
  },
  {
    id: 'tc-008',
    testId: 'TC-HR-003',
    module: 'HRMS',
    feature: 'Monthly Payroll Calculation Engine',
    testScenario: 'Execute payroll engine for current month and verify gross breakdown (Basic 50%, HRA 20%, DA 15%, Special 15%) and deductions (PF 12%, PT ₹200, TDS).',
    testType: 'Validation',
    expectedResult: 'Net Pay equals Gross Salary minus Total Deductions with generated payslip slip number.',
    actualResult: 'Itemized payslips generated accurately for all active employees.',
    status: 'Pass',
    priority: 'CRITICAL',
    testedBy: 'Finance / HR QA',
    testDate: '2026-08-24',
    remarks: 'Verified salary slip download and batch approval.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-24T09:20:00Z',
    history: [
      { id: 'h-8', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'Finance / HR QA', changedDate: '2026-08-24', remarks: 'Salary engine checked.' }
    ]
  },

  // ─── 4. Asset Management Module Tests ───
  {
    id: 'tc-009',
    testId: 'TC-AST-001',
    module: 'Asset Management',
    feature: 'Faculty Asset Assignment & Return',
    testScenario: 'Allocate institutional laptop/hardware directly to Faculty member and verify in Faculty Dossier.',
    testType: 'Functional',
    expectedResult: 'University Asset Master availableQuantity decrements and asset appears in employee profile tab.',
    actualResult: 'Asset allocation successfully logged with history tracking.',
    status: 'Pass',
    priority: 'HIGH',
    testedBy: 'QA Engineer',
    testDate: '2026-08-24',
    remarks: 'Verified 50/50 test suite scenarios.',
    bugIssue: 'None',
    fixStatus: 'Verified',
    retestResult: 'Pass',
    lastUpdated: '2026-08-24T09:25:00Z',
    history: [
      { id: 'h-9', previousStatus: 'Pending', newStatus: 'Pass', changedBy: 'QA Engineer', changedDate: '2026-08-24', remarks: 'Verified asset ledger linkage.' }
    ]
  },

  // ─── 5. Pending & Retest Items ───
  {
    id: 'tc-010',
    testId: 'TC-HST-001',
    module: 'Hostel Management',
    feature: 'Gate Pass QR Code Scanner at Security Gate',
    testScenario: 'Scan physical / mobile QR code of active student gate pass at campus exit gate and verify auto-timestamping.',
    testType: 'Workflow',
    expectedResult: 'Security gate terminal verifies gate pass validity and marks student status OUT_OF_CAMPUS.',
    actualResult: 'Scanner integration pending hardware kiosk physical test.',
    status: 'Pending',
    priority: 'HIGH',
    testedBy: 'QA Lead',
    testDate: '2026-08-24',
    remarks: 'Awaiting campus physical security kiosk hardware link.',
    bugIssue: 'Hardware camera integration on outdoor kiosk tablet',
    fixStatus: 'In Progress',
    retestResult: 'Pending',
    lastUpdated: '2026-08-24T09:30:00Z',
    history: [
      { id: 'h-10', previousStatus: 'Pending', newStatus: 'Pending', changedBy: 'QA Lead', changedDate: '2026-08-24', remarks: 'Queued for physical campus testing.' }
    ]
  },
  {
    id: 'tc-011',
    testId: 'TC-FIN-001',
    module: 'Fees & Finance',
    feature: 'Bank Webhook Payment Reconciliation under Low Network',
    testScenario: 'Simulate delayed bank webhook callback (300s timeout) and verify automatic retry reconciliation without double charging.',
    testType: 'Regression',
    expectedResult: 'Idempotency key prevents duplicate transaction ledger entry.',
    actualResult: 'Retry mechanism configured; retest required under simulated 2G mobile network.',
    status: 'Retest Required',
    priority: 'MEDIUM',
    testedBy: 'QA Engineer',
    testDate: '2026-08-24',
    remarks: 'Scheduled for load testing run.',
    bugIssue: 'Webhook retry jitter timing',
    fixStatus: 'Fixed',
    retestResult: 'Retest Required',
    lastUpdated: '2026-08-24T09:35:00Z',
    history: [
      { id: 'h-11', previousStatus: 'Fail', newStatus: 'Fixed', changedBy: 'Developer', changedDate: '2026-08-23', remarks: 'Added idempotency check.' },
      { id: 'h-12', previousStatus: 'Fixed', newStatus: 'Retest Required', changedBy: 'QA Lead', changedDate: '2026-08-24', remarks: 'Needs verification on slow network.' }
    ]
  }
];

class QATestingService {
  /**
   * Retrieve all manual test records with optional multi-attribute filtering.
   */
  public getManualTests(filters?: {
    module?: string;
    status?: string;
    testType?: string;
    priority?: string;
    searchQuery?: string;
  }): ManualTestRecord[] {
    let list: ManualTestRecord[] = (db as any).state?.manualTestRecords || [];
    
    if (list.length === 0) {
      // Reconnect/populate initial test records if empty
      list = [...INITIAL_MANUAL_TEST_RECORDS];
      if (!(db as any).state) (db as any).state = {};
      (db as any).state.manualTestRecords = list;
      db.saveState();
    }

    if (!filters) return list;

    if (filters.module && filters.module !== 'ALL') {
      list = list.filter(t => t.module.toLowerCase() === filters.module!.toLowerCase());
    }

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter(t => t.status.toLowerCase() === filters.status!.toLowerCase());
    }

    if (filters.testType && filters.testType !== 'ALL') {
      list = list.filter(t => t.testType.toLowerCase() === filters.testType!.toLowerCase());
    }

    if (filters.priority && filters.priority !== 'ALL') {
      list = list.filter(t => t.priority.toLowerCase() === filters.priority!.toLowerCase());
    }

    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter(t => 
        t.testId.toLowerCase().includes(q) ||
        t.feature.toLowerCase().includes(q) ||
        t.testScenario.toLowerCase().includes(q) ||
        t.module.toLowerCase().includes(q) ||
        (t.bugIssue && t.bugIssue.toLowerCase().includes(q)) ||
        (t.remarks && t.remarks.toLowerCase().includes(q))
      );
    }

    return list;
  }

  /**
   * Retrieve single test record by ID or testId
   */
  public getTestById(idOrTestId: string): ManualTestRecord | undefined {
    const list: ManualTestRecord[] = (db as any).state?.manualTestRecords || [];
    return list.find(t => t.id === idOrTestId || t.testId === idOrTestId);
  }

  /**
   * Create new manual test record (strictly avoiding duplicates by testId)
   */
  public createTestRecord(
    payload: {
      testId?: string;
      module: string;
      feature: string;
      testScenario: string;
      testType: ManualTestType;
      expectedResult: string;
      actualResult?: string;
      status?: ManualTestStatus;
      priority?: ManualTestPriority;
      testedBy?: string;
      remarks?: string;
      bugIssue?: string;
      notesheetId?: string;
    },
    actor: User
  ): { success: boolean; test?: ManualTestRecord; message: string } {
    const list: ManualTestRecord[] = (db as any).state?.manualTestRecords || [];
    
    // Auto-generate testId if not provided
    const testId = payload.testId?.trim() || `TC-MAN-${String(list.length + 1).padStart(3, '0')}`;

    // Duplicate check
    const existing = list.find(t => t.testId.toLowerCase() === testId.toLowerCase());
    if (existing) {
      return { success: false, message: `Test record with Test ID "${testId}" already exists. Update it instead.` };
    }

    const newTest: ManualTestRecord = {
      id: `tc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      testId,
      module: payload.module.trim(),
      feature: payload.feature.trim(),
      testScenario: payload.testScenario.trim(),
      testType: payload.testType || 'Manual',
      expectedResult: payload.expectedResult.trim(),
      actualResult: payload.actualResult?.trim() || 'Pending verification',
      status: payload.status || 'Pending',
      priority: payload.priority || 'MEDIUM',
      testedBy: payload.testedBy?.trim() || actor.name,
      testDate: new Date().toISOString().split('T')[0],
      remarks: payload.remarks?.trim(),
      bugIssue: payload.bugIssue?.trim(),
      fixStatus: payload.bugIssue ? 'Open' : 'N/A',
      retestResult: payload.status === 'Pass' ? 'Pass' : 'Pending',
      lastUpdated: new Date().toISOString(),
      notesheetId: payload.notesheetId,
      history: [
        {
          id: `h-${Date.now()}`,
          previousStatus: 'Pending',
          newStatus: payload.status || 'Pending',
          changedBy: actor.name,
          changedDate: new Date().toISOString().split('T')[0],
          remarks: 'Test case created in QA Notesheet register.'
        }
      ]
    };

    if (!(db as any).state.manualTestRecords) (db as any).state.manualTestRecords = [];
    (db as any).state.manualTestRecords.unshift(newTest);
    db.saveState();

    return { success: true, test: newTest, message: `Manual test ${testId} created and saved to database.` };
  }

  /**
   * Update existing test record with status change logging
   */
  public updateTestRecord(
    id: string,
    updates: Partial<ManualTestRecord>,
    actor: User
  ): { success: boolean; test?: ManualTestRecord; message: string } {
    const list: ManualTestRecord[] = (db as any).state?.manualTestRecords || [];
    const test = list.find(t => t.id === id || t.testId === id);
    if (!test) return { success: false, message: 'Test record not found.' };

    const oldStatus = test.status;
    const newStatus = updates.status || oldStatus;

    if (updates.status && updates.status !== oldStatus) {
      if (!test.history) test.history = [];
      test.history.unshift({
        id: `h-${Date.now()}`,
        previousStatus: oldStatus,
        newStatus: newStatus,
        changedBy: actor.name,
        changedDate: new Date().toISOString().split('T')[0],
        remarks: updates.remarks || `Status transitioned from ${oldStatus} to ${newStatus}.`
      });
    }

    Object.assign(test, updates);
    test.lastUpdated = new Date().toISOString();
    db.saveState();

    return { success: true, test, message: `Test record ${test.testId} updated successfully.` };
  }

  /**
   * Delete a test record
   */
  public deleteTestRecord(id: string): { success: boolean; message: string } {
    const list: ManualTestRecord[] = (db as any).state?.manualTestRecords || [];
    const idx = list.findIndex(t => t.id === id || t.testId === id);
    if (idx === -1) return { success: false, message: 'Test record not found.' };

    list.splice(idx, 1);
    db.saveState();
    return { success: true, message: 'Test record removed from register.' };
  }

  /**
   * Summary metrics for dashboard KPI cards
   */
  public getQASummaryMetrics() {
    const tests = this.getManualTests();
    const total = tests.length;
    const passed = tests.filter(t => t.status === 'Pass').length;
    const failed = tests.filter(t => t.status === 'Fail').length;
    const pending = tests.filter(t => t.status === 'Pending').length;
    const retest = tests.filter(t => t.status === 'Retest Required').length;
    const fixed = tests.filter(t => t.status === 'Fixed').length;
    const blocked = tests.filter(t => t.status === 'Blocked').length;

    return {
      total,
      passed,
      failed,
      pending,
      retest,
      fixed,
      blocked,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0
    };
  }
}

export const qaTestingService = new QATestingService();
