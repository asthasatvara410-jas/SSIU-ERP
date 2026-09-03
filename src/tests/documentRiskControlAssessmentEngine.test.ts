import { describe, it, expect } from 'vitest';
import { centralDocumentRiskManagementService } from '../services/centralDocumentRiskManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.28: Document Compliance Risk & Control Assessment Engine', () => {

  const riskOfficer: UserAuthorizationContext = {
    userId: 'emp-risk-001',
    userName: 'Chief Risk Officer',
    email: 'cro@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['RISK_VIEW', 'RISK_CREATE', 'RISK_UPDATE', 'RISK_ASSESS', 'RISK_MAP_CONTROL', 'RISK_TREAT', 'RISK_ACCEPT', 'RISK_MONITOR', 'RISK_REPORT_VIEW']
  };

  it('TEST 1: Risk Identification & Inherent Scoring: Registers risk and calculates inherent score', () => {
    const risk = centralDocumentRiskManagementService.createRisk({
      name: 'Unauthorized Physical Deletion of Regulatory Admission Records',
      description: 'Accidental deletion of quota reservation certificates prior to 5-year statutory retention',
      category: 'ADMISSION',
      organizationId: 'inst-sit',
      ownerId: 'emp-risk-001',
      likelihood: 4,
      impact: 5,
      context: riskOfficer
    });

    expect(risk.id).toBeDefined();
    expect(risk.risk_number).toMatch(/^RISK-2026\/\d{6}$/);
    expect(risk.inherent_score).toBe(20);
    expect(risk.risk_level).toBe('CRITICAL');
    expect(risk.has_control_gap).toBe(true);
  });

  it('TEST 2: Control Mapping & Residual Risk: Maps control and computes mitigated residual risk', () => {
    const risk = centralDocumentRiskManagementService.createRisk({
      name: 'Unverified Grade Ledger Discrepancies',
      description: 'Discrepancy between ERP grades and archived transcript copies',
      category: 'EXAMINATION',
      organizationId: 'inst-sit',
      ownerId: 'emp-risk-001',
      likelihood: 4,
      impact: 4
    });

    expect(risk.inherent_score).toBe(16);

    // Map control DOC-CTRL-001 (effective automated check)
    const result = centralDocumentRiskManagementService.mapControlToRisk({
      riskId: risk.id,
      controlCode: 'DOC-CTRL-001',
      coverageType: 'PREVENTIVE',
      coverageStrength: 'FULL',
      mappedBy: 'emp-risk-001'
    });

    expect(result.risk.has_control_gap).toBe(false);
    expect(result.risk.residual_score).toBeLessThanOrEqual(8);
    expect(['LOW', 'MEDIUM']).toContain(result.risk.risk_level);
  });

  it('TEST 3: Risk Treatment & Verification Workflow: Creates mitigation plan and verifies completion', () => {
    const risk = centralDocumentRiskManagementService.createRisk({
      name: 'Third-Party Verification Portal Outage',
      description: 'Temporary unavailability of external background verification API',
      category: 'TECHNOLOGY',
      organizationId: 'inst-sit',
      ownerId: 'emp-risk-001',
      likelihood: 3,
      impact: 4
    });

    // 1. Create Treatment
    const trt = centralDocumentRiskManagementService.createRiskTreatment({
      riskId: risk.id,
      strategy: 'MITIGATE',
      description: 'Implement local fallback caching and retry queue for verification tokens',
      ownerId: 'emp-dev-001',
      dueDate: '2026-04-30T00:00:00Z',
      expectedResidualScore: 4
    });

    expect(trt.id).toBeDefined();
    expect(trt.treatment_number).toMatch(/^TRT\/2026\/\d{6}$/);
    expect(trt.status).toBe('IN_PROGRESS');

    // 2. Verify Completion
    const verified = centralDocumentRiskManagementService.verifyTreatmentCompletion({
      treatmentId: trt.id,
      verifiedBy: 'emp-risk-001',
      actualResidualScore: 4,
      evidenceReference: 'REV/2026/000001'
    });

    expect(verified.treatment.status).toBe('VERIFIED');
    expect(verified.risk.residual_score).toBe(4);
    expect(verified.risk.status).toBe('MITIGATED');
  });

  it('TEST 4: Key Risk Indicator (KRI) Monitoring: Triggers alert and status change on threshold breach', () => {
    const risk = centralDocumentRiskManagementService.createRisk({
      name: 'Unprocessed Disposal Request Backlog',
      description: 'Accumulation of unverified disposal candidates exceeding SLA threshold',
      category: 'DOCUMENT',
      organizationId: 'inst-sit',
      ownerId: 'emp-risk-001',
      likelihood: 3,
      impact: 3
    });

    const kri = centralDocumentRiskManagementService.recordKRI({
      riskId: risk.id,
      name: 'Backlogged Disposal Requests > 30 Days',
      metric: 'REQUEST_COUNT',
      thresholdValue: 10,
      currentValue: 15, // Breached threshold
      ownerId: 'emp-risk-001'
    });

    expect(kri.status).toBe('BREACH');
  });

  it('TEST 5: Risk Acceptance & Dashboard Telemetry: Validates time-bound acceptance and dashboard KPIs', () => {
    const risk = centralDocumentRiskManagementService.createRisk({
      name: 'Minor Format Discrepancy in Historical Scans',
      description: 'Legacy 1995 scanned documents lack searchable OCR layer',
      category: 'DOCUMENT',
      organizationId: 'inst-sit',
      ownerId: 'emp-risk-001',
      likelihood: 2,
      impact: 2
    });

    const acc = centralDocumentRiskManagementService.requestRiskAcceptance({
      riskId: risk.id,
      reason: 'Legacy physical records verified in university archive vault; OCR enhancement not feasible',
      acceptedBy: 'emp-risk-001',
      approvedBy: 'emp-reg-001',
      durationDays: 180
    });

    expect(acc.status).toBe('APPROVED');

    const metrics = centralDocumentRiskManagementService.getRiskDashboardMetrics(riskOfficer);
    expect(metrics.totalRisksCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageInherentScore).toBeGreaterThan(0);
    expect(metrics.averageResidualScore).toBeGreaterThan(0);
  });
});
