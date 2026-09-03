import { describe, it, expect } from 'vitest';
import { centralEnterpriseZeroTrustSecurityService } from '../services/centralEnterpriseZeroTrustSecurityService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.49: Enterprise Zero-Trust Architecture & IAM Security Engine', () => {

  const cisoAdmin: UserAuthorizationContext = {
    userId: 'emp-ciso-001',
    userName: 'Chief Information Security Officer',
    email: 'ciso@swarrnim.edu.in',
    activeRole: 'SUPER_ADMIN',
    assignedRoles: ['SUPER_ADMIN'],
    permissions: ['SECURITY_ADMIN', 'IAM_ADMIN', 'PAM_ADMIN', 'ZERO_TRUST_AUDIT']
  };

  const normalStaff: UserAuthorizationContext = {
    userId: 'emp-staff-001',
    userName: 'Academic Staff Officer',
    email: 'staff@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['STUDENT_VIEW']
  };

  it('TEST 1: Zero-Trust Policy Engine: Enforces Step-Up MFA for sensitive privileged operations', () => {
    // 1. Standard action without MFA -> ALLOW
    const standardDecision = centralEnterpriseZeroTrustSecurityService.evaluateAccess({
      context: normalStaff,
      resource: 'STUDENT_RECORD',
      action: 'VIEW',
      isMfaVerified: false,
      deviceId: 'dev-trusted-mac-001'
    });
    expect(standardDecision).toBe('ALLOW');

    // 2. Sensitive Privileged Action without Step-Up MFA -> STEP_UP_REQUIRED
    const stepUpDecision = centralEnterpriseZeroTrustSecurityService.evaluateAccess({
      context: cisoAdmin,
      resource: 'SECURITY_CONFIG',
      action: 'PRIVILEGED_ADMINISTRATION',
      isMfaVerified: false,
      deviceId: 'dev-trusted-mac-001'
    });
    expect(stepUpDecision).toBe('STEP_UP_REQUIRED');

    // 3. Sensitive Action with Step-Up MFA Verified -> ALLOW
    const allowedDecision = centralEnterpriseZeroTrustSecurityService.evaluateAccess({
      context: cisoAdmin,
      resource: 'SECURITY_CONFIG',
      action: 'PRIVILEGED_ADMINISTRATION',
      isMfaVerified: true,
      deviceId: 'dev-trusted-mac-001'
    });
    expect(allowedDecision).toBe('ALLOW');
  });

  it('TEST 2: Just-In-Time (JIT) Privileged Access: Grants time-bounded elevated roles with justification gate', () => {
    // 1. Valid JIT Request
    const jitGrant = centralEnterpriseZeroTrustSecurityService.grantJITAccess({
      userId: 'emp-staff-001',
      grantedRole: 'DATABASE_ADMIN',
      justification: 'Emergency database index maintenance during scheduled maintenance window',
      durationHours: 2,
      approverContext: cisoAdmin
    });

    expect(jitGrant.status).toBe('ACTIVE');
    expect(jitGrant.expires_at).toBeDefined();

    // 2. Inadequate justification throws error
    expect(() => {
      centralEnterpriseZeroTrustSecurityService.grantJITAccess({
        userId: 'emp-staff-001',
        grantedRole: 'DATABASE_ADMIN',
        justification: 'Test',
        durationHours: 2,
        approverContext: cisoAdmin
      });
    }).toThrow(/JIT Privilege Denied: A valid operational justification/);
  });

  it('TEST 3: Break-Glass Protocol: Generates critical alert and immutable audit trail during emergency access', () => {
    const breakGlass = centralEnterpriseZeroTrustSecurityService.activateBreakGlass({
      userId: 'emp-ciso-001',
      emergencyReason: 'Critical datacenter fiber cut impacting single sign-on authentication core'
    });

    expect(breakGlass.break_glass_session).toContain('bg-sess-');
    expect(breakGlass.audit_id).toContain('BG-AUDIT-');
  });

  it('TEST 4: Threat Detection & Anomaly Recording: Captures impossible travel and security events', () => {
    const anomaly = centralEnterpriseZeroTrustSecurityService.recordSecurityAnomaly({
      eventType: 'IMPOSSIBLE_TRAVEL_DETECTED',
      userId: 'emp-staff-001',
      sourceIp: '198.51.100.45',
      severity: 'HIGH',
      details: 'Login from Singapore 10 minutes after active session in Gandhinagar, Gujarat'
    });

    expect(anomaly.alert_id).toContain('ALT-');
    expect(anomaly.severity).toBe('HIGH');
    expect(anomaly.status).toBe('OPEN');
  });

  it('TEST 5: Zero-Trust Security Dashboard Telemetry: Validates active sessions, MFA adoption %, and posture', () => {
    const metrics = centralEnterpriseZeroTrustSecurityService.getZeroTrustSecurityMetrics(cisoAdmin);

    expect(metrics.activeSessionsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.trustedDevicesPercent).toBeGreaterThanOrEqual(90);
    expect(metrics.mfaAdoptionPercent).toBeGreaterThanOrEqual(90);
    expect(metrics.securityPosture).toBe('HEALTHY');
  });
});
