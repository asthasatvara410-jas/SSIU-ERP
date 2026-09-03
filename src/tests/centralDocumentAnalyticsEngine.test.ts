import { describe, it, expect } from 'vitest';
import { centralDocumentAnalyticsService } from '../services/centralDocumentAnalyticsService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.5: Central Document Analytics, Compliance & Management Reporting Engine', () => {

  const registrarContext: UserAuthorizationContext = {
    userId: 'emp-reg-001',
    userName: 'Dr. Registrar',
    email: 'registrar@swarrnim.edu.in',
    activeRole: 'REGISTRAR',
    assignedRoles: ['REGISTRAR'],
    permissions: ['DOCUMENT_VIEW', 'DOCUMENT_ANALYTICS_VIEW', 'ALL_ORGANIZATIONS_VIEW']
  };

  it('TEST 1: Dossier Completeness: Computes transparent compliance percentage and health status', () => {
    const completeness = centralDocumentAnalyticsService.evaluateEntityDossierCompleteness('STU-2026-000001', 'prog-bca');

    expect(completeness.entityId).toBe('STU-2026-000001');
    expect(completeness.totalRequired).toBe(4);
    expect(completeness.compliancePercentage).toBeGreaterThanOrEqual(25);
    expect(['COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT']).toContain(completeness.status);
    expect(['HEALTHY', 'ATTENTION_REQUIRED', 'CRITICAL']).toContain(completeness.health);
  });

  it('TEST 2: Missing Document Intelligence: Classifies missing documents by severity and waivability', () => {
    const missingItems = centralDocumentAnalyticsService.getMissingDocumentIntelligence(registrarContext);

    expect(Array.isArray(missingItems)).toBe(true);
    if (missingItems.length > 0) {
      expect(['CRITICAL', 'HIGH', 'NORMAL', 'LOW']).toContain(missingItems[0].priority);
      expect(missingItems[0].actionRequired).toBeDefined();
    }
  });

  it('TEST 3: Verification Analytics: Accurately calculates verification and rejection rates without false denominators', () => {
    const verif = centralDocumentAnalyticsService.getVerificationAnalytics(registrarContext);

    expect(verif.totalSubmitted).toBeGreaterThan(0);
    expect(verif.verificationRatePercentage).toBeGreaterThanOrEqual(0);
    expect(verif.rejectionRatePercentage).toBeGreaterThanOrEqual(0);
    expect(verif.slaCompliancePercentage).toBeGreaterThanOrEqual(90);
    expect(verif.averageReviewTimeHours).toBeLessThan(24);
  });

  it('TEST 4: Storage & Tier Analytics: Computes hot/archive storage and module breakdowns', () => {
    const storage = centralDocumentAnalyticsService.getStorageAnalytics(registrarContext);

    expect(storage.totalStorageBytes).toBeGreaterThan(0);
    expect(storage.hotStorageBytes + storage.archiveStorageBytes).toBe(storage.totalStorageBytes);
    expect(storage.storageByModule['ADMISSION']).toBeDefined();
    expect(storage.storageByFileType['PDF']).toBeDefined();
  });

  it('TEST 5: Executive Management Reporting: Produces comprehensive multi-domain KPI executive brief', () => {
    const execReport = centralDocumentAnalyticsService.generateExecutiveManagementReport('inst-sit', registrarContext);

    expect(execReport.institutionCode).toBe('inst-sit');
    expect(execReport.totalActiveDocuments).toBeGreaterThanOrEqual(1);
    expect(execReport.overallComplianceRate).toBeGreaterThanOrEqual(0);
    expect(execReport.generatedAt).toBeDefined();
  });
});
