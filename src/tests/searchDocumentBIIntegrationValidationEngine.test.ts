import { describe, it, expect } from 'vitest';
import { centralSearchDocumentBIIntegrationValidationService } from '../services/centralSearchDocumentBIIntegrationValidationService';

describe('SSIU ERP – Phase 40.12: Global Search / Document Management / Reports & BI End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Multi-Entity Global Search Engine: Accurate indexing and keyword matching with strict RBAC filtering', () => {
    // 1. Student searches own name / reference
    const studentResults = centralSearchDocumentBIIntegrationValidationService.searchGlobal('jigar', {
      tenantId: 'TENANT-SSIU',
      role: 'STUDENT'
    });
    expect(studentResults.length).toBeGreaterThanOrEqual(1);
    expect(studentResults[0].reference_no).toBe('STU-2026-101');

    // 2. Student searches restricted Procurement PO -> Strictly Blocked (0 results)
    const restrictedResults = centralSearchDocumentBIIntegrationValidationService.searchGlobal('PO-2026-001', {
      tenantId: 'TENANT-SSIU',
      role: 'STUDENT'
    });
    expect(restrictedResults.length).toBe(0);

    // 3. Procurement Officer searches PO -> Returns match
    const authorizedResults = centralSearchDocumentBIIntegrationValidationService.searchGlobal('PO-2026-001', {
      tenantId: 'TENANT-SSIU',
      role: 'PROCUREMENT_OFFICER'
    });
    expect(authorizedResults.length).toBe(1);
    expect(authorizedResults[0].reference_no).toBe('PO-2026-001');
  });

  it('TEST 2: Multi-Tenant Search Isolation: Excludes cross-tenant entities even with identical keywords', () => {
    const ssiuResults = centralSearchDocumentBIIntegrationValidationService.searchGlobal('parmar', {
      tenantId: 'TENANT-SSIU',
      role: 'STUDENT'
    });

    // Confirms no record belonging to TENANT-OTHER is ever leaked
    const hasLeak = ssiuResults.some(r => r.tenant_id === 'TENANT-OTHER');
    expect(hasLeak).toBe(false);
  });

  it('TEST 3: Cross-Module BI Analytics & KPI Aggregations: Reconciles verified metrics across all institutional domains', () => {
    const kpis = centralSearchDocumentBIIntegrationValidationService.calculateInstitutionalKPIs();

    expect(kpis.total_students_enrolled).toBe(1250);
    expect(kpis.total_fee_collection_inr).toBe(380500);
    expect(kpis.average_attendance_pct).toBe(87.5);
    expect(kpis.placement_rate_pct).toBe(100.0);
    expect(kpis.inventory_items_in_stock).toBe(19);
    expect(kpis.open_grievances_count).toBe(0);
  });

  it('TEST 4: Report Export Engine: Validates format integrity across CSV, Excel, and PDF exports', () => {
    const csv = centralSearchDocumentBIIntegrationValidationService.generateExportPayload('CSV', [{ a: 1 }, { a: 2 }]);
    expect(csv.success).toBe(true);
    expect(csv.mimeType).toBe('text/csv');
    expect(csv.rowCount).toBe(2);

    const pdf = centralSearchDocumentBIIntegrationValidationService.generateExportPayload('PDF', [{ a: 1 }]);
    expect(pdf.success).toBe(true);
    expect(pdf.mimeType).toBe('application/pdf');

    const excel = centralSearchDocumentBIIntegrationValidationService.generateExportPayload('EXCEL', [{ a: 1 }]);
    expect(excel.success).toBe(true);
    expect(excel.mimeType).toContain('spreadsheetml');
  });

  it('TEST 5: Phase 40.12 Final Gate Execution: Confirms green status across all 76 Search / Document / BI criteria', () => {
    const gateReport = centralSearchDocumentBIIntegrationValidationService.runFullSearchDocumentBIGate();

    expect(gateReport.globalSearchAndIndexingPassed).toBe(true);
    expect(gateReport.permissionAndTenantSearchFilterPassed).toBe(true);
    expect(gateReport.documentUploadAndVersioningPassed).toBe(true);
    expect(gateReport.crossModuleBIAnalyticsPassed).toBe(true);
    expect(gateReport.exportFormatIntegrityPassed).toBe(true);
    expect(gateReport.crossDomainDataReconciliationPassed).toBe(true);
    expect(gateReport.auditAndPerformancePassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
