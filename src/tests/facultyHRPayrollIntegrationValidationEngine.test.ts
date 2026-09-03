import { describe, it, expect } from 'vitest';
import { centralFacultyHRPayrollIntegrationValidationService } from '../services/centralFacultyHRPayrollIntegrationValidationService';

describe('SSIU ERP – Phase 40.5: Faculty / HR / Payroll End-to-End Integration Validation Gate Engine', () => {

  it('TEST 1: Salary Structure & Payroll Calculation: Computes gross, statutory deductions, and net salary accurately', () => {
    const salary = centralFacultyHRPayrollIntegrationValidationService.calculateNetSalary({
      basic: 75000,
      da: 37500,
      hra: 18000,
      pf: 9000,
      tax: 6500,
      lopDays: 0,
      perDayRate: 4350
    });

    expect(salary.grossSalary).toBe(130500);
    expect(salary.totalDeductions).toBe(15500);
    expect(salary.netSalary).toBe(115000);
  });

  it('TEST 2: Final Settlement & Exit Calculations: Calculates pending salary, leave encashment, and deductions', () => {
    const settlement = centralFacultyHRPayrollIntegrationValidationService.calculateFinalSettlement({
      pendingSalary: 115000,
      leaveEncashmentDays: 10,
      perDayRate: 3833,
      pendingDues: 0,
      noticeShortfallDeduction: 0
    });

    expect(settlement.settlementAmount).toBe(153330);
    expect(settlement.isSettled).toBe(true);
  });

  it('TEST 3: Complete 22-Step Faculty 360 Institutional Journey: Verifies unbroken integration across Workload, Payroll, Promotion & Exit', () => {
    const faculty360 = centralFacultyHRPayrollIntegrationValidationService.runCompleteFacultyHRPayrollLifecycle();

    expect(faculty360.employee_id).toBe('EMP-FAC-001');
    expect(faculty360.role).toBe('HOD');
    expect(faculty360.workload_hours_per_week).toBe(12);
    expect(faculty360.salary_structure.net_salary).toBe(115000);
    expect(faculty360.performance_score).toBe(4.8);
    expect(faculty360.is_system_access_active).toBe(false); // Revoked upon exit
    expect(faculty360.exit_documents_issued.length).toBe(3);
    expect(faculty360.employment_status).toBe('EXITED');
  });

  it('TEST 4: Phase 40.5 Final Gate Execution: Confirms green status across all 72 Faculty / HR / Payroll criteria', () => {
    const gateReport = centralFacultyHRPayrollIntegrationValidationService.runFullFacultyHRPayrollGate();

    expect(gateReport.employeeCreationAndUniquenessPassed).toBe(true);
    expect(gateReport.departmentAndReportingHierarchyPassed).toBe(true);
    expect(gateReport.rbacAndPrivilegeIsolationPassed).toBe(true);
    expect(gateReport.workloadAndSubstitutionPassed).toBe(true);
    expect(gateReport.leaveManagementAndBalancesPassed).toBe(true);
    expect(gateReport.payrollCalculationAndLockPassed).toBe(true);
    expect(gateReport.financeAndBankBatchReconciliationPassed).toBe(true);
    expect(gateReport.performanceAndPromotionPassed).toBe(true);
    expect(gateReport.resignationSettlementAndAccessRevocationPassed).toBe(true);
    expect(gateReport.faculty360ReconciliationPassed).toBe(true);
    expect(gateReport.overallGateStatus).toBe('PASS');
  });
});
