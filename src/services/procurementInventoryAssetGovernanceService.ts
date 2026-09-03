import { db } from './db';
import { UserAuthorizationContext } from '../types';

export interface ItemMasterRecord {
  id: string;
  itemCode: string;
  name: string;
  categoryId: string;
  unitOfMeasure: 'PCS' | 'BOX' | 'SET' | 'KG' | 'PACK';
  itemType: 'CONSUMABLE' | 'NON_CONSUMABLE' | 'ASSET' | 'SERVICE';
  trackAsset: boolean;
  reorderLevel: number;
}

export interface InventoryStockRecord {
  id: string;
  storeId: string;
  storeName: string;
  itemId: string;
  currentStock: number;
  availableStock: number;
  reservedStock: number;
}

export interface AssetRegisterRecord {
  id: string;
  assetNumber: string;
  itemId: string;
  itemName: string;
  serialNumber: string;
  purchaseOrderId: string;
  purchaseCost: number;
  currentDepartmentId: string;
  currentLocation: string;
  currentCustodianEmployeeId?: string;
  status: 'IN_STOCK' | 'ALLOCATED' | 'UNDER_MAINTENANCE' | 'DISPOSED';
  warrantyExpiryDate?: string;
  amcExpiryDate?: string;
}

export interface VendorQuotationRecord {
  vendorId: string;
  vendorName: string;
  quotedAmount: number;
  warrantyMonths: number;
  deliveryDays: number;
  selected: boolean;
}

export interface ComparativeStatementRecord {
  id: string;
  rfqNumber: string;
  itemId: string;
  quotations: VendorQuotationRecord[];
  selectedVendorId: string;
  justification: string;
}

class ProcurementInventoryAssetGovernanceService {
  private static instance: ProcurementInventoryAssetGovernanceService;

  private items: ItemMasterRecord[] = [
    {
      id: 'itm-01',
      itemCode: 'IT-LAPTOP-DEV',
      name: 'Dell Latitude 5440 i7 / 16GB / 512GB SSD',
      categoryId: 'cat-it-equip',
      unitOfMeasure: 'PCS',
      itemType: 'ASSET',
      trackAsset: true,
      reorderLevel: 5
    },
    {
      id: 'itm-02',
      itemCode: 'STAT-A4-PAPER',
      name: 'A4 Copier Paper 75 GSM (Pack of 500)',
      categoryId: 'cat-stationery',
      unitOfMeasure: 'PACK',
      itemType: 'CONSUMABLE',
      trackAsset: false,
      reorderLevel: 20
    }
  ];

  private stock: InventoryStockRecord[] = [
    {
      id: 'stk-01',
      storeId: 'store-central',
      storeName: 'Central University Store',
      itemId: 'itm-02',
      currentStock: 150,
      availableStock: 150,
      reservedStock: 0
    }
  ];

  private assets: AssetRegisterRecord[] = [
    {
      id: 'ast-01',
      assetNumber: 'ASSET-2026-000412',
      itemId: 'itm-01',
      itemName: 'Dell Latitude 5440 i7',
      serialNumber: 'SN-DELL-883192',
      purchaseOrderId: 'po-2026-001',
      purchaseCost: 75000,
      currentDepartmentId: 'dept-1',
      currentLocation: 'CSE Dept - Faculty Cabin 204',
      currentCustodianEmployeeId: 'emp-fac-01',
      status: 'ALLOCATED',
      warrantyExpiryDate: '2028-08-01',
      amcExpiryDate: '2029-08-01'
    }
  ];

  private comparativeStatements: ComparativeStatementRecord[] = [
    {
      id: 'cs-2026-01',
      rfqNumber: 'RFQ-SSIU-2026-009',
      itemId: 'itm-01',
      quotations: [
        { vendorId: 'ven-01', vendorName: 'Dell Technologies India', quotedAmount: 75000, warrantyMonths: 36, deliveryDays: 10, selected: true },
        { vendorId: 'ven-02', vendorName: 'HP Commercial Sales', quotedAmount: 79000, warrantyMonths: 36, deliveryDays: 14, selected: false },
        { vendorId: 'ven-03', vendorName: 'Lenovo Enterprise Solutions', quotedAmount: 77500, warrantyMonths: 24, deliveryDays: 7, selected: false }
      ],
      selectedVendorId: 'ven-01',
      justification: 'Lowest compliant bid with 36 months on-site warranty'
    }
  ];

  private constructor() {}

  public static getInstance(): ProcurementInventoryAssetGovernanceService {
    if (!ProcurementInventoryAssetGovernanceService.instance) {
      ProcurementInventoryAssetGovernanceService.instance = new ProcurementInventoryAssetGovernanceService();
    }
    return ProcurementInventoryAssetGovernanceService.instance;
  }

  // ─── COMPARATIVE STATEMENT & VENDOR SELECTION ─────────────────────────

  public getComparativeStatement(csId: string): ComparativeStatementRecord | undefined {
    return this.comparativeStatements.find(c => c.id === csId);
  }

  // ─── STOCK TRANSACTION ENGINE ─────────────────────────────────────────

  public issueStock(params: {
    storeId: string;
    itemId: string;
    quantity: number;
    departmentId: string;
  }): InventoryStockRecord {
    const stockItem = this.stock.find(s => s.storeId === params.storeId && s.itemId === params.itemId);
    if (!stockItem) throw new Error(`Item ${params.itemId} not found in store ${params.storeId}`);

    if (stockItem.availableStock < params.quantity) {
      throw new Error(`Insufficient stock: requested ${params.quantity}, available ${stockItem.availableStock}`);
    }

    stockItem.currentStock -= params.quantity;
    stockItem.availableStock = stockItem.currentStock - stockItem.reservedStock;
    return stockItem;
  }

  // ─── ASSET ALLOCATION & MOVEMENT ENGINE ────────────────────────────────

  public reallocateAsset(params: {
    assetNumber: string;
    newDepartmentId: string;
    newLocation: string;
    newCustodianEmployeeId: string;
  }): AssetRegisterRecord {
    const asset = this.assets.find(a => a.assetNumber === params.assetNumber);
    if (!asset) throw new Error(`Asset ${params.assetNumber} not found`);

    if (asset.status === 'DISPOSED') {
      throw new Error(`Cannot reallocate disposed asset ${params.assetNumber}`);
    }

    asset.currentDepartmentId = params.newDepartmentId;
    asset.currentLocation = params.newLocation;
    asset.currentCustodianEmployeeId = params.newCustodianEmployeeId;
    asset.status = 'ALLOCATED';
    return asset;
  }

  public getAssetSummary(departmentId?: string): {
    totalAssets: number;
    allocatedAssets: number;
    underMaintenance: number;
    assets: AssetRegisterRecord[];
  } {
    const filtered = departmentId ? this.assets.filter(a => a.currentDepartmentId === departmentId) : this.assets;
    return {
      totalAssets: filtered.length,
      allocatedAssets: filtered.filter(a => a.status === 'ALLOCATED').length,
      underMaintenance: filtered.filter(a => a.status === 'UNDER_MAINTENANCE').length,
      assets: filtered
    };
  }
}

export const procurementInventoryAssetGovernanceService = ProcurementInventoryAssetGovernanceService.getInstance();
