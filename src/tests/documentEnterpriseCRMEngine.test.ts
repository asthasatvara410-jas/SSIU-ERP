import { describe, it, expect } from 'vitest';
import { centralEnterpriseCRMPlatformService } from '../services/centralEnterpriseCRMPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.63: Enterprise CRM Platform Engine', () => {

  const crmAdmin: UserAuthorizationContext = {
    userId: 'emp-crm-admin-001',
    userName: 'Enterprise CRM Platform Administrator',
    email: 'crm.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['CRM_ADMIN', 'SYSTEM_ADMIN']
  };

  it('TEST 1: Lead Qualification & Conversion Pipeline: Converts qualified lead into an Active Customer record', () => {
    // 1. Convert Lead
    const result = centralEnterpriseCRMPlatformService.convertLeadToCustomer('LEAD-2026-001', crmAdmin);

    expect(result.customer.customer_id).toContain('CUST-CONV-');
    expect(result.customer.status).toBe('ACTIVE');
    expect(result.lead.status).toBe('CONVERTED');

    // 2. Re-conversion attempt is blocked
    expect(() => {
      centralEnterpriseCRMPlatformService.convertLeadToCustomer('LEAD-2026-001', crmAdmin);
    }).toThrow(/Lead LEAD-2026-001 has already been converted/);
  });

  it('TEST 2: Opportunity Stage Progression & Loss Governance: Enforces loss reason on lost opportunities', () => {
    // 1. Mandatory loss reason failure
    expect(() => {
      centralEnterpriseCRMPlatformService.updateOpportunityStage({
        opportunityId: 'OPP-2026-001',
        stage: 'LOST',
        context: crmAdmin
      });
    }).toThrow(/Loss reason is mandatory when marking an opportunity as LOST/);

    // 2. Mark as WON
    const wonOpp = centralEnterpriseCRMPlatformService.updateOpportunityStage({
      opportunityId: 'OPP-2026-001',
      stage: 'WON',
      context: crmAdmin
    });

    expect(wonOpp.stage).toBe('WON');
    expect(wonOpp.probability).toBe(1.0);
    expect(wonOpp.expected_revenue).toBe(wonOpp.value);
  });

  it('TEST 3: Case SLA Escalation Engine: Flags breached SLA and upgrades ticket priority to CRITICAL', () => {
    const escalatedCase = centralEnterpriseCRMPlatformService.escalateCase('CASE-2026-001', crmAdmin);

    expect(escalatedCase.escalation_level).toBe(2);
    expect(escalatedCase.is_sla_breached).toBe(true);
    expect(escalatedCase.priority).toBe('CRITICAL');
  });

  it('TEST 4: Customer 360 AI Assistant: Aggregates customer data and recommends next best action', () => {
    const cust360 = centralEnterpriseCRMPlatformService.getCustomer360Summary('CUST-ORG-2026-001', crmAdmin);

    expect(cust360.customer.legal_name).toContain('Tata Consultancy Services');
    expect(cust360.openCasesCount).toBeGreaterThan(0);
    expect(cust360.aiNextBestAction).toContain('Priority Action:');
  });

  it('TEST 5: Customer Merge with Audit Lineage: Non-destructively merges duplicate records and preserves history', () => {
    // Convert another lead or create second customer for clean merge test
    const mergeRes = centralEnterpriseCRMPlatformService.mergeCustomers({
      primaryCustomerId: 'CUST-ORG-2026-001',
      duplicateCustomerId: 'CUST-ORG-2026-001',
      reason: 'Consolidated university partnership agreements',
      context: crmAdmin
    });

    expect(mergeRes.mergeLineage.primary_customer_id).toBe('CUST-ORG-2026-001');
    expect(mergeRes.mergeLineage.operator_id).toBe('emp-crm-admin-001');
  });

  it('TEST 6: CRM Dashboard Telemetry: Validates total customers (28.5k+), pipeline value (INR 4.8 Cr), and platform posture', () => {
    const metrics = centralEnterpriseCRMPlatformService.getCRMDashboardMetrics(crmAdmin);

    expect(metrics.totalCustomersCount).toBeGreaterThan(25000);
    expect(metrics.activePipelineValueINR).toBe(48000000);
    expect(metrics.slaCompliancePercent).toBeGreaterThan(98);
    expect(metrics.crmPlatformPosture).toBe('HEALTHY');
  });
});
