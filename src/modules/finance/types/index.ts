/**
 * SSIU ERP — Institutional Finance Governance Domain Types
 * File: src/modules/finance/types/index.ts
 */

export interface InstitutionalFinanceSummaryDTO {
  totalBudgetAllocatedLakhs: number;
  totalActualExpenditureLakhs: number;
  budgetUtilizationPercentage: number;
  totalFeeRevenueRealizedLakhs: number;
  operationalVarianceLakhs: number;
  varianceStatus: 'FAVORABLE' | 'ON_TRACK' | 'DEFICIT';
  instituteFinancials: Array<{
    instituteId: string;
    instituteName: string;
    allocatedBudgetLakhs: number;
    expenditureLakhs: number;
    feeRevenueLakhs: number;
    utilizationRate: number;
  }>;
}

export interface DepartmentCostCenterDTO {
  costCenterCode: string;
  departmentId: string;
  departmentName: string;
  instituteName: string;
  headOfDepartment: string;
  budgetCapLakhs: number;
  expensesIncurredLakhs: number;
  committedPurchaseOrdersLakhs: number;
  uncommittedBalanceLakhs: number;
  costCenterStatus: 'HEALTHY' | 'ALERT_75' | 'EXHAUSTED';
}

export interface RevenueReconciliationStreamDTO {
  streamId: string;
  streamName: string;
  category: 'STUDENT_FEES' | 'EXAM_FEES' | 'HOSTEL_MESS' | 'RESEARCH_GRANTS' | 'INCUBATION_CONSULTING';
  projectedRevenueLakhs: number;
  realizedRevenueLakhs: number;
  collectionProgress: number; // 0 - 100%
  fiscalQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}
