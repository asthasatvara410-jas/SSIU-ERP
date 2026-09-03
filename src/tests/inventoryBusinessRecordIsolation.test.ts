import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../services/db';
import { inventoryManagementService } from '../services/inventoryManagementService';
import {
  FixedAsset,
  AssetTransferRequestRecord,
  AssetReturnRequestRecord,
  AssetReplacementRequestRecord,
  AssetIssueReportRecord,
  AssetMaintenanceRecord,
  AssetRequestRecord
} from '../types';

describe('Inventory Business Record Isolation & Zero Duplication Suite', () => {
  const deptId = 'dept-test-cs';
  const instId = 'inst-test-sit';

  beforeEach(() => {
    const st = db.getState() as any;

    // Seed 2 distinct Fixed Assets
    const asset1: FixedAsset = {
      id: 'fa-test-01',
      assetTag: 'SIT-CS-PC-001',
      name: 'Dell OptiPlex 7090 Desktop',
      categoryId: 'cat-pc',
      categoryName: 'Computers & Laptops',
      categoryGroup: 'IT_EQUIPMENT',
      instituteId: instId,
      instituteName: 'Swarrnim Institute of Technology',
      departmentId: deptId,
      departmentName: 'Computer Engineering',
      purchaseCost: 65000,
      currentValue: 55000,
      assetCondition: 'EXCELLENT',
      status: 'ASSIGNED_TO_FACULTY',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    };

    const asset2: FixedAsset = {
      id: 'fa-test-02',
      assetTag: 'SIT-CS-MON-002',
      name: 'LG 27-inch 4K IPS Monitor',
      categoryId: 'cat-mon',
      categoryName: 'Peripherals',
      categoryGroup: 'IT_EQUIPMENT',
      instituteId: instId,
      instituteName: 'Swarrnim Institute of Technology',
      departmentId: deptId,
      departmentName: 'Computer Engineering',
      purchaseCost: 28000,
      currentValue: 24000,
      assetCondition: 'GOOD',
      status: 'AVAILABLE',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    };

    st.fixedAssets = [asset1, asset2, ...(st.fixedAssets || [])];

    // Seed 2 distinct Transfer Records
    const transfer1: AssetTransferRequestRecord = {
      id: 'trf-test-01',
      requestNo: 'TRF-2026-900001',
      assetId: asset1.id,
      assetTag: asset1.assetTag,
      assetName: asset1.name,
      departmentId: deptId,
      fromUserId: 'usr-fac-1',
      fromUserName: 'Prof. Amit Patel',
      toUserId: 'usr-fac-2',
      toUserName: 'Prof. Neha Shah',
      reason: 'Lab 3 restructuring',
      status: 'PENDING_HOD',
      requestedDate: '2026-08-20'
    };

    const transfer2: AssetTransferRequestRecord = {
      id: 'trf-test-02',
      requestNo: 'TRF-2026-900002',
      assetId: asset2.id,
      assetTag: asset2.assetTag,
      assetName: asset2.name,
      departmentId: deptId,
      fromUserId: 'usr-fac-3',
      fromUserName: 'Prof. Rahul Joshi',
      toUserId: 'usr-fac-1',
      toUserName: 'Prof. Amit Patel',
      reason: 'Dual display workstation setup',
      status: 'APPROVED',
      requestedDate: '2026-08-21'
    };

    st.assetTransferRequests = [transfer1, transfer2];

    // Seed 2 distinct Return Records
    const return1: AssetReturnRequestRecord = {
      id: 'ret-test-01',
      requestNo: 'RET-2026-900001',
      assetId: asset1.id,
      assetTag: asset1.assetTag,
      assetName: asset1.name,
      departmentId: deptId,
      requestedByUserId: 'usr-fac-1',
      requestedByName: 'Prof. Amit Patel',
      returnReason: 'Semester project completed',
      conditionAtReturn: 'EXCELLENT',
      status: 'PENDING_INSPECTION',
      requestedDate: '2026-08-22'
    };

    const return2: AssetReturnRequestRecord = {
      id: 'ret-test-02',
      requestNo: 'RET-2026-900002',
      assetId: asset2.id,
      assetTag: asset2.assetTag,
      assetName: asset2.name,
      departmentId: deptId,
      requestedByUserId: 'usr-fac-2',
      requestedByName: 'Prof. Neha Shah',
      returnReason: 'Surplus hardware return to departmental depot',
      conditionAtReturn: 'GOOD',
      status: 'ACCEPTED_INTO_STORE',
      requestedDate: '2026-08-23'
    };

    st.assetReturnRequests = [return1, return2];

    // Seed 2 distinct Replacement Records
    const replacement1: AssetReplacementRequestRecord = {
      id: 'rep-test-01',
      requestNo: 'RMA-2026-900001',
      assetId: asset1.id,
      assetTag: asset1.assetTag,
      assetName: asset1.name,
      departmentId: deptId,
      requestedByUserId: 'usr-fac-1',
      requestedByName: 'Prof. Amit Patel',
      reason: 'SMPS power failure during boot',
      problemDescription: 'System turns off automatically after 5 minutes of operation',
      currentCondition: 'DAMAGED',
      priority: 'HIGH',
      status: 'PENDING_HOD',
      requestedDate: '2026-08-24'
    };

    const replacement2: AssetReplacementRequestRecord = {
      id: 'rep-test-02',
      requestNo: 'RMA-2026-900002',
      assetId: asset2.id,
      assetTag: asset2.assetTag,
      assetName: asset2.name,
      departmentId: deptId,
      requestedByUserId: 'usr-fac-3',
      requestedByName: 'Prof. Rahul Joshi',
      reason: 'Horizontal vertical display lines defect',
      problemDescription: 'Display panel has green flickering vertical lines',
      currentCondition: 'POOR',
      priority: 'MEDIUM',
      status: 'ESCALATED_TO_HOI',
      requestedDate: '2026-08-25'
    };

    st.assetReplacementRequests = [replacement1, replacement2];

    // Seed 2 distinct Issue Records
    const issue1: AssetIssueReportRecord = {
      id: 'iss-test-01',
      reportNo: 'ISS-2026-900001',
      assetId: asset1.id,
      assetTag: asset1.assetTag,
      assetName: asset1.name,
      departmentId: deptId,
      reportedByUserId: 'usr-fac-1',
      reportedByName: 'Prof. Amit Patel',
      issueType: 'HARDWARE_MALFUNCTION',
      severity: 'CRITICAL',
      description: 'CPU Fan making loud buzzing noise and overheating',
      status: 'REPORTED',
      reportedDate: '2026-08-26'
    };

    const issue2: AssetIssueReportRecord = {
      id: 'iss-test-02',
      reportNo: 'ISS-2026-900002',
      assetId: asset2.id,
      assetTag: asset2.assetTag,
      assetName: asset2.name,
      departmentId: deptId,
      reportedByUserId: 'usr-fac-2',
      reportedByName: 'Prof. Neha Shah',
      issueType: 'PHYSICAL_DAMAGE',
      severity: 'MODERATE',
      description: 'Display stand hinge loose',
      status: 'UNDER_REVIEW',
      reportedDate: '2026-08-27'
    };

    st.assetIssueReports = [issue1, issue2];

    // Seed 2 distinct Maintenance Records
    const maintenance1: AssetMaintenanceRecord = {
      id: 'mnt-test-01',
      maintenanceNo: 'MNT-2026-900001',
      assetId: asset1.id,
      assetTag: asset1.assetTag,
      assetName: asset1.name,
      departmentId: deptId,
      issueDescription: 'Replaced CPU cooling fan and reapplied thermal paste',
      maintenanceType: 'CORRECTIVE',
      vendorTechnician: 'Dell Onsite Care',
      estimatedCost: 1500,
      actualCost: 1400,
      status: 'COMPLETED',
      completedDate: '2026-08-27'
    } as any;

    const maintenance2: AssetMaintenanceRecord = {
      id: 'mnt-test-02',
      maintenanceNo: 'MNT-2026-900002',
      assetId: asset2.id,
      assetTag: asset2.assetTag,
      assetName: asset2.name,
      departmentId: deptId,
      issueDescription: 'Quarterly monitor color calibration and firmware update',
      maintenanceType: 'PREVENTIVE',
      vendorTechnician: 'Internal IT Staff',
      estimatedCost: 0,
      actualCost: 0,
      status: 'SCHEDULED',
      scheduledDate: '2026-08-30'
    } as any;

    st.assetMaintenanceLogs = [maintenance1, maintenance2];

    // Seed 2 distinct Requisition Records
    const req1: AssetRequestRecord = {
      id: 'req-test-01',
      requestNo: 'REQ-2026-900001',
      requestedByUserId: 'usr-fac-1',
      requestedByName: 'Prof. Amit Patel',
      departmentId: deptId,
      departmentName: 'Computer Engineering',
      assetNameRequirement: 'GPU Workstation for AI Lab',
      categoryId: 'cat-gpu',
      categoryName: 'High Performance Computing',
      quantity: 5,
      purpose: 'Deep Learning & Neural Networks Practical Session',
      requiredFromDate: '2026-09-01',
      priority: 'HIGH',
      status: 'PENDING_HOD_APPROVAL',
      createdAt: '2026-08-28'
    };

    const req2: AssetRequestRecord = {
      id: 'req-test-02',
      requestNo: 'REQ-2026-900002',
      requestedByUserId: 'usr-fac-2',
      requestedByName: 'Prof. Neha Shah',
      departmentId: deptId,
      departmentName: 'Computer Engineering',
      assetNameRequirement: 'Cisco 24-Port Gigabit Managed Switch',
      categoryId: 'cat-net',
      categoryName: 'Networking Equipment',
      quantity: 2,
      purpose: 'Computer Networks Lab 4 upgrade',
      requiredFromDate: '2026-09-05',
      priority: 'MEDIUM',
      status: 'APPROVED_BY_HOD',
      createdAt: '2026-08-28'
    };

    st.assetRequisitions = [req1, req2];

    db.saveState();
  });

  it('1. Transfers tab queries strictly return AssetTransferRequestRecord[] with no overlap', () => {
    const transfers = inventoryManagementService.getAssetTransfers({ departmentId: deptId });
    expect(transfers.length).toBe(2);
    expect(transfers[0].id).toBe('trf-test-01');
    expect(transfers[0].requestNo).toBe('TRF-2026-900001');
    expect(transfers[0]).toHaveProperty('fromUserName');
    expect(transfers[0]).toHaveProperty('toUserName');
    // Ensure it is NOT a raw FixedAsset
    expect(transfers[0]).not.toHaveProperty('purchaseCost');
  });

  it('2. Returns tab queries strictly return AssetReturnRequestRecord[] with no overlap', () => {
    const returns = inventoryManagementService.getAssetReturns({ departmentId: deptId });
    expect(returns.length).toBe(2);
    expect(returns[0].id).toBe('ret-test-01');
    expect(returns[0].requestNo).toBe('RET-2026-900001');
    expect(returns[0]).toHaveProperty('returnReason');
    expect(returns[0]).toHaveProperty('conditionAtReturn');
  });

  it('3. Replacements tab queries strictly return AssetReplacementRequestRecord[] with no overlap', () => {
    const replacements = inventoryManagementService.getAssetReplacements({ departmentId: deptId });
    expect(replacements.length).toBe(2);
    expect(replacements[0].id).toBe('rep-test-01');
    expect(replacements[0].requestNo).toBe('RMA-2026-900001');
    expect(replacements[0]).toHaveProperty('problemDescription');
  });

  it('4. Issues tab queries strictly return AssetIssueReportRecord[] with no overlap', () => {
    const issues = inventoryManagementService.getAssetIssues({ departmentId: deptId });
    expect(issues.length).toBe(2);
    expect(issues[0].id).toBe('iss-test-01');
    expect(issues[0].reportNo).toBe('ISS-2026-900001');
    expect(issues[0]).toHaveProperty('severity');
    expect(issues[0]).toHaveProperty('issueType');
  });

  it('5. Maintenance tab queries strictly return AssetMaintenanceRecord[] with no overlap', () => {
    const maintenance = inventoryManagementService.getAssetMaintenanceRecords({ departmentId: deptId });
    expect(maintenance.length).toBe(2);
    expect(maintenance[0].id).toBe('mnt-test-01');
    expect(maintenance[0].maintenanceNo).toBe('MNT-2026-900001');
    expect(maintenance[0]).toHaveProperty('vendorTechnician');
  });

  it('6. Requisitions tab queries strictly return AssetRequestRecord[] with no overlap', () => {
    const requisitions = inventoryManagementService.getAssetRequisitions({ departmentId: deptId });
    expect(requisitions.length).toBe(2);
    expect(requisitions[0].id).toBe('req-test-01');
    expect(requisitions[0].requestNo).toBe('REQ-2026-900001');
    expect(requisitions[0]).toHaveProperty('assetNameRequirement');
    expect(requisitions[0]).toHaveProperty('quantity');
  });

  it('7. Department Assets query strictly returns FixedAsset[] without duplicating transaction tables', () => {
    const assets = inventoryManagementService.getDepartmentAssets({ departmentId: deptId });
    expect(assets.length).toBeGreaterThanOrEqual(2);
    expect(assets[0]).toHaveProperty('assetTag');
    expect(assets[0]).toHaveProperty('purchaseCost');
  });

  it('8. Zero fallback guarantee: empty queries return [] and never return generic assets', () => {
    const emptyTransfers = inventoryManagementService.getAssetTransfers({ departmentId: 'non-existent-dept' });
    expect(emptyTransfers).toEqual([]);
    expect(emptyTransfers.length).toBe(0);

    const emptyReturns = inventoryManagementService.getAssetReturns({ departmentId: 'non-existent-dept' });
    expect(emptyReturns).toEqual([]);

    const emptyReplacements = inventoryManagementService.getAssetReplacements({ departmentId: 'non-existent-dept' });
    expect(emptyReplacements).toEqual([]);

    const emptyIssues = inventoryManagementService.getAssetIssues({ departmentId: 'non-existent-dept' });
    expect(emptyIssues).toEqual([]);
  });
});
