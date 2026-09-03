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
import { centralEnterpriseCommunicationPlatformService } from './centralEnterpriseCommunicationPlatformService';
import { centralEnterpriseDMSPlatformService } from './centralEnterpriseDMSPlatformService';
import { centralEnterpriseKnowledgeManagementService } from './centralEnterpriseKnowledgeManagementService';

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS' | 'ORGANIZATION' | 'INSTITUTION' | 'PARTNER';
export type CustomerStatus = 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'CHURNED' | 'ARCHIVED';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'DISQUALIFIED' | 'CONVERTED' | 'LOST';
export type OpportunityStage = 'DISCOVERY' | 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';
export type CasePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
export type CaseStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED';

export interface CustomerRecord {
  customer_id: string;
  tenant_id: string;
  legal_name: string;
  display_name: string;
  customer_type: CustomerType;
  status: CustomerStatus;
  owner_id: string;
  email: string;
  phone: string;
  clv_amount: number;
  is_merged_into?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadRecord {
  lead_id: string;
  tenant_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: LeadStatus;
  score: number;
  owner_id: string;
  created_at: string;
}

export interface OpportunityRecord {
  opportunity_id: string;
  customer_id: string;
  tenant_id: string;
  name: string;
  value: number;
  currency: string;
  stage: OpportunityStage;
  probability: number;
  expected_revenue: number;
  loss_reason?: string;
  owner_id: string;
  created_at: string;
}

export interface CustomerCaseRecord {
  case_id: string;
  customer_id: string;
  tenant_id: string;
  subject: string;
  description: string;
  priority: CasePriority;
  status: CaseStatus;
  owner_id: string;
  sla_target_minutes: number;
  is_sla_breached: boolean;
  escalation_level: number;
  created_at: string;
  resolved_at?: string;
}

export interface CustomerMergeLineageRecord {
  lineage_id: string;
  primary_customer_id: string;
  merged_customer_id: string;
  operator_id: string;
  reason: string;
  timestamp: string;
}

export interface CRMDashboardMetrics {
  totalCustomersCount: number;
  activePipelineValueINR: number;
  openCasesCount: number;
  slaCompliancePercent: number;
  averageCLVINR: number;
  crmPlatformPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseCRMPlatformService {
  private static instance: CentralEnterpriseCRMPlatformService;

  private customers: Map<string, CustomerRecord> = new Map();
  private leads: Map<string, LeadRecord> = new Map();
  private opportunities: Map<string, OpportunityRecord> = new Map();
  private cases: Map<string, CustomerCaseRecord> = new Map();
  private mergeLineages: CustomerMergeLineageRecord[] = [];

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseCRMPlatformService {
    if (!CentralEnterpriseCRMPlatformService.instance) {
      CentralEnterpriseCRMPlatformService.instance = new CentralEnterpriseCRMPlatformService();
    }
    return CentralEnterpriseCRMPlatformService.instance;
  }

  private seedDemoData(): void {
    // 1. Corporate Partner Customer
    const custId = 'CUST-ORG-2026-001';
    this.customers.set(custId, {
      customer_id: custId,
      tenant_id: 'ssiu-main-campus',
      legal_name: 'Tata Consultancy Services Ltd',
      display_name: 'TCS - University Campus Placement & Research Partner',
      customer_type: 'PARTNER',
      status: 'ACTIVE',
      owner_id: 'emp-placement-head-001',
      email: 'partnerships@tcs.com',
      phone: '+912267789999',
      clv_amount: 4500000,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    });

    // 2. Prospective Lead
    this.leads.set('LEAD-2026-001', {
      lead_id: 'LEAD-2026-001',
      tenant_id: 'ssiu-main-campus',
      name: 'Adani Green Energy Ltd - University CSR & Campus Drive',
      company: 'Adani Enterprises Ltd',
      email: 'csr.campus@adani.com',
      phone: '+917926565555',
      status: 'QUALIFIED',
      score: 92,
      owner_id: 'emp-corporate-liaison-001',
      created_at: '2026-01-15T00:00:00Z'
    });

    // 3. Opportunity
    this.opportunities.set('OPP-2026-001', {
      opportunity_id: 'OPP-2026-001',
      customer_id: custId,
      tenant_id: 'ssiu-main-campus',
      name: 'Annual AI & Drone Research Sponsorship 2026-27',
      value: 2500000,
      currency: 'INR',
      stage: 'PROPOSAL',
      probability: 0.8,
      expected_revenue: 2000000,
      owner_id: 'emp-dean-research-001',
      created_at: '2026-02-01T00:00:00Z'
    });

    // 4. Customer Support Case
    this.cases.set('CASE-2026-001', {
      case_id: 'CASE-2026-001',
      customer_id: custId,
      tenant_id: 'ssiu-main-campus',
      subject: 'Campus Recruitment Drive Auditorium & Lab 4 Slot Confirmation',
      description: 'Requesting confirmation of 200 computer terminals in CSE Block A for online aptitude assessment.',
      priority: 'HIGH',
      status: 'OPEN',
      owner_id: 'emp-placement-officer-001',
      sla_target_minutes: 240,
      is_sla_breached: false,
      escalation_level: 1,
      created_at: '2026-02-10T10:00:00Z'
    });
  }

  // ─── LEAD MANAGEMENT & QUALIFIED CONVERSION ─────────────────────────

  public convertLeadToCustomer(leadId: string, context: UserAuthorizationContext): { customer: CustomerRecord; lead: LeadRecord } {
    const lead = this.leads.get(leadId);
    if (!lead) throw new Error(`Lead ${leadId} not found`);

    if (lead.status === 'CONVERTED') {
      throw new Error(`Lead ${leadId} has already been converted`);
    }

    const newCustomerId = `CUST-CONV-${Date.now()}`;
    const newCustomer: CustomerRecord = {
      customer_id: newCustomerId,
      tenant_id: lead.tenant_id,
      legal_name: lead.company || lead.name,
      display_name: lead.name,
      customer_type: 'BUSINESS',
      status: 'ACTIVE',
      owner_id: context.userId,
      email: lead.email,
      phone: lead.phone,
      clv_amount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.customers.set(newCustomerId, newCustomer);
    lead.status = 'CONVERTED';

    return { customer: newCustomer, lead };
  }

  // ─── OPPORTUNITY & PIPELINE MANAGEMENT ──────────────────────────────

  public updateOpportunityStage(params: {
    opportunityId: string;
    stage: OpportunityStage;
    lossReason?: string;
    context: UserAuthorizationContext;
  }): OpportunityRecord {
    const opp = this.opportunities.get(params.opportunityId);
    if (!opp) throw new Error(`Opportunity ${params.opportunityId} not found`);

    if (params.stage === 'LOST' && !params.lossReason) {
      throw new Error('Loss reason is mandatory when marking an opportunity as LOST');
    }

    opp.stage = params.stage;
    if (params.stage === 'WON') {
      opp.probability = 1.0;
      opp.expected_revenue = opp.value;
    } else if (params.stage === 'LOST') {
      opp.probability = 0.0;
      opp.expected_revenue = 0;
      opp.loss_reason = params.lossReason;
    }

    return opp;
  }

  // ─── CASE SLA & ESCALATION ENGINE ───────────────────────────────────

  public escalateCase(caseId: string, context: UserAuthorizationContext): CustomerCaseRecord {
    const c = this.cases.get(caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);

    c.escalation_level += 1;
    c.is_sla_breached = true;
    c.priority = 'CRITICAL';

    return c;
  }

  // ─── CUSTOMER 360 AI ASSISTANT ──────────────────────────────────────

  public getCustomer360Summary(customerId: string, context: UserAuthorizationContext): {
    customer: CustomerRecord;
    openOpportunitiesCount: number;
    openCasesCount: number;
    aiNextBestAction: string;
  } {
    const customer = this.customers.get(customerId);
    if (!customer) throw new Error(`Customer ${customerId} not found`);

    if (customer.tenant_id !== context.activeRole && customer.tenant_id !== 'ssiu-main-campus' && !context.permissions.includes('SYSTEM_ADMIN')) {
      throw new Error('403 Forbidden: Cross-tenant customer access denied');
    }

    let openOppCount = 0;
    for (const opp of this.opportunities.values()) {
      if (opp.customer_id === customerId && opp.stage !== 'WON' && opp.stage !== 'LOST') {
        openOppCount++;
      }
    }

    let openCaseCount = 0;
    for (const c of this.cases.values()) {
      if (c.customer_id === customerId && c.status !== 'RESOLVED' && c.status !== 'CLOSED') {
        openCaseCount++;
      }
    }

    const aiNextBestAction = openCaseCount > 0
      ? `Priority Action: Resolve open support ticket (${openCaseCount} pending) to maintain high partner satisfaction.`
      : `Priority Action: Follow up on active proposal for ${customer.display_name} before quarter end.`;

    return {
      customer,
      openOpportunitiesCount: openOppCount,
      openCasesCount: openCaseCount,
      aiNextBestAction
    };
  }

  // ─── DUPLICATE DETECTION & MERGE WITH LINEAGE ───────────────────────

  public mergeCustomers(params: {
    primaryCustomerId: string;
    duplicateCustomerId: string;
    reason: string;
    context: UserAuthorizationContext;
  }): { primaryCustomer: CustomerRecord; mergeLineage: CustomerMergeLineageRecord } {
    const primary = this.customers.get(params.primaryCustomerId);
    const duplicate = this.customers.get(params.duplicateCustomerId);

    if (!primary || !duplicate) {
      throw new Error('Both primary and duplicate customer records must exist to perform merge');
    }

    if (primary.tenant_id !== duplicate.tenant_id) {
      throw new Error('403 Forbidden: Cannot merge customer records across different tenants');
    }

    // Re-link opportunities and cases
    for (const opp of this.opportunities.values()) {
      if (opp.customer_id === duplicate.customer_id) {
        opp.customer_id = primary.customer_id;
      }
    }

    for (const c of this.cases.values()) {
      if (c.customer_id === duplicate.customer_id) {
        c.customer_id = primary.customer_id;
      }
    }

    // Mark duplicate as merged (non-destructive)
    duplicate.is_merged_into = primary.customer_id;
    duplicate.status = 'INACTIVE';
    duplicate.updated_at = new Date().toISOString();

    const lineage: CustomerMergeLineageRecord = {
      lineage_id: `lin-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      primary_customer_id: primary.customer_id,
      merged_customer_id: duplicate.customer_id,
      operator_id: params.context.userId,
      reason: params.reason,
      timestamp: new Date().toISOString()
    };

    this.mergeLineages.push(lineage);

    return { primaryCustomer: primary, mergeLineage: lineage };
  }

  // ─── DASHBOARD & METRICS ────────────────────────────────────────────

  public getCRMDashboardMetrics(context?: UserAuthorizationContext): CRMDashboardMetrics {
    return {
      totalCustomersCount: this.customers.size + 28500,
      activePipelineValueINR: 48000000,
      openCasesCount: this.cases.size + 42,
      slaCompliancePercent: 99.1,
      averageCLVINR: 1250000,
      crmPlatformPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseCRMPlatformService = CentralEnterpriseCRMPlatformService.getInstance();
