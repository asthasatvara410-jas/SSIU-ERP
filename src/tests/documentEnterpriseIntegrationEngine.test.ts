import { describe, it, expect } from 'vitest';
import { centralEnterpriseIntegrationService } from '../services/centralEnterpriseIntegrationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.46: Enterprise Integration Hub, Event Bus & API Gateway Engine', () => {

  const integrationAdmin: UserAuthorizationContext = {
    userId: 'emp-int-admin-001',
    userName: 'Enterprise Integration Architect',
    email: 'integration@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'INTEGRATION_VIEW',
      'INTEGRATION_MANAGE',
      'WEBHOOK_ADMIN',
      'EVENT_BUS_ADMIN'
    ]
  };

  it('TEST 1: Event Bus & Idempotency: Deduplicates repeated domain events using unique idempotency key', () => {
    const event = {
      event_id: 'evt-pay-2026-001',
      event_type: 'PaymentReceived.v1',
      entity_type: 'PAYMENT',
      entity_id: 'pay-2026-000101',
      organization_id: 'inst-sit',
      correlation_id: 'corr-pay-001',
      idempotency_key: 'idem-key-unique-pay-001',
      occurred_at: new Date().toISOString(),
      payload: { student_id: 'STU-001', amount: 45000, fee_head: 'TUITION_FEE' }
    };

    // 1. First Publish
    const firstRes = centralEnterpriseIntegrationService.publishDomainEvent(event);
    expect(firstRes.processed).toBe(true);
    expect(firstRes.status).toBe('PUBLISHED');

    // 2. Duplicate Publish with same idempotency key
    const duplicateRes = centralEnterpriseIntegrationService.publishDomainEvent(event);
    expect(duplicateRes.processed).toBe(false);
    expect(duplicateRes.status).toBe('DUPLICATE_IGNORED');
  });

  it('TEST 2: Inbound Webhooks & Replay Protection: Rejects stale replayed webhook payloads and verifies HMAC', () => {
    // 1. Valid Webhook
    const validWebhook = centralEnterpriseIntegrationService.processInboundWebhook({
      integrationCode: 'INT-PAYMENT-GATEWAY',
      payload: { transaction_ref: 'TXN-2026-999', status: 'PAID' },
      signature: 'hmac-sha256-verified-valid-signature-key-001',
      timestamp: Date.now()
    });
    expect(validWebhook.status).toBe('SUCCESS');
    expect(validWebhook.transaction_id).toBeDefined();

    // 2. Stale Replayed Webhook (10 minutes old = 600,000ms)
    expect(() => {
      centralEnterpriseIntegrationService.processInboundWebhook({
        integrationCode: 'INT-PAYMENT-GATEWAY',
        payload: { transaction_ref: 'TXN-2026-999', status: 'PAID' },
        signature: 'hmac-sha256-verified-valid-signature-key-001',
        timestamp: Date.now() - 600000
      });
    }).toThrow(/Webhook Rejected: Replay protection window exceeded/);
  });

  it('TEST 3: Resilience & Circuit Breaker: Trips circuit breaker on consecutive failures and routes to DLQ', () => {
    // Simulate 3 failures to trip circuit breaker
    centralEnterpriseIntegrationService.dispatchOutbound({
      integrationCode: 'INT-GOV-HIGHER-ED',
      payload: { batch_id: 'batch-001' },
      simulateFailure: true
    });
    centralEnterpriseIntegrationService.dispatchOutbound({
      integrationCode: 'INT-GOV-HIGHER-ED',
      payload: { batch_id: 'batch-002' },
      simulateFailure: true
    });
    const failed3 = centralEnterpriseIntegrationService.dispatchOutbound({
      integrationCode: 'INT-GOV-HIGHER-ED',
      payload: { batch_id: 'batch-003' },
      simulateFailure: true
    });
    expect(failed3.status).toBe('FAILED_ROUTED_TO_DLQ');

    // 4th request must immediately fail with OPEN circuit breaker
    expect(() => {
      centralEnterpriseIntegrationService.dispatchOutbound({
        integrationCode: 'INT-GOV-HIGHER-ED',
        payload: { batch_id: 'batch-004' }
      });
    }).toThrow(/Circuit Breaker OPEN: Outbound requests temporarily suspended/);
  });

  it('TEST 4: Data Mapping & Schema Transformation: Transforms external schema to ERP canonical format', () => {
    const externalPayload = {
      ext_student_roll: '2026-CE-042',
      ext_dept_code: 'COMP_ENGG',
      ext_semester: 'VI'
    };

    const mappingRules = {
      enrollment_number: 'ext_student_roll',
      department_id: 'ext_dept_code',
      current_semester: 'ext_semester'
    };

    const canonical = centralEnterpriseIntegrationService.transformPayload(externalPayload, mappingRules);
    expect(canonical.enrollment_number).toBe('2026-CE-042');
    expect(canonical.department_id).toBe('COMP_ENGG');

    // Missing field throws
    expect(() => {
      centralEnterpriseIntegrationService.transformPayload({}, mappingRules);
    }).toThrow(/Data Mapping Error: Mandatory source field .* missing/);
  });

  it('TEST 5: Integration Telemetry & Health Monitoring: Validates metrics and posture', () => {
    const metrics = centralEnterpriseIntegrationService.getIntegrationMonitoringMetrics(integrationAdmin);

    expect(metrics.activeIntegrationsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.eventsProcessedCount).toBeGreaterThanOrEqual(1);
    expect(metrics.deadLetterCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageLatencyMs).toBeLessThan(50);
    expect(metrics.integrationPosture).toBe('HEALTHY');
  });
});
