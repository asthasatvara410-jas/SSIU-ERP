import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';
import { centralEnterpriseContentManagementService } from './centralEnterpriseContentManagementService';
import { centralPortalPlatformService } from './centralPortalPlatformService';
import { centralServiceOperationsService } from './centralServiceOperationsService';
import { centralAdvancedCaseIncidentManagementService } from './centralAdvancedCaseIncidentManagementService';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';
export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type NotificationStatus = 'CREATED' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'DEAD_LETTER';

export interface NotificationRecord {
  id: string;
  notification_code: string;
  event_type: string;
  recipient_id: string;
  organization_id: string;
  channel: NotificationChannel;
  template_id: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  is_mandatory: boolean;
  subject: string;
  content: string;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  created_at: string;
}

export interface CommunicationTemplateRecord {
  id: string;
  template_code: string;
  channel: NotificationChannel;
  language: 'en' | 'gu' | 'hi';
  subject_template: string;
  body_template: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'RETIRED';
}

export interface UserNotificationPreferenceRecord {
  user_id: string;
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // e.g. "22:00"
  quiet_hours_end: string;   // e.g. "07:00"
}

export interface CommunicationDashboardMetrics {
  totalNotificationsCount: number;
  deliveredCount: number;
  deliverySuccessRatePercent: number;
  inAppUnreadCount: number;
  deadLetterCount: number;
  emailCount: number;
  smsCount: number;
  pushCount: number;
  communicationPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseNotificationService {
  private static instance: CentralEnterpriseNotificationService;

  private notifications: NotificationRecord[] = [];
  private templates: CommunicationTemplateRecord[] = [];
  private preferences: Map<string, UserNotificationPreferenceRecord> = new Map();

  private notifCounter = 100;
  private tmplCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseNotificationService {
    if (!CentralEnterpriseNotificationService.instance) {
      CentralEnterpriseNotificationService.instance = new CentralEnterpriseNotificationService();
    }
    return CentralEnterpriseNotificationService.instance;
  }

  private seedDemoData(): void {
    // Seed Service Approval Template (English)
    this.templates.push({
      id: 'tmpl-seed-001',
      template_code: 'NOTIF-TMPL-SERVICE-APPROVED',
      channel: 'IN_APP',
      language: 'en',
      subject_template: 'Service Request {{request_number}} Approved',
      body_template: 'Dear {{student_name}}, your request for {{service_name}} has been approved by the Registrar office.',
      version: '1.0',
      status: 'ACTIVE'
    });

    // Seed Service Approval Template (Gujarati)
    this.templates.push({
      id: 'tmpl-seed-002',
      template_code: 'NOTIF-TMPL-SERVICE-APPROVED',
      channel: 'IN_APP',
      language: 'gu',
      subject_template: 'સેવા વિનંતી {{request_number}} મંજૂર કરવામાં આવી',
      body_template: 'પ્રિય {{student_name}}, {{service_name}} માટેની તમારી વિનંતી રજિસ્ટ્રાર કાર્યાલય દ્વારા મંજૂર કરવામાં આવી છે.',
      version: '1.0',
      status: 'ACTIVE'
    });

    // Seed Incident Alert Template
    this.templates.push({
      id: 'tmpl-seed-003',
      template_code: 'NOTIF-TMPL-SEV1-ALERT',
      channel: 'EMAIL',
      language: 'en',
      subject_template: 'CRITICAL ALERT: Major Incident {{incident_number}} Declared',
      body_template: 'SEV1 Critical outage on {{affected_service}}. Incident Commander: {{commander_name}}.',
      version: '1.0',
      status: 'ACTIVE'
    });
  }

  // ─── TEMPLATE RENDERING ──────────────────────────────────────────────

  public renderTemplate(params: {
    templateCode: string;
    language?: 'en' | 'gu' | 'hi';
    variables: Record<string, string>;
  }): { subject: string; content: string } {
    const lang = params.language || 'en';
    const tmpl = this.templates.find(t => t.template_code === params.templateCode && t.language === lang)
      || this.templates.find(t => t.template_code === params.templateCode && t.language === 'en');

    if (!tmpl) {
      throw new Error(`Communication Template ${params.templateCode} not found for language ${lang}`);
    }

    let subject = tmpl.subject_template;
    let content = tmpl.body_template;

    for (const [key, value] of Object.entries(params.variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replaceAll(placeholder, value);
      content = content.replaceAll(placeholder, value);
    }

    return { subject, content };
  }

  // ─── NOTIFICATION CREATION & PREFERENCE EVALUATION ────────────────────

  public sendNotification(params: {
    eventType: string;
    recipientId: string;
    organizationId: string;
    channel: NotificationChannel;
    templateCode: string;
    language?: 'en' | 'gu' | 'hi';
    variables: Record<string, string>;
    priority?: NotificationPriority;
    isMandatory?: boolean;
    simulateTransientFailure?: boolean;
  }): NotificationRecord {
    this.notifCounter += 1;
    const notifCode = `NOTIF-2026-${String(this.notifCounter).padStart(6, '0')}`;
    const priority = params.priority || 'NORMAL';
    const isMandatory = params.isMandatory || false;

    // Check User Channel Preference
    const userPref = this.preferences.get(params.recipientId);
    if (userPref && !isMandatory && priority !== 'CRITICAL') {
      if (params.channel === 'EMAIL' && !userPref.email_enabled) {
        throw new Error(`Communication Channel Suppressed: Recipient has disabled optional EMAIL notifications`);
      }
      if (params.channel === 'SMS' && !userPref.sms_enabled) {
        throw new Error(`Communication Channel Suppressed: Recipient has disabled optional SMS notifications`);
      }
    }

    const rendered = this.renderTemplate({
      templateCode: params.templateCode,
      language: params.language,
      variables: params.variables
    });

    const notif: NotificationRecord = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      notification_code: notifCode,
      event_type: params.eventType,
      recipient_id: params.recipientId,
      organization_id: params.organizationId,
      channel: params.channel,
      template_id: params.templateCode,
      priority,
      status: 'QUEUED',
      is_mandatory: isMandatory,
      subject: rendered.subject,
      content: rendered.content,
      retry_count: 0,
      max_retries: 3,
      created_at: new Date().toISOString()
    };

    this.notifications.push(notif);

    // Simulate Delivery Dispatch
    if (params.simulateTransientFailure) {
      notif.retry_count = 3;
      notif.status = 'DEAD_LETTER';
      notif.error_message = 'Provider Gateway Timeout: Max retries exceeded';
    } else {
      notif.status = 'DELIVERED';
      notif.sent_at = new Date().toISOString();
      notif.delivered_at = new Date().toISOString();
    }

    return notif;
  }

  // ─── USER PREFERENCES ────────────────────────────────────────────────

  public setUserPreferences(params: UserNotificationPreferenceRecord): UserNotificationPreferenceRecord {
    this.preferences.set(params.user_id, params);
    return params;
  }

  // ─── IN-APP NOTIFICATION CENTER ──────────────────────────────────────

  public getInAppNotifications(userId: string): NotificationRecord[] {
    return this.notifications.filter(n => n.recipient_id === userId && n.channel === 'IN_APP');
  }

  public markAsRead(notificationId: string, userId: string): NotificationRecord {
    const notif = this.notifications.find(n => n.id === notificationId || n.notification_code === notificationId);
    if (!notif) throw new Error(`Notification ${notificationId} not found`);

    if (notif.recipient_id !== userId) {
      throw new Error(`Unauthorized: Cannot read notification belonging to another user`);
    }

    notif.status = 'READ';
    notif.read_at = new Date().toISOString();
    return notif;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getCommunicationDashboardMetrics(context?: UserAuthorizationContext): CommunicationDashboardMetrics {
    const totalNotificationsCount = this.notifications.length;
    const deliveredCount = this.notifications.filter(n => n.status === 'DELIVERED' || n.status === 'READ').length;
    const inAppUnreadCount = this.notifications.filter(n => n.channel === 'IN_APP' && n.status === 'DELIVERED').length;
    const deadLetterCount = this.notifications.filter(n => n.status === 'DEAD_LETTER').length;
    const emailCount = this.notifications.filter(n => n.channel === 'EMAIL').length;
    const smsCount = this.notifications.filter(n => n.channel === 'SMS').length;
    const pushCount = this.notifications.filter(n => n.channel === 'PUSH').length;

    return {
      totalNotificationsCount,
      deliveredCount,
      deliverySuccessRatePercent: 99.2,
      inAppUnreadCount,
      deadLetterCount,
      emailCount,
      smsCount,
      pushCount,
      communicationPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseNotificationService = CentralEnterpriseNotificationService.getInstance();
