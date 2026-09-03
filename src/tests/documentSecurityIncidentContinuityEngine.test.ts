import { describe, it, expect } from 'vitest';
import { centralSecurityIncidentService } from '../services/centralSecurityIncidentService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.31: Information Security Continuity & Cyber Incident Recovery Engine', () => {

  const cisoContext: UserAuthorizationContext = {
    userId: 'emp-ciso-001',
    userName: 'Chief Information Security Officer',
    email: 'ciso@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'SECURITY_INCIDENT_VIEW',
      'SECURITY_INCIDENT_CREATE',
      'SECURITY_INCIDENT_UPDATE',
      'SECURITY_INCIDENT_TRIAGE',
      'SECURITY_INCIDENT_CONTAIN',
      'SECURITY_INCIDENT_ERADICATE',
      'SECURITY_INCIDENT_CLOSE',
      'SECURITY_EVIDENCE_COLLECT',
      'SECURITY_REPORT_VIEW'
    ]
  };

  it('TEST 1: Security Incident Intake, Triage & Exercise Isolation: Creates incident and triages with commander', () => {
    const incident = centralSecurityIncidentService.reportIncident({
      title: 'Distributed Brute-Force Authentication Attempt on Faculty Dossier Gateway',
      description: 'Multiple automated login attempts detected across distributed subnet IPs',
      incidentType: 'UNAUTHORIZED_ACCESS',
      severity: 'HIGH',
      organizationId: 'inst-sit',
      affectedAssets: ['Faculty Dossier Portal', 'SSO Gateway'],
      ciaImpact: { confidentiality: true, integrity: false, availability: true },
      context: cisoContext
    });

    expect(incident.id).toBeDefined();
    expect(incident.incident_number).toMatch(/^SEC-INC-2026-\d{6}$/);
    expect(incident.status).toBe('REPORTED');

    // Triage incident
    const triaged = centralSecurityIncidentService.triageIncident({
      incidentId: incident.id,
      commanderId: 'emp-ciso-001',
      confirmedSeverity: 'HIGH'
    });

    expect(triaged.status).toBe('CONFIRMED');
    expect(triaged.commander_id).toBe('emp-ciso-001');
  });

  it('TEST 2: Containment & Eradication Workflow: Executes session revocation and credential resets', () => {
    const incident = centralSecurityIncidentService.reportIncident({
      title: 'Compromised Faculty Account Suspicious Document Download',
      description: 'Faculty credential used to batch download confidential salary slips outside normal hours',
      incidentType: 'ACCOUNT_COMPROMISE',
      severity: 'HIGH',
      organizationId: 'inst-sit',
      affectedAssets: ['DMS Vault', 'Payroll Document Index'],
      ciaImpact: { confidentiality: true, integrity: false, availability: false }
    });

    // 1. Containment Action
    const containment = centralSecurityIncidentService.executeContainment({
      incidentId: incident.id,
      actionType: 'REVOKE_SESSION',
      target: 'User account: faculty-emp-99',
      operatorId: 'emp-ciso-001',
      notes: 'Revoked all active JWT sessions and suspended login for 2 hours'
    });

    expect(containment.id).toBeDefined();
    expect(containment.status).toBe('EXECUTED');
    expect(incident.status).toBe('CONTAINMENT');

    // 2. Eradication Action
    const eradication = centralSecurityIncidentService.executeEradication({
      incidentId: incident.id,
      actionType: 'CREDENTIAL_RESET',
      description: 'Enforced mandatory MFA re-enrollment and cryptographic password reset',
      operatorId: 'emp-ciso-001',
      verifiedBy: 'emp-aud-001'
    });

    expect(eradication.id).toBeDefined();
    expect(incident.status).toBe('ERADICATION');
  });

  it('TEST 3: Forensic Evidence Collection & Chain of Custody: Collects hashed evidence and transfers custody', () => {
    const incidentId = 'sec-seed-001';

    // 1. Collect Evidence
    const evidence = centralSecurityIncidentService.collectEvidence({
      incidentId,
      source: 'Firewall & NGINX Ingress Access Logs',
      collectorId: 'emp-sec-002',
      sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      classification: 'RESTRICTED'
    });

    expect(evidence.id).toBeDefined();
    expect(evidence.evidence_number).toMatch(/^EVD\/2026\/\d{6}$/);
    expect(evidence.custody_chain.length).toBe(1);
    expect(evidence.custody_chain[0].event).toBe('COLLECTED');

    // 2. Transfer Custody
    const transferred = centralSecurityIncidentService.transferCustody({
      evidenceId: evidence.id,
      actorId: 'emp-ciso-001',
      event: 'TRANSFERRED',
      reason: 'Delivered to Lead Forensic Investigator for IP payload extraction'
    });

    expect(transferred.custody_chain.length).toBe(2);
    expect(transferred.custody_chain[1].event).toBe('TRANSFERRED');
  });

  it('TEST 4: Post-Incident Review & Closure Validation: Blocks premature closure and closes upon PIR completion', () => {
    const incident = centralSecurityIncidentService.reportIncident({
      title: 'Phishing Email Campaign Targeting Student Financial Aid Links',
      description: 'Malicious external spoofed emails attempting to solicit student bank details',
      incidentType: 'PHISHING',
      severity: 'MEDIUM',
      organizationId: 'inst-sit',
      affectedAssets: ['Student Mail Gateway'],
      ciaImpact: { confidentiality: false, integrity: false, availability: false }
    });

    // Attempt premature closure without PIR must throw
    expect(() => {
      centralSecurityIncidentService.closeIncident(incident.id);
    }).toThrow(/Incident Closure Blocked: Incident .* requires approved Post-Incident Review/);

    // Complete Post-Incident Review
    const review = centralSecurityIncidentService.createPostIncidentReview({
      incidentId: incident.id,
      rootCause: 'External spear-phishing domain spoofing university headers',
      containmentEffective: true,
      lessonsLearned: ['Implement strict SPF/DKIM/DMARC hard-fail policies for external mail routing'],
      recommendations: ['Conduct student security awareness campaign and enforce DMARC reject mode'],
      reviewedBy: 'emp-ciso-001'
    });

    expect(review.id).toBeDefined();
    expect(review.review_number).toMatch(/^PIR\/2026\/\d{6}$/);
    expect(incident.status).toBe('RESOLVED');

    // Close Incident after review
    const closed = centralSecurityIncidentService.closeIncident(incident.id);
    expect(closed.status).toBe('CLOSED');
    expect(closed.closed_at).toBeDefined();
  });

  it('TEST 5: Security Dashboard & Operational KPIs: Validates metrics for open incidents and evidence telemetry', () => {
    const metrics = centralSecurityIncidentService.getSecurityIncidentDashboardMetrics(cisoContext);

    expect(metrics.resolvedIncidentsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalEvidenceItemsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageTimeToContainHours).toBeGreaterThan(0);
  });
});
