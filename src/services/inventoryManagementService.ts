import { db } from './db';
import { 
  FixedAsset, ConsumableItem, StockTransactionRecord, PhysicalFileRecord,
  AssetAssignmentRecord, AssetTransferRecord, AssetMaintenanceRecord,
  PhysicalVerificationRecord, AssetDisposalRecord, InventoryAuditRecord,
  InventoryCategoryItem, InventoryLocationRecord, AssetStatus, AssetCondition,
  InventoryCategoryGroup, User, AssetMovementRecord, AssetTransferRequestRecord,
  AssetReturnRequestRecord, AssetReplacementRequestRecord, AssetIssueReportRecord,
  AssetRequestRecord, AssetRequisitionType, AssetRequisitionStatus
} from '../types';
import ExcelJS from 'exceljs';

export interface CategorySummaryItem {
  key: string;
  label: string;
  group: InventoryCategoryGroup;
  quantity: number;
  totalValue: number;
  activeCount: number;
  assignedCount: number;
  maintenanceCount: number;
  storeCount: number;
}

export interface InventoryDashboardKPIs {
  totalFixedAssets: number;
  totalBookValue: number;
  assignedCount: number;
  utilizationPercentage: number;
  underMaintenanceCount: number;
  damagedLostCount: number;
  totalConsumableStock: number;
  lowStockWarningsCount: number;
  categorySummaries: CategorySummaryItem[];
}

export interface FacultyAssetDashboardData {
  assignedAssets: FixedAsset[];
  totalAssignedCount: number;
  inUseCount: number;
  underMaintenanceCount: number;
  pendingRequestsCount: number;
  assetRequisitions: AssetRequestRecord[];
  transferRequests: AssetTransferRequestRecord[];
  returnRequests: AssetReturnRequestRecord[];
  replacementRequests: AssetReplacementRequestRecord[];
  issueReports: AssetIssueReportRecord[];
}

export interface HODAssetDashboardData {
  departmentAssets: FixedAsset[];
  totalAssetsCount: number;
  assignedToFacultyCount: number;
  assignedToStaffCount: number;
  availableInStoreCount: number;
  underMaintenanceCount: number;
  damagedLostCount: number;
  pendingAssetRequisitions: AssetRequestRecord[];
  allDepartmentRequisitions: AssetRequestRecord[];
  pendingTransferRequests: AssetTransferRequestRecord[];
  allDepartmentTransfers: AssetTransferRequestRecord[];
  pendingReturnRequests: AssetReturnRequestRecord[];
  allDepartmentReturns: AssetReturnRequestRecord[];
  pendingReplacementRequests: AssetReplacementRequestRecord[];
  allDepartmentReplacements: AssetReplacementRequestRecord[];
  activeIssueReports: AssetIssueReportRecord[];
  allDepartmentIssues: AssetIssueReportRecord[];
  recentMovements: AssetMovementRecord[];
}

export interface HOIAssetDashboardData {
  institutionAssets: FixedAsset[];
  totalAssetsCount: number;
  institutionStoreCount: number;
  allocatedToDeptsCount: number;
  escalatedReplacementRequests: AssetReplacementRequestRecord[];
  recentMovements: AssetMovementRecord[];
}

export class CentralInventoryManagementService {
  /**
   * 1. GET CENTRAL KPI SUMMARY & CATEGORY BREAKDOWN
   */
  public getDashboardKPIs(filter?: { instituteId?: string; departmentId?: string }): InventoryDashboardKPIs {
    const assets = db.getFixedAssets(undefined, {
      instituteId: filter?.instituteId && filter.instituteId !== 'ALL' ? filter.instituteId : undefined,
      departmentId: filter?.departmentId && filter.departmentId !== 'ALL' ? filter.departmentId : undefined
    });

    const consumables = db.getConsumables(undefined, {
      instituteId: filter?.instituteId && filter.instituteId !== 'ALL' ? filter.instituteId : undefined,
      departmentId: filter?.departmentId && filter.departmentId !== 'ALL' ? filter.departmentId : undefined
    });

    const totalFixedAssets = assets.length;
    const totalBookValue = assets.reduce((sum, a) => sum + (Number(a.currentValue) || Number(a.purchaseCost) || 0), 0);
    const assignedCount = assets.filter(a => a.status === 'ASSIGNED' || a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED_TO_STAFF' || a.status === 'ASSIGNED_TO_HOD' || a.assignedToName).length;
    const utilizationPercentage = totalFixedAssets > 0 ? Number(((assignedCount / totalFixedAssets) * 100).toFixed(1)) : 0;
    const underMaintenanceCount = assets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
    const damagedLostCount = assets.filter(a => a.status === 'DAMAGED' || a.status === 'LOST').length;

    const totalConsumableStock = consumables.reduce((sum, c) => sum + (Number(c.currentBalance) || 0), 0);
    const lowStockWarningsCount = consumables.filter(c => (c.currentBalance || 0) <= (c.reorderLevel || c.minimumStockLevel || 10)).length;

    // 6 Standard University Category Groups
    const groupDefs: { key: string; label: string; group: InventoryCategoryGroup }[] = [
      { key: 'IT_EQUIPMENT', label: 'IT & Computing', group: 'IT_EQUIPMENT' },
      { key: 'FURNITURE', label: 'Furniture & Desks', group: 'FURNITURE' },
      { key: 'LAB_TECHNICAL', label: 'Lab & Technical', group: 'LAB_TECHNICAL' },
      { key: 'OFFICE_EQUIPMENT', label: 'Office Equipment', group: 'OFFICE_EQUIPMENT' },
      { key: 'FACILITY_ELECTRICAL', label: 'Facility & Electrical', group: 'FACILITY_ELECTRICAL' },
      { key: 'PHYSICAL_RECORDS', label: 'Physical Document Files', group: 'PHYSICAL_RECORDS' }
    ];

    const categorySummaries: CategorySummaryItem[] = groupDefs.map(g => {
      const catAssets = assets.filter(a => a.categoryGroup === g.group);
      const qty = catAssets.length;
      const val = catAssets.reduce((sum, a) => sum + (Number(a.currentValue) || Number(a.purchaseCost) || 0), 0);
      const act = catAssets.filter(a => a.status === 'ACTIVE' || a.status === 'ASSIGNED' || a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED_TO_HOD').length;
      const asg = catAssets.filter(a => a.status === 'ASSIGNED' || a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED_TO_STAFF').length;
      const mnt = catAssets.filter(a => a.status === 'UNDER_MAINTENANCE').length;
      const str = catAssets.filter(a => a.status === 'IN_STORE' || a.status === 'AVAILABLE' || a.status === 'ASSIGNED_TO_HOI').length;

      return {
        key: g.key,
        label: g.label,
        group: g.group,
        quantity: qty,
        totalValue: val,
        activeCount: act,
        assignedCount: asg,
        maintenanceCount: mnt,
        storeCount: str
      };
    });

    return {
      totalFixedAssets,
      totalBookValue,
      assignedCount,
      utilizationPercentage,
      underMaintenanceCount,
      damagedLostCount,
      totalConsumableStock,
      lowStockWarningsCount,
      categorySummaries
    };
  }

  /**
   * 2. GENERATE ASSET TAG / QR CODE DATA
   */
  public generateAssetTag(departmentCode: string = 'CE', categoryPrefix: string = 'PC'): string {
    const assets = db.getFixedAssets();
    const prefix = `SIT-${departmentCode.toUpperCase()}-${categoryPrefix.toUpperCase()}`;
    const matching = assets.filter(a => a.assetTag.startsWith(prefix));
    const nextSeq = String(matching.length + 1).padStart(4, '0');
    return `${prefix}-${nextSeq}`;
  }

  public getQrCodePayload(asset: FixedAsset): string {
    return JSON.stringify({
      tag: asset.assetTag,
      name: asset.name,
      dept: asset.departmentName || 'SSCIT',
      loc: `${asset.building || 'Main'} - ${asset.roomNo || 'Store'}`,
      serial: asset.serialNumber || 'N/A',
      cost: asset.purchaseCost,
      custodian: asset.assignedToName || 'Department Store',
      status: asset.status,
      univ: 'Swarrnim Startup & Innovation University'
    });
  }

  /**
   * 3. ADD / REGISTER NEW FIXED ASSET (CENTRAL STORE)
   */
  public createFixedAsset(data: Partial<FixedAsset>, actorUser?: User): FixedAsset {
    // Validate tag uniqueness
    const assets = db.getFixedAssets();
    if (data.assetTag && assets.some(a => a.assetTag.toLowerCase() === data.assetTag?.toLowerCase())) {
      throw new Error(`Asset Tag "${data.assetTag}" already exists in the university inventory.`);
    }

    const cost = Number(data.purchaseCost) || 0;
    const usefulLife = Number(data.usefulLifeYears) || 5;
    const depRate = Number(data.depreciationRate) || (usefulLife > 0 ? Number((100 / usefulLife).toFixed(2)) : 20);
    const purchaseYear = data.purchaseDate ? new Date(data.purchaseDate).getFullYear() : new Date().getFullYear();
    const currentYear = new Date().getFullYear();
    const ageYears = Math.max(0, currentYear - purchaseYear);
    const calculatedValue = Math.max(0, cost - (cost * (depRate / 100) * ageYears));

    const finalAssetData: Partial<FixedAsset> = {
      ...data,
      purchaseCost: cost,
      currentValue: data.currentValue !== undefined ? Number(data.currentValue) : calculatedValue,
      depreciationRate: depRate,
      usefulLifeYears: usefulLife,
      status: data.status || 'AVAILABLE',
      assetCondition: data.assetCondition || 'NEW',
      qrCodeData: data.qrCodeData || `https://erp.swarrnim.edu.in/assets/${data.assetTag || 'TAG'}`
    };

    const newAsset = db.createFixedAsset(finalAssetData, actorUser);

    // Record initial movement in Central Store
    this.recordAssetMovement({
      assetId: newAsset.id,
      assetTag: newAsset.assetTag,
      assetName: newAsset.name,
      fromUserName: 'Vendor / Procurement Depot',
      fromRole: 'CENTRAL_STORE',
      toUserId: actorUser?.id,
      toUserName: actorUser?.name || 'Central University Store',
      toRole: 'CENTRAL_STORE',
      instituteId: newAsset.instituteId || 'inst-sit',
      instituteName: newAsset.instituteName || 'Swarrnim University',
      location: `${newAsset.building || 'Central Store'} - ${newAsset.roomNo || 'Main Depot'}`,
      action: 'CENTRAL_DISPATCH',
      reason: 'Procurement & Initial Asset Inward',
      conditionBefore: 'NEW',
      conditionAfter: 'NEW',
      remarks: 'Asset entered into central university master register.'
    }, actorUser);

    return newAsset;
  }

  /**
   * 4. HIERARCHY LEVEL 1: CENTRAL STORE -> HOI (PRINCIPAL)
   */
  public allocateAssetToHOI(params: {
    assetId: string;
    instituteId: string;
    instituteName: string;
    hoiUserId: string;
    hoiName: string;
    locationName?: string;
    reason?: string;
    remarks?: string;
  }, actorUser?: User): FixedAsset {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    const updated = db.updateFixedAsset(asset.id, {
      instituteId: params.instituteId,
      instituteName: params.instituteName,
      departmentId: undefined,
      departmentName: undefined,
      locationName: params.locationName || 'Institution Central Store',
      assignedToUserId: params.hoiUserId,
      assignedToName: `${params.hoiName} (HOI)`,
      assignedToDesignation: 'Head of Institution',
      status: 'ASSIGNED_TO_HOI',
      updatedAt: new Date().toISOString()
    }, actorUser);

    this.recordAssetMovement({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserName: actorUser?.name || 'Central University Store',
      fromRole: 'CENTRAL_STORE',
      toUserId: params.hoiUserId,
      toUserName: params.hoiName,
      toRole: 'HOI',
      instituteId: params.instituteId,
      instituteName: params.instituteName,
      location: params.locationName || 'Institution Central Store',
      action: 'CENTRAL_DISPATCH',
      reason: params.reason || 'Institution infrastructure allocation',
      conditionBefore: asset.assetCondition,
      conditionAfter: asset.assetCondition,
      approvedByName: actorUser?.name || 'Registrar / Central Store Officer',
      approvalDate: new Date().toISOString().split('T')[0],
      remarks: params.remarks || 'Allocated from Central Store to HOI.'
    }, actorUser);

    return updated;
  }

  /**
   * 5. HIERARCHY LEVEL 2: HOI -> HOD (DEPARTMENT)
   */
  public allocateAssetToHOD(params: {
    assetId: string;
    departmentId: string;
    departmentName: string;
    hodUserId: string;
    hodName: string;
    locationName?: string;
    roomNo?: string;
    reason?: string;
    remarks?: string;
  }, actorUser?: User): FixedAsset {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    const updated = db.updateFixedAsset(asset.id, {
      departmentId: params.departmentId,
      departmentName: params.departmentName,
      locationName: params.locationName || `${params.departmentName} Store`,
      roomNo: params.roomNo,
      assignedToUserId: params.hodUserId,
      assignedToName: `${params.hodName} (HOD)`,
      assignedToDesignation: 'Head of Department',
      status: 'ASSIGNED_TO_HOD',
      updatedAt: new Date().toISOString()
    }, actorUser);

    this.recordAssetMovement({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserId: actorUser?.id,
      fromUserName: actorUser?.name || 'Head of Institution',
      fromRole: 'HOI',
      toUserId: params.hodUserId,
      toUserName: params.hodName,
      toRole: 'HOD',
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      departmentId: params.departmentId,
      departmentName: params.departmentName,
      location: params.locationName || `${params.departmentName} Store`,
      action: 'HOI_ALLOCATION',
      reason: params.reason || 'Department laboratory and infrastructure allocation',
      conditionBefore: asset.assetCondition,
      conditionAfter: asset.assetCondition,
      approvedByName: actorUser?.name || 'Head of Institution',
      approvalDate: new Date().toISOString().split('T')[0],
      remarks: params.remarks || 'Allocated from HOI to Department HOD.'
    }, actorUser);

    return updated;
  }

  /**
   * 6. HIERARCHY LEVEL 3: HOD -> FACULTY / STAFF
   */
  public assignAsset(params: {
    assetId: string;
    assignedToUserId?: string;
    assignedToName: string;
    assignedToEmpCode?: string;
    assignedToDesignation?: string;
    departmentId?: string;
    departmentName?: string;
    location?: string;
    roomNo?: string;
    expectedReturnDate?: string;
    purpose?: string;
    conditionAtIssue?: AssetCondition;
    remarks?: string;
  }, actorUser?: User): AssetAssignmentRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');
    if (asset.status === 'DISPOSED') throw new Error('Disposed assets cannot be assigned.');

    const res = db.assignAsset(params.assetId, {
      assignedToUserId: params.assignedToUserId,
      assignedToName: params.assignedToName,
      assignedToEmpCode: params.assignedToEmpCode,
      assignedToDesignation: params.assignedToDesignation,
      departmentId: params.departmentId || asset.departmentId,
      departmentName: params.departmentName || asset.departmentName,
      location: params.location || asset.locationName,
      roomNo: params.roomNo || asset.roomNo,
      expectedReturnDate: params.expectedReturnDate,
      purpose: params.purpose,
      conditionAtIssue: params.conditionAtIssue || asset.assetCondition || 'GOOD',
      remarks: params.remarks
    }, actorUser);

    if (!res.success) throw new Error(res.error || 'Failed to assign asset.');

    // Update status to ASSIGNED_TO_FACULTY
    db.updateFixedAsset(asset.id, {
      status: 'ASSIGNED_TO_FACULTY'
    }, actorUser);

    // Record official Movement
    this.recordAssetMovement({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserId: actorUser?.id,
      fromUserName: actorUser?.name || 'Head of Department',
      fromRole: 'HOD',
      toUserId: params.assignedToUserId,
      toUserName: params.assignedToName,
      toRole: 'FACULTY',
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      departmentId: params.departmentId || asset.departmentId,
      departmentName: params.departmentName || asset.departmentName,
      location: params.location || asset.locationName || 'Department Room',
      action: 'HOD_ASSIGNMENT',
      reason: params.purpose || 'Official academic / faculty research assignment',
      conditionBefore: asset.assetCondition,
      conditionAfter: params.conditionAtIssue || asset.assetCondition,
      approvedByName: actorUser?.name || 'Head of Department',
      approvalDate: new Date().toISOString().split('T')[0],
      remarks: params.remarks || `Assigned to ${params.assignedToName}`
    }, actorUser);

    const assignments = (db.getState() as any).assetAssignments || [];
    return assignments.find((a: AssetAssignmentRecord) => a.assetId === params.assetId && a.status === 'ACTIVE') || {
      id: `asg-${Date.now()}`,
      assetId: params.assetId,
      assetTag: asset.assetTag,
      assetName: asset.name,
      assignedToName: params.assignedToName,
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      issueDate: new Date().toISOString().split('T')[0],
      conditionAtIssue: params.conditionAtIssue || 'GOOD',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * 7. FACULTY ACTION: REQUEST TRANSFER (SUBMITTED TO HOD)
   */
  public requestAssetTransfer(params: {
    assetId: string;
    toUserId: string;
    toUserName: string;
    reason: string;
    remarks?: string;
  }, facultyUser: User): AssetTransferRequestRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset not found.');

    const now = new Date().toISOString();
    const st = db.getState() as any;
    const requests: AssetTransferRequestRecord[] = st.assetTransferRequests || [];

    const req: AssetTransferRequestRecord = {
      id: `trq-${Date.now().toString().slice(-8)}`,
      requestNo: `TRQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserId: facultyUser.id,
      fromUserName: facultyUser.name,
      toUserId: params.toUserId,
      toUserName: params.toUserName,
      departmentId: asset.departmentId || facultyUser.departmentId || '',
      departmentName: asset.departmentName || facultyUser.departmentName || '',
      reason: params.reason,
      status: 'PENDING_HOD',
      requestedDate: now.split('T')[0],
      remarks: params.remarks
    };

    st.assetTransferRequests = [req, ...requests];
    db.updateFixedAsset(asset.id, { status: 'TRANSFER_REQUESTED' }, facultyUser);
    db.saveState();

    return req;
  }

  /**
   * 8. HOD ACTION: REVIEW TRANSFER REQUEST (APPROVE / REJECT)
   */
  public reviewTransferRequest(requestId: string, approved: boolean, remarks?: string, hodUser?: User): AssetTransferRequestRecord {
    const st = db.getState() as any;
    const requests: AssetTransferRequestRecord[] = st.assetTransferRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Transfer request not found.');

    const req = requests[idx];
    const asset = db.getFixedAssetById(req.assetId);
    if (!asset) throw new Error('Target asset record not found.');

    const now = new Date().toISOString();

    if (approved) {
      req.status = 'APPROVED';
      req.reviewedByHODId = hodUser?.id;
      req.reviewedByHODName = hodUser?.name || 'HOD';
      req.reviewedDate = now.split('T')[0];
      req.remarks = remarks || req.remarks;

      // Reassign asset to target faculty
      db.updateFixedAsset(asset.id, {
        assignedToUserId: req.toUserId,
        assignedToName: req.toUserName,
        status: 'ASSIGNED_TO_FACULTY'
      }, hodUser);

      // Record movement
      this.recordAssetMovement({
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        fromUserId: req.fromUserId,
        fromUserName: req.fromUserName,
        fromRole: 'FACULTY',
        toUserId: req.toUserId,
        toUserName: req.toUserName,
        toRole: 'FACULTY',
        instituteId: asset.instituteId,
        instituteName: asset.instituteName,
        departmentId: asset.departmentId,
        departmentName: asset.departmentName,
        location: asset.locationName || 'Department Room',
        action: 'FACULTY_TRANSFER',
        reason: req.reason,
        conditionBefore: asset.assetCondition,
        conditionAfter: asset.assetCondition,
        approvedByName: hodUser?.name || 'HOD',
        approvalDate: req.reviewedDate,
        remarks: `Transfer approved by HOD: ${remarks || 'Approved'}`
      }, hodUser);
    } else {
      req.status = 'REJECTED';
      req.reviewedByHODId = hodUser?.id;
      req.reviewedByHODName = hodUser?.name || 'HOD';
      req.reviewedDate = now.split('T')[0];
      req.rejectionReason = remarks || 'Transfer request rejected by HOD.';

      db.updateFixedAsset(asset.id, {
        status: 'ASSIGNED_TO_FACULTY'
      }, hodUser);
    }

    requests[idx] = req;
    st.assetTransferRequests = [...requests];
    db.saveState();

    return req;
  }

  /**
   * 9. FACULTY ACTION: REQUEST RETURN (SUBMITTED TO HOD)
   */
  public requestAssetReturn(params: {
    assetId: string;
    returnReason: string;
    conditionAtReturn: AssetCondition;
    remarks?: string;
    supportingPhoto?: string;
  }, facultyUser: User): AssetReturnRequestRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset not found.');

    const now = new Date().toISOString();
    const st = db.getState() as any;
    const requests: AssetReturnRequestRecord[] = st.assetReturnRequests || [];

    const req: AssetReturnRequestRecord = {
      id: `rtq-${Date.now().toString().slice(-8)}`,
      requestNo: `RTQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      requestedByUserId: facultyUser.id,
      requestedByName: facultyUser.name,
      departmentId: asset.departmentId || facultyUser.departmentId || '',
      departmentName: asset.departmentName || facultyUser.departmentName || '',
      returnReason: params.returnReason,
      conditionAtReturn: params.conditionAtReturn,
      remarks: params.remarks,
      supportingPhoto: params.supportingPhoto,
      status: 'PENDING_INSPECTION',
      requestedDate: now.split('T')[0]
    };

    st.assetReturnRequests = [req, ...requests];
    db.updateFixedAsset(asset.id, { status: 'RETURN_REQUESTED' }, facultyUser);
    db.saveState();

    return req;
  }

  /**
   * 10. HOD ACTION: ACCEPT RETURN (INSPECTION & RETURN TO DEPT STORE)
   */
  public acceptReturnRequest(requestId: string, conditionAtReturn: AssetCondition, inspectionRemarks?: string, hodUser?: User): AssetReturnRequestRecord {
    const st = db.getState() as any;
    const requests: AssetReturnRequestRecord[] = st.assetReturnRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Return request not found.');

    const req = requests[idx];
    const asset = db.getFixedAssetById(req.assetId);
    if (!asset) throw new Error('Target asset not found.');

    const now = new Date().toISOString();
    req.status = 'ACCEPTED';
    req.inspectedByHODId = hodUser?.id;
    req.inspectedByHODName = hodUser?.name || 'HOD';
    req.inspectedDate = now.split('T')[0];
    req.inspectionRemarks = inspectionRemarks;
    req.conditionAtReturn = conditionAtReturn;

    // Return to Department Store custody
    db.returnAsset(asset.id, {
      conditionAtReturn: conditionAtReturn,
      remarks: inspectionRemarks
    }, hodUser);

    db.updateFixedAsset(asset.id, {
      status: 'ASSIGNED_TO_HOD',
      assignedToUserId: hodUser?.id,
      assignedToName: `${hodUser?.name || 'HOD'} (Department Store)`,
      locationName: `${asset.departmentName || 'Department'} Store`
    }, hodUser);

    // Record movement
    this.recordAssetMovement({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserId: req.requestedByUserId,
      fromUserName: req.requestedByName,
      fromRole: 'FACULTY',
      toUserId: hodUser?.id,
      toUserName: hodUser?.name || 'Department Store',
      toRole: 'HOD',
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      departmentId: asset.departmentId,
      departmentName: asset.departmentName,
      location: `${asset.departmentName || 'Department'} Store`,
      action: 'RETURN_TO_STORE',
      reason: req.returnReason,
      conditionBefore: asset.assetCondition,
      conditionAfter: conditionAtReturn,
      approvedByName: hodUser?.name || 'HOD',
      approvalDate: req.inspectedDate,
      remarks: `Accepted back into department store: ${inspectionRemarks || 'Good condition'}`
    }, hodUser);

    requests[idx] = req;
    st.assetReturnRequests = [...requests];
    db.saveState();

    return req;
  }

  /**
   * 11. FACULTY ACTION: REQUEST REPLACEMENT (HOD -> HOI WORKFLOW)
   */
  public requestAssetReplacement(params: {
    assetId: string;
    reason: string;
    problemDescription: string;
    currentCondition: AssetCondition;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    supportingDocument?: string;
    remarks?: string;
  }, facultyUser: User): AssetReplacementRequestRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset not found.');

    const now = new Date().toISOString();
    const st = db.getState() as any;
    const requests: AssetReplacementRequestRecord[] = st.assetReplacementRequests || [];

    const req: AssetReplacementRequestRecord = {
      id: `rpq-${Date.now().toString().slice(-8)}`,
      requestNo: `RPQ-${new Date().getFullYear()}-${String(requests.length + 1).padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      requestedByUserId: facultyUser.id,
      requestedByName: facultyUser.name,
      departmentId: asset.departmentId || facultyUser.departmentId || '',
      departmentName: asset.departmentName || facultyUser.departmentName || '',
      instituteId: asset.instituteId || facultyUser.instituteId || '',
      instituteName: asset.instituteName || '',
      reason: params.reason,
      problemDescription: params.problemDescription,
      currentCondition: params.currentCondition,
      priority: params.priority || 'HIGH',
      supportingDocument: params.supportingDocument,
      remarks: params.remarks,
      status: 'PENDING_HOD',
      requestedDate: now.split('T')[0]
    };

    st.assetReplacementRequests = [req, ...requests];
    db.updateFixedAsset(asset.id, { status: 'REPLACEMENT_REQUESTED' }, facultyUser);
    db.saveState();

    return req;
  }

  /**
   * 12. HOD ACTION: ESCALATE REPLACEMENT TO HOI
   */
  public reviewReplacementByHOD(requestId: string, approved: boolean, remarks?: string, hodUser?: User): AssetReplacementRequestRecord {
    const st = db.getState() as any;
    const requests: AssetReplacementRequestRecord[] = st.assetReplacementRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Replacement request not found.');

    const req = requests[idx];
    const asset = db.getFixedAssetById(req.assetId);

    const now = new Date().toISOString();
    if (approved) {
      req.status = 'ESCALATED_TO_HOI';
      req.hodReviewDate = now.split('T')[0];
      req.hodReviewRemarks = remarks || 'Verified by HOD. Recommended for replacement by HOI.';
    } else {
      req.status = 'REJECTED';
      req.hodReviewDate = now.split('T')[0];
      req.hodReviewRemarks = remarks || 'Replacement request rejected by HOD.';
      if (asset) db.updateFixedAsset(asset.id, { status: 'ASSIGNED_TO_FACULTY' }, hodUser);
    }

    requests[idx] = req;
    st.assetReplacementRequests = [...requests];
    db.saveState();

    return req;
  }

  /**
   * 13. HOI ACTION: APPROVE REPLACEMENT
   */
  public approveReplacementByHOI(requestId: string, approved: boolean, replacementAssetTag?: string, remarks?: string, hoiUser?: User): AssetReplacementRequestRecord {
    const st = db.getState() as any;
    const requests: AssetReplacementRequestRecord[] = st.assetReplacementRequests || [];
    const idx = requests.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Replacement request not found.');

    const req = requests[idx];
    const asset = db.getFixedAssetById(req.assetId);

    const now = new Date().toISOString();
    if (approved) {
      req.status = 'APPROVED';
      req.hoiApprovedById = hoiUser?.id;
      req.hoiApprovedByName = hoiUser?.name || 'Head of Institution';
      req.hoiApprovalDate = now.split('T')[0];
      req.replacementAssetTag = replacementAssetTag;
      req.hoiRemarks = remarks || 'Replacement proposal approved by HOI.';

      if (asset) {
        db.updateFixedAsset(asset.id, {
          status: 'RETIRED',
          remarks: `Condemned and replaced by ${replacementAssetTag || 'new unit'}.`
        }, hoiUser);

        this.recordAssetMovement({
          assetId: asset.id,
          assetTag: asset.assetTag,
          assetName: asset.name,
          fromUserId: req.requestedByUserId,
          fromUserName: req.requestedByName,
          fromRole: 'FACULTY',
          toUserId: hoiUser?.id,
          toUserName: 'Institution Store / Condemned Depot',
          toRole: 'HOI',
          instituteId: req.instituteId,
          instituteName: req.instituteName,
          departmentId: req.departmentId,
          departmentName: req.departmentName,
          location: 'Condemned & Replaced Depot',
          action: 'REPLACEMENT',
          reason: req.problemDescription,
          conditionBefore: req.currentCondition,
          conditionAfter: 'OBSOLETE',
          approvedByName: hoiUser?.name || 'HOI',
          approvalDate: req.hoiApprovalDate,
          remarks: `Asset officially approved for replacement by HOI. Replacement Tag: ${replacementAssetTag || 'N/A'}`
        }, hoiUser);
      }
    } else {
      req.status = 'REJECTED';
      req.hoiApprovedById = hoiUser?.id;
      req.hoiApprovedByName = hoiUser?.name || 'Head of Institution';
      req.hoiApprovalDate = now.split('T')[0];
      req.hoiRemarks = remarks || 'Replacement rejected by HOI.';
      if (asset) db.updateFixedAsset(asset.id, { status: 'ASSIGNED_TO_FACULTY' }, hoiUser);
    }

    requests[idx] = req;
    st.assetReplacementRequests = [...requests];
    db.saveState();

    return req;
  }

  /**
   * 14. FACULTY ACTION: REPORT DAMAGE / ISSUE
   */
  public reportAssetIssue(params: {
    assetId: string;
    issueType: 'DAMAGED' | 'NOT_WORKING' | 'MISSING_PART' | 'TECHNICAL_PROBLEM' | 'PHYSICAL_DAMAGE' | 'LOST';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
  }, facultyUser: User): AssetIssueReportRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset not found.');

    const now = new Date().toISOString();
    const st = db.getState() as any;
    const reports: AssetIssueReportRecord[] = st.assetIssueReports || [];

    const rep: AssetIssueReportRecord = {
      id: `isr-${Date.now().toString().slice(-8)}`,
      reportNo: `ISR-${new Date().getFullYear()}-${String(reports.length + 1).padStart(6, '0')}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      reportedByUserId: facultyUser.id,
      reportedByName: facultyUser.name,
      departmentId: asset.departmentId || facultyUser.departmentId || '',
      departmentName: asset.departmentName || facultyUser.departmentName || '',
      issueType: params.issueType,
      severity: params.severity,
      description: params.description,
      status: 'REPORTED',
      reportedDate: now.split('T')[0]
    };

    st.assetIssueReports = [rep, ...reports];
    if (params.issueType === 'LOST') {
      db.updateFixedAsset(asset.id, { status: 'LOST' }, facultyUser);
    } else {
      db.updateFixedAsset(asset.id, { status: 'DAMAGED', assetCondition: 'DAMAGED' }, facultyUser);
    }
    db.saveState();

    return rep;
  }

  /**
   * 15. HOD ACTION: RESOLVE ISSUE REPORT (MAINTENANCE / RESOLUTION)
   */
  public resolveIssueReport(reportId: string, actionType: 'SEND_TO_MAINTENANCE' | 'MARKED_DAMAGED' | 'REPLACEMENT_INITIATED' | 'RESOLVED', remarks?: string, hodUser?: User): AssetIssueReportRecord {
    const st = db.getState() as any;
    const reports: AssetIssueReportRecord[] = st.assetIssueReports || [];
    const idx = reports.findIndex(r => r.id === reportId);
    if (idx === -1) throw new Error('Issue report not found.');

    const rep = reports[idx];
    const asset = db.getFixedAssetById(rep.assetId);
    const now = new Date().toISOString();

    rep.status = actionType as any;
    rep.hodActionRemarks = remarks;
    if (actionType === 'RESOLVED') {
      rep.resolvedDate = now.split('T')[0];
      if (asset) db.updateFixedAsset(asset.id, { status: 'ASSIGNED_TO_FACULTY', assetCondition: 'GOOD' }, hodUser);
    } else if (actionType === 'SEND_TO_MAINTENANCE') {
      if (asset) {
        this.recordMaintenance({
          assetId: asset.id,
          issueDescription: `${rep.issueType}: ${rep.description}`,
          estimatedCost: 1500
        }, hodUser);
      }
    }

    reports[idx] = rep;
    st.assetIssueReports = [...reports];
    db.saveState();

    return rep;
  }

  /**
   * 15A. FACULTY ACTION: SUBMIT ASSET REQUISITION / REQUEST
   */
  public createFacultyAssetRequisition(params: {
    requestType: AssetRequisitionType;
    categoryId: string;
    categoryName?: string;
    assetNameRequirement: string;
    quantity: number;
    purpose: string;
    requiredFromDate: string;
    requiredUntilDate?: string;
    preferredLocation?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    remarks?: string;
    attachmentUrl?: string;
  }, facultyUser: User): AssetRequestRecord {
    const st = db.getState() as any;
    const requisitions: AssetRequestRecord[] = st.assetRequisitions || [];
    const now = new Date().toISOString();

    const category = db.getInventoryCategories().find(c => c.id === params.categoryId);

    const req: AssetRequestRecord = {
      id: `req-${Date.now().toString().slice(-8)}`,
      requestNo: `REQ-${new Date().getFullYear()}-${String(requisitions.length + 1).padStart(6, '0')}`,
      requestedByUserId: facultyUser.id,
      requestedByName: facultyUser.name,
      requestedByEmpCode: facultyUser.employeeId,
      requestedByDesignation: facultyUser.designation || 'Faculty',
      departmentId: facultyUser.departmentId || 'dept-1',
      departmentName: facultyUser.departmentName || 'Computer Engineering',
      instituteId: facultyUser.instituteId || 'inst-sit',
      instituteName: (facultyUser as any).instituteName || 'Swarrnim Institute of Technology',
      requestType: params.requestType,
      categoryId: params.categoryId,
      categoryName: category?.name || params.categoryName || 'IT Equipment',
      assetNameRequirement: params.assetNameRequirement,
      quantity: Number(params.quantity) || 1,
      purpose: params.purpose,
      requiredFromDate: params.requiredFromDate,
      requiredUntilDate: params.requiredUntilDate,
      preferredLocation: params.preferredLocation || 'Faculty Cabin',
      priority: params.priority || 'MEDIUM',
      status: 'PENDING_HOD_APPROVAL',
      remarks: params.remarks,
      attachmentUrl: params.attachmentUrl,
      createdAt: now,
      updatedAt: now
    };

    st.assetRequisitions = [req, ...requisitions];
    db.saveState();

    // Create system notification for HOD
    try {
      db.createNotification({
        userId: facultyUser.departmentId ? `hod-${facultyUser.departmentId}` : 'user-hod-1',
        title: 'New Asset Request Received',
        message: `${facultyUser.name} submitted an asset request for: ${params.assetNameRequirement} (Qty: ${params.quantity}).`,
        type: 'INFO',
        priority: 'MEDIUM',
        link: '/inventory'
      });
    } catch (_) {}

    db.logInventoryAudit('CREATE' as any, 'ASSETS', req.id, req.requestNo, {
      remarks: `Asset request created by ${facultyUser.name}: ${req.assetNameRequirement}`
    }, facultyUser);

    return req;
  }

  /**
   * 15B. HOD ACTION: REVIEW & APPROVE/REJECT ASSET REQUISITION
   */
  public reviewAssetRequisitionByHOD(
    requestId: string,
    approved: boolean,
    rejectionReason?: string,
    remarks?: string,
    hodUser?: User
  ): AssetRequestRecord {
    const st = db.getState() as any;
    const requisitions: AssetRequestRecord[] = st.assetRequisitions || [];
    const idx = requisitions.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Asset request record not found.');

    const req = requisitions[idx];
    const now = new Date().toISOString();

    if (approved) {
      req.status = 'APPROVED_BY_HOD';
      req.hodAction = 'APPROVED';
      req.hodRemarks = remarks;
      req.hodId = hodUser?.id;
      req.hodName = hodUser?.name;
      req.hodActionAt = now;
    } else {
      if (!rejectionReason || !rejectionReason.trim()) {
        throw new Error('Rejection reason is mandatory when rejecting an asset request.');
      }
      req.status = 'REJECTED_BY_HOD';
      req.hodAction = 'REJECTED';
      req.hodRejectionReason = rejectionReason;
      req.hodRemarks = remarks;
      req.hodId = hodUser?.id;
      req.hodName = hodUser?.name;
      req.hodActionAt = now;
    }
    req.updatedAt = now;
    requisitions[idx] = req;
    st.assetRequisitions = [...requisitions];
    db.saveState();

    // Create notification for requester
    try {
      db.createNotification({
        userId: req.requestedByUserId,
        title: approved ? 'Asset Request Approved by HOD' : 'Asset Request Rejected by HOD',
        message: approved 
          ? `Your asset request (${req.requestNo}) for ${req.assetNameRequirement} was approved by HOD.`
          : `Your asset request (${req.requestNo}) for ${req.assetNameRequirement} was rejected. Reason: ${rejectionReason}`,
        type: approved ? 'SUCCESS' : 'WARNING',
        priority: 'HIGH',
        link: '/inventory'
      });
    } catch (_) {}

    db.logInventoryAudit('UPDATE' as any, 'ASSETS', req.id, req.requestNo, {
      remarks: `HOD review: ${approved ? 'APPROVED' : 'REJECTED'}. Reason/Notes: ${rejectionReason || remarks || 'Approved'}`
    }, hodUser);

    return req;
  }

  /**
   * 15C. HOD ACTION: FULFILL ASSET REQUISITION WITH PHYSICAL ASSET ASSIGNMENT
   */
  public fulfillAssetRequisitionWithAssignment(
    requestId: string,
    assetId: string,
    location?: string,
    purpose?: string,
    remarks?: string,
    hodUser?: User
  ): { requisition: AssetRequestRecord; asset: FixedAsset } {
    const st = db.getState() as any;
    const requisitions: AssetRequestRecord[] = st.assetRequisitions || [];
    const idx = requisitions.findIndex(r => r.id === requestId);
    if (idx === -1) throw new Error('Asset request record not found.');

    const req = requisitions[idx];
    const asset = db.getFixedAssetById(assetId);
    if (!asset) throw new Error('Selected asset record not found.');

    if (asset.status !== 'AVAILABLE' && asset.status !== 'IN_STORE' && asset.status !== 'ASSIGNED_TO_HOD') {
      throw new Error(`Cannot assign asset ${asset.assetTag}. Current status is '${asset.status}'. Only available store assets can be assigned.`);
    }

    // 1. Assign asset
    const assignment = this.assignAsset({
      assetId: asset.id,
      assignedToUserId: req.requestedByUserId,
      assignedToName: req.requestedByName,
      assignedToEmpCode: req.requestedByEmpCode,
      assignedToDesignation: req.requestedByDesignation,
      departmentId: req.departmentId,
      departmentName: req.departmentName,
      location: location || req.preferredLocation || 'Faculty Cabin',
      purpose: purpose || req.purpose || 'Official Academic Work',
      remarks: remarks || `Assigned to fulfill requisition ${req.requestNo}`
    }, hodUser);

    const updatedAsset = db.getFixedAssetById(asset.id) || asset;

    // 2. Mark requisition as ASSIGNED
    const now = new Date().toISOString();
    req.status = 'ASSIGNED';
    req.assignedAssetId = updatedAsset.id;
    req.assignedAssetTag = updatedAsset.assetTag;
    req.assignedAssetName = updatedAsset.name;
    req.updatedAt = now;

    requisitions[idx] = req;
    st.assetRequisitions = [...requisitions];
    db.saveState();

    // Create notification for requester
    try {
      db.createNotification({
        userId: req.requestedByUserId,
        title: 'Asset Custody Assigned!',
        message: `Asset ${updatedAsset.name} (${updatedAsset.assetTag}) has been allocated to your custody for request ${req.requestNo}.`,
        type: 'SUCCESS',
        priority: 'HIGH',
        link: '/inventory'
      });
    } catch (_) {}

    return { requisition: req, asset: updatedAsset };
  }

  /**
   * 16. IMMUTABLE ASSET MOVEMENT LOGGING
   */
  public recordAssetMovement(data: {
    assetId: string;
    assetTag: string;
    assetName: string;
    fromUserId?: string;
    fromUserName: string;
    fromRole: string;
    toUserId?: string;
    toUserName: string;
    toRole: string;
    instituteId: string;
    instituteName: string;
    departmentId?: string;
    departmentName?: string;
    location: string;
    action: 'CENTRAL_DISPATCH' | 'HOI_ALLOCATION' | 'HOD_ASSIGNMENT' | 'FACULTY_TRANSFER' | 'RETURN_TO_STORE' | 'MAINTENANCE_DISPATCH' | 'REPLACEMENT' | 'DISPOSAL';
    reason?: string;
    conditionBefore: AssetCondition;
    conditionAfter: AssetCondition;
    approvedById?: string;
    approvedByName?: string;
    approvalDate?: string;
    remarks?: string;
    documentUrl?: string;
  }, actorUser?: User): AssetMovementRecord {
    const st = db.getState() as any;
    const movements: AssetMovementRecord[] = st.assetMovements || [];

    const mov: AssetMovementRecord = {
      id: `mov-${Date.now().toString().slice(-8)}`,
      assetId: data.assetId,
      assetTag: data.assetTag,
      assetName: data.assetName,
      fromUserId: data.fromUserId,
      fromUserName: data.fromUserName,
      fromRole: data.fromRole,
      toUserId: data.toUserId,
      toUserName: data.toUserName,
      toRole: data.toRole,
      instituteId: data.instituteId,
      instituteName: data.instituteName,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      location: data.location,
      action: data.action,
      reason: data.reason,
      conditionBefore: data.conditionBefore,
      conditionAfter: data.conditionAfter,
      approvedById: data.approvedById || actorUser?.id,
      approvedByName: data.approvedByName || actorUser?.name || 'Authorized Officer',
      approvalDate: data.approvalDate || new Date().toISOString().split('T')[0],
      remarks: data.remarks,
      documentUrl: data.documentUrl,
      timestamp: new Date().toISOString()
    };

    st.assetMovements = [mov, ...movements];
    db.saveState();

    return mov;
  }

  /**
   * 17. GET COMPLETE MOVEMENT HISTORY FOR AN ASSET
   */
  public getAssetMovementHistory(assetId: string): AssetMovementRecord[] {
    const st = db.getState() as any;
    const movements: AssetMovementRecord[] = st.assetMovements || [];
    return movements.filter(m => m.assetId === assetId || m.assetTag === assetId);
  }

  /**
   * 18. ROLE SCOPED DASHBOARD DATA: FACULTY / STAFF
   */
  public getFacultyDashboardData(facultyUser: User): FacultyAssetDashboardData {
    const allAssets = db.getFixedAssets(facultyUser);
    const st = db.getState() as any;

    const assetRequisitions: AssetRequestRecord[] = (st.assetRequisitions || []).filter(
      (r: AssetRequestRecord) => r.requestedByUserId === facultyUser.id
    );
    const transferRequests: AssetTransferRequestRecord[] = (st.assetTransferRequests || []).filter(
      (r: AssetTransferRequestRecord) => r.fromUserId === facultyUser.id || r.toUserId === facultyUser.id
    );
    const returnRequests: AssetReturnRequestRecord[] = (st.assetReturnRequests || []).filter(
      (r: AssetReturnRequestRecord) => r.requestedByUserId === facultyUser.id
    );
    const replacementRequests: AssetReplacementRequestRecord[] = (st.assetReplacementRequests || []).filter(
      (r: AssetReplacementRequestRecord) => r.requestedByUserId === facultyUser.id
    );
    const issueReports: AssetIssueReportRecord[] = (st.assetIssueReports || []).filter(
      (r: AssetIssueReportRecord) => r.reportedByUserId === facultyUser.id
    );

    const pendingRequestsCount = 
      assetRequisitions.filter(r => r.status === 'PENDING_HOD_APPROVAL').length +
      transferRequests.filter(r => r.status === 'PENDING_HOD').length +
      returnRequests.filter(r => r.status === 'PENDING_INSPECTION').length +
      replacementRequests.filter(r => r.status === 'PENDING_HOD' || r.status === 'ESCALATED_TO_HOI').length +
      issueReports.filter(r => r.status === 'REPORTED' || r.status === 'UNDER_REVIEW').length;

    return {
      assignedAssets: allAssets,
      totalAssignedCount: allAssets.length,
      inUseCount: allAssets.filter(a => a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED' || a.status === 'ACTIVE').length,
      underMaintenanceCount: allAssets.filter(a => a.status === 'UNDER_MAINTENANCE').length,
      pendingRequestsCount,
      assetRequisitions,
      transferRequests,
      returnRequests,
      replacementRequests,
      issueReports
    };
  }

  /**
   * 19. ROLE SCOPED DASHBOARD DATA: HOD
   */
  public getHODDashboardData(hodUser: User): HODAssetDashboardData {
    const assets = db.getFixedAssets(hodUser);
    const st = db.getState() as any;

    const allDepartmentRequisitions: AssetRequestRecord[] = (st.assetRequisitions || []).filter(
      (r: AssetRequestRecord) => r.departmentId === hodUser.departmentId
    );
    const pendingAssetRequisitions: AssetRequestRecord[] = allDepartmentRequisitions.filter(
      r => r.status === 'PENDING_HOD_APPROVAL'
    );
    const allDepartmentTransfers: AssetTransferRequestRecord[] = (st.assetTransferRequests || []).filter(
      (r: AssetTransferRequestRecord) => r.departmentId === hodUser.departmentId
    );
    const pendingTransferRequests: AssetTransferRequestRecord[] = allDepartmentTransfers.filter(
      r => r.status === 'PENDING_HOD'
    );

    const allDepartmentReturns: AssetReturnRequestRecord[] = (st.assetReturnRequests || []).filter(
      (r: AssetReturnRequestRecord) => r.departmentId === hodUser.departmentId
    );
    const pendingReturnRequests: AssetReturnRequestRecord[] = allDepartmentReturns.filter(
      r => r.status === 'PENDING_INSPECTION'
    );

    const allDepartmentReplacements: AssetReplacementRequestRecord[] = (st.assetReplacementRequests || []).filter(
      (r: AssetReplacementRequestRecord) => r.departmentId === hodUser.departmentId
    );
    const pendingReplacementRequests: AssetReplacementRequestRecord[] = allDepartmentReplacements.filter(
      r => r.status === 'PENDING_HOD'
    );

    const allDepartmentIssues: AssetIssueReportRecord[] = (st.assetIssueReports || []).filter(
      (r: AssetIssueReportRecord) => r.departmentId === hodUser.departmentId
    );
    const activeIssueReports: AssetIssueReportRecord[] = allDepartmentIssues.filter(
      r => r.status === 'REPORTED' || r.status === 'UNDER_REVIEW'
    );

    const recentMovements: AssetMovementRecord[] = (st.assetMovements || []).filter(
      (m: AssetMovementRecord) => m.departmentId === hodUser.departmentId
    );

    return {
      departmentAssets: assets,
      totalAssetsCount: assets.length,
      assignedToFacultyCount: assets.filter(a => a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED').length,
      assignedToStaffCount: assets.filter(a => a.status === 'ASSIGNED_TO_STAFF').length,
      availableInStoreCount: assets.filter(a => a.status === 'ASSIGNED_TO_HOD' || a.status === 'IN_STORE' || a.status === 'AVAILABLE').length,
      underMaintenanceCount: assets.filter(a => a.status === 'UNDER_MAINTENANCE').length,
      damagedLostCount: assets.filter(a => a.status === 'DAMAGED' || a.status === 'LOST').length,
      pendingAssetRequisitions,
      allDepartmentRequisitions,
      pendingTransferRequests,
      allDepartmentTransfers,
      pendingReturnRequests,
      allDepartmentReturns,
      pendingReplacementRequests,
      allDepartmentReplacements,
      activeIssueReports,
      allDepartmentIssues,
      recentMovements
    };
  }

  /**
   * 20. ROLE SCOPED DASHBOARD DATA: HOI
   */
  public getHOIDashboardData(hoiUser: User): HOIAssetDashboardData {
    const assets = db.getFixedAssets(hoiUser);
    const st = db.getState() as any;

    const escalatedReplacementRequests: AssetReplacementRequestRecord[] = (st.assetReplacementRequests || []).filter(
      (r: AssetReplacementRequestRecord) => r.status === 'ESCALATED_TO_HOI'
    );
    const recentMovements: AssetMovementRecord[] = (st.assetMovements || []).filter(
      (m: AssetMovementRecord) => m.instituteId === hoiUser.instituteId
    );

    return {
      institutionAssets: assets,
      totalAssetsCount: assets.length,
      institutionStoreCount: assets.filter(a => a.status === 'ASSIGNED_TO_HOI' || a.status === 'AVAILABLE').length,
      allocatedToDeptsCount: assets.filter(a => a.status === 'ASSIGNED_TO_HOD' || a.status === 'ASSIGNED_TO_FACULTY' || a.status === 'ASSIGNED_TO_STAFF').length,
      escalatedReplacementRequests,
      recentMovements
    };
  }

  /**
   * 21. RETURN ASSET TO STORE
   */
  public returnAsset(params: {
    assetId: string;
    conditionAtReturn: AssetCondition;
    remarks?: string;
  }, actorUser?: User): FixedAsset {
    const res = db.returnAsset(params.assetId, {
      conditionAtReturn: params.conditionAtReturn,
      remarks: params.remarks
    }, actorUser);

    if (!res.success || !res.asset) throw new Error(res.error || 'Failed to return asset.');
    return res.asset;
  }

  /**
   * 22. RECEIVE CONSUMABLE STOCK
   */
  public receiveConsumableStock(params: {
    itemId: string;
    quantity: number;
    unitPrice?: number;
    vendorName?: string;
    invoiceNo?: string;
    purchaseOrderNo?: string;
    receivedByName?: string;
    remarks?: string;
  }, actorUser?: User): StockTransactionRecord {
    if (!params.quantity || params.quantity <= 0) {
      throw new Error('Please specify a positive quantity to receive.');
    }

    const res = db.receiveStock({
      itemId: params.itemId,
      quantity: Number(params.quantity),
      unitPrice: Number(params.unitPrice) || 0,
      vendorName: params.vendorName,
      invoiceNo: params.invoiceNo,
      purchaseOrderNo: params.purchaseOrderNo,
      receivedByName: params.receivedByName || actorUser?.name || 'Store Officer',
      remarks: params.remarks
    }, actorUser);

    if (!res.success || !res.transaction) throw new Error(res.error || 'Failed to receive stock.');
    return res.transaction;
  }

  /**
   * 23. ISSUE CONSUMABLE STOCK
   */
  public issueConsumableStock(params: {
    itemId: string;
    quantity: number;
    issuedToName: string;
    issuedToEmpCode?: string;
    issuedToDeptName?: string;
    purpose?: string;
    approvedByName?: string;
    remarks?: string;
  }, actorUser?: User): StockTransactionRecord {
    const item = db.getConsumables().find(c => c.id === params.itemId || c.itemCode === params.itemId);
    if (!item) throw new Error('Consumable item not found.');

    const available = Number(item.currentBalance) || 0;
    const requested = Number(params.quantity);

    if (requested <= 0) throw new Error('Please specify a valid quantity to issue.');
    if (requested > available) {
      throw new Error(`Insufficient stock! Available: ${available} ${item.unit || 'units'}, Requested: ${requested} ${item.unit || 'units'}.`);
    }

    const res = db.issueStock({
      itemId: params.itemId,
      quantity: requested,
      issuedToName: params.issuedToName,
      issuedToEmpCode: params.issuedToEmpCode,
      issuedToDeptName: params.issuedToDeptName,
      purpose: params.purpose,
      approvedByName: params.approvedByName || 'Department HOD',
      remarks: params.remarks
    }, actorUser);

    if (!res.success || !res.transaction) throw new Error(res.error || 'Failed to issue stock.');
    return res.transaction;
  }

  /**
   * 24. RECORD ASSET MAINTENANCE
   */
  public recordMaintenance(params: {
    assetId: string;
    issueDescription: string;
    vendorTechnician?: string;
    estimatedCost?: number;
    expectedCompletionDate?: string;
    remarks?: string;
  }, actorUser?: User): AssetMaintenanceRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    return db.createMaintenanceLog({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      issueDescription: params.issueDescription,
      vendorTechnician: params.vendorTechnician || 'University Maintenance Dept',
      estimatedCost: Number(params.estimatedCost) || 0,
      scheduledDate: params.expectedCompletionDate,
      remarks: params.remarks,
      status: 'IN_PROGRESS'
    }, actorUser);
  }

  /**
   * 25. PHYSICAL ASSET VERIFICATION
   */
  public recordPhysicalVerification(params: {
    assetId: string;
    foundLocation?: string;
    actualCustodian?: string;
    physicalCondition: AssetCondition;
    verificationStatus: 'VERIFIED' | 'LOCATION_MISMATCH' | 'CUSTODIAN_MISMATCH' | 'DAMAGED' | 'MISSING';
    verifiedByName?: string;
    remarks?: string;
  }, actorUser?: User): PhysicalVerificationRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    return db.createPhysicalVerification({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      expectedLocation: `${asset.building || ''} - ${asset.roomNo || ''}`,
      actualLocation: params.foundLocation || `${asset.building || ''} - ${asset.roomNo || ''}`,
      expectedCustodian: asset.assignedToName || 'Department Store',
      actualCustodian: params.actualCustodian || asset.assignedToName || 'Department Store',
      physicalCondition: params.physicalCondition,
      status: params.verificationStatus as any,
      verifiedByName: params.verifiedByName || actorUser?.name || 'Inspection Committee',
      discrepancyNotes: params.remarks
    }, actorUser);
  }

  /**
   * 26. DISPOSAL / WRITE-OFF ASSET
   */
  public recordDisposal(params: {
    assetId: string;
    reason: string;
    disposalMethod: 'E_WASTE_AUCTION' | 'SCRAP_SALE' | 'DONATION' | 'BUYBACK_EXCHANGE' | 'RECYCLING' | 'WRITE_OFF';
    approvalAuthority: string;
    approvalReference?: string;
    scrapValueRealized?: number;
    remarks?: string;
  }, actorUser?: User): AssetDisposalRecord {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    const res = db.disposeAsset({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      reason: params.reason,
      bookValue: asset.currentValue || asset.purchaseCost || 0,
      disposalValue: Number(params.scrapValueRealized) || 0,
      disposalMethod: params.disposalMethod as any,
      approvedByName: params.approvalAuthority,
      remarks: `${params.remarks || ''} (Ref: ${params.approvalReference || 'UDB/01'})`,
      status: 'DISPOSED'
    }, actorUser);

    if (!res.success || !res.disposal) throw new Error(res.error || 'Failed to record disposal.');
    return res.disposal;
  }

  /**
   * 27. ARCHIVE ASSET RECORD (NON-DESTRUCTIVE ARCHIVAL)
   */
  public archiveAsset(params: {
    assetId: string;
    reason: string;
    approvedBy?: string;
    remarks?: string;
  }, actorUser?: User): FixedAsset {
    const asset = db.getFixedAssetById(params.assetId);
    if (!asset) throw new Error('Asset record not found.');

    const updated = db.updateFixedAsset(asset.id, {
      status: 'ARCHIVED' as any,
      remarks: `Archived: ${params.reason}. Approved by ${params.approvedBy || actorUser?.name || 'Authorized Admin'}. ${params.remarks || ''}`
    }, actorUser);

    this.recordAssetMovement({
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      fromUserId: asset.assignedToUserId,
      fromUserName: asset.assignedToName || 'Active Inventory',
      fromRole: 'STORE',
      toUserId: actorUser?.id,
      toUserName: 'Historical University Archive',
      toRole: 'ARCHIVE',
      instituteId: asset.instituteId,
      instituteName: asset.instituteName,
      departmentId: asset.departmentId,
      departmentName: asset.departmentName,
      location: 'University Historical Archive Registry',
      action: 'DISPOSAL',
      reason: params.reason,
      conditionBefore: asset.assetCondition,
      conditionAfter: asset.assetCondition,
      approvedByName: params.approvedBy || actorUser?.name || 'Administrator',
      remarks: `Asset moved to permanent historical archive. ${params.remarks || ''}`
    }, actorUser);

    db.logInventoryAudit('ARCHIVE' as any, 'ASSETS', asset.id, asset.assetTag, {
      remarks: `Reason: ${params.reason}. Approved by ${params.approvedBy || actorUser?.name || 'Authorized Admin'}. ${params.remarks || ''}`
    }, actorUser);

    return updated;
  }

  /**
   * 27. EXCEL REPORT EXPORTER (12 OFFICIAL REPORTS)
   */
  public async exportOfficialReport(
    reportType: 
      | 'ASSET_REGISTER' | 'DEPT_ASSETS' | 'CATEGORY_ASSETS' | 'LOCATION_ASSETS' 
      | 'ASSIGNED_ASSETS' | 'CONSUMABLE_STOCK' | 'LOW_STOCK' | 'MAINTENANCE' 
      | 'PHYSICAL_VERIFICATION' | 'DISPOSAL' | 'ASSET_VALUATION' | 'AUDIT_TRAIL',
    filter?: { instituteId?: string; departmentId?: string }
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Swarrnim Startup & Innovation University - Central Stores & Inventory Depot';
    workbook.created = new Date();

    const reportTitles: Record<string, string> = {
      ASSET_REGISTER: 'CENTRAL ASSET REGISTER & MASTER INVENTORY REPORT',
      DEPT_ASSETS: 'DEPARTMENT-WISE ASSET ALLOCATION & VALUATION REPORT',
      CATEGORY_ASSETS: 'CATEGORY-WISE ASSET DISTRIBUTION REPORT',
      LOCATION_ASSETS: 'LOCATION & ROOM-WISE ASSET INVENTORY REPORT',
      ASSIGNED_ASSETS: 'STAFF & FACULTY ASSIGNED ASSET CUSTODY REPORT',
      CONSUMABLE_STOCK: 'CONSUMABLES & LAB SUPPLIES STOCK REGISTER REPORT',
      LOW_STOCK: 'CRITICAL LOW STOCK & REORDER WARNING REPORT',
      MAINTENANCE: 'ASSET MAINTENANCE & SERVICE LOG REGISTER REPORT',
      PHYSICAL_VERIFICATION: 'ANNUAL PHYSICAL VERIFICATION & AUDIT RECONCILIATION REPORT',
      DISPOSAL: 'ASSET DISPOSAL & WRITE-OFF ARCHIVE REPORT',
      ASSET_VALUATION: 'INSTITUTIONAL ASSET VALUATION & DEPRECIATION REPORT',
      AUDIT_TRAIL: 'CENTRAL INVENTORY & ASSET AUDIT TRAIL REPORT'
    };

    const title = reportTitles[reportType] || 'INVENTORY REPORT';
    const ws = workbook.addWorksheet(title.slice(0, 31), {
      views: [{ state: 'frozen', ySplit: 5 }]
    });

    // University Header
    ws.mergeCells('A1:L1');
    const headerCell = ws.getCell('A1');
    headerCell.value = 'SWARRNIM STARTUP & INNOVATION UNIVERSITY';
    headerCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:L2');
    const subCell = ws.getCell('A2');
    subCell.value = title;
    subCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFD700' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F2C59' } };
    subCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 22;

    // Metadata Row
    ws.getCell('A3').value = `Generated: ${new Date().toLocaleString('en-IN')}`;
    ws.getCell('A3').font = { italic: true, size: 9 };
    ws.getCell('F3').value = `Institution: Swarrnim School of Computing & IT (SSCIT)`;
    ws.getCell('F3').font = { bold: true, size: 9 };

    const st = db.getState() as any;
    const assets = db.getFixedAssets(undefined, filter);
    const consumables = db.getConsumables(undefined, filter);
    const maintenance: AssetMaintenanceRecord[] = st.assetMaintenanceLogs || [];
    const verifications: PhysicalVerificationRecord[] = st.physicalVerifications || [];
    const disposals: AssetDisposalRecord[] = st.assetDisposals || [];
    const audits: InventoryAuditRecord[] = db.getInventoryAuditLogs();

    let headers: string[] = [];
    let rowsData: any[][] = [];

    if (reportType === 'ASSET_REGISTER' || reportType === 'DEPT_ASSETS' || reportType === 'CATEGORY_ASSETS' || reportType === 'LOCATION_ASSETS' || reportType === 'ASSIGNED_ASSETS' || reportType === 'ASSET_VALUATION') {
      headers = [
        'ASSET TAG', 'ASSET NAME', 'CATEGORY', 'DEPARTMENT', 'LOCATION',
        'ASSIGNED TO', 'PURCHASE DATE', 'PURCHASE COST (₹)', 'BOOK VALUE (₹)',
        'CONDITION', 'STATUS', 'LAST VERIFIED'
      ];
      rowsData = assets.map(a => [
        a.assetTag,
        a.name,
        a.categoryName,
        a.departmentName || 'SSCIT',
        `${a.building || ''} - ${a.roomNo || ''}`,
        a.assignedToName || 'In Store',
        a.purchaseDate || '2025-06-15',
        a.purchaseCost || 0,
        a.currentValue || a.purchaseCost || 0,
        a.assetCondition,
        a.status,
        a.updatedAt ? new Date(a.updatedAt).toISOString().split('T')[0] : '2026-08-15'
      ]);
    } else if (reportType === 'CONSUMABLE_STOCK' || reportType === 'LOW_STOCK') {
      headers = [
        'ITEM CODE', 'ITEM NAME', 'CATEGORY', 'UNIT', 'OPENING STOCK',
        'RECEIVED', 'ISSUED', 'AVAILABLE BALANCE', 'REORDER LEVEL', 'STATUS'
      ];
      const targetItems = reportType === 'LOW_STOCK' 
        ? consumables.filter(c => (c.currentBalance || 0) <= (c.reorderLevel || c.minimumStockLevel || 10))
        : consumables;

      rowsData = targetItems.map(c => [
        c.itemCode,
        c.name,
        c.categoryName,
        c.unit,
        c.openingQuantity || 0,
        c.receivedQuantity || 0,
        c.issuedQuantity || 0,
        c.currentBalance || 0,
        c.reorderLevel || 10,
        (c.currentBalance || 0) <= 0 ? 'OUT OF STOCK' : (c.currentBalance || 0) <= (c.reorderLevel || 10) ? 'LOW STOCK' : 'IN STOCK'
      ]);
    } else if (reportType === 'MAINTENANCE') {
      headers = [
        'MAINTENANCE ID', 'ASSET TAG', 'ASSET NAME', 'DEPARTMENT', 'ISSUE DESCRIPTION',
        'TECHNICIAN / VENDOR', 'REPORTED DATE', 'ESTIMATED COST (₹)', 'ACTUAL COST (₹)', 'STATUS'
      ];
      rowsData = maintenance.map((m: AssetMaintenanceRecord) => [
        m.maintenanceNo || m.id,
        m.assetTag,
        m.assetName,
        'SSCIT',
        m.issueDescription,
        m.vendorTechnician,
        m.reportedDate ? new Date(m.reportedDate).toISOString().split('T')[0] : '2026-08-10',
        m.estimatedCost || 0,
        m.actualCost || 0,
        m.status
      ]);
    } else if (reportType === 'PHYSICAL_VERIFICATION') {
      headers = [
        'VERIFICATION ID', 'ASSET TAG', 'ASSET NAME', 'EXPECTED LOCATION', 'FOUND LOCATION',
        'EXPECTED CUSTODIAN', 'ACTUAL CUSTODIAN', 'CONDITION', 'STATUS', 'VERIFIED BY', 'DATE'
      ];
      rowsData = verifications.map((v: PhysicalVerificationRecord) => [
        v.verificationNo || v.id,
        v.assetTag,
        v.assetName,
        v.expectedLocation,
        v.actualLocation,
        v.expectedCustodian,
        v.actualCustodian,
        v.physicalCondition,
        v.status,
        v.verifiedByName,
        v.verificationDate ? new Date(v.verificationDate).toISOString().split('T')[0] : '2026-08-15'
      ]);
    } else if (reportType === 'DISPOSAL') {
      headers = [
        'DISPOSAL ID', 'ASSET TAG', 'ASSET NAME', 'REASON', 'CONDITION',
        'BOOK VALUE (₹)', 'SCRAP REALIZED (₹)', 'METHOD', 'APPROVAL AUTHORITY', 'STATUS'
      ];
      rowsData = disposals.map((d: AssetDisposalRecord) => [
        d.disposalNo || d.id,
        d.assetTag,
        d.assetName,
        d.reason,
        'DAMAGED',
        d.bookValue || 0,
        d.disposalValue || 0,
        d.disposalMethod,
        d.approvedByName || 'University Authority',
        d.status
      ]);
    } else {
      headers = ['DATE & TIME', 'USER', 'ROLE', 'ACTION', 'MODULE', 'RECORD ID', 'DETAILS'];
      rowsData = audits.map((a: InventoryAuditRecord) => [
        a.timestamp ? new Date(a.timestamp).toLocaleString('en-IN') : '2026-08-15 10:00',
        a.performedByName || 'Admin',
        a.performedByRole || 'ADMIN',
        a.action,
        a.module,
        a.entityId,
        a.remarks || a.entityName
      ]);
    }

    // Set Table Headers
    ws.getRow(5).values = headers;
    ws.getRow(5).height = 24;
    ws.getRow(5).eachCell(cell => {
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF001F3F' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FF001F3F' } }
      };
    });

    // Populate rows
    rowsData.forEach(r => {
      const row = ws.addRow(r);
      row.height = 20;
      row.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 9 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // Auto fit widths
    ws.columns = headers.map(() => ({ width: 22 }));

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = `SSIU_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // CANONICAL DISCRETE BUSINESS TRANSACTION QUERIES (NO DATA DUPLICATION)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Get Asset Transfers strictly matching business transfer requests.
   */
  public getAssetTransfers(scope?: { departmentId?: string; instituteId?: string; userId?: string }): AssetTransferRequestRecord[] {
    const st = db.getState() as any;
    let list: AssetTransferRequestRecord[] = st.assetTransferRequests || [];

    if (scope?.userId) {
      list = list.filter(t => t.fromUserId === scope.userId || t.toUserId === scope.userId);
    }
    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(t => t.departmentId === scope.departmentId);
    }
    if (scope?.instituteId && scope.instituteId !== 'ALL') {
      list = list.filter(t => (t as any).instituteId === scope.instituteId);
    }
    return list;
  }

  /**
   * Get Asset Returns strictly matching return requests and inwards.
   */
  public getAssetReturns(scope?: { departmentId?: string; instituteId?: string; userId?: string }): AssetReturnRequestRecord[] {
    const st = db.getState() as any;
    let list: AssetReturnRequestRecord[] = st.assetReturnRequests || [];

    if (scope?.userId) {
      list = list.filter(r => r.requestedByUserId === scope.userId);
    }
    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(r => r.departmentId === scope.departmentId);
    }
    if (scope?.instituteId && scope.instituteId !== 'ALL') {
      list = list.filter(r => (r as any).instituteId === scope.instituteId);
    }
    return list;
  }

  /**
   * Get Asset Replacements strictly matching RMA / hardware replacement requests.
   */
  public getAssetReplacements(scope?: { departmentId?: string; instituteId?: string; userId?: string }): AssetReplacementRequestRecord[] {
    const st = db.getState() as any;
    let list: AssetReplacementRequestRecord[] = st.assetReplacementRequests || [];

    if (scope?.userId) {
      list = list.filter(r => r.requestedByUserId === scope.userId);
    }
    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(r => r.departmentId === scope.departmentId);
    }
    if (scope?.instituteId && scope.instituteId !== 'ALL') {
      list = list.filter(r => (r as any).instituteId === scope.instituteId);
    }
    return list;
  }

  /**
   * Get Asset Issues strictly matching reported defects and damage tickets.
   */
  public getAssetIssues(scope?: { departmentId?: string; instituteId?: string; userId?: string }): AssetIssueReportRecord[] {
    const st = db.getState() as any;
    let list: AssetIssueReportRecord[] = st.assetIssueReports || [];

    if (scope?.userId) {
      list = list.filter(i => i.reportedByUserId === scope.userId);
    }
    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(i => i.departmentId === scope.departmentId);
    }
    if (scope?.instituteId && scope.instituteId !== 'ALL') {
      list = list.filter(i => (i as any).instituteId === scope.instituteId);
    }
    return list;
  }

  /**
   * Get Maintenance Records strictly matching service and repair events.
   */
  public getAssetMaintenanceRecords(scope?: { departmentId?: string; instituteId?: string }): AssetMaintenanceRecord[] {
    const st = db.getState() as any;
    let list: AssetMaintenanceRecord[] = st.assetMaintenanceLogs || st.assetMaintenanceRecords || [];

    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(m => (m as any).departmentId === scope.departmentId);
    }
    return list;
  }

  /**
   * Get Physical Verification Records strictly matching audit scans.
   */
  public getAssetVerifications(scope?: { departmentId?: string; instituteId?: string }): PhysicalVerificationRecord[] {
    const st = db.getState() as any;
    let list: PhysicalVerificationRecord[] = st.physicalVerifications || [];

    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(v => (v as any).departmentId === scope.departmentId);
    }
    return list;
  }

  /**
   * Get Asset Requisitions strictly matching faculty / department new requirements.
   */
  public getAssetRequisitions(scope?: { departmentId?: string; instituteId?: string; userId?: string }): AssetRequestRecord[] {
    const st = db.getState() as any;
    let list: AssetRequestRecord[] = st.assetRequisitions || [];

    if (scope?.userId) {
      list = list.filter(r => r.requestedByUserId === scope.userId);
    }
    if (scope?.departmentId && scope.departmentId !== 'ALL') {
      list = list.filter(r => r.departmentId === scope.departmentId);
    }
    if (scope?.instituteId && scope.instituteId !== 'ALL') {
      list = list.filter(r => r.instituteId === scope.instituteId);
    }
    return list;
  }

  /**
   * Get Department Fixed Assets strictly for register & inventory custody views.
   */
  public getDepartmentAssets(scope?: { departmentId?: string; instituteId?: string }): FixedAsset[] {
    return db.getFixedAssets(undefined, {
      departmentId: scope?.departmentId && scope.departmentId !== 'ALL' ? scope.departmentId : undefined,
      instituteId: scope?.instituteId && scope.instituteId !== 'ALL' ? scope.instituteId : undefined
    });
  }
}

export const inventoryManagementService = new CentralInventoryManagementService();
