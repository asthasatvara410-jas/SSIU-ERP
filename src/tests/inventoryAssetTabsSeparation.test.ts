import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { User } from '../types';

describe('Inventory & Asset Management — Tab Data Separation Architecture', () => {
  const hodUser: User = {
    id: 'user-hod-1',
    name: 'Prof. Rajesh Patel (HOD)',
    email: 'hod.ce@ssit.edu.in',
    role: 'HOD',
    departmentId: 'dept-1',
    instituteId: 'inst-sit'
  };

  const otherDeptHod: User = {
    id: 'user-hod-2',
    name: 'Prof. Mechanical HOD',
    email: 'hod.me@ssit.edu.in',
    role: 'HOD',
    departmentId: 'dept-2',
    instituteId: 'inst-sit'
  };

  beforeEach(() => {
    db.resetToDefaultSeed();
  });

  it('1. Retrieves department assets independently for DEPT_REGISTER tab', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.departmentAssets).toBeDefined();
    expect(data.departmentAssets.length).toBe(3);
    
    // Check exact tags for CE department
    const tags = data.departmentAssets.map(a => a.assetTag);
    expect(tags).toContain('SIT-CE-PC-0001');
    expect(tags).toContain('SIT-CE-MON-0001');
    expect(tags).toContain('SIT-CE-SRV-0001');

    expect(data.totalAssetsCount).toBe(3);
  });

  it('2. Retrieves department asset requisitions for ASSET_REQUISITIONS tab', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.allDepartmentRequisitions).toBeDefined();
    expect(data.allDepartmentRequisitions.length).toBe(2);

    const reqNumbers = data.allDepartmentRequisitions.map(r => r.requestNo);
    expect(reqNumbers).toContain('REQ-2026-000001');
    expect(reqNumbers).toContain('REQ-2026-000002');

    expect(data.pendingAssetRequisitions.length).toBe(1);
    expect(data.pendingAssetRequisitions[0].requestNo).toBe('REQ-2026-000001');
  });

  it('3. Retrieves department transfer requests for TRANSFER_APPROVALS tab', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.allDepartmentTransfers).toBeDefined();
    expect(data.allDepartmentTransfers.length).toBe(1);

    const transfer = data.allDepartmentTransfers[0];
    expect(transfer.requestNo).toBe('TRQ-2026-000001');
    expect(transfer.assetTag).toBe('SIT-CE-MON-0001');
    expect(transfer.fromUserName).toBe('Dr. Aarav Mehta');
    expect(transfer.toUserName).toBe('Prof. J. Patel');
    expect(transfer.status).toBe('PENDING_HOD');

    expect(data.pendingTransferRequests.length).toBe(1);
  });

  it('4. Retrieves department return requests for RETURN_INSPECTIONS tab', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.allDepartmentReturns).toBeDefined();
    expect(data.allDepartmentReturns.length).toBe(1);

    const returnReq = data.allDepartmentReturns[0];
    expect(returnReq.requestNo).toBe('RTQ-2026-000001');
    expect(returnReq.assetTag).toBe('SIT-CE-DSK-0012');
    expect(returnReq.requestedByName).toBe('Dr. Aarav Mehta');
    expect(returnReq.status).toBe('PENDING_INSPECTION');

    expect(data.pendingReturnRequests.length).toBe(1);
  });

  it('5. Retrieves 0 pending replacements for HOD in REPLACEMENT_REVIEWS tab (since RPQ-2026-000001 is escalated to HOI)', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.pendingReplacementRequests).toBeDefined();
    expect(data.pendingReplacementRequests.length).toBe(0); // 0 pending for HOD review
    expect(data.allDepartmentReplacements.length).toBe(1); // 1 total in dept history
    expect(data.allDepartmentReplacements[0].status).toBe('ESCALATED_TO_HOI');
  });

  it('6. Retrieves department issue reports for ISSUE_REPORTS tab', () => {
    const data = inventoryManagementService.getHODDashboardData(hodUser);
    expect(data.allDepartmentIssues).toBeDefined();
    expect(data.allDepartmentIssues.length).toBe(1);

    const issue = data.allDepartmentIssues[0];
    expect(issue.reportNo).toBe('ISR-2026-000001');
    expect(issue.assetTag).toBe('SIT-CE-PRN-0002');
    expect(issue.reportedByName).toBe('Dr. Aarav Mehta');
    expect(issue.status).toBe('UNDER_REVIEW');

    expect(data.activeIssueReports.length).toBe(1);
  });

  it('7. Enforces strict department scoping — other departments do not see CE records', () => {
    const otherData = inventoryManagementService.getHODDashboardData(otherDeptHod);
    expect(otherData.departmentAssets.length).toBe(0);
    expect(otherData.allDepartmentRequisitions.length).toBe(0);
    expect(otherData.allDepartmentTransfers.length).toBe(0);
    expect(otherData.allDepartmentReturns.length).toBe(0);
    expect(otherData.allDepartmentReplacements.length).toBe(0);
    expect(otherData.allDepartmentIssues.length).toBe(0);
  });

  it('8. Verifies HOD transfer approval workflow and state update', () => {
    const result = inventoryManagementService.reviewTransferRequest(
      'trq-001',
      true,
      'Approved for semester lab work',
      hodUser
    );
    expect(result.status).toBe('APPROVED');

    const updatedData = inventoryManagementService.getHODDashboardData(hodUser);
    expect(updatedData.pendingTransferRequests.length).toBe(0);
    expect(updatedData.allDepartmentTransfers.length).toBe(1);
    expect(updatedData.allDepartmentTransfers[0].status).toBe('APPROVED');
  });

  it('9. Verifies HOD return acceptance workflow and state update', () => {
    const result = inventoryManagementService.acceptReturnRequest(
      'rtq-001',
      'GOOD',
      'Inspected and cleaned in Room A-204',
      hodUser
    );
    expect(result.status).toBe('ACCEPTED');

    const updatedData = inventoryManagementService.getHODDashboardData(hodUser);
    expect(updatedData.pendingReturnRequests.length).toBe(0);
    expect(updatedData.allDepartmentReturns.length).toBe(1);
    expect(updatedData.allDepartmentReturns[0].status).toBe('ACCEPTED');
  });

  it('10. Verifies HOD issue resolution workflow and state update', () => {
    const result = inventoryManagementService.resolveIssueReport(
      'isr-001',
      'RESOLVED',
      'Roller replaced by OEM maintenance team',
      hodUser
    );
    expect(result.status).toBe('RESOLVED');

    const updatedData = inventoryManagementService.getHODDashboardData(hodUser);
    expect(updatedData.activeIssueReports.length).toBe(0);
    expect(updatedData.allDepartmentIssues.length).toBe(1);
    expect(updatedData.allDepartmentIssues[0].status).toBe('RESOLVED');
  });
});
