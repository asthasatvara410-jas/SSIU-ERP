import { describe, it, expect } from 'vitest';
import { centralAdvancedCaseIncidentManagementService } from '../services/centralAdvancedCaseIncidentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.41: Advanced Case, Incident, Problem & Change Management Engine', () => {

  const itsmManager: UserAuthorizationContext = {
    userId: 'emp-itsm-mgr-001',
    userName: 'Director of Campus IT & Infrastructure',
    email: 'itsm@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'INCIDENT_VIEW',
      'INCIDENT_CREATE',
      'INCIDENT_RESOLVE',
      'PROBLEM_VIEW',
      'PROBLEM_CREATE',
      'RCA_CREATE',
      'KNOWN_ERROR_CREATE',
      'CHANGE_CREATE',
      'CHANGE_APPROVE',
      'CHANGE_ROLLBACK'
    ]
  };

  it('TEST 1: Incident Management: SEV1 Critical outage automatically declares Major Incident and activates War Room', () => {
    const { incident, majorIncident } = centralAdvancedCaseIncidentManagementService.reportIncident({
      title: 'Central Student Examination Portal Payment Gateway Unreachable',
      description: 'Fee payment gateway API timing out during peak semester exam registration window',
      affectedService: 'Student Examination & Payment Gateway',
      organizationId: 'inst-sit',
      campusId: 'campus-main',
      departmentId: 'dept-exam',
      severity: 'SEV1_CRITICAL',
      commanderId: 'emp-it-commander-001'
    });

    expect(incident.id).toBeDefined();
    expect(incident.incident_number).toMatch(/^INC-2026-\d{6}$/);
    expect(incident.severity).toBe('SEV1_CRITICAL');
    expect(incident.is_major_incident).toBe(true);

    expect(majorIncident).toBeDefined();
    expect(majorIncident?.major_incident_number).toMatch(/^MI-2026-\d{6}$/);
    expect(majorIncident?.war_room_status).toBe('ACTIVE');
    expect(majorIncident?.commander_id).toBe('emp-it-commander-001');
  });

  it('TEST 2: Problem Management & RCA: Groups incidents and confirms root cause via 5-Why analysis', () => {
    // 1. Create Problem from recurring incidents
    const problem = centralAdvancedCaseIncidentManagementService.createProblemFromIncidents({
      title: 'Recurring Database Connection Pool Starvation during Hall Ticket Generation',
      affectedService: 'Examination Hall Ticket Engine',
      incidentIds: ['inc-001', 'inc-002', 'inc-003']
    });

    expect(problem.id).toBeDefined();
    expect(problem.problem_number).toMatch(/^PRB-2026-\d{6}$/);
    expect(problem.incident_count).toBe(3);
    expect(problem.status).toBe('ANALYSIS');

    // 2. Conduct RCA
    const rca = centralAdvancedCaseIncidentManagementService.conductRCA({
      problemId: problem.id,
      method: '5_WHY',
      rootCauseSummary: 'Database connection pool max connections set too low for concurrent batch generation',
      contributingFactors: ['Configuration Cap', 'Peak Load Surge', 'Connection Leak in Report Generator']
    });

    expect(rca.id).toBeDefined();
    expect(rca.confidence).toBe('CONFIRMED');
    expect(problem.root_cause_confirmed).toBe(true);
    expect(problem.status).toBe('ROOT_CAUSE_IDENTIFIED');
  });

  it('TEST 3: Known Error Database (KEDB): Publishes verified workaround for recurring defect', () => {
    const knownError = centralAdvancedCaseIncidentManagementService.createKnownError({
      problemId: 'prb-seed-001',
      symptoms: 'HTTP 504 Gateway Timeout when downloading consolidated grade transcript PDF',
      workaroundText: 'Use background async PDF generation queue or download semester-wise grade sheet'
    });

    expect(knownError.id).toBeDefined();
    expect(knownError.error_number).toMatch(/^KE-2026-\d{6}$/);
    expect(knownError.status).toBe('PUBLISHED');
    expect(knownError.published_at).toBeDefined();
  });

  it('TEST 4: Change Management & Rollback Control: Submits RFC and executes rollback on failed validation', () => {
    // 1. Submit Change Request
    const change = centralAdvancedCaseIncidentManagementService.submitChangeRequest({
      title: 'Upgrade Central Gateway SSL Cipher Suite and TLS 1.3 Strict Enforcement',
      changeType: 'NORMAL',
      riskLevel: 'HIGH',
      affectedService: 'Campus HTTPS Gateway',
      implementationPlan: 'Deploy new Nginx SSL configuration and restart load balancer',
      rollbackPlan: 'Restore previous cipher suite config from backup repository',
      requestedBy: 'emp-sec-001'
    });

    expect(change.id).toBeDefined();
    expect(change.change_number).toMatch(/^CHG-2026-\d{6}$/);
    expect(change.status).toBe('APPROVED');

    // 2. Rollback Change on validation defect
    const rolledBack = centralAdvancedCaseIncidentManagementService.rollbackChange(
      change.id,
      'Legacy biometric attendance IoT devices failed TLS 1.3 handshake'
    );

    expect(rolledBack.status).toBe('ROLLED_BACK');
  });

  it('TEST 5: ITSM Dashboard Telemetry: Validates metrics, active major incidents, and posture', () => {
    const metrics = centralAdvancedCaseIncidentManagementService.getITSMDashboardMetrics(itsmManager);

    expect(metrics.openIncidentsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.criticalSev1Count).toBeGreaterThanOrEqual(1);
    expect(metrics.activeMajorIncidentsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.changeSuccessRatePercent).toBeGreaterThanOrEqual(95);
    expect(metrics.itsmPosture).toBe('HEALTHY');
  });
});
