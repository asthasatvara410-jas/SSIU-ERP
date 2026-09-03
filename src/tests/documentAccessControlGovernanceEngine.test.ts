import { describe, it, expect } from 'vitest';
import { centralDocumentAccessControlService } from '../services/centralDocumentAccessControlService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.14: Central Document Access Control, Field Security & Break-Glass Engine', () => {

  const studentAarav: UserAuthorizationContext = {
    userId: 'STU-2026-000001',
    userName: 'Aarav Patel',
    email: 'aarav.patel@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['VIEW_OWN_DOCUMENTS']
  };

  const studentDiya: UserAuthorizationContext = {
    userId: 'STU-2026-000002',
    userName: 'Diya Shah',
    email: 'diya.shah@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['VIEW_OWN_DOCUMENTS']
  };

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_ADMIN', 'APPROVE_ACCESS', 'VIEW_ALL_DOCUMENTS']
  };

  const externalAuditor: UserAuthorizationContext = {
    userId: 'emp-auditor-001',
    userName: 'Audit Officer',
    email: 'auditor@external.gov.in',
    activeRole: 'AUDITOR',
    assignedRoles: ['AUDITOR'],
    permissions: []
  };

  it('TEST 1: Default Deny & Student Self-Access: Allows owner access while strictly blocking cross-student attempts', () => {
    // 1. Aarav accesses his own document -> ALLOW
    const ownAccess = centralDocumentAccessControlService.canAccessDocument({
      user: studentAarav,
      documentId: 'dms-doc-001', // Owned by STU-2026-000001
      action: 'VIEW'
    });
    expect(ownAccess.allowed).toBe(true);
    expect(ownAccess.reason).toContain('Student owner access');

    // 2. Diya attempts to access Aarav\'s document -> DENY (Default Deny & Cross-Student Isolation)
    const crossAccess = centralDocumentAccessControlService.canAccessDocument({
      user: studentDiya,
      documentId: 'dms-doc-001',
      action: 'VIEW'
    });
    expect(crossAccess.allowed).toBe(false);
    expect(crossAccess.reason).toContain('DENIED: Cross-student');
  });

  it('TEST 2: Temporary Access Grants & Immediate Revocation: Enforces time-bound grants and instant revocation', () => {
    // Auditor initially has no access -> DENY
    const beforeGrant = centralDocumentAccessControlService.canAccessDocument({
      user: externalAuditor,
      documentId: 'dms-doc-001',
      action: 'VIEW'
    });
    expect(beforeGrant.allowed).toBe(false);

    // Grant temporary access for 2 hours
    const grant = centralDocumentAccessControlService.grantTemporaryAccess({
      documentId: 'dms-doc-001',
      principalType: 'USER',
      principalId: 'emp-auditor-001',
      permission: 'VIEW',
      durationHours: 2,
      reason: 'NAAC Accreditation external audit inspection',
      grantedBy: 'emp-reg-001'
    });

    expect(grant.id).toBeDefined();
    expect(grant.status).toBe('ACTIVE');

    // Auditor now has access -> ALLOW
    const duringGrant = centralDocumentAccessControlService.canAccessDocument({
      user: externalAuditor,
      documentId: 'dms-doc-001',
      action: 'VIEW'
    });
    expect(duringGrant.allowed).toBe(true);

    // Revoke grant immediately
    centralDocumentAccessControlService.revokeAccessGrant(grant.id);

    // Auditor access is immediately revoked -> DENY
    const afterRevocation = centralDocumentAccessControlService.canAccessDocument({
      user: externalAuditor,
      documentId: 'dms-doc-001',
      action: 'VIEW'
    });
    expect(afterRevocation.allowed).toBe(false);
  });

  it('TEST 3: Emergency Break-Glass Protocol: Allows short-lived emergency override with mandatory audit tracking', () => {
    // Break-glass request without adequate reason fails
    expect(() => {
      centralDocumentAccessControlService.requestBreakGlass({
        documentId: 'dms-doc-001',
        userId: 'emp-staff-999',
        userName: 'Junior Staff',
        reason: 'Short'
      });
    }).toThrow(/Mandatory detailed business\/legal justification required/);

    // Valid Break-Glass invocation
    const bg = centralDocumentAccessControlService.requestBreakGlass({
      documentId: 'dms-doc-001',
      userId: 'emp-staff-999',
      userName: 'Emergency Coordinator',
      reason: 'Urgent medical emergency hospitalization verification required by district hospital'
    });

    expect(bg.id).toBeDefined();
    expect(bg.status).toBe('ACTIVE');

    // Access check under emergency
    const staffContext: UserAuthorizationContext = {
      userId: 'emp-staff-999',
      userName: 'Emergency Coordinator',
      email: 'coord@swarrnim.edu.in',
      activeRole: 'STAFF',
      assignedRoles: ['STAFF'],
      permissions: []
    };

    const bgAccess = centralDocumentAccessControlService.canAccessDocument({
      user: staffContext,
      documentId: 'dms-doc-001',
      action: 'VIEW'
    });

    expect(bgAccess.allowed).toBe(true);
    expect(bgAccess.reason).toContain('Emergency Break-Glass override active');
  });

  it('TEST 4: Access Request Workflow with Separation of Duties: Prevents self-approval and enables authorized delegation', () => {
    const req = centralDocumentAccessControlService.createAccessRequest({
      documentId: 'dms-doc-001',
      requestedBy: 'emp-faculty-001',
      requestedPermission: 'DOWNLOAD',
      reason: 'Research grant committee document inspection',
      durationHours: 12
    });

    expect(req.id).toBeDefined();
    expect(req.status).toBe('PENDING');

    // Self-approval must fail
    expect(() => {
      centralDocumentAccessControlService.approveAccessRequest({
        requestId: req.id,
        approvedBy: 'emp-faculty-001' // Same as requester
      });
    }).toThrow(/Separation of Duties Violation: Requester cannot approve their own access request/);

    // Approval by authorized Registrar succeeds
    const grant = centralDocumentAccessControlService.approveAccessRequest({
      requestId: req.id,
      approvedBy: 'emp-reg-001'
    });

    expect(grant.status).toBe('ACTIVE');
    expect(grant.permission).toBe('DOWNLOAD');
  });

  it('TEST 5: Field-Level Masking & Dashboard Metrics: Masks sensitive PII for non-admin viewers and computes metrics', () => {
    // 1. Masking Aadhaar for Student Role
    const maskedAadhaar = centralDocumentAccessControlService.maskSensitiveField('aadhaar_number', '1234 5678 9012', 'STUDENT');
    expect(maskedAadhaar).toBe('**** **** 9012');

    // 2. Unmasked for Registrar
    const unmaskedAadhaar = centralDocumentAccessControlService.maskSensitiveField('aadhaar_number', '1234 5678 9012', 'REGISTRAR');
    expect(unmaskedAadhaar).toBe('1234 5678 9012');

    // 3. Dashboard Metrics
    const metrics = centralDocumentAccessControlService.getAccessDashboardMetrics();

    expect(metrics.totalAccessChecksCount).toBeGreaterThanOrEqual(5);
    expect(metrics.allowedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.deniedCount).toBeGreaterThanOrEqual(2);
    expect(metrics.breakGlassEventsCount).toBeGreaterThanOrEqual(1);
  });
});
