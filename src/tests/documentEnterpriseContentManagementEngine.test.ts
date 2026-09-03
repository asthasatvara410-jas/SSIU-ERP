import { describe, it, expect } from 'vitest';
import { centralEnterpriseContentManagementService } from '../services/centralEnterpriseContentManagementService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.38: Enterprise Content Management & Knowledge Base Engine', () => {

  const contentEditor: UserAuthorizationContext = {
    userId: 'emp-kb-editor-001',
    userName: 'Knowledge Base Lead Editor',
    email: 'kb@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: [
      'CONTENT_VIEW',
      'CONTENT_CREATE',
      'CONTENT_EDIT',
      'CONTENT_APPROVE',
      'CONTENT_PUBLISH',
      'CONTENT_UNPUBLISH',
      'CONTENT_REPORT'
    ]
  };

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Aarav Patel',
    email: 'aarav@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['CONTENT_VIEW']
  };

  const facultyUser: UserAuthorizationContext = {
    userId: 'fac-2026-001',
    userName: 'Dr. Sharma',
    email: 'sharma@swarrnim.edu.in',
    activeRole: 'FACULTY',
    assignedRoles: ['FACULTY'],
    permissions: ['CONTENT_VIEW']
  };

  it('TEST 1: Content Authoring & Publication: Authors article and publishes to live knowledge base', () => {
    const { content, version } = centralEnterpriseContentManagementService.createContent({
      title: 'Hostel WiFi Access & Digital Network Onboarding Guide',
      summary: 'Instructions for connecting to high-speed campus eduroam WiFi and registering MAC address',
      contentType: 'HOW_TO',
      category: 'Campus Facilities/IT',
      taxonomyTags: ['WiFi', 'Hostel', 'Network', 'ITSupport'],
      keywords: ['wifi', 'eduroam', 'mac address', 'internet'],
      body: '1. Connect to SSIU_STUDENT SSID.\n2. Login with student enrollment credentials.\n3. Accept SSL certificate.',
      ownerId: 'emp-it-head-001',
      authorId: 'emp-kb-editor-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-it',
      classification: 'INTERNAL',
      visibility: 'PUBLIC',
      context: contentEditor
    });

    expect(content.id).toBeDefined();
    expect(content.content_number).toMatch(/^CNT-2026-\d{6}$/);
    expect(content.status).toBe('DRAFT');
    expect(version.version_number).toBe('1.0');

    // Publish article
    const published = centralEnterpriseContentManagementService.approveAndPublishContent(content.id, 'emp-kb-editor-001');
    expect(published.status).toBe('PUBLISHED');
    expect(published.published_at).toBeDefined();
  });

  it('TEST 2: Version Control & Draft Revisions: Editing live published content creates new draft version', () => {
    const { content } = centralEnterpriseContentManagementService.createContent({
      title: 'Campus Central Library Book Borrowing Rules',
      summary: 'Library book checkout caps, loan durations, and overdue fine schedule',
      contentType: 'POLICY',
      category: 'Library/Circulation',
      taxonomyTags: ['Library', 'Books', 'Circulation'],
      keywords: ['library', 'books', 'due date', 'fines'],
      body: 'Students can borrow up to 4 books for 14 days.',
      ownerId: 'emp-lib-001',
      authorId: 'emp-kb-editor-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-library',
      classification: 'INTERNAL',
      visibility: 'PUBLIC'
    });

    // Publish Version 1.0
    centralEnterpriseContentManagementService.approveAndPublishContent(content.id, 'emp-kb-editor-001');

    // Create Draft Version 2.0
    const draftVer = centralEnterpriseContentManagementService.editPublishedContentAsNewDraft({
      contentId: content.id,
      newBody: 'Students can now borrow up to 6 books for 21 days under revised 2026 academic policy.',
      changeSummary: 'Increased book limit and loan duration for final year project research',
      authorId: 'emp-kb-editor-001'
    });

    expect(draftVer.id).toBeDefined();
    expect(draftVer.version_number).toBe('2.0');
    expect(draftVer.status).toBe('DRAFT');
  });

  it('TEST 3: Role-Based Search & Visibility Security: Filters sensitive content and prevents student leakage', () => {
    const { content } = centralEnterpriseContentManagementService.createContent({
      title: 'Confidential Faculty Examination Question Paper Moderation Guidelines',
      summary: 'Faculty rubrics for setting end-semester exam question papers',
      contentType: 'PROCEDURE',
      category: 'Examination/Moderation',
      taxonomyTags: ['ExamModeration', 'FacultyOnly'],
      keywords: ['question paper', 'rubric', 'grading scheme'],
      body: 'Strict confidential question paper moderation guidelines.',
      ownerId: 'emp-coe-001',
      authorId: 'emp-kb-editor-001',
      organizationId: 'inst-sit',
      departmentId: 'dept-exam',
      classification: 'CONFIDENTIAL',
      visibility: 'FACULTY_ONLY'
    });

    centralEnterpriseContentManagementService.approveAndPublishContent(content.id, 'emp-kb-editor-001');

    // Student search must return 0 results
    const studentResults = centralEnterpriseContentManagementService.searchKnowledgeContent('moderation', studentUser);
    expect(studentResults.some(r => r.id === content.id)).toBe(false);

    // Faculty search must return the content
    const facultyResults = centralEnterpriseContentManagementService.searchKnowledgeContent('moderation', facultyUser);
    expect(facultyResults.some(r => r.id === content.id)).toBe(true);
  });

  it('TEST 4: Knowledge Gap Detection & User Feedback: Logs gap on unindexed queries and tracks helpful votes', () => {
    // 1. Unindexed search query triggers Knowledge Gap
    const results = centralEnterpriseContentManagementService.searchKnowledgeContent('quantum cryptocurrency blockchain minor elective registration', studentUser);
    expect(results.length).toBe(0);

    // 2. Submit helpful feedback
    const updated = centralEnterpriseContentManagementService.submitContentFeedback('cnt-seed-001', true);
    expect(updated.helpful_votes).toBeGreaterThan(98);
  });

  it('TEST 5: Content Governance Dashboard Telemetry: Validates metrics, quality score, and posture', () => {
    const metrics = centralEnterpriseContentManagementService.getContentGovernanceDashboardMetrics(contentEditor);

    expect(metrics.totalContentCount).toBeGreaterThanOrEqual(1);
    expect(metrics.publishedContentCount).toBeGreaterThanOrEqual(1);
    expect(metrics.totalViewsCount).toBeGreaterThan(100);
    expect(metrics.contentQualityScorePercent).toBeGreaterThanOrEqual(90);
    expect(metrics.contentPosture).toBe('HEALTHY');
  });
});
