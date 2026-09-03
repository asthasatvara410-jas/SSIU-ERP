import { db } from './db';
import { UserAuthorizationContext } from '../types';
import { centralFinanceGovernanceService } from './centralFinanceGovernanceService';

export interface SalaryStructureRecord {
  employeeId: string;
  basicSalary: number;
  hra: number;
  da: number;
  specialAllowance: number;
  providentFund: number;
  professionalTax: number;
  tdsPercentage: number;
}

export interface EmployeePayrollPeriodRecord {
  id: string;
  periodName: string; // e.g. "August 2026"
  year: number;
  month: number;
  status: 'OPEN' | 'PROCESSED' | 'LOCKED';
}

export interface EmployeePayslipRecord {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  lossOfPayDeduction: number;
  status: 'GENERATED' | 'PAID';
}

export interface LeaveBalanceRecord {
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED';
  openingBalance: number;
  accrued: number;
  availed: number;
  availableBalance: number;
}

export interface EmployeeExitSettlementRecord {
  employeeId: string;
  settlementNumber: string;
  resignationDate: string;
  relievingDate: string;
  salaryDues: number;
  leaveEncashment: number;
  pendingLoanDeduction: number;
  netPayableSettlement: number;
  clearanceStatus: 'CLEARED' | 'BLOCKED';
}

class HrEmployeePayrollGovernanceService {
  private static instance: HrEmployeePayrollGovernanceService;

  private salaryStructures: Map<string, SalaryStructureRecord> = new Map([
    [
      'emp-001',
      {
        employeeId: 'emp-001',
        basicSalary: 60000,
        hra: 24000,
        da: 12000,
        specialAllowance: 8000,
        providentFund: 7200,
        professionalTax: 200,
        tdsPercentage: 10
      }
    ]
  ]);

  private leaveBalances: LeaveBalanceRecord[] = [
    { employeeId: 'emp-001', leaveType: 'CASUAL', openingBalance: 12, accrued: 0, availed: 2, availableBalance: 10 },
    { employeeId: 'emp-001', leaveType: 'SICK', openingBalance: 10, accrued: 0, availed: 1, availableBalance: 9 },
    { employeeId: 'emp-001', leaveType: 'EARNED', openingBalance: 30, accrued: 0, availed: 5, availableBalance: 25 }
  ];

  private payslips: EmployeePayslipRecord[] = [];

  private constructor() {}

  public static getInstance(): HrEmployeePayrollGovernanceService {
    if (!HrEmployeePayrollGovernanceService.instance) {
      HrEmployeePayrollGovernanceService.instance = new HrEmployeePayrollGovernanceService();
    }
    return HrEmployeePayrollGovernanceService.instance;
  }

  // ─── SALARY & PAYROLL CALCULATION ENGINE ──────────────────────────────

  public calculateAndGeneratePayslip(params: {
    employeeId: string;
    payrollPeriodId: string;
    unpaidAbsentDays: number;
    daysInMonth: number;
  }): EmployeePayslipRecord {
    // Prevent duplicate payslip in same period
    const existing = this.payslips.find(
      p => p.employeeId === params.employeeId && p.payrollPeriodId === params.payrollPeriodId
    );
    if (existing) {
      throw new Error(`Duplicate Payroll: Payslip for employee ${params.employeeId} already generated for period ${params.payrollPeriodId}`);
    }

    const structure = this.salaryStructures.get(params.employeeId);
    if (!structure) {
      throw new Error(`Salary structure not configured for employee ${params.employeeId}`);
    }

    const grossSalary = structure.basicSalary + structure.hra + structure.da + structure.specialAllowance;

    // Loss of pay calculation from approved attendance LOP
    const perDaySalary = grossSalary / params.daysInMonth;
    const lossOfPayDeduction = Math.round(perDaySalary * params.unpaidAbsentDays);

    const statutoryDeductions = structure.providentFund + structure.professionalTax;
    const taxableGross = Math.max(0, grossSalary - lossOfPayDeduction);
    const tdsAmount = Math.round((taxableGross * structure.tdsPercentage) / 100);

    const totalDeductions = statutoryDeductions + lossOfPayDeduction + tdsAmount;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    const newPayslip: EmployeePayslipRecord = {
      id: `ps-${Date.now()}`,
      payrollPeriodId: params.payrollPeriodId,
      employeeId: params.employeeId,
      grossSalary,
      totalDeductions,
      netSalary,
      lossOfPayDeduction,
      status: 'GENERATED'
    };

    this.payslips.push(newPayslip);
    return newPayslip;
  }

  // ─── LEAVE BALANCE LEDGER ─────────────────────────────────────────────

  public getLeaveBalances(employeeId: string): LeaveBalanceRecord[] {
    return this.leaveBalances.filter(b => b.employeeId === employeeId);
  }

  // ─── FULL & FINAL SETTLEMENT ENGINE ───────────────────────────────────

  public calculateFullAndFinalSettlement(params: {
    employeeId: string;
    resignationDate: string;
    relievingDate: string;
    earnedLeaveDaysAvailable: number;
    outstandingLoanAmount: number;
  }): EmployeeExitSettlementRecord {
    const structure = this.salaryStructures.get(params.employeeId);
    if (!structure) throw new Error(`Salary structure missing for ${params.employeeId}`);

    const monthlyGross = structure.basicSalary + structure.hra + structure.da + structure.specialAllowance;
    const perDayBasic = structure.basicSalary / 30;
    const leaveEncashment = Math.round(perDayBasic * params.earnedLeaveDaysAvailable);
    const salaryDues = monthlyGross; // e.g. final month payable

    const netPayableSettlement = Math.max(0, salaryDues + leaveEncashment - params.outstandingLoanAmount);

    return {
      employeeId: params.employeeId,
      settlementNumber: `FF-SETTLE-${Date.now()}`,
      resignationDate: params.resignationDate,
      relievingDate: params.relievingDate,
      salaryDues,
      leaveEncashment,
      pendingLoanDeduction: params.outstandingLoanAmount,
      netPayableSettlement,
      clearanceStatus: 'CLEARED'
    };
  }
}

export const hrEmployeePayrollGovernanceService = HrEmployeePayrollGovernanceService.getInstance();
