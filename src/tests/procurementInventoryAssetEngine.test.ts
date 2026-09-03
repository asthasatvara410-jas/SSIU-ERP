import { describe, it, expect } from 'vitest';
import { procurementInventoryAssetGovernanceService } from '../services/procurementInventoryAssetGovernanceService';
import { UserAuthorizationContext } from '../types';

describe('SSIU ERP – Phase 28: Procurement + Inventory + Asset Management Engine', () => {

  it('TEST 1: Stock Movement & Overdraw Prevention: Issues inventory stock and blocks negative stock transactions', () => {
    const updatedStock = procurementInventoryAssetGovernanceService.issueStock({
      storeId: 'store-central',
      itemId: 'itm-02',
      quantity: 30,
      departmentId: 'dept-1'
    });

    expect(updatedStock.currentStock).toBe(120);
    expect(updatedStock.availableStock).toBe(120);

    // Overdraw attempt
    expect(() => {
      procurementInventoryAssetGovernanceService.issueStock({
        storeId: 'store-central',
        itemId: 'itm-02',
        quantity: 500, // exceeds 120
        departmentId: 'dept-1'
      });
    }).toThrow(/Insufficient stock/);
  });

  it('TEST 2: Asset Custodian & Location Lineage: Updates custodian and location while maintaining single active custody', () => {
    const updatedAsset = procurementInventoryAssetGovernanceService.reallocateAsset({
      assetNumber: 'ASSET-2026-000412',
      newDepartmentId: 'dept-1',
      newLocation: 'CSE Dept - AI Research Lab 301',
      newCustodianEmployeeId: 'emp-fac-02'
    });

    expect(updatedAsset.currentLocation).toBe('CSE Dept - AI Research Lab 301');
    expect(updatedAsset.currentCustodianEmployeeId).toBe('emp-fac-02');
    expect(updatedAsset.status).toBe('ALLOCATED');
  });

  it('TEST 3: Comparative Statement Evaluation: Retains multi-vendor quotations, warranty, and selection justification', () => {
    const cs = procurementInventoryAssetGovernanceService.getComparativeStatement('cs-2026-01');
    expect(cs).toBeDefined();
    expect(cs?.quotations.length).toBe(3);
    expect(cs?.selectedVendorId).toBe('ven-01');
    expect(cs?.justification).toContain('Lowest compliant bid');
  });
});
