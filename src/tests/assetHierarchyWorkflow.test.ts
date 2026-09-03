import { describe, it, expect } from 'vitest';
import { inventoryManagementService } from '../services/inventoryManagementService';
import { db } from '../services/db';
import { User } from '../types';

describe('Official Asset Management Hierarchy, Requisitions & Quick Actions Workflow Suite', () => {
  const mockCentralAdmin: User = {
    id: 'user-admin-1',
    username: 'admin',
    name: 'Registrar / Central Store Officer',
    email: 'registrar@swarrnim.edu.in',
    role: 'SUPER_ADMIN',
    instituteId: 'inst-sit',
    status: 'ACTIVE'
  };

  const mockHOI: User = {
    id: 'user-principal-1',
    username: 'principal',
    name: 'Dr. Sanjay Sharma',
    email: 'principal.sit@swarrnim.edu.in',
    role: 'PRINCIPAL',
    instituteId: 'inst-sit',
    instituteName: 'Swarrnim Institute of Technology',
    designation: 'Principal & HOI',
    status: 'ACTIVE'
  };

  const mockHOD: User = {
    id: 'user-hod-1',
    username: 'hod_ce',
    name: 'Prof. Rajesh Patel',
    email: 'hod.ce@swarrnim.edu.in',
    role: 'HOD',
    instituteId: 'inst-sit',
    instituteName: 'Swarrnim Institute of Technology',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    designation: 'Head of Department',
    status: 'ACTIVE'
  };

  const mockFacultyA: User = {
    id: 'fac-3',
    username: 'dr_aarav',
    name: 'Dr. Aarav Mehta',
    email: 'aarav.mehta@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    designation: 'Professor & Lab Incharge',
    status: 'ACTIVE'
  };

  const mockFacultyB: User = {
    id: 'fac-1',
    username: 'prof_j_patel',
    name: 'Prof. J. Patel',
    email: 'j.patel@swarrnim.edu.in',
    role: 'FACULTY',
    instituteId: 'inst-sit',
    departmentId: 'dept-1',
    departmentName: 'Computer Engineering',
    designation: 'Assistant Professor',
    status: 'ACTIVE'
  };

  it('1. Receive Stock (Quick Action 1): Inwards asset into Central Store with receipt and movement', () => {
    const assetTag = `SSIU-IT-QA-${Date.now().toString().slice(-4)}`;
    const newAsset = inventoryManagementService.createFixedAsset({
      assetTag,
      name: 'Lenovo ThinkPad P16 Workstation',
      categoryId: 'cat-it-1',
      categoryName: 'Desktop & CPU Systems',
      categoryGroup: 'IT_EQUIPMENT',
      instituteId: 'inst-sit',
      purchaseCost: 125000,
      currentValue: 125000,
      vendor: 'Lenovo Enterprise Solutions',
      invoiceNumber: 'INV-LEN-2026-99',
      assetCondition: 'NEW',
      status: 'AVAILABLE'
    }, mockCentralAdmin);

    expect(newAsset.id).toBeDefined();
    expect(newAsset.status).toBe('AVAILABLE');

    const movements = inventoryManagementService.getAssetMovementHistory(newAsset.id);
    expect(movements.length).toBeGreaterThanOrEqual(1);
    expect(movements[0].action).toBe('CENTRAL_DISPATCH');
    expect(movements[0].toRole).toBe('CENTRAL_STORE');
  });

  it('2. Issue Stock (Quick Action 2): Issues stock from Store to HOI and Department Store', () => {
    const assets = db.getFixedAssets();
    const available = assets.find(a => a.status === 'AVAILABLE') || assets[0];

    const hoiIssued = inventoryManagementService.allocateAssetToHOI({
      assetId: available.id,
      instituteId: 'inst-sit',
      instituteName: 'Swarrnim Institute of Technology',
      hoiUserId: mockHOI.id,
      hoiName: mockHOI.name,
      reason: 'Institutional computer lab expansion'
    }, mockCentralAdmin);

    expect(hoiIssued.status).toBe('ASSIGNED_TO_HOI');
    expect(hoiIssued.assignedToUserId).toBe(mockHOI.id);

    const hodIssued = inventoryManagementService.allocateAssetToHOD({
      assetId: available.id,
      departmentId: 'dept-1',
      departmentName: 'Computer Engineering',
      hodUserId: mockHOD.id,
      hodName: mockHOD.name,
      reason: 'Department lab deployment'
    }, mockHOI);

    expect(hodIssued.status).toBe('ASSIGNED_TO_HOD');
    expect(hodIssued.departmentName).toBe('Computer Engineering');
  });

  it('3. Faculty Asset Requisition Flow: Faculty requests asset → HOD reviews & approves', () => {
    // 1. Faculty submits request
    const req = inventoryManagementService.createFacultyAssetRequisition({
      requestType: 'NEW_ASSET',
      categoryId: 'cat-it-1',
      assetNameRequirement: 'Apple MacBook Pro M3 for ML Research',
      quantity: 1,
      purpose: 'Required for advanced LLM inference benchmarking',
      requiredFromDate: '2026-09-01',
      priority: 'HIGH'
    }, mockFacultyA);

    expect(req.id).toBeDefined();
    expect(req.status).toBe('PENDING_HOD_APPROVAL');
    expect(req.requestNo).toContain('REQ-');

    // 2. HOD approves request
    const reviewed = inventoryManagementService.reviewAssetRequisitionByHOD(
      req.id,
      true,
      undefined,
      'Approved for AI Lab research grant allocation',
      mockHOD
    );

    expect(reviewed.status).toBe('APPROVED_BY_HOD');
    expect(reviewed.hodAction).toBe('APPROVED');
    expect(reviewed.hodName).toBe(mockHOD.name);
  });

  it('4. Requisition Fulfillment: HOD fulfills approved requisition with available department asset', () => {
    const assets = db.getFixedAssets();
    let storeAsset = assets.find(a => a.status === 'AVAILABLE' || a.status === 'ASSIGNED_TO_HOD' || a.status === 'IN_STORE');
    if (!storeAsset) {
      storeAsset = inventoryManagementService.createFixedAsset({
        assetTag: `AST-FULFILL-${Date.now().toString().slice(-4)}`,
        name: 'Apple MacBook Pro M3',
        categoryId: 'cat-it-1',
        categoryName: 'Desktop & CPU Systems',
        categoryGroup: 'IT_EQUIPMENT',
        instituteId: 'inst-sit',
        departmentId: 'dept-1',
        departmentName: 'Computer Engineering',
        purchaseCost: 180000,
        currentValue: 180000,
        assetCondition: 'NEW',
        status: 'AVAILABLE'
      }, mockCentralAdmin);
    }

    const st = db.getState() as any;
    const pendingReq = (st.assetRequisitions || []).find((r: any) => r.status === 'APPROVED_BY_HOD');
    expect(pendingReq).toBeDefined();

    const fulfillment = inventoryManagementService.fulfillAssetRequisitionWithAssignment(
      pendingReq.id,
      storeAsset.id,
      'AI Lab (Room A-204)',
      'LLM Research Allocation',
      'Assigned upon HOD approval',
      mockHOD
    );

    expect(fulfillment.requisition.status).toBe('ASSIGNED');
    expect(fulfillment.requisition.assignedAssetTag).toBe(storeAsset.assetTag);
    expect(fulfillment.asset.assignedToUserId).toBe(pendingReq.requestedByUserId);
    expect(['ASSIGNED', 'ASSIGNED_TO_FACULTY']).toContain(fulfillment.asset.status);
  });

  it('5. Requisition Rejection: HOD rejects with mandatory rejection reason', () => {
    const req = inventoryManagementService.createFacultyAssetRequisition({
      requestType: 'ADDITIONAL_ASSET',
      categoryId: 'cat-it-1',
      assetNameRequirement: 'Dual 32-inch 8K Monitors',
      quantity: 2,
      purpose: 'Video wall experiment',
      requiredFromDate: '2026-09-15',
      priority: 'LOW'
    }, mockFacultyB);

    // Rejection without reason must throw
    expect(() => {
      inventoryManagementService.reviewAssetRequisitionByHOD(
        req.id,
        false,
        '',
        '',
        mockHOD
      );
    }).toThrow('Rejection reason is mandatory');

    // Rejection with valid reason
    const rejected = inventoryManagementService.reviewAssetRequisitionByHOD(
      req.id,
      false,
      'Budget constraints for current academic quarter',
      'Please re-apply next semester',
      mockHOD
    );

    expect(rejected.status).toBe('REJECTED_BY_HOD');
    expect(rejected.hodRejectionReason).toBe('Budget constraints for current academic quarter');
  });

  it('6. Transfer Asset (Quick Action 4): Handles Faculty Transfer Request and HOD Review', () => {
    const asset = db.getFixedAssets().find(a => a.assignedToUserId === mockFacultyA.id) || db.getFixedAssets()[0];

    const transferReq = inventoryManagementService.requestAssetTransfer({
      assetId: asset.id,
      toUserId: mockFacultyB.id,
      toUserName: mockFacultyB.name,
      reason: 'Semester practical course realignment'
    }, mockFacultyA);

    expect(transferReq.status).toBe('PENDING_HOD');

    const approved = inventoryManagementService.reviewTransferRequest(
      transferReq.id,
      true,
      'Transfer verified and approved by HOD',
      mockHOD
    );

    expect(approved.status).toBe('APPROVED');

    const updated = db.getFixedAssetById(asset.id);
    expect(updated?.assignedToUserId).toBe(mockFacultyB.id);
  });

  it('7. Return Asset (Quick Action 5): Faculty returns asset and HOD accepts into Store', () => {
    const asset = db.getFixedAssets().find(a => a.assignedToUserId === mockFacultyB.id) || db.getFixedAssets()[0];

    const returnReq = inventoryManagementService.requestAssetReturn({
      assetId: asset.id,
      returnReason: 'Course completed, returning unit to department custody',
      conditionAtReturn: 'GOOD',
      remarks: 'Inspected and verified'
    }, mockFacultyB);

    expect(returnReq.status).toBe('PENDING_INSPECTION');

    const accepted = inventoryManagementService.acceptReturnRequest(
      returnReq.id,
      'GOOD',
      'Accepted into Department Store Room A-204',
      mockHOD
    );

    expect(accepted.status).toBe('ACCEPTED');

    const updated = db.getFixedAssetById(asset.id);
    expect(updated?.status).toBe('ASSIGNED_TO_HOD');
  });

  it('8. Archive Asset (Quick Action 6): Moves asset to permanent historical archive without deleting', () => {
    const asset = db.getFixedAssets()[0];

    const archived = inventoryManagementService.archiveAsset({
      assetId: asset.id,
      reason: '10-year academic lifecycle completed',
      approvedBy: 'University Condemnation Committee'
    }, mockCentralAdmin);

    expect(archived.status).toBe('ARCHIVED');

    const fetched = db.getFixedAssetById(asset.id);
    expect(fetched).toBeDefined();
    expect(fetched?.status).toBe('ARCHIVED');

    const movements = inventoryManagementService.getAssetMovementHistory(asset.id);
    expect(movements.some(m => m.action === 'DISPOSAL')).toBe(true);
  });

  it('9. Maintenance (Quick Action 7): Logs maintenance ticket and updates status to UNDER_MAINTENANCE', () => {
    const asset = db.getFixedAssets()[1];

    const maint = inventoryManagementService.recordMaintenance({
      assetId: asset.id,
      issueDescription: 'SMPS power fluctuation tripping laboratory circuit',
      vendorTechnician: 'Dell Onsite Support Engineer',
      estimatedCost: 2800
    }, mockHOD);

    expect(maint.id).toBeDefined();
    expect(maint.status).toBe('IN_PROGRESS');

    const updated = db.getFixedAssetById(asset.id);
    expect(updated?.status).toBe('UNDER_MAINTENANCE');
  });

  it('10. Physical Verification (Quick Action 8): Audits asset location, condition, and status', () => {
    const asset = db.getFixedAssets()[2];

    const verif = inventoryManagementService.recordPhysicalVerification({
      assetId: asset.id,
      foundLocation: 'Block A - Room 204',
      actualCustodian: 'Dr. Aarav Mehta',
      physicalCondition: 'EXCELLENT',
      verificationStatus: 'VERIFIED',
      verifiedByName: 'Annual Asset Audit Committee'
    }, mockHOD);

    expect(verif.id).toBeDefined();
    expect(verif.status).toBe('VERIFIED');
  });
});
