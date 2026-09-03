import { describe, it, expect } from 'vitest';
import { centralSOCService } from '../services/centralSOCService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.32: Security Operations Center (SOC) & Security Monitoring Engine', () => {

  const socAnalyst: UserAuthorizationContext = {
    userId: 'emp-soc-001',
    userName: 'SOC Lead Analyst',
    email: 'soc@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'SOC_VIEW',
      'SOC_ANALYST',
      'EVENT_VIEW',
      'ALERT_VIEW',
      'ALERT_TRIAGE',
      'ALERT_ESCALATE',
      'RULE_VIEW',
      'THREAT_INTEL_VIEW',
      'SECURITY_REPORT'
    ]
  };

  it('TEST 1: Security Event Ingestion & Idempotency: Ingests event and prevents duplicate processing', () => {
    const idempotencyKey = `idemp-evt-${Date.now()}`;

    // 1. First Ingestion
    const first = centralSOCService.ingestSecurityEvent({
      eventType: 'DOCUMENT_ACCESS',
      sourceType: 'APPLICATION',
      organizationId: 'inst-sit',
      severity: 'INFO',
      actorId: 'usr-student-001',
      targetId: 'doc-grade-card-99',
      idempotencyKey
    });

    expect(first.event.id).toBeDefined();
    expect(first.event.event_id).toMatch(/^SEC-EVT-2026-\d{6}$/);

    // 2. Duplicate Ingestion with same key
    const duplicate = centralSOCService.ingestSecurityEvent({
      eventType: 'DOCUMENT_ACCESS',
      sourceType: 'APPLICATION',
      organizationId: 'inst-sit',
      severity: 'INFO',
      actorId: 'usr-student-001',
      targetId: 'doc-grade-card-99',
      idempotencyKey
    });

    expect(duplicate.event.id).toBe(first.event.id);
  });

  it('TEST 2: Detection Rules & Event Correlation: Triggers correlated alert after threshold auth failures', () => {
    const actorId = `attacker-${Date.now()}`;

    // Ingest 3 consecutive login failures
    centralSOCService.ingestSecurityEvent({
      eventType: 'LOGIN_FAILURE',
      sourceType: 'AUTHENTICATION',
      organizationId: 'inst-sit',
      severity: 'LOW',
      actorId
    });

    centralSOCService.ingestSecurityEvent({
      eventType: 'LOGIN_FAILURE',
      sourceType: 'AUTHENTICATION',
      organizationId: 'inst-sit',
      severity: 'LOW',
      actorId
    });

    const third = centralSOCService.ingestSecurityEvent({
      eventType: 'LOGIN_FAILURE',
      sourceType: 'AUTHENTICATION',
      organizationId: 'inst-sit',
      severity: 'HIGH',
      actorId
    });

    expect(third.alertGenerated).toBeDefined();
    expect(third.alertGenerated?.alert_number).toMatch(/^SEC-ALT-2026-\d{6}$/);
    expect(third.alertGenerated?.rule_code).toBe('SOC-RULE-BRUTEFORCE');
    expect(third.alertGenerated?.status).toBe('NEW');
  });

  it('TEST 3: Threat Intelligence Matching: Flags known malicious indicators and triggers critical alert', () => {
    const match = centralSOCService.ingestSecurityEvent({
      eventType: 'API_FAILURE',
      sourceType: 'FIREWALL',
      organizationId: 'inst-sit',
      severity: 'CRITICAL',
      ipAddress: '198.51.100.44' // Known threat indicator from seed data
    });

    expect(match.event.threat_intel_match).toBe(true);
    expect(match.alertGenerated).toBeDefined();
    expect(match.alertGenerated?.severity).toBe('CRITICAL');
    expect(match.alertGenerated?.rule_code).toBe('SOC-RULE-THREATINTEL');
  });

  it('TEST 4: Alert Triage & Incident Escalation: Triages false positive and escalates critical alert to Incident', () => {
    // 1. Create and triage false positive
    const { alertGenerated } = centralSOCService.ingestSecurityEvent({
      eventType: 'API_FAILURE',
      sourceType: 'FIREWALL',
      organizationId: 'inst-sit',
      severity: 'CRITICAL',
      ipAddress: '198.51.100.44'
    });

    expect(alertGenerated).toBeDefined();
    const alertId = alertGenerated!.id;

    const fp = centralSOCService.triageAlert({
      alertId,
      decision: 'FALSE_POSITIVE',
      analystId: 'emp-soc-001',
      notes: 'Benign automated penetration test simulation from authorized campus IP',
      falsePositiveReason: 'Authorized Security Pen-Test'
    });

    expect(fp.status).toBe('FALSE_POSITIVE');
    expect(fp.triage_decision).toBe('FALSE_POSITIVE');

    // 2. Escalate high severity alert to full Security Incident
    const bruteForceMatch = centralSOCService.ingestSecurityEvent({
      eventType: 'API_FAILURE',
      sourceType: 'FIREWALL',
      organizationId: 'inst-sit',
      severity: 'CRITICAL',
      ipAddress: '198.51.100.44'
    });

    const escalated = centralSOCService.escalateAlertToIncident({
      alertId: bruteForceMatch.alertGenerated!.id,
      commanderId: 'emp-ciso-001',
      context: socAnalyst
    });

    expect(escalated.alert.status).toBe('ESCALATED');
    expect(escalated.incidentId).toBeDefined();
    expect(escalated.alert.incident_id).toBe(escalated.incidentId);
  });

  it('TEST 5: SIEM Connector Framework & SOC Telemetry: Syncs connector and validates dashboard KPIs', () => {
    const synced = centralSOCService.syncSIEMConnector('siem-conn-001');

    expect(synced.status).toBe('HEALTHY');
    expect(synced.last_checkpoint_timestamp).toBeDefined();
    expect(synced.events_ingested_total).toBeGreaterThan(142500);

    const metrics = centralSOCService.getSOCDashboardMetrics(socAnalyst);
    expect(metrics.eventsTodayCount).toBeGreaterThanOrEqual(1);
    expect(metrics.alertsTodayCount).toBeGreaterThanOrEqual(1);
    expect(metrics.connectorHealth).toBe('HEALTHY');
    expect(metrics.meanTimeToTriageMinutes).toBeGreaterThan(0);
  });
});
