import { describe, it, expect } from 'vitest';
import { centralRecordsManagementService } from '../services/centralRecordsManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.37: Official Records Management & Statutory Retention Engine', () => {

  const recordsManager: UserAuthorizationContext = {
    userId: 'emp-rec-mgr-001',
    userName: 'Chief University Records Officer & Registrar',
    email: 'records@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'RECORDS_VIEW',
      'RECORD_DECLARE',
      'RECORD_CORRECT',
      'RECORD_FREEZE',
      'RECORD_HOLD',
      'RECORD_HOLD_RELEASE',
      'RECORD_DISPOSITION_APPROVE',
      'RECORD_DISPOSITION_EXECUTE',
      'RECORD_REPORT'
    ]
  };

  it('TEST 1: Official Record Declaration: Declares official academic examination record with retention schedule', () => {
    const record = centralRecordsManagementService.declareOfficialRecord({
      title: 'End-Semester Examination Result Gazetted Register 2025-26',
      recordType: 'EXAMINATION_RECORD',
      recordCategory: 'Academic/Examination',
      sourceReference: 'Central Controller of Examinations Vault',
      documentReference: 'DOC-2026-000001',
      ownerId: 'emp-coe-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-exam',
      classification: 'CONFIDENTIAL',
      privacyTag: 'PERSONAL_DATA',
      isAuthoritativeCopy: true,
      retentionScheduleCode: 'RS-EXAM-RESULTS-10Y',
      retentionDurationYears: 10,
      declaredBy: 'emp-rec-mgr-001',
      context: recordsManager
    });

    expect(record.id).toBeDefined();
    expect(record.record_number).toMatch(/^REC-2026-\d{6}$/);
    expect(record.status).toBe('DECLARED');
    expect(record.is_authoritative_copy).toBe(true);
    expect(record.declared_at).toBeDefined();
  });

  it('TEST 2: Immutability & Auditable Amendment: Enforces controlled correction history for official records', () => {
    const record = centralRecordsManagementService.declareOfficialRecord({
      title: 'Faculty Employment Service Book Record',
      recordType: 'HR_RECORD',
      recordCategory: 'HR/Faculty',
      sourceReference: 'HR Central Ledger',
      ownerId: 'emp-hr-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-hr',
      classification: 'RESTRICTED',
      privacyTag: 'PERSONAL_DATA',
      isAuthoritativeCopy: true,
      retentionScheduleCode: 'RS-HR-EMPLOYEE-SEPARATION-7Y',
      retentionDurationYears: 7,
      declaredBy: 'emp-rec-mgr-001'
    });

    const correction = centralRecordsManagementService.amendOfficialRecord({
      recordId: record.id,
      amendmentReason: 'Statutory updating of revised 7th Pay Commission promotion designation',
      correctedBy: 'emp-rec-mgr-001',
      correctionType: 'AMENDMENT'
    });

    expect(correction.id).toBeDefined();
    expect(correction.record_id).toBe(record.id);
    expect(correction.correction_type).toBe('AMENDMENT');
    expect(correction.reason).toContain('7th Pay Commission');
  });

  it('TEST 3: Legal Hold & Record Freeze: Applies freeze, blocks amendments, and executes release', () => {
    const record = centralRecordsManagementService.declareOfficialRecord({
      title: 'Campus Construction Tender & Procurement Agreement',
      recordType: 'CONTRACT_RECORD',
      recordCategory: 'Procurement/CivilWorks',
      sourceReference: 'Finance Tender Portal',
      ownerId: 'emp-cfo-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-procurement',
      classification: 'CONFIDENTIAL',
      isAuthoritativeCopy: true,
      retentionScheduleCode: 'RS-PROCUREMENT-8Y',
      retentionDurationYears: 8,
      declaredBy: 'emp-rec-mgr-001'
    });

    // 1. Apply Legal Hold Freeze
    const freeze = centralRecordsManagementService.applyRecordFreeze({
      recordId: record.id,
      reason: 'Statutory Comptroller and Auditor General (CAG) Special Audit Inquiry',
      freezeType: 'LEGAL_HOLD',
      issuedBy: 'emp-rec-mgr-001'
    });

    expect(freeze.id).toBeDefined();
    expect(freeze.status).toBe('ACTIVE');

    // 2. Amendments must be blocked while frozen
    expect(() => {
      centralRecordsManagementService.amendOfficialRecord({
        recordId: record.id,
        amendmentReason: 'Attempted routine metadata update',
        correctedBy: 'emp-rec-mgr-001',
        correctionType: 'METADATA_CORRECTION'
      });
    }).toThrow(/Record Amendment Blocked: Record .* is frozen/);

    // 3. Release Freeze
    const released = centralRecordsManagementService.releaseRecordFreeze(freeze.id, 'emp-rec-mgr-001');
    expect(released.status).toBe('RELEASED');
    expect(released.released_at).toBeDefined();
  });

  it('TEST 4: Disposition Eligibility & Safe Pre-Execution Batch Gates: Blocks active retention/hold records', () => {
    // 1. Record with Active Retention
    const activeRec = centralRecordsManagementService.declareOfficialRecord({
      title: 'Current Academic Batch Attendance Logs',
      recordType: 'ATTENDANCE_RECORD',
      recordCategory: 'Academic/Attendance',
      sourceReference: 'Attendance Biometric Vault',
      ownerId: 'emp-dean-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-academic',
      classification: 'INTERNAL',
      isAuthoritativeCopy: true,
      retentionScheduleCode: 'RS-ATTENDANCE-3Y',
      retentionDurationYears: 3,
      declaredBy: 'emp-rec-mgr-001'
    });

    // 2. Record with Expired Retention (simulate past expiry)
    const expiredRec = centralRecordsManagementService.declareOfficialRecord({
      title: 'Temporary Visitor Gate Pass Register 2020',
      recordType: 'GOVERNANCE_RECORD',
      recordCategory: 'Security/VisitorLogs',
      sourceReference: 'Main Gate Physical Log Book',
      ownerId: 'emp-sec-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-security',
      classification: 'INTERNAL',
      isAuthoritativeCopy: true,
      retentionScheduleCode: 'RS-GATE-PASS-1Y',
      retentionDurationYears: -1, // Expired in past
      declaredBy: 'emp-rec-mgr-001'
    });

    const batchResult = centralRecordsManagementService.executeBatchDisposition(
      [activeRec.id, expiredRec.id],
      'emp-rec-mgr-001'
    );

    // Active record must be blocked, expired record must be successfully disposed
    expect(batchResult.blockedDisposals.length).toBe(1);
    expect(batchResult.blockedDisposals[0].recordId).toBe(activeRec.record_number);
    expect(batchResult.blockedDisposals[0].reason).toContain('Retention Active');

    expect(batchResult.successfulDisposals.length).toBe(1);
    expect(batchResult.successfulDisposals[0]).toBe(expiredRec.record_number);
  });

  it('TEST 5: Records Governance Dashboard Telemetry: Validates metrics, authoritative count, and compliance posture', () => {
    const metrics = centralRecordsManagementService.getRecordsGovernanceDashboardMetrics(recordsManager);

    expect(metrics.totalRecordsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.declaredRecordsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.authoritativeRecordsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.recordsComplianceScorePercent).toBeGreaterThanOrEqual(95);
    expect(metrics.recordsPosture).toBe('HEALTHY');
  });
});
