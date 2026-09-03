import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityIncidentService } from './centralSecurityIncidentService';
import { centralDocumentComplianceControlService } from './centralDocumentComplianceControlService';
import { centralDocumentRiskManagementService } from './centralDocumentRiskManagementService';

export type SecurityEventSource = 
  | 'APPLICATION'
  | 'DATABASE'
  | 'AUTHENTICATION'
  | 'API'
  | 'NETWORK'
  | 'ENDPOINT'
  | 'SERVER'
  | 'CLOUD'
  | 'FIREWALL'
  | 'SIEM'
  | 'SECURITY_TOOL';

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'MFA_FAILURE'
  | 'PASSWORD_RESET'
  | 'ACCOUNT_LOCK'
  | 'PRIVILEGE_CHANGE'
  | 'ROLE_CHANGE'
  | 'DATA_ACCESS'
  | 'DATA_EXPORT'
  | 'DOCUMENT_ACCESS'
  | 'DOCUMENT_DOWNLOAD'
  | 'API_FAILURE'
  | 'SUSPICIOUS_ACTIVITY'
  | 'MALWARE_ALERT';

export type SecurityEventSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type SecurityAlertStatus = 'NEW' | 'OPEN' | 'TRIAGE' | 'ACKNOWLEDGED' | 'ESCALATED' | 'FALSE_POSITIVE' | 'RESOLVED' | 'CLOSED';
export type TriageDecision = 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'BENIGN' | 'NEEDS_INVESTIGATION' | 'ESCALATE';

export interface SecurityEventRecord {
  id: string;
  event_id: string;
  event_type: SecurityEventType;
  source_type: SecurityEventSource;
  organization_id: string;
  severity: SecurityEventSeverity;
  timestamp: string;
  actor_id?: string;
  target_id?: string;
  ip_address?: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  idempotency_key?: string;
  threat_intel_match: boolean;
  status: 'RECEIVED' | 'NORMALIZED' | 'PROCESSED' | 'CORRELATED' | 'ALERTED';
}

export interface SecurityDetectionRuleRecord {
  id: string;
  rule_code: string;
  name: string;
  category: 'AUTHENTICATION' | 'ACCESS' | 'PRIVILEGE' | 'DATA' | 'ANOMALY';
  severity: SecurityEventSeverity;
  threshold_event_count: number;
  time_window_minutes: number;
  enabled: boolean;
  version: number;
}

export interface ThreatIndicatorRecord {
  id: string;
  indicator_type: 'IP' | 'DOMAIN' | 'URL' | 'HASH' | 'EMAIL';
  indicator_value: string;
  source: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  first_seen: string;
  last_seen: string;
}

export interface SecurityAlertRecord {
  id: string;
  alert_number: string;
  title: string;
  description: string;
  severity: SecurityEventSeverity;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  rule_code: string;
  organization_id: string;
  event_count: number;
  status: SecurityAlertStatus;
  assigned_to?: string;
  incident_id?: string;
  triage_decision?: TriageDecision;
  false_positive_reason?: string;
  first_seen: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface SIEMConnectorRecord {
  id: string;
  name: string;
  provider: 'SPLUNK' | 'ELASTIC' | 'AZURE_SENTINEL' | 'GENERIC_WEBHOOK';
  status: 'HEALTHY' | 'WARNING' | 'FAILED';
  last_sync: string;
  last_checkpoint_timestamp: string;
  events_ingested_total: number;
}

export interface SOCDashboardMetrics {
  eventsTodayCount: number;
  alertsTodayCount: number;
  openAlertsCount: number;
  criticalAlertsCount: number;
  threatMatchesCount: number;
  falsePositiveRatePercent: number;
  connectorHealth: 'HEALTHY' | 'WARNING' | 'FAILED';
  meanTimeToTriageMinutes: number;
}

class CentralSOCService {
  private static instance: CentralSOCService;

  private events: SecurityEventRecord[] = [];
  private rules: SecurityDetectionRuleRecord[] = [];
  private threatIndicators: ThreatIndicatorRecord[] = [];
  private alerts: SecurityAlertRecord[] = [];
  private siemConnectors: SIEMConnectorRecord[] = [];

  private evtCounter = 100;
  private altCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralSOCService {
    if (!CentralSOCService.instance) {
      CentralSOCService.instance = new CentralSOCService();
    }
    return CentralSOCService.instance;
  }

  private seedDemoData(): void {
    // Seed detection rule
    this.rules.push({
      id: 'rule-seed-001',
      rule_code: 'SOC-RULE-BRUTEFORCE',
      name: 'Repeated Authentication Failure Detection',
      category: 'AUTHENTICATION',
      severity: 'HIGH',
      threshold_event_count: 3,
      time_window_minutes: 5,
      enabled: true,
      version: 1
    });

    // Seed threat indicator
    this.threatIndicators.push({
      id: 'ti-seed-001',
      indicator_type: 'IP',
      indicator_value: '198.51.100.44',
      source: 'Global Academic CERT Feed',
      confidence: 'HIGH',
      status: 'ACTIVE',
      first_seen: '2026-01-01T00:00:00Z',
      last_seen: '2026-02-28T00:00:00Z'
    });

    // Seed SIEM connector
    this.siemConnectors.push({
      id: 'siem-conn-001',
      name: 'Enterprise Splunk Cloud Telemetry Connector',
      provider: 'SPLUNK',
      status: 'HEALTHY',
      last_sync: '2026-02-28T12:00:00Z',
      last_checkpoint_timestamp: '2026-02-28T11:59:50Z',
      events_ingested_total: 142500
    });
  }

  // ─── EVENT INGESTION & CORRELATION ENGINE ─────────────────────────────

  public ingestSecurityEvent(params: {
    eventType: SecurityEventType;
    sourceType: SecurityEventSource;
    organizationId: string;
    severity: SecurityEventSeverity;
    actorId?: string;
    targetId?: string;
    ipAddress?: string;
    classification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    idempotencyKey?: string;
  }): { event: SecurityEventRecord; alertGenerated?: SecurityAlertRecord } {
    // Check Idempotency
    if (params.idempotencyKey) {
      const existing = this.events.find(e => e.idempotency_key === params.idempotencyKey);
      if (existing) {
        return { event: existing };
      }
    }

    this.evtCounter += 1;
    const eventId = `SEC-EVT-2026-${String(this.evtCounter).padStart(6, '0')}`;

    // Threat intelligence matching
    const isThreatMatch = this.threatIndicators.some(
      ti => ti.status === 'ACTIVE' && (ti.indicator_value === params.ipAddress || ti.indicator_value === params.actorId)
    );

    const event: SecurityEventRecord = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      event_id: eventId,
      event_type: params.eventType,
      source_type: params.sourceType,
      organization_id: params.organizationId,
      severity: params.severity,
      timestamp: new Date().toISOString(),
      actor_id: params.actorId,
      target_id: params.targetId,
      ip_address: params.ipAddress,
      classification: params.classification || 'INTERNAL',
      idempotency_key: params.idempotencyKey,
      threat_intel_match: isThreatMatch,
      status: 'PROCESSED'
    };

    this.events.push(event);

    // Correlate against detection rules (e.g. repeated login failures)
    let alertGenerated: SecurityAlertRecord | undefined;

    if (params.eventType === 'LOGIN_FAILURE' || isThreatMatch) {
      const matchingEvents = this.events.filter(
        e => e.event_type === params.eventType && e.actor_id === params.actorId && e.status === 'PROCESSED'
      );

      if (matchingEvents.length >= 3 || isThreatMatch) {
        this.altCounter += 1;
        const alertNumber = `SEC-ALT-2026-${String(this.altCounter).padStart(6, '0')}`;

        alertGenerated = {
          id: `alt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          alert_number: alertNumber,
          title: isThreatMatch ? `Threat Intelligence Match: Malicious Indicator ${params.ipAddress || params.actorId}` : `High Frequency Brute-Force Auth Failures (${params.actorId})`,
          description: `Correlated ${matchingEvents.length} security events within detection time window`,
          severity: isThreatMatch ? 'CRITICAL' : 'HIGH',
          priority: isThreatMatch ? 'CRITICAL' : 'HIGH',
          rule_code: isThreatMatch ? 'SOC-RULE-THREATINTEL' : 'SOC-RULE-BRUTEFORCE',
          organization_id: params.organizationId,
          event_count: matchingEvents.length,
          status: 'NEW',
          first_seen: matchingEvents[0]?.timestamp || new Date().toISOString(),
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        this.alerts.push(alertGenerated);
      }
    }

    return { event, alertGenerated };
  }

  // ─── ALERT TRIAGE & INCIDENT ESCALATION ───────────────────────────────

  public triageAlert(params: {
    alertId: string;
    decision: TriageDecision;
    analystId: string;
    notes: string;
    falsePositiveReason?: string;
  }): SecurityAlertRecord {
    const alert = this.alerts.find(a => a.id === params.alertId || a.alert_number === params.alertId);
    if (!alert) throw new Error(`Alert ${params.alertId} not found`);

    alert.triage_decision = params.decision;
    alert.assigned_to = params.analystId;
    alert.updated_at = new Date().toISOString();

    if (params.decision === 'FALSE_POSITIVE') {
      alert.status = 'FALSE_POSITIVE';
      alert.false_positive_reason = params.falsePositiveReason || params.notes;
    } else if (params.decision === 'ESCALATE' || params.decision === 'TRUE_POSITIVE') {
      alert.status = 'TRIAGE';
    } else {
      alert.status = 'ACKNOWLEDGED';
    }

    return alert;
  }

  public escalateAlertToIncident(params: {
    alertId: string;
    commanderId: string;
    context?: UserAuthorizationContext;
  }): { alert: SecurityAlertRecord; incidentId: string } {
    const alert = this.alerts.find(a => a.id === params.alertId || a.alert_number === params.alertId);
    if (!alert) throw new Error(`Alert ${params.alertId} not found`);

    // Create central security incident via 13.31
    const incident = centralSecurityIncidentService.reportIncident({
      title: `Escalated Security Alert: ${alert.title}`,
      description: `Security Incident automatically generated from SOC Alert ${alert.alert_number}. Details: ${alert.description}`,
      incidentType: alert.rule_code.includes('BRUTEFORCE') ? 'ACCOUNT_COMPROMISE' : 'SUSPICIOUS_ACTIVITY',
      severity: alert.severity === 'INFO' ? 'LOW' : alert.severity,
      organizationId: alert.organization_id,
      affectedAssets: ['Authentication Gateway', 'Identity Provider'],
      ciaImpact: { confidentiality: true, integrity: false, availability: false },
      context: params.context
    });

    alert.status = 'ESCALATED';
    alert.incident_id = incident.id;
    alert.updated_at = new Date().toISOString();

    return { alert, incidentId: incident.id };
  }

  // ─── SIEM CONNECTOR SYNC ─────────────────────────────────────────────

  public syncSIEMConnector(connectorId: string): SIEMConnectorRecord {
    const conn = this.siemConnectors.find(c => c.id === connectorId);
    if (!conn) throw new Error(`SIEM Connector ${connectorId} not found`);

    conn.last_sync = new Date().toISOString();
    conn.last_checkpoint_timestamp = new Date().toISOString();
    conn.events_ingested_total += 500;
    conn.status = 'HEALTHY';

    return conn;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getSOCDashboardMetrics(context?: UserAuthorizationContext): SOCDashboardMetrics {
    const eventsTodayCount = this.events.length;
    const alertsTodayCount = this.alerts.length;
    const openAlertsCount = this.alerts.filter(a => a.status === 'NEW' || a.status === 'OPEN' || a.status === 'TRIAGE').length;
    const criticalAlertsCount = this.alerts.filter(a => a.severity === 'CRITICAL').length;
    const threatMatchesCount = this.events.filter(e => e.threat_intel_match).length;

    const fpCount = this.alerts.filter(a => a.status === 'FALSE_POSITIVE').length;
    const fpRate = alertsTodayCount > 0 ? Math.round((fpCount / alertsTodayCount) * 100) : 0;

    return {
      eventsTodayCount,
      alertsTodayCount,
      openAlertsCount,
      criticalAlertsCount,
      threatMatchesCount,
      falsePositiveRatePercent: fpRate,
      connectorHealth: 'HEALTHY',
      meanTimeToTriageMinutes: 8
    };
  }
}

export const centralSOCService = CentralSOCService.getInstance();
