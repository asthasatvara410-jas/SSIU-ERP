import { describe, it, expect } from 'vitest';
import { centralEnterpriseSearchPlatformService } from '../services/centralEnterpriseSearchPlatformService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.57: Enterprise Search & Information Retrieval Platform Engine', () => {

  const searchAdmin: UserAuthorizationContext = {
    userId: 'emp-search-admin-001',
    userName: 'Enterprise Search Platform Administrator',
    email: 'search.admin@swarrnim.edu.in',
    activeRole: 'SYSTEM_ADMIN',
    assignedRoles: ['SYSTEM_ADMIN'],
    permissions: ['STUDENT_VIEW', 'FINANCE_VIEW', 'FINANCE_ADMIN', 'SYSTEM_ADMIN']
  };

  const studentUser: UserAuthorizationContext = {
    userId: 'stu-2026-001',
    userName: 'Student User',
    email: 'student@swarrnim.edu.in',
    activeRole: 'STUDENT',
    assignedRoles: ['STUDENT'],
    permissions: ['STUDENT_PORTAL', 'STUDENT_VIEW']
  };

  it('TEST 1: Permission-Aware Search & Security Trimming: Filters out unauthorized finance records for students', () => {
    // 1. Admin search returns both Student and confidential Invoice
    const adminRes = centralEnterpriseSearchPlatformService.executeSearch({
      query: 'Jigar Parmar',
      context: searchAdmin
    });
    const adminSources = adminRes.results.map(r => r.source_type);
    expect(adminSources).toContain('STUDENT');
    expect(adminSources).toContain('INVOICE');

    // 2. Student search returns only Student, Invoice is security-trimmed
    const studentRes = centralEnterpriseSearchPlatformService.executeSearch({
      query: 'Jigar Parmar',
      context: studentUser
    });
    const studentSources = studentRes.results.map(r => r.source_type);
    expect(studentSources).toContain('STUDENT');
    expect(studentSources).not.toContain('INVOICE');
  });

  it('TEST 2: Strict Tenant Isolation: Cross-tenant records from satellite campuses are never returned', () => {
    const res = centralEnterpriseSearchPlatformService.executeSearch({
      query: 'Mechanical Engineering',
      context: searchAdmin
    });

    const returnedIds = res.results.map(r => r.source_id);
    expect(returnedIds).not.toContain('stu-other-campus-099');
  });

  it('TEST 3: Synonyms & Full-Text Search: Automatically expands domain synonyms (e.g. tuition receipt -> invoice)', () => {
    const res = centralEnterpriseSearchPlatformService.executeSearch({
      query: 'tuition fee receipt',
      context: searchAdmin
    });

    expect(res.total_hits).toBeGreaterThanOrEqual(1);
    expect(res.results[0].source_id).toBe('inv-2026-089');
  });

  it('TEST 4: Autocomplete Suggestions & Zero-Downtime Reindexing: Returns permission-safe suggestions and switches aliases', () => {
    // 1. Suggestions
    const suggestions = centralEnterpriseSearchPlatformService.getSuggestions({
      prefix: 'Jigar',
      context: studentUser
    });
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0]).toContain('Jigar Parmar');

    // 2. Reindexing
    const reindexRes = centralEnterpriseSearchPlatformService.triggerZeroDowntimeReindex('students', searchAdmin);
    expect(reindexRes.validation_status).toBe('PASSED');
    expect(reindexRes.alias_switched_to).toContain('idx-students-v');
  });

  it('TEST 5: RAG Search Integration & Dashboard Telemetry: Generates verified context citations and monitors search telemetry', () => {
    // 1. RAG retrieval
    const ragRes = centralEnterpriseSearchPlatformService.retrieveContextForRAG({
      query: 'attendance policy',
      context: studentUser
    });
    expect(ragRes.citations).toContain('DOC-POL-2026-001');
    expect(ragRes.context_chunks[0]).toContain('75% aggregate attendance');

    // 2. Dashboard metrics
    const metrics = centralEnterpriseSearchPlatformService.getSearchDashboardMetrics(searchAdmin);
    expect(metrics.totalIndexedDocuments).toBeGreaterThan(100000);
    expect(metrics.averageQueryLatencyMs).toBeLessThan(50);
    expect(metrics.searchPrecisionPercent).toBeGreaterThan(95);
    expect(metrics.searchPlatformPosture).toBe('HEALTHY');
  });
});
