import { describe, it, expect } from 'vitest';
import { centralDocumentAnalyticsService } from '../services/centralDocumentAnalyticsService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.21: Central Document Analytics, Intelligence & Management BI Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_ANALYTICS_VIEW', 'ALL_ORGANIZATIONS_VIEW']
  };

  it('TEST 1: Document Health Scoring: Evaluates transparent 5-factor weighted score with clear explanation', () => {
    const health = centralDocumentAnalyticsService.getDocumentHealth('STU-2026-000001', 'prog-bca');

    expect(health.entityId).toBe('STU-2026-000001');
    expect(health.healthScore).toBeGreaterThanOrEqual(0);
    expect(health.healthScore).toBeLessThanOrEqual(100);
    expect(['HEALTHY', 'ATTENTION_REQUIRED', 'AT_RISK', 'CRITICAL']).toContain(health.healthStatus);
    expect(health.contributingFactors.length).toBeGreaterThanOrEqual(1);

    // Verify transparent component scores
    expect(health.completenessScore).toBeGreaterThanOrEqual(0);
    expect(health.verificationScore).toBeGreaterThanOrEqual(0);
    expect(health.validityScore).toBeGreaterThanOrEqual(0);
    expect(health.complianceScore).toBeGreaterThanOrEqual(0);
    expect(health.metadataScore).toBe(95);
  });

  it('TEST 2: Completeness & Expiry Analytics: Evaluates cohort completeness and multi-horizon expiry forecasts', () => {
    const completeness = centralDocumentAnalyticsService.getCompletenessAnalytics({ programId: 'prog-bca' });
    expect(completeness.scope).toBe('prog-bca');
    expect(completeness.totalEntities).toBe(10);
    expect(completeness.averageCompletenessPercent).toBe(88);
    expect(completeness.fullyCompliantCount).toBe(7);

    const expiry = centralDocumentAnalyticsService.getExpiryAnalytics();
    expect(expiry.totalExpired).toBeGreaterThanOrEqual(0);
    expect(expiry.forecastBuckets.length).toBe(6);
    expect(expiry.forecastBuckets[0].horizon).toBe('7_DAYS');
    expect(expiry.forecastBuckets[1].horizon).toBe('30_DAYS');
    expect(expiry.topExpiringDocumentTypes.length).toBeGreaterThanOrEqual(1);
  });

  it('TEST 3: Compliance Trends & OCR Analytics: Tracks compliance trajectory and OCR confidence metrics', () => {
    const trends = centralDocumentAnalyticsService.getComplianceTrends('MONTHLY');
    expect(trends.period).toBe('MONTHLY');
    expect(trends.overallScorePercent).toBeGreaterThanOrEqual(0);
    expect(['IMPROVING', 'STABLE', 'DEGRADING']).toContain(trends.trendDirection);

    const ocr = centralDocumentAnalyticsService.getOcrAnalytics();
    expect(ocr.totalJobsProcessed).toBeGreaterThanOrEqual(0);
    expect(ocr.averageConfidenceScore).toBeGreaterThanOrEqual(0);
  });

  it('TEST 4: Workflow & Document Usage Analytics: Identifies workflow bottlenecks and usage telemetry', () => {
    const wf = centralDocumentAnalyticsService.getWorkflowAnalytics();
    expect(wf.totalWorkflows).toBeGreaterThanOrEqual(0);
    expect(wf.averageTatHours).toBeGreaterThan(0);
    expect(wf.bottleneckRole).toBe('REGISTRAR');

    const usage = centralDocumentAnalyticsService.getDocumentUsageAnalytics();
    expect(usage.totalViews).toBeGreaterThan(0);
    expect(usage.totalDownloads).toBeGreaterThan(0);
    expect(usage.activeShareLinks).toBeGreaterThanOrEqual(0);
  });

  it('TEST 5: Student Insights & Executive Management Dashboard: Provides entity recommendations and executive KPIs', () => {
    const studentInsights = centralDocumentAnalyticsService.getStudentDocumentInsights('STU-2026-000001');
    expect(studentInsights.studentId).toBe('STU-2026-000001');
    expect(studentInsights.studentName).toBe('Aarav Patel');
    expect(studentInsights.recommendedActions.length).toBeGreaterThanOrEqual(1);

    const mgmt = centralDocumentAnalyticsService.getDocumentManagementDashboard(registrarContext);
    expect(mgmt.totalDocuments).toBeGreaterThanOrEqual(1);
    expect(mgmt.averageCompletenessScore).toBe(88);
    expect(mgmt.healthDistribution.HEALTHY).toBeGreaterThanOrEqual(1);
    expect(mgmt.totalStorageGB).toBeGreaterThanOrEqual(0);
  });
});
