import { describe, it, expect } from 'vitest';
import { centralEnterpriseNotificationService } from '../services/centralEnterpriseNotificationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.42: Enterprise Notification Center & Communication Engine', () => {

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Aarav Patel',
    email: 'aarav@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['NOTIFICATION_VIEW']
  };

  it('TEST 1: Communication Templates: Renders multi-language templates with secure variable interpolation', () => {
    // 1. English Render
    const enRender = centralEnterpriseNotificationService.renderTemplate({
      templateCode: 'NOTIF-TMPL-SERVICE-APPROVED',
      language: 'en',
      variables: {
        request_number: 'SR-2026-000101',
        student_name: 'Aarav Patel',
        service_name: 'Bonafide Certificate'
      }
    });

    expect(enRender.subject).toBe('Service Request SR-2026-000101 Approved');
    expect(enRender.content).toContain('Dear Aarav Patel');

    // 2. Gujarati Render
    const guRender = centralEnterpriseNotificationService.renderTemplate({
      templateCode: 'NOTIF-TMPL-SERVICE-APPROVED',
      language: 'gu',
      variables: {
        request_number: 'SR-2026-000101',
        student_name: 'આરવ પટેલ',
        service_name: 'બોનાફાઇડ પ્રમાણપત્ર'
      }
    });

    expect(guRender.subject).toContain('મંજૂર કરવામાં આવી');
    expect(guRender.content).toContain('પ્રિય આરવ પટેલ');
  });

  it('TEST 2: Notification Preferences & Mandatory Policy Gate: Enforces opt-out while preserving mandatory alerts', () => {
    // 1. Configure user preference: Disable Email
    centralEnterpriseNotificationService.setUserPreferences({
      user_id: 'stu-2026-001',
      email_enabled: false,
      sms_enabled: true,
      push_enabled: true,
      in_app_enabled: true,
      quiet_hours_enabled: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00'
    });

    // Optional Email must be suppressed
    expect(() => {
      centralEnterpriseNotificationService.sendNotification({
        eventType: 'CAMPUS_EVENT',
        recipientId: 'stu-2026-001',
        organizationId: 'inst-sit',
        channel: 'EMAIL',
        templateCode: 'NOTIF-TMPL-SERVICE-APPROVED',
        variables: { request_number: 'SR-001', student_name: 'Aarav', service_name: 'Event' },
        isMandatory: false
      });
    }).toThrow(/Communication Channel Suppressed: Recipient has disabled optional EMAIL/);

    // Mandatory Alert (e.g. SEV1 Critical) MUST bypass preference and deliver
    const mandatoryNotif = centralEnterpriseNotificationService.sendNotification({
      eventType: 'SECURITY_ALERT',
      recipientId: 'stu-2026-001',
      organizationId: 'inst-sit',
      channel: 'EMAIL',
      templateCode: 'NOTIF-TMPL-SEV1-ALERT',
      variables: { incident_number: 'INC-2026-000001', affected_service: 'Portal', commander_name: 'IT Head' },
      isMandatory: true,
      priority: 'CRITICAL'
    });

    expect(mandatoryNotif.id).toBeDefined();
    expect(mandatoryNotif.status).toBe('DELIVERED');
  });

  it('TEST 3: Retry Engine & Dead Letter Queue: Routes persistent delivery failures to dead letter queue', () => {
    const failedNotif = centralEnterpriseNotificationService.sendNotification({
      eventType: 'SERVICE_UPDATE',
      recipientId: 'stu-2026-001',
      organizationId: 'inst-sit',
      channel: 'IN_APP',
      templateCode: 'NOTIF-TMPL-SERVICE-APPROVED',
      variables: { request_number: 'SR-002', student_name: 'Aarav', service_name: 'Transcript' },
      simulateTransientFailure: true
    });

    expect(failedNotif.status).toBe('DEAD_LETTER');
    expect(failedNotif.retry_count).toBe(3);
    expect(failedNotif.error_message).toContain('Max retries exceeded');
  });

  it('TEST 4: In-App Notification Center: Recipient reads alert and marks as read with access protection', () => {
    const notif = centralEnterpriseNotificationService.sendNotification({
      eventType: 'SERVICE_APPROVED',
      recipientId: 'stu-2026-001',
      organizationId: 'inst-sit',
      channel: 'IN_APP',
      templateCode: 'NOTIF-TMPL-SERVICE-APPROVED',
      variables: { request_number: 'SR-2026-000101', student_name: 'Aarav Patel', service_name: 'Bonafide Certificate' }
    });

    // 1. Query in-app notifications
    const inAppList = centralEnterpriseNotificationService.getInAppNotifications('stu-2026-001');
    expect(inAppList.length).toBeGreaterThanOrEqual(1);

    // 2. Mark as read
    const readItem = centralEnterpriseNotificationService.markAsRead(notif.id, 'stu-2026-001');
    expect(readItem.status).toBe('READ');
    expect(readItem.read_at).toBeDefined();

    // 3. Unauthorized user cannot mark another user's alert
    expect(() => {
      centralEnterpriseNotificationService.markAsRead(notif.id, 'stu-other-999');
    }).toThrow(/Unauthorized: Cannot read notification belonging to another user/);
  });

  it('TEST 5: Communication Dashboard Telemetry: Validates delivery metrics and posture', () => {
    const metrics = centralEnterpriseNotificationService.getCommunicationDashboardMetrics(studentUser);

    expect(metrics.totalNotificationsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.deliverySuccessRatePercent).toBeGreaterThanOrEqual(95);
    expect(metrics.communicationPosture).toBe('HEALTHY');
  });
});
