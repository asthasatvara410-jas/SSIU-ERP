import { describe, it, expect } from 'vitest';
import { centralEnterpriseConfigurationPlatformService } from '../services/centralEnterpriseConfigurationPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.59: Enterprise Configuration & Feature Flag Platform Engine', () => {

  const configAdmin: UserAuthorizationContext = {
    userId: 'emp-config-admin-001',
    userName: 'Enterprise Configuration Platform Administrator',
    email: 'config.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['CONFIG_PLATFORM_ADMIN', 'SYSTEM_ADMIN']
  };

  it('TEST 1: Typed Configuration, Versioning & Rollback: Restores previous approved configuration versions safely', () => {
    // 1. Current active version is v2.0 (value = 3)
    const current = centralEnterpriseConfigurationPlatformService.getConfig(
      'security.max_login_attempts',
      'PROD'
    );
    expect(current).toBe(3);

    // 2. Rollback to v1.0 (value = 5)
    const rolledBack = centralEnterpriseConfigurationPlatformService.rollbackConfig(
      'security.max_login_attempts',
      'v1.0',
      'PROD'
    );
    expect(rolledBack.value).toBe(5);
    expect(rolledBack.version).toBe('v3.0');

    // 3. Type validation
    expect(() => {
      centralEnterpriseConfigurationPlatformService.setConfig({
        key: 'security.max_login_attempts',
        value: 'NOT_AN_INTEGER' as any,
        type: 'INTEGER',
        environment: 'PROD',
        context: configAdmin
      });
    }).toThrow(/Validation Error: Config key security.max_login_attempts requires integer value/);
  });

  it('TEST 2: Feature Flag Targeting: Evaluates tenant and role targeting with deterministic criteria', () => {
    // 1. Permitted Student in Main Campus
    const studentMain = centralEnterpriseConfigurationPlatformService.evaluateFeatureFlag(
      'ff_ai_student_advisor_v2',
      { tenantId: 'ssiu-main-campus', role: 'STUDENT', userId: 'stu-2026-001' }
    );
    expect(studentMain).toBe(true);

    // 2. Student in Satellite Campus (Tenant filtering)
    const studentSatellite = centralEnterpriseConfigurationPlatformService.evaluateFeatureFlag(
      'ff_ai_student_advisor_v2',
      { tenantId: 'ssiu-satellite-campus', role: 'STUDENT', userId: 'stu-sat-001' }
    );
    expect(studentSatellite).toBe(false);

    // 3. Guest Role (Role filtering)
    const guestUser = centralEnterpriseConfigurationPlatformService.evaluateFeatureFlag(
      'ff_ai_student_advisor_v2',
      { tenantId: 'ssiu-main-campus', role: 'GUEST', userId: 'guest-001' }
    );
    expect(guestUser).toBe(false);
  });

  it('TEST 3: Emergency Kill Switch: Instantly disables critical features across all targeting criteria', () => {
    // 1. Feature initially active
    const active = centralEnterpriseConfigurationPlatformService.evaluateFeatureFlag(
      'ff_instant_fee_settlement',
      { tenantId: 'ssiu-main-campus', role: 'FINANCE_ADMIN', userId: 'emp-fin-001' }
    );
    expect(active).toBe(true);

    // 2. Activate Kill Switch
    centralEnterpriseConfigurationPlatformService.activateKillSwitch('ff_instant_fee_settlement', configAdmin);

    // 3. Feature immediately disabled
    const killed = centralEnterpriseConfigurationPlatformService.evaluateFeatureFlag(
      'ff_instant_fee_settlement',
      { tenantId: 'ssiu-main-campus', role: 'FINANCE_ADMIN', userId: 'emp-fin-001' }
    );
    expect(killed).toBe(false);
  });

  it('TEST 4: Secret References & Drift Detection: Obscures raw credentials and monitors production drift', () => {
    // 1. Secret reference retrieval
    const secretRef = centralEnterpriseConfigurationPlatformService.getConfig(
      'integration.icici.api_secret',
      'PROD'
    );
    expect(secretRef).toBe('secret://vault/ssiu/payment/icici_gateway_key_v2');

    // 2. Production drift inspection
    const drift = centralEnterpriseConfigurationPlatformService.detectConfigurationDrift('PROD');
    expect(drift.driftDetected).toBe(false);
    expect(drift.discrepancies.length).toBe(0);
  });

  it('TEST 5: Configuration Dashboard Telemetry: Validates configuration keys (1420+), feature flags (86), and posture', () => {
    const metrics = centralEnterpriseConfigurationPlatformService.getConfigurationDashboardMetrics(configAdmin);

    expect(metrics.totalConfigKeysCount).toBeGreaterThan(1000);
    expect(metrics.activeFeatureFlagsCount).toBeGreaterThan(80);
    expect(metrics.configurationPropagationLatencyMs).toBeLessThan(200);
    expect(metrics.configurationPlatformPosture).toBe('HEALTHY');
  });
});
