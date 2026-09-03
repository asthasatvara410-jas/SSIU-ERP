import { describe, it, expect } from 'vitest';
import { hrEmployeePayrollGovernanceService } from '../services/hrEmployeePayrollGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 32: HR & Employee Payroll Management System Engine', () => {

  it('TEST 1: Dynamic Gross & Net Salary Calculation: Correctly computes earnings, statutory deductions, LOP, and TDS', () => {
    const payslip = hrEmployeePayrollGovernanceService.calculateAndGeneratePayslip({
      employeeId: 'emp-001',
      payrollPeriodId: 'period-2026-08',
      unpaidAbsentDays: 2,
      daysInMonth: 31
    });

    expect(payslip.grossSalary).toBe(104000); // 60000 + 24000 + 12000 + 8000
    expect(payslip.lossOfPayDeduction).toBe(6710); // ~ (104000/31) * 2
    expect(payslip.status).toBe('GENERATED');
    expect(payslip.netSalary).toBeGreaterThan(0);
    expect(payslip.netSalary).toBe(payslip.grossSalary - payslip.totalDeductions);
  });

  it('TEST 2: Payroll Duplicate Prevention: Blocks generating duplicate payslips for the same period', () => {
    expect(() => {
      hrEmployeePayrollGovernanceService.calculateAndGeneratePayslip({
        employeeId: 'emp-001',
        payrollPeriodId: 'period-2026-08', // duplicate
        unpaidAbsentDays: 0,
        daysInMonth: 31
      });
    }).toThrow(/Duplicate Payroll/);
  });

  it('TEST 3: Leave Balance Ledger: Retrieves categorized leave balances (Casual, Sick, Earned)', () => {
    const balances = hrEmployeePayrollGovernanceService.getLeaveBalances('emp-001');
    expect(balances.length).toBe(3);
    const casual = balances.find(b => b.leaveType === 'CASUAL');
    expect(casual?.availableBalance).toBe(10);
    expect(casual?.availed).toBe(2);
  });

  it('TEST 4: Full & Final (F&F) Settlement: Computes salary dues, earned leave encashment, and loan recoveries', () => {
    const settlement = hrEmployeePayrollGovernanceService.calculateFullAndFinalSettlement({
      employeeId: 'emp-001',
      resignationDate: '2026-08-01',
      relievingDate: '2026-08-31',
      earnedLeaveDaysAvailable: 25,
      outstandingLoanAmount: 15000
    });

    expect(settlement.salaryDues).toBe(104000);
    expect(settlement.leaveEncashment).toBe(50000); // (60000 / 30) * 25
    expect(settlement.pendingLoanDeduction).toBe(15000);
    expect(settlement.netPayableSettlement).toBe(104000 + 50000 - 15000); // 139000
    expect(settlement.clearanceStatus).toBe('CLEARED');
  });
});
