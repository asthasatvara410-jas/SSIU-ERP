import { describe, it, expect } from 'vitest';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { db } from '../services/db';

describe('University Inventory & Asset Management System', () => {
  it('calculates dynamic KPI statistics and category group breakdowns', () => {
    const kpis = inventoryManagementService.getDashboardKPIs();
    expect(kpis.totalFixedAssets).toBeGreaterThanOrEqual(1);
    expect(kpis.totalBookValue).toBeGreaterThan(0);
    expect(kpis.categorySummaries.length).toBe(6);

    const itCat = kpis.categorySummaries.find(c => c.key === 'IT_EQUIPMENT');
    expect(itCat).toBeDefined();
    expect(itCat?.quantity).toBeGreaterThanOrEqual(1);
  });

  it('creates and registers a new fixed asset with automatic tag and book value calculation', () => {
    const tag = inventoryManagementService.generateAssetTag('CE', 'PC');
    expect(tag).toMatch(/^SIT-CE-PC-\d{4}$/);

    const asset = inventoryManagementService.createFixedAsset({
      name: 'NVIDIA RTX 4090 GPU Workstation',
      assetTag: tag,
      categoryGroup: 'IT_EQUIPMENT',
      categoryName: 'IT & Computing',
      purchaseCost: 250000,
      usefulLifeYears: 5,
      depreciationRate: 20,
      purchaseDate: '2026-08-01',
      building: 'Main Academic Block',
      roomNo: 'AI Lab 301'
    });

    expect(asset.id).toBeDefined();
    expect(asset.assetTag).toBe(tag);
    expect(asset.purchaseCost).toBe(250000);
    expect(asset.currentValue).toBe(250000);
    expect(['AVAILABLE', 'IN_STORE']).toContain(asset.status);

    const qr = inventoryManagementService.getQrCodePayload(asset);
    expect(qr).toContain('Swarrnim Startup & Innovation University');
    expect(qr).toContain(tag);
  });

  it('executes asset assignment and return lifecycle correctly', () => {
    const assets = db.getFixedAssets();
    const targetAsset = assets[0];

    const assignment = inventoryManagementService.assignAsset({
      assetId: targetAsset.id,
      assignedToName: 'Dr. Rajesh Sharma',
      assignedToEmpCode: 'EMP-CE-001',
      assignedToDesignation: 'Professor & HOD',
      purpose: 'Lab Research'
    });

    expect(assignment.id).toBeDefined();
    expect(assignment.assignedToName).toBe('Dr. Rajesh Sharma');

    const updatedAsset = db.getFixedAssetById(targetAsset.id);
    expect(['ASSIGNED', 'ASSIGNED_TO_FACULTY']).toContain(updatedAsset?.status);
    expect(updatedAsset?.assignedToName).toBe('Dr. Rajesh Sharma');

    // Test Return
    const returned = inventoryManagementService.returnAsset({
      assetId: targetAsset.id,
      conditionAtReturn: 'GOOD',
      remarks: 'Returned in working condition'
    });

    expect(['IN_STORE', 'ASSIGNED_TO_HOD', 'AVAILABLE']).toContain(returned.status);
    expect(returned.assignedToName).toBeUndefined();
  });

  it('executes consumable stock transactions with accurate balance calculations', () => {
    const consumables = db.getConsumables();
    const item = consumables[0];
    const initialBalance = item.currentBalance || 0;

    // Receive 20 units
    const txReceive = inventoryManagementService.receiveConsumableStock({
      itemId: item.id,
      quantity: 20,
      vendorName: 'Stationery Supplier Ltd'
    });

    expect(txReceive.transactionNo).toBeDefined();
    const afterReceive = db.getConsumables().find(c => c.id === item.id);
    expect(afterReceive?.currentBalance).toBe(initialBalance + 20);

    // Issue 5 units
    const txIssue = inventoryManagementService.issueConsumableStock({
      itemId: item.id,
      quantity: 5,
      issuedToName: 'Prof. J. Patel',
      purpose: 'Course practicals'
    });

    expect(txIssue.transactionNo).toBeDefined();
    const afterIssue = db.getConsumables().find(c => c.id === item.id);
    expect(afterIssue?.currentBalance).toBe(initialBalance + 20 - 5);
  });

  it('logs maintenance and physical verification records', () => {
    const assets = db.getFixedAssets();
    const targetAsset = assets[0];

    const maint = inventoryManagementService.recordMaintenance({
      assetId: targetAsset.id,
      issueDescription: 'Fan replacement and cleaning',
      estimatedCost: 1200
    });
    expect(maint.id).toBeDefined();
    expect(maint.status).toBe('IN_PROGRESS');

    const ver = inventoryManagementService.recordPhysicalVerification({
      assetId: targetAsset.id,
      physicalCondition: 'GOOD',
      verificationStatus: 'VERIFIED',
      verifiedByName: 'Annual Audit Committee'
    });
    expect(ver.status).toBe('VERIFIED');
  });

  it('handles non-destructive asset disposal archival', () => {
    const assets = db.getFixedAssets();
    const targetAsset = assets[0];

    const disposal = inventoryManagementService.recordDisposal({
      assetId: targetAsset.id,
      reason: 'Obsolete technology',
      disposalMethod: 'E_WASTE_AUCTION',
      approvalAuthority: 'University Disposal Committee',
      scrapValueRealized: 1500
    });

    expect(disposal.id).toBeDefined();
    expect(disposal.status).toBe('DISPOSED');

    const disposedAsset = db.getFixedAssetById(targetAsset.id);
    expect(disposedAsset?.status).toBe('DISPOSED');
  });
});
