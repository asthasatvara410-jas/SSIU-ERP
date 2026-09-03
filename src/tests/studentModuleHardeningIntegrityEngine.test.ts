import { describe, it, expect } from 'vitest';
import { studentModuleHardeningIntegrityService } from '../services/studentModuleHardeningIntegrityService';
import { studentLifecycleStatusEnrollmentService } from '../services/studentLifecycleStatusEnrollmentService';
import { studentAcademicProgressionService } from '../services/studentAcademicProgressionService';
import { studentDossierDocumentService } from '../services/studentDossierDocumentService';
import { studentLifecycleStateMachineService } from '../services/studentLifecycleStateMachineService';
import { studentCommunicationNotificationService } from '../services/studentCommunicationNotificationService';
import { student360UnifiedProfileService } from '../services/student360UnifiedProfileService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.7: Student Module Final Hardening, Referential Integrity & Production Readiness Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['STUDENT_360_VIEW', 'FINANCE_360_VIEW', 'LIFECYCLE_MANAGE']
  };

  const studentAContext: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@student.ssiu.ac.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['STUDENT_360_VIEW']
  };

  it('TEST 1: Duplicate Student Detection & Merge: Detects exact/fuzzy duplicate matches and requires justification for merge', () => {
    // 1. Detect Duplicate on existing student mobile/email
    const duplicateCandidate = studentModuleHardeningIntegrityService.detectDuplicateStudents({
      fullName: 'Aarav Patel',
      dob: '2004-06-15',
      mobile: '9876543210',
      email: 'aarav.patel@swarrnim.edu.in'
    });

    expect(duplicateCandidate).toBeDefined();
    expect(duplicateCandidate?.primaryStudentId).toBe('STU-2026-000001');
    expect(duplicateCandidate?.confidenceScore).toBe(100);

    // 2. Merge execution without justification must fail
    expect(() => {
      studentModuleHardeningIntegrityService.executeAuthorizedMerge({
        primaryStudentId: 'STU-2026-000001',
        secondaryStudentId: 'TEMP-PROSPECT-001',
        authorizedBy: 'emp-reg-001',
        justification: ''
      });
    }).toThrow(/Mandatory justification required/);

    // 3. Valid merge execution
    const mergeResult = studentModuleHardeningIntegrityService.executeAuthorizedMerge({
      primaryStudentId: 'STU-2026-000001',
      secondaryStudentId: 'TEMP-PROSPECT-001',
      authorizedBy: 'emp-reg-001',
      justification: 'Confirmed duplicate applicant inquiry merged into authoritative student profile'
    });

    expect(mergeResult.success).toBe(true);
    expect(mergeResult.mergedStudentId).toBe('STU-2026-000001');
  });

  it('TEST 2: Referential Integrity Audit: Verifies zero orphan enrollments, documents, or broken references', () => {
    const report = studentModuleHardeningIntegrityService.performReferentialIntegrityAudit();

    expect(report.totalStudentsChecked).toBeGreaterThanOrEqual(1);
    expect(report.validEnrollmentCount).toBeGreaterThanOrEqual(1);
    expect(report.orphanEnrollmentCount).toBe(0);
    expect(report.orphanDocumentCount).toBe(0);
    expect(report.brokenLifecycleReferencesCount).toBe(0);
    expect(report.isIntegrityHealthy).toBe(true);
  });

  it('TEST 3: Object-Level Authorization & IDOR Guard: Blocks unauthorized cross-student data access attempts', () => {
    // 1. Student A accessing own record is permitted
    const selfAccess = studentModuleHardeningIntegrityService.validateObjectLevelAccess('STU-2026-000001', studentAContext);
    expect(selfAccess.isAuthorized).toBe(true);

    // 2. Student A attempting to access Student B is blocked
    const idorAttempt = studentModuleHardeningIntegrityService.validateObjectLevelAccess('STU-2026-000002', studentAContext);
    expect(idorAttempt.isAuthorized).toBe(false);
    expect(idorAttempt.violationReason).toContain('IDOR_PREVENTION');

    // 3. Registrar has university-wide authorized access
    const registrarAccess = studentModuleHardeningIntegrityService.validateObjectLevelAccess('STU-2026-000002', registrarContext);
    expect(registrarAccess.isAuthorized).toBe(true);
  });

  it('TEST 4: End-to-End Student Lifecycle Integration: Verifies seamless lifecycle from admission to alumni', () => {
    // 1. Verify student profile exists
    const student = studentLifecycleStatusEnrollmentService.getStudentById('STU-2026-000001');
    expect(student).toBeDefined();

    // 2. Verify primary enrollment exists
    const enrollment = studentLifecycleStatusEnrollmentService.getPrimaryEnrollment('STU-2026-000001');
    expect(enrollment).toBeDefined();
    expect(enrollment?.enrollment_number).toBe('SU26CSE0001');

    // 3. Verify dossier completeness
    const dossier = studentDossierDocumentService.calculateDossierSummary('STU-2026-000001', 'prog-bca');
    expect(dossier.completeness_percentage).toBeGreaterThanOrEqual(75);

    // 4. Verify unified 360 profile loads
    const s360 = student360UnifiedProfileService.getUnifiedStudent360('STU-2026-000001', registrarContext);
    expect(s360?.header.studentId).toBe('STU-2026-000001');
    expect(s360?.academic.creditsEarned).toBe(22);
    expect(s360?.attendance.overallPercentage).toBe(92.5);
  });

  it('TEST 5: Hardening Dashboard Metrics: Validates 100% integrity score and PRODUCTION_READY status', () => {
    const metrics = studentModuleHardeningIntegrityService.getHardeningMetrics(registrarContext);

    expect(metrics.totalStudentsAudited).toBeGreaterThanOrEqual(1);
    expect(metrics.referentialIntegrityScore).toBe(100);
    expect(metrics.duplicateFlagsCount).toBe(0);
    expect(metrics.securityAuditsPassedCount).toBeGreaterThanOrEqual(15);
    expect(metrics.productionReadinessStatus).toBe('PRODUCTION_READY');
  });
});
