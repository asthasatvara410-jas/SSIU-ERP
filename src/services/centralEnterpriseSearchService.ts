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

export type SearchableEntityType = 
  | 'STUDENT'
  | 'FACULTY'
  | 'ACADEMIC'
  | 'DOCUMENT'
  | 'RECORD'
  | 'CASE'
  | 'INCIDENT'
  | 'EVENT'
  | 'NOTIFICATION'
  | 'AUDIT';

export interface SearchIndexRecord {
  entity_type: SearchableEntityType;
  entity_id: string;
  title: string;
  subtitle: string;
  tokens: string[];
  organization_id: string;
  campus_id?: string;
  department_id?: string;
  security_classification: string;
  is_confidential: boolean;
  required_permission?: string;
}

export interface SearchResultItem {
  entity_type: SearchableEntityType;
  entity_id: string;
  title: string;
  subtitle: string;
  score: number;
  highlight?: string;
  url_reference: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
  totalMatches: number;
  facets: Record<string, number>;
  tookMs: number;
}

export interface SearchAnalyticsMetrics {
  totalIndexedEntities: number;
  queriesProcessedCount: number;
  zeroResultQueriesCount: number;
  averageSearchLatencyMs: number;
  searchPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseSearchService {
  private static instance: CentralEnterpriseSearchService;

  private index: SearchIndexRecord[] = [];
  private zeroResultLog: string[] = [];
  private totalQueries = 0;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseSearchService {
    if (!CentralEnterpriseSearchService.instance) {
      CentralEnterpriseSearchService.instance = new CentralEnterpriseSearchService();
    }
    return CentralEnterpriseSearchService.instance;
  }

  private seedDemoData(): void {
    // 1. Student Master Record
    this.index.push({
      entity_type: 'STUDENT',
      entity_id: 'STU-2026-00123',
      title: 'Aarav Patel',
      subtitle: 'B.Tech Computer Engineering - 6th Semester (Gandhinagar Main Campus)',
      tokens: ['aarav', 'patel', 'stu-2026-00123', 'btech', 'computer', 'engineering', 'gandhinagar'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-ce',
      security_classification: 'INTERNAL',
      is_confidential: false,
      required_permission: 'STUDENT_VIEW'
    });

    // 2. Restricted Confidential Student Dossier
    this.index.push({
      entity_type: 'STUDENT',
      entity_id: 'STU-2026-RESTRICTED-001',
      title: 'Confidential Disciplinary Hearing Record',
      subtitle: 'Student Disciplinary Board Investigation',
      tokens: ['disciplinary', 'hearing', 'investigation', 'restricted', 'stu-2026-restricted-001'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-admin',
      security_classification: 'RESTRICTED_CONFIDENTIAL',
      is_confidential: true,
      required_permission: 'DISCIPLINARY_ADMIN'
    });

    // 3. Official Document Master
    this.index.push({
      entity_type: 'DOCUMENT',
      entity_id: 'DOC-2026-000001',
      title: 'SSIU Examination Rules & Grading Regulations 2026',
      subtitle: 'Academic Governance & Examination Manual',
      tokens: ['ssiu', 'examination', 'rules', 'grading', 'regulations', '2026', 'doc-2026-000001'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-exam',
      security_classification: 'PUBLIC',
      is_confidential: false
    });

    // 4. Service Operations Case
    this.index.push({
      entity_type: 'CASE',
      entity_id: 'CASE-2026-000101',
      title: 'Bonafide Certificate Service Request Case',
      subtitle: 'Registrar Desk - Priority High',
      tokens: ['bonafide', 'certificate', 'service', 'request', 'case-2026-000101', 'registrar'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-academic',
      security_classification: 'INTERNAL',
      is_confidential: false,
      required_permission: 'CASE_VIEW'
    });

    // 5. IT Incident
    this.index.push({
      entity_type: 'INCIDENT',
      entity_id: 'INC-2026-000101',
      title: 'Payment Gateway SEV1 Outage',
      subtitle: 'Student Examination Fee Gateway Timeout',
      tokens: ['payment', 'gateway', 'sev1', 'outage', 'examination', 'fee', 'inc-2026-000101'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-it',
      security_classification: 'INTERNAL',
      is_confidential: false,
      required_permission: 'INCIDENT_VIEW'
    });

    // 6. Campus Calendar Event
    this.index.push({
      entity_type: 'EVENT',
      entity_id: 'EVT-2026-000101',
      title: 'University Annual Convocation 2026',
      subtitle: 'Main Auditorium - APJ Abdul Kalam Block',
      tokens: ['university', 'annual', 'convocation', '2026', 'auditorium', 'evt-2026-000101'],
      organization_id: 'inst-sit',
      campus_id: 'campus-main',
      department_id: 'dept-academic',
      security_classification: 'PUBLIC',
      is_confidential: false
    });
  }

  // ─── SECURITY TRIMMING & SEARCH ENGINE ───────────────────────────────

  public search(params: {
    query: string;
    context: UserAuthorizationContext;
    entityTypeFilter?: SearchableEntityType;
    organizationIdFilter?: string;
  }): SearchResponse {
    this.totalQueries += 1;
    const startMs = Date.now();
    const queryLower = params.query.toLowerCase().trim();
    const queryTokens = queryLower.split(/\s+/).filter(t => t.length > 0);

    const userRoles = params.context.assignedRoles || [params.context.activeRole];
    const userPermissions = params.context.permissions || [];

    const matchedItems: { item: SearchIndexRecord; score: number }[] = [];
    const facets: Record<string, number> = {};

    for (const item of this.index) {
      // 1. Entity Type Filter
      if (params.entityTypeFilter && item.entity_type !== params.entityTypeFilter) continue;

      // 2. Organization Scope Filter
      if (params.organizationIdFilter && item.organization_id !== params.organizationIdFilter) continue;

      // 3. Security Trimming Gate: Check Permissions
      if (item.required_permission && !userPermissions.includes(item.required_permission)) {
        continue;
      }

      // 4. Confidentiality Gate
      if (item.is_confidential && !userRoles.includes('DISCIPLINARY_ADMIN') && !userRoles.includes('SUPER_ADMIN')) {
        continue;
      }

      // 5. Match Score Calculation
      let score = 0;
      const lowerEntityId = item.entity_id.toLowerCase();
      const lowerTitle = item.title.toLowerCase();

      // Exact Identifier match (highest priority)
      if (lowerEntityId === queryLower) {
        score += 100;
      } else if (lowerTitle.includes(queryLower)) {
        score += 50;
      } else {
        for (const token of queryTokens) {
          if (item.tokens.some(t => t.includes(token))) {
            score += 10;
          }
        }
      }

      if (score > 0) {
        matchedItems.push({ item, score });
        facets[item.entity_type] = (facets[item.entity_type] || 0) + 1;
      }
    }

    // Sort by descending score
    matchedItems.sort((a, b) => b.score - a.score);

    // Track zero result queries
    if (matchedItems.length === 0 && queryLower.length > 0) {
      this.zeroResultLog.push(queryLower);
    }

    const results: SearchResultItem[] = matchedItems.map(({ item, score }) => ({
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      title: item.title,
      subtitle: item.subtitle,
      score,
      url_reference: `/portal/${item.entity_type.toLowerCase()}/${item.entity_id}`
    }));

    return {
      results,
      totalMatches: results.length,
      facets,
      tookMs: Math.max(1, Date.now() - startMs)
    };
  }

  // ─── AUTOCOMPLETE & SUGGESTIONS ──────────────────────────────────────

  public autocomplete(prefix: string, context: UserAuthorizationContext): string[] {
    const pLower = prefix.toLowerCase().trim();
    if (!pLower) return [];

    const searchRes = this.search({ query: pLower, context });
    return searchRes.results.slice(0, 5).map(r => r.title);
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getSearchAnalyticsMetrics(context?: UserAuthorizationContext): SearchAnalyticsMetrics {
    return {
      totalIndexedEntities: this.index.length,
      queriesProcessedCount: this.totalQueries,
      zeroResultQueriesCount: this.zeroResultLog.length,
      averageSearchLatencyMs: 8.2,
      searchPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseSearchService = CentralEnterpriseSearchService.getInstance();
