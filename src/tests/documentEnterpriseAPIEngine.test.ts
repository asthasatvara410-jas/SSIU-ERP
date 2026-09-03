import { describe, it, expect } from 'vitest';
import { centralEnterpriseAPIManagementService } from '../services/centralEnterpriseAPIManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.53: Enterprise API Management & Developer Platform Engine', () => {

  const developerAdmin: UserAuthorizationContext = {
    userId: 'emp-devops-001',
    userName: 'API Gateway Administrator',
    email: 'api.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['API_GATEWAY_MANAGE', 'DEVELOPER_PORTAL_ADMIN']
  };

  it('TEST 1: API Gateway Access & Scope Minimization: Authorizes compliant clients and denies insufficient scopes', () => {
    // 1. Authorized Mobile App client
    const validAccess = centralEnterpriseAPIManagementService.validateAPIAccess({
      clientId: 'client-ssiu-mobile-app-prod',
      apiId: 'api-student-dossier-v2',
      requestedPath: '/api/v2/students',
      isProductionEndpoint: true
    });
    expect(validAccess.authorized).toBe(true);
    expect(validAccess.domain).toBe('STUDENT');

    // 2. Unregistered client credentials
    expect(() => {
      centralEnterpriseAPIManagementService.validateAPIAccess({
        clientId: 'client-unknown-rogue-app',
        apiId: 'api-student-dossier-v2',
        requestedPath: '/api/v2/students',
        isProductionEndpoint: true
      });
    }).toThrow(/401 Unauthorized: Invalid API Client Credentials/);
  });

  it('TEST 2: Sandbox Isolation: Sandbox credentials are strictly blocked from production API gateway endpoints', () => {
    // Register temporary sandbox client
    (centralEnterpriseAPIManagementService as any).consumers.push({
      app_id: 'app-sandbox-test-01',
      name: 'Third-Party Developer Sandbox App',
      client_id: 'client-developer-sandbox-01',
      status: 'ACTIVE',
      allowed_scopes: ['student:read', 'student:dossier'],
      is_sandbox: true,
      rate_limit_per_min: 100
    });

    expect(() => {
      centralEnterpriseAPIManagementService.validateAPIAccess({
        clientId: 'client-developer-sandbox-01',
        apiId: 'api-student-dossier-v2',
        requestedPath: '/api/v2/students',
        isProductionEndpoint: true // Production endpoint
      });
    }).toThrow(/403 Forbidden: Sandbox credentials cannot access production API gateway endpoints/);
  });

  it('TEST 3: Rate Limiting & Throttling: Enforces client requests per minute quota', () => {
    // Register client with 2 req/min quota
    (centralEnterpriseAPIManagementService as any).consumers.push({
      app_id: 'app-rate-limit-test',
      name: 'Rate Limited Consumer App',
      client_id: 'client-rate-limit-tester',
      status: 'ACTIVE',
      allowed_scopes: ['student:read', 'student:dossier'],
      is_sandbox: false,
      rate_limit_per_min: 2
    });

    // Request 1 -> OK
    centralEnterpriseAPIManagementService.validateAPIAccess({
      clientId: 'client-rate-limit-tester',
      apiId: 'api-student-dossier-v2',
      requestedPath: '/api/v2/students',
      isProductionEndpoint: false
    });

    // Request 2 -> OK
    centralEnterpriseAPIManagementService.validateAPIAccess({
      clientId: 'client-rate-limit-tester',
      apiId: 'api-student-dossier-v2',
      requestedPath: '/api/v2/students',
      isProductionEndpoint: false
    });

    // Request 3 -> Exceeds rate limit
    expect(() => {
      centralEnterpriseAPIManagementService.validateAPIAccess({
        clientId: 'client-rate-limit-tester',
        apiId: 'api-student-dossier-v2',
        requestedPath: '/api/v2/students',
        isProductionEndpoint: false
      });
    }).toThrow(/429 Too Many Requests: Rate limit of 2 req\/min exceeded/);
  });

  it('TEST 4: Governed Webhooks & HMAC Signatures: Dispatches signed event payloads with SHA256 header', () => {
    const webhookResult = centralEnterpriseAPIManagementService.dispatchWebhook({
      eventType: 'payment.received',
      payload: { transaction_id: 'TXN-998822', amount: 45000, student_id: 'stu-2026-001' }
    });

    expect(webhookResult.dispatched).toBe(true);
    expect(webhookResult.delivery_id).toContain('DLV-');
    expect(webhookResult.signature_header).toContain('sha256=');
  });

  it('TEST 5: Partner Offboarding & Dashboard Telemetry: Revokes partner applications, subscriptions, and monitors gateway telemetry', () => {
    // 1. Offboard partner
    const offboardResult = centralEnterpriseAPIManagementService.offboardPartner('ICICI Bank Ltd');
    expect(offboardResult.partner).toBe('ICICI Bank Ltd');
    expect(offboardResult.revoked_apps).toBeGreaterThanOrEqual(1);
    expect(offboardResult.revoked_webhooks).toBeGreaterThanOrEqual(1);

    // 2. Telemetry validation
    const metrics = centralEnterpriseAPIManagementService.getAPIDashboardMetrics(developerAdmin);
    expect(metrics.registeredAPIsCount).toBeGreaterThanOrEqual(40);
    expect(metrics.totalDailyRequestsCount).toBeGreaterThan(200000);
    expect(metrics.averageLatencyMs).toBeLessThan(30);
    expect(metrics.webhookDeliverySuccessRate).toBeGreaterThanOrEqual(99.0);
    expect(metrics.apiPlatformPosture).toBe('HEALTHY');
  });
});
