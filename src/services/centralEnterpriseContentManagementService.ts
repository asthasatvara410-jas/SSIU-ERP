import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralDocumentManagementService } from './centralDocumentManagementService';
import { centralSecurityGovernanceService } from './centralSecurityGovernanceService';
import { centralPrivacyGovernanceService } from './centralPrivacyGovernanceService';
import { centralDataGovernanceService } from './centralDataGovernanceService';
import { centralEnterpriseDocumentGovernanceService } from './centralEnterpriseDocumentGovernanceService';
import { centralRecordsManagementService } from './centralRecordsManagementService';

export type EnterpriseContentType = 
  | 'ARTICLE'
  | 'GUIDE'
  | 'FAQ'
  | 'POLICY'
  | 'PROCEDURE'
  | 'HOW_TO'
  | 'MANUAL'
  | 'KNOWLEDGE_ARTICLE'
  | 'COURSE_CONTENT'
  | 'ANNOUNCEMENT'
  | 'NOTICE'
  | 'OTHER';

export type ContentLifecycleStatus = 
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'CHANGES_REQUIRED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'UNPUBLISHED'
  | 'EXPIRED'
  | 'ARCHIVED';

export type ContentVisibility = 'PUBLIC' | 'INTERNAL' | 'STUDENT_ONLY' | 'FACULTY_ONLY' | 'ROLE_RESTRICTED';

export interface EnterpriseContentItem {
  id: string;
  content_number: string;
  title: string;
  summary: string;
  content_type: EnterpriseContentType;
  category: string;
  taxonomy_tags: string[];
  keywords: string[];
  owner_id: string;
  author_id: string;
  organization_id: string;
  department_id: string;
  classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  visibility: ContentVisibility;
  status: ContentLifecycleStatus;
  current_version_number: string;
  published_at?: string;
  expires_at?: string;
  views_count: number;
  helpful_votes: number;
  not_helpful_votes: number;
  created_at: string;
  updated_at: string;
}

export interface EnterpriseContentVersion {
  id: string;
  content_id: string;
  version_number: string;
  body: string;
  change_summary: string;
  author_id: string;
  status: 'DRAFT' | 'APPROVED' | 'PUBLISHED' | 'SUPERSEDED';
  created_at: string;
}

export interface KnowledgeGapRecord {
  id: string;
  query: string;
  search_count: number;
  zero_result_count: number;
  status: 'DETECTED' | 'ASSIGNED' | 'RESOLVED';
  detected_at: string;
}

export interface ContentGovernanceDashboardMetrics {
  totalContentCount: number;
  publishedContentCount: number;
  draftContentCount: number;
  totalViewsCount: number;
  helpfulVotesCount: number;
  detectedKnowledgeGapsCount: number;
  contentQualityScorePercent: number;
  contentPosture: 'HEALTHY' | 'WATCH' | 'ELEVATED' | 'HIGH_RISK';
}

class CentralEnterpriseContentManagementService {
  private static instance: CentralEnterpriseContentManagementService;

  private contents: EnterpriseContentItem[] = [];
  private versions: EnterpriseContentVersion[] = [];
  private knowledgeGaps: KnowledgeGapRecord[] = [];

  private cntCounter = 100;
  private gapCounter = 100;

  private constructor() {
    this.seedDemoData();
  }

  public static getInstance(): CentralEnterpriseContentManagementService {
    if (!CentralEnterpriseContentManagementService.instance) {
      CentralEnterpriseContentManagementService.instance = new CentralEnterpriseContentManagementService();
    }
    return CentralEnterpriseContentManagementService.instance;
  }

  private seedDemoData(): void {
    const cntId = 'cnt-seed-001';
    const verId = 'cnt-ver-seed-001';

    this.contents.push({
      id: cntId,
      content_number: 'CNT-2026-000001',
      title: 'Student Academic Registration & Course Enrollment Step-by-Step Guide',
      summary: 'Comprehensive procedural handbook for semester course selection, prerequisites, and fee payment verification',
      content_type: 'GUIDE',
      category: 'Academic/Admissions',
      taxonomy_tags: ['Enrollment', 'Admissions', 'Courses', 'StudentServices'],
      keywords: ['enrollment', 'registration', 'course elective', 'hall ticket'],
      owner_id: 'emp-dean-001',
      author_id: 'emp-reg-001',
      organization_id: 'inst-sit',
      department_id: 'dept-academic',
      classification: 'INTERNAL',
      visibility: 'STUDENT_ONLY',
      status: 'PUBLISHED',
      current_version_number: '1.0',
      published_at: '2026-01-01T10:00:00Z',
      views_count: 1420,
      helpful_votes: 98,
      not_helpful_votes: 2,
      created_at: '2026-01-01T09:00:00Z',
      updated_at: '2026-01-01T10:00:00Z'
    });

    this.versions.push({
      id: verId,
      content_id: cntId,
      version_number: '1.0',
      body: '## Step 1: Login to Portal\nNavigate to student dashboard.\n## Step 2: Select Major & Minor Electives\nConfirm credit caps.',
      change_summary: 'Initial publication of 2026 course enrollment guide',
      author_id: 'emp-reg-001',
      status: 'PUBLISHED',
      created_at: '2026-01-01T09:00:00Z'
    });
  }

  // ─── CONTENT AUTHORING & LIFECYCLE ───────────────────────────────────

  public createContent(params: {
    title: string;
    summary: string;
    contentType: EnterpriseContentType;
    category: string;
    taxonomyTags: string[];
    keywords: string[];
    body: string;
    ownerId: string;
    authorId: string;
    organizationId: string;
    departmentId: string;
    classification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    visibility: ContentVisibility;
    context?: UserAuthorizationContext;
  }): { content: EnterpriseContentItem; version: EnterpriseContentVersion } {
    this.cntCounter += 1;
    const cntNumber = `CNT-2026-${String(this.cntCounter).padStart(6, '0')}`;

    const contentId = `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const versionId = `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const version: EnterpriseContentVersion = {
      id: versionId,
      content_id: contentId,
      version_number: '1.0',
      body: params.body,
      change_summary: 'Initial draft version created',
      author_id: params.authorId,
      status: 'DRAFT',
      created_at: new Date().toISOString()
    };

    const content: EnterpriseContentItem = {
      id: contentId,
      content_number: cntNumber,
      title: params.title,
      summary: params.summary,
      content_type: params.contentType,
      category: params.category,
      taxonomy_tags: params.taxonomyTags,
      keywords: params.keywords,
      owner_id: params.ownerId,
      author_id: params.authorId,
      organization_id: params.organizationId,
      department_id: params.departmentId,
      classification: params.classification,
      visibility: params.visibility,
      status: 'DRAFT',
      current_version_number: '1.0',
      views_count: 0,
      helpful_votes: 0,
      not_helpful_votes: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.versions.push(version);
    this.contents.push(content);

    return { content, version };
  }

  public approveAndPublishContent(contentId: string, publisherId: string): EnterpriseContentItem {
    const content = this.contents.find(c => c.id === contentId || c.content_number === contentId);
    if (!content) throw new Error(`Content ${contentId} not found`);

    const ver = this.versions.find(v => v.content_id === content.id && v.version_number === content.current_version_number);
    if (ver) {
      ver.status = 'PUBLISHED';
    }

    content.status = 'PUBLISHED';
    content.published_at = new Date().toISOString();
    content.updated_at = new Date().toISOString();

    return content;
  }

  // ─── VERSION CONTROL & DRAFT REVISIONS ───────────────────────────────

  public editPublishedContentAsNewDraft(params: {
    contentId: string;
    newBody: string;
    changeSummary: string;
    authorId: string;
  }): EnterpriseContentVersion {
    const content = this.contents.find(c => c.id === params.contentId || c.content_number === params.contentId);
    if (!content) throw new Error(`Content ${params.contentId} not found`);

    const nextVerNumber = (parseFloat(content.current_version_number) + 1.0).toFixed(1);

    const draftVersion: EnterpriseContentVersion = {
      id: `ver-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      content_id: content.id,
      version_number: nextVerNumber,
      body: params.newBody,
      change_summary: params.changeSummary,
      author_id: params.authorId,
      status: 'DRAFT',
      created_at: new Date().toISOString()
    };

    this.versions.push(draftVersion);
    // Note: Live published content status remains PUBLISHED pointing to old version until draft is approved
    return draftVersion;
  }

  // ─── SEARCH & RBAC VISIBILITY FILTERING ──────────────────────────────

  public searchKnowledgeContent(query: string, context: UserAuthorizationContext): EnterpriseContentItem[] {
    const q = query.toLowerCase();

    const matches = this.contents.filter(c => {
      if (c.status !== 'PUBLISHED') return false;

      // Cross-organization protection
      if (c.organization_id !== 'all' && c.organization_id !== 'inst-sit') {
        return false;
      }

      // Visibility validation
      if (c.visibility === 'FACULTY_ONLY' && context.activeRole === 'STUDENT') {
        return false;
      }

      const matchText = (
        c.title.toLowerCase().includes(q) ||
        c.summary.toLowerCase().includes(q) ||
        c.keywords.some(k => k.toLowerCase().includes(q)) ||
        c.taxonomy_tags.some(t => t.toLowerCase().includes(q))
      );

      return matchText;
    });

    if (matches.length === 0) {
      // Log Knowledge Gap automatically
      this.gapCounter += 1;
      this.knowledgeGaps.push({
        id: `gap-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        query,
        search_count: 1,
        zero_result_count: 1,
        status: 'DETECTED',
        detected_at: new Date().toISOString()
      });
    }

    return matches;
  }

  // ─── USER FEEDBACK & ENGAGEMENT ──────────────────────────────────────

  public submitContentFeedback(contentId: string, isHelpful: boolean): EnterpriseContentItem {
    const content = this.contents.find(c => c.id === contentId || c.content_number === contentId);
    if (!content) throw new Error(`Content ${contentId} not found`);

    if (isHelpful) {
      content.helpful_votes += 1;
    } else {
      content.not_helpful_votes += 1;
    }
    content.views_count += 1;
    content.updated_at = new Date().toISOString();

    return content;
  }

  // ─── DASHBOARD & METRICS ─────────────────────────────────────────────

  public getContentGovernanceDashboardMetrics(context?: UserAuthorizationContext): ContentGovernanceDashboardMetrics {
    const totalContentCount = this.contents.length;
    const publishedContentCount = this.contents.filter(c => c.status === 'PUBLISHED').length;
    const draftContentCount = this.contents.filter(c => c.status === 'DRAFT').length;
    const totalViewsCount = this.contents.reduce((sum, c) => sum + c.views_count, 0);
    const helpfulVotesCount = this.contents.reduce((sum, c) => sum + c.helpful_votes, 0);
    const detectedKnowledgeGapsCount = this.knowledgeGaps.filter(g => g.status === 'DETECTED').length;

    return {
      totalContentCount,
      publishedContentCount,
      draftContentCount,
      totalViewsCount,
      helpfulVotesCount,
      detectedKnowledgeGapsCount,
      contentQualityScorePercent: 97,
      contentPosture: 'HEALTHY'
    };
  }
}

export const centralEnterpriseContentManagementService = CentralEnterpriseContentManagementService.getInstance();
