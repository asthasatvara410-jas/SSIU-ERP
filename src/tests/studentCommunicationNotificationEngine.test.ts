import { describe, it, expect } from 'vitest';
import { studentCommunicationNotificationService } from '../services/studentCommunicationNotificationService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 12.5: Student Communication, Notification & Action Items Engine', () => {

  it('TEST 1: Template Rendering & Variable Interpolation: Safely interpolates template parameters', () => {
    const rendered = studentCommunicationNotificationService.renderTemplate('tmpl-exam-001', {
      student_name: 'Aarav Patel',
      exam_name: 'Summer 2026 End-Sem Examination',
      semester: '1'
    });

    expect(rendered.subject).toBe('Hall Ticket Published: Summer 2026 End-Sem Examination');
    expect(rendered.body).toContain('Dear Aarav Patel');
    expect(rendered.body).toContain('Semester 1');
  });

  it('TEST 2: Notification Sending, Read Tracking & Duplicate Idempotency: Sends message and suppresses duplicates', () => {
    const key = 'IDEM-EXAM-STU001-2026';

    // 1. Initial Send
    const msg1 = studentCommunicationNotificationService.sendNotification({
      studentId: 'STU-2026-000001',
      templateId: 'tmpl-exam-001',
      type: 'ACADEMIC_NOTIFICATION',
      channel: 'IN_APP',
      subject: 'Hall Ticket Published: Summer 2026 End-Sem Examination',
      content: 'Dear Aarav Patel, your hall ticket is ready.',
      idempotencyKey: key
    });

    expect(msg1.id).toBeDefined();
    expect(msg1.read_status).toBe('UNREAD');

    // 2. Duplicate Send with same key -> Returns existing message without duplication
    const msg2 = studentCommunicationNotificationService.sendNotification({
      studentId: 'STU-2026-000001',
      templateId: 'tmpl-exam-001',
      type: 'ACADEMIC_NOTIFICATION',
      channel: 'IN_APP',
      subject: 'Hall Ticket Published: Summer 2026 End-Sem Examination',
      content: 'Dear Aarav Patel, your hall ticket is ready.',
      idempotencyKey: key
    });

    expect(msg2.id).toBe(msg1.id);

    // 3. Mark as Read
    const readMsg = studentCommunicationNotificationService.markAsRead(msg1.id);
    expect(readMsg.read_status).toBe('READ');
    expect(readMsg.read_at).toBeDefined();
  });

  it('TEST 3: Student Action Items Lifecycle: Creates action item, tracks due date and marks completed', () => {
    // 1. Create Action Item
    const action = studentCommunicationNotificationService.createActionItem({
      studentId: 'STU-2026-000002',
      sourceModule: 'DOCUMENT',
      sourceEntity: 'DOC_12TH_MARKSHEET',
      action_type: 'UPLOAD_DOCUMENT',
      title: 'Re-upload 12th Grade Marksheet',
      description: 'Previous scan was rejected due to missing principal stamp',
      dueDate: '2026-09-30',
      priority: 'HIGH'
    });

    expect(action.id).toBeDefined();
    expect(action.status).toBe('OPEN');
    expect(action.priority).toBe('HIGH');

    // 2. Mark Completed
    const completed = studentCommunicationNotificationService.completeActionItem(action.id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.completed_at).toBeDefined();
  });

  it('TEST 4: Targeted Announcements: Publishes departmental announcement and checks active state', () => {
    const ann = studentCommunicationNotificationService.publishAnnouncement({
      title: 'Workshop on Generative AI & Autonomous Agents',
      content: 'Hands-on session conducted by Google Developer Experts for CSE/IT students',
      targetDepartment: 'dept-cse',
      targetProgram: 'prog-bca',
      priority: 'HIGH',
      startDate: '2026-08-15',
      endDate: '2026-09-15',
      createdBy: 'emp-reg-001'
    });

    expect(ann.id).toBeDefined();
    expect(ann.status).toBe('ACTIVE');
    expect(ann.target_department).toBe('dept-cse');
  });

  it('TEST 5: Communication Dashboard Metrics: Computes authoritative message, action item, and announcement counters', () => {
    const registrarContext: UserAuthorizationContext = {
      userId: 'emp-reg-001',
      userName: 'Dr. Registrar',
      email: 'registrar@swarrnim.edu.in',
      activeRole: 'REGISTRAR',
      assignedRoles: ['REGISTRAR'],
      permissions: ['COMMUNICATION_VIEW', 'NOTIFICATION_VIEW', 'ACTION_ITEM_VIEW']
    };

    const metrics = studentCommunicationNotificationService.getCommunicationDashboardMetrics(registrarContext);
    expect(metrics.totalSentMessages).toBeGreaterThanOrEqual(2);
    expect(metrics.deliveredMessages).toBeGreaterThanOrEqual(2);
    expect(metrics.openActionItems).toBeGreaterThanOrEqual(1);
    expect(metrics.activeAnnouncements).toBeGreaterThanOrEqual(2);
  });
});
