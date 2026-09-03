import { describe, it, expect } from 'vitest';
import { centralEnterpriseCommunicationPlatformService } from '../services/centralEnterpriseCommunicationPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.60: Enterprise Notification & Communication Platform Engine', () => {

  const commAdmin: UserAuthorizationContext = {
    userId: 'emp-comm-admin-001',
    userName: 'Enterprise Notification Platform Administrator',
    email: 'comm.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['COMMUNICATION_PLATFORM_ADMIN', 'SYSTEM_ADMIN']
  };

  it('TEST 1: Multilingual Template Rendering & Variable Escaping: Renders Gujarati templates and rejects missing variables', () => {
    // 1. Gujarati template rendering
    const ntf = centralEnterpriseCommunicationPlatformService.sendNotification({
      tenantId: 'ssiu-main-campus',
      recipientId: 'stu-2026-001',
      recipientAddress: 'student@swarrnim.edu.in',
      channel: 'EMAIL',
      templateKey: 'FEE_RECEIPT_CONFIRMATION',
      language: 'gu',
      variables: {
        receipt_no: 'REC-2026-9081',
        student_name: 'જિગર પરમાર',
        amount: '65,000',
        semester: '4'
      },
      context: commAdmin
    });

    expect(ntf.status).toBe('DELIVERED');
    expect(ntf.subject).toContain('સ્વર્ણિમ યુનિવર્સિટી ફી પાવતી - REC-2026-9081');
    expect(ntf.rendered_content).toContain('પ્રિય જિગર પરમાર, તમારા સેમેસ્ટર 4 માટે INR 65,000');

    // 2. Missing variable validation failure
    expect(() => {
      centralEnterpriseCommunicationPlatformService.sendNotification({
        tenantId: 'ssiu-main-campus',
        recipientId: 'stu-2026-001',
        recipientAddress: 'student@swarrnim.edu.in',
        channel: 'EMAIL',
        templateKey: 'FEE_RECEIPT_CONFIRMATION',
        language: 'en',
        variables: {
          student_name: 'Jigar Parmar' // missing receipt_no, amount, semester
        },
        context: commAdmin
      });
    }).toThrow(/Validation Error: Missing required template variable {{receipt_no}}/);
  });

  it('TEST 2: Channel Preference Routing & Fallback: Auto-routes to fallback channel when recipient opted out of primary channel', () => {
    // Student stu-2026-001 has opted out of SMS, but has EMAIL enabled
    const ntf = centralEnterpriseCommunicationPlatformService.sendNotification({
      tenantId: 'ssiu-main-campus',
      recipientId: 'stu-2026-001',
      recipientAddress: 'student@swarrnim.edu.in',
      channel: 'SMS',
      fallbackChannel: 'EMAIL',
      templateKey: 'FEE_RECEIPT_CONFIRMATION',
      language: 'en',
      variables: {
        receipt_no: 'REC-2026-9082',
        student_name: 'Jigar Parmar',
        amount: '65,000',
        semester: '4'
      },
      context: commAdmin
    });

    expect(ntf.channel).toBe('EMAIL');
    expect(ntf.status).toBe('DELIVERED');
  });

  it('TEST 3: Suppression List Enforcement: Immediately suppresses messages to bounced or unsubscribed contacts', () => {
    const ntf = centralEnterpriseCommunicationPlatformService.sendNotification({
      tenantId: 'ssiu-main-campus',
      recipientId: 'stu-bounced-001',
      recipientAddress: 'bounced.student@swarrnim.edu.in',
      channel: 'EMAIL',
      templateKey: 'FEE_RECEIPT_CONFIRMATION',
      language: 'en',
      variables: {
        receipt_no: 'REC-2026-9083',
        student_name: 'Test Student',
        amount: '10,000',
        semester: '1'
      },
      context: commAdmin
    });

    expect(ntf.status).toBe('SUPPRESSED');
    expect(ntf.rendered_content).toContain('Suppressed due to previous bounce or opt-out');
  });

  it('TEST 4: Quiet Hours & Critical Alert Bypass: Defers routine reminders while delivering CRITICAL security alerts', () => {
    // 1. Routine notification during quiet hours is deferred
    const deferredNtf = centralEnterpriseCommunicationPlatformService.sendNotification({
      tenantId: 'ssiu-main-campus',
      recipientId: 'stu-2026-001',
      recipientAddress: 'student@swarrnim.edu.in',
      channel: 'EMAIL',
      priority: 'NORMAL',
      templateKey: 'FEE_RECEIPT_CONFIRMATION',
      language: 'en',
      variables: {
        receipt_no: 'REC-2026-9084',
        student_name: 'Jigar Parmar',
        amount: '65,000',
        semester: '4'
      },
      isQuietHoursActive: true,
      context: commAdmin
    });
    expect(deferredNtf.status).toBe('DEFERRED');

    // 2. CRITICAL security alert bypasses quiet hours and delivers immediately
    const criticalNtf = centralEnterpriseCommunicationPlatformService.sendNotification({
      tenantId: 'ssiu-main-campus',
      recipientId: 'stu-2026-001',
      recipientAddress: '+919876543210',
      channel: 'SMS',
      priority: 'CRITICAL',
      templateKey: 'SECURITY_LOGIN_ALERT',
      language: 'en',
      variables: {
        ip_address: '103.21.14.92',
        timestamp: '2026-08-29 21:20:00 UTC'
      },
      isQuietHoursActive: true, // Bypass active
      context: commAdmin
    });
    expect(criticalNtf.status).toBe('DELIVERED');
    expect(criticalNtf.rendered_content).toContain('SSIU Security Alert');
  });

  it('TEST 5: Communication Dashboard Telemetry: Validates total messages (984k+), success rate (99.2%), and platform posture', () => {
    const metrics = centralEnterpriseCommunicationPlatformService.getCommunicationDashboardMetrics(commAdmin);

    expect(metrics.totalNotificationsDelivered).toBeGreaterThan(900000);
    expect(metrics.deliverySuccessRatePercent).toBeGreaterThan(98);
    expect(metrics.averageDeliveryLatencyMs).toBeLessThan(1000);
    expect(metrics.communicationPlatformPosture).toBe('HEALTHY');
  });
});
