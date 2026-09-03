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
import { centralEnterpriseNotificationService } from './centralEnterpriseNotificationService';
import { centralEnterpriseCalendarService } from './centralEnterpriseCalendarService';
import { centralEnterpriseSearchService } from './centralEnterpriseSearchService';
import { centralEnterpriseReportingBIService } from './centralEnterpriseReportingBIService';
import { centralEnterpriseIntegrationService } from './centralEnterpriseIntegrationService';
import { centralEnterpriseWorkflowBPMService } from './centralEnterpriseWorkflowBPMService';
import { centralMasterDataGovernanceService } from './centralMasterDataGovernanceService';
import { centralEnterpriseZeroTrustSecurityService } from './centralEnterpriseZeroTrustSecurityService';
import { centralEnterpriseObservabilitySREService } from './centralEnterpriseObservabilitySREService';
import { centralEnterpriseDataPlatformService } from './centralEnterpriseDataPlatformService';
import { centralEnterpriseAIPlatformService } from './centralEnterpriseAIPlatformService';
import { centralEnterpriseAPIManagementService } from './centralEnterpriseAPIManagementService';
import { centralEnterpriseEventPlatformService } from './centralEnterpriseEventPlatformService';
import { centralEnterpriseAsyncJobPlatformService } from './centralEnterpriseAsyncJobPlatformService';
import { centralEnterpriseFileStoragePlatformService } from './centralEnterpriseFileStoragePlatformService';
import { centralEnterpriseSearchPlatformService } from './centralEnterpriseSearchPlatformService';
import { centralEnterpriseCachePlatformService } from './centralEnterpriseCachePlatformService';
import { centralEnterpriseConfigurationPlatformService } from './centralEnterpriseConfigurationPlatformService';

export type CommunicationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP' | 'VOICE';
export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'SUPPRESSED' | 'DEFERRED';

export interface NotificationRecord {
  notification_id: string;
  tenant_id: string;
  recipient_id: string;
  recipient_address: string;
  channel: CommunicationChannel;
  priority: NotificationPriority;
  template_id: string;
  language: string;
  status: NotificationStatus;
  subject?: string;
  rendered_content: string;
  is_fallback_delivery: boolean;
  created_at: string;
  delivered_at?: string;
}

export interface NotificationTemplateRecord {
  template_id: string;
  template_key: string;
  channel: CommunicationChannel;
  language: string;
  subject_template?: string;
  body_template: string;
  required_variables: string[];
  version: string;
}

export interface CommunicationDashboardMetrics {
  totalNotificationsDelivered: number;
  deliverySuccessRatePercent: number;
  averageDeliveryLatencyMs: number;
  activeChannelsCount: number;
  suppressedAddressesCount: number;
  communicationPlatformPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseCommunicationPlatformService {
  private static instance: CentralEnterpriseCommunicationPlatformService;

  private notifications: NotificationRecord[] = [];
  private templates: Map<string, NotificationTemplateRecord> = new Map();
  private suppressionList: Set<string> = new Set();
  private userPreferences: Map<string, Record<string, boolean>> = new Map(); // userId -> { 'SMS': false, 'EMAIL': true }

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseCommunicationPlatformService {
    if (!CentralEnterpriseCommunicationPlatformService.instance) {
      CentralEnterpriseCommunicationPlatformService.instance = new CentralEnterpriseCommunicationPlatformService();
    }
    return CentralEnterpriseCommunicationPlatformService.instance;
  }

  private seedDemoData(): void {
    // 1. Templates (English & Gujarati)
    this.templates.set('FEE_RECEIPT_CONFIRMATION:en', {
      template_id: 'tmpl-fee-01-en',
      template_key: 'FEE_RECEIPT_CONFIRMATION',
      channel: 'EMAIL',
      language: 'en',
      subject_template: 'SSIU Fee Receipt Confirmation - {{receipt_no}}',
      body_template: 'Dear {{student_name}}, your payment of INR {{amount}} for semester {{semester}} is confirmed.',
      required_variables: ['receipt_no', 'student_name', 'amount', 'semester'],
      version: 'v1.0'
    });

    this.templates.set('FEE_RECEIPT_CONFIRMATION:gu', {
      template_id: 'tmpl-fee-01-gu',
      template_key: 'FEE_RECEIPT_CONFIRMATION',
      channel: 'EMAIL',
      language: 'gu',
      subject_template: 'સ્વર્ણિમ યુનિવર્સિટી ફી પાવતી - {{receipt_no}}',
      body_template: 'પ્રિય {{student_name}}, તમારા સેમેસ્ટર {{semester}} માટે INR {{amount}} ની ફી સફળતાપૂર્વક જમા થઈ છે.',
      required_variables: ['receipt_no', 'student_name', 'amount', 'semester'],
      version: 'v1.0'
    });

    this.templates.set('SECURITY_LOGIN_ALERT:en', {
      template_id: 'tmpl-sec-01-en',
      template_key: 'SECURITY_LOGIN_ALERT',
      channel: 'SMS',
      language: 'en',
      body_template: 'SSIU Security Alert: New login detected from IP {{ip_address}} on {{timestamp}}. If not you, secure account immediately.',
      required_variables: ['ip_address', 'timestamp'],
      version: 'v1.0'
    });

    // 2. Suppression List
    this.suppressionList.add('bounced.student@swarrnim.edu.in');
    this.suppressionList.add('+919999999999');

    // 3. User Preferences
    this.userPreferences.set('stu-2026-001', {
      'SMS': false, // Opted out of marketing/reminder SMS
      'EMAIL': true,
      'WHATSAPP': true,
      'PUSH': true
    });
  }

  // ─── UNIFIED SEND NOTIFICATION & FALLBACK ROUTING ───────────────────

  public sendNotification(params: {
    tenantId: string;
    recipientId: string;
    recipientAddress: string;
    channel: CommunicationChannel;
    fallbackChannel?: CommunicationChannel;
    priority?: NotificationPriority;
    templateKey: string;
    language?: string;
    variables: Record<string, any>;
    isQuietHoursActive?: boolean;
    context: UserAuthorizationContext;
  }): NotificationRecord {
    const priority = params.priority || 'NORMAL';
    const lang = params.language || 'en';

    // 1. Suppression Check
    if (this.suppressionList.has(params.recipientAddress)) {
      const suppressedRecord: NotificationRecord = {
        notification_id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: params.tenantId,
        recipient_id: params.recipientId,
        recipient_address: params.recipientAddress,
        channel: params.channel,
        priority,
        template_id: params.templateKey,
        language: lang,
        status: 'SUPPRESSED',
        rendered_content: 'Suppressed due to previous bounce or opt-out',
        is_fallback_delivery: false,
        created_at: new Date().toISOString()
      };
      this.notifications.push(suppressedRecord);
      return suppressedRecord;
    }

    // 2. User Preferences (Critical notifications bypass non-critical preferences)
    const userPrefs = this.userPreferences.get(params.recipientId);
    if (userPrefs && userPrefs[params.channel] === false && priority !== 'CRITICAL') {
      if (params.fallbackChannel) {
        // Route to fallback channel
        return this.sendNotification({
          ...params,
          channel: params.fallbackChannel,
          fallbackChannel: undefined
        });
      }

      const optOutRecord: NotificationRecord = {
        notification_id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: params.tenantId,
        recipient_id: params.recipientId,
        recipient_address: params.recipientAddress,
        channel: params.channel,
        priority,
        template_id: params.templateKey,
        language: lang,
        status: 'SUPPRESSED',
        rendered_content: `Suppressed by recipient preference for channel ${params.channel}`,
        is_fallback_delivery: false,
        created_at: new Date().toISOString()
      };
      this.notifications.push(optOutRecord);
      return optOutRecord;
    }

    // 3. Quiet Hours Check (Critical bypasses quiet hours)
    if (params.isQuietHoursActive && priority !== 'CRITICAL') {
      const deferredRecord: NotificationRecord = {
        notification_id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tenant_id: params.tenantId,
        recipient_id: params.recipientId,
        recipient_address: params.recipientAddress,
        channel: params.channel,
        priority,
        template_id: params.templateKey,
        language: lang,
        status: 'DEFERRED',
        rendered_content: 'Deferred during recipient quiet hours window',
        is_fallback_delivery: false,
        created_at: new Date().toISOString()
      };
      this.notifications.push(deferredRecord);
      return deferredRecord;
    }

    // 4. Template Lookup & Variable Interpolation
    const tmplKey = `${params.templateKey}:${lang}`;
    const template = this.templates.get(tmplKey) || this.templates.get(`${params.templateKey}:en`);
    if (!template) {
      throw new Error(`Notification Template ${params.templateKey} not found for language ${lang}`);
    }

    // Variable validation
    for (const reqVar of template.required_variables) {
      if (params.variables[reqVar] === undefined || params.variables[reqVar] === null) {
        throw new Error(`Validation Error: Missing required template variable {{${reqVar}}}`);
      }
    }

    let renderedBody = template.body_template;
    let renderedSubject = template.subject_template;

    for (const [key, val] of Object.entries(params.variables)) {
      const escapedVal = String(val).replace(/</g, '&lt;').replace(/>/g, '&gt;');
      renderedBody = renderedBody.replace(new RegExp(`{{${key}}}`, 'g'), escapedVal);
      if (renderedSubject) {
        renderedSubject = renderedSubject.replace(new RegExp(`{{${key}}}`, 'g'), escapedVal);
      }
    }

    // 5. Successful Delivery
    const record: NotificationRecord = {
      notification_id: `ntf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenant_id: params.tenantId,
      recipient_id: params.recipientId,
      recipient_address: params.recipientAddress,
      channel: params.channel,
      priority,
      template_id: template.template_id,
      language: lang,
      status: 'DELIVERED',
      subject: renderedSubject,
      rendered_content: renderedBody,
      is_fallback_delivery: params.fallbackChannel === undefined && params.channel !== 'EMAIL', // flag if secondary
      created_at: new Date().toISOString(),
      delivered_at: new Date().toISOString()
    };

    this.notifications.push(record);
    return record;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getCommunicationDashboardMetrics(context?: UserAuthorizationContext): CommunicationDashboardMetrics {
    return {
      totalNotificationsDelivered: this.notifications.length + 984000,
      deliverySuccessRatePercent: 99.2,
      averageDeliveryLatencyMs: 420,
      activeChannelsCount: 6,
      suppressedAddressesCount: this.suppressionList.size + 140,
      communicationPlatformPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseCommunicationPlatformService = CentralEnterpriseCommunicationPlatformService.getInstance();
