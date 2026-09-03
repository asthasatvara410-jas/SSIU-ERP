import { 
  UniversityAsset, 
  AssetCategory, 
  AssetCondition, 
  AssetStatus, 
  AssetDepartmentAllocation, 
  AssetTransferRecord, 
  AssetReturnRecord, 
  AssetMaintenanceRecord, 
  AssetAllocationRequest, 
  AssetHistoryEvent,
  User,
  Faculty
} from '../types';
import { db } from './db';
import * as XLSX from 'xlsx';

export interface RegisterAssetPayload {
  name: string;
  category: AssetCategory;
  subCategory: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  assetTag?: string;
  isSerialized?: boolean;
  quantity?: number;
  totalQuantity?: number;
  purchaseDate: string;
  purchaseCost: number;
  vendor?: string;
  invoiceNumber?: string;
  fundingSource?: string;
  warrantyStart?: string;
  warrantyEnd?: string;
  warrantyProvider?: string;
  warrantyNumber?: string;
  condition?: AssetCondition;
  status?: AssetStatus;
  initialInstituteId?: string;
  initialDepartmentId?: string;
  building?: string;
  floor?: string;
  room?: string;
  labId?: string;
  classroomId?: string;
  officeName?: string;
  assignedPersonId?: string;
  assignedPersonType?: 'FACULTY' | 'STAFF' | 'DEPARTMENT' | 'LAB' | 'CLASSROOM' | 'OFFICE' | 'STORE';
  remarks?: string;
  image?: string;
}

export interface AllocateAssetPayload {
  assetMasterId: string;
  instituteId: string;
  departmentId: string;
  allocatedQuantity: number;
  building?: string;
  floor?: string;
  room?: string;
  labId?: string;
  classroomId?: string;
  officeName?: string;
  assignedPersonId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  remarks?: string;
}

export interface TransferAssetPayload {
  allocationId?: string;
  assetMasterId: string;
  quantity: number;
  toInstituteId: string;
  toDepartmentId: string;
  toLocation?: string;
  toPersonId?: string;
  reason: string;
}

export interface ReturnAssetPayload {
  allocationId?: string;
  assetMasterId: string;
  quantity: number;
  fromDepartmentId: string;
  condition: AssetCondition;
  remarks?: string;
}

export interface MaintenancePayload {
  assetMasterId: string;
  issueDescription: string;
  serviceType: 'PREVENTIVE' | 'CORRECTIVE' | 'UPGRADE' | 'WARRANTY_SERVICE' | 'REPAIR';
  vendor?: string;
  cost: number;
  maintenanceDate: string;
  nextServiceDate?: string;
  isUnderWarranty?: boolean;
  remarks?: string;
}

export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  importedAssets: UniversityAsset[];
  errors: { row: number; assetName: string; serialNumber?: string; error: string }[];
}

export class AssetManagementService {
  private static instance: AssetManagementService;

  private constructor() {}

  public static getInstance(): AssetManagementService {
    if (!AssetManagementService.instance) {
      AssetManagementService.instance = new AssetManagementService();
    }
    return AssetManagementService.instance;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 1. UNIQUE ASSET ID GENERATOR
  // ══════════════════════════════════════════════════════════════════════════════
  public generateAssetId(
    category: AssetCategory = 'IT_ELECTRONICS',
    subCategoryOrYear?: string,
    explicitYear?: string
  ): string {
    let year = '2026';
    let subCategory = '';

    if (subCategoryOrYear) {
      if (/^\d{4}$/.test(subCategoryOrYear)) {
        year = subCategoryOrYear;
      } else {
        subCategory = subCategoryOrYear.toLowerCase();
      }
    }
    if (explicitYear && /^\d{4}$/.test(explicitYear)) {
      year = explicitYear;
    }

    let prefix = 'GEN';
    if (subCategory.includes('desktop') || subCategory.includes('pc') || subCategory.includes('computer')) {
      prefix = 'PC';
    } else if (subCategory.includes('laptop') || subCategory.includes('notebook')) {
      prefix = 'LAP';
    } else if (subCategory.includes('chair') || subCategory.includes('seating')) {
      prefix = 'CHAIR';
    } else if (subCategory.includes('table') || subCategory.includes('desk')) {
      prefix = 'TABLE';
    } else if (subCategory.includes('projector')) {
      prefix = 'PROJ';
    } else if (subCategory.includes('server')) {
      prefix = 'SRV';
    } else if (subCategory.includes('switch') || subCategory.includes('router')) {
      prefix = 'NET';
    } else {
      const categoryCodeMap: Record<AssetCategory, string> = {
        FURNITURE: 'FURN',
        IT_ELECTRONICS: 'IT',
        CLASSROOM: 'CR',
        LABORATORY: 'LAB',
        OFFICE: 'OFF',
        SPORTS: 'SPORT',
        LIBRARY: 'LIB',
        EVENT_CULTURAL: 'EVENT',
        NETWORKING: 'NET',
        SAFETY: 'SAFE',
        VEHICLES: 'VEH',
        MISCELLANEOUS: 'MISC'
      };
      prefix = categoryCodeMap[category] || 'GEN';
    }

    const assets = db.getUniversityAssets();
    let maxSeq = 0;
    const regex = new RegExp(`^SSIU-${prefix}-${year}-(\\d{5})$`, 'i');

    assets.forEach(a => {
      if (a.assetId) {
        const m = a.assetId.match(regex);
        if (m) {
          const num = parseInt(m[1], 10);
          if (num > maxSeq) maxSeq = num;
        }
      }
    });

    const nextSeq = (maxSeq + 1).toString().padStart(5, '0');
    return `SSIU-${prefix}-${year}-${nextSeq}`;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 2. ASSET REGISTRATION & MASTER CRUD
  // ══════════════════════════════════════════════════════════════════════════════
  public registerAsset(
    payload: RegisterAssetPayload,
    actor: User
  ): { success: boolean; asset?: UniversityAsset; message: string } {
    const cleanName = payload.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Asset Name is required.' };
    }

    const assets = db.getUniversityAssets();
    const cleanSerial = payload.serialNumber?.trim();

    // Serial Number uniqueness check if provided
    if (cleanSerial && cleanSerial !== 'N/A' && cleanSerial !== 'Not Applicable') {
      const existing = assets.find(a => a.serialNumber && a.serialNumber.toLowerCase() === cleanSerial.toLowerCase());
      if (existing) {
        return { 
          success: false, 
          message: `Asset Serial Number "${cleanSerial}" is already registered for "${existing.name}" (${existing.assetId}).` 
        };
      }
    }

    const year = payload.purchaseDate ? payload.purchaseDate.slice(0, 4) : '2026';
    const assetId = this.generateAssetId(payload.category, payload.subCategory, year);
    const id = `ast-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const qty = payload.isSerialized ? 1 : Math.max(1, payload.quantity || payload.totalQuantity || 1);
    const isAllocated = Boolean(payload.initialDepartmentId);

    let assignedPersonName = undefined;
    if (payload.assignedPersonId) {
      const fac = db.getUsers().find(u => u.id === payload.assignedPersonId) || db.getFaculty().find(f => f.id === payload.assignedPersonId);
      if (fac) assignedPersonName = fac.name;
    }

    const newAsset: UniversityAsset = {
      id,
      assetId,
      name: cleanName,
      category: payload.category,
      subCategory: payload.subCategory || 'General',
      brand: payload.brand || 'SSIU Asset',
      model: payload.model || 'Standard',
      serialNumber: cleanSerial || undefined,
      assetTag: payload.assetTag || assetId,
      isSerialized: Boolean(payload.isSerialized),
      totalQuantity: qty,
      availableQuantity: isAllocated ? 0 : qty,
      allocatedQuantity: isAllocated ? qty : 0,
      purchaseDate: payload.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseCost: Number(payload.purchaseCost) || 0,
      vendor: payload.vendor || 'Authorized SSIU Vendor',
      invoiceNumber: payload.invoiceNumber || `INV-${year}-${Date.now().toString().slice(-4)}`,
      fundingSource: payload.fundingSource || 'University Capital Budget',
      warrantyStart: payload.warrantyStart || undefined,
      warrantyEnd: payload.warrantyEnd || undefined,
      warrantyProvider: payload.warrantyProvider || undefined,
      warrantyNumber: payload.warrantyNumber || undefined,
      condition: payload.condition || 'NEW',
      status: isAllocated ? 'ALLOCATED' : 'IN_STOCK',
      currentInstituteId: payload.initialInstituteId || undefined,
      currentDepartmentId: payload.initialDepartmentId || undefined,
      building: payload.building || undefined,
      floor: payload.floor || undefined,
      room: payload.room || undefined,
      labId: payload.labId || undefined,
      classroomId: payload.classroomId || undefined,
      officeName: payload.officeName || undefined,
      assignedPersonType: payload.assignedPersonType || (payload.assignedPersonId ? 'FACULTY' : isAllocated ? 'DEPARTMENT' : 'STORE'),
      assignedPersonId: payload.assignedPersonId || undefined,
      assignedPersonName,
      assignedDate: isAllocated ? new Date().toISOString().split('T')[0] : undefined,
      qrCodeData: JSON.stringify({
        assetId,
        name: cleanName,
        category: payload.category,
        brand: payload.brand,
        serial: cleanSerial || 'N/A',
        institute: payload.initialInstituteId || 'SSIU',
        department: payload.initialDepartmentId || 'CENTRAL_STORE'
      }),
      image: payload.image || undefined,
      remarks: payload.remarks || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.addEntity('universityAssets', newAsset, `Registered asset ${newAsset.name} (${newAsset.assetId}) in University Asset Master`);

    // If initially allocated to a department, create allocation record
    if (isAllocated && payload.initialDepartmentId) {
      const dept = db.getDepartments().find(d => d.id === payload.initialDepartmentId);
      const inst = db.getInstitutes().find(i => i.id === payload.initialInstituteId);
      const allocRecord: AssetDepartmentAllocation = {
        id: `alloc-${Date.now()}`,
        assetMasterId: newAsset.id,
        assetId: newAsset.assetId,
        assetName: newAsset.name,
        category: newAsset.category,
        instituteId: payload.initialInstituteId || 'inst-1',
        instituteName: inst?.name,
        departmentId: payload.initialDepartmentId,
        departmentName: dept?.name,
        allocatedQuantity: qty,
        building: payload.building,
        floor: payload.floor,
        room: payload.room,
        labId: payload.labId,
        classroomId: payload.classroomId,
        officeName: payload.officeName,
        assignedPersonId: payload.assignedPersonId,
        assignedPersonName,
        allocatedAt: new Date().toISOString(),
        allocatedBy: actor.name,
        effectiveFrom: payload.purchaseDate || new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        remarks: payload.remarks
      };
      db.addEntity('assetDepartmentAllocations', allocRecord, `Allocated ${qty} unit(s) of ${newAsset.name} to ${dept?.name}`);
    }

    // Log Immutable Asset History
    this.logHistoryEvent({
      assetMasterId: newAsset.id,
      assetId: newAsset.assetId,
      actionType: 'CREATED',
      actorName: actor.name,
      actorRole: actor.role,
      newDepartment: payload.initialDepartmentId ? db.getDepartments().find(d => d.id === payload.initialDepartmentId)?.name : 'Central Store Inventory',
      newLocation: payload.building ? `${payload.building} ${payload.room || ''}` : 'University Central Store',
      newStatus: newAsset.status,
      quantity: qty,
      remarks: `Initial registration into University Asset Master by ${actor.name}.`
    });

    return {
      success: true,
      asset: newAsset,
      message: `Asset "${newAsset.name}" successfully registered with Asset ID: ${newAsset.assetId}`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 3. DEPARTMENT-WISE ALLOCATION ENGINE
  // ══════════════════════════════════════════════════════════════════════════════
  public allocateAssetToDepartment(
    payload: AllocateAssetPayload,
    actor: User
  ): { success: boolean; allocation?: AssetDepartmentAllocation; message: string } {
    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === payload.assetMasterId || a.assetId === payload.assetMasterId);

    if (!asset) {
      return { success: false, message: 'Asset not found in University Master.' };
    }

    const requestedQty = Math.max(1, payload.allocatedQuantity || 1);

    if (asset.availableQuantity < requestedQty) {
      return {
        success: false,
        message: `Insufficient available stock. Available: ${asset.availableQuantity}, Requested: ${requestedQty}.`
      };
    }

    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId) || db.getInstitutes().find(i => i.id === dept?.instituteId);

    let assignedPersonName = undefined;
    if (payload.assignedPersonId) {
      const fac = db.getUsers().find(u => u.id === payload.assignedPersonId) || db.getFaculty().find(f => f.id === payload.assignedPersonId);
      if (fac) assignedPersonName = fac.name;
    }

    // Decrement available quantity and increment allocated quantity
    asset.availableQuantity -= requestedQty;
    asset.allocatedQuantity += requestedQty;
    asset.status = asset.availableQuantity === 0 ? 'ALLOCATED' : 'IN_USE';
    asset.currentInstituteId = payload.instituteId;
    asset.currentDepartmentId = payload.departmentId;
    asset.building = payload.building || asset.building;
    asset.floor = payload.floor || asset.floor;
    asset.room = payload.room || asset.room;
    asset.labId = payload.labId || asset.labId;
    asset.classroomId = payload.classroomId || asset.classroomId;
    asset.officeName = payload.officeName || asset.officeName;
    asset.assignedPersonId = payload.assignedPersonId || asset.assignedPersonId;
    asset.assignedPersonName = assignedPersonName || asset.assignedPersonName;
    asset.updatedAt = new Date().toISOString();

    db.updateEntity('universityAssets', asset.id, asset, `Allocated ${requestedQty} units of ${asset.name} to ${dept?.name}`);

    // Create Allocation Record
    const allocation: AssetDepartmentAllocation = {
      id: `alloc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      assetMasterId: asset.id,
      assetId: asset.assetId,
      assetName: asset.name,
      category: asset.category,
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      departmentId: payload.departmentId,
      departmentName: dept?.name,
      allocatedQuantity: requestedQty,
      building: payload.building,
      floor: payload.floor,
      room: payload.room,
      labId: payload.labId,
      classroomId: payload.classroomId,
      officeName: payload.officeName,
      assignedPersonId: payload.assignedPersonId,
      assignedPersonName,
      allocatedAt: new Date().toISOString(),
      allocatedBy: actor.name,
      effectiveFrom: payload.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: payload.effectiveTo || undefined,
      status: 'ACTIVE',
      remarks: payload.remarks
    };

    db.addEntity('assetDepartmentAllocations', allocation, `Allocated asset to ${dept?.name}`);

    // Dispatch In-App Notification to Department
    db.addEntity<any>('notifications', {
      id: `notif-asset-${Date.now()}`,
      type: 'INFORMATION',
      title: '📦 New Asset Allocated to Department',
      message: `${requestedQty} unit(s) of "${asset.name}" (${asset.assetId}) have been allocated to ${dept?.name} at location: ${payload.building || 'Department'} ${payload.room || ''}.`,
      module: 'ASSET_MANAGEMENT',
      createdAt: new Date().toISOString(),
      isReadByUsers: []
    }, 'Dispatched asset allocation notification to department');

    // If assigned to a faculty, dispatch personal notification
    if (payload.assignedPersonId && assignedPersonName) {
      db.addEntity<any>('notifications', {
        id: `notif-fac-asset-${Date.now()}`,
        type: 'SUCCESS',
        title: '💻 Institutional Asset Assigned to You',
        message: `Asset "${asset.name}" (${asset.assetId}) has been assigned to you for academic/research usage.`,
        module: 'ASSET_MANAGEMENT',
        createdAt: new Date().toISOString(),
        isReadByUsers: []
      }, 'Dispatched asset assignment notification to faculty');
    }

    // Log History Event
    this.logHistoryEvent({
      assetMasterId: asset.id,
      assetId: asset.assetId,
      actionType: 'ALLOCATED',
      actorName: actor.name,
      actorRole: actor.role,
      previousDepartment: 'Store Inventory',
      newDepartment: dept?.name || 'Department',
      newLocation: `${payload.building || ''} ${payload.room || ''}`.trim() || 'Department Office',
      newPerson: assignedPersonName,
      quantity: requestedQty,
      remarks: payload.remarks || 'Department allocation executed successfully.'
    });

    return {
      success: true,
      allocation,
      message: `Successfully allocated ${requestedQty} unit(s) of "${asset.name}" to ${dept?.name || 'Department'}.`
    };
  }

  public allocateAssetToPerson(
    payload: {
      assetMasterId: string;
      assignedPersonId: string;
      assignedPersonName?: string;
      assignedPersonType?: 'FACULTY' | 'STAFF';
      effectiveFrom?: string;
      remarks?: string;
    },
    actor: User
  ): { success: boolean; message: string } {
    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === payload.assetMasterId || a.assetId === payload.assetMasterId);
    if (!asset) return { success: false, message: 'Asset not found.' };

    if (asset.availableQuantity < 1) {
      asset.availableQuantity = 1;
      asset.totalQuantity = Math.max(asset.totalQuantity, asset.allocatedQuantity + 1);
    }

    return this.allocateAssetToDepartment({
      assetMasterId: asset.id,
      instituteId: asset.instituteId || 'inst-1',
      departmentId: asset.departmentId || 'dept-1',
      allocatedQuantity: 1,
      assignedPersonId: payload.assignedPersonId,
      effectiveFrom: payload.effectiveFrom || new Date().toISOString().split('T')[0],
      remarks: payload.remarks || 'Assigned to university staff/faculty'
    }, actor);
  }

  public getPersonAssets(personId: string) {
    const assets = db.getUniversityAssets();
    return assets.filter(a => a.assignedPersonId === personId);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 4. INTER-DEPARTMENT / PERSON-TO-PERSON ASSET TRANSFER
  // ══════════════════════════════════════════════════════════════════════════════
  public transferAsset(
    payload: TransferAssetPayload,
    actor: User
  ): { success: boolean; transfer?: AssetTransferRecord; message: string } {
    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === payload.assetMasterId || a.assetId === payload.assetMasterId);
    if (!asset) return { success: false, message: 'Asset not found.' };

    const fromDept = db.getDepartments().find(d => d.id === asset.currentDepartmentId);
    const toDept = db.getDepartments().find(d => d.id === payload.toDepartmentId);

    let toPersonName = undefined;
    if (payload.toPersonId) {
      const fac = db.getUsers().find(u => u.id === payload.toPersonId) || db.getFaculty().find(f => f.id === payload.toPersonId);
      if (fac) toPersonName = fac.name;
    }

    const prevDeptId = fromDept?.id || asset.currentDepartmentId;
    const prevInstId = asset.currentInstituteId;
    const prevDeptName = fromDept?.name || 'Store';
    const prevPersonId = asset.assignedPersonId;
    const prevPersonName = asset.assignedPersonName;
    const prevLocation = `${asset.building || ''} ${asset.room || ''}`.trim();

    // Update Asset Master
    asset.currentInstituteId = payload.toInstituteId;
    asset.currentDepartmentId = payload.toDepartmentId;
    asset.building = payload.toLocation || asset.building;
    asset.assignedPersonId = payload.toPersonId || undefined;
    asset.assignedPersonName = toPersonName;
    asset.status = 'ALLOCATED';
    asset.updatedAt = new Date().toISOString();

    db.updateEntity('universityAssets', asset.id, asset, `Transferred asset from ${prevDeptName} to ${toDept?.name}`);

    // Create Transfer Record
    const transferRecord: AssetTransferRecord = {
      id: `trf-${Date.now()}`,
      assetMasterId: asset.id,
      assetId: asset.assetId,
      assetName: asset.name,
      quantity: payload.quantity || 1,
      fromInstituteId: prevInstId,
      fromDepartmentId: prevDeptId,
      fromDepartmentName: prevDeptName,
      fromLocation: prevLocation,
      fromPersonId: prevPersonId,
      fromPersonName: prevPersonName,
      toInstituteId: payload.toInstituteId,
      toDepartmentId: payload.toDepartmentId,
      toDepartmentName: toDept?.name || 'Target Department',
      toLocation: payload.toLocation,
      toPersonId: payload.toPersonId,
      toPersonName,
      transferredBy: actor.name,
      transferDate: new Date().toISOString().split('T')[0],
      reason: payload.reason || 'Inter-department workload transfer',
      status: 'COMPLETED',
      approvedBy: actor.name,
      approvedAt: new Date().toISOString()
    };

    db.addEntity('assetTransferRecords', transferRecord, `Recorded asset transfer to ${toDept?.name}`);

    // Log History Event
    this.logHistoryEvent({
      assetMasterId: asset.id,
      assetId: asset.assetId,
      actionType: 'TRANSFERRED',
      actorName: actor.name,
      actorRole: actor.role,
      previousDepartment: prevDeptName,
      newDepartment: toDept?.name,
      previousPerson: prevPersonName,
      newPerson: toPersonName,
      previousLocation: prevLocation,
      newLocation: payload.toLocation || 'New Dept Office',
      quantity: payload.quantity || 1,
      reason: payload.reason
    });

    return {
      success: true,
      transfer: transferRecord,
      message: `Asset "${asset.name}" successfully transferred from ${prevDeptName} to ${toDept?.name}.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 5. ASSET RETURN TO STORE
  // ══════════════════════════════════════════════════════════════════════════════
  public returnAssetToStore(
    payload: ReturnAssetPayload,
    actor: User
  ): { success: boolean; returnRecord?: AssetReturnRecord; message: string } {
    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === payload.assetMasterId || a.assetId === payload.assetMasterId);
    if (!asset) return { success: false, message: 'Asset not found.' };

    const returnQty = Math.max(1, payload.quantity || 1);
    const fromDept = db.getDepartments().find(d => d.id === payload.fromDepartmentId);

    // Update master asset quantities
    asset.allocatedQuantity = Math.max(0, asset.allocatedQuantity - returnQty);
    asset.availableQuantity = Math.min(asset.totalQuantity, asset.availableQuantity + returnQty);
    asset.condition = payload.condition || asset.condition;
    asset.status = asset.allocatedQuantity === 0 ? 'IN_STOCK' : 'IN_USE';
    asset.currentDepartmentId = undefined;
    asset.assignedPersonId = undefined;
    asset.assignedPersonName = undefined;
    asset.building = 'Central Store';
    asset.room = 'Main Storage';
    asset.updatedAt = new Date().toISOString();

    db.updateEntity('universityAssets', asset.id, asset, `Returned ${returnQty} units of ${asset.name} to store`);

    const returnRecord: AssetReturnRecord = {
      id: `ret-${Date.now()}`,
      assetMasterId: asset.id,
      assetId: asset.assetId,
      assetName: asset.name,
      quantity: returnQty,
      fromDepartmentId: payload.fromDepartmentId,
      fromDepartmentName: fromDept?.name || 'Department',
      returnedBy: actor.name,
      receivedBy: actor.name,
      returnDate: new Date().toISOString().split('T')[0],
      condition: payload.condition,
      remarks: payload.remarks
    };

    db.addEntity('assetReturnRecords', returnRecord, `Recorded asset return from ${fromDept?.name}`);

    // Log History Event
    this.logHistoryEvent({
      assetMasterId: asset.id,
      assetId: asset.assetId,
      actionType: 'RETURNED',
      actorName: actor.name,
      actorRole: actor.role,
      previousDepartment: fromDept?.name,
      newDepartment: 'University Store',
      newStatus: asset.status,
      quantity: returnQty,
      remarks: payload.remarks || `Returned to central store in ${payload.condition} condition.`
    });

    return {
      success: true,
      returnRecord,
      message: `Successfully returned ${returnQty} unit(s) of "${asset.name}" to University Central Store.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 6. MAINTENANCE & REPAIRS
  // ══════════════════════════════════════════════════════════════════════════════
  public logMaintenance(
    payload: MaintenancePayload,
    actor: User
  ): { success: boolean; maintenance?: AssetMaintenanceRecord; message: string } {
    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === payload.assetMasterId || a.assetId === payload.assetMasterId);
    if (!asset) return { success: false, message: 'Asset not found.' };

    asset.status = 'UNDER_MAINTENANCE';
    asset.updatedAt = new Date().toISOString();
    db.updateEntity('universityAssets', asset.id, asset, `Marked asset ${asset.name} under maintenance`);

    const maintenance: AssetMaintenanceRecord = {
      id: `maint-${Date.now()}`,
      assetMasterId: asset.id,
      assetId: asset.assetId,
      assetName: asset.name,
      issueDescription: payload.issueDescription,
      serviceType: payload.serviceType,
      vendor: payload.vendor || 'Authorized Service Partner',
      cost: Number(payload.cost) || 0,
      maintenanceDate: payload.maintenanceDate || new Date().toISOString().split('T')[0],
      nextServiceDate: payload.nextServiceDate,
      isUnderWarranty: Boolean(payload.isUnderWarranty),
      status: 'SCHEDULED',
      remarks: payload.remarks,
      recordedBy: actor.name
    };

    db.addEntity('assetMaintenanceRecords', maintenance, `Logged maintenance for ${asset.name}`);

    this.logHistoryEvent({
      assetMasterId: asset.id,
      assetId: asset.assetId,
      actionType: 'MAINTENANCE_LOGGED',
      actorName: actor.name,
      actorRole: actor.role,
      newStatus: 'UNDER_MAINTENANCE',
      remarks: `Issue: ${payload.issueDescription} (${payload.serviceType}). Vendor: ${payload.vendor || 'N/A'}, Cost: ₹${payload.cost}`
    });

    return {
      success: true,
      maintenance,
      message: `Maintenance service ticket logged for "${asset.name}".`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 7. ASSET ALLOCATION REQUESTS (DEPARTMENT -> UNIVERSITY ADMIN)
  // ══════════════════════════════════════════════════════════════════════════════
  public createAllocationRequest(
    payload: {
      departmentId: string;
      instituteId: string;
      category: AssetCategory;
      subCategory: string;
      requestedQuantity: number;
      specifications?: string;
      justification: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      targetLocation?: string;
    },
    actor: User
  ): { success: boolean; request?: AssetAllocationRequest; message: string } {
    const dept = db.getDepartments().find(d => d.id === payload.departmentId);
    const inst = db.getInstitutes().find(i => i.id === payload.instituteId);
    const requestNo = `REQ-AST-2026-${(db.getAssetAllocationRequests().length + 1).toString().padStart(4, '0')}`;

    const newReq: AssetAllocationRequest = {
      id: `req-ast-${Date.now()}`,
      requestNo,
      departmentId: payload.departmentId,
      departmentName: dept?.name || 'Department',
      instituteId: payload.instituteId,
      instituteName: inst?.name,
      category: payload.category,
      subCategory: payload.subCategory,
      requestedQuantity: Math.max(1, payload.requestedQuantity || 1),
      specifications: payload.specifications,
      justification: payload.justification,
      priority: payload.priority || 'MEDIUM',
      targetLocation: payload.targetLocation,
      status: 'SUBMITTED',
      requestedBy: actor.name,
      requestedAt: new Date().toISOString()
    };

    db.addEntity('assetAllocationRequests', newReq, `Submitted asset allocation request ${requestNo}`);

    return {
      success: true,
      request: newReq,
      message: `Asset request ${requestNo} submitted to Central Administration successfully.`
    };
  }

  public approveAndAllocateRequest(
    requestId: string,
    allocatedAssetMasterId: string,
    allocatedQuantity: number,
    actor: User,
    reviewRemarks?: string
  ): { success: boolean; message: string } {
    const requests = db.getAssetAllocationRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    const assets = db.getUniversityAssets();
    const asset = assets.find(a => a.id === allocatedAssetMasterId);
    if (!asset) return { success: false, message: 'Selected asset not found in store.' };

    if (asset.availableQuantity < allocatedQuantity) {
      return { success: false, message: `Insufficient stock in store. Available: ${asset.availableQuantity}.` };
    }

    // Execute allocation
    const allocRes = this.allocateAssetToDepartment({
      assetMasterId: asset.id,
      instituteId: req.instituteId,
      departmentId: req.departmentId,
      allocatedQuantity,
      building: req.targetLocation || 'Department Building',
      effectiveFrom: new Date().toISOString().split('T')[0],
      remarks: `Allocated against request ${req.requestNo}`
    }, actor);

    if (!allocRes.success) return allocRes;

    req.status = 'ALLOCATED';
    req.reviewedBy = actor.name;
    req.reviewedAt = new Date().toISOString();
    req.reviewRemarks = reviewRemarks || 'Approved and allocated from central inventory.';
    req.allocatedAssetMasterIds = [asset.id];
    req.allocatedQuantity = allocatedQuantity;

    db.updateEntity('assetAllocationRequests', req.id, req, `Approved and allocated request ${req.requestNo}`);

    return {
      success: true,
      message: `Request ${req.requestNo} approved. ${allocatedQuantity} unit(s) of "${asset.name}" allocated to ${req.departmentName}.`
    };
  }

  public updateAllocationRequestStatus(
    requestId: string,
    status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'ALLOCATED',
    reviewRemarks: string,
    actor: User
  ): { success: boolean; message: string } {
    const requests = db.getAssetAllocationRequests();
    const req = requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Request not found.' };

    req.status = status;
    req.reviewedBy = actor.name;
    req.reviewedAt = new Date().toISOString();
    req.reviewRemarks = reviewRemarks;

    db.updateEntity('assetAllocationRequests', req.id, req, `Updated status of request ${req.requestNo} to ${status}`);

    return {
      success: true,
      message: `Requisition ${req.requestNo} updated to ${status}.`
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 8. BULK EXCEL IMPORT ENGINE (TRANSACTION SAFE)
  // ══════════════════════════════════════════════════════════════════════════════
  public processBulkAssetImport(
    rows: any[],
    actor: User
  ): BulkImportResult {
    const existingAssets = db.getUniversityAssets();
    const existingSerials = new Set<string>(
      existingAssets.filter(a => a.serialNumber).map(a => a.serialNumber!.toLowerCase())
    );

    const errors: { row: number; assetName: string; serialNumber?: string; error: string }[] = [];
    const validAssets: UniversityAsset[] = [];

    const seenSerialsInBatch = new Set<string>();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Accounting for 1-based index & header row
      const name = String(row['Asset Name'] || row['assetName'] || row['Name'] || '').trim();
      const category = (String(row['Category'] || row['category'] || 'IT_ELECTRONICS').toUpperCase()) as AssetCategory;
      const subCategory = String(row['Sub Category'] || row['subCategory'] || 'General').trim();
      const serialNumber = String(row['Serial Number'] || row['serialNumber'] || row['Serial'] || '').trim();
      const brand = String(row['Brand'] || row['brand'] || 'Standard').trim();
      const model = String(row['Model'] || row['model'] || 'Standard').trim();
      const cost = Number(row['Purchase Cost'] || row['Cost'] || row['purchaseCost'] || 0);
      const qty = Math.max(1, Number(row['Quantity'] || row['quantity'] || 1));
      const purchaseDate = String(row['Purchase Date'] || row['purchaseDate'] || new Date().toISOString().split('T')[0]).trim();
      const isSerialized = Boolean(row['Is Serialized'] === true || row['isSerialized'] === 'true' || row['isSerialized'] === true || Boolean(serialNumber && serialNumber !== 'N/A'));

      if (!name) {
        errors.push({ row: rowNum, assetName: 'Missing Name', error: 'Asset Name is mandatory.' });
        return;
      }

      if (serialNumber && serialNumber !== 'N/A' && serialNumber !== 'Not Applicable') {
        const lowerSerial = serialNumber.toLowerCase();
        if (existingSerials.has(lowerSerial)) {
          errors.push({ row: rowNum, assetName: name, serialNumber, error: `Duplicate Serial Number: "${serialNumber}" already exists in database.` });
          return;
        }
        if (seenSerialsInBatch.has(lowerSerial)) {
          errors.push({ row: rowNum, assetName: name, serialNumber, error: `Duplicate Serial Number within Excel batch: "${serialNumber}".` });
          return;
        }
        seenSerialsInBatch.add(lowerSerial);
      }

      const year = purchaseDate.slice(0, 4) || '2026';
      const assetId = this.generateAssetId(category, year);

      const newAsset: UniversityAsset = {
        id: `ast-bulk-${Date.now()}-${idx + 1}`,
        assetId,
        name,
        category: category || 'IT_ELECTRONICS',
        subCategory,
        brand,
        model,
        serialNumber: (serialNumber && serialNumber !== 'N/A') ? serialNumber : undefined,
        assetTag: assetId,
        isSerialized,
        totalQuantity: isSerialized ? 1 : qty,
        availableQuantity: isSerialized ? 1 : qty,
        allocatedQuantity: 0,
        purchaseDate,
        purchaseCost: cost,
        vendor: String(row['Vendor'] || 'Bulk University Procurement').trim(),
        invoiceNumber: String(row['Invoice Number'] || `INV-BULK-${Date.now().toString().slice(-4)}`).trim(),
        fundingSource: 'University Capital Budget',
        warrantyStart: row['Warranty Start'] ? String(row['Warranty Start']).trim() : undefined,
        warrantyEnd: row['Warranty End'] ? String(row['Warranty End']).trim() : undefined,
        warrantyProvider: row['Warranty Provider'] ? String(row['Warranty Provider']).trim() : undefined,
        condition: 'NEW',
        status: 'IN_STOCK',
        building: 'Central Store',
        room: 'Main Storage',
        assignedPersonType: 'STORE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      validAssets.push(newAsset);
    });

    // If no errors, commit the batch atomically
    if (errors.length === 0 && validAssets.length > 0) {
      validAssets.forEach(a => {
        db.addEntity('universityAssets', a, `Bulk imported asset ${a.name} (${a.assetId})`);
        this.logHistoryEvent({
          assetMasterId: a.id,
          assetId: a.assetId,
          actionType: 'BULK_IMPORTED',
          actorName: actor.name,
          actorRole: actor.role,
          newDepartment: 'Central Store',
          newStatus: 'IN_STOCK',
          quantity: a.totalQuantity,
          remarks: 'Imported via University Excel Bulk Ingestion'
        });
      });
    }

    return {
      totalRows: rows.length,
      successCount: errors.length === 0 ? validAssets.length : 0,
      failureCount: errors.length,
      importedAssets: errors.length === 0 ? validAssets : [],
      errors
    };
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 9. HISTORY & AUDIT LOGGING
  // ══════════════════════════════════════════════════════════════════════════════
  public logHistoryEvent(event: {
    assetMasterId: string;
    assetId: string;
    actionType: AssetHistoryEvent['actionType'];
    actorName: string;
    actorRole: string;
    previousDepartment?: string;
    newDepartment?: string;
    previousLocation?: string;
    newLocation?: string;
    previousPerson?: string;
    newPerson?: string;
    previousStatus?: string;
    newStatus?: string;
    quantity?: number;
    reason?: string;
    remarks?: string;
  }) {
    const historyEvent: AssetHistoryEvent = {
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      assetMasterId: event.assetMasterId,
      assetId: event.assetId,
      actionType: event.actionType,
      actorName: event.actorName,
      actorRole: event.actorRole,
      timestamp: new Date().toISOString(),
      previousDepartment: event.previousDepartment,
      newDepartment: event.newDepartment,
      previousLocation: event.previousLocation,
      newLocation: event.newLocation,
      previousPerson: event.previousPerson,
      newPerson: event.newPerson,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      quantity: event.quantity,
      reason: event.reason,
      remarks: event.remarks
    };

    db.addEntity('assetHistoryEvents', historyEvent, `Recorded asset history event for ${event.assetId}`);
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 10. REAL-TIME QUERIES & AUTO-SYNC GETTERS
  // ══════════════════════════════════════════════════════════════════════════════
  public getDepartmentAssets(departmentId: string): {
    assets: UniversityAsset[];
    allocations: AssetDepartmentAllocation[];
    totalCount: number;
    totalValue: number;
    categoryCounts: Record<string, number>;
  } {
    const allAllocations = db.getAssetDepartmentAllocations().filter(
      a => a.departmentId === departmentId && a.status === 'ACTIVE'
    );
    const assetIds = new Set(allAllocations.map(a => a.assetMasterId));
    const allAssets = db.getUniversityAssets().filter(
      a => assetIds.has(a.id) || a.currentDepartmentId === departmentId
    );

    const totalValue = allAssets.reduce((acc, a) => acc + (a.purchaseCost || 0), 0);
    const categoryCounts: Record<string, number> = {};

    allAssets.forEach(a => {
      categoryCounts[a.category] = (categoryCounts[a.category] || 0) + (a.isSerialized ? 1 : a.allocatedQuantity || 1);
    });

    return {
      assets: allAssets,
      allocations: allAllocations,
      totalCount: allAssets.length,
      totalValue,
      categoryCounts
    };
  }

  public getFacultyAssignedAssets(facultyId: string): UniversityAsset[] {
    return db.getUniversityAssets().filter(
      a => a.assignedPersonId === facultyId && a.status !== 'RETURNED' && a.status !== 'DISPOSED'
    );
  }

  public getAssetDashboardMetrics() {
    const assets = db.getUniversityAssets();
    const allocations = db.getAssetDepartmentAllocations();
    const requests = db.getAssetAllocationRequests();
    const maintenance = db.getAssetMaintenanceRecords();
    const transfers = db.getAssetTransferRecords();

    const totalAssets = assets.length;
    const totalValue = assets.reduce((acc, a) => acc + ((a.purchaseCost || 0) * (a.totalQuantity || 1)), 0);
    const inStock = assets.filter(a => a.status === 'IN_STOCK' || a.status === 'AVAILABLE' || a.availableQuantity > 0).length;
    const allocated = assets.filter(a => a.status === 'ALLOCATED' || a.status === 'IN_USE' || a.allocatedQuantity > 0).length;
    const underMaintenance = assets.filter(a => a.status === 'UNDER_MAINTENANCE' || a.status === 'REPAIR').length;
    const damagedOrMissing = assets.filter(a => a.status === 'DAMAGED' || a.status === 'MISSING' || a.status === 'LOST').length;
    const disposed = assets.filter(a => a.status === 'DISPOSED').length;
    const pendingRequests = requests.filter(r => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;

    // Category breakdown
    const categoryBreakdown: Record<string, { count: number; value: number }> = {};
    assets.forEach(a => {
      if (!categoryBreakdown[a.category]) {
        categoryBreakdown[a.category] = { count: 0, value: 0 };
      }
      categoryBreakdown[a.category].count += (a.totalQuantity || 1);
      categoryBreakdown[a.category].value += ((a.purchaseCost || 0) * (a.totalQuantity || 1));
    });

    // Department breakdown
    const departmentBreakdown: Record<string, { name: string; count: number; value: number }> = {};
    allocations.filter(al => al.status === 'ACTIVE').forEach(al => {
      const deptId = al.departmentId;
      if (!departmentBreakdown[deptId]) {
        departmentBreakdown[deptId] = { name: al.departmentName || deptId, count: 0, value: 0 };
      }
      departmentBreakdown[deptId].count += al.allocatedQuantity;
      const matched = assets.find(a => a.id === al.assetMasterId);
      departmentBreakdown[deptId].value += ((matched?.purchaseCost || 0) * al.allocatedQuantity);
    });

    return {
      totalAssets,
      totalValue,
      inStock,
      allocated,
      underMaintenance,
      damagedOrMissing,
      disposed,
      pendingRequests,
      categoryBreakdown,
      departmentBreakdown,
      recentTransfers: transfers.slice(0, 5),
      recentMaintenance: maintenance.slice(0, 5)
    };
  }

  public getExpiringWarranties(daysAhead = 60): UniversityAsset[] {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + daysAhead);

    return db.getUniversityAssets().filter(a => {
      if (!a.warrantyEnd) return false;
      const wDate = new Date(a.warrantyEnd);
      return wDate >= today && wDate <= threshold;
    });
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // 11. EXCEL EXPORT GENERATOR
  // ══════════════════════════════════════════════════════════════════════════════
  public exportAssetRegisterExcel(assets: UniversityAsset[]) {
    const rows = assets.map((a, idx) => ({
      'Sr.': idx + 1,
      'Asset ID': a.assetId,
      'Asset Name': a.name,
      'Category': a.category,
      'Sub Category': a.subCategory,
      'Brand': a.brand || '—',
      'Model': a.model || '—',
      'Serial Number': a.serialNumber || 'N/A',
      'Quantity': a.totalQuantity,
      'Purchase Date': a.purchaseDate,
      'Purchase Cost (₹)': a.purchaseCost,
      'Vendor': a.vendor || '—',
      'Condition': a.condition,
      'Status': a.status,
      'Department': a.currentDepartmentId ? db.getDepartments().find(d => d.id === a.currentDepartmentId)?.name || a.currentDepartmentId : 'Store',
      'Location': `${a.building || ''} ${a.room || ''}`.trim() || 'Store',
      'Assigned To': a.assignedPersonName || 'Department'
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asset Register');
    XLSX.writeFile(workbook, `SSIU_University_Asset_Register_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
}

export const assetManagementService = AssetManagementService.getInstance();
