import { describe, it, expect } from 'vitest';
import { centralEnterpriseReportingBIService } from '../services/centralEnterpriseReportingBIService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 13.45: Enterprise Reporting, Business Intelligence & KPI Engine', () => {

  const departmentHod: UserAuthorizationContext = {
    userId: 'emp-hod-ce-001',
    userName: 'Head of Department (Computer Engineering)',
    email: 'hod.ce@swarrnim.edu.in',
    activeRole: 'HOD',
    assignedRoles: ['HOD', 'FACULTY'],
    permissions: ['REPORT_VIEW', 'STUDENT_VIEW', 'ATTENDANCE_VIEW']
  };

  const executiveDean: UserAuthorizationContext = {
    userId: 'emp-dean-exec-001',
    userName: 'Dean of Academic & Institutional Governance',
    email: 'dean@swarrnim.edu.in',
    activeRole: 'DEAN',
    assignedRoles: ['DEAN', 'REGISTRAR'],
    permissions: [
      'REPORT_VIEW',
      'STUDENT_VIEW',
      'ATTENDANCE_VIEW',
      'FINANCE_AUDIT_VIEW',
      'EXECUTIVE_BI_VIEW'
    ]
  };

  it('TEST 1: Governed Metrics & Single Source of Truth KPI: Consistently evaluates thresholds across dashboards', () => {
    // 1. Target 85% - Value 88% -> GOOD
    const goodStatus = centralEnterpriseReportingBIService.evaluateKPI('KPI-CAMPUS-ATTENDANCE', 88.0);
    expect(goodStatus).toBe('GOOD');

    // 2. Value 72% -> WARNING (Amber)
    const warnStatus = centralEnterpriseReportingBIService.evaluateKPI('KPI-CAMPUS-ATTENDANCE', 72.0);
    expect(warnStatus).toBe('WARNING');

    // 3. Value 55% -> CRITICAL (Red)
    const critStatus = centralEnterpriseReportingBIService.evaluateKPI('KPI-CAMPUS-ATTENDANCE', 55.0);
    expect(critStatus).toBe('CRITICAL');
  });

  it('TEST 2: Row-Level Security: Department Head receives strictly own department rows while Dean receives consolidated view', () => {
    // 1. Department HOD executes report -> restricted to Computer Engineering (2 rows)
    const hodExec = centralEnterpriseReportingBIService.executeReport({
      reportCode: 'RPT-2026-000001',
      context: departmentHod
    });

    expect(hodExec.total_rows).toBe(2);
    expect(hodExec.data.every(r => r.department === 'dept-ce')).toBe(true);

    // 2. Executive Dean executes same report -> receives all university departments (3 rows)
    const deanExec = centralEnterpriseReportingBIService.executeReport({
      reportCode: 'RPT-2026-000001',
      context: executiveDean
    });

    expect(deanExec.total_rows).toBe(3);
    expect(deanExec.data.some(r => r.department === 'dept-me')).toBe(true);
  });

  it('TEST 3: Report Permission Gate: Blocks unauthorized access to restricted executive financial reports', () => {
    // HOD lacks FINANCE_AUDIT_VIEW permission
    expect(() => {
      centralEnterpriseReportingBIService.executeReport({
        reportCode: 'RPT-2026-000002',
        context: departmentHod
      });
    }).toThrow(/Report Access Denied: Missing required permission FINANCE_AUDIT_VIEW/);

    // Executive Dean has permission
    const deanFinance = centralEnterpriseReportingBIService.executeReport({
      reportCode: 'RPT-2026-000002',
      context: executiveDean
    });
    expect(deanFinance.total_rows).toBeGreaterThanOrEqual(1);
  });

  it('TEST 4: Drill-Down Analytics & Multi-Format Exports: Delivers drill breakdown and secure file export manifests', () => {
    // 1. Drill-down
    const drillData = centralEnterpriseReportingBIService.drillDownToDepartment('campus-main', executiveDean);
    expect(drillData.length).toBe(3);
    expect(drillData[0].department).toBe('Computer Engineering');

    // 2. Export to Excel
    const exportRes = centralEnterpriseReportingBIService.exportReport({
      reportCode: 'RPT-2026-000001',
      format: 'EXCEL',
      context: departmentHod
    });

    expect(exportRes.download_ready).toBe(true);
    expect(exportRes.file_name).toContain('.excel');
    expect(exportRes.row_count).toBe(2); // strictly matches row-level security
  });

  it('TEST 5: Reporting & BI Dashboard Telemetry: Validates catalog reports, active datasets, and reporting posture', () => {
    const metrics = centralEnterpriseReportingBIService.getReportingBIDashboardMetrics(executiveDean);

    expect(metrics.totalCatalogReportsCount).toBeGreaterThanOrEqual(2);
    expect(metrics.activeDatasetsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.governedKPIsCount).toBeGreaterThanOrEqual(1);
    expect(metrics.averageQueryLatencyMs).toBeLessThan(50);
    expect(metrics.reportingPosture).toBe('HEALTHY');
  });
});
