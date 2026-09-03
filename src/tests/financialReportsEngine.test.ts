import { describe, it, expect } from 'vitest';
import { notesheetFinancialReportService } from '../services/notesheetFinancialReportService';

describe('Financial & Fund Accounts Reports Engine', () => {
  it('retrieves initial financial seed records correctly', () => {
    const records = notesheetFinancialReportService.getAllFinancialRecords();
    expect(records.length).toBeGreaterThanOrEqual(5);

    const r1 = records.find(r => r.noteSheetNumber.includes('0001'));
    expect(r1).toBeDefined();
    if (r1) {
      expect(r1.budget).toBe(150000);
      expect(r1.spent).toBe(78000);
      expect(r1.balance).toBe(72000);
      expect(r1.utilization).toBe(52);
    }
  });

  it('creates new financial records with dynamic balance calculations', () => {
    const newRecord = notesheetFinancialReportService.saveFinancialRecord({
      noteSheetNumber: 'SSIU-NS-2026-0099',
      subject: 'Autonomous Robotics & AI Lab Equipment',
      department: 'Computer Science & Engineering',
      creator: 'Prof. J. Patel',
      expenseCategory: 'Equipment & Hardware',
      vendor: 'TechLabs Pvt Ltd',
      paymentMode: 'Bank Transfer',
      fundHead: 'General Fund',
      budget: 500000,
      received: 500000,
      spent: 125000,
      status: 'APPROVED',
      date: '2026-08-20'
    }, 'Finance Officer', 'FINANCE_OFFICER');

    expect(newRecord.balance).toBe(375000);
    expect(newRecord.utilization).toBe(25);
  });

  it('logs audit trail records on record creation', () => {
    const logs = notesheetFinancialReportService.getAllAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(1);
    expect(logs[0].action).toBeDefined();
  });
});
